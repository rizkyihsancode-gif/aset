<?php

namespace App\Http\Controllers;

use App\Services\KibNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class KibNotificationController extends Controller
{
    public function pending(
        string $module,
        KibNotificationService $service
    ): JsonResponse {

        $modules = config(
            'kib.modules',
            []
        );


        if (
            !array_key_exists(
                $module,
                $modules
            )
        ) {

            abort(
                404,
                'Modul K.I.B tidak ditemukan.'
            );
        }


        $cat =
            $service->categoryId(
                $module
            );


        if ($cat === null) {

            return response()->json([
                'success' =>
                true,

                'module' =>
                $module,

                'label' =>
                $modules[$module]['label'],

                'count' =>
                0,

                'aset_baru' =>
                0,

                'penambahan_nilai' =>
                0,

                'data' =>
                [],
            ]);
        }


        $rows = DB::table(
            'nilai_aktivas as n'
        )

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'n.id_lokasi'
            )

            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'n.dep'
            )

            ->leftJoin(
                'divisis as dv',
                'dv.id',
                '=',
                'n.div'
            )

            ->leftJoin(
                'golongans as g',
                'g.id',
                '=',
                'n.cat'
            )

            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )

            ->where(
                'n.stat',
                0
            )

            ->where(
                'n.cat',
                $cat
            )

            ->select([

                'n.id',

                'n.no_voucher',

                'n.tgl_voucher',

                'n.id_aktiva',

                'n.nilai',

                'n.urai',

                'n.tahun',

                'n.id_lokasi',

                'n.dep',

                'n.div',

                'n.cat',

                'n.stat',

                'n.jenisn',

                'l.lokasi',

                'l.alamat',

                'a.kode as aktiva_kode',

                'a.aktiva as aktiva_nama',

                DB::raw(
                    "
                    TRIM(
                        COALESCE(
                            d.nama_dep,
                            d.kode_dep,
                            ''
                        )
                    )
                    AS departemen
                    "
                ),

                DB::raw(
                    "
                    TRIM(
                        COALESCE(
                            dv.nama_div,
                            ''
                        )
                    )
                    AS divisi
                    "
                ),

                DB::raw(
                    "
                    TRIM(
                        COALESCE(
                            g.nama,
                            ''
                        )
                    )
                    AS golongan
                    "
                ),
            ])

            ->orderByDesc(
                'n.tgl_voucher'
            )

            ->orderByDesc(
                'n.id'
            )

            ->limit(1000)

            ->get();


        $data = $rows->map(
            function ($row) {

                $jenisLabel =
                    match ((int) $row->jenisn) {

                        1 =>
                        'Penambahan Aset',

                        2 =>
                        'Penambahan Nilai',

                        default =>
                        'Lainnya',
                    };


                return [

                    'id' =>
                    (int) $row->id,

                    'no_voucher' =>
                    $row->no_voucher
                        ?: '-',

                    'tgl_voucher' =>
                    $row->tgl_voucher,

                    'id_aktiva' =>
                    $row->id_aktiva,

                    'aktiva_kode' =>
                    $row->aktiva_kode
                        ?: '-',

                    'aktiva_nama' =>
                    $row->aktiva_nama
                        ?: '-',

                    'nilai' =>
                    (int) (
                        $row->nilai
                        ?? 0
                    ),

                    'nilai_label' =>
                    'Rp ' .
                        number_format(
                            (int) (
                                $row->nilai
                                ?? 0
                            ),
                            0,
                            ',',
                            '.'
                        ),

                    'urai' =>
                    $row->urai
                        ?: '-',

                    'tahun' =>
                    $row->tahun
                        ?: '-',

                    'id_lokasi' =>
                    $row->id_lokasi,

                    'lokasi' =>
                    $row->lokasi
                        ?: '-',

                    'alamat' =>
                    $row->alamat
                        ?: '-',

                    'dep' =>
                    $row->dep,

                    'departemen' =>
                    $row->departemen
                        ?: '-',

                    'div' =>
                    $row->div,

                    'divisi' =>
                    $row->divisi
                        ?: '-',

                    'cat' =>
                    $row->cat,

                    'golongan' =>
                    $row->golongan
                        ?: '-',

                    'jenisn' =>
                    (int) $row->jenisn,

                    'jenis_label' =>
                    $jenisLabel,
                ];
            }
        );


        return response()->json([

            'success' =>
            true,

            'module' =>
            $module,

            'label' =>
            $modules[$module]['label'],

            'category_id' =>
            $cat,

            'count' =>
            $data->count(),

            'aset_baru' =>
            $data
                ->where(
                    'jenisn',
                    1
                )
                ->count(),

            'penambahan_nilai' =>
            $data
                ->where(
                    'jenisn',
                    2
                )
                ->count(),

            'data' =>
            $data->values(),
        ]);
    }
}
