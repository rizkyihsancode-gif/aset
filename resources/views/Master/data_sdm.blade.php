@extends('layouts.main')

@section('title', 'SDM Pendukung')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/sdm.css') }}">
@endpush



@section('content')

    <section class="content sdm-page">


        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="sdm-hero">

            <div class="sdm-hero-overlay"></div>


            <div class="sdm-hero-content">


                <div class="sdm-hero-top">


                    <div>


                        <nav class="sdm-breadcrumb">

                            <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                                <i data-lucide="house"></i>
                            </a>


                            <i data-lucide="chevron-right"></i>


                            <span>
                                Master Data
                            </span>


                            <i data-lucide="chevron-right"></i>


                            <strong>
                                SDM Pendukung
                            </strong>

                        </nav>



                        <div class="sdm-heading">

                            <h1>
                                SDM Pendukung
                            </h1>


                            <p>
                                Kelola data SDM pendukung yang terlibat
                                dalam pengelolaan aset Perumda Tirta Kencana
                                Kota Samarinda.
                            </p>

                        </div>


                    </div>



                    <div class="sdm-date-card">


                        <div class="sdm-date-icon">

                            <i data-lucide="calendar-days"></i>

                        </div>


                        <div>

                            <strong id="sdmCurrentDate">
                                -
                            </strong>

                            <span id="sdmCurrentTime">
                                -
                            </span>

                        </div>


                    </div>


                </div>



                {{-- KPI --}}
                <div class="sdm-kpi-grid">


                    {{-- TOTAL SDM --}}
                    <div class="sdm-kpi-card sdm-kpi-clickable" id="sdmTotalActivityCard" role="button" tabindex="0">


                        <div class="sdm-kpi-icon">

                            <i data-lucide="users-round"></i>

                        </div>


                        <div class="sdm-kpi-content">

                            <span>
                                Total SDM Pendukung
                            </span>


                            <div class="sdm-kpi-value">

                                <strong>

                                    {{ number_format($totalSdm, 0, ',', '.') }}

                                </strong>


                                @if ($sdmDelta > 0)
                                    <small class="sdm-delta sdm-delta-up">

                                        <i data-lucide="arrow-up"></i>

                                        +{{ $sdmDelta }}

                                    </small>
                                @elseif ($sdmDelta < 0)
                                    <small class="sdm-delta sdm-delta-down">

                                        <i data-lucide="arrow-down"></i>

                                        {{ $sdmDelta }}

                                    </small>
                                @else
                                    <small class="sdm-delta sdm-delta-neutral">

                                        <i data-lucide="minus"></i>

                                        0

                                    </small>
                                @endif

                            </div>


                            <p>
                                perubahan tercatat
                            </p>

                        </div>


                    </div>



                    {{-- DEPARTEMEN --}}
                    <div class="sdm-kpi-card">

                        <div class="sdm-kpi-icon">

                            <i data-lucide="building-2"></i>

                        </div>


                        <div class="sdm-kpi-content">

                            <span>
                                Total Departemen
                            </span>


                            <strong>

                                {{ number_format($totalDepartemen, 0, ',', '.') }}

                            </strong>


                            <p>
                                master departemen
                            </p>

                        </div>

                    </div>



                    {{-- DIVISI --}}
                    <div class="sdm-kpi-card">

                        <div class="sdm-kpi-icon">

                            <i data-lucide="network"></i>

                        </div>


                        <div class="sdm-kpi-content">

                            <span>
                                Total Divisi
                            </span>


                            <strong>

                                {{ number_format($totalDivisi, 0, ',', '.') }}

                            </strong>


                            <p>
                                master divisi
                            </p>

                        </div>

                    </div>



                    {{-- UPDATE --}}
                    <div class="sdm-kpi-card">

                        <div class="sdm-kpi-icon">

                            <i data-lucide="clock-3"></i>

                        </div>


                        <div class="sdm-kpi-content">

                            <span>
                                Update Terakhir
                            </span>


                            <strong class="sdm-kpi-text">

                                {{ $updateTerakhirLabel }}

                            </strong>


                            <p>
                                {{ $updateTerakhirDetail }}
                            </p>

                        </div>

                    </div>


                </div>


            </div>

        </section>



        {{-- ============================================================
         FILTER
    ============================================================= --}}
        <section class="sdm-card sdm-filter-card">


            <div class="sdm-filter-header">


                <h3>
                    Daftar SDM Pendukung
                </h3>


                <button type="button" class="sdm-add-button" onclick="openSdmModal()">

                    <i data-lucide="plus"></i>

                    Tambah SDM Pendukung

                </button>


            </div>



            <div class="sdm-filter-grid">


                <div class="sdm-search">

                    <i data-lucide="search"></i>


                    <input type="search" id="sdmSearch" placeholder="Cari nama, NIP, jabatan, departemen, atau divisi...">

                </div>



                <select id="sdmDepartemen">

                    <option value="">
                        Semua Departemen
                    </option>


                    @foreach ($departemens as $departemen)
                        <option value="{{ $departemen->id }}">

                            {{ $departemen->kode_dep }}

                        </option>
                    @endforeach

                </select>



                <select id="sdmDivisi">

                    <option value="">
                        Semua Divisi
                    </option>


                    @foreach ($divisis as $divisi)
                        <option value="{{ $divisi->id }}" data-id-dep="{{ $divisi->id_dep }}">

                            {{ $divisi->nama_div }}

                        </option>
                    @endforeach

                </select>



                <button type="button" class="sdm-reset-button" onclick="resetSdmFilter()">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>



                <button type="button" class="sdm-export-button" onclick="exportSdmCSV()">

                    <i data-lucide="download"></i>

                    Export

                </button>


            </div>


        </section>



        {{-- ============================================================
         TABLE
    ============================================================= --}}
        <section class="sdm-card sdm-table-card">


            <div class="table-responsive">


                <table class="sdm-table" id="sdmTable">


                    <thead>

                        <tr>

                            <th>No</th>

                            <th>Nama Lengkap</th>

                            <th>NIP / NIPP</th>

                            <th>Jabatan</th>

                            <th>Departemen</th>

                            <th>Divisi</th>

                            <th>Dibuat</th>

                            <th>Aksi</th>

                        </tr>

                    </thead>



                    <tbody>


                        @forelse ($sdms as $item)
                            <tr data-record data-id="{{ $item->id }}" data-nama="{{ $item->nama_sdm }}"
                                data-nip="{{ $item->nip }}" data-id-jabat="{{ $item->id_jabat }}"
                                data-jabatan="{{ $item->jabat }}" data-id-div="{{ $item->id_div }}"
                                data-id-dep="{{ $item->id_dep ?? '' }}" data-divisi="{{ $item->nama_div }}"
                                data-departemen="{{ $item->nama_departemen }}"
                                data-created-at="{{ $item->created_at ?? '' }}"
                                data-updated-at="{{ $item->updated_at ?? '' }}">


                                <td class="sdm-number"></td>


                                <td>

                                    <div class="sdm-name-cell">

                                        <div class="sdm-avatar">

                                            {{ strtoupper(mb_substr($item->nama_sdm, 0, 1)) }}

                                        </div>


                                        <strong>

                                            {{ $item->nama_sdm }}

                                        </strong>

                                    </div>

                                </td>


                                <td class="sdm-nip">

                                    {{ $item->nip }}

                                </td>


                                <td>

                                    {{ $item->jabat }}

                                </td>


                                <td>

                                    {{ $item->nama_departemen }}

                                </td>


                                <td>

                                    {{ $item->nama_div }}

                                </td>


                                <td>

                                    @if (!empty($item->created_at))
                                        {{ \Carbon\Carbon::parse($item->created_at)->locale('id')->translatedFormat('d M Y') }}
                                    @else
                                        —
                                    @endif

                                </td>


                                <td>

                                    <div class="sdm-actions">


                                        <button type="button" class="view" data-action="view">

                                            <i data-lucide="eye"></i>

                                        </button>


                                        <button type="button" class="edit" data-action="edit">

                                            <i data-lucide="square-pen"></i>

                                        </button>


                                        <button type="button" class="delete" data-action="delete">

                                            <i data-lucide="trash-2"></i>

                                        </button>


                                    </div>

                                </td>


                            </tr>


                        @empty

                            <tr id="sdmServerEmpty">

                                <td colspan="8" class="sdm-empty">

                                    Belum ada data SDM Pendukung.

                                </td>

                            </tr>
                        @endforelse



                        <tr id="sdmEmptyRow" hidden>

                            <td colspan="8" class="sdm-empty">

                                Data SDM Pendukung tidak ditemukan.

                            </td>

                        </tr>


                    </tbody>


                </table>


            </div>



            <div class="sdm-table-footer">


                <span id="sdmTableInfo">
                    -
                </span>


                <div class="sdm-pagination-area">


                    <select id="sdmPageSize">

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


                    <nav class="sdm-pagination" id="sdmPagination"></nav>


                </div>


            </div>


        </section>



        {{-- ============================================================
         BOTTOM
    ============================================================= --}}
        <div class="sdm-bottom-grid">


            {{-- DISTRIBUSI --}}
            <section class="sdm-card">


                <div class="sdm-bottom-header">

                    <h3>
                        Distribusi SDM per Divisi
                    </h3>

                </div>


                <div class="sdm-distribution-content">


                    <div class="sdm-chart-wrap">

                        <canvas id="sdmDistributionChart"></canvas>


                        <div class="sdm-chart-center">

                            <strong>
                                {{ $totalSdm }}
                            </strong>

                            <span>
                                SDM
                            </span>

                        </div>

                    </div>



                    <div class="sdm-legend" id="sdmLegend">

                        @php
                            $colors = [
                                '#3389ee',
                                '#55a8f1',
                                '#4fc184',
                                '#f6c85f',
                                '#ff9024',
                                '#ef6b73',
                                '#7c63e8',
                                '#9aa9bb',
                            ];
                        @endphp


                        @foreach ($distribusiSdm as $index => $item)
                            @php

                                $color = $colors[$index % count($colors)];

                            @endphp


                            <div data-count="{{ $item->total }}" data-label="{{ $item->nama_div }}"
                                data-color="{{ $color }}">

                                <span class="sdm-dot" style="--sdm-dot: {{ $color }}"></span>


                                <span class="sdm-legend-name">

                                    {{ $item->nama_div }}

                                </span>


                                <strong>

                                    {{ $item->total }}

                                </strong>


                                <small>

                                    {{ number_format($item->persentase, 1, ',', '.') }}%

                                </small>

                            </div>
                        @endforeach


                    </div>


                </div>


            </section>



            {{-- TERBARU --}}
            <section class="sdm-card">


                <div class="sdm-bottom-header">

                    <h3>
                        SDM Pendukung Terbaru
                    </h3>


                    <button type="button" class="sdm-see-all" onclick="scrollToSdmTable()">

                        Lihat Semua

                    </button>

                </div>



                <div class="table-responsive">


                    <table class="sdm-latest-table">


                        <thead>

                            <tr>

                                <th>No</th>

                                <th>Nama</th>

                                <th>Jabatan</th>

                                <th>Divisi</th>

                                <th>Tanggal Dibuat</th>

                            </tr>

                        </thead>


                        <tbody>


                            @forelse ($sdmTerbaru as $item)
                                <tr>

                                    <td>
                                        {{ $loop->iteration }}
                                    </td>

                                    <td>
                                        {{ $item->nama_sdm }}
                                    </td>

                                    <td>
                                        {{ $item->jabat }}
                                    </td>

                                    <td>
                                        {{ $item->nama_div }}
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

                                    <td colspan="5" class="sdm-empty">

                                        Belum ada data SDM terbaru.

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
        <dialog class="sdm-dialog" id="sdmModal">


            <div class="sdm-modal-dialog">


                <div class="sdm-modal-header">


                    <div>

                        <h3 id="sdmModalTitle">
                            Tambah SDM Pendukung
                        </h3>

                        <p id="sdmModalDescription">
                            Tambahkan data SDM Pendukung.
                        </p>

                    </div>


                    <button type="button" onclick="closeSdmModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                <form id="sdmForm">

                    @csrf


                    <div class="sdm-form-alert" id="sdmFormAlert" hidden></div>


                    <div class="sdm-modal-body">


                        <div class="sdm-form-group">

                            <label>
                                Nama Lengkap
                            </label>

                            <input type="text" id="sdmName" name="nama_sdm" maxlength="255" required>

                        </div>



                        <div class="sdm-form-group">

                            <label>
                                NIP / NIPP
                            </label>

                            <input type="text" id="sdmNip" name="nip" maxlength="255" required>

                        </div>



                        <div class="sdm-form-group">

                            <label>
                                Jabatan
                            </label>


                            <select id="sdmJabatan" name="id_jabat" required>

                                <option value="">
                                    Pilih Jabatan
                                </option>


                                @foreach ($jabatans as $jabatan)
                                    <option value="{{ $jabatan->id }}">

                                        {{ $jabatan->jabat }}

                                    </option>
                                @endforeach

                            </select>

                        </div>



                        <div class="sdm-form-group">

                            <label>
                                Departemen
                            </label>


                            <select id="sdmFormDepartemen">

                                <option value="">
                                    Pilih Departemen
                                </option>


                                @foreach ($departemens as $departemen)
                                    <option value="{{ $departemen->id }}">

                                        {{ $departemen->kode_dep }}

                                    </option>
                                @endforeach

                            </select>

                        </div>



                        <div class="sdm-form-group">

                            <label>
                                Divisi
                            </label>


                            <select id="sdmFormDivisi" name="id_div" required>

                                <option value="">
                                    Pilih Divisi
                                </option>


                                @foreach ($divisis as $divisi)
                                    <option value="{{ $divisi->id }}" data-id-dep="{{ $divisi->id_dep }}">

                                        {{ $divisi->nama_div }}

                                    </option>
                                @endforeach

                            </select>

                        </div>



                        <div class="sdm-modal-note">

                            <i data-lucide="database"></i>

                            <span>
                                Data disimpan langsung ke tabel
                                <code>sdms</code>.
                                Departemen ditentukan melalui Divisi.
                            </span>

                        </div>


                    </div>



                    <div class="sdm-modal-footer">


                        <button type="button" class="sdm-cancel-button" onclick="closeSdmModal()">

                            Batal

                        </button>


                        <button type="submit" class="sdm-save-button" id="sdmSaveButton">

                            <i data-lucide="save"></i>

                            <span id="sdmSaveText">
                                Simpan SDM
                            </span>

                        </button>


                    </div>


                </form>


            </div>


        </dialog>



        {{-- ============================================================
         HISTORY MODAL
    ============================================================= --}}
        <dialog class="sdm-dialog sdm-history-dialog" id="sdmActivityModal">


            <div class="sdm-modal-dialog">


                <div class="sdm-modal-header">


                    <div>

                        <h3>
                            Riwayat Perubahan SDM Pendukung
                        </h3>

                        <p>
                            Riwayat penambahan dan penghapusan SDM.
                        </p>

                    </div>


                    <button type="button" onclick="closeSdmActivityModal()">

                        <i data-lucide="x"></i>

                    </button>


                </div>



                <div class="sdm-history-summary">


                    <div>

                        <span>
                            Ditambahkan
                        </span>

                        <strong class="created">
                            ↑ {{ $sdmTambah }}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Dihapus
                        </span>

                        <strong class="deleted">
                            ↓ {{ $sdmHapus }}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Perubahan Bersih
                        </span>

                        <strong>

                            @if ($sdmDelta > 0)
                                +{{ $sdmDelta }}
                            @else
                                {{ $sdmDelta }}
                            @endif

                        </strong>

                    </div>


                </div>



                <div class="sdm-history-toolbar">

                    <button class="active" data-sdm-history-filter="all" type="button">
                        Semua
                    </button>

                    <button data-sdm-history-filter="created" type="button">
                        Ditambahkan
                    </button>

                    <button data-sdm-history-filter="deleted" type="button">
                        Dihapus
                    </button>

                </div>



                <div class="table-responsive">


                    <table class="sdm-history-table">


                        <thead>

                            <tr>

                                <th>No</th>
                                <th>Nama SDM</th>
                                <th>NIP</th>
                                <th>Status</th>
                                <th>Tanggal Data</th>
                                <th>Waktu Aktivitas</th>

                            </tr>

                        </thead>


                        <tbody>


                            @foreach ($sdmActivityLogs as $log)
                                <tr data-sdm-history-row data-action="{{ $log->action }}">

                                    <td class="sdm-history-number">
                                        {{ $loop->iteration }}
                                    </td>

                                    <td>
                                        {{ $log->record_name ?: '—' }}
                                    </td>

                                    <td>
                                        {{ $log->record_code ?: '—' }}
                                    </td>

                                    <td>

                                        <span
                                            class="
                                            sdm-history-status
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
                            @endforeach


                        </tbody>


                    </table>


                </div>


            </div>


        </dialog>



        <div class="sdm-toast-container" id="sdmToastContainer"></div>


    </section>

@endsection



@push('scripts')
    <script>
        window.SDM_CRUD = {

            store: @json(route('master.data_sdm.store')),

            update: @json(url('/master-data/sdm-pendukung/__ID__')),

            destroy: @json(url('/master-data/sdm-pendukung/__ID__'))

        };
    </script>


    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>

    <script src="{{ asset('js/pages/sdm.js') }}"></script>
@endpush
