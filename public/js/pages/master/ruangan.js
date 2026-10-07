(function () {

    'use strict';


    let currentPage = 1;

    let modalMode = 'add';

    let currentRow = null;

    let currentId = null;



    /* =========================================================
       HELPERS
    ========================================================= */

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
            window.lucide &&
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
                '#ruanganForm input[name="_token"]'
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
            qs('#ruanganCurrentDate');


        const time =
            qs('#ruanganCurrentTime');


        if (
            !date ||
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
            ).format(
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
            '#ruanganTable tbody tr[data-record]'
        );

    }



    /* =========================================================
       FILTER
    ========================================================= */

    function filteredRows() {

        const keyword =
            String(
                qs('#ruanganSearch')
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

                    const text =
                        [
                            row.dataset.kode,
                            row.dataset.nama
                        ]
                            .join(' ')
                            .toLocaleLowerCase(
                                'id-ID'
                            );


                    return (
                        !keyword ||
                        text.includes(
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
                qs('#ruanganPageSize')
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
                start +
                    pageSize
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
                            '.ruangan-number'
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
            qs('#ruanganEmptyRow');


        if (empty) {

            empty.hidden =
                filtered.length !==
                0;

        }


        const serverEmpty =
            qs('#ruanganServerEmpty');


        if (serverEmpty) {

            serverEmpty.hidden =
                all.length !==
                0;

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
            qs('#ruanganTableInfo');


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



    /* =========================================================
       PAGINATION
    ========================================================= */

    function renderPagination(
        totalPages
    ) {

        const container =
            qs('#ruanganPagination');


        if (!container) {

            return;

        }


        container.innerHTML =
            '';


        container.appendChild(
            pageButton(
                '‹',
                currentPage -
                    1,
                currentPage ===
                    1
            )
        );


        let first =
            Math.max(
                1,
                currentPage -
                    2
            );


        let last =
            Math.min(
                totalPages,
                first +
                    4
            );


        first =
            Math.max(
                1,
                last -
                    4
            );


        for (
            let page =
                first;
            page <=
                last;
            page++
        ) {

            container.appendChild(
                pageButton(
                    String(page),
                    page,
                    false,
                    page ===
                        currentPage
                )
            );

        }


        container.appendChild(
            pageButton(
                '›',
                currentPage +
                    1,
                currentPage >=
                    totalPages
            )
        );

    }



    function pageButton(
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
       FILTER GLOBAL
    ========================================================= */

    function filterTable() {

        currentPage =
            1;


        renderTable();

    }



    function resetFilter() {

        const input =
            qs('#ruanganSearch');


        if (input) {

            input.value =
                '';

        }


        currentPage =
            1;


        renderTable();

    }



    /* =========================================================
       MODAL CRUD
    ========================================================= */

    function openModal(
        mode = 'add',
        row = null
    ) {

        const dialog =
            qs('#ruanganModal');


        if (!dialog) {

            return;

        }


        modalMode =
            mode;


        currentRow =
            row;


        currentId =
            row
                ? row.dataset.id
                : null;


        qs('#ruanganForm')
            ?.reset();


        hideFormError();


        const name =
            qs('#ruanganName');


        const code =
            qs('#ruanganCode');


        const title =
            qs('#ruanganModalTitle');


        const description =
            qs(
                '#ruanganModalDescription'
            );


        const button =
            qs('#ruanganSaveButton');


        const buttonText =
            qs('#ruanganSaveText');


        if (name) {

            name.value =
                row?.dataset.nama
                ||
                '';

        }


        if (code) {

            code.value =
                row?.dataset.kode ===
                    '-'
                    ? ''
                    : (
                        row?.dataset.kode
                        ||
                        ''
                    );

        }


        const readonly =
            mode ===
                'view'
            ||
            mode ===
                'delete';


        if (name) {

            name.readOnly =
                readonly;

        }


        if (code) {

            code.readOnly =
                readonly;

        }


        if (button) {

            button.hidden =
                mode ===
                    'view';


            button.disabled =
                false;


            button
                .classList
                .toggle(
                    'ruangan-delete-button',
                    mode ===
                        'delete'
                );

        }


        if (
            mode ===
            'add'
        ) {

            title.textContent =
                'Tambah Ruangan';


            description.textContent =
                'Tambahkan data master Ruangan baru.';


            buttonText.textContent =
                'Simpan Ruangan';

        }


        if (
            mode ===
            'view'
        ) {

            title.textContent =
                'Detail Ruangan';


            description.textContent =
                'Informasi lengkap data Ruangan.';

        }


        if (
            mode ===
            'edit'
        ) {

            title.textContent =
                'Edit Ruangan';


            description.textContent =
                'Perbarui data master Ruangan.';


            buttonText.textContent =
                'Simpan Perubahan';

        }


        if (
            mode ===
            'delete'
        ) {

            title.textContent =
                'Hapus Ruangan';


            description.textContent =
                'Periksa data sebelum menghapus Ruangan.';


            buttonText.textContent =
                'Hapus Ruangan';

        }


        if (!dialog.open) {

            dialog.showModal();

        }


        refreshIcons();

    }



    function closeModal() {

        const dialog =
            qs('#ruanganModal');


        if (
            dialog &&
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
       SUBMIT
    ========================================================= */

    async function submitForm(
        event
    ) {

        event.preventDefault();


        hideFormError();


        if (
            modalMode ===
            'view'
        ) {

            closeModal();

            return;

        }


        if (
            modalMode ===
            'delete'
        ) {

            await deleteRecord();

            return;

        }


        const nama =
            String(
                qs('#ruanganName')
                    ?.value
                ||
                ''
            ).trim();


        const kode =
            String(
                qs('#ruanganCode')
                    ?.value
                ||
                ''
            ).trim();


        if (!nama) {

            showFormError(
                'Nama Ruangan wajib diisi.'
            );


            qs('#ruanganName')
                ?.focus();


            return;

        }


        const payload = {

            nama_ruang:
                nama,

            kode:
                kode

        };


        let url =
            window
                .RUANGAN_CRUD
                .store;


        let method =
            'POST';


        if (
            modalMode ===
            'edit'
        ) {

            url =
                window
                    .RUANGAN_CRUD
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
            qs('#ruanganSaveButton');


        const text =
            qs('#ruanganSaveText');


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


            showToast(
                result.message
                ||
                'Data berhasil disimpan.',
                'success'
            );


            closeModal();


            /*
             * Reload agar database kembali
             * menjadi source of truth.
             */

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
       REQUEST
    ========================================================= */

    async function request(
        url,
        method,
        payload = null
    ) {

        const options = {

            method:
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
            payload !==
            null
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
                response.status ===
                    422
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
       DELETE
    ========================================================= */

    async function deleteRecord() {

        if (!currentId) {

            showFormError(
                'ID Ruangan tidak ditemukan.'
            );


            return;

        }


        const confirmed =
            window.confirm(
                `Apakah Anda yakin ingin menghapus "${currentRow?.dataset.nama || 'Ruangan'}"?`
            );


        if (!confirmed) {

            return;

        }


        const button =
            qs('#ruanganSaveButton');


        const text =
            qs('#ruanganSaveText');


        button.disabled =
            true;


        text.textContent =
            'Menghapus...';


        try {

            const url =
                window
                    .RUANGAN_CRUD
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


            showToast(
                result.message
                ||
                'Ruangan berhasil dihapus.',
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
                'Hapus Ruangan';

        }

    }



    /* =========================================================
       HISTORY MODAL
    ========================================================= */

    function openActivityModal() {

        const dialog =
            qs(
                '#ruanganActivityModal'
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



    function closeActivityModal() {

        const dialog =
            qs(
                '#ruanganActivityModal'
            );


        if (
            dialog &&
            dialog.open
        ) {

            dialog.close();

        }

    }



    function filterHistory(
        filter
    ) {

        qsa(
            '[data-ruangan-history-filter]'
        )
            .forEach(
                function (button) {

                    button
                        .classList
                        .toggle(
                            'active',
                            button
                                .dataset
                                .ruanganHistoryFilter
                                ===
                                filter
                        );

                }
            );


        let visible =
            0;


        qsa(
            '[data-ruangan-history-row]'
        )
            .forEach(
                function (row) {

                    const show =
                        filter ===
                            'all'
                        ||
                        row.dataset.action ===
                            filter;


                    row.hidden =
                        !show;


                    if (show) {

                        visible++;


                        const number =
                            row.querySelector(
                                '.ruangan-history-number'
                            );


                        if (number) {

                            number.textContent =
                                visible;

                        }

                    }

                }
            );


        const empty =
            qs(
                '#ruanganHistoryFilteredEmpty'
            );


        if (empty) {

            empty.hidden =
                visible !==
                0;

        }


        refreshIcons();

    }



    /* =========================================================
       EXPORT
    ========================================================= */

    function exportCSV() {

        const data =
            filteredRows();


        if (!data.length) {

            showToast(
                'Tidak ada data untuk diekspor.',
                'error'
            );


            return;

        }


        const lines = [

            [
                'No',
                'Kode Ruangan',
                'Nama Ruangan',
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

                        row.dataset.kode
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
                                     * CSV Injection protection.
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
                                        ) +
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
            `data-ruangan-${new Date().toISOString().slice(0, 10)}.csv`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showToast(
            'Data Ruangan berhasil diekspor.',
            'success'
        );

    }



    /* =========================================================
       FORM ERROR
    ========================================================= */

    function showFormError(
        message
    ) {

        const element =
            qs('#ruanganFormAlert');


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
            qs('#ruanganFormAlert');


        if (!element) {

            return;

        }


        element.textContent =
            '';


        element.hidden =
            true;

    }



    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(
        message,
        type = 'success'
    ) {

        const container =
            qs('#ruanganToastContainer');


        if (!container) {

            window.alert(
                message
            );


            return;

        }


        const toast =
            document.createElement(
                'div'
            );


        toast.className =
            `ruangan-toast ${type}`;


        toast.textContent =
            message;


        container.appendChild(
            toast
        );


        requestAnimationFrame(
            function () {

                toast.classList.add(
                    'show'
                );

            }
        );


        setTimeout(
            function () {

                toast.classList.remove(
                    'show'
                );


                setTimeout(
                    function () {

                        toast.remove();

                    },
                    250
                );

            },
            3000
        );

    }



    /* =========================================================
       TABLE ACTION
    ========================================================= */

    function bindTableActions() {

        qs('#ruanganTable')
            ?.addEventListener(
                'click',
                function (event) {

                    const button =
                        event
                            .target
                            .closest(
                                'button[data-action]'
                            );


                    if (!button) {

                        return;

                    }


                    const row =
                        button
                            .closest(
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

    }



    /* =========================================================
       ACTIVITY
    ========================================================= */

    function bindActivity() {

        const card =
            qs(
                '#ruanganTotalActivityCard'
            );


        card?.addEventListener(
            'click',
            openActivityModal
        );


        card?.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key ===
                        'Enter'
                    ||
                    event.key ===
                        ' '
                ) {

                    event.preventDefault();


                    openActivityModal();

                }

            }
        );


        qsa(
            '[data-ruangan-history-filter]'
        )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            filterHistory(
                                button
                                    .dataset
                                    .ruanganHistoryFilter
                            );

                        }
                    );

                }
            );

    }



    /* =========================================================
       SCROLL
    ========================================================= */

    function scrollToTable() {

        qs('.ruangan-table-card')
            ?.scrollIntoView(
                {

                    behavior:
                        'smooth',

                    block:
                        'start'

                }
            );

    }



    /* =========================================================
       INIT
    ========================================================= */

    function init() {

        /*
         * Date.
         */

        updateDateTime();


        setInterval(
            updateDateTime,
            1000
        );


        /*
         * Search.
         */

        qs('#ruanganSearch')
            ?.addEventListener(
                'input',
                function () {

                    currentPage =
                        1;


                    renderTable();

                }
            );


        /*
         * Page size.
         */

        qs('#ruanganPageSize')
            ?.addEventListener(
                'change',
                function () {

                    currentPage =
                        1;


                    renderTable();

                }
            );


        /*
         * Form.
         */

        qs('#ruanganForm')
            ?.addEventListener(
                'submit',
                submitForm
            );


        bindTableActions();

        bindActivity();


        renderTable();

        refreshIcons();

    }



    /* =========================================================
       GLOBAL
    ========================================================= */

    window.openRuanganModal =
        function () {

            openModal(
                'add'
            );

        };


    window.closeRuanganModal =
        closeModal;


    window.filterRuanganTable =
        filterTable;


    window.resetRuanganFilter =
        resetFilter;


    window.exportRuanganCSV =
        exportCSV;


    window.closeRuanganActivityModal =
        closeActivityModal;


    window.scrollToRuanganTable =
        scrollToTable;



    /* =========================================================
       START
    ========================================================= */

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