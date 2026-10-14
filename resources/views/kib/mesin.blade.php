
@extends('layouts.main')

@section('title', 'Peralatan dan Mesin')

@section('content')

@php
    $rupiah = fn ($nilai) =>
        'Rp ' . number_format((int) ($nilai ?? 0), 0, ',', '.');
@endphp

<link
    rel="stylesheet"
    href="{{ asset('css/pages/kib/mesin.css') }}?v={{ file_exists(public_path('css/pages/kib/mesin.css')) ? filemtime(public_path('css/pages/kib/mesin.css')) : time() }}"
>

<section
    class="content mesin-page"
    id="mesinPage"
    data-pending-url="{{ route('kib.mesin.pending') }}"
    data-detail-base="{{ url('/kib/mesin/lokasi') }}"
    data-record-base="{{ url('/kib/mesin') }}"
    data-store-url="{{ route('kib.mesin.store') }}"
>

    {{-- ==========================================================
         01. HEADER & KPI
    =========================================================== --}}

    <header class="mesin-hero">

        <div class="mesin-hero-overlay"></div>

        <div class="mesin-hero-inner">

            <nav class="mesin-breadcrumb">

                <a href="{{ url('/dashboard') }}">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>

                <span>K.I.B</span>

                <i data-lucide="chevron-right"></i>

                <strong>Peralatan dan Mesin</strong>

            </nav>

            <div class="mesin-heading">

                <h1>Peralatan dan Mesin</h1>

                <p>
                    Kelola Kartu Inventaris Barang kategori Peralatan
                    dan Mesin, data inventaris, lokasi, nilai aset,
                    dokumen, serta pemrosesan transaksi Nilai Aset.
                </p>

            </div>

            <div class="mesin-kpi-grid">

                <article class="mesin-kpi-card">

                    <div class="mesin-kpi-icon">
                        <i data-lucide="package"></i>
                    </div>

                    <div>
                        <span>Total Data Mesin</span>

                        <strong>
                            {{ number_format($totalAset, 0, ',', '.') }}
                        </strong>

                        <p>Data inventaris terdaftar</p>
                    </div>

                </article>

                <article class="mesin-kpi-card">

                    <div class="mesin-kpi-icon">
                        <i data-lucide="wallet"></i>
                    </div>

                    <div>
                        <span>Total Nilai Mesin</span>

                        <strong>
                            {{ $rupiah($totalNilai) }}
                        </strong>

                        <p>Berdasarkan transaksi Nilai Aset</p>
                    </div>

                </article>

                <article class="mesin-kpi-card">

                    <div class="mesin-kpi-icon">
                        <i data-lucide="map-pin"></i>
                    </div>

                    <div>
                        <span>Jumlah Lokasi</span>

                        <strong>
                            {{ number_format($totalLokasi, 0, ',', '.') }}
                        </strong>

                        <p>Lokasi yang memiliki barang Mesin</p>
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


    {{-- ==========================================================
         02. NOTIFIKASI VALIDASI & SUKSES
    =========================================================== --}}

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


    {{-- ==========================================================
         03. PENDING NILAI ASET
    =========================================================== --}}

    <section class="mesin-incoming-card">

        <div class="mesin-incoming-icon">
            <i data-lucide="bell-ring"></i>
        </div>

        <div class="mesin-incoming-copy">

            <small>NILAI ASET</small>

            <h3>
                Data Peralatan dan Mesin Menunggu Diproses
            </h3>

            <p>
                Ada
                <strong id="mesinPendingLabel">
                    {{ $totalPending }}
                </strong>
                transaksi Nilai Aset kategori Peralatan
                dan Mesin yang masih pending.
            </p>

            <span class="mesin-pending-pill">

                <i data-lucide="inbox"></i>

                <strong id="mesinPendingPill">
                    {{ $totalPending }}
                </strong>

                Data Pending Mesin

            </span>

        </div>

        <button
            type="button"
            class="mesin-button outline"
            id="mesinOpenPending"
        >

            <i data-lucide="list-checks"></i>

            Lihat Data Masuk

        </button>

    </section>


    {{-- ==========================================================
         04. FILTER & TABEL
    =========================================================== --}}

    <section class="mesin-card mesin-workspace">

        <div class="mesin-workspace-head">

            <div>

                <h2>Daftar Peralatan dan Mesin</h2>

                <p>
                    Data dikelompokkan berdasarkan lokasi,
                    mengikuti struktur inventaris pada web aset lama.
                </p>

            </div>

            <button
                type="button"
                class="mesin-button primary"
                id="mesinAddButton"
            >

                <i data-lucide="plus"></i>

                Tambah Data Mesin

            </button>

        </div>


        <div class="mesin-filters">

            <label class="mesin-search-box" for="mesinSearch">

                <i data-lucide="search"></i>

                <input
                    type="search"
                    id="mesinSearch"
                    placeholder="Cari lokasi atau alamat..."
                >

            </label>


            <label for="mesinPageSize">

                Jumlah data

                <select id="mesinPageSize">
                    <option value="10">10</option>
                    <option value="20" selected>20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>

            </label>


            <button
                type="button"
                class="mesin-button outline"
                id="mesinReset"
            >
                <i data-lucide="refresh-cw"></i>
                Reset
            </button>


            <button
                type="button"
                class="mesin-button outline"
                id="mesinExport"
            >
                <i data-lucide="download"></i>
                Export CSV
            </button>

        </div>


        <div class="mesin-table-wrap">

            <table class="mesin-table" id="mesinTable">

                <thead>

                    <tr>
                        <th>No</th>
                        <th>Lokasi</th>
                        <th>Alamat</th>
                        <th>Data Mesin</th>
                        <th>Nilai</th>
                        <th>Aksi</th>
                    </tr>

                </thead>


                <tbody>

                    @forelse ($mesins as $row)

                        <tr
                            class="mesin-data-row"
                            data-search="{{ mb_strtolower(trim($row->lokasi) . ' ' . trim($row->alamat)) }}"
                        >

                            <td class="mesin-number"></td>

                            <td>

                                <strong>
                                    {{ trim($row->lokasi) }}
                                </strong>

                                <small>
                                    ID Lokasi #{{ $row->id_lokasi }}
                                </small>

                            </td>

                            <td>
                                {{ trim($row->alamat) }}
                            </td>

                            <td>

                                <span class="mesin-count-pill">
                                    {{ $row->jumlah_barang }} barang
                                </span>

                            </td>

                            <td>

                                <strong class="mesin-currency">
                                    {{ $rupiah($row->nilai_total) }}
                                </strong>

                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="mesin-button outline small"
                                    data-lokasi="{{ $row->id_lokasi }}"
                                >

                                    <i data-lucide="eye"></i>

                                    Detail

                                </button>

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

            <div
                id="mesinPagination"
                class="mesin-pagination"
            ></div>

        </div>

    </section>


    {{-- ==========================================================
         05. MODAL TAMBAH / EDIT MESIN
    =========================================================== --}}

    <dialog
        class="mesin-dialog"
        id="mesinFormDialog"
    >

        <div class="mesin-dialog-header">

            <div>

                <small>K.I.B B</small>

                <h2 id="mesinFormTitle">
                    Tambah Data Mesin
                </h2>

                <p>
                    Pilih transaksi Nilai Aset lalu lengkapi
                    data inventaris Mesin.
                </p>

            </div>

            <button
                type="button"
                class="mesin-close"
                data-close="mesinFormDialog"
                aria-label="Tutup"
            >
                <i data-lucide="x"></i>
            </button>

        </div>


        <div class="mesin-dialog-scroll">

            {{-- 05A. PILIH TRANSAKSI PENDING --}}

            <section
                class="mesin-section"
                id="mesinPendingSection"
            >

                <div class="mesin-step">1</div>

                <div class="mesin-section-body">

                    <h3>Pilih Data Nilai Aset</h3>

                    <p>
                        Pilih transaksi kategori Peralatan dan Mesin
                        yang belum diproses.
                    </p>


                    <input
                        type="search"
                        id="mesinPendingSearch"
                        placeholder="Cari voucher, lokasi, departemen, divisi, uraian..."
                    >


                    <div class="mesin-table-wrap mesin-pending-wrap">

                        <table class="mesin-table">

                            <thead>

                                <tr>
                                    <th>No</th>
                                    <th>Voucher</th>
                                    <th>Lokasi</th>
                                    <th>Departemen</th>
                                    <th>Divisi</th>
                                    <th>Jenis</th>
                                    <th>Tahun</th>
                                    <th>Nilai</th>
                                    <th>Aksi</th>
                                </tr>

                            </thead>


                            <tbody id="mesinPendingBody">

                                <tr>
                                    <td colspan="9" class="mesin-empty">
                                        Memuat data...
                                    </td>
                                </tr>

                            </tbody>

                        </table>

                    </div>


                    <small id="mesinPendingCountText"></small>

                </div>

            </section>


            {{-- 05B. FORM INVENTARIS MESIN --}}

            <form
                id="mesinForm"
                method="POST"
                action="{{ route('kib.mesin.store') }}"
                enctype="multipart/form-data"
            >

                @csrf

                <input
                    type="hidden"
                    name="_method"
                    id="mesinMethod"
                    value="PUT"
                    disabled
                >

                <input
                    type="hidden"
                    name="id_nilai_aktiva"
                    id="mesinNilaiId"
                >


                {{-- 05C. LOKASI, DEPARTEMEN, DIVISI --}}

                <section class="mesin-section">

                    <div class="mesin-step">2</div>

                    <div class="mesin-section-body">

                        <h3>Informasi Lokasi dan Organisasi</h3>

                        <p>
                            Informasi berikut otomatis diisi
                            setelah tombol Pilih ditekan.
                        </p>


                        <div class="mesin-form-grid cols-3">

                            <label>

                                Lokasi

                                <input
                                    id="mesinLokasiLabel"
                                    readonly
                                    placeholder="Pilih transaksi dahulu"
                                >

                            </label>


                            <label>

                                Departemen

                                <input
                                    id="mesinDepartemenLabel"
                                    readonly
                                    placeholder="Otomatis dari Nilai Aset"
                                >

                            </label>


                            <label>

                                Divisi

                                <input
                                    id="mesinDivisiLabel"
                                    readonly
                                    placeholder="Otomatis dari Nilai Aset"
                                >

                            </label>

                        </div>


                        <div class="mesin-form-grid cols-2">

                            <label>

                                Alamat

                                <input
                                    id="mesinAlamatLabel"
                                    readonly
                                    placeholder="Otomatis dari Lokasi"
                                >

                            </label>


                            <label>

                                Voucher Sumber

                                <input
                                    id="mesinVoucherLabel"
                                    readonly
                                    placeholder="Otomatis dari Nilai Aset"
                                >

                            </label>

                        </div>

                    </div>

                </section>


                {{-- 05D. DETAIL BARANG --}}

                <section class="mesin-section">

                    <div class="mesin-step">3</div>

                    <div class="mesin-section-body">

                        <h3>Detail Barang Peralatan dan Mesin</h3>

                        <p>
                            Kolom berikut dilengkapi oleh petugas K.I.B.
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
                                            {{ trim($barang->nama_barang) }}
                                            ({{ trim($barang->kode_barang) }})
                                        </option>

                                    @endforeach

                                </select>

                            </label>


                            <label>

                                Tahun Perolehan *

                                <input
                                    type="text"
                                    name="tahun"
                                    maxlength="4"
                                    inputmode="numeric"
                                    required
                                    placeholder="Contoh: 2026"
                                >

                            </label>


                            <label>

                                Kode Inventaris *

                                <input
                                    type="text"
                                    name="kode"
                                    maxlength="255"
                                    required
                                >

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

                                    <option value="Rusak Ringan">
                                        Rusak Ringan
                                    </option>

                                    <option value="Rusak Berat">
                                        Rusak Berat
                                    </option>

                                </select>

                            </label>


                            <label>

                                Harga Inventaris

                                <input
                                    type="number"
                                    name="harga"
                                    min="0"
                                    max="2147483647"
                                    placeholder="Maksimal 2147483647"
                                >

                            </label>


                            <label>

                                Penyusutan

                                <input
                                    type="number"
                                    name="susut"
                                    min="0"
                                    max="2147483647"
                                    value="0"
                                >

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

                                Foto Barang — maks. 5 MB

                                <input
                                    type="file"
                                    name="foto"
                                    accept="image/*"
                                >

                            </label>


                            <label>

                                Dokumen PDF — maks. 15 MB

                                <input
                                    type="file"
                                    name="dokumen"
                                    accept="application/pdf"
                                >

                            </label>

                        </div>


                        <label class="mesin-full-label">

                            Keterangan

                            <textarea
                                name="ket"
                                rows="3"
                            ></textarea>

                        </label>

                    </div>

                </section>


                {{-- 05E. TOMBOL FORM --}}

                <div class="mesin-form-actions">

                    <button
                        type="button"
                        class="mesin-button outline"
                        data-close="mesinFormDialog"
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        class="mesin-button primary"
                    >

                        <i data-lucide="save"></i>

                        Simpan Data Mesin

                    </button>

                </div>

            </form>

        </div>

    </dialog>


    {{-- ==========================================================
         06. MODAL DETAIL LOKASI
    =========================================================== --}}

    <dialog
        class="mesin-dialog detail"
        id="mesinDetailDialog"
    >

        <div class="mesin-dialog-header">

            <div>

                <small>DETAIL DATA MESIN</small>

                <h2 id="mesinDetailTitle">
                    Data Peralatan dan Mesin
                </h2>

                <p id="mesinDetailAddress"></p>

            </div>

            <button
                type="button"
                class="mesin-close"
                data-close="mesinDetailDialog"
                aria-label="Tutup"
            >
                <i data-lucide="x"></i>
            </button>

        </div>


        <div class="mesin-dialog-scroll">

            <div
                id="mesinDetailBody"
                class="mesin-detail-list"
            ></div>

        </div>

    </dialog>


    {{-- ==========================================================
         07. FORM DELETE DENGAN CSRF
    =========================================================== --}}

    <form
        id="mesinDeleteForm"
        method="POST"
        hidden
    >
        @csrf
        @method('DELETE')
    </form>

</section>

<script
    src="{{ asset('js/pages/kib/mesin.js') }}?v={{ file_exists(public_path('js/pages/kib/mesin.js')) ? filemtime(public_path('js/pages/kib/mesin.js')) : time() }}"
></script>

@endsection
