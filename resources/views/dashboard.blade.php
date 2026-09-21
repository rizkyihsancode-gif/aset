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

        :root {
            --primary: #0b63ce;
            --primary-dark: #074f9f;
            --primary-light: #eaf3ff;

            --bg: #f5f7fb;
            --surface: #ffffff;

            --text: #172033;
            --muted: #7b8799;

            --border: #e8edf3;

            --success: #16a34a;
            --warning: #f59e0b;
            --danger: #dc2626;

            --sidebar-width: 250px;
        }

        body {
            font-family:
                Inter,
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

            background: var(--bg);
            color: var(--text);
        }

        button,
        input,
        select {
            font: inherit;
        }

        a {
            text-decoration: none;
        }

        /* ==========================================================
           APP
        ========================================================== */

        .app {
            min-height: 100vh;
        }

        /* ==========================================================
           SIDEBAR
        ========================================================== */

        .sidebar {
            width: var(--sidebar-width);
            height: 100vh;

            position: fixed;
            top: 0;
            left: 0;

            background: #ffffff;

            border-right: 1px solid var(--border);

            display: flex;
            flex-direction: column;

            z-index: 1000;
        }

        /* BRAND */

        .brand {
            height: 72px;

            display: flex;
            align-items: center;

            padding: 0 20px;

            border-bottom: 1px solid var(--border);
        }

        .brand-logo {
            width: 40px;
            height: 40px;

            border-radius: 11px;

            background:
                linear-gradient(135deg,
                    var(--primary),
                    var(--primary-dark));

            color: #fff;

            display: flex;
            align-items: center;
            justify-content: center;

            margin-right: 11px;
        }

        .brand-logo svg {
            width: 21px;
            height: 21px;
        }

        .brand-title {
            font-size: 16px;
            font-weight: 750;
            color: #111827;
        }

        .brand-subtitle {
            margin-top: 2px;

            font-size: 10px;
            color: #9aa5b5;
        }

        /* MENU */

        .sidebar-menu {
            flex: 1;

            overflow-y: auto;
            overflow-x: hidden;

            padding: 17px 12px;
        }

        .sidebar-menu::-webkit-scrollbar {
            width: 4px;
        }

        .sidebar-menu::-webkit-scrollbar-thumb {
            background: #d9e1ea;
            border-radius: 20px;
        }

        .menu-label {
            padding: 12px 11px 7px;

            font-size: 10px;
            font-weight: 800;

            color: #a2acb9;

            letter-spacing: 1.1px;

            text-transform: uppercase;
        }

        .menu-item {
            min-height: 42px;

            display: flex;
            align-items: center;

            gap: 11px;

            padding: 10px 11px;

            margin-bottom: 3px;

            color: #697586;

            border-radius: 9px;

            font-size: 13px;
            font-weight: 500;

            transition: .18s ease;

            cursor: pointer;
        }

        .menu-item:hover {
            background: #f4f7fb;
            color: var(--primary);
        }

        .menu-item.active {
            background: var(--primary-light);
            color: var(--primary);
            font-weight: 650;
        }

        .menu-icon {
            width: 20px;
            min-width: 20px;

            display: flex;
            align-items: center;
            justify-content: center;
        }

        .menu-icon svg {
            width: 17px;
            height: 17px;

            stroke-width: 1.8;
        }

        .menu-text {
            flex: 1;

            line-height: 1.3;
        }

        .menu-arrow {
            display: flex;

            color: #a7b0bd;

            transition: transform .2s ease;
        }

        .menu-arrow svg {
            width: 14px;
            height: 14px;
        }

        .menu-group.open>.menu-parent .menu-arrow {
            transform: rotate(90deg);
        }

        .submenu {
            display: none;

            margin-left: 14px;

            padding-left: 13px;

            border-left: 1px solid #e7ecf2;
        }

        .menu-group.open .submenu {
            display: block;
        }

        .submenu .menu-item {
            font-size: 12.5px;

            min-height: 38px;

            padding: 8px 10px;
        }

        .submenu .menu-icon svg {
            width: 15px;
            height: 15px;
        }

        /* FOOTER SIDEBAR */

        .sidebar-footer {
            padding: 12px;

            border-top: 1px solid var(--border);
        }

        .sidebar-user {
            display: flex;
            align-items: center;

            gap: 10px;

            padding: 9px;

            border-radius: 10px;

            background: #f8fafc;
        }

        .sidebar-avatar {
            width: 34px;
            height: 34px;

            border-radius: 9px;

            background: var(--primary);

            color: #ffffff;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 12px;
            font-weight: 700;
        }

        .sidebar-user-info {
            min-width: 0;
            flex: 1;
        }

        .sidebar-user-info strong {
            display: block;

            font-size: 11px;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .sidebar-user-info span {
            display: block;

            margin-top: 2px;

            font-size: 9px;
            color: #929dad;
        }

        .sidebar-logout {
            width: 30px;
            height: 30px;

            border: 0;
            background: transparent;

            color: #8793a4;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 7px;

            cursor: pointer;
        }

        .sidebar-logout:hover {
            color: var(--danger);
            background: #fff1f2;
        }

        .sidebar-logout svg {
            width: 16px;
            height: 16px;
        }

        /* ==========================================================
           MAIN
        ========================================================== */

        .main {
            margin-left: var(--sidebar-width);

            min-height: 100vh;
        }

        /* ==========================================================
           TOPBAR
        ========================================================== */

        .topbar {
            height: 72px;

            background: rgba(255, 255, 255, .96);

            border-bottom: 1px solid var(--border);

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 28px;

            position: sticky;
            top: 0;

            z-index: 500;
        }

        .topbar-left {
            display: flex;
            align-items: center;

            gap: 14px;
        }

        .mobile-menu {
            width: 38px;
            height: 38px;

            display: none;
            align-items: center;
            justify-content: center;

            border: 1px solid var(--border);

            border-radius: 9px;

            background: white;

            color: #64748b;

            cursor: pointer;
        }

        .mobile-menu svg {
            width: 19px;
            height: 19px;
        }

        .page-title h1 {
            font-size: 18px;
            font-weight: 700;

            letter-spacing: -.2px;
        }

        .page-title p {
            margin-top: 3px;

            font-size: 11px;
            color: #98a3b3;
        }

        .topbar-right {
            display: flex;
            align-items: center;

            gap: 10px;
        }

        .top-action {
            width: 38px;
            height: 38px;

            border: 1px solid var(--border);

            background: white;

            color: #6d7888;

            border-radius: 9px;

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            position: relative;
        }

        .top-action:hover {
            color: var(--primary);
            background: #f8fbff;
        }

        .top-action svg {
            width: 17px;
            height: 17px;
        }

        .notification-dot {
            width: 6px;
            height: 6px;

            border-radius: 50%;

            background: #ef4444;

            position: absolute;

            top: 8px;
            right: 8px;

            border: 1px solid white;
        }

        /* ==========================================================
           CONTENT
        ========================================================== */

        .content {
            padding: 25px 28px 35px;
        }

        /* ==========================================================
           WELCOME
        ========================================================== */

        .welcome {
            padding: 24px 26px;

            margin-bottom: 20px;

            border-radius: 14px;

            background:
                linear-gradient(125deg,
                    #0b63ce 0%,
                    #074f9f 65%,
                    #043d7c 100%);

            color: white;

            position: relative;
            overflow: hidden;
        }

        .welcome::before {
            content: "";

            position: absolute;

            width: 260px;
            height: 260px;

            border-radius: 50%;

            background: rgba(255, 255, 255, .06);

            top: -150px;
            right: -60px;
        }

        .welcome::after {
            content: "";

            position: absolute;

            width: 130px;
            height: 130px;

            border-radius: 50%;

            border: 25px solid rgba(255, 255, 255, .04);

            right: 130px;
            bottom: -90px;
        }

        .welcome-content {
            position: relative;
            z-index: 2;
        }

        .welcome small {
            display: block;

            margin-bottom: 6px;

            font-size: 10px;
            font-weight: 700;

            letter-spacing: 1.2px;

            opacity: .7;

            text-transform: uppercase;
        }

        .welcome h2 {
            font-size: 22px;

            margin-bottom: 6px;
        }

        .welcome p {
            max-width: 650px;

            font-size: 12px;

            line-height: 1.6;

            opacity: .82;
        }

        /* ==========================================================
           KPI
        ========================================================== */

        .kpi-grid {
            display: grid;

            grid-template-columns: repeat(4, 1fr);

            gap: 16px;

            margin-bottom: 18px;
        }

        .kpi-card {
            background: white;

            border: 1px solid var(--border);

            border-radius: 13px;

            padding: 18px;

            min-width: 0;
        }

        .kpi-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;

            gap: 10px;
        }

        .kpi-label {
            font-size: 11px;

            color: #7f8a99;

            font-weight: 600;
        }

        .kpi-value {
            margin-top: 7px;

            font-size: 23px;
            font-weight: 750;

            color: #172033;

            white-space: nowrap;
        }

        .kpi-value.currency {
            font-size: 19px;
        }

        .kpi-icon {
            width: 38px;
            height: 38px;

            border-radius: 10px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;
        }

        .kpi-icon svg {
            width: 18px;
            height: 18px;
        }

        .kpi-blue {
            background: #eaf3ff;
            color: #0b63ce;
        }

        .kpi-purple {
            background: #f2ecff;
            color: #7c3aed;
        }

        .kpi-green {
            background: #ecfdf3;
            color: #16a34a;
        }

        .kpi-orange {
            background: #fff7e6;
            color: #e68a00;
        }

        .kpi-foot {
            display: flex;
            align-items: center;

            gap: 5px;

            margin-top: 11px;

            font-size: 9.5px;

            color: #9aa4b3;
        }

        .kpi-foot strong {
            color: var(--success);
            font-weight: 650;
        }

        /* ==========================================================
           PANEL
        ========================================================== */

        .panel {
            background: white;

            border: 1px solid var(--border);

            border-radius: 13px;

            overflow: hidden;
        }

        .panel-header {
            padding: 17px 18px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 14px;

            border-bottom: 1px solid var(--border);
        }

        .panel-title h3 {
            font-size: 13px;

            font-weight: 700;
        }

        .panel-title p {
            margin-top: 3px;

            font-size: 9.5px;

            color: #9aa4b3;
        }

        .panel-action {
            font-size: 10px;

            color: var(--primary);

            font-weight: 600;

            white-space: nowrap;
        }

        .panel-body {
            padding: 18px;
        }

        /* ==========================================================
           ANALYTICS
        ========================================================== */

        .analytics-grid {
            display: grid;

            grid-template-columns: 1.8fr 1fr;

            gap: 16px;

            margin-bottom: 16px;
        }

        .chart-wrap {
            height: 285px;

            position: relative;
        }

        .pie-wrap {
            height: 240px;

            position: relative;

            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* ==========================================================
           SECOND ANALYTICS
        ========================================================== */

        .analytics-grid-secondary {
            display: grid;

            grid-template-columns: 1.55fr 1fr;

            gap: 16px;

            margin-bottom: 16px;
        }

        .bar-wrap {
            height: 285px;
        }

        /* ==========================================================
           CONDITION
        ========================================================== */

        .condition-list {
            display: flex;
            flex-direction: column;

            gap: 19px;
        }

        .condition-row {
            width: 100%;
        }

        .condition-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin-bottom: 8px;
        }

        .condition-name {
            display: flex;
            align-items: center;

            gap: 7px;

            font-size: 11px;
            font-weight: 600;
        }

        .condition-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;
        }

        .dot-good {
            background: #16a34a;
        }

        .dot-maintenance {
            background: #f59e0b;
        }

        .dot-broken {
            background: #dc2626;
        }

        .condition-number {
            font-size: 11px;

            color: #657184;
        }

        .progress {
            width: 100%;
            height: 6px;

            border-radius: 20px;

            background: #edf1f5;

            overflow: hidden;
        }

        .progress-bar {
            height: 100%;

            border-radius: inherit;
        }

        .progress-good {
            width: 86%;
            background: #16a34a;
        }

        .progress-maintenance {
            width: 9%;
            background: #f59e0b;
        }

        .progress-broken {
            width: 5%;
            background: #dc2626;
        }

        .condition-summary {
            display: grid;

            grid-template-columns: repeat(2, 1fr);

            gap: 10px;

            margin-top: 23px;
        }

        .mini-stat {
            padding: 13px;

            border-radius: 10px;

            background: #f8fafc;
        }

        .mini-stat span {
            display: block;

            font-size: 9px;

            color: #9aa4b3;
        }

        .mini-stat strong {
            display: block;

            margin-top: 4px;

            font-size: 15px;
        }

        /* ==========================================================
           BOTTOM
        ========================================================== */

        .bottom-grid {
            display: grid;

            grid-template-columns: 1.7fr 1fr;

            gap: 16px;
        }

        /* ==========================================================
           TABLE
        ========================================================== */

        .table-responsive {
            overflow-x: auto;
        }

        table {
            width: 100%;

            border-collapse: collapse;
        }

        th {
            padding: 11px 17px;

            background: #fafbfc;

            text-align: left;

            font-size: 9px;

            color: #98a3b3;

            font-weight: 700;

            text-transform: uppercase;

            letter-spacing: .5px;
        }

        td {
            padding: 13px 17px;

            border-top: 1px solid #f0f3f6;

            font-size: 11px;

            color: #687487;
        }

        .asset-info strong {
            display: block;

            color: #273244;

            font-size: 11px;

            margin-bottom: 3px;
        }

        .asset-info span {
            font-size: 9px;

            color: #a0a9b7;
        }

        .status {
            display: inline-flex;

            align-items: center;

            gap: 5px;

            padding: 4px 8px;

            border-radius: 20px;

            font-size: 9px;

            font-weight: 650;
        }

        .status::before {
            content: "";

            width: 5px;
            height: 5px;

            border-radius: 50%;
        }

        .status.good {
            background: #ecfdf3;
            color: #15803d;
        }

        .status.good::before {
            background: #16a34a;
        }

        .status.maintenance {
            background: #fff8e8;
            color: #b66a00;
        }

        .status.maintenance::before {
            background: #f59e0b;
        }

        .status.broken {
            background: #fff0f1;
            color: #c62828;
        }

        .status.broken::before {
            background: #dc2626;
        }

        /* ==========================================================
           ACTIVITY
        ========================================================== */

        .activity-list {
            display: flex;

            flex-direction: column;
        }

        .activity-item {
            display: flex;

            gap: 11px;

            padding: 13px 0;

            border-bottom: 1px solid #f1f3f6;
        }

        .activity-item:first-child {
            padding-top: 0;
        }

        .activity-item:last-child {
            border-bottom: 0;
            padding-bottom: 0;
        }

        .activity-icon {
            width: 31px;
            height: 31px;

            min-width: 31px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 8px;

            background: var(--primary-light);

            color: var(--primary);
        }

        .activity-icon svg {
            width: 14px;
            height: 14px;
        }

        .activity-content strong {
            display: block;

            font-size: 10.5px;

            color: #303a49;

            margin-bottom: 3px;
        }

        .activity-content p {
            font-size: 9.5px;

            line-height: 1.45;

            color: #8b96a6;
        }

        .activity-time {
            display: block;

            margin-top: 4px;

            font-size: 8.5px;

            color: #a9b1bc;
        }

        /* ==========================================================
           OVERLAY
        ========================================================== */

        .sidebar-overlay {
            display: none;
        }

        /* ==========================================================
           RESPONSIVE
        ========================================================== */

        @media (max-width: 1200px) {

            .kpi-grid {
                grid-template-columns: repeat(2, 1fr);
            }

        }

        @media (max-width: 980px) {

            .analytics-grid,
            .analytics-grid-secondary,
            .bottom-grid {
                grid-template-columns: 1fr;
            }

        }

        @media (max-width: 820px) {

            .sidebar {
                transform: translateX(-100%);
                transition: transform .25s ease;

                box-shadow: 10px 0 30px rgba(0, 0, 0, .09);
            }

            .sidebar.open {
                transform: translateX(0);
            }

            .main {
                margin-left: 0;
            }

            .mobile-menu {
                display: flex;
            }

            .sidebar-overlay {
                display: block;

                position: fixed;
                inset: 0;

                background: rgba(20, 30, 45, .30);

                z-index: 900;

                opacity: 0;
                visibility: hidden;

                transition: .2s;
            }

            .sidebar-overlay.show {
                opacity: 1;
                visibility: visible;
            }

        }

        @media (max-width: 620px) {

            .content {
                padding: 18px;
            }

            .topbar {
                padding: 0 18px;
            }

            .kpi-grid {
                grid-template-columns: 1fr;
            }

            .welcome {
                padding: 21px;
            }

            .welcome h2 {
                font-size: 19px;
            }

            .page-title p {
                display: none;
            }

        }
    </style>
</head>


<body>

    <div class="app">

        {{-- ============================================================
         SIDEBAR
    ============================================================= --}}

        <aside class="sidebar" id="sidebar">

            {{-- BRAND --}}
            <div class="brand">

                <div class="brand-logo">
                    <i data-lucide="boxes"></i>
                </div>

                <div>
                    <div class="brand-title">
                        Sistem Aset
                    </div>

                    <div class="brand-subtitle">
                        Perumdam Tirta Kencana
                    </div>
                </div>

            </div>


            {{-- MENU --}}
            <nav class="sidebar-menu">

                {{-- OVERVIEW --}}
                <div class="menu-label">
                    Overview
                </div>

                <a href="{{ route('dashboard') }}" class="menu-item active">

                    <span class="menu-icon">
                        <i data-lucide="layout-dashboard"></i>
                    </span>

                    <span class="menu-text">
                        Dashboard
                    </span>

                </a>


                {{-- PENGELOLAAN --}}
                <div class="menu-label">
                    Pengelolaan
                </div>


                {{-- MASTER DATA --}}
                <div class="menu-group" id="masterGroup">

                    <div class="menu-item menu-parent" onclick="toggleMenu('masterGroup')">

                        <span class="menu-icon">
                            <i data-lucide="database"></i>
                        </span>

                        <span class="menu-text">
                            Master Data
                        </span>

                        <span class="menu-arrow">
                            <i data-lucide="chevron-right"></i>
                        </span>

                    </div>


                    <div class="submenu">

                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="package"></i>
                            </span>

                            <span class="menu-text">
                                Barang
                            </span>

                        </a>


                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="building"></i>
                            </span>

                            <span class="menu-text">
                                Departemen
                            </span>

                        </a>


                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="git-branch"></i>
                            </span>

                            <span class="menu-text">
                                Divisi
                            </span>

                        </a>


                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="door-open"></i>
                            </span>

                            <span class="menu-text">
                                Ruangan
                            </span>

                        </a>


                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="users"></i>
                            </span>

                            <span class="menu-text">
                                SDM Pendukung
                            </span>

                        </a>


                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="map-pin"></i>
                            </span>

                            <span class="menu-text">
                                Lokasi
                            </span>

                        </a>


                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="layers-3"></i>
                            </span>

                            <span class="menu-text">
                                Bahan
                            </span>

                        </a>


                        <a href="#" class="menu-item">

                            <span class="menu-icon">
                                <i data-lucide="barcode"></i>
                            </span>

                            <span class="menu-text">
                                Kode Aktiva
                            </span>

                        </a>

                    </div>

                </div>


                {{-- KIB --}}
                <div class="menu-group" id="kibGroup">

                    <div class="menu-item menu-parent" onclick="toggleMenu('kibGroup')">

                        <span class="menu-icon">
                            <i data-lucide="library"></i>
                        </span>

                        <span class="menu-text">
                            K.I.B
                        </span>

                        <span class="menu-arrow">
                            <i data-lucide="chevron-right"></i>
                        </span>

                    </div>


                    <div class="submenu">

                        <a href="#" class="menu-item">
                            <span class="menu-icon">
                                <i data-lucide="map"></i>
                            </span>

                            <span class="menu-text">
                                Tanah
                            </span>
                        </a>


                        <a href="#" class="menu-item">
                            <span class="menu-icon">
                                <i data-lucide="settings"></i>
                            </span>

                            <span class="menu-text">
                                Peralatan & Mesin
                            </span>
                        </a>


                        <a href="#" class="menu-item">
                            <span class="menu-icon">
                                <i data-lucide="building-2"></i>
                            </span>

                            <span class="menu-text">
                                Gedung & Bangunan
                            </span>
                        </a>


                        <a href="#" class="menu-item">
                            <span class="menu-icon">
                                <i data-lucide="route"></i>
                            </span>

                            <span class="menu-text">
                                Jalan, Irigasi & Jaringan
                            </span>
                        </a>


                        <a href="#" class="menu-item">
                            <span class="menu-icon">
                                <i data-lucide="package-open"></i>
                            </span>

                            <span class="menu-text">
                                Aset Tetap Lainnya
                            </span>
                        </a>


                        <a href="#" class="menu-item">
                            <span class="menu-icon">
                                <i data-lucide="construction"></i>
                            </span>

                            <span class="menu-text">
                                Konstruksi
                            </span>
                        </a>


                        <a href="#" class="menu-item">
                            <span class="menu-icon">
                                <i data-lucide="clipboard-list"></i>
                            </span>

                            <span class="menu-text">
                                K.I.R
                            </span>
                        </a>

                    </div>

                </div>


                {{-- NILAI ASET --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="badge-dollar-sign"></i>
                    </span>

                    <span class="menu-text">
                        Nilai Aset
                    </span>

                </a>


                {{-- ARSIP --}}
                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="archive"></i>
                    </span>

                    <span class="menu-text">
                        Arsip
                    </span>

                </a>

            </nav>


            {{-- USER --}}
            <div class="sidebar-footer">

                <div class="sidebar-user">

                    <div class="sidebar-avatar">
                        A
                    </div>

                    <div class="sidebar-user-info">

                        <strong>
                            Administrator
                        </strong>

                        <span>
                            Super Admin
                        </span>

                    </div>


                    <a href="{{ route('login') }}" class="sidebar-logout" title="Keluar">
                        <i data-lucide="log-out"></i>
                    </a>

                </div>

            </div>

        </aside>


        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>



        {{-- ============================================================
         MAIN
    ============================================================= --}}

        <main class="main">


            {{-- TOPBAR --}}
            <header class="topbar">

                <div class="topbar-left">

                    <button class="mobile-menu" onclick="toggleSidebar()">
                        <i data-lucide="menu"></i>
                    </button>


                    <div class="page-title">

                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Ringkasan dan monitoring aset perusahaan
                        </p>

                    </div>

                </div>


                <div class="topbar-right">

                    <button class="top-action">
                        <i data-lucide="search"></i>
                    </button>


                    <button class="top-action">

                        <i data-lucide="bell"></i>

                        <span class="notification-dot"></span>

                    </button>

                </div>

            </header>



            {{-- ========================================================
             CONTENT
        ========================================================= --}}

            <section class="content">


                {{-- WELCOME --}}
                <div class="welcome">

                    <div class="welcome-content">

                        <small>
                            Sistem Informasi Manajemen Aset
                        </small>

                        <h2>
                            Selamat datang, Administrator
                        </h2>

                        <p>
                            Pantau jumlah, nilai, kondisi, dan perkembangan
                            seluruh aset Perumdam Tirta Kencana dalam satu
                            dashboard terintegrasi.
                        </p>

                    </div>

                </div>



                {{-- ====================================================
                 KPI
            ===================================================== --}}

                <div class="kpi-grid">


                    {{-- TOTAL ASET --}}
                    <div class="kpi-card">

                        <div class="kpi-head">

                            <div>

                                <div class="kpi-label">
                                    Total Aset
                                </div>

                                <div class="kpi-value">
                                    2.485
                                </div>

                            </div>


                            <div class="kpi-icon kpi-blue">
                                <i data-lucide="boxes"></i>
                            </div>

                        </div>


                        <div class="kpi-foot">
                            <strong>+24</strong>
                            aset terdaftar tahun ini
                        </div>

                    </div>



                    {{-- NILAI ASET --}}
                    <div class="kpi-card">

                        <div class="kpi-head">

                            <div>

                                <div class="kpi-label">
                                    Total Nilai Aset
                                </div>

                                <div class="kpi-value currency">
                                    Rp 928,7 M
                                </div>

                            </div>


                            <div class="kpi-icon kpi-purple">
                                <i data-lucide="wallet-cards"></i>
                            </div>

                        </div>


                        <div class="kpi-foot">
                            Nilai perolehan seluruh aset
                        </div>

                    </div>



                    {{-- BAIK --}}
                    <div class="kpi-card">

                        <div class="kpi-head">

                            <div>

                                <div class="kpi-label">
                                    Kondisi Baik
                                </div>

                                <div class="kpi-value">
                                    2.215
                                </div>

                            </div>


                            <div class="kpi-icon kpi-green">
                                <i data-lucide="circle-check-big"></i>
                            </div>

                        </div>


                        <div class="kpi-foot">
                            <strong>89,1%</strong>
                            dari total aset
                        </div>

                    </div>



                    {{-- PERLU PERHATIAN --}}
                    <div class="kpi-card">

                        <div class="kpi-head">

                            <div>

                                <div class="kpi-label">
                                    Perlu Perhatian
                                </div>

                                <div class="kpi-value">
                                    270
                                </div>

                            </div>


                            <div class="kpi-icon kpi-orange">
                                <i data-lucide="triangle-alert"></i>
                            </div>

                        </div>


                        <div class="kpi-foot">
                            Maintenance dan aset rusak
                        </div>

                    </div>

                </div>



                {{-- ====================================================
                 ANALYTICS 1
            ===================================================== --}}

                <div class="analytics-grid">


                    {{-- LINE CHART --}}
                    <div class="panel">

                        <div class="panel-header">

                            <div class="panel-title">

                                <h3>
                                    Pertumbuhan Nilai Aset
                                </h3>

                                <p>
                                    Perkembangan nilai aset lima tahun terakhir
                                </p>

                            </div>


                            <a href="#" class="panel-action">
                                Detail
                            </a>

                        </div>


                        <div class="panel-body">

                            <div class="chart-wrap">

                                <canvas id="assetGrowthChart"></canvas>

                            </div>

                        </div>

                    </div>



                    {{-- DOUGHNUT --}}
                    <div class="panel">

                        <div class="panel-header">

                            <div class="panel-title">

                                <h3>
                                    Komposisi K.I.B
                                </h3>

                                <p>
                                    Proporsi aset berdasarkan kategori
                                </p>

                            </div>

                        </div>


                        <div class="panel-body">

                            <div class="pie-wrap">

                                <canvas id="compositionChart"></canvas>

                            </div>

                        </div>

                    </div>


                </div>



                {{-- ====================================================
                 ANALYTICS 2
            ===================================================== --}}

                <div class="analytics-grid-secondary">


                    {{-- BAR --}}
                    <div class="panel">

                        <div class="panel-header">

                            <div class="panel-title">

                                <h3>
                                    Jumlah Aset per Kategori
                                </h3>

                                <p>
                                    Distribusi jumlah aset berdasarkan K.I.B
                                </p>

                            </div>

                        </div>


                        <div class="panel-body">

                            <div class="bar-wrap">

                                <canvas id="assetCategoryChart"></canvas>

                            </div>

                        </div>

                    </div>



                    {{-- CONDITION --}}
                    <div class="panel">

                        <div class="panel-header">

                            <div class="panel-title">

                                <h3>
                                    Kondisi Aset
                                </h3>

                                <p>
                                    Ringkasan kondisi aset aktif
                                </p>

                            </div>

                        </div>


                        <div class="panel-body">


                            <div class="condition-list">


                                {{-- BAIK --}}
                                <div class="condition-row">

                                    <div class="condition-head">

                                        <div class="condition-name">

                                            <span class="condition-dot dot-good"></span>

                                            Baik

                                        </div>


                                        <div class="condition-number">
                                            2.215
                                        </div>

                                    </div>


                                    <div class="progress">

                                        <div class="progress-bar progress-good"></div>

                                    </div>

                                </div>



                                {{-- MAINTENANCE --}}
                                <div class="condition-row">

                                    <div class="condition-head">

                                        <div class="condition-name">

                                            <span class="condition-dot dot-maintenance"></span>

                                            Maintenance

                                        </div>


                                        <div class="condition-number">
                                            168
                                        </div>

                                    </div>


                                    <div class="progress">

                                        <div class="progress-bar progress-maintenance"></div>

                                    </div>

                                </div>



                                {{-- RUSAK --}}
                                <div class="condition-row">

                                    <div class="condition-head">

                                        <div class="condition-name">

                                            <span class="condition-dot dot-broken"></span>

                                            Rusak

                                        </div>


                                        <div class="condition-number">
                                            102
                                        </div>

                                    </div>


                                    <div class="progress">

                                        <div class="progress-bar progress-broken"></div>

                                    </div>

                                </div>

                            </div>



                            <div class="condition-summary">

                                <div class="mini-stat">

                                    <span>
                                        Lokasi Aset
                                    </span>

                                    <strong>
                                        34
                                    </strong>

                                </div>


                                <div class="mini-stat">

                                    <span>
                                        Ruangan
                                    </span>

                                    <strong>
                                        78
                                    </strong>

                                </div>


                                <div class="mini-stat">

                                    <span>
                                        Departemen
                                    </span>

                                    <strong>
                                        12
                                    </strong>

                                </div>


                                <div class="mini-stat">

                                    <span>
                                        Divisi
                                    </span>

                                    <strong>
                                        26
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>


                </div>



                {{-- ====================================================
                 BOTTOM
            ===================================================== --}}

                <div class="bottom-grid">


                    {{-- ASET TERBARU --}}
                    <div class="panel">

                        <div class="panel-header">

                            <div class="panel-title">

                                <h3>
                                    Aset Terbaru
                                </h3>

                                <p>
                                    Data aset yang terakhir ditambahkan
                                </p>

                            </div>


                            <a href="#" class="panel-action">
                                Lihat Semua
                            </a>

                        </div>


                        <div class="table-responsive">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Aset</th>
                                        <th>Lokasi</th>
                                        <th>Kategori</th>
                                        <th>Kondisi</th>
                                    </tr>

                                </thead>


                                <tbody>


                                    <tr>

                                        <td>

                                            <div class="asset-info">

                                                <strong>
                                                    Laptop Dell Latitude
                                                </strong>

                                                <span>
                                                    AST-IT-001
                                                </span>

                                            </div>

                                        </td>


                                        <td>
                                            Bagian IT
                                        </td>


                                        <td>
                                            Peralatan
                                        </td>


                                        <td>

                                            <span class="status good">
                                                Baik
                                            </span>

                                        </td>

                                    </tr>



                                    <tr>

                                        <td>

                                            <div class="asset-info">

                                                <strong>
                                                    Printer Epson L5290
                                                </strong>

                                                <span>
                                                    AST-ADM-008
                                                </span>

                                            </div>

                                        </td>


                                        <td>
                                            Administrasi
                                        </td>


                                        <td>
                                            Peralatan
                                        </td>


                                        <td>

                                            <span class="status maintenance">
                                                Maintenance
                                            </span>

                                        </td>

                                    </tr>



                                    <tr>

                                        <td>

                                            <div class="asset-info">

                                                <strong>
                                                    Pompa Distribusi
                                                </strong>

                                                <span>
                                                    AST-PRD-014
                                                </span>

                                            </div>

                                        </td>


                                        <td>
                                            IPA
                                        </td>


                                        <td>
                                            Mesin
                                        </td>


                                        <td>

                                            <span class="status good">
                                                Baik
                                            </span>

                                        </td>

                                    </tr>



                                    <tr>

                                        <td>

                                            <div class="asset-info">

                                                <strong>
                                                    Router MikroTik
                                                </strong>

                                                <span>
                                                    AST-IT-021
                                                </span>

                                            </div>

                                        </td>


                                        <td>
                                            Server Room
                                        </td>


                                        <td>
                                            Peralatan
                                        </td>


                                        <td>

                                            <span class="status broken">
                                                Rusak
                                            </span>

                                        </td>

                                    </tr>


                                </tbody>

                            </table>

                        </div>

                    </div>



                    {{-- ACTIVITY --}}
                    <div class="panel">

                        <div class="panel-header">

                            <div class="panel-title">

                                <h3>
                                    Aktivitas Terbaru
                                </h3>

                                <p>
                                    Riwayat perubahan data terbaru
                                </p>

                            </div>

                        </div>


                        <div class="panel-body">


                            <div class="activity-list">


                                <div class="activity-item">

                                    <div class="activity-icon">
                                        <i data-lucide="circle-plus"></i>
                                    </div>


                                    <div class="activity-content">

                                        <strong>
                                            Aset baru ditambahkan
                                        </strong>

                                        <p>
                                            Laptop Dell Latitude ditambahkan
                                            ke inventaris Bagian IT.
                                        </p>

                                        <span class="activity-time">
                                            10 menit lalu
                                        </span>

                                    </div>

                                </div>



                                <div class="activity-item">

                                    <div class="activity-icon">
                                        <i data-lucide="wrench"></i>
                                    </div>


                                    <div class="activity-content">

                                        <strong>
                                            Status aset diperbarui
                                        </strong>

                                        <p>
                                            Printer Epson masuk ke proses
                                            maintenance.
                                        </p>

                                        <span class="activity-time">
                                            1 jam lalu
                                        </span>

                                    </div>

                                </div>



                                <div class="activity-item">

                                    <div class="activity-icon">
                                        <i data-lucide="map-pin"></i>
                                    </div>


                                    <div class="activity-content">

                                        <strong>
                                            Perubahan lokasi
                                        </strong>

                                        <p>
                                            Router MikroTik dipindahkan
                                            ke Server Room.
                                        </p>

                                        <span class="activity-time">
                                            3 jam lalu
                                        </span>

                                    </div>

                                </div>



                                <div class="activity-item">

                                    <div class="activity-icon">
                                        <i data-lucide="badge-dollar-sign"></i>
                                    </div>


                                    <div class="activity-content">

                                        <strong>
                                            Nilai aset diperbarui
                                        </strong>

                                        <p>
                                            Data nilai aktiva tahun berjalan
                                            telah diperbarui.
                                        </p>

                                        <span class="activity-time">
                                            Kemarin
                                        </span>

                                    </div>

                                </div>


                            </div>

                        </div>

                    </div>


                </div>


            </section>

        </main>

    </div>



    {{-- ================================================================
     LIBRARIES
================================================================ --}}

    <script src="https://unpkg.com/lucide@latest"></script>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>



    <script>
        /* =============================================================
               LUCIDE
            ============================================================= */

        lucide.createIcons();



        /* =============================================================
           SIDEBAR SUBMENU
        ============================================================= */

        function toggleMenu(id) {

            const menu = document.getElementById(id);

            menu.classList.toggle('open');

        }



        /* =============================================================
           MOBILE SIDEBAR
        ============================================================= */

        function toggleSidebar() {

            const sidebar =
                document.getElementById('sidebar');

            const overlay =
                document.getElementById('sidebarOverlay');

            sidebar.classList.toggle('open');

            overlay.classList.toggle('show');

        }



        /* =============================================================
           GLOBAL CHART OPTIONS
        ============================================================= */

        Chart.defaults.font.family =
            'Inter, system-ui, sans-serif';

        Chart.defaults.color =
            '#8994a4';



        /* =============================================================
           LINE CHART
           PERTUMBUHAN NILAI ASET
        ============================================================= */

        const growthCanvas =
            document.getElementById('assetGrowthChart');


        new Chart(growthCanvas, {

            type: 'line',

            data: {

                labels: [
                    '2022',
                    '2023',
                    '2024',
                    '2025',
                    '2026'
                ],

                datasets: [

                    {
                        label: 'Nilai Aset',

                        data: [
                            720,
                            768,
                            814,
                            875,
                            928.7
                        ],

                        borderColor: '#0b63ce',

                        backgroundColor: 'rgba(11, 99, 206, .08)',

                        borderWidth: 2,

                        tension: .38,

                        fill: true,

                        pointRadius: 3,

                        pointHoverRadius: 5,

                        pointBackgroundColor: '#0b63ce',

                        pointBorderColor: '#ffffff',

                        pointBorderWidth: 2
                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: 'index'
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return 'Rp ' +
                                    context.parsed.y +
                                    ' Miliar';

                            }

                        }

                    }

                },

                scales: {

                    x: {

                        grid: {
                            display: false
                        },

                        border: {
                            display: false
                        }

                    },

                    y: {

                        beginAtZero: false,

                        grid: {
                            color: '#edf1f5'
                        },

                        border: {
                            display: false
                        },

                        ticks: {

                            callback: function(value) {

                                return value + ' M';

                            }

                        }

                    }

                }

            }

        });



        /* =============================================================
           DOUGHNUT CHART
           KOMPOSISI KIB
        ============================================================= */

        const compositionCanvas =
            document.getElementById('compositionChart');


        new Chart(compositionCanvas, {

            type: 'doughnut',

            data: {

                labels: [
                    'Tanah',
                    'Peralatan & Mesin',
                    'Gedung',
                    'Jalan & Jaringan',
                    'Aset Lainnya',
                    'Konstruksi'
                ],

                datasets: [

                    {

                        data: [
                            245,
                            1020,
                            380,
                            510,
                            260,
                            70
                        ],

                        backgroundColor: [
                            '#0b63ce',
                            '#5b8def',
                            '#16a34a',
                            '#f59e0b',
                            '#8b5cf6',
                            '#ef4444'
                        ],

                        borderWidth: 0,

                        hoverOffset: 5

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: '68%',

                plugins: {

                    legend: {

                        position: 'bottom',

                        labels: {

                            boxWidth: 9,

                            boxHeight: 9,

                            padding: 13,

                            font: {
                                size: 9
                            },

                            usePointStyle: true,

                            pointStyle: 'circle'

                        }

                    }

                }

            }

        });



        /* =============================================================
           BAR CHART
           JUMLAH ASET PER KATEGORI
        ============================================================= */

        const categoryCanvas =
            document.getElementById('assetCategoryChart');


        new Chart(categoryCanvas, {

            type: 'bar',

            data: {

                labels: [

                    'Tanah',

                    'Peralatan & Mesin',

                    'Gedung',

                    'Jalan & Jaringan',

                    'Aset Lainnya',

                    'Konstruksi'

                ],

                datasets: [

                    {

                        label: 'Jumlah Aset',

                        data: [
                            245,
                            1020,
                            380,
                            510,
                            260,
                            70
                        ],

                        backgroundColor: 'rgba(11, 99, 206, .82)',

                        borderRadius: 5,

                        barThickness: 15

                    }

                ]

            },


            options: {

                indexAxis: 'y',

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    x: {

                        beginAtZero: true,

                        grid: {
                            color: '#edf1f5'
                        },

                        border: {
                            display: false
                        }

                    },

                    y: {

                        grid: {
                            display: false
                        },

                        border: {
                            display: false
                        },

                        ticks: {
                            font: {
                                size: 9
                            }
                        }

                    }

                }

            }

        });
    </script>


</body>

</html>
