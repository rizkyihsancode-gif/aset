<?php

namespace App\Http\Requests\Auth;

use App\Services\AsetAccessService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\SessionGuard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $access = app(AsetAccessService::class);

        /** @var SessionGuard $guard */
        $guard = Auth::guard('web');

        if (! $guard->attemptWhen(
            $this->only('email', 'password'),
            fn(Authenticatable $user): bool => $access->profile($user)['active'],
            false
        )) {
            foreach ($this->loginLimits() as $key => $limit) {
                RateLimiter::hit($key, 60);
            }

            throw ValidationException::withMessages([
                'email' => 'Email atau password tidak sesuai.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        $seconds = 0;

        foreach ($this->loginLimits() as $key => $limit) {
            if (RateLimiter::tooManyAttempts($key, $limit)) {
                $seconds = max($seconds, 1, RateLimiter::availableIn($key));
            }
        }

        if ($seconds === 0) {
            return;
        }

        event(new Lockout($this));

        throw ValidationException::withMessages([
            'email' => "Terlalu banyak percobaan login. Coba lagi dalam {$seconds} detik.",
        ]);
    }

    /**
     * Pertahankan batas email + IP; tambahkan batas agregat kegagalan.
     * Counter agregat tidak dihapus oleh login sukses akun lain.
     *
     * @return array<string, int>
     */
    protected function loginLimits(): array
    {
        $email = Str::lower(trim((string) $this->input('email')));
        $ip = (string) $this->ip();

        return [
            $this->throttleKey() => 5,
            'aset-login-account:' . hash('sha256', $email) => 15,
            'aset-login-ip:' . hash('sha256', $ip) => 20,
        ];
    }

    public function throttleKey(): string
    {
        return 'aset-login:' . Str::transliterate(
            Str::lower((string) $this->input('email')) . '|' . $this->ip()
        );
    }
}
