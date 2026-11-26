<?php

namespace Database\Seeders;

use App\Models\AsetUserAccess;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AsetRolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            // Bootstrap hanya sekali; tidak mereset role atau akun yang telah diatur.
            DB::statement('LOCK TABLE aset_user_accesses IN SHARE ROW EXCLUSIVE MODE');

            if (AsetUserAccess::query()->exists()) {
                if (! AsetUserAccess::query()->where('role', 'master')->where('is_active', true)->whereHas('user')->exists()) {
                    throw new RuntimeException('Tidak ada Master aktif. Hubungi administrator; seeder tidak akan menimpa akses existing.');
                }

                return;
            }

            $email = strtolower(trim((string) config('aset_admin.email')));
            $users = User::query()->whereRaw('LOWER(email) = ?', [$email])->get();

            if (! filter_var($email, FILTER_VALIDATE_EMAIL) || $users->count() !== 1 || $users->first()->email !== $email) {
                throw new RuntimeException('ASET_ADMIN_EMAIL harus menunjuk tepat satu akun legacy yang sudah valid.');
            }

            AsetUserAccess::query()->create([
                'user_id' => $users->first()->id,
                'role' => 'master',
                'is_active' => true,
                'modules' => [],
            ]);
        });
    }
}
