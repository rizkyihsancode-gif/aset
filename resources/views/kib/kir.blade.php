@extends('layouts.main')

@section('title', 'K.I.R - Kartu Inventaris Ruangan')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/kir.css') }}?v={{ file_exists(public_path('css/pages/kib/kir.css')) ? filemtime(public_path('css/pages/kib/kir.css')) : '1' }}">
@endpush

@section('content')
    @php
        $rp = fn($v) => 'Rp ' . number_format((float) ($v ?? 0), 0, ',', '.');
    @endphp

    <section class="content kir-page" id="kirApp" data-base="{{ url('/kib/kir') }}"
        data-pending="{{ route('kib.pending', ['module' => 'kir']) }}" data-token="{{ csrf_token() }}">

        {{-- HEADER --}}

        <header class="kir-hero">
            <nav class="kir-breadcrumb">
                <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>
                <span>K.I.B</span>

                <i data-lucide="chevron-right"></i>
                <strong>K.I.R</strong>
            </nav>

            <div class="kir-heading">
                <div>
                    <small>KARTU INVENTARIS RUANGAN</small>

                    <h1>K.I.R — Inventaris Ruangan</h1>

                    <p>
                        Kelola inventaris berdasarkan lokasi,
                        departemen, divisi, gedung dan ruangan.
                    </p>
                </div>

                <div class="kir-date-card">
                    <i data-lucide="calendar-days"></i>

                    <div>
                        <strong id="kirTanggal">
                            {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                        </strong>

                        <small>
                            <span id="kirJam">
                                {{ now('Asia/Makassar')->format('H:i:s') }}
                            </span>
                            WITA
                        </small>
                    </div>
                </div>
            </div>

            <div class="kir-stats">
                <article>
                    <i data-lucide="map-pin"></i>

                    <div>
                        <small>Lokasi KIR</small>

                        <strong>{{ $lokasis->count() }}</strong>
                    </div>
                </article>

                <article>
                    <i data-lucide="package"></i>

                    <div>
                        <small>Inventaris Ruangan</small>

                        <strong>
                            {{ number_format($stats['jumlah'], 0, ',', '.') }}
                        </strong>
                    </div>
                </article>

                <article>
                    <i data-lucide="door-open"></i>

                    <div>
                        <small>Ruangan Terdata</small>

                        <strong>
                            {{ number_format($stats['ruangan'], 0, ',', '.') }}
                        </strong>
                    </div>
                </article>

                <article>
                    <i data-lucide="wallet"></i>

                    <div>
                        <small>Total Nilai KIR</small>

                        <strong class="kir-rupiah">
                            {{ $rp($stats['nilai']) }}
                        </strong>
                    </div>
                </article>
            </div>
        </header>

        {{-- DATA PENDING --}}

        <section class="kir-pending-banner">
            <span class="kir-banner-icon">
                <i data-lucide="inbox"></i>
            </span>

            <div>
                <small>DATA NILAI ASET</small>

                <h2>
                    Data KIR Menunggu Diproses

                    <span class="kir-counter">
                        {{ $stats['pending'] }}
                    </span>
                </h2>

                <p>
                    Pilih transaksi Penambahan Aset untuk
                    membuat inventaris KIR. Unit mengikuti
                    voucher; gedung dan ruangan dipilih apabila
                    tidak dapat ditentukan otomatis.
                </p>
            </div>

            <button class="kir-btn outline" id="kirDataMasuk" type="button">
                <i data-lucide="inbox"></i>
                Lihat Data Masuk
            </button>
        </section>

        {{-- FILTER --}}

        <section class="kir-card">
            <div class="kir-card-head">
                <div>
                    <h2>Filter Data KIR</h2>
                    <p>Cari nama lokasi atau alamat.</p>
                </div>
            </div>

            <div class="kir-toolbar">
                <label class="kir-search">
                    <i data-lucide="search"></i>

                    <input id="kirCari" type="search" placeholder="Cari lokasi atau alamat..." autocomplete="off">
                </label>

                <select id="kirLimit" aria-label="Jumlah baris">
                    <option>10</option>
                    <option selected>20</option>
                    <option>50</option>
                    <option>100</option>
                </select>

                <button class="kir-btn outline" id="kirReset" type="button">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>
            </div>
        </section>

        {{-- TABEL UTAMA --}}

        <section class="kir-card">
            <div class="kir-card-head">
                <div>
                    <h2>Daftar Lokasi KIR</h2>

                    <p>
                        Pilih nilai untuk melihat transaksi
                        dan Detail untuk membuka inventaris ruangan.
                    </p>
                </div>

                <button class="kir-btn primary" id="kirTambah" type="button">
                    <i data-lucide="plus"></i>
                    Tambah Data KIR
                </button>
            </div>

            <div class="kir-table-wrap">
                <table class="kir-table" id="kirTabelLokasi">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Lokasi</th>
                            <th>Alamat</th>
                            <th>Inventaris</th>
                            <th>Nilai (Rp)</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        @forelse ($lokasis as $lok)
                            <tr data-kir-row
                                data-search="{{ mb_strtolower(($lok->lokasi ?? '') . ' ' . ($lok->alamat ?? '')) }}">
                                <td class="kir-nomor">
                                    {{ $loop->iteration }}
                                </td>

                                <td>
                                    <div class="kir-location">
                                        <i data-lucide="map-pin"></i>

                                        <div>
                                            <strong>
                                                {{ $lok->lokasi }}
                                            </strong>

                                            <small>
                                                ID #{{ $lok->id }}
                                            </small>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    {{ $lok->alamat ?: '—' }}
                                </td>

                                <td>
                                    <span class="kir-pill">
                                        {{ $lok->jumlah }} barang
                                    </span>
                                </td>

                                <td>
                                    <button type="button" class="kir-value" data-kir-value="{{ $lok->id }}"
                                        data-name="{{ $lok->lokasi }}">
                                        <strong>
                                            {{ $rp($lok->nilai) }}
                                        </strong>

                                        <i data-lucide="external-link"></i>
                                    </button>
                                </td>

                                <td>
                                    <div class="kir-actions">
                                        <button class="kir-icon view" type="button" title="Detail KIR"
                                            data-kir-location="{{ $lok->id }}" data-name="{{ $lok->lokasi }}">
                                            <i data-lucide="eye"></i>
                                        </button>

                                        <button class="kir-icon add" type="button" title="Tambah KIR di lokasi"
                                            data-kir-add-location="{{ $lok->id }}">
                                            <i data-lucide="plus"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="kir-empty">
                                    Belum ada lokasi dengan data KIR.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="kir-table-footer">
                <span id="kirInfo">
                    {{ $lokasis->count() }} lokasi
                </span>

                <div id="kirPages" class="kir-pages"></div>
            </div>
        </section>
    </section>

    {{-- MODAL RINCIAN NILAI --}}

    <dialog class="kir-modal" id="kirModalNilai" aria-labelledby="kirNilaiJudul">
        <div class="kir-modal-head">
            <div>
                <small>RINCIAN NILAI ASET KIR</small>

                <h2 id="kirNilaiJudul">Nilai Aset</h2>

                <p>
                    Riwayat transaksi Nilai Aset kategori KIR
                    di lokasi terpilih.
                </p>
            </div>

            <button class="kir-close" type="button" data-kir-close="kirModalNilai">
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="kir-modal-body">
            <div class="kir-total">
                Total nilai transaksi

                <strong id="kirNilaiTotal">
                    Rp 0
                </strong>
            </div>

            <div class="kir-table-wrap">
                <table class="kir-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Kode Perkiraan</th>
                            <th>Nama Aktiva</th>
                            <th>Voucher / Tanggal</th>
                            <th>Tahun</th>
                            <th>Nilai</th>
                            <th>Uraian</th>
                        </tr>
                    </thead>

                    <tbody id="kirNilaiBody"></tbody>
                </table>
            </div>
        </div>

        <div class="kir-modal-foot">
            <button class="kir-btn outline" type="button" data-kir-close="kirModalNilai">
                Tutup
            </button>
        </div>
    </dialog>

    {{-- MODAL DETAIL LOKASI --}}

    <dialog class="kir-modal kir-wide" id="kirModalLokasi" aria-labelledby="kirLokasiJudul">
        <div class="kir-modal-head">
            <div>
                <small>KIR — STRUKTUR ORGANISASI</small>

                <h2 id="kirLokasiJudul">
                    Detail Lokasi
                </h2>

                <p>
                    Pilih divisi, gedung, dan ruangan.
                    Data KIR ditampilkan di sebelah kanan.
                </p>
            </div>

            <button class="kir-close" type="button" data-kir-close="kirModalLokasi">
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="kir-modal-body kir-layout">
            <aside class="kir-tree">
                <h3>
                    <i data-lucide="network"></i>
                    Struktur Unit
                </h3>

                <div id="kirUnitTree">
                    Memuat data...
                </div>
            </aside>

            <div class="kir-right">
                <div class="kir-card-head">
                    <div>
                        <h3 id="kirRoomTitle">
                            Daftar Ruangan
                        </h3>

                        <p id="kirRoomSubtitle">
                            Pilih ruangan untuk melihat barang.
                        </p>
                    </div>

                    <button id="kirAddFromDetail" type="button" class="kir-btn primary">
                        <i data-lucide="plus"></i>
                        Tambah KIR
                    </button>
                </div>

                <div id="kirRoomContent"></div>
            </div>
        </div>

        <div class="kir-modal-foot">
            <button class="kir-btn outline" type="button" data-kir-close="kirModalLokasi">
                Tutup
            </button>
        </div>
    </dialog>

    {{-- MODAL DETAIL SATU BARANG --}}

    <dialog class="kir-modal" id="kirModalBarang" aria-labelledby="kirBarangTitle">
        <div class="kir-modal-head">
            <div>
                <small>DETAIL INVENTARIS RUANGAN</small>

                <h2 id="kirBarangTitle">
                    Data KIR
                </h2>
            </div>

            <button class="kir-close" type="button" data-kir-close="kirModalBarang">
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="kir-modal-body" id="kirBarangDetail"></div>

        <div class="kir-modal-foot">
            <button class="kir-btn outline" type="button" data-kir-close="kirModalBarang">
                Tutup
            </button>

            <button class="kir-btn warning" type="button" id="kirEditDetail">
                <i data-lucide="pencil"></i>
                Edit
            </button>

            <button class="kir-btn danger" type="button" id="kirDeleteDetail">
                <i data-lucide="trash-2"></i>
                Hapus
            </button>
        </div>
    </dialog>

    {{-- MODAL FORM TAMBAH / EDIT --}}

    <dialog class="kir-modal kir-form-modal" id="kirModalForm" aria-labelledby="kirFormTitle">
        <form id="kirForm" enctype="multipart/form-data">
            @csrf

            <input type="hidden" name="id_nilai_aktiva" id="kirVoucherId">

            <div class="kir-modal-head">
                <div>
                    <small>KARTU INVENTARIS RUANGAN</small>

                    <h2 id="kirFormTitle">
                        Tambah Data KIR
                    </h2>

                    <p>
                        Data organisasi otomatis dari lokasi
                        atau voucher yang dipilih.
                    </p>
                </div>

                <button class="kir-close" type="button" data-kir-close="kirModalForm">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="kir-modal-body">
                <p id="kirError" class="kir-error" hidden></p>

                {{-- BAGIAN 1: DATA PENDING --}}

                <section class="kir-form-section" id="kirPendingSection">
                    <div class="kir-section-title">
                        <span>1</span>

                        <div>
                            <h3>Pilih Data Pending Nilai Aset</h3>

                            <p>
                                Pilih transaksi KIR yang belum
                                diproses (Penambahan Aset).
                            </p>
                        </div>
                    </div>

                    <div class="kir-toolbar">
                        <label class="kir-search">
                            <i data-lucide="search"></i>

                            <input id="kirPendingSearch" type="search"
                                placeholder="Cari voucher, lokasi, divisi, atau uraian...">
                        </label>

                        <small id="kirPendingCount">
                            0 data
                        </small>
                    </div>

                    <div class="kir-table-wrap kir-pending-wrap">
                        <table class="kir-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Voucher</th>
                                    <th>Lokasi</th>
                                    <th>Departemen</th>
                                    <th>Divisi</th>
                                    <th>Nilai</th>
                                    <th>Uraian</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>

                            <tbody id="kirPendingBody"></tbody>
                        </table>
                    </div>

                    <button type="button" class="kir-btn outline" id="kirManualMode">
                        <i data-lucide="plus"></i>
                        Input langsung tanpa voucher
                    </button>
                </section>

                {{-- VOUCHER TERPILIH --}}

                <div id="kirSelectedVoucher" class="kir-selected" hidden>
                    <i data-lucide="check-circle-2"></i>

                    <div>
                        <small>Voucher dipilih</small>

                        <strong id="kirVoucherLabel">—</strong>

                        <p id="kirVoucherDesc"></p>
                    </div>

                    <button class="kir-btn outline" type="button" id="kirChangeVoucher">
                        Ganti
                    </button>
                </div>

                {{-- BAGIAN 2: LOKASI DAN ORGANISASI --}}

                <section class="kir-form-section">
                    <div class="kir-section-title">
                        <span>2</span>

                        <div>
                            <h3>
                                Lokasi, Departemen, Divisi,
                                Gedung, Ruangan
                            </h3>

                            <p>
                                Voucher hanya menentukan lokasi
                                dan unit. Gedung dan ruangan mengikuti
                                pilihan yang tersedia.
                            </p>
                        </div>
                    </div>

                    <div class="kir-fields three">
                        <label>
                            Lokasi <b>*</b>

                            <select name="id_lokasi" id="kirLokasi" required>
                                <option value="">
                                    Pilih lokasi
                                </option>

                                @foreach ($semuaLokasis as $lok)
                                    <option value="{{ $lok->id }}" data-alamat="{{ $lok->alamat }}">
                                        {{ $lok->lokasi }}
                                    </option>
                                @endforeach
                            </select>
                        </label>

                        <label>
                            Departemen <b>*</b>

                            <select name="id_departemen" id="kirDep" required>
                                <option value="">
                                    Pilih departemen
                                </option>

                                @foreach ($departemens as $dep)
                                    <option value="{{ $dep->id }}">
                                        {{ $dep->nama_dep }}
                                    </option>
                                @endforeach
                            </select>
                        </label>

                        <label>
                            Divisi <b>*</b>

                            <select name="id_div" id="kirDiv" required>
                                <option value="">
                                    Pilih divisi
                                </option>

                                @foreach ($divisis as $div)
                                    <option data-dep="{{ $div->id_dep }}" value="{{ $div->id }}">
                                        {{ $div->nama_div }}
                                    </option>
                                @endforeach
                            </select>
                        </label>

                        <label class="kir-wide-field">
                            Gedung <b>*</b>

                            <input name="gedung" id="kirGedung" list="kirGedungList" maxlength="255" required
                                placeholder="Pilih atau ketik gedung">

                            <datalist id="kirGedungList">
                                @foreach ($gedungs as $ged)
                                    <option value="{{ trim($ged) }}"></option>
                                @endforeach
                            </datalist>
                        </label>

                        <label class="kir-wide-field">
                            Ruangan <b>*</b>

                            <input name="ruangan" id="kirRuang" list="kirRuangList" maxlength="255" required
                                placeholder="Pilih atau ketik ruangan">

                            <datalist id="kirRuangList">
                                @foreach ($ruangans as $ruang)
                                    <option value="{{ trim($ruang->nama_ruang) }}"></option>
                                @endforeach
                            </datalist>
                        </label>

                        <label>
                            Alamat

                            <input id="kirAlamat" readonly placeholder="Otomatis dari lokasi jika tersedia">
                        </label>
                    </div>
                </section>

                {{-- BAGIAN 3: BARANG DAN KONDISI --}}

                <section class="kir-form-section">
                    <div class="kir-section-title">
                        <span>3</span>

                        <div>
                            <h3>Informasi Barang KIR</h3>

                            <p>
                                Jumlah harus sama dengan Baik +
                                Rusak Ringan + Rusak Berat.
                            </p>
                        </div>
                    </div>

                    <div class="kir-fields two">
                        <label class="kir-wide-field">
                            Nama Aset <b>*</b>

                            <select name="id_barang" id="kirBarang" required>
                                <option value="">
                                    Pilih barang
                                </option>

                                @foreach ($barangs as $barang)
                                    <option value="{{ $barang->id }}" data-kode="{{ trim($barang->kode_barang) }}">
                                        {{ trim($barang->nama_barang) }}
                                    </option>
                                @endforeach
                            </select>
                        </label>

                        <label>
                            Kode Aset

                            <input id="kirKode" readonly>
                        </label>

                        <label>
                            Merk / Type

                            <input name="merk" id="kirMerk" maxlength="255">
                        </label>

                        <label>
                            Bahan

                            <select name="bahan" id="kirBahan">
                                <option value="">
                                    Pilih bahan
                                </option>

                                @foreach ($bahans as $bahan)
                                    <option value="{{ $bahan->id }}">
                                        {{ $bahan->nama }}
                                    </option>
                                @endforeach
                            </select>
                        </label>

                        <label>
                            Jumlah <b>*</b>

                            <input type="number" name="jumlah" id="kirJumlah" min="0" value="1" required>
                        </label>

                        <label>
                            Satuan <b>*</b>

                            <input name="satuan" id="kirSatuan" maxlength="255" value="Unit" required>
                        </label>

                        <label>
                            Baik <b>*</b>

                            <input type="number" name="baik" id="kirBaik" min="0" value="1" required>
                        </label>

                        <label>
                            Rusak Ringan <b>*</b>

                            <input type="number" name="ringan" id="kirRingan" min="0" value="0" required>
                        </label>

                        <label>
                            Rusak Berat <b>*</b>

                            <input type="number" name="berat" id="kirBerat" min="0" value="0" required>
                        </label>

                        <label>
                            Foto (maks. 5 MB)

                            <input type="file" name="foto" id="kirFoto"
                                accept="image/jpeg,image/png,image/webp">
                        </label>

                        <label class="kir-wide-field">
                            Keterangan

                            <textarea name="ket" id="kirKet" rows="3" maxlength="10000"></textarea>
                        </label>
                    </div>
                </section>

                {{-- BAGIAN 4: INVENTARIS EXISTING --}}

                <section class="kir-form-section" id="kirRoomExisting" hidden>
                    <div class="kir-section-title">
                        <span>4</span>

                        <div>
                            <h3>
                                Inventaris yang Sudah Ada
                                di Ruangan
                            </h3>

                            <p>
                                Periksa data agar barang tidak
                                tercatat ganda.
                            </p>
                        </div>
                    </div>

                    <div class="kir-table-wrap">
                        <table class="kir-table">
                            <thead>
                                <tr>
                                    <th>Nama Aset</th>
                                    <th>Merk</th>
                                    <th>Jumlah</th>
                                    <th>Kondisi</th>
                                </tr>
                            </thead>

                            <tbody id="kirExistingBody"></tbody>
                        </table>
                    </div>
                </section>
            </div>

            <div class="kir-modal-foot">
                <button class="kir-btn outline" type="button" data-kir-close="kirModalForm">
                    Batal
                </button>

                <button class="kir-btn primary" type="submit" id="kirSimpan">
                    <i data-lucide="save"></i>
                    Simpan KIR
                </button>
            </div>
        </form>
    </dialog>
@endsection

@push('scripts')
    <script
        src="{{ asset('js/pages/kib/kir.js') }}?v={{ file_exists(public_path('js/pages/kib/kir.js')) ? filemtime(public_path('js/pages/kib/kir.js')) : '1' }}">
    </script>
@endpush
