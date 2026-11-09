
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn(
            'kib_aset_tetap_manual',
            'kode_struktur'
        )) {
            Schema::table(
                'kib_aset_tetap_manual',
                function (Blueprint $table) {
                    $table->string(
                        'kode_struktur',
                        100
                    )->nullable();
                }
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn(
            'kib_aset_tetap_manual',
            'kode_struktur'
        )) {
            Schema::table(
                'kib_aset_tetap_manual',
                function (Blueprint $table) {
                    $table->dropColumn('kode_struktur');
                }
            );
        }
    }
};
