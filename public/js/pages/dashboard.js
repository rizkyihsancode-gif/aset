/*
|--------------------------------------------------------------------------
| DASHBOARD SYSTEM ASET
|--------------------------------------------------------------------------
*/


document.addEventListener(
    'DOMContentLoaded',
    function () {


        /*
        |--------------------------------------------------------------------------
        | DATE & TIME
        |--------------------------------------------------------------------------
        */

        updateDashboardDate();

        setInterval(
            updateDashboardDate,
            60000
        );



        /*
        |--------------------------------------------------------------------------
        | CHART.JS GLOBAL
        |--------------------------------------------------------------------------
        */

        if (typeof Chart === 'undefined') {
            return;
        }


        Chart.defaults.font.family =
            'Inter, system-ui, sans-serif';

        Chart.defaults.color =
            '#637894';



        /*
        |--------------------------------------------------------------------------
        | GROWTH CHART
        |--------------------------------------------------------------------------
        */

        const growthCanvas =
            document.getElementById(
                'assetGrowthChart'
            );


        if (growthCanvas) {

            new Chart(
                growthCanvas,
                {

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

                            data: [
                                720,
                                768,
                                814,
                                875,
                                928.7
                            ],

                            borderColor:
                                '#1772e5',

                            backgroundColor:
                                'rgba(59, 142, 239, .14)',

                            fill:
                                true,

                            tension:
                                .35,

                            borderWidth:
                                2,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                5,

                            pointBackgroundColor:
                                '#1772e5',

                            pointBorderWidth:
                                0

                        }]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        interaction: {

                            intersect:
                                false,

                            mode:
                                'index'

                        },


                        plugins: {

                            legend: {
                                display: false
                            },

                            tooltip: {

                                callbacks: {

                                    label:
                                        function(context) {

                                            return (
                                                'Rp ' +
                                                context.raw +
                                                ' M'
                                            );

                                        }

                                }

                            }

                        },


                        scales: {

                            x: {

                                grid: {
                                    display: false
                                },

                                ticks: {
                                    font: {
                                        size: 8
                                    }
                                }

                            },


                            y: {

                                beginAtZero:
                                    true,

                                suggestedMax:
                                    1250,

                                ticks: {

                                    stepSize:
                                        250,

                                    font: {
                                        size: 8
                                    }

                                },

                                grid: {

                                    color:
                                        '#e7edf5'

                                }

                            }

                        }

                    }

                }
            );

        }



        /*
        |--------------------------------------------------------------------------
        | KIB COMPOSITION
        |--------------------------------------------------------------------------
        */

        const kibCanvas =
            document.getElementById(
                'kibCompositionChart'
            );


        if (kibCanvas) {

            new Chart(
                kibCanvas,
                {

                    type: 'doughnut',

                    data: {

                        labels: [
                            'Tanah',
                            'Peralatan & Mesin',
                            'Gedung & Bangunan',
                            'Jalan & Jaringan',
                            'Aset Tetap Lainnya',
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
                                '#2f80ed',
                                '#ff9f1c',
                                '#f3ba2f',
                                '#7d57c2',
                                '#ef5350',
                                '#5578df'
                            ],

                            borderWidth:
                                0,

                            hoverOffset:
                                4

                        }]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '70%',

                        plugins: {

                            legend: {
                                display: false
                            }

                        }

                    }

                }
            );

        }



        /*
        |--------------------------------------------------------------------------
        | CONDITION
        |--------------------------------------------------------------------------
        */

        const conditionCanvas =
            document.getElementById(
                'assetConditionChart'
            );


        if (conditionCanvas) {

            new Chart(
                conditionCanvas,
                {

                    type:
                        'doughnut',

                    data: {

                        labels: [
                            'Baik',
                            'Maintenance',
                            'Rusak'
                        ],

                        datasets: [{

                            data: [
                                2215,
                                180,
                                90
                            ],

                            backgroundColor: [
                                '#23b060',
                                '#f7a719',
                                '#ef4545'
                            ],

                            borderWidth:
                                0

                        }]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '70%',

                        plugins: {

                            legend: {
                                display: false
                            }

                        }

                    }

                }
            );

        }


    }
);



/*
|--------------------------------------------------------------------------
| DASHBOARD DATE
|--------------------------------------------------------------------------
*/

function updateDashboardDate() {

    const dateElement =
        document.getElementById(
            'dashboardDate'
        );

    const timeElement =
        document.getElementById(
            'dashboardTime'
        );


    if (!dateElement || !timeElement) {
        return;
    }


    const now =
        new Date();


    const dateFormat =
        new Intl.DateTimeFormat(
            'id-ID',
            {

                weekday:
                    'long',

                day:
                    '2-digit',

                month:
                    'long',

                year:
                    'numeric'

            }
        );


    const timeFormat =
        new Intl.DateTimeFormat(
            'id-ID',
            {

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                hour12:
                    false

            }
        );


    dateElement.textContent =
        dateFormat.format(now);


    timeElement.textContent =
        timeFormat.format(now) +
        ' WIB';

}