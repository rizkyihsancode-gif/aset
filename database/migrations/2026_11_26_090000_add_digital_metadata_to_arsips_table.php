<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('arsips') || !Schema::hasTable('indeks')) {
            throw new RuntimeException('Tabel legacy arsips dan indeks wajib tersedia.');
        }
        foreach (['retensi_akhir', 'file_path', 'file_name'] as $column) {
            if (Schema::hasColumn('arsips', $column)) {
                throw new RuntimeException('Kolom arsips.' . $column . ' sudah tersedia. Audit schema sebelum migrasi.');
            }
        }
        Schema::table('arsips', function (Blueprint $table) {
            $table->date('retensi_akhir')->nullable()->index();
            $table->string('file_path', 255)->nullable();
            $table->string('file_name', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('arsips', function (Blueprint $table) {
            $table->dropIndex(['retensi_akhir']);
            $table->dropColumn(['retensi_akhir', 'file_path', 'file_name']);
        });
    }
};
