@extends('layouts.main')

@section('title', 'Jalan, Irigasi dan Jaringan')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/kib/jalan.css') }}">
@endpush

@section('content')

    <section class="content jalan-page">

        {{-- =========================================================
         HERO
    ========================================================== --}}

        <section class="jalan-hero">

            <div class="jalan-hero-overlay"></div>

            <div class="jalan-hero-inner">

                {{-- BREADCRUMB --}}
                <nav class="jalan-breadcrumb" aria-label="Breadcrumb">

                    <a href="{{ route('dashboard') }}" aria-label="Home">
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>

                    <span>K.I.B</span>

                    <i data-lucide="chevron-right"></i>

                    <strong aria-current="page">
                        Jalan, Irigasi dan Jaringan
                    </strong>

                </nav>


                {{-- HEADING --}}
                <div class="jalan-heading">

                    <h1>
                        Jalan, Irigasi dan Jaringan
                    </h1>

                    <p>
                        Kelola data aset tetap kategori jalan, irigasi dan jaringan
                        pada Perumdam Tirta Kencana Kota Samarinda.
                    </p>

                </div>


                {{-- =================================================
                 KPI
            ================================================== --}}

                <div class="jalan-kpi-grid">

                    {{-- TOTAL ASET --}}
                    <div class="jalan-kpi-card">

                        <div class="jalan-kpi-icon">
                            <i data-lucide="road"></i>
                        </div>

                        <div class="jalan-kpi-content">

                            <span>
                                Total Aset
                            </span>

                            <div class="jalan-kpi-inline">

                                <strong>
                                    342
                                </strong>

                                <small>
                                    <i data-lucide="arrow-up"></i>
                                    +18
                                </small>

                            </div>

                            <p>
                                dari tahun lalu
                            </p>

                        </div>

                    </div>


                    {{-- NILAI PEROLEHAN --}}
                    <div class="jalan-kpi-card">

                        <div class="jalan-kpi-icon">
                            <i data-lucide="database"></i>
                        </div>

                        <div class="jalan-kpi-content">

                            <span>
                                Total Nilai Perolehan
                            </span>

                            <strong>
                                Rp 425,80 M
                            </strong>

                        </div>

                    </div>


                    {{-- NILAI BUKU --}}
                    <div class="jalan-kpi-card">

                        <div class="jalan-kpi-icon">
                            <i data-lucide="chart-no-axes-combined"></i>
                        </div>

                        <div class="jalan-kpi-content">

                            <span>
                                Nilai Buku
                            </span>

                            <strong>
                                Rp 312,65 M
                            </strong>

                        </div>

                    </div>


                    {{-- LOKASI --}}
                    <div class="jalan-kpi-card">

                        <div class="jalan-kpi-icon">
                            <i data-lucide="map-pin"></i>
                        </div>

                        <div class="jalan-kpi-content">

                            <span>
                                Jumlah Lokasi
                            </span>

                            <strong>
                                56
                            </strong>

                            <p>
                                lokasi
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </section>



        {{-- =========================================================
         WORKSPACE
    ========================================================== --}}

        <section class="jalan-card jalan-workspace">

            {{-- =====================================================
             TABS + TAMBAH
        ====================================================== --}}

            <div class="jalan-workspace-head">

                <div class="jalan-tabs" role="tablist" aria-label="Menu data Jalan, Irigasi dan Jaringan">

                    <button type="button" class="active" data-jalan-tab="list" role="tab" aria-selected="true">
                        Daftar Aset
                    </button>

                    <button type="button" data-jalan-tab="recap" role="tab" aria-selected="false">
                        Rekapitulasi
                    </button>

                    <button type="button" data-jalan-tab="chart" role="tab" aria-selected="false">
                        Grafik
                    </button>

                    <button type="button" data-jalan-tab="depreciation" role="tab" aria-selected="false">
                        Penyusutan
                    </button>

                </div>


                <button type="button" class="jalan-add-button" onclick="openJalanModal('add')">

                    <i data-lucide="plus"></i>

                    Tambah Aset

                </button>

            </div>



            {{-- =====================================================
             FILTER
        ====================================================== --}}

            <div class="jalan-filter-row">

                {{-- SEARCH --}}
                <div class="jalan-search">

                    <i data-lucide="search"></i>

                    <input type="search" id="jalanSearch" placeholder="Cari kode, nama aset, lokasi, atau keterangan..."
                        aria-label="Cari data aset">

                </div>


                {{-- JENIS --}}
                <div class="jalan-select-field">

                    <select id="jalanJenis" aria-label="Filter jenis aset">

                        <option value="">
                            Semua Jenis Aset
                        </option>

                        <option value="Jalan">
                            Jalan
                        </option>

                        <option value="Jembatan">
                            Jembatan
                        </option>

                        <option value="Irigasi">
                            Irigasi
                        </option>

                        <option value="Jaringan">
                            Jaringan
                        </option>

                    </select>

                </div>


                {{-- LOKASI --}}
                <div class="jalan-select-field">

                    <select id="jalanLokasi" aria-label="Filter lokasi">

                        <option value="">
                            Semua Lokasi
                        </option>

                        <option value="IPA Gunung Lipan">
                            IPA Gunung Lipan
                        </option>

                        <option value="Jl. P. Antasari">
                            Jl. P. Antasari
                        </option>

                        <option value="IPA Sungai Kapih">
                            IPA Sungai Kapih
                        </option>

                        <option value="Reservoir Lempake">
                            Reservoir Lempake
                        </option>

                        <option value="Samarinda Seberang">
                            Samarinda Seberang
                        </option>

                        <option value="Palaran">
                            Palaran
                        </option>

                        <option value="Sungai Kapih">
                            Sungai Kapih
                        </option>

                        <option value="Loa Janan">
                            Loa Janan
                        </option>

                        <option value="Wilayah Kota">
                            Wilayah Kota
                        </option>

                        <option value="Sungai Karang Mumus">
                            Sungai Karang Mumus
                        </option>

                    </select>

                </div>


                {{-- KONDISI --}}
                <div class="jalan-select-field">

                    <select id="jalanKondisi" aria-label="Filter kondisi">

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
            <div class="jalan-filter-actions">

                <div>

                    <button type="button" class="jalan-secondary-button" onclick="filterJalanTable()">
                        <i data-lucide="list-filter"></i>
                        Filter Lainnya
                    </button>

                </div>


                <div>

                    <button type="button" class="jalan-secondary-button" onclick="resetJalanFilter()">
                        <i data-lucide="refresh-cw"></i>
                        Reset
                    </button>


                    <button type="button" class="jalan-secondary-button jalan-export-button" onclick="exportJalanCSV()">
                        <i data-lucide="download"></i>
                        Export
                    </button>

                </div>

            </div>



            {{-- =====================================================
             TABLE
        ====================================================== --}}

            <div class="jalan-table-scroll" tabindex="0" aria-label="Daftar aset Jalan, Irigasi dan Jaringan">

                <table class="jalan-table" id="jalanTable">

                    <thead>

                        <tr>

                            <th class="jalan-check-col">
                                <input type="checkbox" aria-label="Pilih semua">
                            </th>

                            <th>
                                No
                            </th>

                            <th>
                                Kode Aset
                            </th>

                            <th class="jalan-thumb-col">
                                Foto
                            </th>

                            <th>
                                Nama Aset
                            </th>

                            <th>
                                Jenis Aset
                            </th>

                            <th>
                                Panjang/Dimensi
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

                            <th class="jalan-action-col">
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>


                        {{-- =================================================
                         DATA 1
                    ================================================== --}}

                        <tr data-record data-jenis="Jalan" data-lokasi="IPA Gunung Lipan" data-kondisi="Baik">

                            <td>
                                <input type="checkbox" aria-label="Pilih aset Jalan Akses IPA Gunung Lipan">
                            </td>

                            <td>
                                1
                            </td>

                            <td class="jalan-code">
                                03.01.01.001
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td class="jalan-name">
                                Jalan Akses IPA Gunung Lipan
                            </td>

                            <td>
                                Jalan
                            </td>

                            <td>
                                1.250 m × 6 m
                            </td>

                            <td>
                                IPA Gunung Lipan
                            </td>

                            <td>
                                2021
                            </td>

                            <td>
                                Rp 8.750.000.000
                            </td>

                            <td>
                                Rp 5.600.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr data-record data-jenis="Jaringan" data-lokasi="Jl. P. Antasari" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                2
                            </td>

                            <td>
                                03.02.01.005
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Jaringan Pipa Distribusi Ø300
                            </td>

                            <td>
                                Jaringan
                            </td>

                            <td>
                                2.350 m
                            </td>

                            <td>
                                Jl. P. Antasari
                            </td>

                            <td>
                                2022
                            </td>

                            <td>
                                Rp 12.500.000.000
                            </td>

                            <td>
                                Rp 10.800.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr data-record data-jenis="Jaringan" data-lokasi="IPA Sungai Kapih" data-kondisi="Cukup">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                3
                            </td>

                            <td>
                                03.02.02.011
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Jaringan Pipa Transmisi Ø400
                            </td>

                            <td>
                                Jaringan
                            </td>

                            <td>
                                1.800 m
                            </td>

                            <td>
                                IPA Sungai Kapih
                            </td>

                            <td>
                                2020
                            </td>

                            <td>
                                Rp 18.200.000.000
                            </td>

                            <td>
                                Rp 11.900.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-fair">
                                    Cukup
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr data-record data-jenis="Irigasi" data-lokasi="Reservoir Lempake" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                4
                            </td>

                            <td>
                                03.03.01.018
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Saluran Irigasi Drainase
                            </td>

                            <td>
                                Irigasi
                            </td>

                            <td>
                                950 m
                            </td>

                            <td>
                                Reservoir Lempake
                            </td>

                            <td>
                                2021
                            </td>

                            <td>
                                Rp 6.400.000.000
                            </td>

                            <td>
                                Rp 4.850.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr data-record data-jenis="Jalan" data-lokasi="Samarinda Seberang" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                5
                            </td>

                            <td>
                                03.01.02.021
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Jalan Lingkungan Zona Distribusi
                            </td>

                            <td>
                                Jalan
                            </td>

                            <td>
                                2.100 m × 5 m
                            </td>

                            <td>
                                Samarinda Seberang
                            </td>

                            <td>
                                2023
                            </td>

                            <td>
                                Rp 10.750.000.000
                            </td>

                            <td>
                                Rp 9.100.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr data-record data-jenis="Jaringan" data-lokasi="Palaran" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                6
                            </td>

                            <td>
                                03.02.03.025
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Jaringan Pipa Sekunder Ø200
                            </td>

                            <td>
                                Jaringan
                            </td>

                            <td>
                                3.600 m
                            </td>

                            <td>
                                Palaran
                            </td>

                            <td>
                                2022
                            </td>

                            <td>
                                Rp 14.800.000.000
                            </td>

                            <td>
                                Rp 11.200.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr data-record data-jenis="Jaringan" data-lokasi="Sungai Kapih" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                7
                            </td>

                            <td>
                                03.02.04.028
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Jaringan Pipa Tersier Ø110
                            </td>

                            <td>
                                Jaringan
                            </td>

                            <td>
                                4.250 m
                            </td>

                            <td>
                                Sungai Kapih
                            </td>

                            <td>
                                2023
                            </td>

                            <td>
                                Rp 9.600.000.000
                            </td>

                            <td>
                                Rp 8.700.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr data-record data-jenis="Irigasi" data-lokasi="Loa Janan" data-kondisi="Rusak">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                8
                            </td>

                            <td>
                                03.03.02.031
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Saluran Pembuang (Buang Air)
                            </td>

                            <td>
                                Irigasi
                            </td>

                            <td>
                                680 m
                            </td>

                            <td>
                                Loa Janan
                            </td>

                            <td>
                                2020
                            </td>

                            <td>
                                Rp 5.200.000.000
                            </td>

                            <td>
                                Rp 3.100.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-bad">
                                    Rusak
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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



                        {{-- DATA 9 --}}
                        <tr data-record data-jenis="Jaringan" data-lokasi="Wilayah Kota" data-kondisi="Baik">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                9
                            </td>

                            <td>
                                03.02.05.034
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Jaringan Kabel SCADA
                            </td>

                            <td>
                                Jaringan
                            </td>

                            <td>
                                5.800 m
                            </td>

                            <td>
                                Wilayah Kota
                            </td>

                            <td>
                                2024
                            </td>

                            <td>
                                Rp 4.750.000.000
                            </td>

                            <td>
                                Rp 4.300.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-good">
                                    Baik
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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



                        {{-- DATA 10 --}}
                        <tr data-record data-jenis="Jaringan" data-lokasi="Sungai Karang Mumus" data-kondisi="Cukup">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>
                                10
                            </td>

                            <td>
                                03.01.03.040
                            </td>

                            <td>
                                <div class="jalan-thumb">
                                    <i data-lucide="image"></i>
                                </div>
                            </td>

                            <td>
                                Jembatan Pipa Sungai Karang Mumus
                            </td>

                            <td>
                                Jaringan
                            </td>

                            <td>
                                120 m
                            </td>

                            <td>
                                Sungai Karang Mumus
                            </td>

                            <td>
                                2021
                            </td>

                            <td>
                                Rp 7.900.000.000
                            </td>

                            <td>
                                Rp 5.600.000.000
                            </td>

                            <td>
                                <span class="jalan-status is-fair">
                                    Cukup
                                </span>
                            </td>

                            <td>

                                <div class="jalan-actions">

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
                        <tr id="jalanEmptyRow" hidden>

                            <td colspan="13" class="jalan-empty">
                                Tidak ada data yang sesuai dengan filter.
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>



            {{-- =====================================================
             FOOTER
        ====================================================== --}}

            <div class="jalan-table-footer">

                <div class="jalan-table-info" id="jalanTableInfo" role="status" aria-live="polite">
                    Menampilkan 1 - 10 dari 342 data
                </div>


                <div class="jalan-pagination-area">

                    <select id="jalanPageSize" aria-label="Jumlah data per halaman">

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


                    <nav class="jalan-pagination" id="jalanPagination"
                        aria-label="Pagination data Jalan, Irigasi dan Jaringan">
                    </nav>

                </div>

            </div>

        </section>



        {{-- =========================================================
         MODAL
    ========================================================== --}}

        <dialog class="jalan-modal" id="jalanModal">

            <div class="jalan-modal-dialog">

                {{-- HEADER --}}
                <div class="jalan-modal-header">

                    <div>

                        <h3 id="jalanModalTitle">
                            Tambah Aset
                        </h3>

                        <p id="jalanModalDescription">
                            Tambahkan data jalan, irigasi atau jaringan.
                        </p>

                    </div>


                    <button type="button" onclick="closeJalanModal()" aria-label="Tutup">
                        <i data-lucide="x"></i>
                    </button>

                </div>



                {{-- FORM --}}
                <form id="jalanForm">

                    <div class="jalan-modal-body">

                        <p class="jalan-modal-note" id="jalanModalNote">
                            Form UI contoh.
                            Penyimpanan database belum dihubungkan.
                        </p>


                        {{-- KODE --}}
                        <div class="jalan-form-group">

                            <label for="jalanCode">
                                Kode Aset
                            </label>

                            <input id="jalanCode" name="kode" type="text" placeholder="03.01.01.001" required>

                        </div>


                        {{-- NAMA --}}
                        <div class="jalan-form-group">

                            <label for="jalanName">
                                Nama Aset
                            </label>

                            <input id="jalanName" name="nama" type="text" placeholder="Masukkan nama aset"
                                required>

                        </div>


                        {{-- JENIS --}}
                        <div class="jalan-form-group">

                            <label for="jalanFormJenis">
                                Jenis Aset
                            </label>

                            <select id="jalanFormJenis" name="jenis" required>

                                <option value="Jalan">
                                    Jalan
                                </option>

                                <option value="Jembatan">
                                    Jembatan
                                </option>

                                <option value="Irigasi">
                                    Irigasi
                                </option>

                                <option value="Jaringan">
                                    Jaringan
                                </option>

                            </select>

                        </div>


                        {{-- DIMENSI --}}
                        <div class="jalan-form-group">

                            <label for="jalanDimensi">
                                Panjang / Dimensi
                            </label>

                            <input id="jalanDimensi" name="dimensi" type="text" placeholder="Contoh: 1.250 m × 6 m"
                                required>

                        </div>


                        {{-- LOKASI --}}
                        <div class="jalan-form-group">

                            <label for="jalanFormLokasi">
                                Lokasi
                            </label>

                            <input id="jalanFormLokasi" name="lokasi" type="text" placeholder="Masukkan lokasi aset"
                                required>

                        </div>


                        {{-- TAHUN --}}
                        <div class="jalan-form-group">

                            <label for="jalanFormTahun">
                                Tahun Perolehan
                            </label>

                            <input id="jalanFormTahun" name="tahun" type="text" placeholder="2024" required>

                        </div>


                        {{-- NILAI PEROLEHAN --}}
                        <div class="jalan-form-group">

                            <label for="jalanPerolehan">
                                Nilai Perolehan
                            </label>

                            <input id="jalanPerolehan" name="perolehan" type="text" placeholder="Rp 0" required>

                        </div>


                        {{-- NILAI BUKU --}}
                        <div class="jalan-form-group">

                            <label for="jalanBuku">
                                Nilai Buku
                            </label>

                            <input id="jalanBuku" name="buku" type="text" placeholder="Rp 0" required>

                        </div>


                        {{-- KONDISI --}}
                        <div class="jalan-form-group">

                            <label for="jalanFormKondisi">
                                Kondisi
                            </label>

                            <select id="jalanFormKondisi" name="kondisi" required>

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



                    {{-- FOOTER --}}
                    <div class="jalan-modal-footer">

                        <button type="button" class="jalan-cancel-button" onclick="closeJalanModal()">
                            Batal
                        </button>


                        <button type="submit" class="jalan-save-button" id="jalanSaveButton">
                            Simpan Aset
                        </button>

                    </div>

                </form>

            </div>

        </dialog>

    </section>


    @push('scripts')
        <script src="{{ asset('js/pages/kib/jalan.js') }}"></script>
    @endpush

@endsection
