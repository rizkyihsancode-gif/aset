(function () {

    'use strict';


    let currentPage = 1;

    let modalMode =
        'add';

    let currentRow =
        null;

    let currentId =
        null;



    function qs(
        selector,
        parent = document
    ) {

        return parent.querySelector(
            selector
        );

    }



    function qsa(
        selector,
        parent = document
    ) {

        return Array.from(
            parent.querySelectorAll(
                selector
            )
        );

    }



    function refreshIcons() {

        if (
            window.lucide
            &&
            typeof window.lucide.createIcons ===
            'function'
        ) {

            window.lucide.createIcons();

        }

    }



    function csrfToken() {

        return (
            qs(
                'meta[name="csrf-token"]'
            )
                ?.getAttribute(
                    'content'
                )

            ||

            qs(
                '#bahanForm input[name="_token"]'
            )
                ?.value

            ||

            ''
        );

    }



    /* =========================================================
       DATE
    ========================================================= */

    function updateDateTime() {


        const date =
            qs(
                '#bahanCurrentDate'
            );


        const time =
            qs(
                '#bahanCurrentTime'
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
            )
                .format(
                    now
                );


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
                .format(
                    now
                )
                .replace(
                    /\./g,
                    ':'
                )
            +
            ' WITA';

    }



    /* =========================================================
       ROWS
    ========================================================= */

    function rows() {

        return qsa(
            '#bahanTable tbody tr[data-record]'
        );

    }



    function filteredRows() {


        const keyword =
            String(
                qs(
                    '#bahanSearch'
                )
                    ?.value
                ||
                ''
            )
                .trim()
                .toLocaleLowerCase(
                    'id-ID'
                );


        return rows()
            .filter(
                function (row) {


                    const nama =
                        String(
                            row.dataset.nama
                            ||
                            ''
                        )
                            .toLocaleLowerCase(
                                'id-ID'
                            );


                    return (
                        !keyword
                        ||
                        nama.includes(
                            keyword
                        )
                    );

                }
            );

    }



    /* =========================================================
       TABLE
    ========================================================= */

    function renderTable() {


        const all =
            rows();


        const filtered =
            filteredRows();


        const pageSize =
            Number(
                qs(
                    '#bahanPageSize'
                )
                    ?.value
            )
            ||
            10;


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
            (
                currentPage -
                1
            )
            *
            pageSize;


        all.forEach(
            function (row) {

                row.hidden =
                    true;

            }
        );


        filtered
            .slice(
                start,
                start + pageSize
            )
            .forEach(
                function (
                    row,
                    index
                ) {


                    row.hidden =
                        false;


                    const no =
                        row.querySelector(
                            '.bahan-number'
                        );


                    if (no) {

                        no.textContent =
                            start +
                            index +
                            1;

                    }

                }
            );


        const empty =
            qs(
                '#bahanEmptyRow'
            );


        if (empty) {

            empty.hidden =
                filtered.length !== 0;

        }


        const serverEmpty =
            qs(
                '#bahanServerEmpty'
            );


        if (serverEmpty) {

            serverEmpty.hidden =
                all.length !== 0;

        }


        updateTableInfo(
            filtered.length,
            start,
            pageSize
        );


        renderPagination(
            totalPages
        );

    }



    function updateTableInfo(
        total,
        start,
        size
    ) {


        const element =
            qs(
                '#bahanTableInfo'
            );


        if (!element) {

            return;

        }


        if (!total) {

            element.textContent =
                'Menampilkan 0 dari 0 data';

            return;

        }


        element.textContent =
            `Menampilkan ${start + 1}–${Math.min(start + size, total)} dari ${total} data`;

    }



    function renderPagination(
        totalPages
    ) {


        const container =
            qs(
                '#bahanPagination'
            );


        if (!container) {

            return;

        }


        container.innerHTML =
            '';


        container.appendChild(
            createPageButton(
                '‹',
                currentPage - 1,
                currentPage === 1
            )
        );


        let first =
            Math.max(
                1,
                currentPage - 2
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

            container.appendChild(
                createPageButton(
                    String(page),
                    page,
                    false,
                    page === currentPage
                )
            );

        }


        container.appendChild(
            createPageButton(
                '›',
                currentPage + 1,
                currentPage >=
                    totalPages
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

                }
            );

        }


        return button;

    }



    /* =========================================================
       MODAL
    ========================================================= */

    function openModal(
        mode = 'add',
        row = null
    ) {


        const dialog =
            qs(
                '#bahanModal'
            );


        if (!dialog) {

            return;

        }


        modalMode =
            mode;


        currentRow =
            row;


        currentId =
            row?.dataset.id
            ||
            null;


        qs(
            '#bahanForm'
        )
            ?.reset();


        hideFormError();


        const input =
            qs(
                '#bahanName'
            );


        const title =
            qs(
                '#bahanModalTitle'
            );


        const description =
            qs(
                '#bahanModalDescription'
            );


        const saveButton =
            qs(
                '#bahanSaveButton'
            );


        const saveText =
            qs(
                '#bahanSaveText'
            );


        input.value =
            row?.dataset.nama
            ||
            '';


        const readonly =
            mode === 'view'
            ||
            mode === 'delete';


        input.readOnly =
            readonly;


        saveButton.hidden =
            mode === 'view';


        saveButton.classList.toggle(
            'bahan-delete-button',
            mode === 'delete'
        );


        if (
            mode === 'add'
        ) {

            title.textContent =
                'Tambah Bahan';


            description.textContent =
                'Tambahkan data master Bahan baru.';


            saveText.textContent =
                'Simpan Bahan';

        }


        if (
            mode === 'view'
        ) {

            title.textContent =
                'Detail Bahan';


            description.textContent =
                'Informasi data master Bahan.';

        }


        if (
            mode === 'edit'
        ) {

            title.textContent =
                'Edit Bahan';


            description.textContent =
                'Perbarui data master Bahan.';


            saveText.textContent =
                'Simpan Perubahan';

        }


        if (
            mode === 'delete'
        ) {

            title.textContent =
                'Hapus Bahan';


            description.textContent =
                'Periksa data sebelum menghapus Bahan.';


            saveText.textContent =
                'Hapus Bahan';

        }


        if (!dialog.open) {

            dialog.showModal();

        }


        refreshIcons();

    }



    function closeModal() {


        const dialog =
            qs(
                '#bahanModal'
            );


        if (
            dialog
            &&
            dialog.open
        ) {

            dialog.close();

        }


        modalMode =
            'add';


        currentRow =
            null;


        currentId =
            null;


        hideFormError();

    }



    /* =========================================================
       FETCH
    ========================================================= */

    async function request(
        url,
        method,
        payload = null
    ) {


        const options = {

            method,

            credentials:
                'same-origin',

            headers: {

                'Accept':
                    'application/json',

                'Content-Type':
                    'application/json',

                'X-Requested-With':
                    'XMLHttpRequest',

                'X-CSRF-TOKEN':
                    csrfToken()

            }

        };


        if (
            payload !== null
        ) {

            options.body =
                JSON.stringify(
                    payload
                );

        }


        const response =
            await fetch(
                url,
                options
            );


        const data =
            await response
                .json()
                .catch(
                    function () {

                        return {};

                    }
                );


        if (!response.ok) {


            let message =
                data.message
                ||
                `Request gagal (${response.status}).`;


            if (
                response.status === 422
                &&
                data.errors
            ) {


                const first =
                    Object.values(
                        data.errors
                    )
                        .flat()[0];


                if (first) {

                    message =
                        first;

                }

            }


            throw new Error(
                message
            );

        }


        return data;

    }



    /* =========================================================
       SUBMIT
    ========================================================= */

    async function submitForm(
        event
    ) {


        event.preventDefault();


        hideFormError();


        if (
            modalMode === 'view'
        ) {

            closeModal();

            return;

        }


        if (
            modalMode === 'delete'
        ) {

            await deleteRecord();

            return;

        }


        const nama =
            String(
                qs(
                    '#bahanName'
                )
                    ?.value
                ||
                ''
            )
                .trim();


        if (!nama) {

            showFormError(
                'Nama Bahan wajib diisi.'
            );

            return;

        }


        const payload = {
            nama
        };


        let url =
            window
                .BAHAN_CRUD
                .store;


        let method =
            'POST';


        if (
            modalMode === 'edit'
        ) {


            url =
                window
                    .BAHAN_CRUD
                    .update
                    .replace(
                        '__ID__',
                        encodeURIComponent(
                            currentId
                        )
                    );


            method =
                'PUT';

        }


        const button =
            qs(
                '#bahanSaveButton'
            );


        const text =
            qs(
                '#bahanSaveText'
            );


        const original =
            text.textContent;


        button.disabled =
            true;


        text.textContent =
            'Menyimpan...';


        try {


            const result =
                await request(
                    url,
                    method,
                    payload
                );


            toast(
                result.message
                ||
                'Data berhasil disimpan.',
                'success'
            );


            closeModal();


            setTimeout(
                function () {

                    window.location.reload();

                },
                400
            );


        } catch (error) {


            showFormError(
                error.message
            );


        } finally {


            button.disabled =
                false;


            text.textContent =
                original;

        }

    }



    /* =========================================================
       DELETE
    ========================================================= */

    async function deleteRecord() {


        if (!currentId) {

            showFormError(
                'ID Bahan tidak ditemukan.'
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Apakah Anda yakin ingin menghapus "${currentRow?.dataset.nama || 'Bahan'}"?`
            );


        if (!confirmed) {

            return;

        }


        const button =
            qs(
                '#bahanSaveButton'
            );


        const text =
            qs(
                '#bahanSaveText'
            );


        button.disabled =
            true;


        text.textContent =
            'Menghapus...';


        try {


            const url =
                window
                    .BAHAN_CRUD
                    .destroy
                    .replace(
                        '__ID__',
                        encodeURIComponent(
                            currentId
                        )
                    );


            const result =
                await request(
                    url,
                    'DELETE'
                );


            toast(
                result.message
                ||
                'Bahan berhasil dihapus.',
                'success'
            );


            closeModal();


            setTimeout(
                function () {

                    window.location.reload();

                },
                400
            );


        } catch (error) {


            showFormError(
                error.message
            );


        } finally {


            button.disabled =
                false;


            text.textContent =
                'Hapus Bahan';

        }

    }



    /* =========================================================
       HISTORY
    ========================================================= */

    function openHistory() {


        const dialog =
            qs(
                '#bahanActivityModal'
            );


        if (!dialog) {

            return;

        }


        filterHistory(
            'all'
        );


        if (!dialog.open) {

            dialog.showModal();

        }


        refreshIcons();

    }



    function closeHistory() {


        const dialog =
            qs(
                '#bahanActivityModal'
            );


        if (
            dialog?.open
        ) {

            dialog.close();

        }

    }



    function filterHistory(
        type
    ) {


        let number =
            0;


        qsa(
            '[data-bahan-history-filter]'
        )
            .forEach(
                function (button) {


                    button
                        .classList
                        .toggle(
                            'active',
                            button
                                .dataset
                                .bahanHistoryFilter ===
                                type
                        );

                }
            );


        qsa(
            '[data-bahan-history-row]'
        )
            .forEach(
                function (row) {


                    const show =
                        type === 'all'
                        ||
                        row.dataset.action ===
                            type;


                    row.hidden =
                        !show;


                    if (show) {


                        number++;


                        const no =
                            row.querySelector(
                                '.bahan-history-number'
                            );


                        if (no) {

                            no.textContent =
                                number;

                        }

                    }

                }
            );

    }



    /* =========================================================
       EXPORT CSV
    ========================================================= */

    function exportCsv() {


        const data =
            filteredRows();


        if (!data.length) {


            toast(
                'Tidak ada data untuk diekspor.',
                'error'
            );


            return;

        }


        const lines = [

            [
                'No',
                'ID',
                'Nama Bahan',
                'Created At',
                'Updated At'
            ]

        ];


        data.forEach(
            function (
                row,
                index
            ) {


                lines.push(
                    [
                        index + 1,

                        row.dataset.id
                        ||
                        '',

                        row.dataset.nama
                        ||
                        '',

                        row.dataset.createdAt
                        ||
                        '',

                        row.dataset.updatedAt
                        ||
                        ''
                    ]
                );

            }
        );


        const csv =
            lines
                .map(
                    function (line) {


                        return line
                            .map(
                                function (value) {


                                    let text =
                                        String(
                                            value
                                            ??
                                            ''
                                        );


                                    /*
                                     * CSV injection protection.
                                     */

                                    if (
                                        /^[\s]*[=+@-]/
                                            .test(
                                                text
                                            )
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
                                        )
                                        +
                                        '"'
                                    );

                                }
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
            `data-bahan-${new Date().toISOString().slice(0,10)}.csv`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        toast(
            'Data Bahan berhasil diekspor.',
            'success'
        );

    }



    /* =========================================================
       ERROR
    ========================================================= */

    function showFormError(
        message
    ) {


        const element =
            qs(
                '#bahanFormAlert'
            );


        if (!element) {

            return;

        }


        element.textContent =
            message;


        element.hidden =
            false;

    }



    function hideFormError() {


        const element =
            qs(
                '#bahanFormAlert'
            );


        if (!element) {

            return;

        }


        element.hidden =
            true;


        element.textContent =
            '';

    }



    /* =========================================================
       TOAST
    ========================================================= */

    function toast(
        message,
        type = 'success'
    ) {


        const container =
            qs(
                '#bahanToastContainer'
            );


        if (!container) {

            return;

        }


        const box =
            document.createElement(
                'div'
            );


        box.className =
            `bahan-toast ${type}`;


        box.textContent =
            message;


        container.appendChild(
            box
        );


        requestAnimationFrame(
            function () {

                box.classList.add(
                    'show'
                );

            }
        );


        setTimeout(
            function () {


                box.classList.remove(
                    'show'
                );


                setTimeout(
                    function () {

                        box.remove();

                    },
                    220
                );


            },
            3000
        );

    }



    /* =========================================================
       INIT
    ========================================================= */

    function init() {


        updateDateTime();


        window.setInterval(
            updateDateTime,
            1000
        );


        qs(
            '#bahanSearch'
        )
            ?.addEventListener(
                'input',
                function () {


                    currentPage =
                        1;


                    renderTable();

                }
            );


        qs(
            '#bahanPageSize'
        )
            ?.addEventListener(
                'change',
                function () {


                    currentPage =
                        1;


                    renderTable();

                }
            );


        qs(
            '#bahanForm'
        )
            ?.addEventListener(
                'submit',
                submitForm
            );


        /*
        |--------------------------------------------------------------------------
        | ACTION TABLE
        |--------------------------------------------------------------------------
        */

        qs(
            '#bahanTable'
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


                    const row =
                        button.closest(
                            'tr[data-record]'
                        );


                    if (!row) {

                        return;

                    }


                    openModal(
                        button.dataset.action,
                        row
                    );

                }
            );


        /*
        |--------------------------------------------------------------------------
        | KPI HISTORY
        |--------------------------------------------------------------------------
        */

        const activityCard =
            qs(
                '#bahanTotalActivityCard'
            );


        activityCard
            ?.addEventListener(
                'click',
                openHistory
            );


        activityCard
            ?.addEventListener(
                'keydown',
                function (event) {


                    if (
                        event.key === 'Enter'
                        ||
                        event.key === ' '
                    ) {


                        event.preventDefault();


                        openHistory();

                    }

                }
            );


        /*
        |--------------------------------------------------------------------------
        | FILTER HISTORY
        |--------------------------------------------------------------------------
        */

        qsa(
            '[data-bahan-history-filter]'
        )
            .forEach(
                function (button) {


                    button
                        .addEventListener(
                            'click',
                            function () {


                                filterHistory(
                                    button
                                        .dataset
                                        .bahanHistoryFilter
                                );

                            }
                        );

                }
            );


        renderTable();


        refreshIcons();

    }



    /* =========================================================
       GLOBAL FUNCTIONS
    ========================================================= */

    window.openBahanModal =
        function () {

            openModal(
                'add'
            );

        };


    window.closeBahanModal =
        closeModal;


    window.closeBahanActivityModal =
        closeHistory;



    window.resetBahanFilter =
        function () {


            const input =
                qs(
                    '#bahanSearch'
                );


            if (input) {

                input.value =
                    '';

            }


            currentPage =
                1;


            renderTable();

        };



    window.exportBahanCSV =
        exportCsv;



    window.scrollToBahanTable =
        function () {


            qs(
                '.bahan-table-card'
            )
                ?.scrollIntoView(
                    {
                        behavior:
                            'smooth',

                        block:
                            'start'
                    }
                );

        };



    if (
        document.readyState ===
        'loading'
    ) {


        document.addEventListener(
            'DOMContentLoaded',
            init
        );


    } else {


        init();

    }


})();