<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class KibNotificationService
{
    /**
     * Cache summary selama satu request.
     */
    private ?array $summaryCache = null;

    /**
     * Cache mapping module K.I.B → category ID.
     */
    private ?array $categoryCache = null;


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE TEXT
    |--------------------------------------------------------------------------
    |
    | Digunakan untuk menyamakan penulisan nama golongan.
    |
    | Contoh:
    |
    | KIB A - TANAH
    | menjadi:
    | KIB A TANAH
    |
    */

    private function normalize(?string $value): string
    {
        $value = strtoupper(
            trim(
                (string) $value
            )
        );

        $value = str_replace(
            [
                '.',
                ',',
                '-',
                '_',
                '&',
                '/',
            ],
            ' ',
            $value
        );

        return preg_replace(
            '/\s+/',
            ' ',
            $value
        ) ?: '';
    }


    /*
    |--------------------------------------------------------------------------
    | QUERY DASAR PENDING K.I.B
    |--------------------------------------------------------------------------
    |
    | HANYA:
    |
    | stat   = 0
    | jenisn = 1
    |
    | Artinya hanya Penambahan Aset yang belum diproses.
    |
    */

    private function pendingBaseQuery(): Builder
    {
        return DB::table(
            'nilai_aktivas'
        )
            ->where(
                'stat',
                0
            )
            ->where(
                'jenisn',
                1
            );
    }


    /*
    |--------------------------------------------------------------------------
    | RESOLVE CATEGORY
    |--------------------------------------------------------------------------
    |
    | Hasil contoh:
    |
    | tanah      => 1
    | mesin      => 2
    | gedung     => 3
    | jalan      => 4
    | aset_tetap => 5
    | konstruksi => 6
    | kir        => 7
    |
    */

    public function categories(): array
    {
        if (
            $this->categoryCache
            !== null
        ) {
            return $this->categoryCache;
        }


        $modules = config(
            'kib.modules',
            []
        );


        if (
            empty($modules)
        ) {
            $this->categoryCache = [];

            return [];
        }


        $golongans = DB::table(
            'golongans'
        )
            ->select(
                'id',
                'nama'
            )
            ->orderBy(
                'id'
            )
            ->get();


        $resolved = [];


        foreach (
            $modules
            as $module => $moduleConfig
        ) {

            $resolvedId = null;


            /*
            |--------------------------------------------------------------------------
            | ALIASES
            |--------------------------------------------------------------------------
            */

            $aliases = collect(
                $moduleConfig['aliases']
                    ?? []
            )
                ->map(
                    fn($alias) =>
                    $this->normalize(
                        $alias
                    )
                )
                ->filter(
                    fn($alias) =>
                    $alias !== ''
                )
                ->unique()
                ->values();


            /*
            |--------------------------------------------------------------------------
            | CARI DI TABEL GOLONGANS
            |--------------------------------------------------------------------------
            */

            foreach (
                $golongans
                as $golongan
            ) {

                $golonganName =
                    $this->normalize(
                        $golongan->nama
                    );


                if (
                    $golonganName === ''
                ) {
                    continue;
                }


                foreach (
                    $aliases
                    as $alias
                ) {

                    if (
                        $alias === ''
                    ) {
                        continue;
                    }


                    /*
                     * Prioritas pertama:
                     * harus sama persis.
                     */
                    if (
                        $golonganName === $alias
                    ) {
                        $resolvedId =
                            (int) $golongan->id;

                        break 2;
                    }


                    /*
                     * Prioritas kedua:
                     * contains.
                     *
                     * Alias pendek tidak dipakai agar
                     * mengurangi kemungkinan salah cocok.
                     */
                    if (
                        mb_strlen(
                            $alias
                        ) >= 4
                        &&
                        (
                            str_contains(
                                $golonganName,
                                $alias
                            )
                            ||
                            str_contains(
                                $alias,
                                $golonganName
                            )
                        )
                    ) {

                        $resolvedId =
                            (int) $golongan->id;

                        break 2;
                    }
                }
            }


            /*
            |--------------------------------------------------------------------------
            | FALLBACK
            |--------------------------------------------------------------------------
            */

            if (
                $resolvedId === null
            ) {

                $fallback =
                    $moduleConfig['cat_fallback']
                    ?? null;


                $resolvedId =
                    $fallback !== null
                    ? (int) $fallback
                    : null;
            }


            $resolved[$module] = $resolvedId;
        }


        $this->categoryCache =
            $resolved;


        return $resolved;
    }


    /*
    |--------------------------------------------------------------------------
    | CATEGORY ID PER MODULE
    |--------------------------------------------------------------------------
    */

    public function categoryId(
        string $module
    ): ?int {

        $categories =
            $this->categories();


        if (
            !array_key_exists(
                $module,
                $categories
            )
        ) {
            return null;
        }


        return $categories[$module] !== null
            ? (int) $categories[$module]
            : null;
    }


    /*
    |--------------------------------------------------------------------------
    | SUMMARY NOTIFIKASI
    |--------------------------------------------------------------------------
    |
    | Digunakan sidebar dan card notifikasi K.I.B.
    |
    | Penting:
    |
    | Penambahan Nilai TIDAK dihitung.
    |
    */

    public function summary(): array
    {
        if (
            $this->summaryCache
            !== null
        ) {
            return $this->summaryCache;
        }


        $modules = config(
            'kib.modules',
            []
        );


        $categories =
            $this->categories();


        $categoryIds = collect(
            $categories
        )
            ->filter(
                fn($id) =>
                $id !== null
            )
            ->map(
                fn($id) =>
                (int) $id
            )
            ->unique()
            ->values()
            ->all();


        /*
        |--------------------------------------------------------------------------
        | DEFAULT RESULT
        |--------------------------------------------------------------------------
        */

        $result = [];


        foreach (
            $modules
            as $module => $moduleConfig
        ) {

            $result[$module] = [

                'module' =>
                $module,

                'cat' =>
                $categories[$module]
                    ?? null,

                'label' =>
                $moduleConfig['label']
                    ?? ucfirst(
                        str_replace(
                            '_',
                            ' ',
                            $module
                        )
                    ),

                'url' =>
                $moduleConfig['url']
                    ?? '#',

                'icon' =>
                $moduleConfig['icon']
                    ?? 'bell',

                'total' =>
                0,

                'aset_baru' =>
                0,

                /*
                 * Tetap ada supaya Blade lama
                 * tidak error.
                 */
                'penambahan_nilai' =>
                0,

                'lainnya' =>
                0,
            ];
        }


        /*
        |--------------------------------------------------------------------------
        | QUERY JUMLAH PENDING
        |--------------------------------------------------------------------------
        */

        if (
            !empty($categoryIds)
        ) {

            $rows =
                $this
                ->pendingBaseQuery()

                ->whereIn(
                    'cat',
                    $categoryIds
                )

                ->select(
                    'cat'
                )

                ->selectRaw(
                    'COUNT(*) AS total'
                )

                ->groupBy(
                    'cat'
                )

                ->get();


            foreach (
                $rows
                as $row
            ) {

                $cat =
                    (int) $row->cat;


                $total =
                    (int) $row->total;


                foreach (
                    $categories
                    as $module => $categoryId
                ) {

                    if (
                        $categoryId === null
                        ||
                        (int) $categoryId
                        !==
                        $cat
                    ) {
                        continue;
                    }


                    /*
                     * Karena query hanya jenisn = 1,
                     * total = jumlah Penambahan Aset.
                     */
                    $result[$module]['total'] = $total;


                    $result[$module]['aset_baru'] = $total;


                    break;
                }
            }
        }


        /*
        |--------------------------------------------------------------------------
        | TOTAL PARENT K.I.B
        |--------------------------------------------------------------------------
        */

        $grandTotal = 0;


        foreach (
            $result
            as $item
        ) {

            $grandTotal +=
                (int) (
                    $item['total']
                    ?? 0
                );
        }


        $result['_total'] = $grandTotal;


        $this->summaryCache =
            $result;


        return $result;
    }


    /*
    |--------------------------------------------------------------------------
    | SINGLE MODULE
    |--------------------------------------------------------------------------
    */

    public function module(
        string $module
    ): array {

        $summary =
            $this->summary();


        if (
            isset(
                $summary[$module]
            )
        ) {
            return $summary[$module];
        }


        return [

            'module' =>
            $module,

            'cat' =>
            null,

            'label' =>
            ucfirst(
                str_replace(
                    '_',
                    ' ',
                    $module
                )
            ),

            'url' =>
            '#',

            'icon' =>
            'bell',

            'total' =>
            0,

            'aset_baru' =>
            0,

            'penambahan_nilai' =>
            0,

            'lainnya' =>
            0,
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | TOTAL NOTIFIKASI
    |--------------------------------------------------------------------------
    */

    public function total(): int
    {
        return (int) (
            $this
                ->summary()['_total']
            ?? 0
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CEK NOTIFIKASI MODULE
    |--------------------------------------------------------------------------
    */

    public function hasNotification(
        string $module
    ): bool {

        return (
            (int) (
                $this
                    ->module(
                        $module
                    )['total']
                ?? 0
            )
        ) > 0;
    }


    /*
    |--------------------------------------------------------------------------
    | CLEAR CACHE
    |--------------------------------------------------------------------------
    */

    public function clearCache(): void
    {
        $this->summaryCache =
            null;

        $this->categoryCache =
            null;
    }
}
