<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('tanahs', 'status_kepemilikan')) {
            Schema::table('tanahs', function (Blueprint $table) {
                $table->string('status_kepemilikan', 20)->nullable()->index();
            });
        }

        if (!Schema::hasTable('tanah_lampirans')) {
            Schema::create('tanah_lampirans', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tanah_id')->index();
                $table->string('jenis', 10); // pdf / gambar
                $table->string('path', 500);
                $table->string('nama_asli', 255);
                $table->string('mime', 100);
                $table->unsignedBigInteger('ukuran')->nullable();
                $table->timestamps();
                $table->index(['tanah_id', 'jenis']);
            });
        }
    }

    public function down(): void
    {
        // PERHATIAN: rollback menghapus metadata lampiran.
        Schema::dropIfExists('tanah_lampirans');

        if (Schema::hasColumn('tanahs', 'status_kepemilikan')) {
            Schema::table('tanahs', function (Blueprint $table) {
                $table->dropColumn('status_kepemilikan');
            });
        }
    }
};
