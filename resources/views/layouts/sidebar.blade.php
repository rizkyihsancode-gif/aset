<aside class="sidebar" id="sidebar">

    {{-- =====================================================
         BRAND
    ====================================================== --}}

    <div class="brand">

        <img src="{{ asset('images/logo.png') }}" alt="Logo" width="45">

        <div>

            <div class="brand-title">
                Sistem Aset
            </div>

            <div class="brand-subtitle">
                Perumda Tirta Kencana
            </div>

        </div>
        {{-- <div class="flex items-center justify-center h-16">
            <img src="{{ asset('images/logo_hr.png') }}" alt="Logo" width="300">
        </div> --}}

    </div>



    {{-- =====================================================
         MENU
    ====================================================== --}}

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



        {{-- =================================================
             MASTER DATA
        ================================================== --}}

        <div class="menu-group" id="masterGroup">

            <button type="button" class="menu-item menu-parent" onclick="toggleMenu('masterGroup')">

                <span class="menu-icon">
                    <i data-lucide="database"></i>
                </span>

                <span class="menu-text">
                    Master Data
                </span>

                <span class="menu-arrow">
                    <i data-lucide="chevron-right"></i>
                </span>

            </button>


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



        {{-- =================================================
             K.I.B
        ================================================== --}}

        <div class="menu-group" id="kibGroup">

            <button type="button" class="menu-item menu-parent" onclick="toggleMenu('kibGroup')">

                <span class="menu-icon">
                    <i data-lucide="library"></i>
                </span>

                <span class="menu-text">
                    K.I.B
                </span>

                <span class="menu-arrow">
                    <i data-lucide="chevron-right"></i>
                </span>

            </button>


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
        <a href="{{ route('main.nilai') }}"class="menu-item{{ request()->routeIs('main.nilai') ? 'active' : '' }}">

            <span class="menu-icon">
                <i data-lucide="badge-dollar-sign"></i>
            </span>

            <span class="menu-text">
                Nilai Aset
            </span>

        </a>




        {{-- ARSIP --}}
        <a href="{{ route('main.arsip') }}"class="menu-item{{ request()->routeIs('main.arsip') ? 'active' : '' }}">

            <span class="menu-icon">
                <i data-lucide="archive"></i>
            </span>

            <span class="menu-text">
                Arsip
            </span>

        </a>

    </nav>



    {{-- =====================================================
         SIDEBAR FOOTER
    ====================================================== --}}

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
