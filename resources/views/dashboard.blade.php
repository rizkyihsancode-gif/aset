<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Dashboard | Sistem Aset</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f7fb;
            color: #1f2937;
        }

        .app {
            display: flex;
            min-height: 100vh;
        }

        /* =========================================================
           SIDEBAR
        ========================================================= */

        .sidebar {
            width: 260px;
            background: #ffffff;
            border-right: 1px solid #e5e7eb;

            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;

            display: flex;
            flex-direction: column;

            z-index: 1000;
        }

        /* BRAND */

        .sidebar-brand {
            height: 75px;

            display: flex;
            align-items: center;

            padding: 0 24px;

            border-bottom: 1px solid #f1f5f9;
        }

        .logo {
            width: 42px;
            height: 42px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 12px;

            background: #0066cc;
            color: #ffffff;

            margin-right: 12px;
        }

        .logo svg {
            width: 22px;
            height: 22px;
            stroke-width: 1.8;
        }

        .brand-title {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
        }

        .brand-subtitle {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
        }


        /* =========================================================
           SIDEBAR MENU
        ========================================================= */

        .sidebar-menu {
            flex: 1;

            padding: 20px 15px;

            overflow-y: auto;
            overflow-x: hidden;
        }

        .sidebar-menu::-webkit-scrollbar {
            width: 5px;
        }

        .sidebar-menu::-webkit-scrollbar-thumb {
            background: #dbe3ec;
            border-radius: 10px;
        }

        .menu-label {
            padding: 16px 12px 8px;

            font-size: 12px;
            font-weight: 800;

            color: #111827;

            text-transform: uppercase;

            letter-spacing: 1px;
        }


        /* MENU ITEM */

        .menu-item {
            display: flex;
            align-items: center;

            gap: 12px;

            width: 100%;

            padding: 12px 14px;
            margin-bottom: 5px;

            border-radius: 10px;

            text-decoration: none;

            color: #64748b;

            font-size: 14px;
            font-weight: 500;

            transition:
                background .2s ease,
                color .2s ease,
                transform .2s ease;
        }

        .menu-item:hover {
            background: #f3f7fc;
            color: #0066cc;
        }

        .menu-item.active {
            background: #eaf3ff;
            color: #0066cc;
            font-weight: 600;
        }


        /* MENU ICON */

        .menu-icon {
            width: 22px;
            min-width: 22px;

            height: 22px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #64748b;

            transition: .2s ease;
        }

        .menu-icon svg {
            width: 18px;
            height: 18px;

            stroke-width: 1.8;
        }

        .menu-item:hover .menu-icon {
            color: #0066cc;
        }

        .menu-item.active .menu-icon {
            color: #0066cc;
        }


        /* MENU TEXT */

        .menu-text {
            flex: 1;
            line-height: 1.3;
        }


        /* =========================================================
           SIDEBAR FOOTER
        ========================================================= */

        .sidebar-footer {
            padding: 15px;

            border-top: 1px solid #f1f5f9;

            background: #ffffff;
        }

        .logout-item:hover {
            background: #fff1f2;
            color: #dc2626;
        }

        .logout-item:hover .menu-icon {
            color: #dc2626;
        }


        /* =========================================================
           MAIN
        ========================================================= */

        .main {
            margin-left: 260px;

            width: calc(100% - 260px);

            min-height: 100vh;
        }


        /* =========================================================
           TOPBAR
        ========================================================= */

        .topbar {
            height: 75px;

            background: #ffffff;

            border-bottom: 1px solid #e5e7eb;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 30px;

            position: sticky;
            top: 0;

            z-index: 500;
        }

        .topbar-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .page-title h2 {
            font-size: 20px;
            color: #111827;
            margin-bottom: 3px;
        }

        .page-title p {
            font-size: 12px;
            color: #94a3b8;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }


        /* NOTIFICATION */

        .notification {
            width: 40px;
            height: 40px;

            border-radius: 10px;

            background: #f5f7fa;

            color: #64748b;

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            position: relative;

            transition: .2s;
        }

        .notification:hover {
            color: #0066cc;
            background: #eaf3ff;
        }

        .notification svg {
            width: 19px;
            height: 19px;
        }

        .notification-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #ef4444;

            border: 2px solid white;

            position: absolute;

            top: 8px;
            right: 8px;
        }


        /* USER */

        .user-profile {
            display: flex;
            align-items: center;

            gap: 10px;

            border-left: 1px solid #e5e7eb;

            padding-left: 15px;
        }

        .avatar {
            width: 40px;
            height: 40px;

            border-radius: 50%;

            background: #0066cc;

            color: white;

            display: flex;
            align-items: center;
            justify-content: center;

            font-weight: 700;
        }

        .user-info strong {
            display: block;

            font-size: 13px;

            color: #111827;
        }

        .user-info span {
            display: block;

            font-size: 11px;

            color: #94a3b8;

            margin-top: 2px;
        }


        /* MOBILE BUTTON */

        .mobile-menu {
            display: none;

            width: 38px;
            height: 38px;

            border: none;

            background: #f5f7fa;

            color: #64748b;

            border-radius: 9px;

            cursor: pointer;

            align-items: center;
            justify-content: center;
        }

        .mobile-menu svg {
            width: 20px;
            height: 20px;
        }


        /* =========================================================
           CONTENT
        ========================================================= */

        .content {
            padding: 30px;
        }


        /* =========================================================
           WELCOME
        ========================================================= */

        .welcome {
            background:
                linear-gradient(135deg,
                    #0066cc,
                    #004b99);

            color: white;

            border-radius: 16px;

            padding: 28px 30px;

            margin-bottom: 25px;

            position: relative;

            overflow: hidden;
        }

        .welcome::before {
            content: "";

            position: absolute;

            width: 170px;
            height: 170px;

            border-radius: 50%;

            background: rgba(255, 255, 255, .05);

            right: 100px;
            bottom: -100px;
        }

        .welcome::after {
            content: "";

            position: absolute;

            width: 250px;
            height: 250px;

            border-radius: 50%;

            background: rgba(255, 255, 255, .08);

            right: -70px;
            top: -100px;
        }

        .welcome h1 {
            font-size: 24px;
            margin-bottom: 8px;

            position: relative;
            z-index: 2;
        }

        .welcome p {
            opacity: .85;

            font-size: 14px;

            position: relative;
            z-index: 2;
        }


        /* =========================================================
           STATISTIC CARDS
        ========================================================= */

        .cards {
            display: grid;

            grid-template-columns:
                repeat(4, 1fr);

            gap: 20px;

            margin-bottom: 25px;
        }

        .card {
            background: #ffffff;

            border-radius: 14px;

            padding: 22px;

            border: 1px solid #edf0f5;
        }

        .card-top {
            display: flex;

            align-items: center;

            justify-content: space-between;

            margin-bottom: 15px;
        }

        .card-icon {
            width: 45px;
            height: 45px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;
        }

        .card-icon svg {
            width: 21px;
            height: 21px;
        }

        .blue {
            color: #0066cc;
            background: #eaf3ff;
        }

        .green {
            color: #16a34a;
            background: #eaf8ef;
        }

        .orange {
            color: #f59e0b;
            background: #fff5df;
        }

        .red {
            color: #dc2626;
            background: #feecec;
        }

        .card-title {
            font-size: 13px;

            color: #64748b;
        }

        .card-number {
            font-size: 28px;

            font-weight: 700;

            margin-top: 5px;

            color: #111827;
        }

        .card-footer {
            margin-top: 12px;

            font-size: 11px;

            color: #94a3b8;
        }


        /* =========================================================
           GRID
        ========================================================= */

        .dashboard-grid {
            display: grid;

            grid-template-columns: 2fr 1fr;

            gap: 20px;
        }

        .panel {
            background: white;

            border-radius: 14px;

            border: 1px solid #edf0f5;

            overflow: hidden;
        }

        .panel-header {
            padding: 20px 22px;

            border-bottom: 1px solid #edf0f5;

            display: flex;

            align-items: center;

            justify-content: space-between;
        }

        .panel-header h3 {
            font-size: 15px;

            color: #111827;
        }

        .panel-header a {
            text-decoration: none;

            color: #0066cc;

            font-size: 12px;
        }


        /* =========================================================
           TABLE
        ========================================================= */

        table {
            width: 100%;

            border-collapse: collapse;
        }

        th {
            text-align: left;

            padding: 13px 20px;

            background: #fafbfc;

            font-size: 11px;

            text-transform: uppercase;

            color: #94a3b8;
        }

        td {
            padding: 15px 20px;

            border-top: 1px solid #f1f1f1;

            font-size: 13px;

            color: #475569;
        }

        .asset-name {
            font-weight: 600;

            color: #1f2937;
        }

        .asset-code {
            font-size: 11px;

            color: #94a3b8;

            margin-top: 3px;
        }


        /* BADGE */

        .badge {
            display: inline-block;

            padding: 5px 9px;

            border-radius: 20px;

            font-size: 10px;

            font-weight: 600;
        }

        .badge-good {
            background: #eaf8ef;

            color: #16a34a;
        }

        .badge-maintenance {
            background: #fff5df;

            color: #d97706;
        }

        .badge-broken {
            background: #feecec;

            color: #dc2626;
        }


        /* =========================================================
           ACTIVITIES
        ========================================================= */

        .activities {
            padding: 20px;
        }

        .activity {
            display: flex;

            gap: 14px;

            margin-bottom: 22px;
        }

        .activity:last-child {
            margin-bottom: 0;
        }

        .activity-icon {
            width: 34px;
            height: 34px;

            min-width: 34px;

            border-radius: 9px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #eaf3ff;

            color: #0066cc;
        }

        .activity-icon svg {
            width: 16px;
            height: 16px;
        }

        .activity-title {
            font-size: 13px;

            font-weight: 600;

            color: #1f2937;

            margin-bottom: 4px;
        }

        .activity-desc {
            font-size: 11px;

            line-height: 1.5;

            color: #64748b;
        }

        .activity-time {
            font-size: 10px;

            color: #94a3b8;

            margin-top: 5px;
        }


        /* =========================================================
           RESPONSIVE
        ========================================================= */

        @media (max-width: 1100px) {

            .cards {
                grid-template-columns:
                    repeat(2, 1fr);
            }

        }


        @media (max-width: 850px) {

            .sidebar {
                transform: translateX(-100%);

                transition: transform .3s ease;

                box-shadow: 10px 0 30px rgba(0, 0, 0, .08);
            }

            .sidebar.show {
                transform: translateX(0);
            }

            .main {
                margin-left: 0;

                width: 100%;
            }

            .mobile-menu {
                display: flex;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
            }

        }


        @media (max-width: 600px) {

            .cards {
                grid-template-columns: 1fr;
            }

            .content {
                padding: 20px;
            }

            .topbar {
                padding: 0 20px;
            }

            .user-info {
                display: none;
            }

            .welcome h1 {
                font-size: 20px;
            }

            .table-wrapper {
                overflow-x: auto;
            }

        }
    </style>

</head>


<body>

    <div class="app">


        {{-- =========================================================
         SIDEBAR
    ========================================================== --}}

        <aside class="sidebar" id="sidebar">


            {{-- BRAND --}}

            <div class="sidebar-brand">

                <div class="logo">
                    <i data-lucide="boxes"></i>
                </div>

                <div>

                    <div class="brand-title">
                        Sistem Aset
                    </div>

                    <div class="brand-subtitle">
                        Tirta Kencana
                    </div>

                </div>

            </div>



            {{-- =====================================================
             MENU
        ====================================================== --}}

            <div class="sidebar-menu">

                {{-- =====================
     MASTER DATA
====================== --}}

                <div class="menu-label">
                    Master Data
                </div>


                {{-- BARANG --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="package"></i>
                    </span>

                    <span class="menu-text">
                        Barang
                    </span>

                </a>


                {{-- DEPARTEMEN --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="building"></i>
                    </span>

                    <span class="menu-text">
                        Departemen
                    </span>

                </a>


                {{-- DIVISI --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="git-branch"></i>
                    </span>

                    <span class="menu-text">
                        Divisi
                    </span>

                </a>


                {{-- RUANGAN --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="door-open"></i>
                    </span>

                    <span class="menu-text">
                        Ruangan
                    </span>

                </a>


                {{-- SDM PENDUKUNG --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="users"></i>
                    </span>

                    <span class="menu-text">
                        SDM Pendukung
                    </span>

                </a>


                {{-- LOKASI --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <span class="menu-text">
                        Lokasi
                    </span>

                </a>


                {{-- BAHAN --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="layers-3"></i>
                    </span>

                    <span class="menu-text">
                        Bahan
                    </span>

                </a>


                {{-- KODE AKTIVA --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="barcode"></i>
                    </span>

                    <span class="menu-text">
                        Kode Aktiva
                    </span>

                </a>


                {{-- =====================
                 K.I.B
            ====================== --}}

                <div class="menu-label">
                    K.I.B
                </div>


                {{-- TANAH --}}

                <a href="#" class="menu-item active">

                    <span class="menu-icon">
                        <i data-lucide="map"></i>
                    </span>

                    <span class="menu-text">
                        Tanah
                    </span>

                </a>



                {{-- PERALATAN DAN MESIN --}}

                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="settings"></i>
                    </span>

                    <span class="menu-text">
                        Peralatan Dan Mesin
                    </span>

                </a>



                {{-- GEDUNG DAN BANGUNAN --}}

                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="building-2"></i>
                    </span>

                    <span class="menu-text">
                        Gedung Dan Bangunan
                    </span>

                </a>



                {{-- JALAN IRIGASI DAN JARINGAN --}}

                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="route"></i>
                    </span>

                    <span class="menu-text">
                        Jalan, Irigasi, Dan Jaringan
                    </span>

                </a>



                {{-- ASET TETAP LAINNYA --}}

                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="package-open"></i>
                    </span>

                    <span class="menu-text">
                        Aset Tetap Lainnya
                    </span>

                </a>



                {{-- KONSTRUKSI --}}

                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="construction"></i>
                    </span>

                    <span class="menu-text">
                        Konstruksi
                    </span>

                </a>



                {{-- K.I.R --}}

                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="clipboard-list"></i>
                    </span>

                    <span class="menu-text">
                        K.I.R
                    </span>

                </a>



                {{-- =====================
                 NILAI ASET
            ====================== --}}

                <div class="menu-label">
                    Nilai Aset
                </div>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="badge-dollar-sign"></i>
                    </span>

                    <span class="menu-text">
                        Nilai Aset
                    </span>

                </a>



                {{-- =====================
                 ARSIP
            ====================== --}}

                <div class="menu-label">
                    Arsip
                </div>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="archive"></i>
                    </span>

                    <span class="menu-text">
                        Arsip
                    </span>

                </a>


            </div>



            {{-- =====================================================
             FOOTER
        ====================================================== --}}

            <div class="sidebar-footer">

                <a href="{{ route('login') }}" class="menu-item logout-item">

                    <span class="menu-icon">
                        <i data-lucide="log-out"></i>
                    </span>

                    <span class="menu-text">
                        Keluar
                    </span>

                </a>

            </div>


        </aside>



        {{-- =========================================================
         MAIN
    ========================================================== --}}

        <main class="main">


            {{-- =====================================================
             TOPBAR
        ====================================================== --}}

            <header class="topbar">


                <div class="topbar-left">


                    {{-- MOBILE MENU --}}

                    <button class="mobile-menu" onclick="toggleSidebar()" type="button">

                        <i data-lucide="menu"></i>

                    </button>



                    {{-- TITLE --}}

                    <div class="page-title">

                        <h2>
                            Dashboard
                        </h2>

                        <p>
                            Ringkasan informasi aset perusahaan
                        </p>

                    </div>

                </div>



                {{-- RIGHT --}}

                <div class="topbar-right">


                    {{-- NOTIFICATION --}}

                    <div class="notification">

                        <i data-lucide="bell"></i>

                        <span class="notification-dot"></span>

                    </div>



                    {{-- USER --}}

                    <div class="user-profile">

                        <div class="avatar">
                            A
                        </div>

                        <div class="user-info">

                            <strong>
                                Administrator
                            </strong>

                            <span>
                                Super Admin
                            </span>

                        </div>

                    </div>


                </div>


            </header>



            {{-- =====================================================
             CONTENT
        ====================================================== --}}

            <section class="content">


                {{-- =================================================
                 WELCOME
            ================================================== --}}

                <div class="welcome">

                    <h1>
                        Selamat Datang, Administrator
                    </h1>

                    <p>
                        Pantau dan kelola seluruh aset perusahaan
                        melalui satu sistem.
                    </p>

                </div>



                {{-- =================================================
                 STATISTIC CARDS
            ================================================== --}}

                <div class="cards">


                    {{-- TOTAL ASET --}}

                    <div class="card">

                        <div class="card-top">

                            <div>

                                <div class="card-title">
                                    Total Aset
                                </div>

                                <div class="card-number">
                                    248
                                </div>

                            </div>


                            <div class="card-icon blue">

                                <i data-lucide="boxes"></i>

                            </div>

                        </div>


                        <div class="card-footer">
                            Seluruh aset terdaftar
                        </div>

                    </div>



                    {{-- KONDISI BAIK --}}

                    <div class="card">

                        <div class="card-top">

                            <div>

                                <div class="card-title">
                                    Kondisi Baik
                                </div>

                                <div class="card-number">
                                    215
                                </div>

                            </div>


                            <div class="card-icon green">

                                <i data-lucide="circle-check-big"></i>

                            </div>

                        </div>


                        <div class="card-footer">
                            Aset beroperasi normal
                        </div>

                    </div>



                    {{-- MAINTENANCE --}}

                    <div class="card">

                        <div class="card-top">

                            <div>

                                <div class="card-title">
                                    Maintenance
                                </div>

                                <div class="card-number">
                                    21
                                </div>

                            </div>


                            <div class="card-icon orange">

                                <i data-lucide="wrench"></i>

                            </div>

                        </div>


                        <div class="card-footer">
                            Dalam proses perawatan
                        </div>

                    </div>



                    {{-- RUSAK --}}

                    <div class="card">

                        <div class="card-top">

                            <div>

                                <div class="card-title">
                                    Rusak
                                </div>

                                <div class="card-number">
                                    12
                                </div>

                            </div>


                            <div class="card-icon red">

                                <i data-lucide="triangle-alert"></i>

                            </div>

                        </div>


                        <div class="card-footer">
                            Memerlukan penanganan
                        </div>

                    </div>


                </div>



                {{-- =================================================
                 DASHBOARD GRID
            ================================================== --}}

                <div class="dashboard-grid">


                    {{-- =================================================
                     ASET TERBARU
                ================================================== --}}

                    <div class="panel">


                        <div class="panel-header">

                            <h3>
                                Aset Terbaru
                            </h3>

                            <a href="#">
                                Lihat Semua
                            </a>

                        </div>



                        <div class="table-wrapper">


                            <table>


                                <thead>

                                    <tr>

                                        <th>
                                            Aset
                                        </th>

                                        <th>
                                            Lokasi
                                        </th>

                                        <th>
                                            Kategori
                                        </th>

                                        <th>
                                            Kondisi
                                        </th>

                                    </tr>

                                </thead>



                                <tbody>


                                    {{-- DATA 1 --}}

                                    <tr>

                                        <td>

                                            <div class="asset-name">
                                                Laptop Dell Latitude
                                            </div>

                                            <div class="asset-code">
                                                AST-IT-001
                                            </div>

                                        </td>


                                        <td>
                                            Bagian IT
                                        </td>


                                        <td>
                                            Elektronik
                                        </td>


                                        <td>

                                            <span class="badge badge-good">
                                                Baik
                                            </span>

                                        </td>

                                    </tr>



                                    {{-- DATA 2 --}}

                                    <tr>

                                        <td>

                                            <div class="asset-name">
                                                Printer Epson L5290
                                            </div>

                                            <div class="asset-code">
                                                AST-ADM-008
                                            </div>

                                        </td>


                                        <td>
                                            Administrasi
                                        </td>


                                        <td>
                                            Elektronik
                                        </td>


                                        <td>

                                            <span class="badge badge-maintenance">
                                                Maintenance
                                            </span>

                                        </td>

                                    </tr>



                                    {{-- DATA 3 --}}

                                    <tr>

                                        <td>

                                            <div class="asset-name">
                                                Pompa Air
                                            </div>

                                            <div class="asset-code">
                                                AST-PRD-014
                                            </div>

                                        </td>


                                        <td>
                                            IPA
                                        </td>


                                        <td>
                                            Mesin
                                        </td>


                                        <td>

                                            <span class="badge badge-good">
                                                Baik
                                            </span>

                                        </td>

                                    </tr>



                                    {{-- DATA 4 --}}

                                    <tr>

                                        <td>

                                            <div class="asset-name">
                                                Router MikroTik
                                            </div>

                                            <div class="asset-code">
                                                AST-IT-021
                                            </div>

                                        </td>


                                        <td>
                                            Server Room
                                        </td>


                                        <td>
                                            Network
                                        </td>


                                        <td>

                                            <span class="badge badge-broken">
                                                Rusak
                                            </span>

                                        </td>

                                    </tr>


                                </tbody>


                            </table>


                        </div>


                    </div>



                    {{-- =================================================
                     AKTIVITAS
                ================================================== --}}

                    <div class="panel">


                        <div class="panel-header">

                            <h3>
                                Aktivitas Terbaru
                            </h3>

                        </div>



                        <div class="activities">


                            {{-- ACTIVITY 1 --}}

                            <div class="activity">


                                <div class="activity-icon">

                                    <i data-lucide="circle-plus"></i>

                                </div>


                                <div>

                                    <div class="activity-title">
                                        Aset baru ditambahkan
                                    </div>

                                    <div class="activity-desc">

                                        Laptop Dell Latitude berhasil
                                        ditambahkan.

                                    </div>

                                    <div class="activity-time">
                                        10 menit lalu
                                    </div>

                                </div>


                            </div>



                            {{-- ACTIVITY 2 --}}

                            <div class="activity">


                                <div class="activity-icon">

                                    <i data-lucide="wrench"></i>

                                </div>


                                <div>

                                    <div class="activity-title">
                                        Maintenance aset
                                    </div>

                                    <div class="activity-desc">

                                        Printer Epson masuk proses
                                        maintenance.

                                    </div>

                                    <div class="activity-time">
                                        1 jam lalu
                                    </div>

                                </div>


                            </div>



                            {{-- ACTIVITY 3 --}}

                            <div class="activity">


                                <div class="activity-icon">

                                    <i data-lucide="map-pin"></i>

                                </div>


                                <div>

                                    <div class="activity-title">
                                        Perubahan lokasi
                                    </div>

                                    <div class="activity-desc">

                                        Router MikroTik dipindahkan
                                        ke ruang server.

                                    </div>

                                    <div class="activity-time">
                                        3 jam lalu
                                    </div>

                                </div>


                            </div>


                        </div>


                    </div>


                </div>


            </section>


        </main>


    </div>



    {{-- =============================================================
     LUCIDE ICONS
============================================================= --}}

    <script src="https://unpkg.com/lucide@latest"></script>


    <script>
        /*
                                |--------------------------------------------------------------------------
                                | Initialize Lucide Icons
                                |--------------------------------------------------------------------------
                                */

        lucide.createIcons();


        /*
        |--------------------------------------------------------------------------
        | Mobile Sidebar
        |--------------------------------------------------------------------------
        */

        function toggleSidebar() {

            document
                .getElementById('sidebar')
                .classList
                .toggle('show');

        }
    </script>


</body>

</html>
