
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('departemens', 'status')) {
            Schema::table('departemens', function (Blueprint $table) {
                $table->string('status', 8)
                    ->nullable()
                    ->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('departemens', 'status')) {
            Schema::table('departemens', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
