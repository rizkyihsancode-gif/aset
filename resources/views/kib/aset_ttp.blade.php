@extends('layouts.main')

@section('title', 'Aset Tetap Lainnya')

@section('content')

    @php
        $rupiah = fn($n) => 'Rp ' . number_format((float) ($n ?? 0), 0, ',', '.');
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/aset_ttp.css') }}?v={{ file_exists(public_path('css/pages/kib/aset_ttp.css')) ? filemtime(public_path('css/pages/kib/aset_ttp.css')) : time() }}">

    <section id="asetLainPage" class="content aet-page" data-base="{{ url('/kib/aset_ttp') }}"
        data-store="{{ route('kib.aset_ttp.store') }}" data-token="{{ csrf_token() }}">

        {{-- ===================================================
         HEADER DAN STATISTIK
    ==================================================== --}}
        <header class="aet-hero">
            <div class="aet-hero-shade"></div>

            <div class="aet-hero-content">

                <nav class="aet-crumb">
                    <a href="{{ url('/dashboard') }}">
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>
                    K.I.B
                    <i data-lucide="chevron-right"></i>

                    <b>Aset Tetap Lainnya</b>
                </nav>

                <h1>Aset Tetap Lainnya</h1>

                <p>
                    Pengelolaan K.I.B E, inventaris per lokasi,
                    departemen, divisi, dan dokumen aset
                    Perumda Tirta Kencana Kota Samarinda.
                </p>

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
                            <span>Data pada K.I.B E</span>
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
                            <span>Akumulasi jumlah barang</span>
                        </div>
                    </article>

                    <article>
                        <span class="aet-kpi-icon">
                            <i data-lucide="wallet"></i>
                        </span>

                        <div>
                            <small>Nilai Aktiva K.I.B E</small>
                            <strong>
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

        {{-- ===================================================
         PANEL UTAMA
    ==================================================== --}}
        <section class="aet-panel">

            <div class="aet-panel-top">
                <div>
                    <h2>Daftar Aset Tetap Lainnya</h2>
                    <p>
                        Struktur lokasi dan detail inventaris
                        mengikuti web aset lama.
                    </p>
                </div>

                <button class="aet-btn primary" type="button" id="aetAdd">
                    <i data-lucide="plus"></i>
                    Tambah Aset
                </button>
            </div>

            {{-- TABS --}}
            <div class="aet-tabs" role="tablist" aria-label="Tampilan aset">
                <button class="active" type="button" data-tab="daftar">
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

            {{-- =================================================
             TAB DAFTAR ASET
        ================================================== --}}
            <div class="aet-tab-content" data-tab-panel="daftar">
                <div class="aet-toolbar">

                    <label class="aet-search">
                        <i data-lucide="search"></i>

                        <input id="aetSearch" type="search" placeholder="Cari lokasi, alamat, atau nilai...">
                    </label>

                    <label class="aet-limit">
                        Tampilkan

                        <select id="aetLimit">
                            <option>10</option>
                            <option selected>20</option>
                            <option>50</option>
                            <option>100</option>
                        </select>
                    </label>

                    <button class="aet-btn pale" type="button" id="aetReset">
                        <i data-lucide="refresh-cw"></i>
                        Reset
                    </button>

                    <button class="aet-btn pale" type="button" id="aetExport">
                        <i data-lucide="download"></i>
                        Export CSV
                    </button>
                </div>

                <div class="aet-table-scroll">

                    <table id="aetTable" class="aet-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Lokasi</th>
                                <th>Alamat</th>
                                <th>Nilai Aktiva</th>
                                <th>PDF</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            @forelse($lokasiAset as $row)
                                <tr class="aet-location-row"
                                    data-search="{{ mb_strtolower(trim((string) $row->lokasi) . ' ' . trim((string) $row->alamat)) }}"
                                    data-location="{{ $row->id_lokasi }}" data-name="{{ trim((string) $row->lokasi) }}"
                                    data-address="{{ trim((string) $row->alamat) }}" data-value="{{ $row->nilai_total }}"
                                    data-count="{{ $row->jumlah_aset }}">
                                    <td data-order></td>

                                    <td>
                                        <b>
                                            {{ trim((string) $row->lokasi) ?: '—' }}
                                        </b>

                                        <small>
                                            {{ number_format($row->jumlah_aset, 0, ',', '.') }}
                                            inventaris ·
                                            {{ number_format($row->jumlah_unit, 0, ',', '.') }}
                                            unit
                                        </small>
                                    </td>

                                    <td>
                                        {{ trim((string) $row->alamat) ?: '—' }}
                                    </td>

                                    <td>
                                        <button class="aet-value-btn" type="button" data-nilai="{{ $row->id_lokasi }}">
                                            {{ $rupiah($row->nilai_total) }}

                                            <i data-lucide="external-link"></i>
                                        </button>

                                        <small>
                                            {{ $row->jumlah_transaksi }}
                                            transaksi
                                        </small>
                                    </td>

                                    <td class="aet-center">
                                        @if ((int) $row->jumlah_pdf > 0)
                                            <button type="button" class="aet-pdf-btn" data-pdfs="{{ $row->id_lokasi }}">
                                                <i data-lucide="file-text"></i>
                                                {{ $row->jumlah_pdf }} PDF
                                            </button>
                                        @else
                                            <span class="aet-muted">—</span>
                                        @endif
                                    </td>

                                    <td>
                                        <div class="aet-actions">

                                            <button type="button" class="detail" data-view="{{ $row->id_lokasi }}"
                                                title="Detail lokasi">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="edit"
                                                data-edit-location="{{ $row->id_lokasi }}" title="Pilih aset untuk edit">
                                                <i data-lucide="square-pen"></i>
                                            </button>

                                            <button type="button" class="delete"
                                                data-delete-location="{{ $row->id_lokasi }}"
                                                title="Pilih aset untuk hapus">
                                                <i data-lucide="trash-2"></i>
                                            </button>

                                        </div>
                                    </td>
                                </tr>

                            @empty
                                <tr>
                                    <td colspan="6" class="aet-empty">
                                        Belum ada data K.I.B E.
                                        Klik Tambah Aset untuk
                                        melakukan pendataan.
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>

                </div>

                <div class="aet-table-bottom">
                    <span id="aetPageInfo"></span>
                    <div id="aetPages" class="aet-pages"></div>
                </div>
            </div>

            {{-- =================================================
             TAB REKAPITULASI
        ================================================== --}}
            <div class="aet-tab-content" data-tab-panel="rekap" hidden>
                <div class="aet-recap">

                    <article>
                        <h3>Kondisi Aset</h3>

                        <div class="aet-condition-list">
                            @forelse($kondisi as $item)
                                <div>
                                    <span>
                                        {{ trim((string) $item->kondisi) ?: 'Belum diisi' }}
                                    </span>

                                    <b>
                                        {{ number_format($item->jumlah, 0, ',', '.') }}
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
                            Total aset dengan kondisi baik:
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
                            Nilai aktiva dihitung dari transaksi
                            Nilai Aset K.I.B E, bukan nilai
                            perolehan tiap baris inventaris.
                        </p>
                    </article>

                </div>
            </div>

            {{-- =================================================
             TAB GRAFIK KONDISI
        ================================================== --}}
            <div class="aet-tab-content" data-tab-panel="grafik" hidden>
                <div class="aet-graph-card">
                    <h3>
                        Grafik Distribusi Kondisi Aset
                    </h3>

                    <p>
                        Jumlah inventaris berdasarkan kondisi
                        yang tercatat dalam tabel K.I.B E.
                    </p>

                    @forelse($kondisi as $item)
                        @php
                            $percent = $totalAset > 0 ? round((100 * (int) $item->jumlah) / $totalAset, 1) : 0;
                        @endphp

                        <div class="aet-graph-row">

                            <span>
                                {{ trim((string) $item->kondisi) ?: 'Belum diisi' }}
                            </span>

                            <div>
                                <i style="width:{{ $percent }}%"></i>
                            </div>

                            <strong>
                                {{ number_format($item->jumlah, 0, ',', '.') }}
                                ({{ $percent }}%)
                            </strong>

                        </div>
                    @empty
                        <p>
                            Belum ada kondisi aset yang tercatat.
                        </p>
                    @endforelse
                </div>
            </div>

            {{-- =================================================
             TAB ASET TERBARU
        ================================================== --}}
            <div class="aet-tab-content" data-tab-panel="terbaru" hidden>
                <div class="aet-table-scroll">

                    <table class="aet-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Aset</th>
                                <th>Kode / Register</th>
                                <th>Lokasi</th>
                                <th>Jumlah</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            @forelse($terbaru as $item)
                                <tr>
                                    <td>
                                        {{ $loop->iteration }}
                                    </td>

                                    <td>
                                        <b>
                                            {{ trim((string) $item->nama_barang) }}
                                        </b>
                                    </td>

                                    <td>
                                        {{ trim((string) $item->kode) }}
                                        /
                                        {{ trim((string) $item->reg) }}
                                    </td>

                                    <td>
                                        {{ trim((string) $item->lokasi) }}
                                    </td>

                                    <td>
                                        {{ $item->jumlah }}
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
                                        Belum ada data.
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>

                </div>
            </div>

        </section>

        {{-- ===================================================
         MODAL TAMBAH / EDIT
    ==================================================== --}}
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
                        Lengkapi identitas aset, lokasi
                        dan detail perolehan.
                    </p>
                </div>

                <button type="button" data-close="aetFormDialog" aria-label="Tutup">
                    <i data-lucide="x"></i>
                </button>
            </header>

            <div class="aet-dialog-body">

                <form id="aetForm" enctype="multipart/form-data" novalidate>
                    @csrf

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
                                            {{ trim((string) $row->lokasi) }}
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
                                            {{ trim((string) $row->kode_dep) }}
                                            —
                                            {{ trim((string) $row->nama_dep) }}
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
                                            {{ trim((string) $row->nama_div) }}
                                        </option>
                                    @endforeach
                                </select>
                            </label>

                        </div>
                    </section>

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
                                            {{ trim((string) $item->nama_barang) }}
                                            ({{ trim((string) $item->kode_barang) }})
                                        </option>
                                    @endforeach
                                </select>
                            </label>

                            <label>
                                Kode Inventaris *

                                <input name="kode" required maxlength="255" placeholder="Kode barang inventaris">
                            </label>

                            <label>
                                Nomor Register *

                                <input name="reg" required maxlength="255" placeholder="Nomor register aset">
                            </label>

                            <label>
                                Kondisi *

                                <select name="kondisi" required>
                                    <option value="">
                                        Pilih Kondisi
                                    </option>

                                    <option value="BAIK">Baik</option>
                                    <option value="CUKUP">Cukup</option>
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
                                            {{ trim((string) $item->nama) }}
                                        </option>
                                    @endforeach
                                </select>
                            </label>

                            <label>
                                Tahun Pengadaan *

                                <input type="number" name="tahun" min="1900" max="2100" required
                                    placeholder="Contoh: 2026">
                            </label>

                            <label>
                                Jumlah (Unit) *

                                <input type="number" name="jumlah" min="1" required value="1">
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
                                    Kosongkan jika tidak diganti.
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

                            <textarea name="ket" rows="3" placeholder="Keterangan kondisi dan penggunaan aset"></textarea>
                        </label>

                    </section>

                    <div id="aetFormError" class="aet-error" role="alert" hidden></div>

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

        {{-- ===================================================
         MODAL DETAIL INVENTARIS PER LOKASI
    ==================================================== --}}
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
                        Pilih departemen/divisi untuk melihat aset.
                    </p>
                </div>

                <button type="button" data-close="aetDetailDialog">
                    <i data-lucide="x"></i>
                </button>
            </header>

            <div class="aet-dialog-body">
                <div class="aet-detail-grid">

                    <aside class="aet-detail-tree">
                        <h3>
                            Departemen & Divisi
                        </h3>

                        <div id="aetTree"></div>
                    </aside>

                    <div class="aet-detail-right">

                        <div class="aet-toolbar">

                            <label class="aet-search">
                                <i data-lucide="search"></i>

                                <input type="search" id="aetDetailSearch" placeholder="Cari nama, kode, register...">
                            </label>

                            <b id="aetDetailCount"></b>
                        </div>

                        <div class="aet-table-scroll">

                            <table class="aet-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
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

        {{-- ===================================================
         MODAL DETAIL NILAI
    ==================================================== --}}
        <dialog id="aetNilaiDialog" class="aet-dialog wide">
            <header>
                <div>
                    <small>TRANSAKSI NILAI ASET</small>

                    <h2 id="aetNilaiTitle">
                        Detail Nilai K.I.B E
                    </h2>

                    <p id="aetNilaiSub"></p>
                </div>

                <button type="button" data-close="aetNilaiDialog">
                    <i data-lucide="x"></i>
                </button>
            </header>

            <div class="aet-dialog-body">

                <div class="aet-value-summary">
                    <span>Total nilai aktiva lokasi</span>
                    <b id="aetNilaiTotal">Rp 0</b>
                    <span id="aetNilaiCount">0 transaksi</span>
                </div>

                <div class="aet-table-scroll">

                    <table class="aet-table">
                        <thead>
                            <tr>
                                <th>No</th>
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

        {{-- ===================================================
         MODAL PDF
    ==================================================== --}}
        <dialog id="aetPdfDialog" class="aet-dialog">
            <header>
                <div>
                    <small>DOKUMEN INVENTARIS</small>

                    <h2 id="aetPdfTitle">
                        PDF Aset
                    </h2>
                </div>

                <button type="button" data-close="aetPdfDialog">
                    <i data-lucide="x"></i>
                </button>
            </header>

            <div class="aet-dialog-body">
                <div id="aetPdfList"></div>
            </div>
        </dialog>

        <div id="aetToast" class="aet-toast" role="status" hidden></div>

    </section>

    <script
        src="{{ asset('js/pages/kib/aset_ttp.js') }}?v={{ file_exists(public_path('js/pages/kib/aset_ttp.js')) ? filemtime(public_path('js/pages/kib/aset_ttp.js')) : time() }}">
    </script>

@endsection
