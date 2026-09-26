@extends('layouts.main')

@section('title', 'Bahan')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/bahan.css') }}">
@endpush

@section('content')

    {{-- UI contoh: angka KPI, chart, dan tabel belum mengambil data PostgreSQL. --}}
    <section class="content bahan-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="bahan-hero">

            <div class="bahan-hero-overlay"></div>

            <div class="bahan-hero-top">

                <div>

                    <nav class="bahan-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Home">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong aria-current="page">Bahan</strong>

                    </nav>

                    <div class="bahan-heading">

                        <h1>Bahan</h1>

                        <p>
                            Kelola data bahan pada Perumdam Tirta Kencana Kota Samarinda.
                        </p>

                    </div>

                </div>

                <div class="bahan-date-card">

                    <div class="bahan-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="bahanCurrentDate">-</strong>
                        <span id="bahanCurrentTime">-</span>
                    </div>

                </div>

            </div>

            {{-- KPI --}}
            <div class="bahan-kpi-grid">

                <div class="bahan-kpi-card">

                    <div class="bahan-kpi-icon">
                        <i data-lucide="package"></i>
                    </div>

                    <div class="bahan-kpi-content">

                        <span>Total Bahan</span>

                        <div class="bahan-kpi-value">
                            <strong>156</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +12
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                    <div class="bahan-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />
                        </svg>
                    </div>

                </div>

                <div class="bahan-kpi-card">

                    <div class="bahan-kpi-icon">
                        <i data-lucide="layers-3"></i>
                    </div>

                    <div class="bahan-kpi-content">
                        <span>Kategori Bahan</span>
                        <strong>12</strong>
                    </div>

                    <div class="bahan-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>

                <div class="bahan-kpi-card">

                    <div class="bahan-kpi-icon">
                        <i data-lucide="building-2"></i>
                    </div>

                    <div class="bahan-kpi-content">

                        <span>Departemen Pengguna</span>

                        <strong>18</strong>

                        <p>data master terkait</p>

                    </div>

                    <div class="bahan-kpi-watermark">
                        <i data-lucide="calendar-days"></i>
                    </div>

                </div>

            </div>

        </section>

        {{-- FILTER --}}
        <section class="bahan-card bahan-filter-card">
            <div class="bahan-filter-header">
                <h3>Filter Data Bahan</h3>
                <button type="button" class="bahan-add-button" onclick="openBahanModal()"><i data-lucide="plus"
                        aria-hidden="true"></i>Tambah Bahan</button>
            </div>
            <div class="bahan-filter-grid">
                <div class="bahan-search"><i data-lucide="search" aria-hidden="true"></i><input id="bahanSearch"
                        type="search" placeholder="Cari kode, nama bahan, atau kategori..."
                        aria-label="Cari kode, nama bahan, atau kategori..."></div>
                <div class="bahan-select-group">
                    <label for="bahanKategori">Kategori</label>
                    <select id="bahanKategori">
                        <option value="">Semua Kategori</option>
                        <option value="Bahan Kimia">Bahan Kimia</option>
                        <option value="Bahan Pendukung">Bahan Pendukung</option>
                        <option value="Bahan Operasional">Bahan Operasional</option>
                        <option value="Bahan Bakar">Bahan Bakar</option>
                    </select>
                </div>
                <div class="bahan-select-group">
                    <label for="bahanDepartemen">Departemen</label>
                    <select id="bahanDepartemen">
                        <option value="">Semua Departemen</option>
                        <option value="Produksi">Produksi</option>
                        <option value="Teknik">Teknik</option>
                    </select>
                </div>
                <button type="button" class="bahan-filter-button" onclick="filterBahanTable()"><i data-lucide="list-filter"
                        aria-hidden="true"></i>Filter</button>
                <button type="button" class="bahan-reset-button" onclick="resetBahanFilter()"><i data-lucide="refresh-cw"
                        aria-hidden="true"></i>Reset</button>
                <button type="button" class="bahan-export-button" onclick="exportBahanCSV()"><i data-lucide="download"
                        aria-hidden="true"></i>Ekspor</button>
            </div>
        </section>

        {{-- TABEL --}}
        <section class="bahan-card bahan-table-card" id="bahanList" aria-labelledby="bahanListTitle">
            <div class="bahan-table-header">
                <h3 id="bahanListTitle">Daftar Bahan</h3><span class="bahan-demo-badge"
                    title="Seluruh angka dan daftar pada halaman ini adalah data contoh.">Data contoh</span>
            </div>
            <div class="table-responsive" tabindex="0" aria-label="Daftar Bahan, geser untuk melihat kolom lainnya">
                <table class="bahan-table" id="bahanTable">
                    <thead>
                        <tr>
                            <th scope="col" class="bahan-col-no">No</th>
                            <th scope="col">Kode Bahan</th>
                            <th scope="col">Nama Bahan</th>
                            <th scope="col">Kategori</th>
                            <th scope="col">Satuan</th>
                            <th scope="col">Departemen</th>
                            <th scope="col">Stok</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="bahan-col-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-record data-kategori="Bahan Kimia" data-departemen="Produksi" data-stok="12500">
                            <td>1</td>
                            <td class="bahan-code">BH-001</td>
                            <td>Tawas (Aluminium Sulfat)</td>
                            <td>Bahan Kimia</td>
                            <td>Kg</td>
                            <td>Produksi</td>
                            <td class="bahan-stock">12.500</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Tawas (Aluminium Sulfat)"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Tawas (Aluminium Sulfat)"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Tawas (Aluminium Sulfat)"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Kimia" data-departemen="Produksi" data-stok="8750">
                            <td>2</td>
                            <td class="bahan-code">BH-002</td>
                            <td>Kaporit (Calcium Hypochlorite)</td>
                            <td>Bahan Kimia</td>
                            <td>Kg</td>
                            <td>Produksi</td>
                            <td class="bahan-stock">8.750</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Kaporit (Calcium Hypochlorite)"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Kaporit (Calcium Hypochlorite)"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Kaporit (Calcium Hypochlorite)"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Kimia" data-departemen="Produksi" data-stok="5200">
                            <td>3</td>
                            <td class="bahan-code">BH-003</td>
                            <td>Soda Ash (Na₂CO₃)</td>
                            <td>Bahan Kimia</td>
                            <td>Kg</td>
                            <td>Produksi</td>
                            <td class="bahan-stock">5.200</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Soda Ash (Na₂CO₃)"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Soda Ash (Na₂CO₃)"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Soda Ash (Na₂CO₃)"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Kimia" data-departemen="Produksi" data-stok="1850">
                            <td>4</td>
                            <td class="bahan-code">BH-004</td>
                            <td>Polymer</td>
                            <td>Bahan Kimia</td>
                            <td>Kg</td>
                            <td>Produksi</td>
                            <td class="bahan-stock">1.850</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Polymer"><i data-lucide="eye" aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Polymer"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Polymer"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Pendukung" data-departemen="Produksi" data-stok="25000">
                            <td>5</td>
                            <td class="bahan-code">BH-005</td>
                            <td>Pasir Silika</td>
                            <td>Bahan Pendukung</td>
                            <td>Kg</td>
                            <td>Produksi</td>
                            <td class="bahan-stock">25.000</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Pasir Silika"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Pasir Silika"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Pasir Silika"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Pendukung" data-departemen="Produksi" data-stok="10000">
                            <td>6</td>
                            <td class="bahan-code">BH-006</td>
                            <td>Karbon Aktif</td>
                            <td>Bahan Pendukung</td>
                            <td>Kg</td>
                            <td>Produksi</td>
                            <td class="bahan-stock">10.000</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Karbon Aktif"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Karbon Aktif"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Karbon Aktif"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Pendukung" data-departemen="Produksi" data-stok="7500">
                            <td>7</td>
                            <td class="bahan-code">BH-007</td>
                            <td>Media Filter</td>
                            <td>Bahan Pendukung</td>
                            <td>Kg</td>
                            <td>Produksi</td>
                            <td class="bahan-stock">7.500</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Media Filter"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Media Filter"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Media Filter"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Operasional" data-departemen="Teknik" data-stok="320">
                            <td>8</td>
                            <td class="bahan-code">BH-008</td>
                            <td>Oli Pelumas</td>
                            <td>Bahan Operasional</td>
                            <td>Liter</td>
                            <td>Teknik</td>
                            <td class="bahan-stock">320</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Oli Pelumas"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Oli Pelumas"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Oli Pelumas"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Operasional" data-departemen="Teknik" data-stok="180">
                            <td>9</td>
                            <td class="bahan-code">BH-009</td>
                            <td>Grease</td>
                            <td>Bahan Operasional</td>
                            <td>Kg</td>
                            <td>Teknik</td>
                            <td class="bahan-stock">180</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Grease"><i data-lucide="eye" aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Grease"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Grease"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-kategori="Bahan Bakar" data-departemen="Teknik" data-stok="1200">
                            <td>10</td>
                            <td class="bahan-code">BH-010</td>
                            <td>Solar</td>
                            <td>Bahan Bakar</td>
                            <td>Liter</td>
                            <td>Teknik</td>
                            <td class="bahan-stock">1.200</td>
                            <td><span class="bahan-status is-active">Aktif</span></td>
                            <td>
                                <div class="bahan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Solar"><i data-lucide="eye" aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Solar"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Solar"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr id="bahanEmptyRow" hidden>
                            <td colspan="9" class="bahan-empty">Tidak ada data yang sesuai. Coba kata kunci atau filter
                                lain.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="bahan-table-footer">
                <div class="bahan-table-info" id="bahanTableInfo" role="status" aria-live="polite">Menampilkan 1–10
                    dari 10 data contoh</div>
                <div class="bahan-pagination-area">
                    <select id="bahanPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select><span>data per halaman</span>
                    <nav class="bahan-pagination" id="bahanPagination" aria-label="Halaman daftar Bahan"></nav>
                </div>
            </div>
        </section>

        {{-- DISTRIBUSI DAN DATA TERBARU --}}
        <div class="bahan-bottom-grid">
            <section class="bahan-card">
                <div class="bahan-bottom-header">
                    <h3>Distribusi Bahan per Kategori</h3>
                </div>
                <div class="bahan-distribution-content">
                    <div class="bahan-chart-wrap">
                        <canvas id="bahanDistributionChart" role="img"
                            aria-label="Distribusi contoh 156 data Bahan. Rincian tersedia pada legenda."></canvas>
                        <div class="bahan-chart-center"><strong>156</strong><span>Bahan</span></div>
                    </div>
                    <div class="bahan-legend" id="bahanLegend">
                        <div data-label="Bahan Kimia" data-count="48" data-color="#3389ee"><span
                                class="bahan-dot c1"></span>
                            <p>Bahan Kimia</p><strong>48</strong><small>30,8%</small>
                        </div>
                        <div data-label="Bahan Pendukung" data-count="36" data-color="#55a8f1"><span
                                class="bahan-dot c2"></span>
                            <p>Bahan Pendukung</p><strong>36</strong><small>23,1%</small>
                        </div>
                        <div data-label="Bahan Operasional" data-count="28" data-color="#4fc184"><span
                                class="bahan-dot c3"></span>
                            <p>Bahan Operasional</p><strong>28</strong><small>17,9%</small>
                        </div>
                        <div data-label="Bahan Bakar" data-count="12" data-color="#ffc85c"><span
                                class="bahan-dot c4"></span>
                            <p>Bahan Bakar</p><strong>12</strong><small>7,7%</small>
                        </div>
                        <div data-label="Lainnya" data-count="32" data-color="#ff9024"><span
                                class="bahan-dot c5"></span>
                            <p>Lainnya</p><strong>32</strong><small>20,5%</small>
                        </div>
                    </div>
                </div>
            </section>
            <section class="bahan-card">
                <div class="bahan-bottom-header">
                    <h3>Bahan Terbaru</h3><a href="#bahanList" id="bahanViewAll">Lihat Semua</a>
                </div>
                <div class="table-responsive" tabindex="0"
                    aria-label="Bahan terbaru, geser untuk melihat kolom lainnya">
                    <table class="bahan-latest-table">
                        <thead>
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Nama Bahan</th>
                                <th scope="col">Kategori</th>
                                <th scope="col">Tanggal Ditambahkan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Solar</td>
                                <td>Bahan Bakar</td>
                                <td>15 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Grease</td>
                                <td>Bahan Operasional</td>
                                <td>14 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Oli Pelumas</td>
                                <td>Bahan Operasional</td>
                                <td>13 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Media Filter</td>
                                <td>Bahan Pendukung</td>
                                <td>12 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Karbon Aktif</td>
                                <td>Bahan Pendukung</td>
                                <td>10 Jan 2025</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {{-- DIALOG UI: BELUM TERHUBUNG KE ENDPOINT CRUD --}}
        <dialog class="bahan-modal" id="bahanModal" aria-labelledby="bahanModalTitle" aria-describedby="bahanModalNote">
            <div class="bahan-modal-dialog">
                <div class="bahan-modal-header">
                    <div>
                        <h3 id="bahanModalTitle">Tambah Bahan</h3>
                        <p id="bahanModalDescription">Tambahkan data master Bahan.</p>
                    </div>
                    <button type="button" onclick="closeBahanModal()" aria-label="Tutup dialog"><i data-lucide="x"
                            aria-hidden="true"></i></button>
                </div>
                <form id="bahanForm">
                    <div class="bahan-modal-body">
                        <p class="bahan-modal-note" id="bahanModalNote">Pratinjau formulir. Penyimpanan ke database belum
                            dihubungkan.</p>
                        <div class="bahan-form-group"><label for="bahanCode">Kode Bahan</label>
                            <input id="bahanCode" name="kode" type="text" maxlength="150" placeholder="BH-001"
                                required>
                        </div>
                        <div class="bahan-form-group"><label for="bahanName">Nama Bahan</label>
                            <input id="bahanName" name="nama" type="text" maxlength="150"
                                placeholder="Masukkan nama bahan" required>
                        </div>
                        <div class="bahan-form-group"><label for="bahanFormKategori">Kategori</label>
                            <select id="bahanFormKategori" name="kategori" required>
                                <option value="">Pilih Kategori</option>
                                <option value="Bahan Kimia">Bahan Kimia</option>
                                <option value="Bahan Pendukung">Bahan Pendukung</option>
                                <option value="Bahan Operasional">Bahan Operasional</option>
                                <option value="Bahan Bakar">Bahan Bakar</option>
                            </select>
                        </div>
                        <div class="bahan-form-group"><label for="bahanUnit">Satuan</label>
                            <select id="bahanUnit" name="satuan" required>
                                <option value="">Pilih Satuan</option>
                                <option value="Kg">Kg</option>
                                <option value="Liter">Liter</option>
                            </select>
                        </div>
                        <div class="bahan-form-group"><label for="bahanFormDepartemen">Departemen</label>
                            <select id="bahanFormDepartemen" name="departemen" required>
                                <option value="">Pilih Departemen</option>
                                <option value="Produksi">Produksi</option>
                                <option value="Teknik">Teknik</option>
                            </select>
                        </div>
                        <div class="bahan-form-group"><label for="bahanStock">Stok</label>
                            <input id="bahanStock" name="stok" type="number" min="0" step="0.01"
                                placeholder="0" required>
                        </div>
                        <div class="bahan-form-group"><label for="bahanStatus">Status</label>
                            <select id="bahanStatus" name="status" required>
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                    <div class="bahan-modal-footer">
                        <button type="button" class="bahan-cancel-button" onclick="closeBahanModal()">Tutup</button>
                        <button type="submit" class="bahan-save-button" id="bahanSaveButton" disabled
                            title="Tersedia setelah penyimpanan database dihubungkan.">Simpan Bahan</button>
                    </div>
                </form>
            </div>
        </dialog>
    </section>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>
    <script src="{{ asset('js/pages/bahan.js') }}"></script>
@endpush
    