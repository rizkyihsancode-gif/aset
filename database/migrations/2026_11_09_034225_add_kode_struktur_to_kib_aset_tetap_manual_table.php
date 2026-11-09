
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn(
            'kib_aset_tetap_manual',
            'kode_struktur'
        )) {
            Schema::table(
                'kib_aset_tetap_manual',
                function (Blueprint $table) {
                    $table->string(
                        'kode_struktur',
                        100
                    )->nullable();
                }
            );
        }
    }

    public function down(): void
    {
        // Jangan menghapus kolom yang telah
        // dipakai oleh catatan inventaris.

        if (
            DB::table('kib_aset_tetap_manual')
                ->whereNotNull('kode_struktur')
                ->exists()
        ) {
            throw new RuntimeException(
                'Rollback ditolak: kode struktur sudah berisi data.'
            );
        }

        if (Schema::hasColumn(
            'kib_aset_tetap_manual',
            'kode_struktur'
        )) {
            Schema::table(
                'kib_aset_tetap_manual',
                function (Blueprint $table) {
                    $table->dropColumn('kode_struktur');
                }
            );
        }
    }
};
