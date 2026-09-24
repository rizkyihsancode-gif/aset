<aside class="sidebar" id="sidebar">

    {{-- ============================================================
         BRAND
    ============================================================= --}}
    <div class="sidebar-brand">

        {{-- <div class="sidebar-brand-logo">

            <i data-lucide="droplets"></i>

        </div> --}}



        <img src="{{ asset('images/logo.png') }}" alt="Logo Perumdam Tirta Kencana" width="50">


        <div class="sidebar-brand-text">

            <strong>
                SISTEM ASET
            </strong>

            <span>
                Perumdam Tirta Kencana
            </span>

        </div>

    </div>



    {{-- ============================================================
         MENU
    ============================================================= --}}
    <nav class="sidebar-menu">


        {{-- ========================================================
             OVERVIEW
        ========================================================= --}}
        <div class="sidebar-section-title">
            Overview
        </div>


        <a href="{{ route('dashboard') }}"
            class="sidebar-menu-item
                {{ request()->routeIs('dashboard') ? 'active' : '' }}">

            <span class="sidebar-menu-icon">

                <i data-lucide="house"></i>

            </span>


            <span class="sidebar-menu-text">
                Dashboard
            </span>

        </a>



        {{-- ========================================================
             PENGELOLAAN
        ========================================================= --}}
        <div class="sidebar-section-title">
            Pengelolaan
        </div>



        {{-- ========================================================
             MASTER DATA
        ========================================================= --}}
        <div class="sidebar-menu-group" id="masterGroup">

            <button type="button" class="sidebar-menu-item sidebar-parent" onclick="toggleMenu('masterGroup')">

                <span class="sidebar-menu-icon">

                    <i data-lucide="database"></i>

                </span>


                <span class="sidebar-menu-text">
                    Master Data
                </span>


                <span class="sidebar-arrow">

                    <i data-lucide="chevron-down"></i>

                </span>

            </button>



            <div class="sidebar-submenu">


                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="package"></i>
                    </span>

                    <span>
                        Barang
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="building"></i>
                    </span>

                    <span>
                        Departemen
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="network"></i>
                    </span>

                    <span>
                        Divisi
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="door-open"></i>
                    </span>

                    <span>
                        Ruangan
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="user-round"></i>
                    </span>

                    <span>
                        SDM Pendukung
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <span>
                        Lokasi
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="boxes"></i>
                    </span>

                    <span>
                        Bahan
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="badge-check"></i>
                    </span>

                    <span>
                        Kode Aktiva
                    </span>

                </a>


            </div>

        </div>



        {{-- ========================================================
             K.I.B
        ========================================================= --}}
        <div class="sidebar-menu-group" id="kibGroup">

            <button type="button" class="sidebar-menu-item sidebar-parent" onclick="toggleMenu('kibGroup')">

                <span class="sidebar-menu-icon">

                    <i data-lucide="library"></i>

                </span>


                <span class="sidebar-menu-text">
                    K.I.B
                </span>


                <span class="sidebar-arrow">

                    <i data-lucide="chevron-down"></i>

                </span>

            </button>



            <div class="sidebar-submenu">


                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="map"></i>
                    </span>

                    <span>
                        Tanah
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="settings"></i>
                    </span>

                    <span>
                        Peralatan & Mesin
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="building-2"></i>
                    </span>

                    <span>
                        Gedung & Bangunan
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="route"></i>
                    </span>

                    <span>
                        Jalan, Irigasi & Jaringan
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="package-open"></i>
                    </span>

                    <span>
                        Aset Tetap Lainnya
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="construction"></i>
                    </span>

                    <span>
                        Konstruksi
                    </span>

                </a>



                <a href="#" class="sidebar-submenu-item">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="clipboard-list"></i>
                    </span>

                    <span>
                        K.I.R
                    </span>

                </a>


            </div>

        </div>



        {{-- ========================================================
             NILAI ASET
        ========================================================= --}}
        <a href="{{ route('main.nilai') }}"
            class="sidebar-menu-item
                {{ request()->routeIs('main.nilai') ? 'active' : '' }}">

            <span class="sidebar-menu-icon">

                <i data-lucide="badge-dollar-sign"></i>

            </span>


            <span class="sidebar-menu-text">
                Nilai Aset
            </span>

        </a>



        {{-- ========================================================
             ARSIP
        ========================================================= --}}
        <a href="{{ route('main.arsip') }}"
            class="sidebar-menu-item
                {{ request()->routeIs('main.arsip') ? 'active' : '' }}">

            <span class="sidebar-menu-icon">

                <i data-lucide="archive"></i>

            </span>


            <span class="sidebar-menu-text">
                Arsip
            </span>

        </a>


    </nav>



    {{-- ============================================================
         FOOTER
    ============================================================= --}}
    <div class="sidebar-footer">


        <div class="sidebar-user-card">


            <div class="sidebar-user-avatar">

                <i data-lucide="user"></i>

            </div>


            <div class="sidebar-user-info">

                <strong>
                    Administrator
                </strong>

                <span>
                    Super Admin
                </span>

            </div>


        </div>



        <a href="{{ route('login') }}" class="sidebar-logout">

            <span>

                <i data-lucide="log-out"></i>

            </span>


            <span class="sidebar-menu-text">
                Logout
            </span>

        </a>


    </div>


</aside>
