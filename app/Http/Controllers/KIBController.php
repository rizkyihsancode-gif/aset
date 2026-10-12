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
                'UPPER(BTRIM(a.kib)) = ?',
                ['TANAH']
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
                    'UPPER(BTRIM(a.kib)) = ?',
                    ['TANAH']
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
                ->whereRaw('UPPER(BTRIM(a.kib)) = ?', ['TANAH'])
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
                'UPPER(BTRIM(a.kib)) = ?',
                ['TANAH']
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
                ->whereRaw('UPPER(BTRIM(a.kib)) = ?', ['TANAH'])
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
                ->whereRaw('UPPER(BTRIM(a.kib)) = ?', ['TANAH'])
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
| STORE K.I.B TANAH
|--------------------------------------------------------------------------
|
| Hanya transaksi:
|
| jenisn = 1
| stat   = 0
| cat    = Tanah
|
| yang boleh membuat data Tanah.
|
*/

    public function store(
        Request $request,
        KibNotificationService $notifications
    ) {
        /*
    |--------------------------------------------------------------------------
    | VALIDASI FORM TANAH
    |--------------------------------------------------------------------------
    */

        $input =
            $this->validateInput(
                $request
            );


        /*
    |--------------------------------------------------------------------------
    | CATEGORY TANAH
    |--------------------------------------------------------------------------
    */

        $categoryId =
            $notifications
            ->categoryId(
                'tanah'
            );


        if (
            $categoryId === null
        ) {

            throw ValidationException::withMessages([
                'id_nilai_aktiva' =>
                'Golongan K.I.B Tanah tidak ditemukan.',
            ]);
        }


        $newFile = null;


        try {

            DB::transaction(
                function () use (
                    $input,
                    $request,
                    $categoryId,
                    &$newFile
                ) {

                    /*
                |--------------------------------------------------------------------------
                | AMBIL TRANSAKSI SUMBER
                |--------------------------------------------------------------------------
                |
                | Jangan percaya id_lokasi dari browser.
                | Lokasi diambil langsung dari nilai_aktivas.
                |
                */

                    $source = DB::table(
                        'nilai_aktivas as n'
                    )

                        ->join(
                            'aktivas as a',
                            'a.id',
                            '=',
                            'n.id_aktiva'
                        )

                        ->where(
                            'n.id',
                            $input['id_nilai_aktiva']
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
                    | PENAMBAHAN ASET SAJA
                    |--------------------------------------------------------------------------
                    */

                        ->where(
                            'n.jenisn',
                            1
                        )

                        /*
                    |--------------------------------------------------------------------------
                    | GOLONGAN TANAH
                    |--------------------------------------------------------------------------
                    */

                        ->where(
                            'n.cat',
                            $categoryId
                        )

                        /*
                    |--------------------------------------------------------------------------
                    | VALIDASI AKTIVA K.I.B TANAH
                    |--------------------------------------------------------------------------
                    */

                        ->whereRaw(
                            'UPPER(BTRIM(a.kib)) = ?',
                            [
                                'TANAH',
                            ]
                        )

                        ->select(
                            'n.id',
                            'n.id_lokasi',
                            'n.jenisn',
                            'n.stat',
                            'n.cat'
                        )

                        /*
                     * Mencegah transaksi yang sama
                     * diproses bersamaan oleh dua request.
                     */
                        ->lockForUpdate()

                        ->first();


                    /*
                |--------------------------------------------------------------------------
                | SUMBER TIDAK VALID
                |--------------------------------------------------------------------------
                */

                    if (
                        !$source
                        ||
                        !$source->id_lokasi
                    ) {

                        throw ValidationException::withMessages([

                            'id_nilai_aktiva' =>
                            'Transaksi Penambahan Aset Tanah tidak tersedia atau sudah diproses.',

                        ]);
                    }


                    /*
                |--------------------------------------------------------------------------
                | DOUBLE CHECK JENIS
                |--------------------------------------------------------------------------
                */

                    if (
                        (int) $source->jenisn
                        !== 1
                    ) {

                        throw ValidationException::withMessages([

                            'id_nilai_aktiva' =>
                            'Hanya transaksi Penambahan Aset yang dapat dibuat menjadi data K.I.B Tanah.',

                        ]);
                    }


                    /*
                |--------------------------------------------------------------------------
                | CEGAH DUPLIKASI
                |--------------------------------------------------------------------------
                */

                    if (
                        DB::table(
                            'tanahs'
                        )
                        ->where(
                            'nilai_aktiva_id',
                            $source->id
                        )
                        ->exists()
                    ) {

                        throw ValidationException::withMessages([

                            'id_nilai_aktiva' =>
                            'Transaksi Nilai Aset ini sudah terhubung dengan data Tanah.',

                        ]);
                    }


                    /*
                |--------------------------------------------------------------------------
                | DATA TANAH
                |--------------------------------------------------------------------------
                */

                    $data =
                        $this->tanahFields(
                            $input
                        );


                    /*
                 * Lokasi berasal dari transaksi Nilai Aset,
                 * bukan input hidden browser.
                 */
                    $data['id_lokasi'] =
                        (int) $source->id_lokasi;


                    /*
                 * Simpan hubungan transaksi sumber.
                 */
                    $data['nilai_aktiva_id'] =
                        (int) $source->id;


                    /*
                |--------------------------------------------------------------------------
                | NILAI LEGACY
                |--------------------------------------------------------------------------
                |
                | Nilai Tanah sekarang dihitung dari nilai_aktivas.
                |
                | Jangan copy nilai transaksi ke tanahs.nilai
                | karena kolom lama INTEGER dapat overflow.
                |
                */

                    $data['nilai'] = null;


                    $data['nilai_now'] = null;


                    /*
                |--------------------------------------------------------------------------
                | USER DAN TIMESTAMP
                |--------------------------------------------------------------------------
                */

                    $data['user'] =
                        Auth::id();


                    $data['created_at'] =
                        now();


                    $data['updated_at'] =
                        now();


                    /*
                |--------------------------------------------------------------------------
                | INSERT TANAH
                |--------------------------------------------------------------------------
                */

                    $tanahId =
                        DB::table(
                            'tanahs'
                        )
                        ->insertGetId(
                            $data
                        );


                    /*
                |--------------------------------------------------------------------------
                | PDF SERTIFIKAT
                |--------------------------------------------------------------------------
                */

                    $newFile =
                        $this->uploadPdf(
                            $request,
                            (int) $tanahId
                        );


                    /*
                |--------------------------------------------------------------------------
                | TRANSAKSI SELESAI DIPROSES
                |--------------------------------------------------------------------------
                |
                | Ini membuat:
                |
                | stat 0 → 1
                |
                | sehingga:
                |
                | - badge berkurang
                | - transaksi hilang dari daftar Pilih
                |
                */

                    DB::table(
                        'nilai_aktivas'
                    )
                        ->where(
                            'id',
                            $source->id
                        )
                        ->update([
                            'stat' =>
                            1,

                            'updated_at' =>
                            now(),
                        ]);
                }
            );
        } catch (\Throwable $exception) {

            /*
        |--------------------------------------------------------------------------
        | CLEANUP FILE
        |--------------------------------------------------------------------------
        */

            if (
                $newFile
                &&
                Storage::disk(
                    'local'
                )->exists(
                    $newFile
                )
            ) {

                Storage::disk(
                    'local'
                )->delete(
                    $newFile
                );
            }


            throw $exception;
        }


        /*
    |--------------------------------------------------------------------------
    | CLEAR CACHE SERVICE
    |--------------------------------------------------------------------------
    */

        $notifications
            ->clearCache();


        return redirect()

            ->route(
                'kib.tanah'
            )

            ->with(
                'success',
                'Data K.I.B Tanah berhasil disimpan.'
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

    public function destroy(
        int $tanah
    ) {
        $paths = [];


        DB::transaction(
            function () use (
                $tanah,
                &$paths
            ) {

                $row =
                    DB::table(
                        'tanahs'
                    )

                    ->where(
                        'id',
                        $tanah
                    )

                    ->lockForUpdate()

                    ->first();


                abort_unless(
                    $row,
                    404
                );


                /*
            |--------------------------------------------------------------------------
            | PDF BARU YANG DIKELOLA APLIKASI BARU
            |--------------------------------------------------------------------------
            */

                $newPdfQuery =
                    $this
                    ->pdfQuery()

                    ->where(
                        'p.id_tanah',
                        $tanah
                    )

                    ->where(
                        'p.dok',
                        'like',
                        'tanah/sertifikat/%'
                    );


                $paths =
                    (clone $newPdfQuery)

                    ->pluck(
                        'p.dok'
                    )

                    ->all();


                $newPdfQuery
                    ->delete();


                /*
            |--------------------------------------------------------------------------
            | DELETE TANAH
            |--------------------------------------------------------------------------
            */

                DB::table(
                    'tanahs'
                )
                    ->where(
                        'id',
                        $tanah
                    )
                    ->delete();


                /*
            |--------------------------------------------------------------------------
            | KEMBALIKAN SUMBER MENJADI PENDING
            |--------------------------------------------------------------------------
            |
            | Jika sertifikat yang dibuat dari Nilai Aset dihapus,
            | Penambahan Aset tersebut harus dapat diproses kembali.
            |
            */

                if (
                    !empty($row->nilai_aktiva_id)
                ) {

                    DB::table(
                        'nilai_aktivas'
                    )

                        ->where(
                            'id',
                            $row->nilai_aktiva_id
                        )

                        ->where(
                            'jenisn',
                            1
                        )

                        ->update([

                            'stat' =>
                            0,

                            'updated_at' =>
                            now(),
                        ]);
                }
            }
        );


        /*
    |--------------------------------------------------------------------------
    | DELETE FILE FISIK
    |--------------------------------------------------------------------------
    */

        foreach (
            $paths
            as $path
        ) {

            if (
                is_string(
                    $path
                )
                &&
                str_starts_with(
                    $path,
                    'tanah/sertifikat/'
                )
            ) {

                Storage::disk(
                    'local'
                )->delete(
                    $path
                );
            }
        }


        return redirect()

            ->route(
                'kib.tanah'
            )

            ->with(
                'success',
                'Sertifikat Tanah berhasil dihapus.'
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
}
