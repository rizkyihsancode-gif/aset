<aside class="sidebar" id="sidebar">

    {{-- ============================================================
         BRAND
    ============================================================= --}}
    <div class="sidebar-brand">


        <img src="{{ asset('images/logo.png') }}" alt="Logo Perumda Tirta Kencana" width="45">


        <div class="sidebar-brand-text">
            <strong>SISTEM ASET</strong>
            <span>Perumdam Tirta Kencana</span>
        </div>

    </div>


    {{-- ============================================================
         MENU
    ============================================================= --}}
    <nav class="sidebar-menu">

        <div class="sidebar-section-title">
            Overview
        </div>

        <a href="{{ route('dashboard') }}"
            class="sidebar-menu-item {{ request()->routeIs('dashboard') ? 'active' : '' }}">
            <span class="sidebar-menu-icon">
                <i data-lucide="house"></i>
            </span>

            <span class="sidebar-menu-text">
                Dashboard
            </span>
        </a>


        <div class="sidebar-section-title">
            Pengelolaan
        </div>


        {{-- MASTER DATA --}}
        <div class="sidebar-menu-group {{ request()->routeIs('master.*') ? 'open' : '' }}" id="masterGroup">

            <button type="button"
                class="sidebar-menu-item sidebar-parent {{ request()->routeIs('master.*') ? 'parent-active' : '' }}"
                onclick="toggleMenu('masterGroup')">
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

                <a href="{{ route('master.data_barang') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_barang') ? 'active' : '' }}">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="package"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Barang
                    </span>
                </a>


                <a href="{{ route('master.data_departemen') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_departemen') ? 'active' : '' }}">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="building-2"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Departemen
                    </span>
                </a>


                <a href="{{ route('master.data_divisi') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_divisi') ? 'active' : '' }}">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="network"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Divisi
                    </span>
                </a>


                <a href="{{ route('master.data_ruangan') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_ruangan') ? 'active' : '' }}">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="door-open"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Ruangan
                    </span>
                </a>


                <a href="{{ route('master.data_sdm') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_sdm') ? 'active' : '' }}">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="user-round"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        SDM Pendukung
                    </span>
                </a>


                <a href="{{ route('master.data_lokasi') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_lokasi') ? 'active' : '' }}">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Lokasi
                    </span>
                </a>


                <a href="{{ route('master.data_bahan') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_bahan') ? 'active' : '' }}   ">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="component"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Bahan
                    </span>
                </a>


                <a href="{{ route('master.data_aktiva') }}"
                    class="sidebar-submenu-item {{ request()->routeIs('master.data_aktiva') ? 'active' : '' }}">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="badge-check"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Kode Aktiva
                    </span>
                </a>

            </div>
        </div>


        {{-- K.I.B --}}
        <div class="sidebar-menu-group {{ request()->routeIs('kib.*') ? 'open' : '' }}" id="kibGroup">

            <button type="button"
                class="sidebar-menu-item sidebar-parent {{ request()->routeIs('kib.*') ? 'parent-active' : '' }}"
                onclick="toggleMenu('kibGroup')">
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

                    <span class="sidebar-submenu-text">
                        Tanah
                    </span>
                </a>


                <a href="#" class="sidebar-submenu-item">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="settings"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Peralatan &amp; Mesin
                    </span>
                </a>


                <a href="#" class="sidebar-submenu-item">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="building-2"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Gedung &amp; Bangunan
                    </span>
                </a>


                <a href="#" class="sidebar-submenu-item">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="route"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Jalan, Irigasi &amp; Jaringan
                    </span>
                </a>


                <a href="#" class="sidebar-submenu-item">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="package-open"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Aset Tetap Lainnya
                    </span>
                </a>


                <a href="#" class="sidebar-submenu-item">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="construction"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Konstruksi
                    </span>
                </a>


                <a href="#" class="sidebar-submenu-item">
                    <span class="sidebar-submenu-icon">
                        <i data-lucide="clipboard-list"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        K.I.R
                    </span>
                </a>

            </div>
        </div>


        <a href="{{ route('main.nilai') }}"
            class="sidebar-menu-item {{ request()->routeIs('main.nilai') ? 'active' : '' }}">
            <span class="sidebar-menu-icon">
                <i data-lucide="badge-dollar-sign"></i>
            </span>

            <span class="sidebar-menu-text">
                Nilai Aset
            </span>
        </a>


        <a href="{{ route('main.arsip') }}"
            class="sidebar-menu-item {{ request()->routeIs('main.arsip') ? 'active' : '' }}">
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
                <strong>Administrator</strong>
                <span>Super Admin</span>
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
