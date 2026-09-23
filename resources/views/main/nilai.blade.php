@extends('layouts.main')

@section('title', 'Nilai Aset')

@section('page-title', 'Nilai Aset')

@section('page-description', 'Monitoring dan pengelolaan nilai aset perusahaan')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/nilai.css') }}">
@endpush



@section('content')

    <section class="content">


        {{-- ============================================================
         HEADER HALAMAN
    ============================================================= --}}
        <div class="module-header">

            <div>

                <span class="module-eyebrow">
                    Manajemen Aset
                </span>

                <h2>
                    Nilai Aset
                </h2>

                <p>
                    Kelola pencatatan nilai aset, voucher transaksi,
                    lokasi, kategori, dan riwayat perubahan nilai
                    aset perusahaan.
                </p>

            </div>


            <button type="button" class="btn-module-primary">

                <i data-lucide="plus"></i>

                <span>
                    Tambah Nilai Aset
                </span>

            </button>

        </div>



        {{-- ============================================================
         SUMMARY
    ============================================================= --}}
        <div class="summary-grid">


            {{-- TOTAL NILAI --}}
            <div class="summary-card">

                <div class="summary-icon blue">

                    <i data-lucide="wallet-cards"></i>

                </div>


                <div>

                    <span class="summary-label">
                        Total Nilai Aset
                    </span>

                    <strong>
                        Rp 928,7 M
                    </strong>

                    <small>
                        Seluruh nilai aset tercatat
                    </small>

                </div>

            </div>



            {{-- PENAMBAHAN --}}
            <div class="summary-card">

                <div class="summary-icon green">

                    <i data-lucide="trending-up"></i>

                </div>


                <div>

                    <span class="summary-label">
                        Penambahan Tahun Ini
                    </span>

                    <strong>
                        Rp 53,7 M
                    </strong>

                    <small class="text-success-custom">
                        +6,1% dari tahun sebelumnya
                    </small>

                </div>

            </div>



            {{-- TRANSAKSI --}}
            <div class="summary-card">

                <div class="summary-icon purple">

                    <i data-lucide="receipt-text"></i>

                </div>


                <div>

                    <span class="summary-label">
                        Total Transaksi
                    </span>

                    <strong>
                        1.284
                    </strong>

                    <small>
                        Voucher nilai aset
                    </small>

                </div>

            </div>



            {{-- TAHUN --}}
            <div class="summary-card">

                <div class="summary-icon orange">

                    <i data-lucide="calendar-days"></i>

                </div>


                <div>

                    <span class="summary-label">
                        Tahun Aktif
                    </span>

                    <strong>
                        2026
                    </strong>

                    <small>
                        Periode pembukuan aktif
                    </small>

                </div>

            </div>


        </div>



        {{-- ============================================================
         FILTER
    ============================================================= --}}
        <div class="module-card filter-card">


            <div class="filter-top">

                <div>

                    <h3>
                        Filter Data
                    </h3>

                    <p>
                        Cari dan tampilkan nilai aset berdasarkan
                        kriteria tertentu.
                    </p>

                </div>


                <button type="button" class="btn-filter-reset">

                    <i data-lucide="rotate-ccw"></i>

                    Reset

                </button>

            </div>



            <div class="filter-grid">


                {{-- SEARCH --}}
                <div class="filter-field filter-search">

                    <label>
                        Pencarian
                    </label>


                    <div class="input-with-icon">

                        <i data-lucide="search"></i>


                        <input type="text" class="form-control module-input"
                            placeholder="Cari voucher, aktiva, uraian...">

                    </div>

                </div>



                {{-- TAHUN --}}
                <div class="filter-field">

                    <label>
                        Tahun
                    </label>


                    <select class="form-select module-input">

                        <option>
                            Semua Tahun
                        </option>

                        <option selected>
                            2026
                        </option>

                        <option>
                            2025
                        </option>

                        <option>
                            2024
                        </option>

                    </select>

                </div>



                {{-- LOKASI --}}
                <div class="filter-field">

                    <label>
                        Lokasi
                    </label>


                    <select class="form-select module-input">

                        <option>
                            Semua Lokasi
                        </option>

                        <option>
                            Kantor Pusat
                        </option>

                        <option>
                            IPA Gunung Lipan
                        </option>

                        <option>
                            Gudang
                        </option>

                    </select>

                </div>



                {{-- KATEGORI --}}
                <div class="filter-field">

                    <label>
                        Kategori
                    </label>


                    <select class="form-select module-input">

                        <option>
                            Semua Kategori
                        </option>

                        <option>
                            Tanah
                        </option>

                        <option>
                            Peralatan & Mesin
                        </option>

                        <option>
                            Gedung & Bangunan
                        </option>

                        <option>
                            Jalan, Irigasi & Jaringan
                        </option>

                        <option>
                            Aset Tetap Lainnya
                        </option>

                        <option>
                            Konstruksi
                        </option>

                    </select>

                </div>


            </div>

        </div>



        {{-- ============================================================
         TABLE
    ============================================================= --}}
        <div class="module-card">


            <div class="module-card-header">

                <div>

                    <h3>
                        Daftar Nilai Aset
                    </h3>

                    <p>
                        Informasi transaksi dan nilai aset perusahaan.
                    </p>

                </div>



                <div class="header-actions">

                    <button type="button" class="btn-module-secondary">

                        <i data-lucide="download"></i>

                        Export

                    </button>

                </div>

            </div>



            <div class="table-responsive">

                <table class="modern-table">


                    <thead>

                        <tr>

                            <th>
                                No
                            </th>

                            <th>
                                Voucher
                            </th>

                            <th>
                                Tanggal
                            </th>

                            <th>
                                Aktiva
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Uraian
                            </th>

                            <th class="text-end">
                                Nilai
                            </th>

                            <th>
                                Status
                            </th>

                            <th class="text-center">
                                Aksi
                            </th>

                        </tr>

                    </thead>



                    <tbody>


                        {{-- DATA 1 --}}
                        <tr>

                            <td>
                                1
                            </td>


                            <td>

                                <div class="table-main-text">
                                    VC-2026-00125
                                </div>

                                <span class="table-sub-text">
                                    Tahun 2026
                                </span>

                            </td>


                            <td>
                                12 Sep 2026
                            </td>


                            <td>

                                <div class="asset-table-name">

                                    <div class="asset-table-icon">

                                        <i data-lucide="monitor"></i>

                                    </div>


                                    <div>

                                        <strong>
                                            Laptop Dell Latitude
                                        </strong>

                                        <span>
                                            02.03.01.001
                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>

                                <strong class="table-main-text">
                                    Kantor Pusat
                                </strong>

                                <span class="table-sub-text">
                                    Divisi IT
                                </span>

                            </td>


                            <td>
                                Pengadaan perangkat kerja
                            </td>


                            <td class="text-end">

                                <strong class="money-value">
                                    Rp 18.500.000
                                </strong>

                            </td>


                            <td>

                                <span class="status-pill active">
                                    Aktif
                                </span>

                            </td>


                            <td>

                                <div class="table-actions">

                                    <button type="button" class="action-button view" title="Detail">

                                        <i data-lucide="eye"></i>

                                    </button>


                                    <button type="button" class="action-button edit" title="Edit">

                                        <i data-lucide="square-pen"></i>

                                    </button>


                                    <button type="button" class="action-button delete" title="Hapus">

                                        <i data-lucide="trash-2"></i>

                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 2 --}}
                        <tr>

                            <td>
                                2
                            </td>


                            <td>

                                <div class="table-main-text">
                                    VC-2026-00124
                                </div>

                                <span class="table-sub-text">
                                    Tahun 2026
                                </span>

                            </td>


                            <td>
                                08 Sep 2026
                            </td>


                            <td>

                                <div class="asset-table-name">

                                    <div class="asset-table-icon">

                                        <i data-lucide="settings"></i>

                                    </div>


                                    <div>

                                        <strong>
                                            Pompa Distribusi
                                        </strong>

                                        <span>
                                            03.01.04.018
                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>

                                <strong class="table-main-text">
                                    IPA Gunung Lipan
                                </strong>

                                <span class="table-sub-text">
                                    Produksi
                                </span>

                            </td>


                            <td>
                                Penambahan aset operasional
                            </td>


                            <td class="text-end">

                                <strong class="money-value">
                                    Rp 186.500.000
                                </strong>

                            </td>


                            <td>

                                <span class="status-pill active">
                                    Aktif
                                </span>

                            </td>


                            <td>

                                <div class="table-actions">

                                    <button type="button" class="action-button view">
                                        <i data-lucide="eye"></i>
                                    </button>


                                    <button type="button" class="action-button edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>


                                    <button type="button" class="action-button delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>



                        {{-- DATA 3 --}}
                        <tr>

                            <td>
                                3
                            </td>


                            <td>

                                <div class="table-main-text">
                                    VC-2026-00123
                                </div>

                                <span class="table-sub-text">
                                    Tahun 2026
                                </span>

                            </td>


                            <td>
                                01 Sep 2026
                            </td>


                            <td>

                                <div class="asset-table-name">

                                    <div class="asset-table-icon">

                                        <i data-lucide="printer"></i>

                                    </div>


                                    <div>

                                        <strong>
                                            Printer Epson L5290
                                        </strong>

                                        <span>
                                            02.04.02.009
                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>

                                <strong class="table-main-text">
                                    Kantor Pusat
                                </strong>

                                <span class="table-sub-text">
                                    Administrasi
                                </span>

                            </td>


                            <td>
                                Pengadaan perlengkapan kantor
                            </td>


                            <td class="text-end">

                                <strong class="money-value">
                                    Rp 6.750.000
                                </strong>

                            </td>


                            <td>

                                <span class="status-pill active">
                                    Aktif
                                </span>

                            </td>


                            <td>

                                <div class="table-actions">

                                    <button type="button" class="action-button view">
                                        <i data-lucide="eye"></i>
                                    </button>


                                    <button type="button" class="action-button edit">
                                        <i data-lucide="square-pen"></i>
                                    </button>


                                    <button type="button" class="action-button delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>


                    </tbody>

                </table>

            </div>



            {{-- ========================================================
             TABLE FOOTER
        ========================================================= --}}
            <div class="table-footer">

                <span>
                    Menampilkan 1 - 3 dari 1.284 data
                </span>


                <div class="pagination-custom">

                    <button type="button" disabled>
                        <i data-lucide="chevron-left"></i>
                    </button>


                    <button type="button" class="active">
                        1
                    </button>


                    <button type="button">
                        2
                    </button>


                    <button type="button">
                        3
                    </button>


                    <button type="button">
                        <i data-lucide="chevron-right"></i>
                    </button>

                </div>

            </div>


        </div>


    </section>

@endsection
