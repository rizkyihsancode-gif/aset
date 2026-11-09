@extends('layouts.main')

@section('title', 'Aset Tetap Lainnya')

@section('content')

    @php
        $viewMode = ($viewMode ?? 'manual') === 'arsip' ? 'arsip' : 'manual';

        $labelKondisi = fn($value) => match (strtoupper(trim((string) $value))) {
            'BAIK' => 'Baik (B)',
            'KURANG BAIK' => 'Kurang Baik (KB)',
            'RUSAK BERAT' => 'Rusak Berat (RB)',
            'CUKUP' => 'Cukup (lama)',
            'RUSAK RINGAN' => 'Rusak Ringan (lama)',
            default => $value ?: '—',
        };
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/aset_ttp.css') }}?v={{ file_exists(public_path('css/pages/kib/aset_ttp.css')) ? filemtime(public_path('css/pages/kib/aset_ttp.css')) : '1' }}">

    <section id="aemApp" class="aem-page" data-base="{{ url('/kib/aset_ttp') }}"
        data-group-url="{{ route('kib.aset_ttp.kelompok') }}" data-token="{{ csrf_token() }}"
        data-logo-url="{{ asset('images/logo.png') }}">

        {{-- HEADER --}}

        <header class="aem-hero">

            <nav class="aem-crumb">

                <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>
                <span>K.I.B</span>
                <i data-lucide="chevron-right"></i>
                <strong>Aset Tetap Lainnya</strong>

            </nav>

            <div class="aem-date">

                <i data-lucide="calendar-days"></i>

                <div>

                    <strong id="aemDate">
                        {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                    </strong>

                    <small>
                        <span id="aemTime">
                            {{ now('Asia/Makassar')->format('H:i:s') }}
                        </span>
                        WITA
                    </small>

                </div>

            </div>

            <h1>Aset Tetap Lainnya</h1>

            <p>
                Kartu Inventaris Barang (KIB) E —
                pencatatan manual, kelompok lokasi dan divisi,
                serta lampiran dokumen pendukung.
            </p>

            <div class="aem-kpis">

                <article>
                    <i data-lucide="package-open"></i>
                    <div>
                        <small>Total Inventaris</small>
                        <strong>
                            {{ number_format($totalAset ?? 0, 0, ',', '.') }}
                        </strong>
                        <span>Catatan barang</span>
                    </div>
                </article>

                <article>
                    <i data-lucide="boxes"></i>
                    <div>
                        <small>Total Unit</small>
                        <strong>
                            {{ number_format($totalUnit ?? 0, 0, ',', '.') }}
                        </strong>
                        <span>Akumulasi jumlah barang</span>
                    </div>
                </article>

                <article>
                    <i data-lucide="map-pin"></i>
                    <div>
                        <small>Jumlah Lokasi</small>
                        <strong>
                            {{ number_format($totalLokasi ?? 0, 0, ',', '.') }}
                        </strong>
                        <span>Lokasi berbeda</span>
                    </div>
                </article>

            </div>

        </header>


        {{-- ================================================
         HALAMAN UTAMA
    ================================================= --}}

        <section class="aem-panel" id="aemListPanel">

            <div class="aem-panel-head">

                <div>
                    <h2>
                        {{ $viewMode === 'arsip' ? 'Arsip Aset Tetap Lainnya' : 'Daftar Aset Tetap Lainnya' }}
                    </h2>

                    <p>
                        {{ $viewMode === 'arsip'
                            ? 'Catatan lama, hanya dapat dibaca.'
                            : 'Klik folder untuk membuka kelompok, atau edit dan hapus catatan manual.' }}
                    </p>
                </div>

                @if ($viewMode === 'manual')
                    <button type="button" class="aem-btn primary" id="aemAdd">
                        <i data-lucide="plus"></i>
                        Tambah Aset
                    </button>
                @endif

            </div>


            {{-- TAB --}}

            <nav class="aem-tabs">

                <a class="{{ $viewMode === 'manual' ? 'active' : '' }}" href="{{ route('kib.aset_ttp') }}">
                    <i data-lucide="clipboard-list"></i>
                    Data Manual ({{ $totalAset ?? 0 }})
                </a>

                <a class="{{ $viewMode === 'arsip' ? 'active' : '' }}"
                    href="{{ route('kib.aset_ttp', ['view' => 'arsip']) }}">
                    <i data-lucide="archive"></i>
                    Arsip Lama ({{ $archiveCount ?? 0 }})
                </a>

            </nav>


            {{-- PENCARIAN DAN FILTER --}}

            <form action="{{ route('kib.aset_ttp') }}" method="GET" class="aem-toolbar">

                <input type="hidden" name="view" value="{{ $viewMode }}">

                <label class="aem-search">

                    <i data-lucide="search"></i>

                    <input name="q" type="search" value="{{ $search ?? '' }}"
                        placeholder="Cari nama, kode barang, register, lokasi...">

                </label>

                @if ($viewMode === 'manual')

                    <select name="kondisi" aria-label="Filter kondisi">
                        <option value="">Semua Kondisi</option>

                        @foreach ([
            'BAIK' => 'Baik (B)',
            'KURANG BAIK' => 'Kurang Baik (KB)',
            'RUSAK BERAT' => 'Rusak Berat (RB)',
            'CUKUP' => 'Cukup (lama)',
            'RUSAK RINGAN' => 'Rusak Ringan (lama)',
        ] as $value => $label)
                            <option value="{{ $value }}" @selected(($condition ?? '') === $value)>
                                {{ $label }}
                            </option>
                        @endforeach
                    </select>

                @endif

                <button type="submit" class="aem-btn primary">
                    <i data-lucide="filter"></i>
                    Filter
                </button>

                <a class="aem-btn outline"
                    href="{{ route('kib.aset_ttp', $viewMode === 'arsip' ? ['view' => 'arsip'] : []) }}">
                    Reset
                </a>

            </form>


            @if ($viewMode === 'arsip')
                <div class="aem-notice">
                    <i data-lucide="lock-keyhole"></i>
                    Sumber: <code>kib_e_s</code>.
                    Arsip ini baca-saja dan tidak berubah.
                </div>
            @endif


            {{-- TABEL RINGKASAN --}}

            <div class="aem-table-wrap">

                <table class="aem-table aem-main-table">

                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Nama Barang</th>
                            <th>Kode Barang / Register</th>
                            <th>Tahun</th>
                            <th>Jumlah</th>
                            <th>Kondisi</th>
                            <th>Lokasi</th>
                            <th>
                                {{ $viewMode === 'manual' ? 'Aksi' : 'Asal' }}
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        @forelse($items as $item)
                            <tr>

                                <td class="aem-center">
                                    {{ $items->firstItem() + $loop->index }}
                                </td>

                                <td>
                                    <strong>
                                        {{ $item->nama_aset ?: '—' }}
                                    </strong>
                                </td>

                                <td>
                                    <strong>
                                        {{ $viewMode === 'manual' ? ($item->kode_inventaris ?: '—') : ($item->kode ?: '—') }}
                                    </strong>

                                    <small>
                                        Register:
                                        {{ $viewMode === 'manual' ? ($item->nomor_register ?: '—') : ($item->reg ?: '—') }}
                                    </small>
                                </td>

                                <td class="aem-center">
                                    {{ $item->tahun ?: '—' }}
                                </td>

                                <td class="aem-center">
                                    {{ number_format((int) ($viewMode === 'manual' ? $item->jumlah_unit : $item->jumlah), 0, ',', '.') }}
                                </td>

                                <td>
                                    <span class="aem-pill">
                                        {{ $labelKondisi($item->kondisi) }}
                                    </span>
                                </td>

                                <td>
                                    {{ $item->lokasi ?: '—' }}
                                </td>

                                <td class="aem-action-cell">

                                    @if ($viewMode === 'manual')
                                        <div class="aem-actions">

                                            <button type="button" class="aem-icon view" data-aem-action="group"
                                                data-id="{{ $item->id }}" data-location="{{ $item->lokasi }}"
                                                data-division="{{ $item->divisi }}" title="Detail Kelompok"
                                                aria-label="Detail Kelompok">
                                                <i data-lucide="folder-open"></i>
                                            </button>

                                            <button type="button" class="aem-icon edit" data-aem-action="edit"
                                                data-id="{{ $item->id }}" title="Edit Aset" aria-label="Edit Aset">
                                                <i data-lucide="pencil"></i>
                                            </button>

                                            <button type="button" class="aem-icon delete" data-aem-action="delete"
                                                data-id="{{ $item->id }}" data-name="{{ $item->nama_aset }}"
                                                title="Hapus Aset" aria-label="Hapus Aset">
                                                <i data-lucide="trash-2"></i>
                                            </button>

                                        </div>
                                    @else
                                        {{ $item->asal ?: '—' }}
                                    @endif

                                </td>

                            </tr>

                        @empty

                            <tr>
                                <td colspan="8" class="aem-empty">
                                    Belum ada data yang sesuai.
                                </td>
                            </tr>
                        @endforelse

                    </tbody>

                </table>

            </div>

            <div class="aem-pagination">
                {{ $items->links() }}
            </div>

        </section>


        {{-- ================================================
         POPUP DETAIL KELOMPOK
         Panel kiri: Lokasi / Divisi
         Panel kanan: Daftar Barang
    ================================================= --}}

        @if ($viewMode === 'manual')

            <dialog id="aemGroupPanel" class="aem-group-dialog" aria-labelledby="aemGroupDialogTitle">

                <div class="aem-group-header">

                    <div>
                        <small>K.I.B E — INVENTARIS MANUAL</small>

                        <h2 id="aemGroupDialogTitle">
                            Detail Kelompok Aset
                        </h2>

                        <p>
                            Lokasi dan divisi di kiri;
                            daftar barang di kanan.
                        </p>
                    </div>

                    <button type="button" class="aem-close" id="aemGroupClose" aria-label="Tutup">
                        <i data-lucide="x"></i>
                    </button>

                </div>


                <div class="aem-group-layout">

                    {{-- PANEL KIRI --}}

                    <aside class="aem-group-left">

                        <h3>
                            <i data-lucide="folder-tree"></i>
                            Lokasi & Divisi
                        </h3>

                        <label class="aem-search">

                            <i data-lucide="search"></i>

                            <input id="aemGroupSearch" type="search" placeholder="Cari lokasi atau divisi...">

                        </label>

                        <div id="aemGroupList" class="aem-group-list"></div>

                    </aside>


                    {{-- PANEL KANAN --}}

                    <section class="aem-group-right">

                        <div class="aem-panel-head">

                            <div>
                                <small>DAFTAR BARANG</small>

                                <h3 id="aemGroupTitle">
                                    Pilih kelompok
                                </h3>

                                <p id="aemGroupSubtitle">—</p>
                            </div>

                            <span id="aemGroupCount" class="aem-pill">
                                0 barang
                            </span>

                        </div>


                        <div class="aem-toolbar">

                            <label class="aem-search">

                                <i data-lucide="search"></i>

                                <input id="aemGroupItemSearch" type="search" placeholder="Cari nama, kode, register...">

                            </label>

                            <button type="button" class="aem-btn outline" id="aemGroupRefresh">
                                Reset Cari
                            </button>

                        </div>


                        <div id="aemGroupAlert" class="aem-error" hidden></div>


                        <div class="aem-table-wrap">



                            {{-- ==========================================================
     TABEL KELOMPOK KIB E — FORMAT EXCEL
     10 KOLOM INVENTARIS + 1 KOLOM VIEW
========================================================== --}}

                            <table class="aem-table aem-group-table">

                                <colgroup>
                                    <col class="aem-col-no">
                                    <col class="aem-col-name">
                                    <col class="aem-col-code">
                                    <col class="aem-col-register">
                                    <col class="aem-col-condition">
                                    <col class="aem-col-material">
                                    <col class="aem-col-year">
                                    <col class="aem-col-quantity">
                                    <col class="aem-col-origin">
                                    <col class="aem-col-description">
                                    <col class="aem-col-view">
                                </colgroup>

                                <thead>

                                    <tr>

                                        <th rowspan="2">
                                            No.
                                        </th>

                                        <th rowspan="2">
                                            Nama Barang / Jenis Barang
                                        </th>

                                        <th colspan="2">
                                            Nomor
                                        </th>

                                        <th rowspan="2">
                                            Kondisi Barang (B, KB, RB)
                                        </th>

                                        <th rowspan="2">
                                            Bahan
                                        </th>

                                        <th rowspan="2">
                                            Tahun Pengadaan / Perolehan
                                        </th>

                                        <th rowspan="2">
                                            Jumlah
                                        </th>

                                        <th rowspan="2">
                                            Asal Usul / Cara Perolehan
                                        </th>

                                        <th rowspan="2">
                                            Keterangan
                                        </th>

                                        <th rowspan="2">
                                            View
                                        </th>

                                    </tr>

                                    <tr>
                                        <th>Kode Barang</th>
                                        <th>Register</th>
                                    </tr>

                                    {{-- Nomor kolom sesuai lembar Excel --}}

                                    <tr class="aem-group-number-row">

                                        @for ($i = 1; $i <= 10; $i++)
                                            <th>{{ $i }}</th>
                                        @endfor

                                        <th>—</th>

                                    </tr>

                                </thead>

                                <tbody id="aemGroupRows">

                                    <tr>
                                        <td colspan="11" class="aem-empty">
                                            Memuat data inventaris...
                                        </td>
                                    </tr>

                                </tbody>

                            </table>



                        </div>


                        <div class="aem-group-footer">

                            <span id="aemGroupInfo">0 data</span>

                            <div>

                                <button type="button" class="aem-btn outline" id="aemGroupPrev">
                                    Sebelumnya
                                </button>

                                <span id="aemGroupPage">
                                    1 / 1
                                </span>

                                <button type="button" class="aem-btn outline" id="aemGroupNext">
                                    Berikutnya
                                </button>

                            </div>

                        </div>

                    </section>

                </div>


                <footer class="aem-dialog-foot">

                    <button type="button" class="aem-btn outline" id="aemBack">
                        Kembali ke Daftar
                    </button>

                </footer>

            </dialog>

        @endif


        {{-- ================================================
         POPUP FORM TAMBAH / EDIT KIB E
    ================================================= --}}

        <dialog id="aemFormDialog" class="aem-dialog" aria-labelledby="aemFormTitle">

            <form id="aemForm" enctype="multipart/form-data" novalidate>

                @csrf

                <header class="aem-dialog-head">

                    <div>
                        <small>
                            FORM KARTU INVENTARIS BARANG (KIB) E
                        </small>

                        <h2 id="aemFormTitle">
                            Tambah Aset Tetap Lainnya
                        </h2>

                        <p>
                            Catat manual, tidak terhubung
                            ke Master Kode Aktiva.
                        </p>
                    </div>

                    <button type="button" class="aem-close" data-aem-close="aemFormDialog" aria-label="Tutup">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="aem-dialog-body">

                    <div id="aemError" class="aem-error" role="alert" hidden></div>


                    {{-- IDENTITAS KIB E --}}

                    <fieldset>

                        <legend>
                            1. Identitas KIB E
                        </legend>

                        <div class="aem-fields">

                            <label>
                                Provinsi

                                <input readonly value="KALIMANTAN TIMUR">
                            </label>

                            <label>
                                Kota

                                <input readonly value="SAMARINDA">
                            </label>

                            <label class="aem-full">
                                Unit

                                <input readonly value="PERUMDAM TIRTA KENCANA">
                            </label>

                            <label>
                                Departemen

                                <input name="departemen" id="aemDep" data-aem-combo="departemen" autocomplete="off"
                                    maxlength="255" placeholder="Cari atau ketik departemen">
                            </label>

                            <label>
                                Divisi

                                <input name="divisi" id="aemDiv" data-aem-combo="divisi" autocomplete="off"
                                    maxlength="255" placeholder="Cari atau ketik divisi">
                            </label>

                            <label>
                                Kode Struktur

                                <input name="kode_struktur" maxlength="100" placeholder="Contoh: 04.03.04">

                                <small>
                                    Catatan manual, bukan
                                    relasi Kode Aktiva.
                                </small>
                            </label>

                            <label>
                                Lokasi / Unit Kerja <em>*</em>

                                <input name="lokasi" id="aemLokasi" data-aem-combo="lokasi" maxlength="500" required
                                    autocomplete="off" placeholder="Cari atau ketik lokasi">
                            </label>

                            <label class="aem-full">
                                Alamat Lokasi

                                <input name="alamat" id="aemAlamat" maxlength="500" placeholder="Alamat lokasi">
                            </label>

                        </div>

                    </fieldset>


                    {{-- DATA BARANG SESUAI EXCEL --}}

                    <fieldset>

                        <legend>
                            2. Informasi Barang — Sesuai Excel
                        </legend>

                        <div class="aem-fields">

                            <label class="aem-full">
                                Nama Barang / Jenis Barang <em>*</em>

                                <input name="nama_aset" maxlength="500" required placeholder="Papan Nama Instansi">
                            </label>

                            <label>
                                Nomor — Kode Barang <em>*</em>

                                <input name="kode_inventaris" maxlength="255" required placeholder="02.06.01.05.06">
                            </label>

                            <label>
                                Nomor — Register <em>*</em>

                                <input name="nomor_register" maxlength="255" required placeholder="001">

                                <small>
                                    Teks, agar nol di depan
                                    tidak hilang.
                                </small>
                            </label>

                            <label>
                                Kondisi Barang (B, KB, RB) <em>*</em>

                                <input name="kondisi" id="aemKondisi" data-aem-combo="kondisi" required
                                    autocomplete="off" placeholder="Baik / Kurang Baik / Rusak Berat">
                            </label>

                            <label>
                                Bahan

                                <input name="bahan" id="aemBahan" data-aem-combo="bahan" maxlength="255"
                                    autocomplete="off" placeholder="Aluminium">
                            </label>

                            <label>
                                Tahun Pengadaan / Perolehan <em>*</em>

                                <input name="tahun" type="number" min="1900" max="2100" required
                                    placeholder="2026">
                            </label>

                            <label>
                                Jumlah <em>*</em>

                                <input name="jumlah_unit" type="number" min="1" required value="1">
                            </label>

                            <label class="aem-full">
                                Asal Usul / Cara Perolehan

                                <input name="asal_perolehan" id="aemAsal" data-aem-combo="asal" maxlength="255"
                                    autocomplete="off" placeholder="Pengadaan / Hibah / Bantuan">
                            </label>

                            <label class="aem-full">
                                Keterangan

                                <textarea name="keterangan" rows="4" placeholder="Kantor Pusat, UPW I, nomor berita acara, dll."></textarea>
                            </label>

                        </div>

                    </fieldset>


                    {{-- FOTO DAN DOKUMEN --}}

                    <fieldset>

                        <legend>
                            3. Foto dan Dokumen Pendukung
                        </legend>

                        <div class="aem-fields">

                            <label>
                                Foto Utama

                                <input name="foto" type="file" accept="image/jpeg,image/png,image/webp">

                                <small>
                                    Opsional, maksimum 5 MB.
                                </small>
                            </label>

                            <label>
                                Dokumen PDF / Gambar

                                <input id="aemDocsInput" name="dokumens[]" type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp" multiple>

                                <small>
                                    Bisa memilih beberapa kali.
                                </small>
                            </label>

                            <div class="aem-full" id="aemSelectedDocs"></div>

                            <div class="aem-full" id="aemSavedDocs"></div>

                        </div>

                    </fieldset>

                </div>


                <footer class="aem-dialog-foot">

                    <button type="button" class="aem-btn outline" data-aem-close="aemFormDialog">
                        Batal
                    </button>

                    <button type="submit" id="aemSave" class="aem-btn primary">
                        <i data-lucide="save"></i>
                        Simpan Aset
                    </button>

                </footer>

            </form>

        </dialog>


        {{-- ================================================
         POPUP VIEW EXCEL KIB E
    ================================================= --}}

        <dialog id="aemDetailDialog" class="aem-dialog aem-excel-dialog" aria-labelledby="aemDetailTitle">

            <header class="aem-dialog-head">

                <div>
                    <small>
                        VIEW KARTU INVENTARIS BARANG (KIB) E
                    </small>

                    <h2 id="aemDetailTitle">
                        Detail Inventaris
                    </h2>
                </div>

                <button type="button" class="aem-close" data-aem-close="aemDetailDialog" aria-label="Tutup">
                    <i data-lucide="x"></i>
                </button>

            </header>

            <div class="aem-dialog-body" id="aemDetailBody"></div>

            <footer class="aem-dialog-foot">

                <button type="button" class="aem-btn outline" data-aem-close="aemDetailDialog">
                    Tutup
                </button>

                <button type="button" id="aemEditDetail" class="aem-btn outline">
                    <i data-lucide="pencil"></i>
                    Edit
                </button>

                <button type="button" id="aemDeleteDetail" class="aem-btn danger">
                    <i data-lucide="trash-2"></i>
                    Hapus
                </button>

            </footer>

        </dialog>


        {{-- MODAL HAPUS --}}

        <dialog id="aemDeleteDialog" class="aem-dialog aem-confirm" aria-labelledby="aemDeleteTitle">

            <header class="aem-dialog-head">

                <div>
                    <small>KONFIRMASI</small>
                    <h2 id="aemDeleteTitle">Hapus Aset?</h2>
                </div>

                <button type="button" class="aem-close" data-aem-close="aemDeleteDialog">
                    <i data-lucide="x"></i>
                </button>

            </header>

            <div class="aem-confirm-body">

                <i data-lucide="triangle-alert"></i>

                <p>
                    Aset dan lampirannya akan dihapus permanen:
                </p>

                <strong id="aemDeleteName"></strong>

                <small>
                    Arsip <code>kib_e_s</code>
                    tidak akan diubah.
                </small>

            </div>

            <footer class="aem-dialog-foot">

                <button type="button" class="aem-btn outline" data-aem-close="aemDeleteDialog">
                    Batal
                </button>

                <button type="button" class="aem-btn danger" id="aemConfirmDelete">
                    Ya, Hapus
                </button>

            </footer>

        </dialog>

        <div id="aemToast" class="aem-toast" role="status" hidden></div>

    </section>


    <script id="aemMaster" type="application/json">
@json($master ?? [])
</script>

    <script id="aemHistory" type="application/json">
@json($history ?? [])
</script>

    <script
        src="{{ asset('js/pages/kib/aset_ttp.js') }}?v={{ file_exists(public_path('js/pages/kib/aset_ttp.js')) ? filemtime(public_path('js/pages/kib/aset_ttp.js')) : '1' }}">
    </script>

@endsection
