<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>
        @yield('title', 'Sistem Aset') | Sistem Aset
    </title>


    {{-- Bootstrap --}}
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">


    {{-- CSS Sistem Aset --}}
    <link rel="stylesheet" href="{{ asset('css/aset.css') }}">


    {{-- CSS khusus halaman --}}
    @stack('styles')

</head>


<body>

    <div class="app">

        {{-- SIDEBAR --}}
        @include('layouts.sidebar')


        {{-- Overlay mobile --}}
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>


        {{-- AREA UTAMA --}}
        <main class="main">

            {{-- HEADER / TOPBAR --}}
            @include('layouts.header')


            {{-- ISI HALAMAN --}}
            @yield('content')

        </main>

    </div>



    {{-- Bootstrap --}}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>


    {{-- Lucide Icon --}}
    <script src="https://unpkg.com/lucide@latest"></script>


    {{-- JS Sistem Aset --}}
    <script src="{{ asset('js/aset.js') }}"></script>


    <script>
        lucide.createIcons();
    </script>


    {{-- Script khusus halaman --}}
    @stack('scripts')

</body>

</html>
