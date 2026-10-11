<?php

namespace App\Providers;

use App\Services\KibNotificationService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | K.I.B Notification Service
        |--------------------------------------------------------------------------
        |
        | Satu request memakai satu instance agar query sidebar dan card
        | tidak dijalankan berkali-kali.
        |
        */

        $this->app->scoped(
            KibNotificationService::class,
            function () {
                return new KibNotificationService();
            }
        );
    }


    public function boot(): void
    {
        //
    }
}
