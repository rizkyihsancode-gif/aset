<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('gedungs', 'status_kepemilikan')) {
            Schema::table('gedungs', function (Blueprint $table) {
                $table->string('status_kepemilikan', 20)->nullable()->index();
            });
        }

        if (!Schema::hasColumn('gedungs', 'sumber_dana')) {
            Schema::table('gedungs', function (Blueprint $table) {
                $table->string('sumber_dana', 255)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('gedungs', 'sumber_dana')) {
            Schema::table('gedungs', function (Blueprint $table) {
                $table->dropColumn('sumber_dana');
            });
        }
        if (Schema::hasColumn('gedungs', 'status_kepemilikan')) {
            Schema::table('gedungs', function (Blueprint $table) {
                $table->dropColumn('status_kepemilikan');
            });
        }
    }
};
