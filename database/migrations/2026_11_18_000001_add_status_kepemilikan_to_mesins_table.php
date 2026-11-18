<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('mesins', 'status_kepemilikan')) {
            Schema::table('mesins', function (Blueprint $table): void {
                $table->string('status_kepemilikan', 20)
                    ->nullable()
                    ->index();
            });
        }
    }

    public function down(): void
    {
        // Peringatan: rollback menghapus semua nilai status kepemilikan.
        if (Schema::hasColumn('mesins', 'status_kepemilikan')) {
            Schema::table('mesins', function (Blueprint $table): void {
                $table->dropColumn('status_kepemilikan');
            });
        }
    }
};
