@extends('layouts.main')

@section('title', 'Arsip')

@section('page-title', 'Arsip')

@section('page-description', 'Pengelolaan dokumen dan arsip aset perusahaan')


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/arsip.css') }}">
@endpush



@section('content')

    <section class="content">


        {{-- ============================================================
         HEADER
    ============================================================= --}}
        <div class="archive-header">

            <div>

                <span class="archive-eyebrow">
                    Document Management
                </span>

                <h2>
                    Arsip Aset
                </h2>

                <p>
                    Kelola penyimpanan dokumen aset berdasarkan
                    gedung, filling, rak, posisi penyimpanan,
                    kondisi dan masa retensi arsip.
                </p>

            </div>


            <button type="button" class="archive-primary-button">

                <i data-lucide="file-plus-2"></i>

                Tambah Arsip

            </button>

        </div>



        {{-- ============================================================
         SUMMARY
    ============================================================= --}}
        <div class="archive-summary-grid">


            {{-- TOTAL --}}
            <div class="archive-summary">

                <div class="archive-summary-icon blue">

                    <i data-lucide="files"></i>

                </div>


                <div>

                    <span>
                        Total Arsip
                    </span>

                    <strong>
                        4.825
                    </strong>

                    <small>
                        Dokumen tersimpan
                    </small>

                </div>

            </div>



            {{-- GEDUNG --}}
            <div class="archive-summary">

                <div class="archive-summary-icon purple">

                    <i data-lucide="building-2"></i>

                </div>


                <div>

                    <span>
                        Gedung
                    </span>

                    <strong>
                        12
                    </strong>

                    <small>
                        Lokasi penyimpanan
                    </small>

                </div>

            </div>



            {{-- FILLING --}}
            <div class="archive-summary">

                <div class="archive-summary-icon orange">

                    <i data-lucide="archive"></i>

                </div>


                <div>

                    <span>
                        Filling / Rak
                    </span>

                    <strong>
                        48 / 126
                    </strong>

                    <small>
                        Media penyimpanan
                    </small>

                </div>

            </div>



            {{-- RETENSI --}}
            <div class="archive-summary">

                <div class="archive-summary-icon red">

                    <i data-lucide="clock-alert"></i>

                </div>


                <div>

                    <span>
                        Retensi Mendekati Akhir
                    </span>

                    <strong>
                        18
                    </strong>

                    <small>
                        Memerlukan perhatian
                    </small>

                </div>

            </div>


        </div>



        {{-- ============================================================
         LOKASI PENYIMPANAN
    ============================================================= --}}
        <div class="archive-location-card">


            <div class="archive-location-title">

                <div>

                    <h3>
                        Lokasi Penyimpanan
                    </h3>

                    <p>
                        Navigasi struktur penyimpanan arsip fisik.
                    </p>

                </div>

            </div>



            <div class="storage-flow">


                {{-- GEDUNG --}}
                <div class="storage-step active">

                    <div class="storage-icon">

                        <i data-lucide="building-2"></i>

                    </div>


                    <div>

                        <span>
                            Gedung
                        </span>

                        <strong>
                            Kantor Pusat
                        </strong>

                    </div>

                </div>


                <i class="storage-arrow" data-lucide="chevron-right"></i>



                {{-- FILLING --}}
                <div class="storage-step">

                    <div class="storage-icon">

                        <i data-lucide="cabinet"></i>

                    </div>


                    <div>

                        <span>
                            Filling
                        </span>

                        <strong>
                            Filling A
                        </strong>

                    </div>

                </div>


                <i class="storage-arrow" data-lucide="chevron-right"></i>



                {{-- RAK --}}
                <div class="storage-step">

                    <div class="storage-icon">

                        <i data-lucide="archive"></i>

                    </div>


                    <div>

                        <span>
                            Rak
                        </span>

                        <strong>
                            Rak 03
                        </strong>

                    </div>

                </div>


                <i class="storage-arrow" data-lucide="chevron-right"></i>



                {{-- BARIS --}}
                <div class="storage-step">

                    <div class="storage-icon">

                        <i data-lucide="rows-3"></i>

                    </div>


                    <div>

                        <span>
                            Baris
                        </span>

                        <strong>
                            Baris 02
                        </strong>

                    </div>

                </div>


            </div>

        </div>



        {{-- ============================================================
         MAIN GRID
    ============================================================= --}}
        <div class="archive-main-grid">


            {{-- ========================================================
             LIST ARSIP
        ========================================================= --}}
            <div class="archive-card">


                <div class="archive-card-header">

                    <div>

                        <h3>
                            Daftar Dokumen Arsip
                        </h3>

                        <p>
                            Dokumen yang tersimpan pada sistem arsip.
                        </p>

                    </div>


                    <div class="archive-actions">

                        <button type="button" class="archive-secondary-button">

                            <i data-lucide="download"></i>

                            Export

                        </button>

                    </div>

                </div>



                {{-- TOOLBAR --}}
                <div class="archive-toolbar">


                    <div class="archive-search">

                        <i data-lucide="search"></i>


                        <input type="text" placeholder="Cari kode, judul, register...">

                    </div>



                    <select class="archive-select">

                        <option>
                            Semua Tahun
                        </option>

                        <option>
                            2026
                        </option>

                        <option>
                            2025
                        </option>

                        <option>
                            2024
                        </option>

                    </select>



                    <select class="archive-select">

                        <option>
                            Semua Kondisi
                        </option>

                        <option>
                            Baik
                        </option>

                        <option>
                            Perlu Perhatian
                        </option>

                    </select>


                </div>



                {{-- TABLE --}}
                <div class="table-responsive">

                    <table class="archive-table">


                        <thead>

                            <tr>

                                <th>
                                    Dokumen
                                </th>

                                <th>
                                    Register
                                </th>

                                <th>
                                    Penyimpanan
                                </th>

                                <th>
                                    Tahun
                                </th>

                                <th>
                                    Retensi
                                </th>

                                <th>
                                    Kondisi
                                </th>

                                <th>
                                    Aksi
                                </th>

                            </tr>

                        </thead>



                        <tbody>


                            {{-- DATA 1 --}}
                            <tr>

                                <td>

                                    <div class="document-cell">

                                        <div class="document-icon pdf">

                                            <i data-lucide="file-text"></i>

                                        </div>


                                        <div>

                                            <strong>
                                                Sertifikat Tanah IPA Gunung Lipan
                                            </strong>

                                            <span>
                                                ARS-TNH-2026-001
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                <td>
                                    REG-00125
                                </td>


                                <td>

                                    <strong class="storage-main">
                                        Filling A / Rak 03
                                    </strong>

                                    <span class="storage-sub">
                                        Baris 02
                                    </span>

                                </td>


                                <td>
                                    2026
                                </td>


                                <td>

                                    <span class="retention-badge safe">
                                        10 Tahun
                                    </span>

                                </td>


                                <td>

                                    <span class="condition-badge good">
                                        Baik
                                    </span>

                                </td>


                                <td>

                                    <button type="button" class="document-more">

                                        <i data-lucide="ellipsis"></i>

                                    </button>

                                </td>

                            </tr>



                            {{-- DATA 2 --}}
                            <tr>

                                <td>

                                    <div class="document-cell">

                                        <div class="document-icon blue">

                                            <i data-lucide="file-text"></i>

                                        </div>


                                        <div>

                                            <strong>
                                                BAST Pompa Distribusi
                                            </strong>

                                            <span>
                                                ARS-MSN-2026-014
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                <td>
                                    REG-00124
                                </td>


                                <td>

                                    <strong class="storage-main">
                                        Filling B / Rak 07
                                    </strong>

                                    <span class="storage-sub">
                                        Baris 01
                                    </span>

                                </td>


                                <td>
                                    2026
                                </td>


                                <td>

                                    <span class="retention-badge safe">
                                        5 Tahun
                                    </span>

                                </td>


                                <td>

                                    <span class="condition-badge good">
                                        Baik
                                    </span>

                                </td>


                                <td>

                                    <button type="button" class="document-more">

                                        <i data-lucide="ellipsis"></i>

                                    </button>

                                </td>

                            </tr>



                            {{-- DATA 3 --}}
                            <tr>

                                <td>

                                    <div class="document-cell">

                                        <div class="document-icon orange">

                                            <i data-lucide="file-text"></i>

                                        </div>


                                        <div>

                                            <strong>
                                                Dokumen Pengadaan Kendaraan
                                            </strong>

                                            <span>
                                                ARS-KDR-2018-021
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                <td>
                                    REG-00087
                                </td>


                                <td>

                                    <strong class="storage-main">
                                        Filling C / Rak 11
                                    </strong>

                                    <span class="storage-sub">
                                        Baris 04
                                    </span>

                                </td>


                                <td>
                                    2018
                                </td>


                                <td>

                                    <span class="retention-badge warning">
                                        6 Bulan
                                    </span>

                                </td>


                                <td>

                                    <span class="condition-badge warning">
                                        Perlu Perhatian
                                    </span>

                                </td>


                                <td>

                                    <button type="button" class="document-more">

                                        <i data-lucide="ellipsis"></i>

                                    </button>

                                </td>

                            </tr>


                        </tbody>

                    </table>

                </div>



                {{-- FOOTER TABLE --}}
                <div class="archive-table-footer">

                    <span>
                        Menampilkan 3 dari 4.825 arsip
                    </span>


                    <a href="#">

                        Lihat seluruh arsip

                        <i data-lucide="arrow-right"></i>

                    </a>

                </div>


            </div>



            {{-- ========================================================
             DETAIL
        ========================================================= --}}
            <div class="archive-card archive-detail">


                <div class="archive-card-header">

                    <div>

                        <h3>
                            Detail Arsip
                        </h3>

                        <p>
                            Informasi dokumen terpilih.
                        </p>

                    </div>


                    <button type="button" class="document-more">

                        <i data-lucide="ellipsis"></i>

                    </button>

                </div>



                <div class="archive-detail-body">


                    {{-- HEADER FILE --}}
                    <div class="detail-document-head">

                        <div class="detail-file-icon">

                            <i data-lucide="file-text"></i>

                        </div>


                        <div>

                            <span class="detail-code">
                                ARS-TNH-2026-001
                            </span>


                            <h4>
                                Sertifikat Tanah IPA Gunung Lipan
                            </h4>


                            <span class="condition-badge good">
                                Dokumen Baik
                            </span>

                        </div>

                    </div>



                    {{-- INFORMASI --}}
                    <div class="detail-section-title">
                        Informasi Dokumen
                    </div>


                    <div class="detail-list">


                        <div>

                            <span>
                                Nomor Register
                            </span>

                            <strong>
                                REG-00125
                            </strong>

                        </div>



                        <div>

                            <span>
                                Vendor / Sumber
                            </span>

                            <strong>
                                BPN Samarinda
                            </strong>

                        </div>



                        <div>

                            <span>
                                Tahun Dokumen
                            </span>

                            <strong>
                                2026
                            </strong>

                        </div>



                        <div>

                            <span>
                                Nilai Aset
                            </span>

                            <strong>
                                Rp 4.850.000.000
                            </strong>

                        </div>


                    </div>



                    {{-- LOKASI --}}
                    <div class="detail-section-title">
                        Lokasi Penyimpanan
                    </div>


                    <div class="detail-location">

                        <div>

                            <i data-lucide="building-2"></i>

                        </div>


                        <p>

                            <strong>
                                Kantor Pusat
                            </strong>

                            Filling A · Rak 03 · Baris 02

                        </p>

                    </div>



                    {{-- RETENSI --}}
                    <div class="detail-section-title">
                        Retensi
                    </div>


                    <div class="retention-box">


                        <div>

                            <span>
                                Masa Retensi
                            </span>

                            <strong>
                                10 Tahun
                            </strong>

                        </div>



                        <div>

                            <span>
                                Berakhir
                            </span>

                            <strong>
                                September 2036
                            </strong>

                        </div>


                    </div>



                    {{-- BUTTON --}}
                    <div class="detail-buttons">


                        <button type="button" class="detail-button primary">

                            <i data-lucide="eye"></i>

                            Lihat Dokumen

                        </button>



                        <button type="button" class="detail-button">

                            <i data-lucide="download"></i>

                            Download

                        </button>


                    </div>


                </div>

            </div>


        </div>


    </section>

@endsection
