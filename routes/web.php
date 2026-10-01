<?php

use Illuminate\Support\Facades\Route;
use App\Models\Barang;
use App\Http\Controllers\MasterController;


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


Route::get('/dashboard', function () {

    return view('main.dashboard');
})->name('dashboard');

// ------------------------------------------------
// DASHBOARD ROUTES
// -------------------------------------------------
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

Route::get('/master-data/ruangan', function () {
    return view('master.data_ruangan');
})->name('master.data_ruangan');

Route::get('/master-data/sdm', function () {
    return view('master.data_sdm');
})->name('master.data_sdm');

Route::get('/master-data/lokasi', function () {
    return view('master.data_lokasi');
})->name('master.data_lokasi');

Route::get('/master-data/bahan', function () {
    return view('master.data_bahan');
})->name('master.data_bahan');

Route::get('/master-data/aktiva', function () {
    return view('master.data_aktiva');
})->name('master.data_aktiva');

// ------------------------------------------------
// K.I.B ROUTES
// -------------------------------------------------

Route::get('/kib/tanah', function () {
    return view('kib.tanah');
})->name('kib.tanah');

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
