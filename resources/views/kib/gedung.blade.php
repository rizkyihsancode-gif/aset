@extends('layouts.main')

@section('content')
    <link rel="stylesheet" href="{{ asset('css/pages/kib/gedung.css') }}">

    <section class="content gedung-page">

        {{-- =====================================================
        HERO
    ====================================================== --}}
        <section class="gedung-hero">

            <div class="gedung-hero-overlay"></div>

            <div class="gedung-hero-inner">

                {{-- Breadcrumb --}}
                <div class="gedung-breadcrumb">

                    <a href="{{ route('dashboard') }}">
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>

                    <span>K.I.B</span>

                    <i data-lucide="chevron-right"></i>

                    <strong>Gedung & Bangunan</strong>

                </div>


                {{-- Heading --}}
                <div class="gedung-heading">

                    <div>

                        <h1>Gedung & Bangunan</h1>

                        <p>
                            Kelola data aset tetap berupa gedung dan bangunan
                            milik Perumda Tirta Kencana Kota Samarinda.
                        </p>

                    </div>

                </div>


                {{-- KPI --}}
                <div class="gedung-kpi-grid">

                    <div class="gedung-kpi-card">

                        <div class="gedung-kpi-icon blue">
                            <i data-lucide="building-2"></i>
                        </div>

                        <div class="gedung-kpi-content">

                            <span>Total Gedung</span>

                            <strong id="totalGedung">
                                38
                            </strong>

                            <small>
                                seluruh aset gedung
                            </small>

                        </div>

                    </div>


                    <div class="gedung-kpi-card">

                        <div class="gedung-kpi-icon green">
                            <i data-lucide="circle-check"></i>
                        </div>

                        <div class="gedung-kpi-content">

                            <span>Kondisi Baik</span>

                            <strong>
                                29
                            </strong>

                            <small>
                                76,3% dari total aset
                            </small>

                        </div>

                    </div>


                    <div class="gedung-kpi-card">

                        <div class="gedung-kpi-icon yellow">
                            <i data-lucide="triangle-alert"></i>
                        </div>

                        <div class="gedung-kpi-content">

                            <span>Perlu Perhatian</span>

                            <strong>
                                7
                            </strong>

                            <small>
                                kondisi sedang
                            </small>

                        </div>

                    </div>


                    <div class="gedung-kpi-card">

                        <div class="gedung-kpi-icon red">
                            <i data-lucide="circle-x"></i>
                        </div>

                        <div class="gedung-kpi-content">

                            <span>Kondisi Rusak</span>

                            <strong>
                                2
                            </strong>

                            <small>
                                perlu tindak lanjut
                            </small>

                        </div>

                    </div>

                </div>

            </div>

        </section>


        {{-- =====================================================
        MAIN CARD
    ====================================================== --}}
        <section class="gedung-card">

            {{-- Header --}}
            <div class="gedung-card-header">

                <div>

                    <h2>
                        Daftar Gedung & Bangunan
                    </h2>

                    <p>
                        Data aset tetap gedung dan bangunan
                    </p>

                </div>


                <button type="button" class="gedung-add-btn" onclick="openGedungModal('add')">

                    <i data-lucide="plus"></i>

                    Tambah Gedung

                </button>

            </div>


            {{-- =================================================
            FILTER
        ================================================== --}}
            <div class="gedung-filter">

                {{-- Search --}}
                <div class="gedung-search">

                    <i data-lucide="search"></i>

                    <input type="search" id="gedungSearch" placeholder="Cari kode, nama gedung, register, atau lokasi..."
                        autocomplete="off">

                </div>


                {{-- Kondisi --}}
                <select id="gedungKondisi">

                    <option value="">
                        Semua Kondisi
                    </option>

                    <option value="Baik">
                        Baik
                    </option>

                    <option value="Sedang">
                        Sedang
                    </option>

                    <option value="Rusak Berat">
                        Rusak Berat
                    </option>

                </select>


                {{-- Tahun --}}
                <select id="gedungTahun">

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

                    <option value="2023">
                        2023
                    </option>

                    <option value="2022">
                        2022
                    </option>

                    <option value="2021">
                        2021
                    </option>

                </select>


                {{-- Lokasi --}}
                <select id="gedungLokasi">

                    <option value="">
                        Semua Lokasi
                    </option>

                    <option value="Kantor Pusat">
                        Kantor Pusat
                    </option>

                    <option value="IPA Gunung Lipan">
                        IPA Gunung Lipan
                    </option>

                    <option value="IPA Sungai Kapih">
                        IPA Sungai Kapih
                    </option>

                    <option value="Reservoir Lempake">
                        Reservoir Lempake
                    </option>

                    <option value="Gudang Material">
                        Gudang Material
                    </option>

                </select>


                <button type="button" class="gedung-filter-btn" onclick="resetGedungFilter()">

                    <i data-lucide="rotate-ccw"></i>

                    Reset

                </button>

            </div>


            {{-- =================================================
            TOOLBAR
        ================================================== --}}
            <div class="gedung-toolbar">

                <div class="gedung-toolbar-left">

                    <button type="button" class="gedung-tool-btn" onclick="toggleGedungAdvancedFilter()">

                        <i data-lucide="list-filter"></i>

                        Filter Lainnya

                    </button>

                </div>


                <div class="gedung-toolbar-right">

                    <button type="button" class="gedung-tool-btn" onclick="exportGedungCSV()">

                        <i data-lucide="download"></i>

                        Export CSV

                    </button>

                </div>

            </div>


            {{-- =================================================
            ADVANCED FILTER
        ================================================== --}}
            <div class="gedung-advanced-filter" id="gedungAdvancedFilter" hidden>

                <div>

                    <label>
                        Status Kepemilikan
                    </label>

                    <select id="gedungStatusTanah">

                        <option value="">
                            Semua Status
                        </option>

                        <option value="Milik Sendiri">
                            Milik Sendiri
                        </option>

                        <option value="Sewa">
                            Sewa
                        </option>

                        <option value="Pinjam Pakai">
                            Pinjam Pakai
                        </option>

                    </select>

                </div>


                <div>

                    <label>
                        Jenis Bangunan
                    </label>

                    <select id="gedungJenis">

                        <option value="">
                            Semua Jenis
                        </option>

                        <option value="Kantor">
                            Kantor
                        </option>

                        <option value="Instalasi">
                            Instalasi
                        </option>

                        <option value="Gudang">
                            Gudang
                        </option>

                        <option value="Reservoir">
                            Reservoir
                        </option>

                        <option value="Bangunan Pendukung">
                            Bangunan Pendukung
                        </option>

                    </select>

                </div>

            </div>


            {{-- =================================================
            TABLE
        ================================================== --}}
            <div class="gedung-table-wrapper" tabindex="0">

                <table class="gedung-table" id="gedungTable">

                    <thead>

                        <tr>

                            <th class="check-column">

                                <input type="checkbox" id="gedungSelectAll" aria-label="Pilih semua data">

                            </th>

                            <th>No</th>

                            <th>Kode Barang</th>

                            <th>Nama Gedung / Bangunan</th>

                            <th>Register</th>

                            <th>Jenis</th>

                            <th>Luas Bangunan</th>

                            <th>Tahun Perolehan</th>

                            <th>Lokasi</th>

                            <th>Kondisi</th>

                            <th>Nilai Perolehan</th>

                            <th>Status Tanah</th>

                            <th>Aksi</th>

                        </tr>

                    </thead>


                    <tbody>


                        {{-- DATA 1 --}}
                        <tr data-record data-kondisi="Baik" data-tahun="2022" data-lokasi="Kantor Pusat"
                            data-status-tanah="Milik Sendiri" data-jenis="Kantor">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>1</td>

                            <td>1.3.1.01.001</td>

                            <td>
                                Gedung Kantor Pusat
                            </td>

                            <td>00001</td>

                            <td>Kantor</td>

                            <td>1.250 m²</td>

                            <td>2022</td>

                            <td>Kantor Pusat</td>

                            <td>
                                <span class="gedung-status baik">
                                    Baik
                                </span>
                            </td>

                            <td>
                                Rp 8.500.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr data-record data-kondisi="Baik" data-tahun="2021" data-lokasi="IPA Gunung Lipan"
                            data-status-tanah="Milik Sendiri" data-jenis="Instalasi">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>2</td>

                            <td>1.3.1.01.002</td>

                            <td>
                                Gedung Instalasi Pengolahan Air
                            </td>

                            <td>00002</td>

                            <td>Instalasi</td>

                            <td>980 m²</td>

                            <td>2021</td>

                            <td>IPA Gunung Lipan</td>

                            <td>
                                <span class="gedung-status baik">
                                    Baik
                                </span>
                            </td>

                            <td>
                                Rp 6.750.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr data-record data-kondisi="Sedang" data-tahun="2020" data-lokasi="Gudang Material"
                            data-status-tanah="Milik Sendiri" data-jenis="Gudang">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>3</td>

                            <td>1.3.1.02.001</td>

                            <td>
                                Gudang Material Utama
                            </td>

                            <td>00003</td>

                            <td>Gudang</td>

                            <td>650 m²</td>

                            <td>2020</td>

                            <td>Gudang Material</td>

                            <td>
                                <span class="gedung-status sedang">
                                    Sedang
                                </span>
                            </td>

                            <td>
                                Rp 3.250.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr data-record data-kondisi="Baik" data-tahun="2023" data-lokasi="Reservoir Lempake"
                            data-status-tanah="Milik Sendiri" data-jenis="Reservoir">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>4</td>

                            <td>1.3.1.03.001</td>

                            <td>
                                Bangunan Reservoir Lempake
                            </td>

                            <td>00004</td>

                            <td>Reservoir</td>

                            <td>420 m²</td>

                            <td>2023</td>

                            <td>Reservoir Lempake</td>

                            <td>
                                <span class="gedung-status baik">
                                    Baik
                                </span>
                            </td>

                            <td>
                                Rp 4.850.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr data-record data-kondisi="Sedang" data-tahun="2019" data-lokasi="IPA Sungai Kapih"
                            data-status-tanah="Milik Sendiri" data-jenis="Instalasi">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>5</td>

                            <td>1.3.1.01.003</td>

                            <td>
                                Bangunan Operasional IPA
                            </td>

                            <td>00005</td>

                            <td>Instalasi</td>

                            <td>760 m²</td>

                            <td>2019</td>

                            <td>IPA Sungai Kapih</td>

                            <td>
                                <span class="gedung-status sedang">
                                    Sedang
                                </span>
                            </td>

                            <td>
                                Rp 5.125.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr data-record data-kondisi="Baik" data-tahun="2024" data-lokasi="Kantor Pusat"
                            data-status-tanah="Milik Sendiri" data-jenis="Bangunan Pendukung">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>6</td>

                            <td>1.3.1.04.001</td>

                            <td>
                                Gedung Arsip
                            </td>

                            <td>00006</td>

                            <td>Bangunan Pendukung</td>

                            <td>315 m²</td>

                            <td>2024</td>

                            <td>Kantor Pusat</td>

                            <td>
                                <span class="gedung-status baik">
                                    Baik
                                </span>
                            </td>

                            <td>
                                Rp 2.850.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr data-record data-kondisi="Rusak Berat" data-tahun="2018" data-lokasi="Gudang Material"
                            data-status-tanah="Milik Sendiri" data-jenis="Gudang">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>7</td>

                            <td>1.3.1.02.002</td>

                            <td>
                                Gudang Suku Cadang Lama
                            </td>

                            <td>00007</td>

                            <td>Gudang</td>

                            <td>380 m²</td>

                            <td>2018</td>

                            <td>Gudang Material</td>

                            <td>
                                <span class="gedung-status rusak">
                                    Rusak Berat
                                </span>
                            </td>

                            <td>
                                Rp 1.650.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr data-record data-kondisi="Baik" data-tahun="2025" data-lokasi="Kantor Pusat"
                            data-status-tanah="Milik Sendiri" data-jenis="Bangunan Pendukung">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>8</td>

                            <td>1.3.1.04.002</td>

                            <td>
                                Pos Keamanan Kantor Pusat
                            </td>

                            <td>00008</td>

                            <td>Bangunan Pendukung</td>

                            <td>85 m²</td>

                            <td>2025</td>

                            <td>Kantor Pusat</td>

                            <td>
                                <span class="gedung-status baik">
                                    Baik
                                </span>
                            </td>

                            <td>
                                Rp 650.000.000
                            </td>

                            <td>
                                Milik Sendiri
                            </td>

                            <td>

                                <div class="gedung-actions">

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
                        <tr id="gedungEmptyRow" hidden>

                            <td colspan="13" class="gedung-empty">

                                <i data-lucide="database-zap"></i>

                                <strong>
                                    Data tidak ditemukan
                                </strong>

                                <span>
                                    Tidak ada gedung atau bangunan yang
                                    sesuai dengan filter.
                                </span>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


            {{-- =================================================
            FOOTER
        ================================================== --}}
            <div class="gedung-footer">

                <div class="gedung-info" id="gedungTableInfo">
                    Menampilkan 1 - 8 dari 38 data
                </div>


                <div class="gedung-pagination-area">

                    <select id="gedungPageSize">

                        <option value="8">
                            8
                        </option>

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


                    <div class="gedung-pagination" id="gedungPagination"></div>

                </div>

            </div>

        </section>


        {{-- =====================================================
        MODAL
    ====================================================== --}}
        <dialog class="gedung-modal" id="gedungModal">

            <div class="gedung-modal-dialog">

                <div class="gedung-modal-header">

                    <div>

                        <h3 id="gedungModalTitle">
                            Tambah Gedung & Bangunan
                        </h3>

                        <p id="gedungModalDescription">
                            Tambahkan data aset gedung atau bangunan.
                        </p>

                    </div>


                    <button type="button" class="gedung-modal-close" onclick="closeGedungModal()">

                        <i data-lucide="x"></i>

                    </button>

                </div>


                <form id="gedungForm">

                    <div class="gedung-modal-body">

                        <div class="gedung-modal-note" id="gedungModalNote">
                            Form ini masih dalam tahap UI.
                            Penyimpanan database akan dihubungkan pada tahap backend.
                        </div>


                        {{-- Kode --}}
                        <div class="gedung-form-group">

                            <label for="gedungKode">
                                Kode Barang
                            </label>

                            <input type="text" id="gedungKode" placeholder="Contoh: 1.3.1.01.001" required>

                        </div>


                        {{-- Nama --}}
                        <div class="gedung-form-group">

                            <label for="gedungNama">
                                Nama Gedung / Bangunan
                            </label>

                            <input type="text" id="gedungNama" placeholder="Masukkan nama gedung" required>

                        </div>


                        {{-- Register --}}
                        <div class="gedung-form-group">

                            <label for="gedungRegister">
                                Register
                            </label>

                            <input type="text" id="gedungRegister" placeholder="Nomor register">

                        </div>


                        {{-- Jenis --}}
                        <div class="gedung-form-group">

                            <label for="gedungFormJenis">
                                Jenis Bangunan
                            </label>

                            <select id="gedungFormJenis">

                                <option>
                                    Kantor
                                </option>

                                <option>
                                    Instalasi
                                </option>

                                <option>
                                    Gudang
                                </option>

                                <option>
                                    Reservoir
                                </option>

                                <option>
                                    Bangunan Pendukung
                                </option>

                            </select>

                        </div>


                        {{-- Luas --}}
                        <div class="gedung-form-group">

                            <label for="gedungLuas">
                                Luas Bangunan
                            </label>

                            <input type="text" id="gedungLuas" placeholder="Contoh: 1.250 m²">

                        </div>


                        {{-- Tahun --}}
                        <div class="gedung-form-group">

                            <label for="gedungFormTahun">
                                Tahun Perolehan
                            </label>

                            <input type="number" id="gedungFormTahun" min="1900" max="2100">

                        </div>


                        {{-- Lokasi --}}
                        <div class="gedung-form-group">

                            <label for="gedungFormLokasi">
                                Lokasi
                            </label>

                            <input type="text" id="gedungFormLokasi" placeholder="Lokasi gedung">

                        </div>


                        {{-- Kondisi --}}
                        <div class="gedung-form-group">

                            <label for="gedungFormKondisi">
                                Kondisi
                            </label>

                            <select id="gedungFormKondisi">

                                <option>
                                    Baik
                                </option>

                                <option>
                                    Sedang
                                </option>

                                <option>
                                    Rusak Berat
                                </option>

                            </select>

                        </div>


                        {{-- Nilai --}}
                        <div class="gedung-form-group">

                            <label for="gedungNilai">
                                Nilai Perolehan
                            </label>

                            <input type="text" id="gedungNilai" placeholder="Contoh: Rp 2.500.000.000">

                        </div>


                        {{-- Status tanah --}}
                        <div class="gedung-form-group">

                            <label for="gedungFormStatusTanah">
                                Status Tanah
                            </label>

                            <select id="gedungFormStatusTanah">

                                <option>
                                    Milik Sendiri
                                </option>

                                <option>
                                    Sewa
                                </option>

                                <option>
                                    Pinjam Pakai
                                </option>

                            </select>

                        </div>

                    </div>


                    <div class="gedung-modal-footer">

                        <button type="button" class="gedung-cancel-btn" onclick="closeGedungModal()">
                            Batal
                        </button>


                        <button type="submit" class="gedung-save-btn" id="gedungSaveButton">

                            <i data-lucide="save"></i>

                            Simpan Data

                        </button>

                    </div>

                </form>

            </div>

        </dialog>
        
    </section>


    <script src="{{ asset('js/pages/kib/gedung.js') }}"></script>
@endsection
