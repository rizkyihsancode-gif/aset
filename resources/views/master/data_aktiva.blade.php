
@extends('layouts.main')

@section('title', 'Kode Aktiva')

@push('styles')
<link
    rel="stylesheet"
    href="{{ asset('css/pages/master/kode_aktiva.css') }}?v={{ file_exists(public_path('css/pages/master/kode_aktiva.css')) ? filemtime(public_path('css/pages/master/kode_aktiva.css')) : '1' }}"
>
@endpush

@section('content')

@php
    $aktivaRows = collect($aktivas ?? []);
    $activityRows = collect($aktivaActivityLogs ?? []);

    $totalAktivaValue = (int) (
        $totalAktiva ?? $aktivaRows->count()
    );

    $deltaValue = (int) ($aktivaDelta ?? 0);
@endphp

<section class="content aktiva-page">

    {{-- ===========================================
         HEADER / HERO
    =========================================== --}}

    <section class="aktiva-hero">

        <div class="aktiva-hero-overlay"></div>

        <div class="aktiva-hero-top">

            <div>

                <nav class="aktiva-breadcrumb" aria-label="Breadcrumb">

                    <a
                        href="{{ route('dashboard') }}"
                        aria-label="Dashboard"
                    >
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>

                    <span>Master Data</span>

                    <i data-lucide="chevron-right"></i>

                    <strong>Kode Aktiva</strong>

                </nav>

                <h1>Kode Aktiva</h1>

                <p>
                    Kelola klasifikasi dan kode aktiva
                    Perumda Tirta Kencana Kota Samarinda.
                </p>

            </div>

            <div class="aktiva-date-card">

                <i data-lucide="calendar-days"></i>

                <div>

                    <strong id="aktivaDate">—</strong>

                    <span id="aktivaTime">—</span>

                </div>

            </div>

        </div>

        {{-- =======================================
             KPI
        ======================================= --}}

        <div class="aktiva-kpi-grid">

            <button
                type="button"
                class="aktiva-kpi-card clickable"
                id="aktivaHistoryButton"
                title="Lihat riwayat Kode Aktiva"
            >

                <span class="aktiva-kpi-icon">
                    <i data-lucide="barcode"></i>
                </span>

                <div>

                    <small>Total Kode Aktiva</small>

                    <div class="aktiva-total-line">

                        <strong>
                            {{ number_format($totalAktivaValue, 0, ',', '.') }}
                        </strong>

                        <span class="{{ $deltaValue < 0 ? 'negative' : 'positive' }}">

                            {{ $deltaValue > 0
                                ? '↑ +' . $deltaValue
                                : (
                                    $deltaValue < 0
                                        ? '↓ ' . $deltaValue
                                        : '— 0'
                                )
                            }}

                        </span>

                    </div>

                    <p>perubahan tercatat</p>

                </div>

            </button>

            <article class="aktiva-kpi-card">

                <span class="aktiva-kpi-icon">
                    <i data-lucide="layers-3"></i>
                </span>

                <div>

                    <small>Golongan Aktiva</small>

                    <strong>
                        {{ number_format($totalGolongan ?? 0, 0, ',', '.') }}
                    </strong>

                    <p>golongan terdaftar</p>

                </div>

            </article>

            <article class="aktiva-kpi-card">

                <span class="aktiva-kpi-icon">
                    <i data-lucide="boxes"></i>
                </span>

                <div>

                    <small>Kategori / KIB</small>

                    <strong>
                        {{ number_format($totalKib ?? 0, 0, ',', '.') }}
                    </strong>

                    <p>kategori aktiva</p>

                </div>

            </article>

        </div>

    </section>

    {{-- ===========================================
         SEARCH DAN FILTER
    =========================================== --}}

    <section class="aktiva-card aktiva-filter-card">

        <header class="aktiva-filter-header">

            <div>

                <h2>Daftar Kode Aktiva</h2>

                <p>
                    Data langsung dari tabel
                    <strong>aktivas</strong>.
                </p>

            </div>

            <button
                type="button"
                class="aktiva-primary-button"
                id="addAktivaButton"
            >

                <i data-lucide="plus"></i>

                Tambah Kode Aktiva

            </button>

        </header>

        <div class="aktiva-filter-grid">

            {{-- SEARCH --}}

            <label class="aktiva-search" for="aktivaSearch">

                <i data-lucide="search"></i>

                <input
                    type="search"
                    id="aktivaSearch"
                    autocomplete="off"
                    placeholder="Cari kode, nama, golongan, atau KIB..."
                >

            </label>

            {{-- FILTER GOLONGAN --}}

            <select
                id="aktivaGolFilter"
                aria-label="Filter Golongan Aktiva"
            >

                <option value="">Semua Golongan</option>

                @foreach ($golonganAktiva ?? [] as $gol)

                    <option value="{{ $gol }}">
                        {{ $gol }}
                    </option>

                @endforeach

            </select>

            {{-- FILTER KATEGORI / KIB --}}

            <select
                id="aktivaKibFilter"
                aria-label="Filter Kategori atau KIB"
            >

                <option value="">Semua Kategori / KIB</option>

                @foreach ($kibAktiva ?? [] as $kib)

                    <option value="{{ $kib }}">
                        {{ $kib }}
                    </option>

                @endforeach

            </select>

            {{-- RESET --}}

            <button
                type="button"
                class="aktiva-outline-button"
                id="resetAktivaButton"
            >

                <i data-lucide="refresh-cw"></i>
                Reset

            </button>

            {{-- EXPORT --}}

            <button
                type="button"
                class="aktiva-outline-button"
                id="exportAktivaButton"
            >

                <i data-lucide="download"></i>
                Export

            </button>

        </div>

    </section>

    {{-- ===========================================
         TABEL KODE AKTIVA
    =========================================== --}}

    <section class="aktiva-card aktiva-table-card">

        <div class="table-responsive">

            <table class="aktiva-table" id="aktivaTable">

                <colgroup>
                    <col class="col-no">
                    <col class="col-kode">
                    <col class="col-nama">
                    <col class="col-golongan">
                    <col class="col-kib">
                    <col class="col-dibuat">
                    <col class="col-action">
                </colgroup>

                <thead>

                    <tr>
                        <th>No.</th>
                        <th>Kode Aktiva</th>
                        <th>Nama Aktiva</th>
                        <th>Golongan Aktiva</th>
                        <th>Kategori / KIB</th>
                        <th>Dibuat</th>
                        <th>Aksi</th>
                    </tr>

                </thead>

                <tbody>

                    @foreach ($aktivaRows as $item)

                        <tr
                            data-row
                            data-id="{{ $item->id }}"
                            data-kode="{{ $item->kode ?? '' }}"
                            data-aktiva="{{ $item->aktiva ?? '' }}"
                            data-gol="{{ $item->gol ?? '' }}"
                            data-kib="{{ $item->kib ?? '' }}"
                            data-created-at="{{ $item->created_at ?? '' }}"
                        >

                            {{-- NOMOR --}}

                            <td class="aktiva-number">
                                —
                            </td>

                            {{-- KODE --}}

                            <td>

                                <span class="aktiva-code">
                                    {{ $item->kode ?: '—' }}
                                </span>

                            </td>

                            {{-- NAMA --}}

                            <td>

                                <strong class="aktiva-name">
                                    {{ $item->aktiva ?: '—' }}
                                </strong>

                            </td>

                            {{-- GOLONGAN --}}

                            <td>

                                <span class="aktiva-badge">
                                    {{ $item->gol ?: '—' }}
                                </span>

                            </td>

                            {{-- KATEGORI --}}

                            <td>
                                {{ $item->kib ?: '—' }}
                            </td>

                            {{-- TANGGAL --}}

                            <td>

                                @if (!empty($item->created_at))

                                    {{ \Carbon\Carbon::parse(
                                        $item->created_at
                                    )->locale('id')->translatedFormat('d M Y') }}

                                @else

                                    <span class="aktiva-muted">
                                        —
                                    </span>

                                @endif

                            </td>

                            {{-- AKSI --}}

                            <td>

                                <div class="aktiva-actions">

                                    <button
                                        type="button"
                                        class="view"
                                        data-action="view"
                                        aria-label="Detail {{ $item->aktiva }}"
                                        title="Lihat"
                                    >
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="edit"
                                        data-action="edit"
                                        aria-label="Edit {{ $item->aktiva }}"
                                        title="Edit"
                                    >
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="delete"
                                        data-action="delete"
                                        aria-label="Hapus {{ $item->aktiva }}"
                                        title="Hapus"
                                    >
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>

                    @endforeach

                    {{-- EMPTY STATE --}}

                    <tr id="aktivaEmptyRow" hidden>

                        <td colspan="7" class="aktiva-empty">
                            Data Kode Aktiva tidak ditemukan.
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

        {{-- =======================================
             PAGINATION
        ======================================= --}}

        <footer class="aktiva-table-footer">

            <span id="aktivaTableInfo">
                Menampilkan data...
            </span>

            <div class="aktiva-pagination-wrap">

                <select
                    id="aktivaPageSize"
                    aria-label="Jumlah data per halaman"
                >

                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>

                </select>

                <span>data per halaman</span>

                <nav
                    id="aktivaPagination"
                    class="aktiva-pagination"
                    aria-label="Navigasi halaman Kode Aktiva"
                ></nav>

            </div>

        </footer>

    </section>

    {{-- ===========================================
         MODAL TAMBAH / DETAIL / EDIT / HAPUS
    =========================================== --}}

    <dialog
        class="aktiva-modal"
        id="aktivaModal"
        aria-labelledby="aktivaModalTitle"
    >

        <div class="aktiva-modal-box">

            <header>

                <div>

                    <span>MASTER DATA</span>

                    <h3 id="aktivaModalTitle">
                        Tambah Kode Aktiva
                    </h3>

                    <p id="aktivaModalDescription">
                        Tambahkan klasifikasi aktiva baru.
                    </p>

                </div>

                <button
                    type="button"
                    id="closeAktivaModal"
                    aria-label="Tutup modal"
                >
                    <i data-lucide="x"></i>
                </button>

            </header>

            <form
                id="aktivaForm"
                method="POST"
                novalidate
            >

                @csrf

                <div class="aktiva-modal-body">

                    <div
                        id="aktivaFormAlert"
                        class="aktiva-form-alert"
                        role="alert"
                        hidden
                    ></div>

                    <div class="aktiva-form-grid">

                        {{-- KODE --}}

                        <div class="aktiva-field">

                            <label for="aktivaKode">
                                Kode Aktiva <em>*</em>
                            </label>

                            <input
                                type="text"
                                id="aktivaKode"
                                name="kode"
                                maxlength="255"
                                required
                                autocomplete="off"
                                placeholder="Contoh: 31.03.20"
                            >

                            <small data-error="kode"></small>

                        </div>

                        {{-- NAMA --}}

                        <div class="aktiva-field">

                            <label for="aktivaName">
                                Nama Aktiva <em>*</em>
                            </label>

                            <input
                                type="text"
                                id="aktivaName"
                                name="aktiva"
                                maxlength="255"
                                required
                                autocomplete="off"
                                placeholder="Contoh: Pembangkit Tenaga Listrik"
                            >

                            <small data-error="aktiva"></small>

                        </div>

                        {{-- GOLONGAN --}}

                        <div class="aktiva-field">

                            <label for="aktivaGol">
                                Golongan Aktiva
                            </label>

                            <input
                                type="text"
                                id="aktivaGol"
                                name="gol"
                                maxlength="255"
                                list="golonganAktivaList"
                                autocomplete="off"
                                placeholder="Contoh: INSTALASI POMPA"
                            >

                            <datalist id="golonganAktivaList">

                                @foreach ($golonganAktiva ?? [] as $gol)

                                    <option value="{{ $gol }}"></option>

                                @endforeach

                            </datalist>

                            <small data-error="gol"></small>

                        </div>

                        {{-- KATEGORI --}}

                        <div class="aktiva-field">

                            <label for="aktivaKib">
                                Kategori / KIB
                            </label>

                            <input
                                type="text"
                                id="aktivaKib"
                                name="kib"
                                maxlength="255"
                                list="kibAktivaList"
                                autocomplete="off"
                                placeholder="Contoh: KIB B - PERALATAN DAN MESIN"
                            >

                            <datalist id="kibAktivaList">

                                @foreach ($kibAktiva ?? [] as $kib)

                                    <option value="{{ $kib }}"></option>

                                @endforeach

                            </datalist>

                            <small data-error="kib"></small>

                        </div>

                    </div>

                    <p class="aktiva-modal-note">
                        Kolom bertanda * wajib diisi.
                        Kode dan nama aktiva dicatat sesuai klasifikasi aset perusahaan.
                    </p>

                </div>

                <footer>

                    <button
                        type="button"
                        class="aktiva-cancel-button"
                        id="cancelAktivaButton"
                    >
                        Tutup
                    </button>

                    <button
                        type="submit"
                        class="aktiva-save-button"
                        id="saveAktivaButton"
                    >

                        <i data-lucide="save"></i>

                        <span>Simpan Kode Aktiva</span>

                    </button>

                </footer>

            </form>

        </div>

    </dialog>

    {{-- ===========================================
         MODAL RIWAYAT AKTIVITAS
    =========================================== --}}

    <dialog
        class="aktiva-modal"
        id="aktivaHistoryModal"
        aria-labelledby="aktivaHistoryTitle"
    >

        <div class="aktiva-modal-box history">

            <header>

                <div>

                    <span>AKTIVITAS MASTER DATA</span>

                    <h3 id="aktivaHistoryTitle">
                        Riwayat Perubahan Kode Aktiva
                    </h3>

                    <p>
                        Penambahan dan penghapusan data Kode Aktiva.
                    </p>

                </div>

                <button
                    type="button"
                    id="closeAktivaHistory"
                    aria-label="Tutup riwayat"
                >
                    <i data-lucide="x"></i>
                </button>

            </header>

            <div class="aktiva-modal-body">

                <div class="aktiva-history-summary">

                    <article>

                        <span>Ditambahkan</span>

                        <strong class="green">
                            ↑ {{ $aktivaTambah ?? 0 }}
                        </strong>

                    </article>

                    <article>

                        <span>Dihapus</span>

                        <strong class="red">
                            ↓ {{ $aktivaHapus ?? 0 }}
                        </strong>

                    </article>

                    <article>

                        <span>Perubahan Bersih</span>

                        <strong>
                            {{ $deltaValue > 0 ? '+' : '' }}{{ $deltaValue }}
                        </strong>

                    </article>

                </div>

                <div class="table-responsive">

                    <table class="aktiva-history-table">

                        <thead>

                            <tr>
                                <th>No.</th>
                                <th>Nama Aktiva</th>
                                <th>Status</th>
                                <th>Waktu</th>
                            </tr>

                        </thead>

                        <tbody>

                            @forelse ($activityRows as $index => $log)

                                <tr>

                                    <td>{{ $index + 1 }}</td>

                                    <td>
                                        {{ $log->record_name ?? '—' }}
                                    </td>

                                    <td>

                                        @if (($log->action ?? '') === 'created')

                                            <span class="history-badge created">
                                                Ditambahkan
                                            </span>

                                        @else

                                            <span class="history-badge deleted">
                                                Dihapus
                                            </span>

                                        @endif

                                    </td>

                                    <td>

                                        @if (!empty($log->created_at))

                                            {{ \Carbon\Carbon::parse(
                                                $log->created_at
                                            )->locale('id')->translatedFormat('d M Y, H:i') }}

                                        @else

                                            —

                                        @endif

                                    </td>

                                </tr>

                            @empty

                                <tr>

                                    <td colspan="4" class="aktiva-empty">
                                        Belum ada riwayat perubahan.
                                    </td>

                                </tr>

                            @endforelse

                        </tbody>

                    </table>

                </div>

            </div>

            <footer class="aktiva-history-footer">

                <button
                    type="button"
                    class="aktiva-cancel-button"
                    onclick="document.getElementById('aktivaHistoryModal').close()"
                >
                    Tutup
                </button>

            </footer>

        </div>

    </dialog>

    {{-- ===========================================
         TOAST NOTIFIKASI
    =========================================== --}}

    <div
        class="aktiva-toast"
        id="aktivaToast"
        role="status"
        aria-live="polite"
        hidden
    >

        <i data-lucide="circle-check"></i>

        <div>

            <strong id="aktivaToastTitle">
                Berhasil
            </strong>

            <span id="aktivaToastMessage"></span>

        </div>

    </div>

</section>

@endsection

@push('scripts')

<script>
    window.AKTIVA_CRUD = {
        store: @json(route('master.data_aktiva.store')),
        update: @json(url('/master-data/kode-aktiva/__ID__')),
        destroy: @json(url('/master-data/kode-aktiva/__ID__'))
    };
</script>

<script
    src="{{ asset('js/pages/master/kode_aktiva.js') }}?v={{ file_exists(public_path('js/pages/master/kode_aktiva.js')) ? filemtime(public_path('js/pages/master/kode_aktiva.js')) : '1' }}"
></script>

@endpush
