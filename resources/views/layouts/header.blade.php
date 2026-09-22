<header class="topbar">

    <div class="topbar-left">

        {{-- SIDEBAR TOGGLE --}}
        <button type="button" class="sidebar-toggle" onclick="toggleSidebar()" title="Buka / Tutup Sidebar">
            <i data-lucide="panel-left"></i>
        </button>


        <div class="page-title">

            <h1>
                @yield('page-title', 'Dashboard')
            </h1>

            <p>
                @yield('page-description', 'Sistem Informasi Manajemen Aset')
            </p>

        </div>

    </div>


    <div class="topbar-right">

        <button type="button" class="top-action" title="Pencarian">
            <i data-lucide="search"></i>
        </button>


        <button type="button" class="top-action" title="Notifikasi">
            <i data-lucide="bell"></i>

            <span class="notification-dot"></span>
        </button>


        <div class="header-user">

            <div class="header-avatar">
                A
            </div>

            <div class="header-user-info">
                <strong>Administrator</strong>
                <span>Super Admin</span>
            </div>

        </div>

    </div>

</header>
