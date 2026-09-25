@extends('layouts.main')

@section('title', 'SDM Pendukung')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/sdm.css') }}">
@endpush

@section('content')

    {{-- UI contoh: angka KPI, chart, dan tabel belum mengambil data PostgreSQL. --}}
    <section class="content sdm-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="sdm-hero">

            <div class="sdm-hero-overlay"></div>

            <div class="sdm-hero-top">

                <div>

                    <nav class="sdm-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Home">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong aria-current="page">SDM Pendukung</strong>

                    </nav>

                    <div class="sdm-heading">

                        <h1>SDM Pendukung</h1>

                        <p>
                            Kelola data SDM pendukung yang terlibat dalam pengelolaan aset di Perumdam Tirta Kencana Kota
                            Samarinda.
                        </p>

                    </div>

                </div>

                <div class="sdm-date-card">

                    <div class="sdm-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="sdmCurrentDate">-</strong>
                        <span id="sdmCurrentTime">-</span>
                    </div>

                </div>

            </div>

            {{-- KPI --}}
            <div class="sdm-kpi-grid">

                <div class="sdm-kpi-card">

                    <div class="sdm-kpi-icon">
                        <i data-lucide="users-round"></i>
                    </div>

                    <div class="sdm-kpi-content">

                        <span>Total SDM Pendukung</span>

                        <div class="sdm-kpi-value">
                            <strong>128</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +6
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                    <div class="sdm-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />
                        </svg>
                    </div>

                </div>

                <div class="sdm-kpi-card">

                    <div class="sdm-kpi-icon">
                        <i data-lucide="building-2"></i>
                    </div>

                    <div class="sdm-kpi-content">
                        <span>Total Departemen</span>
                        <strong>10</strong>
                    </div>

                    <div class="sdm-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>

                <div class="sdm-kpi-card">

                    <div class="sdm-kpi-icon">
                        <i data-lucide="network"></i>
                    </div>

                    <div class="sdm-kpi-content">

                        <span>Total Divisi</span>

                        <strong>36</strong>

                        <p>divisi terkait</p>

                    </div>

                    <div class="sdm-kpi-watermark">
                        <i data-lucide="layers-3"></i>
                    </div>

                </div>

            </div>

        </section>

        {{-- FILTER --}}
        <section class="sdm-card sdm-filter-card">
            <div class="sdm-filter-header">
                <h3>Filter Data SDM Pendukung</h3>
                <button type="button" class="sdm-add-button" onclick="openSdmModal()"><i data-lucide="plus"
                        aria-hidden="true"></i>Tambah SDM Pendukung</button>
            </div>
            <div class="sdm-filter-grid">
                <div class="sdm-search">
                    <i data-lucide="search" aria-hidden="true"></i>
                    <input id="sdmSearch" type="search" placeholder="Cari nama, NIP, email, atau jabatan..."
                        aria-label="Cari nama, NIP, email, atau jabatan...">
                </div>
                <div class="sdm-select-group">
                    <label for="sdmDepartemen">Departemen</label>
                    <select id="sdmDepartemen">
                        <option value="">Semua Departemen</option>
                        <option value="Departemen Teknik">Departemen Teknik</option>
                        <option value="Departemen Umum dan SDM">Departemen Umum dan SDM</option>
                        <option value="Departemen Produksi">Departemen Produksi</option>
                        <option value="Departemen Keuangan">Departemen Keuangan</option>
                        <option value="Departemen Distribusi">Departemen Distribusi</option>
                        <option value="Departemen Perencanaan">Departemen Perencanaan</option>
                    </select>
                </div>
                <div class="sdm-select-group">
                    <label for="sdmDivisi">Divisi</label>
                    <select id="sdmDivisi">
                        <option value="">Semua Divisi</option>
                        <option value="Divisi Pemeliharaan" data-departemen="Departemen Teknik">Divisi Pemeliharaan</option>
                        <option value="Divisi SDM" data-departemen="Departemen Umum dan SDM">Divisi SDM</option>
                        <option value="Divisi Operasional" data-departemen="Departemen Produksi">Divisi Operasional</option>
                        <option value="Divisi Akuntansi" data-departemen="Departemen Keuangan">Divisi Akuntansi</option>
                        <option value="Divisi Teknologi Informasi" data-departemen="Departemen Umum dan SDM">Divisi
                            Teknologi Informasi</option>
                        <option value="Divisi Logistik" data-departemen="Departemen Distribusi">Divisi Logistik</option>
                        <option value="Divisi Pengembangan" data-departemen="Departemen Perencanaan">Divisi Pengembangan
                        </option>
                        <option value="Divisi Aset" data-departemen="Departemen Umum dan SDM">Divisi Aset</option>
                    </select>
                </div>
                <button type="button" class="sdm-filter-button" onclick="filterSdmTable()"><i data-lucide="list-filter"
                        aria-hidden="true"></i>Filter</button>
                <button type="button" class="sdm-reset-button" onclick="resetSdmFilter()"><i data-lucide="refresh-cw"
                        aria-hidden="true"></i>Reset</button>
                <button type="button" class="sdm-export-button" onclick="exportSdmCSV()"><i data-lucide="download"
                        aria-hidden="true"></i>Ekspor</button>
            </div>
        </section>

        {{-- TABEL --}}
        <section class="sdm-card sdm-table-card" id="sdmList" aria-labelledby="sdmListTitle">
            <div class="sdm-table-header">
                <h3 id="sdmListTitle">Daftar SDM Pendukung</h3>
                <span class="sdm-demo-badge" title="Seluruh angka dan daftar pada halaman ini adalah data contoh.">Data
                    contoh</span>
            </div>
            <div class="table-responsive" tabindex="0"
                aria-label="Daftar SDM Pendukung, geser untuk melihat kolom lainnya">
                <table class="sdm-table" id="sdmTable">
                    <thead>
                        <tr>
                            <th scope="col" class="sdm-col-no">No</th>
                            <th scope="col">Nama Lengkap</th>
                            <th scope="col">NIP</th>
                            <th scope="col">Jabatan</th>
                            <th scope="col">Departemen</th>
                            <th scope="col">Divisi</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="sdm-col-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-departemen="Departemen Teknik" data-divisi="Divisi Pemeliharaan"
                            data-email="andi.pratama@example.com">
                            <td>1</td>
                            <td>Andi Pratama</td>
                            <td class="sdm-nip">198805152010011012</td>
                            <td>Staf Teknik</td>
                            <td>Departemen Teknik</td>
                            <td>Divisi Pemeliharaan</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Andi Pratama"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Andi Pratama"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Andi Pratama"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Umum dan SDM" data-divisi="Divisi SDM"
                            data-email="siti.rahmawati@example.com">
                            <td>2</td>
                            <td>Siti Rahmawati</td>
                            <td class="sdm-nip">199203112015032001</td>
                            <td>Staf Administrasi</td>
                            <td>Departemen Umum dan SDM</td>
                            <td>Divisi SDM</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Siti Rahmawati"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Siti Rahmawati"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Siti Rahmawati"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Produksi" data-divisi="Divisi Operasional"
                            data-email="budi.santoso@example.com">
                            <td>3</td>
                            <td>Budi Santoso</td>
                            <td class="sdm-nip">197809202008121004</td>
                            <td>Pengawas</td>
                            <td>Departemen Produksi</td>
                            <td>Divisi Operasional</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Budi Santoso"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Budi Santoso"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Budi Santoso"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Keuangan" data-divisi="Divisi Akuntansi"
                            data-email="dewi.lestari@example.com">
                            <td>4</td>
                            <td>Dewi Lestari</td>
                            <td class="sdm-nip">199006172014062003</td>
                            <td>Analis Aset</td>
                            <td>Departemen Keuangan</td>
                            <td>Divisi Akuntansi</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Dewi Lestari"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Dewi Lestari"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Dewi Lestari"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Umum dan SDM" data-divisi="Divisi Teknologi Informasi"
                            data-email="rizky.maulana@example.com">
                            <td>5</td>
                            <td>Rizky Maulana</td>
                            <td class="sdm-nip">199501082016031007</td>
                            <td>Staf IT</td>
                            <td>Departemen Umum dan SDM</td>
                            <td>Divisi Teknologi Informasi</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Rizky Maulana"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Rizky Maulana"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Rizky Maulana"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Distribusi" data-divisi="Divisi Logistik"
                            data-email="maya.sari@example.com">
                            <td>6</td>
                            <td>Maya Sari</td>
                            <td class="sdm-nip">198712302011022006</td>
                            <td>Staf Gudang</td>
                            <td>Departemen Distribusi</td>
                            <td>Divisi Logistik</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Maya Sari"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Maya Sari"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Maya Sari"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Produksi" data-divisi="Divisi Operasional"
                            data-email="fahrul.hidayat@example.com">
                            <td>7</td>
                            <td>Fahrul Hidayat</td>
                            <td class="sdm-nip">199303272017041005</td>
                            <td>Teknisi</td>
                            <td>Departemen Produksi</td>
                            <td>Divisi Operasional</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Fahrul Hidayat"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Fahrul Hidayat"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Fahrul Hidayat"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Perencanaan" data-divisi="Divisi Pengembangan"
                            data-email="nur.aini@example.com">
                            <td>8</td>
                            <td>Nur Aini</td>
                            <td class="sdm-nip">199104112018022009</td>
                            <td>Staf Perencanaan</td>
                            <td>Departemen Perencanaan</td>
                            <td>Divisi Pengembangan</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Nur Aini"><i data-lucide="eye" aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Nur Aini"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Nur Aini"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Umum dan SDM" data-divisi="Divisi Teknologi Informasi"
                            data-email="agus.setiawan@example.com">
                            <td>9</td>
                            <td>Agus Setiawan</td>
                            <td class="sdm-nip">198605201209011003</td>
                            <td>Pranata Komputer</td>
                            <td>Departemen Umum dan SDM</td>
                            <td>Divisi Teknologi Informasi</td>
                            <td><span class="sdm-status is-inactive">Nonaktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Agus Setiawan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Agus Setiawan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Agus Setiawan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-departemen="Departemen Umum dan SDM" data-divisi="Divisi Aset"
                            data-email="wulan.sari@example.com">
                            <td>10</td>
                            <td>Wulan Sari</td>
                            <td class="sdm-nip">199707152020122008</td>
                            <td>Staf Inventaris</td>
                            <td>Departemen Umum dan SDM</td>
                            <td>Divisi Aset</td>
                            <td><span class="sdm-status is-active">Aktif</span></td>
                            <td>
                                <div class="sdm-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Wulan Sari"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Wulan Sari"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Wulan Sari"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr id="sdmEmptyRow" hidden>
                            <td colspan="8" class="sdm-empty">Tidak ada data yang sesuai. Coba kata kunci atau filter
                                lain.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="sdm-table-footer">
                <div class="sdm-table-info" id="sdmTableInfo" role="status" aria-live="polite">Menampilkan 1–10 dari 10
                    data contoh</div>
                <div class="sdm-pagination-area">
                    <select id="sdmPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                    <span>data per halaman</span>
                    <nav class="sdm-pagination" id="sdmPagination" aria-label="Halaman daftar SDM Pendukung"></nav>
                </div>
            </div>
        </section>

        {{-- DISTRIBUSI DAN DATA TERBARU --}}
        <div class="sdm-bottom-grid">
            <section class="sdm-card">
                <div class="sdm-bottom-header">
                    <h3>Distribusi SDM per Departemen</h3>
                </div>
                <div class="sdm-distribution-content">
                    <div class="sdm-chart-wrap">
                        <canvas id="sdmDistributionChart" role="img"
                            aria-label="Distribusi contoh 128 SDM Pendukung. Rincian tersedia pada legenda."></canvas>
                        <div class="sdm-chart-center"><strong>128</strong><span>SDM</span></div>
                    </div>
                    <div class="sdm-legend" id="sdmLegend">
                        <div data-label="Departemen Teknik" data-count="24" data-color="#3389ee">
                            <span class="sdm-dot c1"></span>
                            <p>Departemen Teknik</p><strong>24</strong><small>18,8%</small>
                        </div>
                        <div data-label="Departemen Umum dan SDM" data-count="32" data-color="#55a8f1">
                            <span class="sdm-dot c2"></span>
                            <p>Departemen Umum dan SDM</p><strong>32</strong><small>25,0%</small>
                        </div>
                        <div data-label="Departemen Produksi" data-count="26" data-color="#4fc184">
                            <span class="sdm-dot c3"></span>
                            <p>Departemen Produksi</p><strong>26</strong><small>20,3%</small>
                        </div>
                        <div data-label="Departemen Keuangan" data-count="18" data-color="#ffc85c">
                            <span class="sdm-dot c4"></span>
                            <p>Departemen Keuangan</p><strong>18</strong><small>14,1%</small>
                        </div>
                        <div data-label="Departemen Distribusi" data-count="16" data-color="#ff9024">
                            <span class="sdm-dot c5"></span>
                            <p>Departemen Distribusi</p><strong>16</strong><small>12,5%</small>
                        </div>
                        <div data-label="Lainnya" data-count="12" data-color="#ef6b73">
                            <span class="sdm-dot c6"></span>
                            <p>Lainnya</p><strong>12</strong><small>9,4%</small>
                        </div>
                    </div>
                </div>
            </section>
            <section class="sdm-card">
                <div class="sdm-bottom-header">
                    <h3>SDM Pendukung Terbaru</h3><a href="#sdmList" id="sdmViewAll">Lihat Semua</a>
                </div>
                <div class="table-responsive" tabindex="0"
                    aria-label="SDM Pendukung terbaru, geser untuk melihat kolom lainnya">
                    <table class="sdm-latest-table">
                        <thead>
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Nama Lengkap</th>
                                <th scope="col">Divisi</th>
                                <th scope="col">Tanggal Ditambahkan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Wulan Sari</td>
                                <td>Divisi Aset</td>
                                <td>15 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Nur Aini</td>
                                <td>Divisi Pengembangan</td>
                                <td>14 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Fahrul Hidayat</td>
                                <td>Divisi Operasional</td>
                                <td>13 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Rizky Maulana</td>
                                <td>Divisi Teknologi Informasi</td>
                                <td>12 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Dewi Lestari</td>
                                <td>Divisi Akuntansi</td>
                                <td>10 Jan 2025</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {{-- DIALOG UI: BELUM TERHUBUNG KE ENDPOINT CRUD --}}
        <dialog class="sdm-modal" id="sdmModal" aria-labelledby="sdmModalTitle" aria-describedby="sdmModalNote">
            <div class="sdm-modal-dialog">
                <div class="sdm-modal-header">
                    <div>
                        <h3 id="sdmModalTitle">Tambah SDM Pendukung</h3>
                        <p id="sdmModalDescription">Tambahkan data master SDM Pendukung.</p>
                    </div>
                    <button type="button" onclick="closeSdmModal()" aria-label="Tutup dialog"><i data-lucide="x"
                            aria-hidden="true"></i></button>
                </div>
                <form id="sdmForm">
                    <div class="sdm-modal-body">
                        <p class="sdm-modal-note" id="sdmModalNote">Pratinjau formulir. Penyimpanan ke database belum
                            dihubungkan.</p>
                        <div class="sdm-form-group">
                            <label for="sdmName">Nama Lengkap</label>
                            <input id="sdmName" name="nama_lengkap" type="text" maxlength="150"
                                placeholder="Masukkan nama lengkap" required>
                        </div>
                        <div class="sdm-form-group">
                            <label for="sdmNip">NIP</label>
                            <input id="sdmNip" name="nip" type="text" inputmode="numeric" pattern="[0-9]{18}"
                                maxlength="18" placeholder="18 digit NIP" required>
                        </div>
                        <div class="sdm-form-group">
                            <label for="sdmEmail">Email</label>
                            <input id="sdmEmail" name="email" type="email" maxlength="254"
                                placeholder="nama@example.com">
                        </div>
                        <div class="sdm-form-group">
                            <label for="sdmJabatan">Jabatan</label>
                            <input id="sdmJabatan" name="jabatan" type="text" maxlength="150"
                                placeholder="Masukkan jabatan" required>
                        </div>
                        <div class="sdm-form-group">
                            <label for="sdmFormDepartemen">Departemen</label>
                            <select id="sdmFormDepartemen" name="departemen" required>
                                <option value="">Pilih Departemen</option>
                                <option value="Departemen Teknik">Departemen Teknik</option>
                                <option value="Departemen Umum dan SDM">Departemen Umum dan SDM</option>
                                <option value="Departemen Produksi">Departemen Produksi</option>
                                <option value="Departemen Keuangan">Departemen Keuangan</option>
                                <option value="Departemen Distribusi">Departemen Distribusi</option>
                                <option value="Departemen Perencanaan">Departemen Perencanaan</option>
                            </select>
                        </div>
                        <div class="sdm-form-group">
                            <label for="sdmFormDivisi">Divisi</label>
                            <select id="sdmFormDivisi" name="divisi" required>
                                <option value="">Pilih Divisi</option>
                                <option value="Divisi Pemeliharaan" data-departemen="Departemen Teknik">Divisi
                                    Pemeliharaan</option>
                                <option value="Divisi SDM" data-departemen="Departemen Umum dan SDM">Divisi SDM</option>
                                <option value="Divisi Operasional" data-departemen="Departemen Produksi">Divisi
                                    Operasional</option>
                                <option value="Divisi Akuntansi" data-departemen="Departemen Keuangan">Divisi Akuntansi
                                </option>
                                <option value="Divisi Teknologi Informasi" data-departemen="Departemen Umum dan SDM">
                                    Divisi Teknologi Informasi</option>
                                <option value="Divisi Logistik" data-departemen="Departemen Distribusi">Divisi Logistik
                                </option>
                                <option value="Divisi Pengembangan" data-departemen="Departemen Perencanaan">Divisi
                                    Pengembangan</option>
                                <option value="Divisi Aset" data-departemen="Departemen Umum dan SDM">Divisi Aset</option>
                            </select>
                        </div>
                        <div class="sdm-form-group">
                            <label for="sdmStatus">Status</label>
                            <select id="sdmStatus" name="status" required>
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                    <div class="sdm-modal-footer">
                        <button type="button" class="sdm-cancel-button" onclick="closeSdmModal()">Tutup</button>
                        <button type="submit" class="sdm-save-button" id="sdmSaveButton" disabled
                            title="Tersedia setelah penyimpanan database dihubungkan.">Simpan SDM Pendukung</button>
                    </div>
                </form>
            </div>
        </dialog>
    </section>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>
    <script src="{{ asset('js/pages/sdm.js') }}"></script>
@endpush
