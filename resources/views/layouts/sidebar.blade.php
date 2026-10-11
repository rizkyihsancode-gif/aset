@inject('kibNotificationService', 'App\Services\KibNotificationService')

@php

    $kibNotification = $kibNotificationService->summary();

    $kibTotalNotification = (int) ($kibNotification['_total'] ?? 0);

    $masterOpen = request()->is('master-data/*');

    $kibOpen = request()->is('kib/*');
@endphp


<aside class="sidebar" id="sidebar">

    {{-- ============================================================
         BRAND
    ============================================================= --}}

    <div class="sidebar-brand">

        <img src="{{ asset('images/logo.png') }}" alt="Logo Perumda Tirta Kencana" width="50">


        <div class="sidebar-brand-text">

            <strong>
                SISTEM ASET
            </strong>

            <span>
                Perumda Tirta Kencana
            </span>

        </div>

    </div>


    {{-- ============================================================
         MENU
    ============================================================= --}}

    <nav class="sidebar-menu">


        {{-- OVERVIEW --}}

        <div class="sidebar-section-title">
            Overview
        </div>


        <a href="{{ url('/dashboard') }}"
            class="
                sidebar-menu-item
                {{ request()->is('dashboard') ? 'active' : '' }}
            ">

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

        <div class="
                sidebar-menu-group
                {{ $masterOpen ? 'open' : '' }}
            "
            id="masterGroup">

            <button type="button"
                class="
                    sidebar-menu-item
                    sidebar-parent
                    {{ $masterOpen ? 'parent-active' : '' }}
                "
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


                <a href="{{ url('/master-data/barang') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/barang*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="package"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Barang
                    </span>

                </a>


                <a href="{{ url('/master-data/departemen') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/departemen*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="building-2"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Departemen
                    </span>

                </a>


                <a href="{{ url('/master-data/divisi') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/divisi*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="network"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Divisi
                    </span>

                </a>


                <a href="{{ url('/master-data/ruangan') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/ruangan*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="door-open"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Ruangan
                    </span>

                </a>


                <a href="{{ url('/master-data/sdm-pendukung') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/sdm-pendukung*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="user-round"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        SDM Pendukung
                    </span>

                </a>


                <a href="{{ url('/master-data/lokasi') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/lokasi*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Lokasi
                    </span>

                </a>


                <a href="{{ url('/master-data/bahan') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/bahan*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="component"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Bahan
                    </span>

                </a>


                <a href="{{ url('/master-data/aktiva') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('master-data/aktiva*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="badge-check"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Kode Aktiva
                    </span>

                </a>

            </div>

        </div>


        {{-- ========================================================
             K.I.B
        ========================================================= --}}

        <div class="
                sidebar-menu-group
                {{ $kibOpen ? 'open' : '' }}
            "
            id="kibGroup">

            <button type="button"
                class="
                    sidebar-menu-item
                    sidebar-parent
                    {{ $kibOpen ? 'parent-active' : '' }}
                "
                onclick="toggleMenu('kibGroup')">

                <span class="sidebar-menu-icon">
                    <i data-lucide="library"></i>
                </span>


                <span class="sidebar-menu-text">
                    K.I.B
                </span>


                @if ($kibTotalNotification > 0)
                    <span class="sidebar-kib-parent-count"
                        title="{{ number_format($kibTotalNotification, 0, ',', '.') }} data menunggu diproses">

                        {{ $kibTotalNotification > 99 ? '99+' : $kibTotalNotification }}

                    </span>
                @endif


                <span class="sidebar-arrow">
                    <i data-lucide="chevron-down"></i>
                </span>

            </button>


            <div class="sidebar-submenu">


                {{-- TANAH --}}

                <a href="{{ url('/kib/tanah') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/tanah*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="map"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Tanah
                    </span>


                    @if (($kibNotification['tanah']['total'] ?? 0) > 0)
                        <span class="sidebar-kib-count">

                            {{ $kibNotification['tanah']['total'] > 99 ? '99+' : $kibNotification['tanah']['total'] }}

                        </span>
                    @endif

                </a>


                {{-- MESIN --}}

                <a href="{{ url('/kib/mesin') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/mesin*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="settings"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Peralatan & Mesin
                    </span>


                    @if (($kibNotification['mesin']['total'] ?? 0) > 0)
                        <span class="sidebar-kib-count">

                            {{ $kibNotification['mesin']['total'] > 99 ? '99+' : $kibNotification['mesin']['total'] }}

                        </span>
                    @endif

                </a>


                {{-- GEDUNG --}}

                <a href="{{ url('/kib/gedung') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/gedung*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="building-2"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Gedung & Bangunan
                    </span>


                    @if (($kibNotification['gedung']['total'] ?? 0) > 0)
                        <span class="sidebar-kib-count">

                            {{ $kibNotification['gedung']['total'] > 99 ? '99+' : $kibNotification['gedung']['total'] }}

                        </span>
                    @endif

                </a>


                {{-- JALAN --}}

                <a href="{{ url('/kib/jalan') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/jalan*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="route"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Jalan, Irigasi & Jaringan
                    </span>


                    @if (($kibNotification['jalan']['total'] ?? 0) > 0)
                        <span class="sidebar-kib-count">

                            {{ $kibNotification['jalan']['total'] > 99 ? '99+' : $kibNotification['jalan']['total'] }}

                        </span>
                    @endif

                </a>


                {{-- ASET TETAP --}}

                <a href="{{ url('/kib/aset-tetap') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/aset-tetap*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="package-open"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Aset Tetap Lainnya
                    </span>


                    @if (($kibNotification['aset_tetap']['total'] ?? 0) > 0)
                        <span class="sidebar-kib-count">

                            {{ $kibNotification['aset_tetap']['total'] > 99 ? '99+' : $kibNotification['aset_tetap']['total'] }}

                        </span>
                    @endif

                </a>


                {{-- KONSTRUKSI --}}

                <a href="{{ url('/kib/konstruksi') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/konstruksi*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="construction"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Konstruksi
                    </span>


                    @if (($kibNotification['konstruksi']['total'] ?? 0) > 0)
                        <span class="sidebar-kib-count">

                            {{ $kibNotification['konstruksi']['total'] > 99 ? '99+' : $kibNotification['konstruksi']['total'] }}

                        </span>
                    @endif

                </a>


                {{-- KIR --}}

                <a href="{{ url('/kib/kir') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/kir*') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="clipboard-list"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        K.I.R
                    </span>


                    @if (($kibNotification['kir']['total'] ?? 0) > 0)
                        <span class="sidebar-kib-count">

                            {{ $kibNotification['kir']['total'] > 99 ? '99+' : $kibNotification['kir']['total'] }}

                        </span>
                    @endif

                </a>

            </div>

        </div>


        {{-- ========================================================
             NILAI ASET
        ========================================================= --}}

        <a href="{{ url('/nilai') }}"
            class="
                sidebar-menu-item
                {{ request()->is('nilai*') ? 'active' : '' }}
            ">

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

        <a href="{{ url('/arsip') }}"
            class="
                sidebar-menu-item
                {{ request()->is('arsip*') ? 'active' : '' }}
            ">

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


        <a href="{{ url('/logout') }}" class="sidebar-logout"
            onclick="
                event.preventDefault();
                document.getElementById('sidebarLogoutForm').submit();
            ">

            <span>
                <i data-lucide="log-out"></i>
            </span>

            <span class="sidebar-menu-text">
                Logout
            </span>

        </a>


        <form id="sidebarLogoutForm" action="{{ url('/logout') }}" method="POST" hidden>

            @csrf

        </form>

    </div>

</aside>
