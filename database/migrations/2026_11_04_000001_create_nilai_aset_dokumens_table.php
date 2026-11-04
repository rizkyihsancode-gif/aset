<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nilai_aset_dokumens', function (Blueprint $table) {
            $table->id();

            $table->foreignId('nilai_aktiva_id')
                ->constrained('nilai_aktivas')
                ->cascadeOnDelete();

            $table->text('path')->unique();
            $table->text('original_name');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamps();

            $table->index('nilai_aktiva_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nilai_aset_dokumens');
    }
};
