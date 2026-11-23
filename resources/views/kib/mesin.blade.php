@extends('layouts.main')

@section('title', 'Peralatan dan Mesin')

@section('content')

    @php
        $rupiah = fn($n) => 'Rp ' . number_format((float) ($n ?? 0), 0, ',', '.');
    @endphp

    {{-- =========================================================
     CSS PERALATAN DAN MESIN + MASA PAJAK
========================================================= --}}

    {{-- CSS dengan versi otomatis --}}
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/mesin.css') }}?v={{ filemtime(public_path('css/pages/kib/mesin.css')) }}">
    <section id="mesinPage" class="content mesin-page" data-store-url="{{ route('kib.mesin.store') }}"
        data-record-base="{{ url('/kib/mesin') }}" data-detail-base="{{ url('/kib/mesin/lokasi') }}"
        data-pending-url="{{ route('kib.mesin.pending') }}" data-report-url="{{ route('kib.mesin.laporan') }}"
        data-report-logo="{{ asset('images/logo_hr.png') }}">

        {{-- =====================================================
         01. HEADER PERALATAN DAN MESIN
    ====================================================== --}}

        <header class="mesin-hero">

            <div class="mesin-hero-overlay"></div>

            <div class="mesin-hero-inner">

                {{-- HEADER ATAS --}}

                <div class="mesin-hero-top">

                    <div class="mesin-hero-copy">

                        <div class="mesin-breadcrumb">

                            <a href="{{ url('/dashboard') }}">
                                <i data-lucide="house"></i>
                            </a>

                            <i data-lucide="chevron-right"></i>

                            <span>K.I.B</span>

                            <i data-lucide="chevron-right"></i>

                            <strong>
                                Peralatan dan Mesin
                            </strong>

                        </div>

                        <div class="mesin-heading">

                            <h1>
                                Peralatan dan Mesin
                            </h1>

                            <p>
                                Kelola inventaris peralatan dan mesin,
                                nilai aset, dokumen serta masa pajak
                                kendaraan Perumda Tirta Kencana.
                            </p>

                        </div>

                    </div>

                    {{-- TANGGAL DAN WAKTU --}}

                    <div class="mesin-date-card">

                        <span class="mesin-date-icon">
                            <i data-lucide="calendar-days"></i>
                        </span>

                        <div>

                            <strong>
                                {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                            </strong>

                            <span>
                                {{ now('Asia/Makassar')->format('H:i') }}
                                WITA
                            </span>

                        </div>

                    </div>

                </div>

                {{-- =================================================
                 02. STATISTIK DAFTAR PERALATAN DAN MESIN

                 Muncul ketika:
                 Tab Daftar Peralatan dan Mesin aktif
            ================================================== --}}

                <div class="mesin-kpi-grid" id="mesinInventarisKpiGrid">

                    {{-- TOTAL DATA MESIN --}}

                    <article class="mesin-kpi-card">

                        <div class="mesin-kpi-icon">
                            <i data-lucide="package"></i>
                        </div>

                        <div>

                            <span>
                                Total Data Mesin
                            </span>

                            <strong>
                                {{ number_format($totalAset, 0, ',', '.') }}
                            </strong>

                            <p>
                                Data inventaris terdaftar
                            </p>

                        </div>

                    </article>

                    {{-- TOTAL NILAI MESIN --}}

                    <article class="mesin-kpi-card">

                        <div class="mesin-kpi-icon">
                            <i data-lucide="wallet"></i>
                        </div>

                        <div>

                            <span>
                                Total Nilai Mesin
                            </span>

                            <strong>
                                {{ $rupiah($totalNilai) }}
                            </strong>

                            <p>
                                Berdasarkan klasifikasi aktiva Mesin
                            </p>

                        </div>

                    </article>

                    {{-- JUMLAH LOKASI --}}

                    <article class="mesin-kpi-card">

                        <div class="mesin-kpi-icon">
                            <i data-lucide="map-pin"></i>
                        </div>

                        <div>

                            <span>
                                Jumlah Lokasi
                            </span>

                            <strong>
                                {{ number_format($totalLokasi, 0, ',', '.') }}
                            </strong>

                            <p>
                                Lokasi yang memiliki Mesin
                            </p>

                        </div>

                    </article>

                    {{-- PENDING NILAI ASET --}}

                    <article class="mesin-kpi-card">

                        <div class="mesin-kpi-icon">
                            <i data-lucide="bell"></i>
                        </div>

                        <div>

                            <span>
                                Pending Nilai Aset
                            </span>

                            <strong id="mesinPendingTotal">
                                {{ number_format($totalPending, 0, ',', '.') }}
                            </strong>

                            <p>
                                Transaksi belum diproses
                            </p>

                        </div>

                    </article>

                </div>

                {{-- =================================================
                 03. STATISTIK MASA PAJAK KENDARAAN

                 POSISI DI DALAM HEADER YANG SAMA

                 Muncul ketika:
                 Tab Masa Pajak Kendaraan aktif

                 Kode Aktiva: 31.08.%
            ================================================== --}}


                <div id="mesinPajakKpiGrid" class="pajak-kpis" aria-label="Statistik Masa Pajak Kendaraan" hidden>


                    {{-- TOTAL KENDARAAN --}}

                    <article class="pajak-kpi">

                        <span class="pajak-kpi-icon blue">
                            <i data-lucide="car-front"></i>
                        </span>

                        <div>

                            <small>
                                Data Kendaraan 31.08
                            </small>

                            <strong id="pajakTotal">
                                —
                            </strong>

                            <span>
                                Inventaris + referensi Nilai Aset
                            </span>

                        </div>

                    </article>

                    {{-- PAJAK AKTIF --}}

                    <article class="pajak-kpi">

                        <span class="pajak-kpi-icon green">
                            <i data-lucide="badge-check"></i>
                        </span>

                        <div>

                            <small>
                                Pajak Aktif
                            </small>

                            <strong id="pajakAktif">
                                —
                            </strong>

                            <span>
                                Sisa lebih dari 14 hari
                            </span>

                        </div>

                    </article>

                    {{-- SEGERA HABIS --}}

                    <article class="pajak-kpi">

                        <span class="pajak-kpi-icon yellow">
                            <i data-lucide="alarm-clock"></i>
                        </span>

                        <div>

                            <small>
                                Segera Habis
                            </small>

                            <strong id="pajakSegera">
                                —
                            </strong>

                            <span>
                                H-14 hingga H-1
                            </span>

                        </div>

                    </article>

                    {{-- KEDALUWARSA --}}

                    <article class="pajak-kpi">

                        <span class="pajak-kpi-icon red">
                            <i data-lucide="circle-x"></i>
                        </span>

                        <div>

                            <small>
                                Kedaluwarsa
                            </small>

                            <strong id="pajakTerlambat">
                                —
                            </strong>

                            <span>
                                Mulai tanggal jatuh tempo (H-0)
                            </span>

                        </div>

                    </article>

                </div>

            </div>

        </header>

        {{-- =====================================================
         04. NOTIFIKASI LARAVEL
    ====================================================== --}}

        @if (session('success'))
            <div class="mesin-notice success" role="status">
                {{ session('success') }}
            </div>
        @endif

        @if ($errors->any())

            <div class="mesin-notice error" role="alert">

                <strong>
                    Data belum berhasil disimpan:
                </strong>

                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>

            </div>

        @endif

        {{-- =====================================================
         05. NAVBAR DUA TAB
    ====================================================== --}}

        <nav class="mesin-feature-tabs" role="tablist" aria-label="Halaman Peralatan dan Mesin">

            <button type="button" id="mesinTabDaftar" role="tab" data-mesin-tab="daftar"
                aria-controls="mesinDaftarPanel" aria-selected="true">

                <i data-lucide="list"></i>

                Daftar Peralatan dan Mesin

            </button>

            <button type="button" id="mesinTabPajak" role="tab" data-mesin-tab="pajak" aria-controls="mesinPajakPanel"
                aria-selected="false">

                <i data-lucide="calendar-clock"></i>

                Masa Pajak Kendaraan

            </button>

        </nav>

        {{-- =====================================================
         06. TAB 1 — DAFTAR PERALATAN DAN MESIN
    ====================================================== --}}

        <div id="mesinDaftarPanel" role="tabpanel" aria-labelledby="mesinTabDaftar">

            {{-- ================================================
             PENDING NILAI ASET
        ================================================= --}}

            <section class="mesin-incoming-card" id="mesinIncomingCard">

                <div class="mesin-incoming-icon">
                    <i data-lucide="bell-ring"></i>
                </div>

                <div class="mesin-incoming-copy">

                    <div class="mesin-incoming-title-row">

                        <div>

                            <small class="mesin-incoming-eyebrow">
                                NILAI ASET
                            </small>

                            <h3>
                                Data Peralatan dan Mesin Menunggu Diproses
                            </h3>

                        </div>

                        <span id="mesinIncomingCount" class="mesin-incoming-count">
                            {{ number_format($totalPending, 0, ',', '.') }}
                        </span>

                    </div>

                    <p>

                        Ada

                        <strong id="mesinPendingLabel">
                            {{ number_format($totalPending, 0, ',', '.') }}
                        </strong>

                        transaksi Nilai Aset kategori Mesin
                        yang menunggu pendataan K.I.B.

                    </p>

                    <div class="mesin-incoming-meta">

                        <span class="mesin-pending-pill">

                            <i data-lucide="package-plus"></i>

                            <strong id="mesinPendingPill">
                                {{ number_format($totalPending, 0, ',', '.') }}
                            </strong>

                            Data Pending Mesin

                        </span>

                    </div>

                </div>

                <div class="mesin-incoming-action">

                    <button type="button" id="mesinOpenPending" class="mesin-button outline">

                        <i data-lucide="inbox"></i>

                        Lihat Data Masuk

                    </button>

                </div>

            </section>

            {{-- ================================================
             DAFTAR MESIN BERDASARKAN LOKASI
        ================================================= --}}

            <section class="mesin-card mesin-workspace">

                <div class="mesin-workspace-head">

                    <div>

                        <h2>
                            Daftar Peralatan dan Mesin
                        </h2>

                        <p>
                            Satu baris mewakili lokasi. Klik Detail untuk melihat seluruh barang
                            dalam format 17 kolom K.I.B B dan mencetak Excel per lokasi.
                        </p>

                    </div>

                    <button type="button" id="mesinAddButton" class="mesin-button primary">

                        <i data-lucide="plus"></i>

                        Tambah Data Mesin

                    </button>

                </div>


                {{-- FILTER DAFTAR MESIN --}}

                <div class="mesin-filters">

                    <label class="mesin-search-box" for="mesinSearch">

                        <i data-lucide="search"></i>

                        <input type="search" id="mesinSearch" placeholder="Cari lokasi atau alamat...">

                    </label>

                    <label for="mesinPageSize">

                        Jumlah Data

                        <select id="mesinPageSize">

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

                    </label>

                    <button type="button" id="mesinReset" class="mesin-button outline">

                        <i data-lucide="refresh-cw"></i>

                        Reset

                    </button>

                    <button type="button" id="mesinExport" class="mesin-button outline">

                        <i data-lucide="download"></i>

                        Export CSV

                    </button>

                </div>

                {{-- ================================================
                 TABEL DAFTAR PERALATAN DAN MESIN
            ================================================= --}}

                <div class="mesin-table-wrap mesin-main-table-wrap">

                    <table class="mesin-table" id="mesinTable">

                        <colgroup>
                            <col class="mesin-col-no">
                            <col class="mesin-col-lokasi">
                            <col class="mesin-col-alamat">
                            <col class="mesin-col-kepemilikan">
                            <col class="mesin-col-nilai">
                            <col class="mesin-col-pdf">
                            <col class="mesin-col-aksi">
                        </colgroup>

                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Lokasi</th>
                                <th>Alamat</th>
                                <th>Status Kepemilikan</th>
                                <th>Nilai</th>
                                <th>PDF</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>

                            @forelse($mesins as $row)
                                <tr class="mesin-data-row"
                                    data-search="{{ mb_strtolower(trim((string) $row->lokasi) . ' ' . trim((string) $row->alamat)) }}"
                                    data-export-lokasi="{{ trim((string) $row->lokasi) }}"
                                    data-export-alamat="{{ trim((string) $row->alamat) }}"
                                    data-export-kepemilikan="{{ $row->status_kepemilikan_ringkas }}"
                                    data-export-nilai="{{ (int) $row->nilai_total }}"
                                    data-export-pdf="{{ (int) $row->jumlah_dokumen }}">

                                    {{-- NO --}}

                                    <td class="mesin-number"></td>

                                    {{-- LOKASI --}}

                                    <td class="mesin-lokasi-cell">

                                        <strong>
                                            {{ trim((string) $row->lokasi) ?: '—' }}
                                        </strong>

                                        <small>
                                            ID Lokasi #{{ $row->id_lokasi }} · {{ (int) $row->jumlah_barang }} barang
                                            @if ((int) ($row->jumlah_kendaraan ?? 0) > 0)
                                                · <span class="mesin-lokasi-kendaraan">{{ (int) $row->jumlah_kendaraan }}
                                                    kendaraan</span>
                                            @endif
                                        </small>

                                    </td>

                                    {{-- ALAMAT --}}

                                    <td class="mesin-alamat-cell">

                                        {{ trim((string) $row->alamat) ?: '—' }}

                                    </td>

                                    {{-- STATUS KEPEMILIKAN PER LOKASI --}}
                                    <td class="mesin-kepemilikan-cell">
                                        @php
                                            $statusKepemilikan = (string) ($row->status_kepemilikan_ringkas ?? '');
                                            $labelKepemilikan =
                                                [
                                                    'perumdam' => 'Perumdam',
                                                    'pusat' => 'Pemerintah Pusat',
                                                    'pemprov' => 'Pemprov',
                                                    'pemkot' => 'Pemkot',
                                                    'swasta' => 'Swasta',
                                                    'campuran' => 'Campuran',
                                                ][$statusKepemilikan] ?? 'Belum Diatur';
                                        @endphp
                                        <span
                                            class="mesin-owner-badge {{ $statusKepemilikan === '' ? 'is-empty' : ($statusKepemilikan === 'campuran' ? 'is-mixed' : 'is-owned') }}">
                                            {{ $labelKepemilikan }}
                                        </span>
                                    </td>

                                    {{-- NILAI --}}

                                    <td class="mesin-nilai-cell">

                                        <button type="button" class="mesin-nilai-button"
                                            data-nilai-lokasi="{{ $row->id_lokasi }}"
                                            data-nilai-nama="{{ trim((string) $row->lokasi) }}"
                                            title="Lihat Detail Nilai Aset">

                                            <span>

                                                <strong>
                                                    {{ $rupiah($row->nilai_total) }}
                                                </strong>

                                                <small>
                                                    {{ $row->jumlah_transaksi }}
                                                    transaksi
                                                </small>

                                            </span>

                                            <i data-lucide="external-link"></i>

                                        </button>

                                    </td>

                                    {{-- PDF --}}

                                    <td class="mesin-pdf-cell">

                                        @if ((int) $row->jumlah_dokumen > 0)
                                            <button type="button" class="mesin-pdf-button"
                                                data-pdf-lokasi="{{ $row->id_lokasi }}"
                                                data-pdf-nama="{{ trim((string) $row->lokasi) }}">

                                                <i data-lucide="file-text"></i>

                                                PDF ({{ $row->jumlah_dokumen }})

                                            </button>
                                        @else
                                            <span class="mesin-muted">
                                                —
                                            </span>
                                        @endif

                                    </td>

                                    {{-- AKSI --}}

                                    <td class="mesin-aksi-cell">

                                        <div class="mesin-aksi-group">

                                            {{-- DETAIL --}}

                                            <button type="button" class="mesin-action-icon mesin-action-view"
                                                data-lokasi="{{ $row->id_lokasi }}" title="Detail"
                                                aria-label="Lihat Detail">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            {{-- EDIT --}}

                                            <button type="button" class="mesin-action-icon mesin-action-edit"
                                                data-edit-lokasi="{{ $row->id_lokasi }}" title="Edit"
                                                aria-label="Edit Data">
                                                <i data-lucide="square-pen"></i>
                                            </button>

                                            {{-- HAPUS --}}

                                            <button type="button" class="mesin-action-icon mesin-action-delete"
                                                data-delete-lokasi="{{ $row->id_lokasi }}" title="Hapus"
                                                aria-label="Hapus Data">
                                                <i data-lucide="trash-2"></i>
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            @empty

                                <tr>
                                    <td colspan="7" class="mesin-empty">
                                        Belum ada data Peralatan dan Mesin.
                                    </td>
                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>

                {{-- PAGINATION MESIN --}}

                <div class="mesin-table-footer">

                    <span id="mesinTableInfo"></span>

                    <div id="mesinPagination" class="mesin-pagination"></div>

                </div>

            </section>

        </div>

        {{-- =====================================================
         07. TAB 2 — MASA PAJAK KENDARAAN

         Statistik Pajak sudah berada di header,
         sehingga panel ini langsung berisi workspace.
    ====================================================== --}}


        <section id="mesinPajakPanel" class="pajak-panel" role="tabpanel" aria-labelledby="mesinTabPajak"
            data-api="{{ route('kib.mesin.pajak.data') }}" data-base="{{ url('/kib/mesin/pajak') }}"
            data-referensi-api="{{ url('/kib/mesin/pajak/referensi') }}" data-token="{{ csrf_token() }}" hidden>


            {{-- ================================================
             WORKSPACE MASA PAJAK
        ================================================= --}}

            <section class="pajak-workspace">

                <header class="pajak-workspace-head">

                    <div>

                        <h2>
                            Masa Pajak Kendaraan
                        </h2>

                        <p>
                            Semua Kode Aktiva 31.08 dari Nilai Aset dan inventaris.
                            Transaksi yang belum diinventarisasi diberi penanda khusus.
                        </p>

                    </div>

                    <div class="mesin-kendaraan-actions">
                        <button type="button" id="mesinReportKendaraanBtn" class="pajak-btn mesin-report-button"
                            title="Cetak seluruh kendaraan Kode Aktiva 31.08">
                            <i data-lucide="file-spreadsheet" aria-hidden="true"></i>
                            <span>Print Excel Seluruh Kendaraan</span>
                        </button>
                        <button type="button" id="pajakTambah" class="pajak-btn primary">
                            <i data-lucide="plus"></i>
                            Pembaruan Pajak
                        </button>
                    </div>

                </header>


                {{-- ============================================
                 FILTER MASA PAJAK
            ============================================= --}}

                <div class="pajak-toolbar">

                    <label class="pajak-search">

                        <i data-lucide="search"></i>

                        <input type="search" id="pajakCari" placeholder="Cari pengguna, merk, jenis, polisi, lokasi...">

                    </label>

                    {{-- JENIS --}}

                    <select id="pajakJenis" aria-label="Filter jenis">

                        <option value="">
                            Semua Jenis Kendaraan
                        </option>

                    </select>

                    {{-- STATUS --}}

                    <select id="pajakStatus" aria-label="Filter status pajak">

                        <option value="">
                            Semua Status
                        </option>

                        <option value="aktif">
                            Aktif
                        </option>

                        <option value="segera_habis">
                            Segera Habis
                        </option>

                        <option value="kedaluwarsa">
                            Kedaluwarsa
                        </option>

                        <option value="belum_didata">
                            Belum Dicatat
                        </option>
                        <option value="belum_lengkap">Identitas Belum Lengkap</option>
                        <option value="belum_inventaris">Belum Diinventarisasi</option>

                    </select>

                    {{-- LOKASI --}}

                    <select id="pajakLokasi" aria-label="Filter lokasi">

                        <option value="">
                            Semua Lokasi
                        </option>

                    </select>

                    {{-- MASA BERLAKU --}}

                    <select id="pajakTempo" aria-label="Filter jatuh tempo">

                        <option value="">
                            Semua Masa Berlaku
                        </option>

                        <option value="7">
                            Habis dalam 7 hari
                        </option>

                        <option value="14">
                            Habis dalam 14 hari
                        </option>

                        <option value="terlambat">
                            Sudah Kedaluwarsa
                        </option>

                    </select>

                </div>

                {{-- ============================================
                 RESET DAN EXPORT
            ============================================= --}}

                <div class="pajak-actions-bar">

                    <span id="pajakInfoStatus" role="status">
                        Memuat data kendaraan...
                    </span>

                    <div>

                        <button type="button" id="pajakReset" class="pajak-btn outline">

                            <i data-lucide="refresh-cw"></i>

                            Reset

                        </button>

                        <button type="button" id="pajakExport" class="pajak-btn outline">

                            <i data-lucide="download"></i>

                            Export CSV

                        </button>

                    </div>

                </div>

                {{-- Tabel KIB B Kendaraan: 15 kolom standar Excel + status/aksi pajak. --}}
                <div class="pajak-scroll mesin-kendaraan-scroll" tabindex="0" role="region"
                    aria-label="Daftar kendaraan K.I.B B, geser horizontal untuk seluruh kolom">
                    <table class="pajak-table mesin-kendaraan-table">
                        <thead>
                            <tr>
                                <th rowspan="2">No.</th>
                                <th rowspan="2">Kode Barang</th>
                                <th rowspan="2">Nama Barang / Jenis</th>
                                <th rowspan="2">Nomor Register</th>
                                <th rowspan="2">Merk / Type</th>
                                <th rowspan="2">Ukuran / CC</th>
                                <th rowspan="2">Bahan</th>
                                <th rowspan="2">Tahun Pembelian</th>
                                <th colspan="5">Nomor</th>
                                <th rowspan="2">Asal Usul / Cara Perolehan</th>
                                <th rowspan="2">Keterangan</th>
                                <th rowspan="2">Status Pajak</th>
                                <th rowspan="2">Aksi</th>
                            </tr>
                            <tr>
                                <th>Pabrik</th>
                                <th>Rangka</th>
                                <th>Mesin</th>
                                <th>Polisi</th>
                                <th>BPKB</th>
                            </tr>
                        </thead>
                        <tbody id="pajakTableBody">
                            <tr>
                                <td colspan="17" class="pajak-empty">Memuat data kendaraan...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {{-- ============================================
                 PAGINATION MASA PAJAK
            ============================================= --}}

                <footer class="pajak-footer">

                    <span id="pajakTableInfo"></span>

                    <div>

                        <label>

                            Tampilkan

                            <select id="pajakLimit">

                                <option value="10">
                                    10
                                </option>

                                <option value="20">
                                    20
                                </option>

                                <option value="50">
                                    50
                                </option>

                                <option value="0" selected>
                                    Semua Data
                                </option>

                            </select>

                            data

                        </label>

                        <nav id="pajakPages" class="pajak-pages" aria-label="Halaman pajak"></nav>

                    </div>

                </footer>

                <p id="pajakBelumDicatat" class="pajak-footnote"></p>

            </section>


            {{-- =================================================
     REFERENSI AKTIVA 31.08.xx (BACA SAJA)
     Data transaksi bukan otomatis unit kendaraan.
================================================== --}}
            <section id="mesinReferencePanel" class="mesin-reference-panel" aria-labelledby="mesinReferenceTitle">
                <header class="mesin-reference-head">
                    <div>
                        <span class="mesin-reference-eyebrow">REFERENSI NILAI ASET · 31.08.XX</span>
                        <h2 id="mesinReferenceTitle">Referensi Transaksi Kendaraan</h2>
                        <p>Memuat transaksi pengadaan, penambahan nilai, dan aset historis sebagai bahan verifikasi. Satu
                            transaksi dapat mencakup beberapa unit atau hanya komponen kendaraan, sehingga tidak dihitung
                            sebagai kendaraan yang wajib pajak.</p>
                    </div>
                    <div class="mesin-reference-filter">
                        <label for="mesinReferenceSearch">Cari referensi</label>
                        <input id="mesinReferenceSearch" type="search" placeholder="Kode, voucher, uraian, lokasi..."
                            autocomplete="off">
                        <label for="mesinReferenceStatus">Status sumber</label>
                        <select id="mesinReferenceStatus">
                            <option value="">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="historis">Historis</option>
                            <option value="perlu_verifikasi">Perlu Verifikasi</option>
                        </select>
                    </div>
                </header>
                <div class="mesin-reference-summary" id="mesinReferenceSummary" role="status">Referensi transaksi belum
                    dimuat.</div>
                <div class="mesin-reference-scroll">
                    <table class="mesin-reference-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Aktiva</th>
                                <th>Voucher / Tanggal</th>
                                <th>Uraian Transaksi</th>
                                <th>Lokasi</th>
                                <th>Nilai Aset</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="mesinReferenceBody">
                            <tr>
                                <td colspan="7" class="mesin-reference-empty">Buka tab Masa Pajak untuk memuat
                                    referensi.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {{-- =================================================
             08. MODAL PEMBARUAN PAJAK KENDARAAN
        ================================================== --}}

            <dialog id="pajakFormDialog" class="pajak-dialog">

                <header>

                    <div>

                        <small>
                            K.I.B B — KENDARAAN 31.08
                        </small>

                        <h2 id="pajakFormTitle">
                            Pembaruan Pajak Kendaraan
                        </h2>

                        <p>
                            Jatuh tempo dihitung otomatis
                            dari tanggal dan durasi.
                        </p>

                    </div>

                    <button type="button" data-pajak-close="pajakFormDialog" aria-label="Tutup">

                        <i data-lucide="x"></i>

                    </button>

                </header>

                <form id="pajakForm" enctype="multipart/form-data">

                    @csrf

                    <div class="pajak-dialog-body">

                        {{-- PILIH KENDARAAN --}}

                        <label>

                            Kendaraan Inventaris *

                            <select id="pajakMesinId" name="mesin_id" required data-kib-searchable="1"
                                data-kib-placeholder="Cari nomor polisi, merk, kode atau lokasi...">

                                <option value="">
                                    Pilih kendaraan
                                </option>

                            </select>

                            <small>
                                Hanya kendaraan dengan Kode Aktiva
                                31.08.xx.
                            </small>

                        </label>

                        {{-- INFORMASI KENDARAAN OTOMATIS --}}

                        <div id="pajakKendaraanInfo" class="pajak-vehicle-info" role="status">
                            Pengguna, merk, nomor polisi, dan
                            lokasi diambil otomatis dari inventaris Mesin.
                        </div>

                        {{-- ========================================
                         FORM PERHITUNGAN MASA PAJAK
                    ========================================= --}}

                        <div class="pajak-form-grid">

                            {{-- TANGGAL PEMBARUAN --}}

                            <label>

                                Tanggal Pembaruan Pajak *

                                <input type="date" id="pajakTanggalBayar" name="tanggal_bayar" required>

                            </label>

                            {{-- MASA BERLAKU --}}

                            <label>

                                Masa Berlaku *

                                <select id="pajakMasaBulan" name="masa_berlaku_bulan" required data-kib-searchable="1"
                                    data-kib-placeholder="Ketik masa berlaku...">

                                    <option value="">
                                        Pilih masa berlaku
                                    </option>

                                    <option value="8">
                                        8 Bulan
                                    </option>

                                    <option value="12">
                                        12 Bulan
                                    </option>

                                </select>

                            </label>

                            {{-- TANGGAL KEDALUWARSA OTOMATIS --}}

                            <label>

                                Berlaku s/d (otomatis)

                                <input type="text" id="pajakTanggalPreview" readonly
                                    placeholder="Otomatis setelah tanggal dan durasi diisi">

                            </label>

                            {{-- NOMINAL --}}

                            <label>

                                Nominal Pajak (Rp)

                                <input type="number" name="nominal" min="0" step="1">

                            </label>

                            {{-- STNK --}}

                            <label>

                                Nomor STNK

                                <input type="text" name="nomor_stnk" maxlength="120">

                            </label>

                        </div>

                        {{-- ========================================
                         DOKUMEN PAJAK
                    ========================================= --}}

                        <label>

                            Dokumen Pajak (PDF)

                            <input type="file" name="dokumen_pdf" accept="application/pdf">

                            <small>
                                Maksimum 15 MB.
                                Kosongkan saat edit untuk
                                mempertahankan PDF sebelumnya.
                            </small>

                        </label>

                        {{-- KETERANGAN --}}

                        <label>

                            Keterangan

                            <textarea name="keterangan" rows="3" maxlength="10000"></textarea>

                        </label>

                        {{-- PESAN ERROR --}}

                        <p id="pajakFormError" class="pajak-error" role="alert" hidden></p>

                    </div>

                    {{-- TOMBOL FORM --}}

                    <footer>

                        <button type="button" class="pajak-btn outline" data-pajak-close="pajakFormDialog">
                            Batal
                        </button>

                        <button type="submit" id="pajakSimpan" class="pajak-btn primary">

                            <i data-lucide="save"></i>

                            Simpan Pembaruan Pajak

                        </button>

                    </footer>

                </form>

            </dialog>

            {{-- =================================================
             09. MODAL DETAIL MASA PAJAK
        ================================================== --}}

            <dialog id="pajakDetailDialog" class="pajak-dialog pajak-excel-dialog" aria-labelledby="pajakDetailTitle">

                <header class="pajak-excel-header">
                    <div>
                        <small>K.I.B B / KARTU INVENTARIS KENDARAAN</small>
                        <h2 id="pajakDetailTitle">Detail Inventaris Kendaraan</h2>
                        <p>Format tabel Excel kendaraan · informasi pajak di bagian bawah</p>
                    </div>

                    <button type="button" data-pajak-close="pajakDetailDialog" aria-label="Tutup detail kendaraan">
                        <i data-lucide="x"></i>
                    </button>
                </header>

                <div class="pajak-dialog-body pajak-excel-body">
                    <div class="pajak-excel-section-heading">
                        <div>
                            <strong>Daftar Identitas Kendaraan</strong>
                            <p>Seluruh nomor kendaraan dan Status Kepemilikan mengikuti inventaris K.I.B B.</p>
                        </div>
                        <span class="pajak-excel-count">1 Kendaraan</span>
                    </div>

                    <div id="pajakDetailData" class="pajak-excel-workspace" aria-live="polite">
                        <p class="pajak-excel-loading">Memuat informasi kendaraan...</p>
                    </div>

                    <div class="pajak-excel-documents" id="pajakDetailDocument"></div>
                </div>
            </dialog>

        </section>

        {{-- =====================================================
         10. MODAL TAMBAH / EDIT PERALATAN DAN MESIN
    ====================================================== --}}

        <dialog id="mesinFormDialog" class="mesin-dialog">

            <div class="mesin-dialog-header">

                <div>

                    <small>
                        K.I.B B
                    </small>

                    <h2 id="mesinFormTitle">
                        Tambah Data Mesin
                    </h2>

                    <p>
                        Pilih transaksi Nilai Aset kemudian
                        lengkapi data inventaris.
                    </p>

                </div>

                <button type="button" class="mesin-close" data-close="mesinFormDialog" aria-label="Tutup">

                    <i data-lucide="x"></i>

                </button>

            </div>

            <div class="mesin-dialog-scroll">

                {{-- =================================================
                 STEP 1 — PILIH TRANSAKSI NILAI ASET
            ================================================== --}}

                <section id="mesinPendingSection" class="mesin-section">

                    <div class="mesin-step">
                        1
                    </div>

                    <div class="mesin-section-body">

                        <h3>
                            Pilih Data Nilai Aset
                        </h3>

                        <p>
                            Pilih transaksi kategori Mesin
                            yang belum diproses.
                        </p>

                        <div class="mesin-source-toolbar">

                            <label class="mesin-source-search">

                                <i data-lucide="search"></i>

                                <input type="search" id="mesinPendingSearch" autocomplete="off"
                                    placeholder="Cari voucher, lokasi, departemen, divisi atau uraian...">

                            </label>

                            <span id="mesinPendingCountText">
                                0 data
                            </span>

                        </div>

                        {{-- TABEL NILAI ASET PENDING --}}

                        <div class="mesin-table-wrap mesin-pending-wrap mesin-source-scroll">

                            <table class="mesin-table mesin-source-table">

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

                                <tbody id="mesinPendingBody">

                                    <tr>
                                        <td colspan="9" class="mesin-empty">
                                            Memuat data pending...
                                        </td>
                                    </tr>

                                </tbody>

                            </table>

                        </div>

                    </div>

                </section>

                {{-- =================================================
                 DATA NILAI ASET TERPILIH
            ================================================== --}}

                <section id="mesinSelectedSource" class="mesin-selected-source" role="status" aria-live="polite"
                    hidden>

                    <span class="mesin-selected-icon">
                        <i data-lucide="circle-check-big"></i>
                    </span>

                    <div class="mesin-selected-info">

                        <span>
                            Data Nilai Aset Terpilih
                        </span>

                        <strong id="mesinSelectedTitle">
                            —
                        </strong>

                        <small id="mesinSelectedMeta">
                            —
                        </small>

                    </div>

                    <button type="button" id="mesinChangeSourceButton" class="mesin-selected-change">

                        <i data-lucide="refresh-cw"></i>

                        Ganti

                    </button>

                </section>

                {{-- =================================================
                 FORM INVENTARIS MESIN
            ================================================== --}}

                <form id="mesinForm" method="POST" action="{{ route('kib.mesin.store') }}"
                    enctype="multipart/form-data">

                    @csrf

                    <input type="hidden" name="_method" id="mesinMethod" value="PUT" disabled>

                    <input type="hidden" name="id_nilai_aktiva" id="mesinNilaiId">

                    {{-- ============================================
                     STEP 2 — LOKASI DAN ORGANISASI
                ============================================= --}}

                    <section class="mesin-section">

                        <div class="mesin-step">
                            2
                        </div>

                        <div class="mesin-section-body">

                            <h3>
                                Informasi Lokasi dan Organisasi
                            </h3>

                            <p>
                                Terisi otomatis dari voucher
                                Nilai Aset yang dipilih.
                            </p>

                            <div class="mesin-form-grid cols-3">

                                <label>

                                    Lokasi

                                    <input id="mesinLokasiLabel" readonly placeholder="Pilih transaksi dahulu">

                                </label>

                                <label>

                                    Departemen

                                    <input id="mesinDepartemenLabel" readonly placeholder="Otomatis dari Nilai Aset">

                                </label>

                                <label>

                                    Divisi

                                    <input id="mesinDivisiLabel" readonly placeholder="Otomatis dari Nilai Aset">

                                </label>

                            </div>

                            <div class="mesin-form-grid cols-2">

                                <label>

                                    Alamat

                                    <input id="mesinAlamatLabel" readonly>

                                </label>

                                <label>

                                    Nomor Voucher

                                    <input id="mesinVoucherLabel" readonly>

                                </label>

                            </div>

                        </div>

                    </section>

                    {{-- ============================================
                     STEP 3 — DETAIL INVENTARIS
                ============================================= --}}

                    <section class="mesin-section" id="mesinStep3">

                        <div class="mesin-step">
                            3
                        </div>

                        <div class="mesin-section-body">

                            <h3 id="mesinStep3Title">
                                Detail Barang Peralatan dan Mesin
                            </h3>

                            <span id="mesinVehicleBadge" class="mesin-vehicle-badge" hidden></span>
                            <p class="mesin-vehicle-help">
                                Kode Aktiva <strong>31.08</strong> menggunakan format Kendaraan K.I.B B.
                                Data kendaraan yang belum lengkap tetap terlihat pada menu Kendaraan
                                agar dapat diperbarui; status pajak dipantau terpisah.
                            </p>

                            <p id="mesinStep3Desc">
                                Lengkapi informasi teknis berdasarkan
                                inventaris Perumda Tirta Kencana.
                            </p>

                            <div class="mesin-form-grid cols-2" id="mesinStandardFields">

                                {{-- NAMA BARANG --}}

                                <label>

                                    Nama Barang *

                                    <select name="id_barang" required data-kib-searchable="1"
                                        data-kib-placeholder="Ketik nama atau kode barang...">

                                        <option value="">
                                            - PILIH BARANG -
                                        </option>

                                        @foreach ($barangRows as $barang)
                                            <option value="{{ $barang->id }}"
                                                data-kode-barang="{{ trim((string) $barang->kode_barang) }}">

                                                {{ trim((string) $barang->nama_barang) }}

                                                ({{ trim((string) $barang->kode_barang) }})
                                            </option>
                                        @endforeach

                                    </select>

                                </label>

                                {{-- TAHUN PEROLEHAN --}}

                                <label>

                                    Tahun Perolehan *

                                    <input name="tahun" maxlength="4" inputmode="numeric" required>

                                </label>

                                {{-- KODE INVENTARIS --}}

                                <label>

                                    Kode Inventaris *

                                    <input name="kode" maxlength="255" required>

                                </label>

                                {{-- NO REGISTER --}}

                                <label>

                                    No. Register

                                    <input name="reg" maxlength="255">

                                </label>

                                {{-- MERK / TIPE --}}

                                <label>

                                    Merk / Tipe

                                    <input name="merk" maxlength="255">

                                </label>

                                {{-- UKURAN --}}

                                <label>

                                    Ukuran

                                    <input name="ukuran" maxlength="255">

                                </label>

                                {{-- FUNGSI --}}

                                <label>

                                    Fungsi

                                    <input name="fungsi" maxlength="255">

                                </label>

                                {{-- PENGGUNAAN --}}

                                <label>

                                    Penggunaan

                                    <input name="guna" maxlength="255">

                                </label>

                                {{-- BAHAN --}}

                                <label>

                                    Bahan

                                    <input name="bahan" maxlength="255">

                                </label>

                                {{-- ASAL --}}

                                <label>

                                    Asal

                                    <input name="asal" maxlength="255">

                                </label>

                                {{-- STATUS KEPEMILIKAN (K.I.B B) --}}

                                <label>
                                    Status Kepemilikan *
                                    <select name="status_kepemilikan" id="mesinStatusKepemilikan" required
                                        data-kib-searchable="1" data-kib-placeholder="Ketik status kepemilikan...">
                                        <option value="">Pilih Status Kepemilikan</option>
                                        <option value="perumdam">Perumdam Tirta Kencana</option>
                                        <option value="pusat">Pemerintah Pusat</option>
                                        <option value="pemprov">Pemerintah Provinsi</option>
                                        <option value="pemkot">Pemerintah Kota</option>
                                        <option value="swasta">Swasta</option>
                                    </select>
                                    <small>Data lama tetap tersimpan; kosong ditampilkan sebagai Belum Diatur.</small>
                                </label>

                                {{-- KONDISI --}}

                                <label>

                                    Kondisi

                                    <select name="kondisi" data-kib-searchable="1"
                                        data-kib-placeholder="Ketik kondisi barang...">

                                        <option value="">
                                            - PILIH KONDISI -
                                        </option>

                                        <option value="Baik">
                                            Baik
                                        </option>

                                        <option value="Cukup">
                                            Cukup
                                        </option>

                                        <option value="Rusak Ringan">
                                            Rusak Ringan
                                        </option>

                                        <option value="Rusak Berat">
                                            Rusak Berat
                                        </option>

                                    </select>

                                </label>

                                {{-- HARGA --}}

                                <label>

                                    Harga Inventaris

                                    <input type="number" name="harga" min="0" max="2147483647">

                                </label>

                                {{-- PENYUSUTAN --}}

                                <label>

                                    Penyusutan

                                    <input type="number" name="susut" min="0" max="2147483647"
                                        value="0">

                                </label>

                                {{-- PABRIK --}}

                                <label>

                                    Pabrik

                                    <input name="pabrik" maxlength="255">

                                </label>

                                {{-- STRUKTUR --}}

                                <label>

                                    Struktur

                                    <input name="struktur" maxlength="255">

                                </label>

                                {{-- NO RANGKA --}}

                                <label>

                                    No. Rangka

                                    <input name="rangka" maxlength="255">

                                </label>

                                {{-- NO MESIN --}}

                                <label>

                                    No. Mesin

                                    <input name="nomor_mesin" maxlength="255">

                                </label>

                                {{-- NO POLISI --}}

                                <label>

                                    No. Polisi

                                    <input name="polisi" maxlength="255">

                                </label>

                                {{-- NO BPKB --}}

                                <label>

                                    No. BPKB

                                    <input name="bpkb" maxlength="255">

                                </label>

                                {{-- NOMOR DOKUMEN FORM K.I.B B PERALATAN & MESIN --}}

                                <label>
                                    No. Dokumen
                                    <input name="nomor_dokumen" maxlength="255"
                                        placeholder="Nomor surat / dokumen barang (bukan nama file PDF)">
                                </label>

                                {{-- FOTO BARANG --}}

                                <label>

                                    Foto Barang

                                    <input type="file" name="foto" accept="image/*">

                                </label>

                                {{-- DOKUMEN PDF --}}

                                <label>

                                    Dokumen PDF

                                    <input type="file" name="dokumen" accept="application/pdf">

                                </label>

                            </div>

                            <div id="mesinVehicleGroups" class="mesin-vehicle-groups" hidden></div>

                            {{-- KETERANGAN: ditempatkan pada kelompok kolom sesuai kategori oleh mesin.js --}}
                            <label class="mesin-full-label mesin-span-2">
                                Keterangan
                                <textarea name="ket" rows="3"></textarea>
                            </label>

                            {{-- Field operasional tidak dicampurkan dengan kolom Excel utama. --}}
                            <section id="mesinCommonSection" class="mesin-form-support-section">
                                <h4>Administrasi & Lampiran</h4>
                                <p>Informasi pendukung inventaris; tidak menambah kolom pada laporan Excel.</p>
                                <div id="mesinCommonGrid" class="mesin-form-grid cols-2"></div>
                            </section>

                            {{-- Field warisan tetap dapat diedit tetapi tidak mengganggu form utama. --}}
                            <details id="mesinExtraDetails" class="mesin-form-advanced">
                                <summary>Atribut tambahan (opsional)</summary>
                                <div id="mesinExtraGrid" class="mesin-form-grid cols-2"></div>
                            </details>

                        </div>

                    </section>

                    {{-- ============================================
                     TOMBOL SIMPAN INVENTARIS
                ============================================= --}}

                    <div class="mesin-form-actions">

                        <button type="button" class="mesin-button outline" data-close="mesinFormDialog">

                            Batal

                        </button>

                        <button type="submit" class="mesin-button primary">

                            <i data-lucide="save"></i>

                            <span id="mesinSubmitLabel">Simpan Data Mesin</span>

                        </button>

                    </div>

                </form>

            </div>

        </dialog>

        {{-- =====================================================
         11. MODAL DETAIL INVENTARIS MESIN
    ====================================================== --}}

        <dialog id="mesinDetailDialog" class="mesin-dialog detail mesin-sheet-modal">

            <div class="mesin-dialog-header">

                <div>

                    <small>
                        K.I.B B / KARTU INVENTARIS PERALATAN, MESIN &amp; KENDARAAN
                    </small>

                    <h2 id="mesinDetailTitle">
                        Detail Peralatan dan Mesin
                    </h2>

                    <p id="mesinDetailAddress"></p>

                </div>

                <button type="button" class="mesin-close" data-close="mesinDetailDialog" aria-label="Tutup">

                    <i data-lucide="x"></i>

                </button>

            </div>

            <div class="mesin-dialog-scroll">

                {{-- Tabel Excel K.I.B B dan panel Berkas dihasilkan oleh mesin.js.
                     ID dipertahankan untuk event CRUD lama. --}}
                <div id="mesinDetailBody" class="mesin-detail-list mesin-sheet-workspace" aria-live="polite"></div>

            </div>

        </dialog>

        {{-- =====================================================
         12. MODAL DOKUMEN PDF INVENTARIS MESIN
    ====================================================== --}}

        <dialog id="mesinPdfDialog" class="mesin-dialog detail">

            <div class="mesin-dialog-header">

                <div>

                    <small>
                        DOKUMEN INVENTARIS
                    </small>

                    <h2 id="mesinPdfTitle">
                        Dokumen PDF Mesin
                    </h2>

                    <p id="mesinPdfAddress">
                        Lokasi peralatan dan mesin
                    </p>

                </div>

                <button type="button" class="mesin-close" data-close="mesinPdfDialog" aria-label="Tutup">

                    <i data-lucide="x"></i>

                </button>

            </div>

            <div class="mesin-dialog-scroll">

                <p id="mesinPdfStatus" class="mesin-pdf-status" role="status"></p>

                <div class="mesin-table-wrap">

                    <table class="mesin-table mesin-pdf-table">

                        <thead>

                            <tr>
                                <th>No</th>
                                <th>Nama Barang</th>
                                <th>Kode</th>
                                <th>Tahun</th>
                                <th>PDF</th>
                            </tr>

                        </thead>

                        <tbody id="mesinPdfBody">

                            <tr>
                                <td colspan="5" class="mesin-empty">
                                    Pilih tombol PDF pada tabel.
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </dialog>

        {{-- =====================================================
         13. MODAL DETAIL NILAI ASET MESIN
    ====================================================== --}}

        <dialog id="mesinNilaiDialog" class="mesin-dialog nilai">

            <div class="mesin-dialog-header">

                <div>

                    <small>
                        RIWAYAT NILAI ASET
                    </small>

                    <h2 id="mesinNilaiTitle">
                        Rincian Nilai Peralatan dan Mesin
                    </h2>

                    <p id="mesinNilaiSubtitle">
                        Detail voucher dan transaksi per lokasi.
                    </p>

                </div>

                <button type="button" class="mesin-close" data-close="mesinNilaiDialog" aria-label="Tutup">

                    <i data-lucide="x"></i>

                </button>

            </div>

            <div class="mesin-dialog-scroll">

                {{-- RINGKASAN NILAI --}}

                <div class="mesin-nilai-summary">

                    <span>
                        Total Nilai Mesin di Lokasi
                    </span>

                    <strong id="mesinNilaiTotal">
                        Rp 0
                    </strong>

                    <small id="mesinNilaiCount">
                        0 transaksi
                    </small>

                </div>

                {{-- TABEL RINCIAN NILAI --}}

                <div class="mesin-table-wrap mesin-nilai-table-wrap">

                    <table class="mesin-table mesin-nilai-table">

                        <thead>

                            <tr>
                                <th>No</th>
                                <th>Voucher</th>
                                <th>Tanggal</th>
                                <th>Tahun</th>
                                <th>Kode Aktiva</th>
                                <th>Uraian</th>
                                <th>Jenis</th>
                                <th>Departemen</th>
                                <th>Divisi</th>
                                <th>Nilai</th>
                            </tr>

                        </thead>

                        <tbody id="mesinNilaiBody">

                            <tr>

                                <td colspan="10" class="mesin-empty">
                                    Belum ada rincian yang dibuka.
                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

                {{-- TOMBOL TUTUP --}}

                <div class="mesin-form-actions">

                    <button type="button" class="mesin-button outline" data-close="mesinNilaiDialog">

                        Tutup

                    </button>

                </div>

            </div>

        </dialog>

        {{-- =====================================================
         14. FORM HAPUS INVENTARIS MESIN
    ====================================================== --}}

        <form id="mesinDeleteForm" method="POST" hidden>

            @csrf

            @method('DELETE')

        </form>


        {{-- =====================================================
             MODAL PRINT EXCEL K.I.B B — TAMPILAN SERAGAM K.I.B A
             Fungsi laporan tetap memakai mesin.js dan KIBController.php.
             - Kendaraan: seluruh data Kode Aktiva 31.08.
             - Peralatan/Mesin: seluruh barang pada Detail lokasi terpilih.
        ====================================================== --}}
        <dialog id="mesinReportDialog" class="mesin-report-dialog" aria-labelledby="mesinReportTitle"
            aria-describedby="mesinReportScope">

            <header class="mesin-report-head">
                <div class="mesin-report-heading">
                    <span class="mesin-report-eyebrow">LAPORAN KARTU INVENTARIS BARANG (K.I.B B)</span>
                    <h2 id="mesinReportTitle">Print Excel — Peralatan dan Mesin</h2>
                    <p id="mesinReportScope">Memuat data laporan...</p>
                </div>

                <button type="button" class="mesin-report-close" data-mesin-report-close
                    aria-label="Tutup cetak K.I.B B">
                    <i data-lucide="x" aria-hidden="true"></i>
                </button>
            </header>

            <div class="mesin-report-content">
                <form id="mesinReportForm" class="mesin-report-form" autocomplete="off" novalidate>

                    <div class="mesin-report-field mesin-report-period-field">
                        <label for="mesinReportPeriod">
                            Periode laporan <span class="mesin-report-required" aria-hidden="true">*</span>
                        </label>
                        <input type="month" id="mesinReportPeriod" required>
                        <small>Contoh: November 2026</small>
                    </div>

                    <div class="mesin-report-signers">
                        @foreach ([
            'diketahui' => 'Diketahui oleh',
            'periksa_1' => 'Diperiksa oleh (1)',
            'periksa_2' => 'Diperiksa oleh (2)',
            'dibuat' => 'Dibuat oleh',
        ] as $role => $label)
                            <div class="mesin-report-field mesin-report-person" data-report-person="{{ $role }}">
                                <label for="mesinReportSigner-{{ $role }}">
                                    {{ $label }} <span class="mesin-report-required" aria-hidden="true">*</span>
                                </label>
                                <div class="mesin-report-combobox">
                                    <input type="search" id="mesinReportSigner-{{ $role }}"
                                        class="mesin-report-signer mesin-report-person-search"
                                        data-report-role="{{ $role }}" role="combobox" aria-autocomplete="list"
                                        aria-expanded="false" aria-controls="mesinReportOptions-{{ $role }}"
                                        placeholder="Ketik nama, NIP, atau jabatan..." autocomplete="off" required>
                                    <input type="hidden" class="mesin-report-person-id">
                                    <div class="mesin-report-person-options" id="mesinReportOptions-{{ $role }}"
                                        role="listbox" hidden></div>
                                </div>
                                <small class="mesin-report-person-description">Pilih dari Master SDM Pendukung.</small>
                            </div>
                        @endforeach
                    </div>
                </form>

                <p class="mesin-report-info" id="mesinReportInfo" role="status" aria-live="polite">
                    Pilih periode dan keempat penandatangan untuk menampilkan preview.
                </p>

                <section id="mesinReportPreviewBox" class="mesin-report-preview-box" hidden>
                    <div class="mesin-report-preview-heading">
                        <strong>Preview laporan K.I.B B</strong>
                    </div>
                    <div class="mesin-report-preview-scroll" tabindex="0" aria-label="Preview laporan Excel">
                        <div id="mesinReportPreview" class="mesin-report-preview"></div>
                    </div>
                </section>
            </div>

            <footer class="mesin-report-footer">
                <span class="mesin-report-footer-note">
                    K.I.B B · Kendaraan seluruh data / Peralatan dan Mesin per lokasi · tanpa Status Kepemilikan.
                </span>
                <div class="mesin-report-footer-actions">
                    <button type="button" class="mesin-report-secondary" data-mesin-report-close>Batal</button>
                    <button type="button" id="mesinReportPrint" class="mesin-report-secondary" disabled>
                        <i data-lucide="printer" aria-hidden="true"></i>
                        Print
                    </button>
                    <button type="button" id="mesinReportDownload" class="mesin-report-primary" disabled>
                        <i data-lucide="download" aria-hidden="true"></i>
                        Download Excel
                    </button>
                </div>
            </footer>
        </dialog>

    </section>

    {{-- =========================================================
     15. JAVASCRIPT PERALATAN DAN MESIN + MASA PAJAK

     Semua fungsi tetap berada pada satu mesin.js
========================================================= --}}

    {{-- JavaScript dengan versi otomatis --}}
    <script src="{{ asset('js/pages/kib/mesin.js') }}?v={{ filemtime(public_path('js/pages/kib/mesin.js')) }}" defer>
    </script>
@endsection
