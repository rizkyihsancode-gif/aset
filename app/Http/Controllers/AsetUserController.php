<?php

namespace App\Http\Controllers;

use App\Models\AsetUserAccess;
use App\Models\User;
use App\Services\AsetAccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AsetUserController extends Controller
{
    public function __construct(private readonly AsetAccessService $access) {}

    private function requireMaster(Request $request): void
    {
        $profile = $this->access->profile($request->user('web'));
        abort_unless($this->access->enabled() && $profile['active'] && $profile['role'] === 'master', 403);
    }

    public function index(Request $request): View
    {
        $this->requireMaster($request);

        $users = User::query()->orderBy('name')->orderBy('id')->get(['id', 'name', 'email']);
        $records = AsetUserAccess::query()->whereIn('user_id', $users->modelKeys())->get()->keyBy('user_id');

        $rows = $users->map(function (User $user) use ($records): array {
            $profile = $this->access->fromRecord($records->get($user->id));

            return [
                'id' => (int) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $profile['role'],
                'role_label' => $this->access->label($profile),
                'active' => $profile['active'],
                'modules' => $profile['modules'],
            ];
        });

        return view('master.data_user', [
            'rows' => $rows,
            'modules' => config('aset_access.modules'),
            'counts' => [
                'total' => $rows->count(),
                'master' => $rows->where('role', 'master')->where('active', true)->count(),
                'user' => $rows->where('role', 'user')->where('active', true)->count(),
                'viewer' => $rows->where('role', 'viewer')->where('active', true)->count(),
            ],
        ]);
    }

    private function validatedAccess(Request $request): array
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['master', 'user', 'viewer'])],
            'is_active' => ['required', 'boolean'],
            'modules' => ['sometimes', 'array', 'max:7'],
            'modules.*' => ['required', 'string', 'distinct', Rule::in(array_keys(config('aset_access.modules')))],
        ]);

        $modules = $data['role'] === 'user' ? array_values($data['modules'] ?? []) : [];
        if ($data['role'] === 'user' && $modules === []) {
            throw ValidationException::withMessages(['modules' => 'Role User wajib memiliki minimal satu KIB atau KIR.']);
        }

        return ['role' => $data['role'], 'is_active' => $request->boolean('is_active'), 'modules' => $modules];
    }

    private function lockAndAuthorize(Request $request): void
    {
        // PostgreSQL: serialize seluruh perubahan akses agar Master terakhir aman.
        DB::statement('LOCK TABLE aset_user_accesses IN SHARE ROW EXCLUSIVE MODE');
        $this->requireMaster($request);
    }

    public function update(Request $request, int $user): RedirectResponse
    {
        $this->requireMaster($request);
        $data = $this->validatedAccess($request);

        $before = DB::transaction(function () use ($request, $user, $data): array {
            $this->lockAndAuthorize($request);
            User::query()->whereKey($user)->lockForUpdate()->firstOrFail(['id']);
            $record = AsetUserAccess::query()->find($user);
            $old = $this->access->fromRecord($record);

            // Tidak boleh mengunci sesi sendiri atau menghapus Master aktif terakhir.
            if (
                $user === (int) $request->user('web')->getAuthIdentifier()
                && ($data['role'] !== 'master' || ! $data['is_active'])
            ) {
                throw ValidationException::withMessages(['role' => 'Master tidak boleh menurunkan atau menonaktifkan akun sendiri.']);
            }

            if (
                $old['role'] === 'master' && $old['active']
                && ($data['role'] !== 'master' || ! $data['is_active'])
                && ! AsetUserAccess::query()->where('user_id', '!=', $user)->where('role', 'master')
                    ->where('is_active', true)->whereHas('user')->exists()
            ) {
                throw ValidationException::withMessages(['role' => 'Minimal satu Master aktif harus dipertahankan.']);
            }

            AsetUserAccess::query()->updateOrCreate(['user_id' => $user], $data);

            return $old;
        });

        Log::info('aset.access.updated', [
            'actor_id' => $request->user('web')->getAuthIdentifier(),
            'user_id' => $user,
            'before' => $before,
            'after' => $data,
        ]);

        return redirect()->route('master.data_user')->with('success', 'Hak akses pengguna berhasil disimpan.');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireMaster($request);
        $data = $this->validatedAccess($request);
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $identity = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:14', 'confirmed', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! is_string($value) || strlen($value) > 72 || trim($value) === '') {
                    $fail('Password harus maksimal 72 byte dan tidak boleh kosong.');
                }
            }],
            'confirm_new_identity' => ['required', 'accepted'],
        ]);

        $user = DB::transaction(function () use ($request, $identity, $data): User {
            $this->lockAndAuthorize($request);

            if (User::query()->whereRaw('LOWER(email) = ?', [$identity['email']])->exists()) {
                throw ValidationException::withMessages(['email' => 'Email sudah tersedia. Gunakan Edit akses pada akun yang ada.']);
            }

            $user = User::query()->create([
                'name' => $identity['name'],
                'email' => $identity['email'],
                'password' => Hash::make($identity['password']),
            ]);

            AsetUserAccess::query()->create(['user_id' => $user->id] + $data);

            return $user;
        });

        Log::info('aset.access.created', [
            'actor_id' => $request->user('web')->getAuthIdentifier(),
            'user_id' => $user->id,
            'access' => $data,
        ]);

        return redirect()->route('master.data_user')->with('success', 'Akun baru dan hak akses berhasil disimpan.');
    }
}
