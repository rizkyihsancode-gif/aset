<?php

namespace Tests\Feature;

use App\Http\Controllers\DashboardController;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AsetAdminLoginTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Database khusus pengujian, bukan koneksi produksi.
        config([
            'database.default' => 'aset_login_test',
            'database.connections.aset_login_test' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
            ],
            'auth.defaults.guard' => 'web',
            'auth.providers.users.model' => User::class,
            'session.driver' => 'array',
            'cache.default' => 'array',
            'aset_admin.email' => 'admin@example.test',
        ]);
        DB::purge('aset_login_test');
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
        // Uji akses melalui route asli, tanpa menjalankan query inventaris.
        $this->mock(DashboardController::class, function ($mock): void {
            $mock->shouldReceive('index')->andReturn(response('Dashboard test'));
        });
    }

    private function account(string $email = 'admin@example.test'): User
    {
        return User::query()->create([
            'name' => 'Test',
            'email' => $email,
            'password' => Hash::make('test-password-only'),
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
        $this->postJson('/kib/tanah/lokasi/1/tambah-langsung')->assertUnauthorized();
    }

    public function test_admin_login_ignores_stale_intended_url_and_can_logout(): void
    {
        $admin = $this->account();
        $this->withSession(['url.intended' => '/old-dashboard'])
            ->post('/login', ['email' => $admin->email, 'password' => 'test-password-only'])
            ->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($admin, 'web');
        $this->get('/dashboard')->assertOk();
        $this->get('/login')->assertRedirect(route('dashboard'));
        $this->post('/logout')->assertRedirect(route('login'));
        $this->assertGuest('web');
        $this->get('/dashboard')->assertRedirect(route('login'));
    }

    public function test_wrong_password_and_other_account_are_rejected(): void
    {
        $admin = $this->account();
        $other = $this->account('other@example.test');
        $this->from('/login')->post('/login', ['email' => $admin->email, 'password' => 'wrong'])
            ->assertSessionHasErrors('email');
        $this->from('/login')->post('/login', ['email' => $other->email, 'password' => 'test-password-only'])
            ->assertSessionHasErrors('email');
        $this->assertGuest('web');
        $this->actingAs($other, 'web')->get('/dashboard')->assertForbidden();
    }

    public function test_unconfigured_admin_is_denied(): void
    {
        $admin = $this->account();
        config(['aset_admin.email' => null]);
        $this->actingAs($admin, 'web')->get('/dashboard')->assertForbidden();
    }
    public function test_repeated_failed_login_is_rate_limited(): void
    {
        $admin = $this->account();
        for ($i = 0; $i < 5; $i++) {
            $this->from('/login')->post('/login', [
                'email' => $admin->email,
                'password' => 'wrong',
            ])->assertSessionHasErrors('email');
        }
        // Throttle IP pada route membatasi permintaan keenam sebelum FormRequest.
        $this->post('/login', ['email' => $admin->email, 'password' => 'wrong'])
            ->assertStatus(429);
        $this->assertGuest('web');
    }

    public function test_non_admin_session_is_cleared_on_login_page(): void
    {
        $other = $this->account('other@example.test');
        $this->actingAs($other, 'web')->get('/')->assertRedirect(route('login'));
        $this->get('/login')->assertOk();
        $this->assertGuest('web');
    }
}
