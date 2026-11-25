<?php

use Illuminate\Support\Facades\Route;
use App\Models\Barang;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\KIBController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NilaiAsetController;
use App\Http\Controllers\KibNotificationController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Http\Request;



/*
|--------------------------------------------------------------------------
| LOGIN ADMIN TUNGGAL
|--------------------------------------------------------------------------
| Form login lama tetap digunakan. Akses halaman dan perubahan aset
| mewajibkan session Laravel, tidak menggunakan bypass ataupun IP middleware.
*/

Route::get('/', function (Request $request) {
    return redirect()->route(\App\Http\Middleware\EnsureAsetAdmin::allows(
        $request->user('web')?->email
    ) ? 'dashboard' : 'login');
});

Route::get('/login', [AuthenticatedSessionController::class, 'create'])
    ->name('login');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('login.submit');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->name('logout');

// Semua menu aplikasi dan endpoint penulisan diproteksi.
Route::middleware(['auth:web', \App\Http\Middleware\EnsureAsetAdmin::class])->group(function () {

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


    /*
|--------------------------------------------------------------------------
| NILAI ASET - DOKUMEN PDF TAMBAHAN (MULTI PDF)
|--------------------------------------------------------------------------
| Controller membuat URL sementara dengan nama route ini. Tanpa keduanya,
| show() dapat melempar RouteNotFoundException saat transaksi punya PDF
| tambahan, sehingga Detail, Edit dan tombol Lihat PDF sama-sama gagal.
*/
    Route::get(
        '/nilai/{nilai}/dokumen/{dokumen}/preview',
        [NilaiAsetController::class, 'previewDokumen']
    )
        ->whereNumber('nilai')
        ->whereNumber('dokumen')
        ->middleware('signed')
        ->name('nilai.dokumen.preview');

    Route::get(
        '/nilai/{nilai}/dokumen/{dokumen}/download',
        [NilaiAsetController::class, 'downloadDokumen']
    )
        ->whereNumber('nilai')
        ->whereNumber('dokumen')
        ->middleware('signed')
        ->name('nilai.dokumen.download');


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
            // K.I.B A: laporan semua Tanah (digunakan tombol Print Excel halaman utama).
            Route::get(
                '/tanah/laporan',
                [KIBController::class, 'laporanTanah']
            )->name('tanah.laporan');

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

            // K.I.B A pilot: akses tulis dibatasi oleh jaringan tepercaya di grup induk.
            Route::post(
                '/tanah/lokasi/{lokasi}/tambah-langsung',
                [KIBController::class, 'storeTanahLangsung']
            )
                ->whereNumber('lokasi')->name('tanah.store-langsung');
            Route::post(
                '/tanah/lokasi/{lokasi}/hubungkan-voucher',
                [KIBController::class, 'hubungkanNilaiTanah']
            )
                ->whereNumber('lokasi')->name('tanah.hubungkan-voucher');

            Route::post(
                '/tanah/lokasi/{lokasi}/lepaskan-voucher',
                [KIBController::class, 'lepaskanNilaiTanah']
            )
                ->whereNumber('lokasi')->name('tanah.lepaskan-voucher');


            /*
|--------------------------------------------------------------------------
| K.I.B TANAH — LAMPIRAN PDF DAN FOTO
|--------------------------------------------------------------------------
*/

            Route::get(
                '/tanah/lampiran/{lampiran}/{aksi?}',
                [KIBController::class, 'lampiranTanah']
            )
                ->whereNumber('lampiran')
                ->whereIn('aksi', ['view', 'download'])
                ->middleware('signed:relative')
                ->name('tanah.lampiran');


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

    // K.I.B B — tambah langsung dan pengaitan nilai per inventaris.
    Route::post('/kib/mesin/lokasi/{lokasi}/tambah-langsung', [KIBController::class, 'storeMesinLangsung'])
        ->whereNumber('lokasi')->name('kib.mesin.store-langsung');
    Route::post('/kib/mesin/lokasi/{lokasi}/hubungkan-voucher', [KIBController::class, 'hubungkanNilaiMesin'])
        ->whereNumber('lokasi')->name('kib.mesin.hubungkan-voucher');
    Route::post('/kib/mesin/lokasi/{lokasi}/lepaskan-voucher', [KIBController::class, 'lepaskanNilaiMesin'])
        ->whereNumber('lokasi')->name('kib.mesin.lepaskan-voucher');

    // K.I.B B: sumber popup/preview Print Excel Kendaraan dan Mesin per lokasi.
    // Penting: route ini harus ada sebelum route dinamis /kib/mesin/{mesin}.
    Route::get('/kib/mesin/laporan', [
        KIBController::class,
        'laporanMesinKibB'
    ])->name('kib.mesin.laporan');

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
        [KIBController::class, 'dataKendaraanKibB']
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


    // K.I.B C — Print Excel semua gedung pada Detail satu lokasi.
    // Controller dan tabel lama tetap digunakan; endpoint hanya baca.
    Route::get(
        '/kib/gedung/lokasi/{lokasi}/laporan',
        [KIBController::class, 'laporanGedungKibC']
    )
        ->whereNumber('lokasi')
        ->name('kib.gedung.lokasi.laporan');


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


    // ========================================================
    // K.I.B D — Gedung/Irigasi (baca KIB C), Jembatan (arsip & manual)
    // Seluruh route memanggil KIBController — tidak ada KibDController.
    // ========================================================
    Route::get('/kib/jalan', [KIBController::class, 'jalanIndex'])
        ->name('kib.jalan');
    Route::get('/kib/jalan/pending/list', [KIBController::class, 'jalanPending'])
        ->name('kib.jalan.pending');
    Route::get('/kib/jalan/{jenis}/lokasi/{lokasi}', [KIBController::class, 'jalanDetailLokasi'])
        ->whereIn('jenis', ['gedung', 'jembatan'])->whereNumber('lokasi')->name('kib.jalan.detail');
    // Report K.I.B D: data per Detail lokasi, tanpa pagination.
    Route::get('/kib/jalan/{jenis}/lokasi/{lokasi}/laporan', [KIBController::class, 'laporanJalanKibD'])
        ->whereIn('jenis', ['gedung', 'jembatan'])->whereNumber('lokasi')->name('kib.jalan.laporan');
    // CRUD Jembatan: langsung tabel kib_d_s, bukan kib_d_manual.
    Route::post('/kib/jalan/item', [KIBController::class, 'jalanSimpan'])
        ->name('kib.jalan.item.store');
    Route::get('/kib/jalan/item/{item}', [KIBController::class, 'jalanEdit'])
        ->whereNumber('item')->name('kib.jalan.item.show');
    Route::put('/kib/jalan/item/{item}', [KIBController::class, 'jalanPerbarui'])
        ->whereNumber('item')->name('kib.jalan.item.update');
    Route::delete('/kib/jalan/item/{item}', [KIBController::class, 'jalanHapus'])
        ->whereNumber('item')->name('kib.jalan.item.destroy');
    Route::put('/kib/jalan/arsip/{item}/kepemilikan', [KIBController::class, 'jalanPerbaruiPemilikArsip'])
        ->whereNumber('item')->name('kib.jalan.arsip.kepemilikan');
    Route::get('/kib/jalan/file/{source}/{item}/{jenis}', [KIBController::class, 'jalanFile'])
        ->whereIn('source', ['jembatan', 'arsip'])->whereIn('jenis', ['foto', 'dokumen'])
        ->whereNumber('item')->name('kib.jalan.file');

    // Pengaitan manual C–F dan KIR; kategori fisik tervalidasi controller.
    Route::get('/kib/voucher/{kategori}', [KIBController::class, 'riwayatVoucherKib'])
        ->whereIn('kategori', ['gedung', 'jembatan', 'aset_ttp', 'konstruksi', 'kir'])->name('kib.voucher.riwayat');
    Route::post('/kib/voucher/{kategori}/hubungkan', [KIBController::class, 'hubungkanVoucherKib'])
        ->whereIn('kategori', ['gedung', 'jembatan', 'aset_ttp', 'konstruksi', 'kir'])->name('kib.voucher.hubungkan');
    Route::post('/kib/voucher/{kategori}/lepaskan', [KIBController::class, 'lepaskanVoucherKib'])
        ->whereIn('kategori', ['gedung', 'jembatan', 'aset_ttp', 'konstruksi', 'kir'])->name('kib.voucher.lepaskan');
    Route::get('/kib/gedung/lokasi/{lokasi}/referensi-langsung', [KIBController::class, 'referensiGedungLangsung'])
        ->whereNumber('lokasi')->name('kib.gedung.referensi-langsung');
    Route::post('/kib/gedung/lokasi/{lokasi}/tambah-langsung', [KIBController::class, 'storeGedungLangsung'])
        ->whereNumber('lokasi')->name('kib.gedung.store-langsung');


    // ========================================================
    // K.I.B E — ASET TETAP LAINNYA MANUAL
    // Controller yang digunakan: KIBController.php
    // ========================================================

    Route::get(
        '/kib/aset_ttp',
        [KIBController::class, 'dataAsetTetapManual']
    )->name('kib.aset_ttp');

    Route::post(
        '/kib/aset_ttp',
        [KIBController::class, 'storeAsetTetapManual']
    )->name('kib.aset_ttp.store');

    // K.I.B E — sumber laporan Excel, selalu sebelum route {aset}.
    Route::get('/kib/aset_ttp/laporan', [KIBController::class, 'laporanAsetTetapKibE'])
        ->name('kib.aset_ttp.laporan');

    Route::get(
        '/kib/aset_ttp/{aset}/foto',
        [KIBController::class, 'fotoAsetTetapManual']
    )
        ->whereNumber('aset')
        ->name('kib.aset_ttp.manual.foto');

    Route::get(
        '/kib/aset_ttp/{aset}/dokumen/{dokumen}',
        [KIBController::class, 'dokumenAsetTetapManual']
    )
        ->whereNumber('aset')
        ->whereNumber('dokumen')
        ->name('kib.aset_ttp.manual.dokumen');

    Route::get(
        '/kib/aset_ttp/{aset}',
        [KIBController::class, 'showAsetTetapManual']
    )
        ->whereNumber('aset')
        ->name('kib.aset_ttp.show');

    Route::put(
        '/kib/aset_ttp/{aset}',
        [KIBController::class, 'updateAsetTetapManual']
    )
        ->whereNumber('aset')
        ->name('kib.aset_ttp.update');

    Route::delete(
        '/kib/aset_ttp/{aset}',
        [KIBController::class, 'destroyAsetTetapManual']
    )
        ->whereNumber('aset')
        ->name('kib.aset_ttp.destroy');

    Route::redirect('/kib/aset-tetap', '/kib/aset_ttp');


    /*
|--------------------------------------------------------------------------
| K.I.B E — DETAIL KELOMPOK ASET MANUAL
|--------------------------------------------------------------------------
| Tidak mengganti route CRUD K.I.B E sebelumnya.
|--------------------------------------------------------------------------
*/

    Route::get(
        '/kib/aset_ttp/kelompok',
        [KIBController::class, 'kelompokAsetTetapManual']
    )->name('kib.aset_ttp.kelompok');





    // ========================================================
    // K.I.B F — KONSTRUKSI MANUAL
    // Menggunakan KIBController.php yang sudah ada
    // ========================================================

    Route::get(
        '/kib/konstruksi',
        [KIBController::class, 'dataKonstruksiManual']
    )->name('kib.konstruksi');

    Route::post(
        '/kib/konstruksi',
        [KIBController::class, 'storeKonstruksiManual']
    )->name('kib.konstruksi.store');

    Route::get(
        '/kib/konstruksi/{konstruksi}/foto',
        [KIBController::class, 'fotoKonstruksiManual']
    )
        ->whereNumber('konstruksi')
        ->name('kib.konstruksi.foto');

    Route::get(
        '/kib/konstruksi/{konstruksi}/dokumen/{dokumen}',
        [KIBController::class, 'dokumenKonstruksiManual']
    )
        ->whereNumber('konstruksi')
        ->whereNumber('dokumen')
        ->name('kib.konstruksi.dokumen');

    // K.I.B F: seluruh inventaris dalam satu kelompok Detail Konstruksi.
    Route::get('/kib/konstruksi/laporan', [KIBController::class, 'laporanKonstruksiKibF'])
        ->name('kib.konstruksi.laporan');

    Route::get(
        '/kib/konstruksi/{konstruksi}',
        [KIBController::class, 'showKonstruksiManual']
    )
        ->whereNumber('konstruksi')
        ->name('kib.konstruksi.show');

    Route::put(
        '/kib/konstruksi/{konstruksi}',
        [KIBController::class, 'updateKonstruksiManual']
    )
        ->whereNumber('konstruksi')
        ->name('kib.konstruksi.update');

    Route::delete(
        '/kib/konstruksi/{konstruksi}',
        [KIBController::class, 'destroyKonstruksiManual']
    )
        ->whereNumber('konstruksi')
        ->name('kib.konstruksi.destroy');

    Route::get(
        '/kib/konstruksi/kelompok',
        [KIBController::class, 'kelompokKonstruksiManual']
    )->name('kib.konstruksi.kelompok');


    /*
|--------------------------------------------------------------------------
| K.I.R — KARTU INVENTARIS RUANGAN
|--------------------------------------------------------------------------
| Semua fungsi menggunakan KIBController.
| Tidak membuat controller baru.
|--------------------------------------------------------------------------
*/

    // Halaman utama KIR.
    Route::get(
        '/kib/kir',
        [KIBController::class, 'dataKir']
    )->name('kib.kir');

    // Rincian transaksi nilai per lokasi.
    Route::get(
        '/kib/kir/lokasi/{lokasi}/nilai',
        [KIBController::class, 'nilaiKirLokasi']
    )
        ->whereNumber('lokasi')
        ->name('kib.kir.nilai');

    // Export seluruh barang di satu lokasi, lintas gedung/ruangan.
    // Respons JSON untuk pembuat XLSX lokal di kir.js.
    Route::get(
        '/kib/kir/lokasi/{lokasi}/export-data',
        [KIBController::class, 'exportKirLokasi']
    )->whereNumber('lokasi')->name('kib.kir.export');

    // Struktur departemen, divisi, gedung, ruangan.
    Route::get(
        '/kib/kir/lokasi/{lokasi}',
        [KIBController::class, 'detailKirLokasi']
    )
        ->whereNumber('lokasi')
        ->name('kib.kir.lokasi');

    // Inventaris di dalam satu ruangan.
    Route::get(
        '/kib/kir/ruangan',
        [KIBController::class, 'detailKirRuangan']
    )->name('kib.kir.ruangan');

    // Preview foto KIR.
    Route::get(
        '/kib/kir/{kir}/foto',
        [KIBController::class, 'fileKir']
    )
        ->whereNumber('kir')
        ->name('kib.kir.foto');

    // Detail satu inventaris.
    Route::get(
        '/kib/kir/{kir}',
        [KIBController::class, 'showKir']
    )
        ->whereNumber('kir')
        ->name('kib.kir.show');

    // Tambah inventaris KIR.
    Route::post(
        '/kib/kir',
        [KIBController::class, 'storeKir']
    )->name('kib.kir.store');

    // Edit inventaris KIR.
    Route::put(
        '/kib/kir/{kir}',
        [KIBController::class, 'updateKir']
    )
        ->whereNumber('kir')
        ->name('kib.kir.update');

    // Hapus inventaris KIR.
    Route::delete(
        '/kib/kir/{kir}',
        [KIBController::class, 'destroyKir']
    )
        ->whereNumber('kir')
        ->name('kib.kir.destroy');
}); // Akhir grup auth untuk seluruh route aplikasi.