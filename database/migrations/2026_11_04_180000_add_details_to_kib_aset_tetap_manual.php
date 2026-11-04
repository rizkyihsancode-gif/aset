
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kib_aset_tetap_manual', function (Blueprint $table) {
            $table->string('kode_inventaris', 255)->nullable();
            $table->string('nomor_register', 255)->nullable();
            $table->string('bahan', 255)->nullable();
            $table->string('asal_perolehan', 255)->nullable();
        });
    }

    public function down(): void
    {
        if (DB::table('kib_aset_tetap_manual')->exists()) {
            throw new RuntimeException(
                'Rollback ditolak: data Aset Tetap Lainnya manual sudah tersimpan.'
            );
        }

        Schema::table('kib_aset_tetap_manual', function (Blueprint $table) {
            $table->dropColumn([
                'kode_inventaris',
                'nomor_register',
                'bahan',
                'asal_perolehan',
            ]);
        });
    }
};
