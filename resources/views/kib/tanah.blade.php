@extends('layouts.main')

@section('title', 'Tanah')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/tanah.css') }}">
@endpush

@section('content')

    {{-- ============================================================
        K.I.B - TANAH
        Data di bawah masih berupa data contoh untuk kebutuhan UI.
        CRUD/database akan dihubungkan pada tahap backend.
    ============================================================= --}}

    <section class="content tanah-page">

        {{-- ============================================================
            HERO + KPI
        ============================================================= --}}
        <section class="tanah-hero">

            <div class="tanah-hero-overlay"></div>

            <div class="tanah-hero-content">

                {{-- BREADCRUMB --}}
                <nav class="tanah-breadcrumb" aria-label="Breadcrumb">

                    <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                        <i data-lucide="house" aria-hidden="true"></i>
                    </a>

                    <i data-lucide="chevron-right" aria-hidden="true"></i>

                    <span>Master Data</span>

                    <i data-lucide="chevron-right" aria-hidden="true"></i>

                    <span>K.I.B</span>

                    <i data-lucide="chevron-right" aria-hidden="true"></i>

                    <strong aria-current="page">Tanah</strong>

                </nav>


                {{-- TITLE --}}
                <div class="tanah-heading">

                    <h1>Tanah</h1>

                    <p>
                        Kelola data aset tanah perusahaan secara terstruktur
                        untuk kebutuhan inventaris, legalitas, dan nilai aset.
                    </p>

                </div>


                {{-- ====================================================
                    KPI
                ===================================================== --}}
                <div class="tanah-kpi-grid">

                    {{-- TOTAL ASET --}}
                    <article class="tanah-kpi-card">

                        <div class="tanah-kpi-icon">
                            <i data-lucide="map-pinned" aria-hidden="true"></i>
                        </div>

                        <div class="tanah-kpi-content">

                            <span>Total Aset Tanah</span>

                            <strong>245</strong>

                            <p>Bidang tanah terdaftar</p>

                        </div>

                    </article>


                    {{-- TOTAL LUAS --}}
                    <article class="tanah-kpi-card">

                        <div class="tanah-kpi-icon">
                            <i data-lucide="map" aria-hidden="true"></i>
                        </div>

                        <div class="tanah-kpi-content">

                            <span>Total Luas</span>

                            <strong>1.248.560 m²</strong>

                            <p>Akumulasi luas seluruh tanah</p>

                        </div>

                    </article>


                    {{-- TOTAL NILAI --}}
                    <article class="tanah-kpi-card">

                        <div class="tanah-kpi-icon">
                            <i data-lucide="coins" aria-hidden="true"></i>
                        </div>

                        <div class="tanah-kpi-content">

                            <span>Total Nilai</span>

                            <strong>Rp 245,6 M</strong>

                            <p>Nilai perolehan aset</p>

                        </div>

                    </article>


                    {{-- UPDATE TERAKHIR --}}
                    <article class="tanah-kpi-card">

                        <div class="tanah-kpi-icon">
                            <i data-lucide="clock-3" aria-hidden="true"></i>
                        </div>

                        <div class="tanah-kpi-content">

                            <span>Update Terakhir</span>

                            <strong class="tanah-kpi-text">
                                Hari Ini
                            </strong>

                            <small id="tanahCurrentDate">
                                -
                            </small>

                        </div>

                    </article>

                </div>

            </div>

        </section>


        {{-- ============================================================
            FILTER DATA
        ============================================================= --}}
        <section class="tanah-card tanah-filter-card" aria-labelledby="tanahFilterTitle">

            <div class="tanah-filter-header">

                <h2 id="tanahFilterTitle">
                    Filter Data Tanah
                </h2>


                <div class="tanah-filter-actions">

                    {{-- TAMBAH --}}
                    <button type="button" class="tanah-add-button" onclick="openTanahModal('add')">

                        <i data-lucide="plus" aria-hidden="true"></i>

                        <span>
                            Tambah Tanah
                        </span>

                    </button>


                    {{-- EXPORT --}}
                    <button type="button" class="tanah-export-button" onclick="exportTanahCSV()">

                        <i data-lucide="download" aria-hidden="true"></i>

                        <span>
                            Ekspor
                        </span>

                        <i data-lucide="chevron-down" aria-hidden="true"></i>

                    </button>

                </div>

            </div>


            <div class="tanah-filter-grid">

                {{-- SEARCH --}}
                <div class="tanah-search">

                    <i data-lucide="search" aria-hidden="true"></i>

                    <input id="tanahSearch" type="search" placeholder="Cari kode, lokasi, atau letak tanah..."
                        aria-label="Cari kode, lokasi, atau letak tanah">

                </div>


                {{-- LOKASI --}}
                <div class="tanah-select-group">

                    <label for="tanahLokasi">
                        Lokasi
                    </label>

                    <select id="tanahLokasi">

                        <option value="">
                            Semua Lokasi
                        </option>

                        <option value="IPA Gunung Lipan">
                            IPA Gunung Lipan
                        </option>

                        <option value="Reservoir Lempake">
                            Reservoir Lempake
                        </option>

                        <option value="Kantor Pusat">
                            Kantor Pusat
                        </option>

                        <option value="IPA Sungai Kapih">
                            IPA Sungai Kapih
                        </option>

                        <option value="Gudang Material">
                            Gudang Material
                        </option>

                        <option value="Kantor Wilayah Sambutan">
                            Kantor Wilayah Sambutan
                        </option>

                        <option value="Booster Palaran">
                            Booster Palaran
                        </option>

                        <option value="Intake Produksi">
                            Intake Produksi
                        </option>

                    </select>

                </div>


                {{-- HAK --}}
                <div class="tanah-select-group">

                    <label for="tanahHak">
                        Hak
                    </label>

                    <select id="tanahHak">

                        <option value="">
                            Semua Hak
                        </option>

                        <option value="Hak Pakai">
                            Hak Pakai
                        </option>

                        <option value="Hak Milik">
                            Hak Milik
                        </option>

                        <option value="Hak Guna Bangunan">
                            Hak Guna Bangunan
                        </option>

                    </select>

                </div>


                {{-- TAHUN --}}
                <div class="tanah-select-group">

                    <label for="tanahTahun">
                        Tahun
                    </label>

                    <select id="tanahTahun">

                        <option value="">
                            Semua Tahun
                        </option>

                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                        <option value="2018">2018</option>
                        <option value="2017">2017</option>
                        <option value="2016">2016</option>
                        <option value="2015">2015</option>

                    </select>

                </div>


                {{-- FILTER --}}
                <button type="button" class="tanah-filter-button" onclick="filterTanahTable()">

                    <i data-lucide="list-filter" aria-hidden="true"></i>

                    <span>
                        Filter
                    </span>

                </button>


                {{-- RESET --}}
                <button type="button" class="tanah-reset-button" onclick="resetTanahFilter()">

                    <i data-lucide="refresh-cw" aria-hidden="true"></i>

                    <span>
                        Reset
                    </span>

                </button>

            </div>

        </section>


        {{-- ============================================================
            DAFTAR TANAH
        ============================================================= --}}
        <section class="tanah-card tanah-table-card" id="tanahList" aria-labelledby="tanahListTitle">

            <div class="tanah-table-header">

                <h2 id="tanahListTitle">
                    Daftar Tanah
                </h2>

                <span class="tanah-demo-badge" title="Data pada halaman ini masih berupa contoh tampilan.">
                    Data contoh
                </span>

            </div>


            <div class="table-responsive tanah-table-scroll" tabindex="0"
                aria-label="Daftar tanah, geser untuk melihat kolom lainnya">

                <table class="tanah-table" id="tanahTable">

                    <thead>

                        <tr>

                            <th scope="col" class="tanah-col-no">
                                No
                            </th>

                            <th scope="col">
                                Kode Tanah
                            </th>

                            <th scope="col">
                                Lokasi
                            </th>

                            <th scope="col">
                                Penggunaan / Letak
                            </th>

                            <th scope="col" class="tanah-col-number">
                                Luas
                            </th>

                            <th scope="col">
                                Hak
                            </th>

                            <th scope="col" class="tanah-col-year">
                                Tahun
                            </th>

                            <th scope="col" class="tanah-col-number">
                                Nilai
                            </th>

                            <th scope="col" class="tanah-col-status">
                                Status
                            </th>

                            <th scope="col" class="tanah-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {{-- =================================================
                            DATA 1
                        ================================================== --}}
                        <tr data-record data-lokasi="IPA Gunung Lipan" data-hak="Hak Pakai" data-tahun="2018">

                            <td>1</td>

                            <td class="tanah-code">
                                TNH-001
                            </td>

                            <td>
                                IPA Gunung Lipan
                            </td>

                            <td>
                                Lahan Instalasi Produksi
                            </td>

                            <td class="tanah-number">
                                12.500 m²
                            </td>

                            <td>
                                Hak Pakai
                            </td>

                            <td class="tanah-year">
                                2018
                            </td>

                            <td class="tanah-number">
                                Rp 12.500.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-001">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-001">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-001">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- DATA 2 --}}
                        <tr data-record data-lokasi="Reservoir Lempake" data-hak="Hak Milik" data-tahun="2017">

                            <td>2</td>

                            <td class="tanah-code">
                                TNH-002
                            </td>

                            <td>
                                Reservoir Lempake
                            </td>

                            <td>
                                Lahan Reservoir
                            </td>

                            <td class="tanah-number">
                                8.200 m²
                            </td>

                            <td>
                                Hak Milik
                            </td>

                            <td class="tanah-year">
                                2017
                            </td>

                            <td class="tanah-number">
                                Rp 8.900.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-002">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-002">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-002">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- DATA 3 --}}
                        <tr data-record data-lokasi="Kantor Pusat" data-hak="Hak Guna Bangunan" data-tahun="2016">

                            <td>3</td>

                            <td class="tanah-code">
                                TNH-003
                            </td>

                            <td>
                                Kantor Pusat
                            </td>

                            <td>
                                Area Kantor Administrasi
                            </td>

                            <td class="tanah-number">
                                4.500 m²
                            </td>

                            <td>
                                Hak Guna Bangunan
                            </td>

                            <td class="tanah-year">
                                2016
                            </td>

                            <td class="tanah-number">
                                Rp 15.200.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-003">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-003">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-003">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- DATA 4 --}}
                        <tr data-record data-lokasi="IPA Sungai Kapih" data-hak="Hak Pakai" data-tahun="2019">

                            <td>4</td>

                            <td class="tanah-code">
                                TNH-004
                            </td>

                            <td>
                                IPA Sungai Kapih
                            </td>

                            <td>
                                Lahan Bangunan IPA
                            </td>

                            <td class="tanah-number">
                                10.000 m²
                            </td>

                            <td>
                                Hak Pakai
                            </td>

                            <td class="tanah-year">
                                2019
                            </td>

                            <td class="tanah-number">
                                Rp 11.300.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-004">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-004">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-004">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- DATA 5 --}}
                        <tr data-record data-lokasi="Gudang Material" data-hak="Hak Milik" data-tahun="2015">

                            <td>5</td>

                            <td class="tanah-code">
                                TNH-005
                            </td>

                            <td>
                                Gudang Material
                            </td>

                            <td>
                                Area Gudang &amp; Workshop
                            </td>

                            <td class="tanah-number">
                                3.800 m²
                            </td>

                            <td>
                                Hak Milik
                            </td>

                            <td class="tanah-year">
                                2015
                            </td>

                            <td class="tanah-number">
                                Rp 4.700.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-review">
                                    Verifikasi
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-005">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-005">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-005">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- DATA 6 --}}
                        <tr data-record data-lokasi="Kantor Wilayah Sambutan" data-hak="Hak Guna Bangunan"
                            data-tahun="2020">

                            <td>6</td>

                            <td class="tanah-code">
                                TNH-006
                            </td>

                            <td>
                                Kantor Wilayah Sambutan
                            </td>

                            <td>
                                Lahan Kantor Pelayanan
                            </td>

                            <td class="tanah-number">
                                2.650 m²
                            </td>

                            <td>
                                Hak Guna Bangunan
                            </td>

                            <td class="tanah-year">
                                2020
                            </td>

                            <td class="tanah-number">
                                Rp 3.950.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-006">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-006">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-006">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- DATA 7 --}}
                        <tr data-record data-lokasi="Booster Palaran" data-hak="Hak Pakai" data-tahun="2021">

                            <td>7</td>

                            <td class="tanah-code">
                                TNH-007
                            </td>

                            <td>
                                Booster Palaran
                            </td>

                            <td>
                                Area Operasional Distribusi
                            </td>

                            <td class="tanah-number">
                                1.900 m²
                            </td>

                            <td>
                                Hak Pakai
                            </td>

                            <td class="tanah-year">
                                2021
                            </td>

                            <td class="tanah-number">
                                Rp 2.600.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-draft">
                                    Draft
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-007">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-007">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-007">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- DATA 8 --}}
                        <tr data-record data-lokasi="Intake Produksi" data-hak="Hak Milik" data-tahun="2018">

                            <td>8</td>

                            <td class="tanah-code">
                                TNH-008
                            </td>

                            <td>
                                Intake Produksi
                            </td>

                            <td>
                                Area Intake &amp; Pompa
                            </td>

                            <td class="tanah-number">
                                6.400 m²
                            </td>

                            <td>
                                Hak Milik
                            </td>

                            <td class="tanah-year">
                                2018
                            </td>

                            <td class="tanah-number">
                                Rp 7.850.000.000
                            </td>

                            <td>
                                <span class="tanah-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>

                                <div class="tanah-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat TNH-008">
                                        <i data-lucide="eye" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit TNH-008">
                                        <i data-lucide="square-pen" aria-hidden="true"></i>
                                    </button>

                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus TNH-008">
                                        <i data-lucide="trash-2" aria-hidden="true"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                        {{-- EMPTY STATE --}}
                        <tr id="tanahEmptyRow" hidden>

                            <td colspan="10" class="tanah-empty">
                                Tidak ada data tanah yang sesuai dengan filter.
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


            {{-- TABLE FOOTER --}}
            <div class="tanah-table-footer">

                <div class="tanah-table-info" id="tanahTableInfo" role="status" aria-live="polite">
                    Menampilkan 1–8 dari 245 data
                </div>


                <div class="tanah-pagination-area">

                    <select id="tanahPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>

                    <span>
                        data per halaman
                    </span>

                    <nav class="tanah-pagination" id="tanahPagination" aria-label="Halaman daftar tanah"></nav>

                </div>

            </div>

        </section>


        {{-- ============================================================
            DISTRIBUSI + DATA TERBARU
        ============================================================= --}}
        <div class="tanah-bottom-grid">

            {{-- DISTRIBUSI HAK --}}
            <section class="tanah-card tanah-bottom-card tanah-distribution-card"
                aria-labelledby="tanahDistributionTitle">

                <div class="tanah-bottom-header">

                    <h2 id="tanahDistributionTitle">
                        Distribusi Hak Tanah
                    </h2>

                </div>


                <div class="tanah-distribution-content">

                    <div class="tanah-chart-wrap">

                        <canvas id="tanahDistributionChart" role="img" aria-label="Distribusi hak tanah"></canvas>

                        <div class="tanah-chart-center">

                            <strong>
                                245
                            </strong>

                            <span>
                                Aset Tanah
                            </span>

                        </div>

                    </div>


                    <div class="tanah-legend" id="tanahLegend">

                        <div data-label="Hak Pakai" data-count="118" data-color="#0b6ff1">

                            <span class="tanah-dot c1"></span>

                            <p>
                                Hak Pakai
                            </p>

                            <strong>
                                118
                            </strong>

                            <small>
                                48%
                            </small>

                        </div>


                        <div data-label="Hak Milik" data-count="78" data-color="#26a7e8">

                            <span class="tanah-dot c2"></span>

                            <p>
                                Hak Milik
                            </p>

                            <strong>
                                78
                            </strong>

                            <small>
                                32%
                            </small>

                        </div>


                        <div data-label="Hak Guna Bangunan" data-count="49" data-color="#2eb85c">

                            <span class="tanah-dot c3"></span>

                            <p>
                                Hak Guna Bangunan
                            </p>

                            <strong>
                                49
                            </strong>

                            <small>
                                20%
                            </small>

                        </div>

                    </div>

                </div>

            </section>


            {{-- TANAH TERBARU --}}
            <section class="tanah-card tanah-bottom-card tanah-latest-card" aria-labelledby="tanahLatestTitle">

                <div class="tanah-bottom-header">

                    <h2 id="tanahLatestTitle">
                        Tanah Terbaru
                    </h2>

                    <a href="#tanahList" id="tanahViewAll">
                        Lihat Semua
                    </a>

                </div>


                <div class="table-responsive tanah-latest-scroll" tabindex="0" aria-label="Tanah terbaru">

                    <table class="tanah-latest-table">

                        <thead>

                            <tr>

                                <th scope="col">
                                    No
                                </th>

                                <th scope="col">
                                    Kode Tanah
                                </th>

                                <th scope="col">
                                    Lokasi
                                </th>

                                <th scope="col">
                                    Tanggal
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            <tr>
                                <td>1</td>
                                <td>TNH-008</td>
                                <td>Intake Produksi</td>
                                <td>12 Mar 2024</td>
                            </tr>

                            <tr>
                                <td>2</td>
                                <td>TNH-007</td>
                                <td>Booster Palaran</td>
                                <td>28 Feb 2024</td>
                            </tr>

                            <tr>
                                <td>3</td>
                                <td>TNH-006</td>
                                <td>Kantor Wilayah Sambutan</td>
                                <td>15 Jan 2024</td>
                            </tr>

                            <tr>
                                <td>4</td>
                                <td>TNH-005</td>
                                <td>Gudang Material</td>
                                <td>08 Jan 2024</td>
                            </tr>

                            <tr>
                                <td>5</td>
                                <td>TNH-004</td>
                                <td>IPA Sungai Kapih</td>
                                <td>20 Des 2023</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </section>

        </div>


        {{-- ============================================================
            MODAL TAMBAH / DETAIL / EDIT / HAPUS
        ============================================================= --}}
        <dialog class="tanah-modal" id="tanahModal" aria-labelledby="tanahModalTitle" aria-describedby="tanahModalNote">

            <div class="tanah-modal-dialog">

                {{-- MODAL HEADER --}}
                <div class="tanah-modal-header">

                    <div class="tanah-modal-title-wrap">

                        <h2 id="tanahModalTitle">
                            Tambah Tanah
                        </h2>

                        <p id="tanahModalDescription">
                            Tambahkan data aset tanah.
                        </p>

                    </div>


                    <button type="button" onclick="closeTanahModal()" aria-label="Tutup dialog">

                        <i data-lucide="x" aria-hidden="true"></i>

                    </button>

                </div>


                {{-- FORM --}}
                <form id="tanahForm">

                    <div class="tanah-modal-body">

                        {{-- NOTE --}}
                        <p class="tanah-modal-note" id="tanahModalNote">
                            Pratinjau formulir.
                            Penyimpanan ke database belum dihubungkan.
                        </p>


                        {{-- KODE --}}
                        <div class="tanah-form-group">

                            <label for="tanahCode">
                                Kode Tanah
                            </label>

                            <input id="tanahCode" name="kode" type="text" maxlength="50" placeholder="TNH-009"
                                required>

                        </div>


                        {{-- LOKASI --}}
                        <div class="tanah-form-group">

                            <label for="tanahFormLokasi">
                                Lokasi
                            </label>

                            <input id="tanahFormLokasi" name="lokasi" type="text" maxlength="150"
                                placeholder="Masukkan lokasi" required>

                        </div>


                        {{-- PENGGUNAAN --}}
                        <div class="tanah-form-group tanah-form-wide">

                            <label for="tanahPenggunaan">
                                Penggunaan / Letak
                            </label>

                            <input id="tanahPenggunaan" name="penggunaan" type="text" maxlength="200"
                                placeholder="Masukkan penggunaan atau letak tanah" required>

                        </div>


                        {{-- LUAS --}}
                        <div class="tanah-form-group">

                            <label for="tanahLuas">
                                Luas
                            </label>

                            <input id="tanahLuas" name="luas" type="text" maxlength="50"
                                placeholder="Contoh: 2.500 m²" required>

                        </div>


                        {{-- HAK --}}
                        <div class="tanah-form-group">

                            <label for="tanahFormHak">
                                Hak
                            </label>

                            <select id="tanahFormHak" name="hak" required>

                                <option value="">
                                    Pilih hak tanah
                                </option>

                                <option value="Hak Pakai">
                                    Hak Pakai
                                </option>

                                <option value="Hak Milik">
                                    Hak Milik
                                </option>

                                <option value="Hak Guna Bangunan">
                                    Hak Guna Bangunan
                                </option>

                            </select>

                        </div>


                        {{-- TAHUN --}}
                        <div class="tanah-form-group">

                            <label for="tanahFormTahun">
                                Tahun
                            </label>

                            <input id="tanahFormTahun" name="tahun" type="number" min="1900" max="2100"
                                placeholder="2024" required>

                        </div>


                        {{-- NILAI --}}
                        <div class="tanah-form-group">

                            <label for="tanahNilai">
                                Nilai
                            </label>

                            <input id="tanahNilai" name="nilai" type="text" maxlength="80" placeholder="Rp 0"
                                required>

                        </div>


                        {{-- STATUS --}}
                        <div class="tanah-form-group">

                            <label for="tanahStatus">
                                Status
                            </label>

                            <select id="tanahStatus" name="status" required>

                                <option value="Aktif">
                                    Aktif
                                </option>

                                <option value="Verifikasi">
                                    Verifikasi
                                </option>

                                <option value="Draft">
                                    Draft
                                </option>

                            </select>

                        </div>

                    </div>


                    {{-- MODAL FOOTER --}}
                    <div class="tanah-modal-footer">

                        <button type="button" class="tanah-cancel-button" onclick="closeTanahModal()">
                            Tutup
                        </button>


                        <button type="submit" class="tanah-save-button" id="tanahSaveButton" disabled
                            title="Aktifkan setelah endpoint CRUD Tanah dihubungkan.">
                            Simpan Tanah
                        </button>

                    </div>

                </form>

            </div>

        </dialog>

    </section>

@endsection


{{-- ============================================================
    JAVASCRIPT
============================================================ --}}
@push('scripts')
    {{-- Chart.js untuk diagram distribusi --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>

    {{-- JS khusus halaman Tanah --}}
    <script src="{{ asset('js/pages/tanah.js') }}"></script>
@endpush
