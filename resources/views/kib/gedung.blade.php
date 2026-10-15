@extends('layouts.main')

@section('title', 'Gedung & Bangunan')

@section('content')

    @php
        $rupiah = fn($n) => 'Rp ' . number_format((float) ($n ?? 0), 0, ',', '.');
        $totalKondisi = max(1, (int) $totalGedung);
        $baik = (int) ($kondisi['Baik'] ?? 0);
        $rusak = (int) ($kondisi['Rusak'] ?? 0);
        $perhatian = (int) ($kondisi['Perlu perhatian'] ?? 0);
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/gedung.css') }}?v={{ file_exists(public_path('css/pages/kib/gedung.css')) ? filemtime(public_path('css/pages/kib/gedung.css')) : time() }}">

    <main id="gedungPage" class="content gedung-page" data-base-url="{{ url('/kib/gedung') }}"
        data-store-url="{{ route('kib.gedung.store') }}" data-pending-url="{{ route('kib.gedung.pending') }}">
        {{-- =============================================
         HEADER DAN KPI
    ============================================== --}}
        <header class="gedung-hero">
            <div class="gedung-hero-overlay"></div>

            <div class="gedung-hero-inner">
                <div class="gedung-hero-top">
                    <div>
                        <nav class="gedung-breadcrumb">
                            <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                                <i data-lucide="house"></i>
                            </a>

                            <i data-lucide="chevron-right"></i>
                            <span>K.I.B</span>
                            <i data-lucide="chevron-right"></i>
                            <strong>Gedung & Bangunan</strong>
                        </nav>

                        <h1>Gedung & Bangunan</h1>
                        <p>
                            Kelola inventaris gedung, nilai transaksi,
                            dokumen, dan data masuk dari Nilai Aset
                            Perumda Tirta Kencana Kota Samarinda.
                        </p>
                    </div>

                    <div class="gedung-date-card">
                        <i data-lucide="calendar-days"></i>
                        <div>
                            <strong>
                                {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                            </strong>
                            <small>
                                {{ now('Asia/Makassar')->format('H:i') }} WITA
                            </small>
                        </div>
                    </div>
                </div>

                <div class="gedung-kpis">
                    <article class="gedung-kpi">
                        <span class="gedung-kpi-icon">
                            <i data-lucide="building-2"></i>
                        </span>
                        <div>
                            <small>Total Data Gedung</small>
                            <strong>{{ number_format($totalGedung, 0, ',', '.') }}</strong>
                            <span>Inventaris terdaftar</span>
                        </div>
                    </article>

                    <article class="gedung-kpi">
                        <span class="gedung-kpi-icon">
                            <i data-lucide="wallet"></i>
                        </span>
                        <div>
                            <small>Total Nilai Gedung</small>
                            <strong>{{ $rupiah($totalNilai) }}</strong>
                            <span>Transaksi aktiva K.I.B C</span>
                        </div>
                    </article>

                    <article class="gedung-kpi">
                        <span class="gedung-kpi-icon">
                            <i data-lucide="map-pin"></i>
                        </span>
                        <div>
                            <small>Jumlah Lokasi</small>
                            <strong>{{ number_format($totalLokasi, 0, ',', '.') }}</strong>
                            <span>Lokasi dengan inventaris</span>
                        </div>
                    </article>

                    <article class="gedung-kpi">
                        <span class="gedung-kpi-icon">
                            <i data-lucide="bell"></i>
                        </span>
                        <div>
                            <small>Pending Nilai Aset</small>
                            <strong id="gedungPendingKpi">
                                {{ number_format($totalPending, 0, ',', '.') }}
                            </strong>
                            <span>Penambahan Aset menunggu</span>
                        </div>
                    </article>
                </div>
            </div>
        </header>

        {{-- =============================================
         ALERT SUKSES DAN VALIDASI
    ============================================== --}}
        @if (session('success'))
            <div class="gedung-alert success" role="status">
                {{ session('success') }}
            </div>
        @endif

        @if ($errors->any())
            <div class="gedung-alert danger" role="alert">
                <strong>Data belum berhasil disimpan:</strong>
                <ul>
                    @foreach ($errors->all() as $err)
                        <li>{{ $err }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        {{-- =============================================
         CARD DATA MASUK
    ============================================== --}}
        <section class="gedung-incoming" id="gedungIncomingCard">
            <span class="gedung-incoming-icon">
                <i data-lucide="bell-ring"></i>
            </span>

            <div class="gedung-incoming-copy">
                <small>NILAI ASET</small>

                <h2>
                    Data Gedung dan Bangunan Menunggu Diproses
                    <em id="gedungIncomingBadge">
                        {{ number_format($totalPending, 0, ',', '.') }}
                    </em>
                </h2>

                <p>
                    Ada
                    <strong id="gedungPendingLabel">
                        {{ number_format($totalPending, 0, ',', '.') }}
                    </strong>
                    transaksi Penambahan Aset kategori Gedung
                    yang menunggu pendataan K.I.B.
                </p>

                <span class="gedung-pending-pill">
                    <i data-lucide="package-plus"></i>

                    <b id="gedungPendingPill">
                        {{ number_format($totalPending, 0, ',', '.') }}
                    </b>

                    Data Pending Gedung
                </span>
            </div>

            <button id="gedungOpenPending" type="button" class="gedung-btn outline">
                <i data-lucide="inbox"></i>
                Lihat Data Masuk
            </button>
        </section>

        {{-- =============================================
         TABEL UTAMA GEDUNG
    ============================================== --}}
        <section class="gedung-card">
            <div class="gedung-card-title">
                <div>
                    <h2>Daftar Gedung dan Bangunan</h2>
                    <p>
                        Pengelompokan aset berdasarkan lokasi
                        sesuai sistem aset lama.
                    </p>
                </div>

                <button type="button" id="gedungAdd" class="gedung-btn primary">
                    <i data-lucide="plus"></i>
                    Tambah Data Gedung
                </button>
            </div>

            <div class="gedung-toolbar">
                <label class="gedung-search">
                    <i data-lucide="search"></i>
                    <input type="search" id="gedungSearch" placeholder="Cari nama lokasi atau alamat...">
                </label>

                <label class="gedung-limit">
                    Jumlah data
                    <select id="gedungPageSize">
                        <option value="10">10</option>
                        <option value="20" selected>20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </label>

                <button type="button" id="gedungReset" class="gedung-btn outline">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>

                <button type="button" id="gedungExport" class="gedung-btn outline">
                    <i data-lucide="download"></i>
                    Export CSV
                </button>
            </div>

            <div class="gedung-table-scroller">
                <table class="gedung-table" id="gedungTable">
                    <colgroup>
                        <col class="gc-no">
                        <col class="gc-lokasi">
                        <col class="gc-alamat">
                        <col class="gc-nilai">
                        <col class="gc-pdf">
                        <col class="gc-aksi">
                    </colgroup>

                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Lokasi</th>
                            <th>Alamat</th>
                            <th>Nilai</th>
                            <th>PDF</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        @forelse($lokasiGedung as $row)
                            <tr class="gedung-row"
                                data-search="{{ mb_strtolower(trim((string) $row->lokasi) . ' ' . trim((string) $row->alamat)) }}"
                                data-export-lokasi="{{ trim((string) $row->lokasi) }}"
                                data-export-alamat="{{ trim((string) $row->alamat) }}"
                                data-export-nilai="{{ (int) $row->nilai_total }}"
                                data-export-pdf="{{ (int) $row->jumlah_pdf }}">
                                <td class="gedung-row-number"></td>

                                <td>
                                    <strong>
                                        {{ trim((string) $row->lokasi) ?: '—' }}
                                    </strong>
                                    <small>
                                        ID Lokasi #{{ $row->id_lokasi }}
                                        · {{ $row->jumlah_gedung }} gedung
                                    </small>
                                </td>

                                <td>
                                    {{ trim((string) $row->alamat) ?: '—' }}
                                </td>

                                <td>
                                    <button type="button" class="gedung-nilai-btn"
                                        data-nilai-lokasi="{{ $row->id_lokasi }}"
                                        data-nama="{{ trim((string) $row->lokasi) }}">
                                        <span>
                                            <b>{{ $rupiah($row->nilai_total) }}</b>
                                            <small>
                                                {{ $row->jumlah_transaksi }} transaksi
                                            </small>
                                        </span>
                                        <i data-lucide="external-link"></i>
                                    </button>
                                </td>

                                <td class="gedung-center">
                                    @if ((int) $row->jumlah_pdf > 0)
                                        <button type="button" class="gedung-pdf-btn"
                                            data-pdf-lokasi="{{ $row->id_lokasi }}"
                                            data-nama="{{ trim((string) $row->lokasi) }}">
                                            <i data-lucide="file-text"></i>
                                            PDF ({{ $row->jumlah_pdf }})
                                        </button>
                                    @else
                                        <span class="gedung-muted">—</span>
                                    @endif
                                </td>

                                <td class="gedung-center">
                                    <div class="gedung-actions">
                                        <button type="button" class="gedung-action view"
                                            data-lokasi="{{ $row->id_lokasi }}" title="Lihat detail lokasi"
                                            aria-label="Detail lokasi">
                                            <i data-lucide="eye"></i>
                                        </button>

                                        <button type="button" class="gedung-action edit"
                                            data-pilih-edit="{{ $row->id_lokasi }}" title="Pilih gedung untuk diedit"
                                            aria-label="Edit gedung">
                                            <i data-lucide="square-pen"></i>
                                        </button>

                                        <button type="button" class="gedung-action delete"
                                            data-pilih-hapus="{{ $row->id_lokasi }}" title="Pilih gedung untuk dihapus"
                                            aria-label="Hapus gedung">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td class="gedung-empty" colspan="6">
                                    Belum ada inventaris Gedung pada database.
                                    Data Nilai Aset dapat diproses melalui
                                    Lihat Data Masuk.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <footer class="gedung-table-footer">
                <span id="gedungTableInfo"></span>
                <div id="gedungPagination" class="gedung-pagination"></div>
            </footer>
        </section>

        {{-- =============================================
         DISTRIBUSI KONDISI DAN GEDUNG TERBARU
    ============================================== --}}
        <div class="gedung-insights">
            <section class="gedung-card">
                <h2>Distribusi Kondisi Gedung</h2>

                <div class="gedung-condition-panel">
                    <div class="gedung-donut"
                        style="--p1:{{ round(($baik / $totalKondisi) * 100, 2) }}%;--p2:{{ round((($baik + $perhatian) / $totalKondisi) * 100, 2) }}%">
                        <div>
                            <b>{{ number_format($totalGedung, 0, ',', '.') }}</b>
                            <small>Gedung</small>
                        </div>
                    </div>

                    <div class="gedung-legend">
                        <div>
                            <span class="swatch good"></span>
                            Baik
                            <strong>{{ $baik }}</strong>
                        </div>

                        <div>
                            <span class="swatch warn"></span>
                            Perlu perhatian
                            <strong>{{ $perhatian }}</strong>
                        </div>

                        <div>
                            <span class="swatch bad"></span>
                            Rusak
                            <strong>{{ $rusak }}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section class="gedung-card">
                <h2>Gedung Terbaru</h2>

                <div class="gedung-table-scroller">
                    <table class="gedung-table gedung-recent">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Gedung</th>
                                <th>Lokasi</th>
                                <th>Terdaftar</th>
                            </tr>
                        </thead>

                        <tbody>
                            @forelse($terbaru as $item)
                                <tr>
                                    <td>{{ $item->kode }}</td>
                                    <td>{{ trim((string) $item->nama_barang) }}</td>
                                    <td>{{ $item->lokasi }}</td>
                                    <td>
                                        {{ $item->created_at ? \Carbon\Carbon::parse($item->created_at)->format('d/m/Y') : '—' }}
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="gedung-empty">
                                        Belum ada data
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        {{-- =============================================
         MODAL TAMBAH / EDIT GEDUNG
    ============================================== --}}
        <dialog id="gedungFormDialog" class="gedung-dialog">
            <div class="gedung-dialog-head">
                <div>
                    <small>K.I.B C — GEDUNG DAN BANGUNAN</small>
                    <h2 id="gedungFormTitle">Tambah Data Gedung</h2>
                    <p>
                        Pilih sumber transaksi lalu lengkapi
                        informasi inventaris.
                    </p>
                </div>

                <button class="gedung-x" type="button" data-close="gedungFormDialog" aria-label="Tutup">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="gedung-dialog-body">
                {{-- TABEL PENDING --}}
                <section id="gedungPendingSection" class="gedung-form-section">
                    <span class="gedung-step">1</span>

                    <div class="gedung-section-content">
                        <h3>Pilih Data Nilai Aset</h3>
                        <p>
                            Voucher Penambahan Aset golongan Gedung
                            dan Bangunan yang belum diproses.
                        </p>

                        <div class="gedung-toolbar">
                            <label class="gedung-search">
                                <i data-lucide="search"></i>
                                <input type="search" id="gedungPendingSearch"
                                    placeholder="Cari voucher, lokasi, departemen atau uraian...">
                            </label>

                            <span id="gedungPendingCount">0 data</span>
                        </div>

                        <div class="gedung-table-scroller gedung-pending-scroller">
                            <table class="gedung-table gedung-pending-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Voucher</th>
                                        <th>Lokasi</th>
                                        <th>Departemen</th>
                                        <th>Divisi</th>
                                        <th>Tahun</th>
                                        <th>Nilai</th>
                                        <th>Uraian</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="gedungPendingBody">
                                    <tr>
                                        <td colspan="9" class="gedung-empty">
                                            Memuat data...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {{-- DATA VOUCHER TERPILIH --}}
                <div id="gedungSelected" class="gedung-selected" hidden>
                    <i data-lucide="circle-check-big"></i>

                    <div>
                        <small>Data Nilai Aset Terpilih</small>
                        <strong id="gedungSelectedTitle">—</strong>
                        <span id="gedungSelectedMeta">—</span>
                    </div>

                    <button type="button" id="gedungChange" class="gedung-btn outline">
                        <i data-lucide="refresh-cw"></i>
                        Ganti
                    </button>
                </div>

                {{-- FORM GEDUNG --}}
                <form id="gedungForm" method="POST" action="{{ route('kib.gedung.store') }}"
                    enctype="multipart/form-data">
                    @csrf

                    <input type="hidden" name="_method" id="gedungMethod" value="PUT" disabled>

                    <input type="hidden" name="id_nilai_aktiva" id="gedungVoucherId"
                        value="{{ old('id_nilai_aktiva') }}">

                    <section class="gedung-form-section">
                        <span class="gedung-step">2</span>

                        <div class="gedung-section-content">
                            <h3>Lokasi dan Organisasi</h3>
                            <p>Terisi otomatis dari Nilai Aset.</p>

                            <div class="gedung-fields cols3">
                                <label>
                                    Lokasi
                                    <input id="gedungLokasi" readonly>
                                </label>
                                <label>
                                    Departemen
                                    <input id="gedungDepartemen" readonly>
                                </label>
                                <label>
                                    Divisi
                                    <input id="gedungDivisi" readonly>
                                </label>
                            </div>

                            <div class="gedung-fields cols2">
                                <label>
                                    Alamat
                                    <input id="gedungAlamat" readonly>
                                </label>
                                <label>
                                    Nomor Voucher
                                    <input id="gedungVoucher" readonly>
                                </label>
                            </div>
                        </div>
                    </section>

                    <section class="gedung-form-section">
                        <span class="gedung-step">3</span>

                        <div class="gedung-section-content">
                            <h3>Informasi Gedung dan Bangunan</h3>
                            <p>
                                Field disesuaikan dengan tabel
                                <code>gedungs</code> dan detail inventaris
                                website lama.
                            </p>

                            <div class="gedung-fields cols2">
                                <label>
                                    Nama Barang / Jenis Gedung *
                                    <select name="id_barang" required>
                                        <option value="">— Pilih Barang —</option>
                                        @foreach ($barangRows as $barang)
                                            <option value="{{ $barang->id }}" @selected(old('id_barang') == $barang->id)>
                                                {{ trim((string) $barang->nama_barang) }}
                                                ({{ trim((string) $barang->kode_barang) }})
                                            </option>
                                        @endforeach
                                    </select>
                                </label>

                                <label>
                                    Kode Inventaris *
                                    <input name="kode" value="{{ old('kode') }}" maxlength="255" required>
                                </label>

                                <label>
                                    No. Register *
                                    <input name="reg" value="{{ old('reg') }}" maxlength="255" required>
                                </label>

                                <label>
                                    Penggunaan
                                    <input name="guna" value="{{ old('guna') }}" maxlength="255"
                                        placeholder="Contoh: Kantor / Operasional">
                                </label>

                                <label>
                                    Kondisi Bangunan
                                    <select name="kondisi">
                                        <option value="">— Pilih Kondisi —</option>
                                        <option value="BAIK">Baik</option>
                                        <option value="RUSAK RINGAN">Rusak Ringan</option>
                                        <option value="RUSAK BERAT">Rusak Berat</option>
                                    </select>
                                </label>

                                <label>
                                    Konstruksi *
                                    <select name="konstruksi" required>
                                        <option value="">— Pilih Konstruksi —</option>
                                        <option value="BERTINGKAT">Bertingkat</option>
                                        <option value="TIDAK BERTINGKAT">Tidak Bertingkat</option>
                                    </select>
                                </label>

                                <label>
                                    Material / Bahan
                                    <input name="materi" value="{{ old('materi') }}" maxlength="255"
                                        placeholder="Contoh: Beton">
                                </label>

                                <label>
                                    Luas Bangunan *
                                    <input name="luas" value="{{ old('luas') }}" maxlength="255"
                                        placeholder="Contoh: 597 m²" required>
                                </label>

                                <label>
                                    Luas Lantai / Tanah *
                                    <input name="luastanah" value="{{ old('luastanah') }}" maxlength="255"
                                        placeholder="Contoh: 700 m²" required>
                                </label>

                                <label>
                                    Status Tanah
                                    <select name="status">
                                        <option value="">— Pilih Status —</option>
                                        <option value="Perumdam">Perumdam</option>
                                        <option value="Pemprov">Pemprov</option>
                                        <option value="Milik Sendiri">Milik Sendiri</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </label>

                                <label>
                                    Kode Tanah *
                                    <input name="kode_tanah" value="{{ old('kode_tanah') }}" maxlength="255" required>
                                </label>

                                <label>
                                    Asal / Perolehan *
                                    <input name="asal" value="{{ old('asal') }}" maxlength="255"
                                        placeholder="Contoh: Pembelian" required>
                                </label>

                                <label>
                                    Tanggal Dokumen *
                                    <input name="tgl_imb" value="{{ old('tgl_imb') }}" type="date" required>
                                </label>

                                <label>
                                    No. IMB / Dokumen *
                                    <input name="no_imb" value="{{ old('no_imb') }}" maxlength="255" required>
                                </label>

                                <label>
                                    Dokumen PDF
                                    <input type="file" name="dokumen" accept="application/pdf">
                                    <small>PDF maksimal 15 MB</small>
                                </label>

                                <label>
                                    Foto Gedung
                                    <input type="file" name="foto" accept="image/*">
                                    <small>Maksimal 5 MB</small>
                                </label>
                            </div>

                            <label class="gedung-full-label">
                                Keterangan *
                                <textarea name="ket" rows="3" required>{{ old('ket') }}</textarea>
                            </label>
                        </div>
                    </section>

                    <div class="gedung-form-actions">
                        <button type="button" class="gedung-btn outline" data-close="gedungFormDialog">
                            Batal
                        </button>

                        <button type="submit" class="gedung-btn primary">
                            <i data-lucide="save"></i>
                            Simpan Data Gedung
                        </button>
                    </div>
                </form>
            </div>
        </dialog>

        {{-- =============================================
         MODAL DETAIL LOKASI DAN INVENTARIS
    ============================================== --}}
        <dialog id="gedungDetailDialog" class="gedung-dialog">
            <div class="gedung-dialog-head">
                <div>
                    <small>DETAIL INVENTARIS</small>
                    <h2 id="gedungDetailTitle">Detail Gedung</h2>
                    <p id="gedungDetailAddress">
                        Per lokasi, departemen dan divisi.
                    </p>
                </div>

                <button type="button" class="gedung-x" data-close="gedungDetailDialog">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="gedung-dialog-body">
                <div class="gedung-fields cols2 gedung-detail-filters">
                    <label>
                        Departemen
                        <select id="gedungDetailDep">
                            <option value="">Semua Departemen</option>
                        </select>
                    </label>

                    <label>
                        Divisi
                        <select id="gedungDetailDiv">
                            <option value="">Semua Divisi</option>
                        </select>
                    </label>
                </div>

                <div id="gedungDetailItems" class="gedung-detail-items"></div>

                <section id="gedungDetailFocus" class="gedung-detail-focus" hidden></section>
            </div>
        </dialog>

        {{-- =============================================
         MODAL RINCIAN NILAI GEDUNG
    ============================================== --}}
        <dialog id="gedungNilaiDialog" class="gedung-dialog">
            <div class="gedung-dialog-head">
                <div>
                    <small>RINCIAN NILAI ASET</small>
                    <h2 id="gedungNilaiTitle">Detail Nilai Gedung</h2>
                    <p id="gedungNilaiAddress"></p>
                </div>

                <button type="button" class="gedung-x" data-close="gedungNilaiDialog">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="gedung-dialog-body">
                <div class="gedung-nilai-summary">
                    <span>Total Nilai Gedung di Lokasi</span>
                    <strong id="gedungNilaiTotal">Rp 0</strong>
                    <small id="gedungNilaiCount">0 transaksi</small>
                </div>

                <div class="gedung-toolbar">
                    <label class="gedung-search">
                        <i data-lucide="search"></i>
                        <input id="gedungNilaiSearch" type="search" placeholder="Cari voucher, kode aktiva, uraian...">
                    </label>
                </div>

                <div class="gedung-table-scroller">
                    <table class="gedung-table gedung-nilai-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Perkiraan</th>
                                <th>Nama Aktiva</th>
                                <th>Tanggal</th>
                                <th>Tahun</th>
                                <th>Nilai</th>
                                <th>Uraian</th>
                                <th>Voucher</th>
                            </tr>
                        </thead>

                        <tbody id="gedungNilaiBody">
                            <tr>
                                <td colspan="8" class="gedung-empty">
                                    Memuat rincian...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </dialog>

        {{-- =============================================
         MODAL DAFTAR PDF
    ============================================== --}}
        <dialog id="gedungPdfDialog" class="gedung-dialog">
            <div class="gedung-dialog-head">
                <div>
                    <small>ARSIP DOKUMEN</small>
                    <h2 id="gedungPdfTitle">Daftar PDF Gedung</h2>
                    <p id="gedungPdfAddress"></p>
                </div>

                <button type="button" class="gedung-x" data-close="gedungPdfDialog">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="gedung-dialog-body">
                <div class="gedung-table-scroller">
                    <table class="gedung-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Gedung</th>
                                <th>Kode</th>
                                <th>Dokumen</th>
                            </tr>
                        </thead>
                        <tbody id="gedungPdfBody"></tbody>
                    </table>
                </div>
            </div>
        </dialog>

        {{-- FORM HAPUS INVENTARIS --}}
        <form id="gedungDeleteForm" method="POST" hidden>
            @csrf
            @method('DELETE')
        </form>
    </main>

    <script
        src="{{ asset('js/pages/kib/gedung.js') }}?v={{ file_exists(public_path('js/pages/kib/gedung.js')) ? filemtime(public_path('js/pages/kib/gedung.js')) : time() }}">
    </script>

@endsection
