@extends('layouts.main')


@section('title', 'Dashboard')


@section('page-title', 'Dashboard')


@section('page-description', 'Ringkasan dan monitoring aset perusahaan')



@section('content')

    <section class="content">


        {{-- =====================================================
         WELCOME
    ====================================================== --}}

        <div class="welcome">

            <div class="welcome-content">

                <span class="welcome-label">
                    Sistem Informasi Manajemen Aset
                </span>

                <h2>
                    Selamat datang, Administrator
                </h2>

                <p>
                    Pantau jumlah, nilai, kondisi, dan perkembangan seluruh
                    aset Perumdam Tirta Kencana dalam satu dashboard
                    terintegrasi.
                </p>

            </div>

        </div>



        {{-- =====================================================
         KPI
    ====================================================== --}}

        <div class="kpi-grid">


            {{-- TOTAL ASET --}}
            <div class="kpi-card">

                <div class="kpi-head">

                    <div>

                        <span class="kpi-label">
                            Total Aset
                        </span>

                        <div class="kpi-value">
                            2.485
                        </div>

                    </div>


                    <div class="kpi-icon blue">
                        <i data-lucide="boxes"></i>
                    </div>

                </div>


                <div class="kpi-footer">

                    <span class="positive">
                        +24
                    </span>

                    aset tahun ini

                </div>

            </div>



            {{-- NILAI ASET --}}
            <div class="kpi-card">

                <div class="kpi-head">

                    <div>

                        <span class="kpi-label">
                            Total Nilai Aset
                        </span>

                        <div class="kpi-value currency">
                            Rp 928,7 M
                        </div>

                    </div>


                    <div class="kpi-icon purple">
                        <i data-lucide="wallet-cards"></i>
                    </div>

                </div>


                <div class="kpi-footer">
                    Nilai perolehan seluruh aset
                </div>

            </div>



            {{-- KONDISI BAIK --}}
            <div class="kpi-card">

                <div class="kpi-head">

                    <div>

                        <span class="kpi-label">
                            Kondisi Baik
                        </span>

                        <div class="kpi-value">
                            2.215
                        </div>

                    </div>


                    <div class="kpi-icon green">
                        <i data-lucide="circle-check-big"></i>
                    </div>

                </div>


                <div class="kpi-footer">

                    <span class="positive">
                        89,1%
                    </span>

                    dari total aset

                </div>

            </div>



            {{-- PERLU PERHATIAN --}}
            <div class="kpi-card">

                <div class="kpi-head">

                    <div>

                        <span class="kpi-label">
                            Perlu Perhatian
                        </span>

                        <div class="kpi-value">
                            270
                        </div>

                    </div>


                    <div class="kpi-icon orange">
                        <i data-lucide="triangle-alert"></i>
                    </div>

                </div>


                <div class="kpi-footer">
                    Maintenance dan rusak
                </div>

            </div>


        </div>



        {{-- =====================================================
         CHART ROW 1
    ====================================================== --}}

        <div class="dashboard-grid-main">


            {{-- PERTUMBUHAN NILAI --}}
            <div class="dashboard-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Pertumbuhan Nilai Aset
                        </h3>

                        <p>
                            Perkembangan nilai aset lima tahun terakhir
                        </p>

                    </div>


                    <button class="card-action">
                        <i data-lucide="more-horizontal"></i>
                    </button>

                </div>


                <div class="dashboard-card-body">

                    <div class="chart-large">

                        <canvas id="growthChart"></canvas>

                    </div>

                </div>

            </div>



            {{-- KOMPOSISI --}}
            <div class="dashboard-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Komposisi K.I.B
                        </h3>

                        <p>
                            Berdasarkan kategori aset
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body">

                    <div class="chart-doughnut">

                        <canvas id="compositionChart"></canvas>

                    </div>

                </div>

            </div>


        </div>



        {{-- =====================================================
         CHART ROW 2
    ====================================================== --}}

        <div class="dashboard-grid-secondary">


            {{-- BAR CHART --}}
            <div class="dashboard-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Jumlah Aset per Kategori
                        </h3>

                        <p>
                            Distribusi berdasarkan kelompok K.I.B
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body">

                    <div class="chart-bar">

                        <canvas id="categoryChart"></canvas>

                    </div>

                </div>

            </div>



            {{-- KONDISI --}}
            <div class="dashboard-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Kondisi Aset
                        </h3>

                        <p>
                            Monitoring kondisi aset aktif
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body">


                    <div class="condition-item">

                        <div class="condition-head">

                            <span>
                                <span class="status-dot good"></span>
                                Baik
                            </span>

                            <strong>
                                2.215
                            </strong>

                        </div>


                        <div class="progress-track">

                            <div class="progress-value good" style="width: 89%;"></div>

                        </div>

                    </div>



                    <div class="condition-item">

                        <div class="condition-head">

                            <span>
                                <span class="status-dot maintenance"></span>
                                Maintenance
                            </span>

                            <strong>
                                168
                            </strong>

                        </div>


                        <div class="progress-track">

                            <div class="progress-value maintenance" style="width: 7%;"></div>

                        </div>

                    </div>



                    <div class="condition-item">

                        <div class="condition-head">

                            <span>
                                <span class="status-dot broken"></span>
                                Rusak
                            </span>

                            <strong>
                                102
                            </strong>

                        </div>


                        <div class="progress-track">

                            <div class="progress-value broken" style="width: 4%;"></div>

                        </div>

                    </div>



                    <div class="mini-stat-grid">

                        <div class="mini-stat">

                            <span>
                                Lokasi
                            </span>

                            <strong>
                                34
                            </strong>

                        </div>


                        <div class="mini-stat">

                            <span>
                                Ruangan
                            </span>

                            <strong>
                                78
                            </strong>

                        </div>


                        <div class="mini-stat">

                            <span>
                                Departemen
                            </span>

                            <strong>
                                12
                            </strong>

                        </div>


                        <div class="mini-stat">

                            <span>
                                Divisi
                            </span>

                            <strong>
                                26
                            </strong>

                        </div>

                    </div>


                </div>

            </div>


        </div>



        {{-- =====================================================
         BOTTOM
    ====================================================== --}}

        <div class="dashboard-bottom-grid">


            {{-- ASET TERBARU --}}
            <div class="dashboard-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Aset Terbaru
                        </h3>

                        <p>
                            Data aset terakhir yang ditambahkan
                        </p>

                    </div>


                    <a href="#" class="view-all">
                        Lihat Semua
                    </a>

                </div>


                <div class="table-responsive">

                    <table class="asset-table">

                        <thead>

                            <tr>

                                <th>Aset</th>
                                <th>Lokasi</th>
                                <th>Kategori</th>
                                <th>Kondisi</th>

                            </tr>

                        </thead>


                        <tbody>


                            <tr>

                                <td>

                                    <strong>
                                        Laptop Dell Latitude
                                    </strong>

                                    <span>
                                        AST-IT-001
                                    </span>

                                </td>

                                <td>
                                    Bagian IT
                                </td>

                                <td>
                                    Peralatan
                                </td>

                                <td>

                                    <span class="badge-status good">
                                        Baik
                                    </span>

                                </td>

                            </tr>



                            <tr>

                                <td>

                                    <strong>
                                        Printer Epson L5290
                                    </strong>

                                    <span>
                                        AST-ADM-008
                                    </span>

                                </td>

                                <td>
                                    Administrasi
                                </td>

                                <td>
                                    Peralatan
                                </td>

                                <td>

                                    <span class="badge-status maintenance">
                                        Maintenance
                                    </span>

                                </td>

                            </tr>



                            <tr>

                                <td>

                                    <strong>
                                        Pompa Distribusi
                                    </strong>

                                    <span>
                                        AST-PRD-014
                                    </span>

                                </td>

                                <td>
                                    IPA
                                </td>

                                <td>
                                    Mesin
                                </td>

                                <td>

                                    <span class="badge-status good">
                                        Baik
                                    </span>

                                </td>

                            </tr>


                        </tbody>

                    </table>

                </div>

            </div>



            {{-- AKTIVITAS --}}
            <div class="dashboard-card">

                <div class="dashboard-card-header">

                    <div>

                        <h3>
                            Aktivitas Terbaru
                        </h3>

                        <p>
                            Riwayat perubahan terakhir
                        </p>

                    </div>

                </div>


                <div class="dashboard-card-body">


                    <div class="activity-item">

                        <div class="activity-icon">
                            <i data-lucide="circle-plus"></i>
                        </div>

                        <div>

                            <strong>
                                Aset baru ditambahkan
                            </strong>

                            <p>
                                Laptop Dell Latitude ditambahkan ke sistem.
                            </p>

                            <small>
                                10 menit lalu
                            </small>

                        </div>

                    </div>



                    <div class="activity-item">

                        <div class="activity-icon">
                            <i data-lucide="wrench"></i>
                        </div>

                        <div>

                            <strong>
                                Status aset diperbarui
                            </strong>

                            <p>
                                Printer Epson masuk proses maintenance.
                            </p>

                            <small>
                                1 jam lalu
                            </small>

                        </div>

                    </div>



                    <div class="activity-item">

                        <div class="activity-icon">
                            <i data-lucide="map-pin"></i>
                        </div>

                        <div>

                            <strong>
                                Lokasi aset berubah
                            </strong>

                            <p>
                                Router dipindahkan ke Server Room.
                            </p>

                            <small>
                                3 jam lalu
                            </small>

                        </div>

                    </div>


                </div>

            </div>


        </div>


    </section>

@endsection



@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script>
        Chart.defaults.font.family =
            'Inter, system-ui, sans-serif';

        Chart.defaults.color =
            '#7b8799';


        /*
        |--------------------------------------------------------------------------
        | PERTUMBUHAN NILAI ASET
        |--------------------------------------------------------------------------
        */

        new Chart(
            document.getElementById('growthChart'), {

                type: 'line',

                data: {

                    labels: [
                        '2022',
                        '2023',
                        '2024',
                        '2025',
                        '2026'
                    ],

                    datasets: [{
                        label: 'Nilai Aset',

                        data: [
                            720,
                            768,
                            814,
                            875,
                            928.7
                        ],

                        borderColor: '#0b63ce',

                        backgroundColor: 'rgba(11,99,206,.08)',

                        borderWidth: 2,

                        fill: true,

                        tension: .4,

                        pointRadius: 3,

                        pointBackgroundColor: '#0b63ce'
                    }]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        x: {
                            grid: {
                                display: false
                            }
                        },

                        y: {

                            grid: {
                                color: '#edf1f5'
                            },

                            ticks: {

                                callback: function(value) {
                                    return value + ' M';
                                }

                            }

                        }

                    }

                }

            }
        );



        /*
        |--------------------------------------------------------------------------
        | KOMPOSISI KIB
        |--------------------------------------------------------------------------
        */

        new Chart(
            document.getElementById('compositionChart'), {

                type: 'doughnut',

                data: {

                    labels: [
                        'Tanah',
                        'Peralatan & Mesin',
                        'Gedung',
                        'Jalan & Jaringan',
                        'Aset Lainnya',
                        'Konstruksi'
                    ],

                    datasets: [{

                        data: [
                            245,
                            1020,
                            380,
                            510,
                            260,
                            70
                        ],

                        backgroundColor: [
                            '#0b63ce',
                            '#5b8def',
                            '#16a34a',
                            '#f59e0b',
                            '#8b5cf6',
                            '#ef4444'
                        ],

                        borderWidth: 0

                    }]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: '70%',

                    plugins: {

                        legend: {

                            position: 'bottom',

                            labels: {

                                boxWidth: 8,

                                usePointStyle: true,

                                pointStyle: 'circle',

                                font: {
                                    size: 10
                                }

                            }

                        }

                    }

                }

            }
        );



        /*
        |--------------------------------------------------------------------------
        | JUMLAH ASET PER KATEGORI
        |--------------------------------------------------------------------------
        */

        new Chart(
            document.getElementById('categoryChart'), {

                type: 'bar',

                data: {

                    labels: [
                        'Tanah',
                        'Peralatan & Mesin',
                        'Gedung',
                        'Jalan & Jaringan',
                        'Aset Lainnya',
                        'Konstruksi'
                    ],

                    datasets: [{

                        label: 'Jumlah',

                        data: [
                            245,
                            1020,
                            380,
                            510,
                            260,
                            70
                        ],

                        backgroundColor: 'rgba(11,99,206,.82)',

                        borderRadius: 5,

                        barThickness: 14

                    }]

                },


                options: {

                    indexAxis: 'y',

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {
                            grid: {
                                display: false
                            }
                        },

                        x: {
                            grid: {
                                color: '#edf1f5'
                            }
                        }

                    }

                }

            }
        );
    </script>
@endpush
