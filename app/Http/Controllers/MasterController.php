<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

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

                $tanggal = Carbon::parse(
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
        | DELTA BARANG
        |--------------------------------------------------------------------------
        |
        | Tambah : +1
        | Hapus  : -1
        | Edit   : tidak mengubah jumlah barang
        |
        */

        $barangDelta =
            session()->pull(
                'barang_delta',
                0
            );


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
                'barangDelta'
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
        | DELTA +1
        |--------------------------------------------------------------------------
        */

        session()->put(
            'barang_delta',

            session()->get(
                'barang_delta',
                0
            ) + 1
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
        | DELETE DATABASE
        |--------------------------------------------------------------------------
        */

        DB::table('barangs')
            ->where(
                'id',
                $id
            )
            ->delete();


        /*
        |--------------------------------------------------------------------------
        | DELTA -1
        |--------------------------------------------------------------------------
        */

        session()->put(
            'barang_delta',

            session()->get(
                'barang_delta',
                0
            ) - 1
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
    | DEPARTEMEN
    |--------------------------------------------------------------------------
    */

    public function dataDepartemen()
    {
        $departemen =
            DB::table('departemen')
            ->orderByDesc(
                'id'
            )
            ->get();


        return view(
            'master.data_departemen',
            compact(
                'departemen'
            )
        );
    }
}
