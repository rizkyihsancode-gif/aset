
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('mesins', 'id_aktiva')) {
            Schema::table('mesins', function (Blueprint $table) {
                $table->unsignedBigInteger('id_aktiva')
                    ->nullable();

                $table->index(
                    'id_aktiva',
                    'mesins_id_aktiva_index'
                );
            });
        }
    }

    public function down(): void
    {
        // Sengaja tidak menghapus kolom secara otomatis.
        // Klasifikasi kendaraan lama perlu dilindungi
        // dari kehilangan data saat rollback.
    }
};
