@extends('layouts.main')

@section('title', 'Dashboard')

@section('page-title', 'Dashboard')

@section('page-description', 'Ringkasan dan monitoring aset perusahaan')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/dashboard.css') }}">
@endpush



@section('content')

    <section class="content dashboard-page">


        {{-- ============================================================
         DASHBOARD TOP
    ============================================================= --}}
        <div class="dashboard-top">


            <div class="dashboard-heading">

                <span class="dashboard-eyebrow">
                    Overview
                </span>

                <h2>
                    Dashboard
                </h2>

                <p>
                    Ringkasan dan monitoring aset perusahaan
                </p>

            </div>



            {{-- DATE CARD --}}
            <div class="dashboard-date">

                <div class="dashboard-date-icon">
                    <i data-lucide="calendar-days"></i>
                </div>


                <div>

                    <strong id="dashboardDate">
                        Kamis, 24 September 2026
                    </strong>

                    <span id="dashboardTime">
                        11:07 WIB
                    </span>

                </div>

            </div>


        </div>



        {{-- ============================================================
         HERO BANNER
    ============================================================= --}}
        <div class="dashboard-hero">


            <div class="dashboard-hero-overlay"></div>


            <div class="dashboard-hero-content">


                <span>
                    Sistem Informasi
                </span>


                <h1>
                    Manajemen Aset
                </h1>


                <h3>
                    Perumdam Tirta Kencana
                </h3>


                <div class="dashboard-welcome">

                    <strong>
                        Selamat datang, Administrator
                    </strong>

                    <p>
                        Pantau, kelola, dan optimalkan aset perusahaan
                        untuk mendukung pelayanan air bersih yang lebih baik.
                    </p>

                </div>


            </div>



            <div class="dashboard-hero-quote">

                <p>
                    “Aset yang terkelola dengan baik
                    <br>
                    untuk pelayanan air yang lebih baik”
                </p>

                <span></span>

            </div>


        </div>



        {{-- ============================================================
         KPI
    ============================================================= --}}
        <div class="dashboard-kpi-grid">


            {{-- TOTAL ASET --}}
            <div class="dashboard-kpi-card">

                <div class="kpi-icon blue">

                    <i data-lucide="box"></i>

                </div>


                <div class="kpi-main">

                    <span>
                        Total Aset
                    </span>

                    <strong>
                        2.485
                    </strong>

                    <small class="positive">

                        <i data-lucide="arrow-up"></i>

                        +5,2% dari tahun lalu

                    </small>

                </div>


                <div class="kpi-mini-chart">

                    <svg viewBox="0 0 100 45">

                        <polyline points="2,35 17,22 31,27 47,12 62,17 78,9 98,2" />

                    </svg>

                </div>

            </div>



            {{-- TOTAL NILAI --}}
            <div class="dashboard-kpi-card">

                <div class="kpi-icon blue">

                    <i data-lucide="coins"></i>

                </div>


                <div class="kpi-main">

                    <span>
                        Total Nilai Aset
                    </span>

                    <strong class="kpi-money">
                        Rp 928,7 M
                    </strong>

                    <small class="positive">

                        <i data-lucide="arrow-up"></i>

                        +6,1% dari tahun lalu

                    </small>

                </div>


                <div class="kpi-mini-chart">

                    <svg viewBox="0 0 100 45">

                        <polyline points="2,36 14,24 28,29 42,13 57,17 73,7 98,11" />

                    </svg>

                </div>

            </div>



            {{-- KONDISI BAIK --}}
            <div class="dashboard-kpi-card kpi-green-card">

                <div class="kpi-icon green">

                    <i data-lucide="check"></i>

                </div>


                <div class="kpi-main">

                    <span>
                        Kondisi Baik
                    </span>

                    <strong>
                        2.215
                    </strong>

                    <small>
                        89,1% dari total aset
                    </small>

                </div>


                <div class="kpi-circle good">

                    <div>

                        <strong>
                            89,1%
                        </strong>

                    </div>

                </div>

            </div>



            {{-- PERLU PERHATIAN --}}
            <div class="dashboard-kpi-card kpi-warning-card">

                <div class="kpi-icon orange">

                    <i data-lucide="triangle-alert"></i>

                </div>


                <div class="kpi-main">

                    <span>
                        Perlu Perhatian
                    </span>

                    <strong>
                        270
                    </strong>

                    <small>
                        10,9% dari total aset
                    </small>

                </div>


                <div class="kpi-circle warning">

                    <div>

                        <strong>
                            10,9%
                        </strong>

                    </div>

                </div>

            </div>


        </div>



        {{-- ============================================================
         CHART ROW
    ============================================================= --}}
        <div class="dashboard-chart-grid">


            {{-- GROWTH --}}
            <div class="dashboard-card growth-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Pertumbuhan Nilai Aset
                        </h3>

                        <p>
                            Dalam Miliar Rupiah (Rp)
                        </p>

                    </div>


                    <select class="dashboard-period">

                        <option>
                            5 Tahun Terakhir
                        </option>

                        <option>
                            3 Tahun Terakhir
                        </option>

                    </select>

                </div>


                <div class="dashboard-card-body chart-area">

                    <canvas id="assetGrowthChart"></canvas>

                </div>

            </div>



            {{-- DONUT KIB --}}
            <div class="dashboard-card kib-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Komposisi Aset per KIB
                        </h3>

                        <p>
                            Jumlah aset berdasarkan kategori
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body kib-content">


                    <div class="kib-chart-wrap">

                        <canvas id="kibCompositionChart"></canvas>


                        <div class="donut-center">

                            <strong>
                                2.485
                            </strong>

                            <span>
                                Aset
                            </span>

                        </div>

                    </div>



                    <div class="kib-legend">


                        <div>
                            <span class="legend-dot blue"></span>
                            <p>Tanah</p>
                            <strong>245</strong>
                        </div>


                        <div>
                            <span class="legend-dot orange"></span>
                            <p>Peralatan & Mesin</p>
                            <strong>1.020</strong>
                        </div>


                        <div>
                            <span class="legend-dot yellow"></span>
                            <p>Gedung & Bangunan</p>
                            <strong>380</strong>
                        </div>


                        <div>
                            <span class="legend-dot purple"></span>
                            <p>Jalan & Jaringan</p>
                            <strong>510</strong>
                        </div>


                        <div>
                            <span class="legend-dot red"></span>
                            <p>Aset Tetap Lainnya</p>
                            <strong>260</strong>
                        </div>


                        <div>
                            <span class="legend-dot indigo"></span>
                            <p>Konstruksi</p>
                            <strong>70</strong>
                        </div>


                    </div>


                </div>

            </div>



            {{-- CATEGORY --}}
            <div class="dashboard-card category-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Jumlah Aset per Kategori
                        </h3>

                        <p>
                            Perbandingan jumlah aset setiap kategori
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body category-list">


                    <div class="category-item">

                        <span>
                            Peralatan & Mesin
                        </span>

                        <div class="category-progress">

                            <div style="width:100%"></div>

                        </div>

                        <strong>
                            1.020
                        </strong>

                    </div>



                    <div class="category-item">

                        <span>
                            Jalan & Jaringan
                        </span>

                        <div class="category-progress">

                            <div style="width:50%"></div>

                        </div>

                        <strong>
                            510
                        </strong>

                    </div>



                    <div class="category-item">

                        <span>
                            Gedung & Bangunan
                        </span>

                        <div class="category-progress">

                            <div style="width:37%"></div>

                        </div>

                        <strong>
                            380
                        </strong>

                    </div>



                    <div class="category-item">

                        <span>
                            Aset Lainnya
                        </span>

                        <div class="category-progress">

                            <div style="width:25%"></div>

                        </div>

                        <strong>
                            260
                        </strong>

                    </div>



                    <div class="category-item">

                        <span>
                            Tanah
                        </span>

                        <div class="category-progress">

                            <div style="width:24%"></div>

                        </div>

                        <strong>
                            245
                        </strong>

                    </div>



                    <div class="category-item">

                        <span>
                            Konstruksi
                        </span>

                        <div class="category-progress">

                            <div style="width:7%"></div>

                        </div>

                        <strong>
                            70
                        </strong>

                    </div>


                </div>

            </div>


        </div>



        {{-- ============================================================
         BOTTOM ROW
    ============================================================= --}}
        <div class="dashboard-bottom-grid">


            {{-- CONDITION --}}
            <div class="dashboard-card condition-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Kondisi Aset
                        </h3>

                        <p>
                            Distribusi kondisi aset saat ini
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body condition-content">


                    <div class="condition-chart-wrap">

                        <canvas id="assetConditionChart"></canvas>


                        <div class="donut-center condition-center">

                            <strong>
                                2.485
                            </strong>

                            <span>
                                Aset
                            </span>

                        </div>

                    </div>



                    <div class="condition-legend">


                        <div>

                            <span class="condition-dot good"></span>

                            <p>
                                Baik
                            </p>

                            <strong>
                                2.215
                            </strong>

                            <small>
                                89,1%
                            </small>

                        </div>


                        <div>

                            <span class="condition-dot maintenance"></span>

                            <p>
                                Maintenance
                            </p>

                            <strong>
                                180
                            </strong>

                            <small>
                                7,2%
                            </small>

                        </div>


                        <div>

                            <span class="condition-dot broken"></span>

                            <p>
                                Rusak
                            </p>

                            <strong>
                                90
                            </strong>

                            <small>
                                3,6%
                            </small>

                        </div>


                    </div>


                </div>

            </div>



            {{-- MASTER STAT --}}
            <div class="dashboard-card master-stat-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Statistik Master Data
                        </h3>

                        <p>
                            Data referensi dalam sistem
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body master-stat-grid">


                    <div class="master-stat">

                        <div>
                            <i data-lucide="map-pin"></i>
                        </div>

                        <span>
                            Lokasi
                        </span>

                        <strong>
                            24
                        </strong>

                    </div>


                    <div class="master-stat">

                        <div>
                            <i data-lucide="building-2"></i>
                        </div>

                        <span>
                            Ruangan
                        </span>

                        <strong>
                            186
                        </strong>

                    </div>


                    <div class="master-stat">

                        <div>
                            <i data-lucide="network"></i>
                        </div>

                        <span>
                            Departemen
                        </span>

                        <strong>
                            12
                        </strong>

                    </div>


                    <div class="master-stat">

                        <div>
                            <i data-lucide="users"></i>
                        </div>

                        <span>
                            Divisi
                        </span>

                        <strong>
                            36
                        </strong>

                    </div>


                </div>

            </div>



            {{-- LATEST ASSET --}}
            <div class="dashboard-card latest-assets">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Aset Terbaru
                        </h3>

                        <p>
                            5 aset terakhir yang ditambahkan
                        </p>

                    </div>


                    <a href="#">
                        Lihat Semua
                    </a>

                </div>


                <div class="dashboard-card-body asset-list">


                    <div class="asset-item">

                        <div class="asset-thumb laptop">

                            <i data-lucide="laptop"></i>

                        </div>

                        <div>

                            <strong>
                                Laptop Dell Latitude
                            </strong>

                            <span>
                                IT-2025-001
                            </span>

                        </div>

                        <small>
                            2 Des 2025
                        </small>

                    </div>



                    <div class="asset-item">

                        <div class="asset-thumb printer">

                            <i data-lucide="printer"></i>

                        </div>

                        <div>

                            <strong>
                                Printer Epson L5290
                            </strong>

                            <span>
                                IT-2025-002
                            </span>

                        </div>

                        <small>
                            1 Des 2025
                        </small>

                    </div>



                    <div class="asset-item">

                        <div class="asset-thumb machine">

                            <i data-lucide="settings"></i>

                        </div>

                        <div>

                            <strong>
                                Pompa Distribusi
                            </strong>

                            <span>
                                PM-2025-015
                            </span>

                        </div>

                        <small>
                            29 Nov 2025
                        </small>

                    </div>



                    <div class="asset-item">

                        <div class="asset-thumb land">

                            <i data-lucide="map"></i>

                        </div>

                        <div>

                            <strong>
                                Tanah IPA Gunung Lipan
                            </strong>

                            <span>
                                TN-2025-003
                            </span>

                        </div>

                        <small>
                            28 Nov 2025
                        </small>

                    </div>



                    <div class="asset-item">

                        <div class="asset-thumb building">

                            <i data-lucide="building"></i>

                        </div>

                        <div>

                            <strong>
                                Gedung Kantor Unit
                            </strong>

                            <span>
                                GD-2025-001
                            </span>

                        </div>

                        <small>
                            27 Nov 2025
                        </small>

                    </div>


                </div>

            </div>



            {{-- ACTIVITY --}}
            <div class="dashboard-card activity-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Aktivitas Terbaru
                        </h3>

                        <p>
                            5 aktivitas terakhir di sistem
                        </p>

                    </div>


                    <a href="#">
                        Lihat Semua
                    </a>

                </div>


                <div class="dashboard-card-body activity-list">


                    <div class="activity-item">

                        <span class="activity-icon blue">
                            <i data-lucide="plus"></i>
                        </span>

                        <p>
                            Menambahkan data aset
                            <strong>
                                Laptop Dell Latitude
                            </strong>
                        </p>

                        <small>
                            2 Des 2025
                            <br>
                            14:20
                        </small>

                    </div>



                    <div class="activity-item">

                        <span class="activity-icon green">
                            <i data-lucide="map-pin"></i>
                        </span>

                        <p>
                            Mengubah data lokasi
                            <strong>
                                Kantor Pusat
                            </strong>
                        </p>

                        <small>
                            2 Des 2025
                            <br>
                            10:15
                        </small>

                    </div>



                    <div class="activity-item">

                        <span class="activity-icon purple">
                            <i data-lucide="file-up"></i>
                        </span>

                        <p>
                            Mengunggah dokumen
                            <strong>
                                BAST Pompa Distribusi
                            </strong>
                        </p>

                        <small>
                            1 Des 2025
                            <br>
                            16:40
                        </small>

                    </div>



                    <div class="activity-item">

                        <span class="activity-icon orange">
                            <i data-lucide="badge-dollar-sign"></i>
                        </span>

                        <p>
                            Menambahkan nilai aset
                            <strong>
                                Voucher VCH-2025-0123
                            </strong>
                        </p>

                        <small>
                            1 Des 2025
                            <br>
                            11:22
                        </small>

                    </div>



                    <div class="activity-item">

                        <span class="activity-icon blue">
                            <i data-lucide="archive"></i>
                        </span>

                        <p>
                            Mengubah data arsip
                            <strong>
                                Sertifikat Tanah IPA
                            </strong>
                        </p>

                        <small>
                            30 Nov 2025
                            <br>
                            09:18
                        </small>

                    </div>


                </div>

            </div>


        </div>


    </section>

@endsection



@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="{{ asset('js/pages/dashboard.js') }}"></script>
@endpush
