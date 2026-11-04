<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tidak menyentuh kib_f_s, kib_e_s, nilai_aktivas, ataupun master data.
        Schema::create('kib_konstruksi_manual', function (Blueprint $table) {
            $table->id();
            $table->string('nama_pekerjaan', 500);
            $table->string('kategori', 20); // IPA, BOOSTER, PERPIPAAN
            $table->string('cakupan', 500);
            $table->string('lokasi', 500);
            $table->string('alamat', 500)->nullable();
            $table->string('departemen', 255)->nullable();
            $table->string('divisi', 255)->nullable();
            $table->unsignedSmallInteger('tahun');
            $table->string('jenis_bangunan', 2)->nullable(); // P, SP, D
            $table->string('bertingkat', 30)->nullable();
            $table->string('material', 30)->nullable();
            $table->string('letak', 500)->nullable();
            $table->string('status_tanah', 255)->nullable();
            $table->string('asal_pembiayaan', 255)->nullable();
            $table->string('status_aset', 255)->nullable();
            $table->decimal('nilai', 20, 2)->default(0);
            $table->text('uraian_pekerjaan');
            $table->text('keterangan')->nullable();
            $table->string('foto_path', 500)->nullable();
            $table->unsignedBigInteger('created_by')->nullable(); // Tanpa FK ke users lama.
            $table->timestamps();
            $table->index(['kategori', 'tahun'], 'konstruksi_manual_kategori_tahun_idx');
        });

        Schema::create('kib_konstruksi_dokumens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('konstruksi_id')
                ->constrained('kib_konstruksi_manual')
                ->cascadeOnDelete();
            $table->string('nama_asli', 255);
            $table->string('path', 500);
            $table->string('mime', 100)->nullable();
            $table->unsignedBigInteger('ukuran')->default(0);
            $table->timestamps();
        });

        Schema::create('kib_aset_tetap_manual', function (Blueprint $table) {
            $table->id();
            $table->string('nama_aset', 500);
            $table->string('lokasi', 500);
            $table->string('alamat', 500)->nullable();
            $table->string('departemen', 255)->nullable();
            $table->string('divisi', 255)->nullable();
            $table->unsignedSmallInteger('tahun')->nullable();
            $table->unsignedInteger('jumlah_unit')->default(1);
            $table->string('kondisi', 100)->nullable();
            $table->string('foto_path', 500)->nullable();
            $table->text('keterangan')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        Schema::create('kib_aset_tetap_dokumens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aset_tetap_id')
                ->constrained('kib_aset_tetap_manual')
                ->cascadeOnDelete();
            $table->string('nama_asli', 255);
            $table->string('path', 500);
            $table->string('mime', 100)->nullable();
            $table->unsignedBigInteger('ukuran')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Lindungi entri manual jika suatu saat migrate:rollback tidak sengaja dijalankan.
        foreach (['kib_konstruksi_manual', 'kib_aset_tetap_manual'] as $name) {
            if (Schema::hasTable($name) && DB::table($name)->exists()) {
                throw new \RuntimeException(
                    "Rollback ditolak: {$name} sudah berisi data. Backup dan migrasikan data lebih dahulu."
                );
            }
        }

        Schema::dropIfExists('kib_aset_tetap_dokumens');
        Schema::dropIfExists('kib_aset_tetap_manual');
        Schema::dropIfExists('kib_konstruksi_dokumens');
        Schema::dropIfExists('kib_konstruksi_manual');
    }
};
