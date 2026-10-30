@extends('layouts.main')

@section('title', 'K.I.B F - Konstruksi')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">
@endpush

@section('content')

    @php
        $rupiah = fn($v) => 'Rp ' . number_format((float) ($v ?? 0), 0, ',', '.');
    @endphp

    <section class="content kf" id="kfApp" data-base="{{ url('/kib/konstruksi') }}"
        data-save="{{ route('kib.konstruksi.store') }}" data-token="{{ csrf_token() }}">

        {{-- HEADER --}}

        <header class="kf-hero">

            <nav class="kf-crumb" aria-label="Breadcrumb">
                <a href="{{ route('dashboard') }}">
                    <i data-lucide="house"></i>
                </a>

                <i data-lucide="chevron-right"></i>
                <span>K.I.B</span>

                <i data-lucide="chevron-right"></i>
                <strong>Konstruksi</strong>
            </nav>

            <div class="kf-heading">
                <div>
                    <small>
                        KARTU INVENTARIS BARANG — KIB F
                    </small>

                    <h1>Konstruksi</h1>

                    <p>
                        Inventaris Konstruksi berdasarkan lokasi,
                        Departemen, Divisi dan transaksi Nilai Aset.
                    </p>
                </div>

                <button class="kf-btn primary" type="button" id="kfTambah">
                    <i data-lucide="plus"></i>
                    Tambah Konstruksi
                </button>
            </div>

            {{-- KPI DATABASE ASLI --}}

            <div class="kf-kpis">

                <article>
                    <i data-lucide="map-pin"></i>

                    <div>
                        <small>Lokasi</small>

                        <strong>
                            {{ number_format($statistik->lokasi ?? 0, 0, ',', '.') }}
                        </strong>
                    </div>
                </article>

                <article>
                    <i data-lucide="hard-hat"></i>

                    <div>
                        <small>Inventaris K.I.B F</small>

                        <strong>
                            {{ number_format($statistik->jumlah ?? 0, 0, ',', '.') }}
                        </strong>
                    </div>
                </article>

                <article>
                    <i data-lucide="wallet"></i>

                    <div>
                        <small>Total Nilai Aset</small>

                        <strong class="kf-money-small">
                            {{ $rupiah($statistik->nilai ?? 0) }}
                        </strong>
                    </div>
                </article>

                <article>
                    <i data-lucide="clock-3"></i>

                    <div>
                        <small>Update Terakhir</small>

                        <strong class="kf-date-small">
                            @if ($statistik->terakhir)
                                {{ \Carbon\Carbon::parse($statistik->terakhir)->locale('id')->diffForHumans() }}
                            @else
                                Belum ada
                            @endif
                        </strong>
                    </div>
                </article>

            </div>
        </header>

        {{-- DATA PENDING GLOBAL --}}
        {{-- Sama dengan sistem notifikasi KIB lainnya --}}

        <x-kib.pending-card module="konstruksi" title="Data Konstruksi Menunggu Diproses" />

        {{-- FILTER --}}

        <section class="kf-card">

            <div class="kf-card-head">
                <div>
                    <h2>Filter Data Konstruksi</h2>

                    <p>Cari nama lokasi atau alamat.</p>
                </div>
            </div>

            <div class="kf-toolbar">

                <label class="kf-search">
                    <i data-lucide="search"></i>

                    <input type="search" id="kfCari" placeholder="Cari lokasi atau alamat..." autocomplete="off">
                </label>

                <select id="kfLimit" aria-label="Jumlah baris">
                    <option>10</option>
                    <option selected>20</option>
                    <option>50</option>
                    <option>100</option>
                </select>

                <button class="kf-btn outline" id="kfReset" type="button">
                    <i data-lucide="refresh-cw"></i>
                    Reset
                </button>

            </div>
        </section>

        {{-- DAFTAR LOKASI KONSTRUKSI --}}

        <section class="kf-card">

            <div class="kf-card-head">

                <div>
                    <h2>Daftar Lokasi Konstruksi</h2>

                    <p>
                        Pilih Detail untuk melihat Departemen,
                        Divisi dan inventaris.
                    </p>
                </div>

                <span class="kf-pill">
                    <i data-lucide="database"></i>
                    PostgreSQL
                </span>
            </div>

            <div class="kf-table-wrap">

                <table class="kf-table" id="kfTabelLokasi">

                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Lokasi</th>
                            <th>Alamat</th>
                            <th>Inventaris</th>
                            <th>Nilai</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody>

                        @forelse ($lokasis as $i => $lok)
                            <tr data-kf-row
                                data-search="{{ mb_strtolower(($lok->lokasi ?? '') . ' ' . ($lok->alamat ?? '')) }}">

                                <td>{{ $i + 1 }}</td>

                                <td>
                                    <strong>
                                        {{ $lok->lokasi }}
                                    </strong>
                                </td>

                                <td>{{ $lok->alamat }}</td>

                                <td>
                                    {{ number_format($lok->jumlah, 0, ',', '.') }}
                                    data
                                </td>

                                <td class="kf-value">
                                    {{ $rupiah($lok->nilai) }}
                                </td>

                                <td>
                                    <button class="kf-icon-btn" type="button" data-kf-lokasi="{{ $lok->id_lokasi ?? 0 }}"
                                        data-kf-nama="{{ $lok->lokasi }}" title="Detail">
                                        <i data-lucide="eye"></i>
                                    </button>
                                </td>
                            </tr>

                        @empty

                            <tr>
                                <td colspan="6" class="kf-empty">
                                    Belum ada inventaris Konstruksi.
                                    Pilih Data Pending untuk menambah.
                                </td>
                            </tr>
                        @endforelse

                    </tbody>
                </table>
            </div>

            <footer class="kf-table-footer">

                <span id="kfInfo">
                    {{ $lokasis->count() }} lokasi
                </span>

                <div id="kfPages" class="kf-pages"></div>

            </footer>

        </section>

    </section>


    {{-- =====================================================
     MODAL DETAIL LOKASI
     Lokasi → Departemen → Divisi → Inventaris
===================================================== --}}

    <dialog class="kf-dialog wide" id="kfModalLokasi" aria-labelledby="kfJudulLokasi">

        <header class="kf-dialog-head">

            <div>
                <small>STRUKTUR ORGANISASI K.I.B F</small>
                <h2 id="kfJudulLokasi">Detail Lokasi</h2>
            </div>

            <button class="kf-close" type="button" data-kf-close="kfModalLokasi" aria-label="Tutup">
                <i data-lucide="x"></i>
            </button>

        </header>

        <div class="kf-dialog-content kf-lokasi-grid">

            {{-- PANEL KIRI --}}

            <aside class="kf-tree-panel">

                <h3>
                    <i data-lucide="network"></i>
                    Struktur Organisasi
                </h3>

                <p>
                    Pilih Departemen, kemudian Divisi.
                </p>

                <div id="kfDepartemenTree"></div>

                <div id="kfDivisiTree"></div>

            </aside>

            {{-- PANEL KANAN --}}

            <section class="kf-aset-panel">

                <h3 id="kfJudulUnit">
                    Daftar Inventaris
                </h3>

                <div class="kf-table-wrap">

                    <table class="kf-table">

                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Barang</th>
                                <th>Uraian</th>
                                <th>Tahun</th>
                                <th>Nilai</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody id="kfTabelInventaris"></tbody>

                    </table>

                </div>

            </section>

        </div>

        <footer class="kf-dialog-foot">

            <button class="kf-btn outline" type="button" data-kf-close="kfModalLokasi">
                Tutup
            </button>

        </footer>
    </dialog>


    {{-- =====================================================
     MODAL DETAIL SATU INVENTARIS
===================================================== --}}

    <dialog class="kf-dialog" id="kfModalDetail" aria-labelledby="kfJudulDetail">

        <header class="kf-dialog-head">

            <div>
                <small>DETAIL KARTU INVENTARIS BARANG F</small>

                <h2 id="kfJudulDetail">
                    Detail Konstruksi
                </h2>
            </div>

            <button class="kf-close" type="button" data-kf-close="kfModalDetail" aria-label="Tutup">
                <i data-lucide="x"></i>
            </button>

        </header>

        <div class="kf-dialog-content" id="kfIsiDetail"></div>

        <footer class="kf-dialog-foot">

            <button class="kf-btn outline" type="button" data-kf-close="kfModalDetail">
                Tutup
            </button>

            <button class="kf-btn warning" type="button" id="kfEdit">
                <i data-lucide="pencil"></i>
                Edit
            </button>

            <button class="kf-btn danger" type="button" id="kfHapus">
                <i data-lucide="trash-2"></i>
                Hapus
            </button>

        </footer>
    </dialog>


    {{-- =====================================================
     MODAL TAMBAH DAN EDIT KONSTRUKSI
===================================================== --}}

    <dialog class="kf-dialog" id="kfModalForm" aria-labelledby="kfJudulForm">

        <header class="kf-dialog-head">

            <div>
                <small>INPUT K.I.B F</small>

                <h2 id="kfJudulForm">
                    Tambah Konstruksi
                </h2>
            </div>

            <button class="kf-close" type="button" data-kf-close="kfModalForm" aria-label="Tutup">
                <i data-lucide="x"></i>
            </button>

        </header>

        <form id="kfForm" enctype="multipart/form-data">

            <input type="hidden" name="id_nilai_aktiva" id="kfSourceId">

            <div class="kf-dialog-content">

                <p id="kfError" class="kf-error" role="alert" hidden></p>

                {{-- BAGIAN 1 --}}

                <h3 class="kf-form-title">
                    1. Data Pending dan Struktur Organisasi
                </h3>

                <div class="kf-source">

                    <div>
                        <strong id="kfVoucher">
                            Belum memilih voucher
                        </strong>

                        <p id="kfVoucherUrai">
                            Pilih Pending agar data organisasi
                            terisi otomatis.
                        </p>
                    </div>

                    <button class="kf-btn outline" type="button" id="kfPilihUlang">
                        Pilih Pending
                    </button>

                </div>

                <div class="kf-fields three">

                    <label>
                        Lokasi
                        <input id="kfLokasi" readonly>
                    </label>

                    <label>
                        Departemen
                        <input id="kfDepartemen" readonly>
                    </label>

                    <label>
                        Divisi
                        <input id="kfDivisi" readonly>
                    </label>

                </div>

                {{-- BAGIAN 2 --}}

                <h3 class="kf-form-title">
                    2. Identitas Inventaris (sesuai Excel K.I.B F)
                </h3>

                <div class="kf-fields two">

                    <label>
                        Nama Barang / Jenis Barang <b>*</b>

                        <select name="id_barang" id="kfBarang" required>
                            <option value="">
                                Pilih Barang Master
                            </option>

                            @foreach ($barangs as $b)
                                <option value="{{ $b->id }}">
                                    {{ trim((string) $b->kode_barang) }}
                                    —
                                    {{ trim((string) $b->nama_barang) }}
                                </option>
                            @endforeach
                        </select>
                    </label>

                    <label>
                        Tahun <b>*</b>

                        <input name="tahun" id="kfTahun" type="number" min="1900" max="2100" required>
                    </label>

                    <label>
                        Bangunan (P, SP, D)

                        <select name="type" id="kfType">
                            <option value="">Pilih</option>
                            <option value="P">Permanen (P)</option>
                            <option value="SP">Semi Permanen (SP)</option>
                            <option value="D">Darurat (D)</option>
                        </select>
                    </label>

                    <label>
                        Bertingkat / Tidak

                        <select name="struktur" id="kfStruktur">
                            <option value="">Pilih</option>
                            <option value="BERTINGKAT">Bertingkat</option>
                            <option value="TIDAK BERTINGKAT">
                                Tidak Bertingkat
                            </option>
                        </select>
                    </label>

                    <label>
                        Beton / Tidak

                        <select name="materi" id="kfMateri">
                            <option value="">Pilih</option>
                            <option value="BETON">Beton</option>
                            <option value="TIDAK BETON">
                                Tidak Beton
                            </option>
                        </select>
                    </label>

                    <label>
                        Luas (m²)

                        <input name="luas" id="kfLuas" type="number" min="0" step="0.01">
                    </label>

                    <label>
                        Letak / Alamat

                        <input name="letak" id="kfLetak" maxlength="255">
                    </label>

                    <label>
                        Status Tanah

                        <input name="status_tanah" id="kfStatusTanah" maxlength="255">
                    </label>

                    <label>
                        Asal Usul Pembiayaan

                        <input name="asal" id="kfAsal" maxlength="255">
                    </label>

                    <label>
                        Status Aset

                        <input name="status_aset" id="kfStatusAset" maxlength="255">
                    </label>

                    <label class="full">
                        Uraian Pekerjaan <b>*</b>

                        <textarea name="urai" id="kfUrai" rows="3" required></textarea>
                    </label>

                    <label>
                        Nilai Aset (voucher)

                        <input id="kfNilai" readonly>

                        <small>
                            Nilai mengikuti transaksi Nilai Aset.
                        </small>
                    </label>

                    <label class="full">
                        Keterangan / Nomor Dokumen /
                        Kontraktor / Kontrak

                        <textarea name="ket" id="kfKet" rows="4"
                            placeholder="Tuliskan nomor, tanggal dokumen, kontraktor, nomor dan tanggal kontrak, serta keterangan lainnya."></textarea>
                    </label>

                </div>

                {{-- BAGIAN 3 --}}

                <h3 class="kf-form-title">
                    3. Berkas Pendukung
                </h3>

                <div class="kf-fields two">

                    <label>
                        Foto Konstruksi (maks. 5 MB)

                        <input type="file" name="foto" id="kfFoto" accept="image/jpeg,image/png,image/webp">
                    </label>

                    <label>
                        Dokumen PDF (maks. 10 MB)

                        <input type="file" name="dokumen" id="kfDokumen" accept="application/pdf">
                    </label>

                </div>

                <p class="kf-hint">
                    Saat Edit, kosongkan berkas bila tidak ingin
                    menggantinya. Nilai, Lokasi, Departemen
                    dan Divisi tidak berubah pada Edit.
                </p>

            </div>

            <footer class="kf-dialog-foot">

                <button class="kf-btn outline" type="button" data-kf-close="kfModalForm">
                    Batal
                </button>

                <button class="kf-btn primary" type="submit" id="kfSimpan">
                    <i data-lucide="save"></i>
                    Simpan Inventaris
                </button>

            </footer>

        </form>
    </dialog>

@endsection

@push('scripts')
    <script
        src="{{ asset('js/pages/kib/konstruksi.js') }}?v={{ file_exists(public_path('js/pages/kib/konstruksi.js')) ? filemtime(public_path('js/pages/kib/konstruksi.js')) : '1' }}">
    </script>
@endpush
