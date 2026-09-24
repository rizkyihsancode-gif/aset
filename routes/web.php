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





// ------------------------------------------------
// DASHBOARD ROUTES
// -------------------------------------------------
Route::get('/nilai-aset', function () {

    return view('main.nilai');
})->name('main.nilai');


Route::get('/arsip', function () {

    return view('main.arsip');
})->name('main.arsip');
