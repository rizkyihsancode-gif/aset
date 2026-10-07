<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    private array $tableExistsCache = [];
    private array $columnExistsCache = [];

    public function index()
    {
        $definitions = $this->assetDefinitions();

        $availableLabels = $this->availableKibLabels();

        $labelsByCategory = $this->groupKibLabels(
            $availableLabels,
            $definitions
        );

        $kibStats = collect($definitions)
            ->map(function (array $definition) use ($labelsByCategory) {
                $matchedLabels =
                    $labelsByCategory[$definition['key']]
                    ?? [];

                $nilai = $this->sumNilaiByKibLabels(
                    $matchedLabels
                );

                if (
                    $definition['key'] === 'kir'
                    &&
                    $nilai <= 0
                ) {
                    $nilai = $this->sumKirValue();
                }

                return [
                    ...$definition,

                    'jumlah' =>
                    $this->assetQuantity(
                        $definition
                    ),

                    'nilai' =>
                    $nilai,

                    'matched_kib_labels' =>
                    $matchedLabels,
                ];
            })
            ->values();


        /*
        |--------------------------------------------------------------------------
        | TOTAL ASET
        |--------------------------------------------------------------------------
        */

        $totalAset =
            (int) $kibStats->sum('jumlah');


        /*
        |--------------------------------------------------------------------------
        | TOTAL NILAI ASET
        |--------------------------------------------------------------------------
        */

        $totalNilai =
            $this->sumAllNilaiAktiva();


        /*
        |--------------------------------------------------------------------------
        | MASTER DATA
        |--------------------------------------------------------------------------
        */

        $masterStats = [

            'barang' =>
            $this->safeCount(
                'barangs'
            ),

            'lokasi' =>
            $this->safeCount(
                'lokasis'
            ),

            'ruangan' =>
            $this->safeCount(
                'ruangans'
            ),

            'departemen' =>
            $this->safeCount(
                'departemens'
            ),

            'divisi' =>
            $this->safeCount(
                'divisis'
            ),

            'sdm' =>
            $this->safeCount(
                'sdms'
            ),

            'kode_aktiva' =>
            $this->safeCount(
                'aktivas'
            ),
        ];


        $unitKerja =
            (int) $masterStats['departemen']
            +
            (int) $masterStats['divisi'];


        /*
        |--------------------------------------------------------------------------
        | KONDISI
        |--------------------------------------------------------------------------
        */

        $conditionStats =
            $this->buildConditionStats(
                $definitions
            );


        /*
        |--------------------------------------------------------------------------
        | PERTUMBUHAN
        |--------------------------------------------------------------------------
        */

        $growth =
            $this->buildGrowthData();


        /*
        |--------------------------------------------------------------------------
        | LOKASI
        |--------------------------------------------------------------------------
        */

        $locationData =
            $this->buildLocationStats(
                $definitions
            );


        $locations =
            $locationData['items'];


        $totalLokasiAset =
            $locationData['total'];


        /*
        |--------------------------------------------------------------------------
        | AKTIVITAS
        |--------------------------------------------------------------------------
        */

        $activitySourceAvailable =
            $this->hasTable(
                'master_data_activity_logs'
            );


        $recentActivities =
            $this->buildRecentActivities();


        /*
        |--------------------------------------------------------------------------
        | ASET TERBARU
        |--------------------------------------------------------------------------
        */

        $latestAssets =
            $this->buildLatestAssets();


        /*
        |--------------------------------------------------------------------------
        | UPDATE TERAKHIR
        |--------------------------------------------------------------------------
        */

        $latestUpdateTables =
            array_values(
                array_unique(
                    array_merge(
                        array_column(
                            $definitions,
                            'table'
                        ),

                        [
                            'nilai_aktivas',
                            'barangs',
                            'lokasis',
                            'ruangans',
                            'departemens',
                            'divisis',
                            'sdms',
                            'aktivas',
                            'master_data_activity_logs',
                        ]
                    )
                )
            );


        $latestUpdate =
            $this->latestUpdateTimestamp(
                $latestUpdateTables
            );


        $updateTerakhir =
            null;


        if ($latestUpdate) {

            $date =
                Carbon::parse(
                    $latestUpdate
                )
                ->timezone(
                    'Asia/Makassar'
                )
                ->locale(
                    'id'
                );


            $updateTerakhir = [

                'relative' =>
                $date->diffForHumans(),

                'date' =>
                $date->translatedFormat(
                    'd M Y, H:i'
                )
                    .
                    ' WITA',
            ];
        }


        return view(
            'main.dashboard',

            compact(
                'kibStats',
                'totalAset',
                'totalNilai',
                'masterStats',
                'unitKerja',
                'conditionStats',
                'growth',
                'locations',
                'totalLokasiAset',
                'recentActivities',
                'activitySourceAvailable',
                'latestAssets',
                'updateTerakhir'
            )
        );
    }


    /*
    |--------------------------------------------------------------------------
    | DEFINISI ASET
    |--------------------------------------------------------------------------
    */

    private function assetDefinitions(): array
    {
        return [

            [
                'key' => 'tanah',
                'code' => 'KIB A',
                'label' => 'Tanah',
                'table' => 'tanahs',
                'quantity_column' => null,
                'icon' => 'map-pinned',
            ],

            [
                'key' => 'mesin',
                'code' => 'KIB B',
                'label' => 'Peralatan & Mesin',
                'table' => 'mesins',
                'quantity_column' => null,
                'icon' => 'cog',
            ],

            [
                'key' => 'gedung',
                'code' => 'KIB C',
                'label' => 'Gedung & Bangunan',
                'table' => 'gedungs',
                'quantity_column' => null,
                'icon' => 'building-2',
            ],

            [
                'key' => 'jalan',
                'code' => 'KIB D',
                'label' => 'Jalan, Irigasi & Jaringan',
                'table' => 'kib_d_s',
                'quantity_column' => null,
                'icon' => 'route',
            ],

            [
                'key' => 'aset_lainnya',
                'code' => 'KIB E',
                'label' => 'Aset Tetap Lainnya',
                'table' => 'kib_e_s',
                'quantity_column' => 'jumlah',
                'icon' => 'boxes',
            ],

            [
                'key' => 'konstruksi',
                'code' => 'KIB F',
                'label' => 'Konstruksi Dalam Pengerjaan',
                'table' => 'kib_f_s',
                'quantity_column' => null,
                'icon' => 'construction',
            ],

            [
                'key' => 'kir',
                'code' => 'K.I.R',
                'label' => 'Inventaris / Perangkat Kantor',
                'table' => 'kirs',
                'quantity_column' => 'jumlah',
                'icon' => 'clipboard-list',
            ],
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | LABEL KIB
    |--------------------------------------------------------------------------
    */

    private function availableKibLabels(): Collection
    {
        if (
            !$this->hasTable('aktivas')
            ||
            !$this->hasColumn(
                'aktivas',
                'kib'
            )
        ) {
            return collect();
        }


        return DB::table('aktivas')
            ->whereNotNull('kib')
            ->whereRaw(
                "BTRIM(kib) <> ''"
            )
            ->pluck('kib')
            ->map(
                fn($value) =>
                $this->normalizeText(
                    $value
                )
            )
            ->filter()
            ->unique()
            ->values();
    }


    private function groupKibLabels(
        Collection $labels,
        array $definitions
    ): array {
        $grouped = [];


        foreach (
            $definitions
            as
            $definition
        ) {

            $grouped[$definition['key']] = [];
        }


        foreach (
            $labels
            as
            $label
        ) {

            $key =
                $this->classifyKibLabel(
                    $label
                );


            if (
                $key !== null
                &&
                array_key_exists(
                    $key,
                    $grouped
                )
            ) {

                $grouped[$key][] =
                    $label;
            }
        }


        return $grouped;
    }


    private function classifyKibLabel(
        string $label
    ): ?string {
        $label =
            $this->normalizeText(
                $label
            );


        if ($label === '') {
            return null;
        }


        /*
         * KIR harus dicek dulu.
         */

        if (
            str_contains(
                $label,
                'K.I.R'
            )
            ||
            str_contains(
                $label,
                'KIR'
            )
            ||
            str_contains(
                $label,
                'INVENTARIS'
            )
            ||
            str_contains(
                $label,
                'PERANGKAT KANTOR'
            )
            ||
            str_contains(
                $label,
                'PERABOT KANTOR'
            )
        ) {
            return 'kir';
        }


        if (
            str_contains(
                $label,
                'ASET TETAP LAIN'
            )
        ) {
            return 'aset_lainnya';
        }


        if (
            str_contains(
                $label,
                'KONSTRUK'
            )
            ||
            str_contains(
                $label,
                'KONTRUK'
            )
        ) {
            return 'konstruksi';
        }


        if (
            str_contains(
                $label,
                'JALAN'
            )
            ||
            str_contains(
                $label,
                'IRIGASI'
            )
            ||
            str_contains(
                $label,
                'JARINGAN'
            )
        ) {
            return 'jalan';
        }


        if (
            str_contains(
                $label,
                'GEDUNG'
            )
            ||
            str_contains(
                $label,
                'BANGUNAN'
            )
        ) {
            return 'gedung';
        }


        if (
            str_contains(
                $label,
                'PERALATAN'
            )
            ||
            str_contains(
                $label,
                'MESIN'
            )
        ) {
            return 'mesin';
        }


        if (
            str_contains(
                $label,
                'TANAH'
            )
        ) {
            return 'tanah';
        }


        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | SAFE COUNT
    |--------------------------------------------------------------------------
    */

    private function safeCount(
        string $table
    ): int {
        if (
            !$this->hasTable(
                $table
            )
        ) {
            return 0;
        }


        return (int)
        DB::table(
            $table
        )
            ->count();
    }


    /*
    |--------------------------------------------------------------------------
    | QUANTITY
    |--------------------------------------------------------------------------
    */

    private function assetQuantity(
        array $definition
    ): int {
        $table =
            $definition['table'];


        if (
            !$this->hasTable(
                $table
            )
        ) {
            return 0;
        }


        $quantityColumn =
            $definition['quantity_column']
            ?? null;


        if (
            $quantityColumn
            &&
            $this->hasColumn(
                $table,
                $quantityColumn
            )
        ) {

            return (int)
            DB::table(
                $table
            )
                ->sum(
                    $quantityColumn
                );
        }


        return (int)
        DB::table(
            $table
        )
            ->count();
    }


    /*
    |--------------------------------------------------------------------------
    | TOTAL NILAI
    |--------------------------------------------------------------------------
    */

    private function sumAllNilaiAktiva(): float
    {
        if (
            !$this->hasTable(
                'nilai_aktivas'
            )
            ||
            !$this->hasColumn(
                'nilai_aktivas',
                'nilai'
            )
        ) {
            return 0;
        }


        return (float)
        DB::table(
            'nilai_aktivas'
        )
            ->sum(
                'nilai'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | NILAI KIR
    |--------------------------------------------------------------------------
    */

    private function sumKirValue(): float
    {
        if (
            !$this->hasTable(
                'kirs'
            )
        ) {
            return 0;
        }


        $hasNilai =
            $this->hasColumn(
                'kirs',
                'nilai'
            );


        $hasNilaiV =
            $this->hasColumn(
                'kirs',
                'nilai_v'
            );


        if (
            $hasNilaiV
            &&
            $hasNilai
        ) {

            return (float)
            DB::table(
                'kirs'
            )
                ->selectRaw(
                    '
                    COALESCE(
                        SUM(
                            COALESCE(
                                NULLIF(nilai_v, 0),
                                nilai,
                                0
                            )
                        ),
                        0
                    ) AS total
                    '
                )
                ->value(
                    'total'
                );
        }


        if ($hasNilaiV) {

            return (float)
            DB::table(
                'kirs'
            )
                ->sum(
                    'nilai_v'
                );
        }


        if ($hasNilai) {

            return (float)
            DB::table(
                'kirs'
            )
                ->sum(
                    'nilai'
                );
        }


        return 0;
    }


    /*
    |--------------------------------------------------------------------------
    | NILAI PER KIB
    |--------------------------------------------------------------------------
    */

    private function sumNilaiByKibLabels(
        array $labels
    ): float {
        if (
            empty($labels)
            ||
            !$this->hasTable(
                'nilai_aktivas'
            )
            ||
            !$this->hasTable(
                'aktivas'
            )
            ||
            !$this->hasColumn(
                'nilai_aktivas',
                'id_aktiva'
            )
        ) {
            return 0;
        }


        $query =
            DB::table(
                'nilai_aktivas as na'
            )
            ->join(
                'aktivas as a',
                'a.id',
                '=',
                'na.id_aktiva'
            );


        $this->whereNormalizedKibIn(
            $query,
            $labels
        );


        return (float)
        $query->sum(
            'na.nilai'
        );
    }


    private function whereNormalizedKibIn(
        Builder $query,
        array $labels
    ): void {
        $labels =
            array_values(
                array_unique(
                    array_filter(
                        array_map(
                            fn($label) =>
                            $this->normalizeText(
                                $label
                            ),
                            $labels
                        )
                    )
                )
            );


        if (empty($labels)) {

            $query->whereRaw(
                '1 = 0'
            );

            return;
        }


        $query->where(
            function (
                Builder $inner
            ) use (
                $labels
            ) {

                foreach (
                    $labels
                    as
                    $label
                ) {

                    $inner->orWhereRaw(
                        'UPPER(BTRIM(a.kib)) = ?',
                        [
                            $label
                        ]
                    );
                }
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | KONDISI
    |--------------------------------------------------------------------------
    */

    private function buildConditionStats(
        array $definitions
    ): array {
        $result = [

            'baik' => 0,

            'maintenance' => 0,

            'rusak' => 0,

            'unknown' => 0,

            'total' => 0,

            'source_total' => 0,

            'coverage_percent' => 0.0,

            'available' => false,
        ];


        foreach (
            $definitions
            as
            $definition
        ) {

            $table =
                $definition['table'];


            if (
                !$this->hasTable(
                    $table
                )
            ) {
                continue;
            }


            /*
             * Kondisi KIR.
             */

            if (
                $definition['key'] === 'kir'
                &&
                $this->hasColumn(
                    'kirs',
                    'baik'
                )
                &&
                $this->hasColumn(
                    'kirs',
                    'ringan'
                )
                &&
                $this->hasColumn(
                    'kirs',
                    'berat'
                )
            ) {

                $kirCondition =
                    DB::table(
                        'kirs'
                    )
                    ->selectRaw(
                        'COALESCE(SUM(baik), 0) AS baik'
                    )
                    ->selectRaw(
                        'COALESCE(SUM(ringan), 0) AS ringan'
                    )
                    ->selectRaw(
                        'COALESCE(SUM(berat), 0) AS berat'
                    )
                    ->first();


                $result['baik'] +=
                    (int) (
                        $kirCondition->baik
                        ?? 0
                    );


                $result['maintenance'] +=
                    (int) (
                        $kirCondition->ringan
                        ?? 0
                    );


                $result['rusak'] +=
                    (int) (
                        $kirCondition->berat
                        ?? 0
                    );


                continue;
            }


            if (
                !$this->hasColumn(
                    $table,
                    'kondisi'
                )
            ) {
                continue;
            }


            $quantityColumn =
                $definition['quantity_column']
                ?? null;


            $usesQuantity =
                $quantityColumn
                &&
                $this->hasColumn(
                    $table,
                    $quantityColumn
                );


            $query =
                DB::table(
                    $table
                )
                ->selectRaw(
                    "
                    UPPER(
                        BTRIM(
                            COALESCE(
                                kondisi,
                                ''
                            )
                        )
                    )
                    AS kondisi_normalized
                    "
                )
                ->groupByRaw(
                    "
                    UPPER(
                        BTRIM(
                            COALESCE(
                                kondisi,
                                ''
                            )
                        )
                    )
                    "
                );


            if ($usesQuantity) {

                $query->selectRaw(
                    'COALESCE(SUM('
                        .
                        $quantityColumn
                        .
                        '), 0) AS jumlah'
                );
            } else {

                $query->selectRaw(
                    'COUNT(*) AS jumlah'
                );
            }


            foreach (
                $query->get()
                as
                $row
            ) {

                $bucket =
                    $this->classifyCondition(
                        $row->kondisi_normalized
                            ?? ''
                    );


                $result[$bucket] +=
                    (int)
                    $row->jumlah;
            }
        }


        $result['total'] =
            $result['baik']
            +
            $result['maintenance']
            +
            $result['rusak'];


        $result['source_total'] =
            $result['total']
            +
            $result['unknown'];


        $result['available'] =
            $result['total']
            >
            0;


        if (
            $result['source_total']
            >
            0
        ) {

            $result['coverage_percent'] =
                round(
                    (
                        $result['total']
                        /
                        $result['source_total']
                    )
                        *
                        100,
                    1
                );
        }


        return $result;
    }


    private function classifyCondition(
        ?string $value
    ): string {
        $condition =
            $this->normalizeText(
                $value
            );


        if ($condition === '') {
            return 'unknown';
        }


        if (
            in_array(
                $condition,
                [
                    'B',
                    'BAIK',
                    'GOOD',
                    'NORMAL',
                    'LAYAK',
                ],
                true
            )
        ) {
            return 'baik';
        }


        if (
            in_array(
                $condition,
                [
                    'RR',
                    'RUSAK RINGAN',
                    'MAINTENANCE',
                    'PERLU PERHATIAN',
                    'PERLU PERBAIKAN',
                    'CUKUP',
                    'SEDANG',
                ],
                true
            )
        ) {
            return 'maintenance';
        }


        if (
            in_array(
                $condition,
                [
                    'RB',
                    'RUSAK',
                    'RUSAK BERAT',
                    'BAD',
                    'TIDAK LAYAK',
                ],
                true
            )
        ) {
            return 'rusak';
        }


        return 'unknown';
    }


    /*
    |--------------------------------------------------------------------------
    | PERTUMBUHAN NILAI ASET
    |--------------------------------------------------------------------------
    |
    | Data dari nilai_aktivas.
    |
    | Prioritas periode:
    |
    | 1. tahun
    | 2. created_at
    | 3. updated_at
    |
    */

    private function buildGrowthData(): array
    {
        if (
            !$this->hasTable(
                'nilai_aktivas'
            )
            ||
            !$this->hasColumn(
                'nilai_aktivas',
                'nilai'
            )
        ) {
            return [];
        }


        $nilaiPerTahun =
            [];


        /*
        |--------------------------------------------------------------------------
        | KOLOM TAHUN
        |--------------------------------------------------------------------------
        */

        if (
            $this->hasColumn(
                'nilai_aktivas',
                'tahun'
            )
        ) {

            $rows =
                DB::table(
                    'nilai_aktivas'
                )
                ->whereNotNull(
                    'nilai'
                )
                ->whereNotNull(
                    'tahun'
                )
                ->select([
                    'tahun',
                    'nilai',
                ])
                ->get();


            foreach (
                $rows
                as
                $row
            ) {

                $tahun =
                    $this->extractYear(
                        $row->tahun
                            ?? null
                    );


                if (
                    $tahun === null
                ) {
                    continue;
                }


                $nilaiPerTahun[$tahun] =
                    (
                        $nilaiPerTahun[$tahun]
                        ??
                        0
                    )
                    +
                    (float) (
                        $row->nilai
                        ?? 0
                    );
            }
        }


        /*
        |--------------------------------------------------------------------------
        | CREATED_AT
        |--------------------------------------------------------------------------
        */

        if (
            empty($nilaiPerTahun)
            &&
            $this->hasColumn(
                'nilai_aktivas',
                'created_at'
            )
        ) {

            $rows =
                DB::table(
                    'nilai_aktivas'
                )
                ->whereNotNull(
                    'nilai'
                )
                ->whereNotNull(
                    'created_at'
                )
                ->select([
                    'created_at',
                    'nilai',
                ])
                ->get();


            foreach (
                $rows
                as
                $row
            ) {

                try {

                    $tahun =
                        Carbon::parse(
                            $row->created_at
                        )
                        ->year;
                } catch (
                    \Throwable $e
                ) {

                    continue;
                }


                if (
                    $tahun < 1900
                    ||
                    $tahun > 2100
                ) {
                    continue;
                }


                $nilaiPerTahun[$tahun] =
                    (
                        $nilaiPerTahun[$tahun]
                        ??
                        0
                    )
                    +
                    (float) (
                        $row->nilai
                        ?? 0
                    );
            }
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATED_AT
        |--------------------------------------------------------------------------
        */

        if (
            empty($nilaiPerTahun)
            &&
            $this->hasColumn(
                'nilai_aktivas',
                'updated_at'
            )
        ) {

            $rows =
                DB::table(
                    'nilai_aktivas'
                )
                ->whereNotNull(
                    'nilai'
                )
                ->whereNotNull(
                    'updated_at'
                )
                ->select([
                    'updated_at',
                    'nilai',
                ])
                ->get();


            foreach (
                $rows
                as
                $row
            ) {

                try {

                    $tahun =
                        Carbon::parse(
                            $row->updated_at
                        )
                        ->year;
                } catch (
                    \Throwable $e
                ) {

                    continue;
                }


                if (
                    $tahun < 1900
                    ||
                    $tahun > 2100
                ) {
                    continue;
                }


                $nilaiPerTahun[$tahun] =
                    (
                        $nilaiPerTahun[$tahun]
                        ??
                        0
                    )
                    +
                    (float) (
                        $row->nilai
                        ?? 0
                    );
            }
        }


        if (
            empty($nilaiPerTahun)
        ) {
            return [];
        }


        ksort(
            $nilaiPerTahun,
            SORT_NUMERIC
        );


        /*
        |--------------------------------------------------------------------------
        | NILAI KUMULATIF
        |--------------------------------------------------------------------------
        */

        $growth =
            [];


        $nilaiKumulatif =
            0;


        foreach (
            $nilaiPerTahun
            as
            $tahun =>
            $nilaiTahunan
        ) {

            $nilaiTahunan =
                (float)
                $nilaiTahunan;


            $nilaiKumulatif +=
                $nilaiTahunan;


            $growth[] = [

                'tahun' =>
                (int)
                $tahun,

                'nilai' =>
                round(
                    $nilaiKumulatif,
                    2
                ),

                'tambahan' =>
                round(
                    $nilaiTahunan,
                    2
                ),
            ];
        }


        /*
        |--------------------------------------------------------------------------
        | 5 PERIODE TERBARU
        |--------------------------------------------------------------------------
        */

        if (
            count(
                $growth
            )
            >
            5
        ) {

            $growth =
                array_slice(
                    $growth,
                    -5
                );
        }


        return array_values(
            $growth
        );
    }


    private function extractYear(
        int $value
    ): ?int {
        $value =
            trim(
                (string)
                $value
            );


        if (
            $value === ''
        ) {
            return null;
        }


        if (
            !preg_match(
                '/\b(19\d{2}|20\d{2}|21\d{2})\b/',
                $value,
                $matches
            )
        ) {
            return null;
        }


        $tahun =
            (int)
            $matches[1];


        if (
            $tahun < 1900
            ||
            $tahun > 2100
        ) {
            return null;
        }


        return $tahun;
    }


    /*
    |--------------------------------------------------------------------------
    | LOKASI
    |--------------------------------------------------------------------------
    */

    private function buildLocationStats(
        array $definitions
    ): array {
        if (
            !$this->hasTable(
                'lokasis'
            )
        ) {

            return [

                'total' =>
                0,

                'items' =>
                [],
            ];
        }


        $counts =
            [];


        foreach (
            $definitions
            as
            $definition
        ) {

            $table =
                $definition['table'];


            if (
                !$this->hasTable(
                    $table
                )
                ||
                !$this->hasColumn(
                    $table,
                    'id_lokasi'
                )
            ) {
                continue;
            }


            $quantityColumn =
                $definition['quantity_column']
                ?? null;


            $usesQuantity =
                $quantityColumn
                &&
                $this->hasColumn(
                    $table,
                    $quantityColumn
                );


            $query =
                DB::table(
                    $table
                )
                ->whereNotNull(
                    'id_lokasi'
                )
                ->select(
                    'id_lokasi'
                )
                ->groupBy(
                    'id_lokasi'
                );


            if (
                $usesQuantity
            ) {

                $query->selectRaw(
                    'COALESCE(SUM('
                        .
                        $quantityColumn
                        .
                        '), 0) AS jumlah'
                );
            } else {

                $query->selectRaw(
                    'COUNT(*) AS jumlah'
                );
            }


            foreach (
                $query->get()
                as
                $row
            ) {

                $id =
                    (int)
                    $row->id_lokasi;


                if (
                    $id <= 0
                ) {
                    continue;
                }


                $counts[$id] =
                    (
                        $counts[$id]
                        ?? 0
                    )
                    +
                    (int)
                    $row->jumlah;
            }
        }


        if (
            empty($counts)
        ) {

            return [

                'total' =>
                0,

                'items' =>
                [],
            ];
        }


        arsort(
            $counts
        );


        $ids =
            array_slice(
                array_keys(
                    $counts
                ),
                0,
                16
            );


        $selects = [
            'id',
            'lokasi',
            'alamat',
        ];


        foreach (
            [
                'lat',
                'long',
                'wilayah',
            ]
            as
            $column
        ) {

            if (
                $this->hasColumn(
                    'lokasis',
                    $column
                )
            ) {

                $selects[] =
                    $column;
            }
        }


        $locationRows =
            DB::table(
                'lokasis'
            )
            ->whereIn(
                'id',
                $ids
            )
            ->select(
                $selects
            )
            ->get()
            ->keyBy(
                'id'
            );


        $items =
            [];


        foreach (
            $ids
            as
            $id
        ) {

            $location =
                $locationRows->get(
                    $id
                );


            if (!$location) {
                continue;
            }


            $items[] = [

                'id' =>
                (int)
                $location->id,

                'lokasi' =>
                trim(
                    (string)
                    $location->lokasi
                ),

                'alamat' =>
                trim(
                    (string)
                    $location->alamat
                ),

                'lat' =>
                isset(
                    $location->lat
                )
                    ?
                    trim(
                        (string)
                        $location->lat
                    )
                    :
                    null,

                'long' =>
                isset(
                    $location->long
                )
                    ?
                    trim(
                        (string)
                        $location->long
                    )
                    :
                    null,

                'jumlah' =>
                (int) (
                    $counts[$id]
                    ?? 0
                ),
            ];
        }


        return [

            'total' =>
            count(
                $counts
            ),

            'items' =>
            $items,
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | ASET TERBARU
    |--------------------------------------------------------------------------
    */

    private function buildLatestAssets(): array
    {
        if (
            !$this->hasTable(
                'nilai_aktivas'
            )
        ) {
            return [];
        }


        $query =
            DB::table(
                'nilai_aktivas as na'
            );


        $hasAktiva =
            $this->hasTable(
                'aktivas'
            )
            &&
            $this->hasColumn(
                'nilai_aktivas',
                'id_aktiva'
            );


        if ($hasAktiva) {

            $query->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                'na.id_aktiva'
            );
        }


        $hasLokasi =
            $this->hasTable(
                'lokasis'
            )
            &&
            $this->hasColumn(
                'nilai_aktivas',
                'id_lokasi'
            );


        if ($hasLokasi) {

            $query->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'na.id_lokasi'
            );
        }


        $query->select(
            'na.id'
        );


        foreach (
            [
                'nilai',
                'urai',
                'tahun',
                'created_at',
                'updated_at',
            ]
            as
            $column
        ) {

            if (
                $this->hasColumn(
                    'nilai_aktivas',
                    $column
                )
            ) {

                $query->addSelect(
                    'na.'
                        .
                        $column
                );
            }
        }


        if ($hasAktiva) {

            if (
                $this->hasColumn(
                    'aktivas',
                    'kode'
                )
            ) {

                $query->addSelect(
                    'a.kode as kode_aktiva'
                );
            }


            if (
                $this->hasColumn(
                    'aktivas',
                    'aktiva'
                )
            ) {

                $query->addSelect(
                    'a.aktiva as nama_aktiva'
                );
            }


            if (
                $this->hasColumn(
                    'aktivas',
                    'kib'
                )
            ) {

                $query->addSelect(
                    'a.kib'
                );
            }
        }


        if (
            $hasLokasi
            &&
            $this->hasColumn(
                'lokasis',
                'lokasi'
            )
        ) {

            $query->addSelect(
                'l.lokasi'
            );
        }


        if (
            $this->hasColumn(
                'nilai_aktivas',
                'created_at'
            )
        ) {

            $query->orderByDesc(
                'na.created_at'
            );
        } elseif (
            $this->hasColumn(
                'nilai_aktivas',
                'updated_at'
            )
        ) {

            $query->orderByDesc(
                'na.updated_at'
            );
        }


        $query->orderByDesc(
            'na.id'
        );


        return $query
            ->limit(
                5
            )
            ->get()
            ->map(
                function ($row) {

                    return [

                        'id' =>
                        (int) (
                            $row->id
                            ?? 0
                        ),

                        'nama' =>
                        $row->nama_aktiva
                            ??
                            $row->urai
                            ??
                            'Aset',

                        'kode' =>
                        $row->kode_aktiva
                            ??
                            '-',

                        'lokasi' =>
                        $row->lokasi
                            ??
                            '-',

                        'kib' =>
                        $row->kib
                            ??
                            '-',

                        'nilai' =>
                        isset(
                            $row->nilai
                        )
                            ?
                            (float)
                            $row->nilai
                            :
                            0,

                        'created_at' =>
                        $row->created_at
                            ??
                            $row->updated_at
                            ??
                            null,
                    ];
                }
            )
            ->all();
    }


    /*
    |--------------------------------------------------------------------------
    | ACTIVITY
    |--------------------------------------------------------------------------
    */

    private function buildRecentActivities(): array
    {
        if (
            !$this->hasTable(
                'master_data_activity_logs'
            )
        ) {
            return [];
        }


        $rows =
            DB::table(
                'master_data_activity_logs'
            )
            ->select([
                'id',
                'module',
                'record_id',
                'record_name',
                'record_code',
                'action',
                'created_at',
            ])
            ->orderByDesc(
                'created_at'
            )
            ->orderByDesc(
                'id'
            )
            ->limit(
                6
            )
            ->get();


        return $rows
            ->map(
                function ($row) {

                    $action =
                        strtolower(
                            trim(
                                (string)
                                $row->action
                            )
                        );


                    $module =
                        strtolower(
                            trim(
                                (string)
                                $row->module
                            )
                        );


                    return [

                        'id' =>
                        (int)
                        $row->id,

                        'module' =>
                        $module,

                        'module_label' =>
                        $this->moduleLabel(
                            $module
                        ),

                        'record_name' =>
                        trim(
                            (string)
                            $row->record_name
                        ),

                        'record_code' =>
                        $row->record_code
                            !==
                            null
                            ?
                            trim(
                                (string)
                                $row->record_code
                            )
                            :
                            null,

                        'action' =>
                        $action,

                        'action_label' =>
                        match ($action) {

                            'created' =>
                            'Ditambahkan',

                            'deleted' =>
                            'Dihapus',

                            'updated' =>
                            'Diperbarui',

                            default =>
                            'Aktivitas',
                        },

                        'icon' =>
                        match ($action) {

                            'created' =>
                            'circle-plus',

                            'deleted' =>
                            'trash-2',

                            'updated' =>
                            'square-pen',

                            default =>
                            'history',
                        },

                        'created_at' =>
                        $row->created_at,
                    ];
                }
            )
            ->all();
    }


    private function moduleLabel(
        string $module
    ): string {
        return match ($module) {

            'barang' =>
            'Barang',

            'departemen' =>
            'Departemen',

            'divisi' =>
            'Divisi',

            'ruangan' =>
            'Ruangan',

            'sdm',
            'sdm_pendukung' =>
            'SDM Pendukung',

            'lokasi' =>
            'Lokasi',

            'bahan' =>
            'Bahan',

            'aktiva',
            'kode_aktiva' =>
            'Kode Aktiva',

            default =>
            ucwords(
                str_replace(
                    [
                        '_',
                        '-',
                    ],
                    ' ',
                    $module
                )
            ),
        };
    }


    /*
    |--------------------------------------------------------------------------
    | LAST UPDATE
    |--------------------------------------------------------------------------
    */

    private function latestUpdateTimestamp(
        array $tables
    ): ?string {
        $latest =
            null;


        foreach (
            $tables
            as
            $table
        ) {

            if (
                !$this->hasTable(
                    $table
                )
            ) {
                continue;
            }


            $hasUpdated =
                $this->hasColumn(
                    $table,
                    'updated_at'
                );


            $hasCreated =
                $this->hasColumn(
                    $table,
                    'created_at'
                );


            if (
                !$hasUpdated
                &&
                !$hasCreated
            ) {
                continue;
            }


            if (
                $hasUpdated
                &&
                $hasCreated
            ) {

                $value =
                    DB::table(
                        $table
                    )
                    ->selectRaw(
                        '
                        MAX(
                            COALESCE(
                                updated_at,
                                created_at
                            )
                        )
                        AS latest
                        '
                    )
                    ->value(
                        'latest'
                    );
            } elseif (
                $hasUpdated
            ) {

                $value =
                    DB::table(
                        $table
                    )
                    ->max(
                        'updated_at'
                    );
            } else {

                $value =
                    DB::table(
                        $table
                    )
                    ->max(
                        'created_at'
                    );
            }


            if (!$value) {
                continue;
            }


            if (
                !$latest
                ||
                Carbon::parse(
                    $value
                )
                ->greaterThan(
                    Carbon::parse(
                        $latest
                    )
                )
            ) {

                $latest =
                    $value;
            }
        }


        return $latest;
    }


    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function normalizeText(
        string $value
    ): string {
        return strtoupper(
            trim(
                (string)
                $value
            )
        );
    }


    private function hasTable(
        string $table
    ): bool {
        if (
            !array_key_exists(
                $table,
                $this->tableExistsCache
            )
        ) {

            $this->tableExistsCache[$table] =
                Schema::hasTable(
                    $table
                );
        }


        return $this->tableExistsCache[$table];
    }


    private function hasColumn(
        string $table,
        string $column
    ): bool {
        $key =
            $table
            .
            '.'
            .
            $column;


        if (
            !array_key_exists(
                $key,
                $this->columnExistsCache
            )
        ) {

            $this->columnExistsCache[$key] =
                $this->hasTable(
                    $table
                )
                &&
                Schema::hasColumn(
                    $table,
                    $column
                );
        }


        return $this->columnExistsCache[$key];
    }
}
