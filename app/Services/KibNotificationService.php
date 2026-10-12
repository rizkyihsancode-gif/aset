<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class KibNotificationService
{
    private ?array $summaryCache = null;

    private ?array $categoryCache = null;

    /**
     * ============================================================
     * 01. NORMALISASI NAMA GOLONGAN
     * ============================================================
     */
    private function normalize(?string $value): string
    {
        $value = mb_strtoupper(trim((string) $value));

        $value = preg_replace('/[.,\-_&\/]+/u', ' ', $value);

        return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    }

    /**
     * ============================================================
     * 02. QUERY DASAR PENDING K.I.B
     * ============================================================
     *
     * Kompatibel dengan web lama:
     * - stat = 0 berarti transaksi belum diproses K.I.B
     * - termasuk transaksi historis jenisn = 2
     *
     * Transaksi Penambahan Nilai BARU harus disimpan stat = 1
     * oleh NilaiAsetController, sehingga tidak masuk ke sini.
     */
    private function pendingBaseQuery(): Builder
    {
        return DB::table('nilai_aktivas')
            ->where('stat', 0);
    }

    /**
     * ============================================================
     * 03. RESOLVE CATEGORY ID
     * ============================================================
     *
     * Mapping module didasarkan pada config/kib.php,
     * nama asli golongan di database, dan cat_fallback.
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

        foreach ($modules as $module => $moduleConfig) {
            $resolvedId = null;

            $aliases = collect($moduleConfig['aliases'] ?? [])
                ->map(fn($alias) => $this->normalize($alias))
                ->filter(fn($alias) => $alias !== '')
                ->unique()
                ->values();

            // Prioritas 1: nama golongan cocok persis.
            foreach ($golongans as $golongan) {
                $nama = $this->normalize($golongan->nama);

                if ($nama === '') {
                    continue;
                }

                if ($aliases->contains($nama)) {
                    $resolvedId = (int) $golongan->id;
                    break;
                }
            }

            // Prioritas 2: cocok sebagian.
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
                                || str_contains($alias, $nama)
                            )
                        ) {
                            $resolvedId = (int) $golongan->id;
                            break 2;
                        }
                    }
                }
            }

            // Prioritas 3: ID fallback.
            if ($resolvedId === null) {
                $fallback = $moduleConfig['cat_fallback'] ?? null;

                $resolvedId = $fallback !== null
                    ? (int) $fallback
                    : null;
            }

            $resolved[$module] = $resolvedId;
        }

        return $this->categoryCache = $resolved;
    }

    /**
     * ============================================================
     * 04. CATEGORY SATU MODULE
     * ============================================================
     */
    public function categoryId(string $module): ?int
    {
        $categories = $this->categories();

        if (!array_key_exists($module, $categories)) {
            return null;
        }

        return $categories[$module] !== null
            ? (int) $categories[$module]
            : null;
    }

    /**
     * ============================================================
     * 05. SUMMARY NOTIFIKASI SELURUH K.I.B
     * ============================================================
     *
     * total             = seluruh transaksi stat=0
     * aset_baru         = jenisn=1, stat=0
     * penambahan_nilai  = jenisn=2, stat=0 (histori)
     * lainnya           = jenisn selain 1/2 atau NULL
     *
     * Struktur response lama tidak diubah.
     */
    public function summary(): array
    {
        if ($this->summaryCache !== null) {
            return $this->summaryCache;
        }

        $modules = config('kib.modules', []);
        $categories = $this->categories();

        $categoryIds = collect($categories)
            ->filter(fn($id) => $id !== null)
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

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

        if (!empty($categoryIds)) {
            $rows = $this->pendingBaseQuery()
                ->whereIn('cat', $categoryIds)
                ->select('cat')
                ->selectRaw(
                    'COALESCE(jenisn, 0) AS jenisn, COUNT(*) AS total'
                )
                ->groupBy('cat', 'jenisn')
                ->get();

            foreach ($rows as $row) {
                $cat = (int) $row->cat;
                $jenis = (int) $row->jenisn;
                $jumlah = (int) $row->total;

                foreach ($categories as $module => $categoryId) {
                    if (
                        $categoryId === null
                        || (int) $categoryId !== $cat
                    ) {
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

        $result['_total'] = collect($result)
            ->sum(
                fn(array $item) => (int) $item['total']
            );

        return $this->summaryCache = $result;
    }

    /**
     * ============================================================
     * 06. NOTIFIKASI SATU MODULE
     * ============================================================
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

    /**
     * ============================================================
     * 07. TOTAL BADGE SELURUH MODULE
     * ============================================================
     */
    public function total(): int
    {
        return (int) ($this->summary()['_total'] ?? 0);
    }

    /**
     * ============================================================
     * 08. CEK MODULE MEMILIKI NOTIFIKASI
     * ============================================================
     */
    public function hasNotification(string $module): bool
    {
        return (int) ($this->module($module)['total'] ?? 0) > 0;
    }

    /**
     * ============================================================
     * 09. RESET CACHE
     * ============================================================
     */
    public function clearCache(): void
    {
        $this->summaryCache = null;
        $this->categoryCache = null;
    }
}
