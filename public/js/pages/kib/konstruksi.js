/* =========================================================
   K.I.B 06 - KONSTRUKSI DALAM PENGERJAAN
========================================================= */

let kontruksiCurrentPage = 1;

let kontruksiPreviousOverflow = '';

const kontruksiNumber =
    new Intl.NumberFormat('id-ID');


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        if (
            !document.querySelector(
                '.kontruksi-page'
            )
        ) {
            return;
        }


        if (window.lucide) {
            window.lucide.createIcons();
        }


        /* FILTER */

        document
            .getElementById('kontruksiSearch')
            ?.addEventListener(
                'input',
                filterKontruksiTable
            );


        document
            .getElementById('kontruksiJenis')
            ?.addEventListener(
                'change',
                filterKontruksiTable
            );


        document
            .getElementById('kontruksiStatus')
            ?.addEventListener(
                'change',
                filterKontruksiTable
            );


        document
            .getElementById('kontruksiTahun')
            ?.addEventListener(
                'change',
                filterKontruksiTable
            );


        /* PAGE SIZE */

        document
            .getElementById('kontruksiPageSize')
            ?.addEventListener(
                'change',
                function () {

                    kontruksiCurrentPage = 1;

                    renderKontruksiTable();

                }
            );


        /* SELECT ALL */

        document
            .getElementById('kontruksiSelectAll')
            ?.addEventListener(
                'change',
                function () {

                    const checked =
                        this.checked;


                    getKontruksiRows()
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


        /* TABLE ACTION */

        document
            .getElementById('kontruksiTable')
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


                    openKontruksiModal(
                        button.dataset.action,
                        button.closest('tr')
                    );

                }
            );


        /* MODAL */

        const modal =
            document.getElementById(
                'kontruksiModal'
            );


        modal?.addEventListener(
            'click',
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeKontruksiModal();

                }

            }
        );


        modal?.addEventListener(
            'close',
            function () {

                document.body.style.overflow =
                    kontruksiPreviousOverflow;

            }
        );


        /* FORM */

        document
            .getElementById(
                'kontruksiForm'
            )
            ?.addEventListener(
                'submit',
                function (event) {

                    event.preventDefault();

                }
            );


        renderKontruksiTable();

    }
);


/* =========================================================
   GET ROWS
========================================================= */

function getKontruksiRows() {

    return Array.from(
        document.querySelectorAll(
            '#kontruksiTable tbody tr[data-record]'
        )
    );

}


/* =========================================================
   FILTERED ROWS
========================================================= */

function getFilteredKontruksiRows() {

    const search =
        document
            .getElementById(
                'kontruksiSearch'
            )
            ?.value
            .trim()
            .toLocaleLowerCase('id-ID')
        || '';


    const jenis =
        document
            .getElementById(
                'kontruksiJenis'
            )
            ?.value
        || '';


    const status =
        document
            .getElementById(
                'kontruksiStatus'
            )
            ?.value
        || '';


    const tahun =
        document
            .getElementById(
                'kontruksiTahun'
            )
            ?.value
        || '';


    return getKontruksiRows()
        .filter(
            function (row) {

                const searchable = [

                    row.cells[2]?.textContent,

                    row.cells[3]?.textContent,

                    row.cells[4]?.textContent,

                    row.cells[5]?.textContent

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

                    !status ||

                    row.dataset.status ===
                        status

                ) && (

                    !tahun ||

                    row.dataset.tahun ===
                        tahun

                );

            }
        );

}


/* =========================================================
   FILTER
========================================================= */

function filterKontruksiTable() {

    kontruksiCurrentPage = 1;

    renderKontruksiTable();

}


/* =========================================================
   RESET
========================================================= */

function resetKontruksiFilter() {

    [
        'kontruksiSearch',
        'kontruksiJenis',
        'kontruksiStatus',
        'kontruksiTahun'
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
            'kontruksiSelectAll'
        );


    if (selectAll) {
        selectAll.checked = false;
    }


    getKontruksiRows()
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


    kontruksiCurrentPage = 1;

    renderKontruksiTable();

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderKontruksiTable() {

    const rows =
        getKontruksiRows();


    const filtered =
        getFilteredKontruksiRows();


    const pageSize =
        Number(
            document
                .getElementById(
                    'kontruksiPageSize'
                )
                ?.value
        ) || 10;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filtered.length /
                pageSize
            )
        );


    kontruksiCurrentPage =
        Math.min(
            kontruksiCurrentPage,
            totalPages
        );


    const start =
        (
            kontruksiCurrentPage -
            1
        ) * pageSize;


    const end =
        start + pageSize;


    const visibleRows =
        filtered.slice(
            start,
            end
        );


    rows.forEach(
        function (row) {

            row.hidden =
                !visibleRows.includes(
                    row
                );

        }
    );


    /* NOMOR */

    filtered.forEach(
        function (
            row,
            index
        ) {

            if (row.cells[1]) {

                row.cells[1].textContent =
                    index + 1;

            }

        }
    );


    /* EMPTY */

    const empty =
        document.getElementById(
            'kontruksiEmptyRow'
        );


    if (empty) {

        empty.hidden =
            filtered.length > 0;

    }


    /* INFO */

    const info =
        document.getElementById(
            'kontruksiTableInfo'
        );


    if (info) {

        if (!filtered.length) {

            info.textContent =
                'Tidak ada data yang ditampilkan.';

        } else {

            info.textContent =
                `Menampilkan ${kontruksiNumber.format(start + 1)} - ${kontruksiNumber.format(Math.min(end, filtered.length))} dari ${kontruksiNumber.format(filtered.length)} data`;

        }

    }


    renderKontruksiPagination(
        totalPages
    );


    if (window.lucide) {
        window.lucide.createIcons();
    }

}


/* =========================================================
   PAGINATION
========================================================= */

function renderKontruksiPagination(
    totalPages
) {

    const pagination =
        document.getElementById(
            'kontruksiPagination'
        );


    if (!pagination) {
        return;
    }


    pagination.replaceChildren();


    function createButton(
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

                kontruksiCurrentPage =
                    page;

                renderKontruksiTable();

            }
        );


        pagination.appendChild(
            button
        );

    }


    function createDots() {

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

    createButton(
        '',
        Math.max(
            1,
            kontruksiCurrentPage - 1
        ),
        {
            icon: 'chevron-left',

            disabled:
                kontruksiCurrentPage === 1,

            aria:
                'Halaman sebelumnya'
        }
    );


    /* PAGE */

    if (totalPages <= 7) {

        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            createButton(
                String(page),
                page,
                {
                    active:
                        page ===
                        kontruksiCurrentPage
                }
            );

        }

    } else {

        const pages =
            new Set([
                1,
                2,
                kontruksiCurrentPage - 1,
                kontruksiCurrentPage,
                kontruksiCurrentPage + 1,
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

                    createDots();

                }


                createButton(
                    String(page),
                    page,
                    {
                        active:
                            page ===
                            kontruksiCurrentPage
                    }
                );

            }
        );

    }


    /* NEXT */

    createButton(
        '',
        Math.min(
            totalPages,
            kontruksiCurrentPage + 1
        ),
        {
            icon: 'chevron-right',

            disabled:
                kontruksiCurrentPage ===
                totalPages,

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

function openKontruksiModal(
    mode = 'add',
    row = null
) {

    const modal =
        document.getElementById(
            'kontruksiModal'
        );


    if (
        !modal ||
        modal.open
    ) {
        return;
    }


    const titles = {

        add:
            'Tambah Konstruksi',

        view:
            'Detail Konstruksi',

        edit:
            'Edit Konstruksi',

        delete:
            'Hapus Konstruksi'

    };


    const descriptions = {

        add:
            'Tambahkan data Konstruksi Dalam Pengerjaan.',

        view:
            'Informasi detail konstruksi.',

        edit:
            'Perbarui informasi konstruksi.',

        delete:
            'Periksa konstruksi yang akan dihapus.'

    };


    const readonly =
        mode === 'view' ||
        mode === 'delete';


    document
        .getElementById(
            'kontruksiForm'
        )
        ?.reset();


    document
        .getElementById(
            'kontruksiModalTitle'
        )
        .textContent =
            titles[mode] ||
            titles.add;


    document
        .getElementById(
            'kontruksiModalDescription'
        )
        .textContent =
            descriptions[mode] ||
            descriptions.add;


    /* =========================================
       FIELD
    ========================================= */

    const fields = [

        [
            'kontruksiCode',
            2
        ],

        [
            'kontruksiName',
            3
        ],

        [
            'kontruksiFormLokasi',
            5
        ],

        [
            'kontruksiFormTahun',
            6
        ],

        [
            'kontruksiNilai',
            7
        ]

    ];


    fields.forEach(
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
                    ? row.cells[index]
                        .textContent
                        .trim()
                        .replace(
                            /\s+/g,
                            ' '
                        )
                    : '';


            input.readOnly =
                readonly;


            if (
                id ===
                'kontruksiFormTahun'
            ) {

                input.readOnly =
                    readonly;

            }

        }
    );


    /* =========================================
       JENIS
    ========================================= */

    const jenis =
        document.getElementById(
            'kontruksiFormJenis'
        );


    if (jenis) {

        jenis.value =
            row
                ? row.cells[4]
                    .textContent
                    .trim()
                : '';


        jenis.disabled =
            readonly;

    }


    /* =========================================
       PROGRESS
    ========================================= */

    const progress =
        document.getElementById(
            'kontruksiProgress'
        );


    if (progress) {

        if (row) {

            const progressText =
                row.cells[8]
                    .textContent
                    .trim();


            const match =
                progressText.match(
                    /(\d+)\s*%/
                );


            progress.value =
                match
                    ? match[1]
                    : 0;

        } else {

            progress.value = 0;

        }


        progress.readOnly =
            readonly;

    }


    /* =========================================
       STATUS
    ========================================= */

    const status =
        document.getElementById(
            'kontruksiFormStatus'
        );


    if (status) {

        status.value =
            row
                ? row.dataset.status
                : 'Berjalan';


        status.disabled =
            readonly;

    }


    /* =========================================
       TARGET
    ========================================= */

    const target =
        document.getElementById(
            'kontruksiTarget'
        );


    if (target) {

        /*
         * Data tabel menggunakan format:
         * 30 Nov 2025.
         *
         * Untuk demo, kita kosongkan
         * saat tambah dan readonly saat
         * melihat data.
         */

        target.value = '';

        target.readOnly =
            readonly;

    }


    /* =========================================
       SAVE
    ========================================= */

    const save =
        document.getElementById(
            'kontruksiSaveButton'
        );


    if (save) {

        save.hidden =
            mode === 'view';


        save.disabled =
            true;


        save.textContent =
            mode === 'delete'
                ? 'Hapus Konstruksi'
                : 'Simpan Konstruksi';


        save.classList.toggle(
            'kontruksi-delete-button',
            mode === 'delete'
        );

    }


    /* =========================================
       NOTE
    ========================================= */

    const note =
        document.getElementById(
            'kontruksiModalNote'
        );


    if (note) {

        note.textContent =

            mode === 'view'

                ? 'Data contoh untuk pratinjau detail konstruksi.'

                : mode === 'delete'

                    ? 'Pratinjau konfirmasi. Penghapusan database belum dihubungkan.'

                    : 'Form UI contoh. Penyimpanan database belum dihubungkan.';

    }


    /* =========================================
       OPEN
    ========================================= */

    kontruksiPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';


    modal.showModal();


    if (!readonly) {

        document
            .getElementById(
                'kontruksiCode'
            )
            ?.focus();

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeKontruksiModal() {

    const modal =
        document.getElementById(
            'kontruksiModal'
        );


    if (
        modal &&
        modal.open
    ) {

        modal.close();

    }

}