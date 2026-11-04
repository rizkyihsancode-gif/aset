@extends('layouts.main')

@section('title', 'Aset Tetap Lainnya')

@section('content')

    @php
        $viewMode = ($viewMode ?? 'manual') === 'arsip' ? 'arsip' : 'manual';

        $condLabel = fn($value) => mb_convert_case(mb_strtolower((string) ($value ?? '')), MB_CASE_TITLE, 'UTF-8');
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/aset_ttp.css') }}?v={{ file_exists(public_path('css/pages/kib/aset_ttp.css')) ? filemtime(public_path('css/pages/kib/aset_ttp.css')) : '1' }}">

    <section id="aemApp" class="aem-page" data-base="{{ url('/kib/aset_ttp') }}" data-token="{{ csrf_token() }}">

        {{-- =====================================================
         HEADER K.I.B E
    ====================================================== --}}

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


            {{-- TANGGAL / JAM WITA --}}

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
                Pencatatan inventaris K.I.B E secara manual,
                terpisah dari transaksi Nilai Aset.
                Data historis tetap tersedia sebagai arsip.
            </p>


            {{-- =================================================
             STATISTIK
        ================================================== --}}

            <div class="aem-kpis">

                <article>

                    <span class="aem-kpi-icon">
                        <i data-lucide="package-open"></i>
                    </span>

                    <div>

                        <small>Total Inventaris</small>

                        <strong>
                            {{ number_format($totalAset, 0, ',', '.') }}
                        </strong>

                        <span>Catatan inventaris manual</span>

                    </div>

                </article>


                <article>

                    <span class="aem-kpi-icon">
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

                    <span class="aem-kpi-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <div>

                        <small>Jumlah Lokasi</small>

                        <strong>
                            {{ number_format($totalLokasi, 0, ',', '.') }}
                        </strong>

                        <span>Lokasi berbeda</span>

                    </div>

                </article>

            </div>

        </header>


        {{-- =====================================================
         PANEL UTAMA
    ====================================================== --}}

        <section class="aem-panel">

            <div class="aem-heading">

                <div>

                    <h2>
                        {{ $viewMode === 'arsip' ? 'Arsip Aset Tetap Lainnya' : 'Daftar Aset Tetap Lainnya' }}
                    </h2>

                    <p>
                        {{ $viewMode === 'arsip'
                            ? 'Riwayat dari K.I.B E lama, hanya untuk dibaca.'
                            : 'Kelola inventaris melalui tombol View, Edit, dan Delete.' }}
                    </p>

                </div>


                <button class="aem-btn primary" id="aemAdd" type="button">

                    <i data-lucide="plus"></i>

                    Tambah Aset

                </button>

            </div>


            {{-- =================================================
             TAB MANUAL DAN ARSIP
        ================================================== --}}

            <nav class="aem-tabs" aria-label="Sumber inventaris">

                <a class="{{ $viewMode === 'manual' ? 'active' : '' }}" href="{{ route('kib.aset_ttp') }}">

                    <i data-lucide="clipboard-list"></i>

                    Data Manual ({{ $totalAset }})

                </a>


                <a class="{{ $viewMode === 'arsip' ? 'active' : '' }}"
                    href="{{ route('kib.aset_ttp', ['view' => 'arsip']) }}">

                    <i data-lucide="archive"></i>

                    Arsip Data Lama ({{ $archiveCount }})

                </a>

            </nav>


            {{-- =================================================
             FILTER
        ================================================== --}}

            <form class="aem-toolbar" action="{{ route('kib.aset_ttp') }}" method="GET">

                <input type="hidden" name="view" value="{{ $viewMode }}">


                <label class="aem-search">

                    <i data-lucide="search"></i>

                    <input name="q" type="search" value="{{ $search }}"
                        placeholder="Cari nama aset, kode, register, lokasi...">

                </label>


                @if ($viewMode === 'manual')

                    <select name="kondisi" aria-label="Filter kondisi">

                        <option value="">
                            Semua kondisi
                        </option>

                        @foreach ([
            'BAIK' => 'Baik',
            'CUKUP' => 'Cukup',
            'RUSAK RINGAN' => 'Rusak Ringan',
            'RUSAK BERAT' => 'Rusak Berat',
        ] as $value => $label)
                            <option value="{{ $value }}" @selected($condition === $value)>
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


            {{-- =================================================
             NOTIFIKASI ARSIP
        ================================================== --}}

            @if ($viewMode === 'arsip')
                <div class="aem-notice">

                    <i data-lucide="lock-keyhole"></i>

                    Data pada tab ini berasal dari tabel
                    <code>kib_e_s</code>.

                    Seluruh arsip hanya dapat dibaca.

                </div>
            @endif


            {{-- =================================================
             TABEL RINGKAS K.I.B E
        ================================================== --}}

            <div class="aem-table-wrap">

                <table class="aem-table">

                    <thead>

                        <tr>

                            <th>No.</th>

                            <th>Nama Aset</th>

                            <th>Kode / Register</th>

                            <th>Tahun</th>

                            <th>Jumlah Unit</th>

                            <th>Kondisi</th>

                            <th>Lokasi</th>

                            @if ($viewMode === 'manual')
                                <th class="aem-action-head">
                                    Aksi
                                </th>
                            @else
                                <th>Asal</th>
                            @endif

                        </tr>

                    </thead>


                    <tbody>

                        @forelse ($items as $item)
                            <tr>

                                {{-- NOMOR --}}

                                <td class="aem-center">

                                    {{ $items->firstItem() + $loop->index }}

                                </td>


                                {{-- NAMA ASET --}}

                                <td>

                                    <strong class="aem-name">
                                        {{ $item->nama_aset ?: '—' }}
                                    </strong>

                                </td>


                                {{-- KODE / REGISTER --}}

                                <td>

                                    <div class="aem-code">

                                        {{ $viewMode === 'arsip' ? ($item->kode ?: '—') : ($item->kode_inventaris ?: '—') }}

                                    </div>

                                    <small>

                                        {{ $viewMode === 'arsip' ? ($item->reg ?: '—') : ($item->nomor_register ?: '—') }}

                                    </small>

                                </td>


                                {{-- TAHUN --}}

                                <td class="aem-center">

                                    {{ $item->tahun ?: '—' }}

                                </td>


                                {{-- JUMLAH UNIT --}}

                                <td class="aem-center">

                                    {{ number_format((int) ($viewMode === 'arsip' ? $item->jumlah : $item->jumlah_unit), 0, ',', '.') }}

                                </td>


                                {{-- KONDISI --}}

                                <td>

                                    <span class="aem-condition">

                                        {{ $condLabel($item->kondisi) ?: '—' }}

                                    </span>

                                </td>


                                {{-- LOKASI --}}

                                <td>

                                    {{ $item->lokasi ?: '—' }}

                                </td>


                                {{-- AKSI ATAU ARSIP --}}

                                @if ($viewMode === 'manual')
                                    <td class="aem-action-cell">

                                        <div class="aem-actions">


                                            {{-- VIEW --}}

                                            <button type="button" class="aem-action view" data-aem-action="view"
                                                data-id="{{ $item->id }}" title="View" aria-label="Lihat detail">

                                                <i data-lucide="eye"></i>

                                            </button>


                                            {{-- EDIT --}}

                                            <button type="button" class="aem-action edit" data-aem-action="edit"
                                                data-id="{{ $item->id }}" title="Edit" aria-label="Edit aset">

                                                <i data-lucide="pencil"></i>

                                            </button>


                                            {{-- DELETE --}}

                                            <button type="button" class="aem-action delete" data-aem-action="delete"
                                                data-id="{{ $item->id }}" data-name="{{ $item->nama_aset }}"
                                                title="Delete" aria-label="Hapus aset">

                                                <i data-lucide="trash-2"></i>

                                            </button>

                                        </div>

                                    </td>
                                @else
                                    <td>

                                        {{ $item->asal ?: '—' }}

                                    </td>
                                @endif

                            </tr>

                        @empty

                            <tr>

                                <td colspan="8" class="aem-empty">

                                    Belum ada data pada tampilan ini.

                                </td>

                            </tr>
                        @endforelse

                    </tbody>

                </table>

            </div>


            {{-- PAGINATION --}}

            <div class="aem-pagination">

                {{ $items->links() }}

            </div>

        </section>


        {{-- =====================================================
         FORM CREATE / UPDATE
    ====================================================== --}}

        <dialog id="aemFormDialog" class="aem-dialog" aria-labelledby="aemFormTitle">

            <form id="aemForm" enctype="multipart/form-data" novalidate>

                @csrf


                <header class="aem-dialog-head">

                    <div>

                        <small>
                            FORM K.I.B E — INPUT MANUAL
                        </small>

                        <h2 id="aemFormTitle">

                            Tambah Aset Tetap Lainnya

                        </h2>

                        <p>

                            Masukkan inventaris sesuai kondisi
                            fisik dan dokumen yang tersedia.

                        </p>

                    </div>


                    <button type="button" data-aem-close="aemFormDialog" aria-label="Tutup" class="aem-x">

                        <i data-lucide="x"></i>

                    </button>

                </header>


                <div class="aem-dialog-body">

                    <div class="aem-error" id="aemError" role="alert" hidden></div>


                    {{-- ============================================
                     BAGIAN 1 — LOKASI DAN ORGANISASI
                ============================================= --}}

                    <fieldset>

                        <legend>

                            <span>1</span>
                            Lokasi dan Organisasi

                        </legend>


                        <div class="aem-fields">

                            <label>

                                Lokasi / Unit Kerja
                                <em>*</em>

                                <input name="lokasi" id="aemLokasi" data-aem-combo="lokasi" required maxlength="500"
                                    autocomplete="off" placeholder="Cari atau ketik lokasi">

                            </label>


                            <label>

                                Alamat Lokasi

                                <input name="alamat" id="aemAlamat" maxlength="500" placeholder="Alamat lengkap">

                            </label>


                            <label>

                                Departemen

                                <input name="departemen" id="aemDep" data-aem-combo="departemen" maxlength="255"
                                    autocomplete="off" placeholder="Cari atau ketik departemen">

                            </label>


                            <label>

                                Divisi

                                <input name="divisi" id="aemDiv" data-aem-combo="divisi" maxlength="255"
                                    autocomplete="off" placeholder="Cari atau ketik divisi">

                            </label>

                        </div>

                    </fieldset>


                    {{-- ============================================
                     BAGIAN 2 — IDENTITAS INVENTARIS
                ============================================= --}}

                    <fieldset>

                        <legend>

                            <span>2</span>
                            Identitas Inventaris

                        </legend>


                        <div class="aem-fields">

                            <label class="aem-full">

                                Nama Barang / Jenis Aset
                                <em>*</em>

                                <input name="nama_aset" id="aemNama" maxlength="500" required
                                    placeholder="Nama aset yang dicatat manual">

                            </label>


                            <label>

                                Kode Inventaris
                                <em>*</em>

                                <input name="kode_inventaris" maxlength="255" required
                                    placeholder="Kode barang inventaris">

                            </label>


                            <label>

                                Nomor Register
                                <em>*</em>

                                <input name="nomor_register" maxlength="255" required placeholder="Nomor register aset">

                            </label>


                            <label>

                                Kondisi
                                <em>*</em>

                                <input name="kondisi" id="aemKondisi" data-aem-combo="kondisi" maxlength="100" required
                                    autocomplete="off" placeholder="Pilih kondisi">

                            </label>


                            <label>

                                Bahan

                                <input name="bahan" id="aemBahan" data-aem-combo="bahan" maxlength="255"
                                    placeholder="Cari atau ketik bahan">

                            </label>


                            <label>

                                Tahun Pengadaan
                                <em>*</em>

                                <input name="tahun" type="number" min="1900" max="2100" required
                                    placeholder="2026">

                            </label>


                            <label>

                                Jumlah (Unit)
                                <em>*</em>

                                <input name="jumlah_unit" type="number" min="1" required value="1">

                            </label>


                            <label>

                                Asal Perolehan

                                <input name="asal_perolehan" id="aemAsal" data-aem-combo="asal" maxlength="255"
                                    placeholder="Cari atau ketik asal perolehan">

                            </label>


                            <label class="aem-full">

                                Keterangan

                                <textarea name="keterangan" rows="4"
                                    placeholder="Kondisi, penggunaan, nomor berita acara, atau catatan inventaris"></textarea>

                            </label>

                        </div>

                    </fieldset>


                    {{-- ============================================
                     BAGIAN 3 — FOTO DAN DOKUMEN
                ============================================= --}}

                    <fieldset>

                        <legend>

                            <span>3</span>
                            Foto dan Dokumen Pendukung

                        </legend>


                        <div class="aem-fields">

                            <label>

                                Foto Utama

                                <input name="foto" type="file" accept="image/jpeg,image/png,image/webp">

                                <small>
                                    Opsional, maksimal 5 MB.
                                </small>

                            </label>


                            <label>

                                Lampiran Dokumen (Banyak File)

                                <input id="aemDocsInput" name="dokumens[]" type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp" multiple>

                                <small>

                                    PDF atau gambar. Bisa memilih
                                    file berkali-kali.

                                </small>

                            </label>


                            <div id="aemSelectedDocs" class="aem-full"></div>


                            <div id="aemSavedDocs" class="aem-full"></div>

                        </div>

                    </fieldset>

                </div>


                <footer class="aem-dialog-foot">

                    <button type="button" class="aem-btn outline" data-aem-close="aemFormDialog">
                        Batal
                    </button>


                    <button type="submit" class="aem-btn primary" id="aemSave">

                        <i data-lucide="save"></i>

                        Simpan Aset

                    </button>

                </footer>

            </form>

        </dialog>


        {{-- =====================================================
         MODAL DETAIL
    ====================================================== --}}

        <dialog id="aemDetailDialog" class="aem-dialog" aria-labelledby="aemDetailTitle">

            <header class="aem-dialog-head">

                <div>

                    <small>DETAIL K.I.B E</small>

                    <h2 id="aemDetailTitle">
                        Detail Inventaris
                    </h2>

                </div>


                <button type="button" class="aem-x" data-aem-close="aemDetailDialog" aria-label="Tutup detail">

                    <i data-lucide="x"></i>

                </button>

            </header>


            <div class="aem-dialog-body" id="aemDetailBody"></div>


            <footer class="aem-dialog-foot">

                <button type="button" class="aem-btn outline" data-aem-close="aemDetailDialog">
                    Tutup
                </button>


                <button type="button" class="aem-btn outline" id="aemEditDetail">

                    <i data-lucide="pencil"></i>

                    Edit

                </button>


                <button type="button" class="aem-btn danger" id="aemDeleteDetail">

                    <i data-lucide="trash-2"></i>

                    Hapus

                </button>

            </footer>

        </dialog>


        {{-- =====================================================
         MODAL KONFIRMASI DELETE
    ====================================================== --}}

        <dialog id="aemDeleteDialog" class="aem-dialog aem-confirm" aria-labelledby="aemDeleteTitle">

            <header class="aem-dialog-head">

                <div>

                    <small>
                        KONFIRMASI PENGHAPUSAN
                    </small>

                    <h2 id="aemDeleteTitle">
                        Hapus Aset?
                    </h2>

                </div>


                <button type="button" class="aem-x" data-aem-close="aemDeleteDialog" aria-label="Tutup">

                    <i data-lucide="x"></i>

                </button>

            </header>


            <div class="aem-confirm-content">

                <i data-lucide="triangle-alert"></i>

                <p>

                    Aset dan seluruh lampirannya
                    akan dihapus permanen:

                </p>

                <strong id="aemDeleteName"></strong>

                <small>

                    Arsip pada tabel lama tidak akan berubah.

                </small>

            </div>


            <footer class="aem-dialog-foot">

                <button type="button" class="aem-btn outline" data-aem-close="aemDeleteDialog">
                    Batal
                </button>


                <button type="button" id="aemConfirmDelete" class="aem-btn danger">
                    Ya, Hapus
                </button>

            </footer>

        </dialog>


        {{-- TOAST --}}

        <div id="aemToast" class="aem-toast" hidden role="status"></div>

    </section>


    {{-- =========================================================
     MASTER DATA DARI CONTROLLER
========================================================= --}}

    <script id="aemMaster" type="application/json">
@json($master)
</script>

    <script id="aemHistory" type="application/json">
@json($history)
</script>


    {{-- =========================================================
     JAVASCRIPT HALAMAN
========================================================= --}}

    <script
        src="{{ asset('js/pages/kib/aset_ttp.js') }}?v={{ file_exists(public_path('js/pages/kib/aset_ttp.js')) ? filemtime(public_path('js/pages/kib/aset_ttp.js')) : '1' }}">
    </script>

@endsection
