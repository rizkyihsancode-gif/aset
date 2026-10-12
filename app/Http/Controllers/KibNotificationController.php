<?php

namespace App\Http\Controllers;

use App\Services\KibNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class KibNotificationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | DATA NILAI ASET YANG BOLEH DIPILIH OLEH K.I.B
    |--------------------------------------------------------------------------
    |
    | Hanya:
    |
    | jenisn = 1 → Penambahan Aset
    | stat   = 0 → Belum diproses
    | cat          sesuai module
    |
    */

    public function pending(
        string $module,
        KibNotificationService $service
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | KONFIGURASI MODULE
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | CATEGORY MODULE
        |--------------------------------------------------------------------------
        */

        $cat =
            $service->categoryId(
                $module
            );


        if (
            $cat === null
        ) {

            return response()->json([

                'success' =>
                true,

                'module' =>
                $module,

                'label' =>
                $modules[$module]['label']
                    ?? ucfirst(
                        $module
                    ),

                'category_id' =>
                null,

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


        /*
        |--------------------------------------------------------------------------
        | QUERY
        |--------------------------------------------------------------------------
        */

        $rows = DB::table(
            'nilai_aktivas as n'
        )

            /*
            |--------------------------------------------------------------------------
            | LOKASI
            |--------------------------------------------------------------------------
            */

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'n.id_lokasi'
            )


            /*
            |--------------------------------------------------------------------------
            | DEPARTEMEN
            |--------------------------------------------------------------------------
            */

            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'n.dep'
            )


            /*
            |--------------------------------------------------------------------------
            | DIVISI
            |--------------------------------------------------------------------------
            */

            ->leftJoin(
                'divisis as dv',
                'dv.id',
                '=',
                'n.div'
            )


            /*
            |--------------------------------------------------------------------------
            | GOLONGAN
            |--------------------------------------------------------------------------
            */

            ->leftJoin(
                'golongans as g',
                'g.id',
                '=',
                'n.cat'
            )


            /*
            |--------------------------------------------------------------------------
            | AKTIVA
            |--------------------------------------------------------------------------
            */

            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )


            /*
            |--------------------------------------------------------------------------
            | BELUM DIPROSES
            |--------------------------------------------------------------------------
            */

            ->where(
                'n.stat',
                0
            )


            /*
            |--------------------------------------------------------------------------
            | HANYA PENAMBAHAN ASET
            |--------------------------------------------------------------------------
            */

            ->where(
                'n.jenisn',
                1
            )


            /*
            |--------------------------------------------------------------------------
            | SESUAI GOLONGAN
            |--------------------------------------------------------------------------
            */

            ->where(
                'n.cat',
                $cat
            )


            /*
            |--------------------------------------------------------------------------
            | DATA YANG DIKIRIM KE FRONTEND
            |--------------------------------------------------------------------------
            */

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

            ->limit(
                1000
            )

            ->get();


        /*
        |--------------------------------------------------------------------------
        | FORMAT JSON
        |--------------------------------------------------------------------------
        */

        $data = $rows->map(
            function ($row): array {

                return [

                    'id' =>
                    (int) $row->id,

                    'no_voucher' =>
                    $row->no_voucher
                        ?: '-',

                    'tgl_voucher' =>
                    $row->tgl_voucher,

                    'id_aktiva' =>
                    $row->id_aktiva !== null
                        ? (int) $row->id_aktiva
                        : null,

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
                    'Rp '
                        .
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
                    $row->id_lokasi !== null
                        ? (int) $row->id_lokasi
                        : null,

                    'lokasi' =>
                    $row->lokasi
                        ?: '-',

                    'alamat' =>
                    $row->alamat
                        ?: '-',

                    'dep' =>
                    $row->dep !== null
                        ? (int) $row->dep
                        : null,

                    'departemen' =>
                    $row->departemen
                        ?: '-',

                    'div' =>
                    $row->div !== null
                        ? (int) $row->div
                        : null,

                    'divisi' =>
                    $row->divisi
                        ?: '-',

                    'cat' =>
                    $row->cat !== null
                        ? (int) $row->cat
                        : null,

                    'golongan' =>
                    $row->golongan
                        ?: '-',

                    /*
                     * Endpoint ini hanya mengirim
                     * Penambahan Aset.
                     */
                    'jenisn' =>
                    1,

                    'jenis_label' =>
                    'Penambahan Aset',

                    'stat' =>
                    (int) (
                        $row->stat
                        ?? 0
                    ),
                ];
            }
        );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' =>
            true,

            'module' =>
            $module,

            'label' =>
            $modules[$module]['label']
                ?? ucfirst(
                    $module
                ),

            'category_id' =>
            (int) $cat,

            'count' =>
            $data->count(),

            /*
             * Seluruh data adalah Penambahan Aset.
             */
            'aset_baru' =>
            $data->count(),

            /*
             * Penambahan Nilai tidak masuk endpoint K.I.B.
             */
            'penambahan_nilai' =>
            0,

            'data' =>
            $data
                ->values(),
        ]);
    }
}
