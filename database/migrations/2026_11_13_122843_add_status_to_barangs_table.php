
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan status pada Master Barang.
     *
     * NULL     = Belum Diatur
     * aktif    = Aktif
     * nonaktif = Nonaktif
     *
     * Tidak memberikan default agar data lama
     * tetap kosong sampai diedit pengguna.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('barangs', 'status')) {
            Schema::table('barangs', function (Blueprint $table) {
                $table->string('status', 8)
                    ->nullable()
                    ->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('barangs', 'status')) {
            Schema::table('barangs', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
