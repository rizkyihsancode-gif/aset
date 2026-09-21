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


        <a href="{{ route('dashboard') }}"
            class="menu-item
            {{ request()->routeIs('dashboard') ? 'active' : '' }}">

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

                    Barang

                </a>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="building"></i>
                    </span>

                    Departemen

                </a>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="git-branch"></i>
                    </span>

                    Divisi

                </a>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="door-open"></i>
                    </span>

                    Ruangan

                </a>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="users"></i>
                    </span>

                    SDM Pendukung

                </a>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    Lokasi

                </a>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="layers-3"></i>
                    </span>

                    Bahan

                </a>


                <a href="#" class="menu-item">

                    <span class="menu-icon">
                        <i data-lucide="barcode"></i>
                    </span>

                    Kode Aktiva

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
                    Tanah
                </a>

                <a href="#" class="menu-item">
                    Peralatan & Mesin
                </a>

                <a href="#" class="menu-item">
                    Gedung & Bangunan
                </a>

                <a href="#" class="menu-item">
                    Jalan, Irigasi & Jaringan
                </a>

                <a href="#" class="menu-item">
                    Aset Tetap Lainnya
                </a>

                <a href="#" class="menu-item">
                    Konstruksi
                </a>

                <a href="#" class="menu-item">
                    K.I.R
                </a>

            </div>

        </div>



        {{-- NILAI ASET --}}
        <a href="#" class="menu-item">

            <span class="menu-icon">
                <i data-lucide="badge-dollar-sign"></i>
            </span>

            Nilai Aset

        </a>



        {{-- ARSIP --}}
        <a href="#" class="menu-item">

            <span class="menu-icon">
                <i data-lucide="archive"></i>
            </span>

            Arsip

        </a>

    </nav>



    {{-- FOOTER USER --}}
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


            <a href="{{ route('login') }}" class="sidebar-logout">

                <i data-lucide="log-out"></i>

            </a>

        </div>

    </div>

</aside>
