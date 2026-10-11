@extends('layouts.main')

@section('content')

    @php

        /*
    |--------------------------------------------------------------------------
    | DATA COMPATIBILITY
    |--------------------------------------------------------------------------
    |
    | Dibuat kompatibel dengan nama variabel controller lama maupun controller
    | baru agar proses transisi tidak langsung merusak halaman.
    |
    */

        $rawTanahRows = $tanahRows ?? ($tanahs ?? ($tanah ?? collect()));

        if (is_object($rawTanahRows) && method_exists($rawTanahRows, 'items')) {
            $tanahRows = collect($rawTanahRows->items());
        } else {
            $tanahRows = collect($rawTanahRows);
        }

        $barangRows = collect($barangOptions ?? ($barangs ?? []));

        $pendingRows = collect($baru ?? ($pendingTanah ?? []));

        /*
    |--------------------------------------------------------------------------
    | FORMATTER
    |--------------------------------------------------------------------------
    */

        $formatRupiah = function ($value) {
            return 'Rp ' . number_format((int) ($value ?? 0), 0, ',', '.');
        };

        $formatNumber = function ($value) {
            return number_format((float) ($value ?? 0), 0, ',', '.');
        };

        /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

        $jumlahLokasiTanah =
            $jumlahLokasiTanah ??
            $tanahRows
                ->map(fn($row) => data_get($row, 'idLok', data_get($row, 'id_lokasi')))
                ->filter()
                ->unique()
                ->count();

        $jumlahDataTanah = $jumlahDataTanah ?? $tanahRows->count();

        $totalLuasTanah =
            $totalLuasTanah ?? $tanahRows->sum(fn($row) => (float) (data_get($row, 'luas_sertifikat', 0) ?? 0));

        $totalNilaiTanah = $totalNilaiTanah ?? ($totalTanah ?? 0);

        $pendingCount = $pendingCount ?? ($notif ?? $pendingRows->count());

        $updateTerakhir = $updateTerakhirLabel ?? ($updateTerakhir ?? '-');

        /*
    |--------------------------------------------------------------------------
    | PENDING FALLBACK
    |--------------------------------------------------------------------------
    |
    | Dipakai kalau endpoint pending belum tersedia pada saat pengembangan.
    |
    */

        $pendingFallback = $pendingRows
            ->map(function ($row) {
                return [
                    'id' => data_get($row, 'id', data_get($row, 'idAk')),

                    'no_voucher' => data_get($row, 'no_voucher', '-'),

                    'tgl_voucher' => data_get($row, 'tgl_voucher'),

                    'id_lokasi' => data_get($row, 'id_lokasi', data_get($row, 'idLok')),

                    'lokasi' => data_get($row, 'lokasi', data_get($row, 'lok', '-')),

                    'alamat' => data_get($row, 'alamat', '-'),

                    'dep' => data_get($row, 'dep', data_get($row, 'idDep')),

                    'departemen' => data_get($row, 'departemen', data_get($row, 'dep', '-')),

                    'div' => data_get($row, 'div', data_get($row, 'idDiv')),

                    'divisi' => data_get($row, 'divisi', data_get($row, 'namDiv', '-')),

                    'tahun' => data_get($row, 'tahun', ''),

                    'nilai' => (int) (data_get($row, 'nilai', 0) ?? 0),

                    'urai' => data_get($row, 'urai', '-'),

                    'jenisn' => (int) data_get($row, 'jenisn', 1),

                    'jenis_label' => (int) data_get($row, 'jenisn', 1) === 2 ? 'Penambahan Nilai' : 'Penambahan Aset',
                ];
            })
            ->values();
    @endphp


    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/tanah.css') }}?v={{ file_exists(public_path('css/pages/kib/tanah.css')) ? filemtime(public_path('css/pages/kib/tanah.css')) : time() }}">


    <div id="tanahPage" class="tanah-page" data-store-url="{{ url('/kib/tanah') }}"
        data-record-base-url="{{ url('/kib/tanah') }}" data-location-base-url="{{ url('/kib/tanah/lokasi') }}"
        data-pending-url="{{ url('/kib/pending/tanah') }}" data-has-errors="{{ $errors->any() ? '1' : '0' }}">


        {{-- =========================================================
         HERO
    ========================================================== --}}

        <section class="tanah-hero" style="--tanah-hero-image: url('{{ asset('images/master/pdam4.png') }}');">

            <div class="tanah-hero-overlay"></div>


            <div class="tanah-hero-top">

                <div class="tanah-heading">

                    <div class="tanah-breadcrumb">

                        <a href="{{ url('/dashboard') }}">

                            <i data-lucide="house"></i>

                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>
                            K.I.B
                        </span>

                        <i data-lucide="chevron-right"></i>

                        <strong>
                            Tanah
                        </strong>

                    </div>


                    <h1>
                        Tanah
                    </h1>


                    <p>

                        Kelola Kartu Inventaris Barang Tanah,
                        dokumen sertifikat, penunjukan, gambar situasi
                        dan informasi kepemilikan aset tanah.

                    </p>

                </div>


                <div class="tanah-hero-actions">

                    <div class="tanah-date-card">

                        <div class="tanah-date-icon">

                            <i data-lucide="calendar-days"></i>

                        </div>


                        <div>

                            <strong>

                                {{ now('Asia/Makassar')->locale('id')->translatedFormat('l d F Y') }}

                            </strong>

                            <span>

                                {{ now('Asia/Makassar')->format('H:i:s') }}

                                WITA

                            </span>

                        </div>

                    </div>


                    <button type="button" class="tanah-add-button" id="tanahAddButton">

                        <i data-lucide="plus"></i>

                        Tambah Data Tanah

                    </button>

                </div>

            </div>


            {{-- KPI --}}

            <div class="tanah-kpi-grid">

                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">

                        <i data-lucide="map-pin"></i>

                    </div>


                    <div class="tanah-kpi-content">

                        <span>
                            Lokasi Tanah
                        </span>

                        <strong>

                            {{ number_format($jumlahLokasiTanah, 0, ',', '.') }}

                        </strong>

                        <p>
                            Lokasi aset tanah terdaftar
                        </p>

                    </div>

                </article>


                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">

                        <i data-lucide="ruler"></i>

                    </div>


                    <div class="tanah-kpi-content">

                        <span>
                            Total Luas
                        </span>

                        <strong>

                            {{ number_format($totalLuasTanah, 0, ',', '.') }}

                            <small>m²</small>

                        </strong>

                        <p>
                            Berdasarkan luas sertifikat
                        </p>

                    </div>

                </article>


                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">

                        <i data-lucide="banknote"></i>

                    </div>


                    <div class="tanah-kpi-content">

                        <span>
                            Total Nilai Tanah
                        </span>

                        <strong title="{{ $formatRupiah($totalNilaiTanah) }}">

                            {{ $formatRupiah($totalNilaiTanah) }}

                        </strong>

                        <p>
                            Berdasarkan transaksi Nilai Aset
                        </p>

                    </div>

                </article>


                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">

                        <i data-lucide="history"></i>

                    </div>


                    <div class="tanah-kpi-content">

                        <span>
                            Update Terakhir
                        </span>

                        <strong class="tanah-kpi-update">

                            {{ $updateTerakhir }}

                        </strong>

                        <p>
                            Aktivitas data K.I.B Tanah
                        </p>

                    </div>

                </article>

            </div>

        </section>


        {{-- =========================================================
         ALERT
    ========================================================== --}}

        @if (session('success'))
            <div class="tanah-alert tanah-alert-success">

                <i data-lucide="circle-check"></i>

                <span>
                    {{ session('success') }}
                </span>

            </div>
        @endif


        @if (session('error'))
            <div class="tanah-alert tanah-alert-danger">

                <i data-lucide="circle-alert"></i>

                <span>
                    {{ session('error') }}
                </span>

            </div>
        @endif


        @if ($errors->any())
            <div class="tanah-alert tanah-alert-danger">

                <i data-lucide="circle-alert"></i>

                <div>

                    <strong>
                        Data belum dapat disimpan.
                    </strong>

                    <ul>

                        @foreach ($errors->all() as $error)
                            <li>
                                {{ $error }}
                            </li>
                        @endforeach

                    </ul>

                </div>

            </div>
        @endif


        {{-- =========================================================
         DATA MASUK NILAI ASET
    ========================================================== --}}

        <section class="tanah-incoming-card" id="tanahIncomingCard">

            <div class="tanah-incoming-icon">

                <i data-lucide="bell-ring"></i>

            </div>


            <div class="tanah-incoming-content">

                <div class="tanah-incoming-title-row">

                    <div>

                        <span class="tanah-incoming-eyebrow">
                            NILAI ASET
                        </span>

                        <h3>
                            Data Tanah Menunggu Diproses
                        </h3>

                    </div>


                    <span class="tanah-incoming-count" id="tanahIncomingCount">

                        {{ $pendingCount }}

                    </span>

                </div>


                <p id="tanahIncomingText">

                    Ada transaksi Nilai Aset kategori Tanah
                    yang belum dilengkapi menjadi data K.I.B Tanah.

                </p>


                <div class="tanah-incoming-meta">

                    <span class="is-green">

                        <i data-lucide="package-plus"></i>

                        <strong id="tanahIncomingNew">
                            0
                        </strong>

                        Penambahan Aset

                    </span>


                    <span class="is-blue">

                        <i data-lucide="circle-dollar-sign"></i>

                        <strong id="tanahIncomingValue">
                            0
                        </strong>

                        Penambahan Nilai

                    </span>

                </div>

            </div>


            <div class="tanah-incoming-action">

                <button type="button" id="tanahIncomingButton">

                    <i data-lucide="inbox"></i>

                    Lihat Data Masuk

                </button>

            </div>

        </section>


        {{-- =========================================================
         FILTER
    ========================================================== --}}

        <section class="tanah-card tanah-filter-card">

            <div class="tanah-filter-header">

                <div>

                    <h3>
                        Filter Data Tanah
                    </h3>

                    <p>
                        Cari data berdasarkan lokasi,
                        alamat, barang atau penggunaan.
                    </p>

                </div>


                <button type="button" class="tanah-export-button" id="tanahExportButton">

                    <i data-lucide="download"></i>

                    Export CSV

                </button>

            </div>


            <div class="tanah-filter-grid">

                <div class="tanah-search">

                    <i data-lucide="search"></i>

                    <input type="search" id="tanahSearch" placeholder="Cari lokasi, alamat, barang atau penggunaan..."
                        autocomplete="off">

                </div>


                <div class="tanah-select-group">

                    <label for="tanahPerPage">
                        Jumlah data
                    </label>

                    <select id="tanahPerPage">

                        <option value="10">
                            10
                        </option>

                        <option value="20" selected>
                            20
                        </option>

                        <option value="50">
                            50
                        </option>

                        <option value="100">
                            100
                        </option>

                    </select>

                </div>


                <button type="button" class="tanah-reset-button" id="tanahResetButton">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>

            </div>

        </section>


        {{-- =========================================================
         TABLE
    ========================================================== --}}

        <section class="tanah-card tanah-table-card">

            <div class="tanah-table-header">

                <div>

                    <h3>
                        Daftar Lokasi Tanah
                    </h3>

                    <p>
                        Data K.I.B Tanah yang telah tersimpan pada sistem.
                    </p>

                </div>


                <span class="tanah-database-badge">

                    <i data-lucide="database"></i>

                    PostgreSQL

                </span>

            </div>


            <div class="tanah-table-scroll">

                <table class="tanah-table" id="tanahTable">

                    <thead>

                        <tr>

                            <th class="tanah-col-no">
                                No
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Alamat
                            </th>

                            <th>
                                Barang
                            </th>

                            <th>
                                Penggunaan
                            </th>

                            <th>
                                Penunjukan
                            </th>

                            <th class="tanah-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody id="tanahTableBody">

                        @if ($tanahRows->count() > 0)
                            @foreach ($tanahRows as $row)
                                @php

                                    $rowId = data_get($row, 'id_tanah', data_get($row, 'id'));

                                    $locationId = data_get($row, 'idLok', data_get($row, 'id_lokasi'));

                                    $lokasi = data_get($row, 'lokasi', '-');

                                    $alamat = data_get($row, 'alamat', '-');

                                    $barang = data_get($row, 'nama_barang', '-');

                                    $guna = data_get($row, 'guna', '-');

                                    $noTunjuk = data_get($row, 'no_tunjuk', '-');

                                    $tglTunjuk = data_get($row, 'tgl_tunjuk');

                                    $searchText = mb_strtolower(
                                        implode(' ', [$lokasi, $alamat, $barang, $guna, $noTunjuk]),
                                    );

                                @endphp


                                <tr class="tanah-data-row" data-search="{{ $searchText }}"
                                    data-location-id="{{ $locationId }}" data-record-id="{{ $rowId }}">

                                    <td class="tanah-row-number">

                                        {{ $loop->iteration }}

                                    </td>


                                    <td>

                                        <div class="tanah-location-cell">

                                            <span class="tanah-location-icon">

                                                <i data-lucide="map-pin"></i>

                                            </span>


                                            <div>

                                                <strong>
                                                    {{ $lokasi }}
                                                </strong>

                                                <small>

                                                    ID Lokasi
                                                    #{{ $locationId ?? '-' }}

                                                </small>

                                            </div>

                                        </div>

                                    </td>


                                    <td class="tanah-wrap-cell">

                                        {{ $alamat }}

                                    </td>


                                    <td>

                                        <span class="tanah-value-main">

                                            {{ $barang }}

                                        </span>

                                    </td>


                                    <td class="tanah-wrap-cell">

                                        {{ $guna }}

                                    </td>


                                    <td>

                                        <strong class="tanah-document-number">

                                            {{ $noTunjuk ?: '-' }}

                                        </strong>


                                        @if ($tglTunjuk)
                                            <small class="tanah-document-date">

                                                {{ \Carbon\Carbon::parse($tglTunjuk)->format('d/m/Y') }}

                                            </small>
                                        @endif

                                    </td>


                                    <td>

                                        <div class="tanah-actions">

                                            <button type="button" class="view js-tanah-location-detail"
                                                title="Lihat data lokasi" data-location-id="{{ $locationId }}"
                                                data-location-name="{{ $lokasi }}">

                                                <i data-lucide="eye"></i>

                                            </button>

                                        </div>

                                    </td>

                                </tr>
                            @endforeach
                        @else
                            <tr id="tanahEmptyDatabaseRow">

                                <td colspan="7" class="tanah-empty">

                                    <i data-lucide="database-zap"></i>

                                    <strong>
                                        Belum ada data Tanah
                                    </strong>

                                    <span>

                                        Pilih transaksi Nilai Aset
                                        untuk membuat data K.I.B Tanah.

                                    </span>

                                </td>

                            </tr>
                        @endif

                    </tbody>

                </table>

            </div>


            <div class="tanah-table-footer">

                <div class="tanah-table-info" id="tanahTableInfo">

                    Menampilkan 0 data

                </div>


                <div class="tanah-pagination" id="tanahPagination"></div>

            </div>

        </section>


        {{-- =========================================================
         MODAL CREATE / EDIT
    ========================================================== --}}

        <dialog class="tanah-modal tanah-form-modal" id="tanahFormModal">

            <form id="tanahForm" action="{{ url('/kib/tanah') }}" method="POST">

                @csrf


                <input type="hidden" name="_method" id="tanahFormMethod" value="">


                <input type="hidden" name="id_nilai_aktiva" id="tanahNilaiAktivaId"
                    value="{{ old('id_nilai_aktiva') }}">


                <input type="hidden" name="id_lokasi" id="tanahLokasiId" value="{{ old('id_lokasi') }}">


                <div class="tanah-modal-header">

                    <div>

                        <span class="tanah-modal-eyebrow">
                            K.I.B A
                        </span>

                        <h3 id="tanahFormTitle">
                            Tambah Data Tanah
                        </h3>

                        <p>

                            Pilih sumber transaksi Nilai Aset,
                            lalu lengkapi informasi pertanahan.

                        </p>

                    </div>


                    <button type="button" class="tanah-modal-close" data-close-dialog="tanahFormModal">

                        <i data-lucide="x"></i>

                    </button>

                </div>


                <div class="tanah-modal-body">


                    {{-- =================================================
                     SOURCE TRANSACTION
                ================================================== --}}

                    <section class="tanah-source-section" id="tanahSourceSection">

                        <div class="tanah-section-header">

                            <div>

                                <span class="tanah-section-number">
                                    1
                                </span>

                                <div>

                                    <h4>
                                        Pilih Sumber Nilai Aset
                                    </h4>

                                    <p>

                                        Hanya transaksi Tanah yang
                                        belum diproses yang ditampilkan.

                                    </p>

                                </div>

                            </div>


                            <button type="button" class="tanah-source-toggle" id="tanahSourceToggle">

                                <i data-lucide="chevron-up"></i>

                                <span>
                                    Sembunyikan
                                </span>

                            </button>

                        </div>


                        <div class="tanah-source-panel" id="tanahSourcePanel">

                            <div class="tanah-source-toolbar">

                                <div class="tanah-source-search">

                                    <i data-lucide="search"></i>

                                    <input type="search" id="tanahSourceSearch"
                                        placeholder="Cari lokasi, departemen, divisi, voucher atau uraian..."
                                        autocomplete="off">

                                </div>


                                <span class="tanah-source-total" id="tanahSourceTotal">

                                    0 data

                                </span>

                            </div>


                            <div class="tanah-source-table-wrap">

                                <table class="tanah-source-table">

                                    <thead>

                                        <tr>

                                            <th>No</th>

                                            <th>Voucher</th>

                                            <th>Lokasi</th>

                                            <th>Departemen</th>

                                            <th>Divisi</th>

                                            <th>Tahun</th>

                                            <th>Nilai</th>

                                            <th>Uraian</th>

                                            <th>Aksi</th>

                                        </tr>

                                    </thead>


                                    <tbody id="tanahSourceBody">

                                        <tr>

                                            <td colspan="9" class="tanah-source-empty">

                                                Memuat data Nilai Aset...

                                            </td>

                                        </tr>

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </section>


                    {{-- =================================================
                     SELECTED SOURCE
                ================================================== --}}

                    <section class="tanah-selected-source" id="tanahSelectedSource" hidden>

                        <div class="tanah-selected-icon">

                            <i data-lucide="circle-check-big"></i>

                        </div>


                        <div class="tanah-selected-content">

                            <span>
                                Sumber Nilai Aset Terpilih
                            </span>

                            <strong id="tanahSelectedTitle">
                                -
                            </strong>

                            <small id="tanahSelectedMeta">
                                -
                            </small>

                        </div>


                        <button type="button" id="tanahChangeSourceButton">

                            Ganti

                        </button>

                    </section>


                    {{-- =================================================
                     BASIC DATA
                ================================================== --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-header">

                            <div>

                                <span class="tanah-section-number">
                                    2
                                </span>

                                <div>

                                    <h4>
                                        Informasi Tanah
                                    </h4>

                                    <p>

                                        Lokasi dan alamat berasal
                                        dari transaksi Nilai Aset.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div class="tanah-form-grid">


                            <div class="tanah-field">

                                <label>
                                    Lokasi
                                    <span>*</span>
                                </label>

                                <input type="text" id="tanahLokasiName" value="{{ old('lokasi') }}"
                                    placeholder="Pilih sumber Nilai Aset" readonly>

                            </div>


                            <div class="tanah-field">

                                <label>
                                    Alamat
                                    <span>*</span>
                                </label>

                                <input type="text" id="tanahAlamat" value="{{ old('alamat') }}"
                                    placeholder="Terisi otomatis dari lokasi" readonly>

                            </div>


                            <div class="tanah-field">

                                <label for="tanahBarang">
                                    Barang
                                    <span>*</span>
                                </label>

                                <select name="id_barang" id="tanahBarang" required>

                                    <option value="">
                                        - PILIH BARANG -
                                    </option>


                                    @foreach ($barangRows as $barang)
                                        @php

                                            $barangId = data_get($barang, 'id');

                                            $kodeBarang = data_get(
                                                $barang,
                                                'kode_barang',
                                                data_get($barang, 'kode', ''),
                                            );

                                            $namaBarang = data_get(
                                                $barang,
                                                'nama_barang',
                                                data_get($barang, 'barang', '-'),
                                            );

                                        @endphp


                                        <option value="{{ $barangId }}" @selected(old('id_barang') == $barangId)>

                                            @if ($kodeBarang)
                                                {{ $kodeBarang }}
                                                —
                                            @endif

                                            {{ $namaBarang }}

                                        </option>
                                    @endforeach

                                </select>


                                @if ($barangRows->count() === 0)
                                    <small class="tanah-field-help is-warning">

                                        Master Barang belum dikirim
                                        dari Controller.

                                    </small>
                                @endif

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTahun">
                                    Tahun
                                    <span>*</span>
                                </label>

                                <input type="number" name="tahun" id="tanahTahun" min="1900" max="2200"
                                    value="{{ old('tahun') }}" required>

                            </div>


                            <div class="tanah-field tanah-field-full">

                                <label for="tanahGuna">
                                    Penggunaan
                                    <span>*</span>
                                </label>

                                <textarea name="guna" id="tanahGuna" rows="3" required
                                    placeholder="Contoh: Reservoir, IPA, kantor, lahan pengembangan, dan lain-lain.">{{ old('guna') }}</textarea>

                            </div>

                        </div>

                    </section>


                    {{-- =================================================
                     PENUNJUKAN
                ================================================== --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-header">

                            <div>

                                <span class="tanah-section-number">
                                    3
                                </span>

                                <div>

                                    <h4>
                                        Penunjukan
                                    </h4>

                                    <p>
                                        Data surat penunjukan tanah.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div class="tanah-form-grid tanah-form-grid-3">

                            <div class="tanah-field">

                                <label for="tanahNoTunjuk">
                                    No. Surat
                                </label>

                                <input type="text" name="no_tunjuk" id="tanahNoTunjuk"
                                    value="{{ old('no_tunjuk') }}" placeholder="Nomor penunjukan">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTglTunjuk">
                                    Tanggal Surat
                                </label>

                                <input type="date" name="tgl_tunjuk" id="tanahTglTunjuk"
                                    value="{{ old('tgl_tunjuk') }}">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahLuasTunjuk">
                                    Luas
                                </label>

                                <div class="tanah-unit-input">

                                    <input type="number" name="luas_tunjuk" id="tanahLuasTunjuk" min="0"
                                        step="0.01" value="{{ old('luas_tunjuk') }}" placeholder="0">

                                    <span>
                                        m²
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {{-- =================================================
                     SERTIFIKAT
                ================================================== --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-header">

                            <div>

                                <span class="tanah-section-number">
                                    4
                                </span>

                                <div>

                                    <h4>
                                        Sertifikat / SPPT / SPHAT / SPJBT
                                    </h4>

                                    <p>

                                        Informasi dokumen kepemilikan
                                        atau penguasaan tanah.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div class="tanah-form-grid tanah-form-grid-3">

                            <div class="tanah-field">

                                <label for="tanahSertifikat">
                                    No. Sertifikat / Surat
                                </label>

                                <input type="text" name="sertifikat" id="tanahSertifikat"
                                    value="{{ old('sertifikat') }}" placeholder="Nomor sertifikat / surat">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTglSertifikat">
                                    Tanggal
                                </label>

                                <input type="date" name="tgl_sertifikat" id="tanahTglSertifikat"
                                    value="{{ old('tgl_sertifikat') }}">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahLuasSertifikat">
                                    Luas Sertifikat
                                </label>

                                <div class="tanah-unit-input">

                                    <input type="number" name="luas_sertifikat" id="tanahLuasSertifikat" min="0"
                                        step="0.01" value="{{ old('luas_sertifikat') }}" placeholder="0">

                                    <span>
                                        m²
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {{-- =================================================
                     GAMBAR SITUASI
                ================================================== --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-header">

                            <div>

                                <span class="tanah-section-number">
                                    5
                                </span>

                                <div>

                                    <h4>
                                        Gambar Situasi
                                    </h4>

                                    <p>

                                        Data dokumen atau nomor
                                        gambar situasi tanah.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div class="tanah-form-grid tanah-form-grid-3">

                            <div class="tanah-field">

                                <label for="tanahNoGambar">
                                    No. Gambar
                                </label>

                                <input type="text" name="no_gambar" id="tanahNoGambar"
                                    value="{{ old('no_gambar') }}" placeholder="Nomor gambar situasi">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTglGambar">
                                    Tanggal
                                </label>

                                <input type="date" name="tgl_gambar" id="tanahTglGambar"
                                    value="{{ old('tgl_gambar') }}">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahLuasGambar">
                                    Luas
                                </label>

                                <div class="tanah-unit-input">

                                    <input type="number" name="luas_gambar" id="tanahLuasGambar" min="0"
                                        step="0.01" value="{{ old('luas_gambar') }}" placeholder="0">

                                    <span>
                                        m²
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {{-- =================================================
                     LEGAL
                ================================================== --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-header">

                            <div>

                                <span class="tanah-section-number">
                                    6
                                </span>

                                <div>

                                    <h4>
                                        Status dan Kepemilikan
                                    </h4>

                                    <p>

                                        Lengkapi asal, hak,
                                        pemilik dan keterangan tanah.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div class="tanah-form-grid">

                            <div class="tanah-field">

                                <label for="tanahAsal">
                                    Asal
                                </label>

                                <select name="asal" id="tanahAsal">

                                    <option value="">
                                        - PILIH ASAL -
                                    </option>

                                    <option value="Pembelian" @selected(old('asal') === 'Pembelian')>
                                        Pembelian
                                    </option>

                                    <option value="Hibah" @selected(old('asal') === 'Hibah')>
                                        Hibah
                                    </option>

                                    <option value="Penyerahan" @selected(old('asal') === 'Penyerahan')>
                                        Penyerahan
                                    </option>

                                    <option value="Perolehan Lainnya" @selected(old('asal') === 'Perolehan Lainnya')>
                                        Perolehan Lainnya
                                    </option>

                                </select>

                            </div>


                            <div class="tanah-field">

                                <label for="tanahHak">
                                    Hak
                                </label>

                                <select name="hak" id="tanahHak">

                                    <option value="">
                                        - PILIH HAK -
                                    </option>

                                    <option value="Hak Milik" @selected(old('hak') === 'Hak Milik')>
                                        Hak Milik
                                    </option>

                                    <option value="HGB" @selected(old('hak') === 'HGB')>
                                        HGB
                                    </option>

                                    <option value="HGU" @selected(old('hak') === 'HGU')>
                                        HGU
                                    </option>

                                    <option value="Hak Pakai" @selected(old('hak') === 'Hak Pakai')>
                                        Hak Pakai
                                    </option>

                                    <option value="Belum Bersertifikat" @selected(old('hak') === 'Belum Bersertifikat')>
                                        Belum Bersertifikat
                                    </option>

                                    <option value="Lainnya" @selected(old('hak') === 'Lainnya')>
                                        Lainnya
                                    </option>

                                </select>

                            </div>


                            <div class="tanah-field tanah-field-full">

                                <label for="tanahPemilik">
                                    Pemilik Asal
                                </label>

                                <input type="text" name="pemilik" id="tanahPemilik" value="{{ old('pemilik') }}"
                                    placeholder="Nama pemilik asal / pihak sebelumnya">

                            </div>


                            <div class="tanah-field tanah-field-full">

                                <label for="tanahKeterangan">
                                    Keterangan
                                </label>

                                <textarea name="ket" id="tanahKeterangan" rows="4" placeholder="Catatan tambahan terkait status tanah...">{{ old('ket') }}</textarea>

                            </div>

                        </div>

                    </section>

                </div>


                <div class="tanah-modal-footer">

                    <button type="button" class="tanah-button-secondary" data-close-dialog="tanahFormModal">

                        Batal

                    </button>


                    <button type="submit" class="tanah-button-primary" id="tanahSaveButton">

                        <i data-lucide="save"></i>

                        Simpan Data Tanah

                    </button>

                </div>

            </form>

        </dialog>


        {{-- =========================================================
         LOCATION DETAIL MODAL
    ========================================================== --}}

        <dialog class="tanah-modal tanah-location-modal" id="tanahLocationModal">

            <div class="tanah-modal-header">

                <div>

                    <span class="tanah-modal-eyebrow">
                        DATA TANAH
                    </span>

                    <h3 id="tanahLocationTitle">
                        Detail Lokasi
                    </h3>

                    <p>

                        Daftar sertifikat atau data tanah
                        pada lokasi terpilih.

                    </p>

                </div>


                <button type="button" class="tanah-modal-close" data-close-dialog="tanahLocationModal">

                    <i data-lucide="x"></i>

                </button>

            </div>


            <div class="tanah-modal-body">

                <div class="tanah-location-table-wrap">

                    <table class="tanah-location-table">

                        <thead>

                            <tr>

                                <th>No</th>

                                <th>Barang</th>

                                <th>Penggunaan</th>

                                <th>Pemilik</th>

                                <th>Luas Sertifikat</th>

                                <th>Hak</th>

                                <th>Aksi</th>

                            </tr>

                        </thead>


                        <tbody id="tanahLocationBody">

                            <tr>

                                <td colspan="7" class="tanah-location-empty">

                                    Memuat data...

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <div class="tanah-modal-footer">

                <button type="button" class="tanah-button-secondary" data-close-dialog="tanahLocationModal">

                    Tutup

                </button>

            </div>

        </dialog>


        {{-- =========================================================
         RECORD VIEW MODAL
    ========================================================== --}}

        <dialog class="tanah-modal tanah-detail-modal" id="tanahDetailModal">

            <div class="tanah-modal-header">

                <div>

                    <span class="tanah-modal-eyebrow">
                        DETAIL K.I.B A
                    </span>

                    <h3>
                        Detail Data Tanah
                    </h3>

                    <p>
                        Informasi lengkap data pertanahan.
                    </p>

                </div>


                <button type="button" class="tanah-modal-close" data-close-dialog="tanahDetailModal">

                    <i data-lucide="x"></i>

                </button>

            </div>


            <div class="tanah-modal-body">

                <div class="tanah-detail-grid">

                    <div>

                        <span>
                            Lokasi
                        </span>

                        <strong id="detailTanahLokasi">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Alamat
                        </span>

                        <strong id="detailTanahAlamat">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Barang
                        </span>

                        <strong id="detailTanahBarang">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Tahun
                        </span>

                        <strong id="detailTanahTahun">
                            -
                        </strong>

                    </div>


                    <div class="tanah-detail-full">

                        <span>
                            Penggunaan
                        </span>

                        <strong id="detailTanahGuna">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            No. Penunjukan
                        </span>

                        <strong id="detailTanahNoTunjuk">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Tanggal Penunjukan
                        </span>

                        <strong id="detailTanahTglTunjuk">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Luas Penunjukan
                        </span>

                        <strong id="detailTanahLuasTunjuk">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            No. Sertifikat
                        </span>

                        <strong id="detailTanahSertifikat">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Tanggal Sertifikat
                        </span>

                        <strong id="detailTanahTglSertifikat">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Luas Sertifikat
                        </span>

                        <strong id="detailTanahLuasSertifikat">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            No. Gambar Situasi
                        </span>

                        <strong id="detailTanahNoGambar">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Tanggal Gambar
                        </span>

                        <strong id="detailTanahTglGambar">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Luas Gambar
                        </span>

                        <strong id="detailTanahLuasGambar">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Asal
                        </span>

                        <strong id="detailTanahAsal">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Hak
                        </span>

                        <strong id="detailTanahHak">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Pemilik Asal
                        </span>

                        <strong id="detailTanahPemilik">
                            -
                        </strong>

                    </div>


                    <div class="tanah-detail-full">

                        <span>
                            Keterangan
                        </span>

                        <p id="detailTanahKeterangan">
                            -
                        </p>

                    </div>

                </div>

            </div>


            <div class="tanah-modal-footer">

                <button type="button" class="tanah-button-secondary" data-close-dialog="tanahDetailModal">

                    Tutup

                </button>

            </div>

        </dialog>


        {{-- =========================================================
         DELETE MODAL
    ========================================================== --}}

        <dialog class="tanah-modal tanah-delete-modal" id="tanahDeleteModal">

            <form method="POST" id="tanahDeleteForm">

                @csrf
                @method('DELETE')


                <div class="tanah-delete-body">

                    <div class="tanah-delete-icon">

                        <i data-lucide="triangle-alert"></i>

                    </div>


                    <h3>
                        Hapus Data Tanah?
                    </h3>


                    <p>

                        Data

                        <strong id="tanahDeleteName">
                            ini
                        </strong>

                        akan dihapus dari K.I.B Tanah.

                        Transaksi Nilai Aset sumber
                        tidak ikut dihapus dan dapat
                        tersedia kembali untuk diproses.

                    </p>

                </div>


                <div class="tanah-modal-footer">

                    <button type="button" class="tanah-button-secondary" data-close-dialog="tanahDeleteModal">

                        Batal

                    </button>


                    <button type="submit" class="tanah-button-danger">

                        <i data-lucide="trash-2"></i>

                        Ya, Hapus

                    </button>

                </div>

            </form>

        </dialog>


        {{-- =========================================================
         TOAST
    ========================================================== --}}

        <div class="tanah-toast" id="tanahToast" hidden>

            <i data-lucide="info"></i>

            <span id="tanahToastMessage"></span>

        </div>


        {{-- =========================================================
         FALLBACK DATA PENDING
    ========================================================== --}}

        <script
        type="application/json"
        id="tanahPendingFallback"
    >{!! json_encode(
        $pendingFallback,
        JSON_UNESCAPED_UNICODE
        | JSON_UNESCAPED_SLASHES
        | JSON_HEX_TAG
        | JSON_HEX_AMP
        | JSON_HEX_APOS
        | JSON_HEX_QUOT
    ) !!}</script>

    </div>


    <script
        src="{{ asset('js/pages/kib/tanah.js') }}?v={{ file_exists(public_path('js/pages/kib/tanah.js')) ? filemtime(public_path('js/pages/kib/tanah.js')) : time() }}">
    </script>

@endsection
