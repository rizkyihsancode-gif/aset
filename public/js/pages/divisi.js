(function () {

    'use strict';


    /* =========================================================
       STATE
    ========================================================= */

    let divisiCurrentPage = 1;

    let divisiModalMode = 'add';

    let divisiCurrentRow = null;

    let divisiCurrentId = null;

    let divisiChart = null;


    const divisiNumber =
        new Intl.NumberFormat(
            'id-ID'
        );



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
                '#divisiForm input[name="_token"]'
            )
                ?.value
            ||
            ''
        );

    }



    /* =========================================================
       CURRENT DATE / WITA
    ========================================================= */

    function updateDivisiDateTime() {

        const dateElement =
            qs('#divisiCurrentDate');


        const timeElement =
            qs('#divisiCurrentTime');


        if (
            !dateElement ||
            !timeElement
        ) {

            return;

        }


        const now =
            new Date();


        dateElement.textContent =
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


        timeElement.textContent =
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

    function getDivisiRows() {

        return qsa(
            '#divisiTable tbody tr[data-record]'
        );

    }



    /* =========================================================
       FILTERED ROWS
    ========================================================= */

    function getFilteredDivisiRows() {

        const search =
            String(
                qs('#divisiSearch')
                    ?.value
                ||
                ''
            )
                .trim()
                .toLocaleLowerCase(
                    'id-ID'
                );


        const department =
            String(
                qs('#divisiDepartment')
                    ?.value
                ||
                ''
            );


        return getDivisiRows()
            .filter(
                function (row) {

                    const nama =
                        row.dataset.nama
                        ||
                        '';


                    const kode =
                        row.dataset.kode
                        ||
                        '';


                    const namaDepartemen =
                        row.dataset.departemen
                        ||
                        '';


                    const idDep =
                        row.dataset.idDep
                        ||
                        '';


                    const haystack =
                        (
                            nama +
                            ' ' +
                            kode +
                            ' ' +
                            namaDepartemen
                        )
                            .toLocaleLowerCase(
                                'id-ID'
                            );


                    const searchMatch =
                        !search
                        ||
                        haystack.includes(
                            search
                        );


                    const departmentMatch =
                        !department
                        ||
                        idDep ===
                            department;


                    return (
                        searchMatch &&
                        departmentMatch
                    );

                }
            );

    }



    /* =========================================================
       TABLE RENDER
    ========================================================= */

    function renderDivisiTable() {

        const allRows =
            getDivisiRows();


        const filteredRows =
            getFilteredDivisiRows();


        const pageSize =
            Number(
                qs('#divisiPageSize')
                    ?.value
            )
            ||
            10;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filteredRows.length /
                    pageSize
                )
            );


        divisiCurrentPage =
            Math.min(
                Math.max(
                    divisiCurrentPage,
                    1
                ),
                totalPages
            );


        const start =
            (
                divisiCurrentPage -
                1
            )
            *
            pageSize;


        const end =
            start +
            pageSize;


        /*
         * Hide semua data.
         */

        allRows.forEach(
            function (row) {

                row.hidden =
                    true;

            }
        );


        /*
         * Tampilkan data page aktif.
         */

        filteredRows
            .slice(
                start,
                end
            )
            .forEach(
                function (
                    row,
                    index
                ) {

                    row.hidden =
                        false;


                    const number =
                        row.querySelector(
                            '.divisi-number'
                        );


                    if (number) {

                        /*
                         * Data pertama dari server
                         * selalu mendapat nomor 1.
                         */

                        number.textContent =
                            start +
                            index +
                            1;

                    }

                }
            );


        /*
         * Empty filter.
         */

        const empty =
            qs('#divisiEmptyRow');


        if (empty) {

            empty.hidden =
                filteredRows.length !==
                0;

        }


        /*
         * Empty database.
         */

        const serverEmpty =
            qs('#divisiServerEmpty');


        if (serverEmpty) {

            serverEmpty.hidden =
                allRows.length !==
                0;

        }


        renderDivisiTableInfo(
            filteredRows.length,
            start,
            pageSize
        );


        renderDivisiPagination(
            totalPages
        );

    }



    /* =========================================================
       TABLE INFO
    ========================================================= */

    function renderDivisiTableInfo(
        total,
        start,
        size
    ) {

        const element =
            qs('#divisiTableInfo');


        if (!element) {

            return;

        }


        if (
            total === 0
        ) {

            element.textContent =
                'Menampilkan 0 dari 0 data';


            return;

        }


        const from =
            start +
            1;


        const to =
            Math.min(
                start +
                size,
                total
            );


        element.textContent =
            `Menampilkan ${from}–${to} dari ${total} data`;

    }



    /* =========================================================
       PAGINATION
    ========================================================= */

    function renderDivisiPagination(
        totalPages
    ) {

        const container =
            qs('#divisiPagination');


        if (!container) {

            return;

        }


        container.innerHTML =
            '';


        /*
         * Previous.
         */

        container.appendChild(
            createDivisiPageButton(
                '‹',
                divisiCurrentPage -
                    1,
                divisiCurrentPage ===
                    1
            )
        );


        let first =
            Math.max(
                1,
                Math.min(
                    divisiCurrentPage -
                        2,
                    totalPages -
                        4
                )
            );


        if (
            totalPages <
            5
        ) {

            first =
                1;

        }


        const last =
            Math.min(
                totalPages,
                first +
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
                createDivisiPageButton(
                    String(page),
                    page,
                    false,
                    page ===
                        divisiCurrentPage
                )
            );

        }


        /*
         * Next.
         */

        container.appendChild(
            createDivisiPageButton(
                '›',
                divisiCurrentPage +
                    1,
                divisiCurrentPage >=
                    totalPages
            )
        );

    }



    function createDivisiPageButton(
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


            button.setAttribute(
                'aria-current',
                'page'
            );

        }


        if (!disabled) {

            button.addEventListener(
                'click',
                function () {

                    divisiCurrentPage =
                        page;


                    renderDivisiTable();


                    const activeButton =
                        qs(
                            '#divisiPagination [aria-current="page"]'
                        );


                    activeButton
                        ?.focus(
                            {
                                preventScroll:
                                    true
                            }
                        );

                }
            );

        }


        return button;

    }



    /* =========================================================
       FILTER
    ========================================================= */

    function filterDivisiTable() {

        divisiCurrentPage =
            1;


        renderDivisiTable();

    }



    function resetDivisiFilter() {

        const search =
            qs('#divisiSearch');


        const department =
            qs('#divisiDepartment');


        if (search) {

            search.value =
                '';

        }


        if (department) {

            department.value =
                '';

        }


        divisiCurrentPage =
            1;


        renderDivisiTable();

    }



    /* =========================================================
       CHART
    ========================================================= */

    function initDivisiChart() {

        const canvas =
            qs(
                '#divisiDistributionChart'
            );


        if (!canvas) {

            return;

        }


        const legendItems =
            qsa(
                '#divisiLegend [data-count]'
            );


        const labels =
            legendItems.map(
                function (item) {

                    return (
                        item.dataset.label
                        ||
                        ''
                    );

                }
            );


        const counts =
            legendItems.map(
                function (item) {

                    return Number(
                        item.dataset.count
                        ||
                        0
                    );

                }
            );


        const colors =
            legendItems.map(
                function (item) {

                    return (
                        item.dataset.color
                        ||
                        '#9aacbf'
                    );

                }
            );


        const total =
            counts.reduce(
                function (
                    sum,
                    count
                ) {

                    return (
                        sum +
                        count
                    );

                },
                0
            );


        const wrapper =
            canvas.parentElement;


        const centerValue =
            wrapper
                ?.querySelector(
                    '.divisi-chart-center strong'
                );


        if (centerValue) {

            centerValue.textContent =
                divisiNumber.format(
                    total
                );

        }


        if (
            divisiChart &&
            typeof divisiChart.destroy ===
                'function'
        ) {

            divisiChart.destroy();

            divisiChart =
                null;

        }


        /*
         * Fallback bila Chart.js gagal.
         */

        if (
            typeof window.Chart !==
            'function'
        ) {

            let angle =
                0;


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
                                    count /
                                    total
                                )
                                *
                                360
                                : 0;


                        return (
                            `${colors[index]} ${start}deg ${angle}deg`
                        );

                    }
                );


            canvas.hidden =
                true;


            wrapper
                ?.classList
                .add(
                    'divisi-chart-fallback'
                );


            if (wrapper) {

                wrapper.style.background =
                    total
                        ? `conic-gradient(${segments.join(',')})`
                        : '#e7ecf2';

            }


            return;

        }


        canvas.hidden =
            false;


        wrapper
            ?.classList
            .remove(
                'divisi-chart-fallback'
            );


        if (wrapper) {

            wrapper.style.background =
                '';

        }


        divisiChart =
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
                                                `${context.label}: ${divisiNumber.format(context.raw)} divisi`
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
       OPEN CRUD MODAL
    ========================================================= */

    function openDivisiModal(
        mode = 'add',
        row = null
    ) {

        const modal =
            qs('#divisiModal');


        if (!modal) {

            return;

        }


        divisiModalMode =
            mode;


        divisiCurrentRow =
            row;


        divisiCurrentId =
            row
                ? row.dataset.id
                : null;


        const form =
            qs('#divisiForm');


        if (form) {

            form.reset();

        }


        hideDivisiFormError();


        const name =
            qs('#divisiName');


        const code =
            qs('#divisiCode');


        const department =
            qs('#divisiFormDepartemen');


        const title =
            qs('#divisiModalTitle');


        const description =
            qs(
                '#divisiModalDescription'
            );


        const saveButton =
            qs('#divisiSaveButton');


        const saveText =
            qs('#divisiSaveText');


        if (name) {

            name.value =
                row?.dataset.nama
                ||
                '';

        }


        if (code) {

            code.value =
                row?.dataset.kode
                ||
                '';

        }


        if (department) {

            department.value =
                row?.dataset.idDep
                ||
                '';

        }


        const readOnly =
            mode ===
                'view'
            ||
            mode ===
                'delete';


        if (name) {

            name.readOnly =
                readOnly;

        }


        if (code) {

            code.readOnly =
                readOnly;

        }


        if (department) {

            department.disabled =
                readOnly;

        }


        if (saveButton) {

            saveButton.hidden =
                mode ===
                    'view';


            saveButton.disabled =
                false;


            saveButton
                .classList
                .toggle(
                    'divisi-delete-button',
                    mode ===
                        'delete'
                );

        }


        /*
         * ADD.
         */

        if (
            mode ===
            'add'
        ) {

            title.textContent =
                'Tambah Divisi';


            description.textContent =
                'Tambahkan Divisi baru dan hubungkan dengan Departemen.';


            saveText.textContent =
                'Simpan Divisi';

        }


        /*
         * VIEW.
         */

        if (
            mode ===
            'view'
        ) {

            title.textContent =
                'Detail Divisi';


            description.textContent =
                'Informasi data Divisi dan Departemen terkait.';

        }


        /*
         * EDIT.
         */

        if (
            mode ===
            'edit'
        ) {

            title.textContent =
                'Edit Divisi';


            description.textContent =
                'Perbarui informasi Divisi.';


            saveText.textContent =
                'Simpan Perubahan';

        }


        /*
         * DELETE.
         */

        if (
            mode ===
            'delete'
        ) {

            title.textContent =
                'Hapus Divisi';


            description.textContent =
                'Periksa data Divisi sebelum dihapus.';


            saveText.textContent =
                'Hapus Divisi';

        }


        if (!modal.open) {

            modal.showModal();

        }


        document.body
            .classList
            .add(
                'divisi-modal-open'
            );


        refreshIcons();


        if (
            mode ===
            'add'
        ) {

            setTimeout(
                function () {

                    name?.focus();

                },
                40
            );

        }

    }



    /* =========================================================
       CLOSE CRUD MODAL
    ========================================================= */

    function closeDivisiModal() {

        const modal =
            qs('#divisiModal');


        if (
            modal &&
            modal.open
        ) {

            modal.close();

        }


        document.body
            .classList
            .remove(
                'divisi-modal-open'
            );


        divisiModalMode =
            'add';


        divisiCurrentRow =
            null;


        divisiCurrentId =
            null;


        hideDivisiFormError();

    }



    /* =========================================================
       CRUD FORM SUBMIT
    ========================================================= */

    async function submitDivisiForm(
        event
    ) {

        event.preventDefault();


        hideDivisiFormError();


        /*
         * View tidak menyimpan.
         */

        if (
            divisiModalMode ===
            'view'
        ) {

            closeDivisiModal();

            return;

        }


        /*
         * Delete.
         */

        if (
            divisiModalMode ===
            'delete'
        ) {

            await deleteDivisiRecord();

            return;

        }


        const nama =
            String(
                qs('#divisiName')
                    ?.value
                ||
                ''
            ).trim();


        const kode =
            String(
                qs('#divisiCode')
                    ?.value
                ||
                ''
            ).trim();


        const idDep =
            String(
                qs('#divisiFormDepartemen')
                    ?.value
                ||
                ''
            ).trim();


        /*
         * Front-end validation.
         */

        if (!nama) {

            showDivisiFormError(
                'Nama Divisi wajib diisi.'
            );


            qs('#divisiName')
                ?.focus();


            return;

        }


        if (!kode) {

            showDivisiFormError(
                'Kode Divisi wajib diisi.'
            );


            qs('#divisiCode')
                ?.focus();


            return;

        }


        if (!idDep) {

            showDivisiFormError(
                'Departemen wajib dipilih.'
            );


            qs('#divisiFormDepartemen')
                ?.focus();


            return;

        }


        const payload = {

            nama_div:
                nama,

            kode_div:
                kode,

            id_dep:
                Number(
                    idDep
                )

        };


        let url =
            window
                .DIVISI_CRUD
                .store;


        let method =
            'POST';


        if (
            divisiModalMode ===
            'edit'
        ) {

            if (!divisiCurrentId) {

                showDivisiFormError(
                    'ID Divisi tidak ditemukan.'
                );


                return;

            }


            url =
                window
                    .DIVISI_CRUD
                    .update
                    .replace(
                        '__ID__',
                        encodeURIComponent(
                            divisiCurrentId
                        )
                    );


            method =
                'PUT';

        }


        const button =
            qs('#divisiSaveButton');


        const text =
            qs('#divisiSaveText');


        const originalText =
            text?.textContent
            ||
            'Simpan';


        button.disabled =
            true;


        text.textContent =
            'Menyimpan...';


        try {

            const result =
                await divisiRequest(
                    url,
                    method,
                    payload
                );


            showDivisiToast(
                result.message
                ||
                'Data Divisi berhasil disimpan.',
                'success'
            );


            closeDivisiModal();


            /*
             * Reload agar urutan kembali
             * mengikuti query database.
             *
             * created_at terbaru akan
             * menjadi baris pertama.
             */

            setTimeout(
                function () {

                    window.location.reload();

                },
                400
            );


        } catch (error) {

            showDivisiFormError(
                error.message
                ||
                'Divisi gagal disimpan.'
            );


        } finally {

            button.disabled =
                false;


            text.textContent =
                originalText;

        }

    }



    /* =========================================================
       REQUEST
    ========================================================= */

    async function divisiRequest(
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

                const firstError =
                    Object.values(
                        data.errors
                    )
                        .flat()[0];


                if (firstError) {

                    message =
                        firstError;

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

    async function deleteDivisiRecord() {

        if (!divisiCurrentId) {

            showDivisiFormError(
                'ID Divisi tidak ditemukan.'
            );


            return;

        }


        const nama =
            divisiCurrentRow
                ?.dataset
                .nama
            ||
            'Divisi';


        const confirmed =
            window.confirm(
                `Apakah Anda yakin ingin menghapus "${nama}"?`
            );


        if (!confirmed) {

            return;

        }


        const button =
            qs('#divisiSaveButton');


        const text =
            qs('#divisiSaveText');


        button.disabled =
            true;


        text.textContent =
            'Menghapus...';


        try {

            const url =
                window
                    .DIVISI_CRUD
                    .destroy
                    .replace(
                        '__ID__',
                        encodeURIComponent(
                            divisiCurrentId
                        )
                    );


            const result =
                await divisiRequest(
                    url,
                    'DELETE'
                );


            showDivisiToast(
                result.message
                ||
                'Divisi berhasil dihapus.',
                'success'
            );


            closeDivisiModal();


            setTimeout(
                function () {

                    window.location.reload();

                },
                400
            );


        } catch (error) {

            showDivisiFormError(
                error.message
                ||
                'Divisi gagal dihapus.'
            );


        } finally {

            button.disabled =
                false;


            text.textContent =
                'Hapus Divisi';

        }

    }



    /* =========================================================
       FORM ERROR
    ========================================================= */

    function showDivisiFormError(
        message
    ) {

        const alert =
            qs('#divisiFormAlert');


        if (!alert) {

            return;

        }


        alert.textContent =
            message;


        alert.hidden =
            false;

    }



    function hideDivisiFormError() {

        const alert =
            qs('#divisiFormAlert');


        if (!alert) {

            return;

        }


        alert.textContent =
            '';


        alert.hidden =
            true;

    }



    /* =========================================================
       TABLE ACTIONS
    ========================================================= */

    function bindDivisiTableActions() {

        const table =
            qs('#divisiTable');


        if (!table) {

            return;

        }


        table.addEventListener(
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


                openDivisiModal(
                    button.dataset.action,
                    row
                );

            }
        );

    }



    /* =========================================================
       ACTIVITY MODAL
    ========================================================= */

    function openDivisiActivityModal() {

        const modal =
            qs(
                '#divisiActivityModal'
            );


        if (!modal) {

            return;

        }


        filterDivisiHistory(
            'all'
        );


        if (!modal.open) {

            modal.showModal();

        }


        document.body
            .classList
            .add(
                'divisi-modal-open'
            );


        refreshIcons();

    }



    function closeDivisiActivityModal() {

        const modal =
            qs(
                '#divisiActivityModal'
            );


        if (
            modal &&
            modal.open
        ) {

            modal.close();

        }


        document.body
            .classList
            .remove(
                'divisi-modal-open'
            );

    }



    /* =========================================================
       HISTORY FILTER
    ========================================================= */

    function filterDivisiHistory(
        filter
    ) {

        qsa(
            '[data-divisi-history-filter]'
        )
            .forEach(
                function (button) {

                    const active =
                        button
                            .dataset
                            .divisiHistoryFilter
                        ===
                        filter;


                    button
                        .classList
                        .toggle(
                            'active',
                            active
                        );

                }
            );


        const rows =
            qsa(
                '[data-divisi-history-row]'
            );


        let visible =
            0;


        rows.forEach(
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
                            '.divisi-history-number'
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
                '#divisiHistoryFilteredEmpty'
            );


        if (empty) {

            empty.hidden =
                visible !==
                0;

        }


        refreshIcons();

    }



    /* =========================================================
       BIND ACTIVITY
    ========================================================= */

    function bindDivisiActivity() {

        const card =
            qs(
                '#divisiTotalActivityCard'
            );


        card?.addEventListener(
            'click',
            openDivisiActivityModal
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


                    openDivisiActivityModal();

                }

            }
        );


        qsa(
            '[data-divisi-history-filter]'
        )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            filterDivisiHistory(
                                button
                                    .dataset
                                    .divisiHistoryFilter
                            );

                        }
                    );

                }
            );

    }



    /* =========================================================
       EXPORT CSV
    ========================================================= */

    function exportDivisiCSV() {

        const rows =
            getFilteredDivisiRows();


        if (
            rows.length ===
            0
        ) {

            showDivisiToast(
                'Tidak ada data untuk diekspor.',
                'error'
            );


            return;

        }


        const data = [

            [
                'No',
                'Nama Divisi',
                'Kode Divisi',
                'Departemen',
                'Created At',
                'Updated At'
            ]

        ];


        rows.forEach(
            function (
                row,
                index
            ) {

                data.push(
                    [

                        index + 1,

                        row.dataset.nama
                        ||
                        '',

                        row.dataset.kode
                        ||
                        '',

                        row.dataset.departemen
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
            data
                .map(
                    function (row) {

                        return row
                            .map(
                                function (value) {

                                    let text =
                                        String(
                                            value
                                            ??
                                            ''
                                        );


                                    /*
                                     * Proteksi CSV Injection.
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
            `data-divisi-${new Date().toISOString().slice(0, 10)}.csv`;


        document.body
            .appendChild(
                link
            );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showDivisiToast(
            'Data Divisi berhasil diekspor.',
            'success'
        );

    }



    /* =========================================================
       TOAST
    ========================================================= */

    function showDivisiToast(
        message,
        type = 'success'
    ) {

        const container =
            qs('#divisiToastContainer');


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
            `divisi-toast ${type}`;


        const icon =
            document.createElement(
                'div'
            );


        icon.className =
            'divisi-toast-icon';


        icon.innerHTML =
            `<i data-lucide="${
                type ===
                    'error'
                    ? 'circle-alert'
                    : 'circle-check'
            }"></i>`;


        const text =
            document.createElement(
                'span'
            );


        text.textContent =
            message;


        toast.appendChild(
            icon
        );


        toast.appendChild(
            text
        );


        container.appendChild(
            toast
        );


        refreshIcons();


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
       DIALOG BACKDROP / ESCAPE
    ========================================================= */

    function bindDivisiDialogs() {

        const crudModal =
            qs('#divisiModal');


        const historyModal =
            qs(
                '#divisiActivityModal'
            );


        if (crudModal) {

            crudModal.addEventListener(
                'click',
                function (event) {

                    if (
                        event.target !==
                        crudModal
                    ) {

                        return;

                    }


                    const dialog =
                        crudModal
                            .querySelector(
                                '.divisi-modal-dialog'
                            )
                            ?.getBoundingClientRect();


                    if (!dialog) {

                        return;

                    }


                    const inside =
                        event.clientX >=
                            dialog.left
                        &&
                        event.clientX <=
                            dialog.right
                        &&
                        event.clientY >=
                            dialog.top
                        &&
                        event.clientY <=
                            dialog.bottom;


                    if (!inside) {

                        closeDivisiModal();

                    }

                }
            );


            crudModal.addEventListener(
                'cancel',
                function (event) {

                    event.preventDefault();

                    closeDivisiModal();

                }
            );

        }


        if (historyModal) {

            historyModal.addEventListener(
                'click',
                function (event) {

                    if (
                        event.target !==
                        historyModal
                    ) {

                        return;

                    }


                    const dialog =
                        historyModal
                            .querySelector(
                                '.divisi-modal-dialog'
                            )
                            ?.getBoundingClientRect();


                    if (!dialog) {

                        return;

                    }


                    const inside =
                        event.clientX >=
                            dialog.left
                        &&
                        event.clientX <=
                            dialog.right
                        &&
                        event.clientY >=
                            dialog.top
                        &&
                        event.clientY <=
                            dialog.bottom;


                    if (!inside) {

                        closeDivisiActivityModal();

                    }

                }
            );


            historyModal.addEventListener(
                'cancel',
                function (event) {

                    event.preventDefault();

                    closeDivisiActivityModal();

                }
            );

        }

    }



    /* =========================================================
       SCROLL TABLE
    ========================================================= */

    function scrollToDivisiTable() {

        qs('#divisiTable')
            ?.closest(
                '.divisi-table-card'
            )
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

    function initDivisiPage() {

        /*
         * Date.
         */

        updateDivisiDateTime();


        setInterval(
            updateDivisiDateTime,
            1000
        );


        /*
         * Search live.
         */

        qs('#divisiSearch')
            ?.addEventListener(
                'input',
                function () {

                    divisiCurrentPage =
                        1;


                    renderDivisiTable();

                }
            );


        /*
         * Departemen live filter.
         */

        qs('#divisiDepartment')
            ?.addEventListener(
                'change',
                function () {

                    divisiCurrentPage =
                        1;


                    renderDivisiTable();

                }
            );


        /*
         * Page size.
         */

        qs('#divisiPageSize')
            ?.addEventListener(
                'change',
                function () {

                    divisiCurrentPage =
                        1;


                    renderDivisiTable();

                }
            );


        /*
         * CRUD form.
         */

        qs('#divisiForm')
            ?.addEventListener(
                'submit',
                submitDivisiForm
            );


        /*
         * Bind buttons.
         */

        bindDivisiTableActions();

        bindDivisiActivity();

        bindDivisiDialogs();


        /*
         * Render table.
         */

        renderDivisiTable();


        /*
         * Chart.
         */

        initDivisiChart();


        /*
         * Icons.
         */

        refreshIcons();

    }



    /* =========================================================
       GLOBAL FUNCTIONS
    ========================================================= */

    window.openDivisiModal =
        function () {

            openDivisiModal(
                'add'
            );

        };


    window.closeDivisiModal =
        closeDivisiModal;


    window.filterDivisiTable =
        filterDivisiTable;


    window.resetDivisiFilter =
        resetDivisiFilter;


    window.exportDivisiCSV =
        exportDivisiCSV;


    window.closeDivisiActivityModal =
        closeDivisiActivityModal;


    window.scrollToDivisiTable =
        scrollToDivisiTable;



    /* =========================================================
       START
    ========================================================= */

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initDivisiPage
        );

    } else {

        initDivisiPage();

    }

})();