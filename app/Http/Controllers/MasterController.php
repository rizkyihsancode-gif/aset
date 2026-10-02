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

    /*
|--------------------------------------------------------------------------
| MASTER DATA - RUANGAN
|--------------------------------------------------------------------------
*/


    /*
|--------------------------------------------------------------------------
| PAGE RUANGAN
|--------------------------------------------------------------------------
*/

    public function dataRuangan()
    {
        if (!Schema::hasTable('ruangans')) {

            abort(
                500,
                'Tabel ruangans tidak ditemukan pada database.'
            );
        }


        /*
    |--------------------------------------------------------------------------
    | CEK KOLOM
    |--------------------------------------------------------------------------
    */

        $hasCreatedAt =
            Schema::hasColumn(
                'ruangans',
                'created_at'
            );


        $hasUpdatedAt =
            Schema::hasColumn(
                'ruangans',
                'updated_at'
            );


        /*
    |--------------------------------------------------------------------------
    | QUERY RUANGAN
    |--------------------------------------------------------------------------
    */

        $query =
            DB::table('ruangans')
            ->select(
                'ruangans.id',
                'ruangans.kode',
                'ruangans.nama_ruang'
            );


        if ($hasCreatedAt) {

            $query->addSelect(
                'ruangans.created_at'
            );
        }


        if ($hasUpdatedAt) {

            $query->addSelect(
                'ruangans.updated_at'
            );
        }


        /*
    |--------------------------------------------------------------------------
    | SORTING
    |--------------------------------------------------------------------------
    |
    | Data yang dibuat melalui web modern:
    | created_at terisi → tampil paling atas.
    |
    | Data legacy:
    | created_at NULL → berada setelah data modern.
    |
    */

        if ($hasCreatedAt) {

            $query
                ->orderByRaw(
                    "
                CASE
                    WHEN ruangans.created_at IS NULL
                    THEN 1
                    ELSE 0
                END ASC
                "
                )
                ->orderByDesc(
                    'ruangans.created_at'
                )
                ->orderByDesc(
                    'ruangans.id'
                );
        } else {

            $query
                ->orderByDesc(
                    'ruangans.id'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | GET
    |--------------------------------------------------------------------------
    */

        $ruangans =
            $query
            ->get()
            ->map(
                function ($item) {

                    $item->kode =
                        !empty($item->kode)
                        ? trim(
                            (string) $item->kode
                        )
                        : '-';


                    $item->nama_ruang =
                        trim(
                            (string) $item->nama_ruang
                        );


                    if (
                        !property_exists(
                            $item,
                            'created_at'
                        )
                    ) {

                        $item->created_at =
                            null;
                    }


                    if (
                        !property_exists(
                            $item,
                            'updated_at'
                        )
                    ) {

                        $item->updated_at =
                            null;
                    }


                    return $item;
                }
            );


        /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

        $totalRuangan =
            $ruangans->count();


        /*
    |--------------------------------------------------------------------------
    | KODE TERISI
    |--------------------------------------------------------------------------
    */

        $totalKodeTerisi =
            $ruangans
            ->filter(
                function ($item) {

                    $kode =
                        trim(
                            (string) $item->kode
                        );


                    return (
                        $kode !== '' &&
                        $kode !== '-'
                    );
                }
            )
            ->count();


        $totalTanpaKode =
            $totalRuangan -
            $totalKodeTerisi;


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


        if ($hasUpdatedAt) {

            $latestUpdated =
                DB::table('ruangans')
                ->whereNotNull(
                    'updated_at'
                )
                ->orderByDesc(
                    'updated_at'
                )
                ->value(
                    'updated_at'
                );


            if ($latestUpdated) {

                $latestTimestamp =
                    $latestUpdated;
            }
        }


        if (
            !$latestTimestamp &&
            $hasCreatedAt
        ) {

            $latestCreated =
                DB::table('ruangans')
                ->whereNotNull(
                    'created_at'
                )
                ->orderByDesc(
                    'created_at'
                )
                ->value(
                    'created_at'
                );


            if ($latestCreated) {

                $latestTimestamp =
                    $latestCreated;
            }
        }


        if ($latestTimestamp) {

            $latestDate =
                Carbon::parse(
                    $latestTimestamp
                )
                ->locale('id');


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
    | RUANGAN TERBARU
    |--------------------------------------------------------------------------
    */

        $ruanganTerbaru =
            $ruangans
            ->take(5)
            ->values();


        /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

        $ruanganActivityLogs =
            collect();


        $ruanganTambah = 0;

        $ruanganHapus = 0;

        $ruanganDelta = 0;


        if (
            Schema::hasTable(
                'master_data_activity_logs'
            )
        ) {

            $ruanganActivityLogs =
                DB::table(
                    'master_data_activity_logs'
                )
                ->where(
                    'module',
                    'ruangan'
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


            $ruanganTambah =
                $ruanganActivityLogs
                ->where(
                    'action',
                    'created'
                )
                ->count();


            $ruanganHapus =
                $ruanganActivityLogs
                ->where(
                    'action',
                    'deleted'
                )
                ->count();


            $ruanganDelta =
                $ruanganTambah -
                $ruanganHapus;
        }


        /*
    |--------------------------------------------------------------------------
    | VIEW
    |--------------------------------------------------------------------------
    */

        return view(
            'master.data_ruangan',
            compact(
                'ruangans',
                'totalRuangan',
                'totalKodeTerisi',
                'totalTanpaKode',
                'ruanganTerbaru',
                'hasCreatedAt',
                'hasUpdatedAt',
                'updateTerakhirLabel',
                'updateTerakhirDetail',
                'ruanganActivityLogs',
                'ruanganTambah',
                'ruanganHapus',
                'ruanganDelta'
            )
        );
    }


    /*
|--------------------------------------------------------------------------
| STORE RUANGAN
|--------------------------------------------------------------------------
*/

    public function storeRuangan(
        Request $request
    ) {

        /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    |
    | Kode sengaja optional.
    |
    | Database legacy mempunyai banyak kode "-"
    | dan web lama hanya berfokus pada nama Ruangan.
    |
    */

        $validated =
            $request->validate(
                [

                    'nama_ruang' => [
                        'required',
                        'string',
                        'max:255',
                    ],


                    'kode' => [
                        'nullable',
                        'string',
                        'max:255',
                    ],

                ],
                [

                    'nama_ruang.required' =>
                    'Nama Ruangan wajib diisi.',

                    'nama_ruang.max' =>
                    'Nama Ruangan maksimal 255 karakter.',

                    'kode.max' =>
                    'Kode Ruangan maksimal 255 karakter.',

                ]
            );


        $kode =
            trim(
                (string)
                (
                    $validated['kode']
                    ?? ''
                )
            );


        /*
    |--------------------------------------------------------------------------
    | INSERT DATA
    |--------------------------------------------------------------------------
    */

        $data = [

            'nama_ruang' =>
            trim(
                $validated['nama_ruang']
            ),

            'kode' =>
            $kode !== ''
                ? $kode
                : '-',

        ];


        if (
            Schema::hasColumn(
                'ruangans',
                'created_at'
            )
        ) {

            $data['created_at'] =
                now();
        }


        if (
            Schema::hasColumn(
                'ruangans',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        /*
    |--------------------------------------------------------------------------
    | INSERT + ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

        $id =
            DB::transaction(
                function () use (
                    $data
                ) {

                    $id =
                        DB::table(
                            'ruangans'
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
                                    'ruangan',

                                    'record_id' =>
                                    $id,

                                    'record_name' =>
                                    $data['nama_ruang'],

                                    'record_code' =>
                                    $data['kode'],

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
                        'Ruangan berhasil ditambahkan.',

                        'id' =>
                        $id,

                    ],
                    201
                );
        }


        return redirect()
            ->route(
                'master.data_ruangan'
            )
            ->with(
                'success',
                'Ruangan berhasil ditambahkan.'
            );
    }


    /*
|--------------------------------------------------------------------------
| UPDATE RUANGAN
|--------------------------------------------------------------------------
*/

    public function updateRuangan(
        Request $request,
        int $id
    ) {

        /*
    |--------------------------------------------------------------------------
    | FIND
    |--------------------------------------------------------------------------
    */

        $ruangan =
            DB::table(
                'ruangans'
            )
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$ruangan) {

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
                            'Data Ruangan tidak ditemukan.',

                        ],
                        404
                    );
            }


            return redirect()
                ->route(
                    'master.data_ruangan'
                )
                ->with(
                    'error',
                    'Data Ruangan tidak ditemukan.'
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

                    'nama_ruang' => [
                        'required',
                        'string',
                        'max:255',
                    ],


                    'kode' => [
                        'nullable',
                        'string',
                        'max:255',
                    ],

                ]
            );


        $kode =
            trim(
                (string)
                (
                    $validated['kode']
                    ?? ''
                )
            );


        /*
    |--------------------------------------------------------------------------
    | UPDATE DATA
    |--------------------------------------------------------------------------
    */

        $data = [

            'nama_ruang' =>
            trim(
                $validated['nama_ruang']
            ),

            'kode' =>
            $kode !== ''
                ? $kode
                : '-',

        ];


        /*
     * Jangan ubah created_at.
     *
     * Edit bukan berarti data baru.
     */

        if (
            Schema::hasColumn(
                'ruangans',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        DB::table(
            'ruangans'
        )
            ->where(
                'id',
                $id
            )
            ->update(
                $data
            );


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
                        'Ruangan berhasil diperbarui.',

                        'id' =>
                        $id,

                    ]
                );
        }


        return redirect()
            ->route(
                'master.data_ruangan'
            )
            ->with(
                'success',
                'Ruangan berhasil diperbarui.'
            );
    }


    /*
|--------------------------------------------------------------------------
| DELETE RUANGAN
|--------------------------------------------------------------------------
*/

    public function deleteRuangan(
        Request $request,
        int $id
    ) {

        /*
    |--------------------------------------------------------------------------
    | FIND
    |--------------------------------------------------------------------------
    */

        $ruangan =
            DB::table(
                'ruangans'
            )
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$ruangan) {

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
                            'Data Ruangan tidak ditemukan.',

                        ],
                        404
                    );
            }


            return redirect()
                ->route(
                    'master.data_ruangan'
                )
                ->with(
                    'error',
                    'Data Ruangan tidak ditemukan.'
                );
        }


        /*
    |--------------------------------------------------------------------------
    | SNAPSHOT
    |--------------------------------------------------------------------------
    */

        $recordName =
            trim(
                (string)
                $ruangan->nama_ruang
            );


        $recordCode =
            !empty($ruangan->kode)
            ? trim(
                (string)
                $ruangan->kode
            )
            : '-';


        $recordCreatedAt =
            $ruangan->created_at
            ??
            null;


        /*
    |--------------------------------------------------------------------------
    | ACTIVITY + DELETE
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
                                    'ruangan',

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


                    DB::table(
                        'ruangans'
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


            /*
         * Jika ternyata Ruangan dipakai tabel lain
         * melalui foreign key, jangan paksa delete.
         */

            $message =
                'Ruangan tidak dapat dihapus karena masih digunakan oleh data lain.';


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
                    'master.data_ruangan'
                )
                ->with(
                    'error',
                    $message
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
                        'Ruangan berhasil dihapus.',

                        'id' =>
                        $id,

                    ]
                );
        }


        return redirect()
            ->route(
                'master.data_ruangan'
            )
            ->with(
                'success',
                'Ruangan berhasil dihapus.'
            );
    }

    /*
|--------------------------------------------------------------------------
| MASTER DATA - SDM PENDUKUNG
|--------------------------------------------------------------------------
*/

    public function dataSdm()
    {
        if (!Schema::hasTable('sdms')) {
            abort(500, 'Tabel sdms tidak ditemukan pada database.');
        }

        if (!Schema::hasTable('divisis')) {
            abort(500, 'Tabel divisis tidak ditemukan pada database.');
        }

        if (!Schema::hasTable('jabatans')) {
            abort(500, 'Tabel jabatans tidak ditemukan pada database.');
        }


        $hasCreatedAt =
            Schema::hasColumn('sdms', 'created_at');

        $hasUpdatedAt =
            Schema::hasColumn('sdms', 'updated_at');


        /*
    |--------------------------------------------------------------------------
    | MASTER JABATAN
    |--------------------------------------------------------------------------
    */

        $jabatans =
            DB::table('jabatans')
            ->select(
                'id',
                'jabat'
            )
            ->orderBy('jabat')
            ->get()
            ->map(function ($item) {

                $item->jabat =
                    trim((string) $item->jabat);

                return $item;
            });


        /*
    |--------------------------------------------------------------------------
    | MASTER DEPARTEMEN
    |--------------------------------------------------------------------------
    */

        $departemens =
            collect();

        if (Schema::hasTable('departemens')) {

            $departemens =
                DB::table('departemens')
                ->select(
                    'id',
                    'nama_dep',
                    'kode_dep'
                )
                ->orderBy('kode_dep')
                ->get()
                ->map(function ($item) {

                    /*
                     * Legacy:
                     * nama_dep = kode
                     * kode_dep = nama
                     */

                    $item->nama_dep =
                        trim((string) $item->nama_dep);

                    $item->kode_dep =
                        trim((string) $item->kode_dep);

                    return $item;
                });
        }


        /*
    |--------------------------------------------------------------------------
    | MASTER DIVISI
    |--------------------------------------------------------------------------
    */

        $divisis =
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
                'departemens.kode_dep as nama_departemen'
            )

            ->orderBy('divisis.nama_div')

            ->get()

            ->map(function ($item) {

                $item->kode_div =
                    trim((string) $item->kode_div);

                $item->nama_div =
                    trim((string) $item->nama_div);

                $item->nama_departemen =
                    !empty($item->nama_departemen)
                    ? trim((string) $item->nama_departemen)
                    : 'Belum terhubung';

                return $item;
            });


        /*
    |--------------------------------------------------------------------------
    | SDM
    |--------------------------------------------------------------------------
    |
    | LEFT JOIN dipakai agar data legacy yang id_jabat / id_div
    | tidak valid tetap terlihat.
    |
    */

        $query =
            DB::table('sdms')

            ->leftJoin(
                'jabatans',
                'sdms.id_jabat',
                '=',
                'jabatans.id'
            )

            ->leftJoin(
                'divisis',
                'sdms.id_div',
                '=',
                'divisis.id'
            )

            ->leftJoin(
                'departemens',
                'divisis.id_dep',
                '=',
                'departemens.id'
            )

            ->select(
                'sdms.id',
                'sdms.nama_sdm',
                'sdms.nip',
                'sdms.id_jabat',
                'sdms.id_div',

                'jabatans.jabat',

                'divisis.nama_div',
                'divisis.id_dep',

                'departemens.kode_dep as nama_departemen'
            );


        if ($hasCreatedAt) {
            $query->addSelect('sdms.created_at');
        }


        if ($hasUpdatedAt) {
            $query->addSelect('sdms.updated_at');
        }


        /*
    |--------------------------------------------------------------------------
    | DATA BARU PALING ATAS
    |--------------------------------------------------------------------------
    */

        if ($hasCreatedAt) {

            $query
                ->orderByRaw("
                CASE
                    WHEN sdms.created_at IS NULL THEN 1
                    ELSE 0
                END ASC
            ")
                ->orderByDesc('sdms.created_at')
                ->orderByDesc('sdms.id');
        } else {

            $query
                ->orderByDesc('sdms.id');
        }


        $sdms =
            $query
            ->get()
            ->map(function ($item) {

                $item->nama_sdm =
                    trim((string) $item->nama_sdm);

                $item->nip =
                    !empty($item->nip)
                    ? trim((string) $item->nip)
                    : '-';

                $item->jabat =
                    !empty($item->jabat)
                    ? trim((string) $item->jabat)
                    : 'Belum terhubung';

                $item->nama_div =
                    !empty($item->nama_div)
                    ? trim((string) $item->nama_div)
                    : 'Belum terhubung';

                $item->nama_departemen =
                    !empty($item->nama_departemen)
                    ? trim((string) $item->nama_departemen)
                    : 'Belum terhubung';

                if (!property_exists($item, 'created_at')) {
                    $item->created_at = null;
                }

                if (!property_exists($item, 'updated_at')) {
                    $item->updated_at = null;
                }

                return $item;
            });


        /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

        $totalSdm =
            $sdms->count();


        $totalDepartemen =
            Schema::hasTable('departemens')
            ? DB::table('departemens')->count()
            : 0;


        $totalDivisi =
            DB::table('divisis')
            ->count();


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


        if ($hasUpdatedAt) {

            $latestTimestamp =
                DB::table('sdms')
                ->whereNotNull('updated_at')
                ->orderByDesc('updated_at')
                ->value('updated_at');
        }


        if (
            !$latestTimestamp &&
            $hasCreatedAt
        ) {

            $latestTimestamp =
                DB::table('sdms')
                ->whereNotNull('created_at')
                ->orderByDesc('created_at')
                ->value('created_at');
        }


        if ($latestTimestamp) {

            $date =
                Carbon::parse($latestTimestamp)
                ->locale('id');


            if ($date->isToday()) {

                $updateTerakhirLabel =
                    'Hari Ini';
            } elseif ($date->isYesterday()) {

                $updateTerakhirLabel =
                    'Kemarin';
            } else {

                $updateTerakhirLabel =
                    $date->diffForHumans();
            }


            $updateTerakhirDetail =
                $date->translatedFormat(
                    'd M Y, H:i'
                )
                .
                ' WITA';
        }


        /*
    |--------------------------------------------------------------------------
    | DISTRIBUSI PER DIVISI
    |--------------------------------------------------------------------------
    */

        $distribusiSdm =
            DB::table('sdms')

            ->leftJoin(
                'divisis',
                'sdms.id_div',
                '=',
                'divisis.id'
            )

            ->select(
                'sdms.id_div',
                'divisis.nama_div',
                DB::raw(
                    'COUNT(sdms.id) AS total'
                )
            )

            ->groupBy(
                'sdms.id_div',
                'divisis.nama_div'
            )

            ->orderByDesc('total')

            ->get()

            ->map(function ($item) use ($totalSdm) {

                $item->nama_div =
                    !empty($item->nama_div)
                    ? trim((string) $item->nama_div)
                    : 'Belum terhubung';

                $item->total =
                    (int) $item->total;

                $item->persentase =
                    $totalSdm > 0
                    ? round(
                        ($item->total / $totalSdm) * 100,
                        1
                    )
                    : 0;

                return $item;
            });


        /*
    |--------------------------------------------------------------------------
    | SDM TERBARU
    |--------------------------------------------------------------------------
    */

        $sdmTerbaru =
            $sdms
            ->take(5)
            ->values();


        /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

        $sdmActivityLogs =
            collect();

        $sdmTambah = 0;
        $sdmHapus = 0;
        $sdmDelta = 0;


        if (
            Schema::hasTable(
                'master_data_activity_logs'
            )
        ) {

            $sdmActivityLogs =
                DB::table(
                    'master_data_activity_logs'
                )
                ->where(
                    'module',
                    'sdm'
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
                ->orderByDesc('id')
                ->get();


            $sdmTambah =
                $sdmActivityLogs
                ->where(
                    'action',
                    'created'
                )
                ->count();


            $sdmHapus =
                $sdmActivityLogs
                ->where(
                    'action',
                    'deleted'
                )
                ->count();


            $sdmDelta =
                $sdmTambah -
                $sdmHapus;
        }


        return view(
            'master.data_sdm',
            compact(
                'sdms',
                'jabatans',
                'divisis',
                'departemens',
                'totalSdm',
                'totalDepartemen',
                'totalDivisi',
                'updateTerakhirLabel',
                'updateTerakhirDetail',
                'distribusiSdm',
                'sdmTerbaru',
                'sdmActivityLogs',
                'sdmTambah',
                'sdmHapus',
                'sdmDelta',
                'hasCreatedAt',
                'hasUpdatedAt'
            )
        );
    }


    /*
|--------------------------------------------------------------------------
| STORE SDM
|--------------------------------------------------------------------------
*/

    public function storeSdm(
        Request $request
    ) {

        $validated =
            $request->validate(
                [

                    'nama_sdm' => [
                        'required',
                        'string',
                        'max:255',
                    ],

                    'nip' => [
                        'required',
                        'string',
                        'max:255',
                    ],

                    'id_jabat' => [
                        'required',
                        'integer',
                        'exists:jabatans,id',
                    ],

                    'id_div' => [
                        'required',
                        'integer',
                        'exists:divisis,id',
                    ],

                ],
                [

                    'nama_sdm.required' =>
                    'Nama SDM wajib diisi.',

                    'nip.required' =>
                    'NIP/NIPP wajib diisi.',

                    'id_jabat.required' =>
                    'Jabatan wajib dipilih.',

                    'id_jabat.exists' =>
                    'Jabatan tidak valid.',

                    'id_div.required' =>
                    'Divisi wajib dipilih.',

                    'id_div.exists' =>
                    'Divisi tidak valid.',

                ]
            );


        $data = [

            'nama_sdm' =>
            trim(
                $validated['nama_sdm']
            ),

            'nip' =>
            trim(
                $validated['nip']
            ),

            'id_jabat' =>
            (int)
            $validated['id_jabat'],

            'id_div' =>
            (int)
            $validated['id_div'],

        ];


        if (
            Schema::hasColumn(
                'sdms',
                'created_at'
            )
        ) {

            $data['created_at'] =
                now();
        }


        if (
            Schema::hasColumn(
                'sdms',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        $id =
            DB::transaction(
                function () use ($data) {

                    $id =
                        DB::table('sdms')
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
                                    'sdm',

                                    'record_id' =>
                                    $id,

                                    'record_name' =>
                                    $data['nama_sdm'],

                                    'record_code' =>
                                    $data['nip'],

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

            return response()->json(
                [

                    'success' =>
                    true,

                    'message' =>
                    'SDM Pendukung berhasil ditambahkan.',

                    'id' =>
                    $id,

                ],
                201
            );
        }


        return redirect()
            ->route(
                'master.data_sdm'
            )
            ->with(
                'success',
                'SDM Pendukung berhasil ditambahkan.'
            );
    }


    /*
|--------------------------------------------------------------------------
| UPDATE SDM
|--------------------------------------------------------------------------
*/

    public function updateSdm(
        Request $request,
        int $id
    ) {

        $sdm =
            DB::table('sdms')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$sdm) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()->json(
                    [

                        'success' =>
                        false,

                        'message' =>
                        'Data SDM Pendukung tidak ditemukan.',

                    ],
                    404
                );
            }


            return redirect()
                ->route(
                    'master.data_sdm'
                )
                ->with(
                    'error',
                    'Data SDM Pendukung tidak ditemukan.'
                );
        }


        $validated =
            $request->validate(
                [

                    'nama_sdm' => [
                        'required',
                        'string',
                        'max:255',
                    ],

                    'nip' => [
                        'required',
                        'string',
                        'max:255',
                    ],

                    'id_jabat' => [
                        'required',
                        'integer',
                        'exists:jabatans,id',
                    ],

                    'id_div' => [
                        'required',
                        'integer',
                        'exists:divisis,id',
                    ],

                ]
            );


        $data = [

            'nama_sdm' =>
            trim(
                $validated['nama_sdm']
            ),

            'nip' =>
            trim(
                $validated['nip']
            ),

            'id_jabat' =>
            (int)
            $validated['id_jabat'],

            'id_div' =>
            (int)
            $validated['id_div'],

        ];


        /*
     * created_at TIDAK DIUBAH.
     *
     * Edit bukan data baru.
     */

        if (
            Schema::hasColumn(
                'sdms',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        DB::table('sdms')
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

            return response()->json(
                [

                    'success' =>
                    true,

                    'message' =>
                    'SDM Pendukung berhasil diperbarui.',

                    'id' =>
                    $id,

                ]
            );
        }


        return redirect()
            ->route(
                'master.data_sdm'
            )
            ->with(
                'success',
                'SDM Pendukung berhasil diperbarui.'
            );
    }


    /*
|--------------------------------------------------------------------------
| DELETE SDM
|--------------------------------------------------------------------------
*/

    public function deleteSdm(
        Request $request,
        int $id
    ) {

        $sdm =
            DB::table('sdms')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$sdm) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()->json(
                    [

                        'success' =>
                        false,

                        'message' =>
                        'Data SDM Pendukung tidak ditemukan.',

                    ],
                    404
                );
            }


            return redirect()
                ->route(
                    'master.data_sdm'
                )
                ->with(
                    'error',
                    'Data SDM Pendukung tidak ditemukan.'
                );
        }


        $recordName =
            trim(
                (string)
                $sdm->nama_sdm
            );


        $recordCode =
            !empty($sdm->nip)
            ? trim(
                (string)
                $sdm->nip
            )
            : '-';


        $recordCreatedAt =
            $sdm->created_at
            ??
            null;


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
                                    'sdm',

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


                    DB::table('sdms')
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
                'SDM Pendukung tidak dapat dihapus karena masih digunakan oleh data lain.';


            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()->json(
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
                    'master.data_sdm'
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

            return response()->json(
                [

                    'success' =>
                    true,

                    'message' =>
                    'SDM Pendukung berhasil dihapus.',

                    'id' =>
                    $id,

                ]
            );
        }


        return redirect()
            ->route(
                'master.data_sdm'
            )
            ->with(
                'success',
                'SDM Pendukung berhasil dihapus.'
            );
    }

    // ============================================================
    // DATA BAHAN
    // ============================================================

    public function dataBahan()
    {
        if (!Schema::hasTable('bahans')) {
            abort(
                500,
                'Tabel bahans tidak ditemukan pada database.'
            );
        }


        $hasCreatedAt =
            Schema::hasColumn(
                'bahans',
                'created_at'
            );


        $hasUpdatedAt =
            Schema::hasColumn(
                'bahans',
                'updated_at'
            );


        /*
    |--------------------------------------------------------------------------
    | QUERY BAHAN
    |--------------------------------------------------------------------------
    */

        $query =
            DB::table('bahans')
            ->select(
                'bahans.id',
                'bahans.nama'
            );


        if ($hasCreatedAt) {

            $query->addSelect(
                'bahans.created_at'
            );
        }


        if ($hasUpdatedAt) {

            $query->addSelect(
                'bahans.updated_at'
            );
        }


        /*
    |--------------------------------------------------------------------------
    | DATA BARU DI ATAS
    |--------------------------------------------------------------------------
    |
    | Data baru memiliki created_at.
    | Data legacy yang created_at NULL tetap ditampilkan,
    | tetapi berada setelah data baru.
    |
    */

        if ($hasCreatedAt) {

            $query
                ->orderByRaw("
                CASE
                    WHEN bahans.created_at IS NULL
                    THEN 1
                    ELSE 0
                END ASC
            ")
                ->orderByDesc(
                    'bahans.created_at'
                )
                ->orderByDesc(
                    'bahans.id'
                );
        } else {

            $query
                ->orderByDesc(
                    'bahans.id'
                );
        }


        $bahans =
            $query
            ->get()
            ->map(
                function ($item) {

                    $item->nama =
                        trim(
                            (string) $item->nama
                        );


                    if (
                        !property_exists(
                            $item,
                            'created_at'
                        )
                    ) {

                        $item->created_at =
                            null;
                    }


                    if (
                        !property_exists(
                            $item,
                            'updated_at'
                        )
                    ) {

                        $item->updated_at =
                            null;
                    }


                    return $item;
                }
            );


        /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

        $totalBahan =
            $bahans->count();


        $totalBahanModern =
            $bahans
            ->filter(
                fn($item) =>
                !empty($item->created_at)
            )
            ->count();


        $totalBahanLegacy =
            $totalBahan -
            $totalBahanModern;


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


        if ($hasUpdatedAt) {

            $latestTimestamp =
                DB::table('bahans')
                ->whereNotNull(
                    'updated_at'
                )
                ->orderByDesc(
                    'updated_at'
                )
                ->value(
                    'updated_at'
                );
        }


        if (
            !$latestTimestamp
            &&
            $hasCreatedAt
        ) {

            $latestTimestamp =
                DB::table('bahans')
                ->whereNotNull(
                    'created_at'
                )
                ->orderByDesc(
                    'created_at'
                )
                ->value(
                    'created_at'
                );
        }


        if ($latestTimestamp) {

            $latestDate =
                Carbon::parse(
                    $latestTimestamp
                )
                ->locale('id');


            if (
                $latestDate->isToday()
            ) {

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
    | BAHAN TERBARU
    |--------------------------------------------------------------------------
    */

        $bahanTerbaru =
            $bahans
            ->take(5)
            ->values();


        /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

        $bahanActivityLogs =
            collect();


        $bahanTambah =
            0;


        $bahanHapus =
            0;


        $bahanDelta =
            0;


        if (
            Schema::hasTable(
                'master_data_activity_logs'
            )
        ) {

            $bahanActivityLogs =
                DB::table(
                    'master_data_activity_logs'
                )
                ->where(
                    'module',
                    'bahan'
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


            $bahanTambah =
                $bahanActivityLogs
                ->where(
                    'action',
                    'created'
                )
                ->count();


            $bahanHapus =
                $bahanActivityLogs
                ->where(
                    'action',
                    'deleted'
                )
                ->count();


            $bahanDelta =
                $bahanTambah -
                $bahanHapus;
        }


        return view(
            'master.data_bahan',
            compact(
                'bahans',
                'totalBahan',
                'totalBahanModern',
                'totalBahanLegacy',
                'bahanTerbaru',
                'bahanActivityLogs',
                'bahanTambah',
                'bahanHapus',
                'bahanDelta',
                'hasCreatedAt',
                'hasUpdatedAt',
                'updateTerakhirLabel',
                'updateTerakhirDetail'
            )
        );
    }



    // ============================================================
    // STORE BAHAN
    // ============================================================

    public function storeBahan(
        Request $request
    ) {

        $validated =
            $request->validate(
                [
                    'nama' => [
                        'required',
                        'string',
                        'max:255',
                    ],
                ],
                [
                    'nama.required' =>
                    'Nama Bahan wajib diisi.',

                    'nama.max' =>
                    'Nama Bahan maksimal 255 karakter.',
                ]
            );


        $data = [

            'nama' =>
            trim(
                $validated['nama']
            ),

        ];


        if (
            Schema::hasColumn(
                'bahans',
                'created_at'
            )
        ) {

            $data['created_at'] =
                now();
        }


        if (
            Schema::hasColumn(
                'bahans',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        $id =
            DB::transaction(
                function () use (
                    $data
                ) {

                    $id =
                        DB::table(
                            'bahans'
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
                                    'bahan',

                                    'record_id' =>
                                    $id,

                                    'record_name' =>
                                    $data['nama'],

                                    'record_code' =>
                                    '-',

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

            return response()->json(
                [
                    'success' =>
                    true,

                    'message' =>
                    'Bahan berhasil ditambahkan.',

                    'id' =>
                    $id,
                ],
                201
            );
        }


        return redirect()
            ->route(
                'master.data_bahan'
            )
            ->with(
                'success',
                'Bahan berhasil ditambahkan.'
            );
    }



    // ============================================================
    // UPDATE BAHAN
    // ============================================================

    public function updateBahan(
        Request $request,
        int $id
    ) {

        $bahan =
            DB::table('bahans')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$bahan) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()->json(
                    [
                        'success' =>
                        false,

                        'message' =>
                        'Data Bahan tidak ditemukan.',
                    ],
                    404
                );
            }


            return redirect()
                ->route(
                    'master.data_bahan'
                )
                ->with(
                    'error',
                    'Data Bahan tidak ditemukan.'
                );
        }


        $validated =
            $request->validate(
                [
                    'nama' => [
                        'required',
                        'string',
                        'max:255',
                    ],
                ],
                [
                    'nama.required' =>
                    'Nama Bahan wajib diisi.',
                ]
            );


        $data = [

            'nama' =>
            trim(
                $validated['nama']
            ),

        ];


        /*
    |--------------------------------------------------------------------------
    | JANGAN UBAH CREATED_AT SAAT EDIT
    |--------------------------------------------------------------------------
    */

        if (
            Schema::hasColumn(
                'bahans',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }


        DB::table('bahans')
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

            return response()->json(
                [
                    'success' =>
                    true,

                    'message' =>
                    'Bahan berhasil diperbarui.',

                    'id' =>
                    $id,
                ]
            );
        }


        return redirect()
            ->route(
                'master.data_bahan'
            )
            ->with(
                'success',
                'Bahan berhasil diperbarui.'
            );
    }



    // ============================================================
    // DELETE BAHAN
    // ============================================================

    public function deleteBahan(
        Request $request,
        int $id
    ) {

        $bahan =
            DB::table('bahans')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$bahan) {

            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()->json(
                    [
                        'success' =>
                        false,

                        'message' =>
                        'Data Bahan tidak ditemukan.',
                    ],
                    404
                );
            }


            return redirect()
                ->route(
                    'master.data_bahan'
                )
                ->with(
                    'error',
                    'Data Bahan tidak ditemukan.'
                );
        }


        $recordName =
            trim(
                (string) $bahan->nama
            );


        $recordCreatedAt =
            $bahan->created_at
            ??
            null;


        try {

            DB::transaction(
                function () use (
                    $id,
                    $recordName,
                    $recordCreatedAt
                ) {

                    /*
                |--------------------------------------------------------------------------
                | SIMPAN HISTORY SEBELUM DELETE
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
                                    'bahan',

                                    'record_id' =>
                                    $id,

                                    'record_name' =>
                                    $recordName,

                                    'record_code' =>
                                    '-',

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


                    DB::table('bahans')
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
                'Bahan tidak dapat dihapus karena masih digunakan oleh data lain.';


            if (
                $request->expectsJson()
                ||
                $request->ajax()
            ) {

                return response()->json(
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
                    'master.data_bahan'
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

            return response()->json(
                [
                    'success' =>
                    true,

                    'message' =>
                    'Bahan berhasil dihapus.',

                    'id' =>
                    $id,
                ]
            );
        }


        return redirect()
            ->route(
                'master.data_bahan'
            )
            ->with(
                'success',
                'Bahan berhasil dihapus.'
            );
    }
    // ============================================================
    // DATA LOKASI
    // ============================================================

    public function dataLokasi()
    {
        if (!Schema::hasTable('lokasis')) {
            abort(500, 'Tabel lokasis tidak ditemukan pada database.');
        }

        $hasCreatedAt = Schema::hasColumn('lokasis', 'created_at');
        $hasUpdatedAt = Schema::hasColumn('lokasis', 'updated_at');

        /*
    |--------------------------------------------------------------------------
    | WILAYAH
    |--------------------------------------------------------------------------
    | Web lama memakai:
    | lokasis.wilayah -> aset_wilayah.id
    */

        $wilayahs = collect();

        if (Schema::hasTable('aset_wilayah')) {
            $wilayahs = DB::table('aset_wilayah')
                ->select('id', 'wilayah')
                ->orderBy('wilayah')
                ->get();
        }

        /*
    |--------------------------------------------------------------------------
    | DATA LOKASI
    |--------------------------------------------------------------------------
    */

        $query = DB::table('lokasis')
            ->leftJoin(
                'aset_wilayah',
                'lokasis.wilayah',
                '=',
                'aset_wilayah.id'
            )
            ->select(
                'lokasis.id',
                'lokasis.lokasi',
                'lokasis.alamat',
                'lokasis.lat',
                'lokasis.long',
                'lokasis.img',
                'lokasis.cat',
                'lokasis.wilayah as wilayah_id',
                'aset_wilayah.wilayah as nama_wilayah'
            );

        if ($hasCreatedAt) {
            $query->addSelect('lokasis.created_at');
        }

        if ($hasUpdatedAt) {
            $query->addSelect('lokasis.updated_at');
        }

        /*
    |--------------------------------------------------------------------------
    | DATA BARU PALING ATAS
    |--------------------------------------------------------------------------
    */

        if ($hasCreatedAt) {
            $query
                ->orderByRaw("
                CASE
                    WHEN lokasis.created_at IS NULL THEN 1
                    ELSE 0
                END ASC
            ")
                ->orderByDesc('lokasis.created_at')
                ->orderByDesc('lokasis.id');
        } else {
            $query->orderByDesc('lokasis.id');
        }

        $lokasis = $query->get();

        /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

        $totalLokasi = $lokasis->count();

        $totalWilayah = $lokasis
            ->pluck('wilayah_id')
            ->filter()
            ->unique()
            ->count();

        $lokasiDenganKoordinat = $lokasis
            ->filter(function ($item) {
                $lat = trim((string) ($item->lat ?? ''));
                $long = trim((string) ($item->long ?? ''));

                return $lat !== ''
                    && $long !== ''
                    && !($lat === '0' && $long === '0')
                    && !($lat === '-0' && $long === '0');
            })
            ->count();

        /*
    |--------------------------------------------------------------------------
    | UPDATE TERAKHIR
    |--------------------------------------------------------------------------
    */

        $updateTerakhirLabel = 'Belum ada data';
        $updateTerakhirDetail = 'Belum ada perubahan';

        $latestTimestamp = null;

        if ($hasUpdatedAt) {
            $latestTimestamp = DB::table('lokasis')
                ->whereNotNull('updated_at')
                ->orderByDesc('updated_at')
                ->value('updated_at');
        }

        if (!$latestTimestamp && $hasCreatedAt) {
            $latestTimestamp = DB::table('lokasis')
                ->whereNotNull('created_at')
                ->orderByDesc('created_at')
                ->value('created_at');
        }

        if ($latestTimestamp) {
            $latest = Carbon::parse($latestTimestamp)
                ->locale('id');

            if ($latest->isToday()) {
                $updateTerakhirLabel = 'Hari Ini';
            } elseif ($latest->isYesterday()) {
                $updateTerakhirLabel = 'Kemarin';
            } else {
                $updateTerakhirLabel = $latest->diffForHumans();
            }

            $updateTerakhirDetail =
                $latest->translatedFormat('d M Y, H:i') . ' WITA';
        }

        /*
    |--------------------------------------------------------------------------
    | LOKASI TERBARU
    |--------------------------------------------------------------------------
    */

        $lokasiTerbaru = $lokasis
            ->take(5)
            ->values();

        /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

        $lokasiActivityLogs = collect();
        $lokasiTambah = 0;
        $lokasiHapus = 0;
        $lokasiDelta = 0;

        if (Schema::hasTable('master_data_activity_logs')) {
            $lokasiActivityLogs =
                DB::table('master_data_activity_logs')
                ->where('module', 'lokasi')
                ->whereIn(
                    'action',
                    ['created', 'deleted']
                )
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->get();

            $lokasiTambah =
                $lokasiActivityLogs
                ->where('action', 'created')
                ->count();

            $lokasiHapus =
                $lokasiActivityLogs
                ->where('action', 'deleted')
                ->count();

            $lokasiDelta =
                $lokasiTambah - $lokasiHapus;
        }

        return view(
            'master.data_lokasi',
            compact(
                'lokasis',
                'wilayahs',
                'totalLokasi',
                'totalWilayah',
                'lokasiDenganKoordinat',
                'lokasiTerbaru',
                'lokasiActivityLogs',
                'lokasiTambah',
                'lokasiHapus',
                'lokasiDelta',
                'updateTerakhirLabel',
                'updateTerakhirDetail',
                'hasCreatedAt',
                'hasUpdatedAt'
            )
        );
    }



    // ============================================================
    // STORE LOKASI
    // ============================================================

    public function storeLokasi(Request $request)
    {
        $validated = $request->validate([
            'lokasi' => [
                'required',
                'string',
                'max:255',
            ],

            'alamat' => [
                'nullable',
                'string',
                'max:255',
            ],

            'wilayah' => [
                'nullable',
                'integer',
            ],

            'lat' => [
                'nullable',
                'string',
                'max:255',
            ],

            'long' => [
                'nullable',
                'string',
                'max:255',
            ],

            'img' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
            ],
        ], [
            'lokasi.required' =>
            'Nama Lokasi wajib diisi.',

            'img.image' =>
            'File gambar tidak valid.',

            'img.max' =>
            'Ukuran gambar maksimal 4 MB.',
        ]);

        if (
            !empty($validated['wilayah'])
            &&
            Schema::hasTable('aset_wilayah')
            &&
            !DB::table('aset_wilayah')
                ->where('id', $validated['wilayah'])
                ->exists()
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Wilayah yang dipilih tidak ditemukan.',
            ], 422);
        }

        $imageName = null;

        /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

        if ($request->hasFile('img')) {
            $directory =
                public_path('uploads/lokasi');

            if (!File::isDirectory($directory)) {
                File::makeDirectory(
                    $directory,
                    0755,
                    true
                );
            }

            $file =
                $request->file('img');

            $imageName =
                now()->format('YmdHis')
                . '_'
                . bin2hex(random_bytes(5))
                . '.'
                . $file->getClientOriginalExtension();

            $file->move(
                $directory,
                $imageName
            );
        }

        $data = [
            'lokasi' =>
            trim($validated['lokasi']),

            'alamat' =>
            isset($validated['alamat'])
                ? trim($validated['alamat'])
                : null,

            'wilayah' =>
            $validated['wilayah']
                ?? null,

            'lat' =>
            isset($validated['lat'])
                ? trim($validated['lat'])
                : null,

            'long' =>
            isset($validated['long'])
                ? trim($validated['long'])
                : null,

            'img' =>
            $imageName,
        ];

        /*
    |--------------------------------------------------------------------------
    | CAT
    |--------------------------------------------------------------------------
    | Tidak kita sentuh karena fungsi bisnisnya belum digunakan halaman lama.
    */

        if (Schema::hasColumn('lokasis', 'created_at')) {
            $data['created_at'] = now();
        }

        if (Schema::hasColumn('lokasis', 'updated_at')) {
            $data['updated_at'] = now();
        }

        try {
            $id = DB::transaction(
                function () use ($data) {

                    $id =
                        DB::table('lokasis')
                        ->insertGetId($data);

                    if (
                        Schema::hasTable(
                            'master_data_activity_logs'
                        )
                    ) {
                        DB::table(
                            'master_data_activity_logs'
                        )->insert([
                            'module' =>
                            'lokasi',

                            'record_id' =>
                            $id,

                            'record_name' =>
                            $data['lokasi'],

                            'record_code' =>
                            '-',

                            'action' =>
                            'created',

                            'record_created_at' =>
                            $data['created_at']
                                ?? now(),

                            'created_at' =>
                            now(),

                            'updated_at' =>
                            now(),
                        ]);
                    }

                    return $id;
                }
            );
        } catch (\Throwable $error) {

            if (
                $imageName
                &&
                File::exists(
                    public_path(
                        'uploads/lokasi/'
                            . $imageName
                    )
                )
            ) {
                File::delete(
                    public_path(
                        'uploads/lokasi/'
                            . $imageName
                    )
                );
            }

            throw $error;
        }

        if (
            $request->expectsJson()
            ||
            $request->ajax()
        ) {
            return response()->json([
                'success' => true,
                'message' =>
                'Lokasi berhasil ditambahkan.',
                'id' => $id,
            ], 201);
        }

        return redirect()
            ->route('master.data_lokasi')
            ->with(
                'success',
                'Lokasi berhasil ditambahkan.'
            );
    }



    // ============================================================
    // UPDATE LOKASI
    // ============================================================

    public function updateLokasi(
        Request $request,
        int $id
    ) {
        $lokasi =
            DB::table('lokasis')
            ->where('id', $id)
            ->first();

        if (!$lokasi) {
            return response()->json([
                'success' => false,
                'message' =>
                'Data Lokasi tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'lokasi' => [
                'required',
                'string',
                'max:255',
            ],

            'alamat' => [
                'nullable',
                'string',
                'max:255',
            ],

            'wilayah' => [
                'nullable',
                'integer',
            ],

            'lat' => [
                'nullable',
                'string',
                'max:255',
            ],

            'long' => [
                'nullable',
                'string',
                'max:255',
            ],

            'img' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
            ],
        ]);

        if (
            !empty($validated['wilayah'])
            &&
            Schema::hasTable('aset_wilayah')
            &&
            !DB::table('aset_wilayah')
                ->where('id', $validated['wilayah'])
                ->exists()
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                'Wilayah yang dipilih tidak ditemukan.',
            ], 422);
        }

        $data = [
            'lokasi' =>
            trim($validated['lokasi']),

            'alamat' =>
            isset($validated['alamat'])
                ? trim($validated['alamat'])
                : null,

            'wilayah' =>
            $validated['wilayah']
                ?? null,

            'lat' =>
            isset($validated['lat'])
                ? trim($validated['lat'])
                : null,

            'long' =>
            isset($validated['long'])
                ? trim($validated['long'])
                : null,
        ];

        $newImageName = null;

        if ($request->hasFile('img')) {

            $directory =
                public_path(
                    'uploads/lokasi'
                );

            if (!File::isDirectory($directory)) {
                File::makeDirectory(
                    $directory,
                    0755,
                    true
                );
            }

            $file =
                $request->file('img');

            $newImageName =
                now()->format('YmdHis')
                . '_'
                . bin2hex(random_bytes(5))
                . '.'
                . $file->getClientOriginalExtension();

            $file->move(
                $directory,
                $newImageName
            );

            $data['img'] =
                $newImageName;
        }

        if (Schema::hasColumn('lokasis', 'updated_at')) {
            $data['updated_at'] = now();
        }

        try {

            DB::table('lokasis')
                ->where('id', $id)
                ->update($data);
        } catch (\Throwable $error) {

            if (
                $newImageName
                &&
                File::exists(
                    public_path(
                        'uploads/lokasi/'
                            . $newImageName
                    )
                )
            ) {
                File::delete(
                    public_path(
                        'uploads/lokasi/'
                            . $newImageName
                    )
                );
            }

            throw $error;
        }

        /*
    |--------------------------------------------------------------------------
    | DELETE IMAGE BARU-LAMA
    |--------------------------------------------------------------------------
    | Hanya hapus file yang memang dikelola aplikasi modern.
    | Jangan menghapus file legacy secara sembarangan.
    */

        if (
            $newImageName
            &&
            !empty($lokasi->img)
        ) {
            $oldModernImage =
                public_path(
                    'uploads/lokasi/'
                        . basename($lokasi->img)
                );

            if (File::exists($oldModernImage)) {
                File::delete($oldModernImage);
            }
        }

        return response()->json([
            'success' => true,
            'message' =>
            'Lokasi berhasil diperbarui.',
            'id' => $id,
        ]);
    }



    // ============================================================
    // DELETE LOKASI
    // ============================================================

    public function deleteLokasi(
        Request $request,
        int $id
    ) {
        $lokasi =
            DB::table('lokasis')
            ->where('id', $id)
            ->first();

        if (!$lokasi) {
            return response()->json([
                'success' => false,
                'message' =>
                'Data Lokasi tidak ditemukan.',
            ], 404);
        }

        try {

            DB::transaction(
                function () use ($lokasi, $id) {

                    if (
                        Schema::hasTable(
                            'master_data_activity_logs'
                        )
                    ) {
                        DB::table(
                            'master_data_activity_logs'
                        )->insert([
                            'module' =>
                            'lokasi',

                            'record_id' =>
                            $id,

                            'record_name' =>
                            $lokasi->lokasi,

                            'record_code' =>
                            '-',

                            'action' =>
                            'deleted',

                            'record_created_at' =>
                            $lokasi->created_at
                                ?? null,

                            'created_at' =>
                            now(),

                            'updated_at' =>
                            now(),
                        ]);
                    }

                    DB::table('lokasis')
                        ->where('id', $id)
                        ->delete();
                }
            );
        } catch (\Throwable $error) {

            report($error);

            return response()->json([
                'success' => false,
                'message' =>
                'Lokasi tidak dapat dihapus karena kemungkinan masih digunakan oleh data aset lain.',
            ], 409);
        }

        /*
    |--------------------------------------------------------------------------
    | DELETE IMAGE MODERN
    |--------------------------------------------------------------------------
    */

        if (!empty($lokasi->img)) {

            $image =
                public_path(
                    'uploads/lokasi/'
                        . basename($lokasi->img)
                );

            if (File::exists($image)) {
                File::delete($image);
            }
        }

        return response()->json([
            'success' => true,
            'message' =>
            'Lokasi berhasil dihapus.',
            'id' => $id,
        ]);
    }

    // =========================================================
    // KODE AKTIVA
    // =========================================================

    public function dataAktiva()
    {
        if (!Schema::hasTable('aktivas')) {
            throw new \RuntimeException(
                'Tabel aktivas tidak ditemukan pada database.'
            );
        }


        $hasCreatedAt =
            Schema::hasColumn(
                'aktivas',
                'created_at'
            );


        $hasUpdatedAt =
            Schema::hasColumn(
                'aktivas',
                'updated_at'
            );


        // =====================================================
        // DATA UTAMA
        // =====================================================

        $aktivaQuery =
            DB::table('aktivas')
            ->select(
                'id',
                'kode',
                'aktiva',
                'gol',
                'kib'
            );


        if ($hasCreatedAt) {
            $aktivaQuery->addSelect(
                'created_at'
            );
        }


        if ($hasUpdatedAt) {
            $aktivaQuery->addSelect(
                'updated_at'
            );
        }


        /*
    |--------------------------------------------------------------------------
    | DATA TERBARU DI ATAS
    |--------------------------------------------------------------------------
    |
    | Data legacy banyak created_at = NULL.
    | Maka:
    |
    | 1. created_at yang tidak NULL ditampilkan dulu
    | 2. tanggal terbaru di atas
    | 3. ID terbesar sebagai fallback
    |
    */

        if ($hasCreatedAt) {

            $aktivaQuery

                ->orderByRaw(
                    '
                CASE
                    WHEN created_at IS NULL
                    THEN 1
                    ELSE 0
                END ASC
                '
                )

                ->orderByDesc(
                    'created_at'
                )

                ->orderByDesc(
                    'id'
                );
        } else {

            $aktivaQuery
                ->orderByDesc('id');
        }


        $aktivas =
            $aktivaQuery->get();



        // =====================================================
        // KPI
        // =====================================================

        $totalAktiva =
            DB::table('aktivas')
            ->count();


        $totalGolongan =
            DB::table('aktivas')

            ->whereNotNull('gol')

            ->where(
                'gol',
                '<>',
                ''
            )

            ->distinct()

            ->count('gol');


        $totalKib =
            DB::table('aktivas')

            ->whereNotNull('kib')

            ->where(
                'kib',
                '<>',
                ''
            )

            ->distinct()

            ->count('kib');



        // =====================================================
        // FILTER OPTIONS
        // =====================================================

        $golonganAktiva =
            DB::table('aktivas')

            ->whereNotNull('gol')

            ->where(
                'gol',
                '<>',
                ''
            )

            ->select('gol')

            ->distinct()

            ->orderBy('gol')

            ->pluck('gol');


        $kibAktiva =
            DB::table('aktivas')

            ->whereNotNull('kib')

            ->where(
                'kib',
                '<>',
                ''
            )

            ->select('kib')

            ->distinct()

            ->orderBy('kib')

            ->pluck('kib');



        // =====================================================
        // UPDATE TERAKHIR
        // =====================================================

        $updateTerakhirLabel =
            'Belum ada data';


        $updateTerakhirDetail =
            'Belum ada perubahan';


        $latestQuery =
            DB::table('aktivas');


        if (
            $hasCreatedAt
            &&
            $hasUpdatedAt
        ) {

            $latestData =
                $latestQuery

                ->where(
                    function ($query) {

                        $query
                            ->whereNotNull(
                                'created_at'
                            )

                            ->orWhereNotNull(
                                'updated_at'
                            );
                    }
                )

                ->orderByRaw(
                    '
                    COALESCE(
                        updated_at,
                        created_at
                    )
                    DESC NULLS LAST
                    '
                )

                ->orderByDesc('id')

                ->first();


            if ($latestData) {

                $latestDate =
                    $latestData->updated_at
                    ??
                    $latestData->created_at;


                if ($latestDate) {

                    $carbon =
                        \Carbon\Carbon::parse(
                            $latestDate
                        );


                    $updateTerakhirLabel =
                        $carbon
                        ->locale('id')
                        ->diffForHumans();


                    $updateTerakhirDetail =
                        $carbon
                        ->locale('id')
                        ->translatedFormat(
                            'd M Y, H:i'
                        );
                }
            }
        }



        // =====================================================
        // ACTIVITY LOG
        // =====================================================

        $aktivaActivityLogs =
            collect();


        $aktivaTambah = 0;

        $aktivaHapus = 0;

        $aktivaDelta = 0;


        if (
            Schema::hasTable(
                'master_data_activity_logs'
            )
        ) {

            $aktivaActivityLogs =
                DB::table(
                    'master_data_activity_logs'
                )

                ->where(
                    'module',
                    'kode_aktiva'
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


            $aktivaTambah =
                $aktivaActivityLogs

                ->where(
                    'action',
                    'created'
                )

                ->count();


            $aktivaHapus =
                $aktivaActivityLogs

                ->where(
                    'action',
                    'deleted'
                )

                ->count();


            $aktivaDelta =
                $aktivaTambah
                -
                $aktivaHapus;
        }



        return view(
            'master.data_aktiva',

            compact(

                'aktivas',

                'totalAktiva',

                'totalGolongan',

                'totalKib',

                'golonganAktiva',

                'kibAktiva',

                'updateTerakhirLabel',

                'updateTerakhirDetail',

                'aktivaActivityLogs',

                'aktivaTambah',

                'aktivaHapus',

                'aktivaDelta',

                'hasCreatedAt',

                'hasUpdatedAt'

            )
        );
    }



    // =========================================================
    // STORE KODE AKTIVA
    // =========================================================

    public function storeAktiva(
        Request $request
    ) {
        $validated =
            $request->validate([

                'kode' => [

                    'required',

                    'string',

                    'max:255',

                    Rule::unique(
                        'aktivas',
                        'kode'
                    )

                ],


                'aktiva' => [

                    'required',

                    'string',

                    'max:255'

                ],


                'gol' => [

                    'nullable',

                    'string',

                    'max:255'

                ],


                'kib' => [

                    'nullable',

                    'string',

                    'max:255'

                ],

            ]);



        $data = [

            'kode' =>
            trim(
                $validated['kode']
            ),

            'aktiva' =>
            trim(
                $validated['aktiva']
            ),

            'gol' =>
            isset(
                $validated['gol']
            )

                ? trim(
                    $validated['gol']
                )

                : null,

            'kib' =>
            isset(
                $validated['kib']
            )

                ? trim(
                    $validated['kib']
                )

                : null,

        ];



        if (
            Schema::hasColumn(
                'aktivas',
                'created_at'
            )
        ) {

            $data['created_at'] =
                now();
        }


        if (
            Schema::hasColumn(
                'aktivas',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }



        $id =
            DB::table('aktivas')
            ->insertGetId(
                $data
            );



        $this->logAktivaActivity(

            'created',

            $id,

            $data['aktiva']

        );



        if ($request->expectsJson()) {

            return response()->json([

                'success' =>
                true,

                'message' =>
                'Kode Aktiva berhasil ditambahkan.',

                'id' =>
                $id

            ]);
        }


        return redirect()

            ->route(
                'master.data_aktiva'
            )

            ->with(
                'success',
                'Kode Aktiva berhasil ditambahkan.'
            );
    }



    // =========================================================
    // UPDATE KODE AKTIVA
    // =========================================================

    public function updateAktiva(
        Request $request,
        int $id
    ) {
        $aktiva =
            DB::table('aktivas')
            ->where(
                'id',
                $id
            )
            ->first();


        if (!$aktiva) {

            if ($request->expectsJson()) {

                return response()->json([

                    'success' =>
                    false,

                    'message' =>
                    'Data Kode Aktiva tidak ditemukan.'

                ], 404);
            }


            abort(404);
        }



        $validated =
            $request->validate([

                'kode' => [

                    'required',

                    'string',

                    'max:255',

                    Rule::unique(
                        'aktivas',
                        'kode'
                    )
                        ->ignore(
                            $id
                        )

                ],


                'aktiva' => [

                    'required',

                    'string',

                    'max:255'

                ],


                'gol' => [

                    'nullable',

                    'string',

                    'max:255'

                ],


                'kib' => [

                    'nullable',

                    'string',

                    'max:255'

                ],

            ]);



        $data = [

            'kode' =>
            trim(
                $validated['kode']
            ),

            'aktiva' =>
            trim(
                $validated['aktiva']
            ),

            'gol' =>
            isset(
                $validated['gol']
            )

                ? trim(
                    $validated['gol']
                )

                : null,

            'kib' =>
            isset(
                $validated['kib']
            )

                ? trim(
                    $validated['kib']
                )

                : null,

        ];



        if (
            Schema::hasColumn(
                'aktivas',
                'updated_at'
            )
        ) {

            $data['updated_at'] =
                now();
        }



        DB::table('aktivas')

            ->where(
                'id',
                $id
            )

            ->update(
                $data
            );



        if ($request->expectsJson()) {

            return response()->json([

                'success' =>
                true,

                'message' =>
                'Kode Aktiva berhasil diperbarui.',

                'id' =>
                $id

            ]);
        }


        return redirect()

            ->route(
                'master.data_aktiva'
            )

            ->with(
                'success',
                'Kode Aktiva berhasil diperbarui.'
            );
    }



    // =========================================================
    // DELETE KODE AKTIVA
    // =========================================================

    public function deleteAktiva(
        Request $request,
        int $id
    ) {
        $aktiva =
            DB::table('aktivas')

            ->where(
                'id',
                $id
            )

            ->first();


        if (!$aktiva) {

            if ($request->expectsJson()) {

                return response()->json([

                    'success' =>
                    false,

                    'message' =>
                    'Data Kode Aktiva tidak ditemukan.'

                ], 404);
            }


            abort(404);
        }



        try {


            DB::table('aktivas')

                ->where(
                    'id',
                    $id
                )

                ->delete();



            $this->logAktivaActivity(

                'deleted',

                $id,

                $aktiva->aktiva
                    ?? '-'

            );
        } catch (
            \Illuminate\Database\QueryException
            $exception
        ) {


            if ($request->expectsJson()) {

                return response()->json([

                    'success' =>
                    false,

                    'message' =>
                    'Kode Aktiva tidak dapat dihapus karena masih digunakan oleh data lain.'

                ], 409);
            }


            throw $exception;
        }



        if ($request->expectsJson()) {

            return response()->json([

                'success' =>
                true,

                'message' =>
                'Kode Aktiva berhasil dihapus.',

                'id' =>
                $id

            ]);
        }


        return redirect()

            ->route(
                'master.data_aktiva'
            )

            ->with(
                'success',
                'Kode Aktiva berhasil dihapus.'
            );
    }



    // =========================================================
    // ACTIVITY LOGGER KODE AKTIVA
    // =========================================================

    private function logAktivaActivity(
        string $action,
        int $recordId,
        string $recordName
    ): void {
        if (
            !Schema::hasTable(
                'master_data_activity_logs'
            )
        ) {

            return;
        }


        $columns =
            Schema::getColumnListing(
                'master_data_activity_logs'
            );


        $payload = [

            'module' =>
            'kode_aktiva',

            'action' =>
            $action,

            'record_id' =>
            $recordId,

            'record_name' =>
            $recordName,

            'created_at' =>
            now(),

            'updated_at' =>
            now(),

        ];


        $payload =
            array_intersect_key(

                $payload,

                array_flip(
                    $columns
                )

            );


        if (!empty($payload)) {

            DB::table(
                'master_data_activity_logs'
            )
                ->insert(
                    $payload
                );
        }
    }
}
