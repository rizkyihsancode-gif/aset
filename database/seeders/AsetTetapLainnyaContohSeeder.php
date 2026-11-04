<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class AsetTetapLainnyaContohSeeder extends Seeder
{
    public function run(): void
    {
        $table = 'kib_aset_tetap_manual';

        /*
        |--------------------------------------------------------------------------
        | PERIKSA DATABASE
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable($table)) {
            throw new RuntimeException(
                'Tabel kib_aset_tetap_manual belum tersedia. ' .
                    'Jalankan migration manual K.I.B E terlebih dahulu.'
            );
        }

        foreach (
            [
                'kode_inventaris',
                'nomor_register',
                'bahan',
                'asal_perolehan'
            ] as $column
        ) {

            if (!Schema::hasColumn($table, $column)) {
                throw new RuntimeException(
                    "Kolom {$column} belum tersedia. " .
                        "Jalankan migration tambahan K.I.B E."
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 3 DATA CONTOH ASET TETAP LAINNYA
        |--------------------------------------------------------------------------
        */

        $examples = [

            // ===================================================
            // DATA 1 — BUKU REFERENSI
            // ===================================================

            [
                'nama_aset' =>
                'Buku Referensi Teknik Pengolahan Air',

                'kode_inventaris' =>
                'DEMO-KIBE-2026-001',

                'nomor_register' =>
                'REG-DEMO-E-001',

                'bahan' =>
                'Kertas',

                'tahun' =>
                2023,

                'jumlah_unit' =>
                12,

                'kondisi' =>
                'BAIK',

                'lokasi' =>
                'Perpustakaan Kantor Pusat',

                'alamat' =>
                'Samarinda, Kalimantan Timur',

                'departemen' =>
                'Administrasi Umum',

                'divisi' =>
                'Umum',

                'asal_perolehan' =>
                'PEMBELIAN',

                'keterangan' =>
                'DATA CONTOH untuk pengujian K.I.B E. ' .
                    'Koleksi buku referensi operasional ' .
                    'pengolahan air; bukan inventaris riil.',
            ],

            // ===================================================
            // DATA 2 — LUKISAN DEKORATIF
            // ===================================================

            [
                'nama_aset' =>
                'Lukisan Dekoratif Ruang Direksi',

                'kode_inventaris' =>
                'DEMO-KIBE-2026-002',

                'nomor_register' =>
                'REG-DEMO-E-002',

                'bahan' =>
                'Kanvas dan kayu',

                'tahun' =>
                2022,

                'jumlah_unit' =>
                1,

                'kondisi' =>
                'BAIK',

                'lokasi' =>
                'Ruang Direksi',

                'alamat' =>
                'Kantor Pusat, Samarinda',

                'departemen' =>
                'Administrasi Umum',

                'divisi' =>
                'Umum',

                'asal_perolehan' =>
                'PEMBELIAN',

                'keterangan' =>
                'DATA CONTOH untuk pengujian K.I.B E. ' .
                    'Aset seni dekoratif; bukan inventaris riil.',
            ],

            // ===================================================
            // DATA 3 — TANAMAN HIAS
            // ===================================================

            [
                'nama_aset' =>
                'Tanaman Hias Palem Area Kantor',

                'kode_inventaris' =>
                'DEMO-KIBE-2026-003',

                'nomor_register' =>
                'REG-DEMO-E-003',

                'bahan' =>
                'Tanaman hidup',

                'tahun' =>
                2024,

                'jumlah_unit' =>
                6,

                'kondisi' =>
                'CUKUP',

                'lokasi' =>
                'Halaman Kantor Pusat',

                'alamat' =>
                'Kantor Pusat, Samarinda',

                'departemen' =>
                'Administrasi Umum',

                'divisi' =>
                'Umum',

                'asal_perolehan' =>
                'HIBAH',

                'keterangan' =>
                'DATA CONTOH untuk pengujian K.I.B E. ' .
                    'Tanaman hias yang diasumsikan memenuhi ' .
                    'kebijakan kapitalisasi; bukan inventaris riil.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | SIMPAN KE POSTGRESQL
        |--------------------------------------------------------------------------
        | Jika kode inventaris sudah ditemukan,
        | data dilewati agar tidak terjadi duplikasi.
        |--------------------------------------------------------------------------
        */

        $inserted = 0;
        $skipped = 0;

        DB::transaction(function () use (
            $table,
            $examples,
            &$inserted,
            &$skipped
        ) {

            foreach ($examples as $record) {

                $exists = DB::table($table)
                    ->where(
                        'kode_inventaris',
                        $record['kode_inventaris']
                    )
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $record['created_by'] = null;
                $record['created_at'] = now();
                $record['updated_at'] = now();

                DB::table($table)->insert($record);

                $inserted++;
            }
        });

        $this->command?->info(
            "Seeder selesai. Ditambahkan: {$inserted}; " .
                "dilewati (sudah ada): {$skipped}."
        );
    }
}
