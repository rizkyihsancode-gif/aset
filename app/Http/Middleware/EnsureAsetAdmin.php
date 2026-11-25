<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
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
        abort_unless(
            self::allows($request->user('web')?->email),
            403,
            'Akun ini tidak diizinkan mengakses Sistem Aset.'
        );

        return $next($request);
    }
}
