@extends('layouts.main')

@section('title', 'K.I.B D — Jalan, Irigasi dan Jaringan')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/jalan.css') }}?v={{ file_exists(public_path('css/pages/kib/jalan.css')) ? filemtime(public_path('css/pages/kib/jalan.css')) : '1' }}">
@endpush

@section('content')
    @php
        $pemilik = [
            'perumdam' => 'Perumdam Tirta Kencana',
            'pusat' => 'Pemerintah Pusat',
            'pemprov' => 'Pemerintah Provinsi',
            'pemkot' => 'Pemerintah Kota',
            'swasta' => 'Swasta',
            'campuran' => 'Campuran',
            'belum_diatur' => 'Belum Diatur',
        ];
    @endphp
    <main id="jalanPage" data-voucher-base="{{ url('/kib/voucher') }}" class="content jalan-page kd-page"
        data-base="{{ url('/kib/jalan') }}" data-pending="{{ route('kib.jalan.pending') }}"
        data-gedung="{{ route('kib.gedung') }}" data-token="{{ csrf_token() }}" data-report-base-url="{{ url('/kib/jalan') }}"
        data-report-logo="{{ asset('images/logo_hr.png') }}" data-report-css="{{ asset('css/pages/kib/jalan.css') }}">

        <header class="kd-hero">
            <div class="kd-hero-top">
                <div>
                    <nav class="kd-breadcrumb" aria-label="Breadcrumb">
                        <a href="{{ route('dashboard') }}"><i data-lucide="house"></i></a>
                        <i data-lucide="chevron-right"></i><span>K.I.B</span>
                        <i data-lucide="chevron-right"></i><strong>Jalan, Irigasi dan Jaringan</strong>
                    </nav>
                    <h1>K.I.B D — Jalan, Irigasi dan Jaringan</h1>
                    <p>Kelola inventaris Gedung/Irigasi dan Jembatan, Data Pending Nilai Aset, dan Detail Excel.</p>
                </div>
                <span class="kd-hero-date"><i data-lucide="calendar-days"></i>
                    {{ now('Asia/Makassar')->locale('id')->translatedFormat('d F Y') }}
                </span>
            </div>
            <div class="kd-stats">
                <article><i data-lucide="building-2"></i>
                    <div><small>Gedung /
                            Irigasi</small><strong>{{ number_format($totalGedung, 0, ',', '.') }}</strong><span>Data
                            terhubung K.I.B C</span></div>
                </article>
                <article><i data-lucide="route"></i>
                    <div><small>Jembatan / Arsip K.I.B
                            D</small><strong>{{ number_format($totalJembatan, 0, ',', '.') }}</strong><span>Data asli web
                            aset lama</span></div>
                </article>
                <article><i data-lucide="map-pin"></i>
                    <div><small>Lokasi Gedung</small><strong>{{ count($gedungLokasi) }}</strong><span>Lokasi
                            terdaftar</span></div>
                </article>
                <article><i data-lucide="folder-open"></i>
                    <div><small>Lokasi Jembatan</small><strong>{{ count($jembatanLokasi) }}</strong><span>Lokasi
                            terdaftar</span></div>
                </article>
            </div>
        </header>

        <section class="kd-pending-banner" aria-label="Pending Nilai Aset K.I.B D">
            <div class="kd-pending-symbol"><i data-lucide="bell-ring"></i></div>
            <div class="kd-pending-copy">
                <small>NILAI ASET · DATA BELUM DIPROSES</small>
                <h2>Data Nilai Aset Menunggu Diproses
                    <span class="kd-pending-badge">{{ number_format($totalPendingSemuaKategori, 0, ',', '.') }}</span>
                </h2>
                <p><strong>{{ number_format($totalPendingSemuaKategori, 0, ',', '.') }}</strong> pending seluruh kategori
                    &nbsp;·&nbsp; <strong>{{ number_format($totalPending, 0, ',', '.') }}</strong> khusus K.I.B D
                    &nbsp;·&nbsp; <strong>{{ number_format($totalPendingTambah, 0, ',', '.') }}</strong> Penambahan Aset D
                    &nbsp;·&nbsp; <strong>{{ number_format($totalPendingSiap, 0, ',', '.') }}</strong> siap dipilih.
                </p>
                @if ($totalPending === 0 && $totalPendingSemuaKategori > 0)
                    <p class="kd-pending-warning">Pending tersedia pada kategori lain. Kategori K.I.B D terdeteksi:
                        {{ implode(', ', $kategoriPendingD) ?: 'tidak ditemukan' }}.
                        Periksa kategori transaksi di Nilai Aset; voucher kategori lain tidak boleh dimasukkan ke Jembatan.
                    </p>
                @endif
            </div>
            <button type="button" class="kd-button outline" id="kdViewPending"><i data-lucide="inbox"></i> Lihat Data
                Pending</button>
        </section>

        <section class="kd-workspace" aria-label="Data KIB D">
            <div class="kd-section-top">
                <div>
                    <small>KARTU INVENTARIS BARANG D</small>
                    <h2>Data Jalan, Irigasi dan Jaringan</h2>
                    <p>Ringkasan lokasi · Detail per kategori · Print Excel sesuai 17 kolom K.I.B D</p>
                </div>
                <button class="kd-button primary" id="kdNew" type="button">
                    <i data-lucide="plus"></i> Tambah Jembatan
                </button>
            </div>

            <div class="kd-tabs" role="tablist" aria-label="Kategori KIB D">
                <button type="button" class="kd-tab active" role="tab" aria-selected="true"
                    aria-controls="kdPaneGedung" data-kd-tab="gedung">
                    <i data-lucide="building-2"></i> Gedung Irigasi
                    <span>{{ number_format($totalGedung, 0, ',', '.') }}</span>
                </button>
                <button type="button" class="kd-tab" role="tab" aria-selected="false" aria-controls="kdPaneJembatan"
                    data-kd-tab="jembatan">
                    <i data-lucide="route"></i> Jembatan
                    <span>{{ number_format($totalJembatan, 0, ',', '.') }}</span>
                </button>
            </div>

            <div class="kd-toolbar">
                <label class="kd-search-field"><i data-lucide="search"></i>
                    <input id="kdSearch" type="search" placeholder="Cari lokasi atau alamat..." autocomplete="off"
                        aria-label="Cari lokasi">
                </label>
                <label class="kd-filter-field"><span>Status Kepemilikan</span>
                    <select id="kdOwnerFilter" aria-label="Filter Status Kepemilikan">
                        <option value="">Semua Status</option>
                        @foreach ($pemilik as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </label>
                <label class="kd-filter-field"><span>Per halaman</span>
                    <select id="kdPerPage">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </label>
            </div>

            @foreach (['gedung' => $gedungLokasi, 'jembatan' => $jembatanLokasi] as $tab => $items)
                <section class="kd-tab-pane" role="tabpanel"
                    id="{{ $tab === 'gedung' ? 'kdPaneGedung' : 'kdPaneJembatan' }}" data-kd-pane="{{ $tab }}"
                    {{ $tab === 'jembatan' ? 'hidden' : '' }}>
                    <p class="kd-origin-note">
                        @if ($tab === 'gedung')
                            <i data-lucide="info"></i> Menampilkan seluruh data Gedung dan Bangunan dari K.I.B C tanpa
                            menyalin atau mengganti data aslinya.
                        @else
                            <i data-lucide="database"></i> Semua data Jembatan berasal dari tabel asli kib_d_s; perubahan
                            CRUD langsung memperbarui tabel yang sama.
                        @endif
                    </p>
                    <div class="kd-table-shell">
                        <table class="kd-main-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Lokasi</th>
                                    <th>Alamat</th>
                                    <th>Status Kepemilikan</th>
                                    <th>Data Lokasi</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($items as $row)
                                    @php
                                        $status = strtolower(trim((string) $row['status_kepemilikan']));
                                        $labelStatus = $pemilik[$status] ?? 'Belum Diatur';
                                    @endphp
                                    <tr data-kd-row data-kind="{{ $tab }}"
                                        data-location="{{ $row['id_lokasi'] }}" data-name="{{ $row['lokasi'] }}"
                                        data-status="{{ $status }}"
                                        data-query="{{ mb_strtolower($row['lokasi'] . ' ' . $row['alamat'], 'UTF-8') }}">
                                        <td data-kd-number>{{ $loop->iteration }}</td>
                                        <td class="kd-primary-cell">
                                            <strong>{{ $row['lokasi'] }}</strong><small>{{ number_format($row['jumlah'], 0, ',', '.') }}
                                                inventaris</small>
                                        </td>
                                        <td>{{ $row['alamat'] }}</td>
                                        <td><span
                                                class="kd-owner {{ $status === 'campuran' ? 'mixed' : (isset($pemilik[$status]) && $status !== 'belum_diatur' ? 'known' : 'unknown') }}">{{ $labelStatus }}</span>
                                        </td>
                                        <td>
                                            <button type="button" class="kd-location-count"
                                                data-kd-detail="{{ $row['id_lokasi'] }}" data-kind="{{ $tab }}"
                                                aria-label="Lihat {{ $row['jumlah'] }} data di {{ $row['lokasi'] }}">
                                                <i data-lucide="files"></i>
                                                <span><strong>{{ number_format($row['jumlah'], 0, ',', '.') }}
                                                        data</strong>
                                                    <small>Lihat inventaris</small></span>
                                            </button>
                                        </td>
                                        <td>
                                            <div class="kd-row-actions">
                                                <button type="button" class="kd-button small outline"
                                                    data-kd-detail="{{ $row['id_lokasi'] }}"
                                                    data-kind="{{ $tab }}"><i data-lucide="eye"></i>
                                                    Detail</button>
                                                @if ($tab === 'jembatan')
                                                    <button type="button" class="kd-button small warning"
                                                        data-kd-group-action="edit"
                                                        data-kd-location="{{ $row['id_lokasi'] }}"
                                                        data-kind="{{ $tab }}"
                                                        title="Pilih satu barang Jembatan untuk diedit"><i
                                                            data-lucide="pencil"></i> Edit</button>
                                                    <button type="button" class="kd-button small danger"
                                                        data-kd-group-action="delete"
                                                        data-kd-location="{{ $row['id_lokasi'] }}"
                                                        data-kind="{{ $tab }}"
                                                        title="Pilih satu barang Jembatan untuk dihapus"><i
                                                            data-lucide="trash-2"></i> Hapus</button>
                                                @else
                                                    <a class="kd-button small warning" href="{{ route('kib.gedung') }}"
                                                        title="Kelola data Gedung/Irigasi melalui K.I.B C"><i
                                                            data-lucide="pencil"></i> Edit di K.I.B C</a>
                                                @endif
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr class="kd-blank">
                                        <td colspan="6">Belum ada inventaris yang dapat ditampilkan pada kategori ini.
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </section>
            @endforeach
            <div class="kd-table-footer"><small id="kdRange">—</small>
                <div class="kd-pagination" id="kdPages"></div>
            </div>
            @unless ($archiveReady)
                <p class="kd-help">Tabel arsip <code>kib_d_s</code> belum tersedia di database aplikasi ini. Data Jembatan lama
                    akan muncul setelah arsip tersedia.</p>
            @endunless
        </section>

        {{-- DETAIL MODEL EXCEL --}}
        <dialog class="kd-dialog detail" id="kdDetailDialog" aria-labelledby="kdDetailTitle">
            <div class="kd-dialog-head">
                <div><small>K.I.B D / KARTU INVENTARIS BARANG</small>
                    <h2 id="kdDetailTitle">Detail Lokasi</h2>
                    <p id="kdDetailSubtitle">—</p>
                </div>
                <button class="kd-icon-button" data-kd-close="kdDetailDialog" aria-label="Tutup"><i
                        data-lucide="x"></i></button>
            </div>
            <div class="kd-dialog-body kd-detail-layout">
                <aside class="kd-detail-sidebar" aria-label="Pilih kelompok lokasi">
                    <h3><i data-lucide="list-tree"></i> Kelompok Lokasi</h3>
                    <input type="search" id="kdGroupSearch" placeholder="Cari lokasi..." autocomplete="off">
                    <div id="kdGroupList" class="kd-group-list"></div>
                </aside>
                <div class="kd-detail-main">
                    <div class="kd-detail-bar">
                        <div><strong>Daftar Inventaris · Format Excel K.I.B D</strong>
                            <p>Geser tabel ke kanan untuk melihat seluruh kolom.</p>
                        </div>
                        <div class="kd-detail-controls">
                            <input id="kdDetailSearch" type="search" placeholder="Cari barang, kode, register..."
                                aria-label="Cari barang dalam detail">
                            <span class="kd-count" id="kdDetailCount">0 data</span>
                            <button type="button" class="kd-button primary" id="kdDirectAdd">Tambah Data
                                Langsung</button>
                            <button type="button" class="kd-button outline" id="kdValueLink">Nilai Lokasi</button>
                            <button type="button" class="kd-button kd-report-open" id="kdExportDetail" disabled>
                                <i data-lucide="file-spreadsheet"></i> Print Excel Lokasi
                            </button>
                        </div>
                    </div>
                    <p class="kd-group-action-note" id="kdGroupActionNote" hidden></p>
                    <div class="kd-excel-scroll" role="region" tabindex="0" aria-label="Tabel Excel KIB D">
                        <table class="kd-excel-table" id="kdExcelTable">
                            <thead>
                                <tr>
                                    <th rowspan="2">No.</th>
                                    <th rowspan="2">Nama Barang / Jenis Barang</th>
                                    <th colspan="2">Nomor</th>
                                    <th rowspan="2">Kondisi Bangunan (B, KB, RB)</th>
                                    <th colspan="2">Konstruksi Bangunan</th>
                                    <th rowspan="2">Luas Lantai (M²)</th>
                                    <th rowspan="2">Letak / Lokasi Alamat</th>
                                    <th colspan="2">Dokumen Gedung</th>
                                    <th rowspan="2">Luas (M²)</th>
                                    <th rowspan="2">Status Tanah</th>
                                    <th rowspan="2">Nomor Kode Tanah</th>
                                    <th rowspan="2">Asal Usul</th>
                                    <th rowspan="2">Harga (Rp.)</th>
                                    <th rowspan="2">Keterangan</th>
                                    <th rowspan="2">Status Kepemilikan</th>
                                    <th rowspan="2">Berkas</th>
                                </tr>
                                <tr>
                                    <th>Kode Barang</th>
                                    <th>Register</th>
                                    <th>Bertingkat / Tidak</th>
                                    <th>Beton / Tidak</th>
                                    <th>Tanggal</th>
                                    <th>Nomor</th>
                                </tr>
                            </thead>
                            <tbody id="kdExcelBody">
                                <tr>
                                    <td colspan="19">Pilih lokasi untuk melihat inventaris.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="kd-table-hint"><span><i data-lucide="move-horizontal"></i> Geser ke kanan untuk kolom
                            selanjutnya</span><span>Data terbaru berada di urutan teratas</span></div>
                    <section class="kd-berkas" id="kdBerkas" hidden aria-live="polite">
                        <div class="kd-berkas-head">
                            <div><small>LAMPIRAN & TINDAKAN</small>
                                <h3 id="kdBerkasTitle">Detail Inventaris</h3><span id="kdBerkasSource"></span>
                            </div>
                            <div id="kdBerkasActions" class="kd-row-actions"></div>
                        </div>
                        <div class="kd-berkas-grid">
                            <div class="kd-file-box"><strong>Foto Aset</strong>
                                <div id="kdBerkasFoto" class="kd-image-placeholder">Foto belum tersedia</div>
                            </div>
                            <div class="kd-file-box"><strong>Dokumen PDF / Berkas</strong>
                                <div id="kdBerkasDok" class="kd-document-placeholder">Dokumen belum tersedia</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </dialog>

        {{-- UBAH STATUS KEPEMILIKAN ARSIP JEMBATAN --}}
        <dialog class="kd-dialog form kd-owner-dialog" id="kdOwnerDialog" aria-labelledby="kdOwnerTitle">
            <div class="kd-dialog-head">
                <div><small>ARSIP K.I.B D / STATUS KEPEMILIKAN</small>
                    <h2 id="kdOwnerTitle">Atur Kepemilikan Jembatan</h2>
                    <p>Ubah status kepemilikan dengan cepat tanpa mengganti data lain.</p>
                </div><button type="button" class="kd-icon-button" data-kd-close="kdOwnerDialog" aria-label="Tutup"><i
                        data-lucide="x"></i></button>
            </div>
            <form id="kdOwnerForm" class="kd-form" novalidate>
                <section class="kd-form-section"><label class="kd-field"><span>Status Kepemilikan <em>*</em></span>
                        <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                placeholder="Ketik status kepemilikan..." autocomplete="off"><select
                                name="status_kepemilikan" data-kd-native required>
                                <option value="">Pilih status</option>
                                @foreach (array_slice($pemilik, 0, 5, true) as $value => $label)
                                    <option value="{{ $value }}">{{ $label }}</option>
                                @endforeach
                            </select>
                            <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                        </div>
                    </label></section>
                <div class="kd-form-foot"><small id="kdOwnerMessage" role="status"></small><button type="button"
                        class="kd-button outline" data-kd-close="kdOwnerDialog">Batal</button><button
                        class="kd-button primary" type="submit"><i data-lucide="save"></i> Simpan Status</button></div>
            </form>
        </dialog>

        {{-- TAMBAH/EDIT JEMBATAN DI TABEL ASLI kib_d_s --}}
        <dialog class="kd-dialog form" id="kdFormDialog" aria-labelledby="kdFormTitle">
            <div class="kd-dialog-head">
                <div><small>K.I.B D / DATA JEMBATAN</small>
                    <h2 id="kdFormTitle">Tambah Data Jembatan</h2>
                    <p>Pilih Data Pending atau input langsung; lanjutkan sesuai urutan kolom Excel.</p>
                </div><button type="button" class="kd-icon-button" data-kd-close="kdFormDialog" aria-label="Tutup"><i
                        data-lucide="x"></i></button>
            </div>
            <form id="kdForm" class="kd-form" enctype="multipart/form-data" novalidate>
                <input id="kdEditId" type="hidden" value="">
                <input type="hidden" id="kdVoucherId" name="id_nilai_aktiva" value="">
                <section class="kd-form-section" id="kdPendingSection">
                    <div class="kd-section-label"><b>01</b>
                        <div><strong>Pilih Data Pending Nilai Aset</strong>
                            <small>Voucher kategori K.I.B D yang belum diproses. Pilih salah satu atau lanjut input
                                langsung.</small>
                        </div>
                    </div>
                    <div class="kd-pending-selected" id="kdSelectedVoucher" hidden>
                        <div><strong id="kdVoucherLabel">Voucher terpilih</strong><small id="kdVoucherMeta">—</small>
                        </div>
                        <button type="button" class="kd-button outline" id="kdChangeVoucher">Ganti Voucher</button>
                    </div>
                    <div id="kdPendingPicker">
                        <label class="kd-search-field kd-pending-search"><i data-lucide="search"></i>
                            <input type="search" id="kdPendingSearch"
                                placeholder="Cari voucher, lokasi, divisi, atau uraian..." autocomplete="off">
                        </label>
                        <div class="kd-pending-table-wrap">
                            <table class="kd-pending-table">
                                <thead>
                                    <tr>
                                        <th>No.</th>
                                        <th>Voucher</th>
                                        <th>Lokasi</th>
                                        <th>Departemen</th>
                                        <th>Divisi</th>
                                        <th>Nilai</th>
                                        <th>Uraian</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="kdPendingBody">
                                    <tr>
                                        <td colspan="8">Memuat data pending...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="kd-pending-actions"><span id="kdPendingCount">0 data</span>
                            <button type="button" id="kdDirectInput" class="kd-button outline"><i
                                    data-lucide="plus"></i> Input langsung tanpa voucher</button>
                        </div>
                        <div class="kd-pending-pages" id="kdPendingPages" aria-label="Navigasi halaman voucher">
                            <button type="button" id="kdPendingPrev" class="kd-button outline">Sebelumnya</button>
                            <span id="kdPendingPageLabel">Halaman 1 / 1</span>
                            <button type="button" id="kdPendingNext" class="kd-button outline">Berikutnya</button>
                        </div>
                    </div>
                </section>
                <section class="kd-form-section">
                    <div class="kd-section-label"><b>02</b>
                        <div><strong>Identitas Lokasi</strong><small>Data organisasi dan lokasi inventaris</small></div>
                    </div>
                    <div class="kd-form-grid">
                        <label class="kd-field"><span>Lokasi <em>*</em></span>
                            <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                    placeholder="Ketik nama lokasi..." autocomplete="off" required><select
                                    name="id_lokasi" data-kd-native required>
                                    <option value="">Pilih lokasi</option>
                                    @foreach ($lokasiOptions as $opt)
                                        <option value="{{ $opt->id }}" data-alamat="{{ $opt->alamat }}">
                                            {{ $opt->lokasi }}</option>
                                    @endforeach
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                        <label class="kd-field"><span>Alamat Lokasi</span><input id="kdAlamat" type="text" readonly
                                placeholder="Terisi otomatis dari Lokasi"></label>
                        <label class="kd-field"><span>Departemen</span>
                            <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                    placeholder="Cari departemen..." autocomplete="off"><select data-kd-native
                                    name="id_departemen">
                                    <option value="">Tidak ditentukan</option>
                                    @foreach ($departemenOptions as $opt)
                                        <option value="{{ $opt->id }}">{{ $opt->nama_dep }}</option>
                                    @endforeach
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                        <label class="kd-field"><span>Divisi</span>
                            <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                    placeholder="Cari divisi..." autocomplete="off"><select data-kd-native
                                    name="id_div">
                                    <option value="">Tidak ditentukan</option>
                                    @foreach ($divisiOptions as $opt)
                                        <option value="{{ $opt->id }}" data-dep="{{ $opt->id_dep }}">
                                            {{ $opt->nama_div }}</option>
                                    @endforeach
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                    </div>
                </section>
                <section class="kd-form-section">
                    <div class="kd-section-label"><b>03</b>
                        <div><strong>Kartu Inventaris Barang D</strong><small>Urut sesuai kolom Excel</small></div>
                    </div>
                    <div class="kd-form-grid">
                        <label class="kd-field"><span>Nama Barang / Jenis Barang <em>*</em></span>
                            <div class="kd-combo" data-kd-combo>
                                <input type="search" id="kdNamaBarang" data-kd-search
                                    placeholder="Ketik nama atau kode barang..." autocomplete="off">
                                <select name="id_barang" id="kdIdBarang" data-kd-native required>
                                    <option value="">Pilih barang dari Master Data</option>
                                    @foreach ($barangOptions as $opt)
                                        <option value="{{ $opt->id }}" data-code="{{ $opt->kode_barang }}"
                                            data-status="{{ $opt->status }}">{{ $opt->nama_barang }} —
                                            {{ $opt->kode_barang }}</option>
                                    @endforeach
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                        <label class="kd-field"><span>Kode Barang</span><input name="kode" id="kdKode"
                                maxlength="100" placeholder="03.11.01.16.04"></label>
                        <label class="kd-field"><span>Nomor Register</span><input name="reg" maxlength="100"
                                placeholder="Nomor register"></label>
                        <label class="kd-field"><span>Kondisi Bangunan</span>
                            <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                    placeholder="Cari kondisi..." autocomplete="off"><select data-kd-native
                                    name="kondisi">
                                    <option value="">Pilih kondisi</option>
                                    <option>Baik</option>
                                    <option>Kurang Baik</option>
                                    <option>Rusak Berat</option>
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                        <label class="kd-field"><span>Konstruksi — Bertingkat / Tidak</span>
                            <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                    placeholder="Cari konstruksi..." autocomplete="off"><select data-kd-native
                                    name="konstruksi">
                                    <option value="">Pilih konstruksi</option>
                                    <option>Bertingkat</option>
                                    <option>Tidak</option>
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                        <label class="kd-field"><span>Konstruksi — Beton / Tidak</span>
                            <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                    placeholder="Cari material..." autocomplete="off"><select data-kd-native
                                    name="materi">
                                    <option value="">Pilih material</option>
                                    <option>Beton</option>
                                    <option>Tidak</option>
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                        <label class="kd-field"><span>Luas Lantai (M²)</span><input name="luas_lantai" maxlength="100"
                                placeholder="Contoh 240"></label>
                        <label class="kd-field"><span>Letak / Lokasi Alamat</span><input id="kdLetak" type="text"
                                readonly placeholder="Otomatis dari alamat lokasi"></label>
                        <label class="kd-field"><span>Tanggal Dokumen</span><input type="date" name="tgl_dok"></label>
                        <label class="kd-field"><span>Nomor Dokumen</span><input name="no_dok" maxlength="255"
                                placeholder="Nomor dokumen"></label>
                        <label class="kd-field"><span>Luas (M²)</span><input name="luas" maxlength="100"
                                placeholder="Luas keseluruhan"></label>
                        <label class="kd-field"><span>Status Tanah</span><input name="status_tanah" maxlength="255"
                                placeholder="Contoh Hak Pakai"></label>
                        <label class="kd-field"><span>Nomor Kode Tanah</span><input name="kode_tanah" maxlength="255"
                                placeholder="Contoh 01.01.11.03.24"></label>
                        <label class="kd-field"><span>Asal Usul</span><input name="asal" maxlength="255"
                                placeholder="Contoh SK Walikota"></label>
                        <label class="kd-field"><span>Harga Perolehan (Rp.)</span><input id="kdHarga" type="number"
                                name="harga" min="0" step="1" placeholder="0"><small>Jika memakai
                                voucher, nilai diambil dari transaksi asli.</small></label>
                        <label class="kd-field"><span>Status Kepemilikan <em>*</em></span>
                            <div class="kd-combo" data-kd-combo><input type="search" data-kd-search
                                    placeholder="Ketik untuk mencari kepemilikan..." autocomplete="off" required><select
                                    name="status_kepemilikan" data-kd-native required>
                                    <option value="">Pilih status</option>
                                    @foreach (array_slice($pemilik, 0, 5, true) as $value => $label)
                                        <option value="{{ $value }}">{{ $label }}</option>
                                    @endforeach
                                </select>
                                <div class="kd-combo-menu" data-kd-menu role="listbox" hidden></div>
                            </div>
                        </label>
                        <label class="kd-field wide"><span>Keterangan</span>
                            <textarea name="ket" rows="3" maxlength="10000" placeholder="Keterangan inventaris"></textarea>
                        </label>
                    </div>
                </section>
                <section class="kd-form-section">
                    <div class="kd-section-label"><b>04</b>
                        <div><strong>Lampiran dan Dokumen</strong><small>Kosongkan saat Edit jika tidak ingin mengganti
                                berkas lama.</small></div>
                    </div>
                    <div class="kd-form-grid">
                        <label class="kd-field"><span>Foto (JPG, PNG, WEBP — maksimal 5 MB)</span><input type="file"
                                name="foto" accept="image/jpeg,image/png,image/webp"></label>
                        <label class="kd-field"><span>Dokumen PDF (maksimal 15 MB)</span><input type="file"
                                name="dokumen" accept="application/pdf"></label>
                    </div>
                </section>
                <div class="kd-form-foot"><small id="kdFormMessage" role="status"></small><button type="button"
                        class="kd-button outline" data-kd-close="kdFormDialog">Batal</button><button
                        class="kd-button primary" id="kdSave" type="submit"><i data-lucide="save"></i> Simpan
                        Jembatan</button></div>
            </form>
        </dialog>
        {{-- =====================================================
            POPUP PRINT EXCEL K.I.B D — ACUAN K.I.B A TANAH (PRD V2.1)
            Mengambil seluruh inventaris pada Detail/tab lokasi, tanpa pagination.
        ===================================================== --}}
        <dialog id="kdReportDialog" class="kd-report-dialog">
            <div class="kd-report-head">
                <div>
                    <small>LAPORAN KARTU INVENTARIS BARANG (K.I.B D)</small>
                    <h2>Print Excel — Jalan, Irigasi dan Jaringan</h2>
                    <p id="kdReportScope">Memuat data lokasi...</p>
                </div>
                <button type="button" class="kd-report-x" data-kd-report-close aria-label="Tutup laporan">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="kd-report-body">
                <form id="kdReportForm" class="kd-report-form" autocomplete="off">
                    <label class="kd-report-period-field">
                        <span>Periode laporan <b>*</b></span>
                        <input id="kdReportPeriod" type="month" required>
                        <small>Contoh: November 2026</small>
                    </label>
                    <div class="kd-report-sign-grid">
                        @foreach ([['dibuat', 'Dibuat Oleh'], ['diperiksa', 'Diperiksa Oleh'], ['diketahui', 'Diketahui Oleh'], ['disetujui', 'Disetujui Oleh']] as [$peran, $judul])
                            <div class="kd-report-person" data-kd-person="{{ $peran }}">
                                <label for="kdReportSigner-{{ $peran }}">
                                    <span>{{ $judul }} <b>*</b></span>
                                </label>
                                <div class="kd-report-combobox">
                                    <input type="search" id="kdReportSigner-{{ $peran }}"
                                        data-kd-report-role="{{ $peran }}" class="kd-report-person-search"
                                        role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
                                        aria-expanded="false" aria-controls="kdReportOptions-{{ $peran }}"
                                        placeholder="Ketik nama, NIP, atau jabatan..." autocomplete="off" required>
                                    <input type="hidden" class="kd-report-person-id">
                                    <div class="kd-report-person-options" id="kdReportOptions-{{ $peran }}"
                                        role="listbox" popover="manual" hidden></div>
                                </div>
                                <small class="kd-report-person-description">Pilih dari Master SDM Pendukung.</small>
                            </div>
                        @endforeach
                    </div>
                </form>
                <small>Nilai Rp mengikuti voucher terhubung per inventaris. Harga/nilai historis atau manual tetap dipakai
                    jika belum ada voucher. PERIKSA RELASI menandai konflik, bukan nilai nol.</small>
                <div id="kdReportInfo" class="kd-report-info" role="status" aria-live="polite">
                    Pilih periode dan penandatangan untuk menampilkan preview.
                </div>
                <section id="kdReportPreviewBox" class="kd-report-preview-box" hidden>
                    <div class="kd-report-preview-title">
                        <strong>Preview Laporan K.I.B D</strong>
                        <span id="kdReportCount">0 data</span>
                    </div>
                    <div class="kd-report-preview-scroller" id="kdReportPreview"></div>
                </section>
            </div>
            <div class="kd-report-footer">
                <span>Detail lokasi · 17 kolom K.I.B D · tanpa Status Kepemilikan</span>
                <div class="kd-report-footer-buttons">
                    <button type="button" class="kd-report-cancel" data-kd-report-close>Batal</button>
                    <button type="button" class="kd-report-print" id="kdReportPrint" disabled>
                        <i data-lucide="printer"></i> Print
                    </button>
                    <button type="button" class="kd-report-download" id="kdReportDownload" disabled>
                        <i data-lucide="download"></i> Download Excel
                    </button>
                </div>
            </div>
        </dialog>

    </main>
@endsection

@push('scripts')
    <script
        src="{{ asset('js/pages/kib/jalan.js') }}?v={{ file_exists(public_path('js/pages/kib/jalan.js')) ? filemtime(public_path('js/pages/kib/jalan.js')) : '1' }}">
    </script>
@endpush
