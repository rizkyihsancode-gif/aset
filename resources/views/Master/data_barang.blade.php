@extends('layouts.main')

@section('title', 'Barang')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/barang.css') }}">
@endpush


@section('content')

    <section class="content barang-page">


        {{-- ============================================================
         HERO
         BREADCRUMB + TITLE + DATE + KPI MENYATU
    ============================================================= --}}
        <section class="barang-hero">

            <div class="barang-hero-overlay"></div>


            {{-- ========================================================
             HERO TOP
        ========================================================= --}}
            <div class="barang-hero-top">


                {{-- LEFT --}}
                <div class="barang-hero-content">

                    {{-- BREADCRUMB --}}
                    <div class="barang-breadcrumb">

                        <a href="{{ route('dashboard') }}">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>
                            Master Data
                        </span>

                        <i data-lucide="chevron-right"></i>

                        <strong>
                            Barang
                        </strong>

                    </div>


                    {{-- TITLE --}}
                    <div class="barang-heading">

                        <h1>
                            Barang
                        </h1>

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
                            Kamis, 24 September 2026
                        </strong>

                        <span id="barangCurrentTime">
                            16:17 WIB
                        </span>

                    </div>

                </div>


            </div>



            {{-- ========================================================
             KPI - MASIH DI DALAM HERO
        ========================================================= --}}
            <div class="barang-kpi-grid">


                {{-- TOTAL BARANG --}}
                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon blue">
                        <i data-lucide="box"></i>
                    </div>


                    <div class="barang-kpi-content">

                        <span>
                            Total Barang
                        </span>


                        <div class="barang-kpi-value">

                            <strong>
                                1.284
                            </strong>


                            <small>

                                <i data-lucide="arrow-up"></i>

                                +12

                            </small>

                        </div>


                        <p>
                            dari tahun lalu
                        </p>

                    </div>


                    <div class="barang-sparkline">

                        <svg viewBox="0 0 100 45">

                            <polyline points="2,36 15,24 28,27 43,11 58,17 72,29 88,8 98,3" />

                        </svg>

                    </div>

                </div>



                {{-- TOTAL GOLONGAN --}}
                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon blue">
                        <i data-lucide="layers-3"></i>
                    </div>


                    <div class="barang-kpi-content">

                        <span>
                            Total Golongan
                        </span>

                        <strong>
                            18
                        </strong>

                        <p>
                            klasifikasi barang
                        </p>

                    </div>


                    <div class="barang-kpi-watermark">

                        <i data-lucide="chart-no-axes-column-increasing"></i>

                    </div>

                </div>



                {{-- UPDATE --}}
                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon blue">
                        <i data-lucide="clock-3"></i>
                    </div>


                    <div class="barang-kpi-content">

                        <span>
                            Update Terakhir
                        </span>

                        <strong class="barang-kpi-text">
                            Hari Ini
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

        </section>



        {{-- ============================================================
         FILTER DATA
    ============================================================= --}}
        <div class="barang-card barang-filter-card">


            <div class="barang-filter-header">

                <h3>
                    Filter Data Barang
                </h3>


                <button type="button" class="barang-add-button" onclick="openBarangModal()">

                    <i data-lucide="plus"></i>

                    <span>
                        Tambah Barang
                    </span>

                </button>

            </div>



            <div class="barang-filter-content">


                {{-- SEARCH --}}
                <div class="barang-search-input">

                    <i data-lucide="search"></i>

                    <input type="text" id="barangSearch" placeholder="Cari kode barang atau nama barang..."
                        oninput="filterBarangTable()">

                </div>



                {{-- GOLONGAN --}}
                <div class="barang-filter-group">

                    <select id="barangGolongan" onchange="filterBarangTable()">

                        <option value="">
                            Semua Golongan
                        </option>

                        <option value="Elektronik">
                            Elektronik
                        </option>

                        <option value="Furnitur">
                            Furnitur
                        </option>

                        <option value="Mekanikal">
                            Mekanikal
                        </option>

                        <option value="Elektrikal">
                            Elektrikal
                        </option>

                        <option value="Alat Kantor">
                            Alat Kantor
                        </option>

                    </select>

                </div>



                <button type="button" class="barang-filter-button" onclick="filterBarangTable()">

                    <i data-lucide="list-filter"></i>

                    Filter

                </button>



                <button type="button" class="barang-reset-button" onclick="resetBarangFilter()">

                    <i data-lucide="refresh-cw"></i>

                    Reset

                </button>



                <button type="button" class="barang-export-button" onclick="exportBarangCSV()">

                    <i data-lucide="download"></i>

                    Ekspor

                    <i data-lucide="chevron-down"></i>

                </button>


            </div>

        </div>



        {{-- ============================================================
         TABLE BARANG
    ============================================================= --}}
        <div class="barang-card barang-table-card">


            <div class="barang-table-header">

                <h3>
                    Daftar Barang
                </h3>

            </div>



            <div class="table-responsive">

                <table class="barang-table" id="barangTable">


                    <thead>

                        <tr>

                            <th class="barang-no-column">
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

                            <th class="barang-action-column">
                                Aksi
                            </th>

                        </tr>

                    </thead>



                    <tbody>

                        <tr data-golongan="Elektronik">

                            <td>1</td>

                            <td>
                                Laptop Dell Latitude 5420
                            </td>

                            <td>
                                BRG-001
                            </td>

                            <td>
                                Elektronik
                            </td>

                            <td>

                                <div class="barang-row-actions">

                                    <button type="button" class="view" title="Lihat Detail">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button type="button" class="edit" title="Edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button type="button" class="delete" title="Hapus">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr data-golongan="Elektronik">

                            <td>2</td>
                            <td>Printer Epson L5290</td>
                            <td>BRG-002</td>
                            <td>Elektronik</td>

                            <td>

                                <div class="barang-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr data-golongan="Mekanikal">

                            <td>3</td>
                            <td>Pompa Distribusi 250 m3/jam</td>
                            <td>BRG-003</td>
                            <td>Mekanikal</td>

                            <td>

                                <div class="barang-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr data-golongan="Furnitur">

                            <td>4</td>
                            <td>Meja Kerja Staff</td>
                            <td>BRG-004</td>
                            <td>Furnitur</td>

                            <td>

                                <div class="barang-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr data-golongan="Furnitur">

                            <td>5</td>
                            <td>Kursi Rapat Utama</td>
                            <td>BRG-005</td>
                            <td>Furnitur</td>

                            <td>

                                <div class="barang-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr data-golongan="Furnitur">

                            <td>6</td>
                            <td>Lemari Arsip Besi</td>
                            <td>BRG-006</td>
                            <td>Furnitur</td>

                            <td>

                                <div class="barang-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr data-golongan="Elektrikal">

                            <td>7</td>
                            <td>Panel Kontrol Motor</td>
                            <td>BRG-007</td>
                            <td>Elektrikal</td>

                            <td>

                                <div class="barang-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        <tr data-golongan="Mekanikal">

                            <td>8</td>
                            <td>Genset Cadangan 100 KVA</td>
                            <td>BRG-008</td>
                            <td>Mekanikal</td>

                            <td>

                                <div class="barang-row-actions">

                                    <button class="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>

                    </tbody>


                </table>

            </div>



            {{-- FOOTER TABLE --}}
            <div class="barang-table-footer">


                <div class="barang-table-info">

                    Menampilkan

                    <strong>
                        1 -
                        <span id="barangShownCount">
                            8
                        </span>
                    </strong>

                    dari

                    <strong>
                        1.284
                    </strong>

                    data

                </div>



                <div class="barang-pagination-area">


                    <select>

                        <option>10</option>
                        <option>25</option>
                        <option>50</option>

                    </select>


                    <span>
                        data per halaman
                    </span>



                    <div class="barang-pagination">

                        <button disabled>
                            <i data-lucide="chevron-left"></i>
                        </button>

                        <button class="active">
                            1
                        </button>

                        <button>2</button>
                        <button>3</button>
                        <button>4</button>
                        <button>5</button>

                        <button>
                            <i data-lucide="chevron-right"></i>
                        </button>

                    </div>


                </div>


            </div>


        </div>



        {{-- ============================================================
         BOTTOM
    ============================================================= --}}
        <div class="barang-bottom-grid">


            {{-- DISTRIBUSI --}}
            <div class="barang-card">


                <div class="barang-bottom-header">

                    <h3>
                        Distribusi Barang per Golongan
                    </h3>

                </div>



                <div class="barang-distribution-content">


                    <div class="barang-donut-wrap">

                        <canvas id="barangGolonganChart"></canvas>


                        <div class="barang-donut-center">

                            <strong>
                                1.284
                            </strong>

                            <span>
                                Barang
                            </span>

                        </div>

                    </div>



                    <div class="barang-legend">


                        <div>
                            <span class="barang-dot elektronik"></span>
                            <p>Elektronik</p>
                            <strong>412</strong>
                            <small>32,1%</small>
                        </div>


                        <div>
                            <span class="barang-dot furnitur"></span>
                            <p>Furnitur</p>
                            <strong>286</strong>
                            <small>22,3%</small>
                        </div>


                        <div>
                            <span class="barang-dot mekanikal"></span>
                            <p>Mekanikal</p>
                            <strong>234</strong>
                            <small>18,2%</small>
                        </div>


                        <div>
                            <span class="barang-dot elektrikal"></span>
                            <p>Elektrikal</p>
                            <strong>198</strong>
                            <small>15,4%</small>
                        </div>


                        <div>
                            <span class="barang-dot kantor"></span>
                            <p>Alat Kantor</p>
                            <strong>102</strong>
                            <small>7,9%</small>
                        </div>


                        <div>
                            <span class="barang-dot lainnya"></span>
                            <p>Lainnya</p>
                            <strong>52</strong>
                            <small>4,0%</small>
                        </div>


                    </div>


                </div>

            </div>



            {{-- BARANG TERBARU --}}
            <div class="barang-card">


                <div class="barang-bottom-header">

                    <h3>
                        Barang Terbaru
                    </h3>

                    <a href="#">
                        Lihat Semua
                    </a>

                </div>



                <div class="table-responsive">

                    <table class="barang-latest-table">

                        <thead>

                            <tr>
                                <th>No</th>
                                <th>Nama Barang</th>
                                <th>Golongan</th>
                                <th>Tanggal Ditambahkan</th>
                            </tr>

                        </thead>

                        <tbody>

                            <tr>
                                <td>1</td>
                                <td>Genset Cadangan 100 KVA</td>
                                <td>Mekanikal</td>
                                <td>15 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>2</td>
                                <td>Panel Kontrol Motor</td>
                                <td>Elektrikal</td>
                                <td>14 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>3</td>
                                <td>Lemari Arsip Besi</td>
                                <td>Furnitur</td>
                                <td>13 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>4</td>
                                <td>Kursi Rapat Utama</td>
                                <td>Furnitur</td>
                                <td>13 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>5</td>
                                <td>Meja Kerja Staff</td>
                                <td>Furnitur</td>
                                <td>12 Jan 2025</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


        </div>



        {{-- ============================================================
         MODAL TAMBAH BARANG
    ============================================================= --}}
        <div class="barang-modal" id="barangModal">

            <div class="barang-modal-backdrop" onclick="closeBarangModal()"></div>


            <div class="barang-modal-dialog">


                <div class="barang-modal-header">

                    <div>

                        <h3>
                            Tambah Barang
                        </h3>

                        <p>
                            Tambahkan data master barang baru.
                        </p>

                    </div>


                    <button type="button" onclick="closeBarangModal()">
                        <i data-lucide="x"></i>
                    </button>

                </div>



                <div class="barang-modal-body">


                    <div class="barang-modal-group">

                        <label>
                            Nama Barang
                        </label>

                        <input type="text" placeholder="Masukkan nama barang">

                    </div>



                    <div class="barang-modal-group">

                        <label>
                            Kode Barang
                        </label>

                        <input type="text" placeholder="Contoh: BRG-009">

                    </div>



                    <div class="barang-modal-group">

                        <label>
                            Golongan
                        </label>

                        <select>

                            <option value="">
                                Pilih Golongan
                            </option>

                            <option>Elektronik</option>
                            <option>Furnitur</option>
                            <option>Mekanikal</option>
                            <option>Elektrikal</option>
                            <option>Alat Kantor</option>

                        </select>

                    </div>


                </div>



                <div class="barang-modal-footer">

                    <button type="button" class="barang-modal-cancel" onclick="closeBarangModal()">
                        Batal
                    </button>


                    <button type="button" class="barang-modal-save">

                        <i data-lucide="save"></i>

                        Simpan Barang

                    </button>

                </div>


            </div>

        </div>


    </section>

@endsection


@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="{{ asset('js/pages/barang.js') }}"></script>
@endpush
