@extends('layouts.main')

@section('title', 'Barang')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/barang.css') }}">
@endpush

@section('content')

    {{-- UI contoh: angka KPI, chart, dan tabel belum mengambil data PostgreSQL. --}}
    <section class="content barang-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="barang-hero">

            <div class="barang-hero-overlay"></div>

            <div class="barang-hero-top">

                <div>

                    <nav class="barang-breadcrumb" aria-label="Breadcrumb">

                        <a href="{{ route('dashboard') }}" aria-label="Home">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong aria-current="page">Barang</strong>

                    </nav>

                    <div class="barang-heading">

                        <h1>Barang</h1>

                        <p>
                            Kelola data master barang yang digunakan pada sistem aset perusahaan.
                        </p>

                    </div>

                </div>

                <div class="barang-date-card">

                    <div class="barang-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="barangCurrentDate">-</strong>
                        <span id="barangCurrentTime">-</span>
                    </div>

                </div>

            </div>

            {{-- KPI --}}
            <div class="barang-kpi-grid">

                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon">
                        <i data-lucide="package"></i>
                    </div>

                    <div class="barang-kpi-content">

                        <span>Total Barang</span>

                        <div class="barang-kpi-value">
                            <strong>1.284</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +12
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                    <div class="barang-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,35 17,20 31,25 45,10 59,17 72,26 88,7 98,4" />
                        </svg>
                    </div>

                </div>

                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon">
                        <i data-lucide="layers-3"></i>
                    </div>

                    <div class="barang-kpi-content">
                        <span>Total Golongan</span>
                        <strong>18</strong>
                    </div>

                    <div class="barang-kpi-watermark">
                        <i data-lucide="chart-no-axes-column-increasing"></i>
                    </div>

                </div>

                <div class="barang-kpi-card">

                    <div class="barang-kpi-icon">
                        <i data-lucide="clock-3"></i>
                    </div>

                    <div class="barang-kpi-content">

                        <span>Update Terakhir</span>

                        <strong class="barang-kpi-text">
                            Hari Ini
                        </strong>

                        <p>data master terbaru</p>

                    </div>

                    <div class="barang-kpi-watermark">
                        <i data-lucide="calendar-days"></i>
                    </div>

                </div>

            </div>

        </section>

        {{-- ============================================================
         FILTER
    ============================================================= --}}
        <section class="barang-card barang-filter-card">

            <div class="barang-filter-header">

                <h3>Filter Data Barang</h3>

                <button type="button" class="barang-add-button" onclick="openBarangModal()">
                    <i data-lucide="plus"></i>
                    Tambah Barang
                </button>

            </div>

            <div class="barang-filter-grid">

                <div class="barang-search">

                    <i data-lucide="search"></i>

                    <input type="text" id="barangSearch" placeholder="Cari kode atau nama barang..."
                        aria-label="Cari kode atau nama barang">

                </div>

                <div class="barang-select-group">

                    <label for="barangGolongan">Golongan</label>

                    <select id="barangGolongan">
                        <option value="">Semua Golongan</option>
                        <option value="Elektronik">Elektronik</option>
                        <option value="Furnitur">Furnitur</option>
                        <option value="Mekanikal">Mekanikal</option>
                        <option value="Elektrikal">Elektrikal</option>
                        <option value="Alat Kantor">Alat Kantor</option>
                        <option value="Lainnya">Lainnya</option>
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
                </button>

            </div>

        </section>

        {{-- ============================================================
         TABLE
    ============================================================= --}}
        <section class="barang-card barang-table-card" id="barangList" aria-labelledby="barangListTitle">

            <div class="barang-table-header">
                <h3 id="barangListTitle">Daftar Barang</h3>
                <span class="barang-demo-badge" title="Seluruh angka dan daftar pada halaman ini adalah data contoh.">Data
                    contoh</span>
            </div>

            <div class="table-responsive" tabindex="0" aria-label="Tabel barang, geser untuk melihat kolom lainnya">

                <table class="barang-table" id="barangTable">

                    <thead>
                        <tr>
                            <th class="barang-col-no">No</th>
                            <th>Nama Barang</th>
                            <th>Kode Barang</th>
                            <th>Golongan</th>
                            <th class="barang-col-action">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr data-golongan="Elektronik">
                            <td>1</td>
                            <td>Laptop Dell Latitude 5420</td>
                            <td>BRG-001</td>
                            <td>Elektronik</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Laptop Dell Latitude 5420"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Laptop Dell Latitude 5420"><i
                                            data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Laptop Dell Latitude 5420"><i
                                            data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-golongan="Elektronik">
                            <td>2</td>
                            <td>Printer Epson L5290</td>
                            <td>BRG-002</td>
                            <td>Elektronik</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Printer Epson L5290"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Printer Epson L5290"><i data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Printer Epson L5290"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-golongan="Mekanikal">
                            <td>3</td>
                            <td>Pompa Distribusi 250 m³/jam</td>
                            <td>BRG-003</td>
                            <td>Mekanikal</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Pompa Distribusi 250 m³/jam"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Pompa Distribusi 250 m³/jam"><i
                                            data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Pompa Distribusi 250 m³/jam"><i
                                            data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-golongan="Furnitur">
                            <td>4</td>
                            <td>Meja Kerja Staff</td>
                            <td>BRG-004</td>
                            <td>Furnitur</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Meja Kerja Staff"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Meja Kerja Staff"><i data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Meja Kerja Staff"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-golongan="Furnitur">
                            <td>5</td>
                            <td>Kursi Rapat Utama</td>
                            <td>BRG-005</td>
                            <td>Furnitur</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Kursi Rapat Utama"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Kursi Rapat Utama"><i data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Kursi Rapat Utama"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-golongan="Furnitur">
                            <td>6</td>
                            <td>Lemari Arsip Besi</td>
                            <td>BRG-006</td>
                            <td>Furnitur</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Lemari Arsip Besi"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Lemari Arsip Besi"><i data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Lemari Arsip Besi"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-golongan="Elektrikal">
                            <td>7</td>
                            <td>Panel Kontrol Motor</td>
                            <td>BRG-007</td>
                            <td>Elektrikal</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Panel Kontrol Motor"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Panel Kontrol Motor"><i data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Panel Kontrol Motor"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr data-golongan="Mekanikal">
                            <td>8</td>
                            <td>Genset Cadangan 100 kVA</td>
                            <td>BRG-008</td>
                            <td>Mekanikal</td>
                            <td>
                                <div class="barang-actions">
                                    <button type="button" class="view" data-action="view" title="Lihat barang"
                                        aria-label="Lihat Genset Cadangan 100 kVA"><i data-lucide="eye"></i></button>
                                    <button type="button" class="edit" data-action="edit" title="Edit barang"
                                        aria-label="Edit Genset Cadangan 100 kVA"><i
                                            data-lucide="square-pen"></i></button>
                                    <button type="button" class="delete" data-action="delete" title="Hapus barang"
                                        aria-label="Hapus Genset Cadangan 100 kVA"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                        <tr id="barangEmptyRow" hidden>
                            <td colspan="5" class="barang-empty">Tidak ada barang yang sesuai. Coba kata kunci atau
                                golongan lain.</td>
                        </tr>
                    </tbody>

                </table>

            </div>

            <div class="barang-table-footer">
                <div class="barang-table-info" id="barangTableInfo" role="status" aria-live="polite">
                    Menampilkan 1–8 dari 8 data contoh
                </div>
                <div class="barang-pagination-area">
                    <select id="barangPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                    <span>data per halaman</span>
                    <nav class="barang-pagination" id="barangPagination" aria-label="Halaman daftar barang"></nav>
                </div>
            </div>

        </section>

        {{-- ============================================================
         BOTTOM
    ============================================================= --}}
        <div class="barang-bottom-grid">

            {{-- DISTRIBUSI --}}
            <section class="barang-card">

                <div class="barang-bottom-header">

                    <h3>
                        Distribusi Barang per Golongan
                    </h3>

                </div>

                <div class="barang-distribution-content">

                    <div class="barang-chart-wrap">

                        <canvas id="barangDistributionChart" role="img"
                            aria-label="Distribusi contoh 1.284 barang per golongan. Rincian tersedia pada legenda di samping."></canvas>

                        <div class="barang-chart-center">
                            <strong>1.284</strong>
                            <span>Barang</span>
                        </div>

                    </div>

                    <div class="barang-legend" id="barangLegend">
                        <div data-label="Elektronik" data-count="412" data-color="#3389ee">
                            <span class="barang-dot c1"></span>
                            <p>Elektronik</p><strong>412</strong><small>32,1%</small>
                        </div>
                        <div data-label="Furnitur" data-count="286" data-color="#4fc184">
                            <span class="barang-dot c2"></span>
                            <p>Furnitur</p><strong>286</strong><small>22,3%</small>
                        </div>
                        <div data-label="Mekanikal" data-count="234" data-color="#ffc85c">
                            <span class="barang-dot c3"></span>
                            <p>Mekanikal</p><strong>234</strong><small>18,2%</small>
                        </div>
                        <div data-label="Elektrikal" data-count="198" data-color="#ff9024">
                            <span class="barang-dot c4"></span>
                            <p>Elektrikal</p><strong>198</strong><small>15,4%</small>
                        </div>
                        <div data-label="Alat Kantor" data-count="102" data-color="#8558e8">
                            <span class="barang-dot c5"></span>
                            <p>Alat Kantor</p><strong>102</strong><small>7,9%</small>
                        </div>
                        <div data-label="Lainnya" data-count="52" data-color="#aab7ca">
                            <span class="barang-dot c6"></span>
                            <p>Lainnya</p><strong>52</strong><small>4,0%</small>
                        </div>
                    </div>

                </div>

            </section>

            {{-- TERBARU --}}
            <section class="barang-card">

                <div class="barang-bottom-header">

                    <h3>Barang Terbaru</h3>

                    <a href="#barangList" id="barangViewAll">
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
                                <td>Genset Cadangan 100 kVA</td>
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

            </section>

        </div>

        {{-- ============================================================
         MODAL
    ============================================================= --}}
        <dialog class="barang-modal" id="barangModal" aria-labelledby="barangModalTitle"
            aria-describedby="barangModalNote">
            <div class="barang-modal-dialog">
                <div class="barang-modal-header">
                    <div>
                        <h3 id="barangModalTitle">Tambah Barang</h3>
                        <p id="barangModalDescription">Tambahkan data master barang baru.</p>
                    </div>
                    <button type="button" onclick="closeBarangModal()" aria-label="Tutup dialog"><i
                            data-lucide="x"></i></button>
                </div>
                <form id="barangForm">
                    <div class="barang-modal-body">
                        <p class="barang-modal-note" id="barangModalNote">Pratinjau formulir. Penyimpanan ke database
                            belum dihubungkan.</p>
                        <div class="barang-form-group">
                            <label for="barangName">Nama Barang</label>
                            <input id="barangName" name="nama_barang" type="text" placeholder="Masukkan nama barang"
                                maxlength="150" required>
                        </div>
                        <div class="barang-form-group">
                            <label for="barangCode">Kode Barang</label>
                            <input id="barangCode" name="kode_barang" type="text" placeholder="Contoh: BRG-009"
                                maxlength="50" required>
                        </div>
                        <div class="barang-form-group">
                            <label for="barangFormGolongan">Golongan</label>
                            <select id="barangFormGolongan" name="golongan" required>
                                <option value="">Pilih Golongan</option>
                                <option value="Elektronik">Elektronik</option>
                                <option value="Furnitur">Furnitur</option>
                                <option value="Mekanikal">Mekanikal</option>
                                <option value="Elektrikal">Elektrikal</option>
                                <option value="Alat Kantor">Alat Kantor</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                    </div>
                    <div class="barang-modal-footer">
                        <button type="button" class="barang-cancel-button" onclick="closeBarangModal()">Tutup</button>
                        <button type="submit" class="barang-save-button" id="barangSaveButton" disabled
                            title="Tersedia setelah penyimpanan database dihubungkan.">Simpan Barang</button>
                    </div>
                </form>
            </div>
        </dialog>

    </section>

@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>

    <script src="{{ asset('js/pages/barang.js') }}"></script>
@endpush
