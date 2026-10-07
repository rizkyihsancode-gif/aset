@extends('layouts.main')

@section('title', 'Departemen')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/master/departement.css') }}">
@endpush



@section('content')

    <section class="content dept-page">


        {{-- ============================================================
         HERO
    ============================================================= --}}

        <section class="dept-hero">

            <div class="dept-hero-overlay"></div>


            <div class="dept-hero-content">


                {{-- BREADCRUMB --}}
                <nav class="dept-breadcrumb">

                    <a href="{{ route('dashboard') }}" aria-label="Dashboard">

                        <i data-lucide="house"></i>

                    </a>


                    <i data-lucide="chevron-right"></i>


                    <span>
                        Master Data
                    </span>


                    <i data-lucide="chevron-right"></i>


                    <strong>
                        Departemen
                    </strong>

                </nav>



                {{-- TITLE --}}
                <div class="dept-heading">

                    <h1>
                        Departemen
                    </h1>

                    <p>
                        Kelola data departemen pada Perumda Tirta Kencana Kota Samarinda
                    </p>

                </div>



                {{-- ========================================================
                 KPI
            ========================================================= --}}

                <div class="dept-kpi-grid">


                    {{-- TOTAL DEPARTEMEN --}}
                    <div class="dept-kpi-card dept-kpi-clickable" id="departemenTotalActivityCard" role="button"
                        tabindex="0" title="Klik untuk melihat riwayat perubahan Departemen">


                        <div class="dept-kpi-icon">

                            <i data-lucide="building-2"></i>

                        </div>


                        <div class="dept-kpi-content">

                            <span>
                                Total Departemen
                            </span>


                            <div class="dept-kpi-value">


                                <strong>

                                    {{ number_format($totalDepartemen, 0, ',', '.') }}

                                </strong>



                                @if ($departemenDelta > 0)
                                    <small class="dept-delta dept-delta-up">

                                        <i data-lucide="arrow-up"></i>

                                        +{{ $departemenDelta }}

                                    </small>
                                @elseif ($departemenDelta < 0)
                                    <small class="dept-delta dept-delta-down">

                                        <i data-lucide="arrow-down"></i>

                                        {{ $departemenDelta }}

                                    </small>
                                @else
                                    <small class="dept-delta dept-delta-neutral">

                                        <i data-lucide="minus"></i>

                                        0

                                    </small>
                                @endif


                            </div>


                            <p>
                                perubahan tercatat
                            </p>

                        </div>


                        <div class="dept-kpi-watermark">

                            <i data-lucide="chart-no-axes-column-increasing"></i>

                        </div>

                    </div>



                    {{-- TOTAL DIVISI --}}
                    <div class="dept-kpi-card">


                        <div class="dept-kpi-icon">

                            <i data-lucide="layers-3"></i>

                        </div>


                        <div class="dept-kpi-content">

                            <span>
                                Total Divisi
                            </span>


                            <strong>

                                {{ number_format($totalDivisi, 0, ',', '.') }}

                            </strong>


                            <p>
                                divisi dalam sistem
                            </p>

                        </div>


                        <div class="dept-sparkline">

                            <svg viewBox="0 0 100 45">

                                <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />

                            </svg>

                        </div>

                    </div>


                </div>

            </div>

        </section>



        {{-- ============================================================
         DAFTAR
    ============================================================= --}}

        <section class="dept-card dept-table-card">


            {{-- HEADER --}}
            <div class="dept-table-header">

                <h3>
                    Daftar Departemen
                </h3>


                <button type="button" class="dept-add-button" onclick="openDeptModal()">

                    <i data-lucide="plus"></i>

                    Tambah Departemen

                </button>

            </div>



            {{-- TOOLBAR --}}
            <div class="dept-toolbar">


                <div class="dept-search">

                    <i data-lucide="search"></i>

                    <input type="search" id="deptSearch" placeholder="Cari kode, nama, role, atau image..."
                        autocomplete="off">

                </div>


                <button type="button" class="dept-reset-button" onclick="resetDeptFilter()">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>


                <div class="dept-toolbar-spacer"></div>


                <button type="button" class="dept-export-button" onclick="exportDeptCSV()">

                    <i data-lucide="download"></i>

                    Export

                    <i data-lucide="chevron-down"></i>

                </button>


            </div>



            {{-- ========================================================
             TABLE
        ========================================================= --}}

            <div class="table-responsive">

                <table class="dept-table" id="deptTable">


                    <thead>

                        <tr>

                            <th class="dept-col-no">
                                No
                            </th>

                            <th class="dept-col-image">
                                Image
                            </th>

                            <th>
                                Kode Departemen
                            </th>

                            <th>
                                Nama Departemen
                            </th>

                            <th class="dept-col-role">
                                Role
                            </th>

                            <th>
                                Dibuat
                            </th>

                            <th class="dept-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>



                    <tbody>


                        @forelse ($departemens as $item)
                            <tr data-record data-id="{{ $item->id }}" data-kode="{{ $item->nama_dep }}"
                                data-nama="{{ $item->kode_dep }}" data-role="{{ $item->role ?? '' }}"
                                data-img="{{ $item->img ?? '' }}" data-img-url="{{ $item->image_url ?? '' }}"
                                data-created-at="{{ $item->created_at ?? '' }}"
                                data-updated-at="{{ $item->updated_at ?? '' }}">


                                {{-- NO --}}
                                <td class="dept-number"></td>



                                {{-- IMAGE --}}
                                <td>

                                    @if (!empty($item->image_url))
                                        <div class="dept-table-image">

                                            <img src="{{ $item->image_url }}" alt="{{ $item->kode_dep }}" loading="lazy">

                                        </div>
                                    @else
                                        <div class="dept-table-image dept-image-empty"
                                            title="{{ $item->img ?: 'Tidak ada image' }}">

                                            <i data-lucide="image"></i>

                                        </div>
                                    @endif

                                </td>



                                {{-- KODE --}}
                                <td>

                                    <strong class="dept-code-text">

                                        {{ $item->nama_dep ?: '—' }}

                                    </strong>

                                </td>



                                {{-- NAMA --}}
                                <td>

                                    <strong class="dept-name">

                                        {{ $item->kode_dep ?: '—' }}

                                    </strong>

                                </td>



                                {{-- ROLE --}}
                                <td>

                                    @if ($item->role !== null)
                                        <span class="dept-role-badge">

                                            {{ $item->role }}

                                        </span>
                                    @else
                                        <span class="dept-role-empty">

                                            —

                                        </span>
                                    @endif

                                </td>



                                {{-- CREATED AT --}}
                                <td>

                                    @if (!empty($item->created_at))
                                        {{ \Carbon\Carbon::parse($item->created_at)->locale('id')->translatedFormat('d M Y') }}
                                    @else
                                        —
                                    @endif

                                </td>



                                {{-- ACTION --}}
                                <td>

                                    <div class="dept-actions">


                                        <button type="button" class="view" data-action="view" title="Lihat Departemen">

                                            <i data-lucide="eye"></i>

                                        </button>


                                        <button type="button" class="edit" data-action="edit" title="Edit Departemen">

                                            <i data-lucide="square-pen"></i>

                                        </button>


                                        <button type="button" class="delete" data-action="delete"
                                            title="Hapus Departemen">

                                            <i data-lucide="trash-2"></i>

                                        </button>


                                    </div>

                                </td>


                            </tr>


                        @empty


                            <tr id="deptServerEmpty">

                                <td colspan="7" class="dept-empty">

                                    Belum ada data Departemen.

                                </td>

                            </tr>
                        @endforelse



                        <tr id="deptEmptyRow" hidden>

                            <td colspan="7" class="dept-empty">

                                Data Departemen tidak ditemukan.

                            </td>

                        </tr>


                    </tbody>

                </table>

            </div>



            {{-- ========================================================
             FOOTER
        ========================================================= --}}

            <div class="dept-table-footer">


                <div class="dept-table-info" id="deptTableInfo">
                    -
                </div>


                <div class="dept-pagination-area">


                    <select id="deptPageSize">

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


                    <nav class="dept-pagination" id="deptPagination"></nav>


                </div>

            </div>


        </section>



        {{-- ============================================================
         CRUD MODAL
    ============================================================= --}}

        <dialog class="dept-dialog" id="deptModal">

            <div class="dept-modal">


                {{-- HEADER --}}
                <div class="dept-modal-header">


                    <div class="dept-modal-heading">


                        <div class="dept-modal-icon">

                            <i data-lucide="building-2"></i>

                        </div>


                        <div>

                            <h3 id="deptModalTitle">
                                Tambah Departemen
                            </h3>

                            <p id="deptModalDescription">
                                Tambahkan data Departemen baru.
                            </p>

                        </div>

                    </div>


                    <button type="button" class="dept-modal-close" onclick="closeDeptModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                {{-- FORM --}}
                <form id="deptForm" enctype="multipart/form-data">

                    @csrf


                    <input type="hidden" id="deptId">


                    <div class="dept-form-alert" id="deptFormAlert" hidden></div>



                    <div class="dept-modal-body">


                        {{-- KODE --}}
                        <div class="dept-form-group">

                            <label for="deptCode">

                                Kode Departemen

                                <span>*</span>

                            </label>


                            <input type="text" id="deptCode" name="nama_dep" maxlength="255"
                                placeholder="Contoh: 04.03" required>

                        </div>



                        {{-- NAMA --}}
                        <div class="dept-form-group">

                            <label for="deptName">

                                Nama Departemen

                                <span>*</span>

                            </label>


                            <input type="text" id="deptName" name="kode_dep" maxlength="255"
                                placeholder="Contoh: KERJASAMA DAN USAHA BISNIS" required>

                        </div>



                        {{-- ROLE --}}
                        <div class="dept-form-group">

                            <label for="deptRole">

                                Role

                            </label>


                            <input type="number" id="deptRole" name="role" step="1" placeholder="Contoh: 2">


                            <small>
                                Role mengikuti nilai integer pada database legacy.
                            </small>

                        </div>



                        {{-- IMAGE --}}
                        <div class="dept-form-group">

                            <label for="deptImage">

                                Image

                            </label>


                            <div class="dept-image-upload">


                                <div class="dept-image-preview">


                                    <img id="deptImagePreviewImg" src="" alt="Preview image Departemen" hidden>


                                    <div class="dept-image-preview-empty" id="deptImagePreviewEmpty">

                                        <i data-lucide="image-plus"></i>

                                        <span>
                                            Belum ada image
                                        </span>

                                    </div>


                                </div>



                                <div class="dept-image-upload-input">


                                    <input type="file" id="deptImage" name="img"
                                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">


                                    <small>
                                        JPG, JPEG, PNG atau WEBP. Maksimal 2 MB.
                                    </small>


                                    <span class="dept-current-image" id="deptCurrentImage"></span>


                                </div>


                            </div>

                        </div>



                        <div class="dept-modal-note">

                            <i data-lucide="database"></i>

                            <div>

                                <strong>
                                    Database Departemen
                                </strong>

                                <span>
                                    Data akan disimpan langsung ke tabel departemens.
                                </span>

                            </div>

                        </div>


                    </div>



                    {{-- FOOTER --}}
                    <div class="dept-modal-footer">


                        <button type="button" class="dept-cancel-button" onclick="closeDeptModal()">

                            Batal

                        </button>


                        <button type="submit" class="dept-save-button" id="deptSaveButton">

                            <i data-lucide="save"></i>

                            <span id="deptSaveText">

                                Simpan Departemen

                            </span>

                        </button>


                    </div>


                </form>


            </div>

        </dialog>



        {{-- ============================================================
         ACTIVITY MODAL
    ============================================================= --}}

        <dialog class="dept-dialog dept-history-dialog" id="departemenActivityModal">

            <div class="dept-modal">


                {{-- HEADER --}}
                <div class="dept-modal-header">


                    <div class="dept-modal-heading">


                        <div class="dept-modal-icon">

                            <i data-lucide="history"></i>

                        </div>


                        <div>

                            <h3>
                                Riwayat Perubahan Departemen
                            </h3>

                            <p>
                                Riwayat penambahan dan penghapusan data master Departemen.
                            </p>

                        </div>

                    </div>


                    <button type="button" class="dept-modal-close" onclick="closeDepartemenActivityModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                {{-- SUMMARY --}}
                <div class="dept-history-summary">


                    <div class="dept-history-stat">

                        <span>
                            Ditambahkan
                        </span>


                        <strong class="created">

                            <i data-lucide="arrow-up"></i>

                            {{ $departemenTambah }}

                        </strong>

                    </div>



                    <div class="dept-history-stat">

                        <span>
                            Dihapus
                        </span>


                        <strong class="deleted">

                            <i data-lucide="arrow-down"></i>

                            {{ $departemenHapus }}

                        </strong>

                    </div>



                    <div class="dept-history-stat">

                        <span>
                            Perubahan Bersih
                        </span>


                        <strong>

                            @if ($departemenDelta > 0)
                                +{{ $departemenDelta }}
                            @else
                                {{ $departemenDelta }}
                            @endif

                        </strong>

                    </div>


                </div>



                {{-- FILTER --}}
                <div class="dept-history-toolbar">


                    <button type="button" class="active" data-dept-history-filter="all">

                        Semua

                    </button>


                    <button type="button" data-dept-history-filter="created">

                        <i data-lucide="plus"></i>

                        Ditambahkan

                    </button>


                    <button type="button" data-dept-history-filter="deleted">

                        <i data-lucide="trash-2"></i>

                        Dihapus

                    </button>


                </div>



                {{-- TABLE --}}
                <div class="dept-history-body">


                    <div class="table-responsive">

                        <table class="dept-history-table">


                            <thead>

                                <tr>

                                    <th>
                                        No
                                    </th>

                                    <th>
                                        Nama Departemen
                                    </th>

                                    <th>
                                        Kode Departemen
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


                                @forelse ($departemenActivityLogs
                                    as $log)
                                    <tr data-dept-history-row data-action="{{ $log->action }}">


                                        <td class="dept-history-number">

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
                                                <span class="dept-history-status created">

                                                    <i data-lucide="arrow-up"></i>

                                                    Ditambahkan

                                                </span>
                                            @else
                                                <span class="dept-history-status deleted">

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

                                        <td colspan="6" class="dept-empty">

                                            Belum ada riwayat perubahan Departemen.

                                        </td>

                                    </tr>
                                @endforelse


                            </tbody>

                        </table>

                    </div>



                    <div id="deptHistoryFilteredEmpty" class="dept-empty" hidden>

                        Tidak ada riwayat pada kategori ini.

                    </div>


                </div>


            </div>

        </dialog>



        {{-- ============================================================
         TOAST
    ============================================================= --}}

        <div class="dept-toast-container" id="deptToastContainer"></div>


    </section>

@endsection



@push('scripts')
    <script>
        window.DEPARTEMEN_CRUD = {

            store: @json(route('master.data_departemen.store')),

            update: @json(url('/master-data/departemen/__ID__')),

            destroy: @json(url('/master-data/departemen/__ID__'))

        };
    </script>


    <script src="{{ asset('js/pages/master/departement.js') }}"></script>
@endpush
