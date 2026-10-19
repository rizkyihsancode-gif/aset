@extends('layouts.main')

@section('title', 'Peralatan dan Mesin')

@section('content')

    @php
        $rupiah = fn($n) => 'Rp ' . number_format((float) ($n ?? 0), 0, ',', '.');
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/mesin.css') }}?v={{ filemtime(public_path('css/pages/kib/mesin.css')) ?: time() }}">

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/mesin-pajak.css') }}?v={{ file_exists(public_path('css/pages/kib/mesin-pajak.css')) ? filemtime(public_path('css/pages/kib/mesin-pajak.css')) : time() }}">

    <section id="mesinPage" class="content mesin-page" data-store-url="{{ route('kib.mesin.store') }}"
        data-record-base="{{ url('/kib/mesin') }}" data-detail-base="{{ url('/kib/mesin/lokasi') }}"
        data-pending-url="{{ route('kib.mesin.pending') }}">

        {{-- =====================================================
         HEADER HALAMAN
    ====================================================== --}}

        <header class="mesin-hero">
            <div class="mesin-hero-overlay"></div>

            <div class="mesin-hero-inner">

                <div class="mesin-hero-top">
                    <div class="mesin-hero-copy">

                        <div class="mesin-breadcrumb">
                            <a href="{{ url('/dashboard') }}">
                                <i data-lucide="house"></i>
                            </a>
                            <i data-lucide="chevron-right"></i>
                            <span>K.I.B</span>
                            <i data-lucide="chevron-right"></i>
                            <strong>Peralatan dan Mesin</strong>
                        </div>

                        <div class="mesin-heading">
                            <h1>Peralatan dan Mesin</h1>
                            <p>
                                Kelola inventaris peralatan dan mesin,
                                nilai aset, dokumen serta masa pajak
                                kendaraan Perumda Tirta Kencana.
                            </p>
                        </div>
                    </div>

                    <div class="mesin-date-card">
                        <span class="mesin-date-icon">
                            <i data-lucide="calendar-days"></i>
                        </span>
                        <div>
                            <strong>
                                {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                            </strong>
                            <span>
                                {{ now('Asia/Makassar')->format('H:i') }} WITA
                            </span>
                        </div>
                    </div>
                </div>

                {{-- STATISTIK INVENTARIS MESIN --}}

                <div class="mesin-kpi-grid">

                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon">
                            <i data-lucide="package"></i>
                        </div>
                        <div>
                            <span>Total Data Mesin</span>
                            <strong>{{ number_format($totalAset, 0, ',', '.') }}</strong>
                            <p>Data inventaris terdaftar</p>
                        </div>
                    </article>

                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon">
                            <i data-lucide="wallet"></i>
                        </div>
                        <div>
                            <span>Total Nilai Mesin</span>
                            <strong>{{ $rupiah($totalNilai) }}</strong>
                            <p>Berdasarkan klasifikasi aktiva Mesin</p>
                        </div>
                    </article>

                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <div>
                            <span>Jumlah Lokasi</span>
                            <strong>{{ number_format($totalLokasi, 0, ',', '.') }}</strong>
                            <p>Lokasi yang memiliki Mesin</p>
                        </div>
                    </article>

                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon">
                            <i data-lucide="bell"></i>
                        </div>
                        <div>
                            <span>Pending Nilai Aset</span>
                            <strong id="mesinPendingTotal">
                                {{ number_format($totalPending, 0, ',', '.') }}
                            </strong>
                            <p>Transaksi belum diproses</p>
                        </div>
                    </article>

                </div>
            </div>
        </header>

        {{-- NOTIFIKASI LARAVEL --}}

        @if (session('success'))
            <div class="mesin-notice success" role="status">
                {{ session('success') }}
            </div>
        @endif

        @if ($errors->any())
            <div class="mesin-notice error" role="alert">
                <strong>Data belum berhasil disimpan:</strong>
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        {{-- =====================================================
         NAVBAR 2 TAB
    ====================================================== --}}

        <nav class="mesin-feature-tabs" role="tablist" aria-label="Halaman Peralatan dan Mesin">

            <button id="mesinTabDaftar" type="button" role="tab" data-mesin-tab="daftar"
                aria-controls="mesinDaftarPanel" aria-selected="true">
                <i data-lucide="list"></i>
                Daftar Peralatan dan Mesin
            </button>

            <button id="mesinTabPajak" type="button" role="tab" data-mesin-tab="pajak" aria-controls="mesinPajakPanel"
                aria-selected="false">
                <i data-lucide="calendar-clock"></i>
                Masa Pajak Kendaraan
            </button>
        </nav>

        {{-- =====================================================
         TAB 1 — DAFTAR PERALATAN DAN MESIN
    ====================================================== --}}

        <div id="mesinDaftarPanel" role="tabpanel" aria-labelledby="mesinTabDaftar">

            {{-- PENDING NILAI ASET --}}

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

            {{-- DAFTAR MESIN BERDASARKAN LOKASI --}}

            <section class="mesin-card mesin-workspace">

                <div class="mesin-workspace-head">
                    <div>
                        <h2>Daftar Peralatan dan Mesin</h2>
                        <p>
                            Data K.I.B dikelompokkan berdasarkan lokasi
                            seperti pada website aset lama.
                        </p>
                    </div>

                    <button type="button" id="mesinAddButton" class="mesin-button primary">
                        <i data-lucide="plus"></i>
                        Tambah Data Mesin
                    </button>
                </div>

                <div class="mesin-filters">
                    <label class="mesin-search-box" for="mesinSearch">
                        <i data-lucide="search"></i>
                        <input type="search" id="mesinSearch" placeholder="Cari lokasi atau alamat...">
                    </label>

                    <label for="mesinPageSize">
                        Jumlah Data
                        <select id="mesinPageSize">
                            <option value="10">10</option>
                            <option value="20" selected>20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
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

                <div class="mesin-table-wrap mesin-main-table-wrap">
                    <table class="mesin-table" id="mesinTable">

                        <colgroup>
                            <col class="mesin-col-no">
                            <col class="mesin-col-lokasi">
                            <col class="mesin-col-alamat">
                            <col class="mesin-col-nilai">
                            <col class="mesin-col-pdf">
                            <col class="mesin-col-aksi">
                        </colgroup>

                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Lokasi</th>
                                <th>Alamat</th>
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
                                    data-export-nilai="{{ (int) $row->nilai_total }}"
                                    data-export-pdf="{{ (int) $row->jumlah_dokumen }}">
                                    <td class="mesin-number"></td>

                                    <td class="mesin-lokasi-cell">
                                        <strong>
                                            {{ trim((string) $row->lokasi) ?: '—' }}
                                        </strong>
                                        <small>
                                            ID Lokasi #{{ $row->id_lokasi }}
                                        </small>
                                    </td>

                                    <td class="mesin-alamat-cell">
                                        {{ trim((string) $row->alamat) ?: '—' }}
                                    </td>

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
                                                    {{ $row->jumlah_transaksi }} transaksi
                                                </small>
                                            </span>
                                            <i data-lucide="external-link"></i>
                                        </button>
                                    </td>

                                    <td class="mesin-pdf-cell">
                                        @if ((int) $row->jumlah_dokumen > 0)
                                            <button type="button" class="mesin-pdf-button"
                                                data-pdf-lokasi="{{ $row->id_lokasi }}"
                                                data-pdf-nama="{{ trim((string) $row->lokasi) }}">
                                                <i data-lucide="file-text"></i>
                                                PDF ({{ $row->jumlah_dokumen }})
                                            </button>
                                        @else
                                            <span class="mesin-muted">—</span>
                                        @endif
                                    </td>

                                    <td class="mesin-aksi-cell">
                                        <div class="mesin-aksi-group">
                                            <button type="button" class="mesin-action-icon mesin-action-view"
                                                data-lokasi="{{ $row->id_lokasi }}" title="Detail"
                                                aria-label="Lihat Detail">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="mesin-action-icon mesin-action-edit"
                                                data-edit-lokasi="{{ $row->id_lokasi }}" title="Edit"
                                                aria-label="Edit Data">
                                                <i data-lucide="square-pen"></i>
                                            </button>

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
                                    <td colspan="6" class="mesin-empty">
                                        Belum ada data Peralatan dan Mesin.
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>

                <div class="mesin-table-footer">
                    <span id="mesinTableInfo"></span>
                    <div id="mesinPagination" class="mesin-pagination"></div>
                </div>
            </section>
        </div>

        {{-- =====================================================
         TAB 2 — MASA PAJAK KENDARAAN
         Seluruh kode ditulis dalam Blade yang sama.
    ====================================================== --}}

        <section id="mesinPajakPanel" class="pajak-panel" role="tabpanel" aria-labelledby="mesinTabPajak"
            data-api="{{ route('kib.mesin.pajak.data') }}" data-base="{{ url('/kib/mesin/pajak') }}"
            data-token="{{ csrf_token() }}" hidden>

            {{-- STATISTIK PAJAK --}}

            <div class="pajak-kpis">

                <article class="pajak-kpi">
                    <span class="pajak-kpi-icon blue">
                        <i data-lucide="car-front"></i>
                    </span>
                    <div>
                        <small>Total Kendaraan</small>
                        <strong id="pajakTotal">—</strong>
                        <span>Kendaraan dengan nomor polisi</span>
                    </div>
                </article>

                <article class="pajak-kpi">
                    <span class="pajak-kpi-icon green">
                        <i data-lucide="badge-check"></i>
                    </span>
                    <div>
                        <small>Pajak Aktif</small>
                        <strong id="pajakAktif">—</strong>
                        <span>Jatuh tempo lebih dari 30 hari</span>
                    </div>
                </article>

                <article class="pajak-kpi">
                    <span class="pajak-kpi-icon yellow">
                        <i data-lucide="alarm-clock"></i>
                    </span>
                    <div>
                        <small>Habis ≤ 30 Hari</small>
                        <strong id="pajakSegera">—</strong>
                        <span>Perlu segera diperpanjang</span>
                    </div>
                </article>

                <article class="pajak-kpi">
                    <span class="pajak-kpi-icon red">
                        <i data-lucide="circle-x"></i>
                    </span>
                    <div>
                        <small>Pajak Kedaluwarsa</small>
                        <strong id="pajakTerlambat">—</strong>
                        <span>Telah melewati jatuh tempo</span>
                    </div>
                </article>
            </div>

            {{-- TABEL MASA PAJAK --}}

            <section class="pajak-workspace">

                <header class="pajak-workspace-head">
                    <div>
                        <h2>Masa Pajak Kendaraan</h2>
                        <p>
                            Monitoring kewajiban pajak kendaraan
                            berdasarkan inventaris K.I.B Peralatan dan Mesin.
                        </p>
                    </div>

                    <button type="button" id="pajakTambah" class="pajak-btn primary">
                        <i data-lucide="plus"></i>
                        Catat Masa Pajak
                    </button>
                </header>

                <div class="pajak-toolbar">
                    <label class="pajak-search">
                        <i data-lucide="search"></i>
                        <input id="pajakCari" type="search" placeholder="Cari nomor polisi, kendaraan, merk, lokasi...">
                    </label>

                    <select id="pajakJenis" aria-label="Jenis kendaraan">
                        <option value="">Semua Jenis Kendaraan</option>
                    </select>

                    <select id="pajakStatus" aria-label="Status Pajak">
                        <option value="">Semua Status Pajak</option>
                        <option value="aktif">Aktif</option>
                        <option value="segera_habis">Segera Habis</option>
                        <option value="kedaluwarsa">Kedaluwarsa</option>
                        <option value="belum_didata">Belum Dicatat</option>
                    </select>

                    <select id="pajakLokasi" aria-label="Lokasi">
                        <option value="">Semua Lokasi</option>
                    </select>

                    <select id="pajakTempo" aria-label="Jatuh tempo">
                        <option value="">Semua Masa Berlaku</option>
                        <option value="30">Jatuh tempo ≤ 30 hari</option>
                        <option value="90">Jatuh tempo ≤ 90 hari</option>
                        <option value="terlambat">Sudah jatuh tempo</option>
                    </select>
                </div>

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

                <div class="pajak-scroll">
                    <table class="pajak-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nomor Polisi</th>
                                <th>Nama Kendaraan</th>
                                <th>Merk / Tipe</th>
                                <th>Tahun</th>
                                <th>Lokasi</th>
                                <th>Bayar Terakhir</th>
                                <th>Jatuh Tempo</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody id="pajakTableBody">
                            <tr>
                                <td colspan="10" class="pajak-empty">
                                    Memuat data masa pajak kendaraan...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <footer class="pajak-footer">
                    <span id="pajakTableInfo"></span>

                    <div>
                        <label>
                            Tampilkan
                            <select id="pajakLimit">
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                            data
                        </label>

                        <nav id="pajakPages" class="pajak-pages" aria-label="Pagination pajak"></nav>
                    </div>
                </footer>

                <p id="pajakBelumDicatat" class="pajak-footnote"></p>

            </section>

            {{-- MODAL TAMBAH / EDIT MASA PAJAK --}}

            <dialog id="pajakFormDialog" class="pajak-dialog">
                <header>
                    <div>
                        <small>PENGELOLAAN PERIODE PAJAK</small>
                        <h2 id="pajakFormTitle">
                            Catat Masa Pajak
                        </h2>
                        <p>
                            Pilih kendaraan dari inventaris Peralatan dan Mesin.
                        </p>
                    </div>

                    <button type="button" data-pajak-close="pajakFormDialog" aria-label="Tutup">
                        <i data-lucide="x"></i>
                    </button>
                </header>

                <form id="pajakForm" enctype="multipart/form-data">
                    <div class="pajak-dialog-body">

                        <label>
                            Kendaraan Inventaris *
                            <select name="mesin_id" id="pajakMesinId" required>
                                <option value="">Pilih kendaraan</option>
                            </select>
                        </label>

                        <div class="pajak-form-grid">

                            <label>
                                Tanggal Bayar Pajak
                                <input type="date" name="tanggal_bayar">
                            </label>

                            <label>
                                Jatuh Tempo Pajak *
                                <input type="date" name="jatuh_tempo" required>
                            </label>

                            <label>
                                Nominal Pajak (Rp)
                                <input type="number" name="nominal" min="0" step="1"
                                    placeholder="Contoh: 2500000">
                            </label>

                            <label>
                                Nomor STNK
                                <input type="text" name="nomor_stnk" maxlength="120">
                            </label>
                        </div>

                        <label>
                            Dokumen Pajak (PDF)
                            <input type="file" name="dokumen_pdf" accept="application/pdf">
                            <small>
                                PDF maksimal 15 MB.
                                Kosongkan jika tidak diganti.
                            </small>
                        </label>

                        <label>
                            Keterangan
                            <textarea name="keterangan" rows="3" maxlength="10000"></textarea>
                        </label>

                        <p id="pajakFormError" class="pajak-error" role="alert" hidden></p>
                    </div>

                    <footer>
                        <button type="button" class="pajak-btn outline" data-pajak-close="pajakFormDialog">
                            Batal
                        </button>

                        <button id="pajakSimpan" type="submit" class="pajak-btn primary">
                            <i data-lucide="save"></i>
                            Simpan Masa Pajak
                        </button>
                    </footer>
                </form>
            </dialog>

            {{-- MODAL DETAIL MASA PAJAK --}}

            <dialog id="pajakDetailDialog" class="pajak-dialog">

                <header>
                    <div>
                        <small>DETAIL MASA PAJAK KENDARAAN</small>
                        <h2 id="pajakDetailTitle">
                            Detail Kendaraan
                        </h2>
                    </div>

                    <button type="button" data-pajak-close="pajakDetailDialog" aria-label="Tutup">
                        <i data-lucide="x"></i>
                    </button>
                </header>

                <div class="pajak-dialog-body">
                    <dl id="pajakDetailData" class="pajak-detail-list"></dl>

                    <p id="pajakDetailDocument"></p>
                </div>

            </dialog>

        </section>

        {{-- =====================================================
         MODAL CRUD PERALATAN DAN MESIN YANG LAMA
    ====================================================== --}}

        <dialog id="mesinFormDialog" class="mesin-dialog">

            <div class="mesin-dialog-header">
                <div>
                    <small>K.I.B B</small>
                    <h2 id="mesinFormTitle">Tambah Data Mesin</h2>
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

                {{-- PILIH TRANSAKSI NILAI ASET --}}

                <section id="mesinPendingSection" class="mesin-section">
                    <div class="mesin-step">1</div>

                    <div class="mesin-section-body">

                        <h3>Pilih Data Nilai Aset</h3>
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

                            <span id="mesinPendingCountText">0 data</span>
                        </div>

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

                {{-- VOUCHER TERPILIH --}}

                <section id="mesinSelectedSource" class="mesin-selected-source" role="status" aria-live="polite"
                    hidden>
                    <span class="mesin-selected-icon">
                        <i data-lucide="circle-check-big"></i>
                    </span>

                    <div class="mesin-selected-info">
                        <span>Data Nilai Aset Terpilih</span>
                        <strong id="mesinSelectedTitle">—</strong>
                        <small id="mesinSelectedMeta">—</small>
                    </div>

                    <button type="button" id="mesinChangeSourceButton" class="mesin-selected-change">
                        <i data-lucide="refresh-cw"></i>
                        Ganti
                    </button>
                </section>

                {{-- FORM INVENTARIS MESIN --}}

                <form id="mesinForm" method="POST" action="{{ route('kib.mesin.store') }}"
                    enctype="multipart/form-data">
                    @csrf

                    <input type="hidden" name="_method" id="mesinMethod" value="PUT" disabled>

                    <input type="hidden" name="id_nilai_aktiva" id="mesinNilaiId">

                    {{-- LOKASI --}}

                    <section class="mesin-section">
                        <div class="mesin-step">2</div>

                        <div class="mesin-section-body">
                            <h3>Informasi Lokasi dan Organisasi</h3>
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

                    {{-- DETAIL TEKNIS INVENTARIS --}}

                    <section class="mesin-section">
                        <div class="mesin-step">3</div>

                        <div class="mesin-section-body">

                            <h3>Detail Barang Peralatan dan Mesin</h3>
                            <p>
                                Lengkapi informasi teknis berdasarkan
                                inventaris Perumda Tirta Kencana.
                            </p>

                            <div class="mesin-form-grid cols-2">

                                <label>
                                    Nama Barang *
                                    <select name="id_barang" required>
                                        <option value="">
                                            - PILIH BARANG -
                                        </option>

                                        @foreach ($barangRows as $barang)
                                            <option value="{{ $barang->id }}">
                                                {{ trim((string) $barang->nama_barang) }}
                                                ({{ trim((string) $barang->kode_barang) }})
                                            </option>
                                        @endforeach
                                    </select>
                                </label>

                                <label>
                                    Tahun Perolehan *
                                    <input name="tahun" maxlength="4" inputmode="numeric" required>
                                </label>

                                <label>
                                    Kode Inventaris *
                                    <input name="kode" maxlength="255" required>
                                </label>

                                <label>
                                    No. Register
                                    <input name="reg" maxlength="255">
                                </label>

                                <label>
                                    Merk / Tipe
                                    <input name="merk" maxlength="255">
                                </label>

                                <label>
                                    Ukuran
                                    <input name="ukuran" maxlength="255">
                                </label>

                                <label>
                                    Fungsi
                                    <input name="fungsi" maxlength="255">
                                </label>

                                <label>
                                    Penggunaan
                                    <input name="guna" maxlength="255">
                                </label>

                                <label>
                                    Bahan
                                    <input name="bahan" maxlength="255">
                                </label>

                                <label>
                                    Asal
                                    <input name="asal" maxlength="255">
                                </label>

                                <label>
                                    Kondisi
                                    <select name="kondisi">
                                        <option value="">
                                            - PILIH KONDISI -
                                        </option>
                                        <option value="Baik">Baik</option>
                                        <option value="Cukup">Cukup</option>
                                        <option value="Rusak Ringan">Rusak Ringan</option>
                                        <option value="Rusak Berat">Rusak Berat</option>
                                    </select>
                                </label>

                                <label>
                                    Harga Inventaris
                                    <input type="number" name="harga" min="0" max="2147483647">
                                </label>

                                <label>
                                    Penyusutan
                                    <input type="number" name="susut" min="0" max="2147483647"
                                        value="0">
                                </label>

                                <label>
                                    Pabrik
                                    <input name="pabrik" maxlength="255">
                                </label>

                                <label>
                                    Struktur
                                    <input name="struktur" maxlength="255">
                                </label>

                                <label>
                                    No. Rangka
                                    <input name="rangka" maxlength="255">
                                </label>

                                <label>
                                    No. Mesin
                                    <input name="nomor_mesin" maxlength="255">
                                </label>

                                <label>
                                    No. Polisi
                                    <input name="polisi" maxlength="255">
                                </label>

                                <label>
                                    No. BPKB
                                    <input name="bpkb" maxlength="255">
                                </label>

                                <label>
                                    Foto Barang
                                    <input type="file" name="foto" accept="image/*">
                                </label>

                                <label>
                                    Dokumen PDF
                                    <input type="file" name="dokumen" accept="application/pdf">
                                </label>

                            </div>

                            <label class="mesin-full-label">
                                Keterangan
                                <textarea name="ket" rows="3"></textarea>
                            </label>

                        </div>
                    </section>

                    <div class="mesin-form-actions">

                        <button type="button" class="mesin-button outline" data-close="mesinFormDialog">
                            Batal
                        </button>

                        <button type="submit" class="mesin-button primary">
                            <i data-lucide="save"></i>
                            Simpan Data Mesin
                        </button>
                    </div>
                </form>

            </div>
        </dialog>

        {{-- MODAL DETAIL INVENTARIS MESIN --}}

        <dialog id="mesinDetailDialog" class="mesin-dialog detail">
            <div class="mesin-dialog-header">
                <div>
                    <small>DETAIL INVENTARIS MESIN</small>
                    <h2 id="mesinDetailTitle">
                        Detail Peralatan dan Mesin
                    </h2>
                    <p id="mesinDetailAddress"></p>
                </div>

                <button type="button" class="mesin-close" data-close="mesinDetailDialog">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="mesin-dialog-scroll">
                <div id="mesinDetailBody" class="mesin-detail-list"></div>
            </div>
        </dialog>

        {{-- MODAL PDF INVENTARIS PER LOKASI --}}

        <dialog id="mesinPdfDialog" class="mesin-dialog detail">

            <div class="mesin-dialog-header">
                <div>
                    <small>DOKUMEN INVENTARIS</small>
                    <h2 id="mesinPdfTitle">Dokumen PDF Mesin</h2>
                    <p id="mesinPdfAddress">
                        Lokasi peralatan dan mesin
                    </p>
                </div>

                <button type="button" class="mesin-close" data-close="mesinPdfDialog">
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

        {{-- MODAL DETAIL NILAI ASET MESIN --}}

        <dialog id="mesinNilaiDialog" class="mesin-dialog nilai">

            <div class="mesin-dialog-header">
                <div>
                    <small>RIWAYAT NILAI ASET</small>
                    <h2 id="mesinNilaiTitle">
                        Rincian Nilai Peralatan dan Mesin
                    </h2>
                    <p id="mesinNilaiSubtitle">
                        Detail voucher dan transaksi per lokasi.
                    </p>
                </div>

                <button type="button" class="mesin-close" data-close="mesinNilaiDialog">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="mesin-dialog-scroll">

                <div class="mesin-nilai-summary">
                    <span>Total Nilai Mesin di Lokasi</span>
                    <strong id="mesinNilaiTotal">Rp 0</strong>
                    <small id="mesinNilaiCount">0 transaksi</small>
                </div>

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

                <div class="mesin-form-actions">
                    <button type="button" class="mesin-button outline" data-close="mesinNilaiDialog">
                        Tutup
                    </button>
                </div>
            </div>
        </dialog>

        {{-- HAPUS DATA INVENTARIS MESIN --}}

        <form id="mesinDeleteForm" method="POST" hidden>
            @csrf
            @method('DELETE')
        </form>

    </section>

    <script
        src="{{ asset('js/pages/kib/mesin.js') }}?v={{ file_exists(public_path('js/pages/kib/mesin.js')) ? filemtime(public_path('js/pages/kib/mesin.js')) : time() }}">
    </script>

    <script
        src="{{ asset('js/pages/kib/mesin-pajak.js') }}?v={{ file_exists(public_path('js/pages/kib/mesin-pajak.js')) ? filemtime(public_path('js/pages/kib/mesin-pajak.js')) : time() }}">
    </script>

@endsection
