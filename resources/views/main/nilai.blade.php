@extends('layouts.main')

@section('content')

    @php

        $truncateNumber = function ($value, $precision = 2) {
            $value = (float) $value;

            $factor = pow(10, $precision);

            return $value >= 0 ? floor($value * $factor) / $factor : ceil($value * $factor) / $factor;
        };

        $compactRupiah = function ($value) use ($truncateNumber) {
            $value = (float) ($value ?? 0);

            $absolute = abs($value);

            if ($absolute >= 1000000000000) {
                $scaled = $truncateNumber($value / 1000000000000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' T';
            }

            if ($absolute >= 1000000000) {
                $scaled = $truncateNumber($value / 1000000000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' M';
            }

            if ($absolute >= 1000000) {
                $scaled = $truncateNumber($value / 1000000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' Jt';
            }

            if ($absolute >= 1000) {
                $scaled = $truncateNumber($value / 1000, 2);

                return 'Rp ' . number_format($scaled, 2, ',', '.') . ' Rb';
            }

            return 'Rp ' . number_format($value, 0, ',', '.');
        };

        $fullRupiah = function ($value) {
            return 'Rp ' . number_format((int) ($value ?? 0), 0, ',', '.');
        };
    @endphp


    <link rel="stylesheet"
        href="{{ asset('css/pages/nilai.css') }}?v={{ file_exists(public_path('css/pages/nilai.css')) ? filemtime(public_path('css/pages/nilai.css')) : time() }}">


    <div id="nilaiPage" class="nilai-page" data-validation-errors="{{ $errors->any() ? '1' : '0' }}">


        {{-- =====================================================
         HEADING
    ====================================================== --}}

        <section class="nilai-heading-section">

            <div class="nilai-heading-left">

                <div class="nilai-eyebrow">
                    MANAJEMEN ASET
                </div>

                <h1>
                    Nilai Aset (MASI DALAM TAHAP DEVELOPMENT)
                </h1>

                <p>
                    Kelola transaksi penilaian aset,
                    voucher, lokasi, unit kerja,
                    kategori aset, serta dokumen
                    pendukung Perumda Tirta Kencana.
                </p>

            </div>


            <div class="nilai-heading-actions">

                <div class="nilai-date-card">

                    <div class="nilai-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>

                        <strong>

                            {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}

                        </strong>

                        <span>

                            {{ now('Asia/Makassar')->format('H:i') }}
                            WITA

                        </span>

                    </div>

                </div>


                <button type="button" id="nilaiAddButton" class="nilai-primary-button">

                    <i data-lucide="plus"></i>

                    Tambah Nilai Aset

                </button>

            </div>

        </section>


        {{-- =====================================================
         ALERT
    ====================================================== --}}

        @if (session('success'))
            <div class="nilai-alert nilai-alert-success">

                <i data-lucide="circle-check"></i>

                <span>
                    {{ session('success') }}
                </span>

            </div>
        @endif


        @if ($errors->any())
            <div class="nilai-alert nilai-alert-danger">

                <i data-lucide="circle-alert"></i>

                <div>

                    <strong>
                        Data belum dapat disimpan.
                    </strong>

                    <ul>

                        @foreach ($errors->all() as $error)
                            <li>
                                {{ $error }}
                            </li>
                        @endforeach

                    </ul>

                </div>

            </div>
        @endif


        {{-- =====================================================
         KPI
    ====================================================== --}}

        <section class="nilai-kpi-grid">

            <article class="nilai-kpi-card">

                <div class="nilai-kpi-icon blue">
                    <i data-lucide="database"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Total Nilai Aset
                    </span>

                    <strong title="{{ $fullRupiah($stats['total_nilai']) }}">

                        {{ $compactRupiah($stats['total_nilai']) }}

                    </strong>

                    <small>
                        Seluruh transaksi nilai aset
                    </small>

                </div>

            </article>


            <article class="nilai-kpi-card">

                <div class="nilai-kpi-icon green">
                    <i data-lucide="chart-no-axes-column-increasing"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Penambahan Tahun Ini
                    </span>

                    <strong title="{{ $fullRupiah($stats['penambahan_tahun_ini']) }}">

                        {{ $compactRupiah($stats['penambahan_tahun_ini']) }}

                    </strong>


                    @if (!is_null($stats['delta_tahun']))
                        <small class="{{ $stats['delta_tahun'] >= 0 ? 'positive' : 'negative' }}">

                            {{ $stats['delta_tahun'] >= 0 ? '↑' : '↓' }}

                            {{ number_format(abs($stats['delta_tahun']), 1, ',', '.') }}%

                            dari tahun lalu

                        </small>
                    @else
                        <small>
                            Data pembanding belum tersedia
                        </small>
                    @endif

                </div>

            </article>


            <article class="nilai-kpi-card">

                <div class="nilai-kpi-icon purple">
                    <i data-lucide="file-text"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Total Transaksi
                    </span>

                    <strong>

                        {{ number_format($stats['total_transaksi'], 0, ',', '.') }}

                    </strong>

                    <small>
                        Data voucher nilai aset
                    </small>

                </div>

            </article>


            <article class="nilai-kpi-card">

                <div class="nilai-kpi-icon orange">
                    <i data-lucide="calendar-range"></i>
                </div>

                <div class="nilai-kpi-content">

                    <span>
                        Tahun Aktif
                    </span>

                    <strong>

                        {{ $stats['tahun_aktif'] }}

                    </strong>

                    <small>
                        Periode pencatatan terbaru
                    </small>

                </div>

            </article>

        </section>


        {{-- =====================================================
         CHART
    ====================================================== --}}

        <section class="nilai-chart-grid">

            <article class="nilai-card nilai-chart-card">

                <div class="nilai-card-header">

                    <div>

                        <h2>
                            Tren Nilai Aset 5 Tahun Terakhir
                        </h2>

                        <p>
                            Nilai transaksi berdasarkan
                            tahun pencatatan.
                        </p>

                    </div>

                    <span class="nilai-card-badge">
                        5 Tahun Terakhir
                    </span>

                </div>


                <div class="nilai-line-chart-container">

                    <canvas id="nilaiTrendCanvas"></canvas>

                </div>

            </article>


            <article class="nilai-card nilai-chart-card">

                <div class="nilai-card-header">

                    <div>

                        <h2>
                            Distribusi Nilai Aset
                        </h2>

                        <p>
                            Berdasarkan golongan aset.
                        </p>

                    </div>

                </div>


                <div class="nilai-distribution">

                    <div class="nilai-donut-container">

                        <canvas id="nilaiDonutCanvas"></canvas>

                        <div class="nilai-donut-center">

                            <strong>

                                {{ $compactRupiah($stats['total_nilai']) }}

                            </strong>

                            <span>
                                Total Nilai
                            </span>

                        </div>

                    </div>


                    <div id="nilaiDonutLegend" class="nilai-donut-legend"></div>

                </div>

            </article>

        </section>


        {{-- =====================================================
         FILTER
    ====================================================== --}}

        <section class="nilai-card nilai-filter-card">

            <div class="nilai-card-header">

                <div>

                    <h2>
                        Filter Data Nilai Aset
                    </h2>

                    <p>
                        Cari transaksi berdasarkan data aset.
                    </p>

                </div>

            </div>


            <form action="{{ route('main.nilai') }}" method="GET" class="nilai-filter-grid">

                <div class="nilai-field nilai-filter-search">

                    <label>
                        Pencarian
                    </label>

                    <div class="nilai-input-icon">

                        <i data-lucide="search"></i>

                        <input type="text" name="search" value="{{ request('search') }}"
                            placeholder="Voucher, aktiva, lokasi, uraian...">

                    </div>

                </div>


                <div class="nilai-field">

                    <label>
                        Tahun
                    </label>

                    <select name="tahun">

                        <option value="">
                            Semua Tahun
                        </option>

                        @foreach ($tahunOptions as $tahun)
                            <option value="{{ $tahun }}" @selected(request('tahun') == $tahun)>
                                {{ $tahun }}
                            </option>
                        @endforeach

                    </select>

                </div>


                <div class="nilai-field">

                    <label>
                        Lokasi
                    </label>

                    <select name="lokasi">

                        <option value="">
                            Semua Lokasi
                        </option>

                        @foreach ($lokasiOptions as $item)
                            <option value="{{ $item->id }}" @selected(request('lokasi') == $item->id)>
                                {{ $item->lokasi }}
                            </option>
                        @endforeach

                    </select>

                </div>


                <div class="nilai-field">

                    <label>
                        Golongan
                    </label>

                    <select name="cat">

                        <option value="">
                            Semua Golongan
                        </option>

                        @foreach ($golonganOptions as $item)
                            <option value="{{ $item->id }}" @selected(request('cat') == $item->id)>
                                {{ $item->nama }}
                            </option>
                        @endforeach

                    </select>

                </div>


                <button type="submit" class="nilai-filter-button">

                    <i data-lucide="filter"></i>

                    Filter

                </button>


                <a href="{{ route('main.nilai') }}" class="nilai-reset-button">

                    <i data-lucide="rotate-ccw"></i>

                    Reset

                </a>

            </form>

        </section>


        {{-- =====================================================
         TABLE
    ====================================================== --}}

        <section class="nilai-card nilai-table-card">

            <div class="nilai-table-top">

                <div>

                    <h2>
                        Daftar Nilai Aset
                    </h2>

                    <p>
                        Data transaksi nilai aset
                        dari PostgreSQL.
                    </p>

                </div>


                <span class="nilai-postgres-badge">

                    <i data-lucide="database"></i>

                    PostgreSQL

                </span>

            </div>


            <div class="nilai-table-scroll">

                <table class="nilai-table">

                    <thead>

                        <tr>

                            <th class="nilai-no">
                                No
                            </th>

                            <th>
                                No Voucher
                            </th>

                            <th>
                                Tanggal
                            </th>

                            <th>
                                Aktiva
                            </th>

                            <th>
                                Tahun
                            </th>

                            <th class="nilai-money">
                                Nilai
                            </th>

                            <th class="nilai-description">
                                Uraian
                            </th>

                            <th>
                                Golongan
                            </th>

                            <th class="nilai-pdf-column">
                                PDF
                            </th>

                            <th class="nilai-action-column">
                                Aksi
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        @if (count($nilaiAsets) > 0)
                            @foreach ($nilaiAsets as $item)
                                <tr>

                                    <td class="nilai-no">

                                        {{ $nilaiAsets->firstItem() + $loop->index }}

                                    </td>


                                    <td>

                                        <strong class="nilai-voucher">

                                            {{ $item->no_voucher ?: '-' }}

                                        </strong>

                                    </td>


                                    <td>

                                        @if ($item->tgl_voucher)
                                            {{ \Carbon\Carbon::parse($item->tgl_voucher)->format('d/m/Y') }}
                                        @else
                                            -
                                        @endif

                                    </td>


                                    <td>

                                        <div class="nilai-main-cell">

                                            <strong>

                                                {{ $item->aktiva_nama ?: '-' }}

                                            </strong>


                                            @if ($item->aktiva_kode)
                                                <small>

                                                    {{ $item->aktiva_kode }}

                                                </small>
                                            @endif


                                            @if ($item->lokasi_nama)
                                                <small>

                                                    <i data-lucide="map-pin"></i>

                                                    {{ $item->lokasi_nama }}

                                                </small>
                                            @endif

                                        </div>

                                    </td>


                                    <td>

                                        {{ $item->tahun ?: '-' }}

                                    </td>


                                    <td class="nilai-money">

                                        <strong title="{{ $fullRupiah($item->nilai) }}">

                                            {{ $fullRupiah($item->nilai) }}

                                        </strong>

                                    </td>


                                    <td class="nilai-description">

                                        {{ \Illuminate\Support\Str::limit($item->urai, 100) }}

                                    </td>


                                    <td>

                                        @if ($item->golongan_nama)
                                            <span class="nilai-category-badge">

                                                {{ $item->golongan_nama }}

                                            </span>
                                        @else
                                            -
                                        @endif

                                    </td>


                                    <td class="nilai-pdf-column">

                                        @if ($item->dokumen_pdf)
                                            <button type="button" class="nilai-pdf-button js-pdf-button"
                                                data-preview-url="{{ route('nilai.pdf.preview', $item->id) }}"
                                                data-download-url="{{ route('nilai.pdf.download', $item->id) }}"
                                                data-pdf-name="{{ $item->dokumen_pdf_nama_asli ?: 'Dokumen PDF' }}">

                                                <i data-lucide="file-text"></i>

                                                Lihat

                                            </button>
                                        @else
                                            <span class="nilai-no-document">
                                                Belum ada
                                            </span>
                                        @endif

                                    </td>


                                    <td class="nilai-action-column">

                                        <div class="nilai-actions">

                                            <button type="button" class="nilai-action view js-view" title="Lihat"
                                                data-url="{{ route('nilai.show', $item->id) }}">

                                                <i data-lucide="eye"></i>

                                            </button>


                                            <button type="button" class="nilai-action edit js-edit" title="Edit"
                                                data-url="{{ route('nilai.show', $item->id) }}"
                                                data-update-url="{{ route('nilai.update', $item->id) }}">

                                                <i data-lucide="pencil"></i>

                                            </button>


                                            <button type="button" class="nilai-action delete js-delete" title="Hapus"
                                                data-delete-url="{{ route('nilai.destroy', $item->id) }}"
                                                data-name="{{ $item->no_voucher ?: 'Data #' . $item->id }}">

                                                <i data-lucide="trash-2"></i>

                                            </button>

                                        </div>

                                    </td>

                                </tr>
                            @endforeach
                        @else
                            <tr>

                                <td colspan="10" class="nilai-empty-table">

                                    <i data-lucide="database-zap"></i>

                                    <strong>
                                        Data tidak ditemukan
                                    </strong>

                                    <span>
                                        Ubah filter atau
                                        kata pencarian.
                                    </span>

                                </td>

                            </tr>
                        @endif

                    </tbody>

                </table>

            </div>


            <div class="nilai-table-footer">

                <div class="nilai-table-info">

                    @if ($nilaiAsets->total() > 0)
                        Menampilkan

                        <strong>
                            {{ $nilaiAsets->firstItem() }}
                        </strong>

                        -

                        <strong>
                            {{ $nilaiAsets->lastItem() }}
                        </strong>

                        dari

                        <strong>

                            {{ number_format($nilaiAsets->total(), 0, ',', '.') }}

                        </strong>

                        data
                    @else
                        Tidak ada data
                    @endif

                </div>


                <div class="nilai-pagination-wrapper">

                    <form action="{{ route('main.nilai') }}" method="GET">

                        @foreach (request()->except('per_page', 'page') as $key => $value)
                            @if (!is_array($value))
                                <input type="hidden" name="{{ $key }}" value="{{ $value }}">
                            @endif
                        @endforeach


                        <select name="per_page" onchange="this.form.submit()">

                            @foreach ([10, 20, 50, 100] as $size)
                                <option value="{{ $size }}" @selected(request('per_page', 20) == $size)>

                                    {{ $size }}
                                    per halaman

                                </option>
                            @endforeach

                        </select>

                    </form>


                    <div class="nilai-pagination">

                        {{ $nilaiAsets->onEachSide(1)->links() }}

                    </div>

                </div>

            </div>

        </section>


        {{-- =====================================================
         MODAL CREATE / EDIT
    ====================================================== --}}

        <dialog id="nilaiFormModal" class="nilai-modal nilai-form-modal">

            <form id="nilaiForm" action="{{ route('nilai.store') }}" method="POST" enctype="multipart/form-data">

                @csrf


                <input type="hidden" name="_method" id="nilaiFormMethod" value="">


                <div class="nilai-modal-header">

                    <div>

                        <span class="nilai-modal-eyebrow">
                            NILAI ASET
                        </span>

                        <h3 id="nilaiFormTitle">
                            Tambah Nilai Aset
                        </h3>

                        <p>
                            Isi data transaksi nilai
                            dan lampirkan dokumen PDF.
                        </p>

                    </div>


                    <button type="button" class="nilai-modal-close" data-close-dialog="nilaiFormModal">
                        <i data-lucide="x"></i>
                    </button>

                </div>


                <div class="nilai-modal-body">

                    <div class="nilai-form-grid">

                        <div class="nilai-field">

                            <label>
                                No Voucher
                            </label>

                            <input type="text" name="no_voucher" id="nilaiNoVoucher" value="{{ old('no_voucher') }}"
                                placeholder="Contoh: 0030.1.07.26">

                        </div>


                        <div class="nilai-field">

                            <label>
                                Tanggal Voucher
                                <span>*</span>
                            </label>

                            <input type="date" name="tgl_voucher" id="nilaiTanggal" value="{{ old('tgl_voucher') }}"
                                required>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Aktiva
                                <span>*</span>
                            </label>

                            <select name="id_aktiva" id="nilaiAktiva" required>

                                <option value="">
                                    -AKTIVA-
                                </option>

                                @foreach ($aktivaOptions as $item)
                                    <option value="{{ $item->id }}" @selected(old('id_aktiva') == $item->id)>

                                        {{ $item->kode }}
                                        |
                                        {{ $item->aktiva }}

                                    </option>
                                @endforeach

                            </select>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Lokasi
                                <span>*</span>
                            </label>

                            <select name="id_lokasi" id="nilaiLokasi" required>

                                <option value="">
                                    -LOKASI-
                                </option>

                                @foreach ($lokasiOptions as $item)
                                    <option value="{{ $item->id }}" @selected(old('id_lokasi') == $item->id)>

                                        {{ $item->lokasi }}

                                    </option>
                                @endforeach

                            </select>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Departemen
                                <span>*</span>
                            </label>

                            <select name="dep" id="nilaiDepartemen" required>

                                <option value="">
                                    -DEPARTEMEN-
                                </option>

                                @foreach ($departemenOptions as $item)
                                    <option value="{{ $item->id }}" @selected(old('dep') == $item->id)>

                                        {{ $item->kode_dep }}

                                    </option>
                                @endforeach

                            </select>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Divisi
                                <span>*</span>
                            </label>

                            <select name="div" id="nilaiDivisi" required>

                                <option value="">
                                    -DIVISI-
                                </option>

                                @foreach ($divisiOptions as $item)
                                    <option value="{{ $item->id }}" data-departemen="{{ $item->id_dep }}"
                                        @selected(old('div') == $item->id)>

                                        {{ $item->nama_div }}

                                    </option>
                                @endforeach

                            </select>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Golongan
                                <span>*</span>
                            </label>

                            <select name="cat" id="nilaiGolongan" required>

                                <option value="">
                                    -GOLONGAN-
                                </option>

                                @foreach ($golonganOptions as $item)
                                    <option value="{{ $item->id }}" @selected(old('cat') == $item->id)>

                                        {{ $item->nama }}

                                    </option>
                                @endforeach

                            </select>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Tahun
                                <span>*</span>
                            </label>

                            <select name="tahun" id="nilaiTahun" required>

                                <option value="">
                                    -TAHUN-
                                </option>

                                @foreach ($tahunOptions as $tahun)
                                    <option value="{{ $tahun }}" @selected(old('tahun', $currentYear) == $tahun)>

                                        {{ $tahun }}

                                    </option>
                                @endforeach

                            </select>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Jenis
                                <span>*</span>
                            </label>

                            <select name="jenisn" id="nilaiJenis" required>

                                <option value="">
                                    -JENIS-
                                </option>

                                @foreach ($jenisOptions as $item)
                                    <option value="{{ $item['id'] }}" @selected(old('jenisn') == $item['id'])>

                                        {{ $item['nama'] }}

                                    </option>
                                @endforeach

                            </select>

                        </div>


                        <div class="nilai-field">

                            <label>
                                Nilai
                                <span>*</span>
                            </label>

                            <div class="nilai-money-input">

                                <span>
                                    Rp
                                </span>

                                <input type="number" name="nilai" id="nilaiNominal" value="{{ old('nilai') }}"
                                    min="0" step="1" placeholder="0" required>

                            </div>

                        </div>


                        <div class="nilai-field nilai-field-full">

                            <label>
                                Uraian
                                <span>*</span>
                            </label>

                            <textarea name="urai" id="nilaiUraian" rows="5" required placeholder="Masukkan uraian transaksi...">{{ old('urai') }}</textarea>

                        </div>


                        <div class="nilai-field nilai-field-full">

                            <label>
                                Dokumen PDF / Hasil Scan
                            </label>

                            <div class="nilai-upload-box">

                                <input type="file" name="dokumen_pdf" id="nilaiPdfInput"
                                    accept=".pdf,application/pdf">


                                <div class="nilai-upload-content">

                                    <div class="nilai-upload-icon">
                                        <i data-lucide="file-up"></i>
                                    </div>


                                    <div>

                                        <strong>
                                            Pilih file PDF
                                        </strong>

                                        <span>
                                            Format PDF,
                                            maksimal 15 MB.
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div id="nilaiExistingPdf" class="nilai-existing-pdf nilai-field-full" hidden>

                            <div>

                                <i data-lucide="file-check-2"></i>

                                <div>

                                    <strong id="nilaiExistingPdfName">
                                        Dokumen tersedia
                                    </strong>

                                    <span>
                                        PDF yang tersimpan
                                    </span>

                                </div>

                            </div>


                            <button type="button" id="nilaiExistingPdfButton">
                                Preview
                            </button>

                        </div>


                        <div id="nilaiLocalPdfPreview" class="nilai-local-preview nilai-field-full" hidden>

                            <div class="nilai-local-preview-header">

                                <strong>
                                    Preview PDF Baru
                                </strong>

                                <span id="nilaiLocalPdfName"></span>

                            </div>

                            <iframe id="nilaiLocalPdfFrame" title="Preview PDF Baru"></iframe>

                        </div>

                    </div>

                </div>


                <div class="nilai-modal-footer">

                    <button type="button" class="nilai-secondary-button" data-close-dialog="nilaiFormModal">
                        Batal
                    </button>


                    <button type="submit" class="nilai-primary-button">

                        <i data-lucide="save"></i>

                        Simpan Data

                    </button>

                </div>

            </form>

        </dialog>


        {{-- =====================================================
         DETAIL
    ====================================================== --}}

        <dialog id="nilaiDetailModal" class="nilai-modal nilai-detail-modal">

            <div class="nilai-modal-header">

                <div>

                    <span class="nilai-modal-eyebrow">
                        DETAIL TRANSAKSI
                    </span>

                    <h3>
                        Detail Nilai Aset
                    </h3>

                    <p>
                        Informasi lengkap transaksi nilai aset.
                    </p>

                </div>


                <button type="button" class="nilai-modal-close" data-close-dialog="nilaiDetailModal">

                    <i data-lucide="x"></i>

                </button>

            </div>


            <div class="nilai-modal-body">

                <div class="nilai-detail-grid">

                    <div>

                        <span>
                            No Voucher
                        </span>

                        <strong id="detailVoucher">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Tanggal
                        </span>

                        <strong id="detailTanggal">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Aktiva
                        </span>

                        <strong id="detailAktiva">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Tahun
                        </span>

                        <strong id="detailTahun">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Lokasi
                        </span>

                        <strong id="detailLokasi">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Departemen
                        </span>

                        <strong id="detailDepartemen">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Divisi
                        </span>

                        <strong id="detailDivisi">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Golongan
                        </span>

                        <strong id="detailGolongan">
                            -
                        </strong>

                    </div>


                    <div>

                        <span>
                            Jenis
                        </span>

                        <strong id="detailJenis">
                            -
                        </strong>

                    </div>


                    <div class="nilai-detail-money">

                        <span>
                            Nilai
                        </span>

                        <strong id="detailNilai">
                            Rp 0
                        </strong>

                    </div>


                    <div class="nilai-detail-full">

                        <span>
                            Uraian
                        </span>

                        <p id="detailUraian">
                            -
                        </p>

                    </div>

                </div>

            </div>


            <div class="nilai-modal-footer">

                <button type="button" id="detailPdfButton" class="nilai-outline-button" hidden>

                    <i data-lucide="file-text"></i>

                    Lihat PDF

                </button>


                <button type="button" class="nilai-primary-button" data-close-dialog="nilaiDetailModal">
                    Tutup
                </button>

            </div>

        </dialog>


        {{-- =====================================================
         PDF MODAL
    ====================================================== --}}

        <dialog id="nilaiPdfModal" class="nilai-modal nilai-pdf-modal">

            <div class="nilai-modal-header">

                <div>

                    <span class="nilai-modal-eyebrow">
                        DOKUMEN NILAI ASET
                    </span>

                    <h3 id="nilaiPdfTitle">
                        Preview PDF
                    </h3>

                </div>


                <button type="button" class="nilai-modal-close" data-close-dialog="nilaiPdfModal">

                    <i data-lucide="x"></i>

                </button>

            </div>


            <div class="nilai-pdf-body">

                <iframe id="nilaiPdfFrame" title="Preview Dokumen PDF"></iframe>

            </div>


            <div class="nilai-modal-footer">

                <button type="button" class="nilai-secondary-button" data-close-dialog="nilaiPdfModal">
                    Tutup
                </button>


                <a href="#" id="nilaiPdfDownload" class="nilai-primary-button">

                    <i data-lucide="download"></i>

                    Download PDF

                </a>

            </div>

        </dialog>


        {{-- =====================================================
         DELETE
    ====================================================== --}}

        <dialog id="nilaiDeleteModal" class="nilai-modal nilai-delete-modal">

            <form method="POST" id="nilaiDeleteForm">

                @csrf
                @method('DELETE')


                <div class="nilai-delete-body">

                    <div class="nilai-delete-icon">
                        <i data-lucide="triangle-alert"></i>
                    </div>

                    <h3>
                        Hapus Nilai Aset?
                    </h3>

                    <p>

                        Data

                        <strong id="nilaiDeleteName"></strong>

                        akan dihapus secara permanen.

                        Jika data memiliki PDF,
                        dokumen PDF juga akan dihapus.

                    </p>

                </div>


                <div class="nilai-modal-footer">

                    <button type="button" class="nilai-secondary-button" data-close-dialog="nilaiDeleteModal">
                        Batal
                    </button>


                    <button type="submit" class="nilai-danger-button">

                        <i data-lucide="trash-2"></i>

                        Ya, Hapus

                    </button>

                </div>

            </form>

        </dialog>


        <script
        type="application/json"
        id="nilaiChartData"
    >{!! json_encode([
        'trendLabels' =>
            $trendLabels,

        'trendValues' =>
            $trendValues,

        'categoryLabels' =>
            $categoryLabels,

        'categoryValues' =>
            $categoryValues,
    ]) !!}</script>


    </div>


    <script
        src="{{ asset('js/pages/nilai.js') }}?v={{ file_exists(public_path('js/pages/nilai.js')) ? filemtime(public_path('js/pages/nilai.js')) : time() }}">
    </script>

@endsection
