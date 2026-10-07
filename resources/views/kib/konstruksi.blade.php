@extends('layouts.main')

@section('title', 'Konstruksi Dalam Pengerjaan')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/kib/konstruksi.css') }}">
@endpush

@section('content')

    <section class="content kontruksi-page">

        {{-- =====================================================
         HERO
    ====================================================== --}}

        <section class="kontruksi-hero">

            <div class="kontruksi-hero-overlay"></div>

            <div class="kontruksi-hero-inner">

                {{-- BREADCRUMB --}}
                <nav class="kontruksi-breadcrumb" aria-label="Breadcrumb">

                    <a href="{{ route('dashboard') }}" aria-label="Home">
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>

                    <span>K.I.B</span>

                    <i data-lucide="chevron-right"></i>

                    <strong aria-current="page">
                        Konstruksi Dalam Pengerjaan
                    </strong>

                </nav>


                {{-- HEADING --}}
                <div class="kontruksi-heading">

                    <div class="kontruksi-heading-main">

                        <span class="kontruksi-eyebrow">
                            K.I.B 06
                        </span>

                        <h1>
                            Konstruksi Dalam Pengerjaan
                        </h1>

                        <p>
                            Kelola aset konstruksi yang masih dalam proses
                            pengerjaan, mulai dari informasi proyek,
                            lokasi, nilai kontrak, progres pembangunan,
                            hingga target penyelesaian.
                        </p>

                    </div>


                    <div class="kontruksi-date-card">

                        <div class="kontruksi-date-icon">
                            <i data-lucide="calendar-days"></i>
                        </div>

                        <div>
                            <strong>
                                Periode Data
                            </strong>

                            <span>
                                Tahun Anggaran 2025
                            </span>
                        </div>

                    </div>

                </div>


                {{-- =================================================
                 KPI
            ================================================== --}}

                <div class="kontruksi-kpi-grid">

                    {{-- TOTAL PROYEK --}}
                    <article class="kontruksi-kpi-card">

                        <div class="kontruksi-kpi-icon">
                            <i data-lucide="construction"></i>
                        </div>

                        <div class="kontruksi-kpi-content">

                            <span>
                                Total Pekerjaan
                            </span>

                            <div class="kontruksi-kpi-value">

                                <strong>
                                    18
                                </strong>

                                <small>
                                    <i data-lucide="arrow-up-right"></i>
                                    +3
                                </small>

                            </div>

                            <p>
                                proyek konstruksi
                            </p>

                        </div>

                    </article>


                    {{-- BERJALAN --}}
                    <article class="kontruksi-kpi-card">

                        <div class="kontruksi-kpi-icon is-blue">
                            <i data-lucide="loader-circle"></i>
                        </div>

                        <div class="kontruksi-kpi-content">

                            <span>
                                Sedang Dikerjakan
                            </span>

                            <strong>
                                11
                            </strong>

                            <p>
                                pekerjaan aktif
                            </p>

                        </div>

                    </article>


                    {{-- NILAI KONSTRUKSI --}}
                    <article class="kontruksi-kpi-card">

                        <div class="kontruksi-kpi-icon is-green">
                            <i data-lucide="wallet"></i>
                        </div>

                        <div class="kontruksi-kpi-content">

                            <span>
                                Nilai Konstruksi
                            </span>

                            <strong class="kontruksi-kpi-money">
                                Rp 18,42 M
                            </strong>

                            <p>
                                total nilai perolehan
                            </p>

                        </div>

                    </article>


                    {{-- PROGRESS --}}
                    <article class="kontruksi-kpi-card">

                        <div class="kontruksi-kpi-icon is-orange">
                            <i data-lucide="chart-no-axes-combined"></i>
                        </div>

                        <div class="kontruksi-kpi-content">

                            <span>
                                Rata-rata Progres
                            </span>

                            <strong>
                                67,8%
                            </strong>

                            <p>
                                progres pekerjaan
                            </p>

                        </div>

                    </article>

                </div>

            </div>

        </section>



        {{-- =====================================================
         MAIN CARD
    ====================================================== --}}

        <section class="kontruksi-card kontruksi-workspace">

            {{-- HEADER --}}
            <div class="kontruksi-workspace-head">

                <div>

                    <div class="kontruksi-section-title">

                        <div class="kontruksi-section-icon">
                            <i data-lucide="hard-hat"></i>
                        </div>

                        <div>

                            <h2>
                                Daftar Konstruksi
                            </h2>

                            <p>
                                Data aset Konstruksi Dalam Pengerjaan
                            </p>

                        </div>

                    </div>

                </div>


                <button type="button" class="kontruksi-add-button" onclick="openKontruksiModal('add')">

                    <i data-lucide="plus"></i>

                    Tambah Konstruksi

                </button>

            </div>



            {{-- =====================================================
             SUMMARY STRIP
        ====================================================== --}}

            <div class="kontruksi-summary-grid">

                <div class="kontruksi-summary-item">

                    <div class="kontruksi-summary-icon">
                        <i data-lucide="play-circle"></i>
                    </div>

                    <div>

                        <span>
                            Berjalan
                        </span>

                        <strong>
                            11
                        </strong>

                    </div>

                </div>


                <div class="kontruksi-summary-item">

                    <div class="kontruksi-summary-icon is-warning">
                        <i data-lucide="clock-3"></i>
                    </div>

                    <div>

                        <span>
                            Mendekati Selesai
                        </span>

                        <strong>
                            4
                        </strong>

                    </div>

                </div>


                <div class="kontruksi-summary-item">

                    <div class="kontruksi-summary-icon is-success">
                        <i data-lucide="circle-check"></i>
                    </div>

                    <div>

                        <span>
                            Selesai Tahun Ini
                        </span>

                        <strong>
                            3
                        </strong>

                    </div>

                </div>


                <div class="kontruksi-summary-item kontruksi-summary-progress">

                    <div class="kontruksi-summary-progress-head">

                        <span>
                            Rata-rata Progres
                        </span>

                        <strong>
                            67,8%
                        </strong>

                    </div>

                    <div class="kontruksi-progress-track">

                        <span style="width: 67.8%"></span>

                    </div>

                </div>

            </div>



            {{-- =====================================================
             FILTER
        ====================================================== --}}

            <div class="kontruksi-filter">

                <div class="kontruksi-search">

                    <i data-lucide="search"></i>

                    <input type="search" id="kontruksiSearch" placeholder="Cari kode, nama pekerjaan, lokasi..."
                        aria-label="Cari konstruksi">

                </div>


                <div class="kontruksi-select">

                    <select id="kontruksiJenis" aria-label="Filter jenis konstruksi">

                        <option value="">
                            Semua Jenis
                        </option>

                        <option value="Bangunan Gedung">
                            Bangunan Gedung
                        </option>

                        <option value="Bangunan Instalasi">
                            Bangunan Instalasi
                        </option>

                        <option value="Pembangunan Sarana">
                            Pembangunan Sarana
                        </option>

                        <option value="Renovasi">
                            Renovasi
                        </option>

                    </select>

                </div>


                <div class="kontruksi-select">

                    <select id="kontruksiStatus" aria-label="Filter status konstruksi">

                        <option value="">
                            Semua Status
                        </option>

                        <option value="Berjalan">
                            Berjalan
                        </option>

                        <option value="Mendekati Selesai">
                            Mendekati Selesai
                        </option>

                        <option value="Selesai">
                            Selesai
                        </option>

                        <option value="Tertunda">
                            Tertunda
                        </option>

                    </select>

                </div>


                <div class="kontruksi-select">

                    <select id="kontruksiTahun" aria-label="Filter tahun">

                        <option value="">
                            Semua Tahun
                        </option>

                        <option value="2025">
                            2025
                        </option>

                        <option value="2024">
                            2024
                        </option>

                        <option value="2023">
                            2023
                        </option>

                    </select>

                </div>


                <button type="button" class="kontruksi-filter-button" onclick="filterKontruksiTable()">

                    <i data-lucide="list-filter"></i>

                    Filter

                </button>


                <button type="button" class="kontruksi-reset-button" onclick="resetKontruksiFilter()">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>

            </div>



            {{-- =====================================================
             TABLE
        ====================================================== --}}

            <div class="kontruksi-table-scroll" tabindex="0" aria-label="Daftar konstruksi dalam pengerjaan">

                <table class="kontruksi-table" id="kontruksiTable">

                    <thead>

                        <tr>

                            <th>
                                <input type="checkbox" id="kontruksiSelectAll" aria-label="Pilih semua konstruksi">
                            </th>

                            <th>
                                No
                            </th>

                            <th>
                                Kode Aset
                            </th>

                            <th>
                                Nama Pekerjaan
                            </th>

                            <th>
                                Jenis Konstruksi
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Tahun
                            </th>

                            <th>
                                Nilai Kontrak
                            </th>

                            <th>
                                Progres
                            </th>

                            <th>
                                Target Selesai
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>


                        {{-- DATA 1 --}}
                        <tr data-record data-jenis="Bangunan Gedung" data-status="Berjalan" data-tahun="2025">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>1</td>

                            <td class="kontruksi-code">
                                06.01.01.001
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Pembangunan Gedung Kantor Unit
                                </strong>

                                <small>
                                    Konstruksi tahap utama
                                </small>

                            </td>

                            <td>
                                Bangunan Gedung
                            </td>

                            <td>
                                Kantor Pusat
                            </td>

                            <td>
                                2025
                            </td>

                            <td>
                                Rp 4.850.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">

                                        <span>
                                            72%
                                        </span>

                                    </div>

                                    <div class="kontruksi-progress-track">

                                        <span style="width:72%"></span>

                                    </div>

                                </div>

                            </td>

                            <td>
                                30 Nov 2025
                            </td>

                            <td>
                                <span class="kontruksi-status is-running">
                                    Berjalan
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat pembangunan gedung kantor unit">
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
                        <tr data-record data-jenis="Bangunan Instalasi" data-status="Mendekati Selesai"
                            data-tahun="2025">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>2</td>

                            <td class="kontruksi-code">
                                06.01.02.004
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Pembangunan Bangunan Pendukung IPA
                                </strong>

                                <small>
                                    Area instalasi pengolahan air
                                </small>

                            </td>

                            <td>
                                Bangunan Instalasi
                            </td>

                            <td>
                                IPA Gunung Lipan
                            </td>

                            <td>
                                2025
                            </td>

                            <td>
                                Rp 3.275.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">

                                        <span>
                                            88%
                                        </span>

                                    </div>

                                    <div class="kontruksi-progress-track">

                                        <span style="width:88%"></span>

                                    </div>

                                </div>

                            </td>

                            <td>
                                15 Okt 2025
                            </td>

                            <td>
                                <span class="kontruksi-status is-near">
                                    Mendekati Selesai
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

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
                        <tr data-record data-jenis="Pembangunan Sarana" data-status="Berjalan" data-tahun="2025">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>3</td>

                            <td class="kontruksi-code">
                                06.02.01.008
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Pembangunan Sarana Pendukung Distribusi
                                </strong>

                                <small>
                                    Pekerjaan sarana distribusi
                                </small>

                            </td>

                            <td>
                                Pembangunan Sarana
                            </td>

                            <td>
                                Unit Pelayanan
                            </td>

                            <td>
                                2025
                            </td>

                            <td>
                                Rp 2.140.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">
                                        <span>61%</span>
                                    </div>

                                    <div class="kontruksi-progress-track">
                                        <span style="width:61%"></span>
                                    </div>

                                </div>

                            </td>

                            <td>
                                20 Des 2025
                            </td>

                            <td>
                                <span class="kontruksi-status is-running">
                                    Berjalan
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

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
                        <tr data-record data-jenis="Renovasi" data-status="Berjalan" data-tahun="2025">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>4</td>

                            <td class="kontruksi-code">
                                06.03.01.012
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Renovasi Gedung Pelayanan
                                </strong>

                                <small>
                                    Renovasi ruang pelayanan pelanggan
                                </small>

                            </td>

                            <td>
                                Renovasi
                            </td>

                            <td>
                                Kantor Pusat
                            </td>

                            <td>
                                2025
                            </td>

                            <td>
                                Rp 1.285.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">
                                        <span>54%</span>
                                    </div>

                                    <div class="kontruksi-progress-track">
                                        <span style="width:54%"></span>
                                    </div>

                                </div>

                            </td>

                            <td>
                                10 Des 2025
                            </td>

                            <td>
                                <span class="kontruksi-status is-running">
                                    Berjalan
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

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
                        <tr data-record data-jenis="Bangunan Gedung" data-status="Selesai" data-tahun="2024">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>5</td>

                            <td class="kontruksi-code">
                                06.01.03.016
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Pembangunan Gudang Material
                                </strong>

                                <small>
                                    Gudang penyimpanan material
                                </small>

                            </td>

                            <td>
                                Bangunan Gedung
                            </td>

                            <td>
                                Gudang Pusat
                            </td>

                            <td>
                                2024
                            </td>

                            <td>
                                Rp 1.920.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">
                                        <span>100%</span>
                                    </div>

                                    <div class="kontruksi-progress-track">
                                        <span style="width:100%"></span>
                                    </div>

                                </div>

                            </td>

                            <td>
                                28 Des 2024
                            </td>

                            <td>
                                <span class="kontruksi-status is-complete">
                                    Selesai
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

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
                        <tr data-record data-jenis="Bangunan Instalasi" data-status="Berjalan" data-tahun="2024">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>6</td>

                            <td class="kontruksi-code">
                                06.01.04.019
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Pengembangan Area Instalasi
                                </strong>

                                <small>
                                    Pengembangan fasilitas instalasi
                                </small>

                            </td>

                            <td>
                                Bangunan Instalasi
                            </td>

                            <td>
                                IPA Sungai Kapih
                            </td>

                            <td>
                                2024
                            </td>

                            <td>
                                Rp 2.760.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">
                                        <span>76%</span>
                                    </div>

                                    <div class="kontruksi-progress-track">
                                        <span style="width:76%"></span>
                                    </div>

                                </div>

                            </td>

                            <td>
                                30 Nov 2025
                            </td>

                            <td>
                                <span class="kontruksi-status is-running">
                                    Berjalan
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

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
                        <tr data-record data-jenis="Pembangunan Sarana" data-status="Mendekati Selesai"
                            data-tahun="2025">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>7</td>

                            <td class="kontruksi-code">
                                06.02.02.023
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Pembangunan Sarana Operasional
                                </strong>

                                <small>
                                    Fasilitas pendukung operasional
                                </small>

                            </td>

                            <td>
                                Pembangunan Sarana
                            </td>

                            <td>
                                Unit Pelayanan
                            </td>

                            <td>
                                2025
                            </td>

                            <td>
                                Rp 985.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">
                                        <span>91%</span>
                                    </div>

                                    <div class="kontruksi-progress-track">
                                        <span style="width:91%"></span>
                                    </div>

                                </div>

                            </td>

                            <td>
                                30 Sep 2025
                            </td>

                            <td>
                                <span class="kontruksi-status is-near">
                                    Mendekati Selesai
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

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
                        <tr data-record data-jenis="Renovasi" data-status="Tertunda" data-tahun="2024">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>8</td>

                            <td class="kontruksi-code">
                                06.03.02.028
                            </td>

                            <td class="kontruksi-name">

                                <strong>
                                    Renovasi Gedung Workshop
                                </strong>

                                <small>
                                    Renovasi fasilitas workshop
                                </small>

                            </td>

                            <td>
                                Renovasi
                            </td>

                            <td>
                                Bengkel Pusat
                            </td>

                            <td>
                                2024
                            </td>

                            <td>
                                Rp 745.000.000
                            </td>

                            <td>

                                <div class="kontruksi-progress-cell">

                                    <div class="kontruksi-progress-info">
                                        <span>38%</span>
                                    </div>

                                    <div class="kontruksi-progress-track">
                                        <span style="width:38%"></span>
                                    </div>

                                </div>

                            </td>

                            <td>
                                15 Mar 2026
                            </td>

                            <td>
                                <span class="kontruksi-status is-pending">
                                    Tertunda
                                </span>
                            </td>

                            <td>

                                <div class="kontruksi-actions">

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



                        <tr id="kontruksiEmptyRow" hidden>

                            <td colspan="12" class="kontruksi-empty">
                                <i data-lucide="search-x"></i>

                                <strong>
                                    Data tidak ditemukan
                                </strong>

                                <span>
                                    Coba ubah kata pencarian atau filter.
                                </span>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>



            {{-- =====================================================
             FOOTER
        ====================================================== --}}

            <div class="kontruksi-table-footer">

                <div class="kontruksi-table-info" id="kontruksiTableInfo" role="status" aria-live="polite">
                    Menampilkan 1 - 8 dari 18 data
                </div>


                <div class="kontruksi-pagination-area">

                    <select id="kontruksiPageSize" aria-label="Jumlah data per halaman">

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


                    <nav class="kontruksi-pagination" id="kontruksiPagination" aria-label="Pagination">
                    </nav>

                </div>

            </div>

        </section>



        {{-- =====================================================
         MODAL
    ====================================================== --}}

        <dialog class="kontruksi-modal" id="kontruksiModal" aria-labelledby="kontruksiModalTitle">

            <div class="kontruksi-modal-dialog">

                <div class="kontruksi-modal-header">

                    <div>

                        <span class="kontruksi-modal-label">
                            K.I.B 06
                        </span>

                        <h3 id="kontruksiModalTitle">
                            Tambah Konstruksi
                        </h3>

                        <p id="kontruksiModalDescription">
                            Tambahkan data Konstruksi Dalam Pengerjaan.
                        </p>

                    </div>


                    <button type="button" onclick="closeKontruksiModal()" aria-label="Tutup dialog">
                        <i data-lucide="x"></i>
                    </button>

                </div>



                <form id="kontruksiForm">

                    <div class="kontruksi-modal-body">

                        <div class="kontruksi-modal-note" id="kontruksiModalNote">
                            Form ini masih berupa antarmuka contoh.
                            Penyimpanan database belum dihubungkan.
                        </div>


                        {{-- KODE --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiCode">
                                Kode Aset
                            </label>

                            <input type="text" id="kontruksiCode" name="kode" placeholder="06.01.01.001" required>

                        </div>


                        {{-- NAMA --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiName">
                                Nama Pekerjaan
                            </label>

                            <input type="text" id="kontruksiName" name="nama"
                                placeholder="Masukkan nama pekerjaan" required>

                        </div>


                        {{-- JENIS --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiFormJenis">
                                Jenis Konstruksi
                            </label>

                            <select id="kontruksiFormJenis" name="jenis" required>

                                <option value="">
                                    Pilih Jenis Konstruksi
                                </option>

                                <option value="Bangunan Gedung">
                                    Bangunan Gedung
                                </option>

                                <option value="Bangunan Instalasi">
                                    Bangunan Instalasi
                                </option>

                                <option value="Pembangunan Sarana">
                                    Pembangunan Sarana
                                </option>

                                <option value="Renovasi">
                                    Renovasi
                                </option>

                            </select>

                        </div>


                        {{-- LOKASI --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiFormLokasi">
                                Lokasi
                            </label>

                            <input type="text" id="kontruksiFormLokasi" name="lokasi" placeholder="Masukkan lokasi"
                                required>

                        </div>


                        {{-- TAHUN --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiFormTahun">
                                Tahun Anggaran
                            </label>

                            <input type="number" id="kontruksiFormTahun" name="tahun" min="2000" max="2100"
                                placeholder="2025" required>

                        </div>


                        {{-- NILAI KONTRAK --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiNilai">
                                Nilai Kontrak
                            </label>

                            <input type="text" id="kontruksiNilai" name="nilai" placeholder="Rp 0" required>

                        </div>


                        {{-- PROGRESS --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiProgress">
                                Progres Pekerjaan
                            </label>

                            <div class="kontruksi-progress-input">

                                <input type="number" id="kontruksiProgress" name="progress" min="0"
                                    max="100" value="0" required>

                                <span>
                                    %
                                </span>

                            </div>

                        </div>


                        {{-- TARGET --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiTarget">
                                Target Selesai
                            </label>

                            <input type="date" id="kontruksiTarget" name="target" required>

                        </div>


                        {{-- STATUS --}}
                        <div class="kontruksi-form-group">

                            <label for="kontruksiFormStatus">
                                Status
                            </label>

                            <select id="kontruksiFormStatus" name="status" required>

                                <option value="Berjalan">
                                    Berjalan
                                </option>

                                <option value="Mendekati Selesai">
                                    Mendekati Selesai
                                </option>

                                <option value="Selesai">
                                    Selesai
                                </option>

                                <option value="Tertunda">
                                    Tertunda
                                </option>

                            </select>

                        </div>

                    </div>



                    <div class="kontruksi-modal-footer">

                        <button type="button" class="kontruksi-cancel-button" onclick="closeKontruksiModal()">
                            Batal
                        </button>


                        <button type="submit" class="kontruksi-save-button" id="kontruksiSaveButton">
                            Simpan Konstruksi
                        </button>

                    </div>

                </form>

            </div>

        </dialog>

    </section>


    @push('scripts')
        <script src="{{ asset('js/pages/kib/konstruksi.js') }}"></script>
    @endpush

@endsection
