@extends('layouts.main')

@section('title', 'Nilai Aset')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/nilai.css') }}">
@endpush


@section('content')

    <section class="content nilai-page">


        {{-- ============================================================
         PAGE HEADER
    ============================================================= --}}
        <div class="nilai-page-header">


            <div class="nilai-heading">

                <span class="nilai-eyebrow">
                    Manajemen Aset
                </span>

                <h1>
                    Nilai Aset
                </h1>

                <p>
                    Kelola penilaian aset, transaksi voucher, kategori,
                    lokasi, serta riwayat nilai aset perusahaan dengan
                    data yang akurat dan terintegrasi.
                </p>

            </div>



            <div class="nilai-header-actions">


                {{-- DATE --}}
                <div class="nilai-date-card">

                    <div class="nilai-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>

                        <strong id="nilaiCurrentDate">
                            Kamis, 24 September 2026
                        </strong>

                        <span id="nilaiCurrentTime">
                            12:24 WIB
                        </span>

                    </div>

                </div>



                {{-- ADD --}}
                <button type="button" class="nilai-add-button">

                    <i data-lucide="plus"></i>

                    <span>
                        Tambah Nilai Aset
                    </span>

                </button>


            </div>


        </div>



        {{-- ============================================================
         KPI
    ============================================================= --}}
        <div class="nilai-kpi-grid">


            {{-- TOTAL NILAI --}}
            <div class="nilai-kpi-card">

                <div class="nilai-kpi-icon blue">
                    <i data-lucide="database"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Total Nilai Aset
                    </span>

                    <strong>
                        Rp 928,7 M
                    </strong>

                    <small class="positive">

                        <i data-lucide="arrow-up"></i>

                        +5,2% dari tahun lalu

                    </small>

                </div>


                <div class="nilai-sparkline blue">

                    <svg viewBox="0 0 100 45">

                        <polyline points="2,38 18,21 33,27 50,13 65,20 82,7 98,3" />

                    </svg>

                </div>

            </div>



            {{-- PENAMBAHAN --}}
            <div class="nilai-kpi-card">

                <div class="nilai-kpi-icon green">
                    <i data-lucide="chart-no-axes-column-increasing"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Penambahan Tahun Ini
                    </span>

                    <strong>
                        Rp 53,7 M
                    </strong>

                    <small class="positive">

                        <i data-lucide="arrow-up"></i>

                        +6,1% dari tahun lalu

                    </small>

                </div>


                <div class="nilai-sparkline green">

                    <svg viewBox="0 0 100 45">

                        <polyline points="2,40 15,30 26,33 41,16 54,23 72,12 85,14 98,2" />

                    </svg>

                </div>

            </div>



            {{-- TRANSAKSI --}}
            <div class="nilai-kpi-card">

                <div class="nilai-kpi-icon purple">
                    <i data-lucide="file-text"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Total Transaksi
                    </span>

                    <strong>
                        1.284
                    </strong>

                    <small>
                        Voucher nilai aset
                    </small>

                </div>


                <div class="nilai-sparkline purple">

                    <svg viewBox="0 0 100 45">

                        <polyline points="2,36 15,27 26,31 39,20 52,24 67,13 81,18 98,4" />

                    </svg>

                </div>

            </div>



            {{-- TAHUN --}}
            <div class="nilai-kpi-card">

                <div class="nilai-kpi-icon orange">
                    <i data-lucide="calendar-days"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Tahun Aktif
                    </span>

                    <strong>
                        2026
                    </strong>

                    <small>
                        Periode penilaian aset
                    </small>

                </div>

            </div>


        </div>



        {{-- ============================================================
         CHART
    ============================================================= --}}
        <div class="nilai-chart-grid">


            {{-- TREND --}}
            <div class="nilai-card nilai-trend-card">


                <div class="nilai-card-header">

                    <div>

                        <h3>
                            Tren Nilai Aset 5 Tahun Terakhir
                        </h3>

                        <p>
                            Dalam Miliar Rupiah (Rp)
                        </p>

                    </div>


                    <select class="nilai-period-select">

                        <option>
                            5 Tahun Terakhir
                        </option>

                        <option>
                            3 Tahun Terakhir
                        </option>

                    </select>

                </div>


                <div class="nilai-chart-body">

                    <canvas id="nilaiTrendChart"></canvas>

                </div>


            </div>



            {{-- CATEGORY DISTRIBUTION --}}
            <div class="nilai-card">


                <div class="nilai-card-header">

                    <div>

                        <h3>
                            Distribusi Nilai Aset per Kategori
                        </h3>

                        <p>
                            Proporsi nilai berdasarkan kelompok aset
                        </p>

                    </div>

                </div>



                <div class="nilai-distribution-body">


                    <div class="nilai-donut-wrap">

                        <canvas id="nilaiCategoryChart"></canvas>


                        <div class="nilai-donut-center">

                            <strong>
                                928,7 M
                            </strong>

                            <span>
                                Total Nilai
                            </span>

                        </div>

                    </div>



                    <div class="nilai-category-legend">


                        <div>

                            <span class="nilai-dot tanah"></span>

                            <p>
                                Tanah
                            </p>

                            <strong>
                                245,6 M
                            </strong>

                            <small>
                                26,5%
                            </small>

                        </div>


                        <div>

                            <span class="nilai-dot mesin"></span>

                            <p>
                                Peralatan & Mesin
                            </p>

                            <strong>
                                280,4 M
                            </strong>

                            <small>
                                30,2%
                            </small>

                        </div>


                        <div>

                            <span class="nilai-dot gedung"></span>

                            <p>
                                Gedung & Bangunan
                            </p>

                            <strong>
                                210,8 M
                            </strong>

                            <small>
                                22,7%
                            </small>

                        </div>


                        <div>

                            <span class="nilai-dot jalan"></span>

                            <p>
                                Jalan & Jaringan
                            </p>

                            <strong>
                                98,3 M
                            </strong>

                            <small>
                                10,6%
                            </small>

                        </div>


                        <div>

                            <span class="nilai-dot lainnya"></span>

                            <p>
                                Aset Tetap Lainnya
                            </p>

                            <strong>
                                63,1 M
                            </strong>

                            <small>
                                6,8%
                            </small>

                        </div>


                        <div>

                            <span class="nilai-dot konstruksi"></span>

                            <p>
                                Konstruksi
                            </p>

                            <strong>
                                30,5 M
                            </strong>

                            <small>
                                3,3%
                            </small>

                        </div>


                    </div>


                </div>


            </div>


        </div>



        {{-- ============================================================
         FILTER
    ============================================================= --}}
        <div class="nilai-card nilai-filter-card">


            <div class="nilai-filter-title">

                <h3>
                    Filter Data Nilai Aset
                </h3>

            </div>


            <div class="nilai-filter-grid">


                {{-- SEARCH --}}
                <div class="nilai-filter-group nilai-search-group">

                    <label>
                        Pencarian
                    </label>


                    <div class="nilai-search-input">

                        <i data-lucide="search"></i>

                        <input type="text" id="nilaiSearch" placeholder="Cari voucher, aktiva, uraian, lokasi...">

                    </div>

                </div>



                {{-- YEAR --}}
                <div class="nilai-filter-group">

                    <label>
                        Tahun
                    </label>

                    <select id="nilaiYear">

                        <option value="">
                            Semua Tahun
                        </option>

                        <option value="2026">
                            2026
                        </option>

                        <option value="2025">
                            2025
                        </option>

                        <option value="2024">
                            2024
                        </option>

                    </select>

                </div>



                {{-- LOCATION --}}
                <div class="nilai-filter-group">

                    <label>
                        Lokasi
                    </label>

                    <select id="nilaiLocation">

                        <option value="">
                            Semua Lokasi
                        </option>

                        <option>
                            IPA Kota
                        </option>

                        <option>
                            Kantor Pusat
                        </option>

                        <option>
                            Jl. Melati
                        </option>

                        <option>
                            Zona Timur
                        </option>

                    </select>

                </div>



                {{-- CATEGORY --}}
                <div class="nilai-filter-group">

                    <label>
                        Kategori
                    </label>

                    <select id="nilaiCategory">

                        <option value="">
                            Semua Kategori
                        </option>

                        <option>
                            Tanah
                        </option>

                        <option>
                            Peralatan & Mesin
                        </option>

                        <option>
                            Gedung & Bangunan
                        </option>

                        <option>
                            Jalan & Jaringan
                        </option>

                    </select>

                </div>



                {{-- BUTTON --}}
                <div class="nilai-filter-actions">


                    <button type="button" class="nilai-filter-button">

                        <i data-lucide="list-filter"></i>

                        Filter

                    </button>



                    <button type="button" class="nilai-reset-button" onclick="resetNilaiFilter()">

                        <i data-lucide="refresh-cw"></i>

                        Reset

                    </button>


                </div>


            </div>


        </div>



        {{-- ============================================================
         TABLE
    ============================================================= --}}
        <div class="nilai-card nilai-table-card">


            <div class="nilai-table-header">


                <div>

                    <h3>
                        Daftar Nilai Aset
                    </h3>

                </div>


                <button type="button" class="nilai-export-button">

                    <i data-lucide="download"></i>

                    <span>
                        Ekspor
                    </span>

                    <i data-lucide="chevron-down"></i>

                </button>


            </div>



            <div class="table-responsive">

                <table class="nilai-table" id="nilaiTable">


                    <thead>

                        <tr>

                            <th>
                                No
                            </th>

                            <th>
                                Voucher
                            </th>

                            <th>
                                Tanggal
                            </th>

                            <th>
                                Aktiva
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Uraian
                            </th>

                            <th class="nilai-column">
                                Nilai (Rp)
                            </th>

                            <th class="status-column">
                                Status
                            </th>

                            <th class="action-column">
                                Aksi
                            </th>

                        </tr>

                    </thead>



                    <tbody>


                        <tr>

                            <td>1</td>

                            <td>
                                VAL-2026-001
                            </td>

                            <td>
                                04 Jan 2026
                            </td>

                            <td>
                                Pompa Distribusi
                            </td>

                            <td>
                                IPA Kota
                            </td>

                            <td>
                                Penambahan pompa distribusi 250 m³/jam
                            </td>

                            <td class="nilai-column">
                                1.250.000.000
                            </td>

                            <td>

                                <span class="nilai-status selesai">
                                    Selesai
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button type="button" class="view" title="Detail">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" title="Edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" title="Hapus">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr>

                            <td>2</td>

                            <td>
                                VAL-2026-002
                            </td>

                            <td>
                                12 Jan 2026
                            </td>

                            <td>
                                Tanah
                            </td>

                            <td>
                                Jl. Melati
                            </td>

                            <td>
                                Penilaian tanah untuk perluasan IPA
                            </td>

                            <td class="nilai-column">
                                4.750.000.000
                            </td>

                            <td>

                                <span class="nilai-status verifikasi">
                                    Verifikasi
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr>

                            <td>3</td>

                            <td>
                                VAL-2026-003
                            </td>

                            <td>
                                18 Feb 2026
                            </td>

                            <td>
                                Kendaraan Operasional
                            </td>

                            <td>
                                Divisi Produksi
                            </td>

                            <td>
                                Pengadaan mobil operasional pick up
                            </td>

                            <td class="nilai-column">
                                325.000.000
                            </td>

                            <td>

                                <span class="nilai-status aktif">
                                    Aktif
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr>

                            <td>4</td>

                            <td>
                                VAL-2026-004
                            </td>

                            <td>
                                10 Mar 2026
                            </td>

                            <td>
                                Gedung Kantor
                            </td>

                            <td>
                                Kantor Pusat
                            </td>

                            <td>
                                Penilaian gedung kantor utama
                            </td>

                            <td class="nilai-column">
                                12.500.000.000
                            </td>

                            <td>

                                <span class="nilai-status selesai">
                                    Selesai
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr>

                            <td>5</td>

                            <td>
                                VAL-2026-005
                            </td>

                            <td>
                                22 Mar 2026
                            </td>

                            <td>
                                Generator Set
                            </td>

                            <td>
                                IPA Kota
                            </td>

                            <td>
                                Pengadaan genset 500 KVA
                            </td>

                            <td class="nilai-column">
                                2.350.000.000
                            </td>

                            <td>

                                <span class="nilai-status draft">
                                    Draft
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr>

                            <td>6</td>

                            <td>
                                VAL-2026-006
                            </td>

                            <td>
                                05 Apr 2026
                            </td>

                            <td>
                                Pipa Jaringan
                            </td>

                            <td>
                                Zona Timur
                            </td>

                            <td>
                                Penambahan jaringan pipa HDPE
                            </td>

                            <td class="nilai-column">
                                3.125.000.000
                            </td>

                            <td>

                                <span class="nilai-status aktif">
                                    Aktif
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr>

                            <td>7</td>

                            <td>
                                VAL-2026-007
                            </td>

                            <td>
                                18 Apr 2026
                            </td>

                            <td>
                                Peralatan Laboratorium
                            </td>

                            <td>
                                Lab Kualitas Air
                            </td>

                            <td>
                                Pengadaan alat uji kualitas air
                            </td>

                            <td class="nilai-column">
                                680.000.000
                            </td>

                            <td>

                                <span class="nilai-status verifikasi">
                                    Verifikasi
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr>

                            <td>8</td>

                            <td>
                                VAL-2026-008
                            </td>

                            <td>
                                02 Mei 2026
                            </td>

                            <td>
                                Bangunan IPA
                            </td>

                            <td>
                                IPA Kota
                            </td>

                            <td>
                                Penilaian bangunan IPA kapasitas 500 l/det
                            </td>

                            <td class="nilai-column">
                                18.200.000.000
                            </td>

                            <td>

                                <span class="nilai-status aktif">
                                    Aktif
                                </span>

                            </td>

                            <td>

                                <div class="nilai-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                    </tbody>


                </table>

            </div>



            {{-- ========================================================
             TABLE FOOTER
        ========================================================= --}}
            <div class="nilai-table-footer">


                <div class="nilai-table-info">

                    Menampilkan

                    <strong>
                        1 - 8
                    </strong>

                    dari

                    <strong>
                        1.284
                    </strong>

                    data

                </div>



                <div class="nilai-pagination-area">


                    <select>

                        <option>
                            10 per halaman
                        </option>

                        <option>
                            25 per halaman
                        </option>

                        <option>
                            50 per halaman
                        </option>

                    </select>



                    <div class="nilai-pagination">


                        <button disabled>
                            <i data-lucide="chevron-left"></i>
                        </button>


                        <button class="active">
                            1
                        </button>


                        <button>
                            2
                        </button>


                        <button>
                            3
                        </button>


                        <button>
                            4
                        </button>


                        <button>
                            5
                        </button>


                        <span>
                            ...
                        </span>


                        <button>
                            161
                        </button>


                        <button>
                            <i data-lucide="chevron-right"></i>
                        </button>


                    </div>


                </div>


            </div>


        </div>


    </section>

@endsection



@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="{{ asset('js/pages/nilai.js') }}"></script>
@endpush
