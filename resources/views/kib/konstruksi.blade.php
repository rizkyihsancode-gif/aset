@extends('layouts.main')

@section('title', 'K.I.B F - Konstruksi')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">
@endpush

@section('content')
    @php
        $rupiah = fn($value) => 'Rp ' . number_format((float) ($value ?? 0), 0, ',', '.');
    @endphp

    <section class="content kf" id="kfApp" data-base="{{ url('/kib/konstruksi') }}"
        data-save="{{ route('kib.konstruksi.store') }}" data-pending="{{ route('kib.pending', ['module' => 'konstruksi']) }}"
        data-token="{{ csrf_token() }}">

        {{-- HEADER --}}

        <header class="kf-hero">

            <nav class="kf-crumb" aria-label="Breadcrumb">
                <a href="{{ route('dashboard') }}">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>
                <span>K.I.B</span>

                <i data-lucide="chevron-right"></i>
                <strong>Konstruksi</strong>
            </nav>

            <div class="kf-heading">

                <div>
                    <small>
                        KARTU INVENTARIS BARANG — K.I.B F
                    </small>

                    <h1>Konstruksi</h1>

                    <p>
                        Pengelolaan data inventaris konstruksi
                        berdasarkan lokasi, departemen, divisi,
                        dan transaksi Nilai Aset.
                    </p>
                </div>

                {{-- KARTU TANGGAL DAN JAM --}}

                <div class="kf-date-card">
                    <span class="kf-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </span>

                    <div>
                        <strong id="kfTanggal">
                            {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                        </strong>

                        <span>
                            <time id="kfJam">
                                {{ now('Asia/Makassar')->format('H:i:s') }}
                            </time>
                            WITA
                        </span>
                    </div>
                </div>
            </div>

            {{-- STATISTIK --}}

            <div class="kf-kpis">

                <article>
                    <span class="kf-kpi-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <div>
                        <small>Lokasi Konstruksi</small>

                        <strong>
                            {{ number_format((int) ($statistik->lokasi ?? 0), 0, ',', '.') }}
                        </strong>

                        <span>Lokasi terdaftar</span>
                    </div>
                </article>

                <article>
                    <span class="kf-kpi-icon">
                        <i data-lucide="hard-hat"></i>
                    </span>

                    <div>
                        <small>Inventaris K.I.B F</small>

                        <strong>
                            {{ number_format((int) ($statistik->jumlah ?? 0), 0, ',', '.') }}
                        </strong>

                        <span>Total data konstruksi</span>
                    </div>
                </article>

                <article>
                    <span class="kf-kpi-icon">
                        <i data-lucide="wallet"></i>
                    </span>

                    <div>
                        <small>Total Nilai Konstruksi</small>

                        <strong class="kf-money-small">
                            {{ $rupiah($statistik->nilai ?? 0) }}
                        </strong>

                        <span>Berdasarkan database aset</span>
                    </div>
                </article>

                <article>
                    <span class="kf-kpi-icon">
                        <i data-lucide="history"></i>
                    </span>

                    <div>
                        <small>Update Terakhir</small>

                        <strong class="kf-date-small">
                            @if (!empty($statistik->terakhir))
                                {{ \Carbon\Carbon::parse($statistik->terakhir)->locale('id')->diffForHumans() }}
                            @else
                                Belum diketahui
                            @endif
                        </strong>

                        <span>Aktivitas data K.I.B F</span>
                    </div>
                </article>
            </div>

        </header>

        {{-- DATA NILAI ASET MASUK --}}

        <section class="kf-incoming">

            <span class="kf-incoming-icon">
                <i data-lucide="inbox"></i>
            </span>

            <div class="kf-incoming-body">

                <small>DATA NILAI ASET</small>

                <h3>Data Konstruksi Menunggu Diproses</h3>

                <p>
                    Pilih transaksi Penambahan Aset untuk
                    melengkapi data Konstruksi K.I.B F.
                </p>
            </div>

            <button type="button" class="kf-btn outline" id="kfLihatMasuk">
                <i data-lucide="inbox"></i>
                Lihat Data Masuk
            </button>
        </section>

        {{-- FILTER --}}

        <section class="kf-card">

            <div class="kf-card-head">
                <div>
                    <h2>Filter Data Konstruksi</h2>

                    <p>
                        Cari berdasarkan nama lokasi
                        atau alamat konstruksi.
                    </p>
                </div>
            </div>

            <div class="kf-toolbar">

                <label class="kf-search">
                    <i data-lucide="search"></i>

                    <input id="kfCari" type="search" placeholder="Cari lokasi atau alamat..." autocomplete="off">
                </label>

                <label class="kf-limit">
                    <span>Jumlah data</span>

                    <select id="kfLimit">
                        <option value="10">10</option>
                        <option value="20" selected>20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </label>

                <button type="button" class="kf-btn outline" id="kfReset">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>
            </div>
        </section>

        {{-- DAFTAR LOKASI KONSTRUKSI --}}

        <section class="kf-card">

            <div class="kf-card-head">

                <div>
                    <h2>Daftar Lokasi Konstruksi</h2>

                    <p>
                        Kelola data konstruksi berdasarkan
                        lokasi, departemen, dan divisi.
                    </p>
                </div>

                <div class="kf-card-actions">

                    <span class="kf-pill">
                        <i data-lucide="database"></i>
                        PostgreSQL
                    </span>

                    <button type="button" class="kf-btn primary" id="kfTambah">
                        <i data-lucide="plus"></i>
                        Tambah Data Konstruksi
                    </button>
                </div>
            </div>

            <div class="kf-table-wrap">

                <table class="kf-table kf-main-table" id="kfTabelLokasi">

                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Lokasi Konstruksi</th>
                            <th>Alamat</th>
                            <th>Data Konstruksi</th>
                            <th>Nilai (Rp)</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody>

                        @forelse ($lokasis as $i => $lok)
                            <tr data-kf-row
                                data-search="{{ mb_strtolower(($lok->lokasi ?? '') . ' ' . ($lok->alamat ?? '')) }}">

                                <td>{{ $i + 1 }}</td>

                                <td>
                                    <div class="kf-location">

                                        <span class="kf-location-icon">
                                            <i data-lucide="map-pin"></i>
                                        </span>

                                        <div>
                                            <strong>
                                                {{ $lok->lokasi ?: 'Belum Dipetakan' }}
                                            </strong>

                                            <small>
                                                ID Lokasi #{{ $lok->id_lokasi ?: '—' }}
                                            </small>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    {{ $lok->alamat ?: '—' }}
                                </td>

                                <td>
                                    <span class="kf-count">
                                        <i data-lucide="files"></i>

                                        {{ number_format((int) $lok->jumlah, 0, ',', '.') }}
                                        data
                                    </span>
                                </td>

                                {{-- NILAI BISA DIKLIK --}}

                                <td>
                                    <button type="button" class="kf-value-button"
                                        data-kf-value="{{ (int) ($lok->id_lokasi ?? 0) }}"
                                        data-kf-nama="{{ $lok->lokasi ?: 'Belum Dipetakan' }}"
                                        title="Lihat rincian nilai konstruksi">
                                        <span>
                                            <strong>
                                                {{ $rupiah($lok->nilai) }}
                                            </strong>

                                            <small>
                                                Rincian {{ (int) $lok->jumlah }} inventaris
                                            </small>
                                        </span>

                                        <i data-lucide="external-link"></i>
                                    </button>
                                </td>

                                {{-- AKSI --}}

                                <td>
                                    <div class="kf-actions">

                                        <button type="button" class="kf-icon-btn view" data-kf-action="view"
                                            data-kf-lokasi="{{ (int) ($lok->id_lokasi ?? 0) }}"
                                            data-kf-nama="{{ $lok->lokasi ?: 'Belum Dipetakan' }}" title="Detail Lokasi">
                                            <i data-lucide="eye"></i>
                                        </button>

                                        <button type="button" class="kf-icon-btn edit" data-kf-action="edit"
                                            data-kf-lokasi="{{ (int) ($lok->id_lokasi ?? 0) }}"
                                            data-kf-nama="{{ $lok->lokasi ?: 'Belum Dipetakan' }}"
                                            title="Pilih inventaris untuk diedit">
                                            <i data-lucide="pencil"></i>
                                        </button>

                                        <button type="button" class="kf-icon-btn delete" data-kf-action="delete"
                                            data-kf-lokasi="{{ (int) ($lok->id_lokasi ?? 0) }}"
                                            data-kf-nama="{{ $lok->lokasi ?: 'Belum Dipetakan' }}"
                                            title="Pilih inventaris untuk dihapus">
                                            <i data-lucide="trash-2"></i>
                                        </button>

                                    </div>
                                </td>

                            </tr>

                        @empty

                            <tr>
                                <td colspan="6" class="kf-empty">
                                    Belum ada data konstruksi.
                                </td>
                            </tr>
                        @endforelse

                    </tbody>
                </table>
            </div>

            <footer class="kf-table-footer">

                <span id="kfInfo">
                    {{ $lokasis->count() }} lokasi
                </span>

                <div id="kfPages" class="kf-pages"></div>

            </footer>
        </section>

    </section>

    {{-- MODAL DETAIL LOKASI --}}

    <dialog class="kf-dialog wide" id="kfModalLokasi" aria-labelledby="kfJudulLokasi">

        <header class="kf-dialog-head">

            <div>
                <small>K.I.B F — STRUKTUR ORGANISASI</small>

                <h2 id="kfJudulLokasi">
                    Detail Lokasi
                </h2>

                <p>
                    Pilih departemen dan divisi
                    untuk melihat inventaris konstruksi.
                </p>
            </div>

            <button type="button" class="kf-close" data-kf-close="kfModalLokasi">
                <i data-lucide="x"></i>
            </button>

        </header>

        <div class="kf-dialog-content kf-lokasi-grid">

            <aside class="kf-tree-panel">

                <h3>Struktur Organisasi</h3>

                <div id="kfDepartemenTree"></div>

                <div id="kfDivisiTree"></div>

            </aside>

            <section class="kf-aset-panel">

                <h3 id="kfJudulUnit">
                    Daftar Inventaris
                </h3>

                <p class="kf-subtitle">
                    Data mengikuti struktur Excel K.I.B F.
                </p>

                <div id="kfQuickActions" class="kf-quick-actions" hidden></div>

                <div class="kf-table-wrap kf-excel-wrap">

                    <table class="kf-table kf-excel-table">

                        <thead>

                            <tr>
                                <th rowspan="2">No.</th>
                                <th rowspan="2">
                                    Nama Barang / Jenis Barang
                                </th>
                                <th rowspan="2">Tahun</th>
                                <th rowspan="2">
                                    Bangunan (P, SP, D)
                                </th>

                                <th colspan="2">
                                    Konstruksi Bangunan
                                </th>

                                <th rowspan="2">
                                    Luas (m²)
                                </th>

                                <th rowspan="2">
                                    Letak / Lokasi Alamat
                                </th>

                                <th rowspan="2">
                                    Status Tanah
                                </th>

                                <th rowspan="2">
                                    Asal Usul Pembiayaan
                                </th>

                                <th rowspan="2">
                                    Status Aset
                                </th>

                                <th rowspan="2">
                                    Nilai (Rp)
                                </th>

                                <th rowspan="2">
                                    Dokumen Pendukung / Aksi
                                </th>
                            </tr>

                            <tr>
                                <th>Bertingkat / Tidak</th>
                                <th>Beton / Tidak</th>
                            </tr>

                        </thead>

                        <tbody id="kfTabelInventaris"></tbody>

                    </table>
                </div>
            </section>
        </div>

        <footer class="kf-dialog-foot">
            <button type="button" class="kf-btn outline" data-kf-close="kfModalLokasi">
                Tutup
            </button>
        </footer>

    </dialog>

    {{-- MODAL RINCIAN NILAI --}}

    <dialog class="kf-dialog" id="kfModalNilai" aria-labelledby="kfNilaiJudul">

        <header class="kf-dialog-head">

            <div>
                <small>RINCIAN NILAI KONSTRUKSI</small>

                <h2 id="kfNilaiJudul">
                    Rincian Nilai Aset
                </h2>

                <p>
                    Rincian nilai berdasarkan inventaris K.I.B F.
                </p>
            </div>

            <button class="kf-close" type="button" data-kf-close="kfModalNilai">
                <i data-lucide="x"></i>
            </button>

        </header>

        <div class="kf-dialog-content">

            <div class="kf-nilai-summary">
                Total Nilai:

                <strong id="kfNilaiTotal">
                    Rp 0
                </strong>
            </div>

            <div class="kf-table-wrap">

                <table class="kf-table kf-nilai-table">

                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Nama Barang</th>
                            <th>Departemen / Divisi</th>
                            <th>Tahun</th>
                            <th>Nilai (Rp)</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody id="kfNilaiBody"></tbody>

                </table>
            </div>
        </div>

        <footer class="kf-dialog-foot">
            <button class="kf-btn outline" type="button" data-kf-close="kfModalNilai">
                Tutup
            </button>
        </footer>

    </dialog>

    {{-- MODAL DETAIL INVENTARIS --}}

    <dialog class="kf-dialog" id="kfModalDetail" aria-labelledby="kfJudulDetail">

        <header class="kf-dialog-head">

            <div>
                <small>DETAIL KARTU INVENTARIS BARANG F</small>

                <h2 id="kfJudulDetail">
                    Detail Konstruksi
                </h2>
            </div>

            <button class="kf-close" type="button" data-kf-close="kfModalDetail">
                <i data-lucide="x"></i>
            </button>
        </header>

        <div class="kf-dialog-content" id="kfIsiDetail"></div>

        <footer class="kf-dialog-foot">

            <button class="kf-btn outline" type="button" data-kf-close="kfModalDetail">
                Tutup
            </button>

            <button class="kf-btn warning" type="button" id="kfEdit">
                <i data-lucide="pencil"></i>
                Edit
            </button>

            <button class="kf-btn danger" type="button" id="kfHapus">
                <i data-lucide="trash-2"></i>
                Hapus
            </button>
        </footer>

    </dialog>

    {{-- MODAL TAMBAH DAN EDIT --}}

    <dialog class="kf-dialog kf-form-dialog" id="kfModalForm" aria-labelledby="kfJudulForm">

        <form id="kfForm" enctype="multipart/form-data">
            @csrf

            <input type="hidden" name="id_nilai_aktiva" id="kfSourceId">

            <header class="kf-dialog-head">

                <div>
                    <small>K.I.B F — KONSTRUKSI</small>

                    <h2 id="kfJudulForm">
                        Tambah Data Konstruksi
                    </h2>

                    <p>
                        Pilih Data Nilai Aset,
                        kemudian lengkapi formulir K.I.B F.
                    </p>
                </div>

                <button class="kf-close" type="button" data-kf-close="kfModalForm">
                    <i data-lucide="x"></i>
                </button>
            </header>

            <div class="kf-dialog-content">

                <p id="kfError" class="kf-error" hidden></p>

                {{-- 1. DATA PENDING --}}

                <section class="kf-form-section" id="kfSourceSection">

                    <div class="kf-section-title">
                        <span>1</span>

                        <div>
                            <h3>Pilih Data Nilai Aset</h3>

                            <p>
                                Pilih transaksi Penambahan Aset
                                kategori Konstruksi.
                            </p>
                        </div>
                    </div>

                    <div class="kf-pending-toolbar">

                        <label class="kf-search">
                            <i data-lucide="search"></i>

                            <input type="search" id="kfPendingCari"
                                placeholder="Cari voucher, lokasi, departemen, divisi, uraian...">
                        </label>

                        <span id="kfPendingTotal">
                            0 data
                        </span>
                    </div>

                    <div class="kf-table-wrap kf-pending-wrap">

                        <table class="kf-table kf-pending-table">

                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Voucher</th>
                                    <th>Lokasi / Alamat</th>
                                    <th>Departemen</th>
                                    <th>Divisi</th>
                                    <th>Tahun</th>
                                    <th>Nilai</th>
                                    <th>Uraian</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>

                            <tbody id="kfPendingBody"></tbody>

                        </table>
                    </div>
                </section>

                {{-- DATA TERPILIH --}}

                <div class="kf-selected-source" id="kfSourceSelected" hidden>

                    <i data-lucide="circle-check-big"></i>

                    <div>
                        <small>Transaksi Terpilih</small>

                        <strong id="kfVoucher"></strong>

                        <p id="kfVoucherUrai"></p>
                    </div>

                    <button class="kf-btn outline" type="button" id="kfPilihUlang">
                        Ganti
                    </button>
                </div>

                {{-- 2. ORGANISASI --}}

                <section class="kf-form-section">

                    <div class="kf-section-title">
                        <span>2</span>

                        <div>
                            <h3>Identitas dan Lokasi</h3>

                            <p>
                                Terisi otomatis berdasarkan
                                transaksi Nilai Aset.
                            </p>
                        </div>
                    </div>

                    <div class="kf-fields two">

                        <label>
                            Lokasi

                            <input id="kfLokasi" readonly>
                        </label>

                        <label>
                            Alamat Lokasi

                            <input id="kfAlamat" readonly>
                        </label>

                        <label>
                            Departemen

                            <input id="kfDepartemen" readonly>
                        </label>

                        <label>
                            Divisi

                            <input id="kfDivisi" readonly>
                        </label>

                    </div>
                </section>

                {{-- 3. DATA KONSTRUKSI --}}

                <section class="kf-form-section">

                    <div class="kf-section-title">
                        <span>3</span>

                        <div>
                            <h3>Data Konstruksi Bangunan</h3>

                            <p>
                                Sesuai kolom Excel K.I.B F.
                            </p>
                        </div>
                    </div>

                    <div class="kf-fields two">

                        <label class="full">
                            Nama Barang / Jenis Barang <b>*</b>

                            <select name="id_barang" id="kfBarang" required>
                                <option value="">
                                    — Pilih Barang —
                                </option>

                                @foreach ($barangs as $barang)
                                    <option value="{{ $barang->id }}">
                                        {{ trim((string) $barang->kode_barang) }}
                                        —
                                        {{ trim((string) $barang->nama_barang) }}
                                    </option>
                                @endforeach
                            </select>
                        </label>

                        <label>
                            Tahun <b>*</b>

                            <input type="number" name="tahun" id="kfTahun" min="1900" max="2100" required>
                        </label>

                        <label>
                            Bangunan (P, SP, D)

                            <select name="type" id="kfType">
                                <option value="">Pilih</option>
                                <option value="P">Permanen</option>
                                <option value="SP">Semi Permanen</option>
                                <option value="D">Darurat</option>
                            </select>
                        </label>

                        <label>
                            Bertingkat / Tidak

                            <select name="struktur" id="kfStruktur">
                                <option value="">Pilih</option>
                                <option value="BERTINGKAT">
                                    Bertingkat
                                </option>
                                <option value="TIDAK BERTINGKAT">
                                    Tidak Bertingkat
                                </option>
                            </select>
                        </label>

                        <label>
                            Beton / Tidak

                            <select name="materi" id="kfMateri">
                                <option value="">Pilih</option>
                                <option value="BETON">Beton</option>
                                <option value="TIDAK BETON">
                                    Tidak Beton
                                </option>
                            </select>
                        </label>

                        <label>
                            Luas (m²)

                            <input type="number" name="luas" id="kfLuas" min="0" step="0.01">
                        </label>

                        <label>
                            Letak / Lokasi Alamat

                            <input name="letak" id="kfLetak" maxlength="255">
                        </label>

                        <label>
                            Status Tanah

                            <input name="status_tanah" id="kfStatusTanah" maxlength="255">
                        </label>

                        <label>
                            Asal Usul Pembiayaan

                            <input name="asal" id="kfAsal" maxlength="255">
                        </label>

                        <label>
                            Status Aset

                            <input name="status_aset" id="kfStatusAset" maxlength="255">
                        </label>

                        <label>
                            Nilai Aset (Rp)

                            <input id="kfNilai" readonly>

                            <small>
                                Nominal mengikuti transaksi Nilai Aset.
                            </small>
                        </label>

                        <label class="full">
                            Uraian Pekerjaan <b>*</b>

                            <textarea name="urai" id="kfUrai" rows="4" required></textarea>
                        </label>

                        <label class="full">
                            Dokumen Pendukung / Keterangan

                            <textarea name="ket" id="kfKet" rows="5"
                                placeholder="Nomor berita acara, tanggal, kontraktor, nomor kontrak, dan keterangan lainnya."></textarea>
                        </label>

                    </div>
                </section>

                {{-- 4. BERKAS --}}

                <section class="kf-form-section">

                    <div class="kf-section-title">
                        <span>4</span>

                        <div>
                            <h3>Berkas Pendukung</h3>

                            <p>
                                Foto dan dokumen PDF konstruksi.
                            </p>
                        </div>
                    </div>

                    <div class="kf-fields two">

                        <label>
                            Foto Konstruksi (maks. 5 MB)

                            <input type="file" name="foto" id="kfFoto"
                                accept="image/jpeg,image/png,image/webp">
                        </label>

                        <label>
                            Dokumen PDF (maks. 10 MB)

                            <input type="file" name="dokumen" id="kfDokumen" accept="application/pdf">
                        </label>

                    </div>

                    <p class="kf-hint">
                        Saat edit, kosongkan berkas bila
                        tidak ingin mengganti file lama.
                    </p>

                </section>

            </div>

            <footer class="kf-dialog-foot">

                <button class="kf-btn outline" type="button" data-kf-close="kfModalForm">
                    Batal
                </button>

                <button class="kf-btn primary" type="submit" id="kfSimpan">
                    <i data-lucide="save"></i>
                    Simpan Data Konstruksi
                </button>

            </footer>

        </form>
    </dialog>
@endsection

@push('scripts')
    <script
        src="{{ asset('js/pages/kib/konstruksi.js') }}?v={{ file_exists(public_path('js/pages/kib/konstruksi.js')) ? filemtime(public_path('js/pages/kib/konstruksi.js')) : '1' }}">
    </script>
@endpush
