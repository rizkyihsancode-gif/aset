@extends('layouts.main')

@section('content')

    @php

        /*
    |--------------------------------------------------------------------------
    | DATA COMPATIBILITY
    |--------------------------------------------------------------------------
    */

        $rawTanah = $tanahRows ?? ($tanah ?? ($tanahs ?? collect()));

        if (is_object($rawTanah) && method_exists($rawTanah, 'items')) {
            $tanahRows = collect($rawTanah->items());
        } else {
            $tanahRows = collect($rawTanah);
        }

        $barangRows = collect($barangRows ?? ($barangOptions ?? ($barangs ?? [])));

        $pendingRows = collect($pendingTanah ?? ($baru ?? []));

        /*
    |--------------------------------------------------------------------------
    | FORMATTER
    |--------------------------------------------------------------------------
    */

        $rupiah = function ($value) {
            return 'Rp ' . number_format((int) ($value ?? 0), 0, ',', '.');
        };

        $angka = function ($value) {
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

        $totalLuasTanah =
            $totalLuasTanah ?? $tanahRows->sum(fn($row) => (float) (data_get($row, 'luas_sertifikat', 0) ?? 0));

        $totalNilaiTanah = $totalNilaiTanah ?? ($totalTanah ?? 0);

        $pendingCount = (int) ($pendingCount ?? ($notif ?? $pendingRows->count()));

        $updateTerakhir = $updateTerakhirLabel ?? ($updateTerakhir ?? '-');

        /*
    |--------------------------------------------------------------------------
    | PENDING FALLBACK
    |--------------------------------------------------------------------------
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

                    'departemen' => data_get($row, 'departemen', data_get($row, 'dep', '-')),

                    'divisi' => data_get($row, 'divisi', data_get($row, 'namDiv', '-')),

                    'tahun' => data_get($row, 'tahun', ''),

                    'nilai' => (int) (data_get($row, 'nilai', 0) ?? 0),

                    'urai' => data_get($row, 'urai', '-'),

                    'jenisn' => (int) data_get($row, 'jenisn', 1),
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
                        informasi penggunaan, nilai aset,
                        sertifikat dan dokumen pertanahan.

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


            {{-- =====================================================
             KPI
        ====================================================== --}}

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

                            {{ $angka($totalLuasTanah) }}

                            <small>
                                m²
                            </small>

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

                        <strong>

                            {{ $rupiah($totalNilaiTanah) }}

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
         FLASH
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
         NILAI ASET PENDING
    ========================================================== --}}

        {{-- =========================================================
     NOTIFIKASI PENDING TANAH
========================================================== --}}

        <section class="tanah-incoming-card" id="tanahIncomingCard">

            {{-- ICON --}}
            <div class="tanah-incoming-icon">

                <i data-lucide="bell-ring"></i>

            </div>


            {{-- CONTENT --}}
            <div class="tanah-incoming-content">

                {{-- JUDUL --}}
                <div class="tanah-incoming-title-row">

                    <div>

                        <span class="tanah-incoming-eyebrow">
                            NILAI ASET
                        </span>

                        <h3>
                            Data Tanah Menunggu Diproses
                        </h3>

                    </div>


                    {{-- TOTAL NOTIFIKASI --}}
                    <span class="tanah-incoming-count" id="tanahIncomingCount">
                        {{ $pendingCount }}
                    </span>

                </div>


                {{-- DESKRIPSI --}}
                <p id="tanahIncomingText">

                    Ada {{ $pendingCount }} transaksi Nilai Aset
                    kategori Tanah yang menunggu pendataan K.I.B.

                </p>


                {{-- SATU BADGE --}}
                <div class="tanah-incoming-meta">

                    <span class="is-green">

                        <i data-lucide="package-plus"></i>

                        <strong id="tanahIncomingNew">
                            {{ $pendingCount }}
                        </strong>

                        Data Pending Tanah

                    </span>

                </div>

            </div>


            {{-- TOMBOL LIHAT DATA --}}
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

                        Cari berdasarkan lokasi,
                        alamat atau penggunaan tanah.

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

                    <input type="search" id="tanahSearch" autocomplete="off"
                        placeholder="Cari lokasi, alamat atau penggunaan...">

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

                        Data K.I.B Tanah dikelompokkan berdasarkan lokasi, seperti web aset lama.

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

                            <th class="tanah-col-lokasi">
                                Lokasi
                            </th>

                            <th class="tanah-col-alamat">
                                Alamat
                            </th>

                            <th class="tanah-col-penggunaan">
                                Penggunaan
                            </th>

                            <th class="tanah-col-data">
                                Data Tanah
                            </th>

                            <th class="tanah-col-tahun">
                                Tahun
                            </th>

                            <th class="tanah-col-nilai">
                                Nilai
                            </th>

                            <th class="tanah-col-pdf">
                                PDF
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

                                    $penggunaan = data_get($row, 'guna_ringkas', data_get($row, 'guna', '-'));

                                    $nilai = (float) data_get($row, 'nilai_tanah', 0);
                                    $pdfCount = (int) data_get($row, 'pdf_count', 0);
                                    $jumlahData = (int) data_get($row, 'jumlah_data_tanah', 0);
                                    $jumlahTransaksi = (int) data_get($row, 'jumlah_transaksi_nilai', 0);
                                    $tahunAwal = trim((string) data_get($row, 'tahun_awal', ''));
                                    $tahunAkhir = trim((string) data_get($row, 'tahun_akhir', ''));
                                    $tahunLabel =
                                        $tahunAwal === $tahunAkhir || $tahunAkhir === ''
                                            ? ($tahunAwal ?:
                                            '-')
                                            : $tahunAwal . ' – ' . $tahunAkhir;

                                    $searchText = mb_strtolower(
                                        implode(' ', [$lokasi, $alamat, $penggunaan, $tahunLabel, $nilai]),
                                    );
                                @endphp


                                <tr class="tanah-data-row" data-search="{{ $searchText }}"
                                    data-nilai="{{ $nilai }}" data-tahun="{{ $tahunLabel }}"
                                    data-jumlah="{{ $jumlahData }}" data-pdf="{{ $pdfCount }}"
                                    data-record-id="{{ $rowId }}" data-location-id="{{ $locationId }}">

                                    {{-- NO --}}

                                    <td class="tanah-row-number">

                                        {{ $loop->iteration }}

                                    </td>


                                    {{-- LOKASI --}}

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


                                    {{-- ALAMAT --}}

                                    <td class="tanah-address-cell">

                                        {{ $alamat }}

                                    </td>


                                    {{-- PENGGUNAAN --}}

                                    <td class="tanah-usage-cell">

                                        {{ $penggunaan ?: '-' }}

                                    </td>


                                    {{-- DATA TANAH: sertifikat dikelompokkan berdasarkan lokasi --}}
                                    <td class="tanah-data-cell">
                                        <button type="button" class="tanah-data-button js-tanah-view"
                                            data-location-id="{{ $locationId }}"
                                            data-location-name="{{ $lokasi }}"
                                            title="Lihat {{ $jumlahData }} data sertifikat Tanah">
                                            <i data-lucide="files"></i>
                                            <span><strong>{{ $jumlahData }} data</strong><small>Lihat
                                                    sertifikat</small></span>
                                        </button>
                                    </td>

                                    {{-- TAHUN: berasal dari tanahs.tahun --}}
                                    <td class="tanah-year-cell">{{ $tahunLabel }}</td>

                                    {{-- NILAI: tetap dapat diklik untuk riwayat voucher --}}
                                    <td class="tanah-value-cell">

                                        <button type="button" class="tanah-nilai-button js-tanah-nilai"
                                            data-location-id="{{ $locationId }}"
                                            data-location-name="{{ $lokasi }}"
                                            title="Lihat rincian transaksi Nilai Aset">
                                            <span class="tanah-nilai-caption">
                                                <strong>{{ $rupiah($nilai) }}</strong>
                                                <small>{{ $jumlahTransaksi }} transaksi tanah</small>
                                            </span>
                                            <i data-lucide="external-link"></i>
                                        </button>

                                    </td>


                                    {{-- PDF PER LOKASI --}}
                                    <td class="tanah-pdf-cell">
                                        @if ($pdfCount > 0)
                                            <button type="button" class="tanah-pdf-button js-tanah-pdf-list"
                                                data-location-id="{{ $locationId }}"
                                                data-location-name="{{ $lokasi }}"
                                                title="Daftar PDF untuk lokasi ini">
                                                <i data-lucide="file-text"></i> PDF ({{ $pdfCount }})
                                            </button>
                                        @else
                                            <span class="tanah-pdf-empty"><i data-lucide="file-x-2"></i> Belum ada</span>
                                        @endif
                                    </td>

                                    {{-- AKSI --}}

                                    <td>

                                        <div class="tanah-actions">

                                            <button type="button" class="view js-tanah-view"
                                                data-record-id="{{ $rowId }}"
                                                data-location-id="{{ $locationId }}"
                                                data-location-name="{{ $lokasi }}"
                                                title="Lihat semua sertifikat pada lokasi">

                                                <i data-lucide="eye"></i>

                                            </button>


                                            <button type="button" class="edit js-tanah-edit"
                                                data-record-id="{{ $rowId }}"
                                                title="Pilih sertifikat untuk diedit">

                                                <i data-lucide="square-pen"></i>

                                            </button>


                                            <button type="button" class="delete js-tanah-delete"
                                                data-record-id="{{ $rowId }}"
                                                data-record-name="{{ $lokasi }}"
                                                title="Pilih sertifikat untuk dihapus">

                                                <i data-lucide="trash-2"></i>

                                            </button>

                                        </div>

                                    </td>

                                </tr>
                            @endforeach
                        @else
                            <tr>

                                <td colspan="9" class="tanah-empty">

                                    <i data-lucide="database-zap"></i>

                                    <strong>
                                        Belum ada data Tanah
                                    </strong>

                                    <span>

                                        Data Tanah akan ditampilkan
                                        setelah tersimpan pada sistem.

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
         CREATE / EDIT MODAL
    ========================================================== --}}

        <dialog class="tanah-modal tanah-form-modal" id="tanahFormModal">

            <form id="tanahForm" action="{{ url('/kib/tanah') }}" method="POST" enctype="multipart/form-data">

                @csrf


                <input type="hidden" name="_method" id="tanahFormMethod" value="" disabled>
                <input type="hidden" name="tanah_id" id="tanahEditingId" value="">


                <input type="hidden" name="id_nilai_aktiva" id="tanahNilaiAktivaId">


                <input type="hidden" name="id_lokasi" id="tanahLokasiId">


                <div class="tanah-modal-header">

                    <div>

                        <span class="tanah-modal-eyebrow">
                            K.I.B A
                        </span>

                        <h3 id="tanahFormTitle">
                            Tambah Data Tanah
                        </h3>

                        <p>

                            Pilih transaksi Nilai Aset lalu lengkapi
                            data inventaris tanah.

                        </p>

                    </div>


                    <button type="button" class="tanah-modal-close" data-close-dialog="tanahFormModal">

                        <i data-lucide="x"></i>

                    </button>

                </div>


                <div class="tanah-modal-body">


                    {{-- SOURCE --}}

                    <section class="tanah-form-section tanah-source-section" id="tanahSourceSection">

                        <div class="tanah-section-title">

                            <span>
                                1
                            </span>

                            <div>

                                <h4>
                                    Pilih Data Nilai Aset
                                </h4>

                                <p>

                                    Pilih transaksi kategori Tanah
                                    yang belum diproses.

                                </p>

                            </div>

                        </div>


                        <div class="tanah-source-toolbar">

                            <div class="tanah-search">

                                <i data-lucide="search"></i>

                                <input type="search" id="tanahSourceSearch" autocomplete="off"
                                    placeholder="Cari lokasi, voucher, departemen, divisi atau uraian...">

                            </div>


                            <span id="tanahSourceTotal">
                                0 data
                            </span>

                        </div>


                        <div class="tanah-source-scroll">

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

                                            Memuat data...

                                        </td>

                                    </tr>

                                </tbody>

                            </table>

                        </div>

                    </section>


                    {{-- SOURCE SELECTED --}}

                    <section class="tanah-selected-source" id="tanahSelectedSource" hidden>

                        <div class="tanah-selected-icon">

                            <i data-lucide="circle-check-big"></i>

                        </div>


                        <div>

                            <span>
                                Data Nilai Aset Terpilih
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


                    {{-- BASIC --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-title">

                            <span>
                                2
                            </span>

                            <div>

                                <h4>
                                    Informasi Tanah
                                </h4>

                                <p>
                                    Informasi utama objek tanah.
                                </p>

                            </div>

                        </div>


                        <div class="tanah-form-grid">


                            <div class="tanah-field">

                                <label>
                                    Lokasi
                                    <b>*</b>
                                </label>

                                <input type="text" id="tanahLokasiName" readonly placeholder="Pilih data Nilai Aset">

                            </div>


                            <div class="tanah-field">

                                <label>
                                    Alamat
                                </label>

                                <input type="text" id="tanahAlamat" readonly
                                    placeholder="Alamat otomatis dari lokasi">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahBarang">
                                    Barang
                                    <b>*</b>
                                </label>

                                <select name="id_barang" id="tanahBarang" required>

                                    <option value="">
                                        - PILIH BARANG -
                                    </option>


                                    @foreach ($barangRows as $barang)
                                        <option value="{{ data_get($barang, 'id') }}">

                                            {{ data_get($barang, 'kode_barang', data_get($barang, 'kode', '')) }}

                                            @if (data_get($barang, 'kode_barang', data_get($barang, 'kode')))
                                                -
                                            @endif

                                            {{ data_get($barang, 'nama_barang', data_get($barang, 'barang', '-')) }}

                                        </option>
                                    @endforeach

                                </select>

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTahun">
                                    Tahun
                                </label>

                                <input type="number" name="tahun" id="tanahTahun" min="1900" max="2200"
                                    required>

                            </div>


                            <div class="tanah-field tanah-field-full">

                                <label for="tanahGuna">
                                    Penggunaan
                                    <b>*</b>
                                </label>

                                <textarea name="guna" id="tanahGuna" rows="3" required
                                    placeholder="Contoh: Reservoir AWS, IPA, kantor, lahan pengembangan..."></textarea>

                            </div>

                        </div>

                    </section>


                    {{-- PENUNJUKAN --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-title">

                            <span>
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


                        <div class="tanah-form-grid tanah-grid-3">


                            <div class="tanah-field">

                                <label for="tanahNoTunjuk">
                                    Nomor Surat
                                </label>

                                <input type="text" name="no_tunjuk" id="tanahNoTunjuk">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTglTunjuk">
                                    Tanggal Surat
                                </label>

                                <input type="date" name="tgl_tunjuk" id="tanahTglTunjuk" required>

                            </div>


                            <div class="tanah-field">

                                <label for="tanahLuasTunjuk">
                                    Luas
                                </label>

                                <div class="tanah-unit-field">

                                    <input type="number" name="luas_tunjuk" id="tanahLuasTunjuk" min="0"
                                        step="0.01">

                                    <span>
                                        m²
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {{-- SERTIFIKAT --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-title">

                            <span>
                                4
                            </span>

                            <div>

                                <h4>
                                    Sertifikat / SPPT / SPHAT / SPJBT
                                </h4>

                                <p>
                                    Informasi dokumen legal pertanahan.
                                </p>

                            </div>

                        </div>


                        <div class="tanah-form-grid tanah-grid-3">


                            <div class="tanah-field">

                                <label for="tanahSertifikat">
                                    Nomor Sertifikat / Surat
                                </label>

                                <input type="text" name="sertifikat" id="tanahSertifikat">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTglSertifikat">
                                    Tanggal
                                </label>

                                <input type="date" name="tgl_sertifikat" id="tanahTglSertifikat" required>

                            </div>


                            <div class="tanah-field">

                                <label for="tanahLuasSertifikat">
                                    Luas Sertifikat
                                </label>

                                <div class="tanah-unit-field">

                                    <input type="number" name="luas_sertifikat" id="tanahLuasSertifikat" min="0"
                                        step="0.01">

                                    <span>
                                        m²
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {{-- GAMBAR --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-title">

                            <span>
                                5
                            </span>

                            <div>

                                <h4>
                                    Gambar Situasi
                                </h4>

                                <p>
                                    Data gambar situasi tanah.
                                </p>

                            </div>

                        </div>


                        <div class="tanah-form-grid tanah-grid-3">


                            <div class="tanah-field">

                                <label for="tanahNoGambar">
                                    Nomor Gambar
                                </label>

                                <input type="text" name="no_gambar" id="tanahNoGambar">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahTglGambar">
                                    Tanggal
                                </label>

                                <input type="date" name="tgl_gambar" id="tanahTglGambar">

                            </div>


                            <div class="tanah-field">

                                <label for="tanahLuasGambar">
                                    Luas
                                </label>

                                <div class="tanah-unit-field">

                                    <input type="number" name="luas_gambar" id="tanahLuasGambar" min="0"
                                        step="0.01">

                                    <span>
                                        m²
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {{-- KEPEMILIKAN --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-title">

                            <span>
                                6
                            </span>

                            <div>

                                <h4>
                                    Status dan Kepemilikan
                                </h4>

                                <p>
                                    Informasi asal dan status hak tanah.
                                </p>

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

                                    <option value="Pembelian">
                                        Pembelian
                                    </option>

                                    <option value="Hibah">
                                        Hibah
                                    </option>

                                    <option value="Penyerahan">
                                        Penyerahan
                                    </option>

                                    <option value="Perolehan Lainnya">
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

                                    <option value="Hak Milik">
                                        Hak Milik
                                    </option>

                                    <option value="HGB">
                                        HGB
                                    </option>

                                    <option value="HGU">
                                        HGU
                                    </option>

                                    <option value="Hak Pakai">
                                        Hak Pakai
                                    </option>

                                    <option value="Belum Bersertifikat">
                                        Belum Bersertifikat
                                    </option>

                                    <option value="Lainnya">
                                        Lainnya
                                    </option>

                                </select>

                            </div>


                            <div class="tanah-field tanah-field-full">

                                <label for="tanahPemilik">
                                    Pemilik Asal
                                </label>

                                <input type="text" name="pemilik" id="tanahPemilik">

                            </div>


                            <div class="tanah-field tanah-field-full">

                                <label for="tanahKeterangan">
                                    Keterangan
                                </label>

                                <textarea name="ket" id="tanahKeterangan" rows="4"></textarea>

                            </div>

                        </div>

                    </section>


                    {{-- PDF --}}

                    <section class="tanah-form-section">

                        <div class="tanah-section-title">

                            <span>
                                7
                            </span>

                            <div>

                                <h4>
                                    Dokumen PDF
                                </h4>

                                <p>

                                    Upload hasil scan sertifikat
                                    atau dokumen pendukung tanah.

                                </p>

                            </div>

                        </div>


                        <div class="tanah-upload-box">

                            <div class="tanah-upload-icon">

                                <i data-lucide="file-up"></i>

                            </div>


                            <div class="tanah-upload-content">

                                <strong>
                                    Upload Dokumen PDF
                                </strong>

                                <span>
                                    Format PDF, maksimal 15 MB.
                                </span>

                            </div>


                            <label class="tanah-upload-button">

                                <i data-lucide="upload"></i>

                                Pilih File

                                <input type="file" name="dokumen_pdf" id="tanahPdfInput" accept="application/pdf"
                                    hidden>

                            </label>

                        </div>


                        <div class="tanah-file-selected" id="tanahFileSelected" hidden>

                            <i data-lucide="file-check-2"></i>

                            <span id="tanahFileName"></span>

                        </div>
                        <button type="button" id="tanahPreviewSelectedPdf" class="tanah-button-secondary" hidden>
                            <i data-lucide="eye"></i> Preview PDF sebelum simpan
                        </button>


                    </section>

                </div>


                <div class="tanah-modal-footer">

                    <button type="button" class="tanah-button-secondary" data-close-dialog="tanahFormModal">

                        Batal

                    </button>


                    <button type="submit" class="tanah-button-primary">

                        <i data-lucide="save"></i>

                        Simpan Data Tanah

                    </button>

                </div>

            </form>

        </dialog>


        {{-- =========================================================
             DAFTAR SERTIFIKAT PER LOKASI
        ========================================================== --}}
        <dialog class="tanah-modal tanah-location-modal" id="tanahLocationModal" aria-labelledby="tanahLocationTitle">
            <div class="tanah-legacy-topbar">
                <div class="tanah-legacy-topbar-title">
                    <span class="tanah-modal-eyebrow">K.I.B A / DATA TANAH</span>
                    <h3 id="tanahLocationTitle">Detail Lokasi Tanah</h3>
                    <p id="tanahLegacyLocationAddress">Pilih sertifikat di sebelah kiri untuk melihat data lengkap.</p>
                </div>
                <button type="button" class="tanah-modal-close" data-close-dialog="tanahLocationModal"
                    aria-label="Tutup detail tanah">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="tanah-legacy-workspace">
                {{-- KIRI: DAFTAR SERTIFIKAT SEPERTI WEB LAMA --}}
                <aside class="tanah-legacy-list-pane" aria-label="Daftar sertifikat dalam lokasi">
                    <div class="tanah-legacy-pane-header">
                        <div><strong>Daftar Sertifikat</strong><small>Klik pemilik asal untuk melihat detail</small></div>
                        <span id="tanahLegacyRecordCount" class="tanah-legacy-total">0 data</span>
                    </div>
                    <div class="tanah-legacy-list-table-head">
                        <span>No</span><span>Pemilik Asal</span><span>Ukuran</span>
                    </div>
                    <div class="tanah-legacy-list" id="tanahLegacyList" role="group"
                        aria-label="Pilih sertifikat tanah">
                        <p class="tanah-legacy-loading">Memuat daftar sertifikat...</p>
                    </div>
                    <div class="tanah-legacy-pane-foot">
                        <i data-lucide="info"></i>
                        Aksi Edit dan Hapus berlaku untuk sertifikat yang dipilih, bukan seluruh lokasi.
                    </div>
                </aside>

                {{-- KANAN: DETAIL SERTIFIKAT DAN FOTO LOKASI --}}
                <section class="tanah-legacy-detail-pane" aria-label="Detail sertifikat terpilih">
                    <div id="tanahLegacyEmpty" class="tanah-legacy-empty">
                        <i data-lucide="mouse-pointer-click"></i>
                        <strong>Pilih data sertifikat</strong>
                        <span>Informasi lengkap akan ditampilkan di bagian ini.</span>
                    </div>

                    <div id="tanahLegacyDetails" hidden>
                        <div class="tanah-legacy-detail-heading">
                            <div>
                                <span class="tanah-modal-eyebrow">RINCIAN SERTIFIKAT</span>
                                <h4 id="tanahLegacyGuna">-</h4>
                                <small id="tanahLegacyKode">-</small>
                            </div>
                            <div class="tanah-legacy-detail-actions">
                                <button type="button" class="tanah-legacy-mini-button view" id="tanahLegacyNilaiButton"
                                    title="Rincian Nilai Aset"><i data-lucide="banknote"></i> Nilai</button>
                                <button type="button" class="tanah-legacy-mini-button edit" id="tanahLegacyEditButton"
                                    title="Edit sertifikat"><i data-lucide="square-pen"></i> Edit</button>
                                <button type="button" class="tanah-legacy-mini-button delete"
                                    id="tanahLegacyDeleteButton" title="Hapus sertifikat"><i
                                        data-lucide="trash-2"></i></button>
                            </div>
                        </div>

                        <div class="tanah-legacy-photo-wrap">
                            <img id="tanahLegacyPhoto" alt="Foto lokasi aset tanah" hidden>
                            <div id="tanahLegacyPhotoEmpty" class="tanah-legacy-photo-empty"><i
                                    data-lucide="image-off"></i><span>Foto lokasi belum tersedia</span></div>
                        </div>

                        <div class="tanah-legacy-info-grid">
                            <section class="tanah-legacy-info-panel">
                                <h5>Informasi Tanah</h5>
                                <dl>
                                    <div>
                                        <dt>Letak / Alamat</dt>
                                        <dd id="tanahLegacyAlamat">-</dd>
                                    </div>
                                    <div>
                                        <dt>Nama Barang</dt>
                                        <dd id="tanahLegacyBarang">-</dd>
                                    </div>
                                    <div>
                                        <dt>Kode Barang</dt>
                                        <dd id="tanahLegacyKodeBarang">-</dd>
                                    </div>
                                </dl>
                            </section>
                            <section class="tanah-legacy-info-panel">
                                <h5>Perolehan & Penggunaan</h5>
                                <dl>
                                    <div>
                                        <dt>Asal Usul</dt>
                                        <dd id="tanahLegacyAsal">-</dd>
                                    </div>
                                    <div>
                                        <dt>Tahun Pengadaan</dt>
                                        <dd id="tanahLegacyTahun">-</dd>
                                    </div>
                                    <div>
                                        <dt>Penggunaan</dt>
                                        <dd id="tanahLegacyPenggunaan">-</dd>
                                    </div>
                                </dl>
                            </section>
                        </div>

                        <section class="tanah-legacy-document-section">
                            <h5>Penunjukan</h5>
                            <div class="tanah-legacy-document-grid">
                                <div><span>Nomor Surat</span><strong id="tanahLegacyNoTunjuk">-</strong></div>
                                <div><span>Tanggal</span><strong id="tanahLegacyTglTunjuk">-</strong></div>
                                <div><span>Luas</span><strong id="tanahLegacyLuasTunjuk">-</strong></div>
                            </div>
                        </section>
                        <section class="tanah-legacy-document-section">
                            <h5>SPPT / SPHAT / SPJBT / Sertifikat</h5>
                            <div class="tanah-legacy-document-grid">
                                <div><span>Nomor Surat</span><strong id="tanahLegacySertifikat">-</strong></div>
                                <div><span>Tanggal</span><strong id="tanahLegacyTglSertifikat">-</strong></div>
                                <div><span>Luas</span><strong id="tanahLegacyLuasSertifikat">-</strong></div>
                            </div>
                        </section>
                        <section class="tanah-legacy-document-section">
                            <h5>Gambar Situasi</h5>
                            <div class="tanah-legacy-document-grid">
                                <div><span>Nomor Gambar</span><strong id="tanahLegacyNoGambar">-</strong></div>
                                <div><span>Tanggal</span><strong id="tanahLegacyTglGambar">-</strong></div>
                                <div><span>Luas</span><strong id="tanahLegacyLuasGambar">-</strong></div>
                            </div>
                        </section>

                        <div class="tanah-legacy-info-grid">
                            <section class="tanah-legacy-info-panel">
                                <h5>Kepemilikan</h5>
                                <dl>
                                    <div>
                                        <dt>Hak</dt>
                                        <dd id="tanahLegacyHak">-</dd>
                                    </div>
                                    <div>
                                        <dt>Pemilik Asal</dt>
                                        <dd id="tanahLegacyPemilik">-</dd>
                                    </div>
                                </dl>
                            </section>
                            <section class="tanah-legacy-info-panel">
                                <h5>Keterangan</h5>
                                <p class="tanah-legacy-note" id="tanahLegacyKeterangan">-</p>
                            </section>
                        </div>

                        <section class="tanah-legacy-document-section tanah-legacy-pdf-section">
                            <h5><i data-lucide="file-text"></i> Dokumen PDF & Hasil Scan</h5>
                            <div id="tanahLegacyDocuments" class="tanah-legacy-documents">
                                <span>Belum ada dokumen untuk sertifikat ini.</span>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </dialog>

        {{-- =========================================================
             POPUP RINCIAN NILAI ASET PER LOKASI
        ========================================================== --}}
        <dialog class="tanah-modal tanah-nilai-modal" id="tanahNilaiModal">
            <div class="tanah-modal-header">
                <div>
                    <span class="tanah-modal-eyebrow">RIWAYAT NILAI ASET</span>
                    <h3 id="tanahNilaiTitle">Rincian Nilai Aset</h3>
                    <p>Klik nominal pada daftar utama untuk melihat voucher per tahun.</p>
                </div><button type="button" class="tanah-modal-close" data-close-dialog="tanahNilaiModal"
                    aria-label="Tutup"><i data-lucide="x"></i></button>
            </div>
            <div class="tanah-modal-body">
                <div class="tanah-nilai-summary">Total Nilai Tanah: <strong id="tanahNilaiTotal">Rp 0</strong></div>
                <div class="tanah-table-scroll">
                    <table class="tanah-table tanah-nilai-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Voucher</th>
                                <th>Tanggal</th>
                                <th>Tahun</th>
                                <th>Aktiva</th>
                                <th>Uraian</th>
                                <th>Nilai</th>
                                <th>PDF</th>
                            </tr>
                        </thead>
                        <tbody id="tanahNilaiBody">
                            <tr>
                                <td colspan="8" class="tanah-empty">Memuat riwayat...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="tanah-modal-footer"><button type="button" class="tanah-button-secondary"
                    data-close-dialog="tanahNilaiModal">Tutup</button></div>
        </dialog>

        {{-- =========================================================
             DAFTAR PDF PER LOKASI
        ========================================================== --}}
        <dialog class="tanah-modal tanah-documents-modal" id="tanahDocumentsModal">
            <div class="tanah-modal-header">
                <div>
                    <span class="tanah-modal-eyebrow">ARSIP SERTIFIKAT</span>
                    <h3 id="tanahDocumentsTitle">Dokumen Tanah</h3>
                    <p>Pilih dokumen untuk preview dan download.</p>
                </div><button type="button" class="tanah-modal-close" data-close-dialog="tanahDocumentsModal"
                    aria-label="Tutup"><i data-lucide="x"></i></button>
            </div>
            <div class="tanah-modal-body">
                <div class="tanah-table-scroll">
                    <table class="tanah-table tanah-documents-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Sertifikat</th>
                                <th>Tahun</th>
                                <th>Dokumen</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tanahDocumentsBody">
                            <tr>
                                <td colspan="5" class="tanah-empty">Memuat dokumen...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="tanah-modal-footer"><button type="button" class="tanah-button-secondary"
                    data-close-dialog="tanahDocumentsModal">Tutup</button></div>
        </dialog>

        {{-- =========================================================
         DETAIL
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
                        Informasi lengkap aset Tanah.
                    </p>

                </div>


                <button type="button" class="tanah-modal-close" data-close-dialog="tanahDetailModal">

                    <i data-lucide="x"></i>

                </button>

            </div>


            <div class="tanah-modal-body">

                <div class="tanah-detail-grid">

                    <div>
                        <span>Lokasi</span>
                        <strong id="detailTanahLokasi">-</strong>
                    </div>

                    <div>
                        <span>Alamat</span>
                        <strong id="detailTanahAlamat">-</strong>
                    </div>

                    <div>
                        <span>Barang</span>
                        <strong id="detailTanahBarang">-</strong>
                    </div>

                    <div>
                        <span>Tahun</span>
                        <strong id="detailTanahTahun">-</strong>
                    </div>

                    <div class="tanah-detail-full">
                        <span>Penggunaan</span>
                        <strong id="detailTanahGuna">-</strong>
                    </div>

                    <div>
                        <span>Nilai</span>
                        <strong id="detailTanahNilai">-</strong>
                    </div>

                    <div>
                        <span>No. Penunjukan</span>
                        <strong id="detailTanahNoTunjuk">-</strong>
                    </div>

                    <div>
                        <span>Tanggal Penunjukan</span>
                        <strong id="detailTanahTglTunjuk">-</strong>
                    </div>

                    <div>
                        <span>Luas Penunjukan</span>
                        <strong id="detailTanahLuasTunjuk">-</strong>
                    </div>

                    <div>
                        <span>No. Sertifikat</span>
                        <strong id="detailTanahSertifikat">-</strong>
                    </div>

                    <div>
                        <span>Tanggal Sertifikat</span>
                        <strong id="detailTanahTglSertifikat">-</strong>
                    </div>

                    <div>
                        <span>Luas Sertifikat</span>
                        <strong id="detailTanahLuasSertifikat">-</strong>
                    </div>

                    <div>
                        <span>No. Gambar</span>
                        <strong id="detailTanahNoGambar">-</strong>
                    </div>

                    <div>
                        <span>Tanggal Gambar</span>
                        <strong id="detailTanahTglGambar">-</strong>
                    </div>

                    <div>
                        <span>Luas Gambar</span>
                        <strong id="detailTanahLuasGambar">-</strong>
                    </div>

                    <div>
                        <span>Asal</span>
                        <strong id="detailTanahAsal">-</strong>
                    </div>

                    <div>
                        <span>Hak</span>
                        <strong id="detailTanahHak">-</strong>
                    </div>

                    <div>
                        <span>Pemilik Asal</span>
                        <strong id="detailTanahPemilik">-</strong>
                    </div>

                    <div class="tanah-detail-full">
                        <span>Keterangan</span>
                        <p id="detailTanahKeterangan">-</p>
                    </div>

                </div>

            </div>


            <div class="tanah-modal-footer">
                <button type="button" class="tanah-pdf-button" id="tanahDetailPdfButton" hidden>
                    <i data-lucide="file-text"></i> Lihat Dokumen PDF
                </button>
                <button type="button" class="tanah-button-secondary" data-close-dialog="tanahDetailModal">
                    Tutup
                </button>

            </div>

        </dialog>


        {{-- =========================================================
         PDF PREVIEW
    ========================================================== --}}

        <dialog class="tanah-modal tanah-pdf-modal" id="tanahPdfModal">

            <div class="tanah-pdf-header">

                <div class="tanah-pdf-title">

                    <div>

                        <i data-lucide="file-text"></i>

                    </div>


                    <section>

                        <span>
                            DOKUMEN TANAH
                        </span>

                        <h3 id="tanahPdfTitle">
                            Preview PDF
                        </h3>

                    </section>

                </div>


                <button type="button" class="tanah-modal-close" id="tanahPdfClose">

                    <i data-lucide="x"></i>

                </button>

            </div>


            <div class="tanah-pdf-toolbar">

                <span>

                    <i data-lucide="shield-check"></i>

                    Preview dokumen Sistem Aset

                </span>


                <a href="#" id="tanahPdfDownload" class="tanah-pdf-download" target="_blank">

                    <i data-lucide="download"></i>

                    Download PDF

                </a>

            </div>


            <div class="tanah-pdf-viewer">

                <iframe id="tanahPdfFrame" title="Preview Dokumen Tanah"></iframe>

            </div>

        </dialog>


        {{-- =========================================================
         DELETE
    ========================================================== --}}

        <dialog class="tanah-modal tanah-delete-modal" id="tanahDeleteModal">

            <form method="POST" id="tanahDeleteForm">

                @csrf
                @method('DELETE')


                <div class="tanah-delete-content">

                    <div>

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

                    </p>

                </div>


                <div class="tanah-modal-footer">

                    <button type="button" class="tanah-button-secondary" data-close-dialog="tanahDeleteModal">

                        Batal

                    </button>


                    <button type="submit" class="tanah-button-danger">

                        <i data-lucide="trash-2"></i>

                        Hapus

                    </button>

                </div>

            </form>

        </dialog>


        {{-- =========================================================
         TOAST
    ========================================================== --}}

        <div id="tanahToast" class="tanah-toast" hidden>

            <i data-lucide="info"></i>

            <span id="tanahToastMessage"></span>

        </div>


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

        <script type="application/json" id="tanahOldInput">{!! json_encode(old(), JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>

    </div>


    <script
        src="{{ asset('js/pages/kib/tanah.js') }}?v={{ file_exists(public_path('js/pages/kib/tanah.js')) ? filemtime(public_path('js/pages/kib/tanah.js')) : time() }}">
    </script>

@endsection
