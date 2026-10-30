@extends('layouts.main')

@section('title', 'K.I.B F - Konstruksi')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">
@endpush

@section('content')
    @php
        $rupiah = fn($value) => 'Rp ' . number_format((float) ($value ?? 0), 0, ',', '.');

        $jumlahKonstruksi = (int) ($statistik->jumlah ?? 0);
        $jumlahLokasi = (int) ($statistik->lokasi ?? 0);
    @endphp

    <section class="content kf" id="kfApp" data-base="{{ url('/kib/konstruksi') }}"
        data-save="{{ route('kib.konstruksi.store') }}" data-pending="{{ route('kib.pending', ['module' => 'konstruksi']) }}"
        data-token="{{ csrf_token() }}">

        {{-- HEADER --}}

        <header class="kf-hero">
            <nav class="kf-crumb" aria-label="Breadcrumb">
                <a href="{{ route('dashboard') }}" aria-label="Dashboard">
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
                        Pengelolaan konstruksi berdasarkan lokasi,
                        departemen, divisi, dan transaksi Nilai Aset.
                    </p>
                </div>

                <button class="kf-btn primary" type="button" id="kfTambah">
                    <i data-lucide="plus"></i>
                    Tambah Data Konstruksi
                </button>
            </div>

            {{-- STATISTIK --}}

            <div class="kf-kpis">
                <article>
                    <i data-lucide="map-pin"></i>

                    <div>
                        <small>Lokasi Konstruksi</small>

                        <strong>
                            {{ number_format($jumlahLokasi, 0, ',', '.') }}
                        </strong>

                        <span>Lokasi aset yang terdaftar</span>
                    </div>
                </article>

                <article>
                    <i data-lucide="hard-hat"></i>

                    <div>
                        <small>Inventaris K.I.B F</small>

                        <strong>
                            {{ number_format($jumlahKonstruksi, 0, ',', '.') }}
                        </strong>

                        <span>Data inventaris konstruksi</span>
                    </div>
                </article>

                <article>
                    <i data-lucide="wallet"></i>

                    <div>
                        <small>Total Nilai Konstruksi</small>

                        <strong class="kf-money-small">
                            {{ $rupiah($statistik->nilai ?? 0) }}
                        </strong>

                        <span>Nilai tercatat di database</span>
                    </div>
                </article>

                <article>
                    <i data-lucide="clock-3"></i>

                    <div>
                        <small>Update Terakhir</small>

                        <strong class="kf-date-small">
                            @if (!empty($statistik->terakhir))
                                {{ \Carbon\Carbon::parse($statistik->terakhir)->locale('id')->diffForHumans() }}
                            @else
                                Belum diketahui
                            @endif
                        </strong>

                        <span>Berdasarkan tanggal pembaruan</span>
                    </div>
                </article>
            </div>
        </header>

        {{-- DATA NILAI ASET MASUK --}}

        <section class="kf-incoming kib-incoming-card" aria-label="Data Nilai Aset masuk">
            <div class="kib-incoming-icon">
                <i data-lucide="inbox"></i>
            </div>

            <div class="kib-incoming-content">
                <div class="kib-incoming-title-row">
                    <div>
                        <span class="kib-incoming-eyebrow">
                            DATA NILAI ASET
                        </span>

                        <h3>
                            Data Konstruksi Menunggu Diproses
                        </h3>
                    </div>
                </div>

                <p>
                    Buka daftar transaksi Nilai Aset kategori
                    Konstruksi untuk memilih voucher Penambahan Aset.
                    Lokasi, alamat, departemen, divisi, tahun,
                    dan nilai akan diisi otomatis.
                </p>
            </div>

            <div class="kib-incoming-action">
                <button type="button" id="kfLihatMasuk" class="kib-incoming-button">
                    <i data-lucide="inbox"></i>
                    <span>Lihat Data Masuk</span>
                </button>
            </div>
        </section>

        {{-- FILTER DATA --}}

        <section class="kf-card">
            <div class="kf-card-head">
                <div>
                    <h2>Filter Data Konstruksi</h2>
                    <p>Cari nama lokasi dan alamat konstruksi.</p>
                </div>
            </div>

            <div class="kf-toolbar">
                <label class="kf-search" aria-label="Cari lokasi">
                    <i data-lucide="search"></i>

                    <input id="kfCari" type="search" placeholder="Cari lokasi atau alamat..." autocomplete="off">
                </label>

                <label class="kf-limit">
                    <span>Jumlah data</span>

                    <select id="kfLimit" aria-label="Jumlah baris">
                        <option>10</option>
                        <option selected>20</option>
                        <option>50</option>
                        <option>100</option>
                    </select>
                </label>

                <button type="button" class="kf-btn outline" id="kfReset">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>
            </div>
        </section>

        {{-- TABEL UTAMA LOKASI --}}

        <section class="kf-card">
            <div class="kf-card-head">
                <div>
                    <h2>Daftar Lokasi Konstruksi</h2>

                    <p>
                        Pilih tombol Detail untuk menampilkan
                        inventaris sesuai kolom K.I.B F.
                    </p>
                </div>

                <span class="kf-pill">
                    <i data-lucide="database"></i>
                    PostgreSQL
                </span>
            </div>

            <div class="kf-table-wrap">
                <table class="kf-table kf-main-table" id="kfTabelLokasi">
                    <thead>
                        <tr>
                            <th>No</th>
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
                                    <div class="kf-location-name">
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

                                <td>{{ $lok->alamat ?: '—' }}</td>

                                <td>
                                    <span class="kf-count-chip">
                                        <i data-lucide="files"></i>

                                        {{ number_format((int) $lok->jumlah, 0, ',', '.') }}
                                        data
                                    </span>
                                </td>

                                <td>
                                    <strong class="kf-price">
                                        {{ $rupiah($lok->nilai) }}
                                    </strong>
                                </td>

                                <td>
                                    <button type="button" class="kf-icon-btn"
                                        data-kf-lokasi="{{ (int) ($lok->id_lokasi ?? 0) }}"
                                        data-kf-nama="{{ $lok->lokasi ?: 'Belum Dipetakan' }}"
                                        aria-label="Detail lokasi {{ $lok->lokasi ?: 'Belum Dipetakan' }}" title="Detail">
                                        <i data-lucide="eye"></i>
                                    </button>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="kf-empty">
                                    Belum ada inventaris Konstruksi
                                    pada database.
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
                <small>K.I.B F / STRUKTUR ORGANISASI</small>
                <h2 id="kfJudulLokasi">Detail Lokasi</h2>

                <p>
                    Pilih departemen dan divisi untuk
                    melihat daftar konstruksi.
                </p>
            </div>

            <button class="kf-close" type="button" data-kf-close="kfModalLokasi" aria-label="Tutup">
                <i data-lucide="x"></i>
            </button>
        </header>

        <div class="kf-dialog-content kf-lokasi-grid">
            <aside class="kf-tree-panel">
                <h3>
                    <i data-lucide="network"></i>
                    Struktur Organisasi
                </h3>

                <p>Departemen dan divisi</p>

                <div id="kfDepartemenTree"></div>
                <div id="kfDivisiTree"></div>
            </aside>

            <section class="kf-aset-panel">
                <h3 id="kfJudulUnit">
                    Daftar Konstruksi
                </h3>

                <p class="kf-table-subtitle">
                    Tabel mengikuti struktur
                    Kartu Inventaris Barang F (Excel).
                </p>

                <div class="kf-table-wrap kf-excel-wrap">
                    <table class="kf-table kf-excel-table">
                        <thead>
                            <tr>
                                <th rowspan="2">No.</th>

                                <th rowspan="2">
                                    Nama Barang / Jenis Barang
                                    dan Uraian
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

                        <tbody id="kfTabelInventaris">
                            <tr>
                                <td colspan="13" class="kf-empty">
                                    Pilih lokasi untuk menampilkan data.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        <footer class="kf-dialog-foot">
            <button class="kf-btn outline" type="button" data-kf-close="kfModalLokasi">
                Tutup
            </button>
        </footer>
    </dialog>

    {{-- MODAL DETAIL INVENTARIS --}}

    <dialog class="kf-dialog" id="kfModalDetail" aria-labelledby="kfJudulDetail">
        <header class="kf-dialog-head">
            <div>
                <small>
                    KARTU INVENTARIS BARANG / K.I.B F
                </small>

                <h2 id="kfJudulDetail">
                    Detail Konstruksi
                </h2>

                <p>
                    Informasi lengkap konstruksi
                    sesuai struktur tabel Excel.
                </p>
            </div>

            <button type="button" class="kf-close" data-kf-close="kfModalDetail" aria-label="Tutup">
                <i data-lucide="x"></i>
            </button>
        </header>

        <div class="kf-dialog-content" id="kfIsiDetail">
            Memuat data...
        </div>

        <footer class="kf-dialog-foot">
            <button type="button" class="kf-btn outline" data-kf-close="kfModalDetail">
                Tutup
            </button>

            <button type="button" class="kf-btn warning" id="kfEdit">
                <i data-lucide="pencil"></i>
                Edit
            </button>

            <button type="button" class="kf-btn danger" id="kfHapus">
                <i data-lucide="trash-2"></i>
                Hapus
            </button>
        </footer>
    </dialog>

    {{-- MODAL FORM TAMBAH DAN EDIT --}}

    <dialog class="kf-dialog kf-form-dialog" id="kfModalForm" aria-labelledby="kfJudulForm">
        <form id="kfForm" enctype="multipart/form-data">
            @csrf

            <input type="hidden" name="id_nilai_aktiva" id="kfSourceId">

            <header class="kf-dialog-head">
                <div>
                    <small>K.I.B F / KONSTRUKSI</small>

                    <h2 id="kfJudulForm">
                        Tambah Data Konstruksi
                    </h2>

                    <p>
                        Pilih transaksi Nilai Aset,
                        kemudian lengkapi inventaris
                        sesuai Excel K.I.B F.
                    </p>
                </div>

                <button class="kf-close" type="button" data-kf-close="kfModalForm" aria-label="Tutup">
                    <i data-lucide="x"></i>
                </button>
            </header>

            <div class="kf-dialog-content">
                <p id="kfError" class="kf-error" role="alert" hidden></p>

                {{-- BAGIAN 1: DATA PENDING --}}

                <section class="kf-form-section" id="kfSourceSection">
                    <div class="kf-section-title">
                        <span>1</span>

                        <div>
                            <h3>Pilih Data Nilai Aset</h3>

                            <p>
                                Pilih transaksi kategori Konstruksi
                                dengan jenis Penambahan Aset.
                            </p>
                        </div>
                    </div>

                    <div class="kf-pending-toolbar">
                        <label class="kf-search">
                            <i data-lucide="search"></i>

                            <input type="search" id="kfPendingCari" autocomplete="off"
                                placeholder="Cari voucher, lokasi, departemen, divisi atau uraian...">
                        </label>

                        <span id="kfPendingTotal">0 data</span>
                    </div>

                    <div class="kf-table-wrap kf-pending-wrap">
                        <table class="kf-table kf-pending-table">
                            <thead>
                                <tr>
                                    <th>No</th>
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

                            <tbody id="kfPendingBody">
                                <tr>
                                    <td colspan="9" class="kf-empty">
                                        Memuat data Nilai Aset...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {{-- INFORMASI VOUCHER TERPILIH --}}

                <div id="kfSourceSelected" class="kf-selected-source" hidden>
                    <i data-lucide="circle-check-big"></i>

                    <div>
                        <small>Data Nilai Aset Terpilih</small>

                        <strong id="kfVoucher">—</strong>

                        <p id="kfVoucherUrai">—</p>
                    </div>

                    <button type="button" class="kf-btn outline" id="kfPilihUlang">
                        Ganti
                    </button>
                </div>

                {{-- BAGIAN 2: IDENTITAS LOKASI --}}

                <section class="kf-form-section">
                    <div class="kf-section-title">
                        <span>2</span>

                        <div>
                            <h3>Identitas Konstruksi dan Lokasi</h3>

                            <p>
                                Kolom organisasi otomatis dari
                                transaksi Nilai Aset.
                            </p>
                        </div>
                    </div>

                    <div class="kf-fields two">
                        <label>
                            Lokasi

                            <input type="text" id="kfLokasi" readonly placeholder="Pilih transaksi Nilai Aset">
                        </label>

                        <label>
                            Alamat Lokasi

                            <input type="text" id="kfAlamat" readonly placeholder="Otomatis dari lokasi">
                        </label>

                        <label>
                            Departemen

                            <input type="text" id="kfDepartemen" readonly>
                        </label>

                        <label>
                            Divisi

                            <input type="text" id="kfDivisi" readonly>
                        </label>
                    </div>
                </section>

                {{-- BAGIAN 3: KIB F EXCEL --}}

                <section class="kf-form-section">
                    <div class="kf-section-title">
                        <span>3</span>

                        <div>
                            <h3>Data Konstruksi Bangunan — K.I.B F</h3>

                            <p>
                                Urutan formulir mengikuti kolom-kolom
                                pada Kartu Inventaris Barang F.
                            </p>
                        </div>
                    </div>

                    <div class="kf-fields two">
                        <label class="full">
                            Nama Barang / Jenis Barang <b>*</b>

                            <select name="id_barang" id="kfBarang" required>
                                <option value="">
                                    — Pilih Barang Master —
                                </option>

                                @foreach ($barangs as $b)
                                    <option value="{{ $b->id }}">
                                        {{ trim((string) $b->kode_barang) }}
                                        —
                                        {{ trim((string) $b->nama_barang) }}
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
                                <option value="">— Pilih —</option>
                                <option value="P">Permanen (P)</option>
                                <option value="SP">Semi Permanen (SP)</option>
                                <option value="D">Darurat (D)</option>
                            </select>
                        </label>

                        <label>
                            Konstruksi Bangunan — Bertingkat / Tidak

                            <select name="struktur" id="kfStruktur">
                                <option value="">— Pilih —</option>
                                <option value="BERTINGKAT">
                                    Bertingkat
                                </option>
                                <option value="TIDAK BERTINGKAT">
                                    Tidak Bertingkat
                                </option>
                            </select>
                        </label>

                        <label>
                            Konstruksi Bangunan — Beton / Tidak

                            <select name="materi" id="kfMateri">
                                <option value="">— Pilih —</option>
                                <option value="BETON">Beton</option>
                                <option value="TIDAK BETON">
                                    Tidak Beton
                                </option>
                            </select>
                        </label>

                        <label>
                            Luas (m²)

                            <input type="number" name="luas" id="kfLuas" min="0" step="0.01"
                                placeholder="Contoh: 125.50">
                        </label>

                        <label>
                            Letak / Lokasi Alamat

                            <input name="letak" id="kfLetak" maxlength="255" placeholder="Letak konstruksi">
                        </label>

                        <label>
                            Status Tanah

                            <input name="status_tanah" id="kfStatusTanah" maxlength="255" placeholder="Contoh: Pemkot">
                        </label>

                        <label>
                            Asal Usul Pembiayaan

                            <input name="asal" id="kfAsal" maxlength="255" placeholder="Contoh: Pemprov">
                        </label>

                        <label>
                            Status Aset

                            <input name="status_aset" id="kfStatusAset" maxlength="255"
                                placeholder="Contoh: Serah Terima">
                        </label>

                        <label>
                            Nilai (Rp) — dari Voucher

                            <input id="kfNilai" readonly placeholder="Otomatis dari Nilai Aset">

                            <small>
                                Nilai diambil dari voucher dan
                                tidak dapat diubah di formulir ini.
                            </small>
                        </label>

                        <label class="full">
                            Uraian Pekerjaan / Deskripsi Jenis Barang
                            <b>*</b>

                            <textarea name="urai" id="kfUrai" rows="4" required
                                placeholder="Nama pekerjaan, rincian kegiatan, dan spesifikasi sesuai K.I.B F."></textarea>
                        </label>

                        <label class="full">
                            Dokumen Pendukung / Keterangan

                            <textarea name="ket" id="kfKet" rows="5"
                                placeholder="Contoh: Berita acara serah terima, nomor dan tanggal; kontraktor pelaksana; nomor dan tanggal kontrak; keterangan lainnya."></textarea>

                            <small>
                                Isi informasi dokumen pendukung
                                seperti kolom paling kanan pada Excel K.I.B F.
                            </small>
                        </label>
                    </div>
                </section>

                {{-- BAGIAN 4: BERKAS --}}

                <section class="kf-form-section">
                    <div class="kf-section-title">
                        <span>4</span>

                        <div>
                            <h3>Berkas Pendukung</h3>

                            <p>
                                Foto konstruksi serta dokumen PDF.
                                Saat edit, kosongkan input berkas
                                untuk mempertahankan dokumen lama.
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
                            Dokumen Pendukung PDF (maks. 10 MB)

                            <input type="file" name="dokumen" id="kfDokumen" accept="application/pdf">
                        </label>
                    </div>
                </section>
            </div>

            <footer class="kf-dialog-foot">
                <button type="button" class="kf-btn outline" data-kf-close="kfModalForm">
                    Batal
                </button>

                <button type="submit" class="kf-btn primary" id="kfSimpan">
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
