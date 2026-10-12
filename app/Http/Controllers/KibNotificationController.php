<?php

namespace App\Http\Controllers;

use App\Services\KibNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class KibNotificationController extends Controller
{
    /**
     * ============================================================
     * DATA PENDING K.I.B
     * ============================================================
     *
     * Data lama dan baru:
     *   stat = 0 → masuk pending K.I.B
     *   cat      → menentukan module
     *
     * Penambahan Nilai yang BARU disimpan stat = 1,
     * jadi tidak akan masuk ke sini.
     */
    public function pending(
        string $module,
        KibNotificationService $service
    ): JsonResponse {
        // --------------------------------------------------------
        // 01. VALIDASI MODULE
        // --------------------------------------------------------
        $modules = config('kib.modules', []);

        abort_unless(
            array_key_exists($module, $modules),
            404,
            'Modul K.I.B tidak ditemukan.'
        );

        $moduleConfig = $modules[$module];
        $cat = $service->categoryId($module);

        // --------------------------------------------------------
        // 02. RESPONSE JIKA CATEGORY TIDAK DITEMUKAN
        // --------------------------------------------------------
        if ($cat === null) {
            return response()->json([
                'success' => true,
                'module' => $module,
                'label' => $moduleConfig['label'] ?? ucfirst($module),
                'category_id' => null,
                'count' => 0,
                'aset_baru' => 0,
                'penambahan_nilai' => 0,
                'data' => [],
            ]);
        }

        // --------------------------------------------------------
        // 03. QUERY DASAR PENDING
        // --------------------------------------------------------
        //
        // Jangan tambahkan where('jenisn', 1) di sini,
        // karena akan menyembunyikan histori web lama.
        //
        $pending = DB::table('nilai_aktivas')
            ->where('stat', 0)
            ->where('cat', $cat);

        // Jumlah seluruh data untuk badge dan response.
        $totalPending = (clone $pending)->count();

        // Jumlah per jenis untuk badge rincian.
        $jenisCounts = (clone $pending)
            ->selectRaw(
                'COALESCE(jenisn, 0) AS jenis, COUNT(*) AS total'
            )
            ->groupBy('jenisn')
            ->pluck('total', 'jenis');

        // --------------------------------------------------------
        // 04. QUERY DETAIL TRANSAKSI
        // --------------------------------------------------------
        $rows = DB::table('nilai_aktivas as n')
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
            ->where('n.cat', $cat)
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

        // --------------------------------------------------------
        // 05. FORMAT DATA AGAR SESUAI DENGAN TANAH.JS
        // --------------------------------------------------------
        $data = $rows->map(function ($row): array {
            $jenis = (int) ($row->jenisn ?? 0);

            $jenisLabel = match ($jenis) {
                1 => 'Penambahan Aset',
                2 => 'Penambahan Nilai (data lama)',
                default => 'Jenis lama / tidak ditentukan',
            };

            return [
                'id' => (int) $row->id,

                // Voucher.
                'no_voucher' => $row->no_voucher ?: '-',
                'tgl_voucher' => $row->tgl_voucher,

                // Kode Aktiva.
                'id_aktiva' => $row->id_aktiva !== null
                    ? (int) $row->id_aktiva
                    : null,

                'aktiva_kode' => $row->aktiva_kode ?: '-',
                'aktiva_nama' => $row->aktiva_nama ?: '-',

                // Nominal.
                'nilai' => (int) ($row->nilai ?? 0),

                'nilai_label' => 'Rp ' . number_format(
                    (int) ($row->nilai ?? 0),
                    0,
                    ',',
                    '.'
                ),

                // Uraian dan tahun.
                'urai' => $row->urai ?: '-',
                'tahun' => $row->tahun ?: '-',

                // Lokasi dan alamat.
                'id_lokasi' => $row->id_lokasi !== null
                    ? (int) $row->id_lokasi
                    : null,

                'lokasi' => $row->lokasi ?: '-',
                'alamat' => $row->alamat ?: '-',

                // Departemen.
                'dep' => $row->dep !== null
                    ? (int) $row->dep
                    : null,

                'departemen' => $row->departemen ?: '-',

                // Divisi.
                'div' => $row->div !== null
                    ? (int) $row->div
                    : null,

                'divisi' => $row->divisi ?: '-',

                // Golongan.
                'cat' => $row->cat !== null
                    ? (int) $row->cat
                    : null,

                'golongan' => $row->golongan ?: '-',

                // Jenis dan status.
                'jenisn' => $jenis,
                'jenis_label' => $jenisLabel,
                'stat' => (int) ($row->stat ?? 0),
            ];
        });

        // --------------------------------------------------------
        // 06. RESPONSE JSON
        // --------------------------------------------------------
        return response()->json([
            'success' => true,
            'module' => $module,

            'label' => $moduleConfig['label']
                ?? ucfirst($module),

            'category_id' => (int) $cat,

            // Count seluruh transaksi, tidak dibatasi limit tabel.
            'count' => $totalPending,

            // Rincian jenis transaksi.
            'aset_baru' => (int) ($jenisCounts[1] ?? 0),
            'penambahan_nilai' => (int) ($jenisCounts[2] ?? 0),

            // Maksimal 1000 baris untuk tampilan modal.
            'data' => $data->values(),
        ]);
    }
}
