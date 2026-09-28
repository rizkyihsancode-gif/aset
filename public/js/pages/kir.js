/* =========================================================
   K.I.R PAGE JAVASCRIPT
========================================================= */

let kirCurrentPage = 1;

let kirPreviousOverflow = '';

const kirNumber = new Intl.NumberFormat('id-ID');

const kirDemoTotal = 42;

const kirDemoPages = 5;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    if (!document.querySelector('.kir-page')) {
        return;
    }


    /* Lucide */
    if (window.lucide) {
        window.lucide.createIcons();
    }


    /* Filter */
    [
        'kirSearch',
        'kirJenis',
        'kirStatus',
        'kirLokasi',
        'kirMasa'
    ].forEach(id => {

        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            element.tagName === 'INPUT'
                ? 'input'
                : 'change',
            filterKirTable
        );

    });


    /* Page size */
    document
        .getElementById('kirPageSize')
        ?.addEventListener('change', () => {

            kirCurrentPage = 1;

            renderKirTable();

        });


    /* Table action */
    document
        .getElementById('kirTable')
        ?.addEventListener('click', event => {

            const button =
                event.target.closest(
                    'button[data-action]'
                );

            if (!button) {
                return;
            }

            openKirModal(
                button.dataset.action,
                button.closest('tr')
            );

        });


    /* Modal click */
    const modal =
        document.getElementById('kirModal');

    modal?.addEventListener('click', event => {

        if (event.target === modal) {
            closeKirModal();
        }

    });


    /* Restore body overflow */
    modal?.addEventListener('close', () => {

        document.body.style.overflow =
            kirPreviousOverflow;

    });


    /* Form */
    document
        .getElementById('kirForm')
        ?.addEventListener('submit', event => {

            event.preventDefault();

        });


    renderKirTable();

});


/* =========================================================
   GET ROWS
========================================================= */

function getKirRows() {

    return Array.from(
        document.querySelectorAll(
            '#kirTable tbody tr[data-record]'
        )
    );

}


/* =========================================================
   FILTERED ROWS
========================================================= */

function getFilteredKirRows() {

    const search =
        document
            .getElementById('kirSearch')
            ?.value
            .trim()
            .toLocaleLowerCase('id-ID') || '';

    const jenis =
        document
            .getElementById('kirJenis')
            ?.value || '';

    const status =
        document
            .getElementById('kirStatus')
            ?.value || '';

    const lokasi =
        document
            .getElementById('kirLokasi')
            ?.value || '';

    const masa =
        document
            .getElementById('kirMasa')
            ?.value || '';


    return getKirRows().filter(row => {

        const query = [

            row.cells[2]?.textContent,

            row.cells[4]?.textContent,

            row.cells[5]?.textContent,

            row.cells[8]?.textContent

        ]
            .join(' ')
            .toLocaleLowerCase('id-ID');


        return (

            (!search || query.includes(search))

            &&

            (!jenis ||
                row.dataset.jenis === jenis)

            &&

            (!status ||
                row.dataset.status === status)

            &&

            (!lokasi ||
                row.dataset.lokasi === lokasi)

            &&

            (!masa ||
                row.dataset.masa === masa)

        );

    });

}


/* =========================================================
   FILTER
========================================================= */

function filterKirTable() {

    kirCurrentPage = 1;

    renderKirTable();

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetKirFilter() {

    [
        'kirSearch',
        'kirJenis',
        'kirStatus',
        'kirLokasi',
        'kirMasa'
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.value = '';
        }

    });


    kirCurrentPage = 1;

    renderKirTable();

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderKirTable() {

    const all =
        getKirRows();

    const filtered =
        getFilteredKirRows();


    const hasFilter = Boolean(

        document
            .getElementById('kirSearch')
            ?.value
            .trim()

        ||

        document
            .getElementById('kirJenis')
            ?.value

        ||

        document
            .getElementById('kirStatus')
            ?.value

        ||

        document
            .getElementById('kirLokasi')
            ?.value

        ||

        document
            .getElementById('kirMasa')
            ?.value

    );


    /* Hide/show rows */
    all.forEach(row => {

        row.hidden =
            !filtered.includes(row);

    });


    /* Numbering */
    filtered.forEach((row, index) => {

        if (row.cells[1]) {

            row.cells[1].textContent =
                index + 1;

        }

    });


    /* Empty state */
    const empty =
        document.getElementById(
            'kirEmptyRow'
        );

    if (empty) {

        empty.hidden =
            filtered.length > 0;

    }


    /* Info */
    const info =
        document.getElementById(
            'kirTableInfo'
        );

    if (info) {

        info.textContent = hasFilter

            ? `Menampilkan ${kirNumber.format(filtered.length)} hasil pada data contoh`

            : `Menampilkan 1 - ${kirNumber.format(all.length)} dari ${kirNumber.format(kirDemoTotal)} data`;

    }


    renderKirPagination(
        hasFilter
            ? 1
            : kirDemoPages
    );

}


/* =========================================================
   PAGINATION
========================================================= */

function renderKirPagination(total) {

    const nav =
        document.getElementById(
            'kirPagination'
        );

    if (!nav) {
        return;
    }


    kirCurrentPage =
        Math.min(
            Math.max(
                1,
                kirCurrentPage
            ),
            total
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
            !!options.disabled;


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


        button.addEventListener(
            'click',
            () => {

                kirCurrentPage =
                    page;

                renderKirPagination(
                    total
                );

            }
        );


        nav.appendChild(button);

    }


    /* Previous */
    addButton(
        '',
        Math.max(
            1,
            kirCurrentPage - 1
        ),
        {
            disabled:
                kirCurrentPage === 1,

            icon:
                'chevron-left'
        }
    );


    /* Pages */
    for (
        let page = 1;
        page <= total;
        page++
    ) {

        addButton(
            String(page),
            page,
            {
                active:
                    page === kirCurrentPage
            }
        );

    }


    /* Next */
    addButton(
        '',
        Math.min(
            total,
            kirCurrentPage + 1
        ),
        {
            disabled:
                kirCurrentPage === total,

            icon:
                'chevron-right'
        }
    );


    if (window.lucide) {

        window.lucide.createIcons();

    }

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openKirModal(
    mode = 'add',
    row = null
) {

    const modal =
        document.getElementById(
            'kirModal'
        );

    if (!modal || modal.open) {
        return;
    }


    const titles = {

        add:
            'Tambah Data K.I.R',

        view:
            'Detail Data K.I.R',

        edit:
            'Edit Data K.I.R',

        delete:
            'Hapus Data K.I.R'

    };


    const descriptions = {

        add:
            'Tambahkan data uji KIR kendaraan.',

        view:
            'Informasi detail KIR kendaraan.',

        edit:
            'Perbarui informasi KIR kendaraan.',

        delete:
            'Periksa data KIR yang akan dihapus.'

    };


    const readOnly =
        mode === 'view'
        ||
        mode === 'delete';


    /* Reset */
    document
        .getElementById('kirForm')
        ?.reset();


    /* Modal title */
    document
        .getElementById('kirModalTitle')
        .textContent =
            titles[mode] ||
            titles.add;


    /* Description */
    document
        .getElementById('kirModalDescription')
        .textContent =
            descriptions[mode] ||
            descriptions.add;


    /* Field mapping */
    const fieldMap = [

        [
            document.getElementById('kirPolisi'),
            2
        ],

        [
            document.getElementById('kirName'),
            4
        ],

        [
            document.getElementById('kirMerk'),
            5
        ],

        [
            document.getElementById('kirTahun'),
            7
        ],

        [
            document.getElementById('kirFormLokasi'),
            8
        ],

        [
            document.getElementById('kirTanggalUji'),
            9
        ],

        [
            document.getElementById('kirBerlaku'),
            10
        ]

    ];


    fieldMap.forEach(
        ([input, cellIndex]) => {

            if (!input) {
                return;
            }


            input.value =
                row

                    ? row
                        .cells[cellIndex]
                        .textContent
                        .trim()
                        .replace(/\s+/g, ' ')

                    : '';


            input.readOnly =
                readOnly;

        }
    );


    /* Jenis */
    const jenis =
        document.getElementById(
            'kirFormJenis'
        );

    if (jenis) {

        jenis.value =
            row

                ? row
                    .cells[6]
                    .textContent
                    .trim()

                : 'Mobil Penumpang';


        jenis.disabled =
            readOnly;

    }


    /* Status */
    const status =
        document.getElementById(
            'kirFormStatus'
        );

    if (status) {

        status.value =
            row

                ? row
                    .cells[11]
                    .textContent
                    .trim()

                : 'Aktif';


        status.disabled =
            readOnly;

    }


    /* Save button */
    const save =
        document.getElementById(
            'kirSaveButton'
        );

    if (save) {

        save.hidden =
            mode === 'view';

        save.disabled =
            true;

        save.textContent =
            mode === 'delete'

                ? 'Hapus Data K.I.R'

                : 'Simpan Data K.I.R';


        save.classList.toggle(
            'kir-delete-button',
            mode === 'delete'
        );

    }


    /* Note */
    const note =
        document.getElementById(
            'kirModalNote'
        );


    if (note) {

        note.textContent =

            mode === 'view'

                ? 'Data contoh untuk pratinjau tampilan.'

                :

            mode === 'delete'

                ? 'Pratinjau konfirmasi. Penghapusan database belum dihubungkan.'

                :

            'Form UI contoh. Penyimpanan database belum dihubungkan.';

    }


    /* Body overflow */
    kirPreviousOverflow =
        document.body.style.overflow;

    document.body.style.overflow =
        'hidden';


    /* Show */
    modal.showModal();


    /* Focus */
    if (!readOnly) {

        document
            .getElementById('kirPolisi')
            ?.focus();

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeKirModal() {

    const modal =
        document.getElementById(
            'kirModal'
        );

    if (modal?.open) {

        modal.close();

    }

}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportKirCSV() {

    const rows = [

        [
            'No',
            'Nomor Polisi',
            'Nama Kendaraan',
            'Merk / Tipe',
            'Jenis',
            'Tahun',
            'Lokasi',
            'Tanggal Uji',
            'Berlaku s/d',
            'Status'
        ]

    ];


    getFilteredKirRows()
        .forEach((row, index) => {

            rows.push([

                index + 1,

                row.cells[2].textContent,

                row.cells[4].textContent,

                row.cells[5].textContent,

                row.cells[6].textContent,

                row.cells[7].textContent,

                row.cells[8].textContent,

                row.cells[9].textContent,

                row.cells[10].textContent,

                row.cells[11].textContent

            ].map(value =>

                String(value)
                    .trim()
                    .replace(/\s+/g, ' ')

            ));

        });


    downloadKirCSV(
        rows,
        'data-kir.csv'
    );

}


/* =========================================================
   DOWNLOAD CSV
========================================================= */

function downloadKirCSV(
    rows,
    name
) {

    const safeValue =
        value => {

            let text =
                String(value ?? '');


            /*
             * CSV Injection Protection
             */
            if (
                /^[\s]*[=+@-]/.test(text)
                ||
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

        };


    const csv =
        rows
            .map(row =>
                row
                    .map(safeValue)
                    .join(',')
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
        URL.createObjectURL(blob);


    const anchor =
        document.createElement('a');


    anchor.href =
        url;

    anchor.download =
        name;


    document.body.appendChild(
        anchor
    );


    anchor.click();

    anchor.remove();


    setTimeout(
        () =>
            URL.revokeObjectURL(url),
        1000
    );

}