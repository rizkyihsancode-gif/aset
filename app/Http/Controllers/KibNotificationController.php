<?php

namespace App\Http\Controllers;

use App\Services\KibNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class KibNotificationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | PENDING NILAI ASET PER MODULE K.I.B
    |--------------------------------------------------------------------------
    |
    | Khusus Tanah:
    | - stat = 0
    | - jenisn = 1 atau 2 (termasuk histori)
    | - cat sesuai konfigurasi Tanah
    |
    | Transaksi baru Penambahan Nilai disimpan dengan stat=1,
    | jadi tidak muncul pada endpoint ini.
    |
    */

    public function pending(
        string $module,
        KibNotificationService $service
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | 01. VALIDASI MODULE
        |--------------------------------------------------------------------------
        */

        $modules = config('kib.modules', []);

        abort_unless(
            array_key_exists($module, $modules),
            404,
            'Modul K.I.B tidak ditemukan.'
        );

        $cat = $service->categoryId($module);

        $label = $modules[$module]['label']
            ?? ucfirst($module);

        /*
        |--------------------------------------------------------------------------
        | 02. CATEGORY TIDAK DITEMUKAN
        |--------------------------------------------------------------------------
        */

        if ($cat === null) {
            return response()->json([
                'success' => true,
                'module' => $module,
                'label' => $label,
                'category_id' => null,

                'count' => 0,
                'aset_baru' => 0,
                'penambahan_nilai' => 0,
                'pending_inventaris' => 0,

                'data' => [],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | 03. QUERY DASAR
        |--------------------------------------------------------------------------
        */

        $base = DB::table('nilai_aktivas')
            ->where('stat', 0)
            ->where('cat', $cat);

        /*
        |--------------------------------------------------------------------------
        | 04. FILTER KHUSUS TANAH
        |--------------------------------------------------------------------------
        |
        | Transaksi jenisn 1 dan 2 masih dapat ditampilkan
        | bila belum diproses (stat=0).
        |
        | Jenis lain tidak dimasukkan.
        |
        */

        if ($module === 'tanah') {
            $base->whereIn('jenisn', [1, 2]);
        }

        if ($module === 'gedung') {
            $base->where('jenisn', 1);
        }

        /*
        |--------------------------------------------------------------------------
        | 05. JUMLAH DATA PENDING
        |--------------------------------------------------------------------------
        */

        $total = (clone $base)->count();

        $jenisCounts = (clone $base)
            ->selectRaw('jenisn, COUNT(*) AS total')
            ->groupBy('jenisn')
            ->pluck('total', 'jenisn');

        /*
        |--------------------------------------------------------------------------
        | 06. QUERY DATA UNTUK MODAL K.I.B
        |--------------------------------------------------------------------------
        */

        $query = DB::table('nilai_aktivas as n')
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
            ->where('n.stat', 0)
            ->where('n.cat', $cat);

        if ($module === 'tanah') {
            $query->whereIn('n.jenisn', [1, 2]);
        }

        if ($module === 'gedung') {
            $query->where('n.jenisn', 1);
        }

        /*
        |--------------------------------------------------------------------------
        | 07. SELECT DAN URUTKAN
        |--------------------------------------------------------------------------
        */

        $rows = $query
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

                DB::raw("
                    TRIM(
                        COALESCE(
                            d.nama_dep,
                            d.kode_dep,
                            ''
                        )
                    ) AS departemen
                "),

                DB::raw("
                    TRIM(
                        COALESCE(
                            dv.nama_div,
                            ''
                        )
                    ) AS divisi
                "),

                DB::raw("
                    TRIM(
                        COALESCE(
                            g.nama,
                            ''
                        )
                    ) AS golongan
                "),
            ])
            ->orderByDesc('n.tgl_voucher')
            ->orderByDesc('n.id')
            ->limit(1000)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | 08. FORMAT RESPONSE UNTUK TANAH.JS
        |--------------------------------------------------------------------------
        */

        $data = $rows->map(function ($row): array {
            $jenis = (int) ($row->jenisn ?? 0);

            $jenisLabel = match ($jenis) {
                1 => 'Penambahan Aset',
                2 => 'Penambahan Nilai (data lama)',
                default => 'Jenis tidak ditentukan',
            };

            return [
                /*
                |--------------------------------------------------------------------------
                | IDENTITAS TRANSAKSI
                |--------------------------------------------------------------------------
                */

                'id' => (int) $row->id,

                'no_voucher' => $row->no_voucher ?: '-',

                'tgl_voucher' => $row->tgl_voucher,

                /*
                |--------------------------------------------------------------------------
                | KODE AKTIVA
                |--------------------------------------------------------------------------
                */

                'id_aktiva' => $row->id_aktiva !== null
                    ? (int) $row->id_aktiva
                    : null,

                'aktiva_kode' => $row->aktiva_kode ?: '-',

                'aktiva_nama' => $row->aktiva_nama ?: '-',

                /*
                |--------------------------------------------------------------------------
                | NILAI DAN URAIAN
                |--------------------------------------------------------------------------
                */

                'nilai' => (int) ($row->nilai ?? 0),

                'nilai_label' => 'Rp ' . number_format(
                    (int) ($row->nilai ?? 0),
                    0,
                    ',',
                    '.'
                ),

                'urai' => $row->urai ?: '-',

                'tahun' => $row->tahun ?: '-',

                /*
                |--------------------------------------------------------------------------
                | LOKASI
                |--------------------------------------------------------------------------
                */

                'id_lokasi' => $row->id_lokasi !== null
                    ? (int) $row->id_lokasi
                    : null,

                'lokasi' => $row->lokasi ?: '-',

                'alamat' => $row->alamat ?: '-',

                /*
                |--------------------------------------------------------------------------
                | DEPARTEMEN
                |--------------------------------------------------------------------------
                */

                'dep' => $row->dep !== null
                    ? (int) $row->dep
                    : null,

                'departemen' => $row->departemen ?: '-',

                /*
                |--------------------------------------------------------------------------
                | DIVISI
                |--------------------------------------------------------------------------
                */

                'div' => $row->div !== null
                    ? (int) $row->div
                    : null,

                'divisi' => $row->divisi ?: '-',

                /*
                |--------------------------------------------------------------------------
                | GOLONGAN
                |--------------------------------------------------------------------------
                */

                'cat' => $row->cat !== null
                    ? (int) $row->cat
                    : null,

                'golongan' => $row->golongan ?: '-',

                /*
                |--------------------------------------------------------------------------
                | JENIS DAN STATUS ASLI
                |--------------------------------------------------------------------------
                */

                'jenisn' => $jenis,

                'jenis_label' => $jenisLabel,

                'stat' => (int) ($row->stat ?? 0),
            ];
        });

        /*
        |--------------------------------------------------------------------------
        | 09. JSON RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'module' => $module,

            'label' => $label,

            'category_id' => (int) $cat,

            'count' => $total,

            'aset_baru' => (int) ($jenisCounts[1] ?? 0),

            'penambahan_nilai' => (int) ($jenisCounts[2] ?? 0),

            'pending_inventaris' => $total,

            'data' => $data->values(),
        ]);
    }
}
