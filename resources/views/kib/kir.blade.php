@extends('layouts.main')

@section('title', 'K.I.R')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/kir.css') }}">
@endpush

@section('content')

    <section class="content kir-page">

        {{-- =========================
        HERO SECTION
    ========================== --}}
        <section class="kir-hero">
            <div class="kir-hero-overlay"></div>

            <div class="kir-hero-inner">

                {{-- Breadcrumb --}}
                <nav class="kir-breadcrumb" aria-label="Breadcrumb">
                    <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                        <i data-lucide="house"></i>
                    </a>

                    <i data-lucide="chevron-right"></i>

                    <span>K.I.B</span>

                    <i data-lucide="chevron-right"></i>

                    <strong>K.I.R</strong>
                </nav>

                {{-- Heading --}}
                <div class="kir-heading">
                    <h1>K.I.R</h1>

                    <p>
                        Kelola data uji kelayakan kendaraan (KIR)
                        untuk aset kendaraan di Perumda Tirta Kencana Kota Samarinda.
                    </p>
                </div>

                {{-- KPI --}}
                <div class="kir-kpi-grid">

                    {{-- Total Kendaraan --}}
                    <article class="kir-kpi-card">
                        <div class="kir-kpi-icon is-blue">
                            <i data-lucide="car-front"></i>
                        </div>

                        <div>
                            <span>Total Kendaraan</span>

                            <div class="kir-kpi-inline">
                                <strong>42</strong>

                                <small>
                                    <i data-lucide="arrow-up"></i>
                                    +3
                                </small>
                            </div>

                            <p>dari tahun lalu</p>
                        </div>
                    </article>

                    {{-- KIR Aktif --}}
                    <article class="kir-kpi-card">
                        <div class="kir-kpi-icon is-green">
                            <i data-lucide="badge-check"></i>
                        </div>

                        <div>
                            <span>KIR Aktif</span>
                            <strong>35</strong>
                        </div>
                    </article>

                    {{-- Segera Habis --}}
                    <article class="kir-kpi-card">
                        <div class="kir-kpi-icon is-yellow">
                            <i data-lucide="badge-alert"></i>
                        </div>

                        <div>
                            <span>KIR Habis ≤ 1 Bulan</span>
                            <strong>5</strong>
                        </div>
                    </article>

                    {{-- Kedaluwarsa --}}
                    <article class="kir-kpi-card">
                        <div class="kir-kpi-icon is-red">
                            <i data-lucide="circle-x"></i>
                        </div>

                        <div>
                            <span>KIR Kedaluwarsa</span>
                            <strong>2</strong>
                        </div>
                    </article>

                </div>
            </div>
        </section>


        {{-- =========================
        DATA WORKSPACE
    ========================== --}}
        <section class="kir-card kir-workspace">

            {{-- Header --}}
            <div class="kir-titlebar">

                <h2>Daftar K.I.R</h2>

                <button type="button" class="kir-add-button" onclick="openKirModal('add')">
                    <i data-lucide="plus"></i>
                    Tambah Data K.I.R
                </button>

            </div>


            {{-- =========================
            FILTER
        ========================== --}}
            <div class="kir-filter-row">

                {{-- Search --}}
                <div class="kir-search">
                    <i data-lucide="search"></i>

                    <input id="kirSearch" type="search" placeholder="Cari nomor polisi, merk, tipe, atau lokasi...">
                </div>

                {{-- Jenis --}}
                <select id="kirJenis">
                    <option value="">Semua Jenis Kendaraan</option>
                    <option value="Mobil Penumpang">Mobil Penumpang</option>
                    <option value="Bus">Bus</option>
                    <option value="Truk">Truk</option>
                    <option value="Pick Up">Pick Up</option>
                </select>

                {{-- Status --}}
                <select id="kirStatus">
                    <option value="">Semua Status KIR</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Segera Habis">Segera Habis</option>
                    <option value="Kedaluwarsa">Kedaluwarsa</option>
                </select>

                {{-- Lokasi --}}
                <select id="kirLokasi">
                    <option value="">Semua Lokasi</option>
                    <option value="Kantor Pusat">Kantor Pusat</option>
                    <option value="IPA Gunung Lipan">IPA Gunung Lipan</option>
                    <option value="Gudang Material">Gudang Material</option>
                    <option value="Wilayah Kota">Wilayah Kota</option>
                    <option value="Reservoir Lempake">Reservoir Lempake</option>
                    <option value="Sungai Kapih">Sungai Kapih</option>
                    <option value="Loa Janan">Loa Janan</option>
                    <option value="IPA Sungai Kapih">IPA Sungai Kapih</option>
                </select>

                {{-- Masa Berlaku --}}
                <div class="kir-date-field">

                    <i data-lucide="calendar-days"></i>

                    <select id="kirMasa">
                        <option value="">Masa Berlaku</option>
                        <option value="2026">Berakhir 2026</option>
                        <option value="2027">Berakhir 2027</option>
                    </select>

                </div>

            </div>


            {{-- Filter Actions --}}
            <div class="kir-filter-actions">

                <button type="button" class="kir-secondary-button">
                    <i data-lucide="list-filter"></i>
                    Filter Lainnya
                </button>

                <div>

                    <button type="button" class="kir-secondary-button" onclick="resetKirFilter()">
                        <i data-lucide="refresh-cw"></i>
                        Reset
                    </button>

                    <button type="button" class="kir-secondary-button" onclick="exportKirCSV()">
                        <i data-lucide="download"></i>
                        Export
                        <i data-lucide="chevron-down"></i>
                    </button>

                </div>

            </div>


            {{-- =========================
            TABLE
        ========================== --}}
            <div class="table-responsive kir-table-scroll" tabindex="0">

                <table class="kir-table" id="kirTable">

                    <thead>

                        <tr>

                            <th>
                                <input type="checkbox" aria-label="Pilih semua">
                            </th>

                            <th>No</th>

                            <th>Nomor Polisi</th>

                            <th class="kir-thumb-col"></th>

                            <th>Nama Kendaraan</th>

                            <th>Merk / Tipe</th>

                            <th>Jenis</th>

                            <th>Tahun</th>

                            <th>Lokasi</th>

                            <th>Tanggal Uji</th>

                            <th>Berlaku s/d</th>

                            <th>Status</th>

                            <th>Aksi</th>

                        </tr>

                    </thead>


                    <tbody>

                        {{-- DATA 1 --}}
                        <tr data-record data-jenis="Mobil Penumpang" data-status="Aktif" data-lokasi="Kantor Pusat"
                            data-masa="2027">

                            <td>
                                <input type="checkbox">
                            </td>

                            <td>1</td>

                            <td>KT 1234 AB</td>

                            <td>
                                <span class="kir-thumb">
                                    <i data-lucide="car-front"></i>
                                </span>
                            </td>

                            <td>Toyota Avanza</td>

                            <td>Toyota Avanza 1.5 G</td>

                            <td>Mobil Penumpang</td>

                            <td>2022</td>

                            <td>Kantor Pusat</td>

                            <td>10 Jan 2026</td>

                            <td>10 Jan 2027</td>

                            <td>
                                <span class="kir-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">

                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>
                            </td>

                        </tr>


                        {{-- DATA 2 --}}
                        <tr data-record data-jenis="Bus" data-status="Aktif" data-lokasi="IPA Gunung Lipan"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>2</td>

                            <td>KT 5678 CD</td>

                            <td>
                                <span class="kir-thumb">
                                    <i data-lucide="bus-front"></i>
                                </span>
                            </td>

                            <td>Isuzu Elf</td>

                            <td>Isuzu NMR 71</td>

                            <td>Bus</td>

                            <td>2021</td>

                            <td>IPA Gunung Lipan</td>

                            <td>05 Mar 2026</td>

                            <td>05 Mar 2027</td>

                            <td>
                                <span class="kir-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 3 --}}
                        <tr data-record data-jenis="Truk" data-status="Segera Habis" data-lokasi="Gudang Material"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>3</td>

                            <td>KT 9012 EF</td>

                            <td>
                                <span class="kir-thumb is-truck">
                                    <i data-lucide="truck"></i>
                                </span>
                            </td>

                            <td>Hino Dutro</td>

                            <td>Hino Dutro 130 HD</td>

                            <td>Truk</td>

                            <td>2020</td>

                            <td>Gudang Material</td>

                            <td>20 Feb 2026</td>

                            <td>20 Feb 2027</td>

                            <td>
                                <span class="kir-status is-warning">
                                    Segera Habis
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 4 --}}
                        <tr data-record data-jenis="Pick Up" data-status="Kedaluwarsa" data-lokasi="Wilayah Kota"
                            data-masa="2026">

                            <td><input type="checkbox"></td>

                            <td>4</td>

                            <td>KT 3456 GH</td>

                            <td>
                                <span class="kir-thumb">
                                    <i data-lucide="car-front"></i>
                                </span>
                            </td>

                            <td>Mitsubishi L300</td>

                            <td>Mitsubishi L300</td>

                            <td>Pick Up</td>

                            <td>2023</td>

                            <td>Wilayah Kota</td>

                            <td>12 Sep 2025</td>

                            <td>12 Sep 2026</td>

                            <td>
                                <span class="kir-status is-expired">
                                    Kedaluwarsa
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 5 --}}
                        <tr data-record data-jenis="Pick Up" data-status="Aktif" data-lokasi="Reservoir Lempake"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>5</td>

                            <td>KT 7890 IJ</td>

                            <td>
                                <span class="kir-thumb">
                                    <i data-lucide="car-front"></i>
                                </span>
                            </td>

                            <td>Suzuki Carry</td>

                            <td>Suzuki Carry 1.5</td>

                            <td>Pick Up</td>

                            <td>2022</td>

                            <td>Reservoir Lempake</td>

                            <td>18 Jul 2026</td>

                            <td>18 Jul 2027</td>

                            <td>
                                <span class="kir-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 6 --}}
                        <tr data-record data-jenis="Pick Up" data-status="Aktif" data-lokasi="Sungai Kapih"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>6</td>

                            <td>KT 2468 KL</td>

                            <td>
                                <span class="kir-thumb">
                                    <i data-lucide="car-front"></i>
                                </span>
                            </td>

                            <td>Toyota Hilux</td>

                            <td>Toyota Hilux 2.4</td>

                            <td>Pick Up</td>

                            <td>2021</td>

                            <td>Sungai Kapih</td>

                            <td>01 Apr 2026</td>

                            <td>01 Apr 2027</td>

                            <td>
                                <span class="kir-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 7 --}}
                        <tr data-record data-jenis="Truk" data-status="Segera Habis" data-lokasi="Loa Janan"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>7</td>

                            <td>KT 1357 MN</td>

                            <td>
                                <span class="kir-thumb is-truck">
                                    <i data-lucide="truck"></i>
                                </span>
                            </td>

                            <td>Mitsubishi Fuso</td>

                            <td>Fuso FN 62</td>

                            <td>Truk</td>

                            <td>2020</td>

                            <td>Loa Janan</td>

                            <td>15 Mar 2026</td>

                            <td>15 Mar 2027</td>

                            <td>
                                <span class="kir-status is-warning">
                                    Segera Habis
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 8 --}}
                        <tr data-record data-jenis="Mobil Penumpang" data-status="Aktif" data-lokasi="Kantor Pusat"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>8</td>

                            <td>KT 8642 OP</td>

                            <td>
                                <span class="kir-thumb">
                                    <i data-lucide="car-front"></i>
                                </span>
                            </td>

                            <td>Honda CR-V</td>

                            <td>Honda CR-V 2.0</td>

                            <td>Mobil Penumpang</td>

                            <td>2023</td>

                            <td>Kantor Pusat</td>

                            <td>28 Jan 2026</td>

                            <td>28 Jan 2027</td>

                            <td>
                                <span class="kir-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 9 --}}
                        <tr data-record data-jenis="Mobil Penumpang" data-status="Aktif" data-lokasi="IPA Sungai Kapih"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>9</td>

                            <td>KT 9753 QR</td>

                            <td>
                                <span class="kir-thumb">
                                    <i data-lucide="car-front"></i>
                                </span>
                            </td>

                            <td>Suzuki APV</td>

                            <td>Suzuki APV</td>

                            <td>Mobil Penumpang</td>

                            <td>2021</td>

                            <td>IPA Sungai Kapih</td>

                            <td>10 Mei 2026</td>

                            <td>10 Mei 2027</td>

                            <td>
                                <span class="kir-status is-active">
                                    Aktif
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- DATA 10 --}}
                        <tr data-record data-jenis="Truk" data-status="Kedaluwarsa" data-lokasi="Gudang Material"
                            data-masa="2027">

                            <td><input type="checkbox"></td>

                            <td>10</td>

                            <td>KT 4681 ST</td>

                            <td>
                                <span class="kir-thumb is-truck">
                                    <i data-lucide="truck"></i>
                                </span>
                            </td>

                            <td>Isuzu Giga</td>

                            <td>Isuzu Giga FVZ</td>

                            <td>Truk</td>

                            <td>2019</td>

                            <td>Gudang Material</td>

                            <td>25 Feb 2026</td>

                            <td>25 Feb 2027</td>

                            <td>
                                <span class="kir-status is-expired">
                                    Kedaluwarsa
                                </span>
                            </td>

                            <td>
                                <div class="kir-actions">
                                    <button class="view" data-action="view">
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button class="edit" data-action="edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button class="delete" data-action="delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>

                        </tr>


                        {{-- Empty --}}
                        <tr id="kirEmptyRow" hidden>
                            <td colspan="13" class="kir-empty">
                                Tidak ada data K.I.R yang sesuai dengan filter.
                            </td>
                        </tr>

                    </tbody>

                </table>

            </div>


            {{-- =========================
            TABLE FOOTER
        ========================== --}}
            <div class="kir-table-footer">

                <div id="kirTableInfo">
                    Menampilkan 1 - 10 dari 42 data
                </div>

                <div class="kir-pagination-area">

                    <select id="kirPageSize">
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>

                    <span>data per halaman</span>

                    <nav class="kir-pagination" id="kirPagination"></nav>

                </div>

            </div>

        </section>


        {{-- =========================
        MODAL
    ========================== --}}
        <dialog class="kir-modal" id="kirModal">

            <div class="kir-modal-dialog">

                <header class="kir-modal-header">

                    <div>

                        <h3 id="kirModalTitle">
                            Tambah Data K.I.R
                        </h3>

                        <p id="kirModalDescription">
                            Tambahkan data uji KIR kendaraan.
                        </p>

                    </div>

                    <button type="button" onclick="closeKirModal()">
                        <i data-lucide="x"></i>
                    </button>

                </header>


                <form id="kirForm">

                    <div class="kir-modal-body">

                        <p class="kir-modal-note" id="kirModalNote">
                            Form UI contoh. Penyimpanan database belum dihubungkan.
                        </p>


                        <div class="kir-form-group">
                            <label for="kirPolisi">
                                Nomor Polisi
                            </label>

                            <input id="kirPolisi" required>
                        </div>


                        <div class="kir-form-group">
                            <label for="kirName">
                                Nama Kendaraan
                            </label>

                            <input id="kirName" required>
                        </div>


                        <div class="kir-form-group">
                            <label for="kirMerk">
                                Merk / Tipe
                            </label>

                            <input id="kirMerk">
                        </div>


                        <div class="kir-form-group">
                            <label for="kirFormJenis">
                                Jenis
                            </label>

                            <select id="kirFormJenis">
                                <option>Mobil Penumpang</option>
                                <option>Bus</option>
                                <option>Truk</option>
                                <option>Pick Up</option>
                            </select>
                        </div>


                        <div class="kir-form-group">
                            <label for="kirTahun">
                                Tahun
                            </label>

                            <input id="kirTahun" type="number">
                        </div>


                        <div class="kir-form-group">
                            <label for="kirFormLokasi">
                                Lokasi
                            </label>

                            <input id="kirFormLokasi">
                        </div>


                        <div class="kir-form-group">
                            <label for="kirTanggalUji">
                                Tanggal Uji
                            </label>

                            <input id="kirTanggalUji">
                        </div>


                        <div class="kir-form-group">
                            <label for="kirBerlaku">
                                Berlaku s/d
                            </label>

                            <input id="kirBerlaku">
                        </div>


                        <div class="kir-form-group">

                            <label for="kirFormStatus">
                                Status
                            </label>

                            <select id="kirFormStatus">
                                <option>Aktif</option>
                                <option>Segera Habis</option>
                                <option>Kedaluwarsa</option>
                            </select>

                        </div>

                    </div>


                    <footer class="kir-modal-footer">

                        <button type="button" class="kir-cancel-button" onclick="closeKirModal()">
                            Tutup
                        </button>

                        <button type="submit" class="kir-save-button" id="kirSaveButton" disabled>
                            Simpan Data K.I.R
                        </button>

                    </footer>

                </form>

            </div>

        </dialog>

    </section>

@endsection


@push('scripts')
    <script src="{{ asset('js/pages/kir.js') }}"></script>
@endpush
