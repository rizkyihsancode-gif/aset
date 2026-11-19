<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('kib_aset_tetap_manual', 'status_kepemilikan')) {
            Schema::table('kib_aset_tetap_manual', function (Blueprint $table) {
                $table->string('status_kepemilikan', 20)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('kib_aset_tetap_manual', 'status_kepemilikan')) {
            return;
        }

        // Jaga agar status yang sudah diinput petugas tidak hilang tanpa sengaja.
        if (DB::table('kib_aset_tetap_manual')->whereNotNull('status_kepemilikan')->exists()) {
            throw new RuntimeException('Rollback ditolak: masih ada data status kepemilikan.');
        }

        Schema::table('kib_aset_tetap_manual', function (Blueprint $table) {
            $table->dropColumn('status_kepemilikan');
        });
    }
};
