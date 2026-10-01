<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_data_activity_logs', function (Blueprint $table) {

            $table->id();

            /*
             * barang, departemen, divisi, dll.
             */
            $table->string('module', 50);

            /*
             * ID record asli.
             */
            $table->bigInteger('record_id')->nullable();

            /*
             * Snapshot data.
             *
             * Tetap tersimpan walaupun record utama
             * nantinya sudah dihapus.
             */
            $table->string('record_name', 255);

            $table->string('record_code', 255)
                ->nullable();

            /*
             * created / deleted
             */
            $table->string('action', 20);

            /*
             * created_at record asli.
             */
            $table->timestamp('record_created_at')
                ->nullable();

            $table->timestamps();


            /*
             * Index untuk mempercepat history.
             */
            $table->index([
                'module',
                'action'
            ]);

            $table->index([
                'module',
                'created_at'
            ]);
        });
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'master_data_activity_logs'
        );
    }
};
