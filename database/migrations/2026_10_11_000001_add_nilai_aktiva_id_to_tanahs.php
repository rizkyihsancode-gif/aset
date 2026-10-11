<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('tanahs', 'nilai_aktiva_id')) {
            Schema::table('tanahs', function (Blueprint $table) {
                $table->bigInteger('nilai_aktiva_id')->nullable()->unique();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tanahs', 'nilai_aktiva_id')) {
            Schema::table('tanahs', function (Blueprint $table) {
                $table->dropUnique('tanahs_nilai_aktiva_id_unique');
                $table->dropColumn('nilai_aktiva_id');
            });
        }
    }
};
