
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('mesin_pajaks')) {

            Schema::create(
                'mesin_pajaks',
                function (Blueprint $table) {

                    $table->id();

                    // Hubungan ke tabel mesins
                    $table->unsignedBigInteger('mesin_id');

                    // Tanggal pembaruan pajak
                    $table->date('tanggal_bayar')
                        ->nullable();

                    // Masa berlaku: 8 atau 12 bulan
                    $table->unsignedSmallInteger(
                        'masa_berlaku_bulan'
                    )->nullable();

                    // Dihitung otomatis oleh Laravel
                    $table->date('jatuh_tempo');

                    // Informasi pembayaran
                    $table->unsignedBigInteger('nominal')
                        ->nullable();

                    $table->string('nomor_stnk', 120)
                        ->nullable();

                    $table->text('keterangan')
                        ->nullable();

                    $table->string('dokumen_pdf')
                        ->nullable();

                    $table->timestamps();

                    // Mempermudah pengambilan
                    // riwayat pajak terbaru
                    $table->index([
                        'mesin_id',
                        'jatuh_tempo'
                    ]);
                }
            );
        } elseif (
            !Schema::hasColumn(
                'mesin_pajaks',
                'masa_berlaku_bulan'
            )
        ) {

            // Untuk database yang sudah memiliki
            // tabel pajak dari versi sebelumnya.
            Schema::table(
                'mesin_pajaks',
                function (Blueprint $table) {

                    $table->unsignedSmallInteger(
                        'masa_berlaku_bulan'
                    )->nullable();
                }
            );
        }
    }

    public function down(): void
    {
        // Tidak otomatis menghapus tabel pajak
        // karena mungkin sudah berisi data historis.
    }
};
