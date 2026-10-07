<?php

use Illuminate\Support\Facades\Route;
use App\Models\Barang;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\KIBController;
use App\Http\Controllers\DashboardController;


Route::get('/', function () {
    return redirect()->route('login');
});


Route::get('/login', function () {
    return view('auth.login');
})->name('login');


/*
|--------------------------------------------------------------------------
| TEMPORARY LOGIN
|--------------------------------------------------------------------------
|
| Ini hanya sementara.
| Nanti akan kita ganti menggunakan autentikasi database.
|
*/

Route::post('/login', function () {

    return redirect()->route('dashboard');
})->name('login.submit');



// ------------------------------------------------
// DASHBOARD ROUTES
// -------------------------------------------------
Route::get(
    '/dashboard',
    [DashboardController::class, 'index']
)->name('dashboard');


Route::get('/nilai-aset', function () {

    return view('main.nilai');
})->name('main.nilai');


Route::get('/arsip', function () {

    return view('main.arsip');
})->name('main.arsip');


// ------------------------------------------------
// MASTER DATA ROUTES
// ------------------------------------------------
// ========================================================
// MASTER DATA - BARANG
// ========================================================

Route::get(
    '/master-data/barang',
    [MasterController::class, 'dataBarang']
)->name('master.data_barang');


Route::post(
    '/master-data/barang',
    [MasterController::class, 'storebarang']
)->name('master.data_barang.store');


Route::put(
    '/master-data/barang/{id}',
    [MasterController::class, 'updatebarang']
)
    ->whereNumber('id')
    ->name('master.data_barang.update');


Route::delete(
    '/master-data/barang/{id}',
    [MasterController::class, 'deletebarang']
)
    ->whereNumber('id')
    ->name('master.data_barang.delete');

/*
|--------------------------------------------------------------------------
| MASTER DATA - DEPARTEMEN
|--------------------------------------------------------------------------
*/

Route::get(
    '/master-data/departemen',
    [MasterController::class, 'dataDepartemen']
)->name('master.data_departemen');


Route::post(
    '/master-data/departemen',
    [MasterController::class, 'storeDepartemen']
)->name('master.data_departemen.store');


Route::put(
    '/master-data/departemen/{id}',
    [MasterController::class, 'updateDepartemen']
)
    ->whereNumber('id')
    ->name('master.data_departemen.update');


Route::delete(
    '/master-data/departemen/{id}',
    [MasterController::class, 'deleteDepartemen']
)
    ->whereNumber('id')
    ->name('master.data_departemen.delete');


/*
|--------------------------------------------------------------------------
| MASTER DATA - DIVISI
|--------------------------------------------------------------------------
*/

Route::get(
    '/master-data/divisi',
    [MasterController::class, 'dataDivisi']
)->name('master.data_divisi');


Route::post(
    '/master-data/divisi',
    [MasterController::class, 'storeDivisi']
)->name('master.data_divisi.store');


Route::put(
    '/master-data/divisi/{id}',
    [MasterController::class, 'updateDivisi']
)
    ->whereNumber('id')
    ->name('master.data_divisi.update');


Route::delete(
    '/master-data/divisi/{id}',
    [MasterController::class, 'deleteDivisi']
)
    ->whereNumber('id')
    ->name('master.data_divisi.delete');

/*
|--------------------------------------------------------------------------
| MASTER DATA - RUANGAN
|--------------------------------------------------------------------------
*/

Route::get(
    '/master-data/ruangan',
    [MasterController::class, 'dataRuangan']
)->name('master.data_ruangan');


Route::post(
    '/master-data/ruangan',
    [MasterController::class, 'storeRuangan']
)->name('master.data_ruangan.store');


Route::put(
    '/master-data/ruangan/{id}',
    [MasterController::class, 'updateRuangan']
)
    ->whereNumber('id')
    ->name('master.data_ruangan.update');


Route::delete(
    '/master-data/ruangan/{id}',
    [MasterController::class, 'deleteRuangan']
)
    ->whereNumber('id')
    ->name('master.data_ruangan.delete');

/*
|--------------------------------------------------------------------------
| MASTER DATA - SDM PENDUKUNG
|--------------------------------------------------------------------------
*/

Route::get(
    '/master-data/sdm-pendukung',
    [MasterController::class, 'dataSdm']
)->name('master.data_sdm');


Route::post(
    '/master-data/sdm-pendukung',
    [MasterController::class, 'storeSdm']
)->name('master.data_sdm.store');


Route::put(
    '/master-data/sdm-pendukung/{id}',
    [MasterController::class, 'updateSdm']
)
    ->whereNumber('id')
    ->name('master.data_sdm.update');


Route::delete(
    '/master-data/sdm-pendukung/{id}',
    [MasterController::class, 'deleteSdm']
)
    ->whereNumber('id')
    ->name('master.data_sdm.delete');

// ============================================================
// MASTER DATA - LOKASI
// ============================================================

Route::get(
    '/master-data/lokasi',
    [MasterController::class, 'dataLokasi']
)->name('master.data_lokasi');


Route::post(
    '/master-data/lokasi',
    [MasterController::class, 'storeLokasi']
)->name('master.data_lokasi.store');


Route::put(
    '/master-data/lokasi/{id}',
    [MasterController::class, 'updateLokasi']
)
    ->whereNumber('id')
    ->name('master.data_lokasi.update');


Route::delete(
    '/master-data/lokasi/{id}',
    [MasterController::class, 'deleteLokasi']
)
    ->whereNumber('id')
    ->name('master.data_lokasi.delete');


// ============================================================
// MASTER DATA - BAHAN
// ============================================================

Route::get(
    '/master-data/bahan',
    [MasterController::class, 'dataBahan']
)->name('master.data_bahan');


Route::post(
    '/master-data/bahan',
    [MasterController::class, 'storeBahan']
)->name('master.data_bahan.store');


Route::put(
    '/master-data/bahan/{id}',
    [MasterController::class, 'updateBahan']
)
    ->whereNumber('id')
    ->name('master.data_bahan.update');


Route::delete(
    '/master-data/bahan/{id}',
    [MasterController::class, 'deleteBahan']
)
    ->whereNumber('id')
    ->name('master.data_bahan.delete');



// =========================================================
// MASTER DATA - KODE AKTIVA
// =========================================================

Route::get(
    '/master-data/aktiva',
    [MasterController::class, 'dataAktiva']
)->name('master.data_aktiva');


Route::post(
    '/master-data/aktiva',
    [MasterController::class, 'storeAktiva']
)->name('master.data_aktiva.store');


Route::put(
    '/master-data/aktiva/{id}',
    [MasterController::class, 'updateAktiva']
)
    ->whereNumber('id')
    ->name('master.data_aktiva.update');


Route::delete(
    '/master-data/aktiva/{id}',
    [MasterController::class, 'deleteAktiva']
)
    ->whereNumber('id')
    ->name('master.data_aktiva.delete');

// ------------------------------------------------
// K.I.B ROUTES
// -------------------------------------------------

/*
|--------------------------------------------------------------------------
| K.I.B - TANAH
|--------------------------------------------------------------------------
*/

Route::prefix('kib')
    ->name('kib.')
    ->group(function () {

        Route::get(
            '/tanah',
            [KIBController::class, 'dataTanah']
        )
            ->name('tanah');

        Route::get(
            '/tanah/lokasi/{id}/detail',
            [KIBController::class, 'detailTanahLokasi']
        )
            ->whereNumber('id')
            ->name('tanah.detail');

        Route::get(
            '/tanah/lokasi/{id}/nilai',
            [KIBController::class, 'detailNilaiTanahLokasi']
        )
            ->whereNumber('id')
            ->name('tanah.nilai');

        /*
        |--------------------------------------------------------------------------
        | GAMBAR LOKASI TANAH
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/tanah/lokasi/{id}/gambar',
            [KIBController::class, 'gambarTanahLokasi']
        )
            ->whereNumber('id')
            ->name('tanah.image');
    });

Route::get('/kib/mesin', function () {
    return view('kib.mesin');
})->name('kib.mesin');

Route::get('/kib/gedung', function () {
    return view('kib.gedung');
})->name('kib.gedung');

Route::get('/kib/jalan', function () {
    return view('kib.jalan');
})->name('kib.jalan');

Route::get('/kib/aset_ttp', function () {
    return view('kib.aset_ttp');
})->name('kib.aset_ttp');

Route::get('/kib/konstruksi', function () {
    return view('kib.konstruksi');
})->name('kib.konstruksi');

Route::get('/kib/kir', function () {
    return view('kib.kir');
})->name('kib.kir');
