/*
|--------------------------------------------------------------------------
| MASTER DATA BARANG
|--------------------------------------------------------------------------
*/


document.addEventListener(
    'DOMContentLoaded',
    function () {

        updateBarangDate();

        setInterval(
            updateBarangDate,
            60000
        );


        initBarangChart();


        if (window.lucide) {
            lucide.createIcons();
        }

    }
);



/*
|--------------------------------------------------------------------------
| DATE & TIME
|--------------------------------------------------------------------------
*/

function updateBarangDate() {

    const dateElement =
        document.getElementById(
            'barangCurrentDate'
        );


    const timeElement =
        document.getElementById(
            'barangCurrentTime'
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
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }
        );


    const timeFormatter =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }
        );


    dateElement.textContent =
        dateFormatter.format(now);


    timeElement.textContent =
        timeFormatter.format(now)
        + ' WIB';

}



/*
|--------------------------------------------------------------------------
| FILTER TABLE
|--------------------------------------------------------------------------
*/

function filterBarangTable() {

    const searchInput =
        document.getElementById(
            'barangSearch'
        );


    const golonganSelect =
        document.getElementById(
            'barangGolongan'
        );


    const table =
        document.getElementById(
            'barangTable'
        );


    if (!table) {
        return;
    }


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : '';


    const golongan =
        golonganSelect
            ? golonganSelect.value
                .toLowerCase()
                .trim()
            : '';


    const rows =
        table.querySelectorAll(
            'tbody tr'
        );


    let visibleCount = 0;


    rows.forEach(
        function (row) {

            const rowText =
                row.textContent
                    .toLowerCase();


            const rowGolongan =
                (
                    row.dataset.golongan || ''
                )
                .toLowerCase();


            const matchSearch =
                search === ''
                ||
                rowText.includes(search);


            const matchGolongan =
                golongan === ''
                ||
                rowGolongan === golongan;


            if (
                matchSearch &&
                matchGolongan
            ) {

                row.style.display = '';

                visibleCount++;

            } else {

                row.style.display = 'none';

            }

        }
    );


    const count =
        document.getElementById(
            'barangShownCount'
        );


    if (count) {
        count.textContent = visibleCount;
    }

}



/*
|--------------------------------------------------------------------------
| RESET FILTER
|--------------------------------------------------------------------------
*/

function resetBarangFilter() {

    const search =
        document.getElementById(
            'barangSearch'
        );


    const golongan =
        document.getElementById(
            'barangGolongan'
        );


    if (search) {
        search.value = '';
    }


    if (golongan) {
        golongan.selectedIndex = 0;
    }


    filterBarangTable();

}



/*
|--------------------------------------------------------------------------
| CHART
|--------------------------------------------------------------------------
*/

function initBarangChart() {

    if (
        typeof Chart === 'undefined'
    ) {
        return;
    }


    const canvas =
        document.getElementById(
            'barangGolonganChart'
        );


    if (!canvas) {
        return;
    }


    new Chart(
        canvas,
        {

            type: 'doughnut',


            data: {

                labels: [
                    'Elektronik',
                    'Furnitur',
                    'Mekanikal',
                    'Elektrikal',
                    'Alat Kantor',
                    'Lainnya'
                ],


                datasets: [{

                    data: [
                        412,
                        286,
                        234,
                        198,
                        102,
                        52
                    ],


                    backgroundColor: [
                        '#3288ee',
                        '#4fc184',
                        '#f2c037',
                        '#f6a329',
                        '#8156df',
                        '#aab7ca'
                    ],


                    borderColor:
                        '#ffffff',


                    borderWidth:
                        2,


                    hoverOffset:
                        4

                }]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: '68%',


                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label:
                                function (context) {

                                    return (
                                        context.label
                                        + ': '
                                        + context.raw
                                        + ' barang'
                                    );

                                }

                        }

                    }

                }

            }

        }
    );

}



/*
|--------------------------------------------------------------------------
| OPEN MODAL
|--------------------------------------------------------------------------
*/

function openBarangModal() {

    const modal =
        document.getElementById(
            'barangModal'
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        'show'
    );


    document.body.style.overflow =
        'hidden';


    if (window.lucide) {
        lucide.createIcons();
    }

}



/*
|--------------------------------------------------------------------------
| CLOSE MODAL
|--------------------------------------------------------------------------
*/

function closeBarangModal() {

    const modal =
        document.getElementById(
            'barangModal'
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        'show'
    );


    document.body.style.overflow =
        '';

}



/*
|--------------------------------------------------------------------------
| ESC CLOSE MODAL
|--------------------------------------------------------------------------
*/

document.addEventListener(
    'keydown',
    function (event) {

        if (event.key === 'Escape') {
            closeBarangModal();
        }

    }
);



/*
|--------------------------------------------------------------------------
| EXPORT CSV
|--------------------------------------------------------------------------
*/

function exportBarangCSV() {

    const table =
        document.getElementById(
            'barangTable'
        );


    if (!table) {
        return;
    }


    const rows =
        table.querySelectorAll(
            'tr'
        );


    const csv = [];


    rows.forEach(
        function (row) {

            if (
                row.style.display === 'none'
            ) {
                return;
            }


            const columns =
                row.querySelectorAll(
                    'th, td'
                );


            const values = [];


            columns.forEach(
                function (column, index) {

                    /*
                    Skip kolom aksi.
                    */

                    if (
                        index ===
                        columns.length - 1
                    ) {
                        return;
                    }


                    const value =
                        column.innerText
                            .replace(
                                /"/g,
                                '""'
                            )
                            .trim();


                    values.push(
                        '"' + value + '"'
                    );

                }
            );


            csv.push(
                values.join(',')
            );

        }
    );


    const blob =
        new Blob(
            [
                '\uFEFF'
                + csv.join('\n')
            ],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            'a'
        );


    link.href = url;

    link.download =
        'data-barang.csv';


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}