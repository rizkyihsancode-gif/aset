/* =========================================================
   K.I.B - TANAH
   tanah.js

   Fungsi:
   - Search
   - Filter Lokasi
   - Filter Hak
   - Filter Tahun
   - Filter Status/Kondisi
   - Reset filter
   - Pagination
   - Select All
   - Chart distribusi
   - Modal Tambah
   - Modal Detail
   - Modal Edit
   - Modal Hapus
   - Export CSV
   - Jam/Tanggal WITA
   - Lucide Icon

   Catatan:
   File ini hanya menangani UI.
   CRUD database belum dihubungkan.
========================================================= */


/* =========================================================
   GLOBAL
========================================================= */

let tanahCurrentPage = 1;

let tanahChart = null;

let tanahPreviousOverflow = '';

const tanahNumber =
    new Intl.NumberFormat('id-ID');


/* =========================================================
   DOM HELPER
========================================================= */

function getTanahElement(...ids) {

    for (const id of ids) {

        const element =
            document.getElementById(id);

        if (element) {
            return element;
        }

    }

    return null;

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        /*
         * Jalankan hanya pada halaman Tanah.
         */
        if (
            !document.querySelector(
                '.tanah-page'
            )
        ) {
            return;
        }


        /*
         * Icon Lucide.
         */
        refreshTanahIcons();


        /*
         * Tanggal dan waktu WITA.
         */
        updateTanahDate();

        window.setInterval(
            updateTanahDate,
            1000
        );


        /*
         * Inisialisasi.
         */
        initTanahSearch();

        initTanahFilters();

        initTanahTable();

        initTanahPagination();

        initTanahSelectAll();

        initTanahModal();

        initTanahChart();

        initTanahViewAll();


        /*
         * Render tabel pertama kali.
         */
        renderTanahTable();


    }
);


/* =========================================================
   LUCIDE
========================================================= */

function refreshTanahIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons === 'function'
    ) {

        window.lucide.createIcons();

    }

}


/* =========================================================
   DATE & TIME WITA
========================================================= */

function updateTanahDate() {

    const dateElement =
        getTanahElement(
            'tanahCurrentDate'
        );


    const timeElement =
        getTanahElement(
            'tanahCurrentTime'
        );


    /*
     * Kalau halaman hanya memiliki
     * tanggal tanpa jam.
     */
    if (!dateElement && !timeElement) {
        return;
    }


    const now =
        new Date();


    if (dateElement) {

        dateElement.textContent =

            new Intl.DateTimeFormat(
                'id-ID',
                {
                    timeZone: 'Asia/Makassar',
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }
            ).format(now);

    }


    if (timeElement) {

        timeElement.textContent =

            new Intl.DateTimeFormat(
                'id-ID',
                {
                    timeZone: 'Asia/Makassar',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }
            ).format(now) + ' WITA';

    }

}


/* =========================================================
   SEARCH
========================================================= */

function initTanahSearch() {

    const search =
        getTanahElement(
            'tanahSearch'
        );


    if (!search) {
        return;
    }


    search.addEventListener(
        'input',
        function () {

            tanahCurrentPage = 1;

            renderTanahTable();

        }
    );

}


/* =========================================================
   FILTER
========================================================= */

function initTanahFilters() {

    const filterIds = [

        'tanahLokasi',

        'tanahHak',

        'tanahTahun',

        'tanahStatus',

        'tanahKondisi'

    ];


    filterIds.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (!element) {
                return;
            }


            element.addEventListener(
                'change',
                function () {

                    tanahCurrentPage = 1;

                    renderTanahTable();

                }
            );

        }
    );


    /*
     * Jika ada tombol Filter.
     * Tetap disediakan meskipun filter
     * sudah berjalan otomatis.
     */
    const filterButton =
        getTanahElement(
            'tanahFilterButton'
        );


    if (filterButton) {

        filterButton.addEventListener(
            'click',
            function () {

                tanahCurrentPage = 1;

                renderTanahTable();

            }
        );

    }


    /*
     * Jumlah data per halaman.
     */
    const pageSize =
        getTanahElement(
            'tanahPageSize'
        );


    if (pageSize) {

        pageSize.addEventListener(
            'change',
            function () {

                tanahCurrentPage = 1;

                renderTanahTable();

            }
        );

    }

}


/* =========================================================
   TABLE
========================================================= */

function getTanahTable() {

    return getTanahElement(
        'tanahTable'
    );

}


/* =========================================================
   GET ROWS
========================================================= */

function getTanahRows() {

    const table =
        getTanahTable();


    if (!table) {
        return [];
    }


    return Array.from(

        table.querySelectorAll(
            'tbody tr[data-record]'
        )

    );

}


/* =========================================================
   SEARCHABLE TEXT
========================================================= */

function getTanahRowText(row) {

    /*
     * Ambil seluruh teks tabel.
     * Ini membuat pencarian lebih fleksibel
     * jika jumlah kolom berubah.
     */
    return (

        row.textContent || ''

    )
        .replace(
            /\s+/g,
            ' '
        )
        .trim()
        .toLocaleLowerCase(
            'id-ID'
        );

}


/* =========================================================
   FILTERED ROWS
========================================================= */

function getFilteredTanahRows() {

    const search =
        getTanahElement(
            'tanahSearch'
        )?.value
            ?.trim()
            ?.toLocaleLowerCase(
                'id-ID'
            )
        || '';


    const lokasi =
        getTanahElement(
            'tanahLokasi'
        )?.value
        || '';


    const hak =
        getTanahElement(
            'tanahHak'
        )?.value
        || '';


    const tahun =
        getTanahElement(
            'tanahTahun'
        )?.value
        || '';


    const status =
        getTanahElement(
            'tanahStatus'
        )?.value
        || '';


    const kondisi =
        getTanahElement(
            'tanahKondisi'
        )?.value
        || '';


    return getTanahRows().filter(
        function (row) {

            const searchableText =
                getTanahRowText(
                    row
                );


            /*
             * Ambil dataset.
             */
            const rowLokasi =
                String(
                    row.dataset.lokasi || ''
                );


            const rowHak =
                String(
                    row.dataset.hak || ''
                );


            const rowTahun =
                String(
                    row.dataset.tahun || ''
                );


            const rowStatus =
                String(
                    row.dataset.status || ''
                );


            const rowKondisi =
                String(
                    row.dataset.kondisi || ''
                );


            /*
             * Nilai dataset dibuat lower-case
             * untuk perbandingan yang aman.
             */
            const lokasiMatch =

                !lokasi ||

                rowLokasi === lokasi ||

                rowLokasi
                    .toLocaleLowerCase(
                        'id-ID'
                    ) ===
                    lokasi
                        .toLocaleLowerCase(
                            'id-ID'
                        );


            const hakMatch =

                !hak ||

                rowHak === hak ||

                rowHak
                    .toLocaleLowerCase(
                        'id-ID'
                    ) ===
                    hak
                        .toLocaleLowerCase(
                            'id-ID'
                        );


            const tahunMatch =

                !tahun ||

                rowTahun === tahun;


            const statusMatch =

                !status ||

                rowStatus === status ||

                rowStatus
                    .toLocaleLowerCase(
                        'id-ID'
                    ) ===
                    status
                        .toLocaleLowerCase(
                            'id-ID'
                        );


            const kondisiMatch =

                !kondisi ||

                rowKondisi === kondisi ||

                rowKondisi
                    .toLocaleLowerCase(
                        'id-ID'
                    ) ===
                    kondisi
                        .toLocaleLowerCase(
                            'id-ID'
                        );


            return (

                (
                    !search ||
                    searchableText.includes(
                        search
                    )
                )

                &&

                lokasiMatch

                &&

                hakMatch

                &&

                tahunMatch

                &&

                statusMatch

                &&

                kondisiMatch

            );

        }
    );

}


/* =========================================================
   CHECK ACTIVE FILTER
========================================================= */

function hasTanahFilter() {

    const values = [

        getTanahElement(
            'tanahSearch'
        )?.value?.trim(),

        getTanahElement(
            'tanahLokasi'
        )?.value,

        getTanahElement(
            'tanahHak'
        )?.value,

        getTanahElement(
            'tanahTahun'
        )?.value,

        getTanahElement(
            'tanahStatus'
        )?.value,

        getTanahElement(
            'tanahKondisi'
        )?.value

    ];


    return values.some(
        function (value) {

            return Boolean(value);

        }
    );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderTanahTable() {

    const rows =
        getTanahRows();


    const filteredRows =
        getFilteredTanahRows();


    const pageSize =
        Number(

            getTanahElement(
                'tanahPageSize'
            )?.value

        ) || 10;


    const totalPages =

        Math.max(

            1,

            Math.ceil(
                filteredRows.length /
                pageSize
            )

        );


    tanahCurrentPage =

        Math.min(

            Math.max(
                1,
                tanahCurrentPage
            ),

            totalPages

        );


    const start =

        (
            tanahCurrentPage - 1
        ) * pageSize;


    const end =
        start + pageSize;


    /*
     * Sembunyikan semua data.
     */
    rows.forEach(
        function (row) {

            row.hidden = true;

        }
    );


    /*
     * Tampilkan data halaman aktif.
     */
    const visibleRows =

        filteredRows.slice(
            start,
            end
        );


    visibleRows.forEach(
        function (row, index) {

            row.hidden = false;


            /*
             * Nomor otomatis.
             *
             * Kolom pertama diasumsikan
             * sebagai nomor.
             */
            if (
                row.cells[0]
            ) {

                row.cells[0].textContent =

                    start + index + 1;

            }

        }
    );


    /*
     * Empty state.
     */
    const emptyRow =
        getTanahElement(
            'tanahEmptyRow'
        );


    if (emptyRow) {

        emptyRow.hidden =
            filteredRows.length > 0;

    }


    /*
     * Table info.
     */
    updateTanahTableInfo(

        filteredRows.length,

        rows.length,

        start,

        visibleRows.length

    );


    /*
     * Pagination.
     */
    renderTanahPagination(
        totalPages
    );


    /*
     * Reset select-all.
     */
    updateTanahSelectAllState();


    refreshTanahIcons();

}


/* =========================================================
   TABLE INFO
========================================================= */

function updateTanahTableInfo(

    filteredCount,

    totalCount,

    start,

    visibleCount

) {

    const info =
        getTanahElement(
            'tanahTableInfo'
        );


    if (!info) {
        return;
    }


    if (
        filteredCount === 0
    ) {

        info.textContent =
            'Tidak ada data yang sesuai.';

        return;

    }


    const from =
        start + 1;


    const to =
        start + visibleCount;


    if (
        hasTanahFilter()
    ) {

        info.textContent =

            `Menampilkan ${tanahNumber.format(from)}–${tanahNumber.format(to)} dari ${tanahNumber.format(filteredCount)} hasil filter`;

    }

    else {

        info.textContent =

            `Menampilkan ${tanahNumber.format(from)}–${tanahNumber.format(to)} dari ${tanahNumber.format(totalCount)} data`;

    }

}


/* =========================================================
   PAGINATION
========================================================= */

function initTanahPagination() {

    /*
     * Pagination dibuat secara dinamis
     * oleh renderTanahPagination().
     */

}


/* =========================================================
   RENDER PAGINATION
========================================================= */

function renderTanahPagination(
    totalPages
) {

    const pagination =
        getTanahElement(
            'tanahPagination'
        );


    if (!pagination) {
        return;
    }


    pagination.replaceChildren();


    function addButton(

        label,

        page,

        disabled = false,

        active = false,

        icon = ''

    ) {

        const button =
            document.createElement(
                'button'
            );


        button.type =
            'button';


        button.disabled =
            disabled;


        button.setAttribute(

            'aria-label',

            label === '‹'

                ? 'Halaman sebelumnya'

                : label === '›'

                    ? 'Halaman berikutnya'

                    : `Halaman ${page}`

        );


        if (active) {

            button.classList.add(
                'active'
            );

            button.setAttribute(
                'aria-current',
                'page'
            );

        }


        if (icon) {

            const iconElement =
                document.createElement(
                    'i'
                );


            iconElement.setAttribute(
                'data-lucide',
                icon
            );


            iconElement.setAttribute(
                'aria-hidden',
                'true'
            );


            button.appendChild(
                iconElement
            );

        }

        else {

            button.textContent =
                label;

        }


        button.addEventListener(
            'click',
            function () {

                if (
                    disabled
                ) {
                    return;
                }


                tanahCurrentPage =
                    page;


                renderTanahTable();


                /*
                 * Fokus kembali ke
                 * halaman aktif.
                 */
                window.setTimeout(
                    function () {

                        pagination
                            .querySelector(
                                '[aria-current="page"]'
                            )
                            ?.focus({
                                preventScroll:
                                    true
                            });

                    },
                    0
                );

            }
        );


        pagination.appendChild(
            button
        );

    }


    /*
     * Previous.
     */
    addButton(

        '‹',

        Math.max(
            1,
            tanahCurrentPage - 1
        ),

        tanahCurrentPage === 1,

        false,

        'chevron-left'

    );


    /*
     * Jika halaman sedikit.
     */
    if (
        totalPages <= 7
    ) {

        for (
            let page = 1;

            page <= totalPages;

            page++
        ) {

            addButton(

                String(page),

                page,

                false,

                page === tanahCurrentPage

            );

        }

    }

    else {

        /*
         * Halaman pertama.
         */
        addButton(

            '1',

            1,

            false,

            tanahCurrentPage === 1

        );


        /*
         * Dekat awal.
         */
        if (
            tanahCurrentPage <= 4
        ) {

            for (
                let page = 2;

                page <= 5;

                page++
            ) {

                addButton(

                    String(page),

                    page,

                    false,

                    page === tanahCurrentPage

                );

            }


            addPaginationDots();

        }


        /*
         * Tengah.
         */
        else if (
            tanahCurrentPage <
            totalPages - 3
        ) {

            addPaginationDots();


            for (
                let page =
                    tanahCurrentPage - 1;

                page <=
                    tanahCurrentPage + 1;

                page++
            ) {

                addButton(

                    String(page),

                    page,

                    false,

                    page === tanahCurrentPage

                );

            }


            addPaginationDots();

        }


        /*
         * Dekat akhir.
         */
        else {

            addPaginationDots();


            for (
                let page =
                    totalPages - 4;

                page <=
                    totalPages - 1;

                page++
            ) {

                addButton(

                    String(page),

                    page,

                    false,

                    page === tanahCurrentPage

                );

            }

        }


        /*
         * Halaman terakhir.
         */
        addButton(

            String(totalPages),

            totalPages,

            false,

            tanahCurrentPage === totalPages

        );

    }


    /*
     * Next.
     */
    addButton(

        '›',

        Math.min(

            totalPages,

            tanahCurrentPage + 1

        ),

        tanahCurrentPage === totalPages,

        false,

        'chevron-right'

    );


    refreshTanahIcons();

}


/* =========================================================
   PAGINATION DOTS
========================================================= */

function addPaginationDots() {

    const pagination =
        getTanahElement(
            'tanahPagination'
        );


    if (!pagination) {
        return;
    }


    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.disabled =
        true;


    button.textContent =
        '...';


    button.setAttribute(
        'aria-hidden',
        'true'
    );


    pagination.appendChild(
        button
    );

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetTanahFilter() {

    const ids = [

        'tanahSearch',

        'tanahLokasi',

        'tanahHak',

        'tanahTahun',

        'tanahStatus',

        'tanahKondisi'

    ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value =
                    '';

            }

        }
    );


    tanahCurrentPage =
        1;


    renderTanahTable();

}


/* =========================================================
   TABLE ACTION
========================================================= */

function initTanahTable() {

    const table =
        getTanahTable();


    if (!table) {
        return;
    }


    table.addEventListener(
        'click',
        function (event) {

            const button =
                event.target.closest(
                    'button[data-action]'
                );


            if (!button) {
                return;
            }


            const row =
                button.closest(
                    'tr[data-record]'
                );


            if (!row) {
                return;
            }


            openTanahModal(

                button.dataset.action,

                row

            );

        }
    );

}


/* =========================================================
   VIEW ALL
========================================================= */

function initTanahViewAll() {

    const viewAll =
        getTanahElement(
            'tanahViewAll'
        );


    if (!viewAll) {
        return;
    }


    viewAll.addEventListener(
        'click',
        function (event) {

            event.preventDefault();


            resetTanahFilter();


            const list =
                getTanahElement(
                    'tanahList'
                );


            if (list) {

                list.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

            }


            getTanahElement(
                'tanahSearch'
            )?.focus({
                preventScroll: true
            });

        }
    );

}


/* =========================================================
   SELECT ALL
========================================================= */

function initTanahSelectAll() {

    const table =
        getTanahTable();


    if (!table) {
        return;
    }


    const selectAll =
        table.querySelector(
            'thead input[type="checkbox"]'
        );


    if (!selectAll) {
        return;
    }


    selectAll.addEventListener(
        'change',
        function () {

            const rows =
                getTanahRows();


            rows.forEach(
                function (row) {

                    if (
                        row.hidden
                    ) {
                        return;
                    }


                    const checkbox =
                        row.querySelector(
                            'input[type="checkbox"]'
                        );


                    if (checkbox) {

                        checkbox.checked =
                            selectAll.checked;

                    }

                }
            );


            updateTanahSelectAllState();

        }
    );


    /*
     * Checkbox individual.
     */
    table.addEventListener(
        'change',
        function (event) {

            if (
                !event.target.matches(
                    'tbody input[type="checkbox"]'
                )
            ) {
                return;
            }


            updateTanahSelectAllState();

        }
    );

}


/* =========================================================
   SELECT ALL STATE
========================================================= */

function updateTanahSelectAllState() {

    const table =
        getTanahTable();


    if (!table) {
        return;
    }


    const selectAll =
        table.querySelector(
            'thead input[type="checkbox"]'
        );


    if (!selectAll) {
        return;
    }


    const visibleRows =
        getTanahRows().filter(
            function (row) {

                return !row.hidden;

            }
        );


    const checkboxes =
        visibleRows
            .map(
                function (row) {

                    return row.querySelector(
                        'input[type="checkbox"]'
                    );

                }
            )
            .filter(Boolean);


    const checked =
        checkboxes.filter(
            function (checkbox) {

                return checkbox.checked;

            }
        );


    selectAll.checked =

        checkboxes.length > 0 &&

        checked.length ===
        checkboxes.length;


    selectAll.indeterminate =

        checked.length > 0 &&

        checked.length <
        checkboxes.length;

}


/* =========================================================
   GET SELECTED ROWS
========================================================= */

function getSelectedTanahRows() {

    return getTanahRows().filter(
        function (row) {

            const checkbox =
                row.querySelector(
                    'input[type="checkbox"]'
                );


            return (
                checkbox &&
                checkbox.checked
            );

        }
    );

}


/* =========================================================
   CLEAR SELECTION
========================================================= */

function clearTanahSelection() {

    getTanahRows().forEach(
        function (row) {

            const checkbox =
                row.querySelector(
                    'input[type="checkbox"]'
                );


            if (checkbox) {

                checkbox.checked =
                    false;

            }

        }
    );


    updateTanahSelectAllState();

}


/* =========================================================
   CHART
========================================================= */

function initTanahChart() {

    const canvas =
        getTanahElement(
            'tanahDistributionChart'
        );


    const legend =
        getTanahElement(
            'tanahLegend'
        );


    if (
        !canvas ||
        !legend
    ) {
        return;
    }


    const groups =
        Array.from(

            legend.querySelectorAll(
                '[data-count]'
            )

        );


    if (!groups.length) {
        return;
    }


    const labels =
        groups.map(
            function (item) {

                return item.dataset.label ||
                    '';

            }
        );


    const counts =
        groups.map(
            function (item) {

                return Number(
                    item.dataset.count
                ) || 0;

            }
        );


    const colors =
        groups.map(
            function (item) {

                return item.dataset.color ||
                    '#3389ee';

            }
        );


    const total =
        counts.reduce(
            function (
                sum,
                value
            ) {

                return sum + value;

            },
            0
        );


    /*
     * Update angka tengah.
     */
    const center =
        canvas.parentElement
            ?.querySelector(
                '.tanah-chart-center strong'
            );


    if (center) {

        center.textContent =
            tanahNumber.format(
                total
            );

    }


    /*
     * Hancurkan chart sebelumnya.
     */
    if (tanahChart) {

        tanahChart.destroy();

        tanahChart =
            null;

    }


    const wrap =
        canvas.parentElement;


    /*
     * Chart.js tersedia.
     */
    if (
        typeof window.Chart ===
        'function'
    ) {

        canvas.hidden =
            false;


        wrap?.classList.remove(
            'tanah-chart-fallback'
        );


        if (wrap) {

            wrap.style.background =
                '';

        }


        tanahChart =
            new window.Chart(
                canvas,
                {

                    type:
                        'doughnut',


                    data: {

                        labels:
                            labels,


                        datasets: [

                            {

                                data:
                                    counts,


                                backgroundColor:
                                    colors,


                                borderColor:
                                    '#ffffff',


                                borderWidth:
                                    2


                            }

                        ]

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

                                display:
                                    false

                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function (
                                            context
                                        ) {

                                            const value =
                                                context.raw
                                                || 0;


                                            const percentage =

                                                total

                                                    ? (
                                                        value /
                                                        total *
                                                        100
                                                    ).toFixed(1)

                                                    : 0;


                                            return (

                                                ` ${value} data (${percentage}%)`

                                            );

                                        }

                                }

                            }

                        }

                    }

                }

            );


        return;

    }


    /*
     * Fallback jika Chart.js tidak tersedia.
     */
    if (wrap) {

        let current =
            0;


        const segments =
            counts.map(
                function (
                    count,
                    index
                ) {

                    const start =
                        current;


                    current +=

                        total

                            ? (
                                count /
                                total *
                                360
                            )

                            : 0;


                    return (

                        `${colors[index]} ${start}deg ${current}deg`

                    );

                }
            );


        canvas.hidden =
            true;


        wrap.classList.add(
            'tanah-chart-fallback'
        );


        wrap.style.background =

            total

                ? `conic-gradient(${segments.join(',')})`

                : '#e7ecf2';

    }

}


/* =========================================================
   MODAL
========================================================= */

function initTanahModal() {

    const modal =
        getTanahElement(
            'tanahModal'
        );


    if (!modal) {
        return;
    }


    /*
     * Klik backdrop.
     */
    modal.addEventListener(
        'click',
        function (event) {

            if (
                event.target !==
                modal
            ) {
                return;
            }


            const rect =
                modal.getBoundingClientRect();


            const outside =

                event.clientX <
                    rect.left

                ||

                event.clientX >
                    rect.right

                ||

                event.clientY <
                    rect.top

                ||

                event.clientY >
                    rect.bottom;


            if (outside) {

                closeTanahModal();

            }

        }
    );


    /*
     * Ketika modal ditutup.
     */
    modal.addEventListener(
        'close',
        function () {

            document.body.style.overflow =
                tanahPreviousOverflow;

        }
    );


    /*
     * Form belum terhubung backend.
     */
    const form =
        getTanahElement(
            'tanahForm'
        );


    if (form) {

        form.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();

            }
        );

    }

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openTanahModal(

    mode = 'add',

    row = null

) {

    const modal =
        getTanahElement(
            'tanahModal'
        );


    if (
        !modal ||
        modal.open
    ) {
        return;
    }


    const titles = {

        add:
            'Tambah Data Tanah',

        view:
            'Detail Data Tanah',

        edit:
            'Edit Data Tanah',

        delete:
            'Hapus Data Tanah'

    };


    const descriptions = {

        add:
            'Tambahkan data aset tanah.',

        view:
            'Informasi detail aset tanah.',

        edit:
            'Perbarui informasi aset tanah.',

        delete:
            'Periksa data tanah yang akan dihapus.'

    };


    const title =
        getTanahElement(
            'tanahModalTitle'
        );


    const description =
        getTanahElement(
            'tanahModalDescription'
        );


    if (title) {

        title.textContent =

            titles[mode] ||
            titles.add;

    }


    if (description) {

        description.textContent =

            descriptions[mode] ||
            descriptions.add;

    }


    /*
     * Reset form.
     */
    const form =
        getTanahElement(
            'tanahForm'
        );


    if (
        form &&
        mode === 'add'
    ) {

        form.reset();

    }


    /*
     * Ambil semua field.
     */
    const fields = {

        code:
            getTanahElement(
                'tanahCode'
            ),

        name:
            getTanahElement(
                'tanahName'
            ),

        register:
            getTanahElement(
                'tanahRegister'
            ),

        luas:
            getTanahElement(
                'tanahLuas'
            ),

        tahun:
            getTanahElement(
                'tanahFormTahun'
            ),

        lokasi:
            getTanahElement(
                'tanahFormLokasi'
            ),

        hak:
            getTanahElement(
                'tanahFormHak'
            ),

        sertifikat:
            getTanahElement(
                'tanahSertifikat'
            ),

        penggunaan:
            getTanahElement(
                'tanahPenggunaan'
            ),

        nilai:
            getTanahElement(
                'tanahNilai'
            ),

        buku:
            getTanahElement(
                'tanahBuku'
            ),

        kondisi:
            getTanahElement(
                'tanahFormKondisi'
            ),

        status:
            getTanahElement(
                'tanahFormStatus'
            ),

        keterangan:
            getTanahElement(
                'tanahKeterangan'
            )

    };


    /*
     * Isi data dari row.
     */
    if (row) {

        setTanahField(
            fields.code,
            getTanahRowValue(
                row,
                [
                    'kode',
                    'kodeAset',
                    'code'
                ],
                [
                    'kode',
                    'kode aset'
                ]
            )
        );


        setTanahField(
            fields.name,
            getTanahRowValue(
                row,
                [
                    'nama',
                    'namaTanah',
                    'name'
                ],
                [
                    'nama',
                    'nama tanah'
                ]
            )
        );


        setTanahField(
            fields.register,
            getTanahRowValue(
                row,
                [
                    'register',
                    'noRegister'
                ],
                [
                    'register'
                ]
            )
        );


        setTanahField(
            fields.luas,
            getTanahRowValue(
                row,
                [
                    'luas',
                    'luasTanah'
                ],
                [
                    'luas'
                ]
            )
        );


        setTanahField(
            fields.tahun,
            getTanahRowValue(
                row,
                [
                    'tahun',
                    'tahunPerolehan'
                ],
                [
                    'tahun',
                    'tahun perolehan'
                ]
            )
        );


        setTanahField(
            fields.lokasi,
            getTanahRowValue(
                row,
                [
                    'lokasi',
                    'alamat',
                    'letak'
                ],
                [
                    'lokasi',
                    'alamat',
                    'letak'
                ]
            )
        );


        setTanahField(
            fields.hak,
            getTanahRowValue(
                row,
                [
                    'hak',
                    'statusHak'
                ],
                [
                    'hak'
                ]
            )
        );


        setTanahField(
            fields.sertifikat,
            getTanahRowValue(
                row,
                [
                    'sertifikat',
                    'noSertifikat'
                ],
                [
                    'sertifikat'
                ]
            )
        );


        setTanahField(
            fields.penggunaan,
            getTanahRowValue(
                row,
                [
                    'penggunaan',
                    'digunakanUntuk'
                ],
                [
                    'penggunaan'
                ]
            )
        );


        setTanahField(
            fields.nilai,
            getTanahRowValue(
                row,
                [
                    'nilai',
                    'nilaiPerolehan',
                    'harga'
                ],
                [
                    'nilai',
                    'perolehan',
                    'harga'
                ]
            )
        );


        setTanahField(
            fields.buku,
            getTanahRowValue(
                row,
                [
                    'nilaiBuku',
                    'buku'
                ],
                [
                    'nilai buku'
                ]
            )
        );


        setTanahField(
            fields.kondisi,
            getTanahRowValue(
                row,
                [
                    'kondisi'
                ],
                [
                    'kondisi'
                ]
            )
        );


        setTanahField(
            fields.status,
            getTanahRowValue(
                row,
                [
                    'status'
                ],
                [
                    'status'
                ]
            )
        );


        setTanahField(
            fields.keterangan,
            getTanahRowValue(
                row,
                [
                    'keterangan',
                    'description',
                    'deskripsi'
                ],
                [
                    'keterangan',
                    'deskripsi'
                ]
            )
        );

    }


    /*
     * View dan Delete = readonly.
     */
    const readonly =

        mode === 'view' ||

        mode === 'delete';


    Object.values(fields)
        .filter(Boolean)
        .forEach(
            function (field) {

                const tag =
                    field.tagName
                        ?.toLowerCase();


                if (
                    tag === 'select'
                ) {

                    field.disabled =
                        readonly;

                }

                else {

                    field.readOnly =
                        readonly;

                }

            }
        );


    /*
     * Tombol simpan.
     */
    const save =
        getTanahElement(
            'tanahSaveButton'
        );


    if (save) {

        save.hidden =
            mode === 'view';


        /*
         * Backend belum dihubungkan.
         * Jangan submit data palsu.
         */
        save.disabled =
            true;


        save.textContent =

            mode === 'delete'

                ? 'Hapus Data Tanah'

                : 'Simpan Data Tanah';


        save.classList.toggle(

            'tanah-delete-button',

            mode === 'delete'

        );

    }


    /*
     * Note modal.
     */
    const note =
        getTanahElement(
            'tanahModalNote'
        );


    if (note) {

        note.textContent =

            mode === 'view'

                ? 'Data contoh untuk pratinjau tampilan.'

                : mode === 'delete'

                    ? 'Pratinjau konfirmasi. Penghapusan database belum dihubungkan.'

                    : 'Pratinjau formulir. Penyimpanan database belum dihubungkan.';

    }


    /*
     * Simpan overflow.
     */
    tanahPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';


    /*
     * Native dialog.
     */
    if (
        typeof modal.showModal ===
        'function'
    ) {

        modal.showModal();

    }

    else {

        modal.setAttribute(
            'open',
            ''
        );

    }


    /*
     * Fokus field pertama.
     */
    if (
        !readonly
    ) {

        fields.code?.focus();

    }


    refreshTanahIcons();

}


/* =========================================================
   GET ROW VALUE
========================================================= */

function getTanahRowValue(

    row,

    datasetKeys = [],

    headerNames = []

) {

    /*
     * 1. Prioritaskan dataset.
     */
    for (
        const key of datasetKeys
    ) {

        const value =
            row.dataset[key];


        if (
            value !== undefined &&
            value !== ''
        ) {

            return value;

        }

    }


    /*
     * 2. Cari berdasarkan nama header.
     */
    const table =
        row.closest(
            'table'
        );


    const headers =
        table

            ? Array.from(
                table.querySelectorAll(
                    'thead th'
                )
            )

            : [];


    const normalizedHeaders =
        headers.map(
            function (header) {

                return normalizeTanahText(
                    header.textContent
                );

            }
        );


    for (
        const headerName of headerNames
    ) {

        const index =
            normalizedHeaders.findIndex(
                function (header) {

                    return header.includes(
                        normalizeTanahText(
                            headerName
                        )
                    );

                }
            );


        if (
            index >= 0 &&
            row.cells[index]
        ) {

            return cleanTanahText(

                row.cells[index]
                    .textContent

            );

        }

    }


    return '';

}


/* =========================================================
   SET FIELD
========================================================= */

function setTanahField(
    field,
    value
) {

    if (!field) {
        return;
    }


    field.value =
        value ?? '';

}


/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeTanahText(
    value
) {

    return String(
        value || ''
    )
        .replace(
            /\s+/g,
            ' '
        )
        .trim()
        .toLocaleLowerCase(
            'id-ID'
        );

}


/* =========================================================
   CLEAN TEXT
========================================================= */

function cleanTanahText(
    value
) {

    return String(
        value || ''
    )
        .replace(
            /\s+/g,
            ' '
        )
        .trim();

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeTanahModal() {

    const modal =
        getTanahElement(
            'tanahModal'
        );


    if (!modal) {
        return;
    }


    if (
        modal.open &&
        typeof modal.close ===
            'function'
    ) {

        modal.close();

    }

    else {

        modal.removeAttribute(
            'open'
        );


        document.body.style.overflow =
            tanahPreviousOverflow;

    }

}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportTanahCSV() {

    const rows =
        getFilteredTanahRows();


    const table =
        getTanahTable();


    if (
        !table
    ) {
        return;
    }


    /*
     * Ambil header tabel.
     */
    const headers =
        Array.from(

            table.querySelectorAll(
                'thead th'
            )

        )
        .map(
            function (header) {

                return cleanTanahText(
                    header.textContent
                );

            }
        );


    /*
     * Tentukan kolom Aksi.
     */
    const actionIndex =
        headers.findIndex(
            function (header) {

                return normalizeTanahText(
                    header
                ) === 'aksi';

            }
        );


    const exportHeaders =

        actionIndex >= 0

            ? headers.filter(
                function (_, index) {

                    return index !==
                        actionIndex;

                }
            )

            : headers;


    const records = [
        exportHeaders
    ];


    /*
     * Data.
     */
    rows.forEach(
        function (row, rowIndex) {

            const values =
                Array.from(
                    row.cells
                )
                .map(
                    function (cell) {

                        return cleanTanahText(
                            cell.textContent
                        );

                    }
                );


            /*
             * Hapus kolom aksi.
             */
            if (
                actionIndex >= 0
            ) {

                values.splice(
                    actionIndex,
                    1
                );

            }


            /*
             * Nomor disesuaikan dengan
             * urutan hasil filter.
             */
            if (
                values.length > 0
            ) {

                values[0] =
                    rowIndex + 1;

            }


            records.push(
                values
            );

        }
    );


    /*
     * Convert CSV.
     */
    const csv =

        records
            .map(
                function (record) {

                    return record
                        .map(
                            tanahCsvCell
                        )
                        .join(',');

                }
            )
            .join('\r\n');


    /*
     * UTF-8 BOM.
     */
    const blob =
        new Blob(

            [

                '\uFEFF' +
                csv

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


    link.href =
        url;


    link.download =
        'data-tanah.csv';


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    window.setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}


/* =========================================================
   CSV CELL
========================================================= */

function tanahCsvCell(
    value
) {

    let text =
        String(
            value ?? ''
        );


    /*
     * Cegah formula injection
     * ketika CSV dibuka di Excel.
     */
    if (
        /^[\s]*[=+@-]/.test(
            text
        )
        ||
        /^[\t\r\n]/.test(
            text
        )
    ) {

        text =
            "'" +
            text;

    }


    /*
     * Escape tanda kutip.
     */
    text =
        text.replace(
            /"/g,
            '""'
        );


    return (
        '"' +
        text +
        '"'
    );

}


/* =========================================================
   GLOBAL FUNCTION
   Untuk onclick="" di Blade.
========================================================= */

window.openTanahModal =
    openTanahModal;


window.closeTanahModal =
    closeTanahModal;


window.resetTanahFilter =
    resetTanahFilter;


window.exportTanahCSV =
    exportTanahCSV;


window.getSelectedTanahRows =
    getSelectedTanahRows;


window.clearTanahSelection =
    clearTanahSelection;


/* =========================================================
   END
========================================================= */