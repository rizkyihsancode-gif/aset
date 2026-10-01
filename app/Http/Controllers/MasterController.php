<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;



class MasterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | MASTER DATA - BARANG
    |--------------------------------------------------------------------------
    */

    public function dataBarang()
    {
        /*
        |--------------------------------------------------------------------------
        | CEK KOLOM TIMESTAMP
        |--------------------------------------------------------------------------
        */

        $hasCreatedAt = Schema::hasColumn(
            'barangs',
            'created_at'
        );

        $hasUpdatedAt = Schema::hasColumn(
            'barangs',
            'updated_at'
        );


        /*
        |--------------------------------------------------------------------------
        | DATA BARANG
        |--------------------------------------------------------------------------
        |
        | Golongan pada tabel barangs berisi ID dari tabel golongans.
        |
        */

        $barangsQuery = DB::table('barangs')
            ->leftJoin(
                'golongans',
                DB::raw(
                    'CAST(barangs.golongan AS BIGINT)'
                ),
                '=',
                'golongans.id'
            )
            ->select(
                'barangs.id',
                'barangs.nama_barang',
                'barangs.kode_barang',
                'barangs.golongan',
                'golongans.nama as nama_golongan'
            );


        /*
        |--------------------------------------------------------------------------
        | TIMESTAMP
        |--------------------------------------------------------------------------
        */

        if ($hasCreatedAt) {

            $barangsQuery->addSelect(
                'barangs.created_at'
            );
        }


        if ($hasUpdatedAt) {

            $barangsQuery->addSelect(
                'barangs.updated_at'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | URUTAN DATA
        |--------------------------------------------------------------------------
        |
        | ID terbesar = data yang paling baru dimasukkan.
        |
        | Karena sequence PostgreSQL sudah diperbaiki,
        | record baru akan selalu memiliki ID terbesar.
        |
        */

        $barangsQuery
            ->orderByDesc(
                'barangs.id'
            );


        $barangs =
            $barangsQuery->get();


        /*
        |--------------------------------------------------------------------------
        | DATA GOLONGAN
        |--------------------------------------------------------------------------
        */

        $golongans = DB::table('golongans')
            ->select(
                'id',
                'nama'
            )
            ->orderBy(
                'id'
            )
            ->get();


        /*
        |--------------------------------------------------------------------------
        | TOTAL BARANG
        |--------------------------------------------------------------------------
        */

        $totalBarang =
            DB::table('barangs')
            ->count();


        /*
        |--------------------------------------------------------------------------
        | TOTAL GOLONGAN
        |--------------------------------------------------------------------------
        */

        $totalGolongan =
            DB::table('golongans')
            ->count();


        /*
        |--------------------------------------------------------------------------
        | DISTRIBUSI BARANG PER GOLONGAN
        |--------------------------------------------------------------------------
        */

        $distribusiGolongan = DB::table('barangs')
            ->leftJoin(
                'golongans',
                DB::raw(
                    'CAST(barangs.golongan AS BIGINT)'
                ),
                '=',
                'golongans.id'
            )
            ->select(
                'golongans.nama as golongan',
                DB::raw(
                    'COUNT(barangs.id) as total'
                )
            )
            ->groupBy(
                'golongans.nama'
            )
            ->orderByDesc(
                'total'
            )
            ->get();


        /*
        |--------------------------------------------------------------------------
        | BARANG TERBARU
        |--------------------------------------------------------------------------
        |
        | Ambil 5 ID terbesar.
        |
        | created_at tetap digunakan untuk menampilkan
        | tanggal saat barang dimasukkan.
        |
        */

        $barangTerbaruQuery = DB::table('barangs')
            ->leftJoin(
                'golongans',
                DB::raw(
                    'CAST(barangs.golongan AS BIGINT)'
                ),
                '=',
                'golongans.id'
            )
            ->select(
                'barangs.id',
                'barangs.nama_barang',
                'barangs.kode_barang',
                'barangs.golongan',
                'golongans.nama as nama_golongan'
            );


        if ($hasCreatedAt) {

            $barangTerbaruQuery
                ->addSelect(
                    'barangs.created_at'
                );
        }


        if ($hasUpdatedAt) {

            $barangTerbaruQuery
                ->addSelect(
                    'barangs.updated_at'
                );
        }


        $barangTerbaru =
            $barangTerbaruQuery
            ->orderByDesc(
                'barangs.id'
            )
            ->limit(5)
            ->get();


        /*
        |--------------------------------------------------------------------------
        | UPDATE TERAKHIR
        |--------------------------------------------------------------------------
        */

        $updateTerakhirLabel =
            'Belum ada data';


        $updateTerakhirDetail =
            'Belum ada perubahan';


        /*
         * Prioritas updated_at.
         */

        if ($hasUpdatedAt) {

            $barangTerakhir = DB::table('barangs')
                ->whereNotNull(
                    'updated_at'
                )
                ->orderByDesc(
                    'updated_at'
                )
                ->orderByDesc(
                    'id'
                )
                ->first();


            if ($barangTerakhir) {

                $tanggal = \Carbon\Carbon::parse(
                    $barangTerakhir->updated_at
                )->locale('id');


                if ($tanggal->isToday()) {

                    $updateTerakhirLabel =
                        'Hari Ini';
                } elseif ($tanggal->isYesterday()) {

                    $updateTerakhirLabel =
                        'Kemarin';
                } else {

                    $updateTerakhirLabel =
                        $tanggal->diffForHumans();
                }


                $updateTerakhirDetail =
                    $tanggal->translatedFormat(
                        'd M Y, H:i'
                    );
            }
        }

        /*
         * Kalau updated_at tidak tersedia,
         * gunakan created_at.
         */ elseif ($hasCreatedAt) {

            $barangTerakhir = DB::table('barangs')
                ->whereNotNull(
                    'created_at'
                )
                ->orderByDesc(
                    'created_at'
                )
                ->orderByDesc(
                    'id'
                )
                ->first();


            if ($barangTerakhir) {

                $tanggal = Carbon::parse(
                    $barangTerakhir->created_at
                )->locale('id');


                if ($tanggal->isToday()) {

                    $updateTerakhirLabel =
                        'Hari Ini';
                } elseif ($tanggal->isYesterday()) {

                    $updateTerakhirLabel =
                        'Kemarin';
                } else {

                    $updateTerakhirLabel =
                        $tanggal->diffForHumans();
                }


                $updateTerakhirDetail =
                    $tanggal->translatedFormat(
                        'd M Y, H:i'
                    );
            }
        }

        /*
         * Fallback terakhir.
         */ else {

            $barangTerakhir =
                DB::table('barangs')
                ->orderByDesc(
                    'id'
                )
                ->first();


            if ($barangTerakhir) {

                $updateTerakhirLabel =
                    'Data Terbaru';


                $updateTerakhirDetail =
                    'Barang ID #' .
                    $barangTerakhir->id;
            }
        }


        /*
|--------------------------------------------------------------------------
| RIWAYAT PERUBAHAN BARANG
|--------------------------------------------------------------------------
*/

        $barangActivityLogs =
            DB::table(
                'master_data_activity_logs'
            )
            ->where(
                'module',
                'barang'
            )
            ->whereIn(
                'action',
                [
                    'created',
                    'deleted'
                ]
            )
            ->orderByDesc(
                'created_at'
            )
            ->orderByDesc(
                'id'
            )
            ->get();


        /*
|--------------------------------------------------------------------------
| JUMLAH TAMBAH
|--------------------------------------------------------------------------
*/

        $barangTambah =
            $barangActivityLogs
            ->where(
                'action',
                'created'
            )
            ->count();


        /*
|--------------------------------------------------------------------------
| JUMLAH HAPUS
|--------------------------------------------------------------------------
*/

        $barangHapus =
            $barangActivityLogs
            ->where(
                'action',
                'deleted'
            )
            ->count();


        /*
|--------------------------------------------------------------------------
| DELTA
|--------------------------------------------------------------------------
|
| Contoh:
|
| Tambah 3
| Hapus  1
|
| Delta = +2
|
*/

        $barangDelta =
            $barangTambah -
            $barangHapus;


        /*
        |--------------------------------------------------------------------------
        | RETURN VIEW
        |--------------------------------------------------------------------------
        */

        return view(
            'master.data_barang',
            compact(
                'barangs',
                'golongans',
                'totalBarang',
                'totalGolongan',
                'distribusiGolongan',
                'barangTerbaru',
                'hasCreatedAt',
                'hasUpdatedAt',
                'updateTerakhirLabel',
                'updateTerakhirDetail',
                'barangDelta',
                'barangActivityLogs',
                'barangTambah',
                'barangHapus'
            )
        );
    }


    /*
    |--------------------------------------------------------------------------
    | TAMBAH BARANG
    |--------------------------------------------------------------------------
    */

    public function storebarang(
        Request $request
    ) {

        /*
        |--------------------------------------------------------------------------
        | VALIDASI
        |--------------------------------------------------------------------------
        */

        $validated =
            $request->validate([
                'nama_barang' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'kode_barang' => [
                    'required',
                    'string',
                    'max:255',
                    'unique:barangs,kode_barang',
                ],

                'golongan' => [
                    'required',
                    'integer',
                    'exists:golongans,id',
                ],
            ]);


        /*
        |--------------------------------------------------------------------------
        | DATA INSERT
        |--------------------------------------------------------------------------
        */

        $insertData = [

            'nama_barang' =>
            trim(
                $validated['nama_barang']
            ),

            'kode_barang' =>
            trim(
                $validated['kode_barang']
            ),

            'golongan' =>
            $validated['golongan'],

        ];


        /*
        |--------------------------------------------------------------------------
        | CREATED AT
        |--------------------------------------------------------------------------
        */

        if (
            Schema::hasColumn(
                'barangs',
                'created_at'
            )
        ) {

            $insertData['created_at'] =
                now();
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATED AT
        |--------------------------------------------------------------------------
        */

        if (
            Schema::hasColumn(
                'barangs',
                'updated_at'
            )
        ) {

            $insertData['updated_at'] =
                now();
        }


        /*
        |--------------------------------------------------------------------------
        | INSERT DATABASE
        |--------------------------------------------------------------------------
        */

        $id =
            DB::table('barangs')
            ->insertGetId(
                $insertData
            );

        /*
|--------------------------------------------------------------------------
| LOG - BARANG DITAMBAHKAN
|--------------------------------------------------------------------------
*/

        DB::table(
            'master_data_activity_logs'
        )
            ->insert([

                'module' =>
                'barang',

                'record_id' =>
                $id,

                'record_name' =>
                $insertData['nama_barang'],

                'record_code' =>
                $insertData['kode_barang'] ?? null,

                'action' =>
                'created',

                'record_created_at' =>
                $insertData['created_at'] ?? now(),

                'created_at' =>
                now(),

                'updated_at' =>
                now(),

            ]);



        /*
        |--------------------------------------------------------------------------
        | AJAX RESPONSE
        |--------------------------------------------------------------------------
        */

        if (
            $request->expectsJson() ||
            $request->ajax()
        ) {

            return response()->json(
                [
                    'success' =>
                    true,

                    'message' =>
                    'Data barang berhasil ditambahkan.',

                    'id' =>
                    $id,

                    'created_at' =>
                    $insertData['created_at'] ?? null,

                    'updated_at' =>
                    $insertData['updated_at'] ?? null,
                ],
                201
            );
        }


        /*
        |--------------------------------------------------------------------------
        | NORMAL RESPONSE
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route(
                'master.data_barang'
            )
            ->with(
                'success',
                'Data barang berhasil ditambahkan.'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE BARANG
    |--------------------------------------------------------------------------
    */

    public function updatebarang(
        Request $request,
        int $id
    ) {

        /*
        |--------------------------------------------------------------------------
        | CEK DATA
        |--------------------------------------------------------------------------
        */

        $barang =
            DB::table('barangs')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$barang) {

            if (
                $request->expectsJson() ||
                $request->ajax()
            ) {

                return response()->json(
                    [
                        'success' =>
                        false,

                        'message' =>
                        'Data barang tidak ditemukan.',
                    ],
                    404
                );
            }


            return redirect()
                ->route(
                    'master.data_barang'
                )
                ->with(
                    'error',
                    'Data barang tidak ditemukan.'
                );
        }


        /*
        |--------------------------------------------------------------------------
        | VALIDASI
        |--------------------------------------------------------------------------
        */

        $validated =
            $request->validate([
                'nama_barang' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'kode_barang' => [
                    'required',
                    'string',
                    'max:255',

                    Rule::unique(
                        'barangs',
                        'kode_barang'
                    )->ignore(
                        $id
                    ),
                ],

                'golongan' => [
                    'required',
                    'integer',
                    'exists:golongans,id',
                ],
            ]);


        /*
        |--------------------------------------------------------------------------
        | DATA UPDATE
        |--------------------------------------------------------------------------
        */

        $updateData = [

            'nama_barang' =>
            trim(
                $validated['nama_barang']
            ),

            'kode_barang' =>
            trim(
                $validated['kode_barang']
            ),

            'golongan' =>
            $validated['golongan'],

        ];


        /*
        |--------------------------------------------------------------------------
        | UPDATED AT
        |--------------------------------------------------------------------------
        |
        | created_at TIDAK diubah saat edit.
        |
        */

        if (
            Schema::hasColumn(
                'barangs',
                'updated_at'
            )
        ) {

            $updateData['updated_at'] =
                now();
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE DATABASE
        |--------------------------------------------------------------------------
        */

        DB::table('barangs')
            ->where(
                'id',
                $id
            )
            ->update(
                $updateData
            );


        /*
        |--------------------------------------------------------------------------
        | AJAX RESPONSE
        |--------------------------------------------------------------------------
        */

        if (
            $request->expectsJson() ||
            $request->ajax()
        ) {

            return response()->json([
                'success' =>
                true,

                'message' =>
                'Data barang berhasil diperbarui.',

                'id' =>
                $id,

                'updated_at' =>
                $updateData['updated_at'] ?? null,
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | NORMAL RESPONSE
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route(
                'master.data_barang'
            )
            ->with(
                'success',
                'Data barang berhasil diperbarui.'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE BARANG
    |--------------------------------------------------------------------------
    */

    public function deletebarang(
        Request $request,
        int $id
    ) {

        /*
        |--------------------------------------------------------------------------
        | CEK DATA
        |--------------------------------------------------------------------------
        */

        $barang =
            DB::table('barangs')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$barang) {

            if (
                $request->expectsJson() ||
                $request->ajax()
            ) {

                return response()->json(
                    [
                        'success' =>
                        false,

                        'message' =>
                        'Data barang tidak ditemukan.',
                    ],
                    404
                );
            }


            return redirect()
                ->route(
                    'master.data_barang'
                )
                ->with(
                    'error',
                    'Data barang tidak ditemukan.'
                );
        }


        /*
|--------------------------------------------------------------------------
| DELETE + ACTIVITY LOG
|--------------------------------------------------------------------------
|
| Gunakan transaction supaya:
|
| - log berhasil + delete berhasil
| ATAU
| - keduanya batal
|
*/

        DB::transaction(
            function () use (
                $barang,
                $id
            ) {

                /*
         * Simpan snapshot sebelum record hilang.
         */

                DB::table(
                    'master_data_activity_logs'
                )
                    ->insert([

                        'module' =>
                        'barang',

                        'record_id' =>
                        $barang->id,

                        'record_name' =>
                        $barang->nama_barang,

                        'record_code' =>
                        $barang->kode_barang ?? null,

                        'action' =>
                        'deleted',

                        'record_created_at' =>
                        $barang->created_at ?? null,

                        'created_at' =>
                        now(),

                        'updated_at' =>
                        now(),

                    ]);


                /*
         * Baru hapus data Barang.
         */

                DB::table(
                    'barangs'
                )
                    ->where(
                        'id',
                        $id
                    )
                    ->delete();
            }
        );


        /*
        |--------------------------------------------------------------------------
        | AJAX RESPONSE
        |--------------------------------------------------------------------------
        */

        if (
            $request->expectsJson() ||
            $request->ajax()
        ) {

            return response()->json([
                'success' =>
                true,

                'message' =>
                'Data barang berhasil dihapus.',

                'id' =>
                $id,
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | NORMAL RESPONSE
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route(
                'master.data_barang'
            )
            ->with(
                'success',
                'Data barang berhasil dihapus.'
            );
    }


    /*
|--------------------------------------------------------------------------
| MASTER DATA - DEPARTEMEN
|--------------------------------------------------------------------------
|
| STRUKTUR DATABASE LEGACY:
|
| departemens.id
| departemens.nama_dep   = Kode Departemen
| departemens.kode_dep   = Nama Departemen
| departemens.created_at
| departemens.updated_at
| departemens.role
| departemens.img
|
*/


    /*
|--------------------------------------------------------------------------
| DATA DEPARTEMEN
|--------------------------------------------------------------------------
*/

    public function dataDepartemen()
    {
        /*
    |--------------------------------------------------------------------------
    | CEK TABLE
    |--------------------------------------------------------------------------
    */

        if (!Schema::hasTable('departemens')) {

            abort(
                500,
                'Tabel departemens tidak ditemukan pada database.'
            );
        }


        /*
    |--------------------------------------------------------------------------
    | CEK KOLOM
    |--------------------------------------------------------------------------
    */

        $hasCreatedAt =
            Schema::hasColumn(
                'departemens',
                'created_at'
            );


        $hasUpdatedAt =
            Schema::hasColumn(
                'departemens',
                'updated_at'
            );


        $hasRole =
            Schema::hasColumn(
                'departemens',
                'role'
            );


        $hasImg =
            Schema::hasColumn(
                'departemens',
                'img'
            );


        /*
    |--------------------------------------------------------------------------
    | QUERY DEPARTEMEN
    |--------------------------------------------------------------------------
    */

        $departemenQuery =
            DB::table('departemens')
            ->select(
                'departemens.id',
                'departemens.nama_dep',
                'departemens.kode_dep'
            );


        if ($hasCreatedAt) {

            $departemenQuery
                ->addSelect(
                    'departemens.created_at'
                );
        }


        if ($hasUpdatedAt) {

            $departemenQuery
                ->addSelect(
                    'departemens.updated_at'
                );
        }


        if ($hasRole) {

            $departemenQuery
                ->addSelect(
                    'departemens.role'
                );
        }


        if ($hasImg) {

            $departemenQuery
                ->addSelect(
                    'departemens.img'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | URUTAN DATA
    |--------------------------------------------------------------------------
    |
    | MASALAH DATABASE LAMA:
    |
    | Banyak data legacy:
    |
    | created_at = NULL
    |
    | Sedangkan data yang dibuat melalui web baru:
    |
    | created_at = timestamp
    |
    | Maka kita urutkan:
    |
    | 1. created_at yang tidak NULL
    | 2. created_at paling baru
    | 3. ID terbesar jika created_at sama
    | 4. data legacy NULL berada di bawah
    |
    */

        if ($hasCreatedAt) {

            $departemenQuery

                ->orderByRaw(
                    "
                CASE
                    WHEN departemens.created_at IS NULL
                    THEN 1
                    ELSE 0
                END ASC
                "
                )

                ->orderByDesc(
                    'departemens.created_at'
                )

                ->orderByDesc(
                    'departemens.id'
                );
        } else {

            /*
         * Fallback jika suatu saat database
         * tidak memiliki created_at.
         */

            $departemenQuery
                ->orderByDesc(
                    'departemens.id'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | GET DATA
    |--------------------------------------------------------------------------
    */

        $departemens =
            $departemenQuery
            ->get()
            ->map(
                function ($item) {

                    /*
                     * Database legacy menggunakan
                     * character / char.
                     *
                     * trim menghilangkan whitespace
                     * tanpa mengubah isi database.
                     */

                    $item->nama_dep =
                        trim(
                            (string)
                            $item->nama_dep
                        );


                    $item->kode_dep =
                        trim(
                            (string)
                            $item->kode_dep
                        );


                    /*
                     * Image.
                     */

                    if (
                        property_exists(
                            $item,
                            'img'
                        )
                    ) {

                        $item->img =
                            !empty($item->img)
                            ? trim(
                                (string)
                                $item->img
                            )
                            : null;


                        $item->image_url =
                            $this
                            ->departemenImageUrl(
                                $item->img
                            );
                    } else {

                        $item->img =
                            null;


                        $item->image_url =
                            null;
                    }


                    /*
                     * Role fallback.
                     */

                    if (
                        !property_exists(
                            $item,
                            'role'
                        )
                    ) {

                        $item->role =
                            null;
                    }


                    return $item;
                }
            );


        /*
    |--------------------------------------------------------------------------
    | TOTAL DEPARTEMEN
    |--------------------------------------------------------------------------
    */

        $totalDepartemen =
            $departemens
            ->count();


        /*
    |--------------------------------------------------------------------------
    | TOTAL DIVISI
    |--------------------------------------------------------------------------
    |
    | Ini hanya KPI.
    |
    | Bukan kolom departemens.
    |
    */

        $totalDivisi = 0;


        if (
            Schema::hasTable(
                'divisis'
            )
        ) {

            $totalDivisi =
                DB::table(
                    'divisis'
                )
                ->count();
        }


        /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

        $departemenActivityLogs =
            collect();


        $departemenTambah = 0;

        $departemenHapus = 0;

        $departemenDelta = 0;


        if (
            Schema::hasTable(
                'master_data_activity_logs'
            )
        ) {

            $departemenActivityLogs =
                DB::table(
                    'master_data_activity_logs'
                )
                ->where(
                    'module',
                    'departemen'
                )
                ->whereIn(
                    'action',
                    [
                        'created',
                        'deleted',
                    ]
                )
                ->orderByDesc(
                    'created_at'
                )
                ->orderByDesc(
                    'id'
                )
                ->get();


            /*
         * Total penambahan.
         */

            $departemenTambah =
                $departemenActivityLogs
                ->where(
                    'action',
                    'created'
                )
                ->count();


            /*
         * Total penghapusan.
         */

            $departemenHapus =
                $departemenActivityLogs
                ->where(
                    'action',
                    'deleted'
                )
                ->count();


            /*
         * Perubahan bersih.
         */

            $departemenDelta =
                $departemenTambah -
                $departemenHapus;
        }


        /*
    |--------------------------------------------------------------------------
    | RETURN VIEW
    |--------------------------------------------------------------------------
    */

        return view(
            'master.data_departemen',
            compact(
                'departemens',
                'totalDepartemen',
                'totalDivisi',
                'hasCreatedAt',
                'hasUpdatedAt',
                'hasRole',
                'hasImg',
                'departemenActivityLogs',
                'departemenTambah',
                'departemenHapus',
                'departemenDelta'
            )
        );
    }


    /*
|--------------------------------------------------------------------------
| STORE DEPARTEMEN
|--------------------------------------------------------------------------
*/

    public function storeDepartemen(
        Request $request
    ) {

        /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

        $validated =
            $request->validate(
                [

                    /*
                 * DATABASE LEGACY:
                 *
                 * nama_dep = KODE
                 */

                    'nama_dep' => [
                        'required',
                        'string',
                        'max:255',

                        Rule::unique(
                            'departemens',
                            'nama_dep'
                        ),
                    ],


                    /*
                 * DATABASE LEGACY:
                 *
                 * kode_dep = NAMA
                 */

                    'kode_dep' => [
                        'required',
                        'string',
                        'max:255',
                    ],


                    'role' => [
                        'nullable',
                        'integer',
                    ],


                    'img' => [
                        'nullable',
                        'image',
                        'mimes:jpg,jpeg,png,webp',
                        'max:2048',
                    ],

                ],
                [

                    'nama_dep.required' =>
                    'Kode Departemen wajib diisi.',


                    'nama_dep.unique' =>
                    'Kode Departemen sudah digunakan.',


                    'kode_dep.required' =>
                    'Nama Departemen wajib diisi.',


                    'role.integer' =>
                    'Role harus berupa angka.',


                    'img.image' =>
                    'File yang dipilih harus berupa image.',


                    'img.mimes' =>
                    'Image hanya boleh JPG, JPEG, PNG, atau WEBP.',


                    'img.max' =>
                    'Ukuran image maksimal 2 MB.',

                ]
            );


        /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

        $imageName = null;


        if (
            $request->hasFile(
                'img'
            )
        ) {

            $imageName =
                $this
                ->storeDepartemenImage(
                    $request->file(
                        'img'
                    )
                );
        }


        /*
    |--------------------------------------------------------------------------
    | DATA INSERT
    |--------------------------------------------------------------------------
    */

        $data = [

            /*
         * Kode Departemen.
         */

            'nama_dep' =>
            trim(
                $validated['nama_dep']
            ),


            /*
         * Nama Departemen.
         */

            'kode_dep' =>
            trim(
                $validated['kode_dep']
            ),

        ];


        /*
    |--------------------------------------------------------------------------
    | ROLE
    |--------------------------------------------------------------------------
    */

        if (
            Schema::hasColumn(
                'departemens',
                'role'
            )
        ) {

            $data['role'] =
                $validated['role']
                ?? null;
        }


        /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

        if (
            Schema::hasColumn(
                'departemens',
                'img'
            )
        ) {

            $data['img'] =
                $imageName;
        }


        /*
    |--------------------------------------------------------------------------
    | CREATED AT
    |--------------------------------------------------------------------------
    |
    | INI PENTING.
    |
    | Timestamp inilah yang membuat data baru
    | langsung berada di atas.
    |
    */

        if (
            Schema::hasColumn(
                'departemens',
                'created_at'
            )
        ) {

            $data['created_at'] =
                now();
        }


        /*
    |--------------------------------------------------------------------------
    | UPDATED AT
    |--------------------------------------------------------------------------
    */

        if (
            Schema::hasColumn(
                'departemens',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        /*
    |--------------------------------------------------------------------------
    | DATABASE TRANSACTION
    |--------------------------------------------------------------------------
    */

        try {

            $id =
                DB::transaction(
                    function () use (
                        $data
                    ) {

                        /*
                     * INSERT.
                     */

                        $id =
                            DB::table(
                                'departemens'
                            )
                            ->insertGetId(
                                $data
                            );


                        /*
                    |--------------------------------------------------------------------------
                    | ACTIVITY LOG
                    |--------------------------------------------------------------------------
                    */

                        if (
                            Schema::hasTable(
                                'master_data_activity_logs'
                            )
                        ) {

                            DB::table(
                                'master_data_activity_logs'
                            )
                                ->insert(
                                    [

                                        'module' =>
                                        'departemen',

                                        'record_id' =>
                                        $id,


                                        /*
                                     * Nama Departemen.
                                     */

                                        'record_name' =>
                                        $data['kode_dep'],


                                        /*
                                     * Kode Departemen.
                                     */

                                        'record_code' =>
                                        $data['nama_dep'],


                                        'action' =>
                                        'created',


                                        'record_created_at' =>
                                        $data['created_at']
                                            ??
                                            now(),


                                        'created_at' =>
                                        now(),


                                        'updated_at' =>
                                        now(),

                                    ]
                                );
                        }


                        return $id;
                    }
                );
        } catch (\Throwable $error) {

            /*
         * DB gagal:
         * hapus image yang telanjur upload.
         */

            if ($imageName) {

                $this
                    ->deleteDepartemenUploadedImage(
                        $imageName
                    );
            }


            throw $error;
        }


        /*
    |--------------------------------------------------------------------------
    | AJAX RESPONSE
    |--------------------------------------------------------------------------
    */

        if (
            $request->expectsJson()
            ||
            $request->ajax()
        ) {

            return response()
                ->json(
                    [

                        'success' =>
                        true,


                        'message' =>
                        'Departemen berhasil ditambahkan.',


                        'id' =>
                        $id,

                    ],
                    201
                );
        }


        /*
    |--------------------------------------------------------------------------
    | NORMAL RESPONSE
    |--------------------------------------------------------------------------
    */

        return redirect()
            ->route(
                'master.data_departemen'
            )
            ->with(
                'success',
                'Departemen berhasil ditambahkan.'
            );
    }


    /*
|--------------------------------------------------------------------------
| UPDATE DEPARTEMEN
|--------------------------------------------------------------------------
*/

    public function updateDepartemen(
        Request $request,
        int $id
    ) {

        /*
    |--------------------------------------------------------------------------
    | FIND DATA
    |--------------------------------------------------------------------------
    */

        $departemen =
            DB::table(
                'departemens'
            )
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$departemen) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()
                    ->json(
                        [

                            'success' =>
                            false,


                            'message' =>
                            'Data Departemen tidak ditemukan.',

                        ],
                        404
                    );
            }


            return redirect()
                ->route(
                    'master.data_departemen'
                )
                ->with(
                    'error',
                    'Data Departemen tidak ditemukan.'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

        $validated =
            $request->validate(
                [

                    'nama_dep' => [
                        'required',
                        'string',
                        'max:255',

                        Rule::unique(
                            'departemens',
                            'nama_dep'
                        )
                            ->ignore(
                                $id
                            ),
                    ],


                    'kode_dep' => [
                        'required',
                        'string',
                        'max:255',
                    ],


                    'role' => [
                        'nullable',
                        'integer',
                    ],


                    'img' => [
                        'nullable',
                        'image',
                        'mimes:jpg,jpeg,png,webp',
                        'max:2048',
                    ],

                ],
                [

                    'nama_dep.required' =>
                    'Kode Departemen wajib diisi.',


                    'nama_dep.unique' =>
                    'Kode Departemen sudah digunakan.',


                    'kode_dep.required' =>
                    'Nama Departemen wajib diisi.',


                    'role.integer' =>
                    'Role harus berupa angka.',


                    'img.image' =>
                    'File yang dipilih harus berupa image.',


                    'img.max' =>
                    'Ukuran image maksimal 2 MB.',

                ]
            );


        /*
    |--------------------------------------------------------------------------
    | IMAGE BARU
    |--------------------------------------------------------------------------
    */

        $newImageName =
            null;


        if (
            $request->hasFile(
                'img'
            )
        ) {

            $newImageName =
                $this
                ->storeDepartemenImage(
                    $request->file(
                        'img'
                    )
                );
        }


        /*
    |--------------------------------------------------------------------------
    | UPDATE DATA
    |--------------------------------------------------------------------------
    */

        $data = [

            'nama_dep' =>
            trim(
                $validated['nama_dep']
            ),


            'kode_dep' =>
            trim(
                $validated['kode_dep']
            ),

        ];


        /*
     * Role.
     */

        if (
            Schema::hasColumn(
                'departemens',
                'role'
            )
        ) {

            $data['role'] =
                $validated['role']
                ?? null;
        }


        /*
     * Image baru.
     *
     * Kalau tidak upload image,
     * image lama tetap.
     */

        if (
            $newImageName &&
            Schema::hasColumn(
                'departemens',
                'img'
            )
        ) {

            $data['img'] =
                $newImageName;
        }


        /*
     * Jangan ubah created_at saat edit.
     *
     * Karena kalau created_at berubah,
     * data yang diedit akan dianggap
     * sebagai data baru.
     */


        /*
     * Update timestamp.
     */

        if (
            Schema::hasColumn(
                'departemens',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        /*
    |--------------------------------------------------------------------------
    | UPDATE DATABASE
    |--------------------------------------------------------------------------
    */

        try {

            DB::table(
                'departemens'
            )
                ->where(
                    'id',
                    $id
                )
                ->update(
                    $data
                );
        } catch (\Throwable $error) {

            /*
         * Jika DB gagal,
         * hapus image baru.
         */

            if ($newImageName) {

                $this
                    ->deleteDepartemenUploadedImage(
                        $newImageName
                    );
            }


            throw $error;
        }


        /*
    |--------------------------------------------------------------------------
    | HAPUS FILE UPLOAD LAMA
    |--------------------------------------------------------------------------
    |
    | Hanya image yang berada di:
    |
    | public/uploads/departemen
    |
    | Image legacy tidak disentuh.
    |
    */

        if (
            $newImageName &&
            !empty($departemen->img)
        ) {

            $this
                ->deleteDepartemenUploadedImage(
                    $departemen->img
                );
        }


        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        if (
            $request->expectsJson()
            ||
            $request->ajax()
        ) {

            return response()
                ->json(
                    [

                        'success' =>
                        true,


                        'message' =>
                        'Departemen berhasil diperbarui.',


                        'id' =>
                        $id,

                    ]
                );
        }


        return redirect()
            ->route(
                'master.data_departemen'
            )
            ->with(
                'success',
                'Departemen berhasil diperbarui.'
            );
    }


    /*
|--------------------------------------------------------------------------
| DELETE DEPARTEMEN
|--------------------------------------------------------------------------
*/

    public function deleteDepartemen(
        Request $request,
        int $id
    ) {

        /*
    |--------------------------------------------------------------------------
    | FIND DATA
    |--------------------------------------------------------------------------
    */

        $departemen =
            DB::table(
                'departemens'
            )
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$departemen) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()
                    ->json(
                        [

                            'success' =>
                            false,


                            'message' =>
                            'Data Departemen tidak ditemukan.',

                        ],
                        404
                    );
            }


            return redirect()
                ->route(
                    'master.data_departemen'
                )
                ->with(
                    'error',
                    'Data Departemen tidak ditemukan.'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | CEK RELASI DIVISI
    |--------------------------------------------------------------------------
    |
    | DATABASE LEGACY:
    |
    | departemens.id
    |        ↓
    | divisis.id_dep
    |
    */

        if (
            Schema::hasTable(
                'divisis'
            )
            &&
            Schema::hasColumn(
                'divisis',
                'id_dep'
            )
        ) {

            $jumlahDivisi =
                DB::table(
                    'divisis'
                )
                ->where(
                    'id_dep',
                    $id
                )
                ->count();


            if (
                $jumlahDivisi >
                0
            ) {

                $message =
                    'Departemen tidak dapat dihapus karena masih digunakan oleh '
                    .
                    $jumlahDivisi
                    .
                    ' data Divisi.';


                if (
                    $request->expectsJson()
                    ||
                    $request->ajax()
                ) {

                    return response()
                        ->json(
                            [

                                'success' =>
                                false,


                                'message' =>
                                $message,

                            ],
                            409
                        );
                }


                return redirect()
                    ->route(
                        'master.data_departemen'
                    )
                    ->with(
                        'error',
                        $message
                    );
            }
        }


        /*
    |--------------------------------------------------------------------------
    | SNAPSHOT
    |--------------------------------------------------------------------------
    */

        $recordName =
            trim(
                (string)
                $departemen->kode_dep
            );


        $recordCode =
            trim(
                (string)
                $departemen->nama_dep
            );


        $recordCreatedAt =
            $departemen->created_at
            ??
            null;


        $imageName =
            !empty($departemen->img)
            ? trim(
                (string)
                $departemen->img
            )
            : null;


        /*
    |--------------------------------------------------------------------------
    | TRANSACTION
    |--------------------------------------------------------------------------
    */

        try {

            DB::transaction(
                function () use (
                    $id,
                    $recordName,
                    $recordCode,
                    $recordCreatedAt
                ) {

                    /*
                |--------------------------------------------------------------------------
                | ACTIVITY LOG
                |--------------------------------------------------------------------------
                */

                    if (
                        Schema::hasTable(
                            'master_data_activity_logs'
                        )
                    ) {

                        DB::table(
                            'master_data_activity_logs'
                        )
                            ->insert(
                                [

                                    'module' =>
                                    'departemen',


                                    'record_id' =>
                                    $id,


                                    'record_name' =>
                                    $recordName,


                                    'record_code' =>
                                    $recordCode,


                                    'action' =>
                                    'deleted',


                                    'record_created_at' =>
                                    $recordCreatedAt,


                                    'created_at' =>
                                    now(),


                                    'updated_at' =>
                                    now(),

                                ]
                            );
                    }


                    /*
                |--------------------------------------------------------------------------
                | DELETE
                |--------------------------------------------------------------------------
                */

                    DB::table(
                        'departemens'
                    )
                        ->where(
                            'id',
                            $id
                        )
                        ->delete();
                }
            );
        } catch (\Throwable $error) {

            report(
                $error
            );


            $message =
                'Departemen tidak dapat dihapus karena masih digunakan oleh data lain.';


            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()
                    ->json(
                        [

                            'success' =>
                            false,


                            'message' =>
                            $message,

                        ],
                        409
                    );
            }


            return redirect()
                ->route(
                    'master.data_departemen'
                )
                ->with(
                    'error',
                    $message
                );
        }


        /*
    |--------------------------------------------------------------------------
    | DELETE IMAGE UPLOAD MODERN
    |--------------------------------------------------------------------------
    */

        if ($imageName) {

            $this
                ->deleteDepartemenUploadedImage(
                    $imageName
                );
        }


        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        if (
            $request->expectsJson()
            ||
            $request->ajax()
        ) {

            return response()
                ->json(
                    [

                        'success' =>
                        true,


                        'message' =>
                        'Departemen berhasil dihapus.',


                        'id' =>
                        $id,

                    ]
                );
        }


        return redirect()
            ->route(
                'master.data_departemen'
            )
            ->with(
                'success',
                'Departemen berhasil dihapus.'
            );
    }


    /*
|--------------------------------------------------------------------------
| STORE IMAGE
|--------------------------------------------------------------------------
*/

    private function storeDepartemenImage(
        UploadedFile $image
    ): string {

        /*
    |--------------------------------------------------------------------------
    | DIRECTORY
    |--------------------------------------------------------------------------
    */

        $directory =
            public_path(
                'uploads/departemen'
            );


        File::ensureDirectoryExists(
            $directory
        );


        /*
    |--------------------------------------------------------------------------
    | EXTENSION
    |--------------------------------------------------------------------------
    */

        $extension =
            strtolower(
                $image
                    ->getClientOriginalExtension()
            );


        /*
    |--------------------------------------------------------------------------
    | FILE NAME
    |--------------------------------------------------------------------------
    */

        $fileName =
            'dept_' .
            now()->format(
                'YmdHis'
            ) .
            '_' .
            Str::lower(
                Str::random(
                    8
                )
            ) .
            '.' .
            $extension;


        /*
    |--------------------------------------------------------------------------
    | MOVE
    |--------------------------------------------------------------------------
    */

        $image->move(
            $directory,
            $fileName
        );


        return $fileName;
    }


    /*
|--------------------------------------------------------------------------
| DELETE UPLOADED IMAGE
|--------------------------------------------------------------------------
*/

    private function deleteDepartemenUploadedImage(
        ?string $fileName
    ): void {

        if (!$fileName) {

            return;
        }


        /*
     * basename mencegah path traversal.
     */

        $safeFileName =
            basename(
                trim(
                    $fileName
                )
            );


        /*
     * Hanya folder upload aplikasi baru.
     *
     * Jangan menghapus image legacy.
     */

        $path =
            public_path(
                'uploads/departemen/' .
                    $safeFileName
            );


        if (
            File::exists(
                $path
            )
        ) {

            File::delete(
                $path
            );
        }
    }


    /*
|--------------------------------------------------------------------------
| RESOLVE IMAGE URL
|--------------------------------------------------------------------------
*/

    private function departemenImageUrl(
        ?string $fileName
    ): ?string {

        if (!$fileName) {

            return null;
        }


        $safeFileName =
            basename(
                trim(
                    $fileName
                )
            );


        /*
    |--------------------------------------------------------------------------
    | CANDIDATE PATH
    |--------------------------------------------------------------------------
    */

        $candidates = [

            /*
         * Aplikasi modern.
         */

            'uploads/departemen/' .
                $safeFileName,


            /*
         * Web aset legacy.
         */

            'assets/landingpage/images/icon/' .
                $safeFileName,


            /*
         * Fallback bila aset lama
         * ternyata berada di folder ini.
         */

            'assets/img/' .
                $safeFileName,


            'assets/images/' .
                $safeFileName,

        ];


        /*
    |--------------------------------------------------------------------------
    | CARI FILE
    |--------------------------------------------------------------------------
    */

        foreach (
            $candidates
            as $relativePath
        ) {

            if (
                File::exists(
                    public_path(
                        $relativePath
                    )
                )
            ) {

                return asset(
                    $relativePath
                );
            }
        }


        return null;
    }

    /*
|--------------------------------------------------------------------------
| MASTER DATA - DIVISI
|--------------------------------------------------------------------------
*/


    /*
|--------------------------------------------------------------------------
| PAGE DIVISI
|--------------------------------------------------------------------------
*/

    public function dataDivisi()
    {
        if (!Schema::hasTable('divisis')) {

            abort(
                500,
                'Tabel divisis tidak ditemukan pada database.'
            );
        }


        if (!Schema::hasTable('departemens')) {

            abort(
                500,
                'Tabel departemens tidak ditemukan pada database.'
            );
        }


        /*
    |--------------------------------------------------------------------------
    | CEK TIMESTAMP
    |--------------------------------------------------------------------------
    */

        $hasCreatedAt =
            Schema::hasColumn(
                'divisis',
                'created_at'
            );


        $hasUpdatedAt =
            Schema::hasColumn(
                'divisis',
                'updated_at'
            );


        /*
    |--------------------------------------------------------------------------
    | DEPARTEMEN
    |--------------------------------------------------------------------------
    |
    | Database legacy:
    |
    | departemens.nama_dep = kode
    | departemens.kode_dep = nama
    |
    */

        $departemens =
            DB::table('departemens')
            ->select(
                'id',
                'nama_dep',
                'kode_dep'
            )
            ->orderBy('kode_dep')
            ->get()
            ->map(
                function ($item) {

                    $item->nama_dep =
                        trim(
                            (string) $item->nama_dep
                        );


                    $item->kode_dep =
                        trim(
                            (string) $item->kode_dep
                        );


                    return $item;
                }
            );


        /*
    |--------------------------------------------------------------------------
    | QUERY DIVISI
    |--------------------------------------------------------------------------
    */

        $query =
            DB::table('divisis')

            ->leftJoin(
                'departemens',
                'divisis.id_dep',
                '=',
                'departemens.id'
            )

            ->select(
                'divisis.id',
                'divisis.id_dep',
                'divisis.kode_div',
                'divisis.nama_div',

                /*
                 * Nama Departemen legacy.
                 */

                'departemens.kode_dep as nama_departemen',

                /*
                 * Kode Departemen legacy.
                 */

                'departemens.nama_dep as kode_departemen'
            );


        if ($hasCreatedAt) {

            $query->addSelect(
                'divisis.created_at'
            );
        }


        if ($hasUpdatedAt) {

            $query->addSelect(
                'divisis.updated_at'
            );
        }


        /*
    |--------------------------------------------------------------------------
    | URUTAN DATA
    |--------------------------------------------------------------------------
    |
    | Data modern dengan created_at berada di atas.
    | Data legacy created_at NULL berada di bawah.
    |
    */

        if ($hasCreatedAt) {

            $query

                ->orderByRaw(
                    "
                CASE
                    WHEN divisis.created_at IS NULL
                    THEN 1
                    ELSE 0
                END ASC
                "
                )

                ->orderByDesc(
                    'divisis.created_at'
                )

                ->orderByDesc(
                    'divisis.id'
                );
        } else {

            $query
                ->orderByDesc(
                    'divisis.id'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | GET
    |--------------------------------------------------------------------------
    */

        $divisis =
            $query
            ->get()
            ->map(
                function ($item) {

                    $item->kode_div =
                        trim(
                            (string) $item->kode_div
                        );


                    $item->nama_div =
                        trim(
                            (string) $item->nama_div
                        );


                    $item->nama_departemen =
                        !empty($item->nama_departemen)
                        ? trim(
                            (string)
                            $item->nama_departemen
                        )
                        : 'Departemen tidak ditemukan';


                    $item->kode_departemen =
                        !empty($item->kode_departemen)
                        ? trim(
                            (string)
                            $item->kode_departemen
                        )
                        : null;


                    return $item;
                }
            );


        /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

        $totalDivisi =
            $divisis->count();


        $totalDepartemen =
            $departemens->count();


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


        foreach (
            $divisis
            as $item
        ) {

            if (
                $hasUpdatedAt &&
                !empty($item->updated_at)
            ) {

                $latestTimestamp =
                    $item->updated_at;

                break;
            }


            if (
                $hasCreatedAt &&
                !empty($item->created_at)
            ) {

                $latestTimestamp =
                    $item->created_at;

                break;
            }
        }


        if ($latestTimestamp) {

            $latestDate =
                \Carbon\Carbon::parse(
                    $latestTimestamp
                )->locale('id');


            if ($latestDate->isToday()) {

                $updateTerakhirLabel =
                    'Hari Ini';
            } elseif (
                $latestDate->isYesterday()
            ) {

                $updateTerakhirLabel =
                    'Kemarin';
            } else {

                $updateTerakhirLabel =
                    $latestDate
                    ->diffForHumans();
            }


            $updateTerakhirDetail =
                $latestDate
                ->translatedFormat(
                    'd M Y, H:i'
                )
                .
                ' WITA';
        }


        /*
    |--------------------------------------------------------------------------
    | DISTRIBUSI DIVISI PER DEPARTEMEN
    |--------------------------------------------------------------------------
    */

        $distribusiDivisi =
            DB::table('divisis')

            ->leftJoin(
                'departemens',
                'divisis.id_dep',
                '=',
                'departemens.id'
            )

            ->select(
                'divisis.id_dep',

                'departemens.kode_dep as nama_departemen',

                DB::raw(
                    'COUNT(divisis.id) as total'
                )
            )

            ->groupBy(
                'divisis.id_dep',
                'departemens.kode_dep'
            )

            ->orderByDesc(
                'total'
            )

            ->get()

            ->map(
                function ($item) use (
                    $totalDivisi
                ) {

                    $item->nama_departemen =
                        !empty($item->nama_departemen)
                        ? trim(
                            (string)
                            $item->nama_departemen
                        )
                        : 'Tanpa Departemen';


                    $item->total =
                        (int)
                        $item->total;


                    $item->persentase =
                        $totalDivisi > 0
                        ? round(
                            (
                                $item->total /
                                $totalDivisi
                            )
                                *
                                100,
                            1
                        )
                        : 0;


                    return $item;
                }
            );


        /*
    |--------------------------------------------------------------------------
    | DIVISI TERBARU
    |--------------------------------------------------------------------------
    */

        $divisiTerbaru =
            $divisis
            ->take(5)
            ->values();


        /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

        $divisiActivityLogs =
            collect();


        $divisiTambah = 0;

        $divisiHapus = 0;

        $divisiDelta = 0;


        if (
            Schema::hasTable(
                'master_data_activity_logs'
            )
        ) {

            $divisiActivityLogs =
                DB::table(
                    'master_data_activity_logs'
                )

                ->where(
                    'module',
                    'divisi'
                )

                ->whereIn(
                    'action',
                    [
                        'created',
                        'deleted',
                    ]
                )

                ->orderByDesc(
                    'created_at'
                )

                ->orderByDesc(
                    'id'
                )

                ->get();


            $divisiTambah =
                $divisiActivityLogs
                ->where(
                    'action',
                    'created'
                )
                ->count();


            $divisiHapus =
                $divisiActivityLogs
                ->where(
                    'action',
                    'deleted'
                )
                ->count();


            $divisiDelta =
                $divisiTambah -
                $divisiHapus;
        }


        /*
    |--------------------------------------------------------------------------
    | VIEW
    |--------------------------------------------------------------------------
    */

        return view(
            'master.data_divisi',
            compact(
                'divisis',
                'departemens',
                'totalDivisi',
                'totalDepartemen',
                'updateTerakhirLabel',
                'updateTerakhirDetail',
                'distribusiDivisi',
                'divisiTerbaru',
                'hasCreatedAt',
                'hasUpdatedAt',
                'divisiActivityLogs',
                'divisiTambah',
                'divisiHapus',
                'divisiDelta'
            )
        );
    }


    /*
|--------------------------------------------------------------------------
| STORE DIVISI
|--------------------------------------------------------------------------
*/

    public function storeDivisi(
        Request $request
    ) {

        $validated =
            $request->validate(
                [

                    'id_dep' => [
                        'required',
                        'integer',
                        'exists:departemens,id',
                    ],


                    'kode_div' => [
                        'required',
                        'string',
                        'max:255',

                        Rule::unique(
                            'divisis',
                            'kode_div'
                        ),
                    ],


                    'nama_div' => [
                        'required',
                        'string',
                        'max:255',
                    ],

                ],
                [

                    'id_dep.required' =>
                    'Departemen wajib dipilih.',


                    'id_dep.exists' =>
                    'Departemen tidak valid.',


                    'kode_div.required' =>
                    'Kode Divisi wajib diisi.',


                    'kode_div.unique' =>
                    'Kode Divisi sudah digunakan.',


                    'nama_div.required' =>
                    'Nama Divisi wajib diisi.',

                ]
            );


        /*
    |--------------------------------------------------------------------------
    | INSERT DATA
    |--------------------------------------------------------------------------
    */

        $data = [

            'id_dep' =>
            (int)
            $validated['id_dep'],


            'kode_div' =>
            trim(
                $validated['kode_div']
            ),


            'nama_div' =>
            trim(
                $validated['nama_div']
            ),

        ];


        if (
            Schema::hasColumn(
                'divisis',
                'created_at'
            )
        ) {

            $data['created_at'] =
                now();
        }


        if (
            Schema::hasColumn(
                'divisis',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        /*
    |--------------------------------------------------------------------------
    | INSERT + LOG
    |--------------------------------------------------------------------------
    */

        $id =
            DB::transaction(
                function () use (
                    $data
                ) {

                    $id =
                        DB::table(
                            'divisis'
                        )
                        ->insertGetId(
                            $data
                        );


                    if (
                        Schema::hasTable(
                            'master_data_activity_logs'
                        )
                    ) {

                        DB::table(
                            'master_data_activity_logs'
                        )
                            ->insert(
                                [

                                    'module' =>
                                    'divisi',

                                    'record_id' =>
                                    $id,

                                    'record_name' =>
                                    $data['nama_div'],

                                    'record_code' =>
                                    $data['kode_div'],

                                    'action' =>
                                    'created',

                                    'record_created_at' =>
                                    $data['created_at']
                                        ??
                                        now(),

                                    'created_at' =>
                                    now(),

                                    'updated_at' =>
                                    now(),

                                ]
                            );
                    }


                    return $id;
                }
            );


        if (
            $request->expectsJson()
            ||
            $request->ajax()
        ) {

            return response()
                ->json(
                    [

                        'success' =>
                        true,

                        'message' =>
                        'Divisi berhasil ditambahkan.',

                        'id' =>
                        $id,

                    ],
                    201
                );
        }


        return redirect()
            ->route(
                'master.data_divisi'
            )
            ->with(
                'success',
                'Divisi berhasil ditambahkan.'
            );
    }


    /*
|--------------------------------------------------------------------------
| UPDATE DIVISI
|--------------------------------------------------------------------------
*/

    public function updateDivisi(
        Request $request,
        int $id
    ) {

        $divisi =
            DB::table('divisis')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$divisi) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()
                    ->json(
                        [

                            'success' =>
                            false,

                            'message' =>
                            'Data Divisi tidak ditemukan.',

                        ],
                        404
                    );
            }


            return redirect()
                ->route(
                    'master.data_divisi'
                )
                ->with(
                    'error',
                    'Data Divisi tidak ditemukan.'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

        $validated =
            $request->validate(
                [

                    'id_dep' => [
                        'required',
                        'integer',
                        'exists:departemens,id',
                    ],


                    'kode_div' => [
                        'required',
                        'string',
                        'max:255',

                        Rule::unique(
                            'divisis',
                            'kode_div'
                        )
                            ->ignore(
                                $id
                            ),
                    ],


                    'nama_div' => [
                        'required',
                        'string',
                        'max:255',
                    ],

                ]
            );


        /*
    |--------------------------------------------------------------------------
    | UPDATE DATA
    |--------------------------------------------------------------------------
    */

        $data = [

            'id_dep' =>
            (int)
            $validated['id_dep'],


            'kode_div' =>
            trim(
                $validated['kode_div']
            ),


            'nama_div' =>
            trim(
                $validated['nama_div']
            ),

        ];


        /*
     * created_at tidak diubah.
     *
     * Jadi edit data lama tidak membuatnya
     * dianggap sebagai data baru.
     */

        if (
            Schema::hasColumn(
                'divisis',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        DB::table('divisis')
            ->where(
                'id',
                $id
            )
            ->update(
                $data
            );


        if (
            $request->expectsJson()
            ||
            $request->ajax()
        ) {

            return response()
                ->json(
                    [

                        'success' =>
                        true,

                        'message' =>
                        'Divisi berhasil diperbarui.',

                        'id' =>
                        $id,

                    ]
                );
        }


        return redirect()
            ->route(
                'master.data_divisi'
            )
            ->with(
                'success',
                'Divisi berhasil diperbarui.'
            );
    }


    /*
|--------------------------------------------------------------------------
| DELETE DIVISI
|--------------------------------------------------------------------------
*/

    public function deleteDivisi(
        Request $request,
        int $id
    ) {

        $divisi =
            DB::table('divisis')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$divisi) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()
                    ->json(
                        [

                            'success' =>
                            false,

                            'message' =>
                            'Data Divisi tidak ditemukan.',

                        ],
                        404
                    );
            }


            return redirect()
                ->route(
                    'master.data_divisi'
                )
                ->with(
                    'error',
                    'Data Divisi tidak ditemukan.'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | CEK PEMAKAIAN DIVISI
    |--------------------------------------------------------------------------
    |
    | Web lama memakai Divisi di beberapa master/aset lain.
    |
    */

        $references = [

            [
                'table' =>
                'users',

                'column' =>
                'divisi',
            ],

            [
                'table' =>
                'sdms',

                'column' =>
                'id_div',
            ],

            [
                'table' =>
                'nilai_aktivas',

                'column' =>
                'div',
            ],

            [
                'table' =>
                'mesins',

                'column' =>
                'id_div',
            ],

            [
                'table' =>
                'gedungs',

                'column' =>
                'id_div',
            ],

            [
                'table' =>
                'kib_d_s',

                'column' =>
                'id_div',
            ],

            [
                'table' =>
                'kib_e_s',

                'column' =>
                'id_div',
            ],

            [
                'table' =>
                'kib_f_s',

                'column' =>
                'id_div',
            ],

            [
                'table' =>
                'kirs',

                'column' =>
                'id_div',
            ],

        ];


        foreach (
            $references
            as $reference
        ) {

            if (
                !Schema::hasTable(
                    $reference['table']
                )
            ) {

                continue;
            }


            if (
                !Schema::hasColumn(
                    $reference['table'],
                    $reference['column']
                )
            ) {

                continue;
            }


            $used =
                DB::table(
                    $reference['table']
                )
                ->where(
                    $reference['column'],
                    $id
                )
                ->count();


            if ($used > 0) {

                $message =
                    'Divisi tidak dapat dihapus karena masih digunakan oleh data lain.';


                if (
                    $request->expectsJson()
                    ||
                    $request->ajax()
                ) {

                    return response()
                        ->json(
                            [

                                'success' =>
                                false,

                                'message' =>
                                $message,

                            ],
                            409
                        );
                }


                return redirect()
                    ->route(
                        'master.data_divisi'
                    )
                    ->with(
                        'error',
                        $message
                    );
            }
        }


        /*
    |--------------------------------------------------------------------------
    | SNAPSHOT LOG
    |--------------------------------------------------------------------------
    */

        $recordName =
            trim(
                (string)
                $divisi->nama_div
            );


        $recordCode =
            trim(
                (string)
                $divisi->kode_div
            );


        $recordCreatedAt =
            $divisi->created_at
            ??
            null;


        /*
    |--------------------------------------------------------------------------
    | DELETE + LOG
    |--------------------------------------------------------------------------
    */

        try {

            DB::transaction(
                function () use (
                    $id,
                    $recordName,
                    $recordCode,
                    $recordCreatedAt
                ) {

                    if (
                        Schema::hasTable(
                            'master_data_activity_logs'
                        )
                    ) {

                        DB::table(
                            'master_data_activity_logs'
                        )
                            ->insert(
                                [

                                    'module' =>
                                    'divisi',

                                    'record_id' =>
                                    $id,

                                    'record_name' =>
                                    $recordName,

                                    'record_code' =>
                                    $recordCode,

                                    'action' =>
                                    'deleted',

                                    'record_created_at' =>
                                    $recordCreatedAt,

                                    'created_at' =>
                                    now(),

                                    'updated_at' =>
                                    now(),

                                ]
                            );
                    }


                    DB::table('divisis')
                        ->where(
                            'id',
                            $id
                        )
                        ->delete();
                }
            );
        } catch (\Throwable $error) {

            report($error);


            $message =
                'Divisi tidak dapat dihapus karena masih digunakan oleh data lain.';


            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()
                    ->json(
                        [

                            'success' =>
                            false,

                            'message' =>
                            $message,

                        ],
                        409
                    );
            }


            return redirect()
                ->route(
                    'master.data_divisi'
                )
                ->with(
                    'error',
                    $message
                );
        }


        if (
            $request->expectsJson()
            ||
            $request->ajax()
        ) {

            return response()
                ->json(
                    [

                        'success' =>
                        true,

                        'message' =>
                        'Divisi berhasil dihapus.',

                        'id' =>
                        $id,

                    ]
                );
        }


        return redirect()
            ->route(
                'master.data_divisi'
            )
            ->with(
                'success',
                'Divisi berhasil dihapus.'
            );
    }
}
