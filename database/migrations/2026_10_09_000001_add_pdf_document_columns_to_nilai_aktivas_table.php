<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nilai_aktivas', function (Blueprint $table) {

            if (!Schema::hasColumn('nilai_aktivas', 'dokumen_pdf')) {
                $table->string('dokumen_pdf', 500)->nullable();
            }

            if (!Schema::hasColumn('nilai_aktivas', 'dokumen_pdf_nama_asli')) {
                $table->string('dokumen_pdf_nama_asli', 255)->nullable();
            }

            if (!Schema::hasColumn('nilai_aktivas', 'dokumen_pdf_size')) {
                $table->unsignedBigInteger('dokumen_pdf_size')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('nilai_aktivas', function (Blueprint $table) {

            $columns = [];

            if (Schema::hasColumn('nilai_aktivas', 'dokumen_pdf')) {
                $columns[] = 'dokumen_pdf';
            }

            if (Schema::hasColumn('nilai_aktivas', 'dokumen_pdf_nama_asli')) {
                $columns[] = 'dokumen_pdf_nama_asli';
            }

            if (Schema::hasColumn('nilai_aktivas', 'dokumen_pdf_size')) {
                $columns[] = 'dokumen_pdf_size';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
