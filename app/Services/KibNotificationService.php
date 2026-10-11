<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class KibNotificationService
{
    private ?array $summaryCache = null;

    private ?array $categoryCache = null;


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE
    |--------------------------------------------------------------------------
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
    | RESOLVE CATEGORY IDs
    |--------------------------------------------------------------------------
    */

    public function categories(): array
    {
        if ($this->categoryCache !== null) {
            return $this->categoryCache;
        }


        $modules = config(
            'kib.modules',
            []
        );


        $golongans = DB::table(
            'golongans'
        )
            ->select([
                'id',
                'nama',
            ])
            ->orderBy('id')
            ->get();


        $resolved = [];


        foreach ($modules as $module => $config) {

            $resolvedId = null;


            $aliases = collect(
                $config['aliases'] ?? []
            )
                ->map(
                    fn($alias) =>
                    $this->normalize($alias)
                )
                ->filter()
                ->values();


            foreach ($golongans as $golongan) {

                $golonganName =
                    $this->normalize(
                        $golongan->nama
                    );


                foreach ($aliases as $alias) {

                    if (
                        $golonganName === $alias
                        ||
                        str_contains(
                            $golonganName,
                            $alias
                        )
                        ||
                        str_contains(
                            $alias,
                            $golonganName
                        )
                    ) {

                        $resolvedId =
                            (int) $golongan->id;

                        break 2;
                    }
                }
            }


            if ($resolvedId === null) {

                $fallback =
                    $config['cat_fallback']
                    ?? null;


                $resolvedId =
                    $fallback !== null
                    ? (int) $fallback
                    : null;
            }


            $resolved[$module] =
                $resolvedId;
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

        return $this->categories()[$module] ?? null;
    }


    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
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


        $categoryIds =
            collect(
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


        $rows = collect();


        if (!empty($categoryIds)) {

            $rows = DB::table(
                'nilai_aktivas'
            )

                ->selectRaw(
                    '
                    cat,
                    COALESCE(jenisn, 0) AS jenisn,
                    COUNT(*) AS total
                    '
                )

                ->where(
                    'stat',
                    0
                )

                ->whereIn(
                    'cat',
                    $categoryIds
                )

                ->groupBy(
                    'cat',
                    'jenisn'
                )

                ->get();
        }


        $result = [];


        foreach (
            $modules
            as $module => $config
        ) {

            $result[$module] = [

                'module' =>
                $module,

                'cat' =>
                $categories[$module] ?? null,

                'label' =>
                $config['label'],

                'url' =>
                $config['url'],

                'icon' =>
                $config['icon'],

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


        foreach ($rows as $row) {

            $cat =
                (int) $row->cat;

            $jenis =
                (int) $row->jenisn;

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
                    !== $cat
                ) {

                    continue;
                }


                $result[$module]['total'] += $total;


                if ($jenis === 1) {

                    $result[$module]['aset_baru'] += $total;
                } elseif ($jenis === 2) {

                    $result[$module]['penambahan_nilai'] += $total;
                } else {

                    $result[$module]['lainnya'] += $total;
                }


                break;
            }
        }


        $grandTotal = 0;


        foreach ($result as $item) {

            $grandTotal +=
                (int) $item['total'];
        }


        $result['_total'] =
            $grandTotal;


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
            ucfirst($module),

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
}
