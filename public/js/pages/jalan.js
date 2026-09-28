/* =========================================================
   K.I.B - JALAN, IRIGASI DAN JARINGAN
========================================================= */

let jalanCurrentPage = 1;
let jalanPreviousOverflow = '';

const jalanNumber = new Intl.NumberFormat('id-ID');

const jalanDemoTotal = 342;
const jalanDemoPages = 35;


/* =========================================================
   INIT
========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    if (!document.querySelector('.jalan-page')) {
        return;
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }


    /* FILTER */

    [
        'jalanSearch',
        'jalanJenis',
        'jalanLokasi',
        'jalanKondisi'
    ].forEach(function (id) {

        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            element.tagName === 'INPUT'
                ? 'input'
                : 'change',
            filterJalanTable
        );

    });


    /* PAGE SIZE */

    document
        .getElementById('jalanPageSize')
        ?.addEventListener('change', function () {

            jalanCurrentPage = 1;

            renderJalanTable();

        });


    /* TABLE ACTION */

    document
        .getElementById('jalanTable')
        ?.addEventListener('click', function (event) {

            const button =
                event.target.closest(
                    'button[data-action]'
                );

            if (!button) {
                return;
            }

            openJalanModal(
                button.dataset.action,
                button.closest('tr')
            );

        });


    /* TAB */

    document
        .querySelectorAll('[data-jalan-tab]')
        .forEach(function (button) {

            button.addEventListener(
                'click',
                function () {

                    document
                        .querySelectorAll('[data-jalan-tab]')
                        .forEach(function (item) {

                            item.classList.remove('active');

                            item.setAttribute(
                                'aria-selected',
                                'false'
                            );

                        });

                    button.classList.add('active');

                    button.setAttribute(
                        'aria-selected',
                        'true'
                    );

                }
            );

        });


    /* MODAL */

    const modal =
        document.getElementById('jalanModal');

    modal?.addEventListener(
        'click',
        function (event) {

            if (event.target === modal) {
                closeJalanModal();
            }

        }
    );


    modal?.addEventListener(
        'close',
        function () {

            document.body.style.overflow =
                jalanPreviousOverflow;

        }
    );


    /* FORM */

    document
        .getElementById('jalanForm')
        ?.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();

            }
        );


    renderJalanTable();

});


/* =========================================================
   GET ROWS
========================================================= */

function getJalanRows() {

    return Array.from(
        document.querySelectorAll(
            '#jalanTable tbody tr[data-record]'
        )
    );

}


/* =========================================================
   FILTER ROWS
========================================================= */

function getFilteredJalanRows() {

    const search =
        document
            .getElementById('jalanSearch')
            ?.value
            .trim()
            .toLocaleLowerCase('id-ID')
        || '';

    const jenis =
        document
            .getElementById('jalanJenis')
            ?.value
        || '';

    const lokasi =
        document
            .getElementById('jalanLokasi')
            ?.value
        || '';

    const kondisi =
        document
            .getElementById('jalanKondisi')
            ?.value
        || '';


    return getJalanRows().filter(
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
                searchable.includes(search)

            ) && (

                !jenis ||
                row.dataset.jenis === jenis

            ) && (

                !lokasi ||
                row.dataset.lokasi === lokasi

            ) && (

                !kondisi ||
                row.dataset.kondisi === kondisi

            );

        }
    );

}


/* =========================================================
   FILTER
========================================================= */

function filterJalanTable() {

    jalanCurrentPage = 1;

    renderJalanTable();

}


/* =========================================================
   RESET
========================================================= */

function resetJalanFilter() {

    [
        'jalanSearch',
        'jalanJenis',
        'jalanLokasi',
        'jalanKondisi'
    ].forEach(function (id) {

        const element =
            document.getElementById(id);

        if (element) {
            element.value = '';
        }

    });


    jalanCurrentPage = 1;

    renderJalanTable();

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderJalanTable() {

    const allRows =
        getJalanRows();

    const filtered =
        getFilteredJalanRows();


    const hasFilter = Boolean(

        document
            .getElementById('jalanSearch')
            ?.value
            .trim()

        ||

        document
            .getElementById('jalanJenis')
            ?.value

        ||

        document
            .getElementById('jalanLokasi')
            ?.value

        ||

        document
            .getElementById('jalanKondisi')
            ?.value

    );


    allRows.forEach(
        function (row) {

            row.hidden =
                !filtered.includes(row);

        }
    );


    /* NOMOR URUT */

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
            'jalanEmptyRow'
        );

    if (empty) {

        empty.hidden =
            filtered.length > 0;

    }


    /* INFO */

    const info =
        document.getElementById(
            'jalanTableInfo'
        );

    if (info) {

        info.textContent = hasFilter

            ? `Menampilkan ${jalanNumber.format(filtered.length)} hasil pada data contoh`

            : `Menampilkan 1 - ${jalanNumber.format(allRows.length)} dari ${jalanNumber.format(jalanDemoTotal)} data`;

    }


    renderJalanPagination(
        hasFilter
            ? 1
            : jalanDemoPages
    );

}


/* =========================================================
   PAGINATION
========================================================= */

function renderJalanPagination(totalPages) {

    const nav =
        document.getElementById(
            'jalanPagination'
        );

    if (!nav) {
        return;
    }


    jalanCurrentPage =
        Math.min(
            Math.max(
                1,
                jalanCurrentPage
            ),
            totalPages
        );


    nav.replaceChildren();


    function addButton(
        label,
        page,
        options = {}
    ) {

        const button =
            document.createElement('button');

        button.type = 'button';

        button.disabled =
            Boolean(options.disabled);


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
                document.createElement('i');

            icon.setAttribute(
                'data-lucide',
                options.icon
            );

            button.appendChild(icon);

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

                jalanCurrentPage =
                    page;

                renderJalanPagination(
                    totalPages
                );

            }
        );


        nav.appendChild(button);

    }


    function dots() {

        const button =
            document.createElement('button');

        button.type = 'button';

        button.disabled = true;

        button.textContent = '...';

        nav.appendChild(button);

    }


    /* PREVIOUS */

    addButton(
        '',
        Math.max(
            1,
            jalanCurrentPage - 1
        ),
        {
            disabled:
                jalanCurrentPage === 1,

            icon: 'chevron-left',

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
                        page === jalanCurrentPage
                }
            );

        }

    } else {

        let pages = [
            1,
            2,
            3,
            4,
            5
        ];


        if (
            jalanCurrentPage > 4 &&
            jalanCurrentPage < totalPages - 2
        ) {

            pages = [
                1,
                jalanCurrentPage - 1,
                jalanCurrentPage,
                jalanCurrentPage + 1
            ];

        }


        pages.forEach(
            function (page, index) {

                if (
                    index &&
                    page - pages[index - 1] > 1
                ) {

                    dots();

                }


                addButton(
                    String(page),
                    page,
                    {
                        active:
                            page === jalanCurrentPage
                    }
                );

            }
        );


        if (
            pages[pages.length - 1]
            <
            totalPages - 1
        ) {

            dots();

        }


        if (
            !pages.includes(totalPages)
        ) {

            addButton(
                String(totalPages),
                totalPages,
                {
                    active:
                        jalanCurrentPage === totalPages
                }
            );

        }

    }


    /* NEXT */

    addButton(
        '',
        Math.min(
            totalPages,
            jalanCurrentPage + 1
        ),
        {
            disabled:
                jalanCurrentPage === totalPages,

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

function openJalanModal(
    mode = 'add',
    row = null
) {

    const modal =
        document.getElementById(
            'jalanModal'
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
            'Tambahkan data jalan, irigasi atau jaringan.',

        view:
            'Informasi detail aset.',

        edit:
            'Perbarui informasi aset.',

        delete:
            'Periksa aset yang akan dihapus.'

    };


    const readonly =
        mode === 'view' ||
        mode === 'delete';


    document
        .getElementById('jalanForm')
        ?.reset();


    document
        .getElementById(
            'jalanModalTitle'
        )
        .textContent =
            titles[mode] ||
            titles.add;


    document
        .getElementById(
            'jalanModalDescription'
        )
        .textContent =
            descriptions[mode] ||
            descriptions.add;


    /* FIELD */

    const fields = [

        [
            document.getElementById(
                'jalanCode'
            ),
            2
        ],

        [
            document.getElementById(
                'jalanName'
            ),
            4
        ],

        [
            document.getElementById(
                'jalanDimensi'
            ),
            6
        ],

        [
            document.getElementById(
                'jalanFormLokasi'
            ),
            7
        ],

        [
            document.getElementById(
                'jalanFormTahun'
            ),
            8
        ],

        [
            document.getElementById(
                'jalanPerolehan'
            ),
            9
        ],

        [
            document.getElementById(
                'jalanBuku'
            ),
            10
        ]

    ];


    fields.forEach(
        function ([input, index]) {

            if (!input) {
                return;
            }


            input.value =
                row

                    ? row
                        .cells[index]
                        .textContent
                        .trim()
                        .replace(/\s+/g, ' ')

                    : '';


            if (
                input.tagName === 'SELECT'
            ) {

                input.disabled =
                    readonly;

            } else {

                input.readOnly =
                    readonly;

            }

        }
    );


    /* JENIS */

    const jenis =
        document.getElementById(
            'jalanFormJenis'
        );

    if (jenis) {

        jenis.value =
            row
                ? row.cells[5]
                    .textContent
                    .trim()
                : 'Jalan';

        jenis.disabled =
            readonly;

    }


    /* KONDISI */

    const kondisi =
        document.getElementById(
            'jalanFormKondisi'
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


    /* SAVE BUTTON */

    const save =
        document.getElementById(
            'jalanSaveButton'
        );

    if (save) {

        save.hidden =
            mode === 'view';

        save.disabled = true;

        save.textContent =
            mode === 'delete'
                ? 'Hapus Aset'
                : 'Simpan Aset';

        save.classList.toggle(
            'jalan-delete-button',
            mode === 'delete'
        );

    }


    /* NOTE */

    const note =
        document.getElementById(
            'jalanModalNote'
        );

    if (note) {

        note.textContent =

            mode === 'view'

                ? 'Data contoh untuk pratinjau tampilan.'

                : mode === 'delete'

                    ? 'Pratinjau konfirmasi. Penghapusan database belum dihubungkan.'

                    : 'Form UI contoh. Penyimpanan database belum dihubungkan.';

    }


    /* OPEN */

    jalanPreviousOverflow =
        document.body.style.overflow;

    document.body.style.overflow =
        'hidden';


    modal.showModal();


    if (!readonly) {

        document
            .getElementById(
                'jalanCode'
            )
            ?.focus();

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeJalanModal() {

    const modal =
        document.getElementById(
            'jalanModal'
        );

    if (modal?.open) {

        modal.close();

    }

}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportJalanCSV() {

    const records = [

        [
            'No',
            'Kode Aset',
            'Nama Aset',
            'Jenis Aset',
            'Panjang/Dimensi',
            'Lokasi',
            'Tahun',
            'Nilai Perolehan',
            'Nilai Buku',
            'Kondisi'
        ]

    ];


    getFilteredJalanRows()
        .forEach(
            function (row, index) {

                records.push([

                    index + 1,

                    row.cells[2]
                        .textContent,

                    row.cells[4]
                        .textContent,

                    row.cells[5]
                        .textContent,

                    row.cells[6]
                        .textContent,

                    row.cells[7]
                        .textContent,

                    row.cells[8]
                        .textContent,

                    row.cells[9]
                        .textContent,

                    row.cells[10]
                        .textContent,

                    row.cells[11]
                        .textContent

                ].map(
                    function (value) {

                        return String(value)
                            .trim()
                            .replace(
                                /\s+/g,
                                ' '
                            );

                    }
                ));

            }
        );


    downloadJalanCSV(
        records,
        'data-jalan-irigasi-jaringan.csv'
    );

}


/* =========================================================
   DOWNLOAD CSV
========================================================= */

function downloadJalanCSV(
    records,
    filename
) {

    function safe(value) {

        let text =
            String(value ?? '');


        /*
         * Mencegah formula injection
         * ketika CSV dibuka di Excel.
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
                        .map(safe)
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


    const anchor =
        document.createElement('a');


    anchor.href = url;

    anchor.download =
        filename;


    document.body.appendChild(
        anchor
    );


    anchor.click();

    anchor.remove();


    setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}