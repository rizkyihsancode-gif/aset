
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan status pada Master Data Ruangan.
     *
     * NULL     = Belum Diatur
     * aktif    = Aktif
     * nonaktif = Nonaktif
     *
     * Data lama tetap NULL sampai diatur
     * melalui halaman Master Data.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('ruangans', 'status')) {
            Schema::table('ruangans', function (Blueprint $table) {
                $table->string('status', 8)
                    ->nullable()
                    ->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('ruangans', 'status')) {
            Schema::table('ruangans', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
