@extends('layouts.main')

@section('title', 'Ruangan')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/master/ruangan.css') }}">
@endpush



@section('content')

    <section class="content ruangan-page">


        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="ruangan-hero">

            <div class="ruangan-hero-overlay"></div>


            <div class="ruangan-hero-content">


                <div class="ruangan-hero-top">


                    <div>


                        {{-- BREADCRUMB --}}
                        <nav class="ruangan-breadcrumb">

                            <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                                <i data-lucide="house"></i>
                            </a>


                            <i data-lucide="chevron-right"></i>


                            <span>
                                Master Data
                            </span>


                            <i data-lucide="chevron-right"></i>


                            <strong>
                                Ruangan
                            </strong>

                        </nav>



                        {{-- TITLE --}}
                        <div class="ruangan-heading">

                            <h1>
                                Ruangan
                            </h1>

                            <p>
                                Kelola data master ruangan yang digunakan
                                sebagai referensi pada sistem aset perusahaan.
                            </p>

                        </div>


                    </div>



                    {{-- DATE --}}
                    <div class="ruangan-date-card">


                        <div class="ruangan-date-icon">

                            <i data-lucide="calendar-days"></i>

                        </div>


                        <div>

                            <strong id="ruanganCurrentDate">
                                -
                            </strong>

                            <span id="ruanganCurrentTime">
                                -
                            </span>

                        </div>


                    </div>


                </div>



                {{-- ========================================================
                 KPI
            ========================================================= --}}
                <div class="ruangan-kpi-grid">


                    {{-- TOTAL RUANGAN --}}
                    <div class="ruangan-kpi-card ruangan-kpi-clickable" id="ruanganTotalActivityCard" role="button"
                        tabindex="0" title="Klik untuk melihat riwayat perubahan Ruangan">


                        <div class="ruangan-kpi-icon">

                            <i data-lucide="door-open"></i>

                        </div>


                        <div class="ruangan-kpi-content">

                            <span>
                                Total Ruangan
                            </span>


                            <div class="ruangan-kpi-value">

                                <strong>

                                    {{ number_format($totalRuangan, 0, ',', '.') }}

                                </strong>


                                @if ($ruanganDelta > 0)
                                    <small class="ruangan-delta ruangan-delta-up">

                                        <i data-lucide="arrow-up"></i>

                                        +{{ $ruanganDelta }}

                                    </small>
                                @elseif ($ruanganDelta < 0)
                                    <small class="ruangan-delta ruangan-delta-down">

                                        <i data-lucide="arrow-down"></i>

                                        {{ $ruanganDelta }}

                                    </small>
                                @else
                                    <small class="ruangan-delta ruangan-delta-neutral">

                                        <i data-lucide="minus"></i>

                                        0

                                    </small>
                                @endif

                            </div>


                            <p>
                                perubahan tercatat
                            </p>

                        </div>


                        <div class="ruangan-sparkline">

                            <svg viewBox="0 0 100 45">

                                <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />

                            </svg>

                        </div>


                    </div>



                    {{-- DITAMBAHKAN --}}
                    <div class="ruangan-kpi-card">


                        <div class="ruangan-kpi-icon">

                            <i data-lucide="circle-plus"></i>

                        </div>


                        <div class="ruangan-kpi-content">

                            <span>
                                Ruangan Ditambahkan
                            </span>


                            <strong>

                                {{ number_format($ruanganTambah, 0, ',', '.') }}

                            </strong>


                            <p>
                                aktivitas penambahan tercatat
                            </p>

                        </div>


                        <div class="ruangan-kpi-watermark">

                            <i data-lucide="database"></i>

                        </div>


                    </div>



                    {{-- UPDATE TERAKHIR --}}
                    <div class="ruangan-kpi-card">


                        <div class="ruangan-kpi-icon">

                            <i data-lucide="clock-3"></i>

                        </div>


                        <div class="ruangan-kpi-content">

                            <span>
                                Update Terakhir
                            </span>


                            <strong class="ruangan-kpi-text">

                                {{ $updateTerakhirLabel }}

                            </strong>


                            <p>

                                {{ $updateTerakhirDetail }}

                            </p>

                        </div>


                        <div class="ruangan-kpi-watermark">

                            <i data-lucide="calendar-days"></i>

                        </div>


                    </div>


                </div>


            </div>

        </section>



        {{-- ============================================================
         FILTER
    ============================================================= --}}
        <section class="ruangan-card ruangan-filter-card">


            <div class="ruangan-filter-header">


                <h3>
                    Filter Data Ruangan
                </h3>


                <button type="button" class="ruangan-add-button" onclick="openRuanganModal()">

                    <i data-lucide="plus"></i>

                    Tambah Ruangan

                </button>


            </div>



            <div class="ruangan-filter-grid">


                <div class="ruangan-search">

                    <i data-lucide="search"></i>


                    <input type="search" id="ruanganSearch" placeholder="Cari nama ruangan atau kode ruangan..."
                        autocomplete="off">

                </div>



                <button type="button" class="ruangan-filter-button" onclick="filterRuanganTable()">

                    <i data-lucide="list-filter"></i>

                    Filter

                </button>



                <button type="button" class="ruangan-reset-button" onclick="resetRuanganFilter()">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>



                <div class="ruangan-filter-spacer"></div>



                <button type="button" class="ruangan-export-button" onclick="exportRuanganCSV()">

                    <i data-lucide="download"></i>

                    Ekspor

                    <i data-lucide="chevron-down"></i>

                </button>


            </div>


        </section>



        {{-- ============================================================
         TABLE
    ============================================================= --}}
        <section class="ruangan-card ruangan-table-card">


            <div class="ruangan-table-header">


                <div>

                    <h3>
                        Daftar Ruangan
                    </h3>

                    <span>
                        Data langsung dari tabel ruangans
                    </span>

                </div>


            </div>



            <div class="table-responsive">


                <table class="ruangan-table" id="ruanganTable">


                    <thead>

                        <tr>

                            <th class="ruangan-col-no">
                                No
                            </th>

                            <th>
                                Kode Ruangan
                            </th>

                            <th>
                                Nama Ruangan
                            </th>

                            <th>
                                Dibuat
                            </th>

                            <th class="ruangan-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>



                    <tbody>


                        @forelse ($ruangans as $item)
                            <tr data-record data-id="{{ $item->id }}" data-kode="{{ $item->kode }}"
                                data-nama="{{ $item->nama_ruang }}" data-created-at="{{ $item->created_at ?? '' }}"
                                data-updated-at="{{ $item->updated_at ?? '' }}">


                                {{-- NO --}}
                                <td class="ruangan-number"></td>



                                {{-- KODE --}}
                                <td>

                                    @if (!empty($item->kode) && $item->kode !== '-')
                                        <span class="ruangan-code">

                                            {{ $item->kode }}

                                        </span>
                                    @else
                                        <span class="ruangan-code-empty">

                                            —

                                        </span>
                                    @endif

                                </td>



                                {{-- NAMA --}}
                                <td>

                                    <div class="ruangan-name-cell">


                                        <div class="ruangan-name-icon">

                                            <i data-lucide="door-open"></i>

                                        </div>


                                        <strong>

                                            {{ $item->nama_ruang ?: '—' }}

                                        </strong>


                                    </div>

                                </td>



                                {{-- CREATED --}}
                                <td>

                                    @if (!empty($item->created_at))
                                        {{ \Carbon\Carbon::parse($item->created_at)->locale('id')->translatedFormat('d M Y') }}
                                    @else
                                        —
                                    @endif

                                </td>



                                {{-- ACTION --}}
                                <td>

                                    <div class="ruangan-actions">


                                        <button type="button" class="view" data-action="view" title="Lihat Ruangan">

                                            <i data-lucide="eye"></i>

                                        </button>



                                        <button type="button" class="edit" data-action="edit" title="Edit Ruangan">

                                            <i data-lucide="square-pen"></i>

                                        </button>



                                        <button type="button" class="delete" data-action="delete"
                                            title="Hapus Ruangan">

                                            <i data-lucide="trash-2"></i>

                                        </button>


                                    </div>

                                </td>


                            </tr>


                        @empty

                            <tr id="ruanganServerEmpty">

                                <td colspan="5" class="ruangan-empty">

                                    Belum ada data Ruangan.

                                </td>

                            </tr>
                        @endforelse



                        <tr id="ruanganEmptyRow" hidden>

                            <td colspan="5" class="ruangan-empty">

                                Data Ruangan tidak ditemukan.

                            </td>

                        </tr>


                    </tbody>


                </table>


            </div>



            {{-- ========================================================
             FOOTER
        ========================================================= --}}
            <div class="ruangan-table-footer">


                <div class="ruangan-table-info" id="ruanganTableInfo">
                    -
                </div>



                <div class="ruangan-pagination-area">


                    <select id="ruanganPageSize">

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


                    <nav class="ruangan-pagination" id="ruanganPagination"></nav>


                </div>


            </div>


        </section>



        {{-- ============================================================
         BOTTOM
    ============================================================= --}}
        <div class="ruangan-bottom-grid">


            {{-- RINGKASAN --}}
            <section class="ruangan-card ruangan-summary-card">


                <div class="ruangan-bottom-header">

                    <h3>
                        Ringkasan Data Ruangan
                    </h3>

                </div>



                <div class="ruangan-summary-content">


                    <div class="ruangan-summary-item">


                        <div class="ruangan-summary-icon">

                            <i data-lucide="door-open"></i>

                        </div>


                        <div>

                            <span>
                                Total Data
                            </span>

                            <strong>

                                {{ number_format($totalRuangan, 0, ',', '.') }}

                            </strong>

                        </div>


                    </div>



                    <div class="ruangan-summary-item">


                        <div class="ruangan-summary-icon success">

                            <i data-lucide="badge-check"></i>

                        </div>


                        <div>

                            <span>
                                Kode Terisi
                            </span>

                            <strong>

                                {{ number_format($totalKodeTerisi, 0, ',', '.') }}

                            </strong>

                        </div>


                    </div>



                    <div class="ruangan-summary-item">


                        <div class="ruangan-summary-icon warning">

                            <i data-lucide="circle-help"></i>

                        </div>


                        <div>

                            <span>
                                Belum Memiliki Kode
                            </span>

                            <strong>

                                {{ number_format($totalTanpaKode, 0, ',', '.') }}

                            </strong>

                        </div>


                    </div>


                </div>


            </section>



            {{-- ========================================================
             RUANGAN TERBARU
        ========================================================= --}}
            <section class="ruangan-card ruangan-latest-card">


                <div class="ruangan-bottom-header">


                    <h3>
                        Ruangan Terbaru
                    </h3>


                    <button type="button" class="ruangan-see-all" onclick="scrollToRuanganTable()">

                        Lihat Semua

                    </button>


                </div>



                <div class="table-responsive">


                    <table class="ruangan-latest-table">


                        <thead>

                            <tr>

                                <th>
                                    No
                                </th>

                                <th>
                                    Nama Ruangan
                                </th>

                                <th>
                                    Kode
                                </th>

                                <th>
                                    Tanggal Dibuat
                                </th>

                            </tr>

                        </thead>



                        <tbody>


                            @forelse ($ruanganTerbaru as $item)
                                <tr>

                                    <td>
                                        {{ $loop->iteration }}
                                    </td>


                                    <td>

                                        {{ $item->nama_ruang ?: '—' }}

                                    </td>


                                    <td>

                                        {{ $item->kode ?: '—' }}

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

                                    <td colspan="4" class="ruangan-empty">

                                        Belum ada data Ruangan.

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
        <dialog class="ruangan-dialog" id="ruanganModal">


            <div class="ruangan-modal-dialog">


                <div class="ruangan-modal-header">


                    <div class="ruangan-modal-heading">


                        <div class="ruangan-modal-icon">

                            <i data-lucide="door-open"></i>

                        </div>


                        <div>

                            <h3 id="ruanganModalTitle">

                                Tambah Ruangan

                            </h3>


                            <p id="ruanganModalDescription">

                                Tambahkan data master Ruangan.

                            </p>

                        </div>


                    </div>



                    <button type="button" class="ruangan-modal-close" onclick="closeRuanganModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                <form id="ruanganForm">

                    @csrf


                    <input type="hidden" id="ruanganId">



                    <div class="ruangan-form-alert" id="ruanganFormAlert" hidden></div>



                    <div class="ruangan-modal-body">


                        {{-- NAMA --}}
                        <div class="ruangan-form-group">

                            <label for="ruanganName">

                                Nama Ruangan

                                <span>*</span>

                            </label>


                            <input type="text" id="ruanganName" name="nama_ruang" maxlength="255"
                                placeholder="Contoh: Ruang Server" required>

                        </div>



                        {{-- KODE --}}
                        <div class="ruangan-form-group">

                            <label for="ruanganCode">

                                Kode Ruangan

                            </label>


                            <input type="text" id="ruanganCode" name="kode" maxlength="255"
                                placeholder="Contoh: RGN-001">


                            <small>
                                Opsional. Jika kosong akan disimpan sebagai "-".
                            </small>

                        </div>



                        <div class="ruangan-modal-note">

                            <i data-lucide="database"></i>


                            <div>

                                <strong>
                                    Database Ruangan
                                </strong>


                                <span>
                                    Data akan langsung disimpan ke tabel
                                    <code>ruangans</code>.
                                </span>

                            </div>


                        </div>


                    </div>



                    <div class="ruangan-modal-footer">


                        <button type="button" class="ruangan-cancel-button" onclick="closeRuanganModal()">

                            Batal

                        </button>



                        <button type="submit" class="ruangan-save-button" id="ruanganSaveButton">

                            <i data-lucide="save"></i>


                            <span id="ruanganSaveText">

                                Simpan Ruangan

                            </span>

                        </button>


                    </div>


                </form>


            </div>


        </dialog>



        {{-- ============================================================
         ACTIVITY MODAL
    ============================================================= --}}
        <dialog class="ruangan-dialog ruangan-history-dialog" id="ruanganActivityModal">


            <div class="ruangan-modal-dialog">


                <div class="ruangan-modal-header">


                    <div class="ruangan-modal-heading">


                        <div class="ruangan-modal-icon">

                            <i data-lucide="history"></i>

                        </div>


                        <div>

                            <h3>
                                Riwayat Perubahan Ruangan
                            </h3>


                            <p>
                                Riwayat penambahan dan penghapusan
                                data master Ruangan.
                            </p>

                        </div>


                    </div>



                    <button type="button" class="ruangan-modal-close" onclick="closeRuanganActivityModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                {{-- SUMMARY --}}
                <div class="ruangan-history-summary">


                    <div class="ruangan-history-stat">

                        <span>
                            Ditambahkan
                        </span>


                        <strong class="created">

                            <i data-lucide="arrow-up"></i>

                            {{ $ruanganTambah }}

                        </strong>

                    </div>



                    <div class="ruangan-history-stat">

                        <span>
                            Dihapus
                        </span>


                        <strong class="deleted">

                            <i data-lucide="arrow-down"></i>

                            {{ $ruanganHapus }}

                        </strong>

                    </div>



                    <div class="ruangan-history-stat">

                        <span>
                            Perubahan Bersih
                        </span>


                        <strong>

                            @if ($ruanganDelta > 0)
                                +{{ $ruanganDelta }}
                            @else
                                {{ $ruanganDelta }}
                            @endif

                        </strong>

                    </div>


                </div>



                {{-- FILTER --}}
                <div class="ruangan-history-toolbar">


                    <button type="button" class="active" data-ruangan-history-filter="all">

                        Semua

                    </button>


                    <button type="button" data-ruangan-history-filter="created">

                        <i data-lucide="plus"></i>

                        Ditambahkan

                    </button>


                    <button type="button" data-ruangan-history-filter="deleted">

                        <i data-lucide="trash-2"></i>

                        Dihapus

                    </button>


                </div>



                <div class="ruangan-history-body">


                    <div class="table-responsive">


                        <table class="ruangan-history-table">


                            <thead>

                                <tr>

                                    <th>
                                        No
                                    </th>

                                    <th>
                                        Nama Ruangan
                                    </th>

                                    <th>
                                        Kode
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


                                @forelse ($ruanganActivityLogs as $log)
                                    <tr data-ruangan-history-row data-action="{{ $log->action }}">


                                        <td class="ruangan-history-number">

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
                                                <span class="ruangan-history-status created">

                                                    <i data-lucide="arrow-up"></i>

                                                    Ditambahkan

                                                </span>
                                            @else
                                                <span class="ruangan-history-status deleted">

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

                                        <td colspan="6" class="ruangan-empty">

                                            Belum ada riwayat perubahan Ruangan.

                                        </td>

                                    </tr>
                                @endforelse


                            </tbody>


                        </table>


                    </div>



                    <div id="ruanganHistoryFilteredEmpty" class="ruangan-empty" hidden>

                        Tidak ada riwayat pada kategori ini.

                    </div>


                </div>


            </div>


        </dialog>



        {{-- ============================================================
         TOAST
    ============================================================= --}}
        <div class="ruangan-toast-container" id="ruanganToastContainer"></div>


    </section>

@endsection



@push('scripts')
    <script>
        window.RUANGAN_CRUD = {

            store: @json(route('master.data_ruangan.store')),

            update: @json(url('/master-data/ruangan/__ID__')),

            destroy: @json(url('/master-data/ruangan/__ID__'))

        };
    </script>


    <script src="{{ asset('js/pages/master/ruangan.js') }}"></script>
@endpush
