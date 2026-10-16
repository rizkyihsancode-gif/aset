<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class KibNotificationService
{
    private ?array $summaryCache = null;
    private ?array $categoryCache = null;

    /*
    |--------------------------------------------------------------------------
    | 01. NORMALISASI NAMA GOLONGAN
    |--------------------------------------------------------------------------
    */

    private function normalize(?string $value): string
    {
        $value = mb_strtoupper(trim((string) $value));

        $value = str_replace(
            ['.', ',', '-', '_', '&', '/'],
            ' ',
            $value
        );

        return trim(
            preg_replace('/\s+/u', ' ', $value) ?? ''
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 02. QUERY DASAR PENDING
    |--------------------------------------------------------------------------
    |
    | Mengikuti web lama:
    | stat = 0 berarti transaksi menunggu diproses.
    |
    | Transaksi Penambahan Nilai baru memiliki stat = 1,
    | sehingga tidak masuk query pending.
    |
    */

    private function pendingBaseQuery(): Builder
    {
        return DB::table('nilai_aktivas')
            ->where('stat', 0);
    }

    /*
    |--------------------------------------------------------------------------
    | 03. RESOLVE CATEGORY
    |--------------------------------------------------------------------------
    |
    | Mencocokkan config/kib.php dengan tabel golongans.
    |
    */

    public function categories(): array
    {
        if ($this->categoryCache !== null) {
            return $this->categoryCache;
        }

        $modules = config('kib.modules', []);

        if (empty($modules)) {
            return $this->categoryCache = [];
        }

        $golongans = DB::table('golongans')
            ->select('id', 'nama')
            ->orderBy('id')
            ->get();

        $resolved = [];

        foreach ($modules as $module => $config) {
            $resolvedId = null;

            $aliases = collect($config['aliases'] ?? [])
                ->map(fn($alias) => $this->normalize($alias))
                ->filter(fn($alias) => $alias !== '')
                ->unique()
                ->values();

            // Cari nama golongan yang cocok persis.
            foreach ($golongans as $golongan) {
                $nama = $this->normalize($golongan->nama);

                if ($nama !== '' && $aliases->contains($nama)) {
                    $resolvedId = (int) $golongan->id;
                    break;
                }
            }

            // Jika tidak ada, cocokkan berdasarkan alias.
            if ($resolvedId === null) {
                foreach ($golongans as $golongan) {
                    $nama = $this->normalize($golongan->nama);

                    if ($nama === '') {
                        continue;
                    }

                    foreach ($aliases as $alias) {
                        if (
                            mb_strlen($alias) >= 4
                            &&
                            (
                                str_contains($nama, $alias)
                                ||
                                str_contains($alias, $nama)
                            )
                        ) {
                            $resolvedId = (int) $golongan->id;
                            break 2;
                        }
                    }
                }
            }

            // Gunakan fallback konfigurasi jika tersedia.
            if ($resolvedId === null) {
                $fallback = $config['cat_fallback'] ?? null;

                $resolvedId = $fallback !== null
                    ? (int) $fallback
                    : null;
            }

            $resolved[$module] = $resolvedId;
        }

        return $this->categoryCache = $resolved;
    }

    /*
    |--------------------------------------------------------------------------
    | 04. CATEGORY ID BERDASARKAN MODULE
    |--------------------------------------------------------------------------
    */

    public function categoryId(string $module): ?int
    {
        $categories = $this->categories();

        $id = $categories[$module] ?? null;

        return $id !== null ? (int) $id : null;
    }

    /*
    |--------------------------------------------------------------------------
    | 05. SUMMARY NOTIFIKASI
    |--------------------------------------------------------------------------
    |
    | TANAH:
    | - stat = 0
    | - jenisn IN (1, 2)
    |
    | MODULE LAIN:
    | - stat = 0 (kompatibilitas web lama)
    |
    | Data Penambahan Nilai baru tidak ikut karena stat = 1.
    |
    */

    public function summary(): array
    {
        if ($this->summaryCache !== null) {
            return $this->summaryCache;
        }

        $modules = config('kib.modules', []);
        $categories = $this->categories();

        $tanahCat = $categories['tanah'] ?? null;

        $categoryIds = collect($categories)
            ->filter(fn($id) => $id !== null)
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | DEFAULT RESULT
        |--------------------------------------------------------------------------
        */

        $result = [];

        foreach ($modules as $module => $config) {
            $result[$module] = [
                'module' => $module,
                'cat' => $categories[$module] ?? null,
                'label' => $config['label'] ?? ucfirst($module),
                'url' => $config['url'] ?? '#',
                'icon' => $config['icon'] ?? 'bell',

                'total' => 0,
                'aset_baru' => 0,
                'penambahan_nilai' => 0,
                'lainnya' => 0,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | QUERY TOTAL BERDASARKAN KATEGORI DAN JENIS
        |--------------------------------------------------------------------------
        */

        if (!empty($categoryIds)) {
            $rows = $this->pendingBaseQuery()
                ->whereIn('cat', $categoryIds)
                ->select('cat')
                ->selectRaw(
                    'COALESCE(jenisn, 0) AS jenisn, COUNT(*) AS jumlah'
                )
                ->groupBy('cat', 'jenisn')
                ->get();

            foreach ($rows as $row) {
                $cat = (int) $row->cat;
                $jenis = (int) $row->jenisn;
                $jumlah = (int) $row->jumlah;

                /*
                |--------------------------------------------------------------------------
                | FILTER KHUSUS TANAH
                |--------------------------------------------------------------------------
                |
                | Data contoh:
                | 1  Penambahan Aset
                | 15 Penambahan Nilai historis
                | 1  Jenis lainnya (dikecualikan)
                |
                | Total antrian = 16.
                |
                */

                if (
                    $tanahCat !== null
                    &&
                    $cat === (int) $tanahCat
                    &&
                    !in_array($jenis, [1, 2], true)
                ) {
                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | COCOKKAN DENGAN MODULE
                |--------------------------------------------------------------------------
                */

                foreach ($categories as $module => $categoryId) {
                    if (
                        $categoryId === null
                        ||
                        (int) $categoryId !== $cat
                    ) {
                        continue;
                    }

                    // Gedung: Penambahan Nilai (jenisn=2) bukan pending inventaris.
                    if ($module === 'gedung' && $jenis !== 1) {
                        continue;
                    }

                    $result[$module]['total'] += $jumlah;

                    if ($jenis === 1) {
                        $result[$module]['aset_baru'] += $jumlah;
                    } elseif ($jenis === 2) {
                        $result[$module]['penambahan_nilai'] += $jumlah;
                    } else {
                        $result[$module]['lainnya'] += $jumlah;
                    }

                    break;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | TOTAL SELURUH NOTIFIKASI K.I.B
        |--------------------------------------------------------------------------
        */

        $result['_total'] = collect($result)
            ->sum(
                fn(array $item) => (int) $item['total']
            );

        return $this->summaryCache = $result;
    }

    /*
    |--------------------------------------------------------------------------
    | 06. SUMMARY SATU MODULE
    |--------------------------------------------------------------------------
    */

    public function module(string $module): array
    {
        $summary = $this->summary();

        if (isset($summary[$module])) {
            return $summary[$module];
        }

        return [
            'module' => $module,
            'cat' => null,
            'label' => ucfirst(str_replace('_', ' ', $module)),
            'url' => '#',
            'icon' => 'bell',

            'total' => 0,
            'aset_baru' => 0,
            'penambahan_nilai' => 0,
            'lainnya' => 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | 07. TOTAL NOTIFIKASI SEMUA MODULE
    |--------------------------------------------------------------------------
    */

    public function total(): int
    {
        return (int) ($this->summary()['_total'] ?? 0);
    }

    /*
    |--------------------------------------------------------------------------
    | 08. CEK NOTIFIKASI MODULE
    |--------------------------------------------------------------------------
    */

    public function hasNotification(string $module): bool
    {
        return (int) ($this->module($module)['total'] ?? 0) > 0;
    }

    /*
    |--------------------------------------------------------------------------
    | 09. HAPUS CACHE SERVICE
    |--------------------------------------------------------------------------
    */

    public function clearCache(): void
    {
        $this->summaryCache = null;
        $this->categoryCache = null;
    }
}
