<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>
        @yield('title', 'Sistem Aset') | Sistem Aset
    </title>


    {{-- ========================================================
         BOOTSTRAP
    ========================================================= --}}

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">


    {{-- ========================================================
         CSS GLOBAL SISTEM ASET

         Menggunakan filemtime agar browser tidak terus
         menggunakan versi lama setelah ada perubahan.
    ========================================================= --}}

    <link rel="stylesheet" href="{{ asset('css/aset.css') }}?v={{ filemtime(public_path('css/aset.css')) }}">


    {{-- ========================================================
         CSS NOTIFIKASI PENDING K.I.B
    ========================================================= --}}

    <link rel="stylesheet"
        href="{{ asset('css/components/kib-notification.css') }}?v={{ file_exists(public_path('css/components/kib-notification.css')) ? filemtime(public_path('css/components/kib-notification.css')) : '1' }}">


    {{-- ========================================================
         CSS PER HALAMAN

         Contoh:
         - Dashboard
         - Nilai Aset
         - K.I.B Tanah
         - K.I.B Mesin
         - K.I.B Gedung
         - K.I.B Aset Tetap Lainnya
    ========================================================= --}}

    @stack('styles')


    {{-- ========================================================
         CSS LOGOUT KHUSUS

         Dimuat PALING AKHIR agar tidak tertimpa
         oleh Bootstrap atau stylesheet halaman.
    ========================================================= --}}

    <link rel="stylesheet"
        href="{{ asset('css/components/sidebar-logout.css') }}?v={{ filemtime(public_path('css/components/sidebar-logout.css')) }}">

</head>


<body>

    {{-- ========================================================
         APLIKASI UTAMA
    ========================================================= --}}

    <div class="app">

        {{-- SIDEBAR --}}

        @include('layouts.sidebar')


        {{-- OVERLAY SIDEBAR MOBILE --}}

        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>


        {{-- ====================================================
             KONTEN UTAMA
        ==================================================== --}}

        <main class="main">

            {{-- HEADER / TOPBAR --}}

            @include('layouts.header')


            {{-- CONTENT HALAMAN --}}

            @yield('content')

        </main>

    </div>


    {{-- ========================================================
         MODAL NOTIFIKASI PENDING K.I.B

         Hanya satu include agar tidak menghasilkan
         ID elemen HTML duplikat.
    ========================================================= --}}

    @include('components.kib.pending-modal')


    {{-- ========================================================
         BOOTSTRAP JAVASCRIPT
    ========================================================= --}}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>


    {{-- ========================================================
         LUCIDE ICONS
    ========================================================= --}}

    <script src="https://unpkg.com/lucide@latest"></script>


    {{-- ========================================================
         JAVASCRIPT GLOBAL

         Menggunakan versi otomatis sesuai waktu perubahan.
    ========================================================= --}}

    <script src="{{ asset('js/aset.js') }}?v={{ filemtime(public_path('js/aset.js')) }}"></script>


    {{-- ========================================================
         JAVASCRIPT NOTIFIKASI K.I.B
    ========================================================= --}}

    <script
        src="{{ asset('js/components/kib-notification.js') }}?v={{ file_exists(public_path('js/components/kib-notification.js')) ? filemtime(public_path('js/components/kib-notification.js')) : '1' }}">
    </script>


    {{-- ========================================================
         JAVASCRIPT PER HALAMAN

         Hanya SATU pemanggilan @stack('scripts').
         Mencegah script halaman dimuat dua kali.
    ========================================================= --}}

    @stack('scripts')


    {{-- ========================================================
         AKTIVASI IKON LUCIDE
    ========================================================= --}}

    <script>
        document.addEventListener(
            'DOMContentLoaded',
            function() {
                if (
                    window.lucide &&
                    typeof window.lucide.createIcons === 'function'
                ) {
                    window.lucide.createIcons();
                }
            }
        );
    </script>


    {{-- ========================================================
         FOOTER LAYOUT
    ========================================================= --}}

    @include('layouts.footer')

</body>

</html>
