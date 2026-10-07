@extends('layouts.main')

@section('title', 'Bahan')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/master/bahan.css') }}">
@endpush


@section('content')


    <section class="content bahan-page">


        {{-- ============================================================
         HERO
    ============================================================= --}}

        <section class="bahan-hero">


            <div class="bahan-hero-overlay"></div>


            <div class="bahan-hero-content">


                <div class="bahan-hero-top">


                    <div>


                        <nav class="bahan-breadcrumb">


                            <a href="{{ url('/') }}" aria-label="Dashboard">
                                <i data-lucide="house"></i>
                            </a>


                            <i data-lucide="chevron-right"></i>


                            <span>
                                Master Data
                            </span>


                            <i data-lucide="chevron-right"></i>


                            <strong>
                                Bahan
                            </strong>


                        </nav>



                        <div class="bahan-heading">


                            <h1>
                                Bahan
                            </h1>


                            <p>
                                Kelola data master bahan yang digunakan
                                sebagai referensi pada sistem aset perusahaan.
                            </p>


                        </div>


                    </div>



                    <div class="bahan-date-card">


                        <div class="bahan-date-icon">

                            <i data-lucide="calendar-days"></i>

                        </div>


                        <div>

                            <strong id="bahanCurrentDate">
                                -
                            </strong>

                            <span id="bahanCurrentTime">
                                -
                            </span>

                        </div>


                    </div>


                </div>



                {{-- ========================================================
                 KPI
            ========================================================= --}}

                <div class="bahan-kpi-grid">


                    {{-- TOTAL BAHAN --}}

                    <div class="bahan-kpi-card bahan-kpi-clickable" id="bahanTotalActivityCard" role="button"
                        tabindex="0" title="Klik untuk melihat riwayat perubahan Bahan">


                        <div class="bahan-kpi-icon">

                            <i data-lucide="component"></i>

                        </div>



                        <div class="bahan-kpi-content">


                            <span>
                                Total Bahan
                            </span>


                            <div class="bahan-kpi-value">


                                <strong>
                                    {{ number_format($totalBahan, 0, ',', '.') }}
                                </strong>


                                @if ($bahanDelta > 0)
                                    <small
                                        class="
                                        bahan-delta
                                        bahan-delta-up
                                    ">

                                        <i data-lucide="arrow-up"></i>

                                        +{{ $bahanDelta }}

                                    </small>
                                @elseif ($bahanDelta < 0)
                                    <small
                                        class="
                                        bahan-delta
                                        bahan-delta-down
                                    ">

                                        <i data-lucide="arrow-down"></i>

                                        {{ $bahanDelta }}

                                    </small>
                                @else
                                    <small
                                        class="
                                        bahan-delta
                                        bahan-delta-neutral
                                    ">

                                        <i data-lucide="minus"></i>

                                        0

                                    </small>
                                @endif


                            </div>


                            <p>
                                perubahan tercatat
                            </p>


                        </div>



                        <div class="bahan-sparkline">

                            <svg viewBox="0 0 100 45">

                                <polyline
                                    points="
                                    3,35
                                    17,20
                                    31,25
                                    45,10
                                    59,17
                                    72,26
                                    88,7
                                    98,4
                                " />

                            </svg>

                        </div>


                    </div>



                    {{-- BAHAN DITAMBAHKAN --}}

                    <div class="bahan-kpi-card">


                        <div class="bahan-kpi-icon">

                            <i data-lucide="circle-plus"></i>

                        </div>


                        <div class="bahan-kpi-content">

                            <span>
                                Bahan Ditambahkan
                            </span>

                            <strong>
                                {{ number_format($bahanTambah, 0, ',', '.') }}
                            </strong>

                            <p>
                                aktivitas penambahan tercatat
                            </p>

                        </div>


                        <div class="bahan-kpi-watermark">

                            <i data-lucide="database"></i>

                        </div>


                    </div>



                    {{-- UPDATE TERAKHIR --}}

                    <div class="bahan-kpi-card">


                        <div class="bahan-kpi-icon">

                            <i data-lucide="clock-3"></i>

                        </div>


                        <div class="bahan-kpi-content">

                            <span>
                                Update Terakhir
                            </span>

                            <strong class="bahan-kpi-text">
                                {{ $updateTerakhirLabel }}
                            </strong>

                            <p>
                                {{ $updateTerakhirDetail }}
                            </p>

                        </div>


                        <div class="bahan-kpi-watermark">

                            <i data-lucide="calendar-days"></i>

                        </div>


                    </div>


                </div>


            </div>


        </section>



        {{-- ============================================================
         FILTER
    ============================================================= --}}

        <section class="bahan-card bahan-filter-card">


            <div class="bahan-filter-header">


                <div>

                    <h3>
                        Daftar Bahan
                    </h3>

                    <p>
                        Data langsung dari tabel bahans.
                    </p>

                </div>



                <button type="button" class="bahan-add-button" onclick="openBahanModal()">

                    <i data-lucide="plus"></i>

                    Tambah Bahan

                </button>


            </div>



            <div class="bahan-filter-grid">


                <div class="bahan-search">


                    <i data-lucide="search"></i>


                    <input type="search" id="bahanSearch" placeholder="Cari nama bahan..." autocomplete="off">


                </div>



                <button type="button" class="bahan-reset-button" onclick="resetBahanFilter()">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>



                <div class="bahan-filter-spacer"></div>



                <button type="button" class="bahan-export-button" onclick="exportBahanCSV()">

                    <i data-lucide="download"></i>

                    Export

                </button>


            </div>


        </section>



        {{-- ============================================================
         TABLE
    ============================================================= --}}

        <section class="bahan-card bahan-table-card">


            <div class="table-responsive">


                <table class="bahan-table" id="bahanTable">


                    <thead>


                        <tr>


                            <th class="bahan-col-no">
                                No
                            </th>


                            <th>
                                Nama Bahan
                            </th>


                            <th>
                                Dibuat
                            </th>


                            <th class="bahan-col-action">
                                Aksi
                            </th>


                        </tr>


                    </thead>



                    <tbody>


                        @forelse ($bahans as $item)
                            <tr data-record data-id="{{ $item->id }}" data-nama="{{ $item->nama }}"
                                data-created-at="{{ $item->created_at ?? '' }}"
                                data-updated-at="{{ $item->updated_at ?? '' }}">


                                <td class="bahan-number"></td>



                                <td>


                                    <div class="bahan-name-cell">


                                        <div class="bahan-name-icon">

                                            <i data-lucide="component"></i>

                                        </div>


                                        <div>

                                            <strong>
                                                {{ $item->nama ?: '—' }}
                                            </strong>

                                            <small>
                                                ID #{{ $item->id }}
                                            </small>

                                        </div>


                                    </div>


                                </td>



                                <td>


                                    @if (!empty($item->created_at))
                                        {{ \Carbon\Carbon::parse($item->created_at)->locale('id')->translatedFormat('d M Y') }}
                                    @else
                                        —
                                    @endif


                                </td>



                                <td>


                                    <div class="bahan-actions">


                                        <button type="button" class="view" data-action="view" title="Lihat Bahan">

                                            <i data-lucide="eye"></i>

                                        </button>



                                        <button type="button" class="edit" data-action="edit" title="Edit Bahan">

                                            <i data-lucide="square-pen"></i>

                                        </button>



                                        <button type="button" class="delete" data-action="delete" title="Hapus Bahan">

                                            <i data-lucide="trash-2"></i>

                                        </button>


                                    </div>


                                </td>


                            </tr>


                        @empty


                            <tr id="bahanServerEmpty">


                                <td colspan="4" class="bahan-empty">

                                    Belum ada data Bahan.

                                </td>


                            </tr>
                        @endforelse



                        <tr id="bahanEmptyRow" hidden>


                            <td colspan="4" class="bahan-empty">

                                Data Bahan tidak ditemukan.

                            </td>


                        </tr>


                    </tbody>


                </table>


            </div>



            <div class="bahan-table-footer">


                <div id="bahanTableInfo">
                    -
                </div>



                <div class="bahan-pagination-area">


                    <select id="bahanPageSize">

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


                    <nav class="bahan-pagination" id="bahanPagination"></nav>


                </div>


            </div>


        </section>



        {{-- ============================================================
         BOTTOM
    ============================================================= --}}

        <div class="bahan-bottom-grid">


            {{-- RINGKASAN --}}

            <section class="bahan-card">


                <div class="bahan-bottom-header">

                    <h3>
                        Ringkasan Data Bahan
                    </h3>

                </div>



                <div class="bahan-summary-content">


                    <div class="bahan-summary-item">


                        <div class="bahan-summary-icon">

                            <i data-lucide="component"></i>

                        </div>


                        <div>

                            <span>
                                Total Data
                            </span>

                            <strong>
                                {{ number_format($totalBahan, 0, ',', '.') }}
                            </strong>

                        </div>


                    </div>



                    <div class="bahan-summary-item">


                        <div
                            class="
                            bahan-summary-icon
                            success
                        ">

                            <i data-lucide="badge-check"></i>

                        </div>


                        <div>

                            <span>
                                Data Modern
                            </span>

                            <strong>
                                {{ number_format($totalBahanModern, 0, ',', '.') }}
                            </strong>

                        </div>


                    </div>



                    <div class="bahan-summary-item">


                        <div
                            class="
                            bahan-summary-icon
                            warning
                        ">

                            <i data-lucide="archive"></i>

                        </div>


                        <div>

                            <span>
                                Data Legacy
                            </span>

                            <strong>
                                {{ number_format($totalBahanLegacy, 0, ',', '.') }}
                            </strong>

                        </div>


                    </div>


                </div>


            </section>



            {{-- BAHAN TERBARU --}}

            <section class="bahan-card">


                <div class="bahan-bottom-header">


                    <h3>
                        Bahan Terbaru
                    </h3>


                    <button type="button" class="bahan-see-all" onclick="scrollToBahanTable()">
                        Lihat Semua
                    </button>


                </div>



                <div class="table-responsive">


                    <table class="bahan-latest-table">


                        <thead>


                            <tr>

                                <th>
                                    No
                                </th>

                                <th>
                                    Nama Bahan
                                </th>

                                <th>
                                    Tanggal Dibuat
                                </th>

                            </tr>


                        </thead>



                        <tbody>


                            @forelse ($bahanTerbaru as $item)
                                <tr>


                                    <td>
                                        {{ $loop->iteration }}
                                    </td>


                                    <td>
                                        {{ $item->nama ?: '—' }}
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


                                    <td colspan="3" class="bahan-empty">

                                        Belum ada data Bahan.

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

        <dialog class="bahan-dialog" id="bahanModal">


            <div class="bahan-modal-dialog">


                <div class="bahan-modal-header">


                    <div class="bahan-modal-heading">


                        <div class="bahan-modal-icon">

                            <i data-lucide="component"></i>

                        </div>


                        <div>

                            <h3 id="bahanModalTitle">
                                Tambah Bahan
                            </h3>

                            <p id="bahanModalDescription">
                                Tambahkan data master Bahan.
                            </p>

                        </div>


                    </div>



                    <button type="button" class="bahan-modal-close" onclick="closeBahanModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                <form id="bahanForm">


                    @csrf



                    <div class="bahan-form-alert" id="bahanFormAlert" hidden></div>



                    <div class="bahan-modal-body">


                        <div class="bahan-form-group">


                            <label for="bahanName">

                                Nama Bahan

                                <span>*</span>

                            </label>


                            <input type="text" id="bahanName" name="nama" maxlength="255"
                                placeholder="Contoh: KAYU" required>


                        </div>



                        <div class="bahan-modal-note">


                            <i data-lucide="database"></i>


                            <div>

                                <strong>
                                    Database Bahan
                                </strong>

                                <span>
                                    Data disimpan langsung
                                    ke tabel
                                    <code>bahans</code>.
                                </span>

                            </div>


                        </div>


                    </div>



                    <div class="bahan-modal-footer">


                        <button type="button" class="bahan-cancel-button" onclick="closeBahanModal()">

                            Batal

                        </button>



                        <button type="submit" class="bahan-save-button" id="bahanSaveButton">

                            <i data-lucide="save"></i>

                            <span id="bahanSaveText">
                                Simpan Bahan
                            </span>

                        </button>


                    </div>


                </form>


            </div>


        </dialog>



        {{-- ============================================================
         HISTORY MODAL
    ============================================================= --}}

        <dialog class="
            bahan-dialog
            bahan-history-dialog
        " id="bahanActivityModal">


            <div class="bahan-modal-dialog">


                <div class="bahan-modal-header">


                    <div class="bahan-modal-heading">


                        <div class="bahan-modal-icon">

                            <i data-lucide="history"></i>

                        </div>


                        <div>


                            <h3>
                                Riwayat Perubahan Bahan
                            </h3>


                            <p>
                                Riwayat penambahan dan
                                penghapusan data master Bahan.
                            </p>


                        </div>


                    </div>



                    <button type="button" class="bahan-modal-close" onclick="closeBahanActivityModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                <div class="bahan-history-summary">


                    <div>


                        <span>
                            Ditambahkan
                        </span>


                        <strong class="created">
                            ↑ {{ $bahanTambah }}
                        </strong>


                    </div>



                    <div>


                        <span>
                            Dihapus
                        </span>


                        <strong class="deleted">
                            ↓ {{ $bahanHapus }}
                        </strong>


                    </div>



                    <div>


                        <span>
                            Perubahan Bersih
                        </span>


                        <strong>

                            @if ($bahanDelta > 0)
                                +{{ $bahanDelta }}
                            @else
                                {{ $bahanDelta }}
                            @endif

                        </strong>


                    </div>


                </div>



                <div class="bahan-history-toolbar">


                    <button type="button" class="active" data-bahan-history-filter="all">

                        Semua

                    </button>



                    <button type="button" data-bahan-history-filter="created">

                        Ditambahkan

                    </button>



                    <button type="button" data-bahan-history-filter="deleted">

                        Dihapus

                    </button>


                </div>



                <div class="table-responsive">


                    <table class="bahan-history-table">


                        <thead>


                            <tr>

                                <th>No</th>

                                <th>Nama Bahan</th>

                                <th>Status</th>

                                <th>Tanggal Data</th>

                                <th>Waktu Aktivitas</th>

                            </tr>


                        </thead>



                        <tbody>


                            @forelse ($bahanActivityLogs as $log)
                                <tr data-bahan-history-row data-action="{{ $log->action }}">


                                    <td class="bahan-history-number">
                                        {{ $loop->iteration }}
                                    </td>


                                    <td>
                                        {{ $log->record_name ?: '—' }}
                                    </td>


                                    <td>


                                        <span
                                            class="
                                            bahan-history-status
                                            {{ $log->action === 'created' ? 'created' : 'deleted' }}
                                        ">

                                            {{ $log->action === 'created' ? 'Ditambahkan' : 'Dihapus' }}

                                        </span>


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


                                    <td colspan="5" class="bahan-empty">

                                        Belum ada riwayat perubahan Bahan.

                                    </td>


                                </tr>
                            @endforelse


                        </tbody>


                    </table>


                </div>


            </div>


        </dialog>



        <div class="bahan-toast-container" id="bahanToastContainer"></div>


    </section>


@endsection



@push('scripts')
    <script>
        window.BAHAN_CRUD = {

            store: @json(route('master.data_bahan.store')),

            update: @json(url('/master-data/bahan/__ID__')),

            destroy: @json(url('/master-data/bahan/__ID__'))

        };
    </script>


    <script src="{{ asset('js/pages/master/bahan.js') }}"></script>
@endpush
