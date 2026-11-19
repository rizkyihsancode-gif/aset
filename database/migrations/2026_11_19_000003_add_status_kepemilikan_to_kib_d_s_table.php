<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('kib_d_s')) {
            throw new \RuntimeException('Tabel kib_d_s belum ada; jangan tandai migration sebagai selesai.');
        }
        if (!Schema::hasColumn('kib_d_s', 'status_kepemilikan')) {
            Schema::table('kib_d_s', function (Blueprint $table): void {
                $table->string('status_kepemilikan', 20)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        // Tidak otomatis menghapus kolom/status historis saat rollback.
        // Prosedur perubahan skema balik memerlukan audit manual dan backup.
    }
};
