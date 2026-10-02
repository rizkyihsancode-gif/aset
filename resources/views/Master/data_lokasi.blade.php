@extends('layouts.main')

@section('title', 'Lokasi')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/lokasi.css') }}">
@endpush

@section('content')

    @php

        $lokasiRows = collect($lokasis ?? []);

        $wilayahRows = collect($wilayahs ?? []);

        $activityRows = collect($lokasiActivityLogs ?? []);

        $latestRows = collect($lokasiTerbaru ?? $lokasiRows->take(5));

        $totalLokasiValue = (int) ($totalLokasi ?? $lokasiRows->count());

        $totalWilayahValue = (int) ($totalWilayah ?? $lokasiRows->pluck('wilayah_id')->filter()->unique()->count());

        $koordinatValue = (int) ($lokasiDenganKoordinat ?? 0);

        $deltaValue = (int) ($lokasiDelta ?? 0);

        $tambahValue = (int) ($lokasiTambah ?? 0);

        $hapusValue = (int) ($lokasiHapus ?? 0);

        $lastUpdateLabel = $updateTerakhirLabel ?? 'Belum ada data';

        $lastUpdateDetail = $updateTerakhirDetail ?? 'Belum ada perubahan';

        /*
    |--------------------------------------------------------------------------
    | DISTRIBUSI PER WILAYAH
    |--------------------------------------------------------------------------
    */

        $distribution = $lokasiRows

            ->groupBy(fn($row) => trim((string) ($row->nama_wilayah ?? '')) ?: 'Belum terhubung')

            ->map(fn($items) => $items->count())

            ->sortDesc();

        $distributionColors = [
            '#2f80ed',
            '#56a8f5',
            '#42b883',
            '#f2b84b',
            '#f28b30',

            '#7467e8',
            '#96a6b8',
            '#27b5b1',
            '#e36c8d',
            '#6b8afd',
        ];

        /*
    |--------------------------------------------------------------------------
    | RESOLVER IMAGE
    |--------------------------------------------------------------------------
    |
    | Dibuat fleksibel karena data lama kemungkinan menyimpan
    | filename/path dengan format berbeda.
    |
    */

        $resolveLokasiImage = function ($img) {
            if (empty($img)) {
                return null;
            }

            $raw = trim(str_replace('\\', '/', (string) $img));

            if (\Illuminate\Support\Str::startsWith($raw, ['http://', 'https://', 'data:'])) {
                return $raw;
            }

            $base = basename($raw);

            $candidates = [];

            if (!str_contains($raw, '..')) {
                $candidates[] = ltrim($raw, '/');
            }

            $candidates = array_merge(
                $candidates,

                [
                    'uploads/lokasi/' . $base,

                    'assets/img/lokasi/' . $base,

                    'assets/img/' . $base,

                    'images/lokasi/' . $base,

                    'img/lokasi/' . $base,
                ],
            );

            foreach (array_unique($candidates) as $candidate) {
                if ($candidate !== '' && file_exists(public_path($candidate))) {
                    return asset($candidate);
                }
            }

            return null;
        };
    @endphp



    <section class="content lokasi-page">

        {{-- =========================================================
         HERO
    ========================================================== --}}

        <section class="lokasi-hero">

            <div class="lokasi-hero-overlay"></div>


            <div class="lokasi-hero-top">

                <div>

                    <nav class="lokasi-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Dashboard">

                            <i data-lucide="house"></i>

                        </a>


                        <i data-lucide="chevron-right"></i>


                        <span>
                            Master Data
                        </span>


                        <i data-lucide="chevron-right"></i>


                        <strong aria-current="page">
                            Lokasi
                        </strong>

                    </nav>



                    <div class="lokasi-heading">

                        <h1>
                            Lokasi
                        </h1>

                        <p>
                            Kelola data lokasi aset
                            Perumda Tirta Kencana
                            Kota Samarinda.
                        </p>

                    </div>

                </div>



                <div class="lokasi-date-card">

                    <div class="lokasi-date-icon">

                        <i data-lucide="calendar-days"></i>

                    </div>


                    <div>

                        <strong id="lokasiCurrentDate">
                            -
                        </strong>

                        <span id="lokasiCurrentTime">
                            -
                        </span>

                    </div>

                </div>

            </div>



            {{-- =========================================================
             KPI
        ========================================================== --}}

            <div class="lokasi-kpi-grid">


                {{-- TOTAL LOKASI --}}

                <button type="button"
                    class="
                    lokasi-kpi-card
                    lokasi-kpi-clickable
                "
                    id="lokasiHistoryTrigger" title="Lihat riwayat perubahan Lokasi">

                    <div class="lokasi-kpi-icon">

                        <i data-lucide="map-pin"></i>

                    </div>


                    <div class="lokasi-kpi-content">

                        <span>
                            Total Lokasi
                        </span>


                        <div class="lokasi-kpi-value">

                            <strong>

                                {{ number_format($totalLokasiValue, 0, ',', '.') }}

                            </strong>


                            <small
                                class="
                                {{ $deltaValue < 0 ? 'is-negative' : ($deltaValue === 0 ? 'is-neutral' : '') }}
                            ">

                                <i
                                    data-lucide="
                                    {{ $deltaValue < 0 ? 'arrow-down' : ($deltaValue > 0 ? 'arrow-up' : 'minus') }}
                                "></i>


                                {{ $deltaValue > 0 ? '+' : '' }}

                                {{ $deltaValue }}

                            </small>

                        </div>


                        <p>
                            perubahan tercatat
                        </p>

                    </div>



                    <div class="lokasi-sparkline" aria-hidden="true">

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

                </button>



                {{-- TOTAL WILAYAH --}}

                <article class="lokasi-kpi-card">

                    <div class="lokasi-kpi-icon">

                        <i data-lucide="map"></i>

                    </div>


                    <div class="lokasi-kpi-content">

                        <span>
                            Total Wilayah
                        </span>


                        <strong>

                            {{ number_format($totalWilayahValue, 0, ',', '.') }}

                        </strong>


                        <p>
                            wilayah terhubung
                        </p>

                    </div>


                    <div class="lokasi-kpi-watermark">

                        <i data-lucide="network"></i>

                    </div>

                </article>



                {{-- KOORDINAT --}}

                <article class="lokasi-kpi-card">

                    <div class="lokasi-kpi-icon">

                        <i data-lucide="crosshair"></i>

                    </div>


                    <div class="lokasi-kpi-content">

                        <span>
                            Lokasi Berkoordinat
                        </span>


                        <strong>

                            {{ number_format($koordinatValue, 0, ',', '.') }}

                        </strong>


                        <p>
                            latitude & longitude tersedia
                        </p>

                    </div>


                    <div class="lokasi-kpi-watermark">

                        <i data-lucide="navigation"></i>

                    </div>

                </article>



                {{-- UPDATE --}}

                <article class="lokasi-kpi-card">

                    <div class="lokasi-kpi-icon">

                        <i data-lucide="clock-3"></i>

                    </div>


                    <div class="lokasi-kpi-content">

                        <span>
                            Update Terakhir
                        </span>


                        <strong class="lokasi-kpi-text">

                            {{ $lastUpdateLabel }}

                        </strong>


                        <p>

                            {{ $lastUpdateDetail }}

                        </p>

                    </div>


                    <div class="lokasi-kpi-watermark">

                        <i data-lucide="calendar-check-2"></i>

                    </div>

                </article>

            </div>

        </section>



        {{-- =========================================================
         FILTER
    ========================================================== --}}

        <section class="
            lokasi-card
            lokasi-filter-card
        ">

            <div class="lokasi-filter-header">

                <div>

                    <h3>
                        Daftar Lokasi
                    </h3>

                    <p>
                        Data langsung dari tabel
                        <strong>lokasis</strong>.
                    </p>

                </div>


                <button type="button" class="lokasi-add-button" id="lokasiAddButton">

                    <i data-lucide="plus"></i>

                    Tambah Lokasi

                </button>

            </div>



            <div class="lokasi-filter-grid">


                {{-- SEARCH --}}

                <label class="lokasi-search" for="lokasiSearch">

                    <i data-lucide="search"></i>


                    <input id="lokasiSearch" type="search" autocomplete="off"
                        placeholder="
                        Cari lokasi, alamat,
                        wilayah, latitude...
                    "
                        aria-label="Cari data lokasi">

                </label>



                {{-- FILTER WILAYAH --}}

                <div class="lokasi-select-group">

                    <label for="lokasiWilayahFilter">

                        Wilayah

                    </label>


                    <select id="lokasiWilayahFilter">

                        <option value="">

                            Semua Wilayah

                        </option>


                        @foreach ($wilayahRows as $wilayah)
                            <option value="{{ $wilayah->id }}">

                                {{ $wilayah->wilayah }}

                            </option>
                        @endforeach


                        <option value="__NULL__">

                            Belum terhubung

                        </option>

                    </select>

                </div>



                {{-- RESET --}}

                <button type="button" class="lokasi-reset-button" id="lokasiResetButton">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>



                {{-- EXPORT --}}

                <button type="button" class="lokasi-export-button" id="lokasiExportButton">

                    <i data-lucide="download"></i>

                    Export

                </button>

            </div>

        </section>



        {{-- =========================================================
         TABLE
    ========================================================== --}}

        <section class="
            lokasi-card
            lokasi-table-card
        " id="lokasiList"
            aria-labelledby="lokasiListTitle">

            <div class="lokasi-table-header">

                <div>

                    <h3 id="lokasiListTitle">
                        Data Lokasi
                    </h3>


                    <span>
                        Kelola lokasi, wilayah,
                        koordinat, alamat, dan gambar.
                    </span>

                </div>



                <span class="lokasi-db-badge">

                    <i data-lucide="database"></i>

                    PostgreSQL

                </span>

            </div>



            <div class="table-responsive" tabindex="0" aria-label="Tabel data Lokasi">

                <table class="lokasi-table" id="lokasiTable">

                    <thead>

                        <tr>

                            <th class="lokasi-col-no">
                                No
                            </th>

                            <th class="lokasi-col-image">
                                Gambar
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Alamat
                            </th>

                            <th>
                                Wilayah
                            </th>

                            <th>
                                Latitude
                            </th>

                            <th>
                                Longitude
                            </th>

                            <th>
                                Dibuat
                            </th>

                            <th class="lokasi-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>



                    <tbody>

                        @forelse (
                            $lokasiRows
                            as $item
                        )


                            @php

                                $imageUrl = $resolveLokasiImage($item->img ?? null);

                                $createdAt = $item->created_at ?? null;

                                $updatedAt = $item->updated_at ?? null;

                                $wilayahId = $item->wilayah_id ?? null;

                                $wilayahLabel = trim((string) ($item->nama_wilayah ?? '')) ?: 'Belum terhubung';
                            @endphp



                            <tr data-record
                                data-id="
                                {{ $item->id }}
                            "
                                data-lokasi="
                                {{ $item->lokasi ?? '' }}
                            "
                                data-alamat="
                                {{ $item->alamat ?? '' }}
                            "
                                data-wilayah-id="
                                {{ $wilayahId ?? '' }}
                            "
                                data-wilayah="
                                {{ $wilayahLabel }}
                            "
                                data-lat="
                                {{ $item->lat ?? '' }}
                            "
                                data-long="
                                {{ $item->long ?? '' }}
                            "
                                data-img="
                                {{ $item->img ?? '' }}
                            "
                                data-image-url="
                                {{ $imageUrl ?? '' }}
                            "
                                data-created-at="
                                {{ $createdAt ?? '' }}
                            "
                                data-updated-at="
                                {{ $updatedAt ?? '' }}
                            ">


                                {{-- NO --}}

                                <td class="lokasi-row-number">
                                    -
                                </td>



                                {{-- IMAGE --}}

                                <td>

                                    @if ($imageUrl)
                                        <button type="button" class="lokasi-thumb-button" data-action="view"
                                            title="Lihat detail">

                                            <img class="lokasi-thumbnail" src="{{ $imageUrl }}"
                                                alt="
                                                Gambar
                                                {{ $item->lokasi }}
                                            "
                                                loading="lazy">

                                        </button>
                                    @else
                                        <div class="
                                            lokasi-image-placeholder
                                        "
                                            title="
                                            Gambar tidak tersedia
                                        ">

                                            <i data-lucide="image"></i>

                                        </div>
                                    @endif

                                </td>



                                {{-- NAMA --}}

                                <td>

                                    <div class="lokasi-name-cell">

                                        <span class="lokasi-name-icon">

                                            <i data-lucide="map-pin"></i>

                                        </span>


                                        <div>

                                            <strong>

                                                {{ $item->lokasi ?: '—' }}

                                            </strong>


                                            <small>

                                                ID #{{ $item->id }}

                                            </small>

                                        </div>

                                    </div>

                                </td>



                                {{-- ALAMAT --}}

                                <td class="lokasi-description"
                                    title="
                                    {{ $item->alamat ?? '' }}
                                ">

                                    {{ $item->alamat ?: '—' }}

                                </td>



                                {{-- WILAYAH --}}

                                <td>

                                    <span
                                        class="
                                        lokasi-wilayah-badge

                                        {{ $wilayahId ? '' : 'is-unlinked' }}
                                    ">

                                        {{ $wilayahLabel }}

                                    </span>

                                </td>



                                {{-- LATITUDE --}}

                                <td class="lokasi-coordinate">

                                    {{ filled($item->lat ?? null) ? $item->lat : '—' }}

                                </td>



                                {{-- LONGITUDE --}}

                                <td class="lokasi-coordinate">

                                    {{ filled($item->long ?? null) ? $item->long : '—' }}

                                </td>



                                {{-- CREATED AT --}}

                                <td>

                                    @if ($createdAt)
                                        <span class="lokasi-date-value">

                                            {{ \Carbon\Carbon::parse($createdAt)->locale('id')->translatedFormat('d M Y') }}

                                        </span>
                                    @else
                                        <span class="lokasi-muted-value">

                                            —

                                        </span>
                                    @endif

                                </td>



                                {{-- ACTION --}}

                                <td>

                                    <div class="lokasi-actions">


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


                        @empty
                        @endforelse



                        <tr id="lokasiEmptyRow" hidden>

                            <td colspan="9" class="lokasi-empty">

                                <i data-lucide="search-x"></i>

                                <strong>
                                    Data tidak ditemukan
                                </strong>

                                <span>
                                    Coba ubah kata kunci
                                    atau filter wilayah.
                                </span>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>



            {{-- PAGINATION --}}

            <div class="lokasi-table-footer">

                <div class="lokasi-table-info" id="lokasiTableInfo" role="status" aria-live="polite">

                    Menampilkan data...

                </div>



                <div class="lokasi-pagination-area">

                    <select id="lokasiPageSize"
                        aria-label="
                        Jumlah data per halaman
                    ">

                        <option value="10">
                            10
                        </option>

                        <option value="25">
                            25
                        </option>

                        <option value="50">
                            50
                        </option>

                        <option value="100">
                            100
                        </option>

                    </select>


                    <span>
                        data per halaman
                    </span>


                    <nav class="lokasi-pagination" id="lokasiPagination"
                        aria-label="
                        Pagination data Lokasi
                    "></nav>

                </div>

            </div>

        </section>



        {{-- =========================================================
         BOTTOM SECTION
    ========================================================== --}}

        <div class="lokasi-bottom-grid">


            {{-- DISTRIBUSI --}}

            <section class="lokasi-card">

                <div class="lokasi-bottom-header">

                    <div>

                        <h3>
                            Distribusi Lokasi per Wilayah
                        </h3>


                        <p>
                            Jumlah data berdasarkan
                            relasi aset_wilayah.
                        </p>

                    </div>

                </div>



                <div class="lokasi-distribution-content">


                    <div class="lokasi-chart-wrap">

                        <canvas id="lokasiDistributionChart" role="img"
                            aria-label="
                            Distribusi lokasi per wilayah
                        "></canvas>


                        <div class="lokasi-chart-center">

                            <strong>

                                {{ number_format($totalLokasiValue, 0, ',', '.') }}

                            </strong>


                            <span>
                                Lokasi
                            </span>

                        </div>

                    </div>



                    <div class="lokasi-legend" id="lokasiLegend">

                        @forelse ($distribution
                            as $label => $count)
                            @php

                                $percentage = $totalLokasiValue > 0 ? ($count / $totalLokasiValue) * 100 : 0;

                                $color = $distributionColors[$loop->index % count($distributionColors)];

                            @endphp



                            <div data-label="
                                {{ $label }}
                            "
                                data-count="
                                {{ $count }}
                            "
                                data-color="
                                {{ $color }}
                            ">

                                <span class="lokasi-dot"
                                    style="
                                    --dot-color:
                                    {{ $color }}
                                "></span>


                                <p title="{{ $label }}">

                                    {{ $label }}

                                </p>


                                <strong>

                                    {{ number_format($count, 0, ',', '.') }}

                                </strong>


                                <small>

                                    {{ number_format($percentage, 1, ',', '.') }}%

                                </small>

                            </div>


                        @empty


                            <div class="lokasi-legend-empty">

                                Belum ada data distribusi.

                            </div>
                        @endforelse

                    </div>

                </div>

            </section>



            {{-- LOKASI TERBARU --}}

            <section class="lokasi-card">

                <div class="lokasi-bottom-header">

                    <div>

                        <h3>
                            Lokasi Terbaru
                        </h3>

                        <p>
                            Data lokasi yang paling
                            baru ditambahkan.
                        </p>

                    </div>


                    <button type="button" class="lokasi-link-button" id="lokasiViewAll">

                        Lihat Semua

                    </button>

                </div>



                <div class="
                    table-responsive
                    lokasi-latest-wrap
                ">

                    <table class="lokasi-latest-table">

                        <thead>

                            <tr>

                                <th>
                                    No
                                </th>

                                <th>
                                    Lokasi
                                </th>

                                <th>
                                    Wilayah
                                </th>

                                <th>
                                    Tanggal Dibuat
                                </th>

                            </tr>

                        </thead>



                        <tbody>

                            @forelse ($latestRows
                                as $index => $item)
                                <tr>

                                    <td>

                                        {{ $index + 1 }}

                                    </td>


                                    <td>

                                        <strong>

                                            {{ $item->lokasi ?: '—' }}

                                        </strong>

                                    </td>


                                    <td>

                                        {{ trim((string) ($item->nama_wilayah ?? '')) ?: 'Belum terhubung' }}

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

                                    <td colspan="4" class="lokasi-latest-empty">

                                        Belum ada data lokasi.

                                    </td>

                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>

            </section>

        </div>



        {{-- =========================================================
         CRUD MODAL
    ========================================================== --}}

        <dialog class="lokasi-modal" id="lokasiModal">

            <div class="lokasi-modal-dialog">


                <div class="lokasi-modal-header">

                    <div>

                        <span class="lokasi-modal-kicker">

                            MASTER DATA

                        </span>


                        <h3 id="lokasiModalTitle">

                            Tambah Lokasi

                        </h3>


                        <p id="lokasiModalDescription">

                            Tambahkan data lokasi baru.

                        </p>

                    </div>


                    <button type="button" class="lokasi-modal-close" id="lokasiModalClose" aria-label="Tutup">

                        <i data-lucide="x"></i>

                    </button>

                </div>



                <form id="lokasiForm" enctype="multipart/form-data" novalidate>

                    @csrf



                    <div class="lokasi-modal-body">


                        {{-- ALERT --}}

                        <div class="lokasi-form-alert" id="lokasiFormAlert" hidden></div>



                        {{-- IMAGE PREVIEW --}}

                        <div class="lokasi-modal-preview">

                            <div class="lokasi-preview-box">

                                <img id="lokasiImagePreview" alt="Preview gambar lokasi" hidden>


                                <div class="lokasi-preview-placeholder" id="lokasiImagePlaceholder">

                                    <i data-lucide="image-plus"></i>

                                    <span>
                                        Belum ada gambar
                                    </span>

                                </div>

                            </div>



                            <div class="lokasi-preview-copy">

                                <strong>
                                    Gambar Lokasi
                                </strong>


                                <span>
                                    JPG, JPEG, PNG,
                                    atau WEBP.
                                    Maksimal 4 MB.
                                </span>


                                <label class="lokasi-file-button" for="lokasiImage" id="lokasiFileButton">

                                    <i data-lucide="upload"></i>

                                    Pilih Gambar

                                </label>


                                <input id="lokasiImage" name="img" type="file"
                                    accept="
                                    .jpg,
                                    .jpeg,
                                    .png,
                                    .webp
                                "
                                    hidden>

                            </div>

                        </div>



                        {{-- FORM --}}

                        <div class="lokasi-form-grid">


                            {{-- NAMA LOKASI --}}

                            <div class="lokasi-form-group">

                                <label for="lokasiName">

                                    Nama Lokasi

                                    <span>*</span>

                                </label>


                                <input id="lokasiName" name="lokasi" type="text" maxlength="255" autocomplete="off"
                                    placeholder="
                                    Contoh:
                                    INTAKE GUNUNG LIPAN
                                "
                                    required>


                                <small class="lokasi-field-error" data-error-for="lokasi"></small>

                            </div>



                            {{-- WILAYAH --}}

                            <div class="lokasi-form-group">

                                <label for="lokasiWilayah">

                                    Wilayah

                                </label>


                                <select id="lokasiWilayah" name="wilayah">

                                    <option value="">

                                        Pilih Wilayah

                                    </option>


                                    @foreach ($wilayahRows as $wilayah)
                                        <option
                                            value="
                                            {{ $wilayah->id }}
                                        ">

                                            {{ $wilayah->wilayah }}

                                        </option>
                                    @endforeach

                                </select>


                                <small class="lokasi-field-error" data-error-for="wilayah"></small>

                            </div>



                            {{-- ALAMAT --}}

                            <div
                                class="
                                lokasi-form-group
                                lokasi-form-wide
                            ">

                                <label for="lokasiAddress">

                                    Alamat

                                </label>


                                <textarea id="lokasiAddress" name="alamat" rows="3" maxlength="255"
                                    placeholder="
                                    Masukkan alamat lokasi
                                "></textarea>


                                <small class="lokasi-field-error" data-error-for="alamat"></small>

                            </div>



                            {{-- LATITUDE --}}

                            <div class="lokasi-form-group">

                                <label for="lokasiLat">

                                    Latitude

                                </label>


                                <div class="lokasi-input-icon">

                                    <i data-lucide="crosshair"></i>


                                    <input id="lokasiLat" name="lat" type="text" maxlength="255"
                                        autocomplete="off"
                                        placeholder="
                                        -0.46004429
                                    ">

                                </div>


                                <small class="lokasi-field-error" data-error-for="lat"></small>

                            </div>



                            {{-- LONGITUDE --}}

                            <div class="lokasi-form-group">

                                <label for="lokasiLong">

                                    Longitude

                                </label>


                                <div class="lokasi-input-icon">

                                    <i data-lucide="navigation"></i>


                                    <input id="lokasiLong" name="long" type="text" maxlength="255"
                                        autocomplete="off"
                                        placeholder="
                                        117.139771
                                    ">

                                </div>


                                <small class="lokasi-field-error" data-error-for="long"></small>

                            </div>

                        </div>



                        {{-- GOOGLE MAPS --}}

                        <a href="#" class="lokasi-map-link" id="lokasiMapLink" target="_blank"
                            rel="noopener noreferrer" hidden>

                            <i data-lucide="map-pinned"></i>

                            Buka koordinat
                            di Google Maps

                        </a>



                        <p class="lokasi-modal-note" id="lokasiModalNote">

                            Kolom bertanda *
                            wajib diisi.

                        </p>

                    </div>



                    <div class="lokasi-modal-footer">


                        <button type="button" class="lokasi-cancel-button" id="lokasiCancelButton">

                            Tutup

                        </button>



                        <button type="submit" class="lokasi-save-button" id="lokasiSaveButton">

                            <i data-lucide="save"></i>

                            <span>
                                Simpan Lokasi
                            </span>

                        </button>

                    </div>

                </form>

            </div>

        </dialog>



        {{-- =========================================================
         HISTORY MODAL
    ========================================================== --}}

        <dialog class="lokasi-history-modal" id="lokasiHistoryModal">

            <div class="lokasi-history-dialog">


                <div class="lokasi-history-header">

                    <div>

                        <span class="lokasi-modal-kicker">

                            AKTIVITAS MASTER DATA

                        </span>


                        <h3>
                            Riwayat Perubahan Lokasi
                        </h3>


                        <p>
                            Ringkasan penambahan
                            dan penghapusan data Lokasi.
                        </p>

                    </div>


                    <button type="button" class="lokasi-modal-close" id="lokasiHistoryClose" aria-label="Tutup">

                        <i data-lucide="x"></i>

                    </button>

                </div>



                <div class="lokasi-history-body">


                    <div class="lokasi-history-kpis">


                        <div>

                            <span>
                                Ditambahkan
                            </span>


                            <strong class="is-add">

                                +{{ number_format($tambahValue, 0, ',', '.') }}

                            </strong>

                        </div>



                        <div>

                            <span>
                                Dihapus
                            </span>


                            <strong class="is-delete">

                                -{{ number_format($hapusValue, 0, ',', '.') }}

                            </strong>

                        </div>



                        <div>

                            <span>
                                Perubahan Bersih
                            </span>


                            <strong>

                                {{ $deltaValue > 0 ? '+' : '' }}

                                {{ number_format($deltaValue, 0, ',', '.') }}

                            </strong>

                        </div>

                    </div>



                    <div class="table-responsive">

                        <table class="lokasi-history-table">

                            <thead>

                                <tr>

                                    <th>
                                        No
                                    </th>

                                    <th>
                                        Lokasi
                                    </th>

                                    <th>
                                        Aktivitas
                                    </th>

                                    <th>
                                        Tanggal
                                    </th>

                                </tr>

                            </thead>



                            <tbody>

                                @forelse ($activityRows->take(50)
                                    as $index => $log)
                                    <tr>

                                        <td>

                                            {{ $index + 1 }}

                                        </td>


                                        <td>

                                            <strong>

                                                {{ $log->record_name ?? '—' }}

                                            </strong>


                                            @if (!empty($log->record_id))
                                                <small>

                                                    ID
                                                    #{{ $log->record_id }}

                                                </small>
                                            @endif

                                        </td>


                                        <td>

                                            @if (($log->action ?? '') === 'created')
                                                <span
                                                    class="
                                                    lokasi-history-badge
                                                    is-add
                                                ">

                                                    Ditambahkan

                                                </span>
                                            @elseif (($log->action ?? '') === 'deleted')
                                                <span
                                                    class="
                                                    lokasi-history-badge
                                                    is-delete
                                                ">

                                                    Dihapus

                                                </span>
                                            @else
                                                <span
                                                    class="
                                                    lokasi-history-badge
                                                ">

                                                    {{ ucfirst($log->action ?? 'Aktivitas') }}

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

                                        <td colspan="4"
                                            class="
                                            lokasi-history-empty
                                        ">

                                            Belum ada riwayat
                                            perubahan Lokasi
                                            yang tercatat.

                                        </td>

                                    </tr>
                                @endforelse

                            </tbody>

                        </table>

                    </div>

                </div>



                <div class="lokasi-history-footer">

                    <button type="button" class="lokasi-cancel-button" id="lokasiHistoryCloseBottom">

                        Tutup

                    </button>

                </div>

            </div>

        </dialog>



        {{-- =========================================================
         TOAST
    ========================================================== --}}

        <div class="lokasi-toast" id="lokasiToast" role="status" aria-live="polite" hidden>

            <span class="lokasi-toast-icon">

                <i data-lucide="circle-check"></i>

            </span>


            <div>

                <strong id="lokasiToastTitle">

                    Berhasil

                </strong>


                <span id="lokasiToastMessage">

                    Data berhasil diperbarui.

                </span>

            </div>

        </div>

    </section>

@endsection



@push('scripts')
    <script>
        window.LOKASI_CRUD = {

            store: @json(route('master.data_lokasi.store')),

            update: @json(url('/master-data/lokasi/__ID__')),

            destroy: @json(url('/master-data/lokasi/__ID__'))

        };
    </script>


    <script src="
            https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js
        "></script>


    <script src="{{ asset('js/pages/lokasi.js') }}"></script>
@endpush
