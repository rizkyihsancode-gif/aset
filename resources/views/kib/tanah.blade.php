@extends('layouts.main')

@section('title', 'Tanah')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/tanah.css') }}">
@endpush

@section('content')
    <div class="content tanah-page">

        {{-- HERO --}}
        <section class="tanah-hero">
            <div class="tanah-hero-bg"></div>
            <div class="tanah-hero-content">
                <nav class="tanah-breadcrumb" aria-label="Breadcrumb">
                    <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                        <i data-lucide="house"></i>
                    </a>
                    <i data-lucide="chevron-right"></i>
                    <span>Master Data</span>
                    <i data-lucide="chevron-right"></i>
                    <span>K.I.B</span>
                    <i data-lucide="chevron-right"></i>
                    <strong>Tanah</strong>
                </nav>

                <div class="tanah-heading">
                    <h1>Tanah</h1>
                    <p>Kelola data aset tanah perusahaan secara terstruktur untuk kebutuhan inventaris, legalitas, dan nilai
                        aset.</p>
                </div>

                <div class="tanah-kpi-grid">
                    <article class="tanah-kpi-card">
                        <div class="tanah-kpi-icon"><i data-lucide="map-pinned"></i></div>
                        <div class="tanah-kpi-content">
                            <span>Total Aset Tanah</span>
                            <strong id="tanahTotalAset">245</strong>
                            <p>Bidang tanah terdaftar</p>
                        </div>
                    </article>

                    <article class="tanah-kpi-card">
                        <div class="tanah-kpi-icon"><i data-lucide="map"></i></div>
                        <div class="tanah-kpi-content">
                            <span>Total Luas</span>
                            <strong id="tanahTotalLuas">1.248.560 m²</strong>
                            <p>Akumulasi luas seluruh tanah</p>
                        </div>
                    </article>

                    <article class="tanah-kpi-card">
                        <div class="tanah-kpi-icon"><i data-lucide="coins"></i></div>
                        <div class="tanah-kpi-content">
                            <span>Total Nilai</span>
                            <strong id="tanahTotalNilai">Rp 245,6 M</strong>
                            <p>Nilai perolehan aset</p>
                        </div>
                    </article>

                    <article class="tanah-kpi-card">
                        <div class="tanah-kpi-icon"><i data-lucide="clock-3"></i></div>
                        <div class="tanah-kpi-content">
                            <span>Update Terakhir</span>
                            <strong>Hari Ini</strong>
                            <p id="tanahCurrentDate">-</p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        {{-- FILTER --}}
        <section class="tanah-card tanah-filter-card">
            <div class="tanah-section-head">
                <h2>Filter Data Tanah</h2>
                <div class="tanah-head-actions">
                    <button type="button" class="tanah-btn tanah-btn-primary" onclick="openTanahModal('add')">
                        <i data-lucide="plus"></i>
                        <span>Tambah Tanah</span>
                    </button>
                    <button type="button" class="tanah-btn tanah-btn-light" onclick="exportTanahCSV()">
                        <i data-lucide="download"></i>
                        <span>Ekspor</span>
                        <i data-lucide="chevron-down" class="tanah-btn-chevron"></i>
                    </button>
                </div>
            </div>

            <div class="tanah-filter-grid">
                <div class="tanah-search-box">
                    <i data-lucide="search"></i>
                    <input id="tanahSearch" type="search" placeholder="Cari kode, lokasi, atau letak tanah...">
                </div>

                <div class="tanah-field">
                    <label for="tanahLokasi">Lokasi</label>
                    <select id="tanahLokasi">
                        <option value="">Semua Lokasi</option>
                        <option value="IPA Gunung Lipan">IPA Gunung Lipan</option>
                        <option value="Reservoir Lempake">Reservoir Lempake</option>
                        <option value="Kantor Pusat">Kantor Pusat</option>
                        <option value="IPA Sungai Kapih">IPA Sungai Kapih</option>
                        <option value="Gudang Material">Gudang Material</option>
                        <option value="Kantor Wilayah Sambutan">Kantor Wilayah Sambutan</option>
                        <option value="Booster Palaran">Booster Palaran</option>
                        <option value="Intake Produksi">Intake Produksi</option>
                    </select>
                </div>

                <div class="tanah-field">
                    <label for="tanahHak">Hak</label>
                    <select id="tanahHak">
                        <option value="">Semua Hak</option>
                        <option value="Hak Pakai">Hak Pakai</option>
                        <option value="Hak Milik">Hak Milik</option>
                        <option value="Hak Guna Bangunan">Hak Guna Bangunan</option>
                    </select>
                </div>

                <div class="tanah-field">
                    <label for="tanahTahun">Tahun</label>
                    <select id="tanahTahun">
                        <option value="">Semua Tahun</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                        <option value="2018">2018</option>
                        <option value="2017">2017</option>
                        <option value="2016">2016</option>
                        <option value="2015">2015</option>
                    </select>
                </div>

                <button type="button" class="tanah-btn tanah-btn-primary" onclick="filterTanahTable()">
                    <i data-lucide="list-filter"></i><span>Filter</span>
                </button>

                <button type="button" class="tanah-btn tanah-btn-light" onclick="resetTanahFilter()">
                    <i data-lucide="refresh-cw"></i><span>Reset</span>
                </button>
            </div>
        </section>

        {{-- TABLE --}}
        <section class="tanah-card tanah-table-card" id="tanahList">
            <div class="tanah-section-head tanah-table-head">
                <h2>Daftar Tanah</h2>
                <span class="tanah-badge">Data contoh</span>
            </div>

            <div class="tanah-table-scroll">
                <table class="tanah-table" id="tanahTable">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Kode Tanah</th>
                            <th>Lokasi</th>
                            <th>Penggunaan / Letak</th>
                            <th>Luas</th>
                            <th>Hak</th>
                            <th>Tahun</th>
                            <th>Nilai</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="tanahTableBody">
                        <tr data-record data-lokasi="IPA Gunung Lipan" data-hak="Hak Pakai" data-tahun="2018"
                            data-area="12500" data-value="12500000000">
                            <td>1</td>
                            <td class="tanah-code">TNH-001</td>
                            <td>IPA Gunung Lipan</td>
                            <td>Lahan Instalasi Produksi</td>
                            <td>12.500 m²</td>
                            <td>Hak Pakai</td>
                            <td>2018</td>
                            <td>Rp 12.500.000.000</td>
                            <td><span class="tanah-status active">Aktif</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-lokasi="Reservoir Lempake" data-hak="Hak Milik" data-tahun="2017"
                            data-area="8200" data-value="8900000000">
                            <td>2</td>
                            <td class="tanah-code">TNH-002</td>
                            <td>Reservoir Lempake</td>
                            <td>Lahan Reservoir</td>
                            <td>8.200 m²</td>
                            <td>Hak Milik</td>
                            <td>2017</td>
                            <td>Rp 8.900.000.000</td>
                            <td><span class="tanah-status active">Aktif</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-lokasi="Kantor Pusat" data-hak="Hak Guna Bangunan" data-tahun="2016"
                            data-area="4500" data-value="15200000000">
                            <td>3</td>
                            <td class="tanah-code">TNH-003</td>
                            <td>Kantor Pusat</td>
                            <td>Area Kantor Administrasi</td>
                            <td>4.500 m²</td>
                            <td>Hak Guna Bangunan</td>
                            <td>2016</td>
                            <td>Rp 15.200.000.000</td>
                            <td><span class="tanah-status active">Aktif</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-lokasi="IPA Sungai Kapih" data-hak="Hak Pakai" data-tahun="2019"
                            data-area="10000" data-value="11300000000">
                            <td>4</td>
                            <td class="tanah-code">TNH-004</td>
                            <td>IPA Sungai Kapih</td>
                            <td>Lahan Bangunan IPA</td>
                            <td>10.000 m²</td>
                            <td>Hak Pakai</td>
                            <td>2019</td>
                            <td>Rp 11.300.000.000</td>
                            <td><span class="tanah-status active">Aktif</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-lokasi="Gudang Material" data-hak="Hak Milik" data-tahun="2015"
                            data-area="3800" data-value="4700000000">
                            <td>5</td>
                            <td class="tanah-code">TNH-005</td>
                            <td>Gudang Material</td>
                            <td>Area Gudang &amp; Workshop</td>
                            <td>3.800 m²</td>
                            <td>Hak Milik</td>
                            <td>2015</td>
                            <td>Rp 4.700.000.000</td>
                            <td><span class="tanah-status review">Verifikasi</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-lokasi="Kantor Wilayah Sambutan" data-hak="Hak Guna Bangunan"
                            data-tahun="2020" data-area="2650" data-value="3950000000">
                            <td>6</td>
                            <td class="tanah-code">TNH-006</td>
                            <td>Kantor Wilayah Sambutan</td>
                            <td>Lahan Kantor Pelayanan</td>
                            <td>2.650 m²</td>
                            <td>Hak Guna Bangunan</td>
                            <td>2020</td>
                            <td>Rp 3.950.000.000</td>
                            <td><span class="tanah-status active">Aktif</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-lokasi="Booster Palaran" data-hak="Hak Pakai" data-tahun="2021"
                            data-area="1900" data-value="2600000000">
                            <td>7</td>
                            <td class="tanah-code">TNH-007</td>
                            <td>Booster Palaran</td>
                            <td>Area Operasional Distribusi</td>
                            <td>1.900 m²</td>
                            <td>Hak Pakai</td>
                            <td>2021</td>
                            <td>Rp 2.600.000.000</td>
                            <td><span class="tanah-status draft">Draft</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr data-record data-lokasi="Intake Produksi" data-hak="Hak Milik" data-tahun="2018"
                            data-area="6400" data-value="7850000000">
                            <td>8</td>
                            <td class="tanah-code">TNH-008</td>
                            <td>Intake Produksi</td>
                            <td>Area Intake &amp; Pompa</td>
                            <td>6.400 m²</td>
                            <td>Hak Milik</td>
                            <td>2018</td>
                            <td>Rp 7.850.000.000</td>
                            <td><span class="tanah-status active">Aktif</span></td>
                            <td>
                                <div class="tanah-actions"><button class="view" data-action="view" title="Lihat"><i
                                            data-lucide="eye"></i></button><button class="edit" data-action="edit"
                                        title="Edit"><i data-lucide="square-pen"></i></button><button class="delete"
                                        data-action="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div>
                            </td>
                        </tr>
                        <tr id="tanahEmptyRow" hidden>
                            <td colspan="10" class="tanah-empty">Tidak ada data tanah yang sesuai dengan filter.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="tanah-table-footer">
                <div id="tanahTableInfo" class="tanah-table-info">Menampilkan 1–8 dari 8 data contoh</div>
                <div class="tanah-pagination-area">
                    <select id="tanahPageSize" aria-label="Jumlah data per halaman">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                    <span>data per halaman</span>
                    <nav id="tanahPagination" class="tanah-pagination" aria-label="Pagination"></nav>
                </div>
            </div>
        </section>

        {{-- BOTTOM --}}
        <div class="tanah-bottom-grid">
            <section class="tanah-card tanah-bottom-card">
                <div class="tanah-section-head">
                    <h2>Distribusi Hak Tanah</h2>
                </div>
                <div class="tanah-distribution">
                    <div class="tanah-donut" id="tanahDonut">
                        <div class="tanah-donut-center">
                            <strong id="tanahChartTotal">245</strong>
                            <span>Aset Tanah</span>
                        </div>
                    </div>
                    <div class="tanah-legend" id="tanahLegend">
                        <div data-label="Hak Pakai" data-count="118" data-color="#1769e8"><i></i><span>Hak
                                Pakai</span><strong>118</strong><small>48%</small></div>
                        <div data-label="Hak Milik" data-count="78" data-color="#28a9e8"><i></i><span>Hak
                                Milik</span><strong>78</strong><small>32%</small></div>
                        <div data-label="Hak Guna Bangunan" data-count="49" data-color="#31b866"><i></i><span>Hak Guna
                                Bangunan</span><strong>49</strong><small>20%</small></div>
                    </div>
                </div>
            </section>

            <section class="tanah-card tanah-bottom-card">
                <div class="tanah-section-head">
                    <h2>Tanah Terbaru</h2>
                    <a href="#tanahList" id="tanahViewAll">Lihat Semua</a>
                </div>
                <div class="tanah-latest-scroll">
                    <table class="tanah-latest-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Tanah</th>
                                <th>Lokasi</th>
                                <th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>TNH-008</td>
                                <td>Intake Produksi</td>
                                <td>12 Mar 2024</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>TNH-007</td>
                                <td>Booster Palaran</td>
                                <td>28 Feb 2024</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>TNH-006</td>
                                <td>Kantor Wilayah Sambutan</td>
                                <td>15 Jan 2024</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>TNH-005</td>
                                <td>Gudang Material</td>
                                <td>08 Jan 2024</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>TNH-004</td>
                                <td>IPA Sungai Kapih</td>
                                <td>20 Des 2023</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {{-- MODAL --}}
        <dialog class="tanah-modal" id="tanahModal">
            <div class="tanah-modal-box">
                <div class="tanah-modal-head">
                    <div>
                        <h3 id="tanahModalTitle">Tambah Tanah</h3>
                        <p id="tanahModalDescription">Tambahkan data aset tanah.</p>
                    </div>
                    <button type="button" onclick="closeTanahModal()" aria-label="Tutup"><i
                            data-lucide="x"></i></button>
                </div>
                <form id="tanahForm">
                    <div class="tanah-modal-body">
                        <div class="tanah-modal-note" id="tanahModalNote">Form ini masih berjalan di sisi UI. Backend CRUD
                            akan dihubungkan setelah struktur database Tanah selesai.</div>
                        <div class="tanah-form-field"><label for="tanahCode">Kode Tanah</label><input id="tanahCode"
                                required></div>
                        <div class="tanah-form-field"><label for="tanahFormLokasi">Lokasi</label><input
                                id="tanahFormLokasi" required></div>
                        <div class="tanah-form-field wide"><label for="tanahPenggunaan">Penggunaan / Letak</label><input
                                id="tanahPenggunaan" required></div>
                        <div class="tanah-form-field"><label for="tanahLuas">Luas (m²)</label><input id="tanahLuas"
                                type="number" min="0" required></div>
                        <div class="tanah-form-field"><label for="tanahFormHak">Hak</label><select id="tanahFormHak"
                                required>
                                <option value="Hak Pakai">Hak Pakai</option>
                                <option value="Hak Milik">Hak Milik</option>
                                <option value="Hak Guna Bangunan">Hak Guna Bangunan</option>
                            </select></div>
                        <div class="tanah-form-field"><label for="tanahFormTahun">Tahun</label><input id="tanahFormTahun"
                                type="number" min="1900" max="2100" required></div>
                        <div class="tanah-form-field"><label for="tanahNilai">Nilai (Rp)</label><input id="tanahNilai"
                                type="number" min="0" required></div>
                        <div class="tanah-form-field"><label for="tanahStatus">Status</label><select id="tanahStatus">
                                <option>Aktif</option>
                                <option>Verifikasi</option>
                                <option>Draft</option>
                            </select></div>
                    </div>
                    <div class="tanah-modal-foot"><button type="button" class="tanah-btn tanah-btn-light"
                            onclick="closeTanahModal()">Batal</button><button type="submit"
                            class="tanah-btn tanah-btn-primary" id="tanahSaveButton">Simpan</button></div>
                </form>
            </div>
        </dialog>
    </div>
@endsection

@push('scripts')
    <script src="{{ asset('js/pages/tanah.js') }}"></script>
@endpush
