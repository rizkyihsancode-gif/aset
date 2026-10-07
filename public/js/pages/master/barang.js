/* ============================================================
   SISTEM ASET
   MASTER DATA BARANG
   ============================================================

   SUMBER DATA:
   - Database Laravel
   - Blade sebagai initial render

   CRUD:
   - CREATE  -> Laravel POST
   - UPDATE  -> Laravel PUT
   - DELETE  -> Laravel DELETE

   CATATAN:
   - Tidak menggunakan localStorage sebagai database
   - Search / filter / pagination tetap frontend
   - Setelah CRUD berhasil halaman direload agar data
     selalu sinkron dengan database

   ============================================================ */

(function () {

    'use strict';


    /* ============================================================
       CONFIG
       ============================================================ */

    const DEFAULT_PAGE_SIZE = 10;

    const TIMEZONE = 'Asia/Makassar';


    /* ============================================================
       STATE
       ============================================================ */

    let currentPage = 1;

    let chartInstance = null;

    let barangData = [];

    let golonganMap = {};

    let modalMode = 'add';

    let modalRecordId = null;

    let previousBodyOverflow = '';


    /* ============================================================
       FORMATTER
       ============================================================ */

    const numberFormatter = new Intl.NumberFormat('id-ID');


    /* ============================================================
       DOM READY
       ============================================================ */

    document.addEventListener('DOMContentLoaded', function () {

        const table =
            document.getElementById('barangTable');


        /*
         * Kalau bukan halaman Barang,
         * jangan jalankan script.
         */

        if (!table) {
            return;
        }


        /*
         * Mapping golongan dari Blade.
         */

        buildGolonganMap();


        /*
         * Data awal berasal dari Blade/database.
         */

        initializeBarangData();


        /*
         * Event.
         */

        bindSearch();

        bindFilter();

        bindPageSize();

        bindTableActions();

        bindForm();

        bindModal();

        bindEscapeKey();


        /*
         * Render bagian frontend.
         */

        renderPage();


        /*
         * Jam WITA.
         */

        updateCurrentDate();

        setInterval(
            updateCurrentDate,
            1000
        );


        /*
         * Lucide.
         */

        refreshIcons();

    });


    /* ============================================================
       INITIAL DATA
       ============================================================ */

    function initializeBarangData() {

        /*
         * Data berasal dari tabel yang sudah dirender Laravel.
         *
         * Dengan demikian:
         *
         * DATABASE
         *    ↓
         * Controller
         *    ↓
         * Blade
         *    ↓
         * JavaScript
         *
         * Tidak ada localStorage Barang.
         */

        barangData =
            readBarangFromBlade()
                .map(normalizeBarang);

    }


    /* ============================================================
       READ DATA FROM BLADE
       ============================================================ */

    function readBarangFromBlade() {

        const rows =
            Array.from(
                document.querySelectorAll(
                    '#barangTable tbody tr'
                )
            );


        const records = [];


        rows.forEach(
            function (row, index) {

                /*
                 * Abaikan empty row.
                 */

                if (
                    row.id ===
                    'barangEmptyRow'
                ) {
                    return;
                }


                if (
                    row.cells.length < 4
                ) {
                    return;
                }


                const name =
                    row.dataset.namaBarang ||
                    row.cells[1]
                        ?.textContent
                        ?.trim() ||
                    '';


                const code =
                    row.dataset.kodeBarang ||
                    row.cells[2]
                        ?.textContent
                        ?.trim() ||
                    '';


                const groupId =
                    row.dataset.golongan ||
                    row.dataset.golonganId ||
                    '';


                const groupName =
                    row.dataset.golonganName ||
                    row.dataset.golonganNama ||
                    getCellGolonganName(
                        row.cells[3]
                    );


                const id =
                    row.dataset.id ||
                    row.dataset.barangId ||
                    '';


                const createdAt =
                    row.dataset.createdAt ||
                    '';


                const updatedAt =
                    row.dataset.updatedAt ||
                    '';


                if (
                    !name &&
                    !code
                ) {
                    return;
                }


                records.push({

                    id:
                        id ||
                        `blade-${index}`,

                    nama_barang:
                        name,

                    kode_barang:
                        code,

                    golongan:
                        groupId,

                    nama_golongan:
                        groupName,

                    created_at:
                        createdAt,

                    updated_at:
                        updatedAt

                });

            }
        );


        return records;

    }


    function getCellGolonganName(cell) {

        if (!cell) {
            return '';
        }


        const text =
            String(
                cell.textContent || ''
            ).trim();


        /*
         * Kalau hanya angka,
         * jangan dianggap sebagai nama golongan.
         */

        if (
            /^\d+$/.test(text)
        ) {
            return '';
        }


        return text;

    }


    /* ============================================================
       NORMALIZE DATA
       ============================================================ */

    function normalizeBarang(item) {

        if (!item) {

            return {

                id:
                    '',

                nama_barang:
                    '',

                kode_barang:
                    '',

                golongan:
                    '',

                nama_golongan:
                    '',

                created_at:
                    '',

                updated_at:
                    ''

            };

        }


        const groupId =
            resolveGolonganId(item);


        const groupName =
            resolveGolonganName(item);


        return {

            id:
                item.id ?? '',

            nama_barang:
                String(
                    item.nama_barang ??
                    item.nama ??
                    ''
                ).trim(),

            kode_barang:
                String(
                    item.kode_barang ??
                    item.kode ??
                    ''
                ).trim(),

            golongan:
                groupId,

            nama_golongan:
                groupName !== '-'
                    ? groupName
                    : '',

            created_at:
                item.created_at ||
                item.createdAt ||
                '',

            updated_at:
                item.updated_at ||
                item.updatedAt ||
                ''

        };

    }


    function getBarangData() {

        return barangData.map(
            normalizeBarang
        );

    }


    /* ============================================================
       GOLONGAN MAP
       ============================================================ */

    function buildGolonganMap() {

        golonganMap = {};


        /*
         * Kalau Blade suatu saat menyediakan map langsung.
         */

        if (
            window.BARANG_GOLONGAN_MAP &&
            typeof window.BARANG_GOLONGAN_MAP === 'object'
        ) {

            Object.entries(
                window.BARANG_GOLONGAN_MAP
            ).forEach(
                function (entry) {

                    registerGolongan(
                        entry[0],
                        entry[1]
                    );

                }
            );

        }


        /*
         * Ambil dari dropdown filter.
         */

        readGolonganSelect(
            document.getElementById(
                'barangGolongan'
            )
        );


        /*
         * Ambil dari dropdown modal.
         */

        readGolonganSelect(
            document.getElementById(
                'barangFormGolongan'
            )
        );


        /*
         * Ambil juga dari row Blade.
         */

        const rows =
            document.querySelectorAll(
                '#barangTable tbody tr'
            );


        rows.forEach(
            function (row) {

                if (
                    row.id ===
                    'barangEmptyRow'
                ) {
                    return;
                }


                const id =
                    row.dataset.golongan ||
                    row.dataset.golonganId ||
                    '';


                const name =
                    row.dataset.golonganName ||
                    row.dataset.golonganNama ||
                    '';


                if (
                    id &&
                    name
                ) {

                    registerGolongan(
                        id,
                        name
                    );

                }

            }
        );

    }


    function readGolonganSelect(select) {

        if (!select) {
            return;
        }


        Array.from(
            select.options
        ).forEach(
            function (option) {

                const id =
                    String(
                        option.value || ''
                    ).trim();


                const name =
                    String(
                        option.textContent || ''
                    ).trim();


                if (!id) {
                    return;
                }


                const lower =
                    name.toLocaleLowerCase(
                        'id-ID'
                    );


                if (
                    lower.includes(
                        'semua golongan'
                    ) ||
                    lower.includes(
                        'pilih golongan'
                    )
                ) {
                    return;
                }


                registerGolongan(
                    id,
                    name
                );

            }
        );

    }


    function registerGolongan(
        id,
        name
    ) {

        id =
            String(
                id ?? ''
            ).trim();


        name =
            String(
                name ?? ''
            ).trim();


        if (
            !id ||
            !name
        ) {
            return;
        }


        /*
         * Nama golongan jangan hanya angka.
         */

        if (
            /^\d+$/.test(name)
        ) {
            return;
        }


        golonganMap[id] =
            name;

    }


    function resolveGolonganId(item) {

        if (!item) {
            return '';
        }


        let value =
            item.golongan_id ??
            item.golonganId ??
            item.golongan ??
            '';


        value =
            String(
                value
            ).trim();


        /*
         * Biasanya ID berupa angka.
         */

        if (
            value &&
            golonganMap[value]
        ) {
            return value;
        }


        /*
         * Jika value numeric tetapi map belum ada.
         */

        if (
            /^\d+$/.test(value)
        ) {
            return value;
        }


        /*
         * Kalau value berupa nama,
         * cari ID berdasarkan nama.
         */

        if (value) {

            const normalizedValue =
                value.toLocaleLowerCase(
                    'id-ID'
                );


            const found =
                Object.entries(
                    golonganMap
                ).find(
                    function (entry) {

                        return (
                            String(entry[1])
                                .toLocaleLowerCase(
                                    'id-ID'
                                ) ===
                            normalizedValue
                        );

                    }
                );


            if (found) {
                return found[0];
            }

        }


        return '';

    }


    function resolveGolonganName(item) {

        if (!item) {
            return '-';
        }


        /*
         * Prioritas nama yang sudah dikirim backend.
         */

        const directName =
            item.nama_golongan ||
            item.golongan_nama ||
            item.golongan_name ||
            item.namaGolongan ||
            '';


        if (
            directName &&
            !/^\d+$/.test(
                String(
                    directName
                ).trim()
            )
        ) {

            return String(
                directName
            ).trim();

        }


        const id =
            resolveGolonganId(item);


        if (
            id &&
            golonganMap[id]
        ) {
            return golonganMap[id];
        }


        /*
         * Kalau item.golongan ternyata nama.
         */

        const raw =
            String(
                item.golongan ?? ''
            ).trim();


        if (
            raw &&
            !/^\d+$/.test(raw)
        ) {
            return raw;
        }


        return '-';

    }


    /* ============================================================
       FILTERED DATA
       ============================================================ */

    function getFilteredData() {

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
                ? String(
                    searchElement.value || ''
                )
                    .trim()
                    .toLocaleLowerCase(
                        'id-ID'
                    )
                : '';


        const selectedGroup =
            groupElement
                ? String(
                    groupElement.value || ''
                ).trim()
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


                const groupName =
                    resolveGolonganName(
                        item
                    )
                        .toLocaleLowerCase(
                            'id-ID'
                        );


                const groupId =
                    resolveGolonganId(
                        item
                    );


                const searchMatch =
                    !search ||
                    name.includes(search) ||
                    code.includes(search) ||
                    groupName.includes(search);


                const groupMatch =
                    !selectedGroup ||
                    groupId === selectedGroup;


                return (
                    searchMatch &&
                    groupMatch
                );

            }
        );

    }


    /* ============================================================
       MAIN RENDER
       ============================================================ */

    function renderPage() {

        renderTable();

        updateKPI();

        updateChart();

        refreshIcons();

    }


    /* ============================================================
       TABLE
       ============================================================ */

    function renderTable() {

        const table =
            document.getElementById(
                'barangTable'
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
            getFilteredData();


        const pageSizeElement =
            document.getElementById(
                'barangPageSize'
            );


        const pageSize =
            Number(
                pageSizeElement?.value
            ) ||
            DEFAULT_PAGE_SIZE;


        const total =
            records.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    pageSize
                )
            );


        currentPage =
            Math.min(
                Math.max(
                    currentPage,
                    1
                ),
                totalPages
            );


        const start =
            (
                currentPage - 1
            ) *
            pageSize;


        const visible =
            records.slice(
                start,
                start + pageSize
            );


        tbody.replaceChildren();


        /*
         * Tidak ada data.
         */

        if (
            visible.length === 0
        ) {

            const row =
                document.createElement(
                    'tr'
                );


            row.id =
                'barangEmptyRow';


            const cell =
                document.createElement(
                    'td'
                );


            cell.colSpan =
                5;


            cell.className =
                'barang-empty';


            cell.textContent =
                total === 0
                    ? 'Belum ada data barang.'
                    : 'Data barang tidak ditemukan.';


            row.appendChild(
                cell
            );


            tbody.appendChild(
                row
            );

        }


        /*
         * Render row.
         */

        visible.forEach(
            function (item, index) {

                const row =
                    document.createElement(
                        'tr'
                    );


                row.dataset.id =
                    String(
                        item.id
                    );


                row.dataset.golongan =
                    resolveGolonganId(
                        item
                    );


                row.dataset.golonganName =
                    resolveGolonganName(
                        item
                    );


                /*
                 * NO
                 */

                const no =
                    document.createElement(
                        'td'
                    );


                no.textContent =
                    start +
                    index +
                    1;


                /*
                 * NAMA
                 */

                const name =
                    document.createElement(
                        'td'
                    );


                name.textContent =
                    item.nama_barang ||
                    '-';


                /*
                 * KODE
                 */

                const code =
                    document.createElement(
                        'td'
                    );


                code.textContent =
                    item.kode_barang ||
                    '-';


                /*
                 * GOLONGAN
                 */

                const group =
                    document.createElement(
                        'td'
                    );


                group.textContent =
                    resolveGolonganName(
                        item
                    );


                /*
                 * ACTION
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


                actionWrap.appendChild(
                    createActionButton(
                        'view',
                        'eye',
                        'Lihat barang'
                    )
                );


                actionWrap.appendChild(
                    createActionButton(
                        'edit',
                        'square-pen',
                        'Edit barang'
                    )
                );


                actionWrap.appendChild(
                    createActionButton(
                        'delete',
                        'trash-2',
                        'Hapus barang'
                    )
                );


                actionCell.appendChild(
                    actionWrap
                );


                row.appendChild(
                    no
                );


                row.appendChild(
                    name
                );


                row.appendChild(
                    code
                );


                row.appendChild(
                    group
                );


                row.appendChild(
                    actionCell
                );


                tbody.appendChild(
                    row
                );

            }
        );


        updateTableInfo(
            total,
            start,
            pageSize
        );


        renderPagination(
            totalPages
        );

    }


    function createActionButton(
        action,
        icon,
        title
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


    /* ============================================================
       TABLE INFO
       ============================================================ */

    function updateTableInfo(
        total,
        start,
        pageSize
    ) {

        const element =
            document.getElementById(
                'barangTableInfo'
            );


        if (!element) {
            return;
        }


        if (
            total === 0
        ) {

            element.textContent =
                'Tidak ada data barang';

            return;

        }


        const from =
            start + 1;


        const to =
            Math.min(
                start +
                pageSize,
                total
            );


        element.textContent =
            `Menampilkan ${numberFormatter.format(from)}–${numberFormatter.format(to)} dari ${numberFormatter.format(total)} data`;

    }


    /* ============================================================
       PAGINATION
       ============================================================ */

    function renderPagination(
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
         * PREVIOUS
         */

        pagination.appendChild(
            createPageButton(
                '‹',
                currentPage - 1,
                currentPage === 1
            )
        );


        /*
         * PAGE NUMBER
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
                    createPageButton(
                        String(page),
                        page,
                        false,
                        page === currentPage
                    )
                );

            }

        } else {

            pagination.appendChild(
                createPageButton(
                    '1',
                    1,
                    false,
                    currentPage === 1
                )
            );


            if (
                currentPage > 4
            ) {

                pagination.appendChild(
                    createEllipsis()
                );

            }


            const start =
                Math.max(
                    2,
                    currentPage - 2
                );


            const end =
                Math.min(
                    totalPages - 1,
                    currentPage + 2
                );


            for (
                let page = start;
                page <= end;
                page++
            ) {

                pagination.appendChild(
                    createPageButton(
                        String(page),
                        page,
                        false,
                        page === currentPage
                    )
                );

            }


            if (
                currentPage <
                totalPages - 3
            ) {

                pagination.appendChild(
                    createEllipsis()
                );

            }


            pagination.appendChild(
                createPageButton(
                    String(
                        totalPages
                    ),
                    totalPages,
                    false,
                    currentPage === totalPages
                )
            );

        }


        /*
         * NEXT
         */

        pagination.appendChild(
            createPageButton(
                '›',
                currentPage + 1,
                currentPage >= totalPages
            )
        );

    }


    function createPageButton(
        label,
        page,
        disabled,
        active = false
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


        if (active) {

            button.classList.add(
                'active'
            );

        }


        if (!disabled) {

            button.addEventListener(
                'click',
                function () {

                    currentPage =
                        page;


                    renderTable();


                    refreshIcons();

                }
            );

        }


        return button;

    }


    function createEllipsis() {

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


        return button;

    }


    /* ============================================================
       KPI
       ============================================================ */

    function updateKPI() {

        const records =
            getBarangData();


        const cards =
            document.querySelectorAll(
                '.barang-kpi-card'
            );


        if (
            cards.length === 0
        ) {
            return;
        }


        /*
         * TOTAL BARANG
         */

        const totalElement =
            document.querySelector(
                '#totalBarang'
            ) ||
            cards[0]?.querySelector(
                '.barang-kpi-value strong'
            );


        if (totalElement) {

            totalElement.textContent =
                numberFormatter.format(
                    records.length
                );

        }


        /*
         * TOTAL GOLONGAN
         */

        const groups =
            new Set();


        records.forEach(
            function (item) {

                const id =
                    resolveGolonganId(
                        item
                    );


                const name =
                    resolveGolonganName(
                        item
                    );


                if (id) {

                    groups.add(
                        `id-${id}`
                    );

                } else if (
                    name &&
                    name !== '-'
                ) {

                    groups.add(
                        `name-${name}`
                    );

                }

            }
        );


        const groupElement =
            document.querySelector(
                '#totalGolongan'
            ) ||
            cards[1]?.querySelector(
                '.barang-kpi-content > strong'
            );


        if (groupElement) {

            groupElement.textContent =
                numberFormatter.format(
                    groups.size
                );

        }


        /*
         * UPDATE TERAKHIR
         *
         * Jangan ditimpa JavaScript jika Blade
         * tidak memberikan timestamp.
         *
         * Nilai server-rendered tetap dipertahankan.
         */

        const latest =
            getLatestRecordWithDate();


        if (latest) {

            const date =
                latest.updated_at ||
                latest.created_at;


            const lastElement =
                document.querySelector(
                    '#barangLastUpdate'
                ) ||
                cards[2]?.querySelector(
                    '.barang-kpi-text'
                );


            const description =
                cards[2]?.querySelector(
                    '.barang-kpi-content p'
                );


            if (lastElement) {

                lastElement.textContent =
                    formatLastSeen(
                        date
                    );

            }


            if (description) {

                description.textContent =
                    formatDateTime(
                        date
                    );

            }

        }

    }


    function getLatestRecordWithDate() {

        const records =
            getBarangData()
                .filter(
                    function (item) {

                        return Boolean(
                            item.updated_at ||
                            item.created_at
                        );

                    }
                );


        if (
            records.length === 0
        ) {
            return null;
        }


        return [...records]
            .sort(
                function (a, b) {

                    return (
                        getRecordTimestamp(b) -
                        getRecordTimestamp(a)
                    );

                }
            )[0];

    }


    function getRecordTimestamp(item) {

        if (!item) {
            return 0;
        }


        const value =
            item.updated_at ||
            item.created_at ||
            '';


        if (!value) {
            return 0;
        }


        const timestamp =
            new Date(
                value
            ).getTime();


        return Number.isNaN(
            timestamp
        )
            ? 0
            : timestamp;

    }


    /* ============================================================
       CHART
       ============================================================ */

    function updateChart() {

        const canvas =
            document.getElementById(
                'barangDistributionChart'
            );


        if (!canvas) {
            return;
        }


        const records =
            getBarangData();


        const distribution = {};


        records.forEach(
            function (item) {

                const group =
                    resolveGolonganName(
                        item
                    );


                const label =
                    group &&
                    group !== '-'
                        ? group
                        : 'Belum Dikategorikan';


                distribution[label] =
                    (
                        distribution[label] ||
                        0
                    ) + 1;

            }
        );


        const labels =
            Object.keys(
                distribution
            );


        const values =
            labels.map(
                function (label) {

                    return distribution[
                        label
                    ];

                }
            );


        /*
         * TOTAL DI TENGAH CHART
         */

        const center =
            document.querySelector(
                '.barang-chart-center strong'
            );


        if (center) {

            center.textContent =
                numberFormatter.format(
                    records.length
                );

        }


        /*
         * LEGEND
         */

        renderLegend(
            distribution
        );


        /*
         * Hapus chart sebelumnya.
         */

        if (chartInstance) {

            chartInstance.destroy();

            chartInstance =
                null;

        }


        if (
            typeof window.Chart !==
            'function'
        ) {
            return;
        }


        const colors = [

            '#3389ee',
            '#4fc184',
            '#ffc85c',
            '#ff9024',
            '#8558e8',
            '#aab7ca',
            '#7c8da6'

        ];


        chartInstance =
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
                                    values,

                                backgroundColor:
                                    labels.map(
                                        function (
                                            label,
                                            index
                                        ) {

                                            return colors[
                                                index %
                                                colors.length
                                            ];

                                        }
                                    ),

                                borderWidth:
                                    2,

                                borderColor:
                                    '#ffffff'

                            }
                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '68%',

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

                                            return (
                                                `${context.label}: ` +
                                                `${numberFormatter.format(context.raw)} barang`
                                            );

                                        }

                                }

                            }

                        }

                    }

                }
            );

    }


    function renderLegend(
        distribution
    ) {

        const legend =
            document.getElementById(
                'barangLegend'
            );


        if (!legend) {
            return;
        }


        legend.replaceChildren();


        const entries =
            Object.entries(
                distribution
            )
                .sort(
                    function (a, b) {

                        return (
                            b[1] -
                            a[1]
                        );

                    }
                );


        const total =
            entries.reduce(
                function (
                    sum,
                    entry
                ) {

                    return (
                        sum +
                        entry[1]
                    );

                },
                0
            );


        const colors = [

            '#3389ee',
            '#4fc184',
            '#ffc85c',
            '#ff9024',
            '#8558e8',
            '#aab7ca',
            '#7c8da6'

        ];


        if (
            entries.length === 0
        ) {

            const item =
                document.createElement(
                    'div'
                );


            const dot =
                document.createElement(
                    'span'
                );


            dot.className =
                'barang-dot';


            dot.style.background =
                '#aab7ca';


            const text =
                document.createElement(
                    'p'
                );


            text.textContent =
                'Belum ada data';


            const count =
                document.createElement(
                    'strong'
                );


            count.textContent =
                '0';


            const percent =
                document.createElement(
                    'small'
                );


            percent.textContent =
                '0,0%';


            item.appendChild(
                dot
            );


            item.appendChild(
                text
            );


            item.appendChild(
                count
            );


            item.appendChild(
                percent
            );


            legend.appendChild(
                item
            );


            return;

        }


        entries.forEach(
            function (
                entry,
                index
            ) {

                const name =
                    entry[0];


                const count =
                    entry[1];


                const percentage =
                    total
                        ? (
                            count /
                            total
                        ) *
                        100
                        : 0;


                const item =
                    document.createElement(
                        'div'
                    );


                item.className =
                    'barang-legend-item';


                const dot =
                    document.createElement(
                        'span'
                    );


                dot.className =
                    'barang-dot';


                dot.style.background =
                    colors[
                        index %
                        colors.length
                    ];


                const text =
                    document.createElement(
                        'p'
                    );


                text.textContent =
                    name;


                const countElement =
                    document.createElement(
                        'strong'
                    );


                countElement.textContent =
                    numberFormatter.format(
                        count
                    );


                const percent =
                    document.createElement(
                        'small'
                    );


                percent.textContent =
                    `${percentage.toFixed(1).replace('.', ',')}%`;


                item.appendChild(
                    dot
                );


                item.appendChild(
                    text
                );


                item.appendChild(
                    countElement
                );


                item.appendChild(
                    percent
                );


                legend.appendChild(
                    item
                );

            }
        );

    }


    /* ============================================================
       SEARCH
       ============================================================ */

    function bindSearch() {

        const search =
            document.getElementById(
                'barangSearch'
            );


        if (!search) {
            return;
        }


        search.addEventListener(
            'input',
            function () {

                currentPage =
                    1;


                renderTable();


                refreshIcons();

            }
        );

    }


    /* ============================================================
       FILTER
       ============================================================ */

    function bindFilter() {

        const filter =
            document.getElementById(
                'barangGolongan'
            );


        if (!filter) {
            return;
        }


        filter.addEventListener(
            'change',
            function () {

                currentPage =
                    1;


                renderTable();


                refreshIcons();

            }
        );

    }


    /* ============================================================
       PAGE SIZE
       ============================================================ */

    function bindPageSize() {

        const pageSize =
            document.getElementById(
                'barangPageSize'
            );


        if (!pageSize) {
            return;
        }


        pageSize.addEventListener(
            'change',
            function () {

                currentPage =
                    1;


                renderTable();


                refreshIcons();

            }
        );

    }


    /* ============================================================
       TABLE ACTION
       ============================================================ */

    function bindTableActions() {

        const table =
            document.getElementById(
                'barangTable'
            );


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
                        'tr'
                    );


                if (!row) {
                    return;
                }


                const id =
                    row.dataset.id;


                const action =
                    button.dataset.action;


                handleAction(
                    action,
                    id
                );

            }
        );

    }


    function handleAction(
        action,
        id
    ) {

        const records =
            getBarangData();


        const record =
            records.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            id
                        )
                    );

                }
            );


        if (!record) {

            showMessage(
                'Data barang tidak ditemukan.',
                'error'
            );

            return;

        }


        if (
            action ===
            'view'
        ) {

            openModal(
                'view',
                record
            );

            return;

        }


        if (
            action ===
            'edit'
        ) {

            openModal(
                'edit',
                record
            );

            return;

        }


        if (
            action ===
            'delete'
        ) {

            openModal(
                'delete',
                record
            );

        }

    }


    /* ============================================================
       MODAL
       ============================================================ */

    function bindModal() {

        const modal =
            document.getElementById(
                'barangModal'
            );


        if (!modal) {
            return;
        }


        modal.addEventListener(
            'click',
            function (event) {

                if (
                    event.target ===
                    modal
                ) {

                    closeModal();

                }

            }
        );

    }


    function bindEscapeKey() {

        document.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key !==
                    'Escape'
                ) {
                    return;
                }


                const modal =
                    document.getElementById(
                        'barangModal'
                    );


                if (
                    modal &&
                    modal.open
                ) {

                    closeModal();

                }

            }
        );

    }


    function openModal(
        mode,
        record = null
    ) {

        const modal =
            document.getElementById(
                'barangModal'
            );


        if (!modal) {
            return;
        }


        modalMode =
            mode;


        modalRecordId =
            record
                ? record.id
                : null;


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


        /*
         * Bersihkan status sebelumnya.
         */

        if (save) {

            save.hidden =
                false;


            save.disabled =
                false;


            save.classList.remove(
                'barang-delete-button'
            );

        }


        if (form) {

            form.dataset.mode =
                mode;


            form.dataset.id =
                record
                    ? record.id
                    : '';

        }


        if (name) {

            name.value =
                record?.nama_barang ||
                '';

        }


        if (code) {

            code.value =
                record?.kode_barang ||
                '';

        }


        if (group) {

            group.value =
                record
                    ? resolveGolonganId(
                        record
                    )
                    : '';

        }


        /*
         * ADD
         */

        if (
            mode ===
            'add'
        ) {

            if (form) {
                form.reset();
            }


            if (title) {

                title.textContent =
                    'Tambah Barang';

            }


            if (description) {

                description.textContent =
                    'Tambahkan data master barang baru.';

            }


            if (note) {

                note.textContent =
                    'Data baru akan disimpan langsung ke database.';

            }


            setFormDisabled(
                false
            );


            if (save) {

                save.hidden =
                    false;


                save.disabled =
                    false;


                save.textContent =
                    'Simpan Barang';

            }

        }


        /*
         * VIEW
         */

        if (
            mode ===
            'view'
        ) {

            if (title) {

                title.textContent =
                    'Detail Barang';

            }


            if (description) {

                description.textContent =
                    'Informasi data master barang.';

            }


            if (note) {

                note.textContent =
                    'Data ini berasal dari database sistem.';

            }


            setFormDisabled(
                true
            );


            if (save) {

                save.hidden =
                    true;

            }

        }


        /*
         * EDIT
         */

        if (
            mode ===
            'edit'
        ) {

            if (title) {

                title.textContent =
                    'Edit Barang';

            }


            if (description) {

                description.textContent =
                    'Perbarui data master barang.';

            }


            if (note) {

                note.textContent =
                    'Perubahan akan disimpan langsung ke database.';

            }


            setFormDisabled(
                false
            );


            if (save) {

                save.hidden =
                    false;


                save.disabled =
                    false;


                save.textContent =
                    'Simpan Perubahan';

            }

        }


        /*
         * DELETE
         */

        if (
            mode ===
            'delete'
        ) {

            if (title) {

                title.textContent =
                    'Hapus Barang';

            }


            if (description) {

                description.textContent =
                    'Konfirmasi penghapusan data barang.';

            }


            if (note) {

                note.textContent =
                    'Data akan dihapus dari database dan tidak dapat dikembalikan.';

            }


            setFormDisabled(
                true
            );


            if (save) {

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

        }


        previousBodyOverflow =
            document.body.style.overflow;


        document.body.style.overflow =
            'hidden';


        if (
            typeof modal.showModal ===
            'function'
        ) {

            if (!modal.open) {

                modal.showModal();

            }

        } else {

            modal.setAttribute(
                'open',
                ''
            );

        }


        refreshIcons();

    }


    function setFormDisabled(
        disabled
    ) {

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


        if (name) {

            name.readOnly =
                disabled;

        }


        if (code) {

            code.readOnly =
                disabled;

        }


        if (group) {

            group.disabled =
                disabled;

        }

    }


    function closeModal() {

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

        }


        document.body.style.overflow =
            previousBodyOverflow;


        const save =
            document.getElementById(
                'barangSaveButton'
            );


        if (save) {

            save.classList.remove(
                'barang-delete-button'
            );


            save.disabled =
                false;

        }

    }


    /* ============================================================
       FORM EVENT
       ============================================================ */

    function bindForm() {

        const form =
            document.getElementById(
                'barangForm'
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();


                submitForm();

            }
        );

    }


    /* ============================================================
       CSRF
       ============================================================ */

    function getCsrfToken() {

        /*
         * Prioritas meta csrf-token
         * dari layout Laravel.
         */

        const meta =
            document.querySelector(
                'meta[name="csrf-token"]'
            );


        if (
            meta &&
            meta.content
        ) {

            return meta.content;

        }


        /*
         * Fallback dari @csrf di form.
         */

        const input =
            document.querySelector(
                '#barangForm input[name="_token"]'
            );


        if (
            input &&
            input.value
        ) {

            return input.value;

        }


        return '';

    }


    /* ============================================================
       CRUD URL
       ============================================================ */

    function getCrudUrl(
        type,
        id = null
    ) {

        if (
            !window.BARANG_CRUD
        ) {

            throw new Error(
                'Konfigurasi BARANG_CRUD tidak ditemukan pada Blade.'
            );

        }


        if (
            type ===
            'store'
        ) {

            if (
                !window.BARANG_CRUD.store
            ) {

                throw new Error(
                    'URL tambah Barang tidak ditemukan.'
                );

            }


            return window.BARANG_CRUD.store;

        }


        if (
            type ===
            'update'
        ) {

            if (
                !window.BARANG_CRUD.update
            ) {

                throw new Error(
                    'URL update Barang tidak ditemukan.'
                );

            }


            return window.BARANG_CRUD.update.replace(
                '__ID__',
                encodeURIComponent(
                    id
                )
            );

        }


        if (
            type ===
            'destroy'
        ) {

            if (
                !window.BARANG_CRUD.destroy
            ) {

                throw new Error(
                    'URL hapus Barang tidak ditemukan.'
                );

            }


            return window.BARANG_CRUD.destroy.replace(
                '__ID__',
                encodeURIComponent(
                    id
                )
            );

        }


        throw new Error(
            'Tipe CRUD Barang tidak valid.'
        );

    }


    /* ============================================================
       HTTP REQUEST
       ============================================================ */

    async function requestCrud(
        url,
        method,
        payload = null
    ) {

        const csrfToken =
            getCsrfToken();


        if (!csrfToken) {

            throw new Error(
                'CSRF token tidak ditemukan. Pastikan layout memiliki meta csrf-token atau form menggunakan @csrf.'
            );

        }


        const headers = {

            'Accept':
                'application/json',

            'X-Requested-With':
                'XMLHttpRequest',

            'X-CSRF-TOKEN':
                csrfToken

        };


        const options = {

            method:
                method,

            headers:
                headers,

            credentials:
                'same-origin'

        };


        if (
            payload !== null
        ) {

            headers[
                'Content-Type'
            ] =
                'application/json';


            options.body =
                JSON.stringify(
                    payload
                );

        }


        let response;


        try {

            response =
                await fetch(
                    url,
                    options
                );

        } catch (error) {

            console.error(
                'Request Barang gagal:',
                error
            );


            throw new Error(
                'Tidak dapat terhubung ke server.'
            );

        }


        const contentType =
            response.headers.get(
                'content-type'
            ) || '';


        let data =
            null;


        /*
         * JSON dari Laravel.
         */

        if (
            contentType.includes(
                'application/json'
            )
        ) {

            try {

                data =
                    await response.json();

            } catch (error) {

                data =
                    null;

            }

        } else {

            /*
             * Kalau controller lama masih redirect/HTML,
             * response sukses tetap dapat diterima.
             */

            try {

                data =
                    await response.text();

            } catch (error) {

                data =
                    null;

            }

        }


        /*
         * ERROR RESPONSE
         */

        if (
            !response.ok
        ) {

            let message =
                (
                    data &&
                    typeof data === 'object' &&
                    data.message
                )
                    ? data.message
                    : `Request gagal dengan status ${response.status}.`;


            /*
             * Laravel validation 422.
             */

            if (
                response.status === 422 &&
                data &&
                typeof data === 'object' &&
                data.errors
            ) {

                const errors =
                    Object.values(
                        data.errors
                    ).flat();


                if (
                    errors.length > 0
                ) {

                    message =
                        errors[0];

                }

            }


            /*
             * CSRF.
             */

            if (
                response.status === 419
            ) {

                message =
                    'Session Laravel atau CSRF token telah kedaluwarsa. Refresh halaman lalu coba lagi.';

            }


            /*
             * Unauthorized.
             */

            if (
                response.status === 401
            ) {

                message =
                    'Session login telah berakhir. Silakan login kembali.';

            }


            /*
             * Forbidden.
             */

            if (
                response.status === 403
            ) {

                message =
                    'Kamu tidak memiliki izin untuk melakukan aksi ini.';

            }


            /*
             * Not Found.
             */

            if (
                response.status === 404
            ) {

                message =
                    'Route atau data Barang tidak ditemukan.';

            }


            /*
             * Method Not Allowed.
             */

            if (
                response.status === 405
            ) {

                message =
                    `Method ${method} tidak diizinkan oleh route Laravel.`;

            }


            /*
             * Server error.
             */

            if (
                response.status >= 500
            ) {

                message =
                    (
                        data &&
                        typeof data === 'object' &&
                        data.message
                    )
                        ? data.message
                        : 'Terjadi kesalahan pada server Laravel.';

            }


            throw new Error(
                message
            );

        }


        return data;

    }


    /* ============================================================
       SUBMIT FORM
       ============================================================ */

    async function submitForm() {

        const saveButton =
            document.getElementById(
                'barangSaveButton'
            );


        /*
         * ========================================================
         * DELETE
         * ========================================================
         */

        if (
            modalMode ===
            'delete'
        ) {

            await deleteBarang(
                saveButton
            );

            return;

        }


        /*
         * ========================================================
         * AMBIL FORM
         * ========================================================
         */

        const name =
            document.getElementById(
                'barangName'
            )?.value
                ?.trim() ||
            '';


        const code =
            document.getElementById(
                'barangCode'
            )?.value
                ?.trim() ||
            '';


        const group =
            document.getElementById(
                'barangFormGolongan'
            )?.value ||
            '';


        /*
         * VALIDASI FRONTEND
         */

        if (!name) {

            showMessage(
                'Nama barang wajib diisi.',
                'error'
            );

            return;

        }


        if (!code) {

            showMessage(
                'Kode barang wajib diisi.',
                'error'
            );

            return;

        }


        if (!group) {

            showMessage(
                'Golongan wajib dipilih.',
                'error'
            );

            return;

        }


        /*
         * Payload sesuai field Blade/database existing.
         */

        const payload = {

            nama_barang:
                name,

            kode_barang:
                code,

            golongan:
                group

        };


        /*
         * ========================================================
         * CREATE
         * ========================================================
         */

        if (
            modalMode ===
            'add'
        ) {

            await createBarang(
                payload,
                saveButton
            );

            return;

        }


        /*
         * ========================================================
         * UPDATE
         * ========================================================
         */

        if (
            modalMode ===
            'edit'
        ) {

            await updateBarang(
                payload,
                saveButton
            );

        }

    }


    /* ============================================================
       CREATE DATABASE
       ============================================================ */

    async function createBarang(
        payload,
        button
    ) {

        try {

            setButtonLoading(
                button,
                true,
                'Menyimpan...'
            );


            const url =
                getCrudUrl(
                    'store'
                );


            await requestCrud(
                url,
                'POST',
                payload
            );


            closeModal();


            showMessage(
                'Barang berhasil ditambahkan ke database.',
                'success'
            );


            /*
             * Reload agar Controller mengambil
             * ulang data terbaru dari DB.
             */

            reloadAfterSuccess();

        } catch (error) {

            console.error(
                'CREATE Barang gagal:',
                error
            );


            showMessage(
                error.message ||
                'Barang gagal ditambahkan.',
                'error'
            );


            setButtonLoading(
                button,
                false,
                'Simpan Barang'
            );

        }

    }


    /* ============================================================
       UPDATE DATABASE
       ============================================================ */

    async function updateBarang(
        payload,
        button
    ) {

        if (!modalRecordId) {

            showMessage(
                'ID barang tidak ditemukan.',
                'error'
            );

            return;

        }


        try {

            setButtonLoading(
                button,
                true,
                'Menyimpan...'
            );


            const url =
                getCrudUrl(
                    'update',
                    modalRecordId
                );


            await requestCrud(
                url,
                'PUT',
                payload
            );


            closeModal();


            showMessage(
                'Barang berhasil diperbarui di database.',
                'success'
            );


            reloadAfterSuccess();

        } catch (error) {

            console.error(
                'UPDATE Barang gagal:',
                error
            );


            showMessage(
                error.message ||
                'Barang gagal diperbarui.',
                'error'
            );


            setButtonLoading(
                button,
                false,
                'Simpan Perubahan'
            );

        }

    }


    /* ============================================================
       DELETE DATABASE
       ============================================================ */

    async function deleteBarang(
        button
    ) {

        if (!modalRecordId) {

            showMessage(
                'ID barang tidak ditemukan.',
                'error'
            );

            return;

        }


        const record =
            getBarangData()
                .find(
                    function (item) {

                        return (
                            String(
                                item.id
                            ) ===
                            String(
                                modalRecordId
                            )
                        );

                    }
                );


        if (!record) {

            showMessage(
                'Data barang tidak ditemukan.',
                'error'
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Apakah kamu yakin ingin menghapus "${record.nama_barang}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setButtonLoading(
                button,
                true,
                'Menghapus...'
            );


            const url =
                getCrudUrl(
                    'destroy',
                    modalRecordId
                );


            await requestCrud(
                url,
                'DELETE'
            );


            closeModal();


            showMessage(
                'Barang berhasil dihapus dari database.',
                'success'
            );


            reloadAfterSuccess();

        } catch (error) {

            console.error(
                'DELETE Barang gagal:',
                error
            );


            showMessage(
                error.message ||
                'Barang gagal dihapus.',
                'error'
            );


            setButtonLoading(
                button,
                false,
                'Hapus Barang'
            );

        }

    }


    /* ============================================================
       BUTTON LOADING
       ============================================================ */

    function setButtonLoading(
        button,
        loading,
        text
    ) {

        if (!button) {
            return;
        }


        button.disabled =
            loading;


        button.textContent =
            text;

    }


    /* ============================================================
       RELOAD AFTER CRUD
       ============================================================ */

    function reloadAfterSuccess() {

        /*
         * Tidak perlu memanipulasi array/frontend
         * sebagai sumber utama.
         *
         * Reload memastikan data yang tampil adalah
         * data yang benar-benar sudah berada di database.
         */

        window.setTimeout(
            function () {

                window.location.reload();

            },
            450
        );

    }


    /* ============================================================
       RESET FILTER
       ============================================================ */

    function resetFilter() {

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


        currentPage =
            1;


        renderPage();

    }


    /* ============================================================
       EXPORT CSV
       ============================================================ */

    function exportCSV() {

        const records =
            getFilteredData();


        if (
            records.length === 0
        ) {

            showMessage(
                'Tidak ada data Barang untuk diekspor.',
                'error'
            );

            return;

        }


        const rows = [

            [
                'No',
                'Nama Barang',
                'Kode Barang',
                'Golongan'
            ]

        ];


        records.forEach(
            function (
                item,
                index
            ) {

                rows.push([

                    index + 1,

                    item.nama_barang ||
                    '',

                    item.kode_barang ||
                    '',

                    resolveGolonganName(
                        item
                    ) || ''

                ]);

            }
        );


        const escapeCSV =
            function (value) {

                let text =
                    String(
                        value ??
                        ''
                    );


                /*
                 * Proteksi formula injection spreadsheet.
                 */

                if (
                    /^[\s]*[=+@-]/
                        .test(text)
                ) {

                    text =
                        "'" +
                        text;

                }


                return (
                    '"' +
                    text.replace(
                        /"/g,
                        '""'
                    ) +
                    '"'
                );

            };


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
                .join(
                    '\r\n'
                );


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


        showMessage(
            'Data Barang berhasil diekspor.',
            'success'
        );

    }


    /* ============================================================
       CURRENT DATE / TIME
       ============================================================ */

    function updateCurrentDate() {

        const dateElement =
            document.getElementById(
                'barangCurrentDate'
            );


        const timeElement =
            document.getElementById(
                'barangCurrentTime'
            );


        if (
            !dateElement &&
            !timeElement
        ) {
            return;
        }


        const now =
            new Date();


        if (dateElement) {

            dateElement.textContent =
                new Intl.DateTimeFormat(
                    'id-ID',
                    {

                        timeZone:
                            TIMEZONE,

                        weekday:
                            'long',

                        day:
                            'numeric',

                        month:
                            'long',

                        year:
                            'numeric'

                    }
                ).format(
                    now
                );

        }


        if (timeElement) {

            timeElement.textContent =
                new Intl.DateTimeFormat(
                    'id-ID',
                    {

                        timeZone:
                            TIMEZONE,

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
                    .format(
                        now
                    )
                    .replace(
                        /\./g,
                        ':'
                    ) +
                ' WITA';

        }

    }


    /* ============================================================
       FORMAT DATE
       ============================================================ */

    function formatDate(
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
                    TIMEZONE,

                day:
                    '2-digit',

                month:
                    'short',

                year:
                    'numeric'

            }
        ).format(
            date
        );

    }


    function formatDateTime(
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


        return (
            new Intl.DateTimeFormat(
                'id-ID',
                {

                    timeZone:
                        TIMEZONE,

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
                .format(
                    date
                )
                .replace(
                    /\./g,
                    ':'
                ) +
            ' WITA'
        );

    }


    function formatLastSeen(
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
            Number.isNaN(
                timestamp
            )
        ) {
            return '-';
        }


        const difference =
            Math.max(
                0,
                Date.now() -
                timestamp
            );


        const seconds =
            Math.floor(
                difference /
                1000
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
                seconds /
                60
            );


        if (
            minutes < 60
        ) {
            return `${minutes} menit lalu`;
        }


        const hours =
            Math.floor(
                minutes /
                60
            );


        if (
            hours < 24
        ) {
            return `${hours} jam lalu`;
        }


        const days =
            Math.floor(
                hours /
                24
            );


        if (
            days < 7
        ) {
            return `${days} hari lalu`;
        }


        return formatDate(
            dateString
        );

    }


    /* ============================================================
       MESSAGE
       ============================================================ */

    function showMessage(
        message,
        type = 'success'
    ) {

        /*
         * SweetAlert jika tersedia.
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
                    type === 'error'
                        ? 3000
                        : 1800,

                showConfirmButton:
                    type === 'error'

            });


            return;

        }


        window.alert(
            message
        );

    }


    /* ============================================================
       LUCIDE
       ============================================================ */

    function refreshIcons() {

        if (
            window.lucide &&
            typeof window.lucide.createIcons ===
            'function'
        ) {

            window.lucide.createIcons();

        }

    }


    /* ============================================================
       GLOBAL FUNCTIONS
       ============================================================ */

    /*
     * Dipakai oleh:
     *
     * onclick="openBarangModal('add')"
     */

    window.openBarangModal =
        function (
            mode,
            record = null
        ) {

            openModal(
                mode,
                record
            );

        };


    /*
     * Dipakai tombol tutup modal.
     */

    window.closeBarangModal =
        closeModal;


    /*
     * Dipakai tombol Filter.
     */

    window.filterBarangTable =
        function () {

            currentPage =
                1;


            renderTable();


            refreshIcons();

        };


    /*
     * Dipakai tombol Reset.
     */

    window.resetBarangFilter =
        resetFilter;


    /*
     * Dipakai tombol Export.
     */

    window.exportBarangCSV =
        exportCSV;


    /*
     * Debug optional melalui browser console:
     *
     * debugBarang()
     */

    window.debugBarang =
        function () {

            console.group(
                'SISTEM ASET - DEBUG BARANG'
            );


            console.log(
                'BARANG_CRUD:',
                window.BARANG_CRUD
            );


            console.log(
                'CSRF:',
                getCsrfToken()
                    ? 'tersedia'
                    : 'tidak tersedia'
            );


            console.log(
                'Golongan Map:',
                golonganMap
            );


            console.log(
                'Barang dari Database/Blade:',
                getBarangData()
            );


            console.log(
                'Total Barang:',
                getBarangData().length
            );


            console.log(
                'Data Filter:',
                getFilteredData()
            );


            console.groupEnd();

        };

        /* ========================================================
   BARANG ACTIVITY HISTORY
   ======================================================== */

function bindBarangActivityHistory() {

    const card =
        document.getElementById(
            'barangTotalActivityCard'
        );


    const modal =
        document.getElementById(
            'barangActivityModal'
        );


    if (
        !card ||
        !modal
    ) {
        return;
    }


    /*
     * Klik card.
     */

    card.addEventListener(
        'click',
        function () {

            openBarangActivityModal();

        }
    );


    /*
     * Keyboard accessibility.
     */

    card.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Enter' ||
                event.key === ' '
            ) {

                event.preventDefault();

                openBarangActivityModal();

            }

        }
    );


    /*
     * Klik backdrop.
     */

    modal.addEventListener(
        'click',
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeBarangActivityModal();

            }

        }
    );


    /*
     * Filter.
     */

    document
        .querySelectorAll(
            '[data-barang-history-filter]'
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    'click',
                    function () {

                        setBarangActivityFilter(
                            button.dataset
                                .barangHistoryFilter
                        );

                    }
                );

            }
        );

}


/* ========================================================
   OPEN HISTORY
   ======================================================== */

function openBarangActivityModal() {

    const modal =
        document.getElementById(
            'barangActivityModal'
        );


    if (!modal) {
        return;
    }


    setBarangActivityFilter(
        'all'
    );


    if (
        typeof modal.showModal ===
        'function'
    ) {

        if (!modal.open) {

            modal.showModal();

        }

    } else {

        modal.setAttribute(
            'open',
            ''
        );

    }


    refreshIcons();

}


/* ========================================================
   CLOSE HISTORY
   ======================================================== */

function closeBarangActivityModal() {

    const modal =
        document.getElementById(
            'barangActivityModal'
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

    }

}


/* ========================================================
   FILTER HISTORY
   ======================================================== */

function setBarangActivityFilter(
    filter
) {

    const buttons =
        document.querySelectorAll(
            '[data-barang-history-filter]'
        );


    const rows =
        Array.from(
            document.querySelectorAll(
                '[data-barang-history-row]'
            )
        );


    const empty =
        document.getElementById(
            'barangHistoryFilteredEmpty'
        );


    /*
     * Active button.
     */

    buttons.forEach(
        function (button) {

            button.classList.toggle(
                'active',

                button.dataset
                    .barangHistoryFilter ===
                    filter
            );

        }
    );


    let visibleCount =
        0;


    rows.forEach(
        function (row) {

            const visible =
                filter ===
                    'all' ||
                row.dataset.action ===
                    filter;


            row.hidden =
                !visible;


            if (visible) {

                visibleCount++;


                const number =
                    row.querySelector(
                        '.barang-history-number'
                    );


                if (number) {

                    number.textContent =
                        visibleCount;

                }

            }

        }
    );


    if (empty) {

        empty.hidden =
            !(
                rows.length >
                0 &&
                visibleCount ===
                0
            );

    }


    refreshIcons();

}


/* ========================================================
   GLOBAL HISTORY FUNCTIONS
   ======================================================== */

window.openBarangActivityModal =
    openBarangActivityModal;


window.closeBarangActivityModal =
    closeBarangActivityModal;


/*
 * Karena DOMContentLoaded utama sudah ada di file,
 * event kedua ini aman.
 */

document.addEventListener(
    'DOMContentLoaded',
    bindBarangActivityHistory
);

})();