<?php

use Illuminate\Support\Facades\Route;
use App\Models\Barang;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\KIBController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NilaiAsetController;
use App\Http\Controllers\KibNotificationController;



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


/*
|--------------------------------------------------------------------------
| LOGOUT SISTEM ASET
|--------------------------------------------------------------------------
|
| Mengakhiri autentikasi dan menghapus session pengguna.
| Logout menggunakan POST untuk perlindungan CSRF.
|
*/

Route::post('/logout', function (
    \Illuminate\Http\Request $request
) {
    \Illuminate\Support\Facades\Auth::logout();

    $request->session()->invalidate();

    $request->session()->regenerateToken();

    return redirect()->route('login');
})->name('logout');




// ------------------------------------------------
// DASHBOARD ROUTES
// -------------------------------------------------
Route::get(
    '/dashboard',
    [DashboardController::class, 'index']
)->name('dashboard');




// ============================================================
// NILAI ASET
// ============================================================

Route::get(
    '/nilai',
    [NilaiAsetController::class, 'index']
)->name('main.nilai');


Route::post(
    '/nilai',
    [NilaiAsetController::class, 'store']
)->name('nilai.store');


Route::get(
    '/nilai/{nilai}/pdf',
    [NilaiAsetController::class, 'previewPdf']
)
    ->whereNumber('nilai')
    ->name('nilai.pdf.preview');


Route::get(
    '/nilai/{nilai}/pdf/download',
    [NilaiAsetController::class, 'downloadPdf']
)
    ->whereNumber('nilai')
    ->name('nilai.pdf.download');


Route::get(
    '/nilai/{nilai}',
    [NilaiAsetController::class, 'show']
)
    ->whereNumber('nilai')
    ->name('nilai.show');


Route::put(
    '/nilai/{nilai}',
    [NilaiAsetController::class, 'update']
)
    ->whereNumber('nilai')
    ->name('nilai.update');


Route::delete(
    '/nilai/{nilai}',
    [NilaiAsetController::class, 'destroy']
)
    ->whereNumber('nilai')
    ->name('nilai.destroy');
/*
|--------------------------------------------------------------------------
| K.I.B - DATA NILAI ASET BELUM DIPROSES
|--------------------------------------------------------------------------
*/

Route::get(
    '/kib/pending/{module}',
    [
        KibNotificationController::class,
        'pending'
    ]
)
    ->where(
        'module',
        'tanah|mesin|gedung|jalan|aset_tetap|konstruksi|kir'
    )
    ->name(
        'kib.pending'
    );

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
        /*
        |--------------------------------------------------------------
        | CRUD SERTIFIKAT DAN PDF TANAH — CONTROLLER YANG SAMA
        |--------------------------------------------------------------
        */
        Route::get(
            '/tanah/lokasi/{lokasi}/sertifikat',
            [KIBController::class, 'lokasiSertifikat']
        )
            ->whereNumber('lokasi')->name('tanah.sertifikat');

        Route::get(
            '/tanah/lokasi/{lokasi}/pdf',
            [KIBController::class, 'lokasiPdf']
        )
            ->whereNumber('lokasi')->name('tanah.lokasi.pdf');

        Route::get(
            '/tanah/pdf/{pdf}/view',
            [KIBController::class, 'viewPdf']
        )
            ->whereNumber('pdf')->name('tanah.pdf.view');

        Route::get(
            '/tanah/pdf/{pdf}/download',
            [KIBController::class, 'downloadPdf']
        )
            ->whereNumber('pdf')->name('tanah.pdf.download');

        Route::post(
            '/tanah',
            [KIBController::class, 'store']
        )
            ->name('tanah.store');

        Route::get(
            '/tanah/{tanah}',
            [KIBController::class, 'show']
        )
            ->whereNumber('tanah')->name('tanah.show');

        Route::put(
            '/tanah/{tanah}',
            [KIBController::class, 'update']
        )
            ->whereNumber('tanah')->name('tanah.update');

        Route::delete(
            '/tanah/{tanah}',
            [KIBController::class, 'destroy']
        )
            ->whereNumber('tanah')->name('tanah.destroy');
    });



/*
|--------------------------------------------------------------------------
| K.I.B B — PERALATAN DAN MESIN
|--------------------------------------------------------------------------
*/

Route::get('/kib/mesin', [
    KIBController::class,
    'dataMesin'
])->name('kib.mesin');

Route::get('/kib/mesin/pending', [
    KIBController::class,
    'pendingMesin'
])->name('kib.mesin.pending');

/*
|--------------------------------------------------------------------------
| Detail lokasi dan rincian nilai harus berada
| sebelum route /kib/mesin/{mesin}
|--------------------------------------------------------------------------
*/

Route::get('/kib/mesin/lokasi/{lokasi}/nilai', [
    KIBController::class,
    'detailNilaiMesinLokasi'
])
    ->whereNumber('lokasi')
    ->name('kib.mesin.lokasi.nilai');

Route::get('/kib/mesin/lokasi/{lokasi}', [
    KIBController::class,
    'detailMesinLokasi'
])
    ->whereNumber('lokasi')
    ->name('kib.mesin.lokasi');

Route::post('/kib/mesin', [
    KIBController::class,
    'storeMesin'
])->name('kib.mesin.store');

Route::get('/kib/mesin/{mesin}', [
    KIBController::class,
    'showMesin'
])
    ->whereNumber('mesin')
    ->name('kib.mesin.show');

Route::put('/kib/mesin/{mesin}', [
    KIBController::class,
    'updateMesin'
])
    ->whereNumber('mesin')
    ->name('kib.mesin.update');

Route::delete('/kib/mesin/{mesin}', [
    KIBController::class,
    'destroyMesin'
])
    ->whereNumber('mesin')
    ->name('kib.mesin.destroy');

Route::get('/kib/mesin/{mesin}/file/{jenis}', [
    KIBController::class,
    'fileMesin'
])
    ->whereNumber('mesin')
    ->where('jenis', 'dokumen|foto')
    ->name('kib.mesin.file');



/*
|--------------------------------------------------------------------------
| K.I.B B — MASA PAJAK KENDARAAN
|--------------------------------------------------------------------------
| Menggunakan KIBController.
*/

Route::get(
    '/kib/mesin/pajak/data',
    [KIBController::class, 'dataPajakMesin']
)->name('kib.mesin.pajak.data');

Route::post(
    '/kib/mesin/pajak',
    [KIBController::class, 'storePajakMesin']
)->name('kib.mesin.pajak.store');

Route::put(
    '/kib/mesin/pajak/{pajak}',
    [KIBController::class, 'updatePajakMesin']
)->whereNumber('pajak')
    ->name('kib.mesin.pajak.update');

Route::delete(
    '/kib/mesin/pajak/{pajak}',
    [KIBController::class, 'destroyPajakMesin']
)->whereNumber('pajak')
    ->name('kib.mesin.pajak.destroy');

Route::get(
    '/kib/mesin/pajak/{pajak}/dokumen',
    [KIBController::class, 'filePajakMesin']
)->whereNumber('pajak')
    ->name('kib.mesin.pajak.dokumen');


/*
|--------------------------------------------------------------------------
| REFERENSI TRANSAKSI KENDARAAN
|--------------------------------------------------------------------------
|
| Membaca transaksi Nilai Aset berkode 31.08.%
| tanpa membuat kendaraan baru.
|
*/

Route::get(
    '/kib/mesin/pajak/referensi',
    [
        KIBController::class,
        'referensiAktivaKendaraanMesin'
    ]
)->name('kib.mesin.pajak.referensi');


/*
|--------------------------------------------------------------------------
| KLASIFIKASI KENDARAAN SAAT EDIT INVENTARIS
|--------------------------------------------------------------------------
*/

Route::get(
    '/kib/mesin/{mesin}/klasifikasi',
    [
        KIBController::class,
        'klasifikasiMesin'
    ]
)
    ->whereNumber('mesin')
    ->name('kib.mesin.klasifikasi');


/*
|--------------------------------------------------------------------------
| K.I.B C — GEDUNG DAN BANGUNAN
| Controller: KIBController
|--------------------------------------------------------------------------
*/

Route::get(
    '/kib/gedung',
    [KIBController::class, 'dataGedung']
)->name('kib.gedung');


Route::get(
    '/kib/gedung/pending',
    [KIBController::class, 'pendingGedung']
)->name('kib.gedung.pending');


Route::get(
    '/kib/gedung/lokasi/{lokasi}/nilai',
    [KIBController::class, 'detailNilaiGedungLokasi']
)
    ->whereNumber('lokasi')
    ->name('kib.gedung.lokasi.nilai');


Route::get(
    '/kib/gedung/lokasi/{lokasi}',
    [KIBController::class, 'detailGedungLokasi']
)
    ->whereNumber('lokasi')
    ->name('kib.gedung.lokasi');


Route::get(
    '/kib/gedung/{gedung}/file/{jenis}',
    [KIBController::class, 'fileGedung']
)
    ->whereNumber('gedung')
    ->where('jenis', 'dokumen|foto')
    ->name('kib.gedung.file');


Route::get(
    '/kib/gedung/{gedung}',
    [KIBController::class, 'showGedung']
)
    ->whereNumber('gedung')
    ->name('kib.gedung.show');


Route::post(
    '/kib/gedung',
    [KIBController::class, 'storeGedung']
)->name('kib.gedung.store');


Route::put(
    '/kib/gedung/{gedung}',
    [KIBController::class, 'updateGedung']
)
    ->whereNumber('gedung')
    ->name('kib.gedung.update');


Route::delete(
    '/kib/gedung/{gedung}',
    [KIBController::class, 'destroyGedung']
)
    ->whereNumber('gedung')
    ->name('kib.gedung.destroy');


Route::get('/kib/jalan', function () {
    return view('kib.jalan');
})->name('kib.jalan');

/*
|--------------------------------------------------------------------------
| K.I.B E — ASET TETAP LAINNYA
|--------------------------------------------------------------------------
*/

// Halaman utama
Route::get(
    '/kib/aset_ttp',
    [KIBController::class, 'dataAsetTetapLainnya']
)->name('kib.aset_ttp');

// Rincian nilai berdasarkan lokasi
Route::get(
    '/kib/aset_ttp/lokasi/{lokasi}/nilai',
    [KIBController::class, 'nilaiAsetTetapLainnyaLokasi']
)->whereNumber('lokasi')->name('kib.aset_ttp.lokasi.nilai');

// Inventaris berdasarkan lokasi
Route::get(
    '/kib/aset_ttp/lokasi/{lokasi}',
    [KIBController::class, 'detailAsetTetapLainnyaLokasi']
)->whereNumber('lokasi')->name('kib.aset_ttp.lokasi');

// Foto dan dokumen
Route::get(
    '/kib/aset_ttp/{aset}/file/{jenis}',
    [KIBController::class, 'fileAsetTetapLainnya']
)->whereNumber('aset')
    ->where('jenis', 'foto|dokumen')
    ->name('kib.aset_ttp.file');

// Detail satu aset
Route::get(
    '/kib/aset_ttp/{aset}',
    [KIBController::class, 'showAsetTetapLainnya']
)->whereNumber('aset')->name('kib.aset_ttp.show');

// Tambah
Route::post(
    '/kib/aset_ttp',
    [KIBController::class, 'storeAsetTetapLainnya']
)->name('kib.aset_ttp.store');

// Edit
Route::put(
    '/kib/aset_ttp/{aset}',
    [KIBController::class, 'updateAsetTetapLainnya']
)->whereNumber('aset')->name('kib.aset_ttp.update');

// Hapus
Route::delete(
    '/kib/aset_ttp/{aset}',
    [KIBController::class, 'destroyAsetTetapLainnya']
)->whereNumber('aset')->name('kib.aset_ttp.destroy');

// Kompatibilitas URL sidebar alternatif
Route::redirect('/kib/aset-tetap', '/kib/aset_ttp');



// ========================================================
// K.I.B F — KONSTRUKSI
// Controller: KIBController
// ========================================================

// Halaman utama
Route::get(
    '/kib/konstruksi',
    [KIBController::class, 'dataKonstruksi']
)->name('kib.konstruksi');

// Detail Lokasi
Route::get(
    '/kib/konstruksi/lokasi/{lokasi}',
    [KIBController::class, 'detailKonstruksiLokasi']
)
    ->whereNumber('lokasi')
    ->name('kib.konstruksi.lokasi');

// File Foto dan PDF
Route::get(
    '/kib/konstruksi/{konstruksi}/file/{jenis}',
    [KIBController::class, 'fileKonstruksi']
)
    ->whereNumber('konstruksi')
    ->where('jenis', 'foto|dokumen')
    ->name('kib.konstruksi.file');

// Detail Satu Inventaris
Route::get(
    '/kib/konstruksi/{konstruksi}',
    [KIBController::class, 'showKonstruksi']
)
    ->whereNumber('konstruksi')
    ->name('kib.konstruksi.show');

// Tambah dari Pending
Route::post(
    '/kib/konstruksi',
    [KIBController::class, 'storeKonstruksi']
)->name('kib.konstruksi.store');

// Edit
Route::put(
    '/kib/konstruksi/{konstruksi}',
    [KIBController::class, 'updateKonstruksi']
)
    ->whereNumber('konstruksi')
    ->name('kib.konstruksi.update');

// Hapus
Route::delete(
    '/kib/konstruksi/{konstruksi}',
    [KIBController::class, 'destroyKonstruksi']
)
    ->whereNumber('konstruksi')
    ->name('kib.konstruksi.destroy');



Route::get('/kib/kir', function () {
    return view('kib.kir');
})->name('kib.kir');
