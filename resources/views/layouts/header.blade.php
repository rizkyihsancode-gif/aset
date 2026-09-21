<header class="topbar">

    <div class="topbar-left">

        <button class="mobile-menu" onclick="toggleSidebar()" type="button">

            <i data-lucide="menu"></i>

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

        <button class="top-action" type="button">

            <i data-lucide="search"></i>

        </button>


        <button class="top-action" type="button">

            <i data-lucide="bell"></i>

            <span class="notification-dot"></span>

        </button>

    </div>

</header>
