<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use App\Services\KibNotificationService;
use App\Services\KibVoucherLinkService;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;


class KIBController extends Controller
{
    /*
        |--------------------------------------------------------------------------
        | HALAMAN UTAMA TANAH
        |--------------------------------------------------------------------------
        |
        | SATU BARIS = SATU LOKASI
        |
        */

    public function dataTanah()
    {
        $requiredTables = [
            'tanahs',
            'lokasis',
            'barangs',
            'nilai_aktivas',
            'aktivas',
        ];


        foreach ($requiredTables as $table) {

            if (!Schema::hasTable($table)) {

                throw new \RuntimeException(
                    "Tabel {$table} tidak ditemukan."
                );
            }
        }


        /*
            |--------------------------------------------------------------------------
            | NILAI TANAH PER LOKASI
            |--------------------------------------------------------------------------
            |
            | Hanya nilai aktiva dengan KIB = TANAH.
            |
            */

        $nilaiPerLokasi = DB::table('nilai_aktivas as na')

            ->join(
                'aktivas as a',
                'a.id',
                '=',
                'na.id_aktiva'
            )

            ->select(
                'na.id_lokasi'
            )

            ->selectRaw(
                'COALESCE(SUM(na.nilai), 0) AS nilai_tanah'
            )

            ->selectRaw(
                'COUNT(na.id) AS jumlah_transaksi_nilai'
            )

            ->whereNotNull(
                'na.id_lokasi'
            )

            ->whereRaw(
                "TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)",
                ['TANAH', 'KIB A TANAH']
            )

            ->groupBy(
                'na.id_lokasi'
            );


        /*
            |--------------------------------------------------------------------------
            | DAFTAR TANAH
            |--------------------------------------------------------------------------
            |
            | Group berdasarkan id_lokasi.
            |
            */

        $tanahs = DB::table('tanahs as t')

            ->join(
                'lokasis as l',
                'l.id',
                '=',
                't.id_lokasi'
            )

            ->leftJoinSub(
                $nilaiPerLokasi,
                'nl',
                function ($join) {

                    $join->on(
                        'nl.id_lokasi',
                        '=',
                        't.id_lokasi'
                    );
                }
            )

            ->select(
                't.id_lokasi'
            )

            ->selectRaw(
                'MIN(t.id) AS id'
            )

            ->selectRaw(
                'MIN(l.lokasi) AS lokasi'
            )

            ->selectRaw(
                'BTRIM(MIN(l.alamat)) AS alamat'
            )

            /*
                |--------------------------------------------------------------------------
                | GAMBAR DARI LOKASIS
                |--------------------------------------------------------------------------
                */

            ->selectRaw(
                'MIN(l.img) AS lokasi_img'
            )

            ->selectRaw(
                'MIN(t.guna) AS guna_ringkas'
            )

            // Satu baris tabel = satu lokasi. Beri label Campuran bila sertifikat
            // dalam satu lokasi memiliki kategori kepemilikan berbeda.
            ->selectRaw("CASE
                WHEN COUNT(DISTINCT COALESCE(NULLIF(BTRIM(t.status_kepemilikan), ''), '__belum__')) > 1
                    THEN 'campuran'
                ELSE COALESCE(MAX(NULLIF(BTRIM(t.status_kepemilikan), '')), '')
                END AS status_kepemilikan_ringkas")

            ->selectRaw(
                'MIN(t.tahun) AS tahun_awal'
            )

            ->selectRaw(
                'MAX(t.tahun) AS tahun_akhir'
            )

            ->selectRaw(
                'COUNT(DISTINCT t.id) AS jumlah_data_tanah'
            )

            ->selectRaw(
                '
                        COALESCE(
                            MAX(nl.nilai_tanah),
                            0
                        )
                        AS nilai_tanah
                    '
            )

            ->selectRaw(
                '
                        COALESCE(
                            MAX(nl.jumlah_transaksi_nilai),
                            0
                        )
                        AS jumlah_transaksi_nilai
                    '
            )

            ->groupBy(
                't.id_lokasi'
            )

            // Urutan lokasi mengikuti ID sertifikat yang paling baru dimasukkan.
            // Menambah data di lokasi lama juga menaikkan lokasi tersebut ke atas.
            ->orderByRaw('MAX(t.id) DESC')
            ->orderByRaw('MIN(l.lokasi) ASC')

            ->get();


        /*
            |--------------------------------------------------------------------------
            | KPI
            |--------------------------------------------------------------------------
            */

        $totalLokasiTanah =
            $tanahs->count();


        $totalDataTanah =
            DB::table('tanahs')
            ->count();


        /*
            |--------------------------------------------------------------------------
            | TOTAL LUAS
            |--------------------------------------------------------------------------
            */

        $totalLuasTanah =
            DB::table('tanahs')

            ->pluck(
                'luas_sertifikat'
            )

            ->sum(
                fn($value) =>
                $this->parseLegacyNumber(
                    $value
                )
            );


        /*
            |--------------------------------------------------------------------------
            | TOTAL NILAI
            |--------------------------------------------------------------------------
            */

        $totalNilaiTanah =
            (float) DB::table('nilai_aktivas as na')

                ->join(
                    'aktivas as a',
                    'a.id',
                    '=',
                    'na.id_aktiva'
                )

                ->whereRaw(
                    "TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)",
                    ['TANAH', 'KIB A TANAH']
                )

                ->sum(
                    'na.nilai'
                );


        /*
            |--------------------------------------------------------------------------
            | UPDATE TERAKHIR
            |--------------------------------------------------------------------------
            */

        $updateTerakhirLabel =
            'Belum ada data';


        $updateTerakhirDetail =
            'Belum ada perubahan';


        $latestTimestamp =
            null;


        $hasCreated =
            Schema::hasColumn(
                'tanahs',
                'created_at'
            );


        $hasUpdated =
            Schema::hasColumn(
                'tanahs',
                'updated_at'
            );


        if (
            $hasCreated
            &&
            $hasUpdated
        ) {

            $latestTimestamp =
                DB::table('tanahs')

                ->selectRaw(
                    '
                            MAX(
                                COALESCE(
                                    updated_at,
                                    created_at
                                )
                            ) AS latest
                            '
                )

                ->value(
                    'latest'
                );
        } elseif ($hasUpdated) {

            $latestTimestamp =
                DB::table('tanahs')
                ->max(
                    'updated_at'
                );
        } elseif ($hasCreated) {

            $latestTimestamp =
                DB::table('tanahs')
                ->max(
                    'created_at'
                );
        }


        if ($latestTimestamp) {

            $latest =
                Carbon::parse(
                    $latestTimestamp
                );


            $updateTerakhirLabel =
                $latest
                ->locale('id')
                ->diffForHumans();


            $updateTerakhirDetail =
                $latest
                ->locale('id')
                ->translatedFormat(
                    'd M Y, H:i'
                )
                .
                ' WITA';
        }


        // Master barang asli untuk dropdown Create/Edit.
        $barangRows = DB::table('barangs')
            ->select(
                'id',
                'nama_barang',
                'kode_barang'
            )
            ->where('status', 'aktif')
            ->orderBy('nama_barang')
            ->get();

        // PDF per lokasi; satu lokasi dapat memiliki beberapa sertifikat.
        $pdfLokasi = DB::table('pdfs as p')
            ->join('tanahs as t', 't.id', '=', 'p.id_tanah')
            ->whereRaw("LOWER(BTRIM(p.gol)) IN ('tanah','kib a','a','1')")
            ->select('t.id_lokasi')
            ->selectRaw('COUNT(p.id) AS jumlah_pdf')
            ->groupBy('t.id_lokasi')
            ->pluck('jumlah_pdf', 'id_lokasi');

        // PDF yang diunggah langsung dari halaman Nilai Aset juga dihitung.
        $pdfNilaiLokasi = collect();
        if (Schema::hasColumn('nilai_aktivas', 'dokumen_pdf')) {
            $pdfNilaiLokasi = DB::table('nilai_aktivas as n')
                ->join('aktivas as a', 'a.id', '=', 'n.id_aktiva')
                ->whereRaw("TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)", ['TANAH', 'KIB A TANAH'])
                ->whereNotNull('n.dokumen_pdf')
                ->whereRaw("BTRIM(n.dokumen_pdf) <> ''")
                ->select('n.id_lokasi')
                ->selectRaw('COUNT(n.id) AS jumlah_pdf')
                ->groupBy('n.id_lokasi')
                ->pluck('jumlah_pdf', 'id_lokasi');
        }

        $pdfLampiranLokasi = DB::table('tanah_lampirans as tl')
            ->join('tanahs as t', 't.id', '=', 'tl.tanah_id')
            ->where('tl.jenis', 'pdf')
            ->select('t.id_lokasi')
            ->selectRaw('COUNT(tl.id) AS jumlah_pdf')
            ->groupBy('t.id_lokasi')
            ->pluck('jumlah_pdf', 'id_lokasi');

        $tanahs->each(function ($row) use ($pdfLokasi, $pdfNilaiLokasi, $pdfLampiranLokasi) {
            $row->pdf_count = (int) ($pdfLokasi[$row->id_lokasi] ?? 0)
                + (int) ($pdfNilaiLokasi[$row->id_lokasi] ?? 0)
                + (int) ($pdfLampiranLokasi[$row->id_lokasi] ?? 0);
        });

        // Pilihan seluruh Master Lokasi untuk Tambah Langsung global.
        // Pilihan diambil dari Master Lokasi, bukan voucher Pending.
        $pilihanLokasiTanah = DB::table('lokasis')
            ->select('id', 'lokasi', 'alamat')
            ->orderBy('lokasi')
            ->get();

        return view(
            'kib.tanah',
            compact(
                'tanahs',
                'pilihanLokasiTanah',
                'barangRows',
                'totalLokasiTanah',
                'totalDataTanah',
                'totalLuasTanah',
                'totalNilaiTanah',
                'updateTerakhirLabel',
                'updateTerakhirDetail'
            )
        );
    }


    /*
        |--------------------------------------------------------------------------
        | DETAIL TANAH PER LOKASI
        |--------------------------------------------------------------------------
        */

    public function detailTanahLokasi(int $id)
    {
        /*
            |--------------------------------------------------------------------------
            | LOKASI
            |--------------------------------------------------------------------------
            */

        $lokasi = DB::table('lokasis as l')

            ->select(
                'l.id',
                'l.lokasi',
                'l.alamat',
                'l.img'
            )

            ->where(
                'l.id',
                $id
            )

            ->first();


        if (!$lokasi) {

            return response()->json([
                'success' => false,
                'message' => 'Lokasi tanah tidak ditemukan.',
            ], 404);
        }


        /*
            |--------------------------------------------------------------------------
            | SEMUA DATA TANAH PADA LOKASI
            |--------------------------------------------------------------------------
            */

        $items = DB::table('tanahs as t')

            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                't.id_barang'
            )

            ->where(
                't.id_lokasi',
                $id
            )

            ->select(
                't.id',
                't.id_lokasi',
                't.id_barang',

                't.guna',
                't.tahun',

                't.no_tunjuk',
                't.tgl_tunjuk',
                't.luas_tunjuk',

                't.sertifikat',
                't.tgl_sertifikat',
                't.luas_sertifikat',

                't.no_gambar',
                't.tgl_gambar',
                't.luas_gambar',

                't.hak',
                't.asal',
                't.pemilik',
                't.ket',

                't.nilai',
                't.nilai_now'
            )

            ->selectRaw(
                'BTRIM(b.nama_barang) AS nama_barang'
            )

            ->selectRaw(
                'BTRIM(b.kode_barang) AS kode_barang'
            )

            ->orderBy(
                't.id',
                'DESC'
            )

            ->get();


        /*
            |--------------------------------------------------------------------------
            | URL GAMBAR
            |--------------------------------------------------------------------------
            |
            | Gambar hanya berasal dari:
            |
            | lokasis.img
            |
            | bukan dari tanahs.
            |
            */

        $imageUrl =
            null;


        if (
            $lokasi->img !== null
            &&
            trim(
                (string) $lokasi->img
            ) !== ''
        ) {

            /*
                * Kalau DB berisi URL lengkap.
                */

            $rawImage =
                trim(
                    (string) $lokasi->img
                );


            if (
                str_starts_with(
                    $rawImage,
                    'http://'
                )
                ||
                str_starts_with(
                    $rawImage,
                    'https://'
                )
            ) {

                $imageUrl =
                    $rawImage;
            } else {

                /*
                    * Semua gambar lokal dilayani melalui Laravel.
                    */

                $imageUrl =
                    route(
                        'kib.tanah.image',
                        [
                            'id' =>
                            $lokasi->id
                        ]
                    );
            }
        }


        return response()->json([

            'success' =>
            true,


            'lokasi' => [

                'id' =>
                $lokasi->id,

                'lokasi' =>
                trim(
                    (string) $lokasi->lokasi
                ),

                'alamat' =>
                trim(
                    (string) $lokasi->alamat
                ),

                /*
                    |--------------------------------------------------------------------------
                    | RAW DB VALUE
                    |--------------------------------------------------------------------------
                    */

                'img' =>
                $lokasi->img,


                /*
                    |--------------------------------------------------------------------------
                    | URL YANG DIGUNAKAN BROWSER
                    |--------------------------------------------------------------------------
                    */

                'image_url' =>
                $imageUrl,

            ],


            'jumlah' =>
            $items->count(),


            'data' =>
            $items,

        ]);
    }


    /*
        |--------------------------------------------------------------------------
        | ENDPOINT GAMBAR LOKASI
        |--------------------------------------------------------------------------
        |
        | Browser:
        |
        | /kib/tanah/lokasi/12/gambar
        |
        |        ↓
        |
        | baca lokasis.img
        |
        |        ↓
        |
        | cari file
        |
        |        ↓
        |
        | Laravel response()->file()
        |
        */

    public function gambarTanahLokasi(int $id)
    {
        $lokasi = DB::table('lokasis')

            ->select(
                'id',
                'lokasi',
                'img'
            )

            ->where(
                'id',
                $id
            )

            ->first();


        if (!$lokasi) {

            abort(
                404,
                'Lokasi tidak ditemukan.'
            );
        }


        $rawImage =
            trim(
                (string) (
                    $lokasi->img
                    ??
                    ''
                )
            );


        if (
            $rawImage === ''
        ) {

            abort(
                404,
                'Lokasi tidak mempunyai gambar.'
            );
        }


        /*
            |--------------------------------------------------------------------------
            | URL EXTERNAL
            |--------------------------------------------------------------------------
            */

        if (
            str_starts_with(
                $rawImage,
                'http://'
            )
            ||
            str_starts_with(
                $rawImage,
                'https://'
            )
        ) {

            return redirect()
                ->away(
                    $rawImage
                );
        }


        /*
            |--------------------------------------------------------------------------
            | CARI FILE FISIK
            |--------------------------------------------------------------------------
            */

        $path =
            $this->resolveLokasiImageAbsolutePath(
                $rawImage
            );


        if (
            !$path
            ||
            !File::exists($path)
        ) {

            abort(
                404,
                'File gambar lokasi tidak ditemukan.'
            );
        }


        /*
            |--------------------------------------------------------------------------
            | RETURN IMAGE
            |--------------------------------------------------------------------------
            */

        return response()
            ->file(
                $path,
                [
                    'Cache-Control' =>
                    'public, max-age=3600'
                ]
            );
    }


    /*
        |--------------------------------------------------------------------------
        | DETAIL NILAI TANAH
        |--------------------------------------------------------------------------
        */

    public function detailNilaiTanahLokasi(int $id)
    {
        $lokasi = DB::table('lokasis as l')

            ->select(
                'l.id',
                'l.lokasi'
            )

            ->selectRaw(
                'BTRIM(l.alamat) AS alamat'
            )

            ->where(
                'l.id',
                $id
            )

            ->first();


        if (!$lokasi) {

            return response()->json([
                'success' => false,
                'message' => 'Lokasi tanah tidak ditemukan.',
            ], 404);
        }


        /*
            |--------------------------------------------------------------------------
            | NILAI KHUSUS TANAH
            |--------------------------------------------------------------------------
            */

        $nilaiAktivas = DB::table(
            'nilai_aktivas as na'
        )

            ->join(
                'aktivas as a',
                'a.id',
                '=',
                'na.id_aktiva'
            )

            ->where(
                'na.id_lokasi',
                $id
            )

            ->whereRaw(
                "TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)",
                ['TANAH', 'KIB A TANAH']
            )

            ->select(
                'na.id',
                'na.no_voucher',
                'na.tgl_voucher',
                'na.id_aktiva',

                'a.kode as kode_aktiva',
                'a.aktiva as nama_aktiva',
                'a.kib',

                'na.nilai',
                'na.urai',
                'na.tahun',
                'na.dep',
                'na.div',
                'na.cat',
                'na.stat',
                'na.jenisn'
            )

            ->orderByRaw(
                '
                    CASE
                        WHEN na.tgl_voucher IS NULL
                        THEN 1
                        ELSE 0
                    END ASC
                    '
            )

            ->orderByDesc(
                'na.tgl_voucher'
            )

            ->orderByDesc(
                'na.id'
            )

            ->get();


        // Tautan PDF yang pernah diupload melalui halaman Nilai Aset.
        if (Schema::hasColumn('nilai_aktivas', 'dokumen_pdf')) {
            $pdfByNilaiId = DB::table('nilai_aktivas')
                ->whereIn('id', $nilaiAktivas->pluck('id')->all())
                ->whereNotNull('dokumen_pdf')
                ->get(['id', 'dokumen_pdf', 'dokumen_pdf_nama_asli'])
                ->keyBy('id');
            $nilaiAktivas->each(function ($item) use ($pdfByNilaiId) {
                $hasPdf = isset($pdfByNilaiId[$item->id]);
                $item->pdf_preview_url = $hasPdf ? route('nilai.pdf.preview', $item->id) : null;
                $item->pdf_download_url = $hasPdf ? route('nilai.pdf.download', $item->id) : null;
                $item->pdf_nama = $hasPdf
                    ? ($pdfByNilaiId[$item->id]->dokumen_pdf_nama_asli ?: 'Dokumen Nilai Aset')
                    : null;
            });
        }

        // Status pengaitan dari seluruh kategori K.I.B dan pointer legacy.
        $linkService = app(KibVoucherLinkService::class);
        $owners = $linkService->owners($nilaiAktivas->pluck('id')->all());
        $kategoriTanah = app(KibNotificationService::class)->categoryId('tanah');
        $pengaitanAktif = $linkService->ready();
        $tanahTargets = DB::table('tanahs')->where('id_lokasi', $id)
            ->orderByDesc('id')->get(['id', 'guna', 'sertifikat', 'tahun']);
        $labels = $tanahTargets->keyBy('id');
        $relasiTanah = $pengaitanAktif
            ? DB::table('kib_voucher_links')->where('kib', 'tanah')->where('id_lokasi', $id)
            ->whereIn('nilai_aktiva_id', $nilaiAktivas->pluck('id')->all())
            ->get(['id', 'nilai_aktiva_id', 'record_id'])->keyBy('nilai_aktiva_id')
            : collect();
        $nilaiAktivas->each(function ($item) use ($owners, $labels, $kategoriTanah, $pengaitanAktif, $relasiTanah) {
            $linked = $owners[(int) $item->id] ?? [];
            $item->linked_count = count($linked);
            $item->linked_tanah_id = count($linked) === 1 && $linked[0]['kategori'] === 'tanah'
                ? $linked[0]['record_id'] : null;
            $item->link_status = count($linked) > 1 ? 'perlu_verifikasi'
                : (count($linked) === 1 ? 'terhubung' : 'belum_terhubung');
            $item->link_target = count($linked) === 1
                ? ($linked[0]['kategori'] === 'tanah'
                    ? ('Tanah #' . $linked[0]['record_id'] . ' — ' .
                        ($labels[$linked[0]['record_id']]->guna ?? 'Lihat data historis'))
                    : (strtoupper($linked[0]['kategori']) . ' #' . $linked[0]['record_id']))
                : null;
            $relasi = $relasiTanah->get($item->id);
            $item->can_unlink = $pengaitanAktif && $relasi !== null
                && $item->link_status === 'terhubung'
                && $linked[0]['kategori'] === 'tanah'
                && $linked[0]['sumber'] === 'pengaitan'
                && (int) $relasi->record_id === $linked[0]['record_id'];
            $item->link_id = $item->can_unlink ? (int) $relasi->id : null;
            $item->link_is_legacy = count($linked) === 1 && $linked[0]['sumber'] === 'legacy';
            $item->can_link = $pengaitanAktif
                && $kategoriTanah !== null
                && (int) $item->cat === (int) $kategoriTanah
                && $item->link_status === 'belum_terhubung'
                && in_array((int) $item->stat, [0, 1], true)
                && in_array((int) $item->jenisn, [1, 2], true);
        });

        $total =
            $nilaiAktivas->sum(
                function ($item) {

                    return is_numeric(
                        $item->nilai
                    )
                        ?
                        (float) $item->nilai
                        :
                        0;
                }
            );


        return response()->json([

            'success' =>
            true,


            'lokasi' => [

                'id' =>
                $lokasi->id,

                'lokasi' =>
                $lokasi->lokasi,

                'alamat' =>
                $lokasi->alamat,

            ],


            'jumlah_transaksi' =>
            $nilaiAktivas->count(),


            'total' =>
            $total,


            'data' =>
            $nilaiAktivas,

            'pilihan_tanah' => $tanahTargets->map(static fn($row) => [
                'id' => (int) $row->id,
                'label' => 'Tanah #' . $row->id . ' — ' . trim((string) ($row->guna ?: $row->sertifikat ?: 'Tanah'))
                    . ' (' . ($row->tahun ?: '-') . ')',
            ])->values(),

        ]);
    }


    /*
        |--------------------------------------------------------------------------
        | RESOLVE FILE LOKASIS.IMG
        |--------------------------------------------------------------------------
        |
        | Fungsi ini TIDAK membuat URL.
        |
        | Fungsi ini mencari lokasi file fisik yang sebenarnya.
        |
        */

    private function resolveLokasiImageAbsolutePath(
        string $image
    ): ?string {

        /*
            |--------------------------------------------------------------------------
            | NORMALISASI
            |--------------------------------------------------------------------------
            */

        $raw =
            trim(
                str_replace(
                    '\\',
                    '/',
                    $image
                )
            );


        if (
            $raw === ''
            ||
            str_contains(
                $raw,
                '..'
            )
        ) {

            return null;
        }


        /*
            |--------------------------------------------------------------------------
            | ABSOLUTE PATH
            |--------------------------------------------------------------------------
            |
            | Jika database lama ternyata menyimpan absolute path dan
            | file tersebut masih tersedia.
            |
            */

        if (
            File::exists(
                $raw
            )
        ) {

            return $raw;
        }


        /*
            |--------------------------------------------------------------------------
            | BERSIHKAN PREFIX
            |--------------------------------------------------------------------------
            */

        $normalized =
            ltrim(
                $raw,
                '/'
            );


        $normalized =
            preg_replace(
                '#^public/#i',
                '',
                $normalized
            );


        $normalized =
            preg_replace(
                '#^storage/app/public/#i',
                '',
                $normalized
            );


        $normalized =
            preg_replace(
                '#^storage/#i',
                '',
                $normalized
            );


        $filename =
            basename(
                $normalized
            );


        /*
            |--------------------------------------------------------------------------
            | PATH PERSIS
            |--------------------------------------------------------------------------
            */

        $exactCandidates = [

            public_path(
                $normalized
            ),

            storage_path(
                'app/public/'
                    .
                    $normalized
            ),

        ];


        foreach (
            $exactCandidates
            as $candidate
        ) {

            if (
                File::exists(
                    $candidate
                )
            ) {

                return $candidate;
            }
        }


        /*
            |--------------------------------------------------------------------------
            | FOLDER YANG MUNGKIN DIGUNAKAN WEB LAMA
            |--------------------------------------------------------------------------
            */

        $relativeCandidates = [

            /*
                * LOKASI
                */

            'uploads/lokasi/' . $filename,

            'upload/lokasi/' . $filename,

            'assets/uploads/lokasi/' . $filename,

            'assets/upload/lokasi/' . $filename,

            'assets/img/lokasi/' . $filename,

            'images/lokasi/' . $filename,

            'image/lokasi/' . $filename,

            'img/lokasi/' . $filename,

            'foto/lokasi/' . $filename,

            'gambar/lokasi/' . $filename,


            /*
                * ASET
                */

            'uploads/aset/' . $filename,

            'upload/aset/' . $filename,

            'assets/uploads/aset/' . $filename,

            'assets/upload/aset/' . $filename,

            'assets/img/aset/' . $filename,

            'images/aset/' . $filename,

            'img/aset/' . $filename,


            /*
                * GENERAL
                */

            'uploads/' . $filename,

            'upload/' . $filename,

            'assets/uploads/' . $filename,

            'assets/upload/' . $filename,

            'assets/img/' . $filename,

            'images/' . $filename,

            'image/' . $filename,

            'img/' . $filename,

            'foto/' . $filename,

            'gambar/' . $filename,

            $filename,

        ];


        /*
            |--------------------------------------------------------------------------
            | CARI DI PUBLIC
            |--------------------------------------------------------------------------
            */

        foreach (
            array_unique(
                $relativeCandidates
            )
            as $relative
        ) {

            $candidate =
                public_path(
                    $relative
                );


            if (
                File::exists(
                    $candidate
                )
            ) {

                return $candidate;
            }
        }


        /*
            |--------------------------------------------------------------------------
            | CARI DI STORAGE/APP/PUBLIC
            |--------------------------------------------------------------------------
            */

        foreach (
            array_unique(
                $relativeCandidates
            )
            as $relative
        ) {

            $candidate =
                storage_path(
                    'app/public/'
                        .
                        $relative
                );


            if (
                File::exists(
                    $candidate
                )
            ) {

                return $candidate;
            }
        }


        /*
            |--------------------------------------------------------------------------
            | FALLBACK:
            | CARI BERDASARKAN NAMA FILE DI SELURUH PUBLIC
            |--------------------------------------------------------------------------
            |
            | Misalnya database hanya berisi:
            |
            | IPA_SELILI.jpg
            |
            | sedangkan file ternyata berada:
            |
            | public/dist/img/aset/lokasi/IPA_SELILI.jpg
            |
            */

        try {

            if (
                File::isDirectory(
                    public_path()
                )
            ) {

                foreach (
                    File::allFiles(
                        public_path()
                    )
                    as $file
                ) {

                    if (
                        strcasecmp(
                            $file->getFilename(),
                            $filename
                        )
                        ===
                        0
                    ) {

                        return $file->getPathname();
                    }
                }
            }
        } catch (\Throwable $e) {

            /*
                * Jangan merusak halaman apabila scan gagal.
                */
        }


        /*
            |--------------------------------------------------------------------------
            | FALLBACK STORAGE
            |--------------------------------------------------------------------------
            */

        try {

            $storagePublic =
                storage_path(
                    'app/public'
                );


            if (
                File::isDirectory(
                    $storagePublic
                )
            ) {

                foreach (
                    File::allFiles(
                        $storagePublic
                    )
                    as $file
                ) {

                    if (
                        strcasecmp(
                            $file->getFilename(),
                            $filename
                        )
                        ===
                        0
                    ) {

                        return $file->getPathname();
                    }
                }
            }
        } catch (\Throwable $e) {
        }


        return null;
    }


    /*
        |--------------------------------------------------------------------------
        | PARSE NUMBER LEGACY
        |--------------------------------------------------------------------------
        */

    private function parseLegacyNumber(
        int $value
    ): float {

        if (
            $value === null
            ||
            $value === ''
        ) {

            return 0;
        }


        $value =
            trim(
                (string) $value
            );


        $value =
            preg_replace(
                '/\s+/',
                '',
                $value
            );


        if (
            is_numeric(
                $value
            )
        ) {

            return (float) $value;
        }


        /*
            |--------------------------------------------------------------------------
            | FORMAT:
            | 1.250,50
            |--------------------------------------------------------------------------
            */

        if (
            preg_match(
                '/^-?\d{1,3}(\.\d{3})+(,\d+)?$/',
                $value
            )
        ) {

            $value =
                str_replace(
                    '.',
                    '',
                    $value
                );


            $value =
                str_replace(
                    ',',
                    '.',
                    $value
                );


            return is_numeric(
                $value
            )
                ?
                (float) $value
                :
                0;
        }


        /*
            |--------------------------------------------------------------------------
            | FORMAT:
            | 1250,50
            |--------------------------------------------------------------------------
            */

        $value =
            str_replace(
                ',',
                '.',
                $value
            );


        return is_numeric(
            $value
        )
            ?
            (float) $value
            :
            0;
    }

    /*
        |--------------------------------------------------------------------------
        | CRUD SERTIFIKAT TANAH DAN DOKUMEN PDF (SATU KIBCONTROLLER)
        |--------------------------------------------------------------------------
        | Method lama dataTanah(), detailTanahLokasi(), detailNilaiTanahLokasi()
        | dan gambarTanahLokasi() tetap dipertahankan.
        */

    private function sertifikatQuery()
    {
        return DB::table('tanahs as t')
            ->leftJoin('lokasis as l', 'l.id', '=', 't.id_lokasi')
            ->leftJoin('barangs as b', 'b.id', '=', 't.id_barang')
            ->select('t.*')
            ->selectRaw('BTRIM(l.lokasi) AS lokasi')
            ->selectRaw('BTRIM(l.alamat) AS alamat')
            ->selectRaw('BTRIM(b.nama_barang) AS nama_barang')
            ->selectRaw('BTRIM(b.kode_barang) AS kode_barang');
    }

    /** PDFs from the existing pdfs table: one certificate can have many scans. */
    private function pdfQuery()
    {
        return DB::table('pdfs as p')
            ->whereRaw("LOWER(BTRIM(p.gol)) IN ('tanah', 'kib a', 'a', '1')");
    }

    private function pdfData(int $tanahId): array
    {
        $legacy = $this->pdfQuery()
            ->where('p.id_tanah', $tanahId)
            ->orderByDesc('p.id')
            ->get(['p.id', 'p.dok'])
            ->map(fn($p) => [
                'id' => $p->id,
                'nama' => basename((string) ($p->dok ?: 'Dokumen tanah.pdf')),
                'view_url' => route('kib.tanah.pdf.view', $p->id),
                'download_url' => route('kib.tanah.pdf.download', $p->id),
            ])->all();

        $baru = DB::table('tanah_lampirans')
            ->where('tanah_id', $tanahId)
            ->where('jenis', 'pdf')
            ->orderByDesc('id')
            ->get(['id', 'nama_asli'])
            ->map(fn($file) => [
                'id' => 'lampiran-' . $file->id,
                'nama' => $file->nama_asli,
                'view_url' => URL::temporarySignedRoute('kib.tanah.lampiran', now()->addHours(24), ['lampiran' => $file->id, 'aksi' => 'view'], false),
                'download_url' => URL::temporarySignedRoute('kib.tanah.lampiran', now()->addHours(24), ['lampiran' => $file->id, 'aksi' => 'download'], false),
            ])->all();

        return array_merge($legacy, $baru);
    }

    private function serialize(\stdClass $row): array
    {
        $result = (array) $row;
        $result['pdfs'] = $this->pdfData((int) $row->id);
        $result['gambar'] = DB::table('tanah_lampirans')
            ->where('tanah_id', (int) $row->id)
            ->where('jenis', 'gambar')
            ->orderByDesc('id')
            ->get(['id', 'nama_asli'])
            ->map(fn($file) => [
                'id' => $file->id,
                'nama' => $file->nama_asli,
                'view_url' => URL::temporarySignedRoute('kib.tanah.lampiran', now()->addHours(24), ['lampiran' => $file->id, 'aksi' => 'view'], false),
                'download_url' => URL::temporarySignedRoute('kib.tanah.lampiran', now()->addHours(24), ['lampiran' => $file->id, 'aksi' => 'download'], false),
            ])->all();

        // PDF sumber Nilai Aset juga terlihat pada sertifikat yang terhubung.
        if (
            Schema::hasColumn('tanahs', 'nilai_aktiva_id')
            && Schema::hasColumn('nilai_aktivas', 'dokumen_pdf')
            && !empty($row->nilai_aktiva_id)
        ) {
            $source = DB::table('nilai_aktivas as n')
                ->join('aktivas as a', 'a.id', '=', 'n.id_aktiva')
                ->where('n.id', $row->nilai_aktiva_id)
                ->whereRaw("TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)", ['TANAH', 'KIB A TANAH'])
                ->whereNotNull('n.dokumen_pdf')
                ->first(['n.id', 'n.dokumen_pdf', 'n.dokumen_pdf_nama_asli']);
            if ($source && trim((string) $source->dokumen_pdf) !== '') {
                $result['pdfs'][] = [
                    'id' => 'nilai-' . $source->id,
                    'nama' => $source->dokumen_pdf_nama_asli ?: 'Dokumen Nilai Aset',
                    'view_url' => route('nilai.pdf.preview', $source->id),
                    'download_url' => route('nilai.pdf.download', $source->id),
                ];
            }
        }
        return $result;
    }

    public function lokasiSertifikat(int $lokasi)
    {
        $l = DB::table('lokasis')->where('id', $lokasi)->first(['id', 'lokasi', 'alamat']);
        abort_unless($l, 404);

        $rows = $this->sertifikatQuery()
            ->where('t.id_lokasi', $lokasi)
            ->orderByDesc('t.id')
            ->get();

        // Pilot: agregasi voucher langsung dan pointer historis tanpa join
        // sehingga jumlah baris sertifikat tidak pernah terduplikasi.
        $totals = app(KibVoucherLinkService::class)->totalsForTanah($rows->all());
        $serialized = $rows->map(function ($row) use ($totals) {
            $item = $this->serialize($row);
            $item['nilai_terhubung'] = $totals[(int) $row->id]['nilai_terhubung'] ?? 0;
            $item['jumlah_voucher'] = $totals[(int) $row->id]['jumlah_voucher'] ?? 0;
            $item['voucher_ids'] = $totals[(int) $row->id]['voucher_ids'] ?? [];
            return $item;
        })->values();

        return response()->json([
            'success' => true,
            'lokasi' => ['id' => $l->id, 'lokasi' => trim($l->lokasi), 'alamat' => trim($l->alamat)],
            'data' => $serialized,
        ]);
    }

    /**
     * Data resmi laporan K.I.B A per lokasi.
     * Mengambil semua baris tanah (tanpa pagination), identitas organisasi dari
     * voucher Nilai Aset yang terkait, dan pilihan penandatangan dari Master SDM.
     * Tidak melakukan perubahan data / transaksi.
     */
    public function laporanTanahLokasi(int $lokasi)
    {
        $tempat = DB::table('lokasis')
            ->where('id', $lokasi)
            ->first(['id', 'lokasi', 'alamat']);

        abort_unless($tempat, 404, 'Lokasi tidak ditemukan.');

        $items = $this->sertifikatQuery()
            ->where('t.id_lokasi', $lokasi)
            ->orderBy('t.id', 'ASC')
            ->get();

        // Prioritaskan identitas organisasi yang benar-benar terhubung ke
        // sertifikat pada lokasi ini, bukan voucher kategori aset lain.
        $organisasi = null;
        if (Schema::hasColumn('tanahs', 'nilai_aktiva_id')) {
            $organisasi = DB::table('tanahs as t')
                ->join('nilai_aktivas as n', 'n.id', '=', 't.nilai_aktiva_id')
                ->leftJoin('departemens as d', 'd.id', '=', 'n.dep')
                ->leftJoin('divisis as v', 'v.id', '=', 'n.div')
                ->where('t.id_lokasi', $lokasi)
                ->whereNotNull('t.nilai_aktiva_id')
                ->orderByDesc('t.id')
                ->first(['d.kode_dep as nama_dep', 'v.nama_div']);
        }

        // Data Tanah lama dapat tidak mempunyai tautan langsung ke voucher.
        if (!$organisasi) {
            $organisasi = DB::table('nilai_aktivas as n')
                ->join('aktivas as a', 'a.id', '=', 'n.id_aktiva')
                ->leftJoin('departemens as d', 'd.id', '=', 'n.dep')
                ->leftJoin('divisis as v', 'v.id', '=', 'n.div')
                ->where('n.id_lokasi', $lokasi)
                ->whereRaw(
                    "TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)",
                    ['TANAH', 'KIB A TANAH']
                )
                ->orderByDesc('n.id')
                ->first(['d.kode_dep as nama_dep', 'v.nama_div']);
        }

        // Nilai laporan mengikuti Nilai Terhubung pada Detail Tanah per ID aset.
        // Voucher yang belum terhubung tidak dihitung; tidak ada join pengganda baris.
        $totals = app(KibVoucherLinkService::class)->totalsForTanah($items->all());
        foreach ($items as $item) {
            $item->nilai_terhubung = $totals[(int) $item->id]['nilai_terhubung'] ?? 0;
            $item->jumlah_voucher = $totals[(int) $item->id]['jumlah_voucher'] ?? 0;
        }

        $sdm = collect();
        if (Schema::hasTable('sdms') && Schema::hasTable('jabatans')) {
            $sdm = DB::table('sdms as s')
                ->leftJoin('jabatans as j', 'j.id', '=', 's.id_jabat')
                ->when(
                    Schema::hasColumn('sdms', 'status'),
                    fn($query) => $query->where('s.status', 'aktif')
                )
                ->whereNotNull('s.nama_sdm')
                ->whereRaw("BTRIM(s.nama_sdm) <> ''")
                ->orderBy('s.nama_sdm')
                ->get(['s.id', 's.nama_sdm', 's.nip', 'j.jabat'])
                ->map(static fn($orang) => [
                    'id' => (int) $orang->id,
                    'nama' => trim((string) $orang->nama_sdm),
                    'nip' => trim((string) ($orang->nip ?? '')),
                    'jabatan' => trim((string) ($orang->jabat ?? '')),
                ]);
        }

        return response()->json([
            'success' => true,
            'lokasi' => [
                'id' => (int) $tempat->id,
                'lokasi' => trim((string) $tempat->lokasi),
                'alamat' => trim((string) ($tempat->alamat ?? '')),
            ],
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                'departemen' => $this->kibNamaDepartemenUntukLaporan($organisasi->nama_dep ?? null),
                'divisi' => trim((string) ($organisasi->nama_div ?? '')) ?: '-',
            ],
            'jumlah' => $items->count(),
            'data' => $items,
            'sdm' => $sdm,
        ]);
    }

    /**
     * Seluruh sertifikat K.I.B A Tanah pada semua lokasi di menu utama.
     *
     * Method baru yang berdiri sendiri: laporanTanahLokasi() tetap dipertahankan.
     * Tidak ada pagination, mutasi database, atau kolom status kepemilikan
     * yang ditambahkan secara khusus ke hasil cetak.
     */
    public function laporanTanah()
    {
        // Menu utama hanya menampilkan lokasi yang valid (inner join lokasis).
        // Samakan cakupan ekspor supaya record di setiap lokasi yang tampil
        // masuk seluruhnya, termasuk bila satu lokasi punya banyak sertifikat.
        $items = $this->sertifikatQuery()
            ->whereNotNull('l.id')
            ->orderBy('l.lokasi', 'asc')
            ->orderBy('t.id', 'asc')
            ->get();

        // Nilai laporan mengikuti Nilai Terhubung pada Detail Tanah per ID aset.
        // Voucher yang belum terhubung tidak dihitung; tidak ada join pengganda baris.
        $totals = app(KibVoucherLinkService::class)->totalsForTanah($items->all());
        foreach ($items as $item) {
            $item->nilai_terhubung = $totals[(int) $item->id]['nilai_terhubung'] ?? 0;
            $item->jumlah_voucher = $totals[(int) $item->id]['jumlah_voucher'] ?? 0;
        }

        // Dropdown penandatangan memakai data yang sudah ada di Master SDM.
        $sdm = collect();
        if (Schema::hasTable('sdms') && Schema::hasTable('jabatans')) {
            $sdm = DB::table('sdms as s')
                ->leftJoin('jabatans as j', 'j.id', '=', 's.id_jabat')
                ->when(
                    Schema::hasColumn('sdms', 'status'),
                    fn($query) => $query->where('s.status', 'aktif')
                )
                ->whereNotNull('s.nama_sdm')
                ->whereRaw("BTRIM(s.nama_sdm) <> ''")
                ->orderBy('s.nama_sdm')
                ->get(['s.id', 's.nama_sdm', 's.nip', 'j.jabat'])
                ->map(static fn($orang) => [
                    'id' => (int) $orang->id,
                    'nama' => trim((string) $orang->nama_sdm),
                    'nip' => trim((string) ($orang->nip ?? '')),
                    'jabatan' => trim((string) ($orang->jabat ?? '')),
                ]);
        }

        return response()->json([
            'success' => true,
            'cakupan' => 'seluruh_menu_tanah',
            'lokasi' => [
                'lokasi' => 'SELURUH LOKASI',
                'alamat' => 'BERBAGAI LOKASI',
            ],
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                // Laporan lintas lokasi/departemen tidak boleh memakai
                // identitas satu sertifikat tertentu sebagai identitas global.
                'departemen' => 'SELURUH DEPARTEMEN',
                'divisi' => 'SELURUH DIVISI',
            ],
            'jumlah' => $items->count(),
            'data' => $items,
            'sdm' => $sdm,
        ]);
    }

    public function lokasiPdf(int $lokasi)
    {
        abort_unless(DB::table('lokasis')->where('id', $lokasi)->exists(), 404);
        $rows = $this->sertifikatQuery()->where('t.id_lokasi', $lokasi)->orderBy('t.id')->get();
        $data = [];
        foreach ($rows as $row) {
            foreach ($this->pdfData((int) $row->id) as $pdf) {
                $data[] = [
                    ...$pdf,
                    'tanah_id' => $row->id,
                    'sertifikat' => $row->sertifikat,
                    'penggunaan' => $row->guna,
                    'tahun' => $row->tahun,
                ];
            }
        }
        // Dokumen yang dibuat pada saat input Nilai Aset juga ditampilkan.
        if (Schema::hasColumn('nilai_aktivas', 'dokumen_pdf')) {
            $nilaiDocs = DB::table('nilai_aktivas as n')
                ->join('aktivas as a', 'a.id', '=', 'n.id_aktiva')
                ->where('n.id_lokasi', $lokasi)
                ->whereRaw("TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)", ['TANAH', 'KIB A TANAH'])
                ->whereNotNull('n.dokumen_pdf')
                ->whereRaw("BTRIM(n.dokumen_pdf) <> ''")
                ->select('n.id', 'n.tahun', 'n.no_voucher', 'n.dokumen_pdf_nama_asli')
                ->orderByDesc('n.id')
                ->get();
            foreach ($nilaiDocs as $doc) {
                $data[] = [
                    'id' => 'nilai-' . $doc->id,
                    'tanah_id' => null,
                    'nama' => $doc->dokumen_pdf_nama_asli ?: 'Dokumen Nilai Aset',
                    'sertifikat' => 'Nilai Aset / Voucher ' . ($doc->no_voucher ?: '-'),
                    'penggunaan' => 'Dokumen transaksi Nilai Aset',
                    'tahun' => $doc->tahun,
                    'view_url' => route('nilai.pdf.preview', $doc->id),
                    'download_url' => route('nilai.pdf.download', $doc->id),
                ];
            }
        }
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function show(int $tanah)
    {
        $row = $this->sertifikatQuery()->where('t.id', $tanah)->first();
        abort_unless($row, 404);
        $data = $this->serialize($row);
        $summary = app(KibVoucherLinkService::class)->totalsForTanah([$row]);
        $data['jumlah_voucher'] = $summary[$tanah]['jumlah_voucher'] ?? 0;
        $data['nilai_terhubung'] = $summary[$tanah]['nilai_terhubung'] ?? 0;
        return response()->json(['success' => true, 'data' => $data]);
    }

    private function validateInput(Request $request, bool $editing = false): array
    {
        return $request->validate([
            'id_nilai_aktiva' => [$editing ? 'nullable' : 'required', 'integer', 'exists:nilai_aktivas,id'],
            'id_barang' => [
                'required',
                'integer',
                'exists:barangs,id',
                function ($attribute, $value, $fail) use ($request, $editing) {
                    if (DB::table('barangs')->where('id', $value)->where('status', 'aktif')->exists()) {
                        return;
                    }
                    // Pada Edit, hubungan lama boleh tetap meskipun Barang sudah nonaktif.
                    $tanahId = (int) $request->route('tanah');
                    if (
                        $editing && $tanahId > 0 && DB::table('tanahs')
                        ->where('id', $tanahId)->where('id_barang', $value)->exists()
                    ) {
                        return;
                    }
                    $fail('Barang harus berstatus Aktif untuk pilihan baru.');
                },
            ],
            'status_kepemilikan' => ['required', Rule::in(['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta'])],
            'tahun' => ['required', 'digits:4'],
            'guna' => ['required', 'string', 'max:255'],
            'no_tunjuk' => ['nullable', 'string', 'max:255'],
            'tgl_tunjuk' => ['required', 'date'],
            'luas_tunjuk' => ['nullable', 'numeric', 'min:0'],
            'sertifikat' => ['nullable', 'string', 'max:255'],
            'tgl_sertifikat' => ['required', 'date'],
            'luas_sertifikat' => ['nullable', 'numeric', 'min:0'],
            'no_gambar' => ['nullable', 'string', 'max:255'],
            'tgl_gambar' => ['nullable', 'date'],
            'luas_gambar' => ['nullable', 'numeric', 'min:0'],
            'hak' => ['nullable', 'string', 'max:255'],
            'asal' => ['nullable', 'string', 'max:255'],
            'pemilik' => ['nullable', 'string', 'max:255'],
            'ket' => ['nullable', 'string'],
            // Tidak ada batas ukuran/jumlah khusus aplikasi. Server PHP/Nginx tetap membatasi request.
            'dokumen_pdf' => ['nullable', 'array'],
            'dokumen_pdf.*' => ['required', 'file', 'mimes:pdf'],
            'foto_tanah' => ['nullable', 'array'],
            'foto_tanah.*' => ['required', 'file', 'mimes:jpg,jpeg,png,webp'],
        ]);
    }

    private function tanahFields(array $input): array
    {
        $data = [
            'id_barang' => (int) $input['id_barang'],
            'status_kepemilikan' => $input['status_kepemilikan'],
            'tahun' => (string) $input['tahun'],
            'guna' => $input['guna'],
            'tgl_tunjuk' => $input['tgl_tunjuk'],
            'tgl_sertifikat' => $input['tgl_sertifikat'],
            'ket' => $input['ket'] ?? null,
        ];
        // Legacy SQL contains NOT NULL varchar columns; blank text uses '-'.
        foreach (
            [
                'no_tunjuk',
                'luas_tunjuk',
                'sertifikat',
                'luas_sertifikat',
                'no_gambar',
                'tgl_gambar',
                'luas_gambar',
                'hak',
                'asal',
                'pemilik'
            ] as $name
        ) {
            $data[$name] = isset($input[$name]) && (string) $input[$name] !== ''
                ? (string) $input[$name] : '-';
        }
        return $data;
    }

    /**
     * Simpan dokumen dan gambar sebagai file privat. Tiap file memiliki metadata,
     * sehingga lampiran lama tetap bisa dilihat, dan upload berikutnya tidak menimpa.
     * Array $storedPaths dipakai untuk kompensasi ketika transaksi database gagal.
     */
    private function uploadTanahAttachments(Request $request, int $tanahId, array &$storedPaths): void
    {
        foreach (['dokumen_pdf' => 'pdf', 'foto_tanah' => 'gambar'] as $field => $jenis) {
            foreach ((array) $request->file($field, []) as $file) {
                if (!$file || !$file->isValid()) {
                    throw ValidationException::withMessages([$field => 'Salah satu lampiran gagal diunggah.']);
                }

                $path = $file->store('tanah/lampiran/' . $jenis, 'local');
                if (!$path) {
                    throw ValidationException::withMessages([$field => 'File gagal disimpan di server.']);
                }
                // Catat path langsung, bahkan bila INSERT berikutnya gagal.
                $storedPaths[] = $path;

                DB::table('tanah_lampirans')->insert([
                    'tanah_id' => $tanahId,
                    'jenis' => $jenis,
                    'path' => $path,
                    'nama_asli' => mb_substr(basename(str_replace('\\', '/', $file->getClientOriginalName())), 0, 240),
                    'mime' => $file->getMimeType(),
                    'ukuran' => $file->getSize(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /** Membaca lampiran privat tanpa membuka path lokal ke publik. */
    public function lampiranTanah(int $lampiran, string $aksi = 'view')
    {
        abort_unless(in_array($aksi, ['view', 'download'], true), 404);

        $row = DB::table('tanah_lampirans')->where('id', $lampiran)->first();
        abort_unless($row, 404);

        $path = (string) $row->path;
        abort_unless(str_starts_with($path, 'tanah/lampiran/')
            && !str_contains($path, '..')
            && Storage::disk('local')->exists($path), 404);

        $mime = (string) $row->mime;
        $allowed = $row->jenis === 'pdf'
            ? ['application/pdf']
            : ['image/jpeg', 'image/png', 'image/webp'];
        abort_unless(in_array($mime, $allowed, true), 404);

        $absolute = Storage::disk('local')->path($path);
        $name = preg_replace('/[^a-zA-Z0-9._-]+/', '_', (string) $row->nama_asli) ?: 'lampiran';

        if ($aksi === 'download') {
            return response()->download($absolute, $name, [
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ]);
        }

        return response()->file($absolute, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $name . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE DATA K.I.B TANAH
    |--------------------------------------------------------------------------
    |
    | Mengambil transaksi dari nilai_aktivas:
    |
    | - cat = Tanah
    | - stat = 0
    | - jenisn = 1 atau 2 (untuk transaksi historis)
    |
    | Setelah data Tanah berhasil disimpan:
    | stat 0 -> 1
    |
    */

    public function store(
        Request $request,
        KibNotificationService $notifications
    ) {
        /*
        |--------------------------------------------------------------------------
        | 01. VALIDASI FORM
        |--------------------------------------------------------------------------
        */

        $input = $this->validateInput($request);

        /*
        |--------------------------------------------------------------------------
        | 02. CATEGORY TANAH
        |--------------------------------------------------------------------------
        */

        $categoryId = $notifications->categoryId('tanah');

        if ($categoryId === null) {
            throw ValidationException::withMessages([
                'id_nilai_aktiva' =>
                'Golongan K.I.B Tanah tidak ditemukan.',
            ]);
        }

        $newFiles = [];

        try {
            DB::transaction(function () use (
                $input,
                $request,
                $categoryId,
                &$newFiles
            ): void {

                /*
                |--------------------------------------------------------------------------
                | 03. AMBIL TRANSAKSI SUMBER
                |--------------------------------------------------------------------------
                */

                $source = DB::table('nilai_aktivas as n')
                    ->where(
                        'n.id',
                        (int) $input['id_nilai_aktiva']
                    )
                    ->where('n.stat', 0)
                    ->whereIn('n.jenisn', [1, 2])
                    ->where('n.cat', $categoryId)
                    ->select([
                        'n.id',
                        'n.id_lokasi',
                        'n.jenisn',
                        'n.stat',
                        'n.cat',
                    ])
                    ->lockForUpdate()
                    ->first();

                /*
                |--------------------------------------------------------------------------
                | 04. PASTIKAN SUMBER MASIH TERSEDIA
                |--------------------------------------------------------------------------
                */

                if (!$source || !$source->id_lokasi) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' =>
                        'Transaksi Tanah tidak ditemukan, tidak memiliki lokasi, atau sudah diproses.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | 05. CEGAH DUPLIKASI TRANSAKSI
                |--------------------------------------------------------------------------
                */

                $sudahTerhubung = DB::table('tanahs')
                    ->where(
                        'nilai_aktiva_id',
                        $source->id
                    )
                    ->exists();

                if ($sudahTerhubung) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' =>
                        'Transaksi Nilai Aset ini sudah digunakan untuk data Tanah.',
                    ]);
                }

                $owners = app(KibVoucherLinkService::class)->owners([(int) $source->id]);
                if (!empty($owners[(int) $source->id])) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' => 'Voucher sudah terhubung dengan inventaris lain.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | 06. DATA FORM TANAH
                |--------------------------------------------------------------------------
                */

                $data = $this->tanahFields($input);

                // Lokasi berasal dari transaksi, bukan browser.
                $data['id_lokasi'] = (int) $source->id_lokasi;

                // Hubungan Tanah dengan transaksi Nilai Aset.
                $data['nilai_aktiva_id'] = (int) $source->id;

                /*
                |--------------------------------------------------------------------------
                | 07. NILAI UANG
                |--------------------------------------------------------------------------
                |
                | Nilai uang tetap berasal dari nilai_aktivas.
                | Tidak disalin ke kolom INTEGER lama tanahs.nilai.
                |
                */

                $data['nilai'] = null;
                $data['nilai_now'] = null;

                /*
                |--------------------------------------------------------------------------
                | 08. METADATA
                |--------------------------------------------------------------------------
                */

                $data['user'] = Auth::id();
                $data['created_at'] = now();
                $data['updated_at'] = now();

                /*
                |--------------------------------------------------------------------------
                | 09. SIMPAN DATA TANAH
                |--------------------------------------------------------------------------
                */

                $tanahId = DB::table('tanahs')
                    ->insertGetId($data);

                /*
                |--------------------------------------------------------------------------
                | 10. UPLOAD PDF
                |--------------------------------------------------------------------------
                */

                $this->uploadTanahAttachments($request, (int) $tanahId, $newFiles);

                /*
                |--------------------------------------------------------------------------
                | 11. TRANSAKSI SUDAH DIPROSES
                |--------------------------------------------------------------------------
                */

                $updated = DB::table('nilai_aktivas')
                    ->where('id', $source->id)
                    ->where('stat', 0)
                    ->update([
                        'stat' => 1,
                        'updated_at' => now(),
                    ]);

                if ($updated !== 1) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' =>
                        'Status transaksi gagal diperbarui. Penyimpanan Tanah dibatalkan.',
                    ]);
                }
            });
        } catch (\Throwable $exception) {

            /*
            |--------------------------------------------------------------------------
            | 12. BERSIHKAN FILE BARU JIKA GAGAL
            |--------------------------------------------------------------------------
            */

            foreach ($newFiles as $path) {
                Storage::disk('local')->delete($path);
            }

            throw $exception;
        }

        /*
        |--------------------------------------------------------------------------
        | 13. HAPUS CACHE NOTIFIKASI
        |--------------------------------------------------------------------------
        */

        $notifications->clearCache();

        /*
        |--------------------------------------------------------------------------
        | 14. RESPONSE
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route('kib.tanah')
            ->with(
                'success',
                'Data Tanah berhasil disimpan dan transaksi Nilai Aset telah diproses.'
            );
    }


    /**
     * K.I.B A pilot: tambah Tanah tanpa mengonsumsi voucher Pending.
     * Lokasi selalu diambil dari route yang sudah divalidasi, bukan dari input.
     */
    public function storeTanahLangsung(Request $request, int $lokasi)
    {
        abort_unless(DB::table('lokasis')->where('id', $lokasi)->exists(), 404);
        // Data Langsung adalah pencatatan fisik saja. Voucher hanya boleh
        // diberikan melalui endpoint Hubungkan pada modal Data Nilai.
        $request->validate([
            'mode_input' => ['required', Rule::in(['langsung'])],
            'id_nilai_aktiva' => ['prohibited'],
        ]);
        $input = $this->validateInput($request, true);
        $newFiles = [];
        try {
            DB::transaction(function () use ($input, $request, $lokasi, &$newFiles): void {
                $data = $this->tanahFields($input);
                $data['id_lokasi'] = $lokasi;
                $data['nilai_aktiva_id'] = null;
                $data['nilai'] = null;
                $data['nilai_now'] = null;
                $data['user'] = Auth::id();
                $data['created_at'] = now();
                $data['updated_at'] = now();
                $id = DB::table('tanahs')->insertGetId($data);
                $this->uploadTanahAttachments($request, (int) $id, $newFiles);
            });
        } catch (\Throwable $e) {
            foreach ($newFiles as $path) Storage::disk('local')->delete($path);
            throw $e;
        }
        return redirect()->route('kib.tanah', ['lokasi_detail' => $lokasi])
            ->with('success', 'Data Tanah langsung berhasil ditambahkan tanpa menggunakan voucher Pending.');
    }

    /**
     * Mengaitkan voucher historis yang sudah diproses dengan satu sertifikat.
     * Tidak menambah voucher, mengubah stat, atau menghitung ulang nilai lokasi.
     */
    public function hubungkanNilaiTanah(
        Request $request,
        int $lokasi,
        KibVoucherLinkService $links,
        KibNotificationService $notifications
    ) {
        $input = $request->validate([
            'nilai_aktiva_id' => ['required', 'integer', 'exists:nilai_aktivas,id'],
            'tanah_id' => ['required', 'integer', 'exists:tanahs,id'],
            'konfirmasi' => ['required', 'accepted'],
        ]);
        $links->assertReady();
        $cat = $notifications->categoryId('tanah');
        abort_if($cat === null, 422, 'Kategori K.I.B A belum tersedia.');

        DB::transaction(function () use ($input, $lokasi, $cat, $links): void {
            $tanah = DB::table('tanahs')->where('id', $input['tanah_id'])
                ->where('id_lokasi', $lokasi)->first(['id', 'id_lokasi']);
            if (!$tanah) {
                throw ValidationException::withMessages(['tanah_id' => 'Tanah tujuan bukan milik lokasi ini.']);
            }

            $voucher = DB::table('nilai_aktivas as n')
                ->join('aktivas as a', 'a.id', '=', 'n.id_aktiva')
                ->where('n.id', $input['nilai_aktiva_id'])
                ->select('n.id', 'n.id_lokasi', 'n.cat', 'n.stat', 'n.jenisn', 'a.kib')
                ->lockForUpdate()->first();
            if (
                !$voucher || (int) $voucher->id_lokasi !== $lokasi ||
                (int) $voucher->cat !== (int) $cat ||
                !in_array((int) $voucher->jenisn, [1, 2], true) ||
                !in_array((int) $voucher->stat, [0, 1], true) ||
                !in_array(
                    strtoupper(trim(preg_replace('/[^A-Z0-9]+/i', ' ', (string) $voucher->kib))),
                    ['TANAH', 'KIB A TANAH'],
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'nilai_aktiva_id' => 'Voucher harus kategori Tanah, pada lokasi yang sama, jenis 1/2, dan berstatus Pending atau Diproses.',
                ]);
            }

            // Kunci voucher dan relasi ditulis pada transaksi yang sama.
            // Voucher Pending baru ditandai diproses JIKA pengaitan berhasil.
            $links->linkTanah((int) $voucher->id, (int) $tanah->id, $lokasi, Auth::id());
            if ((int) $voucher->stat === 0) {
                $updated = DB::table('nilai_aktivas')
                    ->where('id', $voucher->id)
                    ->where('stat', 0)
                    ->update(['stat' => 1, 'updated_at' => now()]);
                if ($updated !== 1) {
                    throw ValidationException::withMessages([
                        'nilai_aktiva_id' => 'Voucher sudah berubah status. Pengaitan dibatalkan.',
                    ]);
                }
            }
        }, 3);

        $notifications->clearCache();
        return response()->json([
            'success' => true,
            'message' => 'Voucher berhasil dihubungkan ke data Tanah. Status Pending, jika ada, telah diproses.',
        ]);
    }

    /** Lepas relasi manual saja. Voucher dan inventaris tetap ada. */
    public function lepaskanNilaiTanah(
        Request $request,
        int $lokasi,
        KibVoucherLinkService $links
    ) {
        $input = $request->validate([
            'nilai_aktiva_id' => ['required', 'integer'],
            'tanah_id' => ['required', 'integer'],
            'link_id' => ['required', 'integer'],
            'konfirmasi' => ['required', 'accepted'],
        ]);
        $links->assertReady();
        $audit = DB::transaction(function () use ($input, $lokasi, $links): array {
            // Urutan kunci sama dengan pengaitan: voucher, lalu relasi.
            $voucher = DB::table('nilai_aktivas')->where('id', $input['nilai_aktiva_id'])
                ->where('id_lokasi', $lokasi)->lockForUpdate()->first(['id', 'no_voucher', 'nilai']);
            if (!$voucher) {
                throw ValidationException::withMessages(['nilai_aktiva_id' => 'Voucher bukan milik lokasi ini.']);
            }
            $query = DB::table('kib_voucher_links')->where('id', $input['link_id'])
                ->where('nilai_aktiva_id', $voucher->id)->where('kib', 'tanah')
                ->where('record_id', $input['tanah_id'])->where('id_lokasi', $lokasi);
            $relasi = (clone $query)->lockForUpdate()->first();
            $owners = $links->owners([(int) $voucher->id])[(int) $voucher->id] ?? [];
            if (
                !$relasi || count($owners) !== 1 || $owners[0]['kategori'] !== 'tanah'
                || $owners[0]['sumber'] !== 'pengaitan'
                || $owners[0]['record_id'] !== (int) $input['tanah_id']
            ) {
                throw ValidationException::withMessages(['voucher' => 'Hubungan sudah berubah atau merupakan relasi historis. Muat ulang riwayat.']);
            }
            if ($query->delete() !== 1) {
                throw ValidationException::withMessages(['voucher' => 'Hubungan tidak ditemukan atau sudah dilepas.']);
            }
            // Jangan mengubah stat, jenisn, nominal, atau pointer sumber historis.
            return [
                'link_id' => (int) $relasi->id,
                'nilai_aktiva_id' => (int) $voucher->id,
                'tanah_id' => (int) $input['tanah_id'],
                'id_lokasi' => $lokasi,
                'user_id' => Auth::id()
            ];
        }, 3);
        Log::info('KIB A: hubungan voucher manual dilepas', $audit);
        return response()->json([
            'success' => true,
            'message' => 'Hubungan voucher berhasil dilepas. Voucher dapat dihubungkan kembali ke Tanah lain yang memenuhi syarat.',
        ]);
    }

    public function update(Request $request, int $tanah)
    {
        $row = DB::table('tanahs')->where('id', $tanah)->first();
        abort_unless($row, 404);
        $input = $this->validateInput($request, true);
        $newFiles = [];
        try {
            DB::transaction(function () use ($input, $request, $tanah, &$newFiles) {
                $data = $this->tanahFields($input);
                $data['updated_at'] = now();
                // Original id_lokasi, nilai_aktiva_id and nilai are never overwritten by form.
                DB::table('tanahs')->where('id', $tanah)->update($data);
                $this->uploadTanahAttachments($request, $tanah, $newFiles);
            });
        } catch (\Throwable $e) {
            foreach ($newFiles as $path) Storage::disk('local')->delete($path);
            throw $e;
        }
        return redirect()->route('kib.tanah')->with('success', 'Sertifikat Tanah berhasil diperbarui.');
    }

        /*
    |--------------------------------------------------------------------------
    | DELETE DATA TANAH
    |--------------------------------------------------------------------------
    */



    /**
     * ================================================================
     * DELETE DATA K.I.B TANAH
     * ================================================================
     *
     * - Hapus dokumen PDF baru yang terkait.
     * - Hapus data Tanah.
     * - Jika ada sumber Nilai Aset, kembalikan stat menjadi 0.
     * - Jangan menghapus transaksi keuangan Nilai Aset.
     */
    /*
    |--------------------------------------------------------------------------
    | DELETE DATA K.I.B TANAH
    |--------------------------------------------------------------------------
    |
    | Menghapus data Tanah tetapi mempertahankan transaksi Nilai Aset.
    |
    */

    public function destroy(int $tanah)
    {
        $paths = [];

        DB::transaction(function () use (
            $tanah,
            &$paths
        ): void {

            /*
            |--------------------------------------------------------------------------
            | 01. CARI DATA TANAH
            |--------------------------------------------------------------------------
            */

            $row = DB::table('tanahs')
                ->where('id', $tanah)
                ->lockForUpdate()
                ->first();

            abort_unless($row, 404);

            // Jangan hapus aset yang masih mempunyai pengaitan voucher baru.
            if (
                app(KibVoucherLinkService::class)->ready() &&
                DB::table('kib_voucher_links')->where('kib', 'tanah')
                ->where('record_id', $tanah)->exists()
            ) {
                throw ValidationException::withMessages([
                    'tanah' => 'Tanah memiliki voucher terhubung. Koreksi hubungan harus diaudit terlebih dahulu.',
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | 02. PDF YANG DIKELOLA APLIKASI
            |--------------------------------------------------------------------------
            */

            $pdfQuery = $this->pdfQuery()
                ->where('p.id_tanah', $tanah)
                ->where(
                    'p.dok',
                    'like',
                    'tanah/sertifikat/%'
                );

            $paths = (clone $pdfQuery)
                ->pluck('p.dok')
                ->all();

            $newPaths = DB::table('tanah_lampirans')
                ->where('tanah_id', $tanah)
                ->pluck('path')->all();
            $paths = array_merge($paths, $newPaths);
            DB::table('tanah_lampirans')->where('tanah_id', $tanah)->delete();

            /*
            |--------------------------------------------------------------------------
            | 03. HAPUS REFERENSI PDF
            |--------------------------------------------------------------------------
            */

            $pdfQuery->delete();

            /*
            |--------------------------------------------------------------------------
            | 04. HAPUS DATA TANAH
            |--------------------------------------------------------------------------
            */

            DB::table('tanahs')
                ->where('id', $tanah)
                ->delete();

            /*
            |--------------------------------------------------------------------------
            | 05. KEMBALIKAN STATUS TRANSAKSI SUMBER
            |--------------------------------------------------------------------------
            */

            if (!empty($row->nilai_aktiva_id)) {
                DB::table('nilai_aktivas')
                    ->where(
                        'id',
                        $row->nilai_aktiva_id
                    )
                    ->whereIn('jenisn', [1, 2])
                    ->update([
                        'stat' => 0,
                        'updated_at' => now(),
                    ]);
            }
        });

        /*
        |--------------------------------------------------------------------------
        | 06. HAPUS FILE FISIK SETELAH DATABASE BERHASIL
        |--------------------------------------------------------------------------
        */

        foreach ($paths as $path) {
            if (
                is_string($path)
                &&
                (
                    str_starts_with($path, 'tanah/sertifikat/') ||
                    str_starts_with($path, 'tanah/lampiran/')
                )
            ) {
                Storage::disk('local')->delete($path);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 07. RESPONSE
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route('kib.tanah')
            ->with(
                'success',
                'Data Tanah berhasil dihapus.'
            );
    }



    /** Resolve only files under approved roots; prevent path traversal. */
    private function pdfFile(string $file): ?string
    {
        $file = trim(str_replace('\\', '/', $file));
        if ($file === '' || preg_match('~(^/|^[a-zA-Z]:/|(^|/)\.\.(/|$)|[\x00-\x1f])~', $file)) return null;
        $candidates = [
            storage_path('app/private/' . $file),
            storage_path('app/public/' . $file),
            storage_path('app/' . $file),
            public_path($file),
            // Arsip PDF legacy: pdfs.dok hanya nama file; old app menyimpan
            // di public/assets/img/lokasi/{nama_file.pdf}.
            public_path('assets/img/lokasi/' . $file),
        ];
        foreach ($candidates as $candidate) {
            $real = realpath($candidate);
            if (!$real || !is_file($real) || strtolower(pathinfo($real, PATHINFO_EXTENSION)) !== 'pdf') continue;
            foreach ([storage_path('app/private'), storage_path('app/public'), storage_path('app'), public_path()] as $root) {
                $allowed = realpath($root);
                if ($allowed && str_starts_with($real, rtrim($allowed, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR)) return $real;
            }
        }
        return null;
    }

    private function deliverPdf(int $pdf, bool $download)
    {
        $row = $this->pdfQuery()->where('p.id', $pdf)->first(['p.id', 'p.dok']);
        abort_unless($row, 404);
        $file = $this->pdfFile((string) $row->dok);
        abort_unless($file, 404, 'File PDF belum tersedia pada penyimpanan server.');
        $name = 'sertifikat-tanah-' . $pdf . '.pdf';
        return response()->file($file, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($download ? 'attachment' : 'inline') . '; filename="' . $name . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function viewPdf(int $pdf)
    {
        return $this->deliverPdf($pdf, false);
    }
    public function downloadPdf(int $pdf)
    {
        return $this->deliverPdf($pdf, true);
    }


    /*
        |--------------------------------------------------------------------------
        | K.I.B B — PERALATAN DAN MESIN
        |--------------------------------------------------------------------------
        |
        | Semua fungsi Mesin berada di KIBController.
        |
        | 1. Halaman utama
        | 2. Transaksi pending
        | 3. Detail lokasi
        | 4. Detail satu barang
        | 5. Validasi
        | 6. Pemetaan field
        | 7. Tambah barang
        | 8. Edit barang
        | 9. Hapus barang
        | 10. Akses foto/dokumen
        |
        */

    /*
        |--------------------------------------------------------------------------
        | 01. CATEGORY MESIN
        |--------------------------------------------------------------------------
        */

    private function mesinKategori(): int
    {
        $id = app(KibNotificationService::class)
            ->categoryId('mesin');

        if ($id === null) {
            throw new \RuntimeException(
                'Kategori Peralatan dan Mesin belum tersedia di config/kib.php.'
            );
        }

        return (int) $id;
    }



    /**
     * ===================================================
     * QUERY NILAI MESIN - LOGIKA WEBSITE LAMA
     * ===================================================
     *
     * nilai_aktivas.id_aktiva -> aktivas.id
     * aktivas.kib -> KIB B - PERALATAN DAN MESIN
     *
     * Dipakai oleh KPI, tabel lokasi, dan rincian nilai.
     */
    private function queryNilaiMesin(): \Illuminate\Database\Query\Builder
    {
        return DB::table('nilai_aktivas as n')
            ->join(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )
            ->where(function ($q) {
                $q->where('a.kib', 'KIB B - PERALATAN DAN MESIN')
                    ->orWhereRaw("BTRIM(a.kode) = ? OR BTRIM(a.kode) LIKE ?", ['31.08', '31.08.%']);
            });
    }

    /**
     * ===================================================
     * HALAMAN UTAMA K.I.B PERALATAN DAN MESIN
     * ===================================================
     */
    public function dataMesin()
    {
        $cat = $this->mesinKategori();

        // Agregasi transaksi dilakukan sebelum JOIN
        // dengan mesins, untuk mencegah double counting.
        $nilaiLokasi = $this->queryNilaiMesin()
            ->whereNotNull('n.id_lokasi')
            ->select('n.id_lokasi')
            ->selectRaw(
                'COALESCE(SUM(n.nilai), 0) AS nilai_total'
            )
            ->selectRaw(
                'COUNT(n.id) AS jumlah_transaksi'
            )
            ->groupBy('n.id_lokasi');

        // Daftar barang Mesin dikelompokkan per lokasi.
        $mesins = DB::table('mesins as m')
            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'm.id_lokasi'
            )
            ->leftJoin('nilai_aktivas as nv', 'nv.id', '=', 'm.id_voucher2')
            ->leftJoin('aktivas as av', 'av.id', '=', DB::raw('COALESCE(nv.id_aktiva, m.id_aktiva)'))
            ->leftJoinSub(
                $nilaiLokasi,
                'v',
                function ($join) {
                    $join->on(
                        'v.id_lokasi',
                        '=',
                        'm.id_lokasi'
                    );
                }
            )
            ->whereNotNull('m.id_lokasi')
            ->select(
                'm.id_lokasi',
                'l.lokasi',
                'l.alamat'
            )
            ->selectRaw('COUNT(DISTINCT m.id) AS jumlah_barang')
            ->selectRaw("COUNT(DISTINCT CASE
                WHEN BTRIM(COALESCE(av.kode, '')) = '31.08'
                  OR BTRIM(COALESCE(av.kode, '')) LIKE '31.08.%'
                THEN m.id END) AS jumlah_kendaraan")
            ->selectRaw("
                CASE
                    WHEN COUNT(DISTINCT COALESCE(NULLIF(BTRIM(m.status_kepemilikan), ''), '__kosong__')) > 1
                        THEN 'campuran'
                    ELSE COALESCE(MAX(NULLIF(BTRIM(m.status_kepemilikan), '')), '')
                END AS status_kepemilikan_ringkas
            ")
            ->selectRaw(
                'COALESCE(MAX(v.nilai_total), 0) AS nilai_total'
            )
            ->selectRaw(
                'COALESCE(MAX(v.jumlah_transaksi), 0) AS jumlah_transaksi'
            )
            ->selectRaw(
                "MIN(
                    CASE
                        WHEN BTRIM(m.tahun::text) ~ '^[0-9]{4}$'
                        THEN BTRIM(m.tahun::text)
                    END
                ) AS tahun_awal"
            )
            ->selectRaw(
                "MAX(
                    CASE
                        WHEN BTRIM(m.tahun::text) ~ '^[0-9]{4}$'
                        THEN BTRIM(m.tahun::text)
                    END
                ) AS tahun_akhir"
            )
            ->selectRaw(
                "COUNT(DISTINCT
                    CASE
                        WHEN NULLIF(
                            BTRIM(COALESCE(m.dok::text, '')),
                            ''
                        ) IS NOT NULL
                        THEN m.id
                    END
                ) AS jumlah_dokumen"
            )
            ->groupBy(
                'm.id_lokasi',
                'l.lokasi',
                'l.alamat'
            )
            // Lokasi dengan inventaris yang terakhir diinput muncul pertama.
            ->orderByRaw('MAX(m.id) DESC')
            ->orderBy('l.lokasi')
            ->get();

        // Master Data Barang.
        $barangRows = DB::table('barangs')
            ->select(
                'id',
                'nama_barang',
                'kode_barang'
            )
            ->where('status', 'aktif')
            ->orderBy('nama_barang')
            ->get();

        // KPI dari PostgreSQL.
        $totalAset = DB::table('mesins')->count();

        $totalLokasi = DB::table('mesins')
            ->whereNotNull('id_lokasi')
            ->distinct()
            ->count('id_lokasi');

        $totalNilai = $this->queryNilaiMesin()
            ->sum('n.nilai');

        // Jumlah pending menggunakan query yang sama dengan modal Data Pending.
        // Kode Aktiva 31.08 tetap tampil walaupun kategori transaksi lama berbeda.
        $totalPending = $this->pendingSumberMesinKibB()->count('n.id');


        // Referensi Tambah Langsung, tanpa mengubah sumber Pending lama.
        $departemenLangsung = DB::table('departemens')->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))
            ->orderBy('kode_dep')->get(['id', 'kode_dep', 'nama_dep']);
        $divisiLangsung = DB::table('divisis')->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))
            ->orderBy('nama_div')->get(['id', 'id_dep', 'nama_div']);
        $aktivaLangsung = $this->queryAktivaLangsungMesin()->orderBy('kode')->get(['id', 'kode', 'aktiva']);

        return view(
            'kib.mesin',
            compact(
                'mesins',
                'barangRows',
                'totalAset',
                'totalLokasi',
                'totalNilai',
                'totalPending',
                'departemenLangsung',
                'divisiLangsung',
                'aktivaLangsung'
            )
        );
    }





    /**
     * Sumber pending K.I.B B.
     * Kode Aktiva 31.08 mengidentifikasi kendaraan, meskipun kategori
     * transaksi historis tidak sama dengan konfigurasi kategori Mesin.
     * Hanya transaksi belum diproses yang dapat dipilih.
     */
    private function pendingSumberMesinKibB(): \Illuminate\Database\Query\Builder
    {
        $kategori = $this->mesinKategori();

        return DB::table('nilai_aktivas as n')
            ->leftJoin('aktivas as a', 'a.id', '=', 'n.id_aktiva')
            ->where('n.stat', 0)
            ->where(function ($query) use ($kategori) {
                $query->where('n.cat', $kategori)
                    ->orWhereRaw(
                        "(BTRIM(COALESCE(a.kode, '')) = ? OR BTRIM(COALESCE(a.kode, '')) LIKE ?)",
                        ['31.08', '31.08.%']
                    );
            });
    }

    /** Kode 31.08 tetap Kendaraan, termasuk transaksi legacy beda kategori. */
    private function queryAktivaLangsungMesin(): \Illuminate\Database\Query\Builder
    {
        return DB::table('aktivas')->where(function ($q) {
            $q->where('kib', 'KIB B - PERALATAN DAN MESIN')
                ->orWhereRaw("BTRIM(kode) = ? OR BTRIM(kode) LIKE ?", ['31.08', '31.08.%']);
        })->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'));
    }

    private function kodeAktivaInventarisMesin(object $row): ?string
    {
        $id = !empty($row->id_voucher2)
            ? DB::table('nilai_aktivas')->where('id', $row->id_voucher2)->value('id_aktiva') : null;
        $id ??= $row->id_aktiva ?? null;
        return $id ? DB::table('aktivas')->where('id', $id)->value('kode') : null;
    }

    /** Jenis/kategori/status sumber yang boleh dikaitkan, sama untuk GET dan POST. */
    private function voucherMesinLayak(object $voucher, int $cat): bool
    {
        $kendaraan = $this->isKodeAktivaKendaraanKibB($voucher->kode_aktiva ?? null);
        return ($kendaraan || (trim((string) ($voucher->kib_aktiva ?? '')) === 'KIB B - PERALATAN DAN MESIN'
            && ((int) $voucher->stat === 1 || (int) $voucher->cat === $cat)))
            && $voucher->stat !== null && in_array((int) $voucher->stat, [0, 1], true)
            && in_array((int) $voucher->jenisn, [1, 2], true);
    }

    private function isKodeAktivaKendaraanKibB(?string $kode): bool
    {
        return preg_match('/^31\.08(?:\.|$)/', trim((string) $kode)) === 1;
    }

    /**
     * ============================================================
     * PENDING NILAI ASET PERALATAN DAN MESIN
     *
     * Termasuk informasi Kode Aktiva untuk
     * pergantian form otomatis.
     * ============================================================
     */
    public function pendingMesin()
    {
        $cat = $this->mesinKategori();

        $base = $this->pendingSumberMesinKibB();
        $count = (clone $base)->count('n.id');

        $rows = (clone $base)
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
                'divisis as v',
                'v.id',
                '=',
                'n.div'
            )

            ->select([
                'n.id',
                'n.no_voucher',
                'n.tgl_voucher',
                'n.nilai',
                'n.urai',
                'n.tahun',

                'n.id_lokasi',
                'n.dep',
                'n.div',
                'n.jenisn',

                'n.id_aktiva',
                'a.kode as kode_aktiva',
                'a.aktiva as nama_aktiva',

                'l.lokasi',
                'l.alamat',
            ])

            ->selectRaw(
                "BTRIM(COALESCE(d.kode_dep, d.nama_dep, '')) AS departemen"
            )

            ->selectRaw(
                "BTRIM(COALESCE(v.nama_div, '')) AS divisi"
            )

            ->orderByDesc('n.tgl_voucher')
            ->orderByDesc('n.id')

            ->limit(1000)
            ->get();

        $data = $rows->map(function ($row) {

            $kode = trim(
                (string) ($row->kode_aktiva ?? '')
            );

            return [
                'id' => (int) $row->id,

                'no_voucher' => trim(
                    (string) ($row->no_voucher ?? '')
                ),

                'tgl_voucher' => $row->tgl_voucher,

                'nilai' => (int) ($row->nilai ?? 0),

                'urai' => $row->urai,

                'tahun' => $row->tahun,

                'id_lokasi' => $row->id_lokasi,

                'lokasi' => trim(
                    (string) ($row->lokasi ?? '')
                ),

                'alamat' => trim(
                    (string) ($row->alamat ?? '')
                ),

                'dep' => $row->dep,

                'departemen' => trim(
                    (string) ($row->departemen ?? '')
                ),

                'div' => $row->div,

                'divisi' => trim(
                    (string) ($row->divisi ?? '')
                ),

                'jenisn' => (int) ($row->jenisn ?? 0),

                'id_aktiva' => $row->id_aktiva,

                'kode_aktiva' => $kode,

                'nama_aktiva' => trim(
                    (string) ($row->nama_aktiva ?? '')
                ),

                'is_kendaraan' => str_starts_with(
                    $kode,
                    '31.08.'
                ),
            ];
        });

        return response()->json([
            'success' => true,

            'module' => 'mesin',

            'category_id' => $cat,

            'count' => $count,

            'data' => $data->values(),
        ]);
    }



    /*
        |--------------------------------------------------------------------------
        | 04. DETAIL SEMUA MESIN DALAM SATU LOKASI
        |--------------------------------------------------------------------------
        */

    public function detailMesinLokasi(int $lokasi)
    {
        $location = DB::table('lokasis')
            ->where('id', $lokasi)
            ->first([
                'id',
                'lokasi',
                'alamat'
            ]);

        abort_unless($location, 404);

        $rows = DB::table('mesins as m')
            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'm.id_barang'
            )
            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'm.id_departemen'
            )
            ->leftJoin(
                'divisis as v',
                'v.id',
                '=',
                'm.id_div'
            )
            ->leftJoin(
                'nilai_aktivas as n',
                'n.id',
                '=',
                'm.id_voucher2'
            )
            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                DB::raw('COALESCE(n.id_aktiva, m.id_aktiva)')
            )
            ->where('m.id_lokasi', $lokasi)
            ->select('m.*')
            ->selectRaw(
                "BTRIM(COALESCE(b.nama_barang, '')) AS nama_barang"
            )
            ->selectRaw(
                "BTRIM(COALESCE(b.kode_barang, '')) AS kode_barang"
            )
            ->selectRaw(
                "BTRIM(COALESCE(d.kode_dep, d.nama_dep, '')) AS departemen"
            )
            ->selectRaw(
                "BTRIM(COALESCE(v.nama_div, '')) AS divisi"
            )
            ->selectRaw(
                "BTRIM(COALESCE(a.kode, '')) AS kode_aktiva"
            )
            ->selectRaw(
                "BTRIM(COALESCE(a.aktiva, '')) AS nama_aktiva"
            )
            ->orderByDesc('m.id')
            ->get();

        return response()->json([
            'success' => true,
            'lokasi' => $location,
            'data' => $this->nilaiLaporanKib($rows->all(), 'mesin', 'id', 'harga'),
            'pengaitan_siap' => app(KibVoucherLinkService::class)->ready(),
        ]);
    }


    /**
     * ===================================================
     * RINCIAN NILAI MESIN PER LOKASI
     * GET /kib/mesin/lokasi/{lokasi}/nilai
     * ===================================================
     */
    public function detailNilaiMesinLokasi(int $lokasi)
    {
        $lokasiRow = DB::table('lokasis')
            ->where('id', $lokasi)
            ->first([
                'id',
                'lokasi',
                'alamat',
            ]);

        abort_unless(
            $lokasiRow,
            404,
            'Lokasi tidak ditemukan.'
        );

        $query = $this->queryNilaiMesin()
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
            ->where('n.id_lokasi', $lokasi);

        $total = (clone $query)
            ->sum('n.nilai');

        $rows = $query
            ->select([
                'n.id',
                'n.no_voucher',
                'n.tgl_voucher',
                'n.tahun',
                'n.jenisn',
                'n.stat',
                'n.cat',
                'a.kib as kib_aktiva',
                'n.urai',
                'n.nilai',
                'a.kode as kode_aktiva',
                'a.aktiva as nama_aktiva',
                'd.kode_dep as departemen',
                'dv.nama_div as divisi',
            ])
            ->orderBy('n.tgl_voucher')
            ->orderBy('n.id')
            ->get();

        $links = app(KibVoucherLinkService::class);
        $ids = $rows->pluck('id')->map(fn($id) => (int) $id)->all();
        $owners = $links->owners($ids);
        $ready = $links->ready();
        $manual = $ready && $ids ? DB::table('kib_voucher_links')->whereIn('nilai_aktiva_id', $ids)
            ->where('kib', 'mesin')->where('id_lokasi', $lokasi)->get()->keyBy('nilai_aktiva_id') : collect();
        $targets = DB::table('mesins as m')->leftJoin('barangs as b', 'b.id', '=', 'm.id_barang')
            ->leftJoin('nilai_aktivas as n', 'n.id', '=', 'm.id_voucher2')
            ->leftJoin('aktivas as a', 'a.id', '=', DB::raw('COALESCE(n.id_aktiva, m.id_aktiva)'))
            ->where('m.id_lokasi', $lokasi)->select('m.id', 'm.kode', 'm.reg', 'b.nama_barang', 'a.kode as kode_aktiva')
            ->orderByDesc('m.id')->get()->keyBy('id');
        $cat = $this->mesinKategori();
        foreach ($rows as $item) {
            $owner = $owners[(int) $item->id] ?? [];
            $one = count($owner) === 1 ? $owner[0] : null;
            $target = $one && $one['kategori'] === 'mesin' ? $targets->get($one['record_id']) : null;
            $link = $manual->get($item->id);
            $item->status_hubungan = count($owner) > 1 ? 'konflik' : ($one ? 'terhubung' : 'belum');
            $item->barang_tujuan = $one ? [
                'kategori' => $one['kategori'],
                'id' => $one['record_id'],
                'sumber' => $one['sumber'],
                'nama' => $target ? trim((string) $target->nama_barang) : null,
            ] : null;
            $item->is_kendaraan = $this->isKodeAktivaKendaraanKibB($item->kode_aktiva);
            $item->boleh_hubungkan = $ready && !$owner && $this->voucherMesinLayak($item, $cat);
            $item->boleh_lepaskan = $ready && $one && $one['kategori'] === 'mesin' && $one['sumber'] === 'pengaitan'
                && $link && (int) $link->record_id === $one['record_id'];
            $item->link_id = $item->boleh_lepaskan ? (int) $link->id : null;
        }

        return response()->json([
            'success' => true,
            'pengaitan_siap' => $ready,
            'targets' => $targets->values()->map(fn($item) => [
                'id' => (int) $item->id,
                'nama_barang' => trim((string) $item->nama_barang),
                'kode' => trim((string) $item->kode),
                'reg' => trim((string) $item->reg),
                'is_kendaraan' => $this->isKodeAktivaKendaraanKibB($item->kode_aktiva),
            ]),

            'lokasi' => [
                'id' => $lokasiRow->id,
                'nama' => $lokasiRow->lokasi,
                'alamat' => $lokasiRow->alamat,
            ],

            'count' => $rows->count(),
            'total' => $total,
            'data' => $rows,
        ]);
    }


    /*
        |--------------------------------------------------------------------------
        | 05. DETAIL SATU MESIN UNTUK EDIT
        |--------------------------------------------------------------------------
        */

    public function showMesin(int $mesin)
    {
        $row = DB::table('mesins as m')
            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'm.id_barang'
            )
            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'm.id_lokasi'
            )
            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'm.id_departemen'
            )
            ->leftJoin(
                'divisis as v',
                'v.id',
                '=',
                'm.id_div'
            )
            ->leftJoin('nilai_aktivas as n', 'n.id', '=', 'm.id_voucher2')
            ->leftJoin('aktivas as a', 'a.id', '=', DB::raw('COALESCE(n.id_aktiva, m.id_aktiva)'))
            ->where('m.id', $mesin)
            ->select('m.*', 'a.kode as kode_aktiva', 'a.aktiva as nama_aktiva')
            ->selectRaw(
                "BTRIM(COALESCE(b.nama_barang, '')) AS nama_barang"
            )
            ->selectRaw(
                "BTRIM(COALESCE(l.lokasi, '')) AS lokasi"
            )
            ->selectRaw(
                "BTRIM(COALESCE(l.alamat, '')) AS alamat"
            )
            ->selectRaw(
                "BTRIM(COALESCE(d.kode_dep, d.nama_dep, '')) AS departemen"
            )
            ->selectRaw(
                "BTRIM(COALESCE(v.nama_div, '')) AS divisi"
            )
            ->first();

        abort_unless($row, 404);

        return response()->json([
            'success' => true,
            'data' => $row,
        ]);
    }


    /*
        |--------------------------------------------------------------------------
        | 06. VALIDASI FORM MESIN
        |--------------------------------------------------------------------------
        |
        | harga dan susut maksimum 2.147.483.647
        | karena kolom lama menggunakan INTEGER PostgreSQL.
        |
        | Nilai transaksi keuangan yang lebih besar tetap berada
        | pada nilai_aktivas.nilai dengan tipe BIGINT.
        |
        */

    private function validasiMesin(
        Request $request,
        bool $create
    ): array {
        $rules = [
            'id_barang' => [
                'required',
                'integer',
                'exists:barangs,id'
            ],

            'status_kepemilikan' => [
                'required',
                Rule::in(['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta']),
            ],

            'kode' => ['required', 'string', 'max:255'],
            'reg' => ['nullable', 'string', 'max:255'],
            'tahun' => ['required', 'digits:4'],

            'bahan' => ['nullable', 'string', 'max:255'],
            'asal' => ['nullable', 'string', 'max:255'],
            'ukuran' => ['nullable', 'string', 'max:255'],
            'merk' => ['nullable', 'string', 'max:255'],
            'pabrik' => ['nullable', 'string', 'max:255'],
            'nomor_dokumen' => ['nullable', 'string', 'max:255'],

            'rangka' => ['nullable', 'string', 'max:255'],
            'nomor_mesin' => ['nullable', 'string', 'max:255'],
            'polisi' => ['nullable', 'string', 'max:255'],
            'bpkb' => ['nullable', 'string', 'max:255'],

            'guna' => ['nullable', 'string', 'max:255'],
            'fungsi' => ['nullable', 'string', 'max:255'],
            'struktur' => ['nullable', 'string', 'max:255'],
            'kondisi' => ['nullable', 'string', 'max:255'],
            'ket' => ['nullable', 'string'],

            'harga' => [
                'nullable',
                'integer',
                'between:0,2147483647'
            ],

            'susut' => [
                'nullable',
                'integer',
                'between:0,2147483647'
            ],

            'foto' => [
                'nullable',
                'image',
                'max:5120'
            ],

            'dokumen' => [
                'nullable',
                'file',
                'mimes:pdf',
                'max:15360'
            ],
        ];

        if ($create) {
            $rules['id_nilai_aktiva'] = [
                'required',
                'integer',
                'exists:nilai_aktivas,id'
            ];
        }

        return $request->validate($rules);
    }


    /*
        |--------------------------------------------------------------------------
        | 07. PEMETAAN FIELD KE TABEL MESINS
        |--------------------------------------------------------------------------
        |
        | Field wajib legacy yang belum diisi memakai '-'.
        | Informasi organisasi tidak diambil dari input browser.
        |
        */

    /**
     * Memetakan field sesuai jenis K.I.B B.
     * Nomor Polisi / Rangka / Mesin / BPKB / Pabrik hanya boleh diproses
     * untuk inventaris yang kode AKTIVA sumbernya 31.08.
     *
     * Pada Edit non-Kendaraan field warisan tidak ditimpa sehingga data lama
     * tidak hilang. Pada Tambah non-Kendaraan, kolom legacy NOT NULL diisi '-'.
     */
    private function fieldsMesin(
        array $input,
        bool $kendaraan,
        bool $create = false
    ): array {
        $legacy = static fn(string $key): string =>
        trim((string) ($input[$key] ?? '')) ?: '-';

        $data = [
            'id_barang' => (int) $input['id_barang'],
            'status_kepemilikan' => $input['status_kepemilikan'],
            'kode' => trim((string) $input['kode']),
            'reg' => $legacy('reg'),
            'tahun' => (string) $input['tahun'],
            'harga' => (isset($input['harga']) && $input['harga'] !== '')
                ? (int) $input['harga'] : null,
            'susut' => (isset($input['susut']) && $input['susut'] !== '')
                ? (int) $input['susut'] : 0,
            'bahan' => $legacy('bahan'),
            'asal' => $legacy('asal'),
            'ukuran' => $legacy('ukuran'),
            'merk' => $legacy('merk'),
            'guna' => $input['guna'] ?? null,
            'fungsi' => $input['fungsi'] ?? null,
            'struktur' => $input['struktur'] ?? null,
            'kondisi' => $input['kondisi'] ?? null,
            'ket' => $input['ket'] ?? null,
            'updated_at' => now(),
        ];

        if ($kendaraan) {
            $data['pabrik'] = $legacy('pabrik');
            $data['rangka'] = $legacy('rangka');
            $data['mesin'] = $legacy('nomor_mesin');
            $data['polisi'] = $legacy('polisi');
            $data['bpkb'] = $legacy('bpkb');
        } elseif ($create) {
            // Kolom NOT NULL tabel mesins lawas membutuhkan placeholder.
            // Tidak dipakai sebagai data Kendaraan dan tidak tampil di form Mesin.
            $data['pabrik'] = '-';
            $data['rangka'] = '-';
            $data['mesin'] = '-';
            $data['polisi'] = '-';
            $data['bpkb'] = '-';
        }

        if (!$kendaraan && array_key_exists('nomor_dokumen', $input)) {
            if (!Schema::hasColumn('mesins', 'nomor_dokumen')) {
                if (trim((string) ($input['nomor_dokumen'] ?? '')) !== '') {
                    throw ValidationException::withMessages([
                        'nomor_dokumen' => 'Kolom nomor_dokumen belum tersedia. '
                            . 'Jalankan migration tambahan K.I.B B yang disertakan, '
                            . 'setelah backup dan pengujian pada database salinan.',
                    ]);
                }
            } else {
                $value = trim((string) ($input['nomor_dokumen'] ?? ''));
                $data['nomor_dokumen'] = $value !== '' ? $value : null;
            }
        }

        return $data;
    }


    /*
        |--------------------------------------------------------------------------
        | 08. SIMPAN DATA MESIN
        |--------------------------------------------------------------------------
        |
        | Tombol Pilih:
        | nilai_aktivas.id → mesins.id_voucher2
        |
        | Lokasi:
        | nilai_aktivas.id_lokasi → mesins.id_lokasi
        |
        | Departemen:
        | nilai_aktivas.dep → mesins.id_departemen
        |
        | Divisi:
        | nilai_aktivas.div → mesins.id_div
        |
        | Setelah sukses:
        | nilai_aktivas.stat = 1
        |
        */

    /** Form detail lokasi tanpa voucher. Data teknis menggunakan mapper lama. */
    public function storeMesinLangsung(Request $request, int $lokasi)
    {
        $input = $this->validasiMesin($request, false);
        $org = $request->validate([
            'id_departemen' => ['required', 'integer', 'exists:departemens,id'],
            'id_div' => ['required', 'integer', 'exists:divisis,id'],
            'id_aktiva' => ['required', 'integer', 'exists:aktivas,id'],
            'ket' => ['nullable', 'string', 'max:255'],
            'id_nilai_aktiva' => ['prohibited'],
        ]);
        $files = [];
        try {
            $id = DB::transaction(function () use ($request, $lokasi, $org, $input, &$files) {
                abort_unless(DB::table('lokasis')->where('id', $lokasi)->exists(), 404);
                $dep = DB::table('departemens')->where('id', $org['id_departemen'])
                    ->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))->exists();
                $div = DB::table('divisis')->where('id', $org['id_div'])->where('id_dep', $org['id_departemen'])
                    ->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))->exists();
                $aktiva = $this->queryAktivaLangsungMesin()->where('id', $org['id_aktiva'])->first(['id', 'kode']);
                if (!$dep || !$div || !$aktiva || !DB::table('barangs')->where('id', $input['id_barang'])->where('status', 'aktif')->exists()) {
                    throw ValidationException::withMessages(['referensi' => 'Pilih barang aktif, Departemen/Divisi yang sesuai, dan Kode Aktiva K.I.B B yang tidak nonaktif.']);
                }
                $data = $this->fieldsMesin($input, $this->isKodeAktivaKendaraanKibB($aktiva->kode), true);
                $data['id_lokasi'] = $lokasi;
                $data['id_departemen'] = (int) $org['id_departemen'];
                $data['id_div'] = (int) $org['id_div'];
                $data['id_aktiva'] = (int) $aktiva->id;
                $data['id_voucher2'] = null;
                $data['harga'] = null; // nilai keuangan berasal dari pengaitan, tidak ditulis ke INTEGER lama
                $data['jenis'] = null;
                $data['input'] = 1;
                $data['id_user'] = Auth::id();
                $data['created_at'] = now();
                foreach (['dokumen' => 'dok', 'foto' => 'img'] as $field => $column) {
                    if ($request->hasFile($field)) {
                        $path = $request->file($field)->store('kib/mesin/' . $field, 'local');
                        if (!$path) throw new \RuntimeException('Gagal menyimpan lampiran inventaris.');
                        $data[$column] = $path;
                        $files[] = $path;
                    }
                }
                return DB::table('mesins')->insertGetId($data);
            });
        } catch (\Throwable $e) {
            foreach ($files as $path) Storage::disk('local')->delete($path);
            throw $e;
        }
        return response()->json([
            'success' => true,
            'id' => (int) $id,
            'message' => 'Data langsung berhasil ditambahkan tanpa voucher.'
        ], 201);
    }

    /** Pengaitan voucher manual: kunci sumber dulu, kemudian target. */
    public function hubungkanNilaiMesin(Request $request, int $lokasi, KibVoucherLinkService $links, KibNotificationService $notifications)
    {
        $input = $request->validate([
            'nilai_aktiva_id' => ['required', 'integer'],
            'mesin_id' => ['required', 'integer'],
            'konfirmasi' => ['required', 'accepted'],
        ]);
        $links->assertReady();
        $cat = $this->mesinKategori();
        $audit = DB::transaction(function () use ($input, $lokasi, $links, $cat) {
            $voucher = DB::table('nilai_aktivas')->where('id', $input['nilai_aktiva_id'])->where('id_lokasi', $lokasi)
                ->lockForUpdate()->first();
            $target = DB::table('mesins')->where('id', $input['mesin_id'])->where('id_lokasi', $lokasi)
                ->lockForUpdate()->first();
            if (!$voucher || !$target) {
                throw ValidationException::withMessages(['voucher' => 'Voucher dan inventaris harus berada pada lokasi yang sama.']);
            }
            $aktiva = DB::table('aktivas')->where('id', $voucher->id_aktiva)->first(['kode', 'kib']);
            $voucher->kode_aktiva = $aktiva->kode ?? null;
            $voucher->kib_aktiva = $aktiva->kib ?? null;
            if (
                !$aktiva || !$this->voucherMesinLayak($voucher, $cat)
                || $this->isKodeAktivaKendaraanKibB($voucher->kode_aktiva) !== $this->isKodeAktivaKendaraanKibB($this->kodeAktivaInventarisMesin($target))
            ) {
                throw ValidationException::withMessages(['voucher' => 'Voucher harus sesuai jenis Peralatan/Mesin atau Kendaraan, kategori, status, dan lokasi tujuan.']);
            }
            $links->linkMesin((int) $voucher->id, (int) $target->id, $lokasi, Auth::id());
            if (
                (int) $voucher->stat === 0 && DB::table('nilai_aktivas')->where('id', $voucher->id)->where('stat', 0)
                ->update(['stat' => 1, 'updated_at' => now()]) !== 1
            ) {
                throw ValidationException::withMessages(['voucher' => 'Status voucher sudah berubah. Muat ulang riwayat.']);
            }
            return ['nilai_aktiva_id' => (int) $voucher->id, 'mesin_id' => (int) $target->id, 'id_lokasi' => $lokasi, 'user_id' => Auth::id()];
        }, 3);
        Log::info('KIB B: voucher manual dihubungkan', $audit);
        $notifications->clearCache();
        return response()->json(['success' => true, 'message' => 'Voucher berhasil dihubungkan.']);
    }

    /** Tidak menghapus inventaris, transaksi atau pointer historis. */
    public function lepaskanNilaiMesin(Request $request, int $lokasi, KibVoucherLinkService $links)
    {
        $input = $request->validate([
            'nilai_aktiva_id' => ['required', 'integer'],
            'mesin_id' => ['required', 'integer'],
            'link_id' => ['required', 'integer'],
            'konfirmasi' => ['required', 'accepted'],
        ]);
        $links->assertReady();
        $audit = DB::transaction(function () use ($input, $lokasi, $links) {
            $voucher = DB::table('nilai_aktivas')->where('id', $input['nilai_aktiva_id'])->where('id_lokasi', $lokasi)
                ->lockForUpdate()->first(['id']);
            $query = DB::table('kib_voucher_links')->where('id', $input['link_id'])->where('kib', 'mesin')
                ->where('nilai_aktiva_id', $input['nilai_aktiva_id'])->where('record_id', $input['mesin_id'])->where('id_lokasi', $lokasi);
            $link = $voucher ? (clone $query)->lockForUpdate()->first() : null;
            $owners = $voucher ? ($links->owners([(int) $voucher->id])[(int) $voucher->id] ?? []) : [];
            if (
                !$link || count($owners) !== 1 || $owners[0]['kategori'] !== 'mesin'
                || $owners[0]['sumber'] !== 'pengaitan' || $owners[0]['record_id'] !== (int) $input['mesin_id'] || $query->delete() !== 1
            ) {
                throw ValidationException::withMessages(['voucher' => 'Relasi tidak tersedia, sudah berubah, atau merupakan sumber historis.']);
            }
            return [
                'link_id' => (int) $link->id,
                'nilai_aktiva_id' => (int) $voucher->id,
                'mesin_id' => (int) $input['mesin_id'],
                'id_lokasi' => $lokasi,
                'user_id' => Auth::id()
            ];
        }, 3);
        Log::info('KIB B: voucher manual dilepas', $audit);
        return response()->json(['success' => true, 'message' => 'Hubungan dilepas. Voucher dapat dipilih kembali.']);
    }

    public function storeMesin(Request $request)
    {
        $input = $this->validasiMesin($request, true);
        $cat = $this->mesinKategori();

        $files = [];
        $kendaraanDisimpan = false;

        try {
            DB::transaction(function () use (
                $request,
                $input,
                $cat,
                &$files,
                &$kendaraanDisimpan
            ) {
                // Kunci transaksi sumber agar tidak diproses bersamaan.
                // Kunci hanya tabel nilai_aktivas: PostgreSQL melarang
                // FOR UPDATE pada sisi nullable sebuah LEFT JOIN.
                $source = DB::table('nilai_aktivas')
                    ->where('id', $input['id_nilai_aktiva'])
                    ->where('stat', 0)
                    ->lockForUpdate()
                    ->first();

                $kodeAktivaSource = $source && $source->id_aktiva
                    ? DB::table('aktivas')->where('id', $source->id_aktiva)->value('kode')
                    : null;
                $kodeKendaraan = $this->isKodeAktivaKendaraanKibB($kodeAktivaSource);

                if (
                    !$source
                    || (!$kodeKendaraan && (int) $source->cat !== $cat)
                    || !$source->id_lokasi
                    || !$source->dep
                    || !$source->div
                ) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' =>
                        'Transaksi pending tidak dapat dipakai. Pastikan kategori K.I.B B atau kode 31.08 serta Lokasi, Departemen, dan Divisi lengkap.'
                    ]);
                }

                // Cegah satu transaksi dipakai dua barang.
                $used = !empty(app(KibVoucherLinkService::class)->owners([(int) $source->id])[(int) $source->id]);

                if ($used) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' =>
                        'Transaksi Nilai Aset ini sudah digunakan oleh data Mesin.'
                    ]);
                }

                $data = $this->fieldsMesin($input, $kodeKendaraan, true);
                $kendaraanDisimpan = $kodeKendaraan;

                // Data organisasi berasal dari database.
                $data['id_lokasi'] = (int) $source->id_lokasi;
                $data['id_departemen'] = (int) $source->dep;
                $data['id_div'] = (int) $source->div;

                // Hubungan dengan Nilai Aset tetap menjadi sumber kebenaran.
                $data['id_voucher2'] = (int) $source->id;
                $data['jenis'] = (int) ($source->jenisn ?? 0);
                if (Schema::hasColumn('mesins', 'id_aktiva') && $source->id_aktiva) {
                    $data['id_aktiva'] = (int) $source->id_aktiva;
                }

                $data['input'] = 1;
                $data['id_user'] = Auth::id();
                $data['created_at'] = now();

                // Dokumen disimpan pada storage privat.
                if ($request->hasFile('dokumen')) {
                    $data['dok'] = $request
                        ->file('dokumen')
                        ->store(
                            'kib/mesin/dokumen',
                            'local'
                        );

                    $files[] = $data['dok'];
                }

                // Foto disimpan pada storage privat.
                if ($request->hasFile('foto')) {
                    $data['img'] = $request
                        ->file('foto')
                        ->store(
                            'kib/mesin/foto',
                            'local'
                        );

                    $files[] = $data['img'];
                }

                DB::table('mesins')->insert($data);

                // Selesaikan transaksi sumber.
                $updated = DB::table('nilai_aktivas')
                    ->where('id', $source->id)
                    ->where('stat', 0)
                    ->update([
                        'stat' => 1,
                        'updated_at' => now(),
                    ]);

                if ($updated !== 1) {
                    throw new \RuntimeException(
                        'Gagal memperbarui status Nilai Aset.'
                    );
                }
            });
        } catch (\Throwable $exception) {
            foreach ($files as $path) {
                Storage::disk('local')->delete($path);
            }

            throw $exception;
        }

        return redirect()
            ->to(route('kib.mesin') . ($kendaraanDisimpan ? '#masa-pajak' : '#daftar-mesin'))
            ->with('success', $kendaraanDisimpan
                ? 'Kendaraan berhasil diinventarisasi dan terhubung ke lokasi serta menu Masa Pajak Kendaraan.'
                : 'Data Peralatan dan Mesin berhasil disimpan.');
    }


    /*
        |--------------------------------------------------------------------------
        | 09. UPDATE DATA MESIN
        |--------------------------------------------------------------------------
        |
        | Mengedit data teknis barang tidak mengubah:
        | - transaksi sumber
        | - lokasi
        | - departemen
        | - divisi
        |
        */

    public function updateMesin(
        Request $request,
        int $mesin
    ) {
        $input = $this->validasiMesin($request, false);

        $newFiles = [];
        $oldFiles = [];

        try {
            DB::transaction(function () use (
                $request,
                $input,
                $mesin,
                &$newFiles,
                &$oldFiles
            ) {
                $row = DB::table('mesins')
                    ->where('id', $mesin)
                    ->lockForUpdate()
                    ->first();

                abort_unless($row, 404);

                // Kategori Edit tidak boleh hanya bergantung pada mode di browser.
                // Ambil kode Aktiva resmi dari inventaris / voucher yang tersimpan.
                $aktivaId = null;
                if (!empty($row->id_voucher2)) {
                    $aktivaId = DB::table('nilai_aktivas')
                        ->where('id', $row->id_voucher2)
                        ->value('id_aktiva');
                }
                $aktivaId ??= $row->id_aktiva ?? null;
                $kodeAktiva = $aktivaId
                    ? DB::table('aktivas')->where('id', $aktivaId)->value('kode')
                    : null;
                $kendaraan = $this->isKodeAktivaKendaraanKibB($kodeAktiva);
                $data = $this->fieldsMesin($input, $kendaraan, false);

                if ($request->hasFile('dokumen')) {
                    $data['dok'] = $request
                        ->file('dokumen')
                        ->store('kib/mesin/dokumen', 'local');

                    $newFiles[] = $data['dok'];

                    if (
                        $row->dok
                        && str_starts_with(
                            $row->dok,
                            'kib/mesin/dokumen/'
                        )
                    ) {
                        $oldFiles[] = $row->dok;
                    }
                }

                if ($request->hasFile('foto')) {
                    $data['img'] = $request
                        ->file('foto')
                        ->store('kib/mesin/foto', 'local');

                    $newFiles[] = $data['img'];

                    if (
                        $row->img
                        && str_starts_with(
                            $row->img,
                            'kib/mesin/foto/'
                        )
                    ) {
                        $oldFiles[] = $row->img;
                    }
                }

                DB::table('mesins')
                    ->where('id', $mesin)
                    ->update($data);
            });
        } catch (\Throwable $exception) {
            foreach ($newFiles as $path) {
                Storage::disk('local')->delete($path);
            }

            throw $exception;
        }

        // Hapus file lama setelah database sukses.
        foreach ($oldFiles as $path) {
            Storage::disk('local')->delete($path);
        }

        return redirect()
            ->route('kib.mesin')
            ->with(
                'success',
                'Data Mesin berhasil diperbarui.'
            );
    }


    /*
        |--------------------------------------------------------------------------
        | 10. HAPUS DATA MESIN
        |--------------------------------------------------------------------------
        |
        | Tidak menghapus transaksi keuangan pada nilai_aktivas.
        | Status sumber dikembalikan ke pending jika barang terkait
        | sudah tidak ada lagi.
        |
        */

    public function destroyMesin(int $mesin)
    {
        $files = [];

        DB::transaction(function () use (
            $mesin,
            &$files
        ) {
            $row = DB::table('mesins')
                ->where('id', $mesin)
                ->lockForUpdate()
                ->first();

            abort_unless($row, 404);

            if (
                app(KibVoucherLinkService::class)->ready() && DB::table('kib_voucher_links')
                ->where('kib', 'mesin')->where('record_id', $mesin)->exists()
            ) {
                throw ValidationException::withMessages(['mesin' => 'Lepaskan voucher manual terlebih dahulu sebelum menghapus inventaris.']);
            }

            foreach (
                [
                    'dok' => 'kib/mesin/dokumen/',
                    'img' => 'kib/mesin/foto/',
                ] as $field => $prefix
            ) {
                $path = $row->{$field};

                if (
                    $path
                    && str_starts_with($path, $prefix)
                ) {
                    $files[] = $path;
                }
            }

            DB::table('mesins')
                ->where('id', $mesin)
                ->delete();

            // Jangan kembalikan pending jika masih ada barang lain.
            if (
                $row->id_voucher2
                &&
                empty(app(KibVoucherLinkService::class)->owners([(int) $row->id_voucher2])[(int) $row->id_voucher2])
            ) {
                DB::table('nilai_aktivas')
                    ->where('id', $row->id_voucher2)
                    ->update([
                        'stat' => 0,
                        'updated_at' => now(),
                    ]);
            }
        });

        // File dihapus setelah commit database sukses.
        foreach ($files as $path) {
            Storage::disk('local')->delete($path);
        }

        return redirect()
            ->route('kib.mesin')
            ->with(
                'success',
                'Data Mesin berhasil dihapus.'
            );
    }


    /*
        |--------------------------------------------------------------------------
        | 11. FILE FOTO DAN DOKUMEN MESIN
        |--------------------------------------------------------------------------
        |
        | Membatasi akses file yang tersimpan di disk privat.
        | Memerlukan login Laravel yang sebenarnya.
        |
        */

    public function fileMesin(
        int $mesin,
        string $jenis
    ) {
        abort_unless(
            Auth::check(),
            403,
            'Login diperlukan untuk mengakses dokumen.'
        );

        abort_unless(
            in_array($jenis, ['dokumen', 'foto'], true),
            404
        );

        $row = DB::table('mesins')
            ->where('id', $mesin)
            ->first(['dok', 'img']);

        abort_unless($row, 404);

        $prefix = $jenis === 'dokumen'
            ? 'kib/mesin/dokumen/'
            : 'kib/mesin/foto/';

        $path = $jenis === 'dokumen'
            ? $row->dok
            : $row->img;

        abort_unless(
            $path && str_starts_with($path, $prefix),
            404
        );

        abort_unless(
            Storage::disk('local')->exists($path),
            404
        );

        return response()->file(
            Storage::disk('local')->path($path)
        );
    }






    /**
     * ============================================================
     * QUERY KENDARAAN K.I.B B
     *
     * Sumber klasifikasi:
     * 1. Voucher Nilai Aset: nilai_aktivas.id_aktiva
     * 2. Inventaris lama:   mesins.id_aktiva
     *
     * Hanya Kode Aktiva 31.08.xx yang ditampilkan.
     * ============================================================
     */
    private function queryKendaraanPajak()
    {
        return DB::table('mesins as m')

            ->leftJoin(
                'nilai_aktivas as n',
                'n.id',
                '=',
                'm.id_voucher2'
            )

            ->join(
                'aktivas as a',
                'a.id',
                '=',
                DB::raw(
                    'COALESCE(n.id_aktiva, m.id_aktiva)'
                )
            )

            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'm.id_barang'
            )

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'm.id_lokasi'
            )

            ->whereRaw(
                "BTRIM(COALESCE(a.kode, '')) LIKE ?",
                ['31.08.%']
            );
    }




    /**
     * ============================================================
     * DATA MASA PAJAK KENDARAAN
     *
     * Status:
     * - aktif         : lebih dari 14 hari
     * - segera_habis  : 1–14 hari
     * - kedaluwarsa   : 0 hari atau lewat
     * - belum_didata  : belum mempunyai catatan pajak
     * ============================================================
     */
    public function dataPajakMesin()
    {
        $vehicles = $this->queryKendaraanPajak()

            ->select(
                'm.id',
                'm.guna',
                'm.merk',
                'm.polisi',
                'm.tahun',
                'm.id_lokasi',

                'b.nama_barang',
                'l.lokasi',

                'a.kode as kode_aktiva',
                'a.aktiva as jenis_aktiva'
            )

            ->orderBy('a.kode')
            ->orderBy('m.id')
            ->get();

        $latest = DB::table('mesin_pajaks')

            ->whereIn(
                'mesin_id',
                $vehicles->pluck('id')
            )

            ->orderByDesc('jatuh_tempo')
            ->orderByDesc('id')

            ->get()

            ->unique('mesin_id')
            ->keyBy('mesin_id');

        $today = \Carbon\Carbon::today(
            'Asia/Makassar'
        );

        $summary = [
            'total' => $vehicles->count(),
            'aktif' => 0,
            'segera_habis' => 0,
            'kedaluwarsa' => 0,
            'belum_didata' => 0,
        ];

        $rows = $vehicles->map(
            function ($vehicle) use (
                $latest,
                $today,
                &$summary
            ) {

                $pajak = $latest->get(
                    $vehicle->id
                );

                $status = 'belum_didata';
                $sisaHari = null;

                if (
                    $pajak &&
                    $pajak->jatuh_tempo
                ) {

                    $jatuhTempo = \Carbon\Carbon::parse(
                        $pajak->jatuh_tempo,
                        'Asia/Makassar'
                    )->startOfDay();

                    $sisaHari = (int) $today
                        ->diffInDays(
                            $jatuhTempo,
                            false
                        );

                    if ($sisaHari <= 0) {

                        $status = 'kedaluwarsa';
                    } elseif ($sisaHari <= 14) {

                        $status = 'segera_habis';
                    } else {

                        $status = 'aktif';
                    }
                }

                $summary[$status]++;

                $nomorPolisi = trim(
                    (string) ($vehicle->polisi ?? '')
                );

                if ($nomorPolisi === '-') {
                    $nomorPolisi = '';
                }

                return [
                    'mesin_id' => (int) $vehicle->id,

                    'pajak_id' => $pajak
                        ? (int) $pajak->id
                        : null,

                    'kode_aktiva' => trim(
                        (string) $vehicle->kode_aktiva
                    ),

                    'pengguna' => trim(
                        (string) ($vehicle->guna ?? '')
                    ),

                    'merk' => trim(
                        (string) ($vehicle->merk ?? '')
                    ),

                    'jenis' => trim(
                        (string) ($vehicle->jenis_aktiva ?? '')
                    ),

                    'nama_kendaraan' => trim(
                        (string) ($vehicle->nama_barang ?? '')
                    ),

                    'nomor_polisi' => $nomorPolisi,

                    'tahun' => $vehicle->tahun,

                    'lokasi_id' => $vehicle->id_lokasi,

                    'lokasi' => trim(
                        (string) ($vehicle->lokasi ?? '')
                    ),

                    'tanggal_bayar' =>
                    $pajak->tanggal_bayar ?? null,

                    'masa_berlaku_bulan' =>
                    $pajak->masa_berlaku_bulan ?? null,

                    'jatuh_tempo' =>
                    $pajak->jatuh_tempo ?? null,

                    'nominal' =>
                    $pajak->nominal ?? null,

                    'nomor_stnk' =>
                    $pajak->nomor_stnk ?? null,

                    'keterangan' =>
                    $pajak->keterangan ?? null,

                    'ada_dokumen' => !empty($pajak->dokumen_pdf),

                    'status' => $status,

                    'sisa_hari' => $sisaHari,
                ];
            }
        );

        return response()->json([
            'success' => true,

            'tanggal' => $today->toDateString(),

            'summary' => $summary,

            'data' => $rows->values(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDASI DAN HITUNG OTOMATIS JATUH TEMPO
    |--------------------------------------------------------------------------
    */

    private function validasiPajakMesin(
        Request $request,
        bool $creating,
        ?int $mesinId = null
    ): array {
        $rules = [
            'tanggal_bayar' => [
                'required',
                'date_format:Y-m-d'
            ],

            'masa_berlaku_bulan' => [
                'required',
                'integer',
                'in:8,12'
            ],

            'nominal' => [
                'nullable',
                'integer',
                'min:0'
            ],

            'nomor_stnk' => [
                'nullable',
                'string',
                'max:120'
            ],

            'keterangan' => [
                'nullable',
                'string',
                'max:10000'
            ],

            'dokumen_pdf' => [
                'nullable',
                'file',
                'mimes:pdf',
                'max:15360'
            ],
        ];

        if ($creating) {
            $rules['mesin_id'] = [
                'required',
                'integer',
                'exists:mesins,id'
            ];
        }

        $data = $request->validate($rules);

        $id = $creating
            ? (int) $data['mesin_id']
            : (int) $mesinId;

        // Validasi keamanan pada backend.
        // Kendaraan harus berkode Aktiva 31.08.xx.
        if (
            !$this->queryKendaraanPajak()
                ->where('m.id', $id)
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'mesin_id' =>
                'Hanya kendaraan dengan Kode Aktiva 31.08.xx yang dapat dicatat pajaknya.'
            ]);
        }

        /*
        * Contoh:
        * 2026-09-12 + 8 bulan = 2027-05-12
        *
        * addMonthsNoOverflow menangani tanggal
        * 29, 30, atau 31 pada bulan tujuan.
        */
        $data['jatuh_tempo'] =
            \Carbon\Carbon::createFromFormat(
                '!Y-m-d',
                $data['tanggal_bayar'],
                'Asia/Makassar'
            )
            ->addMonthsNoOverflow(
                (int) $data['masa_berlaku_bulan']
            )
            ->toDateString();

        // File diambil terpisah dari UploadedFile.
        unset($data['dokumen_pdf']);

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE — PEMBARUAN PAJAK
    |--------------------------------------------------------------------------
    */

    public function storePajakMesin(
        Request $request
    ) {
        $data = $this->validasiPajakMesin(
            $request,
            true
        );

        $pdf = $request->file('dokumen_pdf');

        $path = null;

        try {
            if ($pdf) {
                $path = $pdf->store(
                    'kib/mesin/pajak',
                    'local'
                );

                if (!$path) {
                    throw new \RuntimeException(
                        'PDF pajak gagal disimpan.'
                    );
                }
            }

            $data['dokumen_pdf'] = $path;

            $data['created_at'] = now();
            $data['updated_at'] = now();

            $id = DB::transaction(
                fn() => DB::table('mesin_pajaks')
                    ->insertGetId($data)
            );
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk('local')
                    ->delete($path);
            }

            throw $e;
        }

        return response()->json([
            'success' => true,

            'message' =>
            'Pembaruan pajak tersimpan; jatuh tempo dihitung otomatis.',

            'id' => $id,

            'jatuh_tempo' =>
            $data['jatuh_tempo'],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE — EDIT MASA PAJAK
    |--------------------------------------------------------------------------
    */

    public function updatePajakMesin(
        Request $request,
        int $pajak
    ) {
        $old = DB::table('mesin_pajaks')
            ->where('id', $pajak)
            ->first();

        abort_unless($old, 404);

        $data = $this->validasiPajakMesin(
            $request,
            false,
            (int) $old->mesin_id
        );

        $newPath = null;

        try {
            if ($request->hasFile('dokumen_pdf')) {
                $newPath = $request
                    ->file('dokumen_pdf')
                    ->store(
                        'kib/mesin/pajak',
                        'local'
                    );

                if (!$newPath) {
                    throw new \RuntimeException(
                        'PDF pajak gagal disimpan.'
                    );
                }

                $data['dokumen_pdf'] = $newPath;
            }

            $data['updated_at'] = now();

            DB::transaction(
                fn() => DB::table('mesin_pajaks')
                    ->where('id', $pajak)
                    ->update($data)
            );
        } catch (\Throwable $e) {
            if ($newPath) {
                Storage::disk('local')
                    ->delete($newPath);
            }

            throw $e;
        }

        // Hapus dokumen sebelumnya
        // hanya setelah update berhasil.
        if (
            $newPath &&
            !empty($old->dokumen_pdf) &&
            str_starts_with(
                $old->dokumen_pdf,
                'kib/mesin/pajak/'
            )
        ) {
            Storage::disk('local')
                ->delete($old->dokumen_pdf);
        }

        return response()->json([
            'success' => true,

            'message' =>
            'Masa pajak kendaraan berhasil diperbarui.',

            'jatuh_tempo' =>
            $data['jatuh_tempo'],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE — HAPUS SATU CATATAN PAJAK
    |--------------------------------------------------------------------------
    */

    public function destroyPajakMesin(
        int $pajak
    ) {
        $old = DB::table('mesin_pajaks')
            ->where('id', $pajak)
            ->first();

        abort_unless($old, 404);

        DB::transaction(
            fn() => DB::table('mesin_pajaks')
                ->where('id', $pajak)
                ->delete()
        );

        if (
            !empty($old->dokumen_pdf) &&
            str_starts_with(
                $old->dokumen_pdf,
                'kib/mesin/pajak/'
            )
        ) {
            Storage::disk('local')
                ->delete($old->dokumen_pdf);
        }

        // Inventaris mesins tidak dihapus.

        return response()->json([
            'success' => true,

            'message' =>
            'Catatan pajak dihapus tanpa menghapus inventaris Mesin.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PREVIEW PDF PAJAK
    |--------------------------------------------------------------------------
    */

    public function filePajakMesin(
        int $pajak
    ) {
        $row = DB::table('mesin_pajaks')
            ->where('id', $pajak)
            ->first();

        abort_unless(
            $row && !empty($row->dokumen_pdf),
            404
        );

        $path = (string) $row->dokumen_pdf;

        abort_unless(
            str_starts_with(
                $path,
                'kib/mesin/pajak/'
            ) &&
                Storage::disk('local')->exists($path),
            404
        );

        $file = Storage::disk('local')
            ->path($path);

        abort_unless(
            strtolower(
                pathinfo(
                    $file,
                    PATHINFO_EXTENSION
                )
            ) === 'pdf',
            415
        );

        return response()->file(
            $file,
            [
                'Content-Type' =>
                'application/pdf',

                'X-Content-Type-Options' =>
                'nosniff',
            ]
        );
    }


    /**
     * ============================================================
     * REFERENSI TRANSAKSI AKTIVA KENDARAAN
     *
     * READ ONLY.
     *
     * Tidak membuat unit kendaraan.
     * Tidak mengubah cat/stat.
     * Tidak masuk perhitungan KPI pajak.
     * ============================================================
     */
    public function referensiAktivaKendaraanMesin()
    {
        $rows = DB::table('nilai_aktivas as n')

            ->join(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'n.id_lokasi'
            )

            ->whereRaw(
                "BTRIM(COALESCE(a.kode, '')) LIKE ?",
                ['31.08.%']
            )

            ->select([
                'n.id',
                'n.cat',
                'n.stat',
                'n.no_voucher',
                'n.tgl_voucher',
                'n.tahun',
                'n.urai',
                'n.nilai',

                'a.kode as kode_aktiva',
                'a.aktiva as jenis_aktiva',

                'l.lokasi',
            ])

            ->orderBy('a.kode')
            ->orderBy('n.id')
            ->get();

        $data = $rows->map(function ($row) {

            $isPending =
                (string) $row->cat === '2'
                && (string) $row->stat === '0';

            $isHistoris =
                $row->cat === null
                && $row->stat === null;

            $status = 'perlu_verifikasi';

            if ($isPending) {
                $status = 'pending';
            } elseif ($isHistoris) {
                $status = 'historis';
            }

            return [
                'id' => (int) $row->id,

                'kode_aktiva' => trim(
                    (string) $row->kode_aktiva
                ),

                'jenis_aktiva' => trim(
                    (string) ($row->jenis_aktiva ?? '')
                ),

                'no_voucher' => trim(
                    (string) ($row->no_voucher ?? '')
                ),

                'tgl_voucher' => $row->tgl_voucher,

                'tahun' => $row->tahun,

                'uraian' => trim(
                    (string) ($row->urai ?? '')
                ),

                'nilai' => $row->nilai,

                'lokasi' => trim(
                    (string) ($row->lokasi ?? '')
                ),

                'status' => $status,
            ];
        });

        return response()->json([
            'success' => true,

            'summary' => [
                'total_transaksi' => $data->count(),

                'pending' => $data
                    ->where('status', 'pending')
                    ->count(),

                'historis' => $data
                    ->where('status', 'historis')
                    ->count(),

                'perlu_verifikasi' => $data
                    ->where('status', 'perlu_verifikasi')
                    ->count(),
            ],

            'data' => $data->values(),
        ]);
    }


    /**
     * ============================================================
     * KLASIFIKASI SATU INVENTARIS MESIN
     * ============================================================
     */
    public function klasifikasiMesin(int $mesin)
    {
        $row = DB::table('mesins as m')

            ->leftJoin(
                'nilai_aktivas as n',
                'n.id',
                '=',
                'm.id_voucher2'
            )

            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                DB::raw(
                    'COALESCE(n.id_aktiva, m.id_aktiva)'
                )
            )

            ->where('m.id', $mesin)

            ->select(
                'm.id',
                'a.kode as kode_aktiva',
                'a.aktiva as nama_aktiva'
            )

            ->first();

        abort_unless($row, 404);

        return response()->json([
            'success' => true,
            'data' => $row,
        ]);
    }



    /*
        |--------------------------------------------------------------------------
        | K.I.B C — GEDUNG DAN BANGUNAN
        |--------------------------------------------------------------------------
        | Seluruh fungsi Gedung berada di KIBController.
        | Fungsi Tanah dan Peralatan & Mesin tetap dipertahankan.
        */

    private function gedungKategori(): int
    {
        $cat = DB::table('golongans')
            ->whereRaw(
                "UPPER(TRIM(REGEXP_REPLACE(nama, '[^A-Za-z0-9]+', ' ', 'g'))) IN (?, ?)",
                [
                    'GEDUNG DAN BANGUNAN',
                    'GEDUNG BANGUNAN'
                ]
            )
            ->value('id');

        if ($cat === null) {
            throw new \RuntimeException(
                'Golongan Gedung dan Bangunan belum tersedia pada master Golongan.'
            );
        }

        return (int) $cat;
    }

    /*
        |--------------------------------------------------------------------------
        | QUERY NILAI K.I.B GEDUNG
        |--------------------------------------------------------------------------
        */
    private function gedungNilaiQuery()
    {
        return DB::table('nilai_aktivas as n')
            ->join(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )
            ->whereRaw(
                "TRIM(REGEXP_REPLACE(UPPER(COALESCE(a.kib, '')), '[^A-Z0-9]+', ' ', 'g')) IN (?, ?)",
                [
                    'KIB C GEDUNG DAN BANGUNAN',
                    'GEDUNG DAN BANGUNAN'
                ]
            );
    }

    /*
        |--------------------------------------------------------------------------
        | HALAMAN UTAMA GEDUNG DAN BANGUNAN
        |--------------------------------------------------------------------------
        */
    public function dataGedung()
    {
        $nilaiLokasi = $this->gedungNilaiQuery()
            ->whereNotNull('n.id_lokasi')
            ->select('n.id_lokasi')
            ->selectRaw(
                'COALESCE(SUM(n.nilai), 0) AS nilai_total'
            )
            ->selectRaw(
                'COUNT(n.id) AS jumlah_transaksi'
            )
            ->groupBy('n.id_lokasi');

        $lokasiGedung = DB::table('gedungs as g')
            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'g.id_lokasi'
            )
            ->leftJoinSub(
                $nilaiLokasi,
                'v',
                fn($join) =>
                $join->on(
                    'v.id_lokasi',
                    '=',
                    'g.id_lokasi'
                )
            )
            ->whereNotNull('g.id_lokasi')
            ->select(
                'g.id_lokasi',
                'l.lokasi',
                'l.alamat'
            )
            ->selectRaw(
                'COUNT(DISTINCT g.id) AS jumlah_gedung'
            )
            ->selectRaw("CASE
                WHEN COUNT(DISTINCT COALESCE(NULLIF(TRIM(g.status_kepemilikan), ''), 'belum_diatur')) > 1
                    THEN 'campuran'
                ELSE COALESCE(MAX(NULLIF(TRIM(g.status_kepemilikan), '')), 'belum_diatur')
                END AS status_kepemilikan_ringkas")
            ->selectRaw(
                'COALESCE(MAX(v.nilai_total), 0) AS nilai_total'
            )
            ->selectRaw(
                'COALESCE(MAX(v.jumlah_transaksi), 0) AS jumlah_transaksi'
            )
            ->selectRaw(
                "COUNT(DISTINCT CASE
                        WHEN LOWER(BTRIM(COALESCE(g.dok, ''))) LIKE '%.pdf'
                        THEN g.id
                    END) AS jumlah_pdf"
            )
            ->groupBy(
                'g.id_lokasi',
                'l.lokasi',
                'l.alamat'
            )
            ->orderByRaw('MAX(g.id) DESC')
            ->orderBy('l.lokasi')
            ->get();

        $totalGedung = DB::table('gedungs')
            ->count();

        $totalLokasi = DB::table('gedungs')
            ->whereNotNull('id_lokasi')
            ->distinct()
            ->count('id_lokasi');

        $totalNilai = $this->gedungNilaiQuery()
            ->sum('n.nilai');

        $totalPending = DB::table('nilai_aktivas')
            ->where('cat', $this->gedungKategori())
            ->where('stat', 0)
            ->where('jenisn', 1)
            ->count();

        $barangRows = DB::table('barangs')
            ->select(
                'id',
                'nama_barang',
                'kode_barang'
            )
            ->where('status', 'aktif')
            ->orderBy('nama_barang')
            ->get();

        $kondisi = DB::table('gedungs')
            ->selectRaw(
                "CASE
                        WHEN UPPER(TRIM(COALESCE(kondisi, ''))) = 'BAIK'
                        THEN 'Baik'
                        WHEN UPPER(TRIM(COALESCE(kondisi, ''))) LIKE 'RUSAK%'
                        THEN 'Rusak'
                        ELSE 'Perlu perhatian'
                    END AS label"
            )
            ->selectRaw('COUNT(*) AS jumlah')
            ->groupBy('label')
            ->pluck('jumlah', 'label');

        $terbaru = DB::table('gedungs as g')
            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'g.id_barang'
            )
            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'g.id_lokasi'
            )
            ->select(
                'g.id',
                'g.kode',
                'g.created_at',
                'b.nama_barang',
                'l.lokasi'
            )
            ->orderByDesc('g.id')
            ->limit(5)
            ->get();

        return view('kib.gedung', compact(
            'lokasiGedung',
            'totalGedung',
            'totalLokasi',
            'totalNilai',
            'totalPending',
            'barangRows',
            'kondisi',
            'terbaru'
        ));
    }

    /*
        |--------------------------------------------------------------------------
        | DATA PENDING GEDUNG DARI NILAI ASET
        |--------------------------------------------------------------------------
        */
    public function pendingGedung()
    {
        $cat = $this->gedungKategori();


        $query = DB::table('nilai_aktivas as n')
            ->leftJoin('lokasis as l', 'l.id', '=', 'n.id_lokasi')
            ->leftJoin('departemens as d', 'd.id', '=', 'n.dep')
            ->leftJoin('divisis as v', 'v.id', '=', 'n.div')
            ->leftJoin('aktivas as a', 'a.id', '=', 'n.id_aktiva')
            ->where('n.cat', $this->gedungKategori())
            ->where('n.jenisn', 1)
            ->where('n.stat', 0);


        $count = (clone $query)->count();

        $rows = $query
            ->select([
                'n.id',
                'n.no_voucher',
                'n.tgl_voucher',
                'n.nilai',
                'n.urai',
                'n.tahun',
                'n.id_lokasi',
                'n.dep',
                'n.div',
                'n.jenisn',
                'l.lokasi',
                'l.alamat',
                'a.kode as kode_aktiva',
                'a.aktiva as nama_aktiva',
            ])
            ->selectRaw(
                "TRIM(COALESCE(d.kode_dep, d.nama_dep, '')) AS departemen"
            )
            ->selectRaw(
                "TRIM(COALESCE(v.nama_div, '')) AS divisi"
            )
            ->orderByDesc('n.tgl_voucher')
            ->orderByDesc('n.id')
            ->limit(1000)
            ->get();

        return response()->json([
            'success' => true,
            'count' => $count,
            'data' => $rows,
        ]);
    }

    /*
        |--------------------------------------------------------------------------
        | DETAIL GEDUNG BERDASARKAN LOKASI
        |--------------------------------------------------------------------------
        */
    public function detailGedungLokasi(int $lokasi)
    {
        $location = DB::table('lokasis')
            ->where('id', $lokasi)
            ->first([
                'id',
                'lokasi',
                'alamat'
            ]);

        abort_unless($location, 404);

        $rows = DB::table('gedungs as g')
            ->leftJoin('lokasis as l', 'l.id', '=', 'g.id_lokasi')
            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'g.id_barang'
            )
            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'g.id_departemen'
            )
            ->leftJoin(
                'divisis as v',
                'v.id',
                '=',
                'g.id_div'
            )
            ->leftJoin(
                'nilai_aktivas as n',
                'n.id',
                '=',
                'g.nilai_aktiva_id'
            )
            ->where('g.id_lokasi', $lokasi)
            ->select('g.*')
            ->addSelect([
                'l.alamat as alamat_detail',
                'n.nilai as nilai_transaksi',
                'n.tahun as tahun_transaksi',
            ])
            ->selectRaw(
                "TRIM(COALESCE(b.nama_barang, '')) AS nama_barang"
            )
            ->selectRaw(
                "TRIM(COALESCE(b.kode_barang, '')) AS kode_barang"
            )
            ->selectRaw(
                "TRIM(COALESCE(d.kode_dep, d.nama_dep, '')) AS departemen"
            )
            ->selectRaw(
                "TRIM(COALESCE(v.nama_div, '')) AS divisi"
            )
            ->orderByDesc('g.id')
            ->get();

        return response()->json([
            'success' => true,
            'lokasi' => $location,
            'data' => $this->nilaiLaporanKib($rows->all(), 'gedung', 'id', 'nilai'),
        ]);
    }

    /*
        |--------------------------------------------------------------------------
        | DETAIL NILAI GEDUNG BERDASARKAN LOKASI
        |--------------------------------------------------------------------------
        */
    /**
     * K.I.B C: laporan seluruh gedung dalam SATU lokasi Detail.
     * Sumber sama dengan Detail; tidak memakai pagination UI dan tidak mengubah database.
     * Status Kepemilikan adalah atribut operasional, bukan kolom Excel.
     */
    public function laporanGedungKibC(int $lokasi): \Illuminate\Http\JsonResponse
    {
        // Gunakan endpoint Detail yang sudah ada agar tidak ada perbedaan filter data.
        $response = $this->detailGedungLokasi($lokasi);
        $detail = $response->getData(true);
        $items = collect($detail['data'] ?? []);
        $lokasiInfo = $detail['lokasi'] ?? [];

        $identitas = static function ($values): string {
            $unik = collect($values)
                ->map(static fn($v) => trim((string) ($v ?? '')))
                ->filter()
                ->unique()
                ->values();
            return $unik->count() === 1 ? $unik->first()
                : ($unik->isEmpty() ? '-' : 'BERAGAM');
        };

        // Kode struktur bukan Kode Aktiva. Ambil hanya dari kolom yang benar-benar ada.
        $kodeStruktur = '-';
        if (Schema::hasColumn('lokasis', 'kode_struktur')) {
            $nilaiStruktur = DB::table('lokasis')->where('id', $lokasi)
                ->value('kode_struktur');
            $kodeStruktur = trim((string) ($nilaiStruktur ?? '')) ?: '-';
        } elseif (Schema::hasColumn('gedungs', 'kode_struktur')) {
            $kodeStruktur = $identitas($items->pluck('kode_struktur'));
        }

        return response()->json([
            'success' => true,
            'jenis' => 'gedung',
            'cakupan' => 'lokasi',
            'jumlah' => $items->count(),
            'lokasi' => [
                'id' => (int) ($lokasiInfo['id'] ?? $lokasi),
                'nama' => (string) ($lokasiInfo['lokasi'] ?? ''),
                'alamat' => (string) ($lokasiInfo['alamat'] ?? ''),
            ],
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                'departemen' => $identitas($items->pluck('departemen')
                    ->map(fn($value) => $this->kibNamaDepartemenUntukLaporan($value))),
                'divisi' => $identitas($items->pluck('divisi')),
                'kode_struktur' => $kodeStruktur,
            ],
            'sdm' => $this->sdmAktifKibB(),
            'data' => $this->nilaiLaporanKib($items->values()->all(), 'gedung', 'id', 'nilai'),
        ]);
    }

    public function detailNilaiGedungLokasi(int $lokasi)
    {
        $location = DB::table('lokasis')
            ->where('id', $lokasi)
            ->first([
                'id',
                'lokasi',
                'alamat'
            ]);

        abort_unless($location, 404);

        $query = $this->gedungNilaiQuery()
            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'n.dep'
            )
            ->leftJoin(
                'divisis as v',
                'v.id',
                '=',
                'n.div'
            )
            ->where('n.id_lokasi', $lokasi);

        $total = (clone $query)->sum('n.nilai');

        $rows = $query
            ->select([
                'n.id',
                'n.no_voucher',
                'n.tgl_voucher',
                'n.tahun',
                'n.nilai',
                'n.urai',
                'n.jenisn',
                'n.stat',
                'a.kode as kode_aktiva',
                'a.aktiva as nama_aktiva',
                'd.kode_dep as departemen',
                'v.nama_div as divisi',
            ])
            ->orderBy('n.tgl_voucher')
            ->orderBy('n.id')
            ->get();

        return response()->json([
            'success' => true,

            'lokasi' => [
                'id' => $location->id,
                'nama' => $location->lokasi,
                'alamat' => $location->alamat,
            ],

            'total' => $total,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    /*
        |--------------------------------------------------------------------------
        | DETAIL SATU BARANG GEDUNG
        |--------------------------------------------------------------------------
        */
    public function showGedung(int $gedung)
    {
        $row = DB::table('gedungs as g')
            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'g.id_barang'
            )
            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'g.id_lokasi'
            )
            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'g.id_departemen'
            )
            ->leftJoin(
                'divisis as v',
                'v.id',
                '=',
                'g.id_div'
            )
            ->where('g.id', $gedung)
            ->select(
                'g.*',
                'l.lokasi',
                'l.alamat'
            )
            ->selectRaw(
                "TRIM(COALESCE(b.nama_barang, '')) AS nama_barang"
            )
            ->selectRaw(
                "TRIM(COALESCE(d.kode_dep, d.nama_dep, '')) AS departemen"
            )
            ->selectRaw(
                "TRIM(COALESCE(v.nama_div, '')) AS divisi"
            )
            ->first();

        abort_unless($row, 404);

        return response()->json([
            'success' => true,
            'data' => $row,
        ]);
    }

    /*
        |--------------------------------------------------------------------------
        | VALIDASI FORM GEDUNG
        |--------------------------------------------------------------------------
        */
    private function validasiGedung(
        Request $request,
        bool $creating,
        bool $langsung = false
    ): array {
        $rules = [
            'id_barang' => [
                'required',
                'integer',
                Rule::exists('barangs', 'id'),
            ],

            'kode' => [
                'required',
                'string',
                'max:255',
            ],

            'reg' => [
                'required',
                'string',
                'max:255',
            ],

            'asal' => [
                'required',
                'string',
                'max:255',
            ],

            'kondisi' => [
                'nullable',
                'string',
                'max:255',
            ],

            'konstruksi' => [
                'required',
                'string',
                'max:255',
            ],

            'materi' => [
                'nullable',
                'string',
                'max:255',
            ],

            'status' => [
                'nullable',
                'string',
                'max:255',
            ],

            // Status Kepemilikan berbeda dengan status hukum tanah.
            'status_kepemilikan' => [
                $creating ? 'required' : 'nullable',
                Rule::in(['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta']),
            ],
            'sumber_dana' => [
                'nullable',
                'string',
                'max:255',
            ],

            'luas' => [
                'required',
                'string',
                'max:255',
            ],

            'luastanah' => [
                'required',
                'string',
                'max:255',
            ],

            'kode_tanah' => [
                'required',
                'string',
                'max:255',
            ],

            'no_imb' => [
                'required',
                'string',
                'max:255',
            ],

            'tgl_imb' => [
                'required',
                'date',
            ],

            'guna' => [
                'nullable',
                'string',
                'max:255',
            ],

            'ket' => [
                'required',
                'string',
                'max:10000',
            ],

            'dokumen' => [
                'nullable',
                'file',
                'mimes:pdf',
                'max:15360',
            ],

            'foto' => [
                'nullable',
                'image',
                'max:5120',
            ],
        ];

        if ($creating && !$langsung) {
            $rules['id_nilai_aktiva'] = [
                'required',
                'integer',
                Rule::exists(
                    'nilai_aktivas',
                    'id'
                ),
            ];
        }

        return $request->validate($rules);
    }

    /*
        |--------------------------------------------------------------------------
        | FIELD GEDUNG YANG BOLEH DISIMPAN
        |--------------------------------------------------------------------------
        */
    private function fieldsGedung(array $input): array
    {
        return collect($input)
            ->only([
                'id_barang',
                'kode',
                'reg',
                'asal',
                'kondisi',
                'konstruksi',
                'materi',
                'status',
                'status_kepemilikan',
                'sumber_dana',
                'luas',
                'luastanah',
                'kode_tanah',
                'no_imb',
                'tgl_imb',
                'guna',
                'ket',
            ])
            ->all();
    }

    /*
        |--------------------------------------------------------------------------
        | SIMPAN GEDUNG DARI VOUCHER NILAI ASET
        |--------------------------------------------------------------------------
        */
    /** Kategori fisik: D/Gedung menggunakan identitas gedung (K.I.B C), bukan pemilik baru. */
    private function voucherScopeKib(string $kategori): array
    {
        $map = [
            'gedung' => ['gedungs', 'gedung', 'id_lokasi', 'id_barang', 'kode'],
            'jembatan' => ['kib_d_s', 'jalan', 'id_lokasi', 'id_barang', 'kode'],
            'aset_ttp' => ['kib_aset_tetap_manual', 'aset_tetap', 'lokasi', 'nama_aset', 'kode_inventaris'],
            'konstruksi' => ['kib_konstruksi_manual', 'konstruksi', 'lokasi', 'nama_pekerjaan', null],
            'kir' => ['kirs', 'kir', 'id_lokasi', 'id_barang', 'ruangan'],
        ];
        abort_unless(isset($map[$kategori]), 404);
        return $map[$kategori];
    }

    private function voucherLocationKib(string $kategori, Request $request): object
    {
        [,, $column] = $this->voucherScopeKib($kategori);
        if ($column === 'lokasi') {
            $input = $request->validate(['nama_lokasi' => ['required', 'string', 'max:500']]);
            $rows = DB::table('lokasis')->whereRaw('BTRIM(lokasi) = ?', [trim($input['nama_lokasi'])])->limit(2)->get();
            if ($rows->count() !== 1) {
                throw ValidationException::withMessages(['lokasi' => 'Nama lokasi manual harus cocok dengan tepat satu Master Lokasi. Periksa data lokasi sebelum menghubungkan voucher.']);
            }
            return $rows->first();
        }
        $input = $request->validate(['id_lokasi' => ['required', 'integer', 'min:1']]);
        $location = DB::table('lokasis')->where('id', $input['id_lokasi'])->first();
        abort_unless($location, 404);
        return $location;
    }

    private function voucherTargetsKib(string $kategori, object $location): \Illuminate\Database\Query\Builder
    {
        [$table,, $column] = $this->voucherScopeKib($kategori);
        $query = DB::table($table);
        return $column === 'lokasi'
            ? $query->whereRaw('BTRIM(lokasi) = ?', [trim((string) $location->lokasi)])
            : $query->where($column, $location->id);
    }

    private function voucherCategoriesKib(string $kategori): array
    {
        [, $module] = $this->voucherScopeKib($kategori);
        $normalize = static fn($name) => strtoupper(trim(preg_replace('/[^A-Za-z0-9]+/', ' ', (string)$name) ?? ''));
        $aliases = array_map($normalize, config("kib.modules.{$module}.aliases", []));
        if ($kategori === 'gedung') $aliases[] = 'GEDUNG BANGUNAN';
        if ($kategori === 'kir') $aliases[] = 'K I R';
        $matches = DB::table('golongans')->get(['id', 'nama'])->filter(static function ($g) use ($aliases, $normalize, $kategori) {
            $name = $normalize($g->nama);
            return in_array($name, $aliases, true) || ($kategori === 'jembatan' && str_starts_with($name, 'KIB D '));
        })->pluck('id')->map(static fn($id) => (int)$id)->unique()->values()->all();
        if (!$matches) throw ValidationException::withMessages(['kategori' => 'Golongan voucher belum cocok dengan Master Golongan. Pengaitan dihentikan untuk mencegah salah kategori.']);
        return $matches;
    }

    private function voucherEligibleKib(string $kategori, object $voucher): bool
    {
        if (
            $voucher->stat === null || !in_array((int) $voucher->stat, [0, 1], true)
            || !in_array((int) $voucher->jenisn, [1, 2], true) || $voucher->nilai === null
        ) return false;
        // KIR lama pernah memproses voucher tanpa menyimpan nilai_v. Jangan menebak pemiliknya.
        return !($kategori === 'kir' && (int) $voucher->jenisn === 1 && (int) $voucher->stat === 1);
    }

    public function riwayatVoucherKib(Request $request, string $kategori, KibVoucherLinkService $links)
    {
        $location = $this->voucherLocationKib($kategori, $request);
        [,,, $name, $code] = $this->voucherScopeKib($kategori);
        $targets = $this->voucherTargetsKib($kategori, $location)->orderBy('id')->get();
        $master = $name === 'id_barang' ? DB::table('barangs')->whereIn('id', $targets->pluck('id_barang')->filter()->unique())->pluck('nama_barang', 'id') : collect();
        $options = $targets->map(fn($r) => [
            'id' => (int) $r->id,
            'nama' => trim((string) ($name === 'id_barang' ? ($master[$r->id_barang] ?? 'Inventaris') : $r->{$name})),
            'kode' => trim((string) ($code ? ($r->{$code} ?? '') : ($r->kategori ?? ''))),
            'detail' => trim((string) ($r->gedung ?? $r->divisi ?? $r->reg ?? $r->nomor_register ?? '')),
        ])->keyBy('id');
        $categories = $this->voucherCategoriesKib($kategori);
        $query = $kategori === 'gedung' ? $this->gedungNilaiQuery() : DB::table('nilai_aktivas as n')->leftJoin('aktivas as a', 'a.id', '=', 'n.id_aktiva')->whereIn('n.cat', $categories);
        $columns = ['n.id', 'n.no_voucher', 'n.tgl_voucher', 'n.tahun', 'n.nilai', 'n.urai', 'n.jenisn', 'n.stat', 'n.cat', 'a.kode as kode_aktiva', 'a.aktiva as nama_aktiva'];
        if (Schema::hasColumn('nilai_aktivas', 'dokumen_pdf')) $columns[] = 'n.dokumen_pdf';
        $rows = $query->where('n.id_lokasi', $location->id)->orderByDesc('n.tgl_voucher')->orderByDesc('n.id')->get($columns);
        $ids = $rows->pluck('id')->all();
        $owners = $links->owners($ids);
        $manual = $links->ready() ? DB::table('kib_voucher_links')->whereIn('nilai_aktiva_id', $ids)->where('kib', $kategori)
            ->where('id_lokasi', $location->id)->get()->keyBy('nilai_aktiva_id') : collect();
        foreach ($rows as $row) {
            $row->pdf_url = trim((string)($row->dokumen_pdf ?? '')) !== '' ? route('nilai.pdf.preview', $row->id) : null;
            unset($row->dokumen_pdf);
            $eligible = in_array((int)$row->cat, $categories, true) && $this->voucherEligibleKib($kategori, $row);
            $found = $owners[$row->id] ?? [];
            $one = count($found) === 1 ? $found[0] : null;
            $target = $one && $one['kategori'] === $kategori ? $options->get($one['record_id']) : null;
            $row->status_hubungan = count($found) > 1 ? 'konflik' : ($one ? 'terhubung' : ($eligible ? 'belum' : 'periksa'));
            $row->tujuan = $one ? ($target ? $target['nama'] . ' #' . $target['id'] : $one['kategori'] . ' #' . $one['record_id']) : null;
            $link = $manual->get($row->id);
            $row->boleh_hubungkan = $links->ready() && !$found && $eligible;
            $row->boleh_lepaskan = $links->ready() && $one && $one['kategori'] === $kategori && $one['sumber'] === 'pengaitan'
                && $link && (int)$link->record_id === $one['record_id'];
            $row->link_id = $row->boleh_lepaskan ? (int)$link->id : null;
            $row->record_id = $one['record_id'] ?? null;
        }
        return response()->json([
            'success' => true,
            'lokasi' => ['id' => (int)$location->id, 'nama' => $location->lokasi, 'alamat' => $location->alamat],
            'total' => $rows->sum('nilai'),
            'data' => $rows,
            'targets' => $options->values(),
            'pengaitan_siap' => $links->ready()
        ]);
    }

    public function hubungkanVoucherKib(Request $request, string $kategori, KibVoucherLinkService $links, KibNotificationService $notifications)
    {
        $location = $this->voucherLocationKib($kategori, $request);
        $input = $request->validate(['nilai_aktiva_id' => ['required', 'integer', 'min:1'], 'record_id' => ['required', 'integer', 'min:1'], 'konfirmasi' => ['required', 'accepted']]);
        $links->assertReady();
        $cats = $this->voucherCategoriesKib($kategori);
        DB::transaction(function () use ($input, $kategori, $location, $links, $cats) {
            $voucher = DB::table('nilai_aktivas')->where('id', $input['nilai_aktiva_id'])->where('id_lokasi', $location->id)->whereIn('cat', $cats)->lockForUpdate()->first();
            $target = $this->voucherTargetsKib($kategori, $location)->where('id', $input['record_id'])->lockForUpdate()->first();
            if (!$voucher || !$target || !$this->voucherEligibleKib($kategori, $voucher)) {
                throw ValidationException::withMessages(['voucher' => 'Voucher atau inventaris tidak sesuai lokasi, kategori, atau status.']);
            }
            $links->linkRecord((int)$voucher->id, $kategori, (int)$target->id, (int)$location->id, Auth::id());
            if ((int)$voucher->stat === 0) DB::table('nilai_aktivas')->where('id', $voucher->id)->update(['stat' => 1, 'updated_at' => now()]);
        }, 3);
        Log::info('KIB: voucher manual dihubungkan', ['kategori' => $kategori, 'voucher' => $input['nilai_aktiva_id'], 'record' => $input['record_id'], 'lokasi' => $location->id, 'user' => Auth::id()]);
        $notifications->clearCache();
        return response()->json(['success' => true, 'message' => 'Voucher berhasil dihubungkan.']);
    }

    public function lepaskanVoucherKib(Request $request, string $kategori, KibVoucherLinkService $links, KibNotificationService $notifications)
    {
        $location = $this->voucherLocationKib($kategori, $request);
        $input = $request->validate(['nilai_aktiva_id' => ['required', 'integer', 'min:1'], 'record_id' => ['required', 'integer', 'min:1'], 'link_id' => ['required', 'integer', 'min:1'], 'konfirmasi' => ['required', 'accepted']]);
        $links->assertReady();
        DB::transaction(function () use ($input, $kategori, $location, $links) {
            $voucher = DB::table('nilai_aktivas')->where('id', $input['nilai_aktiva_id'])->where('id_lokasi', $location->id)->lockForUpdate()->first();
            $query = DB::table('kib_voucher_links')->where('id', $input['link_id'])->where('kib', $kategori)->where('record_id', $input['record_id'])
                ->where('nilai_aktiva_id', $input['nilai_aktiva_id'])->where('id_lokasi', $location->id);
            $link = $voucher ? (clone $query)->lockForUpdate()->first() : null;
            $owners = $voucher ? ($links->owners([(int)$voucher->id])[$voucher->id] ?? []) : [];
            if (!$link || count($owners) !== 1 || $owners[0]['kategori'] !== $kategori || $owners[0]['record_id'] !== (int)$input['record_id'] || $owners[0]['sumber'] !== 'pengaitan' || $query->delete() !== 1) {
                throw ValidationException::withMessages(['voucher' => 'Relasi sudah berubah atau merupakan sumber historis.']);
            }
            // KIR penambahan aset manual berasal dari Pending; kembalikan ke Pending agar dapat dipilih ulang tanpa membuka voucher lama tak bertuan.
            if ($kategori === 'kir' && (int)$voucher->jenisn === 1 && (int)$voucher->stat === 1) {
                DB::table('nilai_aktivas')->where('id', $voucher->id)->update(['stat' => 0, 'updated_at' => now()]);
            }
        }, 3);
        Log::info('KIB: voucher manual dilepas', ['kategori' => $kategori, 'voucher' => $input['nilai_aktiva_id'], 'record' => $input['record_id'], 'lokasi' => $location->id, 'user' => Auth::id()]);
        $notifications->clearCache();
        return response()->json(['success' => true, 'message' => 'Relasi dilepas. Voucher dapat dipilih kembali.']);
    }

    private function pastikanTanpaRelasiManual(string $kategori, int $id): void
    {
        if (app(KibVoucherLinkService::class)->ready() && DB::table('kib_voucher_links')->where('kib', $kategori)->where('record_id', $id)->exists()) {
            throw ValidationException::withMessages(['voucher' => 'Lepaskan voucher manual terlebih dahulu sebelum menghapus inventaris atau mengganti lokasi.']);
        }
    }

    public function referensiGedungLangsung(int $lokasi)
    {
        $location = DB::table('lokasis')->where('id', $lokasi)->first(['id', 'lokasi', 'alamat']);
        abort_unless($location, 404);
        return response()->json([
            'success' => true,
            'lokasi' => $location,
            'departemen' => DB::table('departemens')->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))->orderBy('kode_dep')->get(['id', 'kode_dep', 'nama_dep']),
            'divisi' => DB::table('divisis')->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))->orderBy('nama_div')->get(['id', 'id_dep', 'nama_div'])
        ]);
    }

    public function storeGedungLangsung(Request $request, int $lokasi)
    {
        $input = $this->validasiGedung($request, true, true);
        $org = $request->validate(['id_departemen' => ['required', 'integer', 'exists:departemens,id'], 'id_div' => ['required', 'integer', 'exists:divisis,id'], 'id_nilai_aktiva' => ['prohibited']]);
        $files = [];
        try {
            $id = DB::transaction(function () use ($request, $lokasi, $input, $org, &$files) {
                abort_unless(DB::table('lokasis')->where('id', $lokasi)->exists(), 404);
                $dep = DB::table('departemens')->where('id', $org['id_departemen'])->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))->exists();
                $div = DB::table('divisis')->where('id', $org['id_div'])->where('id_dep', $org['id_departemen'])->where(fn($q) => $q->whereNull('status')->orWhere('status', '<>', 'nonaktif'))->exists();
                if (!$dep || !$div || !DB::table('barangs')->where('id', $input['id_barang'])->where('status', 'aktif')->exists()) throw ValidationException::withMessages(['referensi' => 'Pilih barang aktif dan Departemen/Divisi yang sesuai.']);
                $row = $this->fieldsGedung($input) + [
                    'id_lokasi' => $lokasi,
                    'id_departemen' => (int)$org['id_departemen'],
                    'id_div' => (int)$org['id_div'],
                    'nilai_aktiva_id' => null,
                    'nilai' => null,
                    'susut' => 0,
                    'input' => 1,
                    'id_user' => Auth::id(),
                    'created_at' => now(),
                    'updated_at' => now()
                ];
                foreach (['dokumen' => 'dok', 'foto' => 'img'] as $field => $column) {
                    if ($request->hasFile($field)) {
                        $path = $request->file($field)->store('kib/gedung/' . $field, 'local');
                        if (!$path) throw new \RuntimeException('Gagal menyimpan lampiran.');
                        $files[] = $path;
                        $row[$column] = $path;
                    }
                }
                return DB::table('gedungs')->insertGetId($row);
            });
        } catch (\Throwable $e) {
            foreach ($files as $path) Storage::disk('local')->delete($path);
            throw $e;
        }
        return response()->json(['success' => true, 'id' => $id, 'message' => 'Data Gedung langsung berhasil ditambahkan.'], 201);
    }

    public function storeGedung(Request $request)
    {
        try {
            $validated = $this->validasiGedung(
                $request,
                true
            );
        } catch (ValidationException $e) {

            return $this->gedungFormError(
                $request,
                $e->errors()
            );
        }

        $files = [];

        try {
            DB::transaction(
                function () use (
                    $request,
                    $validated,
                    &$files
                ) {
                    $source = DB::table('nilai_aktivas')
                        ->where(
                            'id',
                            $validated['id_nilai_aktiva']
                        )
                        ->where(
                            'cat',
                            $this->gedungKategori()
                        )
                        ->where('jenisn', 1)
                        ->where('stat', 0)
                        ->lockForUpdate()
                        ->first();

                    if (
                        !$source ||
                        !$source->id_lokasi ||
                        !$source->dep ||
                        !$source->div
                    ) {
                        throw ValidationException::withMessages([
                            'id_nilai_aktiva' =>
                            'Voucher sudah diproses atau ' .
                                'Lokasi, Departemen, dan Divisi ' .
                                'belum lengkap.',
                        ]);
                    }

                    $exists = DB::table('gedungs')
                        ->where(
                            'nilai_aktiva_id',
                            $source->id
                        )
                        ->exists();

                    if ($exists || !empty(app(KibVoucherLinkService::class)->owners([(int)$source->id])[$source->id])) {
                        throw ValidationException::withMessages([
                            'id_nilai_aktiva' =>
                            'Voucher sudah digunakan pada inventaris Gedung.',
                        ]);
                    }

                    $row = $this->fieldsGedung(
                        $validated
                    );

                    $row['id_lokasi'] =
                        (int) $source->id_lokasi;

                    $row['id_departemen'] =
                        (int) $source->dep;

                    $row['id_div'] =
                        (int) $source->div;

                    $row['nilai_aktiva_id'] =
                        (int) $source->id;

                    // Total nilai utama berasal dari
                    // nilai_aktivas, bukan diduplikasi.
                    $row['nilai'] = null;

                    $row['susut'] = 0;
                    $row['input'] = 1;
                    $row['id_user'] = Auth::id();

                    $row['created_at'] = now();
                    $row['updated_at'] = now();

                    if ($request->hasFile('dokumen')) {
                        $row['dok'] = $request
                            ->file('dokumen')
                            ->store(
                                'kib/gedung/dokumen',
                                'local'
                            );

                        $files[] = $row['dok'];
                    }

                    if ($request->hasFile('foto')) {
                        $row['img'] = $request
                            ->file('foto')
                            ->store(
                                'kib/gedung/foto',
                                'local'
                            );

                        $files[] = $row['img'];
                    }

                    DB::table('gedungs')
                        ->insert($row);

                    $changed = DB::table('nilai_aktivas')
                        ->where('id', $source->id)
                        ->where('stat', 0)
                        ->update([
                            'stat' => 1,
                            'updated_at' => now(),
                        ]);

                    if ($changed !== 1) {
                        throw new \RuntimeException(
                            'Status voucher gagal diperbarui.'
                        );
                    }
                }
            );
        } catch (\Throwable $e) {

            foreach ($files as $path) {
                Storage::disk('local')
                    ->delete($path);
            }

            if ($e instanceof ValidationException) {
                return $this->gedungFormError(
                    $request,
                    $e->errors()
                );
            }

            Log::error(
                'Simpan K.I.B Gedung gagal',
                [
                    'voucher_id' =>
                    $request->input('id_nilai_aktiva'),

                    'error' =>
                    $e->getMessage(),
                ]
            );

            return $this->gedungFormError(
                $request,
                [
                    'simpan' =>
                    'Penyimpanan Gedung gagal. ' .
                        'Silakan periksa log Laravel.',
                ]
            );
        }

        return redirect()
            ->route('kib.gedung')
            ->with(
                'success',
                'Gedung berhasil disimpan. Voucher telah diproses.'
            );
    }

    /*
        |--------------------------------------------------------------------------
        | UPDATE DATA GEDUNG
        |--------------------------------------------------------------------------
        */
    public function updateGedung(
        Request $request,
        int $gedung
    ) {
        try {
            $validated = $this->validasiGedung(
                $request,
                false
            );
        } catch (ValidationException $e) {

            return $this->gedungFormError(
                $request,
                $e->errors()
            );
        }

        $newFiles = [];
        $oldFiles = [];

        try {
            DB::transaction(
                function () use (
                    $request,
                    $validated,
                    $gedung,
                    &$newFiles,
                    &$oldFiles
                ) {
                    $previous = DB::table('gedungs')
                        ->where('id', $gedung)
                        ->lockForUpdate()
                        ->first();

                    abort_unless($previous, 404);

                    $fields = $this->fieldsGedung(
                        $validated
                    );

                    $fields['updated_at'] = now();

                    foreach (
                        [
                            'dokumen' => [
                                'dok',
                                'kib/gedung/dokumen'
                            ],
                            'foto' => [
                                'img',
                                'kib/gedung/foto'
                            ],
                        ] as $input => [$field, $folder]
                    ) {
                        if (!$request->hasFile($input)) {
                            continue;
                        }

                        $fields[$field] = $request
                            ->file($input)
                            ->store($folder, 'local');

                        $newFiles[] = $fields[$field];

                        if (
                            $previous->{$field} &&
                            str_starts_with(
                                $previous->{$field},
                                $folder . '/'
                            )
                        ) {
                            $oldFiles[] =
                                $previous->{$field};
                        }
                    }

                    DB::table('gedungs')
                        ->where('id', $gedung)
                        ->update($fields);
                }
            );
        } catch (\Throwable $e) {

            foreach ($newFiles as $path) {
                Storage::disk('local')
                    ->delete($path);
            }

            if ($e instanceof ValidationException) {
                return $this->gedungFormError(
                    $request,
                    $e->errors()
                );
            }

            Log::error(
                'Edit K.I.B Gedung gagal',
                [
                    'gedung' => $gedung,
                    'error' => $e->getMessage(),
                ]
            );

            return $this->gedungFormError(
                $request,
                [
                    'edit' =>
                    'Gagal memperbarui Gedung. ' .
                        'Periksa log Laravel.',
                ]
            );
        }

        foreach ($oldFiles as $path) {
            Storage::disk('local')
                ->delete($path);
        }

        return redirect()
            ->route('kib.gedung')
            ->with(
                'success',
                'Data Gedung berhasil diperbarui.'
            );
    }

    /*
        |--------------------------------------------------------------------------
        | HAPUS SATU INVENTARIS GEDUNG
        |--------------------------------------------------------------------------
        */
    public function destroyGedung(int $gedung)
    {
        $files = [];

        DB::transaction(
            function () use (
                $gedung,
                &$files
            ) {
                $row = DB::table('gedungs')
                    ->where('id', $gedung)
                    ->lockForUpdate()
                    ->first();

                abort_unless($row, 404);
                $this->pastikanTanpaRelasiManual('gedung', $gedung);

                foreach (
                    [
                        'dok' =>
                        'kib/gedung/dokumen/',
                        'img' =>
                        'kib/gedung/foto/',
                    ] as $field => $prefix
                ) {
                    if (
                        $row->{$field} &&
                        str_starts_with(
                            $row->{$field},
                            $prefix
                        )
                    ) {
                        $files[] = $row->{$field};
                    }
                }

                DB::table('gedungs')
                    ->where('id', $gedung)
                    ->delete();

                if (
                    $row->nilai_aktiva_id &&
                    empty(app(KibVoucherLinkService::class)->owners([(int)$row->nilai_aktiva_id])[$row->nilai_aktiva_id])
                ) {
                    DB::table('nilai_aktivas')
                        ->where(
                            'id',
                            $row->nilai_aktiva_id
                        )
                        ->where(
                            'cat',
                            $this->gedungKategori()
                        )
                        ->where('jenisn', 1)
                        ->update([
                            'stat' => 0,
                            'updated_at' => now(),
                        ]);
                }
            }
        );

        foreach ($files as $path) {
            Storage::disk('local')
                ->delete($path);
        }

        return redirect()
            ->route('kib.gedung')
            ->with(
                'success',
                'Data Gedung dihapus. Voucher terkait dikembalikan ke pending.'
            );
    }

    /*
        |--------------------------------------------------------------------------
        | REDIRECT ERROR FORM GEDUNG
        |--------------------------------------------------------------------------
        */
    private function gedungFormError(
        Request $request,
        array $errors
    ) {
        return redirect()
            ->route('kib.gedung')
            ->withErrors($errors)
            ->withInput(
                $request->except([
                    '_token',
                    '_method',
                    'dokumen',
                    'foto',
                ])
            );
    }

    /*
        |--------------------------------------------------------------------------
        | PREVIEW FILE PDF / FOTO GEDUNG
        |--------------------------------------------------------------------------
        */
    public function fileGedung(
        int $gedung,
        string $jenis
    ) {
        abort_unless(
            in_array(
                $jenis,
                ['dokumen', 'foto'],
                true
            ),
            404
        );

        $row = DB::table('gedungs')
            ->where('id', $gedung)
            ->first([
                'dok',
                'img'
            ]);

        abort_unless($row, 404);

        $path = $jenis === 'dokumen'
            ? $row->dok
            : $row->img;

        abort_unless($path, 404);

        $prefix = $jenis === 'dokumen'
            ? 'kib/gedung/dokumen/'
            : 'kib/gedung/foto/';

        if (str_starts_with($path, $prefix)) {

            abort_unless(
                Storage::disk('local')
                    ->exists($path),
                404
            );

            $full = Storage::disk('local')
                ->path($path);
        } else {

            // Kompatibilitas dokumen web lama.
            $legacy = $jenis === 'dokumen'
                ? 'dok'
                : 'img';

            $full = public_path(
                'assets/img/gedung/'
                    . $legacy
                    . '/'
                    . basename($path)
            );

            abort_unless(
                is_file($full),
                404
            );
        }

        $ext = strtolower(
            pathinfo(
                $full,
                PATHINFO_EXTENSION
            )
        );

        if ($jenis === 'dokumen') {

            abort_unless(
                $ext === 'pdf',
                415,
                'Dokumen bukan PDF.'
            );

            return response()->file(
                $full,
                [
                    'Content-Type' =>
                    'application/pdf',

                    'X-Content-Type-Options' =>
                    'nosniff',
                ]
            );
        }

        abort_unless(
            in_array(
                $ext,
                [
                    'png',
                    'jpg',
                    'jpeg',
                    'webp',
                    'gif',
                ],
                true
            ),
            415
        );

        return response()->file(
            $full,
            [
                'X-Content-Type-Options' =>
                'nosniff',
            ]
        );
    }



    /*
    |--------------------------------------------------------------------------
    | K.I.B E — ASET TETAP LAINNYA MANUAL
    |--------------------------------------------------------------------------
    | Database : kib_aset_tetap_manual
    | Lampiran : kib_aset_tetap_dokumens
    | Arsip    : kib_e_s (READ ONLY)
    |--------------------------------------------------------------------------
    */


    /**
     * K.I.B E — laporan satu inventaris atau seluruh kelompok lokasi/divisi.
     * Data manual dan arsip lama sengaja dipisah sesuai perilaku halaman E.
     * Tidak menggunakan pagination; semua baris kelompok ikut dicetak.
     */
    public function laporanAsetTetapKibE(Request $request): \Illuminate\Http\JsonResponse
    {
        $params = $request->validate([
            'mode' => ['required', \Illuminate\Validation\Rule::in(['detail', 'kelompok'])],
            'id' => ['required_if:mode,detail', 'nullable', 'integer', 'min:1'],
            'lokasi' => ['required_if:mode,kelompok', 'nullable', 'string', 'max:500'],
            'divisi' => ['required_if:mode,kelompok', 'nullable', 'string', 'max:255'],
        ]);

        $query = DB::table(self::AEM_TABLE);
        if ($params['mode'] === 'detail') {
            $query->where('id', (int) $params['id']);
        } else {
            $lokasiExpr = "COALESCE(NULLIF(BTRIM(lokasi), ''), 'Tanpa Lokasi')";
            $divisiExpr = "COALESCE(NULLIF(BTRIM(divisi), ''), 'Tanpa Divisi')";
            $query->whereRaw("{$lokasiExpr} = ?", [trim($params['lokasi'])]);
            $query->whereRaw("{$divisiExpr} = ?", [trim($params['divisi'])]);
        }
        $items = $query->orderByDesc('id')->get([
            'id',
            'nama_aset',
            'kode_inventaris',
            'nomor_register',
            'kondisi',
            'bahan',
            'tahun',
            'jumlah_unit',
            'asal_perolehan',
            'keterangan',
            'departemen',
            'divisi',
            'lokasi',
            'alamat',
            'kode_struktur',
        ]);
        if ($params['mode'] === 'detail' && $items->isEmpty()) {
            abort(404, 'Inventaris K.I.B E tidak ditemukan.');
        }

        // Normalisasi Departemen pada respons laporan, bukan mengubah arsip.
        $items->transform(function ($item) {
            $item->departemen = $this->kibNamaDepartemenUntukLaporan($item->departemen ?? null);
            return $item;
        });

        $identitas = static function (string $field) use ($items): string {
            $values = $items->pluck($field)
                ->map(static fn($v) => trim((string) ($v ?? '')))
                ->filter()->unique()->values();
            if ($values->isEmpty()) return '-';
            return $values->count() === 1 ? (string) $values->first() : 'BERAGAM';
        };
        return response()->json([
            'success' => true,
            'mode' => $params['mode'],
            'jumlah' => $items->count(),
            'lokasi' => [
                'nama' => $params['mode'] === 'kelompok'
                    ? trim($params['lokasi']) : $identitas('lokasi'),
                'alamat' => $identitas('alamat'),
            ],
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                'departemen' => $identitas('departemen'),
                'divisi' => $params['mode'] === 'kelompok'
                    ? trim($params['divisi']) : $identitas('divisi'),
                'kode_struktur' => $identitas('kode_struktur'),
            ],
            'sdm' => $this->sdmAktifKibB(),
            'data' => $this->nilaiLaporanKib($items->values()->all(), 'aset_ttp'),
        ]);
    }

    private const AEM_TABLE = 'kib_aset_tetap_manual';

    private const AEM_DOCS = 'kib_aset_tetap_dokumens';

    private const AEM_PATH = 'kib-manual/aset-tetap/';


    /*
    |--------------------------------------------------------------------------
    | QUERY ASET MANUAL
    |--------------------------------------------------------------------------
    */

    private function queryAsetTetapManual()
    {
        return DB::table(self::AEM_TABLE . ' as m')
            ->select('m.*');
    }


    /*
    |--------------------------------------------------------------------------
    | HALAMAN UTAMA K.I.B E
    |--------------------------------------------------------------------------
    */

    public function dataAsetTetapManual(Request $request)
    {
        $viewMode = $request->query('view') === 'arsip'
            ? 'arsip'
            : 'manual';

        $search = trim(
            (string) $request->query('q', '')
        );

        $condition = trim(
            (string) $request->query('kondisi', '')
        );

        $ownershipFilter = trim((string) $request->query('status_kepemilikan', ''));

        /*
         * Statistik tabel manual.
         */

        $totalAset = DB::table(
            self::AEM_TABLE
        )->count();

        $totalUnit = (int) DB::table(
            self::AEM_TABLE
        )->sum('jumlah_unit');

        $totalLokasi = (int) DB::table(
            self::AEM_TABLE
        )
            ->selectRaw(
                'COUNT(DISTINCT LOWER(BTRIM(lokasi))) AS jumlah'
            )
            ->value('jumlah');

        /*
         * Statistik arsip.
         */

        $archiveExists = Schema::hasTable('kib_e_s');

        $archiveCount = $archiveExists
            ? DB::table('kib_e_s')->count()
            : 0;


        /*
         * DATA ARSIP LAMA — READ ONLY
         */

        if ($viewMode === 'arsip' && $archiveExists) {

            $query = DB::table('kib_e_s as e')

                ->leftJoin(
                    'barangs as b',
                    'b.id',
                    '=',
                    'e.id_barang'
                )

                ->leftJoin(
                    'lokasis as l',
                    'l.id',
                    '=',
                    'e.id_lokasi'
                )

                ->select([
                    'e.id',
                    'e.kode',
                    'e.reg',
                    'e.kondisi',
                    'e.tahun',
                    'e.jumlah',
                    'e.asal',
                    'e.ket',
                    'b.nama_barang as nama_aset',
                    'l.lokasi as lokasi',
                    'l.alamat as alamat',
                ]);

            if ($search !== '') {

                $like = '%' . $search . '%';

                $query->where(function ($q) use ($like) {

                    foreach (
                        [
                            'b.nama_barang',
                            'l.lokasi',
                            'e.kode',
                            'e.reg',
                        ] as $field
                    ) {

                        $q->orWhere(
                            $field,
                            'ilike',
                            $like
                        );
                    }
                });
            }

            $items = $query
                ->orderByDesc('e.id')
                ->paginate(15)
                ->withQueryString();
        } elseif ($viewMode === 'arsip') {

            $items = DB::table(self::AEM_TABLE)
                ->whereRaw('1 = 0')
                ->paginate(15)
                ->withQueryString();
        } else {

            /*
             * DATA MANUAL BARU
             */

            $query = $this->queryAsetTetapManual();

            if ($search !== '') {

                $like = '%' . $search . '%';

                $query->where(function ($q) use ($like) {

                    foreach (
                        [
                            'm.nama_aset',
                            'm.kode_inventaris',
                            'm.nomor_register',
                            'm.lokasi',
                            'm.departemen',
                            'm.divisi',
                            'm.bahan',
                        ] as $field
                    ) {

                        $q->orWhere(
                            $field,
                            'ilike',
                            $like
                        );
                    }
                });
            }

            if ($condition !== '') {

                $query->whereRaw(
                    'UPPER(BTRIM(m.kondisi)) = ?',
                    [mb_strtoupper($condition)]
                );
            }

            if (in_array($ownershipFilter, ['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta'], true)) {
                $query->where('m.status_kepemilikan', $ownershipFilter);
            } elseif ($ownershipFilter === 'belum_diatur') {
                $query->where(function ($q) {
                    $q->whereNull('m.status_kepemilikan')->orWhere('m.status_kepemilikan', '');
                });
            }

            $items = $query
                ->orderByDesc('m.id')
                ->paginate(15)
                ->withQueryString();
        }


        /*
        |--------------------------------------------------------------------------
        | MASTER DATA SEBAGAI SUMBER DROPDOWN
        |--------------------------------------------------------------------------
        */

        $master = [

            'lokasi' => Schema::hasTable('lokasis')
                ? DB::table('lokasis')
                ->select('id', 'lokasi', 'alamat')
                ->orderBy('lokasi')
                ->when(Schema::hasColumn('lokasis', 'status'), fn($query) => $query->where('status', 'aktif'))
                ->get()
                : [],

            'departemen' => $this->kibPilihanDepartemen(true),

            'divisi' => Schema::hasTable('divisis')
                ? DB::table('divisis')
                ->select('id', 'id_dep', 'nama_div')
                ->orderBy('nama_div')
                ->when(Schema::hasColumn('divisis', 'status'), fn($query) => $query->where('status', 'aktif'))
                ->get()
                : [],

            'bahan' => Schema::hasTable('bahans')
                ? DB::table('bahans')
                ->select('id', 'nama')
                ->orderBy('nama')
                ->when(Schema::hasColumn('bahans', 'status'), fn($query) => $query->where('status', 'aktif'))
                ->get()
                : [],
        ];


        /*
         * Saran dari data manual yang pernah disimpan.
         */

        $history = [];

        foreach (
            [
                'nama_aset',
                'lokasi',
                'departemen',
                'divisi',
                'bahan',
                'asal_perolehan',
            ] as $column
        ) {

            $history[$column] = DB::table(self::AEM_TABLE)
                ->whereNotNull($column)
                ->where($column, '<>', '')
                ->distinct()
                ->orderBy($column)
                ->limit(300)
                ->pluck($column);
        }

        return view(
            'kib.aset_ttp',
            compact(
                'items',
                'totalAset',
                'totalUnit',
                'totalLokasi',
                'archiveCount',
                'viewMode',
                'search',
                'condition',
                'ownershipFilter',
                'master',
                'history'
            )
        );
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDASI FORM
    |--------------------------------------------------------------------------
    */


    private function validasiAsetTetapManual(
        \Illuminate\Http\Request $request
    ): array {
        return $request->validate([
            'nama_aset' => [
                'required',
                'string',
                'max:500'
            ],

            'lokasi' => [
                'required',
                'string',
                'max:500'
            ],

            'alamat' => [
                'nullable',
                'string',
                'max:500'
            ],

            'departemen' => [
                'nullable',
                'string',
                'max:255'
            ],

            'divisi' => [
                'nullable',
                'string',
                'max:255'
            ],

            'kode_struktur' => [
                'nullable',
                'string',
                'max:100'
            ],

            'kode_inventaris' => [
                'required',
                'string',
                'max:255'
            ],

            'nomor_register' => [
                'required',
                'string',
                'max:255'
            ],

            'bahan' => [
                'nullable',
                'string',
                'max:255'
            ],

            'tahun' => [
                'required',
                'integer',
                'between:1900,2100'
            ],

            'jumlah_unit' => [
                'required',
                'integer',
                'min:1'
            ],

            'kondisi' => [
                'required',
                \Illuminate\Validation\Rule::in([
                    'BAIK',
                    'KURANG BAIK',
                    'RUSAK BERAT',

                    // Kompatibilitas dengan data lama
                    'CUKUP',
                    'RUSAK RINGAN',
                ]),
            ],

            'asal_perolehan' => [
                'nullable',
                'string',
                'max:255'
            ],

            'keterangan' => [
                'nullable',
                'string'
            ],

            'status_kepemilikan' => [
                'required',
                \Illuminate\Validation\Rule::in(['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta']),
            ],

            'foto' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'dokumens' => [
                'nullable',
                'array'
            ],

            'dokumens.*' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
            ],

            'hapus_dokumen_ids' => [
                'nullable',
                'array'
            ],

            'hapus_dokumen_ids.*' => [
                'integer'
            ],
        ]);
    }



    /*
    |--------------------------------------------------------------------------
    | PEMETAAN FIELD FORM
    |--------------------------------------------------------------------------
    */


    private function fieldsAsetTetapManual(
        array $data
    ): array {
        $result = [];

        foreach (
            [
                'nama_aset',
                'lokasi',
                'alamat',
                'departemen',
                'divisi',
                'kode_struktur',
                'kode_inventaris',
                'nomor_register',
                'bahan',
                'tahun',
                'jumlah_unit',
                'kondisi',
                'asal_perolehan',
                'keterangan',
                'status_kepemilikan',
            ] as $key
        ) {
            $result[$key] = $key === 'departemen'
                ? $this->kibNamaDepartemenInputManual($data[$key] ?? null)
                : ($data[$key] ?? null);
        }

        return $result;
    }


    /*
    |--------------------------------------------------------------------------
    | SIMPAN LAMPIRAN PDF / GAMBAR
    |--------------------------------------------------------------------------
    */

    private function simpanDokumenAsetTetapManual(
        Request $request,
        int $id,
        array &$added
    ): void {

        foreach (
            $request->file('dokumens', []) as $file
        ) {

            $path = $file->store(
                self::AEM_PATH . $id . '/dokumen',
                'local'
            );

            if (!$path) {
                throw new \RuntimeException(
                    'Gagal menyimpan dokumen.'
                );
            }

            $added[] = $path;

            DB::table(self::AEM_DOCS)->insert([

                'aset_tetap_id' => $id,

                'nama_asli' => mb_substr(
                    basename($file->getClientOriginalName()),
                    0,
                    255
                ),

                'path' => $path,

                'mime' => $file->getMimeType(),

                'ukuran' => $file->getSize(),

                'created_at' => now(),

                'updated_at' => now(),
            ]);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE — TAMBAH ASET
    |--------------------------------------------------------------------------
    */

    public function storeAsetTetapManual(
        Request $request
    ) {

        $data = $this->validasiAsetTetapManual(
            $request
        );

        $added = [];

        try {

            $id = DB::transaction(
                function () use (
                    $request,
                    $data,
                    &$added
                ) {

                    $record = $this->fieldsAsetTetapManual(
                        $data
                    );

                    $record['created_by'] = Auth::id();

                    $record['created_at'] = now();

                    $record['updated_at'] = now();

                    $id = (int) DB::table(
                        self::AEM_TABLE
                    )->insertGetId($record);


                    /*
                     * Foto utama aset.
                     */

                    if ($request->hasFile('foto')) {

                        $path = $request
                            ->file('foto')
                            ->store(
                                self::AEM_PATH .
                                    $id .
                                    '/foto',
                                'local'
                            );

                        if (!$path) {
                            throw new \RuntimeException(
                                'Gagal menyimpan foto.'
                            );
                        }

                        $added[] = $path;

                        DB::table(self::AEM_TABLE)
                            ->where('id', $id)
                            ->update([
                                'foto_path' => $path,
                            ]);
                    }


                    /*
                     * Lampiran PDF dan gambar.
                     */

                    $this->simpanDokumenAsetTetapManual(
                        $request,
                        $id,
                        $added
                    );

                    return $id;
                }
            );
        } catch (\Throwable $e) {

            Storage::disk('local')->delete($added);

            throw $e;
        }

        return response()->json([

            'success' => true,

            'id' => $id,

            'message' =>
            'Aset Tetap Lainnya berhasil ditambahkan.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | READ — VIEW DETAIL
    |--------------------------------------------------------------------------
    */

    public function showAsetTetapManual(int $aset)
    {
        $row = DB::table(self::AEM_TABLE)
            ->where('id', $aset)
            ->first();

        abort_unless($row, 404);

        $data = (array) $row;


        /*
         * URL foto utama.
         */

        $data['foto_url'] = (
            $row->foto_path &&
            Storage::disk('local')->exists(
                $row->foto_path
            )
        )
            ? route(
                'kib.aset_ttp.manual.foto',
                ['aset' => $aset]
            )
            : null;


        /*
         * URL semua dokumen.
         */

        $data['dokumens'] = DB::table(
            self::AEM_DOCS
        )

            ->where('aset_tetap_id', $aset)

            ->orderBy('id')

            ->get()

            ->map(fn($doc) => [

                'id' => (int) $doc->id,

                'nama' => $doc->nama_asli,

                'ukuran' => (int) $doc->ukuran,

                'url' => route(
                    'kib.aset_ttp.manual.dokumen',
                    [
                        'aset' => $aset,
                        'dokumen' => $doc->id,
                    ]
                ),
            ])

            ->all();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE — EDIT ASET
    |--------------------------------------------------------------------------
    */

    public function updateAsetTetapManual(
        Request $request,
        int $aset
    ) {

        $data = $this->validasiAsetTetapManual(
            $request
        );

        $added = [];

        $remove = [];

        try {

            DB::transaction(
                function () use (
                    $request,
                    $data,
                    $aset,
                    &$added,
                    &$remove
                ) {

                    $old = DB::table(self::AEM_TABLE)
                        ->where('id', $aset)
                        ->lockForUpdate()
                        ->first();

                    abort_unless($old, 404);

                    $record = $this->fieldsAsetTetapManual(
                        $data
                    );

                    $record['updated_at'] = now();


                    /*
                     * Ganti foto jika diunggah.
                     */

                    if (trim((string)($record['lokasi'] ?? '')) !== trim((string)$old->lokasi)) $this->pastikanTanpaRelasiManual('aset_ttp', $aset);

                    if ($request->hasFile('foto')) {

                        $path = $request
                            ->file('foto')
                            ->store(
                                self::AEM_PATH .
                                    $aset .
                                    '/foto',
                                'local'
                            );

                        if (!$path) {
                            throw new \RuntimeException(
                                'Gagal menyimpan foto.'
                            );
                        }

                        $added[] = $path;

                        $record['foto_path'] = $path;

                        if ($old->foto_path) {
                            $remove[] = $old->foto_path;
                        }
                    }

                    DB::table(self::AEM_TABLE)
                        ->where('id', $aset)
                        ->update($record);


                    /*
                     * Hapus lampiran terpilih.
                     */

                    $ids = array_values(
                        array_unique(
                            array_map(
                                'intval',
                                $data['hapus_dokumen_ids'] ?? []
                            )
                        )
                    );

                    if ($ids) {

                        $docs = DB::table(self::AEM_DOCS)
                            ->where('aset_tetap_id', $aset)
                            ->whereIn('id', $ids)
                            ->get();

                        foreach ($docs as $doc) {
                            $remove[] = $doc->path;
                        }

                        DB::table(self::AEM_DOCS)
                            ->where('aset_tetap_id', $aset)
                            ->whereIn('id', $ids)
                            ->delete();
                    }


                    /*
                     * Tambah lampiran baru.
                     */

                    $this->simpanDokumenAsetTetapManual(
                        $request,
                        $aset,
                        $added
                    );
                }
            );
        } catch (\Throwable $e) {

            Storage::disk('local')->delete($added);

            throw $e;
        }

        /*
         * File lama dihapus setelah commit.
         */

        if ($remove) {
            Storage::disk('local')->delete($remove);
        }

        return response()->json([

            'success' => true,

            'message' =>
            'Aset Tetap Lainnya berhasil diperbarui.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE — HAPUS ASET
    |--------------------------------------------------------------------------
    */

    public function destroyAsetTetapManual(int $aset)
    {
        $remove = [];

        DB::transaction(
            function () use ($aset, &$remove) {

                $row = DB::table(self::AEM_TABLE)
                    ->where('id', $aset)
                    ->lockForUpdate()
                    ->first();

                abort_unless($row, 404);
                $this->pastikanTanpaRelasiManual('aset_ttp', $aset);

                if ($row->foto_path) {
                    $remove[] = $row->foto_path;
                }

                foreach (
                    DB::table(self::AEM_DOCS)
                        ->where('aset_tetap_id', $aset)
                        ->get() as $doc
                ) {
                    $remove[] = $doc->path;
                }


                /*
                 * Foreign key cascade akan menghapus
                 * metadata dokumen.
                 */

                DB::table(self::AEM_TABLE)
                    ->where('id', $aset)
                    ->delete();
            }
        );

        if ($remove) {
            Storage::disk('local')->delete($remove);
        }

        return response()->json([

            'success' => true,

            'message' => 'Data berhasil dihapus.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN FOTO UTAMA
    |--------------------------------------------------------------------------
    */

    public function fotoAsetTetapManual(int $aset)
    {
        $row = DB::table(self::AEM_TABLE)
            ->where('id', $aset)
            ->first();

        abort_unless(
            $row && $row->foto_path,
            404
        );

        abort_unless(
            str_starts_with(
                $row->foto_path,
                self::AEM_PATH . $aset . '/foto/'
            ),
            404
        );

        abort_unless(
            Storage::disk('local')->exists(
                $row->foto_path
            ),
            404
        );

        return response()->file(
            Storage::disk('local')->path(
                $row->foto_path
            ),
            [
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }



    public function kelompokAsetTetapManual(
        \Illuminate\Http\Request $request
    ) {
        $request->validate([
            'lokasi' => ['nullable', 'string', 'max:500'],
            'divisi' => ['nullable', 'string', 'max:255'],
            'q' => ['nullable', 'string', 'max:150'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        /*
    |--------------------------------------------------------------------------
    | NORMALISASI KELOMPOK
    |--------------------------------------------------------------------------
    */

        $lokasiExpr = "
        COALESCE(
            NULLIF(BTRIM(lokasi), ''),
            'Tanpa Lokasi'
        )
    ";

        $divisiExpr = "
        COALESCE(
            NULLIF(BTRIM(divisi), ''),
            'Tanpa Divisi'
        )
    ";

        /*
    |--------------------------------------------------------------------------
    | PANEL KIRI — LOKASI DAN DIVISI
    |--------------------------------------------------------------------------
    */

        $groups = \Illuminate\Support\Facades\DB::table(
            'kib_aset_tetap_manual'
        )
            ->selectRaw("
            {$lokasiExpr} AS lokasi,
            {$divisiExpr} AS divisi,
            COUNT(*) AS jumlah,
            MAX(id) AS id_terbaru
        ")
            ->groupByRaw("
            {$lokasiExpr},
            {$divisiExpr}
        ")
            ->orderByDesc('id_terbaru')
            ->orderBy('lokasi')
            ->orderBy('divisi')
            ->get();

        $requestedLokasi = trim(
            (string) $request->query('lokasi', '')
        );

        $requestedDivisi = trim(
            (string) $request->query('divisi', '')
        );

        $selected = $groups->first(
            fn($group) =>
            $group->lokasi === $requestedLokasi &&
                $group->divisi === $requestedDivisi
        ) ?? $groups->first();

        if (!$selected) {
            return response()->json([
                'success' => true,
                'groups' => [],
                'selected' => null,
                'items' => [],
                'pagination' => [
                    'page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                    'from' => 0,
                    'to' => 0,
                ],
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | PANEL KANAN — AMBIL SEMUA KOLOM EXCEL
    |--------------------------------------------------------------------------
    */

        $query = \Illuminate\Support\Facades\DB::table(
            'kib_aset_tetap_manual'
        )
            ->whereRaw(
                "{$lokasiExpr} = ?",
                [$selected->lokasi]
            )
            ->whereRaw(
                "{$divisiExpr} = ?",
                [$selected->divisi]
            );

        $search = trim(
            (string) $request->query('q', '')
        );

        if ($search !== '') {
            $like = '%' . $search . '%';

            $query->where(function ($builder) use ($like) {
                $builder
                    ->where('nama_aset', 'ILIKE', $like)
                    ->orWhere(
                        'kode_inventaris',
                        'ILIKE',
                        $like
                    )
                    ->orWhere(
                        'nomor_register',
                        'ILIKE',
                        $like
                    )
                    ->orWhere(
                        'bahan',
                        'ILIKE',
                        $like
                    )
                    ->orWhere(
                        'asal_perolehan',
                        'ILIKE',
                        $like
                    )
                    ->orWhere(
                        'keterangan',
                        'ILIKE',
                        $like
                    );
            });
        }

        $page = $query
            ->select([
                'id',
                'nama_aset',
                'kode_inventaris',
                'nomor_register',
                'kondisi',
                'bahan',
                'tahun',
                'jumlah_unit',
                'asal_perolehan',
                'keterangan',
                'status_kepemilikan',
            ])
            ->orderByDesc('id')
            ->paginate(10);

        /*
    |--------------------------------------------------------------------------
    | FORMAT JSON
    | Semua kolom Excel dikirim ke frontend.
    |--------------------------------------------------------------------------
    */

        $items = $page
            ->getCollection()
            ->map(fn($row) => [
                'id' => (int) $row->id,

                'nama_aset' => $row->nama_aset,

                'kode_inventaris' =>
                $row->kode_inventaris,

                'nomor_register' =>
                $row->nomor_register,

                'kondisi' => $row->kondisi,

                'bahan' => $row->bahan,

                'tahun' => $row->tahun,

                'jumlah_unit' => $row->jumlah_unit,

                'asal_perolehan' =>
                $row->asal_perolehan,

                'keterangan' => $row->keterangan,
                'status_kepemilikan' => $row->status_kepemilikan,
            ])
            ->all();

        return response()->json([
            'success' => true,

            'groups' => $groups
                ->map(fn($group) => [
                    'lokasi' => $group->lokasi,
                    'divisi' => $group->divisi,
                    'jumlah' => (int) $group->jumlah,
                ])
                ->all(),

            'selected' => [
                'lokasi' => $selected->lokasi,
                'divisi' => $selected->divisi,
            ],

            'items' => $this->nilaiLaporanKib($items, 'aset_ttp'),

            'pagination' => [
                'page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
                'from' => $page->firstItem() ?? 0,
                'to' => $page->lastItem() ?? 0,
            ],
        ]);
    }




    /*
    |--------------------------------------------------------------------------
    | PREVIEW / DOWNLOAD DOKUMEN
    |--------------------------------------------------------------------------
    */

    public function dokumenAsetTetapManual(
        int $aset,
        int $dokumen
    ) {

        $doc = DB::table(self::AEM_DOCS)
            ->where('aset_tetap_id', $aset)
            ->where('id', $dokumen)
            ->first();

        abort_unless($doc, 404);

        abort_unless(
            str_starts_with(
                $doc->path,
                self::AEM_PATH . $aset . '/dokumen/'
            ),
            404
        );

        abort_unless(
            Storage::disk('local')->exists(
                $doc->path
            ),
            404
        );

        $path = Storage::disk('local')->path(
            $doc->path
        );

        $mime = (string) ($doc->mime ?? '');

        abort_unless(
            in_array($mime, [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/webp',
            ], true),
            415
        );

        if (request()->boolean('download')) {

            return response()->download(
                $path,
                basename($doc->nama_asli)
            );
        }

        return response()->file(
            $path,
            [
                'Content-Type' => $mime,

                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }



    /*
|--------------------------------------------------------------------------
| K.I.B F — DETAIL KELOMPOK KONSTRUKSI MANUAL
|--------------------------------------------------------------------------
| Database:
|   kib_konstruksi_manual
|   kib_konstruksi_dokumens
|
| Kelompok:
|   Kategori → Lokasi → Divisi
|
| Tidak ada hubungan wajib ke Kode Aktiva dan Nilai Aset.
|--------------------------------------------------------------------------
*/

    /**
     * K.I.B F: laporan keseluruhan satu kelompok Kategori + Lokasi + Divisi.
     * Tidak memakai pagination Detail dan tidak mengubah data historis.
     */
    public function laporanKonstruksiKibF(Request $request): \Illuminate\Http\JsonResponse
    {
        $params = $request->validate([
            'kategori' => ['required', 'string', 'max:30'],
            'lokasi' => ['required', 'string', 'max:500'],
            'divisi' => ['required', 'string', 'max:255'],
        ]);

        $normal = static fn(string $column, string $fallback) =>
        "COALESCE(NULLIF(BTRIM({$column}), ''), '{$fallback}')";

        $query = DB::table('kib_konstruksi_manual')
            ->whereRaw($normal('kategori', 'Tanpa Kategori') . ' = ?', [$params['kategori']])
            ->whereRaw($normal('lokasi', 'Tanpa Lokasi') . ' = ?', [$params['lokasi']])
            ->whereRaw($normal('divisi', 'Tanpa Divisi') . ' = ?', [$params['divisi']]);

        // Seluruh kelompok, termasuk data di halaman pagination lain.
        $items = $query->orderByDesc('id')->get();
        if ($items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Kelompok konstruksi tidak memiliki data.',
            ], 404);
        }

        $ids = $items->pluck('id')->map(static fn($id) => (int) $id)->all();
        $docs = DB::table('kib_konstruksi_dokumens')
            ->whereIn('konstruksi_id', $ids)
            ->select('konstruksi_id', 'nama_asli')
            ->orderBy('id')->get()->groupBy('konstruksi_id');

        $hasLuas = Schema::hasColumn('kib_konstruksi_manual', 'luas');
        $rows = $items->map(function ($row) use ($docs, $hasLuas) {
            $id = (int) $row->id;
            return [
                'id' => $id,
                'nama' => trim((string) ($row->nama_pekerjaan ?? '')),
                'uraian' => trim((string) ($row->uraian_pekerjaan ?? '')),
                'cakupan' => trim((string) ($row->cakupan ?? '')),
                'tahun' => $row->tahun ?? null,
                'bangunan' => $row->jenis_bangunan ?? null,
                'bertingkat' => $row->bertingkat ?? null,
                'beton' => $row->material ?? null,
                'luas' => $hasLuas ? ($row->luas ?? null) : null,
                'lokasi' => $row->lokasi ?? null,
                'alamat' => $row->alamat ?? null,
                'letak' => $row->letak ?? null,
                'status_tanah' => $row->status_tanah ?? null,
                'asal_pembiayaan' => $row->asal_pembiayaan ?? null,
                'status_aset' => $row->status_aset ?? null,
                'nilai' => $row->nilai ?? null,
                'keterangan' => $row->keterangan ?? null,
                'dokumens' => ($docs->get($id) ?? collect())
                    ->pluck('nama_asli')->map(static fn($name) => (string) $name)->values()->all(),
            ];
        })->values()->all();

        // Data historis boleh menggunakan nama maupun kode Departemen.
        $departemen = $items->map(
            fn($row) =>
            $this->kibNamaDepartemenUntukLaporan($row->departemen ?? null)
        )->filter(static fn($value) => $value !== '-' && trim($value) !== '')
            ->unique()->values();
        $namaDepartemen = $departemen->count() > 1
            ? 'BERAGAM' : ($departemen->first() ?? '-');

        // Satu lokasi dapat memiliki beberapa kode struktur lama; jangan dikarang.
        $kodeStruktur = '-';
        if (Schema::hasColumn('lokasis', 'kode_struktur')) {
            $kodes = DB::table('lokasis')
                ->where('lokasi', $params['lokasi'])
                ->whereNotNull('kode_struktur')
                ->distinct()->pluck('kode_struktur')
                ->map(static fn($v) => trim((string) $v))
                ->filter()->unique()->values();
            $kodeStruktur = $kodes->count() > 1
                ? 'BERAGAM' : ($kodes->first() ?? '-');
        }

        // Hanya SDM yang secara eksplisit berstatus aktif boleh menandatangani.
        // Status NULL / nonaktif / belum diatur tidak termasuk pilihan.
        $sdm = collect();
        if (Schema::hasTable('sdms') && Schema::hasColumn('sdms', 'status')) {
            $orang = DB::table('sdms as s');
            if (Schema::hasTable('jabatans')) {
                $orang->leftJoin('jabatans as j', 'j.id', '=', 's.id_jabat');
            }
            $orang->whereNotNull('s.nama_sdm')
                ->whereRaw("BTRIM(s.nama_sdm) <> ''")
                ->whereRaw("LOWER(BTRIM(s.status)) = ?", ['aktif']);
            $fields = ['s.id', 's.nama_sdm', 's.nip'];
            $fields[] = Schema::hasTable('jabatans')
                ? 'j.jabat as jabatan'
                : DB::raw("'' AS jabatan");
            $sdm = $orang->select($fields)->orderBy('s.nama_sdm')->get()
                ->map(static fn($s) => [
                    'id' => (int) $s->id,
                    'nama' => trim((string) $s->nama_sdm),
                    'nip' => trim((string) ($s->nip ?? '')),
                    'jabatan' => trim((string) ($s->jabatan ?? '')),
                ]);
        }

        return response()->json([
            'success' => true,
            'kelompok' => [
                'kategori' => $params['kategori'],
                'lokasi' => $params['lokasi'],
                'divisi' => $params['divisi'],
                'jumlah' => count($rows),
            ],
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                'departemen' => $namaDepartemen,
                'divisi' => $params['divisi'] === 'Tanpa Divisi' ? '-' : $params['divisi'],
                'kode_struktur' => $kodeStruktur,
            ],
            'sdm' => $sdm->values()->all(),
            'items' => $this->nilaiLaporanKib($rows, 'konstruksi', 'id', 'nilai'),
            'keterangan_luas' => $hasLuas
                ? null : 'Kolom Luas belum tersedia pada tabel konstruksi; laporan menampilkan tanda —.',
        ]);
    }

    public function kelompokKonstruksiManual(
        \Illuminate\Http\Request $request
    ) {
        $request->validate([
            'kategori' => ['nullable', 'string', 'max:30'],
            'lokasi'   => ['nullable', 'string', 'max:500'],
            'divisi'   => ['nullable', 'string', 'max:255'],
            'q'        => ['nullable', 'string', 'max:150'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        /*
     * Normalisasi hanya untuk pengelompokan.
     * Tidak mengubah data yang tersimpan.
     */

        $kategoriSql = "
        COALESCE(
            NULLIF(BTRIM(kategori), ''),
            'Tanpa Kategori'
        )
    ";

        $lokasiSql = "
        COALESCE(
            NULLIF(BTRIM(lokasi), ''),
            'Tanpa Lokasi'
        )
    ";

        $divisiSql = "
        COALESCE(
            NULLIF(BTRIM(divisi), ''),
            'Tanpa Divisi'
        )
    ";

        /*
     * PANEL KIRI
     */

        $groups = \Illuminate\Support\Facades\DB::table(
            'kib_konstruksi_manual'
        )
            ->selectRaw("
            {$kategoriSql} AS kategori,
            {$lokasiSql} AS lokasi,
            {$divisiSql} AS divisi,
            COUNT(*) AS jumlah
        ")
            ->groupByRaw("
            {$kategoriSql},
            {$lokasiSql},
            {$divisiSql}
        ")
            ->orderBy('kategori')
            ->orderBy('lokasi')
            ->orderBy('divisi')
            ->get();

        /*
     * Pilih kelompok sesuai tombol Detail.
     */

        $requestedKategori = trim(
            (string) $request->query('kategori', '')
        );

        $requestedLokasi = trim(
            (string) $request->query('lokasi', '')
        );

        $requestedDivisi = trim(
            (string) $request->query('divisi', '')
        );

        $selected = $groups->first(
            fn($group) =>
            $group->kategori === $requestedKategori &&
                $group->lokasi === $requestedLokasi &&
                $group->divisi === $requestedDivisi
        ) ?? $groups->first();

        if (!$selected) {
            return response()->json([
                'success' => true,
                'groups' => [],
                'selected' => null,
                'items' => [],
                'pagination' => [
                    'page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                    'from' => 0,
                    'to' => 0,
                ],
            ]);
        }

        /*
     * PANEL KANAN
     */

        $query = \Illuminate\Support\Facades\DB::table(
            'kib_konstruksi_manual'
        )
            ->whereRaw(
                "{$kategoriSql} = ?",
                [$selected->kategori]
            )
            ->whereRaw(
                "{$lokasiSql} = ?",
                [$selected->lokasi]
            )
            ->whereRaw(
                "{$divisiSql} = ?",
                [$selected->divisi]
            );

        $search = trim(
            (string) $request->query('q', '')
        );

        if ($search !== '') {
            $like = '%' . $search . '%';

            $query->where(function ($builder) use ($like) {
                foreach (
                    [
                        'nama_pekerjaan',
                        'cakupan',
                        'uraian_pekerjaan',
                        'keterangan',
                    ] as $column
                ) {
                    $builder->orWhere(
                        $column,
                        'ILIKE',
                        $like
                    );
                }
            });
        }

        /*
     * Pagination 10 pekerjaan.
     */

        $page = $query
            ->select([
                'id',
                'nama_pekerjaan',
                'cakupan',
                'tahun',
                'nilai',
                'status_aset',
                'foto_path',
            ])
            ->orderBy('nama_pekerjaan')
            ->orderBy('id')
            ->paginate(10);

        /*
     * Ambil dokumen berdasarkan pekerjaan
     * yang tampil pada halaman aktif.
     */

        $ids = $page
            ->getCollection()
            ->pluck('id')
            ->all();

        $documents = \Illuminate\Support\Facades\DB::table(
            'kib_konstruksi_dokumens'
        )
            ->whereIn('konstruksi_id', $ids)
            ->select([
                'id',
                'konstruksi_id',
                'nama_asli',
            ])
            ->orderBy('id')
            ->get()
            ->groupBy('konstruksi_id');

        /*
     * FORMAT JSON PANEL KANAN
     */

        $items = $page
            ->getCollection()
            ->map(function ($row) use ($documents) {
                $id = (int) $row->id;

                $photoUrl = null;

                if (
                    $row->foto_path &&
                    \Illuminate\Support\Facades\Storage::disk('local')
                    ->exists($row->foto_path)
                ) {
                    $photoUrl = route(
                        'kib.konstruksi.foto',
                        ['konstruksi' => $id]
                    );
                }

                return [
                    'id' => $id,
                    'nama_barang' => $row->nama_pekerjaan,
                    'cakupan' => $row->cakupan,
                    'tahun' => $row->tahun,
                    'nilai' => $row->nilai,
                    'status_aset' => $row->status_aset,
                    'foto_url' => $photoUrl,

                    'dokumens' => (
                        $documents->get($id) ?? collect()
                    )
                        ->map(fn($doc) => [
                            'id' => (int) $doc->id,
                            'nama' => $doc->nama_asli,
                            'url' => route(
                                'kib.konstruksi.dokumen',
                                [
                                    'konstruksi' => $id,
                                    'dokumen' => $doc->id,
                                ]
                            ),
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->all();

        return response()->json([
            'success' => true,

            'groups' => $groups
                ->map(fn($group) => [
                    'kategori' => $group->kategori,
                    'lokasi' => $group->lokasi,
                    'divisi' => $group->divisi,
                    'jumlah' => (int) $group->jumlah,
                ])
                ->all(),

            'selected' => [
                'kategori' => $selected->kategori,
                'lokasi' => $selected->lokasi,
                'divisi' => $selected->divisi,
            ],

            'items' => $this->nilaiLaporanKib($items, 'konstruksi', 'id', 'nilai'),

            'pagination' => [
                'page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
                'from' => $page->firstItem() ?? 0,
                'to' => $page->lastItem() ?? 0,
            ],
        ]);
    }




    /*
    |--------------------------------------------------------------------------
    | K.I.B F — KONSTRUKSI MANUAL
    |--------------------------------------------------------------------------
    | Database utama: kib_konstruksi_manual
    | Lampiran      : kib_konstruksi_dokumens
    | Arsip lama    : kib_f_s (READ ONLY)
    |--------------------------------------------------------------------------
    */

    private const KONSTRUKSI_MANUAL_TABLE =
    'kib_konstruksi_manual';

    private const KONSTRUKSI_MANUAL_DOCS =
    'kib_konstruksi_dokumens';

    private const KONSTRUKSI_MANUAL_PATH =
    'kib-manual/konstruksi/';

    private const KONSTRUKSI_MANUAL_KATEGORI = [
        'IPA',
        'BOOSTER',
        'PERPIPAAN',
    ];

    // Lima sumber pembiayaan yang berlaku untuk entri K.I.B F baru.
    // Nilai historis lain tetap boleh dipertahankan tanpa perubahan saat Edit.
    private const KONSTRUKSI_PEMBIAYAAN = [
        'perumdam',
        'pusat',
        'pemprov',
        'pemkot',
        'swasta',
    ];


    /*
    |--------------------------------------------------------------------------
    | QUERY DATA MANUAL
    |--------------------------------------------------------------------------
    */

    private function queryKonstruksiManual()
    {
        return DB::table(self::KONSTRUKSI_MANUAL_TABLE . ' as m')
            ->select('m.*')
            ->addSelect([
                'm.nama_pekerjaan as nama_barang',
                'm.nama_pekerjaan as nama_barang_manual',
                'm.lokasi as nama_lokasi',
                'm.lokasi as lokasi_manual',
                'm.alamat as alamat_lokasi',
                'm.alamat as alamat_manual',
                'm.departemen as nama_departemen',
                'm.departemen as departemen_manual',
                'm.divisi as nama_divisi',
                'm.divisi as divisi_manual',
                'm.jenis_bangunan as type',
                'm.bertingkat as struktur',
                'm.material as materi',
                'm.asal_pembiayaan as asal',
                'm.uraian_pekerjaan as urai',
                'm.keterangan as ket',
            ]);
    }


    /*
    |--------------------------------------------------------------------------
    | QUERY ARSIP KONSTRUKSI LAMA
    |--------------------------------------------------------------------------
    | Tidak digunakan untuk insert, update, atau delete.
    |--------------------------------------------------------------------------
    */

    private function queryArsipKonstruksiManual()
    {
        return DB::table('kib_f_s as k')

            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'k.id_barang'
            )

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'k.id_lokasi'
            )

            ->select([
                'k.id',
                'k.tahun',
                'k.type',
                'k.struktur',
                'k.materi',
                'k.letak',
                'k.status_tanah',
                'k.asal',
                'k.status_aset',
                'k.nilai',
                'k.urai',
                'k.ket',
                'b.nama_barang as nama_barang',
                'l.lokasi as nama_lokasi',
                'l.alamat as alamat_lokasi',
            ]);
    }


    /*
    |--------------------------------------------------------------------------
    | HALAMAN UTAMA KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    public function dataKonstruksiManual(Request $request)
    {
        $search = trim(
            (string) $request->query('q', '')
        );

        $category = strtoupper(
            trim((string) $request->query('kategori', ''))
        );

        $view = $request->query('view') === 'arsip'
            ? 'arsip'
            : 'manual';

        $pembiayaan = strtolower(trim(
            (string) $request->query('pembiayaan', '')
        ));

        if (!in_array($pembiayaan, self::KONSTRUKSI_PEMBIAYAAN, true)) {
            $pembiayaan = '';
        }

        $category = in_array(
            $category,
            self::KONSTRUKSI_MANUAL_KATEGORI,
            true
        ) ? $category : '';

        /*
         * Statistik hanya menghitung tabel manual baru.
         */

        $total = DB::table(
            self::KONSTRUKSI_MANUAL_TABLE
        )->count();

        $nilai = DB::table(
            self::KONSTRUKSI_MANUAL_TABLE
        )->sum('nilai');

        $jumlahLokasi = (int) DB::table(
            self::KONSTRUKSI_MANUAL_TABLE
        )
            ->selectRaw(
                'COUNT(DISTINCT lokasi) AS total'
            )
            ->value('total');

        /*
         * Jumlah arsip historis.
         */

        $archiveExists = Schema::hasTable('kib_f_s');

        $archiveCount = $archiveExists
            ? DB::table('kib_f_s')->count()
            : 0;

        /*
         * Tampilan arsip lama.
         */

        if ($view === 'arsip' && $archiveExists) {

            $query = $this->queryArsipKonstruksiManual();

            if ($search !== '') {

                $like = '%' . $search . '%';

                $query->where(function ($q) use ($like) {
                    $q->where(
                        'b.nama_barang',
                        'ilike',
                        $like
                    )

                        ->orWhere(
                            'l.lokasi',
                            'ilike',
                            $like
                        )

                        ->orWhere(
                            'k.urai',
                            'ilike',
                            $like
                        )

                        ->orWhere(
                            'k.ket',
                            'ilike',
                            $like
                        );
                });
            }

            $items = $query
                ->orderByDesc('k.id')
                ->paginate(20)
                ->withQueryString();
        } elseif ($view === 'arsip') {

            /*
             * Jika tabel arsip belum tersedia,
             * tampilkan paginator kosong.
             */

            $items = DB::table(
                self::KONSTRUKSI_MANUAL_TABLE
            )
                ->whereRaw('1 = 0')
                ->paginate(20)
                ->withQueryString();
        } else {

            /*
             * Daftar manual baru.
             */

            $query = $this->queryKonstruksiManual();

            if ($search !== '') {

                $like = '%' . $search . '%';

                $query->where(function ($q) use ($like) {

                    foreach (
                        [
                            'm.nama_pekerjaan',
                            'm.lokasi',
                            'm.cakupan',
                            'm.uraian_pekerjaan',
                            'm.departemen',
                            'm.divisi',
                        ] as $column
                    ) {

                        $q->orWhere(
                            $column,
                            'ilike',
                            $like
                        );
                    }
                });
            }

            if ($category !== '') {
                $query->where('m.kategori', $category);
            }

            if ($pembiayaan !== '') {
                $query->where('m.asal_pembiayaan', $pembiayaan);
            }

            $items = $query
                ->orderByDesc('m.id')
                ->paginate(20)
                ->withQueryString();
        }

        /*
         * Saran pengisian dari catatan manual yang sudah ada.
         * Tidak berhubungan dengan foreign key Master Data.
         */

        $suggestions = [];

        foreach (
            [
                'lokasi',
                'departemen',
                'divisi',
                'cakupan',
            ] as $column
        ) {

            $suggestions[$column] = DB::table(
                self::KONSTRUKSI_MANUAL_TABLE
            )
                ->whereNotNull($column)
                ->where($column, '<>', '')
                ->distinct()
                ->orderBy($column)
                ->limit(200)
                ->pluck($column);
        }



        /*
|--------------------------------------------------------------------------
| MASTER DATA UNTUK DROPDOWN KONSTRUKSI
|--------------------------------------------------------------------------
| Hanya mengambil pilihan dari database.
| Tidak membuat foreign key atau mengubah tabel Konstruksi.
|--------------------------------------------------------------------------
*/

        $kfLuasAvailable = Schema::hasColumn('kib_konstruksi_manual', 'luas');

        $kfMasterOptions = [

            // MASTER LOKASI
            'lokasi' => DB::table('lokasis')
                ->select('id', 'lokasi', 'alamat')
                ->whereNotNull('lokasi')
                ->orderBy('lokasi')
                ->when(Schema::hasColumn('lokasis', 'status'), fn($query) => $query->where('status', 'aktif'))
                ->get(),

            // MASTER DEPARTEMEN
            'departemen' => $this->kibPilihanDepartemen(true),

            // MASTER DIVISI
            'divisi' => DB::table('divisis')
                ->select('id', 'id_dep', 'nama_div')
                ->whereNotNull('nama_div')
                ->orderBy('nama_div')
                ->when(Schema::hasColumn('divisis', 'status'), fn($query) => $query->where('status', 'aktif'))
                ->get(),

        ];


        return view('kib.konstruksi', compact(
            'items',
            'total',
            'nilai',
            'jumlahLokasi',
            'search',
            'category',
            'pembiayaan',
            'view',
            'archiveCount',
            'suggestions',
            'kfMasterOptions',
            'kfLuasAvailable'
        ));
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDASI INPUT KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    private function validasiKonstruksiManual(
        Request $request,
        ?int $konstruksi = null
    ): array {

        $submitted = trim((string) $request->input('asal', ''));
        $normal = strtolower($submitted);

        $allowed = self::KONSTRUKSI_PEMBIAYAAN;
        $oldValue = null;
        $legacyEmpty = false;

        if ($konstruksi !== null) {
            $row = DB::table(self::KONSTRUKSI_MANUAL_TABLE)
                ->where('id', $konstruksi)
                ->first(['asal_pembiayaan']);

            abort_unless($row, 404);
            $oldValue = trim((string) ($row->asal_pembiayaan ?? ''));
        }

        // Simpan persis nilai lama bila tidak disentuh ketika Edit.
        // Jika user memilih pilihan baru, simpan kode lowercase.
        $unchangedLegacy = $konstruksi !== null &&
            $oldValue === $submitted;
        $asal = $unchangedLegacy
            ? $submitted
            : (in_array($normal, $allowed, true) ? $normal : $submitted);

        if ($konstruksi !== null) {
            $legacyEmpty = $oldValue === '' && $asal === '';
            if ($oldValue !== '' && $unchangedLegacy) {
                $allowed[] = $oldValue;
            }
        }

        $request->merge([
            'kategori' => strtoupper(
                trim((string) $request->input('kategori'))
            ),
            'asal' => $asal,
        ]);

        return $request->validate([

            'nama_barang_manual' => [
                'required',
                'string',
                'max:500',
            ],

            'kategori' => [
                'required',
                Rule::in(
                    self::KONSTRUKSI_MANUAL_KATEGORI
                ),
            ],

            'cakupan' => [
                'required',
                'string',
                'max:500',
            ],

            'lokasi_manual' => [
                'required',
                'string',
                'max:500',
            ],

            'alamat_manual' => [
                'nullable',
                'string',
                'max:500',
            ],

            'departemen_manual' => [
                'nullable',
                'string',
                'max:255',
            ],

            'divisi_manual' => [
                'nullable',
                'string',
                'max:255',
            ],

            'tahun' => [
                'required',
                'integer',
                'between:1900,2100',
            ],

            'luas' => ['nullable', 'numeric', 'min:0'],

            'type' => [
                'nullable',
                Rule::in(['P', 'SP', 'D']),
            ],

            'struktur' => [
                'nullable',
                Rule::in([
                    'BERTINGKAT',
                    'TIDAK BERTINGKAT',
                ]),
            ],

            'materi' => [
                'nullable',
                Rule::in([
                    'BETON',
                    'TIDAK BETON',
                ]),
            ],

            'letak' => [
                'nullable',
                'string',
                'max:500',
            ],

            'status_tanah' => [
                'nullable',
                'string',
                'max:255',
            ],

            'asal' => [
                $legacyEmpty ? 'nullable' : 'required',
                'string',
                'max:255',
                Rule::in($allowed),
            ],

            'status_aset' => [
                'nullable',
                'string',
                'max:255',
            ],

            'nilai' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'urai' => [
                'required',
                'string',
            ],

            'ket' => [
                'nullable',
                'string',
            ],

            /*
             * Foto utama dibatasi 5 MB.
             */

            'foto' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],

            /*
             * Lampiran dapat lebih dari 3 file.
             * Tidak ada aturan max ukuran aplikasi.
             */

            'dokumens' => [
                'nullable',
                'array',
            ],

            'dokumens.*' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
            ],

            'hapus_dokumen_ids' => [
                'nullable',
                'array',
            ],

            'hapus_dokumen_ids.*' => [
                'integer',
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PEMETAAN INPUT FORM KE TABEL MANUAL
    |--------------------------------------------------------------------------
    */

    private function konstruksiManualFields(
        array $data
    ): array {

        $fields = [
            'nama_pekerjaan' =>
            trim($data['nama_barang_manual']),

            'kategori' =>
            $data['kategori'],

            'cakupan' =>
            trim($data['cakupan']),

            'lokasi' =>
            trim($data['lokasi_manual']),

            'alamat' =>
            $data['alamat_manual'] ?? null,

            'departemen' =>
            $this->kibNamaDepartemenInputManual($data['departemen_manual'] ?? null, 'departemen_manual'),

            'divisi' =>
            $data['divisi_manual'] ?? null,

            'tahun' =>
            (int) $data['tahun'],

            'jenis_bangunan' =>
            $data['type'] ?? null,

            'bertingkat' =>
            $data['struktur'] ?? null,

            'material' =>
            $data['materi'] ?? null,

            'letak' =>
            $data['letak'] ?? null,

            'status_tanah' =>
            $data['status_tanah'] ?? null,

            'asal_pembiayaan' =>
            $data['asal'] ?? null,

            'status_aset' =>
            $data['status_aset'] ?? null,

            'nilai' =>
            $data['nilai'],

            'uraian_pekerjaan' =>
            $data['urai'],

            'keterangan' =>
            $data['ket'] ?? null,

            'updated_at' =>
            now(),
        ];

        if (Schema::hasColumn(self::KONSTRUKSI_MANUAL_TABLE, 'luas')) {
            $fields['luas'] = $data['luas'] ?? null;
        }

        return $fields;
    }


    /*
    |--------------------------------------------------------------------------
    | SIMPAN BANYAK LAMPIRAN
    |--------------------------------------------------------------------------
    */

    private function simpanLampiranKonstruksiManual(
        Request $request,
        int $id,
        array &$added
    ): void {

        foreach (
            $request->file('dokumens', []) as $file
        ) {

            $path = $file->store(
                self::KONSTRUKSI_MANUAL_PATH .
                    $id .
                    '/dokumen',
                'local'
            );

            if (!$path) {
                throw new \RuntimeException(
                    'Gagal menyimpan salah satu dokumen.'
                );
            }

            $added[] = $path;

            DB::table(
                self::KONSTRUKSI_MANUAL_DOCS
            )->insert([

                'konstruksi_id' => $id,

                'nama_asli' => mb_substr(
                    basename(
                        $file->getClientOriginalName()
                    ),
                    0,
                    255
                ),

                'path' => $path,

                'mime' =>
                $file->getMimeType(),

                'ukuran' =>
                $file->getSize(),

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT RESPONS DETAIL
    |--------------------------------------------------------------------------
    */

    private function konstruksiManualJsonData(
        object $row
    ): array {

        $data = (array) $row;
        // Nama Departemen untuk pengguna, tanpa mengganti nilai warisan DB.
        $data['nama_departemen'] = $this->kibNamaDepartemenUntukLaporan($row->departemen ?? null);
        $data['nama_divisi'] = $row->divisi ?? null;
        $data['kode_struktur'] = '-';
        if (Schema::hasColumn('lokasis', 'kode_struktur')) {
            $data['kode_struktur'] = trim((string) (DB::table('lokasis')
                ->where('lokasi', $row->lokasi ?? '')
                ->value('kode_struktur') ?? '')) ?: '-';
        }

        $id = (int) $row->id;

        $data['foto_url'] = (
            $row->foto_path &&
            Storage::disk('local')->exists(
                $row->foto_path
            )
        )
            ? route(
                'kib.konstruksi.foto',
                ['konstruksi' => $id]
            )
            : null;

        $data['dokumens'] = DB::table(
            self::KONSTRUKSI_MANUAL_DOCS
        )

            ->where('konstruksi_id', $id)

            ->orderBy('id')

            ->get()

            ->map(fn($doc) => [

                'id' => (int) $doc->id,

                'nama' =>
                $doc->nama_asli,

                'ukuran' =>
                (int) $doc->ukuran,

                'url' => route(
                    'kib.konstruksi.dokumen',
                    [
                        'konstruksi' => $id,
                        'dokumen' => $doc->id,
                    ]
                ),
            ])

            ->all();

        return $data;
    }


    /*
    |--------------------------------------------------------------------------
    | DETAIL KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    public function showKonstruksiManual(
        int $konstruksi
    ) {

        $row = $this->queryKonstruksiManual()
            ->where('m.id', $konstruksi)
            ->first();

        abort_unless($row, 404);

        return response()->json([
            'success' => true,
            'data' => $this->konstruksiManualJsonData($row),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TAMBAH KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    public function storeKonstruksiManual(
        Request $request
    ) {

        $data = $this->validasiKonstruksiManual(
            $request
        );

        $added = [];

        try {

            $id = DB::transaction(
                function () use (
                    $request,
                    $data,
                    &$added
                ) {

                    $record = $this->konstruksiManualFields(
                        $data
                    );

                    $record['created_at'] = now();

                    $record['created_by'] = Auth::id();

                    $id = (int) DB::table(
                        self::KONSTRUKSI_MANUAL_TABLE
                    )->insertGetId($record);

                    /*
                     * Simpan foto utama.
                     */

                    if ($request->hasFile('foto')) {

                        $path = $request
                            ->file('foto')
                            ->store(
                                self::KONSTRUKSI_MANUAL_PATH .
                                    $id .
                                    '/foto',
                                'local'
                            );

                        if (!$path) {
                            throw new \RuntimeException(
                                'Gagal menyimpan foto.'
                            );
                        }

                        $added[] = $path;

                        DB::table(
                            self::KONSTRUKSI_MANUAL_TABLE
                        )
                            ->where('id', $id)
                            ->update([
                                'foto_path' => $path,
                            ]);
                    }

                    /*
                     * Simpan semua lampiran.
                     */

                    $this->simpanLampiranKonstruksiManual(
                        $request,
                        $id,
                        $added
                    );

                    return $id;
                }
            );
        } catch (\Throwable $e) {

            Storage::disk('local')->delete($added);

            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' =>
            'Catatan Konstruksi berhasil ditambahkan.',
            'id' => $id,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | EDIT KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    public function updateKonstruksiManual(
        Request $request,
        int $konstruksi
    ) {

        $data = $this->validasiKonstruksiManual(
            $request,
            $konstruksi
        );

        $added = [];

        $deleteAfter = [];

        try {

            DB::transaction(
                function () use (
                    $request,
                    $data,
                    $konstruksi,
                    &$added,
                    &$deleteAfter
                ) {

                    $old = DB::table(
                        self::KONSTRUKSI_MANUAL_TABLE
                    )
                        ->where('id', $konstruksi)
                        ->lockForUpdate()
                        ->first();

                    abort_unless($old, 404);

                    $record = $this->konstruksiManualFields(
                        $data
                    );

                    /*
                     * Ganti foto bila pengguna
                     * mengunggah foto baru.
                     */

                    if (trim((string)($record['lokasi'] ?? '')) !== trim((string)$old->lokasi)) $this->pastikanTanpaRelasiManual('konstruksi', $konstruksi);

                    if ($request->hasFile('foto')) {

                        $path = $request
                            ->file('foto')
                            ->store(
                                self::KONSTRUKSI_MANUAL_PATH .
                                    $konstruksi .
                                    '/foto',
                                'local'
                            );

                        if (!$path) {
                            throw new \RuntimeException(
                                'Gagal menyimpan foto.'
                            );
                        }

                        $added[] = $path;

                        $record['foto_path'] = $path;

                        if ($old->foto_path) {
                            $deleteAfter[] = $old->foto_path;
                        }
                    }

                    DB::table(
                        self::KONSTRUKSI_MANUAL_TABLE
                    )
                        ->where('id', $konstruksi)
                        ->update($record);

                    /*
                     * Hapus lampiran terpilih.
                     */

                    $ids = array_unique(
                        array_map(
                            'intval',
                            $data['hapus_dokumen_ids'] ?? []
                        )
                    );

                    if ($ids) {

                        $docs = DB::table(
                            self::KONSTRUKSI_MANUAL_DOCS
                        )
                            ->where(
                                'konstruksi_id',
                                $konstruksi
                            )
                            ->whereIn('id', $ids)
                            ->get();

                        foreach ($docs as $doc) {
                            $deleteAfter[] = $doc->path;
                        }

                        DB::table(
                            self::KONSTRUKSI_MANUAL_DOCS
                        )
                            ->where(
                                'konstruksi_id',
                                $konstruksi
                            )
                            ->whereIn('id', $ids)
                            ->delete();
                    }

                    /*
                     * Tambah lampiran baru.
                     */

                    $this->simpanLampiranKonstruksiManual(
                        $request,
                        $konstruksi,
                        $added
                    );
                }
            );
        } catch (\Throwable $e) {

            Storage::disk('local')->delete($added);

            throw $e;
        }

        /*
         * Hapus file lama setelah transaksi
         * database berhasil commit.
         */

        if ($deleteAfter) {
            Storage::disk('local')->delete(
                $deleteAfter
            );
        }

        return response()->json([
            'success' => true,
            'message' =>
            'Catatan Konstruksi berhasil diperbarui.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | HAPUS KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    public function destroyKonstruksiManual(
        int $konstruksi
    ) {

        $files = [];

        DB::transaction(
            function () use (
                $konstruksi,
                &$files
            ) {

                $row = DB::table(
                    self::KONSTRUKSI_MANUAL_TABLE
                )
                    ->where('id', $konstruksi)
                    ->lockForUpdate()
                    ->first();

                abort_unless($row, 404);
                $this->pastikanTanpaRelasiManual('konstruksi', $konstruksi);

                if ($row->foto_path) {
                    $files[] = $row->foto_path;
                }

                $docs = DB::table(
                    self::KONSTRUKSI_MANUAL_DOCS
                )
                    ->where(
                        'konstruksi_id',
                        $konstruksi
                    )
                    ->get();

                foreach ($docs as $doc) {
                    $files[] = $doc->path;
                }

                /*
                 * Foreign key cascade menghapus
                 * metadata dokumen baru.
                 */

                DB::table(
                    self::KONSTRUKSI_MANUAL_TABLE
                )
                    ->where('id', $konstruksi)
                    ->delete();
            }
        );

        if ($files) {
            Storage::disk('local')->delete($files);
        }

        return response()->json([
            'success' => true,
            'message' =>
            'Catatan Konstruksi berhasil dihapus.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN FOTO KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    public function fotoKonstruksiManual(
        int $konstruksi
    ) {

        $row = DB::table(
            self::KONSTRUKSI_MANUAL_TABLE
        )
            ->where('id', $konstruksi)
            ->first();

        abort_unless(
            $row && $row->foto_path,
            404
        );

        $prefix = self::KONSTRUKSI_MANUAL_PATH .
            $konstruksi .
            '/foto/';

        abort_unless(
            str_starts_with(
                $row->foto_path,
                $prefix
            ),
            404
        );

        abort_unless(
            Storage::disk('local')->exists(
                $row->foto_path
            ),
            404
        );

        return response()->file(
            Storage::disk('local')->path(
                $row->foto_path
            ),
            [
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PREVIEW / DOWNLOAD DOKUMEN
    |--------------------------------------------------------------------------
    */

    public function dokumenKonstruksiManual(
        int $konstruksi,
        int $dokumen
    ) {

        $doc = DB::table(
            self::KONSTRUKSI_MANUAL_DOCS
        )
            ->where(
                'konstruksi_id',
                $konstruksi
            )
            ->where('id', $dokumen)
            ->first();

        abort_unless($doc, 404);

        $prefix = self::KONSTRUKSI_MANUAL_PATH .
            $konstruksi .
            '/dokumen/';

        abort_unless(
            str_starts_with(
                $doc->path,
                $prefix
            ),
            404
        );

        abort_unless(
            Storage::disk('local')->exists(
                $doc->path
            ),
            404
        );

        $path = Storage::disk('local')->path(
            $doc->path
        );

        if (request()->boolean('download')) {

            return response()->download(
                $path,
                basename($doc->nama_asli)
            );
        }

        return response()->file(
            $path,
            [
                'Content-Type' =>
                $doc->mime
                    ?: 'application/octet-stream',

                'X-Content-Type-Options' =>
                'nosniff',
            ]
        );
    }


    /*
    |--------------------------------------------------------------------------
    | K.I.R — KARTU INVENTARIS RUANGAN
    |--------------------------------------------------------------------------
    |
    | Semua fungsi KIR ditangani KIBController.
    |
    | Database:
    | - kirs
    | - nilai_aktivas
    | - lokasis
    | - departemens
    | - divisis
    | - barangs
    | - bahans
    | - ruangans
    | - aktivas
    |
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | 01. KATEGORI NILAI ASET KIR
    |--------------------------------------------------------------------------
    */

    private function kirCategory(
        KibNotificationService $service
    ): ?int {
        return $service->categoryId('kir');
    }

    /*
    |--------------------------------------------------------------------------
    | 02. QUERY UTAMA INVENTARIS KIR
    |--------------------------------------------------------------------------
    */

    private function kirQuery()
    {
        return DB::table('kirs as k')

            ->leftJoin(
                'barangs as b',
                'b.id',
                '=',
                'k.id_barang'
            )

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'k.id_lokasi'
            )

            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'k.id_departemen'
            )

            ->leftJoin(
                'divisis as v',
                'v.id',
                '=',
                'k.id_div'
            )

            ->select([
                'k.*',
                'b.nama_barang',
                'b.kode_barang',
                'l.lokasi as nama_lokasi',
                'l.alamat',
                'd.kode_dep as departemen',
                'd.nama_dep as kode_dep',
                'v.nama_div as divisi',
                'v.kode_div',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 03. MASTER BAHAN
    |--------------------------------------------------------------------------
    */

    private function kirMaterials(): array
    {
        return DB::table('bahans')
            ->when(Schema::hasColumn('bahans', 'status'), fn($query) => $query->where('status', 'aktif'))
            ->pluck('nama', 'id')
            ->all();
    }

    /*
    |--------------------------------------------------------------------------
    | 04. LOKASI FILE FOTO KIR
    |--------------------------------------------------------------------------
    |
    | Mendukung:
    | - Foto baru Laravel Storage
    | - Foto historis web lama
    |
    */

    private function kirPhotoPath(
        ?string $name
    ): ?string {
        $name = trim((string) $name);

        if ($name === '') {
            return null;
        }

        // File baru.
        if (
            str_starts_with(
                $name,
                'kir/foto/'
            )
        ) {
            return Storage::disk('local')
                ->exists($name)

                ? Storage::disk('local')
                ->path($name)

                : null;
        }

        // File historis.
        // basename() mencegah traversal direktori.
        $legacy = public_path(
            'assets/img/kir/' . basename($name)
        );

        return is_file($legacy)
            ? $legacy
            : null;
    }

    /*
    |--------------------------------------------------------------------------
    | 05. SERIALISASI DATA KIR
    |--------------------------------------------------------------------------
    */

    private function kirResource(
        object $row,
        array $materials
    ): array {
        $data = (array) $row;
        $data['departemen'] = $this->kibNamaDepartemenUntukLaporan(
            $row->departemen ?? null,
            $row->id_departemen ?? null
        );

        $raw = trim(
            (string) ($row->bahan ?? '')
        );

        $data['nama_bahan'] = ctype_digit($raw)
            ? (
                $materials[(int) $raw]
                ?? $raw
            )

            : (
                $raw !== ''
                ? $raw
                : '—'
            );

        $data['foto_url'] = $this->kirPhotoPath(
            $row->img ?? null
        )
            ? route(
                'kib.kir.foto',
                [
                    'kir' => $row->id
                ]
            )
            : null;

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | 06. HALAMAN UTAMA KIR
    |--------------------------------------------------------------------------
    */

    public function dataKir(
        KibNotificationService $service
    ) {
        $cat = $this->kirCategory(
            $service
        );

        /*
        |--------------------------------------------------------------------------
        | JUMLAH INVENTARIS PER LOKASI
        |--------------------------------------------------------------------------
        */

        $itemCounts = DB::table('kirs')

            ->select('id_lokasi')

            ->selectRaw(
                'COUNT(*) AS jumlah'
            )
            ->selectRaw('MAX(id) AS terbaru_id')

            // Dalam satu lokasi dapat ada beberapa pemilik barang.
            // Karena itu status lokasi bukan otomatis satu pemilik.
            ->selectRaw("CASE
                WHEN COUNT(DISTINCT COALESCE(NULLIF(BTRIM(status_kepemilikan), ''), '__belum__')) > 1
                    THEN 'campuran'
                ELSE COALESCE(MAX(NULLIF(BTRIM(status_kepemilikan), '')), '')
                END AS status_kepemilikan_ringkas")

            ->groupBy('id_lokasi')

            ->get()

            ->keyBy('id_lokasi');

        /*
        |--------------------------------------------------------------------------
        | NILAI ASET PER LOKASI
        |--------------------------------------------------------------------------
        |
        | Nilai diambil dari nilai_aktivas,
        | bukan dijumlahkan dari kirs.
        |
        */

        $valueCounts = $cat === null

            ? collect()

            : DB::table('nilai_aktivas')

            ->where(
                'cat',
                $cat
            )

            ->whereNotNull(
                'id_lokasi'
            )

            ->select('id_lokasi')

            ->selectRaw(
                'COALESCE(SUM(nilai), 0) AS total'
            )

            ->groupBy('id_lokasi')

            ->get()

            ->keyBy('id_lokasi');

        /*
        |--------------------------------------------------------------------------
        | GABUNGKAN LOKASI INVENTARIS DAN NILAI
        |--------------------------------------------------------------------------
        */

        $ids = $itemCounts->keys()

            ->merge(
                $valueCounts->keys()
            )

            ->unique()

            ->filter(
                fn($id) => (int) $id > 0
            )

            ->values()

            ->all();

        /*
        |--------------------------------------------------------------------------
        | DAFTAR LOKASI
        |--------------------------------------------------------------------------
        */

        $lokasis = DB::table('lokasis')

            ->whereIn(
                'id',
                $ids
            )

            ->orderBy('lokasi')

            ->get()

            ->map(
                function ($lokasi) use (
                    $itemCounts,
                    $valueCounts
                ) {
                    $lokasi->jumlah = (int) (
                        $itemCounts
                        ->get($lokasi->id)
                        ->jumlah
                        ?? 0
                    );
                    $lokasi->terbaru_id = (int) (
                        $itemCounts->get($lokasi->id)->terbaru_id ?? 0
                    );

                    $lokasi->status_kepemilikan_ringkas = (string) (
                        $itemCounts
                        ->get($lokasi->id)
                        ->status_kepemilikan_ringkas
                        ?? ''
                    );

                    $lokasi->nilai = (int) (
                        $valueCounts
                        ->get($lokasi->id)
                        ->total
                        ?? 0
                    );

                    return $lokasi;
                }
            )
            // Lokasi dengan inventaris baru berada di urutan paling atas.
            ->sortByDesc('terbaru_id')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | STATISTIK DASHBOARD KIR
        |--------------------------------------------------------------------------
        */

        $stats = [

            'jumlah' => (int) DB::table('kirs')
                ->count(),

            'ruangan' => (int) DB::table('kirs')

                ->selectRaw(
                    'COUNT(
                        DISTINCT (
                            id_lokasi,
                            id_departemen,
                            id_div,
                            gedung,
                            ruangan
                        )
                    ) AS total'
                )

                ->value('total'),

            'nilai' => $cat === null
                ? 0
                : (int) DB::table('nilai_aktivas')

                    ->where(
                        'cat',
                        $cat
                    )

                    ->sum('nilai'),

            'terakhir' => DB::table('kirs')

                ->selectRaw(
                    'MAX(
                        COALESCE(
                            updated_at,
                            created_at
                        )
                    ) AS terbaru'
                )

                ->value('terbaru'),

            'pending' => $cat === null
                ? 0
                : (int) DB::table('nilai_aktivas')

                    ->where(
                        'cat',
                        $cat
                    )

                    ->where(
                        'stat',
                        0
                    )

                    ->where(
                        'jenisn',
                        1
                    )

                    ->count(),
        ];

        /*
        |--------------------------------------------------------------------------
        | MASTER DATA FORM KIR
        |--------------------------------------------------------------------------
        */

        $semuaLokasis = DB::table('lokasis')

            ->select(
                'id',
                'lokasi',
                'alamat'
            )

            ->orderBy('lokasi')

            ->when(Schema::hasColumn('lokasis', 'status'), fn($query) => $query->where('status', 'aktif'))
            ->get();

        $barangs = DB::table('barangs')

            ->select(
                'id',
                'nama_barang',
                'kode_barang'
            )

            ->orderBy('nama_barang')

            ->when(Schema::hasColumn('barangs', 'status'), fn($query) => $query->where('status', 'aktif'))
            ->get();

        $bahans = DB::table('bahans')

            ->select(
                'id',
                'nama'
            )

            ->orderBy('nama')

            ->when(Schema::hasColumn('bahans', 'status'), fn($query) => $query->where('status', 'aktif'))
            ->get();

        $departemens = $this->kibPilihanDepartemen(true);

        $divisis = DB::table('divisis')

            ->select(
                'id',
                'id_dep',
                'nama_div'
            )

            ->orderBy('nama_div')

            ->when(Schema::hasColumn('divisis', 'status'), fn($query) => $query->where('status', 'aktif'))
            ->get();

        $ruangans = DB::table('ruangans')

            ->select('nama_ruang')

            ->orderBy('nama_ruang')

            ->when(Schema::hasColumn('ruangans', 'status'), fn($query) => $query->where('status', 'aktif'))
            ->get();

        $gedungs = DB::table('kirs')

            ->whereNotNull('gedung')

            ->distinct()

            ->orderBy('gedung')

            ->pluck('gedung');

        /*
        |--------------------------------------------------------------------------
        | RETURN VIEW KIR
        |--------------------------------------------------------------------------
        */

        return view(
            'kib.kir',

            compact(
                'lokasis',
                'semuaLokasis',
                'stats',
                'barangs',
                'bahans',
                'departemens',
                'divisis',
                'ruangans',
                'gedungs'
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 07. DETAIL STRUKTUR LOKASI
    |--------------------------------------------------------------------------
    |
    | Mengelompokkan:
    | Lokasi → Departemen → Divisi → Gedung → Ruangan.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | EXPORT K.I.R BERDASARKAN LOKASI — SEMUA RUANGAN
    |--------------------------------------------------------------------------
    | Satu lokasi = satu berkas XLSX yang dibuat browser.
    | Query langsung seluruh kirs untuk lokasi terpilih,
    | bukan tabel hasil pagination atau ruangan yang sedang aktif.
    | Tidak mengubah data, voucher, status, atau lampiran.
    */
    public function exportKirLokasi(int $lokasi)
    {
        $lokasiRow = DB::table('lokasis')
            ->select('id', 'lokasi', 'alamat')
            ->where('id', $lokasi)
            ->first();

        abort_unless($lokasiRow !== null, 404);

        $rows = $this->kirQuery()
            ->where('k.id_lokasi', $lokasi)
            ->orderBy('d.kode_dep')
            ->orderBy('v.nama_div')
            ->orderBy('k.gedung')
            ->orderBy('k.ruangan')
            ->orderBy('b.nama_barang')
            ->orderBy('k.id')
            ->get();

        $materials = $this->kirMaterials();

        return response()->json([
            'success' => true,
            'lokasi' => [
                'id' => (int) $lokasiRow->id,
                'nama' => (string) $lokasiRow->lokasi,
                'alamat' => (string) ($lokasiRow->alamat ?? ''),
            ],
            'jumlah_barang' => $rows->count(),
            'total_unit' => (int) $rows->sum(
                fn($row) => (int) ($row->jumlah ?? 0)
            ),
            // Penandatangan hanya SDM aktif dari master (satu sumber data).
            'sdm' => $this->sdmAktifKibB()->values()->all(),
            'data' => $this->nilaiLaporanKib($rows->map(fn($row) => $this->kirResource($row, $materials))->all(), 'kir', 'id', 'nilai'),
        ]);
    }

    public function detailKirLokasi(
        int $lokasi
    ) {
        abort_unless(
            DB::table('lokasis')
                ->where('id', $lokasi)
                ->exists(),

            404
        );

        $rows = $this->kirQuery()

            ->where(
                'k.id_lokasi',
                $lokasi
            )

            ->orderBy(
                'd.kode_dep'
            )

            ->orderBy(
                'v.nama_div'
            )

            ->orderBy(
                'k.gedung'
            )

            ->orderBy(
                'k.ruangan'
            )

            ->get();

        /*
        |--------------------------------------------------------------------------
        | PENGELOMPOKAN UNIT
        |--------------------------------------------------------------------------
        */

        $groups = $rows

            ->groupBy(
                fn($row) => json_encode([
                    $row->id_departemen,
                    $row->id_div,
                    $row->gedung,
                    $row->ruangan,
                ])
            )

            ->map(
                function ($group) {
                    $item = $group->first();

                    return [

                        'lokasi' => (int) $item->id_lokasi,

                        'dep' => (int) $item->id_departemen,

                        'div' => (int) $item->id_div,

                        'departemen' => $this->kibNamaDepartemenUntukLaporan(
                            $item->departemen ?? null,
                            $item->id_departemen ?? null
                        ),

                        'divisi' => trim(
                            (string) $item->divisi
                        ),

                        'gedung' => trim(
                            (string) $item->gedung
                        ),

                        'ruangan' => trim(
                            (string) $item->ruangan
                        ),

                        'jumlah' => $group->count(),
                    ];
                }
            )

            ->values();

        return response()->json([
            'success' => true,
            'data' => $groups,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 08. DETAIL INVENTARIS PER RUANGAN
    |--------------------------------------------------------------------------
    */

    public function detailKirRuangan(
        Request $request
    ) {
        $data = $request->validate([

            'lokasi' => [
                'required',
                'integer',
                Rule::exists('lokasis', 'id'),
            ],

            'dep' => [
                'required',
                'integer',
            ],

            'div' => [
                'required',
                'integer',
            ],

            'gedung' => [
                'required',
                'string',
                'max:255',
            ],

            'ruangan' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $rows = $this->kirQuery()

            ->where(
                'k.id_lokasi',
                $data['lokasi']
            )

            ->where(
                'k.id_departemen',
                $data['dep']
            )

            ->where(
                'k.id_div',
                $data['div']
            )

            ->where(
                'k.gedung',
                $data['gedung']
            )

            ->where(
                'k.ruangan',
                $data['ruangan']
            )

            ->orderBy('k.id')

            ->get();

        $materials = $this->kirMaterials();

        return response()->json([

            'success' => true,

            'data' => $this->nilaiLaporanKib($rows->map(fn($row) => $this->kirResource($row, $materials))->all(), 'kir', 'id', 'nilai'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 09. RINCIAN NILAI KIR PER LOKASI
    |--------------------------------------------------------------------------
    */

    public function nilaiKirLokasi(
        int $lokasi,
        KibNotificationService $service
    ) {
        abort_unless(
            DB::table('lokasis')
                ->where('id', $lokasi)
                ->exists(),

            404
        );

        $cat = $this->kirCategory(
            $service
        );

        $rows = $cat === null

            ? collect()

            : DB::table('nilai_aktivas as n')

            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )

            ->where(
                'n.cat',
                $cat
            )

            ->where(
                'n.id_lokasi',
                $lokasi
            )

            ->select([
                'n.id',
                'n.no_voucher',
                'n.tgl_voucher',
                'n.tahun',
                'n.nilai',
                'n.urai',
                'n.jenisn',
                'a.kode',
                'a.aktiva',
            ])

            ->orderByDesc(
                'n.tgl_voucher'
            )

            ->orderByDesc(
                'n.id'
            )

            ->get();

        return response()->json([

            'success' => true,

            'total' => $rows->sum('nilai'),

            'data' => $rows,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 10. DETAIL SATU INVENTARIS KIR
    |--------------------------------------------------------------------------
    */

    public function showKir(
        int $kir
    ) {
        $row = $this->kirQuery()

            ->where(
                'k.id',
                $kir
            )

            ->first();

        abort_unless(
            $row,
            404,
            'Inventaris KIR tidak ditemukan.'
        );

        return response()->json([

            'success' => true,

            'data' => $this->kirResource(
                $row,
                $this->kirMaterials()
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 11. VALIDASI TAMBAH DAN EDIT KIR
    |--------------------------------------------------------------------------
    */

    private function kirValidate(
        Request $request,
        bool $creating
    ): array {
        $rules = [

            'id_barang' => [
                'required',
                'integer',
                Rule::exists('barangs', 'id'),
            ],

            'merk' => [
                'nullable',
                'string',
                'max:255',
            ],

            'bahan' => [
                'nullable',
                'string',
                'max:255',
            ],

            'jumlah' => [
                'required',
                'integer',
                'min:0',
            ],

            'satuan' => [
                'required',
                'string',
                'max:255',
            ],

            'status_kepemilikan' => [
                $creating ? 'required' : 'nullable',
                'string',
                Rule::in(['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta']),
            ],

            'baik' => [
                'required',
                'integer',
                'min:0',
            ],

            'ringan' => [
                'required',
                'integer',
                'min:0',
            ],

            'berat' => [
                'required',
                'integer',
                'min:0',
            ],

            'ket' => [
                'nullable',
                'string',
                'max:10000',
            ],

            'foto' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | FIELD KHUSUS TAMBAH
        |--------------------------------------------------------------------------
        */

        if ($creating) {
            $rules += [

                'id_lokasi' => [
                    'required',
                    'integer',
                    Rule::exists('lokasis', 'id'),
                ],

                'id_departemen' => [
                    'required',
                    'integer',
                    Rule::exists('departemens', 'id'),
                ],

                'id_div' => [
                    'required',
                    'integer',
                    Rule::exists('divisis', 'id'),
                ],

                'gedung' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'ruangan' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'id_nilai_aktiva' => [
                    'nullable',
                    'integer',
                    Rule::exists(
                        'nilai_aktivas',
                        'id'
                    ),
                ],
            ];
        }

        $data = $request->validate(
            $rules
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDASI KESEIMBANGAN KONDISI BARANG
        |--------------------------------------------------------------------------
        */

        $jumlah = (int) $data['jumlah'];

        $totalKondisi =
            (int) $data['baik']
            + (int) $data['ringan']
            + (int) $data['berat'];

        if ($jumlah !== $totalKondisi) {
            throw ValidationException::withMessages([

                'jumlah' =>
                'Jumlah harus sama dengan '
                    . 'Baik + Rusak Ringan + Rusak Berat.',
            ]);
        }

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | 12. FIELD INVENTARIS YANG BOLEH DISIMPAN
    |--------------------------------------------------------------------------
    */

    private function kirFields(
        array $data
    ): array {
        $fields = [

            'id_barang' => (int) $data['id_barang'],

            'merk' => $data['merk'] ?? '',

            'bahan' => $data['bahan'] ?? '',

            'jumlah' => (int) $data['jumlah'],

            'satuan' => $data['satuan'],

            'baik' => (int) $data['baik'],

            'ringan' => (int) $data['ringan'],

            'berat' => (int) $data['berat'],

            'ket' => $data['ket'] ?? '',

            'updated_at' => now(),
        ];

        // Edit arsip historis tanpa memilih status baru tidak menghapus
        // nilai kepemilikan sebelumnya. Tambah wajib memilih satu status.
        if (!empty($data['status_kepemilikan'])) {
            $fields['status_kepemilikan'] = $data['status_kepemilikan'];
        }

        return $fields;
    }

    /*
    |--------------------------------------------------------------------------
    | 13. PENGAMANAN OPERASI TULIS
    |--------------------------------------------------------------------------
    */

    private function kirAuth(): int
    {
        abort_unless(
            Auth::check(),
            403,
            'Sesi login tidak valid.'
        );

        return (int) Auth::id();
    }

    /*
    |--------------------------------------------------------------------------
    | 14. TAMBAH DATA KIR
    |--------------------------------------------------------------------------
    */

    public function storeKir(
        Request $request,
        KibNotificationService $service
    ) {
        $user = $this->kirAuth();

        $data = $this->kirValidate(
            $request,
            true
        );

        $photo = null;

        try {
            DB::transaction(
                function () use (
                    $request,
                    $service,
                    $data,
                    $user,
                    &$photo
                ) {
                    /*
                    |----------------------------------------------------------
                    | VALIDASI DIVISI DAN DEPARTEMEN
                    |----------------------------------------------------------
                    */

                    $validDivisi = DB::table('divisis')

                        ->where(
                            'id',
                            $data['id_div']
                        )

                        ->where(
                            'id_dep',
                            $data['id_departemen']
                        )

                        ->exists();

                    if (!$validDivisi) {
                        throw ValidationException::withMessages([

                            'id_div' =>
                            'Divisi tidak sesuai '
                                . 'dengan departemen.',
                        ]);
                    }

                    /*
                    |----------------------------------------------------------
                    | VALIDASI VOUCHER PENDING JIKA DIPILIH
                    |----------------------------------------------------------
                    */

                    $voucher = null;

                    if (
                        !empty($data['id_nilai_aktiva'])
                    ) {
                        $cat = $this->kirCategory(
                            $service
                        );

                        if ($cat === null) {
                            throw ValidationException::withMessages([

                                'id_nilai_aktiva' =>
                                'Kategori KIR tidak ditemukan.',
                            ]);
                        }

                        $voucher = DB::table(
                            'nilai_aktivas'
                        )

                            ->where(
                                'id',
                                $data['id_nilai_aktiva']
                            )

                            ->where(
                                'cat',
                                $cat
                            )

                            ->where(
                                'jenisn',
                                1
                            )

                            ->where(
                                'stat',
                                0
                            )

                            ->lockForUpdate()

                            ->first();

                        if (!$voucher) {
                            throw ValidationException::withMessages([

                                'id_nilai_aktiva' =>
                                'Voucher tidak tersedia '
                                    . 'atau sudah diproses.',
                            ]);
                        }

                        /*
                        |------------------------------------------------------
                        | COCOKKAN ORGANISASI DENGAN VOUCHER
                        |------------------------------------------------------
                        */

                        if (
                            (int) $voucher->id_lokasi !==
                            (int) $data['id_lokasi']

                            ||

                            (int) $voucher->dep !==
                            (int) $data['id_departemen']

                            ||

                            (int) $voucher->div !==
                            (int) $data['id_div']
                        ) {
                            throw ValidationException::withMessages([

                                'id_nilai_aktiva' =>
                                'Lokasi, Departemen, '
                                    . 'dan Divisi tidak cocok '
                                    . 'dengan voucher.',
                            ]);
                        }
                    }

                    /*
                    |----------------------------------------------------------
                    | SIAPKAN DATA KIR
                    |----------------------------------------------------------
                    */

                    $record = $this->kirFields(
                        $data
                    ) + [

                        'id_lokasi' =>
                        (int) $data['id_lokasi'],

                        'id_departemen' =>
                        (int) $data['id_departemen'],

                        'id_div' =>
                        (int) $data['id_div'],

                        'gedung' => trim(
                            $data['gedung']
                        ),

                        'ruangan' => trim(
                            $data['ruangan']
                        ),

                        'id_user' => $user,

                        'input' => 1,

                        /*
                        | Skema lama memakai INTEGER
                        | untuk kirs.nilai.
                        | Sumber total uang tetap
                        | nilai_aktivas.nilai (BIGINT).
                        */

                        'nilai' => 0,

                        /*
                        | Foto kosong bila tidak diunggah.
                        | Kompatibel dengan kolom img lama.
                        */

                        'img' => '',

                        'created_at' => now(),
                    ];

                    /*
                    |----------------------------------------------------------
                    | UPLOAD FOTO
                    |----------------------------------------------------------
                    */

                    if (
                        $request->hasFile('foto')
                    ) {
                        $photo = $request
                            ->file('foto')
                            ->store(
                                'kir/foto',
                                'local'
                            );

                        if (!$photo) {
                            throw new \RuntimeException(
                                'Gagal menyimpan foto KIR.'
                            );
                        }

                        $record['img'] = $photo;
                    }

                    /*
                    |----------------------------------------------------------
                    | INSERT INVENTARIS
                    |----------------------------------------------------------
                    */

                    if ($voucher) {
                        if (!empty(app(KibVoucherLinkService::class)->owners([(int)$voucher->id])[$voucher->id]) || (int)$voucher->id > 2147483647) {
                            throw ValidationException::withMessages(['id_nilai_aktiva' => 'Voucher sudah dimiliki atau ID melampaui kapasitas kolom arsip KIR.']);
                        }
                        $record['nilai_v'] = (int)$voucher->id;
                    }
                    DB::table('kirs')->insert($record);

                    /*
                    |----------------------------------------------------------
                    | UPDATE STATUS VOUCHER
                    |----------------------------------------------------------
                    */

                    if ($voucher) {
                        $updated = DB::table(
                            'nilai_aktivas'
                        )

                            ->where(
                                'id',
                                $voucher->id
                            )

                            ->where(
                                'stat',
                                0
                            )

                            ->update([

                                'stat' => 1,

                                'updated_at' => now(),
                            ]);

                        if ($updated !== 1) {
                            throw new \RuntimeException(
                                'Status voucher gagal diperbarui.'
                            );
                        }
                    }
                }
            );
        } catch (\Throwable $exception) {

            if ($photo) {
                Storage::disk('local')
                    ->delete($photo);
            }

            throw $exception;
        }

        return response()->json([

            'success' => true,

            'message' =>
            'Inventaris KIR berhasil ditambahkan.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 15. EDIT DATA KIR
    |--------------------------------------------------------------------------
    */

    public function updateKir(
        Request $request,
        int $kir
    ) {
        $this->kirAuth();

        $data = $this->kirValidate(
            $request,
            false
        );

        $newPhoto = null;
        $oldPhoto = null;

        try {
            DB::transaction(
                function () use (
                    $request,
                    $data,
                    $kir,
                    &$newPhoto,
                    &$oldPhoto
                ) {
                    /*
                    |----------------------------------------------------------
                    | AMBIL DATA LAMA
                    |----------------------------------------------------------
                    */

                    $row = DB::table('kirs')

                        ->where(
                            'id',
                            $kir
                        )

                        ->lockForUpdate()

                        ->first();

                    abort_unless(
                        $row,
                        404,
                        'Inventaris KIR tidak ditemukan.'
                    );

                    /*
                    |----------------------------------------------------------
                    | DATA YANG DIPERBARUI
                    |----------------------------------------------------------
                    */

                    $changes = $this->kirFields(
                        $data
                    );

                    /*
                    |----------------------------------------------------------
                    | GANTI FOTO JIKA ADA
                    |----------------------------------------------------------
                    */

                    if (
                        $request->hasFile('foto')
                    ) {
                        $newPhoto = $request
                            ->file('foto')
                            ->store(
                                'kir/foto',
                                'local'
                            );

                        if (!$newPhoto) {
                            throw new \RuntimeException(
                                'Gagal menyimpan foto KIR.'
                            );
                        }

                        $changes['img'] = $newPhoto;

                        if (
                            str_starts_with(
                                (string) $row->img,
                                'kir/foto/'
                            )
                        ) {
                            $oldPhoto = $row->img;
                        }
                    }

                    /*
                    |----------------------------------------------------------
                    | UPDATE DATA
                    |----------------------------------------------------------
                    */

                    DB::table('kirs')

                        ->where(
                            'id',
                            $kir
                        )

                        ->update(
                            $changes
                        );
                }
            );
        } catch (\Throwable $exception) {

            if ($newPhoto) {
                Storage::disk('local')
                    ->delete($newPhoto);
            }

            throw $exception;
        }

        /*
        |--------------------------------------------------------------------------
        | HAPUS FOTO BARU YANG DIGANTIKAN
        |--------------------------------------------------------------------------
        |
        | File historis web lama tidak dihapus.
        |
        */

        if ($oldPhoto) {
            Storage::disk('local')
                ->delete($oldPhoto);
        }

        return response()->json([

            'success' => true,

            'message' =>
            'Inventaris KIR berhasil diperbarui.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 16. HAPUS SATU INVENTARIS KIR
    |--------------------------------------------------------------------------
    */

    public function destroyKir(
        int $kir
    ) {
        $this->kirAuth();

        $photo = DB::transaction(
            function () use ($kir) {

                $row = DB::table('kirs')

                    ->where(
                        'id',
                        $kir
                    )

                    ->lockForUpdate()

                    ->first();

                abort_unless(
                    $row,
                    404,
                    'Inventaris KIR tidak ditemukan.'
                );

                $this->pastikanTanpaRelasiManual('kir', $kir);
                // Pointer historis tetap dilindungi agar asal voucher tidak hilang.
                if (!empty($row->nilai_v)) throw ValidationException::withMessages(['voucher' => 'KIR memiliki sumber voucher historis; rekonsiliasi dahulu.']);
                DB::table('kirs')

                    ->where(
                        'id',
                        $kir
                    )

                    ->delete();

                /*
                |--------------------------------------------------------------
                | STATUS VOUCHER TIDAK DIUBAH OTOMATIS
                |--------------------------------------------------------------
                */

                return str_starts_with(
                    (string) $row->img,
                    'kir/foto/'
                )
                    ? $row->img
                    : null;
            }
        );

        /*
        |--------------------------------------------------------------------------
        | HAPUS FOTO STORAGE BARU
        |--------------------------------------------------------------------------
        */

        if ($photo) {
            Storage::disk('local')
                ->delete($photo);
        }

        return response()->json([

            'success' => true,

            'message' =>
            'Inventaris KIR berhasil dihapus. '
                . 'Status voucher tidak berubah.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 17. PREVIEW FOTO INVENTARIS KIR
    |--------------------------------------------------------------------------
    */

    public function fileKir(
        int $kir
    ) {
        $row = DB::table('kirs')

            ->where(
                'id',
                $kir
            )

            ->first();

        abort_unless(
            $row,
            404
        );

        /*
        |--------------------------------------------------------------------------
        | CARI FILE
        |--------------------------------------------------------------------------
        */

        $file = $this->kirPhotoPath(
            $row->img ?? null
        );

        abort_unless(
            $file && is_file($file),
            404
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDASI FORMAT
        |--------------------------------------------------------------------------
        */

        $extension = strtolower(
            pathinfo(
                $file,
                PATHINFO_EXTENSION
            )
        );

        abort_unless(
            in_array(
                $extension,
                [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                ],
                true
            ),
            415
        );

        /*
        |--------------------------------------------------------------------------
        | RESPONSE FOTO
        |--------------------------------------------------------------------------
        */

        return response()->file(
            $file,

            [
                'X-Content-Type-Options' =>
                'nosniff',
            ]
        );
    }

    /* ===============================================================
       K.I.B D — GEDUNG / IRIGASI DAN JEMBATAN
       Gedung = gedungs (read-only, ubah lewat K.I.B C)
       Jembatan = kib_d_s (CRUD asli web lama)
       =============================================================== */
    private const JALAN_PEMILIK = ['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta'];

    private function jalanTersedia(string $table): bool
    {
        return Schema::hasTable($table);
    }

    /**
     * Ambil kategori yang BENAR untuk K.I.B D dari tabel golongans.
     * Fallback config dipakai hanya jika nama golongan tidak cocok.
     * Jangan memasukkan semua jenis kategori ke form Jembatan.
     *
     * @return list<int>
     */
    private function jalanKategoriIds(): array
    {
        $aliases = config('kib.modules.jalan.aliases', []);
        $normalize = static function (?string $name): string {
            $clean = preg_replace('/[^\pL\pN]+/u', ' ', (string) $name) ?? '';
            return mb_strtoupper(trim(preg_replace('/\s+/u', ' ', $clean) ?? ''), 'UTF-8');
        };
        $validNames = array_map($normalize, $aliases);
        $matches = [];

        if (Schema::hasTable('golongans')) {
            foreach (DB::table('golongans')->select('id', 'nama')->get() as $golongan) {
                $name = $normalize($golongan->nama);
                if ($name === '') continue;
                if (
                    in_array($name, $validNames, true)
                    || (str_contains($name, 'JALAN') && str_contains($name, 'IRIGASI'))
                    || str_starts_with($name, 'KIB D ')
                ) {
                    $matches[] = (int) $golongan->id;
                }
            }
        }

        if ($matches !== []) {
            return array_values(array_unique($matches));
        }

        $fallback = app(KibNotificationService::class)->categoryId('jalan')
            ?? config('kib.modules.jalan.cat_fallback');
        return $fallback === null ? [] : [(int) $fallback];
    }

    /** Query dasar pending D, konsisten untuk banner, daftar dan validasi voucher. */
    private function jalanPendingBase(): \Illuminate\Database\Query\Builder
    {
        $query = DB::table('nilai_aktivas as n')->where('n.stat', 0);
        $ids = $this->jalanKategoriIds();
        return $ids === [] ? $query->whereRaw('1 = 0') : $query->whereIn('n.cat', $ids);
    }

    /** Rekap per lokasi, diurutkan berdasarkan ID barang terakhir (terbaru nomor 1). */
    private function jalanRekapLokasi(string $table): array
    {
        if (!$this->jalanTersedia($table)) return [];

        $hasStatus = Schema::hasColumn($table, 'status_kepemilikan');
        $rows = DB::table("{$table} as t")
            ->leftJoin('lokasis as l', 'l.id', '=', 't.id_lokasi')
            ->select('t.id', 't.id_lokasi', 'l.lokasi', 'l.alamat')
            ->addSelect($hasStatus ? 't.status_kepemilikan'
                : DB::raw('NULL AS status_kepemilikan'))
            ->orderByDesc('t.id')->get();

        $locations = [];
        foreach ($rows as $row) {
            $key = (int) ($row->id_lokasi ?? 0);
            if (!isset($locations[$key])) {
                $locations[$key] = [
                    'id_lokasi' => $key,
                    'lokasi' => trim((string) ($row->lokasi ?? '')) ?: 'Belum Ada Lokasi',
                    'alamat' => trim((string) ($row->alamat ?? '')) ?: '—',
                    'jumlah' => 0,
                    'terbaru' => (int) $row->id,
                    'statuses' => [],
                ];
            }
            $locations[$key]['jumlah']++;
            $value = trim((string) ($row->status_kepemilikan ?? ''));
            $locations[$key]['statuses'][$value ?: 'belum_diatur'] = true;
        }
        foreach ($locations as &$location) {
            $owners = array_keys($location['statuses']);
            $location['status_kepemilikan'] = count($owners) > 1
                ? 'campuran' : ($owners[0] ?? 'belum_diatur');
            unset($location['statuses']);
        }
        unset($location);
        usort($locations, static fn(array $a, array $b): int => $b['terbaru'] <=> $a['terbaru']);
        return $locations;
    }

    public function jalanIndex()
    {
        $gedungLokasi = $this->jalanRekapLokasi('gedungs');
        $jembatanLokasi = $this->jalanRekapLokasi('kib_d_s');

        $lokasiOptions = DB::table('lokasis')
            ->select('id', 'lokasi', 'alamat')->orderBy('lokasi')->get();
        // Semua data Master dipertahankan untuk Edit arsip; UI hanya
        // menawarkan status aktif saat Tambah baru.
        $barangOptions = DB::table('barangs')
            ->select('id', 'nama_barang', 'kode_barang', 'status')
            ->orderBy('nama_barang')->get();
        $departemenOptions = $this->kibPilihanDepartemen(false);
        $divisiOptions = DB::table('divisis')
            ->select('id', 'nama_div', 'id_dep')->orderBy('nama_div')->get();

        // Total D tidak boleh disamakan dengan total seluruh modul K.I.B.
        $totalPending = (clone $this->jalanPendingBase())->count();
        $totalPendingTambah = (clone $this->jalanPendingBase())
            ->where('n.jenisn', 1)->count();
        $totalPendingSiap = (clone $this->jalanPendingBase())
            ->where('n.jenisn', 1)
            ->whereNotNull('n.id_lokasi')
            ->whereNotNull('n.dep')
            ->whereNotNull('n.div')
            ->count();
        $totalPendingSemuaKategori = DB::table('nilai_aktivas')
            ->where('stat', 0)->count();
        $kategoriPendingD = $this->jalanKategoriIds();

        return view('kib.jalan', compact(
            'gedungLokasi',
            'jembatanLokasi',
            'lokasiOptions',
            'barangOptions',
            'departemenOptions',
            'divisiOptions',
            'totalPending',
            'totalPendingTambah',
            'totalPendingSiap',
            'totalPendingSemuaKategori',
            'kategoriPendingD'
        ) + [
            'totalGedung' => array_sum(array_column($gedungLokasi, 'jumlah')),
            'totalJembatan' => array_sum(array_column($jembatanLokasi, 'jumlah')),
            'archiveReady' => $this->jalanTersedia('kib_d_s'),
        ]);
    }

    /**
     * API khusus K.I.B D. Mengembalikan seluruh kandidat Penambahan Aset D
     * maksimal 3.000 baris; count adalah total sesuai kategori di database.
     * Baris tanpa identitas organisasi tetap tampak agar dapat diperbaiki.
     */
    public function jalanPending()
    {
        $base = $this->jalanPendingBase();
        $total = (clone $base)->count();
        $countTambah = (clone $base)->where('n.jenisn', 1)->count();
        $semua = DB::table('nilai_aktivas')->where('stat', 0)->count();

        $rows = $base
            ->leftJoin('lokasis as l', 'l.id', '=', 'n.id_lokasi')
            ->leftJoin('departemens as d', 'd.id', '=', 'n.dep')
            ->leftJoin('divisis as dv', 'dv.id', '=', 'n.div')
            ->where('n.jenisn', 1)
            ->select(
                'n.id',
                'n.no_voucher',
                'n.tgl_voucher',
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
                'd.kode_dep as departemen',
                'dv.nama_div as divisi'
            )
            ->orderByDesc('n.tgl_voucher')
            ->orderByDesc('n.id')
            ->limit(3000)
            ->get()
            ->map(static function (object $r): array {
                $siap = !empty($r->id_lokasi) && !empty($r->dep) && !empty($r->div);
                return [
                    'id' => (int) $r->id,
                    'no_voucher' => $r->no_voucher ?: '—',
                    'tgl_voucher' => $r->tgl_voucher,
                    'nilai' => $r->nilai,
                    'urai' => $r->urai ?: '—',
                    'tahun' => $r->tahun,
                    'id_lokasi' => $r->id_lokasi === null ? null : (int) $r->id_lokasi,
                    'dep' => $r->dep === null ? null : (int) $r->dep,
                    'div' => $r->div === null ? null : (int) $r->div,
                    'lokasi' => $r->lokasi ?: '—',
                    'alamat' => $r->alamat ?: '—',
                    'departemen' => $r->departemen ?: '—',
                    'divisi' => $r->divisi ?: '—',
                    'jenisn' => (int) $r->jenisn,
                    'stat' => (int) $r->stat,
                    'cat' => $r->cat === null ? null : (int) $r->cat,
                    'siap' => $siap,
                ];
            })->values();

        return response()->json([
            'success' => true,
            'kategori_kib_d' => $this->jalanKategoriIds(),
            'total_pending_kib_d' => $total,
            'total_penambahan_kib_d' => $countTambah,
            'total_pending_semua_kategori' => $semua,
            'count' => $countTambah,
            'shown' => $rows->count(),
            'truncated' => $countTambah > $rows->count(),
            'data' => $rows,
        ]);
    }

    private function jalanLokasiInfo(int $id): object
    {
        if ($id === 0) {
            return (object) ['id' => 0, 'lokasi' => 'Belum Ada Lokasi', 'alamat' => '—'];
        }
        $location = DB::table('lokasis')
            ->where('id', $id)->first(['id', 'lokasi', 'alamat']);
        abort_unless($location, 404, 'Lokasi tidak ditemukan.');
        return $location;
    }

    private function jalanMilikLokasi(
        \Illuminate\Database\Query\Builder $query,
        int $lokasi
    ): \Illuminate\Database\Query\Builder {
        return $lokasi === 0
            ? $query->where(static fn(\Illuminate\Database\Query\Builder $q) => $q->whereNull('t.id_lokasi')->orWhere('t.id_lokasi', 0))
            : $query->where('t.id_lokasi', $lokasi);
    }

    private function jalanDetailGedung(int $lokasi): array
    {
        if (!$this->jalanTersedia('gedungs')) return [];
        $owner = Schema::hasColumn('gedungs', 'status_kepemilikan');
        $query = DB::table('gedungs as t')
            ->leftJoin('barangs as b', 'b.id', '=', 't.id_barang')
            ->leftJoin('lokasis as l', 'l.id', '=', 't.id_lokasi')
            ->leftJoin('nilai_aktivas as n', 'n.id', '=', 't.nilai_aktiva_id')
            ->leftJoin('departemens as d', 'd.id', '=', 't.id_departemen')
            ->leftJoin('divisis as v', 'v.id', '=', 't.id_div')
            ->select(
                't.*',
                'b.nama_barang as master_nama',
                'b.kode_barang as master_kode',
                'l.alamat as alamat_lokasi',
                'n.nilai as nilai_transaksi',
                'd.kode_dep as departemen',
                'v.nama_div as divisi'
            );

        return $this->jalanMilikLokasi($query, $lokasi)
            ->orderByDesc('t.id')->get()->map(static fn(object $r) => [
                'source' => 'gedung',
                'id' => (int) $r->id,
                'id_lokasi' => (int) ($r->id_lokasi ?? 0),
                'nama_barang' => $r->master_nama ?: 'Gedung / Bangunan',
                'kode' => $r->kode ?: $r->master_kode,
                'reg' => $r->reg,
                'kondisi' => $r->kondisi,
                'konstruksi' => $r->konstruksi,
                'materi' => $r->materi,
                'luas_lantai' => $r->luas,
                'letak' => $r->alamat_lokasi,
                'tgl_dok' => $r->tgl_imb,
                'no_dok' => $r->no_imb,
                'luas' => $r->luastanah,
                'status_tanah' => $r->status,
                'kode_tanah' => $r->kode_tanah,
                'asal' => $r->asal,
                'harga' => $r->nilai_transaksi ?? $r->nilai,
                'ket' => $r->ket,
                'status_kepemilikan' => $owner ? ($r->status_kepemilikan ?? null) : null,
                'departemen' => $r->departemen,
                'divisi' => $r->divisi,
                'foto_url' => $r->img ? route('kib.gedung.file', ['gedung' => $r->id, 'jenis' => 'foto']) : null,
                'dokumen_url' => $r->dok ? route('kib.gedung.file', ['gedung' => $r->id, 'jenis' => 'dokumen']) : null,
                'readonly' => true,
            ])->all();
    }

    private function jalanDetailJembatan(int $lokasi): array
    {
        if (!$this->jalanTersedia('kib_d_s')) return [];
        $owner = Schema::hasColumn('kib_d_s', 'status_kepemilikan');
        $query = DB::table('kib_d_s as t')
            ->leftJoin('barangs as b', 'b.id', '=', 't.id_barang')
            ->leftJoin('lokasis as l', 'l.id', '=', 't.id_lokasi')
            ->leftJoin('departemens as d', 'd.id', '=', 't.id_dep')
            ->leftJoin('divisis as v', 'v.id', '=', 't.id_div')
            ->leftJoin('nilai_aktivas as n', 'n.id', '=', 't.nilai_v')
            ->select(
                't.*',
                'b.nama_barang as master_nama',
                'b.kode_barang as master_kode',
                'l.alamat as alamat_lokasi',
                'd.kode_dep as departemen',
                'v.nama_div as divisi',
                'n.nilai as nilai_voucher'
            );

        return $this->jalanMilikLokasi($query, $lokasi)
            ->orderByDesc('t.id')->get()->map(static fn(object $r) => [
                'source' => 'jembatan',
                'id' => (int) $r->id,
                'id_barang' => $r->id_barang,
                'id_lokasi' => $r->id_lokasi,
                'nama_barang' => $r->master_nama ?: 'Jalan / Jembatan',
                'kode' => $r->kode ?: $r->master_kode,
                'reg' => $r->reg,
                'kondisi' => $r->kondisi,
                'konstruksi' => $r->struktur,
                'materi' => $r->materi,
                'luas_lantai' => $r->luas_lantai,
                'letak' => $r->alamat_lokasi,
                'tgl_dok' => $r->tgl_dok,
                'no_dok' => $r->no_dok,
                'luas' => $r->luas,
                'status_tanah' => $r->status,
                'kode_tanah' => $r->kode_tanah,
                'asal' => $r->asal,
                'harga' => $r->nilai_v ? ($r->nilai_voucher ?? $r->harga) : $r->harga,
                'ket' => $r->ket,
                'status_kepemilikan' => $owner ? ($r->status_kepemilikan ?? null) : null,
                'departemen' => $r->departemen,
                'divisi' => $r->divisi,
                'foto_url' => $r->img ? route('kib.jalan.file', [
                    'source' => 'jembatan',
                    'item' => $r->id,
                    'jenis' => 'foto'
                ]) : null,
                'dokumen_url' => $r->dok ? route('kib.jalan.file', [
                    'source' => 'jembatan',
                    'item' => $r->id,
                    'jenis' => 'dokumen'
                ]) : null,
                'readonly' => false,
            ])->all();
    }

    public function jalanDetailLokasi(string $jenis, int $lokasi)
    {
        abort_unless(in_array($jenis, ['gedung', 'jembatan'], true), 404);
        $location = $this->jalanLokasiInfo($lokasi);
        $rows = $jenis === 'gedung'
            ? $this->jalanDetailGedung($lokasi)
            : $this->jalanDetailJembatan($lokasi);
        return response()->json([
            'success' => true,
            'jenis' => $jenis,
            'lokasi' => $location,
            'count' => count($rows),
            'data' => $this->nilaiLaporanKib($rows, $jenis, 'id', 'harga'),
        ]);
    }

    /**
     * Laporan K.I.B D hanya untuk satu tab dan satu lokasi.
     * Gedung/Irigasi dibaca dari K.I.B C; Jembatan dari kib_d_s.
     * Tidak melakukan mutation dan tidak memotong baris dengan pagination.
     */
    public function laporanJalanKibD(string $jenis, int $lokasi): \Illuminate\Http\JsonResponse
    {
        abort_unless(in_array($jenis, ['gedung', 'jembatan'], true), 404);

        // Endpoint Detail menjadi sumber tunggal supaya jumlah dan isi baris identik.
        $payload = $this->jalanDetailLokasi($jenis, $lokasi)->getData(true);
        $items = collect($payload['data'] ?? []);
        $lokasiInfo = $payload['lokasi'] ?? [];

        $identitas = static function ($nilai): string {
            $unik = collect($nilai)->map(static fn($v) => trim((string) ($v ?? '')))
                ->filter()->unique()->values();
            return $unik->count() === 1 ? (string) $unik->first()
                : ($unik->isEmpty() ? '-' : 'BERAGAM');
        };

        // Kode struktur bukan Kode Aktiva; baca hanya bila kolom sungguh ada.
        $kodeStruktur = '-';
        if ($lokasi > 0 && Schema::hasColumn('lokasis', 'kode_struktur')) {
            $kodeStruktur = trim((string) (DB::table('lokasis')
                ->where('id', $lokasi)->value('kode_struktur') ?? '')) ?: '-';
        }
        $ruang = '-';
        if ($lokasi > 0 && Schema::hasColumn('lokasis', 'ruang')) {
            $ruang = trim((string) (DB::table('lokasis')
                ->where('id', $lokasi)->value('ruang') ?? '')) ?: '-';
        }

        return response()->json([
            'success' => true,
            'jenis' => $jenis,
            'cakupan' => 'lokasi',
            'jumlah' => $items->count(),
            'lokasi' => [
                'id' => (int) ($lokasiInfo['id'] ?? $lokasi),
                'nama' => (string) ($lokasiInfo['lokasi'] ?? ''),
                'alamat' => (string) ($lokasiInfo['alamat'] ?? ''),
            ],
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                'departemen' => $identitas($items->pluck('departemen')
                    ->map(fn($value) => $this->kibNamaDepartemenUntukLaporan($value))),
                'divisi' => $identitas($items->pluck('divisi')),
                'ruang' => $ruang,
                'kode_struktur' => $kodeStruktur,
            ],
            'sdm' => $this->sdmAktifKibB(),
            'data' => $this->nilaiLaporanKib($items->values()->all(), $jenis, 'id', 'harga'),
        ]);
    }

    private function jalanValidasi(Request $request, bool $edit = false): array
    {
        return $request->validate([
            'id_nilai_aktiva' => ['nullable', 'integer', Rule::exists('nilai_aktivas', 'id')],
            'id_lokasi' => ['required', 'integer', Rule::exists('lokasis', 'id')],
            'id_departemen' => ['nullable', 'integer', Rule::exists('departemens', 'id')],
            'id_div' => ['nullable', 'integer', Rule::exists('divisis', 'id')],
            'id_barang' => ['required', 'integer', Rule::exists('barangs', 'id')],
            'kode' => ['nullable', 'string', 'max:255'],
            'reg' => ['nullable', 'string', 'max:255'],
            'kondisi' => ['nullable', 'string', 'max:255'],
            'konstruksi' => ['nullable', 'string', 'max:255'],
            'materi' => ['nullable', 'string', 'max:255'],
            'luas_lantai' => ['nullable', 'string', 'max:255'],
            'tgl_dok' => ['nullable', 'date'],
            'no_dok' => ['nullable', 'string', 'max:255'],
            'luas' => ['nullable', 'string', 'max:255'],
            'status_tanah' => ['nullable', 'string', 'max:255'],
            'kode_tanah' => ['nullable', 'string', 'max:255'],
            'asal' => ['nullable', 'string', 'max:255'],
            'harga' => ['nullable', 'integer', 'min:0'],
            'ket' => ['nullable', 'string', 'max:10000'],
            'status_kepemilikan' => ['required', Rule::in(self::JALAN_PEMILIK)],
            'foto' => ['nullable', 'image', 'max:5120'],
            'dokumen' => ['nullable', 'file', 'mimes:pdf', 'max:15360'],
        ]);
    }

    /** Data baru hanya memakai Master Barang aktif; arsip yang sudah ada tetap dapat diedit. */
    private function jalanPastikanBarangAktif(int $barangId, ?int $lama = null): void
    {
        if (!Schema::hasColumn('barangs', 'status') || $lama === $barangId) return;
        $status = DB::table('barangs')->where('id', $barangId)->value('status');
        if ($status !== 'aktif') {
            throw ValidationException::withMessages([
                'id_barang' => 'Pilih Barang yang berstatus Aktif pada Master Data.',
            ]);
        }
    }

    /** Nama field form dipetakan ke kolom asli kib_d_s. */
    private function jalanTulis(array $form): array
    {
        return [
            'id_lokasi' => (int) $form['id_lokasi'],
            'id_dep' => isset($form['id_departemen']) ? (int) $form['id_departemen'] : null,
            'id_div' => isset($form['id_div']) ? (int) $form['id_div'] : null,
            'id_barang' => (int) $form['id_barang'],
            'kode' => $form['kode'] ?? null,
            'reg' => $form['reg'] ?? null,
            'kondisi' => $form['kondisi'] ?? null,
            'struktur' => $form['konstruksi'] ?? null,
            'materi' => $form['materi'] ?? null,
            'luas_lantai' => $form['luas_lantai'] ?? null,
            'tgl_dok' => $form['tgl_dok'] ?? null,
            'no_dok' => $form['no_dok'] ?? null,
            'luas' => $form['luas'] ?? null,
            'status' => $form['status_tanah'] ?? null,
            'kode_tanah' => $form['kode_tanah'] ?? null,
            'asal' => $form['asal'] ?? null,
            'ket' => $form['ket'] ?? null,
            'status_kepemilikan' => $form['status_kepemilikan'],
        ];
    }

    /** Pastikan voucher kategori D, jenis Penambahan Aset, belum diproses dan belum dipakai. */
    private function jalanValidasiVoucher(int $voucherId): object
    {
        $voucher = DB::table('nilai_aktivas')->where('id', $voucherId)
            ->lockForUpdate()->first();
        if (
            !$voucher || !in_array((int)$voucher->cat, $this->jalanKategoriIds(), true)
            || (int)$voucher->jenisn !== 1 || (int)$voucher->stat !== 0
        ) {
            throw ValidationException::withMessages([
                'id_nilai_aktiva' => 'Voucher tidak tersedia atau sudah diproses.',
            ]);
        }
        if (!empty(app(KibVoucherLinkService::class)->owners([$voucherId])[$voucherId])) {
            throw ValidationException::withMessages([
                'id_nilai_aktiva' => 'Voucher sudah terhubung ke inventaris Jembatan.',
            ]);
        }
        if (!$voucher->id_lokasi || !$voucher->dep || !$voucher->div) {
            throw ValidationException::withMessages([
                'id_nilai_aktiva' => 'Data lokasi, departemen, atau divisi pada voucher belum lengkap.',
            ]);
        }
        return $voucher;
    }

    public function jalanSimpan(Request $request)
    {
        abort_unless($this->jalanTersedia('kib_d_s'), 503, 'Tabel Jembatan lama belum tersedia.');
        abort_unless(
            Schema::hasColumn('kib_d_s', 'status_kepemilikan'),
            503,
            'Jalankan migration Status Kepemilikan K.I.B D lebih dulu.'
        );
        $input = $this->jalanValidasi($request);
        $this->jalanPastikanBarangAktif((int)$input['id_barang']);
        $files = [];
        try {
            $id = DB::transaction(function () use ($request, $input, &$files) {
                $data = $this->jalanTulis($input);
                $voucherId = (int) ($input['id_nilai_aktiva'] ?? 0);
                $voucher = $voucherId ? $this->jalanValidasiVoucher($voucherId) : null;
                if ($voucher) {
                    $data['id_lokasi'] = (int) $voucher->id_lokasi;
                    $data['id_dep'] = (int) $voucher->dep;
                    $data['id_div'] = (int) $voucher->div;
                    $data['nilai_v'] = $voucherId;
                    // Harga lama INTEGER. Nilai besar tetap dibaca dari nilai_aktivas.nilai,
                    // tanpa dipotong atau mengubah struktur data arsip.
                    $value = (float) ($voucher->nilai ?? 0);
                    $data['harga'] = $value <= 2147483647 ? (int) $value : null;
                } else {
                    $value = $input['harga'] ?? null;
                    if ($value !== null && (float) $value > 2147483647) {
                        throw ValidationException::withMessages([
                            'harga' => 'Harga data langsung melewati batas INTEGER arsip. Gunakan voucher Nilai Aset.',
                        ]);
                    }
                    $data['harga'] = $value !== null ? (int) round((float) $value) : null;
                    $data['nilai_v'] = null;
                }
                $data['input'] = 1;
                $data['user'] = Auth::id();
                $data['created_at'] = now();
                $data['updated_at'] = now();
                foreach (['foto' => 'img', 'dokumen' => 'dok'] as $field => $column) {
                    if ($request->hasFile($field)) {
                        $data[$column] = $request->file($field)->store(
                            'kib/jalan/' . ($field === 'foto' ? 'foto' : 'dokumen'),
                            'local'
                        );
                        $files[] = $data[$column];
                    }
                }
                $id = DB::table('kib_d_s')->insertGetId($data);
                if ($voucher) {
                    $updated = DB::table('nilai_aktivas')->where('id', $voucherId)
                        ->where('stat', 0)->update(['stat' => 1, 'updated_at' => now()]);
                    if ($updated !== 1) {
                        throw ValidationException::withMessages([
                            'id_nilai_aktiva' => 'Gagal memproses voucher, penyimpanan dibatalkan.',
                        ]);
                    }
                }
                return $id;
            });
        } catch (\Throwable $error) {
            foreach ($files as $path) Storage::disk('local')->delete($path);
            throw $error;
        }
        return response()->json([
            'success' => true,
            'message' => 'Jembatan berhasil ditambahkan.',
            'id' => $id
        ]);
    }

    public function jalanEdit(int $item)
    {
        $row = DB::table('kib_d_s')->where('id', $item)->first();
        abort_unless($row, 404);
        $linkedValue = $row->nilai_v
            ? DB::table('nilai_aktivas')->where('id', $row->nilai_v)->value('nilai')
            : null;
        return response()->json(['success' => true, 'data' => [
            'id' => $row->id,
            'id_nilai_aktiva' => $row->nilai_v,
            'id_barang' => $row->id_barang,
            'id_lokasi' => $row->id_lokasi,
            'id_departemen' => $row->id_dep,
            'id_div' => $row->id_div,
            'kode' => trim((string)$row->kode),
            'reg' => trim((string)$row->reg),
            'kondisi' => trim((string)$row->kondisi),
            'konstruksi' => trim((string)$row->struktur),
            'materi' => trim((string)$row->materi),
            'luas_lantai' => trim((string)$row->luas_lantai),
            'tgl_dok' => $row->tgl_dok,
            'no_dok' => trim((string)$row->no_dok),
            'luas' => trim((string)$row->luas),
            'status_tanah' => trim((string)$row->status),
            'kode_tanah' => trim((string)$row->kode_tanah),
            'asal' => trim((string)$row->asal),
            'harga' => $linkedValue ?? $row->harga,
            'nama_barang' => DB::table('barangs')->where('id', $row->id_barang)->value('nama_barang'),
            'ket' => $row->ket,
            'status_kepemilikan' => $row->status_kepemilikan ?? null,
        ]]);
    }

    public function jalanPerbarui(Request $request, int $item)
    {
        $old = DB::table('kib_d_s')->where('id', $item)->first();
        abort_unless($old, 404);
        $form = $this->jalanValidasi($request, true);
        $this->jalanPastikanBarangAktif((int)$form['id_barang'], (int)$old->id_barang);
        $data = $this->jalanTulis($form);
        // Relasi voucher lama dipertahankan, tidak dapat dipindahkan lewat Edit.
        if ($old->nilai_v) {
            $data['harga'] = $old->harga;
        } else {
            $value = $form['harga'] ?? null;
            if ($value !== null && (float)$value > 2147483647) {
                throw ValidationException::withMessages([
                    'harga' => 'Harga melebihi batas INTEGER.',
                ]);
            }
            $data['harga'] = $value !== null ? (int) round((float)$value) : null;
        }
        // Jangan hapus tanggal dokumen historis non-ISO hanya karena input date kosong.
        if (
            empty($form['tgl_dok']) && !empty($old->tgl_dok)
            && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $old->tgl_dok)
        ) {
            $data['tgl_dok'] = $old->tgl_dok;
        }
        $data['updated_at'] = now();
        $files = [];
        try {
            foreach (['foto' => 'img', 'dokumen' => 'dok'] as $field => $column) {
                if ($request->hasFile($field)) {
                    $data[$column] = $request->file($field)->store(
                        'kib/jalan/' . ($field === 'foto' ? 'foto' : 'dokumen'),
                        'local'
                    );
                    $files[] = $data[$column];
                }
            }
            DB::transaction(function () use ($item, $data) {
                $current = DB::table('kib_d_s')->where('id', $item)->lockForUpdate()->first();
                abort_unless($current, 404);
                if ((int)$current->id_lokasi !== (int)$data['id_lokasi']) {
                    $this->pastikanTanpaRelasiManual('jembatan', $item);
                    if ($current->nilai_v) throw ValidationException::withMessages(['lokasi' => 'Lokasi sumber historis tidak dapat dipindah.']);
                }
                DB::table('kib_d_s')->where('id', $item)->update($data);
            });
        } catch (\Throwable $error) {
            foreach ($files as $path) Storage::disk('local')->delete($path);
            throw $error;
        }
        foreach (['img', 'dok'] as $column) {
            $oldPath = trim((string) ($old->{$column} ?? ''));
            if (array_key_exists($column, $data) && str_starts_with($oldPath, 'kib/jalan/')) {
                Storage::disk('local')->delete($oldPath);
            }
        }
        return response()->json(['success' => true, 'message' => 'Jembatan berhasil diperbarui.']);
    }

    public function jalanHapus(int $item)
    {
        $files = DB::transaction(function () use ($item) {
            $old = DB::table('kib_d_s')->where('id', $item)->lockForUpdate()->first();
            abort_unless($old, 404);
            $this->pastikanTanpaRelasiManual('jembatan', $item);
            DB::table('kib_d_s')->where('id', $item)->delete();
            if ($old->nilai_v && empty(app(KibVoucherLinkService::class)->owners([(int)$old->nilai_v])[$old->nilai_v])) {
                DB::table('nilai_aktivas')->where('id', $old->nilai_v)
                    ->where('stat', 1)->update(['stat' => 0, 'updated_at' => now()]);
            }
            return [$old->img, $old->dok];
        });
        foreach ($files as $path) {
            $stored = trim((string)$path);
            if (str_starts_with($stored, 'kib/jalan/')) Storage::disk('local')->delete($stored);
        }
        return response()->json(['success' => true, 'message' => 'Jembatan berhasil dihapus.']);
    }

    public function jalanPerbaruiPemilikArsip(Request $request, int $item)
    {
        abort_unless(
            Schema::hasColumn('kib_d_s', 'status_kepemilikan'),
            503,
            'Kolom Status Kepemilikan belum tersedia.'
        );
        abort_unless(DB::table('kib_d_s')->where('id', $item)->exists(), 404);
        $form = $request->validate([
            'status_kepemilikan' => ['required', Rule::in(self::JALAN_PEMILIK)],
        ]);
        DB::table('kib_d_s')->where('id', $item)
            ->update(['status_kepemilikan' => $form['status_kepemilikan'], 'updated_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Status Kepemilikan diperbarui.']);
    }

    /** Jalur berkas yang tersimpan baru bersifat privat; berkas lama dibaca aman. */
    public function jalanFile(string $source, int $item, string $jenis)
    {
        abort_unless(in_array($source, ['jembatan', 'arsip'], true)
            && in_array($jenis, ['foto', 'dokumen'], true), 404);
        $row = DB::table('kib_d_s')->where('id', $item)->first();
        abort_unless($row, 404);
        $value = trim((string) ($jenis === 'foto' ? $row->img : $row->dok));
        abort_unless($value !== '', 404);
        $path = null;
        if (str_starts_with($value, 'kib/jalan/') && Storage::disk('local')->exists($value)) {
            $path = Storage::disk('local')->path($value);
        } else {
            $name = basename(str_replace('\\', '/', $value));
            $roots = [
                public_path('assets/img/jalan/' . ($jenis === 'foto' ? 'img' : 'dok')),
                public_path('assets/img/jalan'),
            ];
            foreach ($roots as $root) {
                $rootReal = realpath($root);
                $candidate = $rootReal ? realpath($rootReal . DIRECTORY_SEPARATOR . $name) : false;
                if ($candidate && str_starts_with($candidate, $rootReal . DIRECTORY_SEPARATOR)) {
                    $path = $candidate;
                    break;
                }
            }
        }
        abort_unless($path && is_file($path), 404);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        abort_unless(in_array($ext, $jenis === 'foto'
            ? ['jpg', 'jpeg', 'png', 'webp'] : ['pdf'], true), 415);
        return response()->file($path, ['X-Content-Type-Options' => 'nosniff']);
    }

    /*
     |--------------------------------------------------------------------------
     | K.I.B B — KENDARAAN 31.08 DAN LAPORAN EXCEL
     | Seluruh menu K.I.B menggunakan KIBController.
     | Fungsi lama tidak diubah; metode baru bersifat read-only.
     |--------------------------------------------------------------------------
     */

    /** @return \Illuminate\Support\Collection<int, object> */
    private function transaksiKendaraanKibB()
    {
        return DB::table('nilai_aktivas as n')
            ->join('aktivas as a', 'a.id', '=', 'n.id_aktiva')
            ->leftJoin('lokasis as l', 'l.id', '=', 'n.id_lokasi')
            ->whereRaw("(BTRIM(COALESCE(a.kode, '')) = ? OR BTRIM(COALESCE(a.kode, '')) LIKE ?)", ['31.08', '31.08.%'])
            ->select(
                'n.id',
                'n.id_lokasi',
                'n.id_aktiva',
                'n.cat',
                'n.stat',
                'n.no_voucher',
                'n.tgl_voucher',
                'n.tahun',
                'n.urai',
                'n.nilai',
                'a.kode as kode_aktiva',
                'a.aktiva as jenis_aktiva',
                'l.lokasi'
            )
            ->orderBy('a.kode')->orderBy('n.id')
            ->get();
    }

    /** @return \Illuminate\Support\Collection<int, object> */
    private function inventarisKendaraanKibB()
    {
        return DB::table('mesins as m')
            ->leftJoin('nilai_aktivas as n', 'n.id', '=', 'm.id_voucher2')
            ->join('aktivas as a', 'a.id', '=', DB::raw('COALESCE(n.id_aktiva, m.id_aktiva)'))
            ->leftJoin('barangs as b', 'b.id', '=', 'm.id_barang')
            ->leftJoin('lokasis as l', 'l.id', '=', 'm.id_lokasi')
            ->whereRaw("(BTRIM(COALESCE(a.kode, '')) = ? OR BTRIM(COALESCE(a.kode, '')) LIKE ?)", ['31.08', '31.08.%'])
            ->select(
                'm.*',
                'a.kode as kode_aktiva',
                'a.aktiva as jenis_aktiva',
                'b.nama_barang',
                'l.lokasi'
            )
            ->orderBy('a.kode')->orderBy('m.id')
            ->get();
    }

    private function sdmAktifKibB()
    {
        if (!Schema::hasTable('sdms') || !Schema::hasTable('jabatans')) {
            return collect();
        }

        return DB::table('sdms as s')
            ->leftJoin('jabatans as j', 'j.id', '=', 's.id_jabat')
            ->when(
                Schema::hasColumn('sdms', 'status'),
                fn($query) => $query->where('s.status', 'aktif')
            )
            ->whereNotNull('s.nama_sdm')
            ->whereRaw("BTRIM(s.nama_sdm) <> ''")
            ->select('s.id', 's.nama_sdm', 's.nip', 'j.jabat')
            ->orderBy('s.nama_sdm')->get()
            ->map(static fn($sdm) => [
                'id' => (int) $sdm->id,
                'nama' => trim((string) $sdm->nama_sdm),
                'nip' => trim((string) ($sdm->nip ?? '')),
                'jabatan' => trim((string) ($sdm->jabat ?? '')),
            ]);
    }

    private function daftarKendaraanKibB(): array
    {
        $transaksi = $this->transaksiKendaraanKibB();
        $inventaris = $this->inventarisKendaraanKibB();
        $inventarisByVoucher = $inventaris
            ->filter(fn($m) => (int) ($m->id_voucher2 ?? 0) > 0)
            ->groupBy(fn($m) => (int) $m->id_voucher2);
        $relasiManual = app(KibVoucherLinkService::class)->ready()
            ? DB::table('kib_voucher_links')->where('kib', 'mesin')
            ->whereIn('nilai_aktiva_id', $transaksi->pluck('id')->all())
            ->whereIn('record_id', $inventaris->pluck('id')->all())->pluck('record_id', 'nilai_aktiva_id')
            : collect();
        $terpasang = [];
        $rows = [];

        foreach ($transaksi as $n) {
            $match = $inventarisByVoucher->get((int) $n->id, collect());
            if ($match->isEmpty() && $relasiManual->has($n->id)) {
                // Voucher penambahan nilai bukan unit kendaraan kedua.
                // Inventaris tujuan tetap masuk sekali pada loop inventaris.
                continue;
            }
            if ($match->isEmpty()) {
                $rows[] = $this->kendaraanRowKibB(null, $n);
                continue;
            }
            foreach ($match as $m) {
                $terpasang[(int) $m->id] = true;
                $rows[] = $this->kendaraanRowKibB($m, $n);
            }
        }

        // Inventaris historis yang tidak punya tautan voucher tetap tampil.
        foreach ($inventaris as $m) {
            if (!isset($terpasang[(int) $m->id])) {
                $rows[] = $this->kendaraanRowKibB($m, null);
            }
        }

        // Kendaraan yang baru diinventarisasi selalu tampil paling atas.
        // ID mesins dan nilai_aktivas berasal dari sequence berbeda,
        // jadi jangan membandingkan nilainya secara langsung.
        // Transaksi 31.08 yang belum diinventarisasi tetap tampil setelahnya,
        // dengan transaksi paling baru di urutan awal kelompok pending.
        usort($rows, static function (array $a, array $b): int {
            $aMesinId = (int) ($a['mesin_id'] ?? 0);
            $bMesinId = (int) ($b['mesin_id'] ?? 0);

            if ($aMesinId > 0 && $bMesinId > 0) {
                return $bMesinId <=> $aMesinId;
            }
            if ($aMesinId > 0) return -1;
            if ($bMesinId > 0) return 1;

            return ((int) ($b['nilai_id'] ?? 0))
                <=> ((int) ($a['nilai_id'] ?? 0));
        });

        $ids = collect($rows)->pluck('mesin_id')->filter()->unique()->values();
        $latest = $ids->isEmpty() ? collect() : DB::table('mesin_pajaks')
            ->whereIn('mesin_id', $ids)
            ->orderByDesc('jatuh_tempo')->orderByDesc('id')
            ->get()->unique('mesin_id')->keyBy('mesin_id');
        $today = Carbon::today('Asia/Makassar');
        $summary = [
            'total' => count($rows),
            'aktif' => 0,
            'segera_habis' => 0,
            'kedaluwarsa' => 0,
            'belum_didata' => 0,
            'sudah_inventaris' => 0,
            'belum_inventaris' => 0,
            'total_transaksi_31_08' => $transaksi->count(),
            'data_lengkap' => 0,
            'data_belum_lengkap' => 0,
        ];

        foreach ($rows as &$row) {
            $pajak = $row['mesin_id'] ? $latest->get($row['mesin_id']) : null;
            $status = 'belum_didata';
            $hari = null;
            if ($pajak && $pajak->jatuh_tempo) {
                $tempo = Carbon::parse($pajak->jatuh_tempo, 'Asia/Makassar')->startOfDay();
                $hari = (int) $today->diffInDays($tempo, false);
                $status = $hari <= 0 ? 'kedaluwarsa' : ($hari <= 14 ? 'segera_habis' : 'aktif');
            }
            $row += [
                'pajak_id' => $pajak ? (int) $pajak->id : null,
                'tanggal_bayar' => $pajak->tanggal_bayar ?? null,
                'masa_berlaku_bulan' => $pajak->masa_berlaku_bulan ?? null,
                'jatuh_tempo' => $pajak->jatuh_tempo ?? null,
                'nominal' => $pajak->nominal ?? null,
                'nomor_stnk' => $pajak->nomor_stnk ?? null,
                'keterangan' => $pajak->keterangan ?? null,
                'ada_dokumen' => !empty($pajak->dokumen_pdf),
                'status' => $status,
                'sisa_hari' => $hari,
            ];
            [$kelengkapan, $kolomBelumLengkap] = $this->kelengkapanKendaraanKibB($row);
            $row['kelengkapan'] = $kelengkapan;
            $row['kolom_belum_lengkap'] = $kolomBelumLengkap;
            if ($row['terinventaris']) {
                $summary[$kelengkapan === 'lengkap' ? 'data_lengkap' : 'data_belum_lengkap']++;
            }
            $summary[$status]++;
            $summary[$row['terinventaris'] ? 'sudah_inventaris' : 'belum_inventaris']++;
        }
        unset($row);

        return [$rows, $summary, $today];
    }

    /**
     * Status kelengkapan administrasi kendaraan.
     * Tidak mengubah status pajak; keduanya ditampilkan berdampingan.
     * Kelengkapan mengikuti kolom identitas pada template Kendaraan.
     * Keterangan tetap opsional, karena bukan setiap unit memiliki catatan.
     * Nilai '-' dari inventaris lama dihitung sebagai belum diisi.
     */
    private function kelengkapanKendaraanKibB(array $row): array
    {
        if (!$row['terinventaris']) {
            return ['belum_inventaris', ['Belum diinventarisasi dari Data Pending']];
        }

        $wajibIdentitas = [
            'kode_barang' => 'Kode Barang',
            'nama_kendaraan' => 'Nama Barang',
            'register' => 'Nomor Register',
            'merk' => 'Merk/Tipe',
            'ukuran' => 'Ukuran/CC',
            'bahan' => 'Bahan',
            'pabrik' => 'Nomor Pabrik',
            'tahun' => 'Tahun Pembelian',
            'rangka' => 'Nomor Rangka',
            'nomor_mesin' => 'Nomor Mesin',
            'nomor_polisi' => 'Nomor Polisi',
            'bpkb' => 'Nomor BPKB',
            'asal' => 'Asal Usul/Cara Perolehan',
            'lokasi' => 'Lokasi Pengguna',
        ];
        $kosong = [];
        foreach ($wajibIdentitas as $key => $label) {
            $value = trim((string) ($row[$key] ?? ''));
            if ($value === '' || $value === '-' || $value === '—') {
                $kosong[] = $label;
            }
        }
        return [count($kosong) === 0 ? 'lengkap' : 'belum_lengkap', $kosong];
    }

    private function kendaraanRowKibB(?object $m, ?object $n): array
    {
        $terinventaris = $m !== null;
        $mesinId = $m ? (int) $m->id : null;
        $nilaiId = $n ? (int) $n->id : null;
        return [
            'kunci' => $terinventaris ? 'm-' . $mesinId : 'n-' . $nilaiId,
            'mesin_id' => $mesinId,
            'nilai_id' => $nilaiId,
            'terinventaris' => $terinventaris,
            'status_inventaris' => $terinventaris ? 'Sudah Inventaris' : 'Belum Inventaris',
            'kode_aktiva' => trim((string) ($m->kode_aktiva ?? $n->kode_aktiva ?? '')),
            'jenis' => trim((string) ($m->jenis_aktiva ?? $n->jenis_aktiva ?? '')),
            'nama_kendaraan' => trim((string) ($m->nama_barang ?? $n->jenis_aktiva ?? '')),
            'pengguna' => trim((string) ($m->guna ?? $n->urai ?? '')),
            'merk' => trim((string) ($m->merk ?? '')),
            'nomor_polisi' => trim((string) ($m->polisi ?? '')),
            'tahun' => $m->tahun ?? $n->tahun ?? null,
            'lokasi_id' => $m->id_lokasi ?? $n->id_lokasi ?? null,
            'lokasi' => trim((string) ($m->lokasi ?? $n->lokasi ?? '')),
            'kode_barang' => trim((string) ($m->kode ?? '')),
            'register' => trim((string) ($m->reg ?? '')),
            'ukuran' => trim((string) ($m->ukuran ?? '')),
            'bahan' => trim((string) ($m->bahan ?? '')),
            'pabrik' => trim((string) ($m->pabrik ?? '')),
            'rangka' => trim((string) ($m->rangka ?? '')),
            'nomor_mesin' => trim((string) ($m->mesin ?? '')),
            'bpkb' => trim((string) ($m->bpkb ?? '')),
            'asal' => trim((string) ($m->asal ?? '')),
            'ket' => trim((string) ($m->ket ?? '')),
            'no_voucher' => trim((string) ($n->no_voucher ?? '')),
            'nilai_transaksi' => $n->nilai ?? null,
            'harga' => $m->harga ?? null,
        ];
    }

    /**
     * Endpoint tab Kendaraan, bentuk JSON kompatibel dengan UI Masa Pajak.
     */
    public function dataKendaraanKibB(): \Illuminate\Http\JsonResponse
    {
        [$rows, $summary, $today] = $this->daftarKendaraanKibB();
        return response()->json([
            'success' => true,
            'tanggal' => $today->toDateString(),
            'summary' => $summary,
            'data' => $rows,
        ]);
    }

    /**
     * Sumber laporan kendaraan seluruhnya atau satu data mesin saat Detail.
     * Read-only, tidak melakukan pembaruan nilai_aktivas / mesins.
     */
    /**
     * Kode struktur laporan K.I.B B hanya dari atribut struktur yang benar-benar ada.
     * Dukung DB lama tanpa kolom kode_struktur; jangan invent nilai.
     */
    private function kodeStrukturLokasiKibB(array $lokasiIds): string
    {
        $lokasiIds = collect($lokasiIds)->filter(static fn($id) => (int) $id > 0)
            ->map(static fn($id) => (int) $id)->unique()->values()->all();
        if (!$lokasiIds) return '-';

        $kode = collect();
        if (Schema::hasColumn('lokasis', 'kode_struktur')) {
            $kode = DB::table('lokasis')->whereIn('id', $lokasiIds)
                ->pluck('kode_struktur');
        } elseif (Schema::hasColumn('mesins', 'kode_struktur')) {
            $kode = DB::table('mesins')->whereIn('id_lokasi', $lokasiIds)
                ->pluck('kode_struktur');
        }
        $unik = $kode->map(static fn($v) => trim((string) ($v ?? '')))
            ->filter()->unique()->values();
        return $unik->count() > 1 ? 'BERAGAM'
            : ($unik->count() === 1 ? $unik->first() : '-');
    }

    /*
    |--------------------------------------------------------------------------
    | REFERENSI TERPADU DEPARTEMEN (KIB A–F DAN KIR)
    |--------------------------------------------------------------------------
    | ID/kode tidak pernah menjadi label utama pada form dan laporan.
    | Jika master belum memiliki nama yang benar, tampilkan peringatan yang
    | bisa ditindaklanjuti, bukan mengarang nama departemen.
    */
    private function kibPetaNamaDepartemen(): array
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $cache = ['id' => [], 'kode' => [], 'nama' => []];
        if (!Schema::hasTable('departemens')) {
            return $cache;
        }

        foreach (DB::table('departemens')->get(['id', 'kode_dep', 'nama_dep']) as $row) {
            $nama = trim((string) ($row->kode_dep ?? ''));
            if ($nama === '' || preg_match('/^[0-9.\\s\\/\\-]+$/u', $nama)) {
                continue; // Master belum mempunyai nama yang bisa dibaca pengguna.
            }

            $id = (string) $row->id;
            $kode = strtolower(trim((string) ($row->nama_dep ?? '')));
            $cache['id'][$id] = $nama;
            if ($kode !== '') {
                $cache['kode'][$kode] = $nama;
            }
            $cache['nama'][strtolower($nama)] = $nama;
        }

        return $cache;
    }

    private function kibNamaDepartemenUntukLaporan(int|string|null $nilai, int|string|null $idDepartemen = null): string
    {
        $raw = trim((string) ($nilai ?? ''));
        if (in_array(strtoupper($raw), ['BERAGAM', 'SELURUH DEPARTEMEN'], true)) {
            return strtoupper($raw);
        }

        $peta = $this->kibPetaNamaDepartemen();
        // ID eksplisit hanya dari relasi database. Jika raw adalah kode, utamakan kode.
        if ($idDepartemen !== null && $idDepartemen !== '') {
            $id = trim((string) $idDepartemen);
            if (isset($peta['id'][$id])) {
                return $peta['id'][$id];
            }
        }
        $key = strtolower($raw);
        if ($raw !== '') {
            $nama = $peta['kode'][$key]
                ?? $peta['nama'][$key]
                ?? $peta['id'][$raw]
                ?? null;
            if ($nama !== null) {
                return $nama;
            }
        }

        if ($raw === '' || $raw === '-') {
            return '-';
        }
        // Nomor yang tidak ada di Master tidak boleh disajikan sebagai nama.
        if (preg_match('/^[0-9.\\s\\/\\-]+$/u', $raw)) {
            return 'Nama departemen belum tersedia di Master Data';
        }
        return $raw; // Nama historis yang belum terdaftar tetap dapat dibaca.
    }

    private function kibPilihanDepartemen(bool $aktifSaja = true)
    {
        if (!Schema::hasTable('departemens')) {
            return collect();
        }

        return DB::table('departemens')
            ->select('id', 'kode_dep', 'nama_dep')
            ->when(
                $aktifSaja && Schema::hasColumn('departemens', 'status'),
                static fn($query) => $query->where(static function ($q) {
                    $q->whereNull('status')->orWhere('status', '<>', 'nonaktif');
                })
            )
            ->orderBy('kode_dep')
            ->get()
            ->map(function ($row) {
                // Skema legacy Master: nama_dep = kode, kode_dep = nama.
                $kode = trim((string) ($row->nama_dep ?? $row->id));
                $nama = $this->kibNamaDepartemenUntukLaporan($kode, $row->id);
                $row->kode_dep = $kode; // kode sebenarnya, untuk pencarian JS
                if ($nama === 'Nama departemen belum tersedia di Master Data' || $nama === '-') {
                    $row->nama_dep = 'Nama belum diatur — kode ' . $kode . ' (perbaiki Master Departemen)';
                } else {
                    $row->nama_dep = $nama; // teks pilihan yang dilihat pengguna
                }
                return $row;
            });
    }

    private function kibNamaDepartemenInputManual(int|string|null $nilai, string $field = 'departemen'): ?string
    {
        $raw = trim((string) ($nilai ?? ''));
        if ($raw === '') {
            return null;
        }
        $nama = $this->kibNamaDepartemenUntukLaporan($raw);
        if (
            $nama === 'Nama departemen belum tersedia di Master Data'
            || $nama === 'Nama belum diatur — perbaiki Master Departemen'
        ) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                $field => 'Kode Departemen tidak mempunyai nama di Master Data. Pilih nama departemen yang valid.',
            ]);
        }
        return $nama;
    }

    /**
     * Nama departemen untuk kop K.I.B B harus berasal dari Master Departemen.
     *
     * Data lama dapat menyimpan ID, kode seperti 00.02, atau nama departemen.
     * Lakukan lookup SEKALI untuk seluruh baris laporan, bukan satu query per aset.
     * Jika berisi lebih dari satu departemen, tampilkan BERAGAM.
     */
    private function namaDepartemenLaporanKibB(iterable $baris): string
    {
        $nama = [];
        foreach ($baris as $item) {
            $label = $this->kibNamaDepartemenUntukLaporan(
                $item->departemen ?? null,
                $item->id_departemen ?? $item->dep_voucher ?? null
            );
            if ($label !== '-') {
                $nama[mb_strtolower($label)] = $label;
            }
        }

        if ($nama === []) return '-';
        return count($nama) === 1 ? reset($nama) : 'BERAGAM';
    }

    /** Nilai laporan per record, bukan total lokasi. Harga historis/manual tetap
     * dipakai bila belum ada voucher, tanpa menjumlahkan kedua sumber. */
    private function nilaiLaporanKib(array $rows, string $kategori, string $idKey = 'id', ?string $fallback = null): array
    {
        $ids = array_map(static fn($r) => (int) (((array) $r)[$idKey] ?? 0), $rows);
        $totals = app(KibVoucherLinkService::class)->totalsForRecords($kategori, $ids);
        return array_map(static function ($item) use ($idKey, $totals, $fallback): array {
            $row = (array) $item;
            $id = (int) ($row[$idKey] ?? 0);
            $total = $totals[$id] ?? ['jumlah_voucher' => 0, 'nilai_terhubung' => 0, 'nilai_konflik' => false];
            $row = array_merge($row, $total);
            if ($total['nilai_konflik']) {
                $row['nilai_laporan'] = null;
                $row['nilai_sumber'] = 'konflik';
            } elseif ($total['jumlah_voucher'] > 0) {
                $row['nilai_laporan'] = $total['nilai_terhubung'];
                $row['nilai_sumber'] = 'voucher';
            } elseif ($id > 0 && $fallback !== null && isset($row[$fallback]) && is_numeric($row[$fallback])) {
                $row['nilai_laporan'] = $row[$fallback];
                $row['nilai_sumber'] = 'manual';
            } else {
                $row['nilai_laporan'] = 0;
                $row['nilai_sumber'] = 'belum_terhubung';
            }
            return $row;
        }, $rows);
    }

    /**
     * Excel 17 kolom untuk SELURUH barang dalam satu lokasi K.I.B B.
     * Cocok untuk tombol Print Excel pada Detail lokasi (misal AWS: 5 barang).
     * Tidak mengubah tabel, transaksi, atau daftar pajak.
     */
    private function laporanMesinPerLokasiKibB(int $lokasiId): \Illuminate\Http\JsonResponse
    {
        $lokasi = DB::table('lokasis')->where('id', $lokasiId)
            ->first(['id', 'lokasi', 'alamat']);
        abort_unless($lokasi, 404, 'Lokasi peralatan dan mesin tidak ditemukan.');

        $barang = DB::table('mesins as m')
            ->leftJoin('barangs as b', 'b.id', '=', 'm.id_barang')
            ->leftJoin('departemens as d', 'd.id', '=', 'm.id_departemen')
            ->leftJoin('divisis as dv', 'dv.id', '=', 'm.id_div')
            ->leftJoin('nilai_aktivas as n', 'n.id', '=', 'm.id_voucher2')
            ->leftJoin('aktivas as a', 'a.id', '=', DB::raw('COALESCE(n.id_aktiva, m.id_aktiva)'))
            ->where('m.id_lokasi', $lokasiId)
            // Kode Aktiva 31.08 termasuk tab Kendaraan, bukan laporan Mesin lokasi.
            ->where(function ($query) {
                $query->whereNull('a.kode')
                    ->orWhereRaw(
                        "NOT (BTRIM(a.kode) = ? OR BTRIM(a.kode) LIKE ?)",
                        ['31.08', '31.08.%']
                    );
            })
            ->select(
                'm.*',
                'b.nama_barang',
                'b.kode_barang',
                'd.kode_dep as departemen',
                'dv.nama_div as divisi',
                'n.dep as dep_voucher',
                'a.kode as kode_aktiva'
            )
            ->orderBy('m.id')
            ->get();

        // Metadata hanya menyatakan nilai departemen/divisi ketika seragam.
        // Kalau lokasi berisi beberapa unit kerja, jangan menebak satu nama.
        $identitas = static function ($values): string {
            $unique = collect($values)->map(static fn($v) => trim((string) ($v ?? '')))
                ->filter()->unique()->values();
            if ($unique->count() === 0) return '-';
            return $unique->count() === 1 ? $unique->first() : 'BERAGAM';
        };

        $data = $barang->map(static function ($m): array {
            return [
                'mesin_id' => (int) $m->id,
                'nama_barang' => (string) ($m->nama_barang ?? ''),
                'kode_barang' => (string) ($m->kode ?? $m->kode_barang ?? ''),
                'register' => (string) ($m->reg ?? ''),
                'merk' => (string) ($m->merk ?? ''),
                'ukuran' => (string) ($m->ukuran ?? ''),
                'fungsi' => (string) ($m->fungsi ?? ''),
                'penggunaan' => (string) ($m->guna ?? ''),
                'bahan' => (string) ($m->bahan ?? ''),
                'kondisi' => (string) ($m->kondisi ?? ''),
                'tahun' => $m->tahun ?? null,
                'asal' => (string) ($m->asal ?? ''),
                'no_dokumen' => (string) ($m->nomor_dokumen ?? '-'),
                'harga' => $m->harga ?? null,
                'keterangan' => (string) ($m->ket ?? ''),
                'lokasi' => (string) ($m->lokasi ?? ''),
                'kode_aktiva' => (string) ($m->kode_aktiva ?? ''),
            ];
        })->values()->all();

        return response()->json([
            'success' => true,
            'jenis' => 'mesin',
            'cakupan' => 'lokasi',
            'lokasi' => [
                'id' => (int) $lokasi->id,
                'nama' => (string) ($lokasi->lokasi ?? ''),
                'alamat' => (string) ($lokasi->alamat ?? ''),
                'kode_struktur' => $this->kodeStrukturLokasiKibB([$lokasiId]),
            ],
            'jumlah' => count($data),
            'data' => $this->nilaiLaporanKib($data, 'mesin', 'mesin_id', 'harga'),
            'sdm' => $this->sdmAktifKibB(),
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                'departemen' => $this->namaDepartemenLaporanKibB($barang),
                'divisi' => $identitas($barang->pluck('divisi')),
                'kode_struktur' => $this->kodeStrukturLokasiKibB([$lokasiId]),
            ],
        ]);
    }

    public function laporanMesinKibB(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'lokasi_id' => ['nullable', 'integer', 'min:1', 'exists:lokasis,id'],
            // Kompatibilitas kode pemanggil lama. Tombol baru selalu mengirim lokasi_id.
            'mesin_id' => ['nullable', 'integer', 'min:1'],
        ]);
        $lokasiId = isset($validated['lokasi_id']) ? (int) $validated['lokasi_id'] : null;
        $mesinId = isset($validated['mesin_id']) ? (int) $validated['mesin_id'] : null;

        if ($lokasiId !== null && $mesinId !== null) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'lokasi_id' => 'Pilih lokasi ATAU satu barang, bukan keduanya.',
            ]);
        }
        if ($lokasiId !== null) {
            return $this->laporanMesinPerLokasiKibB($lokasiId);
        }
        if ($mesinId !== null) {
            $m = DB::table('mesins as m')
                ->leftJoin('barangs as b', 'b.id', '=', 'm.id_barang')
                ->leftJoin('lokasis as l', 'l.id', '=', 'm.id_lokasi')
                ->leftJoin('departemens as d', 'd.id', '=', 'm.id_departemen')
                ->leftJoin('nilai_aktivas as n', 'n.id', '=', 'm.id_voucher2')
                ->leftJoin('aktivas as a', 'a.id', '=', DB::raw('COALESCE(n.id_aktiva, m.id_aktiva)'))
                ->where('m.id', $mesinId)
                ->select(
                    'm.*',
                    'b.nama_barang',
                    'l.lokasi',
                    'd.kode_dep as departemen',
                    'n.dep as dep_voucher',
                    'a.kode as kode_aktiva',
                    'a.aktiva as jenis_aktiva'
                )
                ->first();
            abort_unless($m, 404);
            // Mode kompatibilitas laporan satu item; tombol Detail kini memakai lokasi_id.
            $rows = [[
                'mesin_id' => (int) $m->id,
                'nama_barang' => $m->nama_barang ?? '',
                'kode_barang' => $m->kode ?? '',
                'register' => $m->reg ?? '',
                'merk' => $m->merk ?? '',
                'ukuran' => $m->ukuran ?? '',
                'fungsi' => $m->fungsi ?? '',
                'penggunaan' => $m->guna ?? '',
                'bahan' => $m->bahan ?? '',
                'kondisi' => $m->kondisi ?? '',
                'tahun' => $m->tahun ?? '',
                'asal' => $m->asal ?? '',
                'no_dokumen' => (string) ($m->nomor_dokumen ?? '-'),
                'harga' => $m->harga ?? null,
                'keterangan' => $m->ket ?? '',
                'lokasi' => $m->lokasi ?? '',
                'kode_aktiva' => $m->kode_aktiva ?? '',
            ]];
            $jenis = 'mesin';
            $departemenLaporan = $this->namaDepartemenLaporanKibB([$m]);
        } else {
            [$rows] = $this->daftarKendaraanKibB();
            $jenis = 'kendaraan';
            $departemenLaporan = 'SELURUH DEPARTEMEN';
        }

        $kodeStruktur = $jenis === 'kendaraan'
            ? $this->kodeStrukturLokasiKibB(collect($rows)->pluck('lokasi_id')->all())
            : '-';

        return response()->json([
            'success' => true,
            'jenis' => $jenis,
            'jumlah' => count($rows),
            'data' => $this->nilaiLaporanKib($rows, 'mesin', 'mesin_id', 'harga'),
            'sdm' => $this->sdmAktifKibB(),
            'organisasi' => [
                'provinsi' => 'KALIMANTAN TIMUR',
                'kota' => 'SAMARINDA',
                'unit' => 'PERUMDA TIRTA KENCANA',
                'departemen' => $departemenLaporan,
                'divisi' => $jenis === 'kendaraan' ? 'SELURUH DIVISI' : '-',
                'kode_struktur' => $kodeStruktur,
            ],
        ]);
    }
}
