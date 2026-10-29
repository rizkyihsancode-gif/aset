@inject('kibNotificationService', 'App\Services\KibNotificationService')

@php

    /*
    |--------------------------------------------------------------------------
    | K.I.B NOTIFICATION
    |--------------------------------------------------------------------------
    */

    $kibNotification = $kibNotificationService->summary();

    $kibTotalNotification = (int) ($kibNotification['_total'] ?? 0);

    /*
    |--------------------------------------------------------------------------
    | ACTIVE GROUP
    |--------------------------------------------------------------------------
    */

    $masterOpen = request()->is('master-data/*');

    $kibOpen = request()->is('kib/*');

    /*
    |--------------------------------------------------------------------------
    | HELPER BADGE
    |--------------------------------------------------------------------------
    */

    $badgeValue = function ($value) {
        $value = (int) ($value ?? 0);

        if ($value > 99) {
            return '99+';
        }

        return (string) $value;
    };
@endphp


<aside class="sidebar" id="sidebar">

    {{-- ============================================================
         BRAND
    ============================================================= --}}

    <div class="sidebar-brand">

        <img src="{{ asset('images/logo.png') }}" alt="Logo Sistem Aset" class="sidebar-brand-logo">


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


        {{-- ========================================================
             OVERVIEW
        ========================================================= --}}

        <div class="sidebar-section-title">
            OVERVIEW
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
            PENGELOLAAN
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


                {{-- BARANG --}}

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



                {{-- DEPARTEMEN --}}

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



                {{-- DIVISI --}}

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



                {{-- RUANGAN --}}

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



                {{-- SDM --}}

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



                {{-- LOKASI --}}

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



                {{-- BAHAN --}}

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



                {{-- KODE AKTIVA --}}

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


                {{-- TOTAL NOTIFIKASI KIB --}}

                @if ($kibTotalNotification > 0)
                    <span class="sidebar-kib-parent-count"
                        title="{{ number_format($kibTotalNotification, 0, ',', '.') }} data menunggu diproses">

                        {{ $badgeValue($kibTotalNotification) }}

                    </span>
                @endif


                <span class="sidebar-arrow">

                    <i data-lucide="chevron-down"></i>

                </span>

            </button>


            <div class="sidebar-submenu">


                {{-- =================================================
                     TANAH
                ================================================== --}}

                @php

                    $notifTanah = (int) ($kibNotification['tanah']['total'] ?? 0);
                @endphp


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


                    @if ($notifTanah > 0)
                        <span class="sidebar-kib-count"
                            title="{{ number_format($notifTanah, 0, ',', '.') }} data Tanah belum diproses">

                            {{ $badgeValue($notifTanah) }}

                        </span>
                    @endif

                </a>



                {{-- =================================================
                     PERALATAN DAN MESIN
                ================================================== --}}

                @php

                    $notifMesin = (int) ($kibNotification['mesin']['total'] ?? 0);
                @endphp


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


                    @if ($notifMesin > 0)
                        <span class="sidebar-kib-count"
                            title="{{ number_format($notifMesin, 0, ',', '.') }} data Mesin belum diproses">

                            {{ $badgeValue($notifMesin) }}

                        </span>
                    @endif

                </a>



                {{-- =================================================
                     GEDUNG
                ================================================== --}}

                @php

                    $notifGedung = (int) ($kibNotification['gedung']['total'] ?? 0);
                @endphp


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


                    @if ($notifGedung > 0)
                        <span class="sidebar-kib-count"
                            title="{{ number_format($notifGedung, 0, ',', '.') }} data Gedung belum diproses">

                            {{ $badgeValue($notifGedung) }}

                        </span>
                    @endif

                </a>



                {{-- =================================================
                     JALAN
                ================================================== --}}

                @php

                    $notifJalan = (int) ($kibNotification['jalan']['total'] ?? 0);
                @endphp


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


                    @if ($notifJalan > 0)
                        <span class="sidebar-kib-count"
                            title="{{ number_format($notifJalan, 0, ',', '.') }} data Jalan belum diproses">

                            {{ $badgeValue($notifJalan) }}

                        </span>
                    @endif

                </a>



                {{-- =================================================
                     ASET TETAP LAINNYA
                ================================================== --}}

                @php

                    $notifAsetTetap = (int) ($kibNotification['aset_tetap']['total'] ?? 0);
                @endphp


                <a href="{{ url('/kib/aset_ttp') }}"
                    class="
                        sidebar-submenu-item
                        {{ request()->is('kib/aset_ttp  *') ? 'active' : '' }}
                    ">

                    <span class="sidebar-submenu-icon">

                        <i data-lucide="package-open"></i>

                    </span>


                    <span class="sidebar-submenu-text">
                        Aset Tetap Lainnya
                    </span>


                    @if ($notifAsetTetap > 0)
                        <span class="sidebar-kib-count"
                            title="{{ number_format($notifAsetTetap, 0, ',', '.') }} data Aset Tetap belum diproses">

                            {{ $badgeValue($notifAsetTetap) }}

                        </span>
                    @endif

                </a>



                {{-- =================================================
                     KONSTRUKSI
                ================================================== --}}

                @php

                    $notifKonstruksi = (int) ($kibNotification['konstruksi']['total'] ?? 0);
                @endphp


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


                    @if ($notifKonstruksi > 0)
                        <span class="sidebar-kib-count"
                            title="{{ number_format($notifKonstruksi, 0, ',', '.') }} data Konstruksi belum diproses">

                            {{ $badgeValue($notifKonstruksi) }}

                        </span>
                    @endif

                </a>



                {{-- =================================================
                     K.I.R
                ================================================== --}}

                @php

                    $notifKir = (int) ($kibNotification['kir']['total'] ?? 0);
                @endphp


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


                    @if ($notifKir > 0)
                        <span class="sidebar-kib-count"
                            title="{{ number_format($notifKir, 0, ',', '.') }} data K.I.R belum diproses">

                            {{ $badgeValue($notifKir) }}

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



        {{-- LOGOUT --}}


        {{-- ======================================================
     LOGOUT SISTEM ASET
     PERUMDA TIRTA KENCANA KOTA SAMARINDA
====================================================== --}}

        <form id="sidebarLogoutForm" action="{{ route('logout') }}" method="POST" class="sidebar-logout-form">
            @csrf

            <button type="submit" class="sidebar-logout" title="Keluar dari Sistem Aset"
                aria-label="Logout dari Sistem Aset">
                <i data-lucide="log-out"></i>

                <span>Logout</span>
            </button>
        </form>




    </div>

</aside>
