@extends('layouts.main')

@section('title', 'Divisi')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/divisi.css') }}">
@endpush

@section('content')

    <section class="content divisi-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="divisi-hero">

            <div class="divisi-hero-overlay"></div>

            <div class="divisi-hero-top">

                <div>

                    <div class="divisi-breadcrumb">

                        <a href="{{ route('dashboard') }}">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong>Divisi</strong>

                    </div>

                    <div class="divisi-heading">

                        <h1>Divisi</h1>

                        <p>
                            Kelola data divisi yang terhubung dengan departemen
                            pada sistem aset perusahaan.
                        </p>

                    </div>

                </div>


                <div class="divisi-date-card">

                    <div class="divisi-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="divisiCurrentDate">-</strong>
                        <span id="divisiCurrentTime">-</span>
                    </div>

                </div>

            </div>


            {{-- KPI --}}
            <div class="divisi-kpi-grid">

                <div class="divisi-kpi-card">

                    <div class="divisi-kpi-icon">
                        <i data-lucide="layers-3"></i>
                    </div>

                    <div class="divisi-kpi-content">

                        <span>Total Divisi</span>

                        <div class="divisi-kpi-value">
                            <strong>36</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +4
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                    <div class="divisi-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />
                        </svg>
                    </div>

                </div>


                <div class="divisi-kpi-card">

                    <div class="divisi-kpi-icon">
                        <i data-lucide="building-2"></i>
                    </div>

                    <div class="divisi-kpi-content">
                        <span>Total Departemen</span>
                        <strong>24</strong>
                    </div>

                    <div class="divisi-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>


                <div class="divisi-kpi-card">

                    <div class="divisi-kpi-icon">
                        <i data-lucide="clock-3"></i>
                    </div>

                    <div class="divisi-kpi-content">

                        <span>Update Terakhir</span>

                        <strong class="divisi-kpi-text">
                            Hari Ini
                        </strong>

                        <p>data master terbaru</p>

                    </div>

                    <div class="divisi-kpi-watermark">
                        <i data-lucide="calendar-days"></i>
                    </div>

                </div>

            </div>

        </section>


        {{-- ============================================================
         FILTER
    ============================================================= --}}
        <section class="divisi-card divisi-filter-card">

            <div class="divisi-filter-header">

                <h3>Filter Data Divisi</h3>

                <button type="button" class="divisi-add-button" onclick="openDivisiModal()">
                    <i data-lucide="plus"></i>
                    Tambah Divisi
                </button>

            </div>


            <div class="divisi-filter-grid">

                <div class="divisi-search">

                    <i data-lucide="search"></i>

                    <input type="text" id="divisiSearch" placeholder="Cari nama divisi atau kode divisi..."
                        oninput="filterDivisiTable()">

                </div>


                <div class="divisi-select-group">

                    <label>Departemen</label>

                    <select id="divisiDepartment" onchange="filterDivisiTable()">

                        <option value="">
                            Semua Departemen
                        </option>

                        <option value="Departemen Keuangan">
                            Departemen Keuangan
                        </option>

                        <option value="Departemen Umum dan SDM">
                            Departemen Umum dan SDM
                        </option>

                        <option value="Departemen Produksi">
                            Departemen Produksi
                        </option>

                        <option value="Departemen Distribusi">
                            Departemen Distribusi
                        </option>

                        <option value="Departemen Teknik">
                            Departemen Teknik
                        </option>

                        <option value="Departemen Humas dan Pelayanan">
                            Departemen Humas dan Pelayanan
                        </option>

                    </select>

                </div>


                <button class="divisi-filter-button" onclick="filterDivisiTable()">
                    <i data-lucide="list-filter"></i>
                    Filter
                </button>


                <button class="divisi-reset-button" onclick="resetDivisiFilter()">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>


                <button class="divisi-export-button" onclick="exportDivisiCSV()">
                    <i data-lucide="download"></i>
                    Ekspor
                    <i data-lucide="chevron-down"></i>
                </button>

            </div>

        </section>


        {{-- ============================================================
         TABLE
    ============================================================= --}}
        <section class="divisi-card divisi-table-card">

            <div class="divisi-table-header">
                <h3>Daftar Divisi</h3>
            </div>

            <div class="table-responsive">

                <table class="divisi-table" id="divisiTable">

                    <thead>
                        <tr>
                            <th class="divisi-col-no">No</th>
                            <th>Nama Divisi</th>
                            <th>Kode Divisi</th>
                            <th>Departemen</th>
                            <th class="divisi-col-action">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr data-department="Departemen Keuangan">
                            <td>1</td>
                            <td>Divisi Keuangan</td>
                            <td>KEU-01</td>
                            <td>Departemen Keuangan</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr data-department="Departemen Keuangan">
                            <td>2</td>
                            <td>Divisi Akuntansi</td>
                            <td>KEU-02</td>
                            <td>Departemen Keuangan</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr data-department="Departemen Umum dan SDM">
                            <td>3</td>
                            <td>Divisi Pengadaan</td>
                            <td>UMSDM-01</td>
                            <td>Departemen Umum dan SDM</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr data-department="Departemen Umum dan SDM">
                            <td>4</td>
                            <td>Divisi SDM</td>
                            <td>UMSDM-02</td>
                            <td>Departemen Umum dan SDM</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr data-department="Departemen Produksi">
                            <td>5</td>
                            <td>Divisi Produksi IPA</td>
                            <td>PROD-01</td>
                            <td>Departemen Produksi</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr data-department="Departemen Distribusi">
                            <td>6</td>
                            <td>Divisi Distribusi Zona Kota</td>
                            <td>DIST-01</td>
                            <td>Departemen Distribusi</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr data-department="Departemen Teknik">
                            <td>7</td>
                            <td>Divisi Pemeliharaan Teknik</td>
                            <td>TEK-01</td>
                            <td>Departemen Teknik</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr data-department="Departemen Humas dan Pelayanan">
                            <td>8</td>
                            <td>Divisi Pelayanan Pelanggan</td>
                            <td>HUM-01</td>
                            <td>Departemen Humas dan Pelayanan</td>
                            <td>
                                <div class="divisi-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                    </tbody>

                </table>

            </div>


            <div class="divisi-table-footer">

                <div class="divisi-table-info">
                    Menampilkan
                    <strong>1 - <span id="divisiShownCount">8</span></strong>
                    dari <strong>36</strong> data
                </div>

                <div class="divisi-pagination-area">

                    <select>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>

                    <span>data per halaman</span>

                    <div class="divisi-pagination">

                        <button disabled>
                            <i data-lucide="chevron-left"></i>
                        </button>

                        <button class="active">1</button>
                        <button>2</button>
                        <button>3</button>
                        <button>4</button>

                        <button>
                            <i data-lucide="chevron-right"></i>
                        </button>

                    </div>

                </div>

            </div>

        </section>


        {{-- ============================================================
         BOTTOM
    ============================================================= --}}
        <div class="divisi-bottom-grid">


            {{-- DISTRIBUSI --}}
            <section class="divisi-card">

                <div class="divisi-bottom-header">

                    <h3>
                        Distribusi Divisi per Departemen
                    </h3>

                </div>

                <div class="divisi-distribution-content">

                    <div class="divisi-chart-wrap">

                        <canvas id="divisiDistributionChart"></canvas>

                        <div class="divisi-chart-center">
                            <strong>36</strong>
                            <span>Divisi</span>
                        </div>

                    </div>


                    <div class="divisi-legend">

                        <div>
                            <span class="divisi-dot c1"></span>
                            <p>Departemen Keuangan</p>
                            <strong>6</strong>
                            <small>16,7%</small>
                        </div>

                        <div>
                            <span class="divisi-dot c2"></span>
                            <p>Departemen Umum dan SDM</p>
                            <strong>8</strong>
                            <small>22,2%</small>
                        </div>

                        <div>
                            <span class="divisi-dot c3"></span>
                            <p>Departemen Produksi</p>
                            <strong>5</strong>
                            <small>13,9%</small>
                        </div>

                        <div>
                            <span class="divisi-dot c4"></span>
                            <p>Departemen Distribusi</p>
                            <strong>6</strong>
                            <small>16,7%</small>
                        </div>

                        <div>
                            <span class="divisi-dot c5"></span>
                            <p>Departemen Teknik</p>
                            <strong>5</strong>
                            <small>13,9%</small>
                        </div>

                        <div>
                            <span class="divisi-dot c6"></span>
                            <p>Departemen Humas dan Pelayanan</p>
                            <strong>6</strong>
                            <small>16,7%</small>
                        </div>

                    </div>

                </div>

            </section>


            {{-- TERBARU --}}
            <section class="divisi-card">

                <div class="divisi-bottom-header">

                    <h3>Divisi Terbaru</h3>

                    <a href="#">
                        Lihat Semua
                    </a>

                </div>


                <div class="table-responsive">

                    <table class="divisi-latest-table">

                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Divisi</th>
                                <th>Departemen</th>
                                <th>Tanggal Dibuat</th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr>
                                <td>1</td>
                                <td>Divisi Logistik</td>
                                <td>Departemen Umum dan SDM</td>
                                <td>15 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>2</td>
                                <td>Divisi IT dan Sistem Informasi</td>
                                <td>Departemen Umum dan SDM</td>
                                <td>14 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>3</td>
                                <td>Divisi Pengawasan Kualitas</td>
                                <td>Departemen Produksi</td>
                                <td>12 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>4</td>
                                <td>Divisi Perencanaan Teknik</td>
                                <td>Departemen Teknik</td>
                                <td>10 Jan 2025</td>
                            </tr>

                            <tr>
                                <td>5</td>
                                <td>Divisi Hubungan Pelanggan</td>
                                <td>Departemen Humas dan Pelayanan</td>
                                <td>08 Jan 2025</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </section>

        </div>


        {{-- ============================================================
         MODAL
    ============================================================= --}}
        <div class="divisi-modal" id="divisiModal">

            <div class="divisi-modal-backdrop" onclick="closeDivisiModal()"></div>

            <div class="divisi-modal-dialog">

                <div class="divisi-modal-header">

                    <div>
                        <h3>Tambah Divisi</h3>
                        <p>Tambahkan divisi baru dan hubungkan ke departemen.</p>
                    </div>

                    <button type="button" onclick="closeDivisiModal()">
                        <i data-lucide="x"></i>
                    </button>

                </div>


                <div class="divisi-modal-body">

                    <div class="divisi-form-group">
                        <label>Nama Divisi</label>
                        <input type="text" placeholder="Masukkan nama divisi">
                    </div>

                    <div class="divisi-form-group">
                        <label>Kode Divisi</label>
                        <input type="text" placeholder="Contoh: PROD-01">
                    </div>

                    <div class="divisi-form-group">

                        <label>Departemen</label>

                        <select>

                            <option value="">
                                Pilih Departemen
                            </option>

                            <option>Departemen Keuangan</option>
                            <option>Departemen Umum dan SDM</option>
                            <option>Departemen Produksi</option>
                            <option>Departemen Distribusi</option>
                            <option>Departemen Teknik</option>
                            <option>Departemen Humas dan Pelayanan</option>

                        </select>

                    </div>

                </div>


                <div class="divisi-modal-footer">

                    <button class="divisi-cancel-button" onclick="closeDivisiModal()">
                        Batal
                    </button>

                    <button class="divisi-save-button">

                        <i data-lucide="save"></i>

                        Simpan Divisi

                    </button>

                </div>

            </div>

        </div>

    </section>

@endsection


@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="{{ asset('js/pages/divisi.js') }}"></script>
@endpush
