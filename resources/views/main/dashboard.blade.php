@extends('layouts.main')

@section('title', 'Dashboard')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/dashboard.css') }}?v={{ filemtime(public_path('css/pages/dashboard.css')) }}">
@endpush


@section('content')

    @php

        /*
    |--------------------------------------------------------------------------
    | FORMAT ANGKA BIASA
    |--------------------------------------------------------------------------
    */

        $formatNumber = fn($value) => number_format((float) ($value ?? 0), 0, ',', '.');

        /*
    |--------------------------------------------------------------------------
    | TRUNCATE / POTONG ANGKA
    |--------------------------------------------------------------------------
    |
    | Ini berbeda dengan round().
    |
    | Contoh:
    |
    | 1.2799
    | menjadi
    | 1.27
    |
    | BUKAN:
    | 1.28
    |
    */

        $truncateNumber = function ($value, $precision = 2) {
            $value = (float) $value;

            $factor = pow(10, $precision);

            if ($value >= 0) {
                return floor($value * $factor) / $factor;
            }

            return ceil($value * $factor) / $factor;
        };

        /*
    |--------------------------------------------------------------------------
    | FORMAT COMPACT PRESISI
    |--------------------------------------------------------------------------
    |
    | Digunakan untuk:
    |
    | - Slide 1 Total Nilai Aset
    | - Slide 3 Nilai Keseluruhan
    |
    | Nilai TIDAK dibulatkan.
    |
    | Contoh:
    |
    | 1.270.746.080.536
    | =>
    | Rp 1,27 T
    |
    */

        $formatCurrencyCompactPrecise = function ($value) use ($truncateNumber) {
            $value = (float) ($value ?? 0);

            /*
        |--------------------------------------------------------------------------
        | TRILIUN
        |--------------------------------------------------------------------------
        */

            if (abs($value) >= 1000000000000) {
                $scaled = $truncateNumber($value / 1000000000000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' T';
            }

            /*
        |--------------------------------------------------------------------------
        | MILIAR
        |--------------------------------------------------------------------------
        */

            if (abs($value) >= 1000000000) {
                $scaled = $truncateNumber($value / 1000000000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' M';
            }

            /*
        |--------------------------------------------------------------------------
        | JUTA
        |--------------------------------------------------------------------------
        */

            if (abs($value) >= 1000000) {
                $scaled = $truncateNumber($value / 1000000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' Jt';
            }

            /*
        |--------------------------------------------------------------------------
        | RIBU
        |--------------------------------------------------------------------------
        */

            if (abs($value) >= 1000) {
                $scaled = $truncateNumber($value / 1000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' Rb';
            }

            /*
        |--------------------------------------------------------------------------
        | NILAI KECIL
        |--------------------------------------------------------------------------
        */

            return 'Rp ' . number_format($value, 0, ',', '.');
        };

        /*
    |--------------------------------------------------------------------------
    | FORMAT COMPACT LAMA
    |--------------------------------------------------------------------------
    |
    | Tetap tersedia untuk bagian lain bila diperlukan.
    |
    */

        $formatCurrencyCompact = function ($value) {
            $value = (float) ($value ?? 0);

            if (abs($value) >= 1000000000000) {
                return 'Rp ' . number_format($value / 1000000000000, 1, ',', '.') . ' T';
            }

            if (abs($value) >= 1000000000) {
                return 'Rp ' . number_format($value / 1000000000, 1, ',', '.') . ' M';
            }

            if (abs($value) >= 1000000) {
                return 'Rp ' . number_format($value / 1000000, 1, ',', '.') . ' Jt';
            }

            return 'Rp ' . number_format($value, 0, ',', '.');
        };

        /*
    |--------------------------------------------------------------------------
    | FORMAT RUPIAH PENUH
    |--------------------------------------------------------------------------
    |
    | Dipakai untuk:
    |
    | - Nilai per K.I.B & K.I.R
    | - Tooltip chart
    |
    */

        $formatCurrencyFull = function ($value) {
            return 'Rp ' . number_format((float) ($value ?? 0), 0, ',', '.');
        };

        /*
    |--------------------------------------------------------------------------
    | WARNA K.I.B
    |--------------------------------------------------------------------------
    */

        $kibColors = ['#2583f3', '#ff9f1a', '#f5bc28', '#7559d8', '#ef5350', '#537dd7', '#18a999'];

        /*
    |--------------------------------------------------------------------------
    | DONUT KIB
    |--------------------------------------------------------------------------
    */

        $kibSegments = [];

        $cursor = 0;

        if ($totalAset > 0) {
            foreach ($kibStats as $index => $item) {
                $jumlah = (float) ($item['jumlah'] ?? 0);

                $start = $cursor;

                $size = ($jumlah / (float) $totalAset) * 360;

                $end = $start + $size;

                $color = $kibColors[$index % count($kibColors)];

                $kibSegments[] = $color . ' ' . $start . 'deg ' . $end . 'deg';

                $cursor = $end;
            }
        }

        $kibGradient = count($kibSegments) ? implode(', ', $kibSegments) : '#e7eef7 0deg 360deg';

        /*
    |--------------------------------------------------------------------------
    | KONDISI ASET
    |--------------------------------------------------------------------------
    */

        $conditionKnownTotal = (int) ($conditionStats['total'] ?? 0);

        $conditionAvailable = (bool) ($conditionStats['available'] ?? false);

        $baikPercent = $conditionKnownTotal > 0 ? (($conditionStats['baik'] ?? 0) / $conditionKnownTotal) * 100 : 0;

        $maintenancePercent =
            $conditionKnownTotal > 0 ? (($conditionStats['maintenance'] ?? 0) / $conditionKnownTotal) * 100 : 0;

        $baikEnd = $baikPercent * 3.6;

        $maintenanceEnd = $baikEnd + $maintenancePercent * 3.6;

        $conditionGradient = $conditionAvailable
            ? "#21b66f 0deg {$baikEnd}deg,
             #f6ad19 {$baikEnd}deg {$maintenanceEnd}deg,
             #ef4444 {$maintenanceEnd}deg 360deg"
            : '#e5edf6 0deg 360deg';

        /*
    |--------------------------------------------------------------------------
    | MASTER DATA
    |--------------------------------------------------------------------------
    */

        $masters = [
            [
                'icon' => 'package',
                'label' => 'Barang',
                'value' => $masterStats['barang'] ?? 0,
            ],

            [
                'icon' => 'map-pin',
                'label' => 'Lokasi',
                'value' => $masterStats['lokasi'] ?? 0,
            ],

            [
                'icon' => 'door-open',
                'label' => 'Ruangan',
                'value' => $masterStats['ruangan'] ?? 0,
            ],

            [
                'icon' => 'network',
                'label' => 'Departemen',
                'value' => $masterStats['departemen'] ?? 0,
            ],

            [
                'icon' => 'users',
                'label' => 'Divisi',
                'value' => $masterStats['divisi'] ?? 0,
            ],

            [
                'icon' => 'contact',
                'label' => 'SDM Pendukung',
                'value' => $masterStats['sdm'] ?? 0,
            ],

            [
                'icon' => 'badge-check',
                'label' => 'Kode Aktiva',
                'value' => $masterStats['kode_aktiva'] ?? 0,
            ],
        ];

        $topLocations = array_slice($locations ?? [], 0, 7);

        $safeRecentActivities = $recentActivities ?? [];
    @endphp


    <section class="content dashboard-page">


        {{-- =====================================================
         HEADER
    ====================================================== --}}

        <header class="dashboard-page-header">

            <div class="dashboard-page-heading">

                <span class="dashboard-eyebrow">
                    Overview
                </span>


                <div class="dashboard-title-line">

                    <div>

                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Ringkasan dan monitoring aset perusahaan
                        </p>

                    </div>


                    <button type="button" class="dashboard-presentation-button" id="dashboardPresentationButton"
                        aria-pressed="false">

                        <i data-lucide="maximize-2"></i>

                        <span>
                            Mode Presentasi
                        </span>

                    </button>

                </div>

            </div>


            <div class="dashboard-date-card">

                <span class="dashboard-date-icon">

                    <i data-lucide="calendar-days"></i>

                </span>


                <span>

                    <strong id="dashboardCurrentDate">
                        -
                    </strong>

                    <small id="dashboardCurrentTime">
                        -
                    </small>

                </span>

            </div>

        </header>


        {{-- =====================================================
         DASHBOARD DECK
    ====================================================== --}}

        <section class="dashboard-deck" id="dashboardDeck" tabindex="0">

            <div class="dashboard-deck-viewport">

                <div class="dashboard-slide-stage">


                    {{-- =================================================
                     SLIDE 1
                ================================================== --}}

                    <article
                        class="
                        dashboard-slide
                        dashboard-slide-profile
                        is-active
                    "
                        data-slide="0"
                        style="
                        --dashboard-profile-image:
                        url('{{ asset('images/dashboard/pdam2.jpeg') }}');
                    ">

                        <div
                            class="
                            dashboard-slide-number
                            dashboard-slide-number-light
                        ">
                            Slide 1 dari 6
                        </div>


                        <div class="profile-copy">

                            <span class="profile-kicker">
                                Sistem Informasi
                            </span>


                            <h2>
                                Manajemen Aset
                            </h2>


                            <h3>
                                Perumda Tirta Kencana
                            </h3>


                            <p>
                                Pengelolaan aset yang terintegrasi,
                                akurat, dan mendukung pelayanan air
                                bersih yang lebih baik bagi masyarakat.
                            </p>


                            <span class="profile-line"></span>

                        </div>


                        <blockquote class="profile-quote">

                            “Aset yang terkelola dengan baik
                            <br>
                            untuk pelayanan air yang lebih baik”

                        </blockquote>


                        <div class="profile-kpi-grid">


                            {{-- TOTAL ASET --}}
                            <article class="profile-kpi-card">

                                <span
                                    class="
                                    profile-kpi-icon
                                    is-blue
                                ">

                                    <i data-lucide="box"></i>

                                </span>


                                <span>

                                    <small>
                                        Total Aset
                                    </small>

                                    <strong>
                                        {{ $formatNumber($totalAset) }}
                                    </strong>

                                    <em>
                                        K.I.B & K.I.R tercatat
                                    </em>

                                </span>

                            </article>


                            {{-- TOTAL NILAI ASET --}}
                            <article class="profile-kpi-card">

                                <span
                                    class="
                                    profile-kpi-icon
                                    is-green
                                ">

                                    <i data-lucide="coins"></i>

                                </span>


                                <span>

                                    <small>
                                        Total Nilai Aset
                                    </small>

                                    <strong>
                                        {{ $formatCurrencyCompactPrecise($totalNilai) }}
                                    </strong>

                                    <em>
                                        berdasarkan nilai aktiva
                                    </em>

                                </span>

                            </article>


                            {{-- LOKASI --}}
                            <article class="profile-kpi-card">

                                <span
                                    class="
                                    profile-kpi-icon
                                    is-orange
                                ">

                                    <i data-lucide="map-pin"></i>

                                </span>


                                <span>

                                    <small>
                                        Lokasi Aset
                                    </small>

                                    <strong>
                                        {{ $formatNumber($totalLokasiAset) }}
                                    </strong>

                                    <em>
                                        lokasi memiliki aset
                                    </em>

                                </span>

                            </article>


                            {{-- UNIT KERJA --}}
                            <article class="profile-kpi-card">

                                <span
                                    class="
                                    profile-kpi-icon
                                    is-violet
                                ">

                                    <i data-lucide="building-2"></i>

                                </span>


                                <span>

                                    <small>
                                        Unit Kerja
                                    </small>

                                    <strong>
                                        {{ $formatNumber($unitKerja) }}
                                    </strong>

                                    <em>
                                        departemen & divisi
                                    </em>

                                </span>

                            </article>


                        </div>

                    </article>


                    {{-- =================================================
                     SLIDE 2
                ================================================== --}}

                    <article
                        class="
                        dashboard-slide
                        dashboard-slide-data
                    "
                        data-slide="1"
                        style="
                        --slide-background:
                        url('{{ asset('images/dashboard/pdam1.jpeg') }}');
                    ">

                        <div class="dashboard-slide-number">
                            Slide 2 dari 6
                        </div>


                        <header class="slide-heading-row">

                            <div>

                                <span class="slide-eyebrow">
                                    Kartu Inventaris Barang & Ruangan
                                </span>

                                <h2>
                                    Komposisi Aset per K.I.B
                                </h2>

                                <p>
                                    Ringkasan jumlah dan nilai aset
                                    berdasarkan klasifikasi.
                                </p>

                            </div>


                            <div class="slide-summary-card">

                                <small>
                                    Total Aset
                                </small>

                                <strong>
                                    {{ $formatNumber($totalAset) }}
                                </strong>

                            </div>

                        </header>


                        <div class="kib-layout">

                            <section class="kib-chart-panel">

                                <div class="kib-donut"
                                    style="
                                    background:
                                    conic-gradient(
                                        {{ $kibGradient }}
                                    );
                                ">

                                    <div class="kib-donut-hole">

                                        <strong>
                                            {{ $formatNumber($totalAset) }}
                                        </strong>

                                        <span>
                                            Aset
                                        </span>

                                    </div>

                                </div>


                                <div class="kib-legend">

                                    @foreach ($kibStats as $index => $item)
                                        <div class="kib-legend-row">

                                            <span class="kib-legend-color"
                                                style="
                                                background:
                                                {{ $kibColors[$index % count($kibColors)] }};
                                            "></span>


                                            <span class="kib-legend-name">
                                                {{ $item['label'] ?? '-' }}
                                            </span>


                                            <strong>

                                                {{ $formatNumber($item['jumlah'] ?? 0) }}

                                            </strong>

                                        </div>
                                    @endforeach

                                </div>

                            </section>


                            <section class="kib-card-grid">

                                @foreach ($kibStats as $item)
                                    <article class="kib-card">

                                        <span class="kib-card-icon">

                                            <i
                                                data-lucide="{{ $item['icon'] ?? 'box' }}"></i>

                                        </span>


                                        <span class="kib-card-copy">

                                            <small>
                                                {{ $item['label'] ?? '-' }}
                                            </small>

                                            <strong>

                                                {{ $formatNumber($item['jumlah'] ?? 0) }}

                                            </strong>

                                            <em>

                                                {{ $formatCurrencyCompact($item['nilai'] ?? 0) }}

                                            </em>

                                        </span>

                                    </article>
                                @endforeach

                            </section>

                        </div>

                    </article>


                    {{-- =================================================
                     SLIDE 3
                ================================================== --}}

                    <article
                        class="
                        dashboard-slide
                        dashboard-slide-data
                    "
                        data-slide="2"
                        style="
                        --slide-background:
                        url('{{ asset('images/dashboard/pdam5.jpg') }}');
                    ">

                        <div class="dashboard-slide-number">
                            Slide 3 dari 6
                        </div>


                        <header class="slide-heading-row">

                            <div>

                                <span class="slide-eyebrow">
                                    Nilai Aset
                                </span>


                                <h2>
                                    Nilai & Pertumbuhan Aset
                                </h2>


                                <p>
                                    Perkembangan total nilai aset
                                    berdasarkan periode pencatatan.
                                </p>

                            </div>


                            {{-- NILAI KESELURUHAN --}}
                            <div
                                class="
                                slide-summary-card
                                slide-summary-card-compact-value
                            ">

                                <small>
                                    Nilai Keseluruhan
                                </small>


                                <strong>

                                    {{ $formatCurrencyCompactPrecise($totalNilai) }}

                                </strong>

                            </div>

                        </header>


                        <div class="growth-layout">


                            {{-- CHART --}}
                            <section class="growth-chart-card">

                                <div class="growth-chart-heading">

                                    <div class="panel-heading">

                                        <h3>
                                            Pertumbuhan Nilai Aset
                                        </h3>

                                        <span>
                                            total nilai aset kumulatif
                                            berdasarkan periode pencatatan
                                        </span>

                                    </div>


                                    <div class="growth-change-badge" id="dashboardGrowthBadge" hidden>

                                        <i data-lucide="trending-up"></i>

                                        <span>

                                            <small>
                                                Pertumbuhan
                                            </small>

                                            <strong id="dashboardGrowthChange">
                                                -
                                            </strong>

                                        </span>

                                    </div>

                                </div>


                                <div class="growth-chart-stage">

                                    <svg id="dashboardGrowthChart" viewBox="0 0 900 360" preserveAspectRatio="xMidYMid meet"
                                        role="img" aria-label="Grafik pertumbuhan nilai aset"></svg>


                                    <div class="growth-chart-tooltip" id="dashboardGrowthTooltip" hidden>

                                        <small id="dashboardGrowthTooltipYear">
                                            -
                                        </small>


                                        <strong id="dashboardGrowthTooltipValue">
                                            -
                                        </strong>


                                        <span id="dashboardGrowthTooltipChange">
                                        </span>

                                    </div>


                                    <div class="chart-empty" id="dashboardGrowthEmpty" hidden>

                                        <i data-lucide="chart-no-axes-combined"></i>

                                        <strong>
                                            Data pertumbuhan belum tersedia
                                        </strong>

                                        <span>
                                            Sistem memerlukan informasi
                                            tahun atau periode pada nilai aktiva.
                                        </span>

                                    </div>

                                </div>

                            </section>


                            {{-- NILAI PER KIB --}}
                            <section class="growth-value-card">

                                <h3>
                                    Nilai per K.I.B & K.I.R
                                </h3>


                                <div class="growth-value-list">

                                    @foreach ($kibStats as $index => $item)
                                        @php

                                            $nilaiPercentage =
                                                $totalNilai > 0
                                                    ? min(100, (($item['nilai'] ?? 0) / $totalNilai) * 100)
                                                    : 0;
                                        @endphp


                                        <div class="growth-value-item">

                                            <div>

                                                <span>
                                                    {{ $item['label'] ?? '-' }}
                                                </span>


                                                <strong>

                                                    {{ $formatCurrencyFull($item['nilai'] ?? 0) }}

                                                </strong>

                                            </div>


                                            <div class="growth-value-track">

                                                <span
                                                    style="
                                                    width:
                                                    {{ $nilaiPercentage }}%;

                                                    background:
                                                    {{ $kibColors[$index % count($kibColors)] }};
                                                "></span>

                                            </div>

                                        </div>
                                    @endforeach

                                </div>

                            </section>

                        </div>

                    </article>


                    {{-- =================================================
                     SLIDE 4
                ================================================== --}}

                    <article
                        class="
                        dashboard-slide
                        dashboard-slide-data
                    "
                        data-slide="3"
                        style="
                        --slide-background:
                        url('{{ asset('images/dashboard/pdam6.jpg') }}');
                    ">

                        <div class="dashboard-slide-number">
                            Slide 4 dari 6
                        </div>


                        <header class="slide-heading-row">

                            <div>

                                <span class="slide-eyebrow">
                                    Monitoring Kondisi
                                </span>

                                <h2>
                                    Kondisi Aset
                                </h2>

                                <p>
                                    Kondisi aset berdasarkan data kondisi
                                    K.I.B dan K.I.R.
                                </p>

                            </div>


                            <div class="slide-summary-card">

                                <small>
                                    Data Kondisi
                                </small>

                                <strong>
                                    {{ $formatNumber($conditionKnownTotal) }}
                                </strong>

                            </div>

                        </header>


                        <div class="condition-layout">

                            <section class="condition-chart-card">

                                <div class="condition-donut"
                                    style="
                                    background:
                                    conic-gradient(
                                        {{ $conditionGradient }}
                                    );
                                ">

                                    <div class="condition-donut-hole">

                                        @if ($conditionAvailable)
                                            <strong>
                                                {{ number_format($baikPercent, 1, ',', '.') }}%
                                            </strong>

                                            <span>
                                                Kondisi Baik
                                            </span>
                                        @else
                                            <strong>
                                                —
                                            </strong>

                                            <span>
                                                Belum tersedia
                                            </span>
                                        @endif

                                    </div>

                                </div>


                                <div class="condition-note">

                                    <strong>
                                        Ringkasan Kondisi
                                    </strong>

                                    <span>
                                        Berdasarkan data kondisi yang
                                        berhasil dikenali oleh sistem.
                                    </span>

                                </div>

                            </section>


                            <section class="condition-stat-grid">


                                <article
                                    class="
                                    condition-stat-card
                                    is-good
                                ">

                                    <span class="condition-stat-icon">

                                        <i data-lucide="circle-check-big"></i>

                                    </span>


                                    <span>

                                        <small>
                                            Baik
                                        </small>

                                        <strong>

                                            {{ $formatNumber($conditionStats['baik'] ?? 0) }}

                                        </strong>

                                        <em>
                                            Aset siap digunakan
                                        </em>

                                    </span>

                                </article>


                                <article
                                    class="
                                    condition-stat-card
                                    is-warning
                                ">

                                    <span class="condition-stat-icon">

                                        <i data-lucide="wrench"></i>

                                    </span>


                                    <span>

                                        <small>
                                            Perlu Perhatian
                                        </small>

                                        <strong>

                                            {{ $formatNumber($conditionStats['maintenance'] ?? 0) }}

                                        </strong>

                                        <em>
                                            Ringan / maintenance
                                        </em>

                                    </span>

                                </article>


                                <article
                                    class="
                                    condition-stat-card
                                    is-danger
                                ">

                                    <span class="condition-stat-icon">

                                        <i data-lucide="triangle-alert"></i>

                                    </span>


                                    <span>

                                        <small>
                                            Rusak
                                        </small>

                                        <strong>

                                            {{ $formatNumber($conditionStats['rusak'] ?? 0) }}

                                        </strong>

                                        <em>
                                            Perlu tindak lanjut
                                        </em>

                                    </span>

                                </article>


                                <article
                                    class="
                                    condition-stat-card
                                    is-neutral
                                ">

                                    <span class="condition-stat-icon">

                                        <i data-lucide="circle-help"></i>

                                    </span>


                                    <span>

                                        <small>
                                            Belum Terklasifikasi
                                        </small>

                                        <strong>

                                            {{ $formatNumber($conditionStats['unknown'] ?? 0) }}

                                        </strong>

                                        <em>
                                            Data kondisi lainnya
                                        </em>

                                    </span>

                                </article>

                            </section>

                        </div>

                    </article>


                    {{-- =================================================
                     SLIDE 5
                ================================================== --}}

                    <article
                        class="
                        dashboard-slide
                        dashboard-slide-data
                    "
                        data-slide="4"
                        style="
                        --slide-background:
                        url('{{ asset('images/dashboard/pdam7.jpeg') }}');
                    ">

                        <div class="dashboard-slide-number">
                            Slide 5 dari 6
                        </div>


                        <header class="slide-heading-row">

                            <div>

                                <span class="slide-eyebrow">
                                    Distribusi Lokasi
                                </span>

                                <h2>
                                    Sebaran Aset
                                </h2>

                                <p>
                                    Konsentrasi aset berdasarkan lokasi
                                    yang memiliki pencatatan aset.
                                </p>

                            </div>


                            <div class="slide-summary-card">

                                <small>
                                    Lokasi Aset
                                </small>

                                <strong>
                                    {{ $formatNumber($totalLokasiAset) }}
                                </strong>

                            </div>

                        </header>


                        <div class="location-layout">

                            <section class="location-map-card">

                                <div class="location-map-stage" id="dashboardMapStage"></div>


                                <div class="map-empty" id="dashboardMapEmpty" hidden>

                                    <i data-lucide="map-off"></i>

                                    <span>
                                        Koordinat lokasi belum tersedia
                                    </span>

                                </div>

                            </section>


                            <section class="location-ranking-card">

                                <h3>
                                    Lokasi dengan Aset Terbanyak
                                </h3>


                                <div class="location-ranking-list">

                                    @if (count($topLocations))

                                        @foreach ($topLocations as $index => $location)
                                            <article class="location-ranking-row">

                                                <span class="location-rank">
                                                    {{ $index + 1 }}
                                                </span>


                                                <span class="location-rank-copy">

                                                    <strong>
                                                        {{ $location['lokasi'] ?? '-' }}
                                                    </strong>

                                                    <small>

                                                        {{ $location['alamat'] ?? '' ?: 'Alamat belum tersedia' }}

                                                    </small>

                                                </span>


                                                <b>

                                                    {{ $formatNumber($location['jumlah'] ?? 0) }}

                                                </b>

                                            </article>
                                        @endforeach
                                    @else
                                        <div class="dashboard-data-empty">

                                            Belum ada relasi lokasi aset.

                                        </div>

                                    @endif

                                </div>

                            </section>

                        </div>

                    </article>


                    {{-- =================================================
                     SLIDE 6
                ================================================== --}}

                    <article
                        class="
                        dashboard-slide
                        dashboard-slide-data
                    "
                        data-slide="5"
                        style="
                        --slide-background:
                        url('{{ asset('images/dashboard/pdam8.jpg') }}');
                    ">

                        <div class="dashboard-slide-number">
                            Slide 6 dari 6
                        </div>


                        <header class="slide-heading-row">

                            <div>

                                <span class="slide-eyebrow">
                                    Sistem Aset
                                </span>

                                <h2>
                                    Master Data & Aktivitas
                                </h2>

                                <p>
                                    Referensi data utama dan aktivitas
                                    master data terbaru.
                                </p>

                            </div>


                            @if ($updateTerakhir)
                                <div class="last-update-badge">

                                    <i data-lucide="history"></i>

                                    <span>

                                        <small>
                                            Update Terakhir
                                        </small>

                                        <strong>
                                            {{ $updateTerakhir['relative'] }}
                                        </strong>

                                    </span>

                                </div>
                            @endif

                        </header>


                        <div class="master-layout">

                            <section class="master-stat-section">

                                <h3>
                                    Statistik Master Data
                                </h3>


                                <div class="master-stat-grid">

                                    @foreach ($masters as $master)
                                        <article class="master-stat-card">

                                            <span class="master-stat-icon">

                                                <i data-lucide="{{ $master['icon'] }}"></i>

                                            </span>


                                            <span class="master-stat-label">
                                                {{ $master['label'] }}
                                            </span>


                                            <strong>
                                                {{ $formatNumber($master['value']) }}
                                            </strong>

                                        </article>
                                    @endforeach

                                </div>

                            </section>


                            <section class="activity-section">

                                <h3>
                                    Aktivitas Terbaru
                                </h3>


                                <div class="activity-list">

                                    @if (count($safeRecentActivities))

                                        @foreach ($safeRecentActivities as $activity)
                                            <article class="activity-row">

                                                <span
                                                    class="
                                                    activity-icon
                                                    activity-{{ $activity['action'] ?? 'default' }}
                                                ">

                                                    <i
                                                        data-lucide="{{ $activity['icon'] ?? 'history' }}"></i>

                                                </span>


                                                <span class="activity-copy">

                                                    <strong>

                                                        {{ $activity['action_label'] ?? 'Aktivitas' }}:

                                                        {{ $activity['record_name'] ?? '' ?: 'Data master' }}

                                                    </strong>


                                                    <small>

                                                        {{ $activity['module_label'] ?? '-' }}


                                                        @if (!empty($activity['record_code']))
                                                            •
                                                            {{ $activity['record_code'] }}
                                                        @endif

                                                    </small>

                                                </span>


                                                <time>

                                                    @if (!empty($activity['created_at']))
                                                        {{ \Carbon\Carbon::parse($activity['created_at'])->timezone('Asia/Makassar')->locale('id')->translatedFormat('d M Y') }}
                                                    @else
                                                        -
                                                    @endif

                                                </time>

                                            </article>
                                        @endforeach
                                    @else
                                        <div class="dashboard-data-empty">

                                            Belum ada riwayat aktivitas.

                                        </div>

                                    @endif

                                </div>

                            </section>

                        </div>

                    </article>

                </div>


                {{-- =====================================================
                 ARROWS
            ====================================================== --}}

                <button type="button"
                    class="
                    dashboard-arrow
                    dashboard-arrow-prev
                "
                    id="dashboardPrev" aria-label="Slide sebelumnya">

                    <i data-lucide="chevron-left"></i>

                </button>


                <button type="button"
                    class="
                    dashboard-arrow
                    dashboard-arrow-next
                "
                    id="dashboardNext" aria-label="Slide berikutnya">

                    <i data-lucide="chevron-right"></i>

                </button>


                {{-- DOTS --}}
                <div class="dashboard-dots" id="dashboardDots"></div>


                {{-- AUTOPLAY --}}
                <div class="dashboard-autoplay-control">

                    <button type="button" id="dashboardPauseButton">

                        <i data-lucide="pause"></i>

                        <span>
                            Berhenti Otomatis
                        </span>

                    </button>


                    <span class="dashboard-autoplay-delay">
                        8 detik
                    </span>


                    <button type="button" class="dashboard-fullscreen-inside" id="dashboardFullscreenInside"
                        aria-label="Fullscreen">

                        <i data-lucide="maximize-2"></i>

                    </button>

                </div>

            </div>


            {{-- =====================================================
             THUMBNAILS
        ====================================================== --}}

            @php

                $thumbs = [
                    [
                        'icon' => 'building-2',
                        'title' => 'Profil Sistem',
                    ],

                    [
                        'icon' => 'pie-chart',
                        'title' => 'K.I.B & Jumlah Aset',
                    ],

                    [
                        'icon' => 'chart-no-axes-combined',
                        'title' => 'Nilai & Pertumbuhan',
                    ],

                    [
                        'icon' => 'gauge',
                        'title' => 'Kondisi Aset',
                    ],

                    [
                        'icon' => 'map',
                        'title' => 'Sebaran Aset',
                    ],

                    [
                        'icon' => 'database',
                        'title' => 'Master Data & Aktivitas',
                    ],
                ];

            @endphp


            <nav class="dashboard-thumbnail-strip">

                @foreach ($thumbs as $index => $thumb)
                    <button type="button"
                        class="
                        dashboard-thumbnail
                        {{ $index === 0 ? 'is-active' : '' }}
                    "
                        data-slide-target="{{ $index }}">

                        <span
                            class="
                            dashboard-thumbnail-preview
                            dashboard-thumbnail-preview-{{ $index + 1 }}
                        ">

                            <i data-lucide="{{ $thumb['icon'] }}"></i>

                        </span>


                        <span class="dashboard-thumbnail-label">

                            <b>

                                {{ str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) }}

                            </b>

                            {{ $thumb['title'] }}

                        </span>

                    </button>
                @endforeach

            </nav>

        </section>

    </section>


    <script>
        window.ASSET_DASHBOARD_DATA = {

            growth: @json($growth),

            locations: @json($locations),

            totalAsset: @json($totalAset),

            totalNilai: @json($totalNilai)

        };
    </script>

@endsection


@push('scripts')
    <script src="{{ asset('js/pages/dashboard.js') }}?v={{ filemtime(public_path('js/pages/dashboard.js')) }}"></script>
@endpush
