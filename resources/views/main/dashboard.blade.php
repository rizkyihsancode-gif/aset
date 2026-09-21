@extends('layouts.main')


@section('title')
    Dashboard
@endsection


@section('page-title')
    Dashboard
@endsection


@section('page-description')
    Ringkasan dan monitoring aset perusahaan
@endsection



@section('content')
    <section class="content">


        {{-- ======================================================
         WELCOME
    ======================================================= --}}

        <div class="welcome">

            <div class="welcome-content">

                <small>
                    Sistem Informasi Manajemen Aset
                </small>

                <h2>
                    Selamat datang, Administrator
                </h2>

                <p>
                    Pantau jumlah, nilai, kondisi, dan perkembangan
                    seluruh aset Perumdam Tirta Kencana dalam satu
                    dashboard terintegrasi.
                </p>

            </div>

        </div>



        {{-- ======================================================
         KPI
    ======================================================= --}}

        <div class="kpi-grid">

            <div class="kpi-card">

                <div class="kpi-head">

                    <div>

                        <div class="kpi-label">
                            Total Aset
                        </div>

                        <div class="kpi-value">
                            2.485
                        </div>

                    </div>


                    <div class="kpi-icon kpi-blue">

                        <i data-lucide="boxes"></i>

                    </div>

                </div>

            </div>


            <div class="kpi-card">

                <div class="kpi-head">

                    <div>

                        <div class="kpi-label">
                            Total Nilai Aset
                        </div>

                        <div class="kpi-value currency">
                            Rp 928,7 M
                        </div>

                    </div>


                    <div class="kpi-icon kpi-purple">

                        <i data-lucide="wallet-cards"></i>

                    </div>

                </div>

            </div>


            {{-- dan seterusnya --}}

        </div>


    </section>
@endsection
