<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Penambahan nullable aman untuk baris inventaris yang sudah ada.
        // Tidak mengubah isi dok (path PDF), polisi, BPKB, maupun relasi Nilai Aset.
        if (Schema::hasTable('mesins') && !Schema::hasColumn('mesins', 'nomor_dokumen')) {
            Schema::table('mesins', function (Blueprint $table): void {
                $table->string('nomor_dokumen', 255)->nullable();
            });
        }
    }

    public function down(): void
    {
        // Jalankan rollback hanya bila benar-benar dikehendaki: dapat menghapus data nomor dokumen.
        if (Schema::hasTable('mesins') && Schema::hasColumn('mesins', 'nomor_dokumen')) {
            Schema::table('mesins', function (Blueprint $table): void {
                $table->dropColumn('nomor_dokumen');
            });
        }
    }
};
