<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="csrf-token"
        content="{{ csrf_token() }}"
    >

    <title>
        @yield('title', 'Sistem Aset')
        | Sistem Aset
    </title>


    {{-- ======================================================
         CSS GLOBAL
    ======================================================= --}}

    <link
        rel="stylesheet"
        href="{{ asset('css/app.css') }}"
    >

    <link
        rel="stylesheet"
        href="{{ asset('css/aset.css') }}"
    >


    {{-- CSS TAMBAHAN PER HALAMAN --}}
    @stack('styles')

</head>


<body>

<div class="app">


    {{-- ======================================================
         SIDEBAR
    ======================================================= --}}

    @include('layouts.sidebar')



    {{-- OVERLAY MOBILE --}}
    <div
        class="sidebar-overlay"
        id="sidebarOverlay"
        onclick="toggleSidebar()"
    ></div>



    {{-- ======================================================
         MAIN AREA
    ======================================================= --}}

    <main class="main">


        {{-- TOPBAR --}}
        @include('layouts.topbar')



        {{-- ==================================================
             ISI HALAMAN
        =================================================== --}}

        @yield('content')


    </main>


</div>



{{-- ==========================================================
     LIBRARY GLOBAL
========================================================== --}}

<script src="https://unpkg.com/lucide@latest"></script>



<script>

    /*
    |--------------------------------------------------------------------------
    | Lucide Icons
    |--------------------------------------------------------------------------
    */

    lucide.createIcons();



    /*
    |--------------------------------------------------------------------------
    | Sidebar Mobile
    |--------------------------------------------------------------------------
    */

    function toggleSidebar() {

        const sidebar =
            document.getElementById('sidebar');

        const overlay =
            document.getElementById('sidebarOverlay');


        sidebar.classList.toggle('open');

        overlay.classList.toggle('show');

    }



    /*
    |--------------------------------------------------------------------------
    | Sidebar Dropdown
    |--------------------------------------------------------------------------
    */

    function toggleMenu(id) {

        const menu =
            document.getElementById(id);

        menu.classList.toggle('open');

    }

</script>



{{-- SCRIPT TAMBAHAN PER HALAMAN --}}
@stack('scripts')


</body>
</html>