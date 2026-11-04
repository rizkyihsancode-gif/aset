@inject('kibNotificationService', 'App\Services\KibNotificationService')

@php
    /*
    |--------------------------------------------------------------------------
    | SISTEM ASET — SIDEBAR
    | PERUMDA TIRTA KENCANA KOTA SAMARINDA
    |--------------------------------------------------------------------------
    | Dropdown Master Data dan K.I.B
    | Hamburger Desktop dan Mobile
    | Penyimpanan kondisi sidebar
    |--------------------------------------------------------------------------
    */

    $kibNotification = $kibNotificationService->summary();

    $kibTotalNotification = (int) ($kibNotification['_total'] ?? 0);

    $masterOpen = request()->is('master-data/*');
    $kibOpen = request()->is('kib/*');

    $badgeValue = function ($value) {
        $value = (int) ($value ?? 0);

        return $value > 99 ? '99+' : (string) $value;
    };

    $notifTanah = (int) ($kibNotification['tanah']['total'] ?? 0);
    $notifMesin = (int) ($kibNotification['mesin']['total'] ?? 0);
    $notifGedung = (int) ($kibNotification['gedung']['total'] ?? 0);
    $notifJalan = (int) ($kibNotification['jalan']['total'] ?? 0);
    $notifAsetTetap = (int) ($kibNotification['aset_tetap']['total'] ?? 0);
    $notifKonstruksi = (int) ($kibNotification['konstruksi']['total'] ?? 0);
    $notifKir = (int) ($kibNotification['kir']['total'] ?? 0);
@endphp


{{-- ============================================================
     SIDEBAR UTAMA
============================================================ --}}

<aside class="sidebar" id="sidebar" aria-label="Navigasi utama Sistem Aset">

    {{-- ========================================================
         BRAND / LOGO
    ========================================================= --}}

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


    {{-- ========================================================
         MENU NAVIGASI
    ========================================================= --}}

    <nav class="sidebar-menu">

        {{-- OVERVIEW --}}

        <div class="sidebar-section-title">
            OVERVIEW
        </div>

        <a href="{{ route('dashboard') }}" class="sidebar-menu-item {{ request()->is('dashboard') ? 'active' : '' }}">

            <span class="sidebar-menu-icon">
                <i data-lucide="house"></i>
            </span>

            <span class="sidebar-menu-text">
                Dashboard
            </span>

        </a>


        {{-- ====================================================
             PENGELOLAAN
        ==================================================== --}}

        <div class="sidebar-section-title">
            PENGELOLAAN
        </div>


        {{-- ====================================================
             MASTER DATA
        ==================================================== --}}

        <div class="sidebar-menu-group {{ $masterOpen ? 'open' : '' }}" id="masterGroup">

            <button type="button" class="sidebar-menu-item sidebar-parent {{ $masterOpen ? 'parent-active' : '' }}"
                data-sidebar-toggle="masterGroup" aria-controls="masterSubmenu"
                aria-expanded="{{ $masterOpen ? 'true' : 'false' }}" aria-label="Buka atau tutup menu Master Data">

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


            <div class="sidebar-submenu" id="masterSubmenu">

                {{-- BARANG --}}

                <a href="{{ url('/master-data/barang') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/barang*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="package"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Barang
                    </span>

                </a>


                {{-- DEPARTEMEN --}}

                <a href="{{ url('/master-data/departemen') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/departemen*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="building-2"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Departemen
                    </span>

                </a>


                {{-- DIVISI --}}

                <a href="{{ url('/master-data/divisi') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/divisi*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="network"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Divisi
                    </span>

                </a>


                {{-- RUANGAN --}}

                <a href="{{ url('/master-data/ruangan') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/ruangan*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="door-open"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Ruangan
                    </span>

                </a>


                {{-- SDM PENDUKUNG --}}

                <a href="{{ url('/master-data/sdm-pendukung') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/sdm-pendukung*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="user-round"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        SDM Pendukung
                    </span>

                </a>


                {{-- LOKASI --}}

                <a href="{{ url('/master-data/lokasi') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/lokasi*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="map-pin"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Lokasi
                    </span>

                </a>


                {{-- BAHAN --}}

                <a href="{{ url('/master-data/bahan') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/bahan*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="component"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Bahan
                    </span>

                </a>


                {{-- KODE AKTIVA --}}

                <a href="{{ url('/master-data/aktiva') }}"
                    class="sidebar-submenu-item {{ request()->is('master-data/aktiva*') ? 'active' : '' }}">

                    <span class="sidebar-submenu-icon">
                        <i data-lucide="badge-check"></i>
                    </span>

                    <span class="sidebar-submenu-text">
                        Kode Aktiva
                    </span>

                </a>

            </div>

        </div>


        {{-- ====================================================
             K.I.B — KARTU INVENTARIS BARANG
        ==================================================== --}}

        <div class="sidebar-menu-group {{ $kibOpen ? 'open' : '' }}" id="kibGroup">

            <button type="button" class="sidebar-menu-item sidebar-parent {{ $kibOpen ? 'parent-active' : '' }}"
                data-sidebar-toggle="kibGroup" aria-controls="kibSubmenu"
                aria-expanded="{{ $kibOpen ? 'true' : 'false' }}" aria-label="Buka atau tutup menu K.I.B">

                <span class="sidebar-menu-icon">
                    <i data-lucide="library"></i>
                </span>

                <span class="sidebar-menu-text">
                    K.I.B
                </span>


                {{-- NOTIFIKASI TOTAL K.I.B --}}

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


            <div class="sidebar-submenu" id="kibSubmenu">

                {{-- K.I.B A — TANAH --}}

                <a href="{{ url('/kib/tanah') }}"
                    class="sidebar-submenu-item {{ request()->is('kib/tanah*') ? 'active' : '' }}">

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


                {{-- K.I.B B — PERALATAN DAN MESIN --}}

                <a href="{{ url('/kib/mesin') }}"
                    class="sidebar-submenu-item {{ request()->is('kib/mesin*') ? 'active' : '' }}">

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


                {{-- K.I.B C — GEDUNG DAN BANGUNAN --}}

                <a href="{{ url('/kib/gedung') }}"
                    class="sidebar-submenu-item {{ request()->is('kib/gedung*') ? 'active' : '' }}">

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


                {{-- K.I.B D — JALAN, IRIGASI, JARINGAN --}}

                <a href="{{ url('/kib/jalan') }}"
                    class="sidebar-submenu-item {{ request()->is('kib/jalan*') ? 'active' : '' }}">

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


                {{-- K.I.B E — ASET TETAP LAINNYA --}}

                <a href="{{ url('/kib/aset_ttp') }}"
                    class="sidebar-submenu-item {{ request()->is('kib/aset_ttp*') ? 'active' : '' }}">

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


                {{-- K.I.B F — KONSTRUKSI --}}

                <a href="{{ url('/kib/konstruksi') }}"
                    class="sidebar-submenu-item {{ request()->is('kib/konstruksi*') ? 'active' : '' }}">

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


                {{-- K.I.R — KARTU INVENTARIS RUANGAN --}}

                <a href="{{ url('/kib/kir') }}"
                    class="sidebar-submenu-item {{ request()->is('kib/kir*') ? 'active' : '' }}">

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


        {{-- ====================================================
             NILAI ASET
        ==================================================== --}}

        <a href="{{ url('/nilai') }}" class="sidebar-menu-item {{ request()->is('nilai*') ? 'active' : '' }}">

            <span class="sidebar-menu-icon">
                <i data-lucide="badge-dollar-sign"></i>
            </span>

            <span class="sidebar-menu-text">
                Nilai Aset
            </span>

        </a>


        {{-- ====================================================
             ARSIP
        ==================================================== --}}

        <a href="{{ url('/arsip') }}" class="sidebar-menu-item {{ request()->is('arsip*') ? 'active' : '' }}">

            <span class="sidebar-menu-icon">
                <i data-lucide="archive"></i>
            </span>

            <span class="sidebar-menu-text">
                Arsip
            </span>

        </a>

    </nav>


    {{-- ========================================================
         FOOTER — INFORMASI PENGGUNA
    ========================================================= --}}

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


        {{-- FORM LOGOUT --}}

        <form id="sidebarLogoutForm" class="sidebar-logout-form" method="POST" action="{{ route('logout') }}">

            @csrf

            <button id="sidebarLogoutButton" type="submit" class="sidebar-logout" title="Keluar dari Sistem Aset"
                aria-label="Keluar dari Sistem Aset">

                <i data-lucide="log-out"></i>

                <span class="sidebar-logout-text">
                    Logout
                </span>

            </button>

        </form>

    </div>

</aside>


{{-- ============================================================
     JAVASCRIPT — SIDEBAR SYSTEM
     Hamburger, Dropdown, Mobile, Desktop, Local Storage
============================================================ --}}

<script>
    (function() {
        'use strict';

        /*
        |--------------------------------------------------------------------------
        | KONFIGURASI
        |--------------------------------------------------------------------------
        */

        const MOBILE_BREAKPOINT = 820;

        const STORAGE_KEY = 'aset-sidebar-collapsed';

        const sidebar = document.getElementById('sidebar');

        if (!sidebar) {
            console.warn(
                'Sistem Aset: Elemen #sidebar tidak ditemukan.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | REFERENSI ELEMEN
        |--------------------------------------------------------------------------
        */

        function getOverlay() {
            return document.getElementById('sidebarOverlay');
        }

        function isMobile() {
            return window.innerWidth <= MOBILE_BREAKPOINT;
        }

        /*
        |--------------------------------------------------------------------------
        | LOCAL STORAGE
        |--------------------------------------------------------------------------
        */

        function getSavedCollapsed() {
            try {
                return localStorage.getItem(STORAGE_KEY) === '1';
            } catch (error) {
                return false;
            }
        }

        function saveCollapsed(value) {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    value ? '1' : '0'
                );
            } catch (error) {
                console.warn(
                    'Status sidebar tidak dapat disimpan.',
                    error
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SINKRONISASI TOMBOL HAMBURGER
        |--------------------------------------------------------------------------
        */

        function updateHamburgerState() {
            const isExpanded = isMobile() ?
                sidebar.classList.contains('open') :
                !document.body.classList.contains(
                    'sidebar-collapsed'
                );

            document.querySelectorAll(
                '.sidebar-toggle, #sidebarToggle, [data-sidebar-hamburger]'
            ).forEach(function(button) {

                button.setAttribute(
                    'aria-expanded',
                    String(isExpanded)
                );

                button.setAttribute(
                    'aria-controls',
                    'sidebar'
                );

                button.setAttribute(
                    'aria-label',
                    isExpanded ?
                    'Tutup sidebar' :
                    'Buka sidebar'
                );

            });
        }

        /*
        |--------------------------------------------------------------------------
        | SINKRONISASI STATUS DROPDOWN
        |--------------------------------------------------------------------------
        */

        function updateDropdownState(group) {
            if (!group) {
                return;
            }

            const button = group.querySelector(
                '[data-sidebar-toggle]'
            );

            if (!button) {
                return;
            }

            const expanded = group.classList.contains('open');

            button.setAttribute(
                'aria-expanded',
                String(expanded)
            );

        }

        /*
        |--------------------------------------------------------------------------
        | MEMBUKA SIDEBAR DESKTOP
        |--------------------------------------------------------------------------
        */

        function expandDesktopSidebar() {
            document.body.classList.remove(
                'sidebar-collapsed'
            );

            saveCollapsed(false);

            updateHamburgerState();
        }

        /*
        |--------------------------------------------------------------------------
        | MENUTUP SIDEBAR MOBILE
        |--------------------------------------------------------------------------
        */

        function closeMobileSidebar() {
            sidebar.classList.remove('open');

            const overlay = getOverlay();

            if (overlay) {
                overlay.classList.remove('show');
            }

            updateHamburgerState();
        }

        /*
        |--------------------------------------------------------------------------
        | FUNGSI UTAMA HAMBURGER
        |--------------------------------------------------------------------------
        |
        | Mobile:
        | - Sidebar open / close
        | - Overlay muncul / hilang
        |
        | Desktop:
        | - Sidebar collapsed / expanded
        | - Status tersimpan di localStorage
        |--------------------------------------------------------------------------
        */

        function toggleSidebar() {

            if (isMobile()) {

                const isOpen = sidebar.classList.toggle(
                    'open'
                );

                const overlay = getOverlay();

                if (overlay) {
                    overlay.classList.toggle(
                        'show',
                        isOpen
                    );
                }

                document.body.classList.remove(
                    'sidebar-collapsed'
                );

                updateHamburgerState();

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | DESKTOP
            |--------------------------------------------------------------------------
            */

            const collapsed = document.body.classList.toggle(
                'sidebar-collapsed'
            );

            saveCollapsed(collapsed);

            sidebar.classList.remove('open');

            const overlay = getOverlay();

            if (overlay) {
                overlay.classList.remove('show');
            }

            updateHamburgerState();
        }

        /*
        |--------------------------------------------------------------------------
        | FUNGSI DROPDOWN MASTER DATA DAN K.I.B
        |--------------------------------------------------------------------------
        */

        function toggleMenu(groupId) {

            const group = document.getElementById(groupId);

            if (!group || !sidebar.contains(group)) {
                console.warn(
                    'Sidebar group tidak ditemukan:',
                    groupId
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | JIKA SIDEBAR DESKTOP SEDANG COLLAPSED
            |--------------------------------------------------------------------------
            */

            const wasCollapsed = !isMobile() &&
                document.body.classList.contains(
                    'sidebar-collapsed'
                );

            if (wasCollapsed) {
                expandDesktopSidebar();
            }

            /*
            |--------------------------------------------------------------------------
            | OPEN / CLOSE DROPDOWN
            |--------------------------------------------------------------------------
            */

            const shouldOpen = wasCollapsed ?
                true :
                !group.classList.contains('open');

            group.classList.toggle(
                'open',
                shouldOpen
            );

            updateDropdownState(group);
        }

        /*
        |--------------------------------------------------------------------------
        | FUNGSI GLOBAL
        |--------------------------------------------------------------------------
        |
        | Kompatibel dengan layout lama:
        |
        | onclick="toggleSidebar()"
        | onclick="toggleMenu('masterGroup')"
        | onclick="toggleMenu('kibGroup')"
        |--------------------------------------------------------------------------
        */

        window.toggleSidebar = toggleSidebar;

        window.toggleMenu = toggleMenu;

        window.closeMobileSidebar = closeMobileSidebar;

        /*
        |--------------------------------------------------------------------------
        | RESTORE STATUS SIDEBAR
        |--------------------------------------------------------------------------
        */

        function restoreSidebarState() {

            if (isMobile()) {

                document.body.classList.remove(
                    'sidebar-collapsed'
                );

                closeMobileSidebar();

                return;
            }

            document.body.classList.toggle(
                'sidebar-collapsed',
                getSavedCollapsed()
            );

            sidebar.classList.remove('open');

            const overlay = getOverlay();

            if (overlay) {
                overlay.classList.remove('show');
            }

            updateHamburgerState();
        }

        /*
        |--------------------------------------------------------------------------
        | SETUP SEMUA DROPDOWN
        |--------------------------------------------------------------------------
        */

        function initializeDropdowns() {

            sidebar.querySelectorAll(
                '.sidebar-menu-group'
            ).forEach(function(group) {

                updateDropdownState(group);

            });

        }

        /*
        |--------------------------------------------------------------------------
        | KLIK HAMBURGER DAN OVERLAY
        |--------------------------------------------------------------------------
        |
        | Event delegation pada capture phase.
        | Menghindari tombol diproses dua kali
        | ketika layout lama memakai onclick.
        |--------------------------------------------------------------------------
        */

        document.addEventListener('click', function(event) {

            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            const hamburger = target.closest(
                '.sidebar-toggle, #sidebarToggle, [data-sidebar-hamburger]'
            );

            if (hamburger) {

                event.preventDefault();

                // Hindari pemanggilan ganda dari onclick lama.
                event.stopImmediatePropagation();

                toggleSidebar();

                return;
            }

            const overlay = target.closest(
                '#sidebarOverlay'
            );

            if (overlay && isMobile()) {

                event.preventDefault();

                event.stopImmediatePropagation();

                closeMobileSidebar();

                return;
            }

            const dropdownButton = target.closest(
                '[data-sidebar-toggle]'
            );

            if (
                dropdownButton &&
                sidebar.contains(dropdownButton)
            ) {

                event.preventDefault();

                event.stopImmediatePropagation();

                const groupId = dropdownButton.getAttribute(
                    'data-sidebar-toggle'
                );

                if (groupId) {
                    toggleMenu(groupId);
                }

            }

        }, true);

        /*
        |--------------------------------------------------------------------------
        | TUTUP SIDEBAR MOBILE SAAT LINK MENU DIKLIK
        |--------------------------------------------------------------------------
        */

        sidebar.addEventListener('click', function(event) {

            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            const link = target.closest('a[href]');

            if (!link || !sidebar.contains(link)) {
                return;
            }

            if (isMobile()) {
                closeMobileSidebar();
            }

        });

        /*
        |--------------------------------------------------------------------------
        | RESTORE KETIKA UKURAN LAYAR BERUBAH
        |--------------------------------------------------------------------------
        */

        let previousMobileState = isMobile();

        window.addEventListener('resize', function() {

            const currentMobileState = isMobile();

            if (currentMobileState !== previousMobileState) {

                previousMobileState = currentMobileState;

                restoreSidebarState();

            } else {

                updateHamburgerState();

            }

        });

        /*
        |--------------------------------------------------------------------------
        | INISIALISASI
        |--------------------------------------------------------------------------
        */

        function initializeSidebar() {

            restoreSidebarState();

            initializeDropdowns();

            updateHamburgerState();

        }

        if (document.readyState === 'loading') {

            document.addEventListener(
                'DOMContentLoaded',
                initializeSidebar, {
                    once: true
                }
            );

        } else {

            initializeSidebar();

        }

    })();
</script>
