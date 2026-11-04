@extends('layouts.main')

@section('title', 'Aset Tetap Lainnya')

@section('content')

    @php
        $rupiah = fn($nilai) => 'Rp ' . number_format((float) ($nilai ?? 0), 0, ',', '.');
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/aset_ttp.css') }}?v={{ file_exists(public_path('css/pages/kib/aset_ttp.css')) ? filemtime(public_path('css/pages/kib/aset_ttp.css')) : '1' }}">

    <section id="asetLainPage" class="content aet-page" data-base="{{ url('/kib/aset_ttp') }}"
        data-store="{{ route('kib.aset_ttp.store') }}" data-token="{{ csrf_token() }}">

        {{-- ========================================================
         HEADER HALAMAN
    ======================================================== --}}

        <header class="aet-hero">

            <div class="aet-hero-shade"></div>

            <div class="aet-hero-content">

                <nav class="aet-crumb">

                    <a href="{{ url('/dashboard') }}">
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>

                    <span>K.I.B</span>

                    <i data-lucide="chevron-right"></i>

                    <b>Aset Tetap Lainnya</b>

                </nav>

                {{-- TANGGAL DAN JAM WITA --}}

                <div class="aet-date-card">

                    <span class="aet-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </span>

                    <div>

                        <strong id="aetTanggal">
                            {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                        </strong>

                        <small>
                            <span id="aetJam">
                                {{ now('Asia/Makassar')->format('H:i:s') }}
                            </span>

                            WITA
                        </small>

                    </div>
                </div>

                <h1>Aset Tetap Lainnya</h1>

                <p>
                    Pengelolaan K.I.B E berdasarkan lokasi,
                    departemen, divisi, dan dokumen inventaris
                    Perumda Tirta Kencana Kota Samarinda.
                </p>

                {{-- KARTU STATISTIK --}}

                <div class="aet-kpis">

                    <article>

                        <span class="aet-kpi-icon">
                            <i data-lucide="package-open"></i>
                        </span>

                        <div>
                            <small>Total Inventaris</small>

                            <strong>
                                {{ number_format($totalAset, 0, ',', '.') }}
                            </strong>

                            <span>Data K.I.B E</span>
                        </div>

                    </article>

                    <article>

                        <span class="aet-kpi-icon">
                            <i data-lucide="boxes"></i>
                        </span>

                        <div>
                            <small>Total Unit</small>

                            <strong>
                                {{ number_format($totalUnit, 0, ',', '.') }}
                            </strong>

                            <span>Unit tercatat</span>
                        </div>

                    </article>

                    <article>

                        <span class="aet-kpi-icon">
                            <i data-lucide="wallet"></i>
                        </span>

                        <div>
                            <small>Total Nilai Aset</small>

                            <strong class="aet-money">
                                {{ $rupiah($totalNilai) }}
                            </strong>

                            <span>Dari transaksi Nilai Aset</span>
                        </div>

                    </article>

                    <article>

                        <span class="aet-kpi-icon">
                            <i data-lucide="map-pin"></i>
                        </span>

                        <div>
                            <small>Jumlah Lokasi</small>

                            <strong>
                                {{ number_format($totalLokasi, 0, ',', '.') }}
                            </strong>

                            <span>Lokasi terinventarisasi</span>
                        </div>

                    </article>

                </div>
            </div>

        </header>


        {{-- ========================================================
         DATA PENDING NILAI ASET
    ======================================================== --}}

        <x-kib.pending-card module="aset_tetap" title="Data Aset Tetap Lainnya Menunggu Diproses" />


        {{-- ========================================================
         DAFTAR ASET TETAP LAINNYA
    ======================================================== --}}

        <section class="aet-panel">

            <div class="aet-panel-top">

                <div>
                    <h2>Daftar Aset Tetap Lainnya</h2>

                    <p>
                        Lihat inventaris berdasarkan lokasi.
                        Klik gambar untuk membuka detail aset.
                    </p>
                </div>

                <button type="button" id="aetAdd" class="aet-btn primary">
                    <i data-lucide="plus"></i>
                    Tambah Aset
                </button>

            </div>


            {{-- TAB NAVIGASI --}}

            <div class="aet-tabs" role="tablist" aria-label="Tampilan aset">

                <button type="button" class="active" data-tab="daftar">
                    Daftar Lokasi
                </button>

                <button type="button" data-tab="rekap">
                    Rekapitulasi
                </button>

                <button type="button" data-tab="grafik">
                    Grafik Kondisi
                </button>

                <button type="button" data-tab="terbaru">
                    Aset Terbaru
                </button>

            </div>


            {{-- ====================================================
             TAB 1 — DAFTAR LOKASI
        ==================================================== --}}

            <div class="aet-tab-content" data-tab-panel="daftar">

                <div class="aet-toolbar">

                    <label class="aet-search">

                        <i data-lucide="search"></i>

                        <input id="aetSearch" type="search" placeholder="Cari nama lokasi atau alamat..."
                            autocomplete="off">

                    </label>

                    <label class="aet-limit">
                        Tampilkan

                        <select id="aetLimit">
                            <option value="10">10</option>
                            <option value="20" selected>20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </label>

                    <button type="button" class="aet-btn pale" id="aetReset">
                        <i data-lucide="refresh-cw"></i>
                        Reset
                    </button>

                    <button type="button" class="aet-btn pale" id="aetExport">
                        <i data-lucide="download"></i>
                        Export CSV
                    </button>

                </div>


                {{-- TABEL UTAMA 4 KOLOM --}}

                <div class="aet-table-scroll">

                    <table id="aetTable" class="aet-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Lokasi</th>
                                <th>Alamat</th>
                                <th>Gambar</th>
                            </tr>
                        </thead>

                        <tbody>

                            @forelse ($lokasiAset as $row)
                                @php
                                    /*
                                     * Foto diambil dari alias query.
                                     * Null-safe agar tidak Error 500
                                     * meskipun data foto tidak tersedia.
                                     */
                                    $fotoId = $row->foto_id ?? null;

                                    $lokasiNama = trim((string) ($row->lokasi ?? ''));

                                    $alamatNama = trim((string) ($row->alamat ?? ''));

                                    $lokasiId = (int) ($row->id_lokasi ?? 0);
                                @endphp

                                <tr class="aet-location-row"
                                    data-search="{{ mb_strtolower($lokasiNama . ' ' . $alamatNama) }}"
                                    data-location="{{ $lokasiId }}" data-name="{{ $lokasiNama }}"
                                    data-address="{{ $alamatNama }}" data-value="{{ $row->nilai_total ?? 0 }}"
                                    data-count="{{ $row->jumlah_aset ?? 0 }}">

                                    {{-- NO --}}

                                    <td data-order>
                                        {{ $loop->iteration }}
                                    </td>


                                    {{-- LOKASI --}}

                                    <td>

                                        <strong class="aet-location-name">
                                            {{ $lokasiNama ?: 'Belum Dipetakan' }}
                                        </strong>

                                        <small>
                                            {{ number_format((int) ($row->jumlah_aset ?? 0), 0, ',', '.') }}
                                            inventaris

                                            &middot;

                                            {{ number_format((int) ($row->jumlah_unit ?? 0), 0, ',', '.') }}
                                            unit
                                        </small>

                                    </td>


                                    {{-- ALAMAT --}}

                                    <td>
                                        {{ $alamatNama ?: '—' }}
                                    </td>


                                    {{-- GAMBAR --}}

                                    <td class="aet-photo-cell">

                                        <button type="button" class="aet-photo-button" data-view="{{ $lokasiId }}"
                                            aria-label="Lihat detail inventaris {{ $lokasiNama }}"
                                            title="Klik untuk melihat detail aset">

                                            @if ($fotoId)
                                                <img src="{{ route('kib.aset_ttp.file', [
                                                    'aset' => $fotoId,
                                                    'jenis' => 'foto',
                                                ]) }}"
                                                    alt="Foto aset {{ $lokasiNama }}" loading="lazy">
                                            @else
                                                <span class="aet-no-photo">

                                                    <i data-lucide="image-off"></i>

                                                    Belum ada foto

                                                </span>
                                            @endif

                                            <span class="aet-photo-action">

                                                <i data-lucide="eye"></i>

                                                Lihat Detail

                                            </span>

                                        </button>

                                    </td>

                                </tr>

                            @empty

                                <tr>
                                    <td colspan="4" class="aet-empty">
                                        Belum ada data Aset Tetap Lainnya.
                                    </td>
                                </tr>
                            @endforelse

                        </tbody>

                    </table>
                </div>


                {{-- PAGINATION --}}

                <div class="aet-table-bottom">

                    <span id="aetPageInfo"></span>

                    <div id="aetPages" class="aet-pages"></div>

                </div>

            </div>


            {{-- ====================================================
             TAB 2 — REKAPITULASI
        ==================================================== --}}

            <div class="aet-tab-content" data-tab-panel="rekap" hidden>

                <div class="aet-recap">

                    <article>

                        <h3>Kondisi Aset</h3>

                        <div class="aet-condition-list">

                            @forelse ($kondisi as $item)
                                <div>
                                    <span>
                                        {{ trim((string) ($item->kondisi ?? '')) ?: 'Belum diisi' }}
                                    </span>

                                    <b>
                                        {{ number_format((int) $item->jumlah, 0, ',', '.') }}
                                    </b>
                                </div>

                            @empty

                                <p>
                                    Belum ada data kondisi aset.
                                </p>
                            @endforelse

                        </div>

                    </article>


                    <article>

                        <h3>Ringkasan Inventaris</h3>

                        <p>
                            Total aset dalam kondisi baik:

                            <b>
                                {{ number_format($totalBaik, 0, ',', '.') }}
                            </b>
                        </p>

                        <p>
                            Jumlah unit tercatat:

                            <b>
                                {{ number_format($totalUnit, 0, ',', '.') }}
                            </b>
                        </p>

                        <p>
                            Jumlah lokasi:

                            <b>
                                {{ number_format($totalLokasi, 0, ',', '.') }}
                            </b>
                        </p>

                        <p class="aet-note">
                            Nilai diperoleh dari transaksi
                            Nilai Aset kategori K.I.B E.
                        </p>

                    </article>

                </div>

            </div>


            {{-- ====================================================
             TAB 3 — GRAFIK KONDISI
        ==================================================== --}}

            <div class="aet-tab-content" data-tab-panel="grafik" hidden>

                <div class="aet-graph-card">

                    <h3>Grafik Distribusi Kondisi Aset</h3>

                    <p>
                        Distribusi jumlah inventaris berdasarkan
                        kondisi aset yang tercatat.
                    </p>

                    @forelse ($kondisi as $item)
                        @php
                            $persen = $totalAset > 0 ? round((100 * (int) $item->jumlah) / $totalAset, 1) : 0;
                        @endphp

                        <div class="aet-graph-row">

                            <span>
                                {{ trim((string) ($item->kondisi ?? '')) ?: 'Belum diisi' }}
                            </span>

                            <div>
                                <i style="width: {{ $persen }}%"></i>
                            </div>

                            <strong>
                                {{ number_format((int) $item->jumlah, 0, ',', '.') }}
                                ({{ $persen }}%)
                            </strong>

                        </div>

                    @empty

                        <p>
                            Belum ada data grafik.
                        </p>
                    @endforelse

                </div>

            </div>


            {{-- ====================================================
             TAB 4 — ASET TERBARU
        ==================================================== --}}

            <div class="aet-tab-content" data-tab-panel="terbaru" hidden>

                <div class="aet-table-scroll">

                    <table class="aet-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Nama Aset</th>
                                <th>Kode / Register</th>
                                <th>Lokasi</th>
                                <th>Jumlah</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>

                            @forelse ($terbaru as $item)
                                <tr>

                                    <td>
                                        {{ $loop->iteration }}
                                    </td>

                                    <td>
                                        <strong>
                                            {{ $item->nama_barang ?? '—' }}
                                        </strong>
                                    </td>

                                    <td>
                                        {{ $item->kode ?? '—' }}
                                        /
                                        {{ $item->reg ?? '—' }}
                                    </td>

                                    <td>
                                        {{ $item->lokasi ?? '—' }}
                                    </td>

                                    <td>
                                        {{ $item->jumlah ?? 0 }}
                                    </td>

                                    <td>
                                        <button type="button" class="aet-btn pale" data-aset="{{ $item->id }}">
                                            Detail
                                        </button>
                                    </td>

                                </tr>

                            @empty

                                <tr>
                                    <td colspan="6" class="aet-empty">
                                        Belum ada data aset terbaru.
                                    </td>
                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>

            </div>

        </section>


        {{-- ========================================================
         MODAL TAMBAH / EDIT
    ======================================================== --}}

        <dialog id="aetFormDialog" class="aet-dialog">

            <header>

                <div>

                    <small>
                        K.I.B E — PENGELOLAAN INVENTARIS
                    </small>

                    <h2 id="aetFormTitle">
                        Tambah Aset Tetap Lainnya
                    </h2>

                    <p>
                        Lengkapi identitas aset dan dokumen
                        inventaris.
                    </p>

                </div>

                <button type="button" data-close="aetFormDialog" aria-label="Tutup">
                    <i data-lucide="x"></i>
                </button>

            </header>


            <div class="aet-dialog-body">

                <form id="aetForm" enctype="multipart/form-data" novalidate>

                    @csrf

                    <input type="hidden" name="id_nilai_aktiva" id="aetSourceId" value="">


                    {{-- DATA VOUCHER TERPILIH --}}

                    <div class="aet-source-selected" id="aetSourceSelected" hidden>

                        <i data-lucide="circle-check-big"></i>

                        <div>

                            <small>
                                TRANSAKSI NILAI ASET TERPILIH
                            </small>

                            <strong id="aetSourceVoucher">
                                —
                            </strong>

                            <p id="aetSourceDescription"></p>

                        </div>

                        <button type="button" id="aetClearSource" class="aet-btn pale">
                            Ganti / Input Manual
                        </button>

                    </div>


                    {{-- ====================================================
                     BAGIAN 1 — LOKASI DAN ORGANISASI
                ==================================================== --}}

                    <section class="aet-section">

                        <h3>
                            <span>1</span>
                            Lokasi dan Organisasi
                        </h3>

                        <div class="aet-fields cols3">

                            <label>
                                Lokasi *

                                <select name="id_lokasi" required>

                                    <option value="">
                                        Pilih Lokasi
                                    </option>

                                    @foreach ($lokasiRows as $row)
                                        <option value="{{ $row->id }}">
                                            {{ $row->lokasi }}
                                        </option>
                                    @endforeach

                                </select>
                            </label>


                            <label>
                                Departemen *

                                <select name="id_dep" id="aetDep" required>

                                    <option value="">
                                        Pilih Departemen
                                    </option>

                                    @foreach ($departemenRows as $row)
                                        <option value="{{ $row->id }}">
                                            {{ $row->kode_dep }}
                                            —
                                            {{ $row->nama_dep }}
                                        </option>
                                    @endforeach

                                </select>
                            </label>


                            <label>
                                Divisi *

                                <select name="id_div" id="aetDiv" required>

                                    <option value="">
                                        Pilih Divisi
                                    </option>

                                    @foreach ($divisiRows as $row)
                                        <option value="{{ $row->id }}" data-dep="{{ $row->id_dep }}">
                                            {{ $row->nama_div }}
                                        </option>
                                    @endforeach

                                </select>
                            </label>

                        </div>

                    </section>


                    {{-- ====================================================
                     BAGIAN 2 — IDENTITAS ASET
                ==================================================== --}}

                    <section class="aet-section">

                        <h3>
                            <span>2</span>
                            Identitas Aset
                        </h3>

                        <div class="aet-fields cols2">

                            <label>
                                Nama Barang / Jenis Aset *

                                <select name="id_barang" required>

                                    <option value="">
                                        Pilih Barang
                                    </option>

                                    @foreach ($barangRows as $item)
                                        <option value="{{ $item->id }}">
                                            {{ $item->nama_barang }}
                                            ({{ $item->kode_barang }})
                                        </option>
                                    @endforeach

                                </select>
                            </label>


                            <label>
                                Kode Inventaris *

                                <input name="kode" type="text" maxlength="255"
                                    placeholder="Kode barang inventaris" required>
                            </label>


                            <label>
                                Nomor Register *

                                <input name="reg" type="text" maxlength="255" placeholder="Nomor register aset"
                                    required>
                            </label>


                            <label>
                                Kondisi *

                                <select name="kondisi" required>

                                    <option value="">
                                        Pilih Kondisi
                                    </option>

                                    <option value="BAIK">
                                        Baik
                                    </option>

                                    <option value="CUKUP">
                                        Cukup
                                    </option>

                                    <option value="RUSAK RINGAN">
                                        Rusak Ringan
                                    </option>

                                    <option value="RUSAK BERAT">
                                        Rusak Berat
                                    </option>

                                </select>
                            </label>


                            <label>
                                Bahan *

                                <select name="id_bahan" required>

                                    <option value="">
                                        Pilih Bahan
                                    </option>

                                    @foreach ($bahanRows as $item)
                                        <option value="{{ $item->id }}">
                                            {{ $item->nama }}
                                        </option>
                                    @endforeach

                                </select>
                            </label>


                            <label>
                                Tahun Pengadaan *

                                <input type="number" name="tahun" min="1900" max="2100"
                                    placeholder="Contoh: 2026" required>
                            </label>


                            <label>
                                Jumlah (Unit) *

                                <input type="number" name="jumlah" min="1" value="1" required>
                            </label>


                            <label>
                                Asal Perolehan *

                                <select name="asal" required>

                                    <option value="">
                                        Pilih Asal
                                    </option>

                                    <option value="PEMBELIAN">
                                        Pembelian
                                    </option>

                                    <option value="HIBAH">
                                        Hibah
                                    </option>

                                    <option value="BANTUAN">
                                        Bantuan
                                    </option>

                                    <option value="LAINNYA">
                                        Lainnya
                                    </option>

                                </select>
                            </label>


                            <label>
                                Foto Aset

                                <input type="file" name="img" accept="image/jpeg,image/png,image/webp">

                                <small>
                                    Maksimum 5 MB.
                                    Kosongkan saat Edit jika
                                    tidak mengganti foto.
                                </small>
                            </label>


                            @if ($hasDok)
                                <label>
                                    Dokumen PDF

                                    <input type="file" name="dok" accept="application/pdf">

                                    <small>
                                        Maksimum 15 MB.
                                    </small>
                                </label>
                            @endif

                        </div>


                        <label class="aet-textarea-label">
                            Keterangan

                            <textarea name="ket" rows="3" placeholder="Keterangan kondisi atau penggunaan aset"></textarea>
                        </label>

                    </section>


                    {{-- PESAN VALIDASI --}}

                    <div id="aetFormError" class="aet-error" role="alert" hidden></div>


                    {{-- TOMBOL FORM --}}

                    <footer>

                        <button type="button" class="aet-btn pale" data-close="aetFormDialog">
                            Batal
                        </button>

                        <button type="submit" class="aet-btn primary" id="aetSave">
                            <i data-lucide="save"></i>
                            Simpan Aset
                        </button>

                    </footer>

                </form>

            </div>

        </dialog>


        {{-- ========================================================
         MODAL DETAIL LOKASI
    ======================================================== --}}

        <dialog id="aetDetailDialog" class="aet-dialog wide">

            <header>

                <div>

                    <small>
                        DETAIL LOKASI K.I.B E
                    </small>

                    <h2 id="aetDetailTitle">
                        Detail Aset Tetap Lainnya
                    </h2>

                    <p id="aetDetailSub">
                        Pilih departemen dan divisi
                        untuk melihat aset.
                    </p>


                    <div class="aet-detail-links">

                        <button type="button" class="aet-btn pale" id="aetDetailNilai">
                            <i data-lucide="wallet"></i>
                            Rincian Nilai
                        </button>

                        <button type="button" class="aet-btn pale" id="aetDetailPdf">
                            <i data-lucide="file-text"></i>
                            Daftar PDF
                        </button>

                    </div>

                </div>

                <button type="button" data-close="aetDetailDialog" aria-label="Tutup detail">
                    <i data-lucide="x"></i>
                </button>

            </header>


            <div class="aet-dialog-body">

                <div class="aet-detail-grid">

                    {{-- PANEL ORGANISASI --}}

                    <aside class="aet-detail-tree">

                        <h3>
                            Departemen & Divisi
                        </h3>

                        <div id="aetTree"></div>

                    </aside>


                    {{-- PANEL INVENTARIS --}}

                    <div class="aet-detail-right">

                        <div class="aet-toolbar">

                            <label class="aet-search">

                                <i data-lucide="search"></i>

                                <input id="aetDetailSearch" type="search" placeholder="Cari nama, kode, register...">

                            </label>

                            <b id="aetDetailCount"></b>

                        </div>


                        <div class="aet-table-scroll">

                            <table class="aet-table">

                                <thead>
                                    <tr>
                                        <th>No.</th>
                                        <th>Nama Aset</th>
                                        <th>Kode</th>
                                        <th>Register</th>
                                        <th>Jumlah</th>
                                        <th>Foto</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody id="aetDetailBody"></tbody>

                            </table>

                        </div>


                        <div id="aetFocus" class="aet-focus" hidden></div>

                    </div>

                </div>

            </div>

        </dialog>


        {{-- ========================================================
         MODAL RINCIAN NILAI ASET
    ======================================================== --}}

        <dialog id="aetNilaiDialog" class="aet-dialog wide">

            <header>

                <div>

                    <small>
                        TRANSAKSI NILAI ASET
                    </small>

                    <h2 id="aetNilaiTitle">
                        Detail Nilai K.I.B E
                    </h2>

                    <p id="aetNilaiSub"></p>

                </div>

                <button type="button" data-close="aetNilaiDialog" aria-label="Tutup nilai">
                    <i data-lucide="x"></i>
                </button>

            </header>


            <div class="aet-dialog-body">

                <div class="aet-value-summary">

                    <span>
                        Total nilai aktiva lokasi
                    </span>

                    <b id="aetNilaiTotal">
                        Rp 0
                    </b>

                    <span id="aetNilaiCount">
                        0 transaksi
                    </span>

                </div>


                <div class="aet-table-scroll">

                    <table class="aet-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Kode Perkiraan</th>
                                <th>Nama Aktiva</th>
                                <th>Tanggal</th>
                                <th>Tahun</th>
                                <th>Nilai</th>
                                <th>Uraian</th>
                                <th>Voucher</th>
                            </tr>
                        </thead>

                        <tbody id="aetNilaiBody"></tbody>

                    </table>

                </div>

            </div>

        </dialog>


        {{-- ========================================================
         MODAL DAFTAR PDF
    ======================================================== --}}

        <dialog id="aetPdfDialog" class="aet-dialog">

            <header>

                <div>

                    <small>
                        DOKUMEN INVENTARIS
                    </small>

                    <h2 id="aetPdfTitle">
                        PDF Aset
                    </h2>

                </div>

                <button type="button" data-close="aetPdfDialog" aria-label="Tutup dokumen">
                    <i data-lucide="x"></i>
                </button>

            </header>

            <div class="aet-dialog-body">

                <div id="aetPdfList"></div>

            </div>

        </dialog>


        {{-- ========================================================
         TOAST NOTIFIKASI
    ======================================================== --}}

        <div id="aetToast" class="aet-toast" role="status" hidden></div>

    </section>


    {{-- JAVASCRIPT KHUSUS K.I.B E --}}

    <script
        src="{{ asset('js/pages/kib/aset_ttp.js') }}?v={{ file_exists(public_path('js/pages/kib/aset_ttp.js')) ? filemtime(public_path('js/pages/kib/aset_ttp.js')) : '1' }}">
    </script>

@endsection
