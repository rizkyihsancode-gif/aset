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
                {{ \Illuminate\Support\Str::upper(\Illuminate\Support\Str::substr((string) auth('web')->user()?->name, 0, 1)) }}
            </div>


            <div class="header-user-info" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis;">

                <strong class="text-truncate" title="{{ auth('web')->user()?->name }}">
                    {{ auth('web')->user()?->name }}
                </strong>

                <span>
                    {{ app(\App\Services\AsetAccessService::class)->label(request()->attributes->get('aset_access', ['role' => null, 'active' => false, 'modules' => []])) }}
                </span>

            </div>


            <div class="header-user-arrow">

                <i data-lucide="chevron-down"></i>

            </div>

        </div>


    </div>

</header>
