@extends('layouts.main')

@section('title', 'Barang')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/barang.css') }}">
@endpush


@section('content')

    <section class="content barang-page">

        {{-- ============================================================
        HERO
    ============================================================= --}}

        <section class="barang-hero">

            <div class="barang-hero-overlay"></div>

            <div class="barang-hero-top">

                <div>

                    <nav class="barang-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Home">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong aria-current="page">
                            Barang
                        </strong>

                    </nav>


                    <div class="barang-heading">

                        <h1>Barang</h1>

                        <p>
                            Kelola data master barang yang digunakan
                            pada sistem aset perusahaan.
                        </p>

                    </div>

                </div>


                {{-- DATE --}}

                <div class="barang-date-card">

                    <div class="barang-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>

                        <strong id="barangCurrentDate">
                            -
                        </strong>

                        <span id="barangCurrentTime">
                            -
                        </span>

                    </div>

                </div>

            </div>


            {{-- ========================================================
            KPI
        ========================================================= --}}

            <div class="barang-kpi-grid">

                {{-- TOTAL BARANG --}}
                <div class="barang-kpi-card barang-kpi-card-clickable" id="barangTotalActivityCard" role="button"
                    tabindex="0" aria-label="Lihat riwayat perubahan Barang">

                    <div class="barang-kpi-icon">
                        <i data-lucide="package"></i>
                    </div>


                    <div class="barang-kpi-content">

                        <span>
                            Total Barang
                        </span>


                        <div class="barang-kpi-value">

                            <strong>
                                {{ number_format($totalBarang, 0, ',', '.') }}
                            </strong>


                            {{-- DELTA --}}
                            @if ($barangDelta > 0)
                                <small class="barang-delta barang-delta-up">

                                    <i data-lucide="arrow-up"></i>

                                    +{{ number_format($barangDelta, 0, ',', '.') }}

                                </small>
                            @elseif ($barangDelta < 0)
                                <small class="barang-delta barang-delta-down">

                                    <i data-lucide="arrow-down"></i>

                                    {{ number_format($barangDelta, 0, ',', '.') }}

                                </small>
                            @else
                                <small class="barang-delta barang-delta-neutral">

                                    <i data-lucide="minus"></i>

                                    0

                                </small>
                            @endif

                        </div>


                        <p>
                            perubahan tercatat
                        </p>

                    </div>


                    <div class="barang-sparkline">

                        <svg viewBox="0 0 100 45">

                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />

                        </svg>

                    </div>

                </div>


                {{-- TOTAL GOLONGAN --}}

                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon">
                        <i data-lucide="layers-3"></i>
                    </div>

                    <div class="barang-kpi-content">

                        <span>Total Golongan</span>

                        <strong>
                            {{ number_format($totalGolongan, 0, ',', '.') }}
                        </strong>

                        <p>
                            master golongan
                        </p>

                    </div>

                    <div class="barang-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>


                {{-- UPDATE TERAKHIR --}}

                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon">
                        <i data-lucide="clock-3"></i>
                    </div>

                    <div class="barang-kpi-content">

                        <span>Update Terakhir</span>

                        <strong class="barang-kpi-text">
                            {{ $updateTerakhirLabel }}
                        </strong>

                        <p>
                            data master terbaru
                        </p>

                    </div>

                    <div class="barang-kpi-watermark">
                        <i data-lucide="calendar-days"></i>
                    </div>

                </div>

            </div>

            {{-- ============================================================
     ACTIVITY HISTORY MODAL
============================================================= --}}

            <dialog class="barang-modal barang-history-modal" id="barangActivityModal"
                aria-labelledby="barangActivityModalTitle">

                <div class="barang-modal-dialog barang-history-dialog">

                    {{-- ========================================================
             HEADER
        ========================================================= --}}
                    <div class="barang-modal-header">

                        <div>

                            <h3 id="barangActivityModalTitle">
                                Riwayat Perubahan Barang
                            </h3>

                            <p>
                                Riwayat penambahan dan penghapusan data master Barang.
                            </p>

                        </div>


                        <button type="button" onclick="closeBarangActivityModal()"
                            aria-label="Tutup riwayat perubahan Barang">

                            <i data-lucide="x"></i>

                        </button>

                    </div>


                    {{-- ========================================================
             SUMMARY
        ========================================================= --}}
                    <div class="barang-history-summary">

                        <div class="barang-history-summary-item">

                            <span>
                                Ditambahkan
                            </span>

                            <strong class="is-created">

                                <i data-lucide="arrow-up"></i>

                                {{ number_format($barangTambah, 0, ',', '.') }}

                            </strong>

                        </div>


                        <div class="barang-history-summary-item">

                            <span>
                                Dihapus
                            </span>

                            <strong class="is-deleted">

                                <i data-lucide="arrow-down"></i>

                                {{ number_format($barangHapus, 0, ',', '.') }}

                            </strong>

                        </div>


                        <div class="barang-history-summary-item">

                            <span>
                                Perubahan Bersih
                            </span>

                            <strong>

                                @if ($barangDelta > 0)
                                    +{{ number_format($barangDelta, 0, ',', '.') }}
                                @else
                                    {{ number_format($barangDelta, 0, ',', '.') }}
                                @endif

                            </strong>

                        </div>

                    </div>


                    {{-- ========================================================
             FILTER
        ========================================================= --}}
                    <div class="barang-history-toolbar">

                        <button type="button" class="active" data-barang-history-filter="all">
                            Semua
                        </button>


                        <button type="button" data-barang-history-filter="created">
                            <i data-lucide="plus"></i>

                            Ditambahkan
                        </button>


                        <button type="button" data-barang-history-filter="deleted">
                            <i data-lucide="trash-2"></i>

                            Dihapus
                        </button>

                    </div>


                    {{-- ========================================================
             TABLE
        ========================================================= --}}
                    <div class="barang-history-body">

                        <div class="table-responsive">

                            <table class="barang-history-table" id="barangHistoryTable">

                                <thead>

                                    <tr>

                                        <th>
                                            No
                                        </th>

                                        <th>
                                            Nama Barang
                                        </th>

                                        <th>
                                            Kode Barang
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

                                    @forelse ($barangActivityLogs as $log)
                                        <tr data-barang-history-row data-action="{{ $log->action }}">

                                            <td class="barang-history-number">
                                                {{ $loop->iteration }}
                                            </td>


                                            <td>
                                                {{ $log->record_name }}
                                            </td>


                                            <td>
                                                {{ $log->record_code ?: '—' }}
                                            </td>


                                            <td>

                                                @if ($log->action === 'created')
                                                    <span class="barang-history-status is-created">

                                                        <i data-lucide="arrow-up"></i>

                                                        Ditambahkan

                                                    </span>
                                                @else
                                                    <span class="barang-history-status is-deleted">

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

                                        <tr id="barangHistoryEmptyInitial">

                                            <td colspan="6" class="barang-history-empty">
                                                Belum ada riwayat perubahan Barang.
                                            </td>

                                        </tr>
                                    @endforelse

                                </tbody>

                            </table>

                        </div>


                        <div class="barang-history-empty" id="barangHistoryFilteredEmpty" hidden>
                            Tidak ada riwayat pada kategori ini.
                        </div>

                    </div>

                </div>

            </dialog>

        </section>


        {{-- ============================================================
        FILTER
    ============================================================= --}}

        <section class="barang-card barang-filter-card">

            <div class="barang-filter-header">

                <h3>
                    Filter Data Barang
                </h3>

                <button type="button" class="barang-add-button" onclick="openBarangModal('add')">
                    <i data-lucide="plus"></i>
                    Tambah Barang
                </button>

            </div>


            <div class="barang-filter-grid">

                {{-- SEARCH --}}

                <div class="barang-search">

                    <i data-lucide="search"></i>

                    <input type="text" id="barangSearch" placeholder="Cari kode atau nama barang..."
                        aria-label="Cari kode atau nama barang">

                </div>


                {{-- FILTER GOLONGAN --}}

                <div class="barang-select-group">

                    <label for="barangGolongan">
                        Golongan
                    </label>

                    <select id="barangGolongan">

                        <option value="">
                            Semua Golongan
                        </option>

                        @foreach ($golongans as $golongan)
                            <option value="{{ $golongan->id }}">
                                {{ $golongan->nama }}
                            </option>
                        @endforeach

                    </select>

                </div>


                {{-- FILTER --}}

                <button type="button" class="barang-filter-button" onclick="filterBarangTable()">
                    <i data-lucide="list-filter"></i>
                    Filter
                </button>


                {{-- RESET --}}

                <button type="button" class="barang-reset-button" onclick="resetBarangFilter()">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>


                {{-- EXPORT --}}

                <button type="button" class="barang-export-button" onclick="exportBarangCSV()">
                    <i data-lucide="download"></i>
                    Ekspor
                </button>

            </div>

        </section>


        {{-- ============================================================
        TABLE
    ============================================================= --}}

        <section class="barang-card barang-table-card" id="barangList">

            <div class="barang-table-header">

                <h3>
                    Daftar Barang
                </h3>

                <span class="barang-demo-badge" title="Data diambil langsung dari database.">
                    Database
                </span>

            </div>


            <div class="table-responsive" tabindex="0" aria-label="Tabel barang">

                <table class="barang-table" id="barangTable">

                    <thead>

                        <tr>

                            <th class="barang-col-no">
                                No
                            </th>

                            <th>
                                Nama Barang
                            </th>

                            <th>
                                Kode Barang
                            </th>

                            <th>
                                Golongan
                            </th>

                            <th class="barang-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        @forelse ($barangs as $index => $item)
                            <tr data-id="{{ $item->id }}" data-golongan="{{ $item->golongan }}"
                                data-golongan-name="{{ $item->nama_golongan }}"
                                data-created-at="{{ $item->created_at ?? '' }}"
                                data-updated-at="{{ $item->updated_at ?? '' }}">

                                <td>
                                    {{ $index + 1 }}
                                </td>

                                <td>
                                    {{ $item->nama_barang }}
                                </td>

                                <td>
                                    {{ $item->kode_barang }}
                                </td>

                                <td>
                                    {{ $item->nama_golongan ?? 'Tanpa Golongan' }}
                                </td>

                                <td>

                                    <div class="barang-actions">

                                        {{-- VIEW --}}

                                        <button type="button" class="view" data-action="view" title="Lihat barang"
                                            aria-label="Lihat {{ $item->nama_barang }}">
                                            <i data-lucide="eye"></i>
                                        </button>


                                        {{-- EDIT --}}

                                        <button type="button" class="edit" data-action="edit" title="Edit barang"
                                            aria-label="Edit {{ $item->nama_barang }}">
                                            <i data-lucide="square-pen"></i>
                                        </button>


                                        {{-- DELETE --}}

                                        <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                            aria-label="Hapus {{ $item->nama_barang }}">
                                            <i data-lucide="trash-2"></i>
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        @empty

                            {{-- Tidak ada data --}}
                        @endforelse


                        <tr id="barangEmptyRow" hidden>

                            <td colspan="5" class="barang-empty">
                                Tidak ada barang yang sesuai.
                                Coba kata kunci atau golongan lain.
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


            {{-- TABLE FOOTER --}}

            <div class="barang-table-footer">

                <div class="barang-table-info" id="barangTableInfo" role="status" aria-live="polite">
                    Menampilkan 0 data
                </div>


                <div class="barang-pagination-area">

                    <select id="barangPageSize" aria-label="Jumlah data per halaman">

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


                    <nav class="barang-pagination" id="barangPagination" aria-label="Halaman daftar barang"></nav>

                </div>

            </div>

        </section>


        {{-- ============================================================
        BOTTOM
    ============================================================= --}}

        <div class="barang-bottom-grid">


            {{-- DISTRIBUSI --}}

            <section class="barang-card">

                <div class="barang-bottom-header">

                    <h3>
                        Distribusi Barang per Golongan
                    </h3>

                </div>


                <div class="barang-distribution-content">

                    <div class="barang-chart-wrap">

                        <canvas id="barangDistributionChart" role="img"
                            aria-label="Distribusi barang berdasarkan golongan"></canvas>


                        <div class="barang-chart-center">

                            <strong>
                                {{ number_format($totalBarang, 0, ',', '.') }}
                            </strong>

                            <span>
                                Barang
                            </span>

                        </div>

                    </div>


                    <div class="barang-legend" id="barangLegend">

                        @php

                            $chartColors = ['#3389ee', '#4fc184', '#ffc85c', '#ff9024', '#8558e8', '#aab7ca'];

                        @endphp


                        @forelse ($distribusiGolongan
                                                                                                as $index => $group)
                            @php

                                $count = (int) $group->total;

                                $percent = $totalBarang > 0 ? round(($count / $totalBarang) * 100, 1) : 0;

                                $label = $group->golongan ?? 'Tanpa Golongan';
                            @endphp


                            <div data-label="{{ $label }}" data-count="{{ $count }}"
                                data-color="{{ $chartColors[$index % count($chartColors)] }}">

                                <span class="barang-dot c{{ ($index % 6) + 1 }}"></span>

                                <p>
                                    {{ $label }}
                                </p>

                                <strong>
                                    {{ number_format($count, 0, ',', '.') }}
                                </strong>

                                <small>
                                    {{ number_format($percent, 1, ',', '.') }}%
                                </small>

                            </div>

                        @empty

                            <div data-label="Belum ada data" data-count="0" data-color="#aab7ca">

                                <span class="barang-dot c6"></span>

                                <p>
                                    Belum ada data
                                </p>

                                <strong>
                                    0
                                </strong>

                                <small>
                                    0%
                                </small>

                            </div>
                        @endforelse

                    </div>

                </div>

            </section>


            {{-- BARANG TERBARU --}}

            <section class="barang-card">

                <div class="barang-bottom-header">

                    <h3>
                        Barang Terbaru
                    </h3>

                    <a href="#barangList" id="barangViewAll">
                        Lihat Semua
                    </a>

                </div>


                <div class="table-responsive">

                    <table class="barang-latest-table">

                        <thead>

                            <tr>

                                <th>
                                    No
                                </th>

                                <th>
                                    Nama Barang
                                </th>

                                <th>
                                    Golongan
                                </th>

                                <th>
                                    Tanggal Ditambahkan
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            @forelse ($barangTerbaru
                                                                                                    as $index => $item)
                                <tr>

                                    <td>
                                        {{ $index + 1 }}
                                    </td>

                                    <td>
                                        {{ $item->nama_barang }}
                                    </td>

                                    <td>
                                        {{ $item->nama_golongan ?? 'Tanpa Golongan' }}
                                    </td>

                                    <td>

                                        @if ($hasCreatedAt && !empty($item->created_at))
                                            {{ \Carbon\Carbon::parse($item->created_at)->locale('id')->translatedFormat('d M Y') }}
                                        @else
                                            —
                                        @endif

                                    </td>

                                </tr>

                            @empty

                                <tr>

                                    <td colspan="4" class="barang-empty">
                                        Belum ada data barang.
                                    </td>

                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>

            </section>

        </div>


        {{-- ============================================================
        MODAL CRUD
    ============================================================= --}}

        <dialog class="barang-modal" id="barangModal" aria-labelledby="barangModalTitle">

            <div class="barang-modal-dialog">


                {{-- HEADER --}}

                <div class="barang-modal-header">

                    <div>

                        <h3 id="barangModalTitle">
                            Tambah Barang
                        </h3>

                        <p id="barangModalDescription">
                            Tambahkan data master barang baru.
                        </p>

                    </div>


                    <button type="button" onclick="closeBarangModal()" aria-label="Tutup dialog">
                        <i data-lucide="x"></i>
                    </button>

                </div>


                {{-- FORM --}}

                <form id="barangForm">

                    @csrf

                    <div class="barang-modal-body">

                        <p class="barang-modal-note" id="barangModalNote">
                            Data baru akan disimpan ke database.
                        </p>


                        {{-- NAMA --}}

                        <div class="barang-form-group">

                            <label for="barangName">
                                Nama Barang
                            </label>

                            <input id="barangName" name="nama_barang" type="text" placeholder="Masukkan nama barang"
                                maxlength="150" required>

                        </div>


                        {{-- KODE --}}

                        <div class="barang-form-group">

                            <label for="barangCode">
                                Kode Barang
                            </label>

                            <input id="barangCode" name="kode_barang" type="text" placeholder="Contoh: BRG-009"
                                maxlength="50" required>

                        </div>


                        {{-- GOLONGAN --}}

                        <div class="barang-form-group">

                            <label for="barangFormGolongan">
                                Golongan
                            </label>

                            <select id="barangFormGolongan" name="golongan" required>

                                <option value="">
                                    Pilih Golongan
                                </option>

                                @foreach ($golongans as $golongan)
                                    <option value="{{ $golongan->id }}">
                                        {{ $golongan->nama }}
                                    </option>
                                @endforeach

                            </select>

                        </div>

                    </div>


                    {{-- FOOTER --}}

                    <div class="barang-modal-footer">

                        <button type="button" class="barang-cancel-button" onclick="closeBarangModal()">
                            Tutup
                        </button>


                        <button type="submit" class="barang-save-button" id="barangSaveButton">
                            Simpan Barang
                        </button>

                    </div>

                </form>

            </div>

        </dialog>

    </section>

@endsection


@push('scripts')
    <script>
        window.BARANG_CRUD = {
            store: @json(route('master.data_barang.store')),
            update: @json(url('/master-data/barang/__ID__')),
            destroy: @json(url('/master-data/barang/__ID__'))
        };
    </script>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>

    <script src="{{ asset('js/pages/barang.js') }}"></script>
@endpush
