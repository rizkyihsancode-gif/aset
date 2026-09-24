<header class="topbar">

    {{-- ============================================================
         LEFT
    ============================================================= --}}
    <div class="topbar-left">

        {{-- SIDEBAR TOGGLE --}}
        <button type="button" class="sidebar-toggle" onclick="toggleSidebar()" title="Buka / Tutup Sidebar">
            <i data-lucide="menu"></i>
        </button>


        {{-- SEARCH --}}
        <div class="header-search">

            <i data-lucide="search"></i>

            <input type="text" placeholder="Cari aset, lokasi, dokumen, atau menu...">

        </div>

    </div>



    {{-- ============================================================
         RIGHT
    ============================================================= --}}
    <div class="topbar-right">


        {{-- NOTIFICATION --}}
        <button type="button" class="topbar-action" title="Notifikasi">

            <i data-lucide="bell"></i>

            <span class="notification-dot"></span>

        </button>



        {{-- USER --}}
        <div class="header-user">

            <div class="header-avatar">
                A
            </div>


            <div class="header-user-info">

                <strong>
                    Administrator
                </strong>

                <span>
                    Super Admin
                </span>

            </div>


            <div class="header-user-arrow">

                <i data-lucide="chevron-down"></i>

            </div>

        </div>


    </div>

</header>
