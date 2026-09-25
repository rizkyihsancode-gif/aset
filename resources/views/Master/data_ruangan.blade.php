@extends('layouts.main')

@section('title', 'Ruangan')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/ruangan.css') }}">
@endpush

@section('content')

    {{-- UI contoh: angka KPI, chart, dan tabel belum mengambil data PostgreSQL. --}}
    <section class="content ruangan-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="ruangan-hero">

            <div class="ruangan-hero-overlay"></div>

            <div class="ruangan-hero-top">

                <div>

                    <nav class="ruangan-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Home">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong aria-current="page">Ruangan</strong>

                    </nav>

                    <div class="ruangan-heading">

                        <h1>Ruangan</h1>

                        <p>
                            Kelola data ruangan yang digunakan sebagai referensi penempatan aset perusahaan.
                        </p>

                    </div>

                </div>

                <div class="ruangan-date-card">

                    <div class="ruangan-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="ruanganCurrentDate">-</strong>
                        <span id="ruanganCurrentTime">-</span>
                    </div>

                </div>

            </div>

            {{-- KPI --}}
            <div class="ruangan-kpi-grid">

                <div class="ruangan-kpi-card">

                    <div class="ruangan-kpi-icon">
                        <i data-lucide="door-open"></i>
                    </div>

                    <div class="ruangan-kpi-content">

                        <span>Total Ruangan</span>

                        <div class="ruangan-kpi-value">
                            <strong>186</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +12
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                    <div class="ruangan-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />
                        </svg>
                    </div>

                </div>

                <div class="ruangan-kpi-card">

                    <div class="ruangan-kpi-icon">
                        <i data-lucide="network"></i>
                    </div>

                    <div class="ruangan-kpi-content">
                        <span>Total Divisi Terkait</span>
                        <strong>36</strong>
                    </div>

                    <div class="ruangan-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>

                <div class="ruangan-kpi-card">

                    <div class="ruangan-kpi-icon">
                        <i data-lucide="clock-3"></i>
                    </div>

                    <div class="ruangan-kpi-content">

                        <span>Update Terakhir</span>

                        <strong class="ruangan-kpi-text">
                            Hari Ini
                        </strong>

                        <p>data master terbaru</p>

                    </div>

                    <div class="ruangan-kpi-watermark">
                        <i data-lucide="calendar-days"></i>
                    </div>

                </div>

            </div>

        </section>

        {{-- FILTER --}}
        <section class="ruangan-card ruangan-filter-card">
            <div class="ruangan-filter-header">
                <h3>Filter Data Ruangan</h3>
                <button type="button" class="ruangan-add-button" onclick="openRuanganModal()"><i data-lucide="plus"
                        aria-hidden="true"></i>Tambah Ruangan</button>
            </div>
            <div class="ruangan-filter-grid">
                <div class="ruangan-search">
                    <i data-lucide="search" aria-hidden="true"></i>
                    <input id="ruanganSearch" type="search" placeholder="Cari nama ruangan atau kode ruangan..."
                        aria-label="Cari nama ruangan atau kode ruangan...">
                </div>
                <div class="ruangan-select-group">
                    <label for="ruanganDivisi">Divisi</label>
                    <select id="ruanganDivisi">
                        <option value="">Semua Divisi</option>
                        <option value="Direksi">Direksi</option>
                        <option value="Sekretariat Perusahaan">Sekretariat Perusahaan</option>
                        <option value="Umum dan SDM">Umum dan SDM</option>
                        <option value="IT dan Sistem Informasi">IT dan Sistem Informasi</option>
                        <option value="Departemen Teknik">Departemen Teknik</option>
                        <option value="Produksi">Produksi</option>
                        <option value="Humas dan Pelayanan">Humas dan Pelayanan</option>
                        <option value="Distribusi">Distribusi</option>
                    </select>
                </div>
                <button type="button" class="ruangan-filter-button" onclick="filterRuanganTable()"><i
                        data-lucide="list-filter" aria-hidden="true"></i>Filter</button>
                <button type="button" class="ruangan-reset-button" onclick="resetRuanganFilter()"><i
                        data-lucide="refresh-cw" aria-hidden="true"></i>Reset</button>
                <button type="button" class="ruangan-export-button" onclick="exportRuanganCSV()"><i data-lucide="download"
                        aria-hidden="true"></i>Ekspor</button>
            </div>
        </section>

        {{-- TABEL --}}
        <section class="ruangan-card ruangan-table-card" id="ruanganList" aria-labelledby="ruanganListTitle">
            <div class="ruangan-table-header">
                <h3 id="ruanganListTitle">Daftar Ruangan</h3>
                <span class="ruangan-demo-badge" title="Seluruh angka dan daftar pada halaman ini adalah data contoh.">Data
                    contoh</span>
            </div>
            <div class="table-responsive" tabindex="0" aria-label="Daftar Ruangan, geser untuk melihat kolom lainnya">
                <table class="ruangan-table" id="ruanganTable">
                    <thead>
                        <tr>
                            <th scope="col" class="ruangan-col-no">No</th>
                            <th scope="col">Nama Ruangan</th>
                            <th scope="col">Kode Ruangan</th>
                            <th scope="col">Divisi</th>
                            <th scope="col">Keterangan</th>
                            <th scope="col" class="ruangan-col-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-divisi="Direksi">
                            <td>1</td>
                            <td>Ruang Direksi</td>
                            <td>RGN-001</td>
                            <td>Direksi</td>
                            <td class="ruangan-description">Ruang kerja direksi</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Ruang Direksi"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Ruang Direksi"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Ruang Direksi"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-divisi="Sekretariat Perusahaan">
                            <td>2</td>
                            <td>Ruang Rapat Utama</td>
                            <td>RGN-002</td>
                            <td>Sekretariat Perusahaan</td>
                            <td class="ruangan-description">Ruang rapat utama perusahaan</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Ruang Rapat Utama"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Ruang Rapat Utama"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Ruang Rapat Utama"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-divisi="Umum dan SDM">
                            <td>3</td>
                            <td>Ruang Arsip</td>
                            <td>RGN-003</td>
                            <td>Umum dan SDM</td>
                            <td class="ruangan-description">Penyimpanan dokumen fisik</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Ruang Arsip"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Ruang Arsip"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Ruang Arsip"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-divisi="IT dan Sistem Informasi">
                            <td>4</td>
                            <td>Ruang Server</td>
                            <td>RGN-004</td>
                            <td>IT dan Sistem Informasi</td>
                            <td class="ruangan-description">Infrastruktur server dan jaringan</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Ruang Server"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Ruang Server"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Ruang Server"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-divisi="Departemen Teknik">
                            <td>5</td>
                            <td>Gudang Teknik</td>
                            <td>RGN-005</td>
                            <td>Departemen Teknik</td>
                            <td class="ruangan-description">Penyimpanan peralatan teknik</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Gudang Teknik"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Gudang Teknik"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Gudang Teknik"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-divisi="Produksi">
                            <td>6</td>
                            <td>Lab Kualitas Air</td>
                            <td>RGN-006</td>
                            <td>Produksi</td>
                            <td class="ruangan-description">Pemeriksaan kualitas air</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Lab Kualitas Air"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Lab Kualitas Air"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Lab Kualitas Air"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-divisi="Humas dan Pelayanan">
                            <td>7</td>
                            <td>Ruang Pelayanan</td>
                            <td>RGN-007</td>
                            <td>Humas dan Pelayanan</td>
                            <td class="ruangan-description">Area pelayanan pelanggan</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Ruang Pelayanan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Ruang Pelayanan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Ruang Pelayanan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-divisi="Distribusi">
                            <td>8</td>
                            <td>Ruang Distribusi</td>
                            <td>RGN-008</td>
                            <td>Distribusi</td>
                            <td class="ruangan-description">Koordinasi operasional distribusi</td>
                            <td>
                                <div class="ruangan-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Ruang Distribusi"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Ruang Distribusi"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Ruang Distribusi"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr id="ruanganEmptyRow" hidden>
                            <td colspan="6" class="ruangan-empty">Tidak ada data yang sesuai. Coba kata kunci atau
                                filter lain.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="ruangan-table-footer">
                <div class="ruangan-table-info" id="ruanganTableInfo" role="status" aria-live="polite">Menampilkan 1–8
                    dari 8 data contoh</div>
                <div class="ruangan-pagination-area">
                    <select id="ruanganPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                    <span>data per halaman</span>
                    <nav class="ruangan-pagination" id="ruanganPagination" aria-label="Halaman daftar Ruangan"></nav>
                </div>
            </div>
        </section>

        {{-- DISTRIBUSI DAN DATA TERBARU --}}
        <div class="ruangan-bottom-grid">
            <section class="ruangan-card">
                <div class="ruangan-bottom-header">
                    <h3>Distribusi Ruangan per Divisi</h3>
                </div>
                <div class="ruangan-distribution-content">
                    <div class="ruangan-chart-wrap">
                        <canvas id="ruanganDistributionChart" role="img"
                            aria-label="Distribusi contoh 186 Ruangan. Rincian tersedia pada legenda."></canvas>
                        <div class="ruangan-chart-center"><strong>186</strong><span>Ruangan</span></div>
                    </div>
                    <div class="ruangan-legend" id="ruanganLegend">
                        <div data-label="Direksi" data-count="12" data-color="#3389ee">
                            <span class="ruangan-dot c1"></span>
                            <p>Direksi</p><strong>12</strong><small>6,5%</small>
                        </div>
                        <div data-label="Sekretariat Perusahaan" data-count="18" data-color="#55a8f1">
                            <span class="ruangan-dot c2"></span>
                            <p>Sekretariat Perusahaan</p><strong>18</strong><small>9,7%</small>
                        </div>
                        <div data-label="Umum dan SDM" data-count="28" data-color="#4fc184">
                            <span class="ruangan-dot c3"></span>
                            <p>Umum dan SDM</p><strong>28</strong><small>15,1%</small>
                        </div>
                        <div data-label="IT dan Sistem Informasi" data-count="14" data-color="#ffc85c">
                            <span class="ruangan-dot c4"></span>
                            <p>IT dan Sistem Informasi</p><strong>14</strong><small>7,5%</small>
                        </div>
                        <div data-label="Departemen Teknik" data-count="32" data-color="#ff9024">
                            <span class="ruangan-dot c5"></span>
                            <p>Departemen Teknik</p><strong>32</strong><small>17,2%</small>
                        </div>
                        <div data-label="Produksi" data-count="26" data-color="#ef6b73">
                            <span class="ruangan-dot c6"></span>
                            <p>Produksi</p><strong>26</strong><small>14,0%</small>
                        </div>
                        <div data-label="Humas dan Pelayanan" data-count="30" data-color="#8558e8">
                            <span class="ruangan-dot c7"></span>
                            <p>Humas dan Pelayanan</p><strong>30</strong><small>16,1%</small>
                        </div>
                        <div data-label="Distribusi" data-count="26" data-color="#5865e8">
                            <span class="ruangan-dot c8"></span>
                            <p>Distribusi</p><strong>26</strong><small>14,0%</small>
                        </div>
                    </div>
                </div>
            </section>
            <section class="ruangan-card">
                <div class="ruangan-bottom-header">
                    <h3>Ruangan Terbaru</h3><a href="#ruanganList" id="ruanganViewAll">Lihat Semua</a>
                </div>
                <div class="table-responsive" tabindex="0"
                    aria-label="Ruangan terbaru, geser untuk melihat kolom lainnya">
                    <table class="ruangan-latest-table">
                        <thead>
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Nama Ruangan</th>
                                <th scope="col">Divisi</th>
                                <th scope="col">Tanggal Ditambahkan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Ruang Monitoring Produksi</td>
                                <td>Produksi</td>
                                <td>15 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Ruang Rapat Distribusi</td>
                                <td>Distribusi</td>
                                <td>14 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Ruang Pelayanan Pelanggan 2</td>
                                <td>Humas dan Pelayanan</td>
                                <td>13 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Ruang Arsip Digital</td>
                                <td>Umum dan SDM</td>
                                <td>12 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Ruang Training</td>
                                <td>Umum dan SDM</td>
                                <td>10 Jan 2025</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {{-- DIALOG UI: BELUM TERHUBUNG KE ENDPOINT CRUD --}}
        <dialog class="ruangan-modal" id="ruanganModal" aria-labelledby="ruanganModalTitle"
            aria-describedby="ruanganModalNote">
            <div class="ruangan-modal-dialog">
                <div class="ruangan-modal-header">
                    <div>
                        <h3 id="ruanganModalTitle">Tambah Ruangan</h3>
                        <p id="ruanganModalDescription">Tambahkan data master Ruangan.</p>
                    </div>
                    <button type="button" onclick="closeRuanganModal()" aria-label="Tutup dialog"><i data-lucide="x"
                            aria-hidden="true"></i></button>
                </div>
                <form id="ruanganForm">
                    <div class="ruangan-modal-body">
                        <p class="ruangan-modal-note" id="ruanganModalNote">Pratinjau formulir. Penyimpanan ke database
                            belum dihubungkan.</p>
                        <div class="ruangan-form-group">
                            <label for="ruanganName">Nama Ruangan</label>
                            <input id="ruanganName" name="nama_ruangan" type="text" maxlength="150"
                                placeholder="Masukkan nama ruangan" required>
                        </div>
                        <div class="ruangan-form-group">
                            <label for="ruanganCode">Kode Ruangan</label>
                            <input id="ruanganCode" name="kode_ruangan" type="text" maxlength="50"
                                placeholder="Contoh: RGN-009" required>
                        </div>
                        <div class="ruangan-form-group">
                            <label for="ruanganFormDivisi">Divisi</label>
                            <select id="ruanganFormDivisi" name="divisi" required>
                                <option value="">Pilih Divisi</option>
                                <option value="Direksi">Direksi</option>
                                <option value="Sekretariat Perusahaan">Sekretariat Perusahaan</option>
                                <option value="Umum dan SDM">Umum dan SDM</option>
                                <option value="IT dan Sistem Informasi">IT dan Sistem Informasi</option>
                                <option value="Departemen Teknik">Departemen Teknik</option>
                                <option value="Produksi">Produksi</option>
                                <option value="Humas dan Pelayanan">Humas dan Pelayanan</option>
                                <option value="Distribusi">Distribusi</option>
                            </select>
                        </div>
                        <div class="ruangan-form-group">
                            <label for="ruanganDescription">Keterangan</label>
                            <textarea id="ruanganDescription" name="keterangan" rows="3" maxlength="500"
                                placeholder="Keterangan penggunaan ruangan"></textarea>
                        </div>
                    </div>
                    <div class="ruangan-modal-footer">
                        <button type="button" class="ruangan-cancel-button" onclick="closeRuanganModal()">Tutup</button>
                        <button type="submit" class="ruangan-save-button" id="ruanganSaveButton" disabled
                            title="Tersedia setelah penyimpanan database dihubungkan.">Simpan Ruangan</button>
                    </div>
                </form>
            </div>
        </dialog>
    </section>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>
    <script src="{{ asset('js/pages/ruangan.js') }}"></script>
@endpush
