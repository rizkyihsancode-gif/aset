@extends('layouts.main')

@section('title', 'Aktiva')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/kode_aktiva.css') }}">
@endpush

@section('content')

    {{-- UI contoh: angka KPI, chart, dan tabel belum mengambil data PostgreSQL. --}}
    <section class="content aktiva-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="aktiva-hero">

            <div class="aktiva-hero-overlay"></div>

            <div class="aktiva-hero-top">

                <div>

                    <nav class="aktiva-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Home">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong aria-current="page">Kode Aktiva</strong>

                    </nav>

                    <div class="aktiva-heading">

                        <h1>Kode Aktiva</h1>

                        <p>
                            Kelola data kode aktiva yang digunakan dalam klasifikasi aset pada Perumdam Tirta Kencana Kota
                            Samarinda.
                        </p>

                    </div>

                </div>

                <div class="aktiva-date-card">

                    <div class="aktiva-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="aktivaCurrentDate">-</strong>
                        <span id="aktivaCurrentTime">-</span>
                    </div>

                </div>

            </div>

            {{-- KPI --}}
            <div class="aktiva-kpi-grid">

                <div class="aktiva-kpi-card">

                    <div class="aktiva-kpi-icon">
                        <i data-lucide="badge-check"></i>
                    </div>

                    <div class="aktiva-kpi-content">

                        <span>Total Kode Aktiva</span>

                        <div class="aktiva-kpi-value">
                            <strong>124</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +8
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                    <div class="aktiva-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />
                        </svg>
                    </div>

                </div>

                <div class="aktiva-kpi-card">

                    <div class="aktiva-kpi-icon">
                        <i data-lucide="layout-grid"></i>
                    </div>

                    <div class="aktiva-kpi-content">
                        <span>Golongan Aktiva</span>
                        <strong>8</strong>
                    </div>

                    <div class="aktiva-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>

                <div class="aktiva-kpi-card">

                    <div class="aktiva-kpi-icon">
                        <i data-lucide="layers-3"></i>
                    </div>

                    <div class="aktiva-kpi-content">

                        <span>Jenis Aktiva</span>

                        <strong>26</strong>

                        <p>data master terkait</p>

                    </div>

                    <div class="aktiva-kpi-watermark">
                        <i data-lucide="calendar-days"></i>
                    </div>

                </div>

            </div>

        </section>

        {{-- FILTER --}}
        <section class="aktiva-card aktiva-filter-card">
            <div class="aktiva-filter-header">
                <h3>Filter Data Kode Aktiva</h3>
                <button type="button" class="aktiva-add-button" onclick="openAktivaModal()"><i data-lucide="plus"
                        aria-hidden="true"></i>Tambah Kode Aktiva</button>
            </div>
            <div class="aktiva-filter-grid">
                <div class="aktiva-search"><i data-lucide="search" aria-hidden="true"></i><input id="aktivaSearch"
                        type="search" placeholder="Cari kode, nama aktiva, atau keterangan..."
                        aria-label="Cari kode, nama aktiva, atau keterangan..."></div>
                <div class="aktiva-select-group">
                    <label for="aktivaGolongan">Golongan Aktiva</label>
                    <select id="aktivaGolongan">
                        <option value="">Semua Golongan Aktiva</option>
                        <option value="01">01. Tanah</option>
                        <option value="02">02. Peralatan dan Mesin</option>
                        <option value="03">03. Gedung dan Bangunan</option>
                        <option value="04">04. Jalan, Irigasi dan Jaringan</option>
                        <option value="05">05. Aset Tetap Lainnya</option>
                        <option value="06">06. Konstruksi Dalam Pengerjaan</option>
                        <option value="07">07. Aset Tak Berwujud</option>
                        <option value="08">08. Aset Lain-Lain</option>
                    </select>
                </div>
                <div class="aktiva-select-group">
                    <label for="aktivaJenis">Jenis Aktiva</label>
                    <select id="aktivaJenis">
                        <option value="">Semua Jenis Aktiva</option>
                        <option value="01.01" data-golongan="01">01.01 — Tanah</option>
                        <option value="02.01" data-golongan="02">02.01 — Alat Besar</option>
                        <option value="02.02" data-golongan="02">02.02 — Alat Angkutan</option>
                        <option value="03.01" data-golongan="03">03.01 — Bangunan Gedung</option>
                        <option value="04.01" data-golongan="04">04.01 — Jalan dan Jembatan</option>
                        <option value="05.01" data-golongan="05">05.01 — Buku Perpustakaan</option>
                        <option value="06.01" data-golongan="06">06.01 — Bangunan Gedung</option>
                        <option value="07.01" data-golongan="07">07.01 — Software</option>
                        <option value="08.01" data-golongan="08">08.01 — Aset Lain-Lain</option>
                    </select>
                </div>
                <button type="button" class="aktiva-filter-button" onclick="filterAktivaTable()"><i
                        data-lucide="list-filter" aria-hidden="true"></i>Filter</button>
                <button type="button" class="aktiva-reset-button" onclick="resetAktivaFilter()"><i data-lucide="refresh-cw"
                        aria-hidden="true"></i>Reset</button>
                <button type="button" class="aktiva-export-button" onclick="exportAktivaCSV()"><i
                        data-lucide="download" aria-hidden="true"></i>Ekspor</button>
            </div>
        </section>

        {{-- TABEL --}}
        <section class="aktiva-card aktiva-table-card" id="aktivaList" aria-labelledby="aktivaListTitle">
            <div class="aktiva-table-header">
                <h3 id="aktivaListTitle">Daftar Kode Aktiva</h3><span class="aktiva-demo-badge"
                    title="Seluruh angka dan daftar pada halaman ini adalah data contoh.">Data contoh</span>
            </div>
            <div class="table-responsive" tabindex="0"
                aria-label="Daftar Kode Aktiva, geser untuk melihat kolom lainnya">
                <table class="aktiva-table" id="aktivaTable">
                    <thead>
                        <tr>
                            <th scope="col" class="aktiva-col-no">No</th>
                            <th scope="col">Kode Aktiva</th>
                            <th scope="col">Nama Aktiva</th>
                            <th scope="col">Golongan Aktiva</th>
                            <th scope="col">Jenis Aktiva</th>
                            <th scope="col">Keterangan</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="aktiva-col-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-record data-golongan="01" data-jenis="01.01">
                            <td>1</td>
                            <td class="aktiva-code">01</td>
                            <td>Tanah</td>
                            <td>01. Tanah</td>
                            <td>01. Tanah</td>
                            <td class="aktiva-description">Tanah</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Tanah"><i data-lucide="eye" aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Tanah"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Tanah"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="02" data-jenis="02.01">
                            <td>2</td>
                            <td class="aktiva-code">02</td>
                            <td>Peralatan dan Mesin</td>
                            <td>02. Peralatan dan Mesin</td>
                            <td>01. Alat Besar</td>
                            <td class="aktiva-description">Alat besar</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Peralatan dan Mesin"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Peralatan dan Mesin"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Peralatan dan Mesin"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="03" data-jenis="03.01">
                            <td>3</td>
                            <td class="aktiva-code">03</td>
                            <td>Gedung dan Bangunan</td>
                            <td>03. Gedung dan Bangunan</td>
                            <td>01. Bangunan Gedung</td>
                            <td class="aktiva-description">Bangunan gedung kantor</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Gedung dan Bangunan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Gedung dan Bangunan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Gedung dan Bangunan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="04" data-jenis="04.01">
                            <td>4</td>
                            <td class="aktiva-code">04</td>
                            <td>Jalan, Irigasi dan Jaringan</td>
                            <td>04. Jalan, Irigasi dan Jaringan</td>
                            <td>01. Jalan dan Jembatan</td>
                            <td class="aktiva-description">Jalan lingkungan</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Jalan, Irigasi dan Jaringan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Jalan, Irigasi dan Jaringan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Jalan, Irigasi dan Jaringan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="05" data-jenis="05.01">
                            <td>5</td>
                            <td class="aktiva-code">05</td>
                            <td>Aset Tetap Lainnya</td>
                            <td>05. Aset Tetap Lainnya</td>
                            <td>01. Buku Perpustakaan</td>
                            <td class="aktiva-description">Buku dan koleksi perpustakaan</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Aset Tetap Lainnya"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Aset Tetap Lainnya"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Aset Tetap Lainnya"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="06" data-jenis="06.01">
                            <td>6</td>
                            <td class="aktiva-code">06</td>
                            <td>Konstruksi Dalam Pengerjaan</td>
                            <td>06. Konstruksi Dalam Pengerjaan</td>
                            <td>01. Bangunan Gedung</td>
                            <td class="aktiva-description">Pembangunan gedung</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Konstruksi Dalam Pengerjaan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Konstruksi Dalam Pengerjaan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Konstruksi Dalam Pengerjaan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="07" data-jenis="07.01">
                            <td>7</td>
                            <td class="aktiva-code">07</td>
                            <td>Aset Tak Berwujud</td>
                            <td>07. Aset Tak Berwujud</td>
                            <td>01. Software</td>
                            <td class="aktiva-description">Perangkat lunak</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Aset Tak Berwujud"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Aset Tak Berwujud"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Aset Tak Berwujud"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="08" data-jenis="08.01">
                            <td>8</td>
                            <td class="aktiva-code">08</td>
                            <td>Aset Lain-Lain</td>
                            <td>08. Aset Lain-Lain</td>
                            <td>01. Aset Lain-Lain</td>
                            <td class="aktiva-description">Aset lain-lain</td>
                            <td><span class="aktiva-status is-inactive">Nonaktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Aset Lain-Lain"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Aset Lain-Lain"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Aset Lain-Lain"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="02" data-jenis="02.01">
                            <td>9</td>
                            <td class="aktiva-code">02.01</td>
                            <td>Alat Besar</td>
                            <td>02. Peralatan dan Mesin</td>
                            <td>01. Alat Besar</td>
                            <td class="aktiva-description">Alat berat</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Alat Besar"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Alat Besar"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Alat Besar"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-golongan="02" data-jenis="02.02">
                            <td>10</td>
                            <td class="aktiva-code">02.02</td>
                            <td>Alat Angkutan</td>
                            <td>02. Peralatan dan Mesin</td>
                            <td>02. Alat Angkutan</td>
                            <td class="aktiva-description">Kendaraan dinas</td>
                            <td><span class="aktiva-status is-active">Aktif</span></td>
                            <td>
                                <div class="aktiva-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Alat Angkutan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Alat Angkutan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Alat Angkutan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr id="aktivaEmptyRow" hidden>
                            <td colspan="8" class="aktiva-empty">Tidak ada data yang sesuai. Coba kata kunci atau
                                filter lain.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="aktiva-table-footer">
                <div class="aktiva-table-info" id="aktivaTableInfo" role="status" aria-live="polite">Menampilkan 1–10
                    dari 10 data contoh</div>
                <div class="aktiva-pagination-area">
                    <select id="aktivaPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select><span>data per halaman</span>
                    <nav class="aktiva-pagination" id="aktivaPagination" aria-label="Halaman daftar Kode Aktiva"></nav>
                </div>
            </div>
        </section>

        {{-- DISTRIBUSI DAN DATA TERBARU --}}
        <div class="aktiva-bottom-grid">
            <section class="aktiva-card">
                <div class="aktiva-bottom-header">
                    <h3>Distribusi Kode Aktiva per Golongan</h3>
                </div>
                <div class="aktiva-distribution-content">
                    <div class="aktiva-chart-wrap">
                        <canvas id="aktivaDistributionChart" role="img"
                            aria-label="Distribusi contoh 124 data Kode Aktiva. Rincian tersedia pada legenda."></canvas>
                        <div class="aktiva-chart-center"><strong>124</strong><span>Kode Aktiva</span></div>
                    </div>
                    <div class="aktiva-legend" id="aktivaLegend">
                        <div data-label="01. Tanah" data-count="10" data-color="#3389ee"><span
                                class="aktiva-dot c1"></span>
                            <p>01. Tanah</p><strong>10</strong><small>8,1%</small>
                        </div>
                        <div data-label="02. Peralatan dan Mesin" data-count="42" data-color="#55a8f1"><span
                                class="aktiva-dot c2"></span>
                            <p>02. Peralatan dan Mesin</p><strong>42</strong><small>33,9%</small>
                        </div>
                        <div data-label="03. Gedung dan Bangunan" data-count="18" data-color="#4fc184"><span
                                class="aktiva-dot c3"></span>
                            <p>03. Gedung dan Bangunan</p><strong>18</strong><small>14,5%</small>
                        </div>
                        <div data-label="04. Jalan, Irigasi dan Jaringan" data-count="20" data-color="#ffc85c"><span
                                class="aktiva-dot c4"></span>
                            <p>04. Jalan, Irigasi dan Jaringan</p><strong>20</strong><small>16,1%</small>
                        </div>
                        <div data-label="05. Aset Tetap Lainnya" data-count="12" data-color="#ff9024"><span
                                class="aktiva-dot c5"></span>
                            <p>05. Aset Tetap Lainnya</p><strong>12</strong><small>9,7%</small>
                        </div>
                        <div data-label="06. Konstruksi Dalam Pengerjaan" data-count="8" data-color="#ef6b73"><span
                                class="aktiva-dot c6"></span>
                            <p>06. Konstruksi Dalam Pengerjaan</p><strong>8</strong><small>6,5%</small>
                        </div>
                        <div data-label="07. Aset Tak Berwujud" data-count="8" data-color="#8558e8"><span
                                class="aktiva-dot c7"></span>
                            <p>07. Aset Tak Berwujud</p><strong>8</strong><small>6,5%</small>
                        </div>
                        <div data-label="08. Aset Lain-Lain" data-count="6" data-color="#5865e8"><span
                                class="aktiva-dot c8"></span>
                            <p>08. Aset Lain-Lain</p><strong>6</strong><small>4,8%</small>
                        </div>
                    </div>
                </div>
            </section>
            <section class="aktiva-card">
                <div class="aktiva-bottom-header">
                    <h3>Kode Aktiva Terbaru</h3><a href="#aktivaList" id="aktivaViewAll">Lihat Semua</a>
                </div>
                <div class="table-responsive" tabindex="0"
                    aria-label="Kode Aktiva terbaru, geser untuk melihat kolom lainnya">
                    <table class="aktiva-latest-table">
                        <thead>
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Nama Aktiva</th>
                                <th scope="col">Golongan Aktiva</th>
                                <th scope="col">Tanggal Ditambahkan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Alat Angkutan</td>
                                <td>02. Peralatan dan Mesin</td>
                                <td>15 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Alat Besar</td>
                                <td>02. Peralatan dan Mesin</td>
                                <td>14 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Aset Lain-Lain</td>
                                <td>08. Aset Lain-Lain</td>
                                <td>13 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Aset Tak Berwujud</td>
                                <td>07. Aset Tak Berwujud</td>
                                <td>12 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Konstruksi Dalam Pengerjaan</td>
                                <td>06. Konstruksi Dalam Pengerjaan</td>
                                <td>10 Jan 2025</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {{-- DIALOG UI: BELUM TERHUBUNG KE ENDPOINT CRUD --}}
        <dialog class="aktiva-modal" id="aktivaModal" aria-labelledby="aktivaModalTitle"
            aria-describedby="aktivaModalNote">
            <div class="aktiva-modal-dialog">
                <div class="aktiva-modal-header">
                    <div>
                        <h3 id="aktivaModalTitle">Tambah Kode Aktiva</h3>
                        <p id="aktivaModalDescription">Tambahkan data master Kode Aktiva.</p>
                    </div>
                    <button type="button" onclick="closeAktivaModal()" aria-label="Tutup dialog"><i data-lucide="x"
                            aria-hidden="true"></i></button>
                </div>
                <form id="aktivaForm">
                    <div class="aktiva-modal-body">
                        <p class="aktiva-modal-note" id="aktivaModalNote">Pratinjau formulir. Penyimpanan ke database
                            belum dihubungkan.</p>
                        <div class="aktiva-form-group"><label for="aktivaCode">Kode Aktiva</label>
                            <input id="aktivaCode" name="kode" type="text" maxlength="150" placeholder="01"
                                required>
                        </div>
                        <div class="aktiva-form-group"><label for="aktivaName">Nama Aktiva</label>
                            <input id="aktivaName" name="nama" type="text" maxlength="150"
                                placeholder="Masukkan nama aktiva" required>
                        </div>
                        <div class="aktiva-form-group"><label for="aktivaFormGolongan">Golongan Aktiva</label>
                            <select id="aktivaFormGolongan" name="golongan" required>
                                <option value="">Pilih Golongan Aktiva</option>
                                <option value="01">01. Tanah</option>
                                <option value="02">02. Peralatan dan Mesin</option>
                                <option value="03">03. Gedung dan Bangunan</option>
                                <option value="04">04. Jalan, Irigasi dan Jaringan</option>
                                <option value="05">05. Aset Tetap Lainnya</option>
                                <option value="06">06. Konstruksi Dalam Pengerjaan</option>
                                <option value="07">07. Aset Tak Berwujud</option>
                                <option value="08">08. Aset Lain-Lain</option>
                            </select>
                        </div>
                        <div class="aktiva-form-group"><label for="aktivaFormJenis">Jenis Aktiva</label>
                            <select id="aktivaFormJenis" name="jenis" required>
                                <option value="">Pilih Jenis Aktiva</option>
                                <option value="01.01" data-golongan="01">01.01 — Tanah</option>
                                <option value="02.01" data-golongan="02">02.01 — Alat Besar</option>
                                <option value="02.02" data-golongan="02">02.02 — Alat Angkutan</option>
                                <option value="03.01" data-golongan="03">03.01 — Bangunan Gedung</option>
                                <option value="04.01" data-golongan="04">04.01 — Jalan dan Jembatan</option>
                                <option value="05.01" data-golongan="05">05.01 — Buku Perpustakaan</option>
                                <option value="06.01" data-golongan="06">06.01 — Bangunan Gedung</option>
                                <option value="07.01" data-golongan="07">07.01 — Software</option>
                                <option value="08.01" data-golongan="08">08.01 — Aset Lain-Lain</option>
                            </select>
                        </div>
                        <div class="aktiva-form-group aktiva-form-wide"><label for="aktivaDescription">Keterangan</label>
                            <textarea id="aktivaDescription" name="keterangan" rows="3" maxlength="500"
                                placeholder="Masukkan keterangan aktiva"></textarea>
                        </div>
                        <div class="aktiva-form-group"><label for="aktivaStatus">Status</label>
                            <select id="aktivaStatus" name="status" required>
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                    <div class="aktiva-modal-footer">
                        <button type="button" class="aktiva-cancel-button" onclick="closeAktivaModal()">Tutup</button>
                        <button type="submit" class="aktiva-save-button" id="aktivaSaveButton" disabled
                            title="Tersedia setelah penyimpanan database dihubungkan.">Simpan Kode Aktiva</button>
                    </div>
                </form>
            </div>
        </dialog>
    </section>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>
    <script src="{{ asset('js/pages/kode_aktiva.js') }}"></script>
@endpush
