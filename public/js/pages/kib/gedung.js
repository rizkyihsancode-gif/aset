/* =========================================================
   GEDUNG & BANGUNAN
   K.I.B PAGE
========================================================= */

(function () {

    'use strict';


    /* =====================================================
       STATE
    ====================================================== */

    let currentPage = 1;

    let previousBodyOverflow = '';

    const TOTAL_DATA = 38;


    /* =====================================================
       INITIALIZATION
    ====================================================== */

    document.addEventListener('DOMContentLoaded', function () {

        const page =
            document.querySelector('.gedung-page');

        if (!page) {
            return;
        }


        initLucide();

        initSearch();

        initFilters();

        initPagination();

        initSelectAll();

        initTableActions();

        initModal();

        initForm();

        renderTable();

    });


    /* =====================================================
       LUCIDE
    ====================================================== */

    function initLucide() {

        if (
            typeof window.lucide !== 'undefined' &&
            typeof window.lucide.createIcons === 'function'
        ) {

            window.lucide.createIcons();

        }

    }


    /* =====================================================
       SEARCH
    ====================================================== */

    function initSearch() {

        const search =
            document.getElementById(
                'gedungSearch'
            );

        if (!search) {
            return;
        }


        search.addEventListener(
            'input',
            function () {

                currentPage = 1;

                renderTable();

            }
        );

    }


    /* =====================================================
       FILTER
    ====================================================== */

    function initFilters() {

        const ids = [

            'gedungKondisi',

            'gedungTahun',

            'gedungLokasi',

            'gedungStatusTanah',

            'gedungJenis'

        ];


        ids.forEach(function (id) {

            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }


            element.addEventListener(
                'change',
                function () {

                    currentPage = 1;

                    renderTable();

                }
            );

        });

    }


    /* =====================================================
       GET ROWS
    ====================================================== */

    function getRows() {

        return Array.from(
            document.querySelectorAll(
                '#gedungTable tbody tr[data-record]'
            )
        );

    }


    /* =====================================================
       GET FILTERED ROWS
    ====================================================== */

    function getFilteredRows() {

        const search =
            document
                .getElementById('gedungSearch')
                ?.value
                .trim()
                .toLowerCase() || '';


        const kondisi =
            document
                .getElementById('gedungKondisi')
                ?.value || '';


        const tahun =
            document
                .getElementById('gedungTahun')
                ?.value || '';


        const lokasi =
            document
                .getElementById('gedungLokasi')
                ?.value || '';


        const statusTanah =
            document
                .getElementById('gedungStatusTanah')
                ?.value || '';


        const jenis =
            document
                .getElementById('gedungJenis')
                ?.value || '';


        return getRows().filter(
            function (row) {

                const searchableText = [

                    row.cells[2]?.textContent,

                    row.cells[3]?.textContent,

                    row.cells[4]?.textContent,

                    row.cells[8]?.textContent

                ]
                    .join(' ')
                    .toLowerCase();


                const matchSearch =
                    !search ||
                    searchableText.includes(search);


                const matchKondisi =
                    !kondisi ||
                    row.dataset.kondisi === kondisi;


                const matchTahun =
                    !tahun ||
                    row.dataset.tahun === tahun;


                const matchLokasi =
                    !lokasi ||
                    row.dataset.lokasi === lokasi;


                const matchStatusTanah =
                    !statusTanah ||
                    row.dataset.statusTanah === statusTanah;


                const matchJenis =
                    !jenis ||
                    row.dataset.jenis === jenis;


                return (

                    matchSearch &&

                    matchKondisi &&

                    matchTahun &&

                    matchLokasi &&

                    matchStatusTanah &&

                    matchJenis

                );

            }
        );

    }


    /* =====================================================
       RENDER TABLE
    ====================================================== */

    function renderTable() {

        const rows =
            getRows();

        const filtered =
            getFilteredRows();


        const pageSize =
            parseInt(
                document
                    .getElementById(
                        'gedungPageSize'
                    )
                    ?.value || '8',
                10
            );


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filtered.length /
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
            (currentPage - 1) *
            pageSize;


        const end =
            start + pageSize;


        const visibleRows =
            filtered.slice(
                start,
                end
            );


        /* Hide all */
        rows.forEach(
            function (row) {

                row.hidden = true;

            }
        );


        /* Show current page */
        visibleRows.forEach(
            function (row, index) {

                row.hidden = false;


                const numberCell =
                    row.cells[1];

                if (numberCell) {

                    numberCell.textContent =
                        start + index + 1;

                }

            }
        );


        /* Empty state */
        const emptyRow =
            document.getElementById(
                'gedungEmptyRow'
            );


        if (emptyRow) {

            emptyRow.hidden =
                filtered.length !== 0;

        }


        /* Table info */
        updateTableInfo(
            filtered.length,
            start,
            visibleRows.length
        );


        /* Pagination */
        renderPagination(
            totalPages
        );


        /* Select all state */
        updateSelectAll();


        initLucide();

    }


    /* =====================================================
       TABLE INFO
    ====================================================== */

    function updateTableInfo(
        total,
        start,
        visible
    ) {

        const info =
            document.getElementById(
                'gedungTableInfo'
            );


        if (!info) {
            return;
        }


        if (total === 0) {

            info.textContent =
                'Tidak ada data yang ditampilkan';

            return;

        }


        const first =
            start + 1;


        const last =
            start + visible;


        info.textContent =
            `Menampilkan ${formatNumber(first)} - ${formatNumber(last)} dari ${formatNumber(total)} data hasil filter`;

    }


    /* =====================================================
       PAGINATION INIT
    ====================================================== */

    function initPagination() {

        const pageSize =
            document.getElementById(
                'gedungPageSize'
            );


        if (!pageSize) {
            return;
        }


        pageSize.addEventListener(
            'change',
            function () {

                currentPage = 1;

                renderTable();

            }
        );

    }


    /* =====================================================
       PAGINATION RENDER
    ====================================================== */

    function renderPagination(
        totalPages
    ) {

        const pagination =
            document.getElementById(
                'gedungPagination'
            );


        if (!pagination) {
            return;
        }


        pagination.replaceChildren();


        /* Previous */
        const previous =
            createPaginationButton(
                'chevron-left',
                null,
                currentPage === 1
            );


        previous.addEventListener(
            'click',
            function () {

                if (currentPage <= 1) {
                    return;
                }


                currentPage--;

                renderTable();

            }
        );


        pagination.appendChild(
            previous
        );


        /* Page numbers */
        const maxVisiblePages = 5;


        let startPage =
            Math.max(
                1,
                currentPage - 2
            );


        let endPage =
            Math.min(
                totalPages,
                startPage + maxVisiblePages - 1
            );


        if (
            endPage - startPage + 1 <
            maxVisiblePages
        ) {

            startPage =
                Math.max(
                    1,
                    endPage - maxVisiblePages + 1
                );

        }


        for (
            let page = startPage;
            page <= endPage;
            page++
        ) {

            const button =
                createPaginationButton(
                    String(page),
                    page,
                    false
                );


            if (
                page === currentPage
            ) {

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

                    currentPage =
                        page;

                    renderTable();

                }
            );


            pagination.appendChild(
                button
            );

        }


        /* Next */
        const next =
            createPaginationButton(
                'chevron-right',
                null,
                currentPage >= totalPages
            );


        next.addEventListener(
            'click',
            function () {

                if (
                    currentPage >= totalPages
                ) {
                    return;
                }


                currentPage++;

                renderTable();

            }
        );


        pagination.appendChild(
            next
        );


        initLucide();

    }


    /* =====================================================
       CREATE PAGINATION BUTTON
    ====================================================== */

    function createPaginationButton(
        value,
        page,
        disabled
    ) {

        const button =
            document.createElement(
                'button'
            );


        button.type =
            'button';


        button.disabled =
            Boolean(disabled);


        if (
            value ===
            'chevron-left'
            ||
            value ===
            'chevron-right'
        ) {

            const icon =
                document.createElement(
                    'i'
                );


            icon.setAttribute(
                'data-lucide',
                value
            );


            button.appendChild(
                icon
            );

        } else {

            button.textContent =
                value;

        }


        return button;

    }


    /* =====================================================
       SELECT ALL
    ====================================================== */

    function initSelectAll() {

        const selectAll =
            document.getElementById(
                'gedungSelectAll'
            );


        if (!selectAll) {
            return;
        }


        selectAll.addEventListener(
            'change',
            function () {

                const rows =
                    getRows();


                const visible =
                    rows.filter(
                        row =>
                            !row.hidden
                    );


                visible.forEach(
                    function (row) {

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

            }
        );


        getRows().forEach(
            function (row) {

                const checkbox =
                    row.querySelector(
                        'input[type="checkbox"]'
                    );


                checkbox?.addEventListener(
                    'change',
                    updateSelectAll
                );

            }
        );

    }


    /* =====================================================
       UPDATE SELECT ALL
    ====================================================== */

    function updateSelectAll() {

        const selectAll =
            document.getElementById(
                'gedungSelectAll'
            );


        if (!selectAll) {
            return;
        }


        const visible =
            getRows().filter(
                row =>
                    !row.hidden
            );


        const checkboxes =
            visible
                .map(
                    row =>
                        row.querySelector(
                            'input[type="checkbox"]'
                        )
                )
                .filter(Boolean);


        if (checkboxes.length === 0) {

            selectAll.checked = false;

            selectAll.indeterminate = false;

            return;

        }


        const checked =
            checkboxes.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        selectAll.checked =
            checked === checkboxes.length;


        selectAll.indeterminate =
            checked > 0 &&
            checked < checkboxes.length;

    }


    /* =====================================================
       TABLE ACTIONS
    ====================================================== */

    function initTableActions() {

        const table =
            document.getElementById(
                'gedungTable'
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
                        'tr[data-record]'
                    );


                if (!row) {
                    return;
                }


                openGedungModal(
                    button.dataset.action,
                    row
                );

            }
        );

    }


    /* =====================================================
       ADVANCED FILTER
    ====================================================== */

    window.toggleGedungAdvancedFilter =
        function () {

            const filter =
                document.getElementById(
                    'gedungAdvancedFilter'
                );


            if (!filter) {
                return;
            }


            filter.hidden =
                !filter.hidden;

        };


    /* =====================================================
       RESET
    ====================================================== */

    window.resetGedungFilter =
        function () {

            const ids = [

                'gedungSearch',

                'gedungKondisi',

                'gedungTahun',

                'gedungLokasi',

                'gedungStatusTanah',

                'gedungJenis'

            ];


            ids.forEach(
                function (id) {

                    const element =
                        document.getElementById(
                            id
                        );


                    if (element) {

                        element.value = '';

                    }

                }
            );


            currentPage = 1;

            renderTable();

        };


    /* =====================================================
       MODAL INIT
    ====================================================== */

    function initModal() {

        const modal =
            document.getElementById(
                'gedungModal'
            );


        if (!modal) {
            return;
        }


        modal.addEventListener(
            'click',
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeGedungModal();

                }

            }
        );


        modal.addEventListener(
            'close',
            function () {

                document.body.style.overflow =
                    previousBodyOverflow;

            }
        );

    }


    /* =====================================================
       OPEN MODAL
    ====================================================== */

    window.openGedungModal =
        function (
            mode = 'add',
            row = null
        ) {

            const modal =
                document.getElementById(
                    'gedungModal'
                );


            if (!modal) {
                return;
            }


            const title =
                document.getElementById(
                    'gedungModalTitle'
                );


            const description =
                document.getElementById(
                    'gedungModalDescription'
                );


            const note =
                document.getElementById(
                    'gedungModalNote'
                );


            const saveButton =
                document.getElementById(
                    'gedungSaveButton'
                );


            const titles = {

                add:
                    'Tambah Gedung & Bangunan',

                view:
                    'Detail Gedung & Bangunan',

                edit:
                    'Edit Gedung & Bangunan',

                delete:
                    'Hapus Gedung & Bangunan'

            };


            const descriptions = {

                add:
                    'Tambahkan data aset gedung atau bangunan.',

                view:
                    'Lihat informasi lengkap aset gedung atau bangunan.',

                edit:
                    'Perbarui informasi aset gedung atau bangunan.',

                delete:
                    'Konfirmasi data gedung atau bangunan yang akan dihapus.'

            };


            title.textContent =
                titles[mode] ||
                titles.add;


            description.textContent =
                descriptions[mode] ||
                descriptions.add;


            const readOnly =
                mode === 'view' ||
                mode === 'delete';


            fillGedungForm(
                row
            );


            setFormReadonly(
                readOnly
            );


            if (mode === 'delete') {

                note.textContent =
                    'Data ini hanya simulasi UI. Penghapusan database belum dihubungkan.';

            } else if (mode === 'view') {

                note.textContent =
                    'Mode lihat. Field dikunci dan tidak dapat diubah.';

            } else {

                note.textContent =
                    'Form UI. Penyimpanan database akan kita hubungkan pada tahap backend.';

            }


            if (mode === 'view') {

                saveButton.hidden =
                    true;

            } else {

                saveButton.hidden =
                    false;


                saveButton.innerHTML =
                    mode === 'delete'

                        ? '<i data-lucide="trash-2"></i> Hapus Data'

                        : '<i data-lucide="save"></i> Simpan Data';


                saveButton.classList.toggle(
                    'is-delete',
                    mode === 'delete'
                );

            }


            previousBodyOverflow =
                document.body.style.overflow;


            document.body.style.overflow =
                'hidden';


            if (!modal.open) {

                modal.showModal();

            }


            initLucide();

        };


    /* =====================================================
       FILL FORM
    ====================================================== */

    function fillGedungForm(
        row
    ) {

        const form =
            document.getElementById(
                'gedungForm'
            );


        form?.reset();


        if (!row) {
            return;
        }


        setValue(
            'gedungKode',
            row.cells[2]
        );


        setValue(
            'gedungNama',
            row.cells[3]
        );


        setValue(
            'gedungRegister',
            row.cells[4]
        );


        setValue(
            'gedungLuas',
            row.cells[6]
        );


        setValue(
            'gedungFormTahun',
            row.cells[7]
        );


        setValue(
            'gedungFormLokasi',
            row.cells[8]
        );


        setValue(
            'gedungNilai',
            row.cells[10]
        );


        setSelectValue(
            'gedungFormJenis',
            row.cells[5]
        );


        setSelectValue(
            'gedungFormKondisi',
            row.cells[9]
        );


        setSelectValue(
            'gedungFormStatusTanah',
            row.cells[11]
        );

    }


    /* =====================================================
       SET VALUE
    ====================================================== */

    function setValue(
        id,
        cell
    ) {

        const element =
            document.getElementById(id);


        if (
            element &&
            cell
        ) {

            element.value =
                cleanText(
                    cell.textContent
                );

        }

    }


    /* =====================================================
       SET SELECT VALUE
    ====================================================== */

    function setSelectValue(
        id,
        cell
    ) {

        const element =
            document.getElementById(id);


        if (
            !element ||
            !cell
        ) {
            return;
        }


        const value =
            cleanText(
                cell.textContent
            );


        const exists =
            Array.from(
                element.options
            ).some(
                option =>
                    option.value === value ||
                    option.textContent.trim() === value
            );


        if (exists) {

            element.value =
                value;

        }

    }


    /* =====================================================
       READONLY
    ====================================================== */

    function setFormReadonly(
        readOnly
    ) {

        const inputs =
            document.querySelectorAll(
                '#gedungForm input'
            );


        inputs.forEach(
            function (input) {

                input.readOnly =
                    readOnly;

            }
        );


        const selects =
            document.querySelectorAll(
                '#gedungForm select'
            );


        selects.forEach(
            function (select) {

                select.disabled =
                    readOnly;

            }
        );

    }


    /* =====================================================
       CLOSE MODAL
    ====================================================== */

    window.closeGedungModal =
        function () {

            const modal =
                document.getElementById(
                    'gedungModal'
                );


            if (
                modal &&
                modal.open
            ) {

                modal.close();

            }

        };


    /* =====================================================
       FORM
    ====================================================== */

    function initForm() {

        const form =
            document.getElementById(
                'gedungForm'
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();


                /*
                 * Backend belum dihubungkan.
                 */

                const saveButton =
                    document.getElementById(
                        'gedungSaveButton'
                    );


                if (
                    saveButton?.classList.contains(
                        'is-delete'
                    )
                ) {

                    alert(
                        'Mode hapus masih berupa simulasi UI. Backend belum dihubungkan.'
                    );

                } else {

                    alert(
                        'Data berhasil divalidasi. Penyimpanan database akan dihubungkan pada tahap backend.'
                    );

                }

            }
        );

    }


    /* =====================================================
       EXPORT CSV
    ====================================================== */

    window.exportGedungCSV =
        function () {

            const rows =
                getFilteredRows();


            const csvRows = [

                [

                    'No',

                    'Kode Barang',

                    'Nama Gedung / Bangunan',

                    'Register',

                    'Jenis',

                    'Luas Bangunan',

                    'Tahun Perolehan',

                    'Lokasi',

                    'Kondisi',

                    'Nilai Perolehan',

                    'Status Tanah'

                ]

            ];


            rows.forEach(
                function (row, index) {

                    csvRows.push([

                        index + 1,

                        getCell(
                            row,
                            2
                        ),

                        getCell(
                            row,
                            3
                        ),

                        getCell(
                            row,
                            4
                        ),

                        getCell(
                            row,
                            5
                        ),

                        getCell(
                            row,
                            6
                        ),

                        getCell(
                            row,
                            7
                        ),

                        getCell(
                            row,
                            8
                        ),

                        getCell(
                            row,
                            9
                        ),

                        getCell(
                            row,
                            10
                        ),

                        getCell(
                            row,
                            11
                        )

                    ]);

                }
            );


            downloadCSV(
                csvRows,
                'data-gedung-bangunan.csv'
            );

        };


    /* =====================================================
       GET CELL
    ====================================================== */

    function getCell(
        row,
        index
    ) {

        return cleanText(
            row
                .cells[index]
                ?.textContent || ''
        );

    }


    /* =====================================================
       DOWNLOAD CSV
    ====================================================== */

    function downloadCSV(
        rows,
        filename
    ) {

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


        link.href =
            url;


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


    /* =====================================================
       ESCAPE CSV
    ====================================================== */

    function escapeCSV(
        value
    ) {

        let text =
            String(
                value ?? ''
            );


        /*
         * CSV Injection Protection
         */

        if (
            /^[\s]*[=+@-]/.test(text)
        ) {

            text =
                "'" + text;

        }


        return '"' +
            text.replace(
                /"/g,
                '""'
            ) +
            '"';

    }


    /* =====================================================
       FORMAT NUMBER
    ====================================================== */

    function formatNumber(
        value
    ) {

        return new Intl.NumberFormat(
            'id-ID'
        ).format(
            Number(value)
        );

    }


    /* =====================================================
       CLEAN TEXT
    ====================================================== */

    function cleanText(
        value
    ) {

        return String(
            value ?? ''
        )
            .replace(
                /\s+/g,
                ' '
            )
            .trim();

    }


})();