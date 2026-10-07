/* =========================================================
   MASTER DATA - LOKASI
   CRUD Laravel + PostgreSQL
========================================================= */

let lokasiCurrentPage = 1;

let lokasiChart = null;

let lokasiPreviousOverflow = '';

let lokasiModalMode = 'add';

let lokasiCurrentId = null;

let lokasiCurrentRow = null;

let lokasiPreviewObjectUrl = null;

let lokasiToastTimer = null;


const lokasiNumber =
    new Intl.NumberFormat(
        'id-ID'
    );



/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',

    function () {

        if (
            !document.querySelector(
                '.lokasi-page'
            )
        ) {

            return;

        }


        updateLokasiDate();


        window.setInterval(
            updateLokasiDate,
            1000
        );


        bindLokasiEvents();


        renderLokasiTable();


        initLokasiChart();


        if (window.lucide) {

            window.lucide.createIcons();

        }

    }
);



/* =========================================================
   EVENT
========================================================= */

function bindLokasiEvents() {


    document
        .getElementById(
            'lokasiSearch'
        )
        ?.addEventListener(
            'input',
            filterLokasiTable
        );


    document
        .getElementById(
            'lokasiWilayahFilter'
        )
        ?.addEventListener(
            'change',
            filterLokasiTable
        );


    document
        .getElementById(
            'lokasiPageSize'
        )
        ?.addEventListener(
            'change',
            filterLokasiTable
        );


    document
        .getElementById(
            'lokasiResetButton'
        )
        ?.addEventListener(
            'click',
            resetLokasiFilter
        );


    document
        .getElementById(
            'lokasiExportButton'
        )
        ?.addEventListener(
            'click',
            exportLokasiCSV
        );


    document
        .getElementById(
            'lokasiAddButton'
        )
        ?.addEventListener(
            'click',

            function () {

                openLokasiModal(
                    'add'
                );

            }
        );


    document
        .getElementById(
            'lokasiViewAll'
        )
        ?.addEventListener(
            'click',

            function () {

                resetLokasiFilter();


                document
                    .getElementById(
                        'lokasiList'
                    )
                    ?.scrollIntoView({

                        behavior:
                            'smooth',

                        block:
                            'start'

                    });


                window.setTimeout(

                    function () {

                        document
                            .getElementById(
                                'lokasiSearch'
                            )
                            ?.focus({

                                preventScroll:
                                    true

                            });

                    },

                    300

                );

            }
        );


    document
        .getElementById(
            'lokasiHistoryTrigger'
        )
        ?.addEventListener(
            'click',
            openLokasiHistory
        );


    document
        .getElementById(
            'lokasiHistoryClose'
        )
        ?.addEventListener(
            'click',
            closeLokasiHistory
        );


    document
        .getElementById(
            'lokasiHistoryCloseBottom'
        )
        ?.addEventListener(
            'click',
            closeLokasiHistory
        );


    document
        .getElementById(
            'lokasiModalClose'
        )
        ?.addEventListener(
            'click',
            closeLokasiModal
        );


    document
        .getElementById(
            'lokasiCancelButton'
        )
        ?.addEventListener(
            'click',
            closeLokasiModal
        );


    document
        .getElementById(
            'lokasiForm'
        )
        ?.addEventListener(
            'submit',
            saveLokasi
        );


    document
        .getElementById(
            'lokasiImage'
        )
        ?.addEventListener(
            'change',
            handleLokasiImagePreview
        );


    document
        .getElementById(
            'lokasiLat'
        )
        ?.addEventListener(
            'input',
            updateLokasiMapLink
        );


    document
        .getElementById(
            'lokasiLong'
        )
        ?.addEventListener(
            'input',
            updateLokasiMapLink
        );



    /*
    |--------------------------------------------------------------------------
    | TABLE ACTION
    |--------------------------------------------------------------------------
    */

    document
        .getElementById(
            'lokasiTable'
        )
        ?.addEventListener(
            'click',

            function (event) {

                const button =
                    event.target.closest(
                        '[data-action]'
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


                openLokasiModal(

                    button.dataset.action,

                    row

                );

            }
        );



    /*
    |--------------------------------------------------------------------------
    | MODAL CLICK BACKDROP
    |--------------------------------------------------------------------------
    */

    const modal =
        document.getElementById(
            'lokasiModal'
        );


    modal
        ?.addEventListener(
            'click',

            function (event) {

                if (
                    event.target
                    === modal
                ) {

                    closeLokasiModal();

                }

            }
        );


    modal
        ?.addEventListener(
            'close',

            function () {

                document.body.style.overflow =
                    lokasiPreviousOverflow;


                clearLokasiPreviewObjectUrl();

            }
        );



    /*
    |--------------------------------------------------------------------------
    | HISTORY
    |--------------------------------------------------------------------------
    */

    const history =
        document.getElementById(
            'lokasiHistoryModal'
        );


    history
        ?.addEventListener(
            'click',

            function (event) {

                if (
                    event.target
                    === history
                ) {

                    closeLokasiHistory();

                }

            }
        );


    history
        ?.addEventListener(
            'close',

            function () {

                document.body.style.overflow =
                    lokasiPreviousOverflow;

            }
        );

}



/* =========================================================
   WITA CLOCK
========================================================= */

function updateLokasiDate() {


    const date =
        document.getElementById(
            'lokasiCurrentDate'
        );


    const time =
        document.getElementById(
            'lokasiCurrentTime'
        );


    if (
        !date
        ||
        !time
    ) {

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
        )

        + ' WITA';

}



/* =========================================================
   GET ROWS
========================================================= */

function getLokasiRows() {

    return Array.from(

        document.querySelectorAll(
            '#lokasiTable tbody tr[data-record]'
        )

    );

}



function normalizeLokasiText(value) {

    return String(
        value ?? ''
    )
    .trim()
    .toLocaleLowerCase(
        'id-ID'
    );

}



/* =========================================================
   FILTER
========================================================= */

function getFilteredLokasiRows() {


    const search =
        normalizeLokasiText(

            document
                .getElementById(
                    'lokasiSearch'
                )
                ?.value

        );


    const wilayah =
        document
            .getElementById(
                'lokasiWilayahFilter'
            )
            ?.value

        ?? '';


    return getLokasiRows()

        .filter(

            function (row) {


                const searchable =
                    normalizeLokasiText(

                        [

                            row.dataset.id,

                            row.dataset.lokasi,

                            row.dataset.alamat,

                            row.dataset.wilayah,

                            row.dataset.lat,

                            row.dataset.long

                        ].join(' ')

                    );


                const searchMatch =

                    !search

                    ||

                    searchable.includes(
                        search
                    );



                let wilayahMatch =
                    true;



                if (
                    wilayah === '__NULL__'
                ) {


                    wilayahMatch =

                        !String(
                            row.dataset.wilayahId
                            ?? ''
                        )
                        .trim();


                } else if (wilayah) {


                    wilayahMatch =

                        String(
                            row.dataset.wilayahId
                            ?? ''
                        )

                        ===

                        String(
                            wilayah
                        );

                }


                return (
                    searchMatch
                    &&
                    wilayahMatch
                );

            }

        );

}



/* =========================================================
   FILTER ACTION
========================================================= */

function filterLokasiTable() {

    lokasiCurrentPage = 1;

    renderLokasiTable();

}



function resetLokasiFilter() {


    const search =
        document.getElementById(
            'lokasiSearch'
        );


    const wilayah =
        document.getElementById(
            'lokasiWilayahFilter'
        );


    const pageSize =
        document.getElementById(
            'lokasiPageSize'
        );


    if (search) {

        search.value = '';

    }


    if (wilayah) {

        wilayah.value = '';

    }


    if (pageSize) {

        pageSize.value = '10';

    }


    lokasiCurrentPage = 1;


    renderLokasiTable();

}



/* =========================================================
   RENDER TABLE
========================================================= */

function renderLokasiTable() {


    const allRows =
        getLokasiRows();


    const filtered =
        getFilteredLokasiRows();


    const size =
        Number(

            document
                .getElementById(
                    'lokasiPageSize'
                )
                ?.value

        )

        || 10;



    const totalPages =
        Math.max(

            1,

            Math.ceil(

                filtered.length
                /
                size

            )

        );



    lokasiCurrentPage =
        Math.min(

            Math.max(
                1,
                lokasiCurrentPage
            ),

            totalPages

        );



    const start =

        (
            lokasiCurrentPage
            - 1
        )

        * size;



    const visible =
        filtered.slice(

            start,

            start + size

        );



    /*
    |--------------------------------------------------------------------------
    | HIDE ALL
    |--------------------------------------------------------------------------
    */

    allRows.forEach(

        function (row) {

            row.hidden = true;

        }

    );



    /*
    |--------------------------------------------------------------------------
    | SHOW CURRENT PAGE
    |--------------------------------------------------------------------------
    */

    visible.forEach(

        function (
            row,
            index
        ) {


            row.hidden =
                false;


            const no =
                row.querySelector(
                    '.lokasi-row-number'
                );


            if (no) {

                no.textContent =

                    start
                    +
                    index
                    +
                    1;

            }

        }

    );



    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    const emptyRow =
        document.getElementById(
            'lokasiEmptyRow'
        );


    if (emptyRow) {

        emptyRow.hidden =
            filtered.length > 0;

    }



    /*
    |--------------------------------------------------------------------------
    | INFO
    |--------------------------------------------------------------------------
    */

    const from =

        filtered.length

        ? start + 1

        : 0;


    const to =

        Math.min(

            start + size,

            filtered.length

        );


    const info =
        document.getElementById(
            'lokasiTableInfo'
        );


    if (info) {


        let text =

            `Menampilkan ${from}–${to} dari `

            +

            `${lokasiNumber.format(
                filtered.length
            )} data`;



        if (
            filtered.length
            !==
            allRows.length
        ) {

            text +=

                ` (total ${lokasiNumber.format(
                    allRows.length
                )})`;

        }


        info.textContent =
            text;

    }



    renderLokasiPagination(
        totalPages
    );



    if (window.lucide) {

        window.lucide.createIcons();

    }

}



/* =========================================================
   PAGINATION
========================================================= */

function renderLokasiPagination(
    totalPages
) {


    const pagination =
        document.getElementById(
            'lokasiPagination'
        );


    if (!pagination) {

        return;

    }


    pagination.replaceChildren();



    function addButton(

        label,

        page,

        disabled,

        active,

        ariaLabel

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
            Boolean(
                disabled
            );


        button.setAttribute(

            'aria-label',

            ariaLabel

            ||

            `Halaman ${page}`

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



        button.addEventListener(

            'click',

            function () {


                lokasiCurrentPage =
                    page;


                renderLokasiTable();


                document
                    .getElementById(
                        'lokasiList'
                    )
                    ?.scrollIntoView({

                        behavior:
                            'smooth',

                        block:
                            'start'

                    });

            }

        );


        pagination.appendChild(
            button
        );

    }



    /*
    |--------------------------------------------------------------------------
    | PREVIOUS
    |--------------------------------------------------------------------------
    */

    addButton(

        '‹',

        lokasiCurrentPage - 1,

        lokasiCurrentPage === 1,

        false,

        'Halaman sebelumnya'

    );



    let first =
        Math.max(

            1,

            lokasiCurrentPage - 2

        );


    let last =
        Math.min(

            totalPages,

            first + 4

        );


    first =
        Math.max(

            1,

            last - 4

        );



    for (
        let page = first;
        page <= last;
        page++
    ) {


        addButton(

            String(page),

            page,

            false,

            page
            ===
            lokasiCurrentPage,

            `Halaman ${page}`

        );

    }



    /*
    |--------------------------------------------------------------------------
    | NEXT
    |--------------------------------------------------------------------------
    */

    addButton(

        '›',

        lokasiCurrentPage + 1,

        lokasiCurrentPage
        ===
        totalPages,

        false,

        'Halaman berikutnya'

    );

}



/* =========================================================
   CHART
========================================================= */

function initLokasiChart() {


    const canvas =
        document.getElementById(
            'lokasiDistributionChart'
        );


    if (!canvas) {

        return;

    }


    const groups =
        Array.from(

            document.querySelectorAll(
                '#lokasiLegend [data-count]'
            )

        );


    if (!groups.length) {

        return;

    }



    const labels =
        groups.map(

            item =>
                item.dataset.label

        );


    const counts =
        groups.map(

            item =>
                Number(
                    item.dataset.count
                )
                || 0

        );


    const colors =
        groups.map(

            item =>
                item.dataset.color

        );



    const total =
        counts.reduce(

            (
                sum,
                value
            ) =>

                sum + value,

            0

        );


    const wrap =
        canvas.closest(
            '.lokasi-chart-wrap'
        );


    const center =
        wrap?.querySelector(
            '.lokasi-chart-center strong'
        );


    if (center) {

        center.textContent =
            lokasiNumber.format(
                total
            );

    }



    if (lokasiChart) {

        lokasiChart.destroy();

        lokasiChart = null;

    }



    /*
    |--------------------------------------------------------------------------
    | FALLBACK TANPA CHART.JS
    |--------------------------------------------------------------------------
    */

    if (
        typeof window.Chart
        !==
        'function'
    ) {


        let angle = 0;


        const segments =
            counts.map(

                function (
                    count,
                    index
                ) {


                    const start =
                        angle;


                    angle +=

                        total

                        ? (
                            count
                            /
                            total
                        )
                        *
                        360

                        : 0;


                    return (

                        `${colors[index]} `

                        +

                        `${start}deg ${angle}deg`

                    );

                }

            );


        canvas.hidden =
            true;


        wrap?.classList.add(
            'lokasi-chart-fallback'
        );


        if (wrap) {

            wrap.style.background =

                total

                ? `conic-gradient(${segments.join(',')})`

                : '#e7ecf2';

        }


        return;

    }



    canvas.hidden =
        false;


    wrap?.classList.remove(
        'lokasi-chart-fallback'
    );


    if (wrap) {

        wrap.style.background =
            '';

    }



    lokasiChart =
        new window.Chart(

            canvas,

            {

                type:
                    'doughnut',


                data: {

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
                                2,

                            hoverOffset:
                                4

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

                                            `${context.label}: `

                                            +

                                            `${lokasiNumber.format(
                                                context.raw
                                            )} lokasi`

                                        );

                                    }

                            }

                        }

                    }

                }

            }

        );

}



/* =========================================================
   OPEN MODAL
========================================================= */

function openLokasiModal(

    mode = 'add',

    row = null

) {


    const modal =
        document.getElementById(
            'lokasiModal'
        );


    if (!modal) {

        return;

    }



    resetLokasiForm();



    lokasiModalMode =
        mode;


    lokasiCurrentRow =
        row;


    lokasiCurrentId =

        row?.dataset.id

        ?? null;



    const title =
        document.getElementById(
            'lokasiModalTitle'
        );


    const description =
        document.getElementById(
            'lokasiModalDescription'
        );


    const note =
        document.getElementById(
            'lokasiModalNote'
        );


    const saveButton =
        document.getElementById(
            'lokasiSaveButton'
        );


    const saveText =
        saveButton?.querySelector(
            'span'
        );



    const titles = {

        add:
            'Tambah Lokasi',

        view:
            'Detail Lokasi',

        edit:
            'Edit Lokasi',

        delete:
            'Hapus Lokasi'

    };



    const descriptions = {

        add:
            'Tambahkan data lokasi baru ke database.',

        view:
            'Lihat informasi lengkap data lokasi.',

        edit:
            'Perbarui informasi data lokasi.',

        delete:
            'Periksa kembali data sebelum dihapus.'

    };



    if (title) {

        title.textContent =

            titles[mode]

            ||

            titles.add;

    }



    if (description) {

        description.textContent =

            descriptions[mode]

            ||

            descriptions.add;

    }



    if (row) {

        fillLokasiFormFromRow(
            row
        );

    }



    const readonly =

        mode === 'view'

        ||

        mode === 'delete';



    setLokasiFormReadonly(
        readonly
    );



    if (saveButton) {


        saveButton.hidden =
            mode === 'view';


        saveButton.disabled =
            false;


        saveButton.classList.toggle(

            'is-delete',

            mode === 'delete'

        );

    }



    if (saveText) {


        saveText.textContent =

            mode === 'delete'

            ? 'Hapus Lokasi'

            : mode === 'edit'

                ? 'Simpan Perubahan'

                : 'Simpan Lokasi';

    }



    const saveIcon =
        saveButton?.querySelector(
            '[data-lucide]'
        );


    if (saveIcon) {

        saveIcon.setAttribute(

            'data-lucide',

            mode === 'delete'

            ? 'trash-2'

            : 'save'

        );

    }



    if (note) {


        note.classList.toggle(

            'is-danger',

            mode === 'delete'

        );


        note.textContent =

            mode === 'delete'

            ?

            'Penghapusan dapat gagal apabila lokasi masih dipakai oleh data aset lain.'

            :

            mode === 'view'

            ?

            'Mode detail hanya menampilkan data dan tidak melakukan perubahan.'

            :

            'Kolom Nama Lokasi wajib diisi. Gambar baru bersifat opsional.';

    }



    lokasiPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';



    if (!modal.open) {

        modal.showModal();

    }



    updateLokasiMapLink();



    if (window.lucide) {

        window.lucide.createIcons();

    }



    window.setTimeout(

        function () {

            if (!readonly) {

                document
                    .getElementById(
                        'lokasiName'
                    )
                    ?.focus();

            }

        },

        30

    );

}



/* =========================================================
   CLOSE MODAL
========================================================= */

function closeLokasiModal() {


    const modal =
        document.getElementById(
            'lokasiModal'
        );


    if (modal?.open) {

        modal.close();

    }

}



/* =========================================================
   RESET FORM
========================================================= */

function resetLokasiForm() {


    document
        .getElementById(
            'lokasiForm'
        )
        ?.reset();



    clearLokasiFormErrors();


    clearLokasiPreviewObjectUrl();



    lokasiCurrentId =
        null;


    lokasiCurrentRow =
        null;



    setLokasiPreview(
        ''
    );


    updateLokasiMapLink();



    const saveButton =
        document.getElementById(
            'lokasiSaveButton'
        );


    if (saveButton) {

        saveButton.disabled =
            false;

    }

}



/* =========================================================
   FILL FORM
========================================================= */

function fillLokasiFormFromRow(
    row
) {


    lokasiCurrentId =
        row.dataset.id
        || null;


    lokasiCurrentRow =
        row;



    setLokasiFieldValue(

        'lokasiName',

        row.dataset.lokasi

    );


    setLokasiFieldValue(

        'lokasiWilayah',

        row.dataset.wilayahId

    );


    setLokasiFieldValue(

        'lokasiAddress',

        row.dataset.alamat

    );


    setLokasiFieldValue(

        'lokasiLat',

        row.dataset.lat

    );


    setLokasiFieldValue(

        'lokasiLong',

        row.dataset.long

    );


    setLokasiPreview(

        row.dataset.imageUrl
        || ''

    );

}



function setLokasiFieldValue(

    id,

    value

) {


    const field =
        document.getElementById(
            id
        );


    if (field) {

        field.value =
            value ?? '';

    }

}



/* =========================================================
   READONLY
========================================================= */

function setLokasiFormReadonly(
    readonly
) {


    [

        'lokasiName',

        'lokasiAddress',

        'lokasiLat',

        'lokasiLong'

    ]

    .forEach(

        function (id) {


            const field =
                document.getElementById(
                    id
                );


            if (field) {

                field.readOnly =
                    readonly;

            }

        }

    );



    const wilayah =
        document.getElementById(
            'lokasiWilayah'
        );


    if (wilayah) {

        wilayah.disabled =
            readonly;

    }



    const image =
        document.getElementById(
            'lokasiImage'
        );


    if (image) {

        image.disabled =
            readonly;

    }



    const fileButton =
        document.getElementById(
            'lokasiFileButton'
        );


    if (fileButton) {

        fileButton.hidden =
            readonly;

    }

}



/* =========================================================
   IMAGE PREVIEW
========================================================= */

function handleLokasiImagePreview(
    event
) {


    const file =
        event.target.files?.[0];


    clearLokasiPreviewObjectUrl();



    if (!file) {


        setLokasiPreview(

            lokasiCurrentRow?.dataset.imageUrl

            || ''

        );


        return;

    }



    const allowed = [

        'image/jpeg',

        'image/png',

        'image/webp'

    ];



    if (
        !allowed.includes(
            file.type
        )
    ) {


        event.target.value =
            '';


        setLokasiPreview(

            lokasiCurrentRow?.dataset.imageUrl

            || ''

        );


        showLokasiToast(

            'Gambar tidak valid',

            'Gunakan JPG, JPEG, PNG, atau WEBP.',

            true

        );


        return;

    }



    if (
        file.size
        >
        4 * 1024 * 1024
    ) {


        event.target.value =
            '';


        setLokasiPreview(

            lokasiCurrentRow?.dataset.imageUrl

            || ''

        );


        showLokasiToast(

            'Gambar terlalu besar',

            'Ukuran maksimal gambar adalah 4 MB.',

            true

        );


        return;

    }



    lokasiPreviewObjectUrl =
        URL.createObjectURL(
            file
        );


    setLokasiPreview(
        lokasiPreviewObjectUrl
    );

}



/* =========================================================
   SET PREVIEW
========================================================= */

function setLokasiPreview(
    url
) {


    const image =
        document.getElementById(
            'lokasiImagePreview'
        );


    const placeholder =
        document.getElementById(
            'lokasiImagePlaceholder'
        );


    if (
        !image
        ||
        !placeholder
    ) {

        return;

    }



    if (url) {


        image.src =
            url;


        image.hidden =
            false;


        placeholder.hidden =
            true;


    } else {


        image.removeAttribute(
            'src'
        );


        image.hidden =
            true;


        placeholder.hidden =
            false;

    }

}



/* =========================================================
   CLEAR PREVIEW URL
========================================================= */

function clearLokasiPreviewObjectUrl() {


    if (
        !lokasiPreviewObjectUrl
    ) {

        return;

    }


    URL.revokeObjectURL(
        lokasiPreviewObjectUrl
    );


    lokasiPreviewObjectUrl =
        null;

}



/* =========================================================
   GOOGLE MAPS
========================================================= */

function updateLokasiMapLink() {


    const link =
        document.getElementById(
            'lokasiMapLink'
        );


    if (!link) {

        return;

    }



    const lat =
        document
            .getElementById(
                'lokasiLat'
            )
            ?.value
            .trim()

        ?? '';


    const lng =
        document
            .getElementById(
                'lokasiLong'
            )
            ?.value
            .trim()

        ?? '';



    if (
        !isUsableCoordinate(lat)
        ||
        !isUsableCoordinate(lng)
    ) {


        link.hidden =
            true;


        link.removeAttribute(
            'href'
        );


        return;

    }



    link.href =

        'https://www.google.com/maps?q='

        +

        encodeURIComponent(

            `${lat},${lng}`

        );


    link.hidden =
        false;

}



/* =========================================================
   COORDINATE VALID
========================================================= */

function isUsableCoordinate(
    value
) {


    if (!value) {

        return false;

    }


    const normalized =
        String(value).trim();


    if (

        normalized === '0'

        ||

        normalized === '-0'

        ||

        normalized === '0.0'

        ||

        normalized === '-0.0'

    ) {

        return false;

    }


    return Number.isFinite(

        Number(
            normalized
        )

    );

}



/* =========================================================
   SUBMIT
========================================================= */

async function saveLokasi(
    event
) {


    event.preventDefault();



    if (
        lokasiModalMode
        ===
        'view'
    ) {


        closeLokasiModal();


        return;

    }



    clearLokasiFormErrors();



    try {


        setLokasiSaveLoading(
            true
        );



        if (
            lokasiModalMode
            ===
            'delete'
        ) {


            await deleteLokasiRequest();


        } else {


            await upsertLokasiRequest();

        }


    } catch (error) {


        console.error(

            'LOKASI CRUD ERROR:',

            error

        );



        if (
            error.validation
        ) {


            showLokasiValidationErrors(

                error.validation

            );

        }



        showLokasiToast(

            'Gagal',

            error.message

            ||

            'Terjadi kesalahan saat memproses data.',

            true

        );


    } finally {


        setLokasiSaveLoading(
            false
        );

    }

}



/* =========================================================
   CREATE / UPDATE
========================================================= */

async function upsertLokasiRequest() {


    const form =
        document.getElementById(
            'lokasiForm'
        );


    if (!form) {

        return;

    }



    /*
    |--------------------------------------------------------------------------
    | HTML VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
        !form.checkValidity()
    ) {


        form.reportValidity();


        throw new Error(

            'Periksa kembali field yang wajib diisi.'

        );

    }



    const config =
        window.LOKASI_CRUD
        || {};


    const isEdit =

        lokasiModalMode
        ===
        'edit';



    const url =

        isEdit

        ?

        String(
            config.update
            || ''
        )
        .replace(

            '__ID__',

            encodeURIComponent(
                lokasiCurrentId
            )

        )

        :

        config.store;



    if (!url) {


        throw new Error(

            'Endpoint penyimpanan Lokasi belum tersedia.'

        );

    }



    const formData =
        new FormData(
            form
        );



    /*
    |--------------------------------------------------------------------------
    | METHOD SPOOFING
    |--------------------------------------------------------------------------
    |
    | Untuk multipart update:
    | POST + _method=PUT lebih aman pada PHP/Laravel.
    |
    */

    if (isEdit) {


        formData.set(

            '_method',

            'PUT'

        );

    }



    const response =
        await fetch(

            url,

            {

                method:
                    'POST',


                headers: {

                    'Accept':
                        'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest',

                    'X-CSRF-TOKEN':
                        getLokasiCsrfToken()

                },


                body:
                    formData

            }

        );



    const result =
        await readLokasiJsonResponse(
            response
        );



    if (
        !response.ok
    ) {


        throw createLokasiRequestError(

            response,

            result

        );

    }



    showLokasiToast(

        'Berhasil',

        result.message

        ||

        (
            isEdit

            ? 'Lokasi berhasil diperbarui.'

            : 'Lokasi berhasil ditambahkan.'
        )

    );



    closeLokasiModal();



    /*
    |--------------------------------------------------------------------------
    | RELOAD
    |--------------------------------------------------------------------------
    |
    | Database menjadi source of truth.
    |
    */

    window.setTimeout(

        function () {

            window.location.reload();

        },

        450

    );

}



/* =========================================================
   DELETE
========================================================= */

async function deleteLokasiRequest() {


    const config =
        window.LOKASI_CRUD
        || {};


    const url =

        String(
            config.destroy
            || ''
        )

        .replace(

            '__ID__',

            encodeURIComponent(
                lokasiCurrentId
            )

        );



    if (!url) {


        throw new Error(

            'Endpoint penghapusan Lokasi belum tersedia.'

        );

    }



    const response =
        await fetch(

            url,

            {

                method:
                    'DELETE',


                headers: {

                    'Accept':
                        'application/json',

                    'Content-Type':
                        'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest',

                    'X-CSRF-TOKEN':
                        getLokasiCsrfToken()

                },


                body:
                    JSON.stringify({})

            }

        );



    const result =
        await readLokasiJsonResponse(
            response
        );



    if (
        !response.ok
    ) {


        throw createLokasiRequestError(

            response,

            result

        );

    }



    showLokasiToast(

        'Berhasil',

        result.message

        ||

        'Lokasi berhasil dihapus.'

    );



    closeLokasiModal();



    window.setTimeout(

        function () {

            window.location.reload();

        },

        450

    );

}



/* =========================================================
   CSRF
========================================================= */

function getLokasiCsrfToken() {


    const meta =
        document.querySelector(

            'meta[name="csrf-token"]'

        );


    if (
        !meta?.content
    ) {


        throw new Error(

            'CSRF token tidak ditemukan pada layout.'

        );

    }


    return meta.content;

}



/* =========================================================
   JSON RESPONSE
========================================================= */

async function readLokasiJsonResponse(
    response
) {


    const text =
        await response.text();


    if (!text) {

        return {};

    }


    try {


        return JSON.parse(
            text
        );


    } catch (_) {


        throw new Error(

            `Server mengembalikan respons tidak valid (HTTP ${response.status}).`

        );

    }

}



/* =========================================================
   REQUEST ERROR
========================================================= */

function createLokasiRequestError(

    response,

    result

) {


    const error =
        new Error(

            result.message

            ||

            (

                response.status === 422

                ?

                'Data belum valid.'

                :

                response.status === 409

                ?

                'Lokasi tidak dapat diproses karena masih berhubungan dengan data lain.'

                :

                `Permintaan gagal (HTTP ${response.status}).`

            )

        );


    error.validation =
        result.errors
        || null;


    return error;

}



/* =========================================================
   LOADING BUTTON
========================================================= */

function setLokasiSaveLoading(
    loading
) {


    const button =
        document.getElementById(
            'lokasiSaveButton'
        );


    if (!button) {

        return;

    }


    button.disabled =
        loading;


    const text =
        button.querySelector(
            'span'
        );


    if (!text) {

        return;

    }



    if (loading) {


        if (
            !button.dataset.originalText
        ) {


            button.dataset.originalText =
                text.textContent;

        }


        text.textContent =

            lokasiModalMode
            ===
            'delete'

            ? 'Menghapus...'

            : 'Menyimpan...';


    } else if (
        button.dataset.originalText
    ) {


        text.textContent =
            button.dataset.originalText;


        delete button.dataset.originalText;

    }

}



/* =========================================================
   CLEAR VALIDATION
========================================================= */

function clearLokasiFormErrors() {


    document.querySelectorAll(

        '#lokasiForm .lokasi-form-group'

    )

    .forEach(

        function (group) {

            group.classList.remove(
                'has-error'
            );

        }

    );



    document.querySelectorAll(

        '#lokasiForm [data-error-for]'

    )

    .forEach(

        function (item) {

            item.textContent =
                '';

        }

    );



    const alert =
        document.getElementById(
            'lokasiFormAlert'
        );


    if (alert) {


        alert.hidden =
            true;


        alert.textContent =
            '';

    }

}



/* =========================================================
   VALIDATION ERROR
========================================================= */

function showLokasiValidationErrors(
    errors
) {


    let firstField =
        null;



    Object.entries(
        errors || {}
    )

    .forEach(

        function (
            [
                field,
                messages
            ]
        ) {


            const errorElement =
                document.querySelector(

                    `[data-error-for="${field}"]`

                );


            if (errorElement) {


                errorElement.textContent =

                    Array.isArray(
                        messages
                    )

                    ? messages[0]

                    : String(
                        messages
                    );

            }



            const input =
                document.querySelector(

                    `#lokasiForm [name="${field}"]`

                );


            input
                ?.closest(
                    '.lokasi-form-group'
                )
                ?.classList.add(
                    'has-error'
                );



            if (
                !firstField
                &&
                input
            ) {


                firstField =
                    input;

            }

        }

    );



    const alert =
        document.getElementById(
            'lokasiFormAlert'
        );


    if (alert) {


        alert.hidden =
            false;


        alert.textContent =

            'Masih ada data yang perlu diperbaiki sebelum disimpan.';

    }



    firstField?.focus();

}



/* =========================================================
   HISTORY
========================================================= */

function openLokasiHistory() {


    const modal =
        document.getElementById(
            'lokasiHistoryModal'
        );


    if (!modal) {

        return;

    }



    lokasiPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';



    if (!modal.open) {

        modal.showModal();

    }



    if (window.lucide) {

        window.lucide.createIcons();

    }

}



function closeLokasiHistory() {


    const modal =
        document.getElementById(
            'lokasiHistoryModal'
        );


    if (
        modal?.open
    ) {


        modal.close();

    }

}



/* =========================================================
   EXPORT CSV
========================================================= */

function exportLokasiCSV() {


    const rows =
        getFilteredLokasiRows();



    if (!rows.length) {


        showLokasiToast(

            'Tidak ada data',

            'Tidak ada data Lokasi yang dapat diekspor.',

            true

        );


        return;

    }



    const records = [

        [

            'No',

            'ID',

            'Lokasi',

            'Alamat',

            'Wilayah',

            'Latitude',

            'Longitude',

            'Gambar',

            'Tanggal Dibuat'

        ]

    ];



    rows.forEach(

        function (
            row,
            index
        ) {


            records.push(

                [

                    index + 1,

                    row.dataset.id
                    || '',

                    row.dataset.lokasi
                    || '',

                    row.dataset.alamat
                    || '',

                    row.dataset.wilayah
                    || '',

                    row.dataset.lat
                    || '',

                    row.dataset.long
                    || '',

                    row.dataset.img
                    || '',

                    formatLokasiDateForExport(

                        row.dataset.createdAt

                    )

                ]

            );

        }

    );



    const csv =
        records

        .map(

            record =>

                record
                    .map(
                        csvLokasiCell
                    )
                    .join(',')

        )

        .join('\r\n');



    const blob =
        new Blob(

            [
                '\uFEFF'
                +
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

        `data-lokasi-${getLokasiDateStamp()}.csv`;



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
   CSV SAFE CELL
========================================================= */

function csvLokasiCell(
    value
) {


    let text =
        String(
            value ?? ''
        );


    /*
    |--------------------------------------------------------------------------
    | PREVENT CSV FORMULA INJECTION
    |--------------------------------------------------------------------------
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
            "'"
            +
            text;

    }


    return (

        '"'

        +

        text.replace(
            /"/g,
            '""'
        )

        +

        '"'

    );

}



/* =========================================================
   EXPORT DATE
========================================================= */

function formatLokasiDateForExport(
    value
) {


    if (!value) {

        return '';

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {


        return String(
            value
        );

    }


    return new Intl.DateTimeFormat(

        'id-ID',

        {

            day:
                '2-digit',

            month:
                '2-digit',

            year:
                'numeric'

        }

    ).format(
        date
    );

}



/* =========================================================
   FILE DATE
========================================================= */

function getLokasiDateStamp() {


    const now =
        new Date();


    return [

        now.getFullYear(),

        String(
            now.getMonth() + 1
        )
        .padStart(
            2,
            '0'
        ),

        String(
            now.getDate()
        )
        .padStart(
            2,
            '0'
        )

    ].join('-');

}



/* =========================================================
   TOAST
========================================================= */

function showLokasiToast(

    title,

    message,

    error = false

) {


    const toast =
        document.getElementById(
            'lokasiToast'
        );


    if (!toast) {

        return;

    }


    window.clearTimeout(
        lokasiToastTimer
    );



    const titleEl =
        document.getElementById(
            'lokasiToastTitle'
        );


    const messageEl =
        document.getElementById(
            'lokasiToastMessage'
        );


    if (titleEl) {

        titleEl.textContent =
            title;

    }


    if (messageEl) {

        messageEl.textContent =
            message;

    }



    toast.classList.toggle(

        'is-error',

        error

    );



    const icon =
        toast.querySelector(
            '[data-lucide]'
        );


    if (icon) {


        icon.setAttribute(

            'data-lucide',

            error

            ? 'circle-x'

            : 'circle-check'

        );

    }



    toast.hidden =
        false;



    if (window.lucide) {

        window.lucide.createIcons();

    }



    lokasiToastTimer =
        window.setTimeout(

            function () {

                toast.hidden =
                    true;

            },

            3500

        );

}