@extends('layouts.main')

@section('title', 'Divisi')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/divisi.css') }}">
@endpush


@section('content')

    <section class="content divisi-page">


        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="divisi-hero">

            <div class="divisi-hero-overlay"></div>


            <div class="divisi-hero-content">


                {{-- ========================================================
                 HERO TOP
            ========================================================= --}}
                <div class="divisi-hero-top">


                    <div>


                        {{-- BREADCRUMB --}}
                        <nav class="divisi-breadcrumb" aria-label="Breadcrumb">

                            <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                                <i data-lucide="house"></i>
                            </a>


                            <i data-lucide="chevron-right"></i>


                            <span>
                                Master Data
                            </span>


                            <i data-lucide="chevron-right"></i>


                            <strong>
                                Divisi
                            </strong>

                        </nav>



                        {{-- TITLE --}}
                        <div class="divisi-heading">

                            <h1>
                                Divisi
                            </h1>

                            <p>
                                Kelola data divisi yang terhubung dengan departemen
                                pada sistem aset perusahaan.
                            </p>

                        </div>


                    </div>



                    {{-- DATE --}}
                    <div class="divisi-date-card">

                        <div class="divisi-date-icon">

                            <i data-lucide="calendar-days"></i>

                        </div>


                        <div>

                            <strong id="divisiCurrentDate">
                                -
                            </strong>

                            <span id="divisiCurrentTime">
                                -
                            </span>

                        </div>

                    </div>


                </div>



                {{-- ========================================================
                 KPI
            ========================================================= --}}
                <div class="divisi-kpi-grid">


                    {{-- TOTAL DIVISI --}}
                    <div class="divisi-kpi-card divisi-kpi-clickable" id="divisiTotalActivityCard" role="button"
                        tabindex="0" title="Klik untuk melihat riwayat perubahan Divisi">

                        <div class="divisi-kpi-icon">

                            <i data-lucide="layers-3"></i>

                        </div>


                        <div class="divisi-kpi-content">

                            <span>
                                Total Divisi
                            </span>


                            <div class="divisi-kpi-value">

                                <strong>

                                    {{ number_format($totalDivisi, 0, ',', '.') }}

                                </strong>


                                @if ($divisiDelta > 0)
                                    <small class="divisi-delta divisi-delta-up">

                                        <i data-lucide="arrow-up"></i>

                                        +{{ $divisiDelta }}

                                    </small>
                                @elseif ($divisiDelta < 0)
                                    <small class="divisi-delta divisi-delta-down">

                                        <i data-lucide="arrow-down"></i>

                                        {{ $divisiDelta }}

                                    </small>
                                @else
                                    <small class="divisi-delta divisi-delta-neutral">

                                        <i data-lucide="minus"></i>

                                        0

                                    </small>
                                @endif

                            </div>


                            <p>
                                perubahan tercatat
                            </p>

                        </div>


                        <div class="divisi-sparkline">

                            <svg viewBox="0 0 100 45">

                                <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />

                            </svg>

                        </div>

                    </div>



                    {{-- TOTAL DEPARTEMEN --}}
                    <div class="divisi-kpi-card">

                        <div class="divisi-kpi-icon">

                            <i data-lucide="building-2"></i>

                        </div>


                        <div class="divisi-kpi-content">

                            <span>
                                Total Departemen
                            </span>


                            <strong>

                                {{ number_format($totalDepartemen, 0, ',', '.') }}

                            </strong>


                            <p>
                                departemen terhubung
                            </p>

                        </div>


                        <div class="divisi-kpi-watermark">

                            <i data-lucide="chart-no-axes-column-increasing"></i>

                        </div>

                    </div>



                    {{-- UPDATE TERAKHIR --}}
                    <div class="divisi-kpi-card">

                        <div class="divisi-kpi-icon">

                            <i data-lucide="clock-3"></i>

                        </div>


                        <div class="divisi-kpi-content">

                            <span>
                                Update Terakhir
                            </span>


                            <strong class="divisi-kpi-text">

                                {{ $updateTerakhirLabel }}

                            </strong>


                            <p>

                                {{ $updateTerakhirDetail }}

                            </p>

                        </div>


                        <div class="divisi-kpi-watermark">

                            <i data-lucide="calendar-days"></i>

                        </div>

                    </div>


                </div>


            </div>

        </section>



        {{-- ============================================================
         FILTER
    ============================================================= --}}
        <section class="divisi-card divisi-filter-card">


            <div class="divisi-filter-header">

                <h3>
                    Filter Data Divisi
                </h3>


                <button type="button" class="divisi-add-button" onclick="openDivisiModal()">

                    <i data-lucide="plus"></i>

                    Tambah Divisi

                </button>

            </div>



            <div class="divisi-filter-grid">


                {{-- SEARCH --}}
                <div class="divisi-search">

                    <i data-lucide="search"></i>


                    <input type="search" id="divisiSearch" placeholder="Cari nama divisi atau kode divisi..."
                        autocomplete="off">

                </div>



                {{-- DEPARTEMEN --}}
                <div class="divisi-select-group">

                    <label for="divisiDepartment">
                        Departemen
                    </label>


                    <select id="divisiDepartment">

                        <option value="">
                            Semua Departemen
                        </option>


                        @foreach ($departemens as $departemen)
                            <option value="{{ $departemen->id }}">

                                {{ $departemen->kode_dep }}

                            </option>
                        @endforeach

                    </select>

                </div>



                {{-- FILTER BUTTON --}}
                <button type="button" class="divisi-filter-button" onclick="filterDivisiTable()">

                    <i data-lucide="list-filter"></i>

                    Filter

                </button>



                {{-- RESET --}}
                <button type="button" class="divisi-reset-button" onclick="resetDivisiFilter()">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>



                {{-- EXPORT --}}
                <button type="button" class="divisi-export-button" onclick="exportDivisiCSV()">

                    <i data-lucide="download"></i>

                    Ekspor

                    <i data-lucide="chevron-down"></i>

                </button>


            </div>

        </section>



        {{-- ============================================================
         TABLE
    ============================================================= --}}
        <section class="divisi-card divisi-table-card">


            <div class="divisi-table-header">

                <div>

                    <h3>
                        Daftar Divisi
                    </h3>

                    <span>
                        Data langsung dari database
                    </span>

                </div>

            </div>



            <div class="table-responsive">

                <table class="divisi-table" id="divisiTable">


                    <thead>

                        <tr>

                            <th class="divisi-col-no">
                                No
                            </th>

                            <th>
                                Nama Divisi
                            </th>

                            <th>
                                Kode Divisi
                            </th>

                            <th>
                                Departemen
                            </th>

                            <th class="divisi-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>



                    <tbody>


                        @forelse ($divisis as $item)
                            <tr data-record data-id="{{ $item->id }}" data-id-dep="{{ $item->id_dep }}"
                                data-nama="{{ $item->nama_div }}" data-kode="{{ $item->kode_div }}"
                                data-departemen="{{ $item->nama_departemen }}"
                                data-created-at="{{ $item->created_at ?? '' }}"
                                data-updated-at="{{ $item->updated_at ?? '' }}">


                                {{-- NO --}}
                                <td class="divisi-number"></td>



                                {{-- NAMA --}}
                                <td>

                                    <strong class="divisi-name">

                                        {{ $item->nama_div ?: '—' }}

                                    </strong>

                                </td>



                                {{-- KODE --}}
                                <td>

                                    <span class="divisi-code">

                                        {{ $item->kode_div ?: '—' }}

                                    </span>

                                </td>



                                {{-- DEPARTEMEN --}}
                                <td>

                                    <div class="divisi-department-cell">

                                        <div class="divisi-department-icon">

                                            <i data-lucide="building-2"></i>

                                        </div>


                                        <div>

                                            <strong>

                                                {{ $item->nama_departemen ?: '—' }}

                                            </strong>


                                            @if (!empty($item->kode_departemen))
                                                <span>

                                                    {{ $item->kode_departemen }}

                                                </span>
                                            @endif

                                        </div>

                                    </div>

                                </td>



                                {{-- ACTION --}}
                                <td>

                                    <div class="divisi-actions">


                                        <button type="button" class="view" data-action="view" title="Lihat Divisi"
                                            aria-label="Lihat Divisi">

                                            <i data-lucide="eye"></i>

                                        </button>



                                        <button type="button" class="edit" data-action="edit" title="Edit Divisi"
                                            aria-label="Edit Divisi">

                                            <i data-lucide="square-pen"></i>

                                        </button>



                                        <button type="button" class="delete" data-action="delete" title="Hapus Divisi"
                                            aria-label="Hapus Divisi">

                                            <i data-lucide="trash-2"></i>

                                        </button>


                                    </div>

                                </td>


                            </tr>


                        @empty

                            <tr id="divisiServerEmpty">

                                <td colspan="5" class="divisi-empty">

                                    Belum ada data Divisi.

                                </td>

                            </tr>
                        @endforelse



                        <tr id="divisiEmptyRow" hidden>

                            <td colspan="5" class="divisi-empty">

                                Data Divisi tidak ditemukan.

                            </td>

                        </tr>


                    </tbody>

                </table>

            </div>



            {{-- ========================================================
             TABLE FOOTER
        ========================================================= --}}
            <div class="divisi-table-footer">


                <div class="divisi-table-info" id="divisiTableInfo">
                    -
                </div>



                <div class="divisi-pagination-area">


                    <select id="divisiPageSize" aria-label="Jumlah data per halaman">

                        <option value="10">
                            10
                        </option>

                        <option value="25">
                            25
                        </option>

                        <option value="50">
                            50
                        </option>

                    </select>


                    <span>
                        data per halaman
                    </span>


                    <nav class="divisi-pagination" id="divisiPagination" aria-label="Pagination Divisi"></nav>


                </div>


            </div>


        </section>



        {{-- ============================================================
         BOTTOM GRID
    ============================================================= --}}
        <div class="divisi-bottom-grid">


            {{-- ========================================================
             DISTRIBUSI
        ========================================================= --}}
            <section class="divisi-card divisi-distribution-card">


                <div class="divisi-bottom-header">

                    <h3>
                        Distribusi Divisi per Departemen
                    </h3>

                </div>



                <div class="divisi-distribution-content">


                    <div class="divisi-chart-wrap">

                        <canvas id="divisiDistributionChart" aria-label="Distribusi Divisi per Departemen"></canvas>


                        <div class="divisi-chart-center">

                            <strong>

                                {{ number_format($totalDivisi, 0, ',', '.') }}

                            </strong>

                            <span>
                                Divisi
                            </span>

                        </div>

                    </div>



                    <div class="divisi-legend" id="divisiLegend">

                        @forelse ($distribusiDivisi as $index => $item)
                            @php

                                $colors = [
                                    '#2f80ed',
                                    '#4fa7f2',
                                    '#47bd83',
                                    '#ffc457',
                                    '#ff941c',
                                    '#7d5ce7',
                                    '#9aacbf',
                                    '#16a7a0',
                                ];

                                $color = $colors[$index % count($colors)];

                            @endphp


                            <div data-label="{{ $item->nama_departemen }}" data-count="{{ $item->total }}"
                                data-color="{{ $color }}">

                                <span class="divisi-dot" style="--dot-color: {{ $color }}"></span>


                                <p>

                                    {{ $item->nama_departemen }}

                                </p>


                                <strong>

                                    {{ number_format($item->total, 0, ',', '.') }}

                                </strong>


                                <small>

                                    {{ number_format($item->persentase, 1, ',', '.') }}%

                                </small>

                            </div>


                        @empty

                            <div class="divisi-legend-empty">

                                Belum ada distribusi Divisi.

                            </div>
                        @endforelse

                    </div>


                </div>


            </section>



            {{-- ========================================================
             DIVISI TERBARU
        ========================================================= --}}
            <section class="divisi-card divisi-latest-card">


                <div class="divisi-bottom-header">

                    <h3>
                        Divisi Terbaru
                    </h3>


                    <button type="button" class="divisi-see-all" onclick="scrollToDivisiTable()">

                        Lihat Semua

                    </button>

                </div>



                <div class="table-responsive">


                    <table class="divisi-latest-table">


                        <thead>

                            <tr>

                                <th>
                                    No
                                </th>

                                <th>
                                    Nama Divisi
                                </th>

                                <th>
                                    Departemen
                                </th>

                                <th>
                                    Tanggal Dibuat
                                </th>

                            </tr>

                        </thead>



                        <tbody>


                            @forelse ($divisiTerbaru as $item)
                                <tr>

                                    <td>

                                        {{ $loop->iteration }}

                                    </td>


                                    <td>

                                        {{ $item->nama_div ?: '—' }}

                                    </td>


                                    <td>

                                        {{ $item->nama_departemen ?: '—' }}

                                    </td>


                                    <td>

                                        @if (!empty($item->created_at))
                                            {{ \Carbon\Carbon::parse($item->created_at)->locale('id')->translatedFormat('d M Y') }}
                                        @else
                                            —
                                        @endif

                                    </td>

                                </tr>


                            @empty

                                <tr>

                                    <td colspan="4" class="divisi-empty">

                                        Belum ada data Divisi terbaru.

                                    </td>

                                </tr>
                            @endforelse


                        </tbody>


                    </table>


                </div>


            </section>


        </div>



        {{-- ============================================================
         CRUD MODAL
    ============================================================= --}}
        <dialog class="divisi-dialog" id="divisiModal">


            <div class="divisi-modal-dialog">


                {{-- HEADER --}}
                <div class="divisi-modal-header">


                    <div class="divisi-modal-heading">


                        <div class="divisi-modal-icon">

                            <i data-lucide="layers-3"></i>

                        </div>


                        <div>

                            <h3 id="divisiModalTitle">
                                Tambah Divisi
                            </h3>

                            <p id="divisiModalDescription">
                                Tambahkan Divisi baru dan hubungkan dengan Departemen.
                            </p>

                        </div>


                    </div>



                    <button type="button" class="divisi-modal-close" onclick="closeDivisiModal()" aria-label="Tutup">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                {{-- FORM --}}
                <form id="divisiForm" autocomplete="off">

                    @csrf


                    <input type="hidden" id="divisiId">



                    <div class="divisi-form-alert" id="divisiFormAlert" hidden></div>



                    <div class="divisi-modal-body">


                        {{-- NAMA DIVISI --}}
                        <div class="divisi-form-group">

                            <label for="divisiName">

                                Nama Divisi

                                <span>*</span>

                            </label>


                            <input type="text" id="divisiName" name="nama_div" maxlength="255"
                                placeholder="Contoh: Divisi Teknologi Informasi" required>

                        </div>



                        {{-- KODE DIVISI --}}
                        <div class="divisi-form-group">

                            <label for="divisiCode">

                                Kode Divisi

                                <span>*</span>

                            </label>


                            <input type="text" id="divisiCode" name="kode_div" maxlength="255"
                                placeholder="Contoh: 03.02.10.03" required>

                        </div>



                        {{-- DEPARTEMEN --}}
                        <div class="divisi-form-group">

                            <label for="divisiFormDepartemen">

                                Departemen

                                <span>*</span>

                            </label>


                            <select id="divisiFormDepartemen" name="id_dep" required>

                                <option value="">
                                    Pilih Departemen
                                </option>


                                @foreach ($departemens as $departemen)
                                    <option value="{{ $departemen->id }}">

                                        {{ $departemen->kode_dep }}

                                        @if (!empty($departemen->nama_dep))
                                            — {{ $departemen->nama_dep }}
                                        @endif

                                    </option>
                                @endforeach

                            </select>

                        </div>



                        {{-- INFO --}}
                        <div class="divisi-modal-note">

                            <i data-lucide="database"></i>


                            <div>

                                <strong>
                                    Database Divisi
                                </strong>

                                <span>
                                    Data akan disimpan langsung ke tabel
                                    <code>divisis</code> dan dihubungkan melalui
                                    <code>id_dep</code>.
                                </span>

                            </div>

                        </div>


                    </div>



                    {{-- FOOTER --}}
                    <div class="divisi-modal-footer">


                        <button type="button" class="divisi-cancel-button" onclick="closeDivisiModal()">

                            Batal

                        </button>



                        <button type="submit" class="divisi-save-button" id="divisiSaveButton">

                            <i data-lucide="save"></i>


                            <span id="divisiSaveText">

                                Simpan Divisi

                            </span>

                        </button>


                    </div>


                </form>


            </div>


        </dialog>



        {{-- ============================================================
         ACTIVITY HISTORY MODAL
    ============================================================= --}}
        <dialog class="divisi-dialog divisi-history-dialog" id="divisiActivityModal">


            <div class="divisi-modal-dialog">


                {{-- HEADER --}}
                <div class="divisi-modal-header">


                    <div class="divisi-modal-heading">


                        <div class="divisi-modal-icon">

                            <i data-lucide="history"></i>

                        </div>


                        <div>

                            <h3>
                                Riwayat Perubahan Divisi
                            </h3>

                            <p>
                                Riwayat penambahan dan penghapusan data master Divisi.
                            </p>

                        </div>


                    </div>



                    <button type="button" class="divisi-modal-close" onclick="closeDivisiActivityModal()"
                        aria-label="Tutup">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                {{-- SUMMARY --}}
                <div class="divisi-history-summary">


                    <div class="divisi-history-stat">

                        <span>
                            Ditambahkan
                        </span>


                        <strong class="created">

                            <i data-lucide="arrow-up"></i>

                            {{ $divisiTambah }}

                        </strong>

                    </div>



                    <div class="divisi-history-stat">

                        <span>
                            Dihapus
                        </span>


                        <strong class="deleted">

                            <i data-lucide="arrow-down"></i>

                            {{ $divisiHapus }}

                        </strong>

                    </div>



                    <div class="divisi-history-stat">

                        <span>
                            Perubahan Bersih
                        </span>


                        <strong>

                            @if ($divisiDelta > 0)
                                +{{ $divisiDelta }}
                            @else
                                {{ $divisiDelta }}
                            @endif

                        </strong>

                    </div>


                </div>



                {{-- FILTER --}}
                <div class="divisi-history-toolbar">


                    <button type="button" class="active" data-divisi-history-filter="all">

                        Semua

                    </button>


                    <button type="button" data-divisi-history-filter="created">

                        <i data-lucide="plus"></i>

                        Ditambahkan

                    </button>


                    <button type="button" data-divisi-history-filter="deleted">

                        <i data-lucide="trash-2"></i>

                        Dihapus

                    </button>


                </div>



                {{-- TABLE --}}
                <div class="divisi-history-body">


                    <div class="table-responsive">


                        <table class="divisi-history-table">


                            <thead>

                                <tr>

                                    <th>
                                        No
                                    </th>

                                    <th>
                                        Nama Divisi
                                    </th>

                                    <th>
                                        Kode Divisi
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Tanggal Data
                                    </th>

                                    <th>
                                        Waktu Aktivitas
                                    </th>

                                </tr>

                            </thead>



                            <tbody>


                                @forelse ($divisiActivityLogs as $log)
                                    <tr data-divisi-history-row data-action="{{ $log->action }}">


                                        <td class="divisi-history-number">

                                            {{ $loop->iteration }}

                                        </td>


                                        <td>

                                            {{ $log->record_name ?: '—' }}

                                        </td>


                                        <td>

                                            {{ $log->record_code ?: '—' }}

                                        </td>


                                        <td>

                                            @if ($log->action === 'created')
                                                <span class="divisi-history-status created">

                                                    <i data-lucide="arrow-up"></i>

                                                    Ditambahkan

                                                </span>
                                            @else
                                                <span class="divisi-history-status deleted">

                                                    <i data-lucide="arrow-down"></i>

                                                    Dihapus

                                                </span>
                                            @endif

                                        </td>


                                        <td>

                                            @if (!empty($log->record_created_at))
                                                {{ \Carbon\Carbon::parse($log->record_created_at)->locale('id')->translatedFormat('d M Y') }}
                                            @else
                                                —
                                            @endif

                                        </td>


                                        <td>

                                            @if (!empty($log->created_at))
                                                {{ \Carbon\Carbon::parse($log->created_at)->locale('id')->translatedFormat('d M Y, H:i') }}
                                            @else
                                                —
                                            @endif

                                        </td>


                                    </tr>


                                @empty

                                    <tr>

                                        <td colspan="6" class="divisi-empty">

                                            Belum ada riwayat perubahan Divisi.

                                        </td>

                                    </tr>
                                @endforelse


                            </tbody>


                        </table>


                    </div>



                    <div class="divisi-empty" id="divisiHistoryFilteredEmpty" hidden>

                        Tidak ada riwayat pada kategori ini.

                    </div>


                </div>


            </div>


        </dialog>



        {{-- ============================================================
         TOAST
    ============================================================= --}}
        <div class="divisi-toast-container" id="divisiToastContainer"></div>


    </section>

@endsection



@push('scripts')
    <script>
        window.DIVISI_CRUD = {

            store: @json(route('master.data_divisi.store')),

            update: @json(url('/master-data/divisi/__ID__')),

            destroy: @json(url('/master-data/divisi/__ID__'))

        };
    </script>


    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>

    <script src="{{ asset('js/pages/divisi.js') }}"></script>
@endpush
