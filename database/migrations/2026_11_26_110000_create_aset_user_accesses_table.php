<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aset_user_accesses', function (Blueprint $table): void {
            // Tidak mengubah tabel users legacy. ID berasal dari users.id.
            $table->unsignedBigInteger('user_id')->primary();
            $table->string('role', 16);
            $table->boolean('is_active')->default(false);
            $table->json('modules');
            $table->timestamps();
            $table->index(['role', 'is_active']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        // Rollback ini menghapus seluruh penugasan Aset. Jangan jalankan di produksi.
        Schema::dropIfExists('aset_user_accesses');
    }
};
