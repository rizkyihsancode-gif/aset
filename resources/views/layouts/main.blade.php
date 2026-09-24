<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>
        @yield('title', 'Sistem Aset') | Sistem Aset
    </title>


    {{-- BOOTSTRAP --}}
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">


    {{-- CSS GLOBAL --}}
    <link rel="stylesheet" href="{{ asset('css/aset.css') }}">


    {{-- CSS PER HALAMAN --}}
    @stack('styles')

</head>


<body>

    <div class="app">


        @include('layouts.sidebar')


        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>


        <main class="main">


            @include('layouts.header')


            @yield('content')


        </main>

    </div>



    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script src="https://unpkg.com/lucide@latest"></script>

    <script src="{{ asset('js/aset.js') }}"></script>


    <script>
        lucide.createIcons();
    </script>


    {{-- JS PER HALAMAN --}}
    @stack('scripts')


</body>

</html>
