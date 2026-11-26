<?php

namespace App\Http\Middleware;

use App\Services\AsetAccessService;
use Closure;
use Illuminate\Auth\SessionGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAsetAdmin
{
    public static function email(): string
    {
        return strtolower(trim((string) config('aset_admin.email')));
    }

    public static function allows(?string $email): bool
    {
        $admin = self::email();

        return filter_var($admin, FILTER_VALIDATE_EMAIL) !== false
            && $email === $admin;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $access = app(AsetAccessService::class);
        $profile = $access->profile($request->user('web'));

        if (! $profile['active']) {
            /** @var SessionGuard $guard */
            $guard = Auth::guard('web');

            $guard->logoutCurrentDevice();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        abort_unless(
            $access->allowsRequest($profile, $request),
            403,
            'Akun ini tidak diizinkan mengakses menu Sistem Aset tersebut.'
        );

        $request->attributes->set('aset_access', $profile);

        return $next($request);
    }
}
