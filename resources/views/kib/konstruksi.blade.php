@extends('layouts.main')

@section('title', 'K.I.B F — Konstruksi')

@section('content')

    @php
        /*
    |--------------------------------------------------------------------------
    | K.I.B F — KONSTRUKSI
    |--------------------------------------------------------------------------
    | Tabel utama: 9 kolom
    | Form & Detail: data lengkap
    | Database manual: kib_konstruksi_manual
    | Arsip lama: kib_f_s (read only)
    |--------------------------------------------------------------------------
    */

        $currentView = ($view ?? 'manual') === 'arsip' ? 'arsip' : 'manual';

        $rupiah = fn($value) => 'Rp ' . number_format((float) ($value ?? 0), 0, ',', '.');

        $kategoriNama = fn($value) => match (strtoupper(trim((string) $value))) {
            'IPA' => 'Instalasi Pengolahan Air (IPA)',
            'BOOSTER' => 'Booster',
            'PERPIPAAN' => 'Perpipaan',
            default => 'Belum Dikategorikan',
        };

        $masterOptions = $kfMasterOptions ?? [
            'lokasi' => [],
            'departemen' => [],
            'divisi' => [],
        ];

        $historyOptions = $suggestions ?? [];
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">

    <section class="kf-page" id="kfApp" data-base="{{ url('/kib/konstruksi') }}" data-token="{{ csrf_token() }}">

        {{-- =====================================================
         HEADER / BANNER KONSTRUKSI
    ====================================================== --}}

        <header class="kf-hero">

            <nav class="kf-breadcrumb" aria-label="Breadcrumb">

                <a href="{{ route('dashboard') }}" title="Dashboard">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>

                <span>K.I.B</span>

                <i data-lucide="chevron-right"></i>

                <strong>Konstruksi</strong>

            </nav>


            {{-- TANGGAL DAN WAKTU WITA --}}

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
                Pengelolaan Kartu Inventaris Barang (K.I.B F)
                berdasarkan kategori, cakupan, lokasi, dan
                dokumen pekerjaan konstruksi Perumda Tirta Kencana
                Kota Samarinda.
            </p>


            {{-- =================================================
             KARTU STATISTIK
        ================================================== --}}

            <div class="kf-stats">

                <article class="kf-stat-card">

                    <span class="kf-stat-icon">
                        <i data-lucide="hard-hat"></i>
                    </span>

                    <div>
                        <small>Total Inventaris</small>

                        <strong>
                            {{ number_format($total, 0, ',', '.') }}
                        </strong>

                        <span>Data konstruksi manual</span>
                    </div>

                </article>


                <article class="kf-stat-card">

                    <span class="kf-stat-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <div>
                        <small>Jumlah Lokasi</small>

                        <strong>
                            {{ number_format((int) $jumlahLokasi, 0, ',', '.') }}
                        </strong>

                        <span>Lokasi terinventarisasi</span>
                    </div>

                </article>


                <article class="kf-stat-card">

                    <span class="kf-stat-icon">
                        <i data-lucide="wallet"></i>
                    </span>

                    <div>
                        <small>Nilai Konstruksi</small>

                        <strong>
                            {{ $rupiah($nilai) }}
                        </strong>

                        <span>Total nilai pencatatan manual</span>
                    </div>

                </article>

            </div>

        </header>


        {{-- =====================================================
         PANEL DAFTAR DATA
    ====================================================== --}}

        <section class="kf-panel">

            <div class="kf-section-head">

                <div>

                    <h2>
                        {{ $currentView === 'arsip' ? 'Arsip Konstruksi Lama' : 'Daftar Konstruksi' }}
                    </h2>

                    <p>
                        {{ $currentView === 'arsip'
                            ? 'Data historis tetap tersedia dalam mode baca-saja.'
                            : 'Daftar ringkas inventaris. Buka View untuk informasi konstruksi lengkap.' }}
                    </p>

                </div>

                <div class="kf-panel-actions">

                    <span class="kf-chip">
                        {{ number_format($items->total(), 0, ',', '.') }}
                        hasil
                    </span>

                    <button type="button" class="kf-btn kf-primary" id="kfTambah">
                        <i data-lucide="plus"></i>
                        Tambah Konstruksi
                    </button>

                </div>

            </div>


            {{-- =================================================
             TAB MANUAL / ARSIP
        ================================================== --}}

            <nav class="kf-tabs" aria-label="Jenis Data Konstruksi">

                <a href="{{ route('kib.konstruksi') }}" class="{{ $currentView === 'manual' ? 'active' : '' }}">

                    <i data-lucide="clipboard-list"></i>

                    Data Manual Baru

                    <span>
                        ({{ number_format($total, 0, ',', '.') }})
                    </span>

                </a>

                <a href="{{ route('kib.konstruksi', ['view' => 'arsip']) }}"
                    class="{{ $currentView === 'arsip' ? 'active' : '' }}">

                    <i data-lucide="archive"></i>

                    Arsip Data Lama

                    <span>
                        ({{ number_format($archiveCount, 0, ',', '.') }})
                    </span>

                </a>

            </nav>


            {{-- =================================================
             FILTER PENCARIAN
        ================================================== --}}

            <form method="GET" action="{{ route('kib.konstruksi') }}" class="kf-toolbar">

                <input type="hidden" name="view" value="{{ $currentView }}">

                <label class="kf-search">

                    <i data-lucide="search"></i>

                    <input type="search" name="q" value="{{ $search ?? '' }}" autocomplete="off"
                        placeholder="Cari nama barang, kategori, cakupan, lokasi...">

                </label>


                @if ($currentView === 'manual')
                    <select name="kategori" class="kf-filter" aria-label="Filter Kategori">

                        <option value="">
                            Semua Kategori
                        </option>

                        <option value="IPA" @selected(($category ?? '') === 'IPA')>
                            Instalasi Pengolahan Air (IPA)
                        </option>

                        <option value="BOOSTER" @selected(($category ?? '') === 'BOOSTER')>
                            Booster
                        </option>

                        <option value="PERPIPAAN" @selected(($category ?? '') === 'PERPIPAAN')>
                            Perpipaan
                        </option>

                    </select>
                @endif


                <button type="submit" class="kf-btn kf-primary">

                    <i data-lucide="filter"></i>

                    Filter

                </button>

                <a class="kf-btn kf-outline"
                    href="{{ route('kib.konstruksi', $currentView === 'arsip' ? ['view' => 'arsip'] : []) }}">
                    Reset
                </a>

            </form>


            {{-- =================================================
             TABEL UTAMA — 9 KOLOM
        ================================================== --}}

            @if ($currentView === 'manual')

                <div class="kf-table-wrap">

                    <table class="kf-table kf-table-summary">

                        <thead>

                            <tr>

                                <th class="kf-col-no">
                                    No.
                                </th>

                                <th class="kf-col-nama">
                                    Nama Barang
                                </th>

                                <th class="kf-col-kategori">
                                    Kategori
                                </th>

                                <th class="kf-col-cakupan">
                                    Cakupan
                                </th>

                                <th class="kf-col-tahun">
                                    Tahun
                                </th>

                                <th class="kf-col-lokasi">
                                    Lokasi
                                </th>

                                <th class="kf-col-status">
                                    Status
                                </th>

                                <th class="kf-col-nilai">
                                    Nilai (Rp)
                                </th>

                                <th class="kf-actions-head">
                                    Aksi
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            @forelse ($items as $item)
                                <tr>

                                    {{-- NOMOR --}}

                                    <td class="kf-col-no">
                                        {{ $items->firstItem() + $loop->index }}
                                    </td>


                                    {{-- NAMA BARANG --}}

                                    <td class="kf-main-name">

                                        <strong>
                                            {{ $item->nama_barang }}
                                        </strong>

                                    </td>


                                    {{-- KATEGORI --}}

                                    <td>

                                        <span class="kf-badge">
                                            {{ $kategoriNama($item->kategori) }}
                                        </span>

                                    </td>


                                    {{-- CAKUPAN --}}

                                    <td class="kf-text-cell">

                                        {{ $item->cakupan ?: '—' }}

                                    </td>


                                    {{-- TAHUN --}}

                                    <td class="kf-col-tahun">
                                        {{ $item->tahun ?: '—' }}
                                    </td>


                                    {{-- LOKASI --}}

                                    <td>

                                        <strong class="kf-location-name">
                                            {{ $item->nama_lokasi ?: '—' }}
                                        </strong>

                                    </td>


                                    {{-- STATUS ASET --}}

                                    <td>

                                        @php
                                            $statusAset = trim((string) ($item->status_aset ?? ''));
                                        @endphp

                                        <span class="kf-status-badge">
                                            {{ $statusAset !== '' ? $statusAset : 'Belum Ditentukan' }}
                                        </span>

                                    </td>


                                    {{-- NILAI --}}

                                    <td class="kf-money">

                                        {{ $rupiah($item->nilai) }}

                                    </td>


                                    {{-- AKSI CRUD --}}

                                    <td class="kf-actions-cell">

                                        <div class="kf-row-actions" role="group" aria-label="Aksi Konstruksi">

                                            {{-- VIEW --}}

                                            <button type="button" class="kf-action-btn kf-action-view"
                                                data-kf-action="view" data-kf-id="{{ $item->id }}" title="View Detail"
                                                aria-label="View Detail">
                                                <i data-lucide="eye"></i>
                                            </button>


                                            {{-- EDIT --}}

                                            <button type="button" class="kf-action-btn kf-action-edit"
                                                data-kf-action="edit" data-kf-id="{{ $item->id }}"
                                                title="Edit Konstruksi" aria-label="Edit Konstruksi">
                                                <i data-lucide="pencil"></i>
                                            </button>


                                            {{-- DELETE --}}

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

                                        <div class="kf-empty-content">

                                            <i data-lucide="clipboard-list"></i>

                                            <strong>
                                                Belum Ada Data Konstruksi
                                            </strong>

                                            <span>
                                                Klik Tambah Konstruksi untuk
                                                membuat catatan pertama.
                                            </span>

                                        </div>

                                    </td>

                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>


                {{-- =================================================
             ARSIP KONSTRUKSI LAMA
        ================================================== --}}
            @else
                <div class="kf-archive-notice">

                    <i data-lucide="lock-keyhole"></i>

                    <span>
                        Data historis berasal dari tabel
                        <code>kib_f_s</code>.

                        Arsip hanya dapat dibaca dan tidak dapat
                        diedit atau dihapus melalui modul ini.
                    </span>

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

                                    <td class="kf-main-name">

                                        <strong>
                                            {{ $item->nama_barang ?: '—' }}
                                        </strong>

                                    </td>

                                    <td>
                                        {{ $item->tahun ?: '—' }}
                                    </td>

                                    <td>
                                        {{ $item->nama_lokasi ?: '—' }}

                                        <small class="kf-block-muted">
                                            {{ $item->alamat_lokasi ?: '' }}
                                        </small>
                                    </td>

                                    <td>
                                        {{ $item->type ?: '—' }}
                                    </td>

                                    <td class="kf-money">
                                        {{ $rupiah($item->nilai) }}
                                    </td>

                                    <td class="kf-uraian">
                                        {{ $item->urai ?: '—' }}
                                    </td>

                                    <td class="kf-uraian">
                                        {{ $item->ket ?: '—' }}
                                    </td>

                                </tr>

                            @empty

                                <tr>

                                    <td colspan="8" class="kf-empty">
                                        Belum ada arsip yang sesuai pencarian.
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
         MODAL FORM TAMBAH / EDIT — DATA LENGKAP
    ====================================================== --}}

        <dialog id="kfModalForm" class="kf-dialog" aria-labelledby="kfFormTitle">

            <form id="kfForm" enctype="multipart/form-data" novalidate>

                @csrf

                <header class="kf-dialog-head">

                    <div>
                        <small>K.I.B F — FORM PENCATATAN</small>

                        <h2 id="kfFormTitle">
                            Tambah Data Konstruksi
                        </h2>

                        <p>
                            Lengkapi informasi pekerjaan konstruksi
                            sesuai dokumen inventaris.
                        </p>
                    </div>

                    <button type="button" class="kf-x" data-kf-close="kfModalForm" aria-label="Tutup Form">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="kf-dialog-body">

                    <div id="kfError" class="kf-error" role="alert" hidden></div>


                    {{-- =================================================
                     1. IDENTITAS KONSTRUKSI
                ================================================== --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>1</span>
                            Identitas dan Cakupan
                        </legend>


                        <div class="kf-fields">

                            <label class="kf-full">

                                Nama Barang / Jenis Pekerjaan
                                <em>*</em>

                                <input type="text" name="nama_barang_manual" id="kfNama" maxlength="500" required
                                    placeholder="Contoh: Pengadaan dan Pemasangan Pipa Interkoneksi">

                            </label>


                            <label>

                                Kategori
                                <em>*</em>

                                <input type="text" name="kategori" id="kfKategori" data-kf-combo="kategori"
                                    maxlength="20" required autocomplete="off" placeholder="Pilih atau cari kategori">

                                <small>
                                    Pilihan: IPA, Booster, atau Perpipaan.
                                </small>

                            </label>


                            <label>

                                Cakupan
                                <em>*</em>

                                <input type="text" name="cakupan" id="kfCakupan" data-kf-combo="cakupan"
                                    maxlength="500" required autocomplete="off"
                                    placeholder="Pilih atau tulis cakupan pekerjaan">

                            </label>


                            <label>

                                Lokasi / Unit Kerja
                                <em>*</em>

                                <input type="text" name="lokasi_manual" id="kfLokasi" data-kf-combo="lokasi"
                                    maxlength="500" required autocomplete="off"
                                    placeholder="Cari lokasi dari Master Data">

                                <small>
                                    Bisa memilih Master Lokasi atau mengetik lokasi baru.
                                </small>

                            </label>


                            <label>

                                Alamat Lokasi

                                <input type="text" name="alamat_manual" id="kfAlamat" maxlength="500"
                                    placeholder="Alamat lengkap lokasi konstruksi">

                            </label>


                            <label>

                                Departemen

                                <input type="text" name="departemen_manual" id="kfDepartemen"
                                    data-kf-combo="departemen" maxlength="255" autocomplete="off"
                                    placeholder="Cari departemen">

                            </label>


                            <label>

                                Divisi

                                <input type="text" name="divisi_manual" id="kfDivisi" data-kf-combo="divisi"
                                    maxlength="255" autocomplete="off" placeholder="Cari divisi">

                                <small>
                                    Pilihan Divisi mengikuti Departemen.
                                </small>

                            </label>

                        </div>

                    </fieldset>


                    {{-- =================================================
                     2. SPESIFIKASI KONSTRUKSI
                ================================================== --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>2</span>
                            Spesifikasi Konstruksi
                        </legend>


                        <div class="kf-fields">

                            <label>

                                Tahun Pekerjaan
                                <em>*</em>

                                <input type="number" name="tahun" id="kfTahun" min="1900" max="2100"
                                    required placeholder="2026">

                            </label>


                            <label>

                                Bangunan (P, SP, D)

                                <input type="text" name="type" id="kfType" data-kf-combo="bangunan"
                                    maxlength="2" autocomplete="off" placeholder="Pilih jenis bangunan">

                            </label>


                            <label>

                                Konstruksi Bertingkat / Tidak

                                <input type="text" name="struktur" id="kfStruktur" data-kf-combo="struktur"
                                    maxlength="30" autocomplete="off" placeholder="Pilih jenis konstruksi">

                            </label>


                            <label>

                                Konstruksi Beton / Tidak

                                <input type="text" name="materi" id="kfMateri" data-kf-combo="material"
                                    maxlength="30" autocomplete="off" placeholder="Pilih material konstruksi">

                            </label>


                            <label>

                                Letak / Lokasi Alamat

                                <input type="text" name="letak" id="kfLetak" maxlength="500"
                                    placeholder="Contoh: Jl. Sultan Alimudin, Samarinda">

                            </label>


                            <label>

                                Status Tanah

                                <input type="text" name="status_tanah" id="kfStatusTanah"
                                    data-kf-combo="status_tanah" maxlength="255" autocomplete="off"
                                    placeholder="Pilih atau ketik status tanah">

                            </label>


                            <label>

                                Asal Usul Pembiayaan

                                <input type="text" name="asal" id="kfAsal" data-kf-combo="asal"
                                    maxlength="255" autocomplete="off" placeholder="Contoh: Pemprov, Pemkot, Perumda">

                            </label>


                            <label>

                                Status Aset

                                <input type="text" name="status_aset" id="kfStatusAset" data-kf-combo="status_aset"
                                    maxlength="255" autocomplete="off" placeholder="Contoh: Serah Terima">

                            </label>


                            <label class="kf-full">

                                Nilai Konstruksi (Rp)
                                <em>*</em>

                                <input type="number" name="nilai" id="kfNilai" min="0" step="0.01"
                                    required placeholder="11234500000">

                                <small>
                                    Nilai dicatat manual, tanpa mengambil
                                    transaksi dari modul Nilai Aset.
                                </small>

                            </label>

                        </div>

                    </fieldset>


                    {{-- =================================================
                     3. URAIAN DAN DOKUMEN PEKERJAAN
                ================================================== --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>3</span>
                            Uraian Pekerjaan dan Berita Acara
                        </legend>


                        <div class="kf-fields">

                            <label class="kf-full">

                                Uraian Pekerjaan
                                <em>*</em>

                                <textarea name="urai" id="kfUrai" rows="8" required
                                    placeholder="Contoh:
1. Pekerjaan persiapan dan pengukuran
2. Pengadaan dan pemasangan pipa distribusi
3. Pengadaan dan pemasangan aksesori pipa
4. Pengujian tekanan dan kelayakan instalasi
5. Serah terima pekerjaan"></textarea>

                                <small>
                                    Gunakan nomor atau baris baru agar pekerjaan
                                    mudah dibaca. Susunan ini dipertahankan
                                    ketika ditampilkan dalam View Detail.
                                </small>

                            </label>


                            <label class="kf-full">

                                Dokumen Pendukung / Keterangan

                                <textarea name="ket" id="kfKet" rows="5"
                                    placeholder="Contoh:
Berita Acara Serah Terima Pekerjaan
Nomor: 694.2/170/CK-KASI.PLP
Tanggal: 11 Januari 2021

Kontraktor Pelaksana:
PT. Contoh Kontraktor
Nomor Kontrak: 602/1410/ADD-02"></textarea>

                                <small>
                                    Isi nomor berita acara, tanggal, nama kontraktor,
                                    nomor kontrak, atau informasi pendukung lainnya.
                                </small>

                            </label>

                        </div>

                    </fieldset>


                    {{-- =================================================
                     4. FOTO DAN LAMPIRAN
                ================================================== --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>4</span>
                            Foto dan Lampiran Pendukung
                        </legend>


                        <div class="kf-fields">

                            <label>

                                Foto Utama Konstruksi

                                <input type="file" name="foto" id="kfFoto"
                                    accept="image/jpeg,image/png,image/webp">

                                <small>
                                    Opsional. Maksimal 5 MB.
                                </small>

                            </label>


                            <label>

                                Dokumen Pendukung (Banyak File)

                                <input type="file" name="dokumens[]" id="kfDokumens" multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.webp">

                                <small>
                                    PDF dan gambar dapat dipilih beberapa kali.
                                    Batas teknis mengikuti konfigurasi server.
                                </small>

                            </label>


                            <div class="kf-full" id="kfSelectedFiles" aria-live="polite"></div>


                            <div class="kf-full" id="kfSavedFiles"></div>

                        </div>

                    </fieldset>

                </div>


                <footer class="kf-dialog-foot">

                    <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalForm">
                        Batal
                    </button>

                    <button type="submit" class="kf-btn kf-primary" id="kfSimpan">

                        <i data-lucide="save"></i>

                        Simpan Konstruksi

                    </button>

                </footer>

            </form>

        </dialog>


        {{-- =====================================================
         MODAL VIEW DETAIL LENGKAP
    ====================================================== --}}

        <dialog id="kfModalDetail" class="kf-dialog" aria-labelledby="kfDetailTitle">

            <header class="kf-dialog-head">

                <div>
                    <small>K.I.B F — DETAIL INVENTARIS</small>

                    <h2 id="kfDetailTitle">
                        Detail Konstruksi
                    </h2>

                    <p>
                        Seluruh informasi pekerjaan konstruksi
                        dan dokumen pendukung.
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

                <button type="button" class="kf-btn kf-outline" id="kfEdit">
                    <i data-lucide="pencil"></i>
                    Edit
                </button>

                <button type="button" class="kf-btn kf-danger" id="kfHapus">
                    <i data-lucide="trash-2"></i>
                    Hapus
                </button>

            </footer>

        </dialog>


        {{-- =====================================================
         MODAL KONFIRMASI DELETE
    ====================================================== --}}

        <dialog id="kfModalDelete" class="kf-dialog kf-confirm-dialog" aria-labelledby="kfDeleteTitle">

            <header class="kf-dialog-head">

                <div>
                    <small>KONFIRMASI PENGHAPUSAN</small>

                    <h2 id="kfDeleteTitle">
                        Hapus Data Konstruksi?
                    </h2>
                </div>

                <button type="button" class="kf-x" data-kf-close="kfModalDelete" aria-label="Tutup Konfirmasi">
                    <i data-lucide="x"></i>
                </button>

            </header>


            <div class="kf-confirm-content">

                <span class="kf-confirm-icon">
                    <i data-lucide="triangle-alert"></i>
                </span>

                <p>
                    Data berikut beserta seluruh lampirannya
                    akan dihapus secara permanen:
                </p>

                <strong id="kfDeleteName"></strong>

                <small>
                    Penghapusan hanya berlaku pada tabel
                    Konstruksi manual. Arsip lama tidak diubah.
                </small>

            </div>


            <footer class="kf-dialog-foot">

                <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalDelete">
                    Batal
                </button>

                <button type="button" class="kf-btn kf-danger" id="kfDeleteConfirm">
                    <i data-lucide="trash-2"></i>
                    Ya, Hapus Data
                </button>

            </footer>

        </dialog>


        {{-- NOTIFIKASI --}}

        <div id="kfToast" class="kf-toast" role="status" hidden></div>

    </section>


    {{-- =========================================================
     SUMBER DATA MASTER DAN SUGGESTION
========================================================= --}}

    <script type="application/json" id="kfMasterOptions">
@json($masterOptions)
</script>

    <script type="application/json" id="kfHistoryOptions">
@json($historyOptions)
</script>


    {{-- =========================================================
     JAVASCRIPT KONSTRUKSI
========================================================= --}}

    <script
        src="{{ asset('js/pages/kib/konstruksi.js') }}?v={{ file_exists(public_path('js/pages/kib/konstruksi.js')) ? filemtime(public_path('js/pages/kib/konstruksi.js')) : '1' }}">
    </script>

@endsection
