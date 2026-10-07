@extends('layouts.main')

@section('title', 'Kode Aktiva')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/master/kode_aktiva.css') }}">
@endpush


@section('content')

    @php

        $aktivaRows = collect($aktivas ?? []);

        $activityRows = collect($aktivaActivityLogs ?? []);

    @endphp


    <section class="content aktiva-page">


        {{-- =====================================================
         HERO
    ====================================================== --}}

        <section class="aktiva-hero">

            <div class="aktiva-hero-overlay"></div>


            <div class="aktiva-hero-top">

                <div>

                    <div class="aktiva-breadcrumb">

                        <a href="{{ route('dashboard') }}">

                            <i data-lucide="house"></i>

                        </a>


                        <i data-lucide="chevron-right"></i>

                        <span>
                            Master Data
                        </span>

                        <i data-lucide="chevron-right"></i>

                        <strong>
                            Kode Aktiva
                        </strong>

                    </div>


                    <h1>
                        Kode Aktiva
                    </h1>


                    <p>
                        Kelola klasifikasi dan kode aktiva
                        Perumda Tirta Kencana Kota Samarinda.
                    </p>

                </div>


                <div class="aktiva-date-card">

                    <i data-lucide="calendar-days"></i>

                    <div>

                        <strong id="aktivaDate">
                            -
                        </strong>

                        <span id="aktivaTime">
                            -
                        </span>

                    </div>

                </div>

            </div>



            {{-- =====================================================
             KPI
        ====================================================== --}}

            <div class="aktiva-kpi-grid">


                <button type="button" class="aktiva-kpi-card clickable" id="aktivaHistoryButton">

                    <span class="aktiva-kpi-icon">

                        <i data-lucide="barcode"></i>

                    </span>


                    <div>

                        <small>
                            Total Kode Aktiva
                        </small>


                        <section class="aktiva-total-line">

                            <strong>

                                {{ number_format($totalAktiva ?? 0, 0, ',', '.') }}

                            </strong>


                            <span
                                class="
                                {{ ($aktivaDelta ?? 0) < 0 ? 'negative' : 'positive' }}
                            ">

                                @if (($aktivaDelta ?? 0) > 0)
                                    ↑ +{{ $aktivaDelta }}
                                @elseif (($aktivaDelta ?? 0) < 0)
                                    ↓ {{ $aktivaDelta }}
                                @else
                                    — 0
                                @endif

                            </span>

                        </section>


                        <p>
                            perubahan tercatat
                        </p>

                    </div>

                </button>



                <article class="aktiva-kpi-card">

                    <span class="aktiva-kpi-icon">

                        <i data-lucide="layers-3"></i>

                    </span>


                    <div>

                        <small>
                            Golongan Aktiva
                        </small>


                        <strong>

                            {{ number_format($totalGolongan ?? 0, 0, ',', '.') }}

                        </strong>


                        <p>
                            golongan terdaftar
                        </p>

                    </div>

                </article>



                <article class="aktiva-kpi-card">

                    <span class="aktiva-kpi-icon">

                        <i data-lucide="boxes"></i>

                    </span>


                    <div>

                        <small>
                            Kategori / KIB
                        </small>


                        <strong>

                            {{ number_format($totalKib ?? 0, 0, ',', '.') }}

                        </strong>


                        <p>
                            kategori aktiva
                        </p>

                    </div>

                </article>

            </div>

        </section>



        {{-- =====================================================
         FILTER CARD
    ====================================================== --}}

        <section class="aktiva-card aktiva-filter-card">

            <div class="aktiva-filter-header">

                <div>

                    <h2>
                        Daftar Kode Aktiva
                    </h2>


                    <p>
                        Data langsung dari tabel
                        <strong>aktivas</strong>.
                    </p>

                </div>


                <button type="button" class="aktiva-primary-button" id="addAktivaButton">

                    <i data-lucide="plus"></i>

                    Tambah Kode Aktiva

                </button>

            </div>



            <div class="aktiva-filter-grid">


                <label class="aktiva-search">

                    <i data-lucide="search"></i>


                    <input type="search" id="aktivaSearch"
                        placeholder="
                        Cari kode atau nama aktiva...
                    ">

                </label>



                <select id="aktivaGolFilter">

                    <option value="">
                        Semua Golongan
                    </option>


                    @foreach ($golonganAktiva ?? [] as $gol)
                        <option value="{{ $gol }}">

                            {{ $gol }}

                        </option>
                    @endforeach

                </select>



                <select id="aktivaKibFilter">

                    <option value="">
                        Semua Kategori / KIB
                    </option>


                    @foreach ($kibAktiva ?? [] as $kib)
                        <option value="{{ $kib }}">

                            {{ $kib }}

                        </option>
                    @endforeach

                </select>



                <button type="button" class="aktiva-outline-button" id="resetAktivaButton">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>



                <button type="button" class="aktiva-outline-button" id="exportAktivaButton">

                    <i data-lucide="download"></i>

                    Export

                </button>

            </div>

        </section>



        {{-- =====================================================
         TABLE
    ====================================================== --}}

        <section class="aktiva-card aktiva-table-card">

            <div class="table-responsive">

                <table class="aktiva-table" id="aktivaTable">

                    <thead>

                        <tr>

                            <th class="col-no">
                                No
                            </th>

                            <th>
                                Kode Aktiva
                            </th>

                            <th>
                                Nama Aktiva
                            </th>

                            <th>
                                Golongan Aktiva
                            </th>

                            <th>
                                Kategori / KIB
                            </th>

                            <th>
                                Dibuat
                            </th>

                            <th class="col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        @foreach ($aktivaRows as $item)
                            <tr data-row data-id="{{ $item->id }}" data-kode="{{ $item->kode ?? '' }}"
                                data-aktiva="{{ $item->aktiva ?? '' }}" data-gol="{{ $item->gol ?? '' }}"
                                data-kib="{{ $item->kib ?? '' }}" data-created-at="{{ $item->created_at ?? '' }}">

                                <td class="aktiva-number">
                                    -
                                </td>


                                <td>

                                    <span class="aktiva-code">

                                        {{ $item->kode ?: '—' }}

                                    </span>

                                </td>


                                <td>

                                    <strong class="aktiva-name">

                                        {{ $item->aktiva ?: '—' }}

                                    </strong>

                                </td>


                                <td>

                                    <span class="aktiva-badge">

                                        {{ $item->gol ?: '—' }}

                                    </span>

                                </td>


                                <td>

                                    {{ $item->kib ?: '—' }}

                                </td>


                                <td>

                                    @if (!empty($item->created_at))
                                        {{ \Carbon\Carbon::parse($item->created_at)->locale('id')->translatedFormat('d M Y') }}
                                    @else
                                        <span class="aktiva-muted">
                                            —
                                        </span>
                                    @endif

                                </td>


                                <td>

                                    <div class="aktiva-actions">

                                        <button type="button" class="view" data-action="view" title="Lihat">

                                            <i data-lucide="eye"></i>

                                        </button>


                                        <button type="button" class="edit" data-action="edit" title="Edit">

                                            <i data-lucide="square-pen"></i>

                                        </button>


                                        <button type="button" class="delete" data-action="delete" title="Hapus">

                                            <i data-lucide="trash-2"></i>

                                        </button>

                                    </div>

                                </td>

                            </tr>
                        @endforeach



                        <tr id="aktivaEmptyRow" hidden>

                            <td colspan="7" class="aktiva-empty">

                                Data Kode Aktiva
                                tidak ditemukan.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>



            <div class="aktiva-table-footer">

                <span id="aktivaTableInfo">

                    Menampilkan data...

                </span>


                <div class="aktiva-pagination-wrap">

                    <select id="aktivaPageSize">

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


                    <div id="aktivaPagination" class="aktiva-pagination"></div>

                </div>

            </div>

        </section>



        {{-- =====================================================
         CRUD MODAL
    ====================================================== --}}

        <dialog class="aktiva-modal" id="aktivaModal">

            <div class="aktiva-modal-box">


                <header>

                    <div>

                        <span>
                            MASTER DATA
                        </span>


                        <h3 id="aktivaModalTitle">

                            Tambah Kode Aktiva

                        </h3>


                        <p id="aktivaModalDescription">

                            Tambahkan klasifikasi
                            aktiva baru.

                        </p>

                    </div>


                    <button type="button" id="closeAktivaModal">

                        <i data-lucide="x"></i>

                    </button>

                </header>



                <form id="aktivaForm">

                    @csrf


                    <div class="aktiva-modal-body">


                        <div id="aktivaFormAlert" class="aktiva-form-alert" hidden></div>



                        <div class="aktiva-form-grid">


                            <div class="aktiva-field">

                                <label for="aktivaKode">

                                    Kode Aktiva *

                                </label>


                                <input type="text" id="aktivaKode" name="kode" maxlength="255" required
                                    placeholder="Contoh: 31.03.20">


                                <small data-error="kode"></small>

                            </div>



                            <div class="aktiva-field">

                                <label for="aktivaName">

                                    Nama Aktiva *

                                </label>


                                <input type="text" id="aktivaName" name="aktiva" maxlength="255" required
                                    placeholder="
                                    Contoh:
                                    Pembangkit Tenaga Listrik
                                ">


                                <small data-error="aktiva"></small>

                            </div>



                            <div class="aktiva-field">

                                <label for="aktivaGol">

                                    Golongan Aktiva

                                </label>


                                <input type="text" id="aktivaGol" name="gol" maxlength="255"
                                    list="golonganAktivaList"
                                    placeholder="
                                    Contoh:
                                    INSTALASI POMPA
                                ">


                                <datalist id="golonganAktivaList">

                                    @foreach ($golonganAktiva ?? [] as $gol)
                                        <option value="{{ $gol }}"></option>
                                    @endforeach

                                </datalist>


                                <small data-error="gol"></small>

                            </div>



                            <div class="aktiva-field">

                                <label for="aktivaKib">

                                    Kategori / KIB

                                </label>


                                <input type="text" id="aktivaKib" name="kib" maxlength="255"
                                    list="kibAktivaList"
                                    placeholder="
                                    Contoh:
                                    KIB B - PERALATAN DAN MESIN
                                ">


                                <datalist id="kibAktivaList">

                                    @foreach ($kibAktiva ?? [] as $kib)
                                        <option value="{{ $kib }}"></option>
                                    @endforeach

                                </datalist>


                                <small data-error="kib"></small>

                            </div>

                        </div>

                    </div>



                    <footer>

                        <button type="button" class="aktiva-cancel-button" id="cancelAktivaButton">

                            Tutup

                        </button>


                        <button type="submit" class="aktiva-save-button" id="saveAktivaButton">

                            <i data-lucide="save"></i>

                            <span>
                                Simpan
                            </span>

                        </button>

                    </footer>

                </form>

            </div>

        </dialog>



        {{-- =====================================================
         HISTORY MODAL
    ====================================================== --}}

        <dialog class="aktiva-modal" id="aktivaHistoryModal">

            <div class="aktiva-modal-box history">


                <header>

                    <div>

                        <span>
                            AKTIVITAS MASTER DATA
                        </span>


                        <h3>
                            Riwayat Perubahan
                            Kode Aktiva
                        </h3>


                        <p>
                            Penambahan dan penghapusan
                            data Kode Aktiva.
                        </p>

                    </div>


                    <button type="button" id="closeAktivaHistory">

                        <i data-lucide="x"></i>

                    </button>

                </header>



                <div class="aktiva-modal-body">


                    <div class="aktiva-history-summary">

                        <article>

                            <span>
                                Ditambahkan
                            </span>

                            <strong class="green">

                                ↑
                                {{ $aktivaTambah ?? 0 }}

                            </strong>

                        </article>


                        <article>

                            <span>
                                Dihapus
                            </span>

                            <strong class="red">

                                ↓
                                {{ $aktivaHapus ?? 0 }}

                            </strong>

                        </article>


                        <article>

                            <span>
                                Perubahan Bersih
                            </span>

                            <strong>

                                {{ ($aktivaDelta ?? 0) > 0 ? '+' : '' }}

                                {{ $aktivaDelta ?? 0 }}

                            </strong>

                        </article>

                    </div>



                    <div class="table-responsive">

                        <table class="aktiva-history-table">

                            <thead>

                                <tr>

                                    <th>
                                        No
                                    </th>

                                    <th>
                                        Nama Aktiva
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Waktu
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                @forelse ($activityRows
                                                        as $index => $log)
                                    <tr>

                                        <td>
                                            {{ $index + 1 }}
                                        </td>


                                        <td>

                                            {{ $log->record_name ?? '—' }}

                                        </td>


                                        <td>

                                            @if (($log->action ?? '') === 'created')
                                                <span
                                                    class="
                                                    history-badge
                                                    created
                                                ">

                                                    Ditambahkan

                                                </span>
                                            @else
                                                <span
                                                    class="
                                                    history-badge
                                                    deleted
                                                ">

                                                    Dihapus

                                                </span>
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

                                        <td colspan="4">

                                            Belum ada
                                            riwayat perubahan.

                                        </td>

                                    </tr>
                                @endforelse

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </dialog>



        <div class="aktiva-toast" id="aktivaToast" hidden>

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


    <script src="{{ asset('js/pages/master/kode_aktiva.js') }}"></script>
@endpush
