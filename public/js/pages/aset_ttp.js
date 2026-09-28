/* =========================================================
   K.I.B - ASET TETAP LAINNYA
========================================================= */

let asetTtpCurrentPage = 1;

let asetTtpPreviousOverflow = '';

const asetTtpNumber =
    new Intl.NumberFormat('id-ID');

const asetTtpDemoTotal = 128;

const asetTtpDemoPages = 13;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        if (
            !document.querySelector(
                '.aset-ttp-page'
            )
        ) {
            return;
        }


        if (window.lucide) {
            window.lucide.createIcons();
        }


        /* =========================================
           FILTER
        ========================================= */

        [
            'asetTtpSearch',
            'asetTtpJenis',
            'asetTtpLokasi',
            'asetTtpKondisi'
        ].forEach(
            function (id) {

                const element =
                    document.getElementById(id);

                if (!element) {
                    return;
                }


                element.addEventListener(
                    element.tagName === 'INPUT'
                        ? 'input'
                        : 'change',
                    filterAsetTtpTable
                );

            }
        );


        /* =========================================
           PAGE SIZE
        ========================================= */

        document
            .getElementById(
                'asetTtpPageSize'
            )
            ?.addEventListener(
                'change',
                function () {

                    asetTtpCurrentPage = 1;

                    renderAsetTtpTable();

                }
            );


        /* =========================================
           SELECT ALL
        ========================================= */

        document
            .getElementById(
                'asetTtpSelectAll'
            )
            ?.addEventListener(
                'change',
                function () {

                    const checked =
                        this.checked;


                    getAsetTtpRows()
                        .forEach(
                            function (row) {

                                if (
                                    !row.hidden
                                ) {

                                    const checkbox =
                                        row.querySelector(
                                            'input[type="checkbox"]'
                                        );

                                    if (checkbox) {
                                        checkbox.checked =
                                            checked;
                                    }

                                }

                            }
                        );

                }
            );


        /* =========================================
           TABLE ACTION
        ========================================= */

        document
            .getElementById(
                'asetTtpTable'
            )
            ?.addEventListener(
                'click',
                function (event) {

                    const button =
                        event.target.closest(
                            'button[data-action]'
                        );

                    if (!button) {
                        return;
                    }


                    openAsetTtpModal(
                        button.dataset.action,
                        button.closest('tr')
                    );

                }
            );


        /* =========================================
           TABS
        ========================================= */

        document
            .querySelectorAll(
                '[data-aset-ttp-tab]'
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            document
                                .querySelectorAll(
                                    '[data-aset-ttp-tab]'
                                )
                                .forEach(
                                    function (item) {

                                        item.classList.remove(
                                            'active'
                                        );

                                        item.setAttribute(
                                            'aria-selected',
                                            'false'
                                        );

                                    }
                                );


                            button.classList.add(
                                'active'
                            );

                            button.setAttribute(
                                'aria-selected',
                                'true'
                            );

                        }
                    );

                }
            );


        /* =========================================
           MODAL
        ========================================= */

        const modal =
            document.getElementById(
                'asetTtpModal'
            );


        modal?.addEventListener(
            'click',
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeAsetTtpModal();

                }

            }
        );


        modal?.addEventListener(
            'close',
            function () {

                document.body.style.overflow =
                    asetTtpPreviousOverflow;

            }
        );


        /* =========================================
           FORM
        ========================================= */

        document
            .getElementById(
                'asetTtpForm'
            )
            ?.addEventListener(
                'submit',
                function (event) {

                    event.preventDefault();

                }
            );


        renderAsetTtpTable();

    }
);


/* =========================================================
   GET ROWS
========================================================= */

function getAsetTtpRows() {

    return Array.from(
        document.querySelectorAll(
            '#asetTtpTable tbody tr[data-record]'
        )
    );

}


/* =========================================================
   FILTERED ROWS
========================================================= */

function getFilteredAsetTtpRows() {

    const search =
        document
            .getElementById(
                'asetTtpSearch'
            )
            ?.value
            .trim()
            .toLocaleLowerCase('id-ID')
        || '';


    const jenis =
        document
            .getElementById(
                'asetTtpJenis'
            )
            ?.value
        || '';


    const lokasi =
        document
            .getElementById(
                'asetTtpLokasi'
            )
            ?.value
        || '';


    const kondisi =
        document
            .getElementById(
                'asetTtpKondisi'
            )
            ?.value
        || '';


    return getAsetTtpRows()
        .filter(
            function (row) {

                const searchable = [

                    row.cells[2]?.textContent,

                    row.cells[4]?.textContent,

                    row.cells[5]?.textContent,

                    row.cells[7]?.textContent

                ]
                    .join(' ')
                    .toLocaleLowerCase('id-ID');


                return (

                    !search ||

                    searchable.includes(
                        search
                    )

                ) && (

                    !jenis ||

                    row.dataset.jenis ===
                        jenis

                ) && (

                    !lokasi ||

                    row.dataset.lokasi ===
                        lokasi

                ) && (

                    !kondisi ||

                    row.dataset.kondisi ===
                        kondisi

                );

            }
        );

}


/* =========================================================
   FILTER
========================================================= */

function filterAsetTtpTable() {

    asetTtpCurrentPage = 1;

    renderAsetTtpTable();

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetAsetTtpFilter() {

    [
        'asetTtpSearch',
        'asetTtpJenis',
        'asetTtpLokasi',
        'asetTtpKondisi'
    ].forEach(
        function (id) {

            const element =
                document.getElementById(id);

            if (element) {
                element.value = '';
            }

        }
    );


    const selectAll =
        document.getElementById(
            'asetTtpSelectAll'
        );

    if (selectAll) {
        selectAll.checked = false;
    }


    getAsetTtpRows()
        .forEach(
            function (row) {

                const checkbox =
                    row.querySelector(
                        'input[type="checkbox"]'
                    );

                if (checkbox) {
                    checkbox.checked = false;
                }

            }
        );


    asetTtpCurrentPage = 1;

    renderAsetTtpTable();

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderAsetTtpTable() {

    const rows =
        getAsetTtpRows();

    const filtered =
        getFilteredAsetTtpRows();


    const hasFilter = Boolean(

        document
            .getElementById(
                'asetTtpSearch'
            )
            ?.value
            .trim()

        ||

        document
            .getElementById(
                'asetTtpJenis'
            )
            ?.value

        ||

        document
            .getElementById(
                'asetTtpLokasi'
            )
            ?.value

        ||

        document
            .getElementById(
                'asetTtpKondisi'
            )
            ?.value

    );


    rows.forEach(
        function (row) {

            row.hidden =
                !filtered.includes(row);

        }
    );


    /* NOMOR */

    filtered.forEach(
        function (row, index) {

            if (row.cells[1]) {

                row.cells[1].textContent =
                    index + 1;

            }

        }
    );


    /* EMPTY */

    const empty =
        document.getElementById(
            'asetTtpEmptyRow'
        );

    if (empty) {

        empty.hidden =
            filtered.length > 0;

    }


    /* INFO */

    const info =
        document.getElementById(
            'asetTtpTableInfo'
        );


    if (info) {

        info.textContent =
            hasFilter

                ? `Menampilkan ${asetTtpNumber.format(filtered.length)} hasil pada data contoh`

                : `Menampilkan 1 - ${asetTtpNumber.format(rows.length)} dari ${asetTtpNumber.format(asetTtpDemoTotal)} data`;

    }


    renderAsetTtpPagination(
        hasFilter
            ? 1
            : asetTtpDemoPages
    );

}


/* =========================================================
   PAGINATION
========================================================= */

function renderAsetTtpPagination(
    totalPages
) {

    const pagination =
        document.getElementById(
            'asetTtpPagination'
        );


    if (!pagination) {
        return;
    }


    asetTtpCurrentPage =
        Math.min(
            Math.max(
                1,
                asetTtpCurrentPage
            ),
            totalPages
        );


    pagination.replaceChildren();


    function addButton(
        label,
        page,
        options = {}
    ) {

        const button =
            document.createElement(
                'button'
            );


        button.type = 'button';


        button.disabled =
            Boolean(
                options.disabled
            );


        if (options.active) {

            button.classList.add(
                'active'
            );

            button.setAttribute(
                'aria-current',
                'page'
            );

        }


        if (options.icon) {

            const icon =
                document.createElement(
                    'i'
                );

            icon.setAttribute(
                'data-lucide',
                options.icon
            );

            button.appendChild(
                icon
            );

        } else {

            button.textContent =
                label;

        }


        button.setAttribute(
            'aria-label',
            options.aria || label
        );


        button.addEventListener(
            'click',
            function () {

                asetTtpCurrentPage =
                    page;

                renderAsetTtpPagination(
                    totalPages
                );

            }
        );


        pagination.appendChild(
            button
        );

    }


    function addDots() {

        const button =
            document.createElement(
                'button'
            );

        button.type = 'button';

        button.disabled = true;

        button.textContent = '...';

        pagination.appendChild(
            button
        );

    }


    /* PREVIOUS */

    addButton(
        '',
        Math.max(
            1,
            asetTtpCurrentPage - 1
        ),
        {
            disabled:
                asetTtpCurrentPage === 1,

            icon:
                'chevron-left',

            aria:
                'Halaman sebelumnya'
        }
    );


    /* PAGES */

    if (totalPages <= 7) {

        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            addButton(
                String(page),
                page,
                {
                    active:
                        page ===
                        asetTtpCurrentPage
                }
            );

        }

    } else {

        const pages = new Set([
            1,
            2,
            asetTtpCurrentPage - 1,
            asetTtpCurrentPage,
            asetTtpCurrentPage + 1,
            totalPages
        ]);


        const validPages =
            Array.from(pages)
                .filter(
                    page =>
                        page >= 1 &&
                        page <= totalPages
                )
                .sort(
                    (a,b) => a - b
                );


        validPages.forEach(
            function (
                page,
                index
            ) {

                if (
                    index > 0 &&
                    page -
                    validPages[index - 1]
                    > 1
                ) {

                    addDots();

                }


                addButton(
                    String(page),
                    page,
                    {
                        active:
                            page ===
                            asetTtpCurrentPage
                    }
                );

            }
        );

    }


    /* NEXT */

    addButton(
        '',
        Math.min(
            totalPages,
            asetTtpCurrentPage + 1
        ),
        {
            disabled:
                asetTtpCurrentPage ===
                totalPages,

            icon:
                'chevron-right',

            aria:
                'Halaman berikutnya'
        }
    );


    if (window.lucide) {
        window.lucide.createIcons();
    }

}


/* =========================================================
   MODAL
========================================================= */

function openAsetTtpModal(
    mode = 'add',
    row = null
) {

    const modal =
        document.getElementById(
            'asetTtpModal'
        );


    if (
        !modal ||
        modal.open
    ) {
        return;
    }


    const titles = {

        add:
            'Tambah Aset',

        view:
            'Detail Aset',

        edit:
            'Edit Aset',

        delete:
            'Hapus Aset'

    };


    const descriptions = {

        add:
            'Tambahkan data aset tetap lainnya.',

        view:
            'Informasi detail aset tetap lainnya.',

        edit:
            'Perbarui informasi aset tetap lainnya.',

        delete:
            'Periksa aset yang akan dihapus.'

    };


    const readonly =
        mode === 'view' ||
        mode === 'delete';


    document
        .getElementById(
            'asetTtpForm'
        )
        ?.reset();


    document
        .getElementById(
            'asetTtpModalTitle'
        )
        .textContent =
            titles[mode] ||
            titles.add;


    document
        .getElementById(
            'asetTtpModalDescription'
        )
        .textContent =
            descriptions[mode] ||
            descriptions.add;


    /* =========================================
       FIELD
    ========================================= */

    const fieldMap = [

        [
            'asetTtpCode',
            2
        ],

        [
            'asetTtpName',
            4
        ],

        [
            'asetTtpJumlah',
            6
        ],

        [
            'asetTtpFormLokasi',
            7
        ],

        [
            'asetTtpTahun',
            8
        ],

        [
            'asetTtpPerolehan',
            9
        ],

        [
            'asetTtpBuku',
            10
        ]

    ];


    fieldMap.forEach(
        function (
            [id,index]
        ) {

            const input =
                document.getElementById(
                    id
                );


            if (!input) {
                return;
            }


            input.value =
                row
                    ? row
                        .cells[index]
                        .textContent
                        .trim()
                        .replace(
                            /\s+/g,
                            ' '
                        )
                    : '';


            input.readOnly =
                readonly;

        }
    );


    /* =========================================
       JENIS
    ========================================= */

    const jenis =
        document.getElementById(
            'asetTtpFormJenis'
        );


    if (jenis) {

        jenis.value =
            row
                ? row.cells[5]
                    .textContent
                    .trim()
                : 'Buku Perpustakaan';


        jenis.disabled =
            readonly;

    }


    /* =========================================
       KONDISI
    ========================================= */

    const kondisi =
        document.getElementById(
            'asetTtpFormKondisi'
        );


    if (kondisi) {

        kondisi.value =
            row
                ? row.cells[11]
                    .textContent
                    .trim()
                : 'Baik';


        kondisi.disabled =
            readonly;

    }


    /* =========================================
       SAVE
    ========================================= */

    const save =
        document.getElementById(
            'asetTtpSaveButton'
        );


    if (save) {

        save.hidden =
            mode === 'view';

        save.disabled =
            true;

        save.textContent =
            mode === 'delete'
                ? 'Hapus Aset'
                : 'Simpan Aset';

        save.classList.toggle(
            'aset-ttp-delete-button',
            mode === 'delete'
        );

    }


    /* =========================================
       NOTE
    ========================================= */

    const note =
        document.getElementById(
            'asetTtpModalNote'
        );


    if (note) {

        note.textContent =

            mode === 'view'

                ? 'Data contoh untuk pratinjau tampilan.'

                : mode === 'delete'

                    ? 'Pratinjau konfirmasi. Penghapusan database belum dihubungkan.'

                    : 'Form UI contoh. Penyimpanan database belum dihubungkan.';

    }


    /* =========================================
       OPEN
    ========================================= */

    asetTtpPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';


    modal.showModal();


    if (!readonly) {

        document
            .getElementById(
                'asetTtpCode'
            )
            ?.focus();

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeAsetTtpModal() {

    const modal =
        document.getElementById(
            'asetTtpModal'
        );


    if (
        modal &&
        modal.open
    ) {

        modal.close();

    }

}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportAsetTtpCSV() {

    const records = [

        [
            'No',
            'Kode Aset',
            'Nama Aset',
            'Jenis Aset',
            'Satuan / Jumlah',
            'Lokasi',
            'Tahun',
            'Nilai Perolehan',
            'Nilai Buku',
            'Kondisi'
        ]

    ];


    getFilteredAsetTtpRows()
        .forEach(
            function (
                row,
                index
            ) {

                records.push([

                    index + 1,

                    row.cells[2]
                        .textContent
                        .trim(),

                    row.cells[4]
                        .textContent
                        .trim(),

                    row.cells[5]
                        .textContent
                        .trim(),

                    row.cells[6]
                        .textContent
                        .trim(),

                    row.cells[7]
                        .textContent
                        .trim(),

                    row.cells[8]
                        .textContent
                        .trim(),

                    row.cells[9]
                        .textContent
                        .trim(),

                    row.cells[10]
                        .textContent
                        .trim(),

                    row.cells[11]
                        .textContent
                        .trim()

                ]);

            }
        );


    downloadAsetTtpCSV(
        records,
        'data-aset-tetap-lainnya.csv'
    );

}


/* =========================================================
   DOWNLOAD CSV
========================================================= */

function downloadAsetTtpCSV(
    records,
    filename
) {

    function csvCell(value) {

        let text =
            String(value ?? '');


        /*
         * Mencegah formula injection
         * saat CSV dibuka di Excel.
         */

        if (
            /^[\s]*[=+@-]/.test(text) ||
            /^[\t\r\n]/.test(text)
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
        records
            .map(
                function (row) {

                    return row
                        .map(csvCell)
                        .join(',');

                }
            )
            .join('\r\n');


    const blob =
        new Blob(
            [
                '\uFEFF' + csv
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
        filename;


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}