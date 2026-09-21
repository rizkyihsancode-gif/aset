<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login | Sistem Aset</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            background: #f3f6f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .login-wrapper {
            width: 100%;
            max-width: 1000px;
            min-height: 580px;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            display: grid;
            grid-template-columns: 1fr 1fr;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
        }

        /* LEFT */
        .login-left {
            background: linear-gradient(135deg,
                    #0066cc,
                    #004b99);
            color: white;
            padding: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        .login-left::before {
            content: "";
            position: absolute;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            top: -100px;
            right: -100px;
        }

        .login-left::after {
            content: "";
            position: absolute;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.06);
            bottom: -80px;
            left: -70px;
        }

        .brand {
            position: relative;
            z-index: 2;
        }

        .brand-logo {
            width: 70px;
            height: 70px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 30px;
        }

        .brand h1 {
            font-size: 36px;
            margin-bottom: 15px;
        }

        .brand p {
            font-size: 16px;
            line-height: 1.7;
            opacity: 0.85;
            max-width: 380px;
        }

        .system-name {
            margin-top: 35px;
            font-size: 13px;
            opacity: 0.7;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        /* RIGHT */
        .login-right {
            padding: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .login-header {
            margin-bottom: 35px;
        }

        .login-header h2 {
            font-size: 30px;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .login-header p {
            color: #6b7280;
            font-size: 15px;
        }

        .form-group {
            margin-bottom: 22px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
        }

        .form-control {
            width: 100%;
            height: 50px;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            padding: 0 15px;
            outline: none;
            font-size: 15px;
            transition: 0.2s;
        }

        .form-control:focus {
            border-color: #0066cc;
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .password-wrapper {
            position: relative;
        }

        .password-wrapper .form-control {
            padding-right: 70px;
        }

        .show-password {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            border: none;
            background: transparent;
            cursor: pointer;
            color: #0066cc;
            font-size: 13px;
            font-weight: 600;
        }

        .form-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 25px;
        }

        .remember {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #6b7280;
        }

        .forgot {
            text-decoration: none;
            font-size: 14px;
            color: #0066cc;
        }

        .forgot:hover {
            text-decoration: underline;
        }

        .btn-login {
            width: 100%;
            border: none;
            background: #0066cc;
            color: white;
            padding: 15px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            transition: 0.2s;
        }

        .btn-login:hover {
            background: #0056ad;
            transform: translateY(-1px);
        }

        .footer-login {
            margin-top: 35px;
            text-align: center;
            font-size: 13px;
            color: #9ca3af;
        }

        @media (max-width: 768px) {
            .login-wrapper {
                grid-template-columns: 1fr;
                max-width: 480px;
            }

            .login-left {
                display: none;
            }

            .login-right {
                padding: 40px 30px;
            }
        }
    </style>
</head>

<body>

    <div class="login-wrapper">

        <!-- LEFT SIDE -->
        <div class="login-left">
            <div class="brand">

                <div class="brand-logo">
                    💧
                </div>

                <h1>Sistem Aset</h1>

                <p>
                    Sistem informasi pengelolaan dan monitoring aset perusahaan
                    secara terintegrasi, cepat, dan efisien.
                </p>

                <div class="system-name">
                    Perumdam Tirta Kencana
                </div>

            </div>
        </div>


        <!-- RIGHT SIDE -->
        <div class="login-right">

            <div class="login-header">
                <h2>Selamat Datang</h2>
                <p>Silakan masuk menggunakan akun Anda.</p>
            </div>


            <form action="{{ route('login.submit') }}" method="POST">

                @csrf

                <div class="form-group">
                    <label>Email</label>

                    <input type="email" name="email" class="form-control" placeholder="Masukkan email"
                        autocomplete="email" required>
                </div>


                <div class="form-group">
                    <label>Password</label>

                    <div class="password-wrapper">

                        <input type="password" name="password" id="password" class="form-control"
                            placeholder="Masukkan password" autocomplete="current-password" required>

                        <button type="button" class="show-password" onclick="togglePassword()">
                            Lihat
                        </button>

                    </div>
                </div>


                <div class="form-options">

                    <label class="remember">
                        <input type="checkbox" name="remember">
                        Ingat saya
                    </label>

                    <a href="#" class="forgot">
                        Lupa password?
                    </a>

                </div>


                <button type="submit" class="btn-login">
                    Masuk
                </button>

            </form>


            <div class="footer-login">
                © {{ date('Y') }} Sistem Aset - Perumdam Tirta Kencana
            </div>

        </div>

    </div>


    <script>
        function togglePassword() {

            const password = document.getElementById('password');
            const button = document.querySelector('.show-password');

            if (password.type === 'password') {

                password.type = 'text';
                button.innerText = 'Sembunyi';

            } else {

                password.type = 'password';
                button.innerText = 'Lihat';

            }
        }
    </script>

</body>

</html>
