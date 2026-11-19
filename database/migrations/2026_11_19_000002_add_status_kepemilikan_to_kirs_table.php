<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('kirs', 'status_kepemilikan')) {
            Schema::table('kirs', function (Blueprint $table): void {
                $table->string('status_kepemilikan', 20)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('kirs', 'status_kepemilikan')) {
            Schema::table('kirs', function (Blueprint $table): void {
                $table->dropColumn('status_kepemilikan');
            });
        }
    }
};
