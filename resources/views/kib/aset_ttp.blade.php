
@extends('layouts.main')

@section('title', 'Aset Tetap Lainnya')

@section('content')

@php
    $viewMode = ($viewMode ?? 'manual') === 'arsip'
        ? 'arsip'
        : 'manual';

    $condLabel = fn ($v) => mb_convert_case(
        mb_strtolower((string) ($v ?? '')),
        MB_CASE_TITLE,
        'UTF-8'
    );
@endphp

<link
    rel="stylesheet"
    href="{{ asset('css/pages/kib/aset_ttp.css') }}?v={{ file_exists(public_path('css/pages/kib/aset_ttp.css')) ? filemtime(public_path('css/pages/kib/aset_ttp.css')) : '1' }}"
>

<section
    id="aemApp"
    class="aem-page"
    data-base="{{ url('/kib/aset_ttp') }}"
    data-group-url="{{ route('kib.aset_ttp.kelompok') }}"
    data-token="{{ csrf_token() }}"
>

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
                    </span> WITA
                </small>
            </div>
        </div>

        <h1>Aset Tetap Lainnya</h1>

        <p>
            Pengelolaan K.I.B E melalui pencatatan manual,
            inventaris per lokasi dan divisi, serta
            dokumen pendukung Perumda Tirta Kencana
            Kota Samarinda.
        </p>

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
         HALAMAN UTAMA
    ====================================================== --}}

    <section class="aem-panel" id="aemListPanel">

        <div class="aem-heading">

            <div>
                <h2>
                    {{ $viewMode === 'arsip'
                        ? 'Arsip Aset Tetap Lainnya'
                        : 'Daftar Aset Tetap Lainnya' }}
                </h2>

                <p>
                    {{ $viewMode === 'arsip'
                        ? 'Data historis K.I.B E lama, hanya dapat dibaca.'
                        : 'Klik Detail untuk membuka kelompok lokasi dan daftar barang.' }}
                </p>
            </div>

            <button
                class="aem-btn primary"
                type="button"
                id="aemAdd"
            >
                <i data-lucide="plus"></i>
                Tambah Aset
            </button>

        </div>


        {{-- TAB MANUAL DAN ARSIP --}}

        <nav class="aem-tabs" aria-label="Sumber Inventaris">

            <a
                href="{{ route('kib.aset_ttp') }}"
                class="{{ $viewMode === 'manual' ? 'active' : '' }}"
            >
                <i data-lucide="clipboard-list"></i>
                Data Manual ({{ $totalAset }})
            </a>

            <a
                href="{{ route('kib.aset_ttp', ['view' => 'arsip']) }}"
                class="{{ $viewMode === 'arsip' ? 'active' : '' }}"
            >
                <i data-lucide="archive"></i>
                Arsip Data Lama ({{ $archiveCount }})
            </a>

        </nav>


        {{-- FILTER --}}

        <form
            class="aem-toolbar"
            action="{{ route('kib.aset_ttp') }}"
            method="GET"
        >
            <input
                type="hidden"
                name="view"
                value="{{ $viewMode }}"
            >

            <label class="aem-search">
                <i data-lucide="search"></i>
                <input
                    name="q"
                    type="search"
                    value="{{ $search }}"
                    placeholder="Cari nama aset, kode, register, lokasi..."
                >
            </label>

            @if ($viewMode === 'manual')
                <select name="kondisi" aria-label="Filter Kondisi">
                    <option value="">Semua Kondisi</option>

                    @foreach ([
                        'BAIK' => 'Baik',
                        'CUKUP' => 'Cukup',
                        'RUSAK RINGAN' => 'Rusak Ringan',
                        'RUSAK BERAT' => 'Rusak Berat'
                    ] as $value => $label)

                        <option
                            value="{{ $value }}"
                            @selected($condition === $value)
                        >
                            {{ $label }}
                        </option>

                    @endforeach
                </select>
            @endif

            <button class="aem-btn primary" type="submit">
                <i data-lucide="filter"></i>
                Filter
            </button>

            <a
                class="aem-btn outline"
                href="{{ route(
                    'kib.aset_ttp',
                    $viewMode === 'arsip'
                        ? ['view' => 'arsip']
                        : []
                ) }}"
            >
                Reset
            </a>

        </form>


        {{-- NOTIFIKASI ARSIP --}}

        @if ($viewMode === 'arsip')

            <div class="aem-notice">
                <i data-lucide="lock-keyhole"></i>

                Data berasal dari tabel
                <code>kib_e_s</code>.
                Seluruh arsip hanya dapat dibaca.
            </div>

        @endif


        {{-- TABEL RINGKASAN --}}

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
                            <th class="aem-action-head">Aksi</th>
                        @else
                            <th>Asal</th>
                        @endif
                    </tr>
                </thead>

                <tbody>

                    @forelse ($items as $item)

                        <tr>

                            <td class="aem-center">
                                {{ $items->firstItem() + $loop->index }}
                            </td>

                            <td>
                                <strong class="aem-name">
                                    {{ $item->nama_aset ?: '—' }}
                                </strong>
                            </td>

                            <td>
                                <div class="aem-code">
                                    {{
                                        $viewMode === 'arsip'
                                            ? ($item->kode ?: '—')
                                            : ($item->kode_inventaris ?: '—')
                                    }}
                                </div>

                                <small>
                                    {{
                                        $viewMode === 'arsip'
                                            ? ($item->reg ?: '—')
                                            : ($item->nomor_register ?: '—')
                                    }}
                                </small>
                            </td>

                            <td class="aem-center">
                                {{ $item->tahun ?: '—' }}
                            </td>

                            <td class="aem-center">
                                {{
                                    number_format(
                                        (int) (
                                            $viewMode === 'arsip'
                                                ? $item->jumlah
                                                : $item->jumlah_unit
                                        ),
                                        0,
                                        ',',
                                        '.'
                                    )
                                }}
                            </td>

                            <td>
                                <span class="aem-condition">
                                    {{ $condLabel($item->kondisi) ?: '—' }}
                                </span>
                            </td>

                            <td>{{ $item->lokasi ?: '—' }}</td>

                            @if ($viewMode === 'manual')

                                <td class="aem-action-cell">

                                    <div class="aem-actions">

                                        {{-- DETAIL KELOMPOK --}}

                                        <button
                                            type="button"
                                            class="aem-action view"
                                            data-aem-action="group"
                                            data-id="{{ $item->id }}"
                                            data-location="{{ $item->lokasi }}"
                                            data-division="{{ $item->divisi }}"
                                            title="Detail Kelompok"
                                            aria-label="Buka Detail Kelompok"
                                        >
                                            <i data-lucide="folder-open"></i>
                                        </button>

                                        {{-- EDIT --}}

                                        <button
                                            type="button"
                                            class="aem-action edit"
                                            data-aem-action="edit"
                                            data-id="{{ $item->id }}"
                                            title="Edit Aset"
                                            aria-label="Edit Aset"
                                        >
                                            <i data-lucide="pencil"></i>
                                        </button>

                                        {{-- HAPUS --}}

                                        <button
                                            type="button"
                                            class="aem-action delete"
                                            data-aem-action="delete"
                                            data-id="{{ $item->id }}"
                                            data-name="{{ $item->nama_aset }}"
                                            title="Hapus Aset"
                                            aria-label="Hapus Aset"
                                        >
                                            <i data-lucide="trash-2"></i>
                                        </button>

                                    </div>

                                </td>

                            @else

                                <td>{{ $item->asal ?: '—' }}</td>

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

        <div class="aem-pagination">
            {{ $items->links() }}
        </div>

    </section>


    {{-- =====================================================
         HALAMAN DETAIL KELOMPOK
    ====================================================== --}}

    @if ($viewMode === 'manual')

    <section
        class="aem-group-page"
        id="aemGroupPanel"
        hidden
    >

        <div class="aem-group-top">

            <div>

                <nav
                    class="aem-group-breadcrumb"
                    aria-label="Posisi Halaman"
                >

                    <button
                        type="button"
                        id="aemBack"
                        class="aem-back-link"
                    >
                        <i data-lucide="arrow-left"></i>
                        Kembali ke Daftar
                    </button>

                    <i data-lucide="chevron-right"></i>

                    <span>Detail Kelompok Aset</span>

                </nav>

                <h2>Detail Kelompok Aset Tetap Lainnya</h2>

                <p>
                    Inventaris dikelompokkan dari catatan
                    lokasi dan divisi yang tersimpan.
                </p>

            </div>

        </div>


        <div class="aem-group-layout">

            {{-- PANEL KIRI --}}

            <aside
                class="aem-group-left"
                aria-label="Kelompok Inventaris"
            >

                <div class="aem-group-side-head">
                    <i data-lucide="folder-tree"></i>
                    <strong>Lokasi & Divisi</strong>
                </div>

                <label class="aem-group-search">

                    <i data-lucide="search"></i>

                    <input
                        id="aemGroupSearch"
                        type="search"
                        placeholder="Cari lokasi atau divisi..."
                        autocomplete="off"
                    >

                </label>

                <div
                    id="aemGroupList"
                    class="aem-group-list"
                    aria-live="polite"
                ></div>

            </aside>


            {{-- PANEL KANAN --}}

            <div class="aem-group-right">

                <div class="aem-group-heading">

                    <div>

                        <small>
                            DAFTAR BARANG PADA KELOMPOK
                        </small>

                        <h3 id="aemGroupTitle">
                            Pilih Kelompok di Panel Kiri
                        </h3>

                        <p id="aemGroupSubtitle">—</p>

                    </div>

                    <span
                        id="aemGroupCount"
                        class="aem-group-count"
                    >
                        0 barang
                    </span>

                </div>


                <div class="aem-group-toolbar">

                    <label class="aem-group-search">

                        <i data-lucide="search"></i>

                        <input
                            id="aemGroupItemSearch"
                            type="search"
                            placeholder="Cari nama, kode, register..."
                            autocomplete="off"
                        >

                    </label>

                    <button
                        type="button"
                        class="aem-btn outline"
                        id="aemGroupRefresh"
                    >
                        <i data-lucide="refresh-cw"></i>
                        Reset Cari
                    </button>

                </div>


                <div
                    id="aemGroupAlert"
                    class="aem-group-alert"
                    hidden
                ></div>


                <div class="aem-table-wrap">

                    <table class="aem-table aem-group-table">

                        <thead>

                            <tr>
                                <th>No.</th>
                                <th>Nama Aset</th>
                                <th>Kode</th>
                                <th>Registrasi</th>
                                <th>Foto</th>
                                <th>Aksi</th>
                            </tr>

                        </thead>

                        <tbody id="aemGroupRows">

                            <tr>
                                <td
                                    colspan="6"
                                    class="aem-empty"
                                >
                                    Pilih kelompok di panel kiri.
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>


                <div class="aem-group-pagination">

                    <span id="aemGroupInfo">
                        0 data
                    </span>

                    <div>

                        <button
                            type="button"
                            id="aemGroupPrev"
                            class="aem-btn outline"
                        >
                            Sebelumnya
                        </button>

                        <span id="aemGroupPage">
                            1 / 1
                        </span>

                        <button
                            type="button"
                            id="aemGroupNext"
                            class="aem-btn outline"
                        >
                            Berikutnya
                        </button>

                    </div>

                </div>

            </div>

        </div>

    </section>

    @endif


    {{-- =====================================================
         MODAL TAMBAH / EDIT
    ====================================================== --}}

    <dialog
        id="aemFormDialog"
        class="aem-dialog"
        aria-labelledby="aemFormTitle"
    >

        <form
            id="aemForm"
            enctype="multipart/form-data"
            novalidate
        >
            @csrf

            <header class="aem-dialog-head">

                <div>

                    <small>FORM K.I.B E — INPUT MANUAL</small>

                    <h2 id="aemFormTitle">
                        Tambah Aset Tetap Lainnya
                    </h2>

                    <p>
                        Masukkan inventaris sesuai kondisi fisik
                        dan dokumen yang tersedia.
                    </p>

                </div>

                <button
                    type="button"
                    class="aem-x"
                    data-aem-close="aemFormDialog"
                    aria-label="Tutup Form"
                >
                    <i data-lucide="x"></i>
                </button>

            </header>


            <div class="aem-dialog-body">

                <div
                    class="aem-error"
                    id="aemError"
                    role="alert"
                    hidden
                ></div>


                {{-- BAGIAN 1 --}}

                <fieldset>

                    <legend>
                        <span>1</span>
                        Lokasi dan Organisasi
                    </legend>

                    <div class="aem-fields">

                        <label>
                            Lokasi / Unit Kerja <em>*</em>

                            <input
                                name="lokasi"
                                id="aemLokasi"
                                data-aem-combo="lokasi"
                                required
                                maxlength="500"
                                autocomplete="off"
                                placeholder="Cari atau ketik lokasi"
                            >
                        </label>

                        <label>
                            Alamat Lokasi

                            <input
                                name="alamat"
                                id="aemAlamat"
                                maxlength="500"
                                placeholder="Alamat lengkap"
                            >
                        </label>

                        <label>
                            Departemen

                            <input
                                name="departemen"
                                id="aemDep"
                                data-aem-combo="departemen"
                                maxlength="255"
                                autocomplete="off"
                                placeholder="Cari atau ketik departemen"
                            >
                        </label>

                        <label>
                            Divisi

                            <input
                                name="divisi"
                                id="aemDiv"
                                data-aem-combo="divisi"
                                maxlength="255"
                                autocomplete="off"
                                placeholder="Cari atau ketik divisi"
                            >
                        </label>

                    </div>

                </fieldset>


                {{-- BAGIAN 2 --}}

                <fieldset>

                    <legend>
                        <span>2</span>
                        Identitas Inventaris
                    </legend>

                    <div class="aem-fields">

                        <label class="aem-full">
                            Nama Barang / Jenis Aset <em>*</em>

                            <input
                                name="nama_aset"
                                id="aemNama"
                                maxlength="500"
                                required
                                placeholder="Nama aset yang dicatat"
                            >
                        </label>

                        <label>
                            Kode Inventaris (Manual) <em>*</em>

                            <input
                                name="kode_inventaris"
                                maxlength="255"
                                required
                                placeholder="Ketik kode catatan sendiri"
                            >
                        </label>

                        <label>
                            Nomor Register <em>*</em>

                            <input
                                name="nomor_register"
                                maxlength="255"
                                required
                                placeholder="Nomor register"
                            >
                        </label>

                        <label>
                            Kondisi <em>*</em>

                            <input
                                name="kondisi"
                                id="aemKondisi"
                                data-aem-combo="kondisi"
                                maxlength="100"
                                required
                                placeholder="Pilih kondisi"
                            >
                        </label>

                        <label>
                            Bahan

                            <input
                                name="bahan"
                                id="aemBahan"
                                data-aem-combo="bahan"
                                maxlength="255"
                                autocomplete="off"
                                placeholder="Cari atau ketik bahan"
                            >
                        </label>

                        <label>
                            Tahun Pengadaan <em>*</em>

                            <input
                                name="tahun"
                                type="number"
                                min="1900"
                                max="2100"
                                required
                                placeholder="2026"
                            >
                        </label>

                        <label>
                            Jumlah Unit <em>*</em>

                            <input
                                name="jumlah_unit"
                                type="number"
                                min="1"
                                required
                                value="1"
                            >
                        </label>

                        <label>
                            Asal Perolehan

                            <input
                                name="asal_perolehan"
                                id="aemAsal"
                                data-aem-combo="asal"
                                maxlength="255"
                                autocomplete="off"
                                placeholder="Cari atau ketik asal perolehan"
                            >
                        </label>

                        <label class="aem-full">
                            Keterangan

                            <textarea
                                name="keterangan"
                                rows="4"
                                placeholder="Catatan, berita acara, atau informasi inventaris"
                            ></textarea>
                        </label>

                    </div>

                </fieldset>


                {{-- BAGIAN 3 --}}

                <fieldset>

                    <legend>
                        <span>3</span>
                        Foto dan Dokumen Pendukung
                    </legend>

                    <div class="aem-fields">

                        <label>
                            Foto Utama

                            <input
                                name="foto"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                            >

                            <small>
                                Opsional. Maksimal 5 MB.
                            </small>
                        </label>

                        <label>
                            Lampiran Dokumen

                            <input
                                id="aemDocsInput"
                                name="dokumens[]"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                multiple
                            >

                            <small>
                                Pilih banyak PDF atau gambar.
                            </small>
                        </label>

                        <div
                            id="aemSelectedDocs"
                            class="aem-full"
                        ></div>

                        <div
                            id="aemSavedDocs"
                            class="aem-full"
                        ></div>

                    </div>

                </fieldset>

            </div>


            <footer class="aem-dialog-foot">

                <button
                    type="button"
                    class="aem-btn outline"
                    data-aem-close="aemFormDialog"
                >
                    Batal
                </button>

                <button
                    type="submit"
                    class="aem-btn primary"
                    id="aemSave"
                >
                    <i data-lucide="save"></i>
                    Simpan Aset
                </button>

            </footer>

        </form>

    </dialog>


    {{-- =====================================================
         MODAL VIEW BARANG
    ====================================================== --}}

    <dialog
        id="aemDetailDialog"
        class="aem-dialog"
        aria-labelledby="aemDetailTitle"
    >

        <header class="aem-dialog-head">

            <div>
                <small>DETAIL BARANG K.I.B E</small>
                <h2 id="aemDetailTitle">
                    Detail Inventaris
                </h2>
            </div>

            <button
                type="button"
                class="aem-x"
                data-aem-close="aemDetailDialog"
                aria-label="Tutup Detail"
            >
                <i data-lucide="x"></i>
            </button>

        </header>

        <div
            class="aem-dialog-body"
            id="aemDetailBody"
        ></div>

        <footer class="aem-dialog-foot">

            <button
                type="button"
                class="aem-btn outline"
                data-aem-close="aemDetailDialog"
            >
                Tutup
            </button>

            <button
                type="button"
                class="aem-btn outline"
                id="aemEditDetail"
            >
                <i data-lucide="pencil"></i>
                Edit
            </button>

            <button
                type="button"
                class="aem-btn danger"
                id="aemDeleteDetail"
            >
                <i data-lucide="trash-2"></i>
                Hapus
            </button>

        </footer>

    </dialog>


    {{-- =====================================================
         KONFIRMASI HAPUS
    ====================================================== --}}

    <dialog
        id="aemDeleteDialog"
        class="aem-dialog aem-confirm"
        aria-labelledby="aemDeleteTitle"
    >

        <header class="aem-dialog-head">

            <div>
                <small>KONFIRMASI PENGHAPUSAN</small>

                <h2 id="aemDeleteTitle">
                    Hapus Aset?
                </h2>
            </div>

            <button
                type="button"
                class="aem-x"
                data-aem-close="aemDeleteDialog"
                aria-label="Tutup"
            >
                <i data-lucide="x"></i>
            </button>

        </header>

        <div class="aem-confirm-content">

            <i data-lucide="triangle-alert"></i>

            <p>
                Aset beserta lampirannya akan dihapus:
            </p>

            <strong id="aemDeleteName"></strong>

            <small>
                Data arsip lama tidak ikut dihapus.
            </small>

        </div>

        <footer class="aem-dialog-foot">

            <button
                type="button"
                class="aem-btn outline"
                data-aem-close="aemDeleteDialog"
            >
                Batal
            </button>

            <button
                type="button"
                id="aemConfirmDelete"
                class="aem-btn danger"
            >
                Ya, Hapus
            </button>

        </footer>

    </dialog>


    <div
        id="aemToast"
        class="aem-toast"
        role="status"
        hidden
    ></div>

</section>


{{-- DATA MASTER DAN RIWAYAT MANUAL --}}

<script id="aemMaster" type="application/json">
@json($master)
</script>

<script id="aemHistory" type="application/json">
@json($history)
</script>


{{-- JAVASCRIPT --}}

<script
    src="{{ asset('js/pages/kib/aset_ttp.js') }}?v={{ file_exists(public_path('js/pages/kib/aset_ttp.js')) ? filemtime(public_path('js/pages/kib/aset_ttp.js')) : '1' }}"
></script>

@endsection
