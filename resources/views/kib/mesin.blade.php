@extends('layouts.main')

@section('title', 'Peralatan dan Mesin')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/mesin.css') }}?v={{ filemtime(public_path('css/pages/kib/mesin.css')) }}">
@endpush

@section('content')
    <section class="content mesin-page">
        <section class="mesin-hero">
            <div class="mesin-hero-overlay"></div>
            <div class="mesin-hero-inner">
                <nav class="mesin-breadcrumb" aria-label="Breadcrumb">
                    <a href="{{ route('dashboard') }}" aria-label="Dashboard"><i data-lucide="house"></i></a>
                    <i data-lucide="chevron-right"></i>
                    <span>K.I.B</span>
                    <i data-lucide="chevron-right"></i>
                    <strong>Peralatan dan Mesin</strong>
                </nav>

                <div class="mesin-heading">
                    <h1>Peralatan dan Mesin</h1>
                    <p>Kelola data aset tetap kategori peralatan dan mesin pada Perumda Tirta Kencana Kota Samarinda.</p>
                </div>

                <div class="mesin-kpi-grid">
                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon"><i data-lucide="package"></i></div>
                        <div>
                            <span>Total Aset</span>
                            <div class="mesin-kpi-inline"><strong>1.256</strong><small><i data-lucide="arrow-up"></i>
                                    +32</small></div>
                            <p>dari tahun lalu</p>
                        </div>
                    </article>
                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon"><i data-lucide="building-2"></i></div>
                        <div><span>Total Nilai Perolehan</span><strong>Rp 85,42 M</strong></div>
                    </article>
                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon"><i data-lucide="chart-no-axes-column-increasing"></i></div>
                        <div><span>Nilai Buku</span><strong>Rp 62,18 M</strong></div>
                    </article>
                    <article class="mesin-kpi-card">
                        <div class="mesin-kpi-icon"><i data-lucide="pie-chart"></i></div>
                        <div><span>Jumlah Lokasi</span>
                            <div class="mesin-kpi-inline"><strong>24</strong><em>lokasi</em></div>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section class="mesin-card mesin-workspace">
            <div class="mesin-workspace-head">
                <nav class="mesin-tabs" aria-label="Navigasi data peralatan dan mesin">
                    <button type="button" class="active" data-mesin-tab="daftar">Daftar Aset</button>
                    <button type="button" data-mesin-tab="rekapitulasi">Rekapitulasi</button>
                    <button type="button" data-mesin-tab="grafik">Grafik</button>
                    <button type="button" data-mesin-tab="penyusutan">Penyusutan</button>
                </nav>
                <button type="button" class="mesin-add-button" onclick="openMesinModal('add')">
                    <i data-lucide="plus"></i> Tambah Aset
                </button>
            </div>

            <div class="mesin-filter-row">
                <div class="mesin-search">
                    <i data-lucide="search"></i>
                    <input id="mesinSearch" type="search" placeholder="Cari kode, nama aset, merk, atau lokasi...">
                </div>
                <select id="mesinDepartemen" aria-label="Filter departemen">
                    <option value="">Semua Departemen</option>
                    <option value="Produksi">Produksi</option>
                    <option value="TI">TI</option>
                    <option value="Umum">Umum</option>
                    <option value="Teknik">Teknik</option>
                </select>
                <select id="mesinLokasi" aria-label="Filter lokasi">
                    <option value="">Semua Lokasi</option>
                    <option value="IPA Gunung Lipan">IPA Gunung Lipan</option>
                    <option value="Kantor Pusat">Kantor Pusat</option>
                    <option value="IPA Sungai Kapih">IPA Sungai Kapih</option>
                    <option value="Kantor Wilayah Sambutan">Kantor Wilayah Sambutan</option>
                    <option value="Gudang Material">Gudang Material</option>
                    <option value="Reservoir Lempake">Reservoir Lempake</option>
                </select>
                <select id="mesinKondisi" aria-label="Filter kondisi">
                    <option value="">Semua Kondisi</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Rusak">Rusak</option>
                </select>
                <div class="mesin-year-field">
                    <i data-lucide="calendar-days"></i>
                    <select id="mesinTahun" aria-label="Tahun perolehan">
                        <option value="">Tahun Perolehan</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                    </select>
                </div>
            </div>

            <div class="mesin-filter-actions">
                <button type="button" class="mesin-secondary-button"><i data-lucide="list-filter"></i> Filter
                    Lainnya</button>
                <div>
                    <button type="button" class="mesin-secondary-button" onclick="resetMesinFilter()"><i
                            data-lucide="refresh-cw"></i> Reset</button>
                    <button type="button" class="mesin-secondary-button" onclick="exportMesinCSV()"><i
                            data-lucide="download"></i> Export <i data-lucide="chevron-down"></i></button>
                </div>
            </div>

            <div class="table-responsive mesin-table-scroll" tabindex="0">
                <table class="mesin-table" id="mesinTable">
                    <thead>
                        <tr>
                            <th><input type="checkbox" aria-label="Pilih semua"></th>
                            <th>No</th>
                            <th>Kode Aset</th>
                            <th class="mesin-thumb-col"></th>
                            <th>Nama Aset</th>
                            <th>Merk / Tipe</th>
                            <th>No. Seri</th>
                            <th>Tahun</th>
                            <th>Lokasi</th>
                            <th>Nilai Perolehan</th>
                            <th>Nilai Buku</th>
                            <th>Kondisi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-record data-departemen="Produksi" data-lokasi="IPA Gunung Lipan" data-kondisi="Baik"
                            data-tahun="2022">
                            <td><input type="checkbox"></td>
                            <td>1</td>
                            <td>02.01.01.001</td>
                            <td><span class="mesin-thumb"><i data-lucide="settings"></i></span></td>
                            <td>Pompa Sentrifugal</td>
                            <td>Grundfos<br>CR 15-5</td>
                            <td>9876543210</td>
                            <td>2022</td>
                            <td>IPA Gunung Lipan</td>
                            <td>Rp 45.000.000</td>
                            <td>Rp 32.500.000</td>
                            <td><span class="mesin-status is-good">Baik</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="TI" data-lokasi="Kantor Pusat" data-kondisi="Baik"
                            data-tahun="2023">
                            <td><input type="checkbox"></td>
                            <td>2</td>
                            <td>02.01.01.002</td>
                            <td><span class="mesin-thumb"><i data-lucide="laptop"></i></span></td>
                            <td>Laptop</td>
                            <td>Lenovo<br>ThinkPad E14</td>
                            <td>PF3B4X2</td>
                            <td>2023</td>
                            <td>Kantor Pusat</td>
                            <td>Rp 12.500.000</td>
                            <td>Rp 11.000.000</td>
                            <td><span class="mesin-status is-good">Baik</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="Teknik" data-lokasi="IPA Sungai Kapih" data-kondisi="Cukup"
                            data-tahun="2021">
                            <td><input type="checkbox"></td>
                            <td>3</td>
                            <td>02.01.02.015</td>
                            <td><span class="mesin-thumb"><i data-lucide="battery-charging"></i></span></td>
                            <td>Genset</td>
                            <td>Perkins<br>100 KVA</td>
                            <td>PK100-5587</td>
                            <td>2021</td>
                            <td>IPA Sungai Kapih</td>
                            <td>Rp 350.000.000</td>
                            <td>Rp 210.000.000</td>
                            <td><span class="mesin-status is-fair">Cukup</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="Umum" data-lokasi="Kantor Wilayah Sambutan" data-kondisi="Baik"
                            data-tahun="2022">
                            <td><input type="checkbox"></td>
                            <td>4</td>
                            <td>02.01.03.021</td>
                            <td><span class="mesin-thumb"><i data-lucide="air-vent"></i></span></td>
                            <td>AC Split</td>
                            <td>Daikin<br>FTV50CXV</td>
                            <td>D8847123</td>
                            <td>2022</td>
                            <td>Kantor Wilayah Sambutan</td>
                            <td>Rp 18.000.000</td>
                            <td>Rp 13.500.000</td>
                            <td><span class="mesin-status is-good">Baik</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="Umum" data-lokasi="Gudang Material" data-kondisi="Baik"
                            data-tahun="2020">
                            <td><input type="checkbox"></td>
                            <td>5</td>
                            <td>02.01.04.033</td>
                            <td><span class="mesin-thumb"><i data-lucide="truck"></i></span></td>
                            <td>Forklift</td>
                            <td>Toyota<br>8FD25</td>
                            <td>8FD25-4581</td>
                            <td>2020</td>
                            <td>Gudang Material</td>
                            <td>Rp 280.000.000</td>
                            <td>Rp 168.000.000</td>
                            <td><span class="mesin-status is-good">Baik</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="Produksi" data-lokasi="Reservoir Lempake" data-kondisi="Rusak"
                            data-tahun="2021">
                            <td><input type="checkbox"></td>
                            <td>6</td>
                            <td>02.01.05.041</td>
                            <td><span class="mesin-thumb"><i data-lucide="gauge"></i></span></td>
                            <td>Flow Meter</td>
                            <td>Endress+Hauser<br>Promag 50</td>
                            <td>EH2020-7782</td>
                            <td>2021</td>
                            <td>Reservoir Lempake</td>
                            <td>Rp 120.000.000</td>
                            <td>Rp 72.000.000</td>
                            <td><span class="mesin-status is-bad">Rusak</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="TI" data-lokasi="Kantor Pusat" data-kondisi="Baik"
                            data-tahun="2023">
                            <td><input type="checkbox"></td>
                            <td>7</td>
                            <td>02.01.06.052</td>
                            <td><span class="mesin-thumb"><i data-lucide="printer"></i></span></td>
                            <td>Printer</td>
                            <td>Canon<br>iR 2425</td>
                            <td>CN778245</td>
                            <td>2023</td>
                            <td>Kantor Pusat</td>
                            <td>Rp 15.000.000</td>
                            <td>Rp 13.500.000</td>
                            <td><span class="mesin-status is-good">Baik</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="Produksi" data-lokasi="IPA Gunung Lipan" data-kondisi="Cukup"
                            data-tahun="2021">
                            <td><input type="checkbox"></td>
                            <td>8</td>
                            <td>02.01.07.067</td>
                            <td><span class="mesin-thumb"><i data-lucide="waves"></i></span></td>
                            <td>Dosing Pump</td>
                            <td>SEKO<br>Tekna 603</td>
                            <td>SK603-1123</td>
                            <td>2021</td>
                            <td>IPA Gunung Lipan</td>
                            <td>Rp 25.000.000</td>
                            <td>Rp 15.000.000</td>
                            <td><span class="mesin-status is-fair">Cukup</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="TI" data-lokasi="Kantor Pusat" data-kondisi="Baik"
                            data-tahun="2024">
                            <td><input type="checkbox"></td>
                            <td>9</td>
                            <td>02.01.08.074</td>
                            <td><span class="mesin-thumb"><i data-lucide="monitor"></i></span></td>
                            <td>PC Desktop</td>
                            <td>Dell<br>OptiPlex 7010</td>
                            <td>DL7010-3321</td>
                            <td>2024</td>
                            <td>Kantor Pusat</td>
                            <td>Rp 13.750.000</td>
                            <td>Rp 13.000.000</td>
                            <td><span class="mesin-status is-good">Baik</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-departemen="Umum" data-lokasi="IPA Sungai Kapih" data-kondisi="Baik"
                            data-tahun="2023">
                            <td><input type="checkbox"></td>
                            <td>10</td>
                            <td>02.01.09.086</td>
                            <td><span class="mesin-thumb"><i data-lucide="camera"></i></span></td>
                            <td>CCTV Kamera</td>
                            <td>Hikvision<br>DS-2CD2043G2</td>
                            <td>HV2043-9087</td>
                            <td>2023</td>
                            <td>IPA Sungai Kapih</td>
                            <td>Rp 8.500.000</td>
                            <td>Rp 7.800.000</td>
                            <td><span class="mesin-status is-good">Baik</span></td>
                            <td>
                                <div class="mesin-actions"><button class="view" data-action="view"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"><i
                                            data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr id="mesinEmptyRow" hidden>
                            <td colspan="13" class="mesin-empty">Tidak ada data yang sesuai dengan filter.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="mesin-table-footer">
                <div id="mesinTableInfo">Menampilkan 1 - 10 dari 1.256 data</div>
                <div class="mesin-pagination-area">
                    <select id="mesinPageSize" aria-label="Data per halaman">
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>
                    <span>data per halaman</span>
                    <nav class="mesin-pagination" id="mesinPagination" aria-label="Pagination"></nav>
                </div>
            </div>
        </section>

        <dialog class="mesin-modal" id="mesinModal">
            <div class="mesin-modal-dialog">
                <header class="mesin-modal-header">
                    <div>
                        <h3 id="mesinModalTitle">Tambah Aset</h3>
                        <p id="mesinModalDescription">Tambahkan data peralatan dan mesin.</p>
                    </div>
                    <button type="button" onclick="closeMesinModal()" aria-label="Tutup"><i
                            data-lucide="x"></i></button>
                </header>
                <form id="mesinForm">
                    <div class="mesin-modal-body">
                        <p class="mesin-modal-note" id="mesinModalNote">Form UI contoh. Penyimpanan database belum
                            dihubungkan.</p>
                        <div class="mesin-form-group"><label for="mesinCode">Kode Aset</label><input id="mesinCode"
                                required></div>
                        <div class="mesin-form-group"><label for="mesinName">Nama Aset</label><input id="mesinName"
                                required></div>
                        <div class="mesin-form-group"><label for="mesinMerk">Merk / Tipe</label><input id="mesinMerk">
                        </div>
                        <div class="mesin-form-group"><label for="mesinSerial">No. Seri</label><input id="mesinSerial">
                        </div>
                        <div class="mesin-form-group"><label for="mesinFormTahun">Tahun</label><input id="mesinFormTahun"
                                type="number" min="1900" max="2100"></div>
                        <div class="mesin-form-group"><label for="mesinFormLokasi">Lokasi</label><input
                                id="mesinFormLokasi"></div>
                        <div class="mesin-form-group"><label for="mesinPerolehan">Nilai Perolehan</label><input
                                id="mesinPerolehan"></div>
                        <div class="mesin-form-group"><label for="mesinBuku">Nilai Buku</label><input id="mesinBuku">
                        </div>
                        <div class="mesin-form-group"><label for="mesinFormKondisi">Kondisi</label><select
                                id="mesinFormKondisi">
                                <option>Baik</option>
                                <option>Cukup</option>
                                <option>Rusak</option>
                            </select></div>
                    </div>
                    <footer class="mesin-modal-footer">
                        <button type="button" class="mesin-cancel-button" onclick="closeMesinModal()">Tutup</button>
                        <button type="submit" class="mesin-save-button" id="mesinSaveButton" disabled>Simpan
                            Aset</button>
                    </footer>
                </form>
            </div>
        </dialog>
    </section>
@endsection

@push('scripts')
    <script src="{{ asset('js/pages/kib/mesin.js') }}"></script>
@endpush
