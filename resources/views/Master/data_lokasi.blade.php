@extends('layouts.main')

@section('title', 'Lokasi')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/lokasi.css') }}">
@endpush

@section('content')

    {{-- UI contoh: angka KPI, chart, dan tabel belum mengambil data PostgreSQL. --}}
    <section class="content lokasi-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="lokasi-hero">

            <div class="lokasi-hero-overlay"></div>

            <div class="lokasi-hero-top">

                <div>

                    <nav class="lokasi-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Home">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong aria-current="page">Lokasi</strong>

                    </nav>

                    <div class="lokasi-heading">

                        <h1>Lokasi</h1>

                        <p>
                            Kelola data lokasi pada Perumdam Tirta Kencana Kota Samarinda.
                        </p>

                    </div>

                </div>

                <div class="lokasi-date-card">

                    <div class="lokasi-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="lokasiCurrentDate">-</strong>
                        <span id="lokasiCurrentTime">-</span>
                    </div>

                </div>

            </div>

            {{-- KPI --}}
            <div class="lokasi-kpi-grid">

                <div class="lokasi-kpi-card">

                    <div class="lokasi-kpi-icon">
                        <i data-lucide="map-pin"></i>
                    </div>

                    <div class="lokasi-kpi-content">

                        <span>Total Lokasi</span>

                        <div class="lokasi-kpi-value">
                            <strong>86</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +4
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                    <div class="lokasi-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />
                        </svg>
                    </div>

                </div>

                <div class="lokasi-kpi-card">

                    <div class="lokasi-kpi-icon">
                        <i data-lucide="building-2"></i>
                    </div>

                    <div class="lokasi-kpi-content">
                        <span>Lokasi Gedung</span>
                        <strong>52</strong>
                    </div>

                    <div class="lokasi-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>

                <div class="lokasi-kpi-card">

                    <div class="lokasi-kpi-icon">
                        <i data-lucide="map"></i>
                    </div>

                    <div class="lokasi-kpi-content">

                        <span>Lokasi Lapangan</span>

                        <strong>34</strong>

                        <p>data master terkait</p>

                    </div>

                    <div class="lokasi-kpi-watermark">
                        <i data-lucide="calendar-days"></i>
                    </div>

                </div>

            </div>

        </section>

        {{-- FILTER --}}
        <section class="lokasi-card lokasi-filter-card">
            <div class="lokasi-filter-header">
                <h3>Filter Data Lokasi</h3>
                <button type="button" class="lokasi-add-button" onclick="openLokasiModal()"><i data-lucide="plus"
                        aria-hidden="true"></i>Tambah Lokasi</button>
            </div>
            <div class="lokasi-filter-grid">
                <div class="lokasi-search"><i data-lucide="search" aria-hidden="true"></i><input id="lokasiSearch"
                        type="search" placeholder="Cari nama lokasi, kode, atau alamat..."
                        aria-label="Cari nama lokasi, kode, atau alamat..."></div>
                <div class="lokasi-select-group">
                    <label for="lokasiJenis">Jenis Lokasi</label>
                    <select id="lokasiJenis">
                        <option value="">Semua Jenis Lokasi</option>
                        <option value="Gedung">Gedung</option>
                        <option value="Instalasi">Instalasi</option>
                        <option value="Reservoir">Reservoir</option>
                        <option value="Gudang">Gudang</option>
                        <option value="Bengkel">Bengkel</option>
                    </select>
                </div>
                <div class="lokasi-select-group">
                    <label for="lokasiDepartemen">Departemen</label>
                    <select id="lokasiDepartemen">
                        <option value="">Semua Departemen</option>
                        <option value="Umum dan SDM">Umum dan SDM</option>
                        <option value="Produksi">Produksi</option>
                        <option value="Distribusi">Distribusi</option>
                        <option value="Pelayanan">Pelayanan</option>
                        <option value="Teknik">Teknik</option>
                    </select>
                </div>
                <button type="button" class="lokasi-filter-button" onclick="filterLokasiTable()"><i
                        data-lucide="list-filter" aria-hidden="true"></i>Filter</button>
                <button type="button" class="lokasi-reset-button" onclick="resetLokasiFilter()"><i data-lucide="refresh-cw"
                        aria-hidden="true"></i>Reset</button>
                <button type="button" class="lokasi-export-button" onclick="exportLokasiCSV()"><i data-lucide="download"
                        aria-hidden="true"></i>Ekspor</button>
            </div>
        </section>

        {{-- TABEL --}}
        <section class="lokasi-card lokasi-table-card" id="lokasiList" aria-labelledby="lokasiListTitle">
            <div class="lokasi-table-header">
                <h3 id="lokasiListTitle">Daftar Lokasi</h3><span class="lokasi-demo-badge"
                    title="Seluruh angka dan daftar pada halaman ini adalah data contoh.">Data contoh</span>
            </div>
            <div class="table-responsive" tabindex="0" aria-label="Daftar Lokasi, geser untuk melihat kolom lainnya">
                <table class="lokasi-table" id="lokasiTable">
                    <thead>
                        <tr>
                            <th scope="col" class="lokasi-col-no">No</th>
                            <th scope="col">Kode Lokasi</th>
                            <th scope="col">Nama Lokasi</th>
                            <th scope="col">Jenis Lokasi</th>
                            <th scope="col">Departemen</th>
                            <th scope="col">Alamat / Keterangan</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="lokasi-col-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-record data-jenis="Gedung" data-departemen="Umum dan SDM">
                            <td>1</td>
                            <td class="lokasi-code">LK-001</td>
                            <td>Kantor Pusat</td>
                            <td>Gedung</td>
                            <td>Umum dan SDM</td>
                            <td class="lokasi-description">Jl. Tirta Kencana No. 1, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Kantor Pusat"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Kantor Pusat"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Kantor Pusat"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Instalasi" data-departemen="Produksi">
                            <td>2</td>
                            <td class="lokasi-code">LK-002</td>
                            <td>IPA Gunung Lipan</td>
                            <td>Instalasi</td>
                            <td>Produksi</td>
                            <td class="lokasi-description">Jl. Gunung Lipan, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat IPA Gunung Lipan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit IPA Gunung Lipan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus IPA Gunung Lipan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Instalasi" data-departemen="Produksi">
                            <td>3</td>
                            <td class="lokasi-code">LK-003</td>
                            <td>IPA Sungai Kapih</td>
                            <td>Instalasi</td>
                            <td>Produksi</td>
                            <td class="lokasi-description">Jl. Sungai Kapih, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat IPA Sungai Kapih"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit IPA Sungai Kapih"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus IPA Sungai Kapih"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Reservoir" data-departemen="Distribusi">
                            <td>4</td>
                            <td class="lokasi-code">LK-004</td>
                            <td>Reservoir Lempake</td>
                            <td>Reservoir</td>
                            <td>Distribusi</td>
                            <td class="lokasi-description">Lempake, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Reservoir Lempake"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Reservoir Lempake"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Reservoir Lempake"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Reservoir" data-departemen="Distribusi">
                            <td>5</td>
                            <td class="lokasi-code">LK-005</td>
                            <td>Reservoir Samarinda Seberang</td>
                            <td>Reservoir</td>
                            <td>Distribusi</td>
                            <td class="lokasi-description">Samarinda Seberang</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Reservoir Samarinda Seberang"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Reservoir Samarinda Seberang"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Reservoir Samarinda Seberang"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Gedung" data-departemen="Pelayanan">
                            <td>6</td>
                            <td class="lokasi-code">LK-006</td>
                            <td>Kantor Wilayah Sambutan</td>
                            <td>Gedung</td>
                            <td>Pelayanan</td>
                            <td class="lokasi-description">Jl. Sambutan, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Kantor Wilayah Sambutan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Kantor Wilayah Sambutan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Kantor Wilayah Sambutan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Gudang" data-departemen="Umum dan SDM">
                            <td>7</td>
                            <td class="lokasi-code">LK-007</td>
                            <td>Gudang Material</td>
                            <td>Gudang</td>
                            <td>Umum dan SDM</td>
                            <td class="lokasi-description">Jl. P. Antasari, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Gudang Material"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Gudang Material"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Gudang Material"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Bengkel" data-departemen="Teknik">
                            <td>8</td>
                            <td class="lokasi-code">LK-008</td>
                            <td>Bengkel Teknik</td>
                            <td>Bengkel</td>
                            <td>Teknik</td>
                            <td class="lokasi-description">Jl. DI Panjaitan, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Bengkel Teknik"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Bengkel Teknik"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Bengkel Teknik"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Gedung" data-departemen="Pelayanan">
                            <td>9</td>
                            <td class="lokasi-code">LK-009</td>
                            <td>Kantor Wilayah Palaran</td>
                            <td>Gedung</td>
                            <td>Pelayanan</td>
                            <td class="lokasi-description">Palaran, Samarinda</td>
                            <td><span class="lokasi-status is-inactive">Nonaktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat Kantor Wilayah Palaran"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit Kantor Wilayah Palaran"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus Kantor Wilayah Palaran"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-record data-jenis="Instalasi" data-departemen="Produksi">
                            <td>10</td>
                            <td class="lokasi-code">LK-010</td>
                            <td>IPA Loa Janan</td>
                            <td>Instalasi</td>
                            <td>Produksi</td>
                            <td class="lokasi-description">Loa Janan, Samarinda</td>
                            <td><span class="lokasi-status is-active">Aktif</span></td>
                            <td>
                                <div class="lokasi-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat"
                                        aria-label="Lihat IPA Loa Janan"><i data-lucide="eye"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit"
                                        aria-label="Edit IPA Loa Janan"><i data-lucide="square-pen"
                                            aria-hidden="true"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus"
                                        aria-label="Hapus IPA Loa Janan"><i data-lucide="trash-2"
                                            aria-hidden="true"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr id="lokasiEmptyRow" hidden>
                            <td colspan="8" class="lokasi-empty">Tidak ada data yang sesuai. Coba kata kunci atau
                                filter lain.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="lokasi-table-footer">
                <div class="lokasi-table-info" id="lokasiTableInfo" role="status" aria-live="polite">Menampilkan 1–10
                    dari 10 data contoh</div>
                <div class="lokasi-pagination-area">
                    <select id="lokasiPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select><span>data per halaman</span>
                    <nav class="lokasi-pagination" id="lokasiPagination" aria-label="Halaman daftar Lokasi"></nav>
                </div>
            </div>
        </section>

        {{-- DISTRIBUSI DAN DATA TERBARU --}}
        <div class="lokasi-bottom-grid">
            <section class="lokasi-card">
                <div class="lokasi-bottom-header">
                    <h3>Distribusi Lokasi per Jenis</h3>
                </div>
                <div class="lokasi-distribution-content">
                    <div class="lokasi-chart-wrap">
                        <canvas id="lokasiDistributionChart" role="img"
                            aria-label="Distribusi contoh 86 data Lokasi. Rincian tersedia pada legenda."></canvas>
                        <div class="lokasi-chart-center"><strong>86</strong><span>Lokasi</span></div>
                    </div>
                    <div class="lokasi-legend" id="lokasiLegend">
                        <div data-label="Gedung" data-count="38" data-color="#3389ee"><span
                                class="lokasi-dot c1"></span>
                            <p>Gedung</p><strong>38</strong><small>44,2%</small>
                        </div>
                        <div data-label="Instalasi" data-count="16" data-color="#55a8f1"><span
                                class="lokasi-dot c2"></span>
                            <p>Instalasi</p><strong>16</strong><small>18,6%</small>
                        </div>
                        <div data-label="Reservoir" data-count="18" data-color="#4fc184"><span
                                class="lokasi-dot c3"></span>
                            <p>Reservoir</p><strong>18</strong><small>20,9%</small>
                        </div>
                        <div data-label="Gudang" data-count="10" data-color="#ffc85c"><span
                                class="lokasi-dot c4"></span>
                            <p>Gudang</p><strong>10</strong><small>11,6%</small>
                        </div>
                        <div data-label="Bengkel" data-count="4" data-color="#ff9024"><span
                                class="lokasi-dot c5"></span>
                            <p>Bengkel</p><strong>4</strong><small>4,7%</small>
                        </div>
                    </div>
                </div>
            </section>
            <section class="lokasi-card">
                <div class="lokasi-bottom-header">
                    <h3>Lokasi Terbaru</h3><a href="#lokasiList" id="lokasiViewAll">Lihat Semua</a>
                </div>
                <div class="table-responsive" tabindex="0"
                    aria-label="Lokasi terbaru, geser untuk melihat kolom lainnya">
                    <table class="lokasi-latest-table">
                        <thead>
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Nama Lokasi</th>
                                <th scope="col">Jenis Lokasi</th>
                                <th scope="col">Tanggal Ditambahkan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>IPA Loa Janan</td>
                                <td>Instalasi</td>
                                <td>15 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Kantor Wilayah Palaran</td>
                                <td>Gedung</td>
                                <td>14 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Bengkel Teknik</td>
                                <td>Bengkel</td>
                                <td>13 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Gudang Material</td>
                                <td>Gudang</td>
                                <td>12 Jan 2025</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Kantor Wilayah Sambutan</td>
                                <td>Gedung</td>
                                <td>10 Jan 2025</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {{-- DIALOG UI: BELUM TERHUBUNG KE ENDPOINT CRUD --}}
        <dialog class="lokasi-modal" id="lokasiModal" aria-labelledby="lokasiModalTitle"
            aria-describedby="lokasiModalNote">
            <div class="lokasi-modal-dialog">
                <div class="lokasi-modal-header">
                    <div>
                        <h3 id="lokasiModalTitle">Tambah Lokasi</h3>
                        <p id="lokasiModalDescription">Tambahkan data master Lokasi.</p>
                    </div>
                    <button type="button" onclick="closeLokasiModal()" aria-label="Tutup dialog"><i data-lucide="x"
                            aria-hidden="true"></i></button>
                </div>
                <form id="lokasiForm">
                    <div class="lokasi-modal-body">
                        <p class="lokasi-modal-note" id="lokasiModalNote">Pratinjau formulir. Penyimpanan ke database
                            belum dihubungkan.</p>
                        <div class="lokasi-form-group"><label for="lokasiCode">Kode Lokasi</label>
                            <input id="lokasiCode" name="kode" type="text" maxlength="150" placeholder="LK-001"
                                required>
                        </div>
                        <div class="lokasi-form-group"><label for="lokasiName">Nama Lokasi</label>
                            <input id="lokasiName" name="nama" type="text" maxlength="150"
                                placeholder="Masukkan nama lokasi" required>
                        </div>
                        <div class="lokasi-form-group"><label for="lokasiFormJenis">Jenis Lokasi</label>
                            <select id="lokasiFormJenis" name="jenis" required>
                                <option value="">Pilih Jenis Lokasi</option>
                                <option value="Gedung">Gedung</option>
                                <option value="Instalasi">Instalasi</option>
                                <option value="Reservoir">Reservoir</option>
                                <option value="Gudang">Gudang</option>
                                <option value="Bengkel">Bengkel</option>
                            </select>
                        </div>
                        <div class="lokasi-form-group"><label for="lokasiFormDepartemen">Departemen</label>
                            <select id="lokasiFormDepartemen" name="departemen" required>
                                <option value="">Pilih Departemen</option>
                                <option value="Umum dan SDM">Umum dan SDM</option>
                                <option value="Produksi">Produksi</option>
                                <option value="Distribusi">Distribusi</option>
                                <option value="Pelayanan">Pelayanan</option>
                                <option value="Teknik">Teknik</option>
                            </select>
                        </div>
                        <div class="lokasi-form-group lokasi-form-wide"><label for="lokasiAddress">Alamat /
                                Keterangan</label>
                            <textarea id="lokasiAddress" name="alamat" rows="3" maxlength="500"
                                placeholder="Masukkan alamat atau keterangan lokasi"></textarea>
                        </div>
                        <div class="lokasi-form-group"><label for="lokasiStatus">Status</label>
                            <select id="lokasiStatus" name="status" required>
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                    <div class="lokasi-modal-footer">
                        <button type="button" class="lokasi-cancel-button" onclick="closeLokasiModal()">Tutup</button>
                        <button type="submit" class="lokasi-save-button" id="lokasiSaveButton" disabled
                            title="Tersedia setelah penyimpanan database dihubungkan.">Simpan Lokasi</button>
                    </div>
                </form>
            </div>
        </dialog>
    </section>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>
    <script src="{{ asset('js/pages/lokasi.js') }}"></script>
@endpush
