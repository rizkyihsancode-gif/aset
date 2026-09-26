<?php

use Illuminate\Support\Facades\Route;


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
// MASTER DATA ROUTES
// ------------------------------------------------
Route::get('/master-data/barang', function () {
    return view('master.data_barang');
})->name('master.data_barang');

Route::get('/master-data/departemen', function () {
    return view('master.data_departemen');
})->name('master.data_departemen');

Route::get('/master-data/divisi', function () {
    return view('master.data_divisi');
})->name('master.data_divisi');

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
// DASHBOARD ROUTES
// -------------------------------------------------
Route::get('/nilai-aset', function () {

    return view('main.nilai');
})->name('main.nilai');


Route::get('/arsip', function () {

    return view('main.arsip');
})->name('main.arsip');
