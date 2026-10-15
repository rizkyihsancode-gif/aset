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
        $totalPending = DB::table('nilai_aktivas')
            ->where('cat', $cat)
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



    /*
    |--------------------------------------------------------------------------
    | 03. DATA PENDING NILAI ASET MESIN
    |--------------------------------------------------------------------------
    |
    | Endpoint:
    | GET /kib/mesin/pending
    |
    | Mengikuti kondisi pending database:
    | cat = golongan Mesin
    | stat = 0
    |
    | Jenis transaksi lama dipertahankan.
    | Penambahan Nilai baru harus disimpan dengan stat=1.
    |
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
            return [
                'id' => (int) $row->id,
                'no_voucher' => trim((string) $row->no_voucher),
                'tgl_voucher' => $row->tgl_voucher,

                'nilai' => (int) ($row->nilai ?? 0),
                'urai' => $row->urai,
                'tahun' => $row->tahun,

                'id_lokasi' => $row->id_lokasi,
                'lokasi' => trim((string) $row->lokasi),
                'alamat' => trim((string) $row->alamat),

                'dep' => $row->dep,
                'departemen' => trim((string) $row->departemen),

                'div' => $row->div,
                'divisi' => trim((string) $row->divisi),

                'jenisn' => (int) ($row->jenisn ?? 0),
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
            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )
            ->where('n.cat', $cat)
            ->where('n.stat', 0)
            ->where('n.jenisn', 1);

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
}
