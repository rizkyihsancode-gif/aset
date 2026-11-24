<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kib_voucher_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('nilai_aktiva_id')->unique();
            $table->string('kib', 24);
            $table->unsignedBigInteger('record_id');
            $table->unsignedBigInteger('id_lokasi');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->index(['kib', 'record_id']);
            $table->index(['kib', 'id_lokasi']);
            $table->foreign('nilai_aktiva_id')->references('id')->on('nilai_aktivas')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kib_voucher_links');
    }
};
