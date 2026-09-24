/*
|--------------------------------------------------------------------------
| NILAI ASET
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

        updateNilaiDate();

        setInterval(
            updateNilaiDate,
            60000
        );



        /*
        |--------------------------------------------------------------------------
        | CHART
        |--------------------------------------------------------------------------
        */

        if (
            typeof Chart === 'undefined'
        ) {

            return;

        }


        Chart.defaults.font.family =
            'Inter, system-ui, sans-serif';

        Chart.defaults.color =
            '#617694';



        /*
        |--------------------------------------------------------------------------
        | TREND NILAI
        |--------------------------------------------------------------------------
        */

        const trendCanvas =
            document.getElementById(
                'nilaiTrendChart'
            );


        if (trendCanvas) {

            new Chart(
                trendCanvas,
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

                            label:
                                'Nilai Aset',

                            data: [
                                720,
                                768,
                                814,
                                875,
                                928.7
                            ],

                            borderColor:
                                '#1475e5',

                            backgroundColor:
                                'rgba(45, 137, 239, .13)',

                            fill:
                                true,

                            tension:
                                .30,

                            borderWidth:
                                2,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                5,

                            pointBackgroundColor:
                                '#1475e5',

                            pointBorderColor:
                                '#ffffff',

                            pointBorderWidth:
                                1.5

                        }]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,


                        interaction: {

                            mode:
                                'index',

                            intersect:
                                false

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

                                    color:
                                        '#e7eef6'

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
                                        '#e6edf5'

                                }

                            }

                        }

                    }

                }
            );

        }



        /*
        |--------------------------------------------------------------------------
        | CATEGORY DISTRIBUTION
        |--------------------------------------------------------------------------
        */

        const categoryCanvas =
            document.getElementById(
                'nilaiCategoryChart'
            );


        if (categoryCanvas) {

            new Chart(
                categoryCanvas,
                {

                    type:
                        'doughnut',

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

                                245.6,

                                280.4,

                                210.8,

                                98.3,

                                63.1,

                                30.5

                            ],

                            backgroundColor: [

                                '#3389ee',

                                '#ffab27',

                                '#3ac088',

                                '#ef5860',

                                '#9163e6',

                                '#62bfe4'

                            ],

                            borderColor:
                                '#ffffff',

                            borderWidth:
                                1,

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
                            '67%',

                        plugins: {

                            legend: {
                                display: false
                            },

                            tooltip: {

                                callbacks: {

                                    label:
                                        function(context) {

                                            return (
                                                context.label +
                                                ': Rp ' +
                                                context.raw +
                                                ' M'
                                            );

                                        }

                                }

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
| DATE
|--------------------------------------------------------------------------
*/

function updateNilaiDate() {

    const dateElement =
        document.getElementById(
            'nilaiCurrentDate'
        );

    const timeElement =
        document.getElementById(
            'nilaiCurrentTime'
        );


    if (
        !dateElement ||
        !timeElement
    ) {

        return;

    }


    const now =
        new Date();


    const dateFormatter =
        new Intl.DateTimeFormat(
            'id-ID',
            {

                weekday:
                    'long',

                day:
                    'numeric',

                month:
                    'long',

                year:
                    'numeric'

            }
        );


    const timeFormatter =
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
        dateFormatter.format(now);


    timeElement.textContent =
        timeFormatter.format(now)
        +
        ' WIB';

}



/*
|--------------------------------------------------------------------------
| RESET FILTER
|--------------------------------------------------------------------------
*/

function resetNilaiFilter() {

    const search =
        document.getElementById(
            'nilaiSearch'
        );

    const year =
        document.getElementById(
            'nilaiYear'
        );

    const location =
        document.getElementById(
            'nilaiLocation'
        );

    const category =
        document.getElementById(
            'nilaiCategory'
        );


    if (search) {

        search.value = '';

    }


    if (year) {

        year.selectedIndex = 0;

    }


    if (location) {

        location.selectedIndex = 0;

    }


    if (category) {

        category.selectedIndex = 0;

    }

}