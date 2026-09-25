@extends('layouts.main')

@section('title', 'Departemen')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/departement.css') }}">
@endpush

@section('content')

    <section class="content dept-page">

        {{-- ============================================================
         HERO
    ============================================================= --}}
        <section class="dept-hero">

            <div class="dept-hero-overlay"></div>

            <div class="dept-hero-top">

                <div class="dept-hero-content">

                    {{-- BREADCRUMB --}}
                    <div class="dept-breadcrumb">

                        <a href="{{ route('dashboard') }}">
                            <i data-lucide="house"></i>
                        </a>

                        <i data-lucide="chevron-right"></i>

                        <span>Master Data</span>

                        <i data-lucide="chevron-right"></i>

                        <strong>Departemen</strong>

                    </div>

                    {{-- TITLE --}}
                    <div class="dept-heading">

                        <h1>Departemen</h1>

                        <p>
                            Kelola data departemen pada Perumda Tirta Kencana Kota Samarinda.
                        </p>

                    </div>

                </div>

                {{-- DATE --}}
                <div class="dept-date-card">

                    <div class="dept-date-icon">
                        <i data-lucide="calendar-days"></i>
                    </div>

                    <div>
                        <strong id="deptCurrentDate">-</strong>
                        <span id="deptCurrentTime">-</span>
                    </div>

                </div>

            </div>


            {{-- ========================================================
             KPI
        ========================================================= --}}
            <div class="dept-kpi-grid">

                <div class="dept-kpi-card">

                    <div class="dept-kpi-icon">
                        <i data-lucide="building-2"></i>
                    </div>

                    <div class="dept-kpi-content">

                        <span>Total Departemen</span>

                        <div class="dept-kpi-value">
                            <strong>24</strong>

                            <small>
                                <i data-lucide="arrow-up"></i>
                                +2
                            </small>
                        </div>

                        <p>dari tahun lalu</p>

                    </div>

                </div>


                <div class="dept-kpi-card">

                    <div class="dept-kpi-icon">
                        <i data-lucide="layers-3"></i>
                    </div>

                    <div class="dept-kpi-content">
                        <span>Total Divisi</span>
                        <strong>36</strong>
                    </div>

                    <div class="dept-kpi-sparkline">
                        <svg viewBox="0 0 100 45">
                            <polyline points="3,34 18,19 30,23 45,9 60,16 73,25 88,8 98,4" />
                        </svg>
                    </div>

                </div>

            </div>

        </section>


        {{-- ============================================================
         DATA CARD
    ============================================================= --}}
        <section class="dept-card dept-data-card">

            <div class="dept-card-header">

                <h3>Daftar Departemen</h3>

                <button type="button" class="dept-add-button" onclick="openDeptModal()">
                    <i data-lucide="plus"></i>
                    Tambah Departemen
                </button>

            </div>


            {{-- TOOLBAR --}}
            <div class="dept-toolbar">

                <div class="dept-search">

                    <i data-lucide="search"></i>

                    <input type="text" id="deptSearch" placeholder="Cari nama departemen..." oninput="filterDeptTable()">

                </div>

                <button type="button" class="dept-reset-button" onclick="resetDeptFilter()">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>

                <button type="button" class="dept-export-button" onclick="exportDeptCSV()">
                    <i data-lucide="download"></i>
                    Export
                    <i data-lucide="chevron-down"></i>
                </button>

            </div>


            {{-- TABLE --}}
            <div class="table-responsive">

                <table class="dept-table" id="deptTable">

                    <thead>
                        <tr>
                            <th class="dept-col-no">No</th>
                            <th>Nama Departemen</th>
                            <th>Kode Departemen</th>
                            <th>Keterangan</th>
                            <th>Jumlah Divisi</th>
                            <th class="dept-col-action">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr>
                            <td>1</td>
                            <td class="dept-name">Direksi</td>
                            <td>DIR</td>
                            <td>Pimpinan Perusahaan</td>
                            <td>0</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view" title="Lihat">
                                        <i data-lucide="eye"></i>
                                    </button>
                                    <button class="edit" title="Edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>
                                    <button class="delete" title="Hapus">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>2</td>
                            <td class="dept-name">Satuan Pengawasan Internal</td>
                            <td>SPI</td>
                            <td>Audit Internal</td>
                            <td>0</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>3</td>
                            <td class="dept-name">Sekretariat Perusahaan</td>
                            <td>SEK</td>
                            <td>Kesekretariatan</td>
                            <td>3</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>4</td>
                            <td class="dept-name">Departemen Umum dan SDM</td>
                            <td>UMSDM</td>
                            <td>Umum dan Sumber Daya Manusia</td>
                            <td>5</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>5</td>
                            <td class="dept-name">Departemen Keuangan</td>
                            <td>KEU</td>
                            <td>Keuangan dan Akuntansi</td>
                            <td>4</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>6</td>
                            <td class="dept-name">Departemen Perencanaan</td>
                            <td>REN</td>
                            <td>Perencanaan dan Pengembangan</td>
                            <td>3</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>7</td>
                            <td class="dept-name">Departemen Produksi</td>
                            <td>PROD</td>
                            <td>Produksi Air Minum</td>
                            <td>4</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>8</td>
                            <td class="dept-name">Departemen Distribusi</td>
                            <td>DIST</td>
                            <td>Distribusi dan Pelayanan</td>
                            <td>4</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>9</td>
                            <td class="dept-name">Departemen Teknik</td>
                            <td>TEK</td>
                            <td>Teknik dan Pemeliharaan</td>
                            <td>3</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td>10</td>
                            <td class="dept-name">Departemen Humas dan Pelayanan</td>
                            <td>HUM</td>
                            <td>Hubungan Masyarakat dan Pelayanan Pelanggan</td>
                            <td>2</td>
                            <td>
                                <div class="dept-actions">
                                    <button class="view"><i data-lucide="eye"></i></button>
                                    <button class="edit"><i data-lucide="square-pen"></i></button>
                                    <button class="delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>

                    </tbody>

                </table>

            </div>


            {{-- FOOTER --}}
            <div class="dept-table-footer">

                <div class="dept-table-info">
                    Menampilkan
                    <strong>1 - <span id="deptShownCount">10</span></strong>
                    dari <strong>24</strong> data
                </div>

                <div class="dept-pagination-area">

                    <select>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>

                    <span>data per halaman</span>

                    <div class="dept-pagination">

                        <button disabled>
                            <i data-lucide="chevron-left"></i>
                        </button>

                        <button class="active">1</button>
                        <button>2</button>
                        <button>3</button>

                        <button>
                            <i data-lucide="chevron-right"></i>
                        </button>

                    </div>

                </div>

            </div>

        </section>


        {{-- ============================================================
         MODAL
    ============================================================= --}}
        <div class="dept-modal" id="deptModal">

            <div class="dept-modal-backdrop" onclick="closeDeptModal()"></div>

            <div class="dept-modal-dialog">

                <div class="dept-modal-header">

                    <div>
                        <h3>Tambah Departemen</h3>
                        <p>Tambahkan data departemen baru.</p>
                    </div>

                    <button type="button" onclick="closeDeptModal()">
                        <i data-lucide="x"></i>
                    </button>

                </div>

                <div class="dept-modal-body">

                    <div class="dept-form-group">
                        <label>Nama Departemen</label>
                        <input type="text" placeholder="Masukkan nama departemen">
                    </div>

                    <div class="dept-form-group">
                        <label>Kode Departemen</label>
                        <input type="text" placeholder="Contoh: PROD">
                    </div>

                    <div class="dept-form-group">
                        <label>Keterangan</label>
                        <textarea rows="4" placeholder="Masukkan keterangan departemen"></textarea>
                    </div>

                </div>

                <div class="dept-modal-footer">

                    <button type="button" class="dept-cancel-button" onclick="closeDeptModal()">
                        Batal
                    </button>

                    <button type="button" class="dept-save-button">
                        <i data-lucide="save"></i>
                        Simpan Departemen
                    </button>

                </div>

            </div>

        </div>

    </section>

@endsection


@push('scripts')
    <script src="{{ asset('js/pages/departement.js') }}"></script>
@endpush
