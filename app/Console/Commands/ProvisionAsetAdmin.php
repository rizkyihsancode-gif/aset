<?php

namespace App\Console\Commands;

use App\Http\Middleware\EnsureAsetAdmin;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ProvisionAsetAdmin extends Command
{
    protected $signature = 'aset:admin {--reset-password : Ganti password akun yang sudah ada secara eksplisit}';

    protected $description = 'Siapkan akun Admin Aset dari ASET_ADMIN_EMAIL tanpa password bawaan';

    public function handle(): int
    {
        $email = EnsureAsetAdmin::email();
        if (! EnsureAsetAdmin::allows($email)) {
            $this->error('ASET_ADMIN_EMAIL belum diisi dengan email yang valid.');
            return self::FAILURE;
        }

        if (
            config('auth.defaults.guard') !== 'web'
            || config('auth.guards.web.provider') !== 'users'
            || config('auth.providers.users.model') !== User::class
        ) {
            $this->error('Konfigurasi guard/provider bukan web/users/App\Models\User. Periksa konfigurasi dahulu.');
            return self::FAILURE;
        }

        // Jangan mengubah akun legacy dengan email yang hanya berbeda kapitalisasi.
        $matches = User::query()->whereRaw('LOWER(email) = ?', [$email])->get(['id', 'email']);
        if ($matches->count() > 1 || ($matches->count() === 1 && $matches->first()->email !== $email)) {
            $this->error('Email bentrok dengan akun existing. Rekonsiliasi dengan administrator database dahulu.');
            return self::FAILURE;
        }
        $existing = $matches->first();
        if ($existing && ! $this->option('reset-password')) {
            $this->info('Akun Admin sudah ada. Password dan data akun tidak diubah.');
            return self::SUCCESS;
        }
        if (! $existing && $this->option('reset-password')) {
            $this->error('Akun belum ada. Jalankan tanpa --reset-password.');
            return self::FAILURE;
        }
        if ($existing && ! $this->confirm('Ganti password akun existing? Ini juga dapat memengaruhi aplikasi lain yang berbagi tabel users.')) {
            return self::FAILURE;
        }

        $password = $this->secret('Password Admin (minimal 14 karakter, maksimal 72 byte)');
        $confirmation = $this->secret('Ulangi password Admin');
        if (
            ! is_string($password) || strlen($password) < 14 || strlen($password) > 72
            || trim($password) === '' || $password !== $confirmation
        ) {
            $this->error('Password tidak memenuhi syarat atau konfirmasi berbeda.');
            return self::FAILURE;
        }

        DB::transaction(function () use ($existing, $email, $password): void {
            if ($existing) {
                $user = User::query()->whereKey($existing->id)->where('email', $email)->lockForUpdate()->firstOrFail();
                $user->password = Hash::make($password);
                $user->setRememberToken(null);
                $user->save();
                return;
            }

            User::query()->create([
                'name' => 'Admin Aset',
                'email' => $email,
                'password' => Hash::make($password),
            ]);
        });

        $this->info('Akun Admin berhasil disiapkan. Silakan uji login melalui browser.');
        return self::SUCCESS;
    }
}
