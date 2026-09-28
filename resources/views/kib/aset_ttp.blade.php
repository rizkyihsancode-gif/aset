@extends('layouts.main')

@section('title', 'Aset Tetap Lainnya')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/aset_ttp.css') }}">
@endpush

@section('content')

    <section class="content aset-ttp-page">

        {{-- =====================================================
         HERO
    ====================================================== --}}

        <section class="aset-ttp-hero">

            <div class="aset-ttp-hero-overlay"></div>

            <div class="aset-ttp-hero-inner">

                {{-- BREADCRUMB --}}
                <nav class="aset-ttp-breadcrumb" aria-label="Breadcrumb">

                    <a href="{{ route('dashboard') }}" aria-label="Home">
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>

                    <span>K.I.B</span>

                    <i data-lucide="chevron-right"></i>

                    <strong aria-current="page">
                        Aset Tetap Lainnya
                    </strong>

                </nav>


                {{-- TITLE --}}
                <div class="aset-ttp-heading">

                    <h1>
                        Aset Tetap Lainnya
                    </h1>

                    <p>
                        Kelola data aset tetap lainnya seperti buku,
                        koleksi perpustakaan, barang bercorak kesenian
                        dan aset tetap lainnya pada Perumdam Tirta Kencana
                        Kota Samarinda.
                    </p>

                </div>


                {{-- =================================================
                 KPI
            ================================================== --}}

                <div class="aset-ttp-kpi-grid">

                    {{-- TOTAL ASET --}}
                    <div class="aset-ttp-kpi-card">

                        <div class="aset-ttp-kpi-icon">
                            <i data-lucide="archive"></i>
                        </div>

                        <div class="aset-ttp-kpi-content">

                            <span>
                                Total Aset
                            </span>

                            <div class="aset-ttp-kpi-inline">

                                <strong>
                                    128
                                </strong>

                                <small>
                                    <i data-lucide="arrow-up"></i>
                                    +9
                                </small>

                            </div>

                            <p>
                                dari tahun lalu
                            </p>

                        </div>

                    </div>


                    {{-- NILAI PEROLEHAN --}}
                    <div class="aset-ttp-kpi-card">

                        <div class="aset-ttp-kpi-icon">
                            <i data-lucide="wallet-cards"></i>
                        </div>

                        <div class="aset-ttp-kpi-content">

                            <span>
                                Total Nilai Perolehan
                            </span>

                            <strong>
                                Rp 2,86 M
                            </strong>

                        </div>

                    </div>


                    {{-- NILAI BUKU --}}
                    <div class="aset-ttp-kpi-card">

                        <div class="aset-ttp-kpi-icon">
                            <i data-lucide="chart-no-axes-combined"></i>
                        </div>

                        <div class="aset-ttp-kpi-content">

                            <span>
                                Nilai Buku
                            </span>

                            <strong>
                                Rp 1,94 M
                            </strong>

                        </div>

                    </div>


                    {{-- JENIS ASET --}}
                    <div class="aset-ttp-kpi-card">

                        <div class="aset-ttp-kpi-icon">
                            <i data-lucide="layers-3"></i>
                        </div>

                        <div class="aset-ttp-kpi-content">

                            <span>
                                Jenis Aset
                            </span>

                            <strong>
                                5
                            </strong>

                            <p>
                                kelompok aset
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </section>



        {{-- =====================================================
         MAIN WORKSPACE
    ====================================================== --}}

        <section class="aset-ttp-card aset-ttp-workspace">

            {{-- HEADER --}}
            <div class="aset-ttp-workspace-head">

                <div class="aset-ttp-tabs" role="tablist" aria-label="Menu Aset Tetap Lainnya">

                    <button type="button" class="active" data-aset-ttp-tab="list" role="tab" aria-selected="true">
                        Daftar Aset
                    </button>

                    <button type="button" data-aset-ttp-tab="recap" role="tab" aria-selected="false">
                        Rekapitulasi
                    </button>

                    <button type="button" data-aset-ttp-tab="chart" role="tab" aria-selected="false">
                        Grafik
                    </button>

                    <button type="button" data-aset-ttp-tab="depreciation" role="tab" aria-selected="false">
                        Penyusutan
                    </button>

                </div>


                <button type="button" class="aset-ttp-add-button" onclick="openAsetTtpModal('add')">

                    <i data-lucide="plus"></i>

                    Tambah Aset

                </button>

            </div>



            {{-- =====================================================
             FILTER
        ====================================================== --}}

            <div class="aset-ttp-filter-row">

                {{-- SEARCH --}}
                <div class="aset-ttp-search">

                    <i data-lucide="search"></i>

                    <input type="search" id="asetTtpSearch" placeholder="Cari kode, nama aset, lokasi, atau keterangan..."
                        aria-label="Cari aset tetap lainnya">

                </div>


                {{-- JENIS --}}
                <div class="aset-ttp-select-field">

                    <select id="asetTtpJenis" aria-label="Filter jenis aset">

                        <option value="">
                            Semua Jenis Aset
                        </option>

                        <option value="Buku Perpustakaan">
                            Buku Perpustakaan
                        </option>

                        <option value="Barang Bercorak Kesenian">
                            Barang Bercorak Kesenian
                        </option>

                        <option value="Hewan Ternak">
                            Hewan Ternak
                        </option>

                        <option value="Tanaman">
                            Tanaman
                        </option>

                        <option value="Aset Tetap Lainnya">
                            Aset Tetap Lainnya
                        </option>

                    </select>

                </div>


                {{-- LOKASI --}}
                <div class="aset-ttp-select-field">

                    <select id="asetTtpLokasi" aria-label="Filter lokasi">

                        <option value="">
                            Semua Lokasi
                        </option>

                        <option value="Kantor Pusat">
                            Kantor Pusat
                        </option>

                        <option value="Unit Pelayanan">
                            Unit Pelayanan
                        </option>

                        <option value="IPA Gunung Lipan">
                            IPA Gunung Lipan
                        </option>

                        <option value="IPA Sungai Kapih">
                            IPA Sungai Kapih
                        </option>

                        <option value="Gudang Pusat">
                            Gudang Pusat
                        </option>

                        <option value="Ruang Arsip">
                            Ruang Arsip
                        </option>

                        <option value="Laboratorium">
                            Laboratorium
                        </option>

                    </select>

                </div>


                {{-- KONDISI --}}
                <div class="aset-ttp-select-field">

                    <select id="asetTtpKondisi" aria-label="Filter kondisi">

                        <option value="">
                            Semua Kondisi
                        </option>

                        <option value="Baik">
                            Baik
                        </option>

                        <option value="Cukup">
                            Cukup
                        </option>

                        <option value="Rusak">
                            Rusak
                        </option>

                    </select>

                </div>

            </div>



            {{-- FILTER ACTION --}}
            <div class="aset-ttp-filter-actions">

                <div>

                    <button type="button" class="aset-ttp-secondary-button" onclick="filterAsetTtpTable()">

                        <i data-lucide="list-filter"></i>

                        Filter Lainnya

                    </button>

                </div>


                <div>

                    <button type="button" class="aset-ttp-secondary-button" onclick="resetAsetTtpFilter()">

                        <i data-lucide="refresh-cw"></i>

                        Reset

                    </button>


                    <button type="button" class="aset-ttp-secondary-button aset-ttp-export-button"
                        onclick="exportAsetTtpCSV()">

                        <i data-lucide="download"></i>

                        Export

                    </button>

                </div>

            </div>



            {{-- =====================================================
             TABLE
        ====================================================== --}}

            <div class="aset-ttp-table-scroll" tabindex="0" aria-label="Daftar aset tetap lainnya">

                <table class="aset-ttp-table" id="asetTtpTable">

                    <thead>

                        <tr>

                            <th>
                                <input type="checkbox" id="asetTtpSelectAll" aria-label="Pilih semua aset">
                            </th>

                            <th>
                                No
                            </th>

                            <th>
                                Kode Aset
                            </th>

                            <th>
                                Foto
                            </th>

                            <th>
                                Nama Aset
                            </th>

                            <th>
                                Jenis Aset
                            </th>

                            <th>
                                Satuan / Jumlah
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Tahun
                            </th>

                            <th>
                                Nilai Perolehan
                            </th>

                            <th>
                                Nilai Buku
                            </th>

                            <th>
                                Kondisi
                            </th>

                            <th>
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>


                        {{-- DATA 1 --}}
                        <tr data-record data-jenis="Buku Perpustakaan" data-lokasi="Kantor Pusat" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>1</td>

                            <td class="aset-ttp-code">
                                05.01.01.001
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="book-open"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Koleksi Buku Perpustakaan
                            </td>

                            <td>
                                Buku Perpustakaan
                            </td>

                            <td>
                                420 Buku
                            </td>

                            <td>
                                Kantor Pusat
                            </td>

                            <td>
                                2022
                            </td>

                            <td>
                                Rp 185.000.000
                            </td>

                            <td>
                                Rp 142.500.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 2 --}}
                        <tr data-record data-jenis="Barang Bercorak Kesenian" data-lokasi="Kantor Pusat"
                            data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>2</td>

                            <td class="aset-ttp-code">
                                05.02.01.004
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="palette"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Koleksi Lukisan dan Dekorasi
                            </td>

                            <td>
                                Barang Bercorak Kesenian
                            </td>

                            <td>
                                18 Unit
                            </td>

                            <td>
                                Kantor Pusat
                            </td>

                            <td>
                                2021
                            </td>

                            <td>
                                Rp 320.000.000
                            </td>

                            <td>
                                Rp 246.000.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 3 --}}
                        <tr data-record data-jenis="Buku Perpustakaan" data-lokasi="Ruang Arsip" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>3</td>

                            <td class="aset-ttp-code">
                                05.01.02.008
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="library"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Buku Referensi Teknis
                            </td>

                            <td>
                                Buku Perpustakaan
                            </td>

                            <td>
                                175 Buku
                            </td>

                            <td>
                                Ruang Arsip
                            </td>

                            <td>
                                2023
                            </td>

                            <td>
                                Rp 95.000.000
                            </td>

                            <td>
                                Rp 82.500.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 4 --}}
                        <tr data-record data-jenis="Tanaman" data-lokasi="IPA Gunung Lipan" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>4</td>

                            <td class="aset-ttp-code">
                                05.04.01.012
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="trees"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Tanaman Penghijauan Area Instalasi
                            </td>

                            <td>
                                Tanaman
                            </td>

                            <td>
                                85 Pohon
                            </td>

                            <td>
                                IPA Gunung Lipan
                            </td>

                            <td>
                                2022
                            </td>

                            <td>
                                Rp 145.000.000
                            </td>

                            <td>
                                Rp 108.000.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 5 --}}
                        <tr data-record data-jenis="Aset Tetap Lainnya" data-lokasi="Unit Pelayanan"
                            data-kondisi="Cukup">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>5</td>

                            <td class="aset-ttp-code">
                                05.05.01.016
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="package"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Koleksi Peralatan Dokumentasi
                            </td>

                            <td>
                                Aset Tetap Lainnya
                            </td>

                            <td>
                                12 Unit
                            </td>

                            <td>
                                Unit Pelayanan
                            </td>

                            <td>
                                2021
                            </td>

                            <td>
                                Rp 210.000.000
                            </td>

                            <td>
                                Rp 137.500.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-fair">
                                    Cukup
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 6 --}}
                        <tr data-record data-jenis="Barang Bercorak Kesenian" data-lokasi="IPA Sungai Kapih"
                            data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>6</td>

                            <td class="aset-ttp-code">
                                05.02.02.019
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="landmark"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Ornamen dan Elemen Dekoratif
                            </td>

                            <td>
                                Barang Bercorak Kesenian
                            </td>

                            <td>
                                9 Unit
                            </td>

                            <td>
                                IPA Sungai Kapih
                            </td>

                            <td>
                                2020
                            </td>

                            <td>
                                Rp 175.000.000
                            </td>

                            <td>
                                Rp 110.000.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 7 --}}
                        <tr data-record data-jenis="Buku Perpustakaan" data-lokasi="Laboratorium" data-kondisi="Cukup">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>7</td>

                            <td class="aset-ttp-code">
                                05.01.03.024
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="book-copy"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Buku Manual dan Standar Operasional
                            </td>

                            <td>
                                Buku Perpustakaan
                            </td>

                            <td>
                                280 Buku
                            </td>

                            <td>
                                Laboratorium
                            </td>

                            <td>
                                2020
                            </td>

                            <td>
                                Rp 120.000.000
                            </td>

                            <td>
                                Rp 74.500.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-fair">
                                    Cukup
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 8 --}}
                        <tr data-record data-jenis="Aset Tetap Lainnya" data-lokasi="Gudang Pusat" data-kondisi="Rusak">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>8</td>

                            <td class="aset-ttp-code">
                                05.05.02.027
                            </td>

                            <td>
                                <div class="aset-ttp-thumb">
                                    <i data-lucide="boxes"></i>
                                </div>
                            </td>

                            <td class="aset-ttp-name">
                                Koleksi Barang Inventaris Khusus
                            </td>

                            <td>
                                Aset Tetap Lainnya
                            </td>

                            <td>
                                7 Unit
                            </td>

                            <td>
                                Gudang Pusat
                            </td>

                            <td>
                                2019
                            </td>

                            <td>
                                Rp 88.000.000
                            </td>

                            <td>
                                Rp 22.500.000
                            </td>

                            <td>
                                <span class="aset-ttp-status is-bad">
                                    Rusak
                                </span>
                            </td>

                            <td>

                                <div class="aset-ttp-actions">

                                    <button type="button" class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- EMPTY --}}
                        <tr id="asetTtpEmptyRow" hidden>

                            <td colspan="13" class="aset-ttp-empty">
                                Tidak ada data yang sesuai dengan filter.
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>



            {{-- =====================================================
             TABLE FOOTER
        ====================================================== --}}

            <div class="aset-ttp-table-footer">

                <div class="aset-ttp-table-info" id="asetTtpTableInfo" role="status" aria-live="polite">
                    Menampilkan 1 - 8 dari 128 data
                </div>


                <div class="aset-ttp-pagination-area">

                    <select id="asetTtpPageSize" aria-label="Jumlah data per halaman">

                        <option value="10">
                            10
                        </option>

                        <option value="25">
                            25
                        </option>

                        <option value="50">
                            50
                        </option>

                    </select>

                    <span>
                        data per halaman
                    </span>


                    <nav class="aset-ttp-pagination" id="asetTtpPagination" aria-label="Pagination">
                    </nav>

                </div>

            </div>

        </section>



        {{-- =====================================================
         MODAL
    ====================================================== --}}

        <dialog class="aset-ttp-modal" id="asetTtpModal">

            <div class="aset-ttp-modal-dialog">

                <div class="aset-ttp-modal-header">

                    <div>

                        <h3 id="asetTtpModalTitle">
                            Tambah Aset
                        </h3>

                        <p id="asetTtpModalDescription">
                            Tambahkan data aset tetap lainnya.
                        </p>

                    </div>


                    <button type="button" onclick="closeAsetTtpModal()" aria-label="Tutup dialog">

                        <i data-lucide="x"></i>

                    </button>

                </div>



                <form id="asetTtpForm">

                    <div class="aset-ttp-modal-body">

                        <p class="aset-ttp-modal-note" id="asetTtpModalNote">
                            Form UI contoh.
                            Penyimpanan database belum dihubungkan.
                        </p>


                        {{-- KODE --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpCode">
                                Kode Aset
                            </label>

                            <input id="asetTtpCode" name="kode" type="text" placeholder="05.01.01.001" required>

                        </div>


                        {{-- NAMA --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpName">
                                Nama Aset
                            </label>

                            <input id="asetTtpName" name="nama" type="text" placeholder="Masukkan nama aset"
                                required>

                        </div>


                        {{-- JENIS --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpFormJenis">
                                Jenis Aset
                            </label>

                            <select id="asetTtpFormJenis" name="jenis" required>

                                <option value="Buku Perpustakaan">
                                    Buku Perpustakaan
                                </option>

                                <option value="Barang Bercorak Kesenian">
                                    Barang Bercorak Kesenian
                                </option>

                                <option value="Hewan Ternak">
                                    Hewan Ternak
                                </option>

                                <option value="Tanaman">
                                    Tanaman
                                </option>

                                <option value="Aset Tetap Lainnya">
                                    Aset Tetap Lainnya
                                </option>

                            </select>

                        </div>


                        {{-- JUMLAH --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpJumlah">
                                Satuan / Jumlah
                            </label>

                            <input id="asetTtpJumlah" name="jumlah" type="text" placeholder="Contoh: 100 Buku"
                                required>

                        </div>


                        {{-- LOKASI --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpFormLokasi">
                                Lokasi
                            </label>

                            <input id="asetTtpFormLokasi" name="lokasi" type="text"
                                placeholder="Masukkan lokasi aset" required>

                        </div>


                        {{-- TAHUN --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpTahun">
                                Tahun Perolehan
                            </label>

                            <input id="asetTtpTahun" name="tahun" type="text" placeholder="2024" required>

                        </div>


                        {{-- NILAI PEROLEHAN --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpPerolehan">
                                Nilai Perolehan
                            </label>

                            <input id="asetTtpPerolehan" name="perolehan" type="text" placeholder="Rp 0" required>

                        </div>


                        {{-- NILAI BUKU --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpBuku">
                                Nilai Buku
                            </label>

                            <input id="asetTtpBuku" name="buku" type="text" placeholder="Rp 0" required>

                        </div>


                        {{-- KONDISI --}}
                        <div class="aset-ttp-form-group">

                            <label for="asetTtpFormKondisi">
                                Kondisi
                            </label>

                            <select id="asetTtpFormKondisi" name="kondisi" required>

                                <option value="Baik">
                                    Baik
                                </option>

                                <option value="Cukup">
                                    Cukup
                                </option>

                                <option value="Rusak">
                                    Rusak
                                </option>

                            </select>

                        </div>

                    </div>



                    <div class="aset-ttp-modal-footer">

                        <button type="button" class="aset-ttp-cancel-button" onclick="closeAsetTtpModal()">
                            Batal
                        </button>


                        <button type="submit" class="aset-ttp-save-button" id="asetTtpSaveButton">
                            Simpan Aset
                        </button>

                    </div>

                </form>

            </div>

        </dialog>

    </section>


    @push('scripts')
        <script src="{{ asset('js/pages/aset_ttp.js') }}"></script>
    @endpush

@endsection
