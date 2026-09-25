document.addEventListener('DOMContentLoaded', function () {

    updateDeptDate();

    setInterval(updateDeptDate, 60000);

    if (window.lucide) {
        lucide.createIcons();
    }

});


function updateDeptDate() {

    const dateElement =
        document.getElementById('deptCurrentDate');

    const timeElement =
        document.getElementById('deptCurrentTime');

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
        timeFormatter.format(now) + ' WITA';

}


function filterDeptTable() {

    const search =
        document
            .getElementById('deptSearch')
            .value
            .toLowerCase()
            .trim();

    const rows =
        document.querySelectorAll(
            '#deptTable tbody tr'
        );

    let visible = 0;

    rows.forEach(function (row) {

        const text =
            row.textContent.toLowerCase();

        if (
            search === '' ||
            text.includes(search)
        ) {

            row.style.display = '';
            visible++;

        } else {

            row.style.display = 'none';

        }

    });

    const count =
        document.getElementById(
            'deptShownCount'
        );

    if (count) {
        count.textContent = visible;
    }

}


function resetDeptFilter() {

    const search =
        document.getElementById('deptSearch');

    if (search) {
        search.value = '';
    }

    filterDeptTable();

}


function openDeptModal() {

    const modal =
        document.getElementById('deptModal');

    if (!modal) {
        return;
    }

    modal.classList.add('show');

    document.body.style.overflow =
        'hidden';

    if (window.lucide) {
        lucide.createIcons();
    }

}


function closeDeptModal() {

    const modal =
        document.getElementById('deptModal');

    if (!modal) {
        return;
    }

    modal.classList.remove('show');

    document.body.style.overflow = '';

}


document.addEventListener(
    'keydown',
    function (event) {

        if (event.key === 'Escape') {
            closeDeptModal();
        }

    }
);


function exportDeptCSV() {

    const table =
        document.getElementById('deptTable');

    if (!table) {
        return;
    }

    const rows =
        table.querySelectorAll('tr');

    const csv = [];

    rows.forEach(function (row) {

        if (row.style.display === 'none') {
            return;
        }

        const columns =
            row.querySelectorAll('th, td');

        const values = [];

        columns.forEach(
            function (column, index) {

                if (
                    index ===
                    columns.length - 1
                ) {
                    return;
                }

                const value =
                    column.innerText
                        .replace(/"/g, '""')
                        .trim();

                values.push(
                    '"' + value + '"'
                );

            }
        );

        csv.push(
            values.join(',')
        );

    });

    downloadDeptCSV(
        csv.join('\n')
    );

}


function downloadDeptCSV(content) {

    const blob =
        new Blob(
            ['\uFEFF' + content],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement('a');

    link.href = url;

    link.download =
        'data-departemen.csv';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}