/* =========================================================
   SISTEM ASET - MASTER DATA BARANG
   =========================================================
   FUNGSI:
   1. CRUD Barang
   2. Search
   3. Filter Golongan
   4. Pagination
   5. Total Barang
   6. Total Golongan
   7. Update Terakhir
   8. Chart Distribusi Golongan
   9. Barang Terbaru
   10. Export CSV
   11. Last Seen / Last Update
   12. Penyimpanan sementara menggunakan localStorage

   CATATAN:
   Backend PostgreSQL belum digunakan.
   Setelah backend selesai, storage ini dapat diganti
   dengan fetch() ke Laravel Controller.
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let barangCurrentPage = 1;
let barangChart = null;
let barangPreviousOverflow = '';

const BARANG_STORAGE_KEY =
    'sistem_aset_barang_v2';

const barangNumber =
    new Intl.NumberFormat('id-ID');


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const table =
            document.getElementById(
                'barangTable'
            );

        /*
         * Jika bukan halaman Barang,
         * jangan jalankan script.
         */

        if (!table) {
            return;
        }


        /*
         * Pastikan data tersedia.
         */

        initializeBarangData();


        /*
         * Jam WITA.
         */

        updateBarangDate();

        window.setInterval(
            updateBarangDate,
            1000
        );


        /*
         * Render seluruh UI.
         */

        renderBarangPage();


        /*
         * Event search.
         */

        const search =
            document.getElementById(
                'barangSearch'
            );

        if (search) {

            search.addEventListener(
                'input',
                function () {

                    barangCurrentPage = 1;

                    renderBarangPage();

                }
            );

        }


        /*
         * Event filter golongan.
         */

        const golongan =
            document.getElementById(
                'barangGolongan'
            );

        if (golongan) {

            golongan.addEventListener(
                'change',
                function () {

                    barangCurrentPage = 1;

                    renderBarangPage();

                }
            );

        }


        /*
         * Event jumlah data per halaman.
         */

        const pageSize =
            document.getElementById(
                'barangPageSize'
            );

        if (pageSize) {

            pageSize.addEventListener(
                'change',
                function () {

                    barangCurrentPage = 1;

                    renderBarangPage();

                }
            );

        }


        /*
         * Event tabel.
         *
         * Menggunakan event delegation.
         */

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
                    button.closest('tr');


                if (!row) {
                    return;
                }


                const action =
                    button.dataset.action;


                const id =
                    row.dataset.id;


                handleBarangAction(
                    action,
                    id
                );

            }
        );


        /*
         * Form CRUD.
         */

        const form =
            document.getElementById(
                'barangForm'
            );


        if (form) {

            form.addEventListener(
                'submit',
                function (event) {

                    event.preventDefault();

                    submitBarangForm();

                }
            );

        }


        /*
         * Modal.
         */

        const modal =
            document.getElementById(
                'barangModal'
            );


        if (modal) {

            modal.addEventListener(
                'click',
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        closeBarangModal();

                    }

                }
            );


            modal.addEventListener(
                'close',
                function () {

                    document.body.style.overflow =
                        barangPreviousOverflow;

                }
            );

        }


        /*
         * Lihat semua barang.
         */

        const viewAll =
            document.getElementById(
                'barangViewAll'
            );


        if (viewAll) {

            viewAll.addEventListener(
                'click',
                function (event) {

                    event.preventDefault();

                    resetBarangFilter();


                    const list =
                        document.getElementById(
                            'barangList'
                        );


                    if (list) {

                        list.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });

                    }

                }
            );

        }


        /*
         * Lucide.
         */

        refreshBarangIcons();

    }
);


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getBarangStorage() {

    try {

        const raw =
            localStorage.getItem(
                BARANG_STORAGE_KEY
            );


        if (!raw) {
            return [];
        }


        const parsed =
            JSON.parse(raw);


        if (!Array.isArray(parsed)) {
            return [];
        }


        return parsed;

    } catch (error) {

        console.error(
            'Gagal membaca localStorage Barang:',
            error
        );


        return [];

    }

}


function saveBarangStorage(
    records
) {

    try {

        localStorage.setItem(
            BARANG_STORAGE_KEY,
            JSON.stringify(records)
        );

    } catch (error) {

        console.error(
            'Gagal menyimpan data Barang:',
            error
        );

        showBarangMessage(
            'Data gagal disimpan pada browser.',
            'error'
        );

    }

}


/* =========================================================
   INITIAL DATA
========================================================= */

function initializeBarangData() {

    let records =
        getBarangStorage();


    /*
     * Jika localStorage belum mempunyai data,
     * ambil data dari tabel Blade.
     */

    if (records.length === 0) {

        const rows =
            Array.from(
                document.querySelectorAll(
                    '#barangTable tbody tr'
                )
            )
            .filter(
                function (row) {

                    return (
                        row.id !==
                        'barangEmptyRow' &&
                        row.cells.length >= 4
                    );

                }
            );


        records =
            rows.map(
                function (row, index) {

                    const name =
                        row.cells[1]
                            ? row.cells[1]
                                .textContent
                                .trim()
                            : '';


                    const code =
                        row.cells[2]
                            ? row.cells[2]
                                .textContent
                                .trim()
                            : '';


                    const group =
                        row.dataset.golongan ||
                        (
                            row.cells[3]
                                ? row.cells[3]
                                    .textContent
                                    .trim()
                                : ''
                        );


                    return {

                        id:
                            'barang-' +
                            Date.now() +
                            '-' +
                            index,

                        nama_barang:
                            name,

                        kode_barang:
                            code,

                        golongan:
                            group,

                        created_at:
                            new Date().toISOString(),

                        updated_at:
                            new Date().toISOString()

                    };

                }
            );


        /*
         * Simpan data awal.
         */

        saveBarangStorage(
            records
        );

    }


    /*
     * Tandai data sebagai sudah
     * menggunakan sistem baru.
     */

    document.body.dataset.barangReady =
        'true';

}


/* =========================================================
   GET ALL DATA
========================================================= */

function getBarangData() {

    return getBarangStorage();

}


/* =========================================================
   FILTER DATA
========================================================= */

function getFilteredBarangData() {

    const records =
        getBarangData();


    const searchElement =
        document.getElementById(
            'barangSearch'
        );


    const groupElement =
        document.getElementById(
            'barangGolongan'
        );


    const search =
        searchElement
            ? searchElement.value
                .trim()
                .toLocaleLowerCase('id-ID')
            : '';


    const group =
        groupElement
            ? groupElement.value
            : '';


    return records.filter(
        function (item) {

            const name =
                String(
                    item.nama_barang || ''
                )
                .toLocaleLowerCase(
                    'id-ID'
                );


            const code =
                String(
                    item.kode_barang || ''
                )
                .toLocaleLowerCase(
                    'id-ID'
                );


            const golongan =
                String(
                    item.golongan || ''
                );


            const searchMatch =
                !search ||
                name.includes(search) ||
                code.includes(search);


            const groupMatch =
                !group ||
                golongan === group;


            return (
                searchMatch &&
                groupMatch
            );

        }
    );

}


/* =========================================================
   RENDER MAIN PAGE
========================================================= */

function renderBarangPage() {

    renderBarangTable();

    updateBarangKPI();

    updateBarangChart();

    updateBarangLatest();

    updateBarangLastSeen();

    updateBarangGolonganOptions();

    refreshBarangIcons();

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderBarangTable() {

    const table =
        document.getElementById(
            'barangTable'
        );


    if (!table) {
        return;
    }


    const tbody =
        table.querySelector('tbody');


    if (!tbody) {
        return;
    }


    const records =
        getFilteredBarangData();


    const pageSizeElement =
        document.getElementById(
            'barangPageSize'
        );


    const pageSize =
        pageSizeElement
            ? Number(
                pageSizeElement.value
            ) || 10
            : 10;


    const total =
        records.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total / pageSize
            )
        );


    barangCurrentPage =
        Math.min(
            Math.max(
                1,
                barangCurrentPage
            ),
            totalPages
        );


    const start =
        (
            barangCurrentPage - 1
        ) * pageSize;


    const visibleRecords =
        records.slice(
            start,
            start + pageSize
        );


    /*
     * Buat ulang tbody.
     */

    tbody.replaceChildren();


    /*
     * Empty state.
     */

    if (
        visibleRecords.length === 0
    ) {

        const empty =
            document.createElement(
                'tr'
            );


        empty.id =
            'barangEmptyRow';


        const cell =
            document.createElement(
                'td'
            );


        cell.colSpan = 5;


        cell.className =
            'barang-empty';


        cell.textContent =
            'Tidak ada barang yang sesuai. Coba kata kunci atau golongan lain.';


        empty.appendChild(cell);

        tbody.appendChild(empty);

    }


    /*
     * Render data.
     */

    visibleRecords.forEach(
        function (item, index) {

            const row =
                document.createElement(
                    'tr'
                );


            row.dataset.id =
                item.id;


            row.dataset.golongan =
                item.golongan || '';


            /*
             * Nomor.
             */

            const no =
                document.createElement(
                    'td'
                );


            no.textContent =
                start + index + 1;


            /*
             * Nama.
             */

            const name =
                document.createElement(
                    'td'
                );


            name.textContent =
                item.nama_barang || '-';


            /*
             * Kode.
             */

            const code =
                document.createElement(
                    'td'
                );


            code.textContent =
                item.kode_barang || '-';


            /*
             * Golongan.
             */

            const group =
                document.createElement(
                    'td'
                );


            group.textContent =
                item.golongan || '-';


            /*
             * Aksi.
             */

            const actionCell =
                document.createElement(
                    'td'
                );


            const actionWrap =
                document.createElement(
                    'div'
                );


            actionWrap.className =
                'barang-actions';


            /*
             * View.
             */

            actionWrap.appendChild(
                createBarangActionButton(
                    'view',
                    'eye',
                    'Lihat barang',
                    item.nama_barang
                )
            );


            /*
             * Edit.
             */

            actionWrap.appendChild(
                createBarangActionButton(
                    'edit',
                    'square-pen',
                    'Edit barang',
                    item.nama_barang
                )
            );


            /*
             * Delete.
             */

            actionWrap.appendChild(
                createBarangActionButton(
                    'delete',
                    'trash-2',
                    'Hapus barang',
                    item.nama_barang
                )
            );


            actionCell.appendChild(
                actionWrap
            );


            row.appendChild(no);
            row.appendChild(name);
            row.appendChild(code);
            row.appendChild(group);
            row.appendChild(actionCell);


            tbody.appendChild(row);

        }
    );


    /*
     * Update footer.
     */

    updateBarangTableInfo(
        total,
        start,
        pageSize
    );


    /*
     * Pagination.
     */

    renderBarangPagination(
        totalPages
    );

}


/* =========================================================
   ACTION BUTTON
========================================================= */

function createBarangActionButton(
    action,
    icon,
    title,
    name
) {

    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.className =
        action;


    button.dataset.action =
        action;


    button.title =
        title;


    button.setAttribute(
        'aria-label',
        `${title} ${name || 'barang'}`
    );


    const iconElement =
        document.createElement(
            'i'
        );


    iconElement.dataset.lucide =
        icon;


    button.appendChild(
        iconElement
    );


    return button;

}


/* =========================================================
   TABLE INFO
========================================================= */

function updateBarangTableInfo(
    total,
    start,
    pageSize
) {

    const info =
        document.getElementById(
            'barangTableInfo'
        );


    if (!info) {
        return;
    }


    if (total === 0) {

        info.textContent =
            'Tidak ada data barang';

        return;

    }


    const from =
        start + 1;


    const to =
        Math.min(
            start + pageSize,
            total
        );


    const all =
        getBarangData();


    let text =
        `Menampilkan ${barangNumber.format(from)}–${barangNumber.format(to)} dari ${barangNumber.format(total)} data`;


    /*
     * Jika sedang difilter.
     */

    if (
        total !== all.length
    ) {

        text +=
            ` (total ${barangNumber.format(all.length)})`;

    }


    info.textContent =
        text;

}


/* =========================================================
   PAGINATION
========================================================= */

function renderBarangPagination(
    totalPages
) {

    const pagination =
        document.getElementById(
            'barangPagination'
        );


    if (!pagination) {
        return;
    }


    pagination.replaceChildren();


    /*
     * Previous.
     */

    const previous =
        createBarangPageButton(
            '‹',
            barangCurrentPage - 1,
            barangCurrentPage === 1
        );


    previous.setAttribute(
        'aria-label',
        'Halaman sebelumnya'
    );


    pagination.appendChild(
        previous
    );


    /*
     * Jika sedikit halaman.
     */

    if (
        totalPages <= 7
    ) {

        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            pagination.appendChild(
                createBarangPageButton(
                    String(page),
                    page,
                    false,
                    page === barangCurrentPage
                )
            );

        }

    }


    /*
     * Jika banyak halaman.
     */

    else {

        /*
         * Halaman pertama.
         */

        pagination.appendChild(
            createBarangPageButton(
                '1',
                1,
                false,
                barangCurrentPage === 1
            )
        );


        /*
         * Ellipsis awal.
         */

        if (
            barangCurrentPage > 4
        ) {

            pagination.appendChild(
                createBarangEllipsis()
            );

        }


        /*
         * Range halaman.
         */

        const start =
            Math.max(
                2,
                barangCurrentPage - 2
            );


        const end =
            Math.min(
                totalPages - 1,
                barangCurrentPage + 2
            );


        for (
            let page = start;
            page <= end;
            page++
        ) {

            pagination.appendChild(
                createBarangPageButton(
                    String(page),
                    page,
                    false,
                    page === barangCurrentPage
                )
            );

        }


        /*
         * Ellipsis akhir.
         */

        if (
            barangCurrentPage <
            totalPages - 3
        ) {

            pagination.appendChild(
                createBarangEllipsis()
            );

        }


        /*
         * Halaman terakhir.
         */

        pagination.appendChild(
            createBarangPageButton(
                String(totalPages),
                totalPages,
                false,
                barangCurrentPage === totalPages
            )
        );

    }


    /*
     * Next.
     */

    const next =
        createBarangPageButton(
            '›',
            barangCurrentPage + 1,
            barangCurrentPage >= totalPages
        );


    next.setAttribute(
        'aria-label',
        'Halaman berikutnya'
    );


    pagination.appendChild(
        next
    );

}


/* =========================================================
   PAGINATION BUTTON
========================================================= */

function createBarangPageButton(
    label,
    page,
    disabled = false,
    current = false
) {

    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.textContent =
        label;


    button.disabled =
        disabled;


    if (current) {

        button.classList.add(
            'active'
        );


        button.setAttribute(
            'aria-current',
            'page'
        );

    }


    if (!disabled) {

        button.addEventListener(
            'click',
            function () {

                barangCurrentPage =
                    page;


                renderBarangTable();


                const active =
                    document.querySelector(
                        '#barangPagination [aria-current="page"]'
                    );


                if (active) {

                    active.focus({
                        preventScroll: true
                    });

                }

            }
        );

    }


    return button;

}


/* =========================================================
   PAGINATION ELLIPSIS
========================================================= */

function createBarangEllipsis() {

    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.textContent =
        '...';


    button.disabled =
        true;


    button.className =
        'ellipsis';


    button.setAttribute(
        'aria-hidden',
        'true'
    );


    return button;

}


/* =========================================================
   KPI
========================================================= */

function updateBarangKPI() {

    const records =
        getBarangData();


    const totalBarang =
        records.length;


    const golonganSet =
        new Set();


    records.forEach(
        function (item) {

            if (
                item.golongan &&
                item.golongan.trim()
            ) {

                golonganSet.add(
                    item.golongan.trim()
                );

            }

        }
    );


    const totalGolongan =
        golonganSet.size;


    const cards =
        document.querySelectorAll(
            '.barang-kpi-card'
        );


    if (
        cards.length < 3
    ) {

        return;

    }


    /*
     * KPI 1 - Total Barang
     */

    const totalValue =
        cards[0].querySelector(
            '.barang-kpi-value strong'
        );


    if (totalValue) {

        totalValue.textContent =
            barangNumber.format(
                totalBarang
            );

    }


    /*
     * KPI 1 - angka tambahan tahun ini.
     */

    const currentYear =
        new Date().getFullYear();


    const thisYearCount =
        records.filter(
            function (item) {

                if (
                    !item.created_at
                ) {

                    return false;

                }


                return (
                    new Date(
                        item.created_at
                    ).getFullYear() ===
                    currentYear
                );

            }
        ).length;


    const delta =
        cards[0].querySelector(
            '.barang-kpi-value small'
        );


    if (delta) {

        delta.innerHTML = '';

        const icon =
            document.createElement(
                'i'
            );

        icon.dataset.lucide =
            'arrow-up';


        delta.appendChild(
            icon
        );


        delta.appendChild(
            document.createTextNode(
                ` +${barangNumber.format(thisYearCount)}`
            )
        );

    }


    const deltaLabel =
        cards[0].querySelector(
            '.barang-kpi-content p'
        );


    if (deltaLabel) {

        deltaLabel.textContent =
            'ditambahkan tahun ini';

    }


    /*
     * KPI 2 - Total Golongan
     */

    const groupValue =
        cards[1].querySelector(
            '.barang-kpi-content > strong'
        );


    if (groupValue) {

        groupValue.textContent =
            barangNumber.format(
                totalGolongan
            );

    }


    /*
     * KPI 3 - Update Terakhir
     */

    const latest =
        getLatestBarangRecord();


    const lastValue =
        cards[2].querySelector(
            '.barang-kpi-text'
        );


    const lastDescription =
        cards[2].querySelector(
            '.barang-kpi-content p'
        );


    if (latest) {

        if (lastValue) {

            lastValue.textContent =
                formatBarangLastSeen(
                    latest.updated_at ||
                    latest.created_at
                );

        }


        if (lastDescription) {

            lastDescription.textContent =
                formatBarangDateTime(
                    latest.updated_at ||
                    latest.created_at
                );

        }

    } else {

        if (lastValue) {

            lastValue.textContent =
                'Belum ada';

        }


        if (lastDescription) {

            lastDescription.textContent =
                'belum ada data';

        }

    }

}


/* =========================================================
   GOLONGAN OPTIONS
========================================================= */

function updateBarangGolonganOptions() {

    const select =
        document.getElementById(
            'barangGolongan'
        );


    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    const records =
        getBarangData();


    const groups =
        new Set();


    records.forEach(
        function (item) {

            if (
                item.golongan
            ) {

                groups.add(
                    item.golongan
                );

            }

        }
    );


    /*
     * Daftar standar desain.
     */

    const defaultGroups = [
        'Elektronik',
        'Furnitur',
        'Mekanikal',
        'Elektrikal',
        'Alat Kantor',
        'Lainnya'
    ];


    defaultGroups.forEach(
        function (group) {

            groups.add(group);

        }
    );


    /*
     * Bersihkan option selain "Semua".
     */

    select.replaceChildren();


    const allOption =
        document.createElement(
            'option'
        );


    allOption.value =
        '';


    allOption.textContent =
        'Semua Golongan';


    select.appendChild(
        allOption
    );


    Array.from(groups)
        .sort(
            function (a, b) {

                return a.localeCompare(
                    b,
                    'id-ID'
                );

            }
        )
        .forEach(
            function (group) {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    group;


                option.textContent =
                    group;


                select.appendChild(
                    option
                );

            }
        );


    /*
     * Kembalikan filter.
     */

    select.value =
        currentValue;

}


/* =========================================================
   CHART
========================================================= */

function updateBarangChart() {

    const canvas =
        document.getElementById(
            'barangDistributionChart'
        );


    if (!canvas) {
        return;
    }


    const records =
        getBarangData();


    /*
     * Hitung distribusi.
     */

    const distribution =
        {};


    records.forEach(
        function (item) {

            const group =
                item.golongan ||
                'Lainnya';


            distribution[group] =
                (
                    distribution[group] ||
                    0
                ) + 1;

        }
    );


    /*
     * Jika belum ada data.
     */

    if (
        Object.keys(distribution).length === 0
    ) {

        distribution.Lainnya =
            0;

    }


    /*
     * Warna mengikuti data-color
     * yang sudah tersedia pada Blade.
     */

    const legendItems =
        Array.from(
            document.querySelectorAll(
                '#barangLegend [data-label]'
            )
        );


    const colorMap =
        {};


    legendItems.forEach(
        function (item) {

            colorMap[
                item.dataset.label
            ] =
                item.dataset.color ||
                '#3389ee';

        }
    );


    /*
     * Tambahkan warna fallback
     * untuk golongan baru.
     */

    const fallbackColors = [
        '#3389ee',
        '#4fc184',
        '#ffc85c',
        '#ff9024',
        '#8558e8',
        '#aab7ca',
        '#7c8da6',
        '#5c6bc0'
    ];


    let colorIndex =
        0;


    Object.keys(distribution)
        .forEach(
            function (group) {

                if (
                    !colorMap[group]
                ) {

                    colorMap[group] =
                        fallbackColors[
                            colorIndex %
                            fallbackColors.length
                        ];

                    colorIndex++;

                }

            }
        );


    /*
     * Update legend.
     */

    updateBarangLegend(
        distribution,
        records.length,
        colorMap
    );


    /*
     * Destroy chart lama.
     */

    if (barangChart) {

        barangChart.destroy();

        barangChart = null;

    }


    const wrap =
        canvas.parentElement;


    if (!wrap) {
        return;
    }


    /*
     * Update angka tengah.
     */

    const center =
        wrap.querySelector(
            '.barang-chart-center strong'
        );


    if (center) {

        center.textContent =
            barangNumber.format(
                records.length
            );

    }


    /*
     * Chart.js tersedia.
     */

    if (
        typeof window.Chart ===
        'function'
    ) {

        canvas.hidden =
            false;


        wrap.classList.remove(
            'barang-chart-fallback'
        );


        wrap.style.background =
            '';


        const labels =
            Object.keys(
                distribution
            );


        const counts =
            labels.map(
                function (label) {

                    return distribution[
                        label
                    ];

                }
            );


        const colors =
            labels.map(
                function (label) {

                    return colorMap[
                        label
                    ];

                }
            );


        barangChart =
            new window.Chart(
                canvas,
                {
                    type: 'doughnut',

                    data: {

                        labels: labels,

                        datasets: [
                            {
                                data: counts,

                                backgroundColor:
                                    colors,

                                borderColor:
                                    '#ffffff',

                                borderWidth:
                                    2,

                                hoverOffset:
                                    4
                            }
                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '68%',

                        plugins: {

                            legend: {
                                display: false
                            },

                            tooltip: {

                                callbacks: {

                                    label:
                                        function (
                                            context
                                        ) {

                                            return (
                                                `${context.label}: ` +
                                                `${barangNumber.format(context.raw)} barang`
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

    canvas.hidden =
        true;


    wrap.classList.add(
        'barang-chart-fallback'
    );


    let angle =
        0;


    const segments =
        Object.keys(
            distribution
        )
        .map(
            function (group) {

                const start =
                    angle;


                const count =
                    distribution[group];


                const total =
                    records.length;


                angle +=
                    total
                        ? (
                            count /
                            total
                        ) * 360
                        : 0;


                return (
                    `${colorMap[group]} ` +
                    `${start}deg ${angle}deg`
                );

            }
        );


    wrap.style.background =
        records.length
            ? `conic-gradient(${segments.join(', ')})`
            : '#e7ecf2';

}


/* =========================================================
   UPDATE LEGEND
========================================================= */

function updateBarangLegend(
    distribution,
    total,
    colorMap
) {

    const legend =
        document.getElementById(
            'barangLegend'
        );


    if (!legend) {
        return;
    }


    legend.replaceChildren();


    /*
     * Urutan golongan.
     */

    const defaultOrder = [
        'Elektronik',
        'Furnitur',
        'Mekanikal',
        'Elektrikal',
        'Alat Kantor',
        'Lainnya'
    ];


    const groups =
        Object.keys(distribution);


    groups.sort(
        function (a, b) {

            const ai =
                defaultOrder.indexOf(a);


            const bi =
                defaultOrder.indexOf(b);


            if (
                ai !== -1 &&
                bi !== -1
            ) {

                return ai - bi;

            }


            if (ai !== -1) {
                return -1;
            }


            if (bi !== -1) {
                return 1;
            }


            return (
                distribution[b] -
                distribution[a]
            );

        }
    );


    groups.forEach(
        function (group) {

            const count =
                distribution[group];


            const percentage =
                total
                    ? (
                        count /
                        total
                    ) * 100
                    : 0;


            const item =
                document.createElement(
                    'div'
                );


            item.dataset.label =
                group;


            item.dataset.count =
                count;


            item.dataset.color =
                colorMap[group];


            /*
             * Dot.
             */

            const dot =
                document.createElement(
                    'span'
                );


            dot.className =
                'barang-dot';


            dot.style.background =
                colorMap[group];


            /*
             * Nama.
             */

            const name =
                document.createElement(
                    'p'
                );


            name.textContent =
                group;


            /*
             * Jumlah.
             */

            const countElement =
                document.createElement(
                    'strong'
                );


            countElement.textContent =
                barangNumber.format(
                    count
                );


            /*
             * Persentase.
             */

            const percentageElement =
                document.createElement(
                    'small'
                );


            percentageElement.textContent =
                `${percentage.toFixed(1).replace('.', ',')}%`;


            item.appendChild(dot);
            item.appendChild(name);
            item.appendChild(countElement);
            item.appendChild(
                percentageElement
            );


            legend.appendChild(item);

        }
    );

}


/* =========================================================
   BARANG TERBARU
========================================================= */

function updateBarangLatest() {

    const table =
        document.querySelector(
            '.barang-latest-table'
        );


    if (!table) {
        return;
    }


    const tbody =
        table.querySelector(
            'tbody'
        );


    if (!tbody) {
        return;
    }


    const records =
        getBarangData();


    const latest =
        [...records]
            .sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            a.created_at ||
                            a.updated_at ||
                            0
                        ).getTime();


                    const dateB =
                        new Date(
                            b.created_at ||
                            b.updated_at ||
                            0
                        ).getTime();


                    return dateB - dateA;

                }
            )
            .slice(0, 5);


    tbody.replaceChildren();


    latest.forEach(
        function (item, index) {

            const row =
                document.createElement(
                    'tr'
                );


            const no =
                document.createElement(
                    'td'
                );


            no.textContent =
                index + 1;


            const name =
                document.createElement(
                    'td'
                );


            name.textContent =
                item.nama_barang ||
                '-';


            const group =
                document.createElement(
                    'td'
                );


            group.textContent =
                item.golongan ||
                '-';


            const date =
                document.createElement(
                    'td'
                );


            date.textContent =
                formatBarangDate(
                    item.created_at ||
                    item.updated_at
                );


            row.appendChild(no);
            row.appendChild(name);
            row.appendChild(group);
            row.appendChild(date);


            tbody.appendChild(row);

        }
    );


    if (
        latest.length === 0
    ) {

        const row =
            document.createElement(
                'tr'
            );


        const cell =
            document.createElement(
                'td'
            );


        cell.colSpan =
            4;


        cell.textContent =
            'Belum ada data barang.';


        row.appendChild(cell);

        tbody.appendChild(row);

    }

}


/* =========================================================
   LAST SEEN
========================================================= */

function getLatestBarangRecord() {

    const records =
        getBarangData();


    if (
        records.length === 0
    ) {

        return null;

    }


    return (
        [...records]
            .sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            a.updated_at ||
                            a.created_at ||
                            0
                        ).getTime();


                    const dateB =
                        new Date(
                            b.updated_at ||
                            b.created_at ||
                            0
                        ).getTime();


                    return dateB - dateA;

                }
            )[0]
    );

}


function updateBarangLastSeen() {

    const latest =
        getLatestBarangRecord();


    if (!latest) {
        return;
    }


    /*
     * Jika ada element khusus last seen.
     */

    const lastSeen =
        document.getElementById(
            'barangLastSeen'
        );


    if (lastSeen) {

        lastSeen.textContent =
            formatBarangLastSeen(
                latest.updated_at ||
                latest.created_at
            );

    }

}


/* =========================================================
   LAST SEEN FORMAT
========================================================= */

function formatBarangLastSeen(
    dateString
) {

    if (!dateString) {
        return '-';
    }


    const timestamp =
        new Date(
            dateString
        ).getTime();


    if (
        Number.isNaN(timestamp)
    ) {

        return '-';

    }


    const now =
        Date.now();


    const diff =
        Math.max(
            0,
            now - timestamp
        );


    const seconds =
        Math.floor(
            diff / 1000
        );


    if (
        seconds < 10
    ) {

        return 'Baru saja';

    }


    if (
        seconds < 60
    ) {

        return `${seconds} detik lalu`;

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (
        minutes < 60
    ) {

        return `${minutes} menit lalu`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (
        hours < 24
    ) {

        return `${hours} jam lalu`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (
        days < 7
    ) {

        return `${days} hari lalu`;

    }


    return formatBarangDate(
        dateString
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatBarangDate(
    dateString
) {

    if (!dateString) {
        return '-';
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '-';

    }


    return new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone:
                'Asia/Makassar',

            day:
                '2-digit',

            month:
                'short',

            year:
                'numeric'
        }
    ).format(date);

}


function formatBarangDateTime(
    dateString
) {

    if (!dateString) {
        return '-';
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '-';

    }


    return new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone:
                'Asia/Makassar',

            day:
                '2-digit',

            month:
                'short',

            year:
                'numeric',

            hour:
                '2-digit',

            minute:
                '2-digit',

            hourCycle:
                'h23'
        }
    )
    .format(date)
    .replace(
        /\./g,
        ':'
    ) + ' WITA';

}


/* =========================================================
   CLOCK WITA
========================================================= */

function updateBarangDate() {

    const date =
        document.getElementById(
            'barangCurrentDate'
        );


    const time =
        document.getElementById(
            'barangCurrentTime'
        );


    if (!date || !time) {
        return;
    }


    const now =
        new Date();


    date.textContent =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone:
                    'Asia/Makassar',

                weekday:
                    'long',

                day:
                    'numeric',

                month:
                    'long',

                year:
                    'numeric'
            }
        ).format(now);


    time.textContent =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone:
                    'Asia/Makassar',

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                second:
                    '2-digit',

                hourCycle:
                    'h23'
            }
        )
        .format(now)
        .replace(
            /\./g,
            ':'
        ) +
        ' WITA';

}


/* =========================================================
   CRUD ACTION HANDLER
========================================================= */

function handleBarangAction(
    action,
    id
) {

    const records =
        getBarangData();


    const record =
        records.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!record) {

        showBarangMessage(
            'Data barang tidak ditemukan.',
            'error'
        );

        return;

    }


    switch (action) {

        case 'view':

            openBarangModal(
                'view',
                record
            );

            break;


        case 'edit':

            openBarangModal(
                'edit',
                record
            );

            break;


        case 'delete':

            openBarangModal(
                'delete',
                record
            );

            break;

    }

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openBarangModal(
    mode = 'add',
    record = null
) {

    const modal =
        document.getElementById(
            'barangModal'
        );


    if (!modal) {
        return;
    }


    /*
     * Jangan cegah membuka modal
     * ketika modal sebelumnya sudah tertutup.
     */

    const title =
        document.getElementById(
            'barangModalTitle'
        );


    const description =
        document.getElementById(
            'barangModalDescription'
        );


    const note =
        document.getElementById(
            'barangModalNote'
        );


    const form =
        document.getElementById(
            'barangForm'
        );


    const name =
        document.getElementById(
            'barangName'
        );


    const code =
        document.getElementById(
            'barangCode'
        );


    const group =
        document.getElementById(
            'barangFormGolongan'
        );


    const save =
        document.getElementById(
            'barangSaveButton'
        );


    if (
        !form ||
        !name ||
        !code ||
        !group ||
        !save
    ) {

        return;

    }


    /*
     * Reset.
     */

    form.reset();


    /*
     * Simpan mode dan ID pada form.
     */

    form.dataset.mode =
        mode;


    form.dataset.id =
        record
            ? record.id
            : '';


    /*
     * Mode ADD.
     */

    if (
        mode === 'add'
    ) {

        title.textContent =
            'Tambah Barang';


        description.textContent =
            'Tambahkan data master barang baru.';


        note.textContent =
            'Data akan disimpan pada penyimpanan browser sementara.';


        name.readOnly =
            false;


        code.readOnly =
            false;


        group.disabled =
            false;


        save.hidden =
            false;


        save.disabled =
            false;


        save.textContent =
            'Simpan Barang';


        save.classList.remove(
            'barang-delete-button'
        );

    }


    /*
     * Mode VIEW.
     */

    if (
        mode === 'view'
    ) {

        title.textContent =
            'Detail Barang';


        description.textContent =
            'Informasi data master barang.';


        note.textContent =
            'Detail data barang yang tersimpan.';


        name.value =
            record?.nama_barang ||
            '';


        code.value =
            record?.kode_barang ||
            '';


        group.value =
            record?.golongan ||
            '';


        name.readOnly =
            true;


        code.readOnly =
            true;


        group.disabled =
            true;


        save.hidden =
            true;


        save.disabled =
            true;

    }


    /*
     * Mode EDIT.
     */

    if (
        mode === 'edit'
    ) {

        title.textContent =
            'Edit Barang';


        description.textContent =
            'Perbarui informasi data master barang.';


        note.textContent =
            'Perubahan akan langsung tersimpan pada penyimpanan browser.';


        name.value =
            record?.nama_barang ||
            '';


        code.value =
            record?.kode_barang ||
            '';


        group.value =
            record?.golongan ||
            '';


        name.readOnly =
            false;


        code.readOnly =
            false;


        group.disabled =
            false;


        save.hidden =
            false;


        save.disabled =
            false;


        save.textContent =
            'Simpan Perubahan';


        save.classList.remove(
            'barang-delete-button'
        );

    }


    /*
     * Mode DELETE.
     */

    if (
        mode === 'delete'
    ) {

        title.textContent =
            'Hapus Barang';


        description.textContent =
            'Konfirmasi penghapusan data barang.';


        note.textContent =
            'Data yang dihapus tidak dapat dikembalikan dari penyimpanan browser.';


        name.value =
            record?.nama_barang ||
            '';


        code.value =
            record?.kode_barang ||
            '';


        group.value =
            record?.golongan ||
            '';


        name.readOnly =
            true;


        code.readOnly =
            true;


        group.disabled =
            true;


        save.hidden =
            false;


        save.disabled =
            false;


        save.textContent =
            'Hapus Barang';


        save.classList.add(
            'barang-delete-button'
        );

    }


    barangPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';


    if (
        typeof modal.showModal ===
        'function'
    ) {

        modal.showModal();

    } else {

        modal.setAttribute(
            'open',
            ''
        );

    }


    /*
     * Focus.
     */

    if (
        mode === 'add' ||
        mode === 'edit'
    ) {

        window.setTimeout(
            function () {

                name.focus();

            },
            50
        );

    }


    refreshBarangIcons();

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeBarangModal() {

    const modal =
        document.getElementById(
            'barangModal'
        );


    if (!modal) {
        return;
    }


    if (
        typeof modal.close ===
        'function' &&
        modal.open
    ) {

        modal.close();

    } else {

        modal.removeAttribute(
            'open'
        );


        document.body.style.overflow =
            barangPreviousOverflow;

    }

}


/* =========================================================
   SUBMIT CRUD
========================================================= */

function submitBarangForm() {

    const form =
        document.getElementById(
            'barangForm'
        );


    if (!form) {
        return;
    }


    const mode =
        form.dataset.mode ||
        'add';


    const id =
        form.dataset.id ||
        '';


    const name =
        document.getElementById(
            'barangName'
        )
        ?.value
        .trim();


    const code =
        document.getElementById(
            'barangCode'
        )
        ?.value
        .trim();


    const group =
        document.getElementById(
            'barangFormGolongan'
        )
        ?.value;


    /*
     * Validasi.
     */

    if (!name) {

        showBarangMessage(
            'Nama barang wajib diisi.',
            'error'
        );

        return;

    }


    if (!code) {

        showBarangMessage(
            'Kode barang wajib diisi.',
            'error'
        );

        return;

    }


    if (!group) {

        showBarangMessage(
            'Golongan wajib dipilih.',
            'error'
        );

        return;

    }


    /*
     * Ambil data.
     */

    const records =
        getBarangData();


    /*
     * Cek kode duplikat.
     */

    const duplicate =
        records.find(
            function (item) {

                return (
                    item.kode_barang
                        .toLocaleLowerCase(
                            'id-ID'
                        ) ===
                    code.toLocaleLowerCase(
                        'id-ID'
                    ) &&
                    item.id !== id
                );

            }
        );


    if (duplicate) {

        showBarangMessage(
            'Kode barang sudah digunakan.',
            'error'
        );

        return;

    }


    /*
     * ADD.
     */

    if (
        mode === 'add'
    ) {

        const now =
            new Date()
                .toISOString();


        const newRecord = {

            id:
                generateBarangId(),

            nama_barang:
                name,

            kode_barang:
                code,

            golongan:
                group,

            created_at:
                now,

            updated_at:
                now

        };


        records.unshift(
            newRecord
        );


        saveBarangStorage(
            records
        );


        barangCurrentPage =
            1;


        closeBarangModal();

        renderBarangPage();


        showBarangMessage(
            'Barang berhasil ditambahkan.',
            'success'
        );


        return;

    }


    /*
     * EDIT.
     */

    if (
        mode === 'edit'
    ) {

        const index =
            records.findIndex(
                function (item) {

                    return item.id === id;

                }
            );


        if (
            index === -1
        ) {

            showBarangMessage(
                'Data barang tidak ditemukan.',
                'error'
            );

            return;

        }


        records[index] = {

            ...records[index],

            nama_barang:
                name,

            kode_barang:
                code,

            golongan:
                group,

            updated_at:
                new Date()
                    .toISOString()

        };


        saveBarangStorage(
            records
        );


        closeBarangModal();

        renderBarangPage();


        showBarangMessage(
            'Barang berhasil diperbarui.',
            'success'
        );


        return;

    }


    /*
     * DELETE.
     */

    if (
        mode === 'delete'
    ) {

        const record =
            records.find(
                function (item) {

                    return item.id === id;

                }
            );


        if (!record) {

            showBarangMessage(
                'Data barang tidak ditemukan.',
                'error'
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Hapus barang "${record.nama_barang}"?`
            );


        if (!confirmed) {

            return;

        }


        const filtered =
            records.filter(
                function (item) {

                    return item.id !== id;

                }
            );


        saveBarangStorage(
            filtered
        );


        /*
         * Jika halaman terakhir
         * menjadi kosong.
         */

        const pageSize =
            Number(
                document.getElementById(
                    'barangPageSize'
                )?.value
            ) || 10;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filtered.length /
                    pageSize
                )
            );


        barangCurrentPage =
            Math.min(
                barangCurrentPage,
                totalPages
            );


        closeBarangModal();

        renderBarangPage();


        showBarangMessage(
            'Barang berhasil dihapus.',
            'success'
        );

    }

}


/* =========================================================
   GENERATE ID
========================================================= */

function generateBarangId() {

    return (
        'barang-' +
        Date.now() +
        '-' +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetBarangFilter() {

    const search =
        document.getElementById(
            'barangSearch'
        );


    const group =
        document.getElementById(
            'barangGolongan'
        );


    if (search) {

        search.value =
            '';

    }


    if (group) {

        group.value =
            '';

    }


    barangCurrentPage =
        1;


    renderBarangPage();

}


/* =========================================================
   FILTER BUTTON
========================================================= */

function filterBarangTable() {

    barangCurrentPage =
        1;


    renderBarangPage();

}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportBarangCSV() {

    const records =
        getFilteredBarangData();


    const rows = [
        [
            'No',
            'Nama Barang',
            'Kode Barang',
            'Golongan',
            'Tanggal Ditambahkan',
            'Terakhir Diubah'
        ]
    ];


    records.forEach(
        function (item, index) {

            rows.push(
                [
                    index + 1,

                    item.nama_barang ||
                    '',

                    item.kode_barang ||
                    '',

                    item.golongan ||
                    '',

                    formatBarangDate(
                        item.created_at
                    ),

                    formatBarangDateTime(
                        item.updated_at
                    )
                ]
            );

        }
    );


    function escapeCSV(
        value
    ) {

        let text =
            String(
                value ?? ''
            );


        /*
         * Cegah formula injection.
         */

        if (
            /^[\s]*[=+@-]/.test(
                text
            )
        ) {

            text =
                "'" + text;

        }


        return (
            '"' +
            text.replace(
                /"/g,
                '""'
            ) +
            '"'
        );

    }


    const csv =
        rows
            .map(
                function (row) {

                    return row
                        .map(
                            escapeCSV
                        )
                        .join(',');

                }
            )
            .join('\r\n');


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
        `data-barang-${new Date().toISOString().slice(0, 10)}.csv`;


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


    showBarangMessage(
        'Data Barang berhasil diekspor.',
        'success'
    );

}


/* =========================================================
   MESSAGE / NOTIFICATION
========================================================= */

function showBarangMessage(
    message,
    type = 'success'
) {

    /*
     * Jika project menggunakan
     * SweetAlert2.
     */

    if (
        typeof window.Swal !==
        'undefined'
    ) {

        window.Swal.fire({

            icon:
                type === 'error'
                    ? 'error'
                    : 'success',

            title:
                type === 'error'
                    ? 'Gagal'
                    : 'Berhasil',

            text:
                message,

            timer:
                1800,

            showConfirmButton:
                false

        });


        return;

    }


    /*
     * Fallback sederhana.
     */

    window.alert(
        message
    );

}


/* =========================================================
   REFRESH LUCIDE
========================================================= */

function refreshBarangIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons ===
        'function'
    ) {

        window.lucide.createIcons();

    }

}


/* =========================================================
   DEBUG HELPER
========================================================= */

/*
 * Fungsi ini bisa dipanggil dari Console:
 *
 * resetBarangDemoData()
 *
 * untuk menghapus data localStorage
 * dan kembali membaca data dari Blade.
 */

function resetBarangDemoData() {

    localStorage.removeItem(
        BARANG_STORAGE_KEY
    );


    window.location.reload();

}


/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.openBarangModal =
    openBarangModal;

window.closeBarangModal =
    closeBarangModal;

window.filterBarangTable =
    filterBarangTable;

window.resetBarangFilter =
    resetBarangFilter;

window.exportBarangCSV =
    exportBarangCSV;

window.resetBarangDemoData =
    resetBarangDemoData;