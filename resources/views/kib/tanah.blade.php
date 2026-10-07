@extends('layouts.main')

@section('title', 'Tanah')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/kib/tanah.css') }}">
@endpush


@section('content')

    @php

        $tanahRows = collect($tanahs ?? []);

        $totalLokasiValue = (int) ($totalLokasiTanah ?? $tanahRows->count());

        $totalDataValue = (int) ($totalDataTanah ?? 0);

        $totalLuasValue = (float) ($totalLuasTanah ?? 0);

        $totalNilaiValue = (float) ($totalNilaiTanah ?? 0);

        $updateLabel = $updateTerakhirLabel ?? 'Belum ada data';

        $updateDetail = $updateTerakhirDetail ?? 'Belum ada perubahan';

        /*
    |--------------------------------------------------------------------------
    | RESOLVE GAMBAR LEGACY / MODERN
    |--------------------------------------------------------------------------
    */

        $resolveTanahImage = function ($img) {
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

            $candidates = array_merge($candidates, [
                'uploads/lokasi/' . $base,
                'assets/img/lokasi/' . $base,
                'assets/img/' . $base,
                'images/lokasi/' . $base,
                'img/lokasi/' . $base,
            ]);

            foreach (array_unique($candidates) as $candidate) {
                if ($candidate !== '' && file_exists(public_path($candidate))) {
                    return asset($candidate);
                }
            }

            return null;
        };
    @endphp



    <section class="content tanah-page">

        {{-- =====================================================
         HERO
    ====================================================== --}}

        <section class="tanah-hero">

            <div class="tanah-hero-overlay"></div>

            <div class="tanah-hero-top">

                <div>

                    <nav class="tanah-breadcrumb">

                        <a href="{{ route('dashboard') }}">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>
                            K.I.B
                        </span>

                        <i data-lucide="chevron-right"></i>

                        <strong>
                            Tanah
                        </strong>

                    </nav>


                    <div class="tanah-heading">

                        <h1>
                            Tanah
                        </h1>

                        <p>
                            Kelola data Kartu Inventaris Barang Tanah
                            berdasarkan lokasi aset Perumda Tirta Kencana.
                        </p>

                    </div>

                </div>


                <div class="tanah-date-card">

                    <div class="tanah-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>

                        <strong id="tanahCurrentDate">
                            -
                        </strong>

                        <span id="tanahCurrentTime">
                            -
                        </span>

                    </div>

                </div>

            </div>


            {{-- KPI --}}

            <div class="tanah-kpi-grid">

                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">
                        <i data-lucide="map-pinned"></i>
                    </div>

                    <div class="tanah-kpi-content">

                        <span>
                            Lokasi Tanah
                        </span>

                        <strong>
                            {{ number_format($totalLokasiValue, 0, ',', '.') }}
                        </strong>

                        <p>
                            {{ number_format($totalDataValue, 0, ',', '.') }}
                            data tanah / sertifikat
                        </p>

                    </div>

                </article>


                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">
                        <i data-lucide="ruler"></i>
                    </div>

                    <div class="tanah-kpi-content">

                        <span>
                            Total Luas
                        </span>

                        <strong>
                            {{ number_format($totalLuasValue, 0, ',', '.') }}
                            <small>m²</small>
                        </strong>

                        <p>
                            luas penunjukan seluruh data
                        </p>

                    </div>

                </article>


                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">
                        <i data-lucide="banknote"></i>
                    </div>

                    <div class="tanah-kpi-content">

                        <span>
                            Total Nilai Tanah
                        </span>

                        <strong class="tanah-kpi-money">
                            Rp
                            {{ number_format($totalNilaiValue, 0, ',', '.') }}
                        </strong>

                        <p>
                            hanya KIB TANAH
                        </p>

                    </div>

                </article>


                <article class="tanah-kpi-card">

                    <div class="tanah-kpi-icon">
                        <i data-lucide="clock-3"></i>
                    </div>

                    <div class="tanah-kpi-content">

                        <span>
                            Update Terakhir
                        </span>

                        <strong class="tanah-kpi-update">
                            {{ $updateLabel }}
                        </strong>

                        <p>
                            {{ $updateDetail }}
                        </p>

                    </div>

                </article>

            </div>

        </section>



        {{-- =====================================================
         FILTER
    ====================================================== --}}

        <section class="tanah-card tanah-filter-card">

            <div class="tanah-filter-header">

                <div>

                    <h2>
                        Filter Data Tanah
                    </h2>

                    <p>
                        Satu baris mewakili satu lokasi tanah.
                    </p>

                </div>

                <button type="button" class="tanah-export-button" id="tanahExportButton">
                    <i data-lucide="download"></i>
                    Export
                </button>

            </div>


            <div class="tanah-filter-grid">

                <label class="tanah-search">

                    <i data-lucide="search"></i>

                    <input type="search" id="tanahSearch" autocomplete="off"
                        placeholder="Cari lokasi, alamat atau penggunaan...">

                </label>


                <div class="tanah-select-group">

                    <label for="tanahJumlahFilter">
                        Jumlah data
                    </label>

                    <select id="tanahJumlahFilter">

                        <option value="">
                            Semua
                        </option>

                        <option value="single">
                            1 data
                        </option>

                        <option value="multiple">
                            Lebih dari 1
                        </option>

                    </select>

                </div>


                <button type="button" class="tanah-reset-button" id="tanahResetButton">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>

            </div>

        </section>



        {{-- =====================================================
         TABLE UTAMA - SATU LOKASI SATU BARIS
    ====================================================== --}}

        <section class="tanah-card tanah-table-card" id="tanahList">

            <div class="tanah-table-header">

                <div>

                    <h2>
                        Daftar Lokasi Tanah
                    </h2>

                    <p>
                        Data telah dikelompokkan berdasarkan lokasi.
                    </p>

                </div>

                <span class="tanah-db-badge">

                    <i data-lucide="database"></i>

                    PostgreSQL

                </span>

            </div>


            <div class="table-responsive">

                <table class="tanah-table" id="tanahTable">

                    <thead>

                        <tr>

                            <th class="tanah-col-no">
                                No
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Alamat
                            </th>

                            <th>
                                Penggunaan
                            </th>

                            <th>
                                Data Tanah
                            </th>

                            <th>
                                Tahun
                            </th>

                            <th>
                                Nilai
                            </th>

                            <th class="tanah-col-action">
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        @forelse ($tanahRows as $item)
                            @php

                                $imageUrl = $resolveTanahImage($item->lokasi_img ?? null);

                                $nilai = is_numeric($item->nilai_tanah ?? null) ? (float) $item->nilai_tanah : 0;

                                $jumlahData = (int) ($item->jumlah_data_tanah ?? 0);

                                $jumlahTransaksi = (int) ($item->jumlah_transaksi_nilai ?? 0);

                                $tahunAwal = $item->tahun_awal ?? null;

                                $tahunAkhir = $item->tahun_akhir ?? null;

                                $tahunLabel = '—';

                                if ($tahunAwal && $tahunAkhir) {
                                    $tahunLabel = (string) $tahunAwal;

                                    if ((string) $tahunAwal !== (string) $tahunAkhir) {
                                        $tahunLabel .= ' - ' . $tahunAkhir;
                                    }
                                }
                            @endphp


                            <tr data-record data-id-lokasi="{{ $item->id_lokasi }}"
                                data-lokasi="{{ trim((string) ($item->lokasi ?? '')) }}"
                                data-alamat="{{ trim((string) ($item->alamat ?? '')) }}"
                                data-guna="{{ trim((string) ($item->guna_ringkas ?? '')) }}"
                                data-jumlah-data="{{ $jumlahData }}" data-tahun="{{ $tahunLabel }}"
                                data-nilai="{{ $nilai }}" data-jumlah-transaksi="{{ $jumlahTransaksi }}"
                                data-image-url="{{ $imageUrl ?? '' }}">

                                <td class="tanah-row-number">
                                    -
                                </td>


                                <td>

                                    <div class="tanah-location-cell">

                                        <div class="tanah-location-icon">
                                            <i data-lucide="map-pin"></i>
                                        </div>

                                        <div>

                                            <strong>
                                                {{ trim((string) ($item->lokasi ?? '')) ?: 'Lokasi tidak diketahui' }}
                                            </strong>

                                            <small>
                                                ID Lokasi #{{ $item->id_lokasi }}
                                            </small>

                                        </div>

                                    </div>

                                </td>


                                <td>

                                    <span class="tanah-address">

                                        {{ trim((string) ($item->alamat ?? '')) ?: '—' }}

                                    </span>

                                </td>


                                <td>

                                    {{ trim((string) ($item->guna_ringkas ?? '')) ?: '—' }}

                                </td>


                                <td>

                                    <button type="button" class="tanah-count-button" data-action="view">

                                        <i data-lucide="files"></i>

                                        <div>

                                            <strong>
                                                {{ $jumlahData }}
                                                data
                                            </strong>

                                            <span>
                                                Lihat sertifikat
                                            </span>

                                        </div>

                                    </button>

                                </td>


                                <td>
                                    {{ $tahunLabel }}
                                </td>


                                <td>

                                    <button type="button" class="tanah-value-button" data-action="nilai"
                                        title="Lihat rincian nilai">

                                        <div>

                                            <strong>
                                                Rp
                                                {{ number_format($nilai, 0, ',', '.') }}
                                            </strong>

                                            <small>
                                                {{ number_format($jumlahTransaksi, 0, ',', '.') }}
                                                transaksi tanah
                                            </small>

                                        </div>

                                        <i data-lucide="external-link"></i>

                                    </button>

                                </td>


                                <td>

                                    <div class="tanah-actions">

                                        <button type="button" class="tanah-action-view" data-action="view"
                                            title="Lihat seluruh data tanah">
                                            <i data-lucide="eye"></i>
                                        </button>

                                    </div>

                                </td>

                            </tr>


                        @empty

                            <tr id="tanahServerEmpty">

                                <td colspan="8" class="tanah-empty">

                                    <i data-lucide="database-zap"></i>

                                    <strong>
                                        Data tanah belum tersedia.
                                    </strong>

                                    <span>
                                        Tidak ada data yang dapat ditampilkan.
                                    </span>

                                </td>

                            </tr>
                        @endforelse


                        <tr id="tanahFilterEmpty" hidden>

                            <td colspan="8" class="tanah-empty">

                                <i data-lucide="search-x"></i>

                                <strong>
                                    Data tidak ditemukan.
                                </strong>

                                <span>
                                    Ubah kata pencarian atau filter.
                                </span>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


            <div class="tanah-table-footer">

                <span id="tanahTableInfo">
                    Menampilkan data...
                </span>


                <div class="tanah-pagination-area">

                    <select id="tanahPageSize">

                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>

                    </select>

                    <span>
                        data per halaman
                    </span>

                    <div class="tanah-pagination" id="tanahPagination"></div>

                </div>

            </div>

        </section>



        {{-- =====================================================
         MODAL DETAIL TANAH PER LOKASI
    ====================================================== --}}

        <dialog class="tanah-detail-modal" id="tanahViewModal">

            <div class="tanah-detail-dialog">

                <header class="tanah-detail-header">

                    <div>

                        <span class="tanah-modal-kicker">
                            KARTU INVENTARIS BARANG
                        </span>

                        <h3>
                            Detail Aset Tanah
                        </h3>

                        <p id="detailTanahHeaderLocation">
                            -
                        </p>

                    </div>


                    <button type="button" class="tanah-detail-close" id="tanahViewClose">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="tanah-detail-summary">

                    <div>

                        <i data-lucide="map-pin"></i>

                        <div>
                            <span>Lokasi</span>
                            <strong id="detailLokasiNama">-</strong>
                        </div>

                    </div>


                    <div>
                        <span>Alamat</span>
                        <strong id="detailLokasiAlamat">-</strong>
                    </div>


                    <div>
                        <span>Jumlah Data Tanah</span>
                        <strong id="detailLokasiJumlah">0</strong>
                    </div>


                    <div>
                        <span>Total Nilai Tanah</span>
                        <strong id="detailLokasiNilai">Rp 0</strong>
                    </div>

                </div>


                <div class="tanah-detail-loading" id="tanahDetailLoading" hidden>

                    <span class="tanah-loading-spinner"></span>

                    <strong>
                        Memuat seluruh data tanah...
                    </strong>

                </div>


                <div class="tanah-detail-error" id="tanahDetailError" hidden>

                    <i data-lucide="circle-alert"></i>

                    <span id="tanahDetailErrorText">
                        Data gagal dimuat.
                    </span>

                </div>


                <div class="tanah-detail-layout" id="tanahDetailContent" hidden>

                    {{-- LEFT LIST --}}

                    <aside class="tanah-detail-list">

                        <div class="tanah-detail-list-header">

                            <div>

                                <strong>
                                    Data Tanah
                                </strong>

                                <span>
                                    Pilih data untuk melihat detail.
                                </span>

                            </div>

                        </div>


                        <div class="table-responsive">

                            <table class="tanah-detail-list-table">

                                <thead>

                                    <tr>

                                        <th>No</th>
                                        <th>Pemilik Asal</th>
                                        <th>Luas</th>
                                        <th>Penggunaan</th>

                                    </tr>

                                </thead>


                                <tbody id="tanahDetailItemsBody"></tbody>

                            </table>

                        </div>

                    </aside>


                    {{-- RIGHT DETAIL --}}

                    <main class="tanah-detail-main">

                        <div class="tanah-detail-main-title">

                            <div>

                                <span>
                                    Data Terpilih
                                </span>

                                <h4 id="detailTanahGunaTitle">
                                    -
                                </h4>

                            </div>


                            <span class="tanah-detail-id-badge">

                                ID Tanah
                                <strong id="detailTanahId">
                                    -
                                </strong>

                            </span>

                        </div>


                        {{-- IMAGE --}}

                        <div class="tanah-detail-image-wrap">

                            <img id="detailTanahImage" alt="Foto lokasi tanah" hidden>


                            <div class="tanah-detail-image-empty" id="detailTanahImageEmpty">

                                <i data-lucide="image-off"></i>

                                <strong>
                                    Gambar belum tersedia
                                </strong>

                            </div>

                        </div>


                        {{-- INFO --}}

                        <div class="tanah-detail-basic-grid">


                            <section class="tanah-detail-info-card">

                                <div>
                                    <span>Letak</span>
                                    <strong id="detailTanahAlamat">-</strong>
                                </div>

                                <div>
                                    <span>Nama Barang</span>
                                    <strong id="detailTanahBarang">-</strong>
                                </div>

                                <div>
                                    <span>Kode Barang</span>
                                    <strong id="detailTanahKode">-</strong>
                                </div>

                            </section>


                            <section class="tanah-detail-info-card">

                                <div>
                                    <span>Asal Usul</span>
                                    <strong id="detailTanahAsal">-</strong>
                                </div>

                                <div>
                                    <span>Tahun Pengadaan</span>
                                    <strong id="detailTanahTahun">-</strong>
                                </div>

                                <div>
                                    <span>Penggunaan</span>
                                    <strong id="detailTanahGuna">-</strong>
                                </div>

                            </section>

                        </div>


                        {{-- PENUNJUKAN --}}

                        <section class="tanah-legal-card">

                            <header>
                                <i data-lucide="file-check-2"></i>
                                PENUNJUKAN
                            </header>

                            <div class="tanah-legal-grid">

                                <div>
                                    <span>Nomor Surat</span>
                                    <strong id="detailNoTunjuk">-</strong>
                                </div>

                                <div>
                                    <span>Tanggal</span>
                                    <strong id="detailTglTunjuk">-</strong>
                                </div>

                                <div>
                                    <span>Luas</span>
                                    <strong id="detailLuasTunjuk">-</strong>
                                </div>

                            </div>

                        </section>


                        {{-- SERTIFIKAT --}}

                        <section class="tanah-legal-card">

                            <header>
                                <i data-lucide="badge-check"></i>
                                SERTIFIKAT / SPT / SPHAT / SPJBT
                            </header>

                            <div class="tanah-legal-grid">

                                <div>
                                    <span>Nomor Surat</span>
                                    <strong id="detailSertifikat">-</strong>
                                </div>

                                <div>
                                    <span>Tanggal</span>
                                    <strong id="detailTglSertifikat">-</strong>
                                </div>

                                <div>
                                    <span>Luas</span>
                                    <strong id="detailLuasSertifikat">-</strong>
                                </div>

                            </div>

                        </section>


                        {{-- GAMBAR SITUASI --}}

                        <section class="tanah-legal-card">

                            <header>
                                <i data-lucide="map"></i>
                                GAMBAR SITUASI
                            </header>

                            <div class="tanah-legal-grid">

                                <div>
                                    <span>Nomor Surat</span>
                                    <strong id="detailNoGambar">-</strong>
                                </div>

                                <div>
                                    <span>Tanggal</span>
                                    <strong id="detailTglGambar">-</strong>
                                </div>

                                <div>
                                    <span>Luas</span>
                                    <strong id="detailLuasGambar">-</strong>
                                </div>

                            </div>

                        </section>


                        <div class="tanah-detail-dual">

                            <section class="tanah-detail-info-card">

                                <div>
                                    <span>Hak</span>
                                    <strong id="detailTanahHak">-</strong>
                                </div>

                                <div>
                                    <span>Pemilik Asal</span>
                                    <strong id="detailTanahPemilik">-</strong>
                                </div>

                            </section>


                            <section class="tanah-detail-info-card">

                                <div class="tanah-detail-keterangan">
                                    <span>Keterangan</span>
                                    <strong id="detailTanahKet">-</strong>
                                </div>

                            </section>

                        </div>

                    </main>

                </div>


                <footer class="tanah-detail-footer">

                    <button type="button" class="tanah-modal-close-button" id="tanahViewCloseBottom">
                        Tutup
                    </button>

                </footer>

            </div>

        </dialog>



        {{-- =====================================================
         MODAL NILAI
    ====================================================== --}}

        <dialog class="tanah-nilai-modal" id="tanahNilaiModal">

            <div class="tanah-nilai-dialog">

                <header class="tanah-nilai-header">

                    <div>

                        <span class="tanah-modal-kicker">
                            NILAI AKTIVA - KIB TANAH
                        </span>

                        <h3>
                            Detail Nilai Tanah
                        </h3>

                        <p id="nilaiTanahLokasi">
                            -
                        </p>

                    </div>


                    <button type="button" class="tanah-nilai-close" id="tanahNilaiClose">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="tanah-nilai-body">

                    <div class="tanah-nilai-summary">

                        <div>

                            <span>
                                Total Nilai
                            </span>

                            <strong id="nilaiTanahTotal">
                                Rp 0
                            </strong>

                        </div>


                        <div>

                            <span>
                                Jumlah Transaksi
                            </span>

                            <strong id="nilaiTanahJumlah">
                                0
                            </strong>

                        </div>

                    </div>


                    <div class="tanah-nilai-loading" id="tanahNilaiLoading" hidden>

                        <span class="tanah-loading-spinner"></span>

                        <strong>
                            Memuat rincian nilai...
                        </strong>

                    </div>


                    <div class="tanah-detail-error" id="tanahNilaiError" hidden>

                        <i data-lucide="circle-alert"></i>

                        <span id="tanahNilaiErrorText">
                            Data gagal dimuat.
                        </span>

                    </div>


                    <div class="table-responsive tanah-nilai-table-wrap" id="tanahNilaiTableWrap" hidden>

                        <table class="tanah-nilai-table">

                            <thead>

                                <tr>

                                    <th>No</th>
                                    <th>Kode Perkiraan</th>
                                    <th>Nama Aktiva</th>
                                    <th>Tanggal</th>
                                    <th>Tahun</th>
                                    <th>Nilai</th>
                                    <th>Uraian</th>

                                </tr>

                            </thead>


                            <tbody id="tanahNilaiTableBody"></tbody>

                        </table>

                    </div>


                    <div class="tanah-nilai-empty" id="tanahNilaiEmpty" hidden>

                        <i data-lucide="receipt-text"></i>

                        <strong>
                            Belum ada transaksi nilai Tanah.
                        </strong>

                        <span>
                            Tidak ditemukan nilai aktiva
                            dengan KIB TANAH pada lokasi ini.
                        </span>

                    </div>

                </div>


                <footer class="tanah-detail-footer">

                    <button type="button" class="tanah-modal-close-button" id="tanahNilaiCloseBottom">
                        Tutup
                    </button>

                </footer>

            </div>

        </dialog>

    </section>

@endsection



@push('scripts')
    <script>
        window.TANAH_ENDPOINTS = {
            detail: @json(url('/kib/tanah/lokasi/__ID__/detail')),

            nilai: @json(url('/kib/tanah/lokasi/__ID__/nilai'))
        };
    </script>

    <script src="{{ asset('js/pages/kib/tanah.js') }}"></script>
@endpush
