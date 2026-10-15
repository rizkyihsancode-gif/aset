
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gedungs', function (Blueprint $table) {
            $table->unsignedBigInteger('nilai_aktiva_id')
                ->nullable()
                ->unique();
        });
    }

    public function down(): void
    {
        Schema::table('gedungs', function (Blueprint $table) {
            $table->dropUnique(['nilai_aktiva_id']);
            $table->dropColumn('nilai_aktiva_id');
        });
    }
};
