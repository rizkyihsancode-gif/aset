@extends('layouts.main')

@section('title', 'Arsip')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/arsip.css') }}">
@endpush


@section('content')

    <section class="content arsip-page">


        {{-- ============================================================
         PAGE HEADER
    ============================================================= --}}
        <div class="arsip-page-header">

            <div class="arsip-heading">

                <span class="arsip-eyebrow">
                    Document Management
                </span>

                <h1>
                    Arsip Aset
                </h1>

                <p>
                    Kelola dokumentasi aset, lokasi penyimpanan fisik,
                    retensi, dan riwayat arsip perusahaan secara rapi
                    dan terstruktur.
                </p>

            </div>


            <div class="arsip-header-actions">


                {{-- DATE --}}
                <div class="arsip-date-card">

                    <div class="arsip-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>

                        <strong id="arsipCurrentDate">
                            Kamis, 24 September 2026
                        </strong>

                        <span id="arsipCurrentTime">
                            12:30 WIB
                        </span>

                    </div>

                </div>


                {{-- ADD --}}
                <button type="button" class="arsip-add-button">

                    <i data-lucide="plus"></i>

                    <span>
                        Tambah Arsip
                    </span>

                </button>

            </div>

        </div>



        {{-- ============================================================
         KPI
    ============================================================= --}}
        <div class="arsip-kpi-grid">


            {{-- TOTAL ARSIP --}}
            <div class="arsip-kpi-card">

                <div class="arsip-kpi-icon blue">
                    <i data-lucide="file-text"></i>
                </div>


                <div class="arsip-kpi-content">

                    <span>
                        Total Arsip
                    </span>

                    <strong>
                        4.825
                    </strong>

                    <small class="positive">

                        <i data-lucide="arrow-up"></i>

                        +8,2% dari tahun lalu

                    </small>

                </div>


                <div class="arsip-kpi-decoration line-blue">

                    <svg viewBox="0 0 100 45">

                        <polyline points="2,38 16,20 30,12 46,16 60,28 74,25 88,10 98,2" />

                    </svg>

                </div>

            </div>



            {{-- GEDUNG --}}
            <div class="arsip-kpi-card">

                <div class="arsip-kpi-icon blue">
                    <i data-lucide="building-2"></i>
                </div>


                <div class="arsip-kpi-content">

                    <span>
                        Gedung
                    </span>

                    <strong>
                        12
                    </strong>

                    <small class="positive">

                        <i data-lucide="arrow-up"></i>

                        +0% dari tahun lalu

                    </small>

                </div>


                <div class="arsip-kpi-watermark">

                    <i data-lucide="building-2"></i>

                </div>

            </div>



            {{-- FILLING / RAK --}}
            <div class="arsip-kpi-card">

                <div class="arsip-kpi-icon purple">
                    <i data-lucide="archive"></i>
                </div>


                <div class="arsip-kpi-content">

                    <span>
                        Filling / Rak
                    </span>

                    <strong>
                        48 / 126
                    </strong>

                    <small class="positive">

                        <i data-lucide="arrow-up"></i>

                        +3,1% dari tahun lalu

                    </small>

                </div>


                <div class="arsip-kpi-watermark purple">

                    <i data-lucide="layout-grid"></i>

                </div>

            </div>



            {{-- RETENSI --}}
            <div class="arsip-kpi-card">

                <div class="arsip-kpi-icon orange">
                    <i data-lucide="clock-3"></i>
                </div>


                <div class="arsip-kpi-content">

                    <span>
                        Retensi Mendekati Akhir
                    </span>

                    <strong>
                        18
                    </strong>

                    <small class="danger">

                        <i data-lucide="arrow-up"></i>

                        +5 dokumen dari bulan lalu

                    </small>

                </div>


                <div class="arsip-retention-bars">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        </div>



        {{-- ============================================================
         WORKSPACE
    ============================================================= --}}
        <div class="arsip-workspace">


            {{-- ========================================================
             LEFT
        ========================================================= --}}
            <div class="arsip-main-column">


                {{-- ====================================================
                 STORAGE LOCATION
            ===================================================== --}}
                <div class="arsip-card arsip-storage-card">


                    <div class="arsip-section-header">

                        <div>

                            <h3>
                                Lokasi Penyimpanan
                            </h3>

                            <p>
                                Struktur lokasi penyimpanan arsip fisik di perusahaan.
                                Pilih lokasi untuk melihat daftar dokumen.
                            </p>

                        </div>

                    </div>



                    <div class="arsip-storage-content">


                        {{-- FLOW --}}
                        <div class="storage-flow">


                            <button type="button" class="storage-node active">

                                <div class="storage-node-icon">
                                    <i data-lucide="building-2"></i>
                                </div>

                                <div>

                                    <strong>
                                        Kantor Pusat
                                    </strong>

                                    <span>
                                        Gedung
                                    </span>

                                </div>

                            </button>


                            <i class="storage-chevron" data-lucide="chevron-right"></i>



                            <button type="button" class="storage-node">

                                <div class="storage-node-icon">
                                    <i data-lucide="archive"></i>
                                </div>

                                <div>

                                    <strong>
                                        Filling A
                                    </strong>

                                    <span>
                                        Filling
                                    </span>

                                </div>

                            </button>


                            <i class="storage-chevron" data-lucide="chevron-right"></i>



                            <button type="button" class="storage-node">

                                <div class="storage-node-icon">
                                    <i data-lucide="boxes"></i>
                                </div>

                                <div>

                                    <strong>
                                        Rak 03
                                    </strong>

                                    <span>
                                        Rak
                                    </span>

                                </div>

                            </button>


                            <i class="storage-chevron" data-lucide="chevron-right"></i>



                            <button type="button" class="storage-node">

                                <div class="storage-node-icon">
                                    <i data-lucide="grid-2x2"></i>
                                </div>

                                <div>

                                    <strong>
                                        Baris 02
                                    </strong>

                                    <span>
                                        Baris
                                    </span>

                                </div>

                            </button>

                        </div>



                        {{-- OTHER LOCATION --}}
                        <div class="storage-other">

                            <h4>
                                Lokasi Lainnya
                            </h4>


                            <div class="storage-location-chips">

                                <button type="button">

                                    <i data-lucide="building-2"></i>

                                    Kantor Pusat

                                </button>


                                <button type="button">

                                    <i data-lucide="building-2"></i>

                                    IPA Kota

                                </button>


                                <button type="button">

                                    <i data-lucide="building-2"></i>

                                    IPA Gunung Lipan

                                </button>


                                <button type="button">

                                    <i data-lucide="building-2"></i>

                                    Lab Kualitas Air

                                </button>


                                <button type="button">

                                    <i data-lucide="building-2"></i>

                                    Gudang

                                </button>


                                <button type="button">

                                    <i data-lucide="building-2"></i>

                                    Kantor Cabang

                                </button>

                            </div>

                        </div>


                    </div>

                </div>



                {{-- ====================================================
                 FILTER
            ===================================================== --}}
                <div class="arsip-card arsip-filter-card">


                    <div class="arsip-filter-title">

                        <h3>
                            Filter Dokumen Arsip
                        </h3>

                    </div>



                    <div class="arsip-filter-grid">


                        {{-- SEARCH --}}
                        <div class="arsip-filter-group arsip-search-group">

                            <label>
                                Pencarian
                            </label>


                            <div class="arsip-search-input">

                                <i data-lucide="search"></i>

                                <input type="text" id="arsipSearch"
                                    placeholder="Cari judul, register, atau kata kunci...">

                            </div>

                        </div>



                        {{-- GEDUNG --}}
                        <div class="arsip-filter-group">

                            <label>
                                Gedung
                            </label>

                            <select id="arsipGedung">

                                <option value="">
                                    Semua Gedung
                                </option>

                                <option>
                                    Kantor Pusat
                                </option>

                                <option>
                                    IPA Kota
                                </option>

                                <option>
                                    IPA Gunung Lipan
                                </option>

                            </select>

                        </div>



                        {{-- FILLING --}}
                        <div class="arsip-filter-group">

                            <label>
                                Filling
                            </label>

                            <select id="arsipFilling">

                                <option value="">
                                    Semua Filling
                                </option>

                                <option>
                                    Filling A
                                </option>

                                <option>
                                    Filling B
                                </option>

                                <option>
                                    Filling C
                                </option>

                            </select>

                        </div>



                        {{-- RAK --}}
                        <div class="arsip-filter-group">

                            <label>
                                Rak
                            </label>

                            <select id="arsipRak">

                                <option value="">
                                    Semua Rak
                                </option>

                                <option>
                                    Rak 01
                                </option>

                                <option>
                                    Rak 02
                                </option>

                                <option>
                                    Rak 03
                                </option>

                            </select>

                        </div>



                        {{-- TAHUN --}}
                        <div class="arsip-filter-group">

                            <label>
                                Tahun
                            </label>

                            <select id="arsipTahun">

                                <option value="">
                                    Semua Tahun
                                </option>

                                <option>
                                    2026
                                </option>

                                <option>
                                    2025
                                </option>

                                <option>
                                    2024
                                </option>

                                <option>
                                    2023
                                </option>

                            </select>

                        </div>



                        {{-- KONDISI --}}
                        <div class="arsip-filter-group">

                            <label>
                                Kondisi
                            </label>

                            <select id="arsipKondisi">

                                <option value="">
                                    Semua Kondisi
                                </option>

                                <option>
                                    Baik
                                </option>

                                <option>
                                    Mendekati Retensi
                                </option>

                                <option>
                                    Perlu Review
                                </option>

                            </select>

                        </div>



                        {{-- BUTTON --}}
                        <div class="arsip-filter-actions">


                            <button type="button" class="arsip-filter-button">

                                <i data-lucide="list-filter"></i>

                                Filter

                            </button>


                            <button type="button" class="arsip-reset-button" onclick="resetArsipFilter()">

                                <i data-lucide="refresh-cw"></i>

                                Reset

                            </button>

                        </div>


                    </div>

                </div>



                {{-- ====================================================
                 TABLE
            ===================================================== --}}
                <div class="arsip-card arsip-table-card">


                    <div class="arsip-table-header">

                        <h3>
                            Daftar Dokumen Arsip
                        </h3>


                        <button type="button" class="arsip-export-button">

                            <i data-lucide="download"></i>

                            Ekspor

                            <i data-lucide="chevron-down"></i>

                        </button>

                    </div>



                    <div class="table-responsive">

                        <table class="arsip-table">


                            <thead>

                                <tr>

                                    <th>No</th>

                                    <th>Dokumen</th>

                                    <th>Register</th>

                                    <th>Penyimpanan</th>

                                    <th>Tahun</th>

                                    <th>Retensi</th>

                                    <th>Kondisi</th>

                                    <th class="action-column">
                                        Aksi
                                    </th>

                                </tr>

                            </thead>



                            <tbody>


                                {{-- ROW 1 --}}
                                <tr class="arsip-data-row selected" data-title="Sertifikat Tanah IPA Gunung Lipan"
                                    data-code="AR-2023-001" data-register="REG-TNH-2020-045" data-vendor="BPN Kabupaten"
                                    data-year="2020" data-value="Rp 12.500.000.000" data-status="Baik"
                                    data-status-class="good" data-building="Kantor Pusat" data-filling="Filling A"
                                    data-rack="Rak 03" data-row="Baris 02" data-retention="10 Tahun"
                                    data-expiry="15 Mar 2030" data-remaining="4 tahun 3 bulan">

                                    <td>
                                        1
                                    </td>

                                    <td>
                                        <strong class="arsip-doc-title">
                                            Sertifikat Tanah IPA Gunung Lipan
                                        </strong>
                                    </td>

                                    <td>
                                        AR-2023-001
                                    </td>

                                    <td>
                                        Kantor Pusat / Filling A / Rak 03 / Baris 02
                                    </td>

                                    <td>
                                        2020
                                    </td>

                                    <td>
                                        10 Tahun
                                        <span class="table-sub">
                                            2030
                                        </span>
                                    </td>

                                    <td>

                                        <span class="arsip-status good">

                                            <span></span>

                                            Baik

                                        </span>

                                    </td>

                                    <td>

                                        <div class="arsip-row-actions">

                                            <button type="button" class="view" title="Lihat"
                                                onclick="selectArsipRow(this)">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="edit" title="Edit">
                                                <i data-lucide="square-pen"></i>
                                            </button>

                                            <button type="button" class="download" title="Download">
                                                <i data-lucide="download"></i>
                                            </button>

                                        </div>

                                    </td>

                                </tr>



                                {{-- ROW 2 --}}
                                <tr class="arsip-data-row" data-title="BAST Pompa Distribusi" data-code="AR-2023-002"
                                    data-register="REG-MSN-2022-018" data-vendor="PT Tirta Engineering" data-year="2022"
                                    data-value="Rp 2.850.000.000" data-status="Mendekati Retensi"
                                    data-status-class="warning" data-building="IPA Kota" data-filling="Filling B"
                                    data-rack="Rak 01" data-row="Baris 01" data-retention="5 Tahun"
                                    data-expiry="18 Jan 2027" data-remaining="4 bulan">

                                    <td>2</td>

                                    <td>
                                        <strong class="arsip-doc-title">
                                            BAST Pompa Distribusi
                                        </strong>
                                    </td>

                                    <td>
                                        AR-2023-002
                                    </td>

                                    <td>
                                        IPA Kota / Filling B / Rak 01 / Baris 01
                                    </td>

                                    <td>
                                        2022
                                    </td>

                                    <td>
                                        5 Tahun
                                        <span class="table-sub">
                                            2027
                                        </span>
                                    </td>

                                    <td>

                                        <span class="arsip-status warning">

                                            <span></span>

                                            Mendekati Retensi

                                        </span>

                                    </td>

                                    <td>

                                        <div class="arsip-row-actions">

                                            <button type="button" class="view" onclick="selectArsipRow(this)">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="edit">
                                                <i data-lucide="square-pen"></i>
                                            </button>

                                            <button type="button" class="download">
                                                <i data-lucide="download"></i>
                                            </button>

                                        </div>

                                    </td>

                                </tr>



                                {{-- ROW 3 --}}
                                <tr class="arsip-data-row" data-title="Dokumen Pengadaan Kendaraan"
                                    data-code="AR-2024-015" data-register="REG-KDR-2024-011"
                                    data-vendor="PT Mitra Otomotif" data-year="2024" data-value="Rp 650.000.000"
                                    data-status="Lengkap" data-status-class="good" data-building="Kantor Pusat"
                                    data-filling="Filling A" data-rack="Rak 02" data-row="Baris 01"
                                    data-retention="5 Tahun" data-expiry="22 Feb 2029" data-remaining="2 tahun 5 bulan">

                                    <td>3</td>

                                    <td>
                                        <strong class="arsip-doc-title">
                                            Dokumen Pengadaan Kendaraan
                                        </strong>
                                    </td>

                                    <td>
                                        AR-2024-015
                                    </td>

                                    <td>
                                        Kantor Pusat / Filling A / Rak 02 / Baris 01
                                    </td>

                                    <td>
                                        2024
                                    </td>

                                    <td>
                                        5 Tahun
                                        <span class="table-sub">
                                            2029
                                        </span>
                                    </td>

                                    <td>

                                        <span class="arsip-status good">

                                            <span></span>

                                            Lengkap

                                        </span>

                                    </td>

                                    <td>

                                        <div class="arsip-row-actions">

                                            <button type="button" class="view" onclick="selectArsipRow(this)">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="edit">
                                                <i data-lucide="square-pen"></i>
                                            </button>

                                            <button type="button" class="download">
                                                <i data-lucide="download"></i>
                                            </button>

                                        </div>

                                    </td>

                                </tr>



                                {{-- ROW 4 --}}
                                <tr class="arsip-data-row" data-title="Gambar Teknis Gedung Kantor"
                                    data-code="AR-2022-078" data-register="REG-GDG-2019-008"
                                    data-vendor="Konsultan Perencana" data-year="2019" data-value="Rp 8.250.000.000"
                                    data-status="Perlu Review" data-status-class="warning" data-building="Kantor Pusat"
                                    data-filling="Filling C" data-rack="Rak 05" data-row="Baris 03"
                                    data-retention="10 Tahun" data-expiry="12 Jul 2029"
                                    data-remaining="2 tahun 10 bulan">

                                    <td>4</td>

                                    <td>
                                        <strong class="arsip-doc-title">
                                            Gambar Teknis Gedung Kantor
                                        </strong>
                                    </td>

                                    <td>
                                        AR-2022-078
                                    </td>

                                    <td>
                                        Kantor Pusat / Filling C / Rak 05 / Baris 03
                                    </td>

                                    <td>
                                        2019
                                    </td>

                                    <td>
                                        10 Tahun
                                        <span class="table-sub">
                                            2029
                                        </span>
                                    </td>

                                    <td>

                                        <span class="arsip-status warning">

                                            <span></span>

                                            Perlu Review

                                        </span>

                                    </td>

                                    <td>

                                        <div class="arsip-row-actions">

                                            <button type="button" class="view" onclick="selectArsipRow(this)">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="edit">
                                                <i data-lucide="square-pen"></i>
                                            </button>

                                            <button type="button" class="download">
                                                <i data-lucide="download"></i>
                                            </button>

                                        </div>

                                    </td>

                                </tr>



                                {{-- ROW 5 --}}
                                <tr class="arsip-data-row" data-title="Berkas Mesin Pompa Intake" data-code="AR-2023-102"
                                    data-register="REG-MSN-2021-043" data-vendor="PT Pompa Nusantara" data-year="2021"
                                    data-value="Rp 3.175.000.000" data-status="Baik" data-status-class="good"
                                    data-building="IPA Gunung Lipan" data-filling="Filling A" data-rack="Rak 01"
                                    data-row="Baris 02" data-retention="10 Tahun" data-expiry="18 Mei 2031"
                                    data-remaining="4 tahun 8 bulan">

                                    <td>5</td>

                                    <td>
                                        <strong class="arsip-doc-title">
                                            Berkas Mesin Pompa Intake
                                        </strong>
                                    </td>

                                    <td>
                                        AR-2023-102
                                    </td>

                                    <td>
                                        IPA Gunung Lipan / Filling A / Rak 01 / Baris 02
                                    </td>

                                    <td>
                                        2021
                                    </td>

                                    <td>
                                        10 Tahun
                                        <span class="table-sub">
                                            2031
                                        </span>
                                    </td>

                                    <td>

                                        <span class="arsip-status good">

                                            <span></span>

                                            Baik

                                        </span>

                                    </td>

                                    <td>

                                        <div class="arsip-row-actions">

                                            <button type="button" class="view" onclick="selectArsipRow(this)">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="edit">
                                                <i data-lucide="square-pen"></i>
                                            </button>

                                            <button type="button" class="download">
                                                <i data-lucide="download"></i>
                                            </button>

                                        </div>

                                    </td>

                                </tr>


                            </tbody>

                        </table>

                    </div>



                    {{-- TABLE FOOTER --}}
                    <div class="arsip-table-footer">


                        <div class="arsip-table-info">

                            Menampilkan

                            <strong>
                                1 - 5
                            </strong>

                            dari

                            <strong>
                                4.825
                            </strong>

                            dokumen

                        </div>



                        <div class="arsip-pagination-area">


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



                            <div class="arsip-pagination">


                                <button disabled>

                                    <i data-lucide="chevrons-left"></i>

                                </button>


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
                                    966
                                </button>


                                <button>

                                    <i data-lucide="chevron-right"></i>

                                </button>


                            </div>


                        </div>

                    </div>


                </div>


            </div>



            {{-- ========================================================
             DETAIL PANEL
        ========================================================= --}}
            <aside class="arsip-card arsip-detail-card" id="arsipDetailCard">


                <div class="arsip-detail-header">

                    <h3>
                        Detail Arsip
                    </h3>


                    <button type="button" class="arsip-detail-close" onclick="closeArsipDetail()" title="Tutup">

                        <i data-lucide="x"></i>

                    </button>

                </div>



                {{-- DOCUMENT --}}
                <div class="arsip-detail-document">

                    <div class="arsip-detail-file-icon">

                        <i data-lucide="file-text"></i>

                    </div>


                    <div class="arsip-detail-file-title">

                        <strong id="detailTitle">
                            Sertifikat Tanah IPA Gunung Lipan
                        </strong>

                    </div>


                    <span class="arsip-detail-status good" id="detailStatus">

                        <span></span>

                        Baik

                    </span>

                </div>



                {{-- INFORMATION --}}
                <div class="detail-section">


                    <div class="detail-section-heading">

                        <i data-lucide="info"></i>

                        Informasi Dokumen

                    </div>


                    <div class="detail-data-list">


                        <div>

                            <span>
                                Kode Arsip
                            </span>

                            <strong id="detailCode">
                                AR-2023-001
                            </strong>

                        </div>


                        <div>

                            <span>
                                Judul Dokumen
                            </span>

                            <strong id="detailDocumentTitle">
                                Sertifikat Tanah IPA Gunung Lipan
                            </strong>

                        </div>


                        <div>

                            <span>
                                Status Dokumen
                            </span>

                            <strong class="detail-inline-status good" id="detailInlineStatus">
                                Baik
                            </strong>

                        </div>


                        <div>

                            <span>
                                Nomor Register
                            </span>

                            <strong id="detailRegister">
                                REG-TNH-2020-045
                            </strong>

                        </div>


                        <div>

                            <span>
                                Vendor / Sumber
                            </span>

                            <strong id="detailVendor">
                                BPN Kabupaten
                            </strong>

                        </div>


                        <div>

                            <span>
                                Tahun Dokumen
                            </span>

                            <strong id="detailYear">
                                2020
                            </strong>

                        </div>


                        <div>

                            <span>
                                Nilai Aset
                            </span>

                            <strong id="detailValue">
                                Rp 12.500.000.000
                            </strong>

                        </div>


                    </div>

                </div>



                {{-- LOCATION --}}
                <div class="detail-section">


                    <div class="detail-section-heading">

                        <i data-lucide="map-pin"></i>

                        Lokasi Penyimpanan

                    </div>


                    <div class="detail-location-list">


                        <div>

                            <i data-lucide="building-2"></i>

                            <span>
                                Gedung
                            </span>

                            <strong id="detailBuilding">
                                Kantor Pusat
                            </strong>

                        </div>


                        <div>

                            <i data-lucide="archive"></i>

                            <span>
                                Filling
                            </span>

                            <strong id="detailFilling">
                                Filling A
                            </strong>

                        </div>


                        <div>

                            <i data-lucide="boxes"></i>

                            <span>
                                Rak
                            </span>

                            <strong id="detailRack">
                                Rak 03
                            </strong>

                        </div>


                        <div>

                            <i data-lucide="grid-2x2"></i>

                            <span>
                                Baris
                            </span>

                            <strong id="detailRow">
                                Baris 02
                            </strong>

                        </div>


                    </div>

                </div>



                {{-- RETENTION --}}
                <div class="detail-section">


                    <div class="detail-section-heading">

                        <i data-lucide="clock-3"></i>

                        Informasi Retensi

                    </div>


                    <div class="detail-retention-list">


                        <div>

                            <i data-lucide="clock-3"></i>

                            <span>
                                Masa Retensi
                            </span>

                            <strong id="detailRetention">
                                10 Tahun
                            </strong>

                        </div>


                        <div>

                            <i data-lucide="calendar-clock"></i>

                            <span>
                                Tanggal Berakhir
                            </span>

                            <strong id="detailExpiry">
                                15 Mar 2030
                            </strong>

                        </div>


                        <div>

                            <i data-lucide="sparkles"></i>

                            <span>
                                Sisa Waktu
                            </span>

                            <strong class="remaining" id="detailRemaining">
                                4 tahun 3 bulan
                            </strong>

                        </div>


                    </div>

                </div>



                {{-- ACTION --}}
                <div class="arsip-detail-actions">


                    <button type="button" class="detail-view-button">

                        <i data-lucide="eye"></i>

                        Lihat Dokumen

                    </button>


                    <button type="button" class="detail-download-button">

                        <i data-lucide="download"></i>

                        Download

                    </button>


                </div>


            </aside>


        </div>


    </section>

@endsection



@push('scripts')
    <script src="{{ asset('js/pages/arsip.js') }}"></script>
@endpush
