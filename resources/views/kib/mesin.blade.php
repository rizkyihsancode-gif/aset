@extends('layouts.main')

@section('title', 'Peralatan dan Mesin')

@section('content')

    @php
        $rupiah = fn($value) => 'Rp ' . number_format((int) ($value ?? 0), 0, ',', '.');
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/mesin.css') }}?v={{ file_exists(public_path('css/pages/kib/mesin.css')) ? filemtime(public_path('css/pages/kib/mesin.css')) : time() }}">

    <section id="mesinPage" class="content mesin-page" data-store-url="{{ route('kib.mesin.store') }}"
        data-record-base="{{ url('/kib/mesin') }}" data-detail-base="{{ url('/kib/mesin/lokasi') }}"
        data-pending-url="{{ route('kib.mesin.pending') }}">

        {{-- HEADER ASLI + CARD TANGGAL --}}
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
                                Kelola Kartu Inventaris Barang kategori
                                Peralatan dan Mesin, lokasi, nilai aset,
                                dokumen, serta transaksi Nilai Aset.
                            </p>
                        </div>
                    </div>

                    {{-- TAMBAHAN: CARD TANGGAL --}}
                    <div class="mesin-date-card">
                        <span class="mesin-date-icon">
                            <i data-lucide="calendar-days"></i>
                        </span>
                        <div>
                            <strong id="mesinTanggal">
                                {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                            </strong>
                            <span id="mesinJam">
                                {{ now('Asia/Makassar')->format('H:i:s') }} WITA
                            </span>
                        </div>
                    </div>
                </div>

                {{-- KPI TETAP --}}
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
                            <strong>
                                {{ number_format($totalLokasi, 0, ',', '.') }}
                            </strong>
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

        {{-- PESAN SISTEM --}}
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

        {{-- CARD DATA MASUK SEPERTI TANAH --}}
        <section id="mesinIncomingCard" class="mesin-incoming-card">
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

        {{-- TABEL UTAMA: DESAIN LAMA DIPERTAHANKAN --}}
        <section class="mesin-card mesin-workspace">

            <div class="mesin-workspace-head">
                <div>
                    <h2>Daftar Peralatan dan Mesin</h2>
                    <p>
                        Data K.I.B dikelompokkan berdasarkan lokasi
                        seperti web aset lama.
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
                    Jumlah data
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



            {{-- ===========================================
     TABEL K.I.B MESIN — SEPERTI HALAMAN TANAH
     No | Lokasi | Alamat | Nilai | PDF | Aksi
=========================================== --}}

            <div class="mesin-table-wrap mesin-main-table-wrap">

                <table id="mesinTable" class="mesin-table">

                    {{-- Mengatur lebar agar proporsional --}}
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
                            <th scope="col">No</th>
                            <th scope="col">Lokasi</th>
                            <th scope="col">Alamat</th>
                            <th scope="col">Nilai</th>
                            <th scope="col">PDF</th>
                            <th scope="col">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>

                        @forelse ($mesins as $row)
                            <tr class="mesin-data-row"
                                data-search="{{ mb_strtolower(trim((string) $row->lokasi) . ' ' . trim((string) $row->alamat)) }}"
                                data-export-lokasi="{{ trim((string) $row->lokasi) }}"
                                data-export-alamat="{{ trim((string) $row->alamat) }}"
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
                                        ID Lokasi #{{ $row->id_lokasi }}
                                    </small>
                                </td>

                                {{-- ALAMAT --}}
                                <td class="mesin-alamat-cell">
                                    {{ trim((string) $row->alamat) ?: '—' }}
                                </td>

                                {{-- NILAI --}}
                                <td class="mesin-nilai-cell">

                                    <button type="button" class="mesin-nilai-button"
                                        data-nilai-lokasi="{{ $row->id_lokasi }}"
                                        data-nilai-nama="{{ trim((string) $row->lokasi) }}"
                                        title="Lihat rincian transaksi Nilai Aset">

                                        <span>
                                            <strong>
                                                {{ $rupiah($row->nilai_total) }}
                                            </strong>

                                            <small>
                                                {{ number_format((int) $row->jumlah_transaksi, 0, ',', '.') }}
                                                transaksi
                                            </small>
                                        </span>

                                        <i data-lucide="external-link"></i>

                                    </button>

                                </td>

                                {{-- PDF: SEBELUM AKSI --}}
                                <td class="mesin-pdf-cell">

                                    @if ((int) $row->jumlah_dokumen > 0)
                                        <button type="button" class="mesin-pdf-button"
                                            data-pdf-lokasi="{{ $row->id_lokasi }}"
                                            data-pdf-nama="{{ trim((string) $row->lokasi) }}"
                                            title="Lihat {{ (int) $row->jumlah_dokumen }} dokumen PDF"
                                            aria-label="Lihat PDF lokasi {{ trim((string) $row->lokasi) }}">

                                            <i data-lucide="file-text"></i>

                                            <span>
                                                PDF ({{ (int) $row->jumlah_dokumen }})
                                            </span>

                                        </button>
                                    @else
                                        <span class="mesin-muted" title="Belum ada dokumen PDF">
                                            —
                                        </span>
                                    @endif

                                </td>

                                {{-- AKSI: DETAIL | EDIT | HAPUS --}}
                                <td class="mesin-aksi-cell">

                                    <div class="mesin-aksi-group" role="group"
                                        aria-label="Aksi Mesin lokasi {{ trim((string) $row->lokasi) }}">

                                        {{-- DETAIL BIRU --}}
                                        <button type="button" class="mesin-action-icon mesin-action-view"
                                            data-lokasi="{{ $row->id_lokasi }}" title="Detail barang"
                                            aria-label="Lihat detail barang di {{ trim((string) $row->lokasi) }}">
                                            <i data-lucide="eye"></i>
                                        </button>

                                        {{-- EDIT ORANYE --}}
                                        <button type="button" class="mesin-action-icon mesin-action-edit"
                                            data-edit-lokasi="{{ $row->id_lokasi }}" title="Edit barang"
                                            aria-label="Pilih barang untuk diedit di {{ trim((string) $row->lokasi) }}">
                                            <i data-lucide="square-pen"></i>
                                        </button>

                                        {{-- HAPUS MERAH MUDA --}}
                                        <button type="button" class="mesin-action-icon mesin-action-delete"
                                            data-delete-lokasi="{{ $row->id_lokasi }}" title="Hapus barang"
                                            aria-label="Pilih barang untuk dihapus di {{ trim((string) $row->lokasi) }}">
                                            <i data-lucide="trash-2"></i>
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        @empty

                            <tr>
                                <td colspan="6" class="mesin-empty">
                                    Belum ada data Peralatan dan Mesin
                                    pada database.
                                </td>
                            </tr>
                        @endforelse

                    </tbody>

                </table>

            </div>



            {{-- PAGINATION TETAP --}}
            <div class="mesin-table-footer">
                <span id="mesinTableInfo"></span>
                <div id="mesinPagination" class="mesin-pagination"></div>
            </div>
        </section>

        {{-- MODAL TAMBAH DAN EDIT --}}
        <dialog id="mesinFormDialog" class="mesin-dialog">

            <div class="mesin-dialog-header">
                <div>
                    <small>K.I.B B</small>
                    <h2 id="mesinFormTitle">Tambah Data Mesin</h2>
                    <p>
                        Pilih transaksi Nilai Aset kemudian
                        lengkapi data barang.
                    </p>
                </div>

                <button type="button" class="mesin-close" data-close="mesinFormDialog" aria-label="Tutup">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="mesin-dialog-scroll">

                {{-- TABEL PILIH DATA NILAI ASET --}}
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
                                    placeholder="Cari lokasi, voucher, departemen, divisi atau uraian...">
                            </label>

                            <span id="mesinPendingCountText">
                                0 data
                            </span>
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

                {{-- STATUS DATA NILAI ASET TERPILIH --}}
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

                {{-- FORM INVENTARIS TETAP --}}
                <form id="mesinForm" method="POST" action="{{ route('kib.mesin.store') }}"
                    enctype="multipart/form-data">
                    @csrf

                    <input type="hidden" name="_method" id="mesinMethod" value="PUT" disabled>

                    <input type="hidden" name="id_nilai_aktiva" id="mesinNilaiId">

                    <section class="mesin-section">
                        <div class="mesin-step">2</div>
                        <div class="mesin-section-body">
                            <h3>Informasi Lokasi dan Organisasi</h3>
                            <p>
                                Informasi otomatis dari transaksi
                                Nilai Aset yang dipilih.
                            </p>

                            <div class="mesin-form-grid cols-3">
                                <label>
                                    Lokasi
                                    <input id="mesinLokasiLabel" readonly placeholder="Pilih transaksi dahulu">
                                </label>

                                <label>
                                    Departemen
                                    <input id="mesinDepartemenLabel" readonly>
                                </label>

                                <label>
                                    Divisi
                                    <input id="mesinDivisiLabel" readonly>
                                </label>
                            </div>

                            <div class="mesin-form-grid cols-2">
                                <label>
                                    Alamat
                                    <input id="mesinAlamatLabel" readonly>
                                </label>

                                <label>
                                    No. Voucher
                                    <input id="mesinVoucherLabel" readonly>
                                </label>
                            </div>
                        </div>
                    </section>

                    <section class="mesin-section">
                        <div class="mesin-step">3</div>

                        <div class="mesin-section-body">
                            <h3>Detail Barang Peralatan dan Mesin</h3>
                            <p>
                                Lengkapi data sesuai inventaris barang
                                Perumda Tirta Kencana.
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
                                        <option value="">- PILIH KONDISI -</option>
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
                                    <input type="number" name="harga" min="0" max="2147483647">
                                </label>

                                <label>
                                    Penyusutan
                                    <input type="number" name="susut" value="0" min="0"
                                        max="2147483647">
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

        {{-- MODAL DETAIL BARANG TETAP --}}
        <dialog id="mesinDetailDialog" class="mesin-dialog detail">
            <div class="mesin-dialog-header">
                <div>
                    <small>DETAIL INVENTARIS MESIN</small>
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
                <div id="mesinDetailBody" class="mesin-detail-list"></div>
            </div>
        </dialog>


        {{-- =====================================================
     MODAL DAFTAR PDF MESIN PER LOKASI
===================================================== --}}

        <dialog id="mesinPdfDialog" class="mesin-dialog detail">

            {{-- HEADER MODAL --}}
            <div class="mesin-dialog-header">

                <div>

                    <small>
                        DOKUMEN INVENTARIS
                    </small>

                    <h2 id="mesinPdfTitle">
                        Dokumen PDF Mesin
                    </h2>

                    <p id="mesinPdfAddress">
                        Lokasi Peralatan dan Mesin
                    </p>

                </div>

                <button type="button" class="mesin-close" data-close="mesinPdfDialog" aria-label="Tutup daftar PDF">
                    <i data-lucide="x"></i>
                </button>

            </div>

            {{-- BODY MODAL --}}
            <div class="mesin-dialog-scroll">

                <p id="mesinPdfStatus" class="mesin-pdf-status" role="status"></p>

                <div class="mesin-table-wrap">

                    <table class="mesin-table mesin-pdf-table">

                        <thead>
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Nama Barang</th>
                                <th scope="col">Kode</th>
                                <th scope="col">Tahun</th>
                                <th scope="col">PDF</th>
                            </tr>
                        </thead>

                        <tbody id="mesinPdfBody">

                            <tr>
                                <td colspan="5" class="mesin-empty">
                                    Pilih tombol PDF
                                    pada tabel utama.
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </dialog>


        {{-- MODAL RINCIAN NILAI TETAP 10 KOLOM --}}
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
                    <small id="mesinNilaiCount">
                        0 transaksi
                    </small>
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

        {{-- FORM DELETE --}}
        <form id="mesinDeleteForm" method="POST" hidden>
            @csrf
            @method('DELETE')
        </form>
    </section>

    <script
        src="{{ asset('js/pages/kib/mesin.js') }}?v={{ file_exists(public_path('js/pages/kib/mesin.js')) ? filemtime(public_path('js/pages/kib/mesin.js')) : time() }}">
    </script>

@endsection
