@extends('layouts.main')

@section('title', 'K.I.B F — Konstruksi')

@section('content')

    @php
        $rupiah = fn($value) => 'Rp ' . number_format((float) ($value ?? 0), 0, ',', '.');

        $kategoriNama = fn($value) => match (strtoupper((string) $value)) {
            'IPA' => 'Instalasi Pengolahan Air (IPA)',
            'BOOSTER' => 'Booster',
            'PERPIPAAN' => 'Perpipaan',
            default => 'Belum Dikategorikan',
        };
    @endphp

    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">

    <section id="kfApp" class="kf-page" data-base="{{ url('/kib/konstruksi') }}" data-token="{{ csrf_token() }}">

        {{-- =====================================================
         HEADER — DESAIN K.I.B
    ====================================================== --}}

        <header class="kf-hero">

            <nav class="kf-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('dashboard') }}">
                    <i data-lucide="house"></i>
                </a>
                <i data-lucide="chevron-right"></i>
                <span>K.I.B</span>
                <i data-lucide="chevron-right"></i>
                <strong>Konstruksi</strong>
            </nav>

            <div class="kf-date-card">
                <span class="kf-date-icon">
                    <i data-lucide="calendar-days"></i>
                </span>
                <div>
                    <strong id="kfTanggal">
                        {{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}
                    </strong>
                    <small>
                        <span id="kfJam">
                            {{ now('Asia/Makassar')->format('H:i:s') }}
                        </span> WITA
                    </small>
                </div>
            </div>

            <h1>Konstruksi</h1>

            <p class="kf-hero-description">
                Pengelolaan K.I.B F berdasarkan kategori, cakupan,
                lokasi, dan dokumen konstruksi Perumda Tirta Kencana
                Kota Samarinda.
            </p>

            <div class="kf-stats">

                <article class="kf-stat-card">
                    <span class="kf-stat-icon">
                        <i data-lucide="hard-hat"></i>
                    </span>
                    <div>
                        <small>Total Inventaris</small>
                        <strong>
                            {{ number_format($total, 0, ',', '.') }}
                        </strong>
                        <span>Data konstruksi manual</span>
                    </div>
                </article>

                <article class="kf-stat-card">
                    <span class="kf-stat-icon">
                        <i data-lucide="map-pin"></i>
                    </span>
                    <div>
                        <small>Jumlah Lokasi</small>
                        <strong>
                            {{ number_format((int) $jumlahLokasi, 0, ',', '.') }}
                        </strong>
                        <span>Lokasi terinventarisasi</span>
                    </div>
                </article>

                <article class="kf-stat-card">
                    <span class="kf-stat-icon">
                        <i data-lucide="wallet"></i>
                    </span>
                    <div>
                        <small>Nilai Konstruksi</small>
                        <strong>{{ $rupiah($nilai) }}</strong>
                        <span>Nilai pencatatan manual</span>
                    </div>
                </article>

            </div>

        </header>


        {{-- =====================================================
         PANEL DATA KONSTRUKSI
    ====================================================== --}}

        <section class="kf-panel">

            <div class="kf-section-head">

                <div>
                    <h2>
                        {{ $view === 'arsip' ? 'Arsip Konstruksi Lama' : 'Daftar Konstruksi' }}
                    </h2>
                    <p>
                        {{ $view === 'arsip'
                            ? 'Data historis konstruksi hanya untuk dilihat.'
                            : 'Kelola data konstruksi melalui View, Edit, dan Delete pada setiap baris.' }}
                    </p>
                </div>

                <div class="kf-panel-actions">
                    <span class="kf-chip">
                        {{ number_format($items->total(), 0, ',', '.') }} hasil
                    </span>

                    <button type="button" class="kf-btn kf-primary" id="kfTambah">
                        <i data-lucide="plus"></i>
                        Tambah Konstruksi
                    </button>
                </div>

            </div>


            {{-- TAB MANUAL / ARSIP --}}

            <nav class="kf-tabs" aria-label="Jenis data Konstruksi">

                <a href="{{ route('kib.konstruksi') }}" class="{{ $view === 'manual' ? 'active' : '' }}">
                    <i data-lucide="clipboard-list"></i>
                    Data Manual Baru
                    ({{ number_format($total, 0, ',', '.') }})
                </a>

                <a href="{{ route('kib.konstruksi', ['view' => 'arsip']) }}"
                    class="{{ $view === 'arsip' ? 'active' : '' }}">
                    <i data-lucide="archive"></i>
                    Arsip Data Lama
                    ({{ number_format($archiveCount, 0, ',', '.') }})
                </a>

            </nav>


            {{-- FILTER --}}

            <form method="GET" action="{{ route('kib.konstruksi') }}" class="kf-toolbar">

                <input type="hidden" name="view" value="{{ $view }}">

                <label class="kf-search">
                    <i data-lucide="search"></i>
                    <input type="search" name="q" value="{{ $search }}"
                        placeholder="Cari pekerjaan, lokasi, cakupan, uraian...">
                </label>

                @if ($view === 'manual')
                    <select name="kategori" class="kf-filter" aria-label="Filter kategori">
                        <option value="">Semua kategori</option>
                        <option value="IPA" @selected($category === 'IPA')>
                            Instalasi Pengolahan Air
                        </option>
                        <option value="BOOSTER" @selected($category === 'BOOSTER')>
                            Booster
                        </option>
                        <option value="PERPIPAAN" @selected($category === 'PERPIPAAN')>
                            Perpipaan
                        </option>
                    </select>
                @endif

                <button class="kf-btn kf-primary" type="submit">
                    <i data-lucide="filter"></i>
                    Filter
                </button>

                <a class="kf-btn kf-outline"
                    href="{{ route('kib.konstruksi', $view === 'arsip' ? ['view' => 'arsip'] : []) }}">
                    Reset
                </a>

            </form>


            {{-- =================================================
             TABEL MANUAL — KOLOM TIDAK DIUBAH
        ================================================== --}}

            @if ($view === 'manual')

                <div class="kf-table-wrap">

                    <table class="kf-table">

                        <thead>

                            <tr>
                                <th rowspan="2">No.</th>

                                <th rowspan="2" class="kf-name-col">
                                    Nama Barang / Jenis Barang dan Uraian
                                </th>

                                <th rowspan="2">Kategori</th>
                                <th rowspan="2">Cakupan</th>
                                <th rowspan="2">Tahun</th>

                                <th rowspan="2">
                                    Bangunan (P, SP, D)
                                </th>

                                <th colspan="2">
                                    Konstruksi Bangunan
                                </th>

                                <th rowspan="2">
                                    Letak / Lokasi Alamat
                                </th>

                                <th rowspan="2">Status Tanah</th>

                                <th rowspan="2">
                                    Asal Usul Pembiayaan
                                </th>

                                <th rowspan="2">Status Aset</th>
                                <th rowspan="2">Nilai (Rp)</th>

                                <th rowspan="2">
                                    Dokumen Pendukung
                                </th>

                                <th rowspan="2" class="kf-actions-head">
                                    Aksi
                                </th>
                            </tr>

                            <tr>
                                <th>Bertingkat / Tidak</th>
                                <th>Beton / Tidak</th>
                            </tr>

                        </thead>

                        <tbody>

                            @forelse ($items as $item)
                                <tr>

                                    <td>
                                        {{ $items->firstItem() + $loop->index }}
                                    </td>

                                    <td class="kf-main-name">
                                        <strong>
                                            {{ $item->nama_barang }}
                                        </strong>
                                        <small>
                                            {{ $item->nama_lokasi }}
                                        </small>
                                        <div class="kf-uraian">
                                            {{ $item->urai ?: '—' }}
                                        </div>
                                    </td>

                                    <td>
                                        <span class="kf-badge">
                                            {{ $kategoriNama($item->kategori) }}
                                        </span>
                                    </td>

                                    <td>{{ $item->cakupan ?: '—' }}</td>

                                    <td>{{ $item->tahun ?: '—' }}</td>

                                    <td>
                                        {{ match ((string) $item->type) {
                                            'P' => 'Permanen',
                                            'SP' => 'Semi Permanen',
                                            'D' => 'Darurat',
                                            default => '—',
                                        } }}
                                    </td>

                                    <td>{{ $item->struktur ?: '—' }}</td>

                                    <td>{{ $item->materi ?: '—' }}</td>

                                    <td>
                                        {{ $item->letak ?: ($item->alamat_lokasi ?: $item->nama_lokasi) }}
                                    </td>

                                    <td>
                                        {{ $item->status_tanah ?: '—' }}
                                    </td>

                                    <td>
                                        {{ $item->asal ?: '—' }}
                                    </td>

                                    <td>
                                        {{ $item->status_aset ?: '—' }}
                                    </td>

                                    <td class="kf-money">
                                        {{ $rupiah($item->nilai) }}
                                    </td>

                                    <td class="kf-uraian">
                                        {{ $item->ket ?: 'Buka detail untuk lampiran' }}
                                    </td>

                                    <td class="kf-actions-cell">
                                        <div class="kf-row-actions" role="group" aria-label="Aksi Konstruksi">

                                            <button type="button" class="kf-action-btn kf-action-view"
                                                data-kf-action="view" data-kf-id="{{ $item->id }}"
                                                title="Lihat detail" aria-label="Lihat detail">
                                                <i data-lucide="eye"></i>
                                            </button>

                                            <button type="button" class="kf-action-btn kf-action-edit"
                                                data-kf-action="edit" data-kf-id="{{ $item->id }}" title="Edit data"
                                                aria-label="Edit data">
                                                <i data-lucide="pencil"></i>
                                            </button>

                                            <button type="button" class="kf-action-btn kf-action-delete"
                                                data-kf-action="delete" data-kf-id="{{ $item->id }}"
                                                data-kf-name="{{ $item->nama_barang }}" title="Hapus data"
                                                aria-label="Hapus data">
                                                <i data-lucide="trash-2"></i>
                                            </button>

                                        </div>
                                    </td>

                                </tr>

                            @empty

                                <tr>
                                    <td colspan="15" class="kf-empty">
                                        Belum ada data Konstruksi manual.
                                        Klik Tambah Konstruksi untuk membuat
                                        catatan pertama.
                                    </td>
                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>
            @else
                {{-- =================================================
                 ARSIP LAMA — READ ONLY
            ================================================== --}}

                <div class="kf-archive-notice">
                    <i data-lucide="lock-keyhole"></i>
                    Data berikut berasal dari tabel lama
                    <code>kib_f_s</code>.
                    Arsip hanya dapat dilihat, tidak dapat diedit
                    atau dihapus pada modul ini.
                </div>

                <div class="kf-table-wrap">

                    <table class="kf-table kf-archive-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Nama Konstruksi</th>
                                <th>Tahun</th>
                                <th>Lokasi</th>
                                <th>Bangunan</th>
                                <th>Nilai (Rp)</th>
                                <th>Uraian Pekerjaan</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>

                        <tbody>

                            @forelse ($items as $item)
                                <tr>
                                    <td>
                                        {{ $items->firstItem() + $loop->index }}
                                    </td>

                                    <td class="kf-main-name">
                                        <strong>
                                            {{ $item->nama_barang ?: '—' }}
                                        </strong>
                                    </td>

                                    <td>{{ $item->tahun ?: '—' }}</td>

                                    <td>
                                        {{ $item->nama_lokasi ?: '—' }}
                                        <small>
                                            {{ $item->alamat_lokasi ?: '' }}
                                        </small>
                                    </td>

                                    <td>{{ $item->type ?: '—' }}</td>

                                    <td class="kf-money">
                                        {{ $rupiah($item->nilai) }}
                                    </td>

                                    <td class="kf-uraian">
                                        {{ $item->urai ?: '—' }}
                                    </td>

                                    <td class="kf-uraian">
                                        {{ $item->ket ?: '—' }}
                                    </td>
                                </tr>

                            @empty

                                <tr>
                                    <td colspan="8" class="kf-empty">
                                        Belum ada arsip yang cocok.
                                    </td>
                                </tr>
                            @endforelse

                        </tbody>

                    </table>

                </div>

            @endif

            <div class="kf-pagination">
                {{ $items->links() }}
            </div>

        </section>


        {{-- =====================================================
         MODAL FORM CREATE / UPDATE
    ====================================================== --}}

        <dialog id="kfModalForm" class="kf-dialog" aria-labelledby="kfFormTitle">

            <form id="kfForm" enctype="multipart/form-data" novalidate>
                @csrf

                <header class="kf-dialog-head">

                    <div>
                        <small>FORM PENCATATAN MANUAL</small>
                        <h2 id="kfFormTitle">
                            Tambah Data Konstruksi
                        </h2>
                        <p>
                            Isi informasi sesuai dokumen pekerjaan.
                            Tidak diperlukan kode aktiva atau voucher Nilai Aset.
                        </p>
                    </div>

                    <button type="button" class="kf-x" data-kf-close="kfModalForm" aria-label="Tutup formulir">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <div class="kf-dialog-body">

                    <div id="kfError" class="kf-error" role="alert" hidden></div>


                    {{-- ============================================
                     BAGIAN 1 — IDENTITAS
                ============================================= --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>1</span>
                            Identitas dan Cakupan
                        </legend>

                        <div class="kf-fields">

                            <label class="kf-full">
                                Nama Barang / Jenis Pekerjaan <em>*</em>
                                <input name="nama_barang_manual" id="kfNama" maxlength="500" required
                                    placeholder="Contoh: Pengadaan dan Pemasangan Pipa Interkoneksi">
                            </label>

                            <label>
                                Kategori <em>*</em>
                                <input name="kategori" id="kfKategori" data-kf-combo="kategori" maxlength="20" required
                                    autocomplete="off" placeholder="Pilih atau cari kategori">
                                <small>
                                    Pilih IPA, Booster, atau Perpipaan.
                                </small>
                            </label>

                            <label>
                                Cakupan <em>*</em>
                                <input name="cakupan" id="kfCakupan" data-kf-combo="cakupan" maxlength="500" required
                                    autocomplete="off" placeholder="Pilih atau ketik cakupan">
                            </label>

                            <label>
                                Lokasi / Unit Kerja <em>*</em>
                                <input name="lokasi_manual" id="kfLokasi" data-kf-combo="lokasi" maxlength="500"
                                    required autocomplete="off" placeholder="Pilih lokasi dari Master Data">
                                <small>
                                    Alamat dapat terisi otomatis dari Master Lokasi.
                                </small>
                            </label>

                            <label>
                                Alamat Lokasi
                                <input name="alamat_manual" id="kfAlamat" maxlength="500"
                                    placeholder="Alamat lengkap lokasi pekerjaan">
                            </label>

                            <label>
                                Departemen
                                <input name="departemen_manual" id="kfDepartemen" data-kf-combo="departemen"
                                    maxlength="255" autocomplete="off" placeholder="Cari departemen">
                            </label>

                            <label>
                                Divisi
                                <input name="divisi_manual" id="kfDivisi" data-kf-combo="divisi" maxlength="255"
                                    autocomplete="off" placeholder="Cari divisi">
                                <small>
                                    Pilihan Divisi mengikuti Departemen.
                                </small>
                            </label>

                        </div>

                    </fieldset>


                    {{-- ============================================
                     BAGIAN 2 — SPESIFIKASI
                ============================================= --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>2</span>
                            Spesifikasi Konstruksi
                        </legend>

                        <div class="kf-fields">

                            <label>
                                Tahun Pekerjaan <em>*</em>
                                <input type="number" name="tahun" id="kfTahun" min="1900" max="2100"
                                    required placeholder="2026">
                            </label>

                            <label>
                                Bangunan (P, SP, D)
                                <input name="type" id="kfType" data-kf-combo="bangunan" maxlength="2"
                                    autocomplete="off" placeholder="Pilih jenis bangunan">
                            </label>

                            <label>
                                Bertingkat / Tidak
                                <input name="struktur" id="kfStruktur" data-kf-combo="struktur" maxlength="30"
                                    autocomplete="off" placeholder="Pilih atau cari">
                            </label>

                            <label>
                                Beton / Tidak
                                <input name="materi" id="kfMateri" data-kf-combo="material" maxlength="30"
                                    autocomplete="off" placeholder="Pilih atau cari">
                            </label>

                            <label>
                                Letak / Lokasi Alamat
                                <input name="letak" id="kfLetak" maxlength="500"
                                    placeholder="Contoh: Jl. Sultan Alimudin">
                            </label>

                            <label>
                                Status Tanah
                                <input name="status_tanah" id="kfStatusTanah" data-kf-combo="status_tanah"
                                    maxlength="255" autocomplete="off" placeholder="Pilih atau ketik status tanah">
                            </label>

                            <label>
                                Asal Usul Pembiayaan
                                <input name="asal" id="kfAsal" data-kf-combo="asal" maxlength="255"
                                    autocomplete="off" placeholder="Pilih atau ketik pembiayaan">
                            </label>

                            <label>
                                Status Aset
                                <input name="status_aset" id="kfStatusAset" data-kf-combo="status_aset" maxlength="255"
                                    autocomplete="off" placeholder="Pilih atau ketik status aset">
                            </label>

                            <label class="kf-full">
                                Nilai Konstruksi (Rp) <em>*</em>
                                <input type="number" name="nilai" id="kfNilai" min="0" step="0.01"
                                    required placeholder="11234500000">
                                <small>
                                    Nilai diisi manual dan tidak mengambil
                                    transaksi dari Nilai Aset.
                                </small>
                            </label>

                        </div>

                    </fieldset>


                    {{-- ============================================
                     BAGIAN 3 — URAIAN PEKERJAAN
                ============================================= --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>3</span>
                            Uraian Pekerjaan dan Berita Acara
                        </legend>

                        <div class="kf-fields">

                            <label class="kf-full">
                                Uraian Pekerjaan <em>*</em>
                                <textarea name="urai" id="kfUrai" rows="7" required
                                    placeholder="Contoh:
1. Pekerjaan persiapan dan pengukuran
2. Pengadaan dan pemasangan pipa distribusi
3. Pemasangan aksesori pipa
4. Pengujian dan serah terima pekerjaan"></textarea>
                                <small>
                                    Tulis setiap pekerjaan pada baris tersendiri.
                                    Baris baru tetap tampil pada detail dan tabel.
                                </small>
                            </label>

                            <label class="kf-full">
                                Keterangan / Dokumen Pendukung
                                <textarea name="ket" id="kfKet" rows="4"
                                    placeholder="Nomor berita acara, tanggal, kontraktor, nomor kontrak, dan keterangan lain."></textarea>
                            </label>

                        </div>

                    </fieldset>


                    {{-- ============================================
                     BAGIAN 4 — LAMPIRAN
                ============================================= --}}

                    <fieldset class="kf-fieldset">

                        <legend>
                            <span>4</span>
                            Lampiran Pendukung
                        </legend>

                        <div class="kf-fields">

                            <label>
                                Foto Utama Konstruksi
                                <input type="file" name="foto" id="kfFoto"
                                    accept="image/jpeg,image/png,image/webp">
                                <small>
                                    Opsional, maksimal 5 MB.
                                </small>
                            </label>

                            <label>
                                Dokumen Pendukung (Banyak File)
                                <input type="file" name="dokumens[]" id="kfDokumens" multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.webp">
                                <small>
                                    Bisa memilih dokumen berkali-kali.
                                    Jumlah dan ukuran mengikuti kapasitas server.
                                </small>
                            </label>

                            <div class="kf-full" id="kfSelectedFiles" aria-live="polite"></div>

                            <div class="kf-full" id="kfSavedFiles"></div>

                        </div>

                    </fieldset>

                </div>

                <footer class="kf-dialog-foot">

                    <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalForm">
                        Batal
                    </button>

                    <button type="submit" class="kf-btn kf-primary" id="kfSimpan">
                        <i data-lucide="save"></i>
                        Simpan Konstruksi
                    </button>

                </footer>

            </form>

        </dialog>


        {{-- =====================================================
         MODAL VIEW / DETAIL
    ====================================================== --}}

        <dialog id="kfModalDetail" class="kf-dialog" aria-labelledby="kfDetailTitle">

            <header class="kf-dialog-head">

                <div>
                    <small>DETAIL K.I.B F</small>
                    <h2 id="kfDetailTitle">Detail Konstruksi</h2>
                </div>

                <button type="button" class="kf-x" data-kf-close="kfModalDetail" aria-label="Tutup detail">
                    <i data-lucide="x"></i>
                </button>

            </header>

            <div id="kfDetailBody" class="kf-dialog-body"></div>

            <footer class="kf-dialog-foot">

                <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalDetail">
                    Tutup
                </button>

                <button type="button" class="kf-btn kf-outline" id="kfEdit">
                    <i data-lucide="pencil"></i>
                    Edit
                </button>

                <button type="button" class="kf-btn kf-danger" id="kfHapus">
                    <i data-lucide="trash-2"></i>
                    Hapus
                </button>

            </footer>

        </dialog>


        {{-- =====================================================
         MODAL KONFIRMASI DELETE
    ====================================================== --}}

        <dialog id="kfModalDelete" class="kf-dialog kf-confirm-dialog" aria-labelledby="kfDeleteTitle">

            <header class="kf-dialog-head">

                <div>
                    <small>KONFIRMASI PENGHAPUSAN</small>
                    <h2 id="kfDeleteTitle">
                        Hapus Data Konstruksi?
                    </h2>
                </div>

                <button type="button" class="kf-x" data-kf-close="kfModalDelete" aria-label="Tutup">
                    <i data-lucide="x"></i>
                </button>

            </header>

            <div class="kf-confirm-content">

                <span class="kf-confirm-icon">
                    <i data-lucide="triangle-alert"></i>
                </span>

                <p>
                    Data berikut beserta seluruh lampirannya
                    akan dihapus secara permanen:
                </p>

                <strong id="kfDeleteName"></strong>

                <small>
                    Penghapusan hanya berlaku untuk data manual.
                    Arsip konstruksi lama tetap aman.
                </small>

            </div>

            <footer class="kf-dialog-foot">

                <button type="button" class="kf-btn kf-outline" data-kf-close="kfModalDelete">
                    Batal
                </button>

                <button type="button" class="kf-btn kf-danger" id="kfDeleteConfirm">
                    <i data-lucide="trash-2"></i>
                    Ya, Hapus Data
                </button>

            </footer>

        </dialog>


        <div id="kfToast" class="kf-toast" role="status" hidden></div>

    </section>


    {{-- =========================================================
     DATA MASTER DARI KIBController
========================================================= --}}

    <script type="application/json" id="kfMasterOptions">
@json($kfMasterOptions ?? ['lokasi' => [], 'departemen' => [], 'divisi' => []])
</script>

    <script type="application/json" id="kfHistoryOptions">
@json($suggestions ?? [])
</script>


    {{-- =========================================================
     JAVASCRIPT UTAMA
========================================================= --}}

    <script
        src="{{ asset('js/pages/kib/konstruksi.js') }}?v={{ file_exists(public_path('js/pages/kib/konstruksi.js')) ? filemtime(public_path('js/pages/kib/konstruksi.js')) : '1' }}">
    </script>

@endsection
