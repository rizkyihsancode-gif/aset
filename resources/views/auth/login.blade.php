<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>
        Login | Sistem Aset
    </title>


    {{-- ============================================================
         BOOTSTRAP
    ============================================================= --}}
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">


    {{-- ============================================================
         LOGIN CSS
    ============================================================= --}}
    <link rel="stylesheet" href="{{ asset('css/pages/login.css') }}">

</head>


<body>


    <div class="login-page">


        {{-- ============================================================
         LEFT SECTION
    ============================================================= --}}
        <section class="login-information">

            {{-- BRAND --}}
            <div class="login-brand">
                <img src="{{ asset('images/logo_hr.png') }}" alt="Logo Sistem Aset" width="250" height="auto">


                {{-- <div class="login-brand-text">

                    <strong>
                        Sistem Aset
                    </strong>

                    <span>
                        Perumdam Tirta Kencana
                    </span>

                </div> --}}

            </div>

            <div class="login-hero-content">


                {{-- =====================================================
                 HERO TITLE
            ====================================================== --}}
                <div class="hero-heading">

                    <h1>
                        Tata Kelola Aset yang Lebih Modern
                    </h1>

                    <h2>
                        Terintegrasi, Tertib, dan Profesional
                    </h2>

                </div>



                {{-- =====================================================
                 DESCRIPTION
            ====================================================== --}}
                <p class="hero-description">

                    Sistem Aset membantu pengelolaan data master,
                    KIB, nilai aset, dan arsip secara terintegrasi
                    untuk mendukung operasional internal
                    Perumdam Tirta Kencana.

                </p>



                {{-- =====================================================
                 FEATURE GLASS PANEL
            ====================================================== --}}
                <div class="feature-glass-panel">


                    {{-- FEATURE 1 --}}
                    <div class="login-feature feature-blue">

                        <div class="login-feature-icon">

                            <i data-lucide="database"></i>

                        </div>


                        <div class="login-feature-content">

                            <strong>
                                Master Data
                            </strong>

                            <span>
                                Terpusat
                            </span>

                        </div>

                    </div>



                    {{-- FEATURE 2 --}}
                    <div class="login-feature feature-cyan">

                        <div class="login-feature-icon">

                            <i data-lucide="chart-no-axes-column-increasing"></i>

                        </div>


                        <div class="login-feature-content">

                            <strong>
                                Monitoring
                            </strong>

                            <span>
                                Nilai Aset
                            </span>

                        </div>

                    </div>



                    {{-- FEATURE 3 --}}
                    <div class="login-feature feature-purple">

                        <div class="login-feature-icon">

                            <i data-lucide="notebook-tabs"></i>

                        </div>


                        <div class="login-feature-content">

                            <strong>
                                Kartu Inventaris
                            </strong>

                            <span>
                                Barang
                            </span>

                        </div>

                    </div>



                    {{-- FEATURE 4 --}}
                    <div class="login-feature feature-green">

                        <div class="login-feature-icon">

                            <i data-lucide="folder-closed"></i>

                        </div>


                        <div class="login-feature-content">

                            <strong>
                                Arsip
                            </strong>

                            <span>
                                Terdokumentasi
                            </span>

                        </div>

                    </div>


                </div>


            </div>


        </section>



        {{-- ============================================================
         RIGHT SECTION
    ============================================================= --}}
        <section class="login-form-area">


            <div class="login-card">


                {{-- =====================================================
                 MOBILE BRAND
            ====================================================== --}}
                <div class="mobile-brand">

                    <div class="mobile-brand-logo">

                        <i data-lucide="droplets"></i>

                    </div>


                    <div class="mobile-brand-content">

                        <strong>
                            Sistem Aset
                        </strong>

                        <span>
                            Perumdam Tirta Kencana
                        </span>

                    </div>

                </div>



                {{-- =====================================================
                 LOGIN HEADER
            ====================================================== --}}
                <div class="login-heading">

                    <span class="welcome-text">
                        Welcome Back
                    </span>


                    <h1>
                        Login Sistem Aset
                    </h1>


                    <p>
                        Masuk untuk mengakses pengelolaan aset internal
                        Perumdam Tirta Kencana.
                    </p>

                </div>



                {{-- =====================================================
                 VALIDATION ERROR
            ====================================================== --}}
                @if ($errors->any())

                    <div class="login-alert">

                        <i data-lucide="circle-alert"></i>


                        <div>

                            @foreach ($errors->all() as $error)
                                <p>
                                    {{ $error }}
                                </p>
                            @endforeach

                        </div>

                    </div>

                @endif



                {{-- =====================================================
                 LOGIN FORM
            ====================================================== --}}
                <form action="{{ route('login.submit') }}" method="POST">

                    @csrf



                    {{-- =================================================
                     EMAIL
                ================================================== --}}
                    <div class="form-group">

                        <label for="email" class="form-label-login">
                            Email
                        </label>


                        <div class="input-container">


                            <span class="input-icon">

                                <i data-lucide="mail"></i>

                            </span>


                            <input type="email" id="email" name="email" class="login-input"
                                value="{{ old('email') }}" placeholder="nama@perumdamtirtakencana.co.id"
                                autocomplete="email" required autofocus>


                        </div>

                    </div>



                    {{-- =================================================
                     PASSWORD
                ================================================== --}}
                    <div class="form-group">

                        <label for="password" class="form-label-login">
                            Password
                        </label>


                        <div class="input-container">


                            <span class="input-icon">

                                <i data-lucide="lock-keyhole"></i>

                            </span>


                            <input type="password" id="password" name="password" class="login-input"
                                placeholder="Masukkan password" autocomplete="current-password" required>



                            <button type="button" class="password-button" id="passwordToggle"
                                onclick="togglePassword()" aria-label="Tampilkan password" title="Lihat password">

                                <i data-lucide="eye"></i>

                            </button>


                        </div>

                    </div>



                    {{-- =================================================
                     OPTIONS
                ================================================== --}}
                    <div class="login-options">


                        <label class="remember-me">

                            <input type="checkbox" name="remember" value="1">

                            <span>
                                Ingat saya
                            </span>

                        </label>



                        <a href="#" class="forgot-password">
                            Lupa password?
                        </a>


                    </div>



                    {{-- =================================================
                     LOGIN BUTTON
                ================================================== --}}
                    <button type="submit" class="login-button" id="loginButton">

                        <span>
                            Masuk
                        </span>


                        <i data-lucide="arrow-right"></i>

                    </button>


                </form>



                {{-- =====================================================
                 FOOTER
            ====================================================== --}}
                <div class="login-footer">

                    <span></span>


                    <p>
                        © {{ date('Y') }} Perumdam Tirta Kencana
                    </p>


                    <span></span>

                </div>


            </div>


        </section>


    </div>



    {{-- ================================================================
     LUCIDE ICON
================================================================ --}}
    <script src="https://unpkg.com/lucide@latest"></script>


    {{-- ================================================================
     LOGIN JS
================================================================ --}}
    <script src="{{ asset('js/pages/login.js') }}"></script>


    <script>
        lucide.createIcons();
    </script>


</body>

</html>
