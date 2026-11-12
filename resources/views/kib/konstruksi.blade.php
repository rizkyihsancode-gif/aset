@extends('layouts.main')

@section('title', 'K.I.B F — Konstruksi')

@section('content')

    @php
        $view = ($view ?? 'manual') === 'arsip' ? 'arsip' : 'manual';

        $rupiah = fn($value) => 'Rp ' . number_format((float) ($value ?? 0), 0, ',', '.');

        $kategoriNama = fn($value) => match (strtoupper(trim((string) $value))) {
            'IPA' => 'Instalasi Pengolahan Air (IPA)',
            'BOOSTER' => 'Booster',
            'PERPIPAAN' => 'Perpipaan',
            default => $value ?: '—',
        };

        $suggestions = $suggestions ?? [];
        $kfMasterOptions = $kfMasterOptions ?? [];
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">

    <section id="kfApp" class="kf-page" data-base="{{ url('/kib/konstruksi') }}"
        data-group-url="{{ url('/kib/konstruksi/kelompok') }}" data-token="{{ csrf_token() }}">

        {{-- =====================================================
         HEADER HALAMAN
    ====================================================== --}}

        <header class="kf-hero">

            <nav class="kf-breadcrumb" aria-label="Breadcrumb">

                <a href="{{ route('dashboard') }}">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>

                <span>K.I.B</span>

                <i data-lucide="chevron-right"></i>

                <strong>Konstruksi</strong>

            </nav>


            <div class="kf-date-card">

                <span class="kf-date-icon">
                    <i data-lucide="calendar-days"></i>
                </span>

                <div>

                    <strong id="kfTanggal">
                        {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                    </strong>

                    <small>
                        <span id="kfJam">
                            {{ now('Asia/Makassar')->format('H:i:s') }}
                        </span>
                        WITA
                    </small>

                </div>

            </div>


            <h1>Konstruksi</h1>

            <p class="kf-hero-description">
                Pengelolaan K.I.B F melalui pencatatan manual,
                pengelompokan konstruksi, serta dokumen pendukung
                Perumda Tirta Kencana Kota Samarinda.
            </p>


            {{-- STATISTIK --}}

            <div class="kf-stats">

                <article>

                    <span class="kf-stat-icon">
                        <i data-lucide="hard-hat"></i>
                    </span>

                    <div>

                        <small>Total Inventaris</small>

                        <strong>
                            {{ number_format($total ?? 0, 0, ',', '.') }}
                        </strong>

                        <span>Data konstruksi manual</span>

                    </div>

                </article>


                <article>

                    <span class="kf-stat-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <div>

                        <small>Jumlah Lokasi</small>

                        <strong>
                            {{ number_format($jumlahLokasi ?? 0, 0, ',', '.') }}
                        </strong>

                        <span>Lokasi terinventarisasi</span>

                    </div>

                </article>


                <article>

                    <span class="kf-stat-icon">
                        <i data-lucide="wallet"></i>
                    </span>

                    <div>

                        <small>Nilai Konstruksi</small>

                        <strong class="kf-stat-value">
                            {{ $rupiah($nilai ?? 0) }}
                        </strong>

                        <span>Nilai pencatatan manual</span>

                    </div>

                </article>

            </div>

        </header>


        {{-- =====================================================
         DAFTAR KONSTRUKSI
    ====================================================== --}}

        <section class="kf-panel">

            <div class="kf-section-head">

                <div>

                    <h2>
                        {{ $view === 'arsip' ? 'Arsip Konstruksi Lama' : 'Daftar Konstruksi' }}
                    </h2>

                    <p>
                        {{ $view === 'arsip'
                            ? 'Data historis K.I.B F yang hanya dapat dibaca.'
                            : 'Klik Detail untuk melihat kelompok dan daftar pekerjaan.' }}
                    </p>

                </div>


                <div class="kf-panel-actions">

                    <span class="kf-chip">
                        {{ number_format($items->total(), 0, ',', '.') }}
                        data
                    </span>

                    @if ($view === 'manual')
                        <button type="button" id="kfTambah" class="kf-btn kf-primary">
                            <i data-lucide="plus"></i>
                            Tambah Konstruksi
                        </button>
                    @endif

                </div>

            </div>


            {{-- TAB --}}

            <nav class="kf-tabs">

                <a href="{{ route('kib.konstruksi') }}" class="{{ $view === 'manual' ? 'active' : '' }}">
                    <i data-lucide="clipboard-list"></i>

                    Data Manual Baru ({{ $total ?? 0 }})
                </a>


                <a href="{{ route('kib.konstruksi', ['view' => 'arsip']) }}"
                    class="{{ $view === 'arsip' ? 'active' : '' }}">
                    <i data-lucide="archive"></i>

                    Arsip Data Lama ({{ $archiveCount ?? 0 }})
                </a>

            </nav>


            {{-- PENCARIAN / FILTER --}}

            <form class="kf-toolbar" method="GET" action="{{ route('kib.konstruksi') }}">

                <input type="hidden" name="view" value="{{ $view }}">

                <label class="kf-search">

                    <i data-lucide="search"></i>

                    <input type="search" name="q" value="{{ $search ?? '' }}"
                        placeholder="Cari pekerjaan, cakupan, lokasi, uraian...">

                </label>


                @if ($view === 'manual')

                    <select class="kf-filter" name="kategori" aria-label="Filter kategori">

                        <option value="">
                            Semua Kategori
                        </option>

                        @foreach ([
            'IPA' => 'IPA',
            'BOOSTER' => 'Booster',
            'PERPIPAAN' => 'Perpipaan',
        ] as $value => $label)
                            <option value="{{ $value }}" @selected(($category ?? '') === $value)>
                                {{ $label }}
                            </option>
                        @endforeach

                    </select>

                @endif


                <button type="submit" class="kf-btn kf-primary">
                    <i data-lucide="filter"></i>
                    Filter
                </button>


                <a href="{{ route('kib.konstruksi', $view === 'arsip' ? ['view' => 'arsip'] : []) }}"
                    class="kf-btn kf-outline">
                    Reset
                </a>

            </form>


            {{-- =================================================
             TABEL UTAMA
             PERUBAHAN:
             LOKASI DIPINDAHKAN SEBELUM CAKUPAN
        ================================================== --}}

            @if ($view === 'manual')

                <div class="kf-table-wrap">

                    <table class="kf-table kf-table-summary">

                        <thead>

                            <tr>

                                <th>No.</th>

                                <th>
                                    Nama Barang / Pekerjaan
                                </th>

                                <th>Kategori</th>

                                {{-- KOLOM 4: LOKASI --}}
                                <th>Lokasi</th>

                                {{-- KOLOM 5: CAKUPAN --}}
                                <th>Cakupan</th>

                                <th>Tahun</th>

                                <th>Status</th>

                                <th>Nilai (Rp)</th>

                                <th class="kf-actions-head">
                                    Aksi
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            @forelse ($items as $item)
                                <tr>

                                    {{-- 1. NOMOR --}}

                                    <td class="kf-center">
                                        {{ $items->firstItem() + $loop->index }}
                                    </td>


                                    {{-- 2. NAMA PEKERJAAN --}}

                                    <td class="kf-main-name">

                                        <strong>
                                            {{ $item->nama_barang ?: '—' }}
                                        </strong>

                                        <small>
                                            {{ $item->nama_divisi ?: '—' }}
                                        </small>

                                    </td>


                                    {{-- 3. KATEGORI --}}

                                    <td>

                                        <span class="kf-badge">
                                            {{ $kategoriNama($item->kategori) }}
                                        </span>

                                    </td>


                                    {{-- 4. LOKASI --}}

                                    <td>

                                        <strong class="kf-location-name">
                                            {{ $item->nama_lokasi ?: '—' }}
                                        </strong>

                                        @if (!empty($item->alamat_lokasi))
                                            <small>
                                                {{ $item->alamat_lokasi }}
                                            </small>
                                        @endif

                                    </td>


                                    {{-- 5. CAKUPAN --}}

                                    <td class="kf-cakupan-cell">

                                        {{ $item->cakupan ?: '—' }}

                                    </td>


                                    {{-- 6. TAHUN --}}

                                    <td class="kf-center">
                                        {{ $item->tahun ?: '—' }}
                                    </td>


                                    {{-- 7. STATUS ASET --}}

                                    <td>

                                        <span class="kf-status">
                                            {{ $item->status_aset ?: '—' }}
                                        </span>

                                    </td>


                                    {{-- 8. NILAI --}}

                                    <td class="kf-money">
                                        {{ $rupiah($item->nilai) }}
                                    </td>


                                    {{-- 9. AKSI --}}

                                    <td class="kf-actions-cell">

                                        <div class="kf-row-actions">

                                            <button type="button" class="kf-action-btn kf-action-view"
                                                data-kf-action="group" data-kf-id="{{ $item->id }}"
                                                data-kf-category="{{ $item->kategori }}"
                                                data-kf-location="{{ $item->nama_lokasi }}"
                                                data-kf-division="{{ $item->nama_divisi }}" title="Detail Kelompok"
                                                aria-label="Detail Kelompok">
                                                <i data-lucide="folder-open"></i>
                                            </button>


                                            <button type="button" class="kf-action-btn kf-action-edit"
                                                data-kf-action="edit" data-kf-id="{{ $item->id }}"
                                                title="Edit Konstruksi" aria-label="Edit Konstruksi">
                                                <i data-lucide="pencil"></i>
                                            </button>


                                            <button type="button" class="kf-action-btn kf-action-delete"
                                                data-kf-action="delete" data-kf-id="{{ $item->id }}"
                                                data-kf-name="{{ $item->nama_barang }}" title="Hapus Konstruksi"
                                                aria-label="Hapus Konstruksi">
                                                <i data-lucide="trash-2"></i>
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            @empty

                                <tr>

                                    <td colspan="9" class="kf-empty">
                                        Belum ada data Konstruksi manual.
                                    </td>

                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>
            @else
                {{-- =================================================
                 ARSIP KIB F — READ ONLY
            ================================================== --}}

                <div class="kf-archive-notice">

                    <i data-lucide="lock-keyhole"></i>

                    Data berasal dari
                    <code>kib_f_s</code>
                    dan hanya dapat dibaca.

                </div>


                <div class="kf-table-wrap">

                    <table class="kf-table kf-archive-table">

                        <thead>

                            <tr>
                                <th>No.</th>
                                <th>Nama Konstruksi</th>
                                <th>Tahun</th>
                                <th>Lokasi</th>
                                <th>Bangunan</th>
                                <th>Nilai (Rp)</th>
                                <th>Uraian Pekerjaan</th>
                                <th>Keterangan</th>
                            </tr>

                        </thead>

                        <tbody>

                            @forelse ($items as $item)
                                <tr>

                                    <td>
                                        {{ $items->firstItem() + $loop->index }}
                                    </td>

                                    <td>
                                        <strong>
                                            {{ $item->nama_barang ?: '—' }}
                                        </strong>
                                    </td>

                                    <td>
                                        {{ $item->tahun ?: '—' }}
                                    </td>

                                    <td>
                                        {{ $item->nama_lokasi ?: '—' }}
                                    </td>

                                    <td>
                                        {{ $item->type ?: '—' }}
                                    </td>

                                    <td class="kf-money">
                                        {{ $rupiah($item->nilai) }}
                                    </td>

                                    <td class="kf-preline">
                                        {{ $item->urai ?: '—' }}
                                    </td>

                                    <td class="kf-preline">
                                        {{ $item->ket ?: '—' }}
                                    </td>

                                </tr>

                            @empty

                                <tr>

                                    <td colspan="8" class="kf-empty">
                                        Tidak ada arsip yang sesuai.
                                    </td>

                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>

            @endif



            {{-- =====================================================
     PAGINATION KONSTRUKSI
     DATA MANUAL DAN ARSIP LAMA
===================================================== --}}

            @php
                $kfPager = $items->appends(request()->except('page'));

                $kfCurrent = $kfPager->currentPage();
                $kfLast = max(1, $kfPager->lastPage());

                $kfPages = [];

                for ($i = max(1, $kfCurrent - 2); $i <= min($kfLast, $kfCurrent + 2); $i++) {
                    $kfPages[] = $i;
                }
            @endphp

            <div class="kf-pagination">

                <div class="kib-custom-pagination">

                    <div class="kib-pagination-info">

                        Menampilkan

                        <strong>
                            {{ $kfPager->firstItem() ?? 0 }}
                            –
                            {{ $kfPager->lastItem() ?? 0 }}
                        </strong>

                        dari

                        <strong>
                            {{ number_format($kfPager->total(), 0, ',', '.') }}
                        </strong>

                        data

                    </div>

                    @if ($kfLast > 1)

                        <nav class="kib-pagination-nav" aria-label="Pagination Konstruksi">

                            {{-- PREVIOUS --}}

                            @if ($kfPager->onFirstPage())
                                <span class="kib-page-btn disabled">
                                    ‹ Sebelumnya
                                </span>
                            @else
                                <a href="{{ $kfPager->previousPageUrl() }}" class="kib-page-btn" rel="prev">
                                    ‹ Sebelumnya
                                </a>
                            @endif

                            {{-- NOMOR HALAMAN --}}

                            @if (min($kfPages) > 1)

                                <a href="{{ $kfPager->url(1) }}" class="kib-page-btn number">
                                    1
                                </a>

                                @if (min($kfPages) > 2)
                                    <span class="kib-page-dots">…</span>
                                @endif

                            @endif

                            @foreach ($kfPages as $pageNumber)
                                @if ($pageNumber == $kfCurrent)
                                    <span class="kib-page-btn number active" aria-current="page">
                                        {{ $pageNumber }}
                                    </span>
                                @else
                                    <a href="{{ $kfPager->url($pageNumber) }}" class="kib-page-btn number">
                                        {{ $pageNumber }}
                                    </a>
                                @endif
                            @endforeach

                            @if (max($kfPages) < $kfLast)

                                @if (max($kfPages) < $kfLast - 1)
                                    <span class="kib-page-dots">…</span>
                                @endif

                                <a href="{{ $kfPager->url($kfLast) }}" class="kib-page-btn number">
                                    {{ $kfLast }}
                                </a>

                            @endif

                            {{-- NEXT --}}

                            @if ($kfPager->hasMorePages())
                                <a href="{{ $kfPager->nextPageUrl() }}" class="kib-page-btn" rel="next">
                                    Berikutnya ›
                                </a>
                            @else
                                <span class="kib-page-btn disabled">
                                    Berikutnya ›
                                </span>
                            @endif

                        </nav>

                    @endif

                </div>

            </div>


        </section>


        {{-- =====================================================
         MODAL DETAIL KELOMPOK
    ====================================================== --}}

        @if ($view === 'manual')
            <dialog id="kfGroupDialog" class="kf-group-dialog" aria-labelledby="kfGroupDialogTitle">

                <header class="kf-group-header">

                    <div>

                        <small>
                            K.I.B F — KELOMPOK KONSTRUKSI
                        </small>

                        <h2 id="kfGroupDialogTitle">
                            Detail Kelompok Konstruksi
                        </h2>

                        <p>
                            Pilih kategori, lokasi, dan divisi untuk
                            melihat daftar pekerjaan konstruksi.
                        </p>

                    </div>

                    <button type="button" class="kf-x" data-kf-close="kfGroupDialog"
                        aria-label="Tutup Detail Kelompok">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="kf-group-layout">

                    {{-- PANEL KIRI --}}

                    <aside class="kf-group-left">

                        <h3>
                            <i data-lucide="folder-tree"></i>
                            Kelompok Konstruksi
                        </h3>

                        <label class="kf-group-search">

                            <i data-lucide="search"></i>

                            <input type="search" id="kfGroupSearch" placeholder="Cari kategori, lokasi, divisi..."
                                autocomplete="off">

                        </label>

                        <div id="kfGroupList" class="kf-group-list"></div>

                    </aside>


                    {{-- PANEL KANAN --}}

                    <section class="kf-group-right">

                        <div class="kf-group-title">

                            <div>

                                <small>
                                    DAFTAR PEKERJAAN KONSTRUKSI
                                </small>

                                <h3 id="kfGroupTitle">
                                    Pilih Kelompok
                                </h3>

                                <p id="kfGroupCaption">
                                    —
                                </p>

                            </div>


                            <span id="kfGroupCount" class="kf-group-count">
                                0 pekerjaan
                            </span>

                        </div>


                        <div class="kf-group-toolbar">

                            <label class="kf-group-search">

                                <i data-lucide="search"></i>

                                <input id="kfGroupItemSearch" type="search" placeholder="Cari nama pekerjaan..."
                                    autocomplete="off">

                            </label>


                            <button type="button" id="kfGroupReset" class="kf-btn kf-outline">
                                <i data-lucide="refresh-cw"></i>
                                Reset
                            </button>

                        </div>


                        <div id="kfGroupError" class="kf-error" hidden></div>


                        <div class="kf-table-wrap">

                            <table class="kf-group-table">

                                <thead>

                                    <tr>
                                        <th>No.</th>
                                        <th>Nama Pekerjaan</th>
                                        <th>Tahun</th>
                                        <th>Nilai (Rp)</th>
                                        <th>Dokumen</th>
                                        <th>View</th>
                                    </tr>

                                </thead>


                                <tbody id="kfGroupRows">

                                    <tr>
                                        <td colspan="6" class="kf-empty">
                                            Pilih kelompok Konstruksi.
                                        </td>
                                    </tr>

                                </tbody>

                            </table>

                        </div>


                        <div class="kf-group-footer">

                            <span id="kfGroupInfo">
                                0 data
                            </span>

                            <div>

                                <button type="button" id="kfGroupPrev" class="kf-btn kf-outline">
                                    Sebelumnya
                                </button>

                                <span id="kfGroupPage">
                                    1 / 1
                                </span>

                                <button type="button" id="kfGroupNext" class="kf-btn kf-outline">
                                    Berikutnya
                                </button>

                            </div>

                        </div>

                    </section>

                </div>


                <footer class="kf-group-dialog-footer">

                    <button type="button" class="kf-btn kf-outline" data-kf-close="kfGroupDialog">
                        Tutup
                    </button>

                </footer>

            </dialog>
        @endif


        {{-- =====================================================
         FORM TAMBAH DAN EDIT
    ====================================================== --}}

        <dialog id="kfModalForm" class="kf-dialog" aria-labelledby="kfFormTitle">

            <form id="kfForm" enctype="multipart/form-data" novalidate>

                @csrf

                <header class="kf-dialog-head">

                    <div>

                        <small>
                            FORM PENCATATAN MANUAL K.I.B F
                        </small>

                        <h2 id="kfFormTitle">
                            Tambah Data Konstruksi
                        </h2>

                        <p>
                            Catat pekerjaan secara manual tanpa
                            mengambil data Nilai Aset.
                        </p>

                    </div>


                    <button type="button" class="kf-x" data-kf-close="kfModalForm" aria-label="Tutup Form">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="kf-dialog-body">

                    <div id="kfError" class="kf-error" role="alert" hidden></div>


                    {{-- IDENTITAS --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>1</span>
                            Identitas dan Cakupan
                        </legend>

                        <div class="kf-fields">

                            <label class="kf-full">

                                Nama Barang / Jenis Pekerjaan
                                <em>*</em>

                                <input name="nama_barang_manual" id="kfNama" maxlength="500" required
                                    placeholder="Nama pekerjaan konstruksi">

                            </label>


                            <label>

                                Kategori <em>*</em>

                                <input name="kategori" id="kfKategori" data-kf-combo="kategori" required
                                    autocomplete="off" placeholder="IPA / Booster / Perpipaan">

                            </label>


                            <label>

                                Cakupan <em>*</em>

                                <input name="cakupan" id="kfCakupan" data-kf-combo="cakupan" maxlength="500" required
                                    autocomplete="off" placeholder="Cari atau ketik cakupan">

                            </label>


                            <label>

                                Lokasi / Unit Kerja <em>*</em>

                                <input name="lokasi_manual" id="kfLokasi" data-kf-combo="lokasi" maxlength="500"
                                    required autocomplete="off" placeholder="Cari atau ketik lokasi">

                            </label>


                            <label>

                                Alamat Lokasi

                                <input name="alamat_manual" id="kfAlamat" maxlength="500" placeholder="Alamat lengkap">

                            </label>


                            <label>

                                Departemen

                                <input name="departemen_manual" id="kfDepartemen" data-kf-combo="departemen"
                                    maxlength="255" autocomplete="off" placeholder="Departemen">

                            </label>


                            <label>

                                Divisi

                                <input name="divisi_manual" id="kfDivisi" data-kf-combo="divisi" maxlength="255"
                                    autocomplete="off" placeholder="Divisi">

                            </label>

                        </div>

                    </fieldset>


                    {{-- SPESIFIKASI --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>2</span>
                            Spesifikasi Konstruksi
                        </legend>

                        <div class="kf-fields">

                            <label>

                                Tahun Pekerjaan <em>*</em>

                                <input name="tahun" id="kfTahun" type="number" min="1900" max="2100"
                                    required>

                            </label>


                            <label>

                                Bangunan (P, SP, D)

                                <input name="type" id="kfType" data-kf-combo="bangunan" maxlength="2"
                                    autocomplete="off" placeholder="P / SP / D">

                            </label>


                            <label>

                                Konstruksi Bertingkat / Tidak

                                <input name="struktur" id="kfStruktur" data-kf-combo="struktur" autocomplete="off"
                                    placeholder="Bertingkat / Tidak">

                            </label>


                            <label>

                                Konstruksi Beton / Tidak

                                <input name="materi" id="kfMateri" data-kf-combo="materi" autocomplete="off"
                                    placeholder="Beton / Tidak">

                            </label>


                            <label>

                                Letak / Lokasi Alamat

                                <input name="letak" maxlength="500" placeholder="Alamat atau letak konstruksi">

                            </label>


                            <label>

                                Status Tanah

                                <input name="status_tanah" data-kf-combo="status_tanah" maxlength="255"
                                    autocomplete="off" placeholder="Status tanah">

                            </label>


                            <label>

                                Asal Usul Pembiayaan

                                <input name="asal" data-kf-combo="asal" maxlength="255" autocomplete="off"
                                    placeholder="Asal pembiayaan">

                            </label>


                            <label>

                                Status Aset

                                <input name="status_aset" data-kf-combo="status_aset" maxlength="255" autocomplete="off"
                                    placeholder="Status aset">

                            </label>


                            <label class="kf-full">

                                Nilai Konstruksi (Rp) <em>*</em>

                                <input name="nilai" id="kfNilai" type="number" min="0" step="0.01"
                                    required placeholder="Nominal konstruksi">

                            </label>

                        </div>

                    </fieldset>


                    {{-- URAIAN --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>3</span>
                            Uraian dan Keterangan
                        </legend>

                        <div class="kf-fields">

                            <label class="kf-full">

                                Uraian Pekerjaan <em>*</em>

                                <textarea name="urai" id="kfUrai" rows="6" required placeholder="Tuliskan uraian pekerjaan..."></textarea>

                            </label>


                            <label class="kf-full">

                                Dokumen Pendukung / Keterangan

                                <textarea name="ket" id="kfKet" rows="4"
                                    placeholder="Nomor berita acara, kontraktor, nomor kontrak, dan catatan lainnya"></textarea>

                            </label>

                        </div>

                    </fieldset>


                    {{-- FOTO DAN LAMPIRAN --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>4</span>
                            Foto dan Dokumen Pendukung
                        </legend>

                        <div class="kf-fields">

                            <label>

                                Foto Utama

                                <input type="file" name="foto" id="kfFoto"
                                    accept="image/jpeg,image/png,image/webp">

                                <small>
                                    JPG, PNG, atau WEBP.
                                </small>

                            </label>


                            <label>

                                Lampiran PDF / Gambar

                                <input type="file" name="dokumens[]" id="kfDokumens"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp" multiple>

                                <small>
                                    Bisa memilih beberapa file.
                                </small>

                            </label>


                            <div class="kf-full" id="kfSelectedFiles"></div>


                            <div class="kf-full" id="kfSavedFiles"></div>

                        </div>

                    </fieldset>

                </div>


                <footer class="kf-dialog-foot">

                    <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalForm">
                        Batal
                    </button>


                    <button type="submit" id="kfSimpan" class="kf-btn kf-primary">
                        <i data-lucide="save"></i>
                        Simpan Konstruksi
                    </button>

                </footer>

            </form>

        </dialog>


        {{-- =====================================================
         VIEW DETAIL EXCEL KIB F
    ====================================================== --}}

        <dialog id="kfModalDetail" class="kf-dialog kf-excel-dialog" aria-labelledby="kfDetailTitle">

            <header class="kf-dialog-head">

                <div>

                    <small>
                        DETAIL INVENTARIS K.I.B F
                    </small>

                    <h2 id="kfDetailTitle">
                        Detail Konstruksi
                    </h2>

                    <p>
                        Kartu Inventaris Barang berbentuk tabel Excel.
                    </p>

                </div>


                <button type="button" class="kf-x" data-kf-close="kfModalDetail" aria-label="Tutup Detail">
                    <i data-lucide="x"></i>
                </button>

            </header>


            <div id="kfDetailBody" class="kf-dialog-body"></div>


            <footer class="kf-dialog-foot">

                <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalDetail">
                    Tutup
                </button>


                <button type="button" id="kfEdit" class="kf-btn kf-outline">
                    <i data-lucide="pencil"></i>
                    Edit
                </button>


                <button type="button" id="kfHapus" class="kf-btn kf-danger">
                    <i data-lucide="trash-2"></i>
                    Hapus
                </button>

            </footer>

        </dialog>


        {{-- =====================================================
         KONFIRMASI HAPUS
    ====================================================== --}}

        <dialog id="kfModalDelete" class="kf-dialog kf-confirm-dialog" aria-labelledby="kfDeleteTitle">

            <header class="kf-dialog-head">

                <div>

                    <small>
                        KONFIRMASI PENGHAPUSAN
                    </small>

                    <h2 id="kfDeleteTitle">
                        Hapus Konstruksi?
                    </h2>

                </div>


                <button type="button" class="kf-x" data-kf-close="kfModalDelete" aria-label="Tutup Konfirmasi">
                    <i data-lucide="x"></i>
                </button>

            </header>


            <div class="kf-confirm-content">

                <i data-lucide="triangle-alert"></i>

                <p>
                    Data ini beserta seluruh lampirannya
                    akan dihapus permanen:
                </p>

                <strong id="kfDeleteName"></strong>

                <small>
                    Arsip lama tidak akan dihapus.
                </small>

            </div>


            <footer class="kf-dialog-foot">

                <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalDelete">
                    Batal
                </button>


                <button type="button" id="kfDeleteConfirm" class="kf-btn kf-danger">
                    Ya, Hapus Data
                </button>

            </footer>

        </dialog>


        <div id="kfToast" class="kf-toast" role="status" hidden></div>

    </section>


    <script id="kfSuggestions" type="application/json">
@json($suggestions)
</script>

    <script id="kfMasterOptions" type="application/json">
@json($kfMasterOptions)
</script>


    <script
        src="{{ asset('js/pages/kib/konstruksi.js') }}?v={{ file_exists(public_path('js/pages/kib/konstruksi.js')) ? filemtime(public_path('js/pages/kib/konstruksi.js')) : '1' }}">
    </script>

@endsection
