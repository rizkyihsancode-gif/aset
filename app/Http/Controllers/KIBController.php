<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

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
                'luas_tunjuk'
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


        return view(
            'kib.tanah',
            compact(
                'tanahs',
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
}
