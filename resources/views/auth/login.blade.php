<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login | Sistem Informasi Manajemen Aset</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #0b63ce;
            --primary-dark: #074f9f;
            --primary-darker: #043d7c;

            --text: #172033;
            --muted: #7d8999;

            --border: #e3e9f0;
            --surface: #ffffff;

            --bg: #f5f7fb;
        }

        html,
        body {
            min-height: 100%;
        }

        body {
            min-height: 100vh;

            font-family:
                Inter,
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

            background:
                radial-gradient(circle at top right,
                    rgba(11, 99, 206, .07),
                    transparent 30%),
                #f5f7fb;

            color: var(--text);

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 28px;
        }

        button,
        input {
            font: inherit;
        }

        a {
            text-decoration: none;
        }

        /* =========================================================
           WRAPPER
        ========================================================= */

        .login-container {
            width: 100%;
            max-width: 1080px;

            min-height: 620px;

            display: grid;
            grid-template-columns: 1.05fr .95fr;

            background: #ffffff;

            border: 1px solid rgba(222, 229, 238, .9);

            border-radius: 22px;

            overflow: hidden;

            box-shadow:
                0 25px 70px rgba(32, 48, 70, .10);
        }

        /* =========================================================
           LEFT PANEL
        ========================================================= */

        .login-visual {
            position: relative;

            padding: 48px;

            color: white;

            overflow: hidden;

            background:
                linear-gradient(145deg,
                    #0b63ce 0%,
                    #0754ad 48%,
                    #043d7c 100%);

            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .login-visual::before {
            content: "";

            position: absolute;

            width: 420px;
            height: 420px;

            border-radius: 50%;

            background:
                rgba(255, 255, 255, .055);

            right: -210px;
            top: -170px;
        }

        .login-visual::after {
            content: "";

            position: absolute;

            width: 280px;
            height: 280px;

            border: 50px solid rgba(255, 255, 255, .04);

            border-radius: 50%;

            left: -150px;
            bottom: -170px;
        }

        .visual-top,
        .visual-bottom {
            position: relative;
            z-index: 2;
        }

        /* BRAND */

        .brand {
            display: flex;
            align-items: center;

            gap: 12px;

            margin-bottom: 65px;
        }

        .brand-icon {
            width: 45px;
            height: 45px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: white;

            background:
                rgba(255, 255, 255, .14);

            border:
                1px solid rgba(255, 255, 255, .15);

            backdrop-filter: blur(10px);
        }

        .brand-icon svg {
            width: 22px;
            height: 22px;

            stroke-width: 1.8;
        }

        .brand-text strong {
            display: block;

            font-size: 15px;

            font-weight: 700;
        }

        .brand-text span {
            display: block;

            margin-top: 2px;

            font-size: 10px;

            opacity: .66;

            letter-spacing: .6px;
        }

        /* HERO */

        .hero-label {
            display: inline-flex;
            align-items: center;

            gap: 7px;

            padding: 6px 10px;

            margin-bottom: 18px;

            border-radius: 20px;

            background:
                rgba(255, 255, 255, .11);

            border:
                1px solid rgba(255, 255, 255, .12);

            font-size: 10px;

            text-transform: uppercase;

            letter-spacing: 1px;

            font-weight: 650;
        }

        .hero-label span {
            width: 6px;
            height: 6px;

            background: #86efac;

            border-radius: 50%;
        }

        .visual-top h1 {
            max-width: 440px;

            font-size: 36px;

            line-height: 1.18;

            letter-spacing: -.8px;

            margin-bottom: 18px;
        }

        .visual-top>p {
            max-width: 450px;

            font-size: 14px;

            line-height: 1.8;

            color:
                rgba(255, 255, 255, .75);
        }

        /* FEATURES */

        .asset-features {
            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 11px;

            margin-top: 38px;
        }

        .asset-feature {
            display: flex;
            align-items: center;

            gap: 10px;

            padding: 12px 13px;

            border-radius: 11px;

            background:
                rgba(255, 255, 255, .08);

            border:
                1px solid rgba(255, 255, 255, .08);
        }

        .asset-feature-icon {
            width: 29px;
            height: 29px;

            min-width: 29px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 8px;

            background:
                rgba(255, 255, 255, .10);
        }

        .asset-feature-icon svg {
            width: 14px;
            height: 14px;
        }

        .asset-feature span {
            font-size: 10.5px;

            line-height: 1.3;

            color:
                rgba(255, 255, 255, .84);
        }

        /* FOOTER LEFT */

        .visual-bottom {
            margin-top: 45px;

            padding-top: 18px;

            border-top:
                1px solid rgba(255, 255, 255, .11);

            display: flex;
            justify-content: space-between;
            align-items: center;

            gap: 20px;
        }

        .company-name {
            font-size: 10px;

            font-weight: 650;

            text-transform: uppercase;

            letter-spacing: 1px;

            color:
                rgba(255, 255, 255, .65);
        }

        .system-status {
            display: flex;
            align-items: center;

            gap: 6px;

            font-size: 9px;

            color:
                rgba(255, 255, 255, .55);
        }

        .system-status span {
            width: 6px;
            height: 6px;

            border-radius: 50%;

            background: #86efac;
        }

        /* =========================================================
           RIGHT PANEL
        ========================================================= */

        .login-form-panel {
            padding: 60px 64px;

            display: flex;
            flex-direction: column;
            justify-content: center;

            background: white;
        }

        .mobile-brand {
            display: none;

            margin-bottom: 32px;
        }

        .login-heading {
            margin-bottom: 32px;
        }

        .login-heading span {
            display: block;

            margin-bottom: 8px;

            font-size: 10px;

            color: var(--primary);

            font-weight: 750;

            text-transform: uppercase;

            letter-spacing: 1.1px;
        }

        .login-heading h2 {
            font-size: 27px;

            letter-spacing: -.5px;

            color: #172033;

            margin-bottom: 8px;
        }

        .login-heading p {
            font-size: 12px;

            color: #8a95a5;

            line-height: 1.55;
        }

        /* ALERT */

        .alert-error {
            display: flex;

            gap: 9px;

            padding: 11px 12px;

            margin-bottom: 20px;

            border-radius: 9px;

            color: #b42318;

            background: #fff1f0;

            border: 1px solid #ffd8d5;

            font-size: 11px;

            line-height: 1.5;
        }

        .alert-error svg {
            width: 16px;
            height: 16px;

            flex-shrink: 0;

            margin-top: 1px;
        }

        /* FORM */

        .form-group {
            margin-bottom: 18px;
        }

        .form-label {
            display: block;

            margin-bottom: 7px;

            font-size: 11px;

            font-weight: 650;

            color: #3d4858;
        }

        .input-wrapper {
            position: relative;
        }

        .input-icon {
            position: absolute;

            left: 14px;
            top: 50%;

            transform: translateY(-50%);

            width: 18px;
            height: 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #98a4b3;
        }

        .input-icon svg {
            width: 16px;
            height: 16px;

            stroke-width: 1.8;
        }

        .form-control {
            width: 100%;
            height: 48px;

            padding:
                0 44px 0 42px;

            border:
                1px solid #dce3eb;

            border-radius: 10px;

            outline: none;

            background: #ffffff;

            color: #273244;

            font-size: 12px;

            transition:
                border-color .18s ease,
                box-shadow .18s ease,
                background .18s ease;
        }

        .form-control::placeholder {
            color: #a8b1bd;
        }

        .form-control:hover {
            border-color: #c6d0dc;
        }

        .form-control:focus {
            border-color: var(--primary);

            box-shadow:
                0 0 0 3px rgba(11, 99, 206, .09);

            background: white;
        }

        .password-toggle {
            position: absolute;

            right: 10px;
            top: 50%;

            transform: translateY(-50%);

            width: 32px;
            height: 32px;

            border: 0;

            background: transparent;

            color: #8793a4;

            border-radius: 7px;

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            transition: .15s;
        }

        .password-toggle:hover {
            color: var(--primary);

            background: #f4f8fd;
        }

        .password-toggle svg {
            width: 16px;
            height: 16px;

            stroke-width: 1.8;
        }

        /* OPTIONS */

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;

            gap: 15px;

            margin-top: 2px;
            margin-bottom: 24px;
        }

        .remember {
            display: flex;
            align-items: center;

            gap: 7px;

            cursor: pointer;

            font-size: 10.5px;

            color: #778394;
        }

        .remember input {
            width: 14px;
            height: 14px;

            accent-color: var(--primary);
        }

        .forgot {
            font-size: 10.5px;

            font-weight: 600;

            color: var(--primary);
        }

        .forgot:hover {
            text-decoration: underline;
        }

        /* BUTTON */

        .btn-login {
            width: 100%;
            height: 48px;

            border: 0;

            border-radius: 10px;

            background:
                linear-gradient(135deg,
                    var(--primary),
                    var(--primary-dark));

            color: white;

            display: flex;
            align-items: center;
            justify-content: center;

            gap: 8px;

            font-size: 12px;

            font-weight: 700;

            cursor: pointer;

            box-shadow:
                0 8px 18px rgba(11, 99, 206, .18);

            transition:
                transform .18s ease,
                box-shadow .18s ease;
        }

        .btn-login:hover {
            transform: translateY(-1px);

            box-shadow:
                0 10px 22px rgba(11, 99, 206, .22);
        }

        .btn-login:active {
            transform: translateY(0);
        }

        .btn-login svg {
            width: 16px;
            height: 16px;
        }

        /* SECURITY */

        .security-info {
            margin-top: 23px;

            display: flex;
            align-items: flex-start;

            gap: 8px;

            padding: 10px 11px;

            border-radius: 9px;

            background: #f8fafc;

            color: #8792a3;

            font-size: 9.5px;

            line-height: 1.5;
        }

        .security-info svg {
            width: 14px;
            height: 14px;

            flex-shrink: 0;

            margin-top: 1px;

            color: #6f7f92;
        }

        /* FOOTER */

        .login-footer {
            margin-top: 29px;

            padding-top: 18px;

            border-top:
                1px solid #edf0f4;

            text-align: center;

            color: #a0a9b6;

            font-size: 9.5px;

            line-height: 1.6;
        }

        /* =========================================================
           RESPONSIVE
        ========================================================= */

        @media (max-width: 920px) {

            body {
                padding: 18px;
            }

            .login-container {
                max-width: 500px;

                grid-template-columns: 1fr;

                min-height: auto;
            }

            .login-visual {
                display: none;
            }

            .login-form-panel {
                padding: 48px 38px;
            }

            .mobile-brand {
                display: flex;
                align-items: center;

                gap: 10px;
            }

            .mobile-brand .brand-icon {
                background: var(--primary);
            }

            .mobile-brand strong {
                display: block;

                font-size: 14px;
            }

            .mobile-brand span {
                display: block;

                margin-top: 2px;

                color: #9aa5b4;

                font-size: 9px;
            }

        }

        @media (max-width: 520px) {

            body {
                padding: 0;

                align-items: stretch;

                background: white;
            }

            .login-container {
                max-width: none;

                min-height: 100vh;

                border: 0;

                border-radius: 0;

                box-shadow: none;
            }

            .login-form-panel {
                padding: 36px 25px;
            }

            .login-heading h2 {
                font-size: 24px;
            }

            .form-options {
                align-items: flex-start;
            }

        }
    </style>
</head>


<body>

    <div class="login-container">


        {{-- ============================================================
         LEFT SIDE
    ============================================================= --}}

        <section class="login-visual">


            <div class="visual-top">


                {{-- BRAND --}}
                <div class="brand">

                    <div class="brand-icon">
                        <i data-lucide="boxes"></i>
                    </div>


                    <div class="brand-text">

                        <strong>
                            Sistem Aset
                        </strong>

                        <span>
                            PERUMDAM TIRTA KENCANA
                        </span>

                    </div>

                </div>



                {{-- HERO LABEL --}}
                <div class="hero-label">

                    <span></span>

                    Sistem Informasi Terintegrasi

                </div>



                <h1>
                    Kelola aset perusahaan dengan lebih terstruktur.
                </h1>


                <p>
                    Sistem Informasi Manajemen Aset membantu pencatatan,
                    monitoring, pengelompokan, nilai, kondisi, lokasi,
                    hingga arsip aset perusahaan dalam satu platform.
                </p>



                {{-- FEATURES --}}
                <div class="asset-features">


                    <div class="asset-feature">

                        <div class="asset-feature-icon">
                            <i data-lucide="database"></i>
                        </div>

                        <span>
                            Master Data Terintegrasi
                        </span>

                    </div>



                    <div class="asset-feature">

                        <div class="asset-feature-icon">
                            <i data-lucide="library"></i>
                        </div>

                        <span>
                            Kartu Inventaris Barang
                        </span>

                    </div>



                    <div class="asset-feature">

                        <div class="asset-feature-icon">
                            <i data-lucide="badge-dollar-sign"></i>
                        </div>

                        <span>
                            Monitoring Nilai Aset
                        </span>

                    </div>



                    <div class="asset-feature">

                        <div class="asset-feature-icon">
                            <i data-lucide="archive"></i>
                        </div>

                        <span>
                            Pengelolaan Arsip
                        </span>

                    </div>


                </div>


            </div>



            {{-- LEFT FOOTER --}}
            <div class="visual-bottom">

                <div class="company-name">
                    Perumdam Tirta Kencana
                </div>


                <div class="system-status">

                    <span></span>

                    Sistem Aset

                </div>

            </div>


        </section>



        {{-- ============================================================
         RIGHT SIDE
    ============================================================= --}}

        <section class="login-form-panel">


            {{-- MOBILE BRAND --}}
            <div class="mobile-brand">

                <div class="brand-icon">
                    <i data-lucide="boxes"></i>
                </div>


                <div>

                    <strong>
                        Sistem Aset
                    </strong>

                    <span>
                        Perumdam Tirta Kencana
                    </span>

                </div>

            </div>



            {{-- HEADING --}}
            <div class="login-heading">

                <span>
                    Sistem Informasi Manajemen Aset
                </span>

                <h2>
                    Selamat Datang
                </h2>

                <p>
                    Masukkan akun Anda untuk mengakses sistem
                    pengelolaan aset perusahaan.
                </p>

            </div>



            {{-- ========================================================
             ERROR VALIDATION
        ========================================================= --}}

            @if ($errors->any())

                <div class="alert-error">

                    <i data-lucide="circle-alert"></i>

                    <div>

                        @foreach ($errors->all() as $error)
                            <div>
                                {{ $error }}
                            </div>
                        @endforeach

                    </div>

                </div>

            @endif



            {{-- ========================================================
             FORM
        ========================================================= --}}

            <form action="{{ route('login.submit') }}" method="POST">

                @csrf



                {{-- EMAIL --}}
                <div class="form-group">

                    <label for="email" class="form-label">
                        Email
                    </label>


                    <div class="input-wrapper">


                        <span class="input-icon">
                            <i data-lucide="mail"></i>
                        </span>


                        <input type="email" id="email" name="email" class="form-control"
                            value="{{ old('email') }}" placeholder="Masukkan email Anda" autocomplete="email" required
                            autofocus>


                    </div>

                </div>



                {{-- PASSWORD --}}
                <div class="form-group">

                    <label for="password" class="form-label">
                        Password
                    </label>


                    <div class="input-wrapper">


                        <span class="input-icon">
                            <i data-lucide="lock-keyhole"></i>
                        </span>


                        <input type="password" id="password" name="password" class="form-control"
                            placeholder="Masukkan password" autocomplete="current-password" required>


                        <button type="button" class="password-toggle" id="passwordToggle" onclick="togglePassword()"
                            aria-label="Tampilkan password">

                            <i data-lucide="eye" id="passwordIcon"></i>

                        </button>


                    </div>

                </div>



                {{-- OPTIONS --}}
                <div class="form-options">


                    <label class="remember">

                        <input type="checkbox" name="remember" value="1">

                        <span>
                            Ingat saya
                        </span>

                    </label>



                    <a href="#" class="forgot">
                        Lupa password?
                    </a>


                </div>



                {{-- LOGIN BUTTON --}}
                <button type="submit" class="btn-login">

                    <span>
                        Masuk ke Sistem
                    </span>

                    <i data-lucide="arrow-right"></i>

                </button>


            </form>



            {{-- SECURITY INFORMATION --}}
            <div class="security-info">

                <i data-lucide="shield-check"></i>

                <div>
                    Gunakan akun resmi yang telah diberikan.
                    Aktivitas pengguna pada sistem dapat tercatat
                    untuk keamanan dan pengelolaan data aset.
                </div>

            </div>



            {{-- FOOTER --}}
            <div class="login-footer">

                © {{ date('Y') }}
                Perumdam Tirta Kencana

                <br>

                Sistem Informasi Manajemen Aset

            </div>


        </section>


    </div>



    {{-- ================================================================
     LUCIDE ICONS
================================================================ --}}

    <script src="https://unpkg.com/lucide@latest"></script>



    <script>
        /*
            |--------------------------------------------------------------------------
            | Initialize Lucide
            |--------------------------------------------------------------------------
            */

        lucide.createIcons();



        /*
        |--------------------------------------------------------------------------
        | Show / Hide Password
        |--------------------------------------------------------------------------
        */

        function togglePassword() {

            const password =
                document.getElementById('password');

            const button =
                document.getElementById('passwordToggle');


            if (password.type === 'password') {

                password.type = 'text';

                button.innerHTML =
                    '<i data-lucide="eye-off"></i>';

                button.setAttribute(
                    'aria-label',
                    'Sembunyikan password'
                );

            } else {

                password.type = 'password';

                button.innerHTML =
                    '<i data-lucide="eye"></i>';

                button.setAttribute(
                    'aria-label',
                    'Tampilkan password'
                );

            }


            lucide.createIcons();

        }
    </script>


</body>

</html>
