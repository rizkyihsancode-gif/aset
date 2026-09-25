document.addEventListener(
    'DOMContentLoaded',
    function () {

        updateDivisiDate();

        setInterval(
            updateDivisiDate,
            60000
        );

        initDivisiChart();

        if (window.lucide) {
            lucide.createIcons();
        }

    }
);


function updateDivisiDate() {

    const dateElement =
        document.getElementById(
            'divisiCurrentDate'
        );

    const timeElement =
        document.getElementById(
            'divisiCurrentTime'
        );

    if (!dateElement || !timeElement) {
        return;
    }

    const now = new Date();

    const dateFormatter =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'Asia/Makassar'
            }
        );

    const timeFormatter =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Makassar'
            }
        );

    dateElement.textContent =
        dateFormatter.format(now);

    timeElement.textContent =
        timeFormatter.format(now)
        + ' WITA';

}


function filterDivisiTable() {

    const search =
        document
            .getElementById(
                'divisiSearch'
            )
            .value
            .toLowerCase()
            .trim();

    const department =
        document
            .getElementById(
                'divisiDepartment'
            )
            .value
            .toLowerCase()
            .trim();

    const rows =
        document.querySelectorAll(
            '#divisiTable tbody tr'
        );

    let visible = 0;

    rows.forEach(
        function (row) {

            const text =
                row.textContent
                    .toLowerCase();

            const rowDepartment =
                (
                    row.dataset.department
                    || ''
                )
                .toLowerCase();

            const matchSearch =
                search === ''
                ||
                text.includes(search);

            const matchDepartment =
                department === ''
                ||
                department === rowDepartment;

            if (
                matchSearch &&
                matchDepartment
            ) {

                row.style.display = '';

                visible++;

            } else {

                row.style.display = 'none';

            }

        }
    );

    const count =
        document.getElementById(
            'divisiShownCount'
        );

    if (count) {
        count.textContent = visible;
    }

}


function resetDivisiFilter() {

    const search =
        document.getElementById(
            'divisiSearch'
        );

    const department =
        document.getElementById(
            'divisiDepartment'
        );

    if (search) {
        search.value = '';
    }

    if (department) {
        department.selectedIndex = 0;
    }

    filterDivisiTable();

}


function initDivisiChart() {

    if (
        typeof Chart === 'undefined'
    ) {
        return;
    }

    const canvas =
        document.getElementById(
            'divisiDistributionChart'
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
                    'Departemen Keuangan',
                    'Departemen Umum dan SDM',
                    'Departemen Produksi',
                    'Departemen Distribusi',
                    'Departemen Teknik',
                    'Departemen Humas dan Pelayanan'
                ],

                datasets: [{

                    data: [
                        6,
                        8,
                        5,
                        6,
                        5,
                        6
                    ],

                    backgroundColor: [
                        '#3389ee',
                        '#55a8f1',
                        '#4fc184',
                        '#ffc85c',
                        '#ff9024',
                        '#8558e8'
                    ],

                    borderColor:
                        '#ffffff',

                    borderWidth:
                        2

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: '67%',

                plugins: {

                    legend: {
                        display: false
                    }

                }

            }

        }
    );

}


function openDivisiModal() {

    const modal =
        document.getElementById(
            'divisiModal'
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


function closeDivisiModal() {

    const modal =
        document.getElementById(
            'divisiModal'
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


document.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key === 'Escape'
        ) {
            closeDivisiModal();
        }

    }
);


function exportDivisiCSV() {

    const table =
        document.getElementById(
            'divisiTable'
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
                row.style.display ===
                'none'
            ) {
                return;
            }

            const columns =
                row.querySelectorAll(
                    'th, td'
                );

            const values = [];

            columns.forEach(
                function (
                    column,
                    index
                ) {

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
        'data-divisi.csv';

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(url);

}