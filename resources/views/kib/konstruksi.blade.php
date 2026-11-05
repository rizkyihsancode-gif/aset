@extends('layouts.main')

@section('title', 'K.I.B F — Konstruksi')

@section('content')

    @php
        $view = ($view ?? 'manual') === 'arsip' ? 'arsip' : 'manual';

        $rupiah = fn($v) => 'Rp ' . number_format((float) ($v ?? 0), 0, ',', '.');

        $kategoriNama = fn($v) => match (strtoupper(trim((string) $v))) {
            'IPA' => 'Instalasi Pengolahan Air (IPA)',
            'BOOSTER' => 'Booster',
            'PERPIPAAN' => 'Perpipaan',
            default => $v ?: '—',
        };

        $suggestions = $suggestions ?? [
            'lokasi' => [],
            'departemen' => [],
            'divisi' => [],
            'cakupan' => [],
        ];
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">

    <section id="kfApp" class="kf-page" data-base="{{ url('/kib/konstruksi') }}"
        data-group-url="{{ route('kib.konstruksi.kelompok') }}" data-token="{{ csrf_token() }}">

        {{-- =====================================================
         HEADER
    ====================================================== --}}

        <header class="kf-hero">

            <nav class="kf-breadcrumb" aria-label="Breadcrumb">

                <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>

                <span>K.I.B</span>

                <i data-lucide="chevron-right"></i>

                <strong>Konstruksi</strong>

            </nav>


            {{-- TANGGAL DAN JAM --}}

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

                    <button type="button" id="kfTambah" class="kf-btn kf-primary">

                        <i data-lucide="plus"></i>

                        Tambah Konstruksi

                    </button>

                </div>

            </div>


            {{-- TAB MANUAL / ARSIP --}}

            <nav class="kf-tabs" aria-label="Jenis data Konstruksi">

                <a class="{{ $view === 'manual' ? 'active' : '' }}" href="{{ route('kib.konstruksi') }}">
                    <i data-lucide="clipboard-list"></i>

                    Data Manual Baru ({{ $total ?? 0 }})
                </a>

                <a class="{{ $view === 'arsip' ? 'active' : '' }}"
                    href="{{ route('kib.konstruksi', ['view' => 'arsip']) }}">
                    <i data-lucide="archive"></i>

                    Arsip Data Lama ({{ $archiveCount ?? 0 }})
                </a>

            </nav>


            {{-- FILTER --}}

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
             TABEL MANUAL — 9 KOLOM
        ================================================== --}}

            @if ($view === 'manual')

                <div class="kf-table-wrap">

                    <table class="kf-table kf-table-summary">

                        <thead>

                            <tr>

                                <th>No.</th>

                                <th>Nama Barang / Pekerjaan</th>

                                <th>Kategori</th>

                                <th>Cakupan</th>

                                <th>Tahun</th>

                                <th>Lokasi</th>

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

                                    <td class="kf-center">
                                        {{ $items->firstItem() + $loop->index }}
                                    </td>

                                    <td class="kf-main-name">

                                        <strong>
                                            {{ $item->nama_barang ?: '—' }}
                                        </strong>

                                        <small>
                                            {{ $item->nama_divisi ?: '—' }}
                                        </small>

                                    </td>

                                    <td>

                                        <span class="kf-badge">
                                            {{ $kategoriNama($item->kategori) }}
                                        </span>

                                    </td>

                                    <td>
                                        {{ $item->cakupan ?: '—' }}
                                    </td>

                                    <td class="kf-center">
                                        {{ $item->tahun ?: '—' }}
                                    </td>

                                    <td>

                                        <strong class="kf-location-name">
                                            {{ $item->nama_lokasi ?: '—' }}
                                        </strong>

                                        <small>
                                            {{ $item->alamat_lokasi ?: '' }}
                                        </small>

                                    </td>

                                    <td>

                                        <span class="kf-status">
                                            {{ $item->status_aset ?: '—' }}
                                        </span>

                                    </td>

                                    <td class="kf-money">
                                        {{ $rupiah($item->nilai) }}
                                    </td>


                                    {{-- AKSI --}}

                                    <td class="kf-actions-cell">

                                        <div class="kf-row-actions">

                                            <button type="button" class="kf-action-btn kf-action-view"
                                                data-kf-action="group" data-kf-id="{{ $item->id }}"
                                                data-kf-category="{{ $item->kategori }}"
                                                data-kf-location="{{ $item->nama_lokasi }}"
                                                data-kf-division="{{ $item->nama_divisi }}" title="Detail Kelompok"
                                                aria-label="Buka Detail Kelompok">
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
                {{-- =============================================
                 ARSIP LAMA — READ ONLY
            ============================================== --}}

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
                                        <strong>{{ $item->nama_barang ?: '—' }}</strong>
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


            <div class="kf-pagination">
                {{ $items->links() }}
            </div>

        </section>


        {{-- =====================================================
         POPUP DETAIL KELOMPOK
    ====================================================== --}}

        @if ($view === 'manual')
            <dialog id="kfGroupDialog" class="kf-group-dialog" aria-labelledby="kfGroupDialogTitle">

                <header class="kf-group-header">

                    <div>

                        <small>K.I.B F — KELOMPOK KONSTRUKSI</small>

                        <h2 id="kfGroupDialogTitle">
                            Detail Kelompok Konstruksi
                        </h2>

                        <p>
                            Pilih kategori, lokasi, dan divisi untuk
                            melihat daftar pekerjaan.
                        </p>

                    </div>

                    <button type="button" class="kf-x" data-kf-close="kfGroupDialog" aria-label="Tutup Kelompok">
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

                            <input id="kfGroupSearch" type="search" placeholder="Cari kategori, lokasi, divisi..."
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

                                <p id="kfGroupCaption">—</p>

                            </div>

                            <span id="kfGroupCount" class="kf-group-count">
                                0 pekerjaan
                            </span>

                        </div>


                        <div class="kf-group-toolbar">

                            <label class="kf-group-search">

                                <i data-lucide="search"></i>

                                <input id="kfGroupItemSearch" type="search" placeholder="Cari nama, cakupan, uraian..."
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
         POPUP TAMBAH / EDIT
    ====================================================== --}}

        <dialog id="kfModalForm" class="kf-dialog" aria-labelledby="kfFormTitle">

            <form id="kfForm" enctype="multipart/form-data" novalidate>

                @csrf

                <header class="kf-dialog-head">

                    <div>

                        <small>FORM PENCATATAN MANUAL K.I.B F</small>

                        <h2 id="kfFormTitle">
                            Tambah Data Konstruksi
                        </h2>

                        <p>
                            Catat pekerjaan langsung tanpa
                            voucher Nilai Aset.
                        </p>

                    </div>

                    <button type="button" class="kf-x" data-kf-close="kfModalForm" aria-label="Tutup Form">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="kf-dialog-body">

                    <div id="kfError" class="kf-error" role="alert" hidden></div>


                    {{-- BAGIAN 1 --}}

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
                                    autocomplete="off" placeholder="Cari IPA, Booster, Perpipaan">

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
                                    maxlength="255" autocomplete="off" placeholder="Cari atau ketik departemen">

                            </label>


                            <label>

                                Divisi

                                <input name="divisi_manual" id="kfDivisi" data-kf-combo="divisi" maxlength="255"
                                    autocomplete="off" placeholder="Cari atau ketik divisi">

                            </label>

                        </div>

                    </fieldset>


                    {{-- BAGIAN 2 --}}

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
                                    placeholder="Pilih jenis struktur">

                            </label>


                            <label>

                                Konstruksi Beton / Tidak

                                <input name="materi" id="kfMateri" data-kf-combo="materi" autocomplete="off"
                                    placeholder="Pilih material">

                            </label>


                            <label>

                                Letak / Lokasi Alamat

                                <input name="letak" maxlength="500" placeholder="Contoh: Jl. Sultan Alimudin">

                            </label>


                            <label>

                                Status Tanah

                                <input name="status_tanah" data-kf-combo="status_tanah" maxlength="255"
                                    autocomplete="off" placeholder="Cari atau ketik status">

                            </label>


                            <label>

                                Asal Usul Pembiayaan

                                <input name="asal" data-kf-combo="asal" maxlength="255" autocomplete="off"
                                    placeholder="Cari atau ketik asal">

                            </label>


                            <label>

                                Status Aset

                                <input name="status_aset" data-kf-combo="status_aset" maxlength="255" autocomplete="off"
                                    placeholder="Cari atau ketik status">

                            </label>


                            <label class="kf-full">

                                Nilai Konstruksi (Rp) <em>*</em>

                                <input name="nilai" id="kfNilai" type="number" min="0" step="0.01"
                                    required placeholder="Masukkan nilai rupiah">

                            </label>

                        </div>

                    </fieldset>


                    {{-- BAGIAN 3 --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>3</span>
                            Uraian Pekerjaan dan Keterangan
                        </legend>

                        <div class="kf-fields">

                            <label class="kf-full">

                                Uraian Pekerjaan <em>*</em>

                                <textarea name="urai" id="kfUrai" rows="6" required
                                    placeholder="1. Pekerjaan persiapan
2. Pengadaan material
3. Pelaksanaan konstruksi
4. Pengujian dan serah terima"></textarea>

                            </label>


                            <label class="kf-full">

                                Dokumen Pendukung / Keterangan

                                <textarea name="ket" id="kfKet" rows="4"
                                    placeholder="Nomor berita acara, kontraktor, nomor kontrak, tanggal, dan catatan lainnya"></textarea>

                            </label>

                        </div>

                    </fieldset>


                    {{-- BAGIAN 4 --}}

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
                                    JPG, PNG, WEBP. Maksimal 5 MB.
                                </small>

                            </label>


                            <label>

                                Lampiran PDF / Gambar

                                <input type="file" name="dokumens[]" id="kfDokumens"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp" multiple>

                                <small>
                                    Dapat memilih beberapa file berulang kali.
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
         POPUP VIEW KIB F BERBENTUK TABEL EXCEL
    ====================================================== --}}

        <dialog id="kfModalDetail" class="kf-dialog kf-excel-dialog" aria-labelledby="kfDetailTitle">

            <header class="kf-dialog-head">

                <div>

                    <small>DETAIL INVENTARIS K.I.B F</small>

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
         KONFIRMASI DELETE
    ====================================================== --}}

        <dialog id="kfModalDelete" class="kf-dialog kf-confirm-dialog" aria-labelledby="kfDeleteTitle">

            <header class="kf-dialog-head">

                <div>

                    <small>KONFIRMASI PENGHAPUSAN</small>

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
                    Data arsip Konstruksi lama tidak dihapus.
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


    {{-- PILIHAN DARI DATABASE --}}

    <script id="kfSuggestions" type="application/json">
@json($suggestions)
</script>

    <script id="kfMasterOptions" type="application/json">
@json($kfMasterOptions ?? [])
</script>


    {{-- JAVASCRIPT K.I.B F --}}

    <script
        src="{{ asset('js/pages/kib/konstruksi.js') }}?v={{ file_exists(public_path('js/pages/kib/konstruksi.js')) ? filemtime(public_path('js/pages/kib/konstruksi.js')) : '1' }}">
    </script>

@endsection
