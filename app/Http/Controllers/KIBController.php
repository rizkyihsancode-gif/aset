<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Services\KibNotificationService;
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

            ->orderByRaw(
                'MIN(l.lokasi) ASC'
            )

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
            ->select('id', 'kode_barang', 'nama_barang')
            ->orderBy('nama_barang')->get();

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

        $tanahs->each(function ($row) use ($pdfLokasi, $pdfNilaiLokasi) {
            $row->pdf_count = (int) ($pdfLokasi[$row->id_lokasi] ?? 0)
                + (int) ($pdfNilaiLokasi[$row->id_lokasi] ?? 0);
        });

        return view(
            'kib.tanah',
            compact(
                'tanahs',
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
                'ASC'
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
        return $this->pdfQuery()
            ->where('p.id_tanah', $tanahId)
            ->orderByDesc('p.id')
            ->get(['p.id', 'p.dok'])
            ->map(fn($p) => [
                'id' => $p->id,
                'nama' => basename((string) ($p->dok ?: 'Dokumen tanah.pdf')),
                'view_url' => route('kib.tanah.pdf.view', $p->id),
                'download_url' => route('kib.tanah.pdf.download', $p->id),
            ])->all();
    }

    private function serialize(\stdClass $row): array
    {
        $result = (array) $row;
        $result['pdfs'] = $this->pdfData((int) $row->id);

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
            ->orderBy('t.id')
            ->get();

        return response()->json([
            'success' => true,
            'lokasi' => ['id' => $l->id, 'lokasi' => trim($l->lokasi), 'alamat' => trim($l->alamat)],
            'data' => $rows->map(fn($row) => $this->serialize($row))->values(),
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
        return response()->json(['success' => true, 'data' => $this->serialize($row)]);
    }

    private function validateInput(Request $request, bool $editing = false): array
    {
        return $request->validate([
            'id_nilai_aktiva' => [$editing ? 'nullable' : 'required', 'integer', 'exists:nilai_aktivas,id'],
            'id_barang' => ['required', 'integer', 'exists:barangs,id'],
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
            'dokumen_pdf' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:15360'],
        ]);
    }

    private function tanahFields(array $input): array
    {
        $data = [
            'id_barang' => (int) $input['id_barang'],
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

    private function uploadPdf(Request $request, int $tanahId): ?string
    {
        if (!$request->hasFile('dokumen_pdf')) return null;
        $path = $request->file('dokumen_pdf')->store('tanah/sertifikat', 'local');
        try {
            DB::table('pdfs')->insert([
                'id_tanah' => $tanahId,
                'dok' => $path,
                'gol' => 'TANAH',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }
        return $path;
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

        $newFile = null;

        try {
            DB::transaction(function () use (
                $input,
                $request,
                $categoryId,
                &$newFile
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

                $newFile = $this->uploadPdf(
                    $request,
                    (int) $tanahId
                );

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

            if ($newFile) {
                Storage::disk('local')->delete($newFile);
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


    public function update(Request $request, int $tanah)
    {
        $row = DB::table('tanahs')->where('id', $tanah)->first();
        abort_unless($row, 404);
        $input = $this->validateInput($request, true);
        $newFile = null;
        try {
            DB::transaction(function () use ($input, $request, $tanah, &$newFile) {
                $data = $this->tanahFields($input);
                $data['updated_at'] = now();
                // Original id_lokasi, nilai_aktiva_id and nilai are never overwritten by form.
                DB::table('tanahs')->where('id', $tanah)->update($data);
                $newFile = $this->uploadPdf($request, $tanah);
            });
        } catch (\Throwable $e) {
            if ($newFile) Storage::disk('local')->delete($newFile);
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
                str_starts_with(
                    $path,
                    'tanah/sertifikat/'
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
            ->where(
                'a.kib',
                'KIB B - PERALATAN DAN MESIN'
            );
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
            ->selectRaw(
                'COUNT(DISTINCT m.id) AS jumlah_barang'
            )
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
            ->orderBy('l.lokasi')
            ->get();

        // Master Data Barang.
        $barangRows = DB::table('barangs')
            ->select(
                'id',
                'nama_barang',
                'kode_barang'
            )
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

        // Pending mempertahankan aturan notifikasi lama:
        // kategori transaksi dan stat = 0.

        /*
    |--------------------------------------------------------------------------
    | JUMLAH PENDING K.I.B GEDUNG
    |--------------------------------------------------------------------------
    | Hanya menghitung Penambahan Aset
    | yang belum diproses menjadi inventaris.
    */

        $totalPending = DB::table('nilai_aktivas')
            ->where('cat', $this->gedungKategori())
            ->where('jenisn', 1)
            ->where('stat', 0)
            ->count();


        return view(
            'kib.mesin',
            compact(
                'mesins',
                'barangRows',
                'totalAset',
                'totalLokasi',
                'totalNilai',
                'totalPending'
            )
        );
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

        $base = DB::table('nilai_aktivas')
            ->where('cat', $cat)
            ->where('stat', 0);

        $count = (clone $base)->count();

        $rows = DB::table('nilai_aktivas as n')

            ->leftJoin(
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

            ->where('n.cat', $cat)
            ->where('n.stat', 0)

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
                "BTRIM(COALESCE(d.nama_dep, d.kode_dep, '')) AS departemen"
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
            ->where('m.id_lokasi', $lokasi)
            ->select('m.*')
            ->selectRaw(
                "BTRIM(COALESCE(b.nama_barang, '')) AS nama_barang"
            )
            ->selectRaw(
                "BTRIM(COALESCE(b.kode_barang, '')) AS kode_barang"
            )
            ->selectRaw(
                "BTRIM(COALESCE(d.nama_dep, d.kode_dep, '')) AS departemen"
            )
            ->selectRaw(
                "BTRIM(COALESCE(v.nama_div, '')) AS divisi"
            )
            ->orderByDesc('m.id')
            ->get();

        return response()->json([
            'success' => true,
            'lokasi' => $location,
            'data' => $rows,
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
                'n.urai',
                'n.nilai',
                'a.kode as kode_aktiva',
                'a.aktiva as nama_aktiva',
                'd.nama_dep as departemen',
                'dv.nama_div as divisi',
            ])
            ->orderBy('n.tgl_voucher')
            ->orderBy('n.id')
            ->get();

        return response()->json([
            'success' => true,

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
            ->where('m.id', $mesin)
            ->select('m.*')
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
                "BTRIM(COALESCE(d.nama_dep, d.kode_dep, '')) AS departemen"
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

            'kode' => ['required', 'string', 'max:255'],
            'reg' => ['nullable', 'string', 'max:255'],
            'tahun' => ['required', 'digits:4'],

            'bahan' => ['nullable', 'string', 'max:255'],
            'asal' => ['nullable', 'string', 'max:255'],
            'ukuran' => ['nullable', 'string', 'max:255'],
            'merk' => ['nullable', 'string', 'max:255'],
            'pabrik' => ['nullable', 'string', 'max:255'],

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

    private function fieldsMesin(array $input): array
    {
        $legacy = fn(string $key) =>
        trim((string) ($input[$key] ?? '')) ?: '-';

        return [
            'id_barang' => (int) $input['id_barang'],

            'kode' => trim((string) $input['kode']),
            'reg' => $legacy('reg'),
            'tahun' => (string) $input['tahun'],

            'harga' => (
                isset($input['harga'])
                && $input['harga'] !== ''
            ) ? (int) $input['harga'] : null,

            'susut' => (
                isset($input['susut'])
                && $input['susut'] !== ''
            ) ? (int) $input['susut'] : 0,

            'bahan' => $legacy('bahan'),
            'asal' => $legacy('asal'),
            'ukuran' => $legacy('ukuran'),
            'merk' => $legacy('merk'),
            'pabrik' => $input['pabrik'] ?? null,

            'rangka' => $legacy('rangka'),
            'mesin' => $legacy('nomor_mesin'),
            'polisi' => $legacy('polisi'),
            'bpkb' => $legacy('bpkb'),

            'guna' => $input['guna'] ?? null,
            'fungsi' => $input['fungsi'] ?? null,
            'struktur' => $input['struktur'] ?? null,
            'kondisi' => $input['kondisi'] ?? null,
            'ket' => $input['ket'] ?? null,

            'updated_at' => now(),
        ];
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

    public function storeMesin(Request $request)
    {
        $input = $this->validasiMesin($request, true);
        $cat = $this->mesinKategori();

        $files = [];

        try {
            DB::transaction(function () use (
                $request,
                $input,
                $cat,
                &$files
            ) {
                // Kunci transaksi sumber agar tidak diproses bersamaan.
                $source = DB::table('nilai_aktivas')
                    ->where('id', $input['id_nilai_aktiva'])
                    ->where('cat', $cat)
                    ->where('stat', 0)
                    ->lockForUpdate()
                    ->first();

                if (
                    !$source
                    || !$source->id_lokasi
                    || !$source->dep
                    || !$source->div
                ) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' =>
                        'Transaksi pending tidak tersedia atau Lokasi, Departemen, Divisi belum lengkap.'
                    ]);
                }

                // Cegah satu transaksi dipakai dua barang.
                $used = DB::table('mesins')
                    ->where('id_voucher2', $source->id)
                    ->exists();

                if ($used) {
                    throw ValidationException::withMessages([
                        'id_nilai_aktiva' =>
                        'Transaksi Nilai Aset ini sudah digunakan oleh data Mesin.'
                    ]);
                }

                $data = $this->fieldsMesin($input);

                // Data organisasi berasal dari database.
                $data['id_lokasi'] = (int) $source->id_lokasi;
                $data['id_departemen'] = (int) $source->dep;
                $data['id_div'] = (int) $source->div;

                // Hubungan dengan transaksi Nilai Aset.
                $data['id_voucher2'] = (int) $source->id;
                $data['jenis'] = (int) ($source->jenisn ?? 0);

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
            ->route('kib.mesin')
            ->with(
                'success',
                'Data Peralatan dan Mesin berhasil disimpan.'
            );
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

                $data = $this->fieldsMesin($input);

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
                !DB::table('mesins')
                    ->where('id_voucher2', $row->id_voucher2)
                    ->exists()
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
                "TRIM(COALESCE(d.nama_dep, d.kode_dep, '')) AS departemen"
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
            ->where('g.id_lokasi', $lokasi)
            ->select('g.*')
            ->selectRaw(
                "TRIM(COALESCE(b.nama_barang, '')) AS nama_barang"
            )
            ->selectRaw(
                "TRIM(COALESCE(b.kode_barang, '')) AS kode_barang"
            )
            ->selectRaw(
                "TRIM(COALESCE(d.nama_dep, d.kode_dep, '')) AS departemen"
            )
            ->selectRaw(
                "TRIM(COALESCE(v.nama_div, '')) AS divisi"
            )
            ->orderBy('d.nama_dep')
            ->orderBy('v.nama_div')
            ->orderByDesc('g.id')
            ->get();

        return response()->json([
            'success' => true,
            'lokasi' => $location,
            'data' => $rows,
        ]);
    }

    /*
        |--------------------------------------------------------------------------
        | DETAIL NILAI GEDUNG BERDASARKAN LOKASI
        |--------------------------------------------------------------------------
        */
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
                'd.nama_dep as departemen',
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
                "TRIM(COALESCE(d.nama_dep, d.kode_dep, '')) AS departemen"
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
        bool $creating
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

        if ($creating) {
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

                    if ($exists) {
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
                    !DB::table('gedungs')
                        ->where(
                            'nilai_aktiva_id',
                            $row->nilai_aktiva_id
                        )
                        ->exists()
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
                ->get()
                : [],

            'departemen' => Schema::hasTable('departemens')
                ? DB::table('departemens')
                ->select('id', 'nama_dep')
                ->orderBy('nama_dep')
                ->get()
                : [],

            'divisi' => Schema::hasTable('divisis')
                ? DB::table('divisis')
                ->select('id', 'id_dep', 'nama_div')
                ->orderBy('nama_div')
                ->get()
                : [],

            'bahan' => Schema::hasTable('bahans')
                ? DB::table('bahans')
                ->select('id', 'nama')
                ->orderBy('nama')
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
        Request $request
    ): array {

        return $request->validate([

            'nama_aset' => [
                'required',
                'string',
                'max:500',
            ],

            'lokasi' => [
                'required',
                'string',
                'max:500',
            ],

            'alamat' => [
                'nullable',
                'string',
                'max:500',
            ],

            'departemen' => [
                'nullable',
                'string',
                'max:255',
            ],

            'divisi' => [
                'nullable',
                'string',
                'max:255',
            ],

            'kode_inventaris' => [
                'required',
                'string',
                'max:255',
            ],

            'nomor_register' => [
                'required',
                'string',
                'max:255',
            ],

            'bahan' => [
                'nullable',
                'string',
                'max:255',
            ],

            'tahun' => [
                'required',
                'integer',
                'between:1900,2100',
            ],

            'jumlah_unit' => [
                'required',
                'integer',
                'min:1',
            ],

            'kondisi' => [
                'required',
                Rule::in([
                    'BAIK',
                    'CUKUP',
                    'RUSAK RINGAN',
                    'RUSAK BERAT',
                ]),
            ],

            'asal_perolehan' => [
                'nullable',
                'string',
                'max:255',
            ],

            'keterangan' => [
                'nullable',
                'string',
            ],

            'foto' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

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
                'kode_inventaris',
                'nomor_register',
                'bahan',
                'tahun',
                'jumlah_unit',
                'kondisi',
                'asal_perolehan',
                'keterangan',
            ] as $key
        ) {

            $result[$key] = $data[$key] ?? null;
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

            'items' => $items,

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

        $kfMasterOptions = [

            // MASTER LOKASI
            'lokasi' => DB::table('lokasis')
                ->select('id', 'lokasi', 'alamat')
                ->whereNotNull('lokasi')
                ->orderBy('lokasi')
                ->get(),

            // MASTER DEPARTEMEN
            'departemen' => DB::table('departemens')
                ->select('id', 'nama_dep')
                ->whereNotNull('nama_dep')
                ->orderBy('nama_dep')
                ->get(),

            // MASTER DIVISI
            'divisi' => DB::table('divisis')
                ->select('id', 'id_dep', 'nama_div')
                ->whereNotNull('nama_div')
                ->orderBy('nama_div')
                ->get(),

        ];


        return view('kib.konstruksi', compact(
            'items',
            'total',
            'nilai',
            'jumlahLokasi',
            'search',
            'category',
            'view',
            'archiveCount',
            'suggestions',
            'kfMasterOptions'
        ));
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDASI INPUT KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    private function validasiKonstruksiManual(
        Request $request
    ): array {

        $request->merge([
            'kategori' => strtoupper(
                trim((string) $request->input('kategori'))
            ),
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
                'nullable',
                'string',
                'max:255',
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

        return [
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
            $data['departemen_manual'] ?? null,

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
            $request
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
                'd.nama_dep as departemen',
                'd.kode_dep',
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

                    $lokasi->nilai = (int) (
                        $valueCounts
                        ->get($lokasi->id)
                        ->total
                        ?? 0
                    );

                    return $lokasi;
                }
            );

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

            ->get();

        $barangs = DB::table('barangs')

            ->select(
                'id',
                'nama_barang',
                'kode_barang'
            )

            ->orderBy('nama_barang')

            ->get();

        $bahans = DB::table('bahans')

            ->select(
                'id',
                'nama'
            )

            ->orderBy('nama')

            ->get();

        $departemens = DB::table('departemens')

            ->select(
                'id',
                'nama_dep'
            )

            ->orderBy('nama_dep')

            ->get();

        $divisis = DB::table('divisis')

            ->select(
                'id',
                'id_dep',
                'nama_div'
            )

            ->orderBy('nama_div')

            ->get();

        $ruangans = DB::table('ruangans')

            ->select('nama_ruang')

            ->orderBy('nama_ruang')

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
                'd.nama_dep'
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

                        'departemen' => trim(
                            (string) $item->departemen
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

            'data' => $rows

                ->map(
                    fn($row) => $this->kirResource(
                        $row,
                        $materials
                    )
                )

                ->values(),
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
        return [

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

                    DB::table('kirs')
                        ->insert($record);

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
}
