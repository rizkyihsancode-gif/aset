(function () {

    'use strict';


    let currentPage = 1;

    let modalMode = 'add';

    let currentRow = null;

    let currentId = null;

    let previewObjectUrl = null;



    /* =========================================================
       HELPERS
    ========================================================= */

    function qs(
        selector,
        parent = document
    ) {

        return parent
            .querySelector(
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
                '#deptForm input[name="_token"]'
            )
                ?.value
            ||
            ''
        );

    }


    function refreshIcons() {

        if (
            window.lucide &&
            typeof window.lucide.createIcons ===
            'function'
        ) {

            window.lucide
                .createIcons();

        }

    }



    /* =========================================================
       TABLE ROWS
    ========================================================= */

    function rows() {

        return qsa(
            '#deptTable tbody tr[data-record]'
        );

    }



    /* =========================================================
       FILTER
    ========================================================= */

    function filteredRows() {

        const keyword =
            String(
                qs('#deptSearch')
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

                    const haystack = [

                        row.dataset.kode,

                        row.dataset.nama,

                        row.dataset.role,

                        row.dataset.img

                    ]
                        .join(' ')
                        .toLocaleLowerCase(
                            'id-ID'
                        );


                    return (
                        !keyword ||
                        haystack.includes(
                            keyword
                        )
                    );

                }
            );

    }



    /* =========================================================
       RENDER TABLE
    ========================================================= */

    function renderTable() {

        const allRows =
            rows();


        const filtered =
            filteredRows();


        const pageSize =
            Number(
                qs('#deptPageSize')
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


        const end =
            start +
            pageSize;


        /*
         * Hide semua record.
         */

        allRows.forEach(
            function (row) {

                row.hidden =
                    true;

            }
        );


        /*
         * Tampilkan page aktif.
         */

        filtered
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


                    const no =
                        row.querySelector(
                            '.dept-number'
                        );


                    if (no) {

                        no.textContent =
                            start +
                            index +
                            1;

                    }

                }
            );


        /*
         * Empty search.
         */

        const empty =
            qs('#deptEmptyRow');


        if (empty) {

            empty.hidden =
                filtered.length !==
                0;

        }


        /*
         * Empty database.
         */

        const serverEmpty =
            qs('#deptServerEmpty');


        if (serverEmpty) {

            serverEmpty.hidden =
                allRows.length !==
                0;

        }


        /*
         * Info.
         */

        updateTableInfo(
            filtered.length,
            start,
            pageSize
        );


        /*
         * Pagination.
         */

        renderPagination(
            totalPages
        );

    }



    /* =========================================================
       TABLE INFO
    ========================================================= */

    function updateTableInfo(
        total,
        start,
        size
    ) {

        const element =
            qs('#deptTableInfo');


        if (!element) {

            return;
        }


        if (!total) {

            element.textContent =
                'Tidak ada data';

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

    function renderPagination(
        totalPages
    ) {

        const container =
            qs('#deptPagination');


        if (!container) {

            return;
        }


        container.innerHTML =
            '';


        /*
         * Previous.
         */

        container.appendChild(
            createPageButton(
                '‹',
                currentPage -
                    1,
                currentPage ===
                    1
            )
        );


        /*
         * Tentukan range.
         */

        let startPage =
            Math.max(
                1,
                currentPage -
                    2
            );


        let endPage =
            Math.min(
                totalPages,
                startPage +
                    4
            );


        startPage =
            Math.max(
                1,
                endPage -
                    4
            );


        for (
            let page =
                startPage;
            page <=
                endPage;
            page++
        ) {

            container.appendChild(
                createPageButton(
                    String(page),
                    page,
                    false,
                    page ===
                        currentPage
                )
            );

        }


        /*
         * Next.
         */

        container.appendChild(
            createPageButton(
                '›',
                currentPage +
                    1,
                currentPage >=
                    totalPages
            )
        );


        refreshIcons();

    }



    function createPageButton(
        label,
        page,
        disabled,
        active =
            false
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
       RESET
    ========================================================= */

    function resetFilter() {

        const search =
            qs('#deptSearch');


        if (search) {

            search.value =
                '';

        }


        currentPage =
            1;


        renderTable();

    }



    /* =========================================================
       IMAGE PREVIEW
    ========================================================= */

    function setImagePreview(
        url
    ) {

        const image =
            qs(
                '#deptImagePreviewImg'
            );


        const empty =
            qs(
                '#deptImagePreviewEmpty'
            );


        if (
            !image ||
            !empty
        ) {

            return;
        }


        if (url) {

            image.src =
                url;


            image.hidden =
                false;


            empty.hidden =
                true;

        } else {

            image.src =
                '';


            image.hidden =
                true;


            empty.hidden =
                false;

        }

    }



    function bindImageInput() {

        const input =
            qs('#deptImage');


        if (!input) {

            return;
        }


        input.addEventListener(
            'change',
            function () {

                hideFormError();


                const file =
                    input.files?.[0];


                if (!file) {

                    return;
                }


                if (
                    !file.type.startsWith(
                        'image/'
                    )
                ) {

                    showFormError(
                        'File harus berupa image.'
                    );


                    input.value =
                        '';


                    return;
                }


                if (
                    file.size >
                    2 *
                    1024 *
                    1024
                ) {

                    showFormError(
                        'Ukuran image maksimal 2 MB.'
                    );


                    input.value =
                        '';


                    return;
                }


                if (
                    previewObjectUrl
                ) {

                    URL.revokeObjectURL(
                        previewObjectUrl
                    );

                }


                previewObjectUrl =
                    URL.createObjectURL(
                        file
                    );


                setImagePreview(
                    previewObjectUrl
                );

            }
        );

    }



    /* =========================================================
       CRUD MODAL
    ========================================================= */

    function openModal(
        mode = 'add',
        row = null
    ) {

        const dialog =
            qs('#deptModal');


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


        const form =
            qs('#deptForm');


        if (form) {

            form.reset();

        }


        hideFormError();


        /*
         * Reset preview object URL.
         */

        if (
            previewObjectUrl
        ) {

            URL.revokeObjectURL(
                previewObjectUrl
            );


            previewObjectUrl =
                null;
        }


        /*
         * Elements.
         */

        const code =
            qs('#deptCode');

        const name =
            qs('#deptName');

        const role =
            qs('#deptRole');

        const image =
            qs('#deptImage');

        const currentImage =
            qs('#deptCurrentImage');

        const title =
            qs('#deptModalTitle');

        const description =
            qs(
                '#deptModalDescription'
            );

        const saveButton =
            qs('#deptSaveButton');

        const saveText =
            qs('#deptSaveText');


        /*
         * Database legacy:
         *
         * nama_dep = Kode
         * kode_dep = Nama
         */

        if (code) {

            code.value =
                row?.dataset.kode
                ||
                '';

        }


        if (name) {

            name.value =
                row?.dataset.nama
                ||
                '';

        }


        if (role) {

            role.value =
                row?.dataset.role
                ||
                '';

        }


        if (image) {

            image.value =
                '';

        }


        /*
         * Existing image.
         */

        const existingImageUrl =
            row?.dataset.imgUrl
            ||
            '';


        setImagePreview(
            existingImageUrl
        );


        if (currentImage) {

            currentImage.textContent =
                row?.dataset.img
                    ? `Image saat ini: ${row.dataset.img}`
                    : '';
        }


        /*
         * View / delete readonly.
         */

        const readonly =
            mode ===
                'view'
            ||
            mode ===
                'delete';


        if (code) {

            code.readOnly =
                readonly;

        }


        if (name) {

            name.readOnly =
                readonly;

        }


        if (role) {

            role.readOnly =
                readonly;

        }


        if (image) {

            image.disabled =
                readonly;

        }


        /*
         * Reset button.
         */

        if (saveButton) {

            saveButton.hidden =
                mode ===
                    'view';


            saveButton.disabled =
                false;


            saveButton
                .classList
                .toggle(
                    'dept-delete-button',
                    mode ===
                        'delete'
                );

        }


        /*
         * ADD
         */

        if (
            mode ===
            'add'
        ) {

            title.textContent =
                'Tambah Departemen';


            description.textContent =
                'Tambahkan data Departemen baru.';


            saveText.textContent =
                'Simpan Departemen';

        }


        /*
         * VIEW
         */

        if (
            mode ===
            'view'
        ) {

            title.textContent =
                'Detail Departemen';


            description.textContent =
                'Informasi lengkap Departemen.';

        }


        /*
         * EDIT
         */

        if (
            mode ===
            'edit'
        ) {

            title.textContent =
                'Edit Departemen';


            description.textContent =
                'Perbarui data Departemen.';


            saveText.textContent =
                'Simpan Perubahan';

        }


        /*
         * DELETE
         */

        if (
            mode ===
            'delete'
        ) {

            title.textContent =
                'Hapus Departemen';


            description.textContent =
                'Konfirmasi penghapusan Departemen.';


            saveText.textContent =
                'Hapus Departemen';

        }


        /*
         * Open dialog.
         */

        if (!dialog.open) {

            dialog.showModal();

        }


        document.body
            .classList
            .add(
                'dept-modal-open'
            );


        refreshIcons();

    }



    function closeModal() {

        const dialog =
            qs('#deptModal');


        if (
            dialog &&
            dialog.open
        ) {

            dialog.close();

        }


        document.body
            .classList
            .remove(
                'dept-modal-open'
            );


        modalMode =
            'add';


        currentId =
            null;


        currentRow =
            null;


        hideFormError();

    }



    /* =========================================================
       FORM SUBMIT
    ========================================================= */

    async function submitForm(
        event
    ) {

        event.preventDefault();


        hideFormError();


        /*
         * VIEW tidak submit.
         */

        if (
            modalMode ===
            'view'
        ) {

            closeModal();

            return;
        }


        /*
         * DELETE.
         */

        if (
            modalMode ===
            'delete'
        ) {

            await deleteRecord();

            return;
        }


        /*
         * Fields.
         */

        const code =
            String(
                qs('#deptCode')
                    ?.value
                ||
                ''
            ).trim();


        const name =
            String(
                qs('#deptName')
                    ?.value
                ||
                ''
            ).trim();


        const role =
            String(
                qs('#deptRole')
                    ?.value
                ||
                ''
            ).trim();


        if (!code) {

            showFormError(
                'Kode Departemen wajib diisi.'
            );


            qs('#deptCode')
                ?.focus();


            return;
        }


        if (!name) {

            showFormError(
                'Nama Departemen wajib diisi.'
            );


            qs('#deptName')
                ?.focus();


            return;
        }


        /*
         * FormData diperlukan karena image.
         */

        const formData =
            new FormData();


        /*
         * Mapping database legacy:
         *
         * nama_dep = kode
         * kode_dep = nama
         */

        formData.append(
            'nama_dep',
            code
        );


        formData.append(
            'kode_dep',
            name
        );


        formData.append(
            'role',
            role
        );


        const image =
            qs('#deptImage')
                ?.files?.[0];


        if (image) {

            formData.append(
                'img',
                image
            );

        }


        /*
         * Endpoint.
         */

        let url =
            window
                .DEPARTEMEN_CRUD
                .store;


        if (
            modalMode ===
            'edit'
        ) {

            url =
                window
                    .DEPARTEMEN_CRUD
                    .update
                    .replace(
                        '__ID__',
                        encodeURIComponent(
                            currentId
                        )
                    );


            /*
             * Multipart PUT Laravel:
             * POST + _method PUT.
             */

            formData.append(
                '_method',
                'PUT'
            );

        }


        /*
         * Button loading.
         */

        const saveButton =
            qs('#deptSaveButton');


        const saveText =
            qs('#deptSaveText');


        const originalText =
            saveText
                ?.textContent
            ||
            'Simpan';


        saveButton.disabled =
            true;


        saveText.textContent =
            'Menyimpan...';


        try {

            const response =
                await requestForm(
                    url,
                    formData
                );


            showToast(
                response.message
                ||
                'Data Departemen berhasil disimpan.',
                'success'
            );


            closeModal();


            /*
             * Reload supaya database menjadi source of truth.
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
                ||
                'Departemen gagal disimpan.'
            );


        } finally {

            saveButton.disabled =
                false;


            saveText.textContent =
                originalText;

        }

    }



    /* =========================================================
       REQUEST FORM DATA
    ========================================================= */

    async function requestForm(
        url,
        formData
    ) {

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
                            csrfToken()

                    },

                    credentials:
                        'same-origin',

                    body:
                        formData

                }
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


            /*
             * Laravel validation.
             */

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

    async function deleteRecord() {

        if (!currentId) {

            showFormError(
                'ID Departemen tidak ditemukan.'
            );


            return;
        }


        const departmentName =
            currentRow?.dataset.nama
            ||
            'Departemen';


        const confirmed =
            window.confirm(
                `Hapus Departemen "${departmentName}"?`
            );


        if (!confirmed) {

            return;
        }


        const button =
            qs('#deptSaveButton');


        const text =
            qs('#deptSaveText');


        button.disabled =
            true;


        text.textContent =
            'Menghapus...';


        try {

            const url =
                window
                    .DEPARTEMEN_CRUD
                    .destroy
                    .replace(
                        '__ID__',
                        encodeURIComponent(
                            currentId
                        )
                    );


            const response =
                await fetch(
                    url,
                    {

                        method:
                            'DELETE',

                        headers: {

                            'Accept':
                                'application/json',

                            'X-Requested-With':
                                'XMLHttpRequest',

                            'X-CSRF-TOKEN':
                                csrfToken()

                        },

                        credentials:
                            'same-origin'

                    }
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

                throw new Error(
                    data.message
                    ||
                    `Delete gagal (${response.status}).`
                );

            }


            showToast(
                data.message
                ||
                'Departemen berhasil dihapus.',
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
                ||
                'Departemen gagal dihapus.'
            );


        } finally {

            button.disabled =
                false;


            text.textContent =
                'Hapus Departemen';

        }

    }



    /* =========================================================
       ACTIVITY MODAL
    ========================================================= */

    function openActivityModal() {

        const dialog =
            qs(
                '#departemenActivityModal'
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


        document.body
            .classList
            .add(
                'dept-modal-open'
            );


        refreshIcons();

    }



    function closeActivityModal() {

        const dialog =
            qs(
                '#departemenActivityModal'
            );


        if (
            dialog &&
            dialog.open
        ) {

            dialog.close();

        }


        document.body
            .classList
            .remove(
                'dept-modal-open'
            );

    }



    /* =========================================================
       HISTORY FILTER
    ========================================================= */

    function filterHistory(
        filter
    ) {

        /*
         * Buttons.
         */

        qsa(
            '[data-dept-history-filter]'
        )
            .forEach(
                function (button) {

                    button
                        .classList
                        .toggle(
                            'active',

                            button
                                .dataset
                                .deptHistoryFilter
                                ===
                                filter
                        );

                }
            );


        /*
         * Rows.
         */

        const historyRows =
            qsa(
                '[data-dept-history-row]'
            );


        let visible =
            0;


        historyRows
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
                                '.dept-history-number'
                            );


                        if (number) {

                            number.textContent =
                                visible;

                        }

                    }

                }
            );


        /*
         * Empty filtered state.
         */

        const empty =
            qs(
                '#deptHistoryFilteredEmpty'
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

    function bindActivity() {

        const card =
            qs(
                '#departemenTotalActivityCard'
            );


        /*
         * Mouse.
         */

        card?.addEventListener(
            'click',
            openActivityModal
        );


        /*
         * Keyboard accessibility.
         */

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


        /*
         * Filter buttons.
         */

        qsa(
            '[data-dept-history-filter]'
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
                                        .deptHistoryFilter
                                );

                            }
                        );

                }
            );

    }



    /* =========================================================
       EXPORT CSV
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


        const csvRows = [

            [
                'No',
                'Kode Departemen',
                'Nama Departemen',
                'Role',
                'Image',
                'Created At'
            ]

        ];


        data.forEach(
            function (
                row,
                index
            ) {

                csvRows.push(
                    [

                        index + 1,

                        row.dataset.kode
                        ||
                        '',

                        row.dataset.nama
                        ||
                        '',

                        row.dataset.role
                        ||
                        '',

                        row.dataset.img
                        ||
                        '',

                        row.dataset.createdAt
                        ||
                        ''

                    ]
                );

            }
        );


        const csv =
            csvRows
                .map(
                    function (row) {

                        return row
                            .map(
                                function (value) {

                                    /*
                                     * Proteksi CSV injection.
                                     */

                                    let text =
                                        String(
                                            value ??
                                            ''
                                        );


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
            `data-departemen-${new Date().toISOString().slice(0, 10)}.csv`;


        document.body
            .appendChild(
                link
            );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }



    /* =========================================================
       FORM ERROR
    ========================================================= */

    function showFormError(
        message
    ) {

        const element =
            qs('#deptFormAlert');


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
            qs('#deptFormAlert');


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
            qs('#deptToastContainer');


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
            `dept-toast ${type}`;


        const icon =
            document.createElement(
                'div'
            );


        icon.className =
            'dept-toast-icon';


        icon.innerHTML =
            `<i data-lucide="${
                type === 'error'
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
       TABLE ACTIONS
    ========================================================= */

    function bindTableActions() {

        const table =
            qs('#deptTable');


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


                openModal(
                    button.dataset.action,
                    row
                );

            }
        );

    }



    /* =========================================================
       DIALOG BACKDROP
    ========================================================= */

    function bindDialogBackdrop() {

        const dialogs = [

            qs('#deptModal'),

            qs(
                '#departemenActivityModal'
            )

        ];


        dialogs.forEach(
            function (dialog) {

                if (!dialog) {

                    return;
                }


                dialog.addEventListener(
                    'click',
                    function (event) {

                        if (
                            event.target !==
                            dialog
                        ) {

                            return;
                        }


                        const box =
                            dialog
                                .querySelector(
                                    '.dept-modal'
                                )
                                ?.getBoundingClientRect();


                        if (!box) {

                            return;
                        }


                        const inside =
                            event.clientX >=
                                box.left
                            &&
                            event.clientX <=
                                box.right
                            &&
                            event.clientY >=
                                box.top
                            &&
                            event.clientY <=
                                box.bottom;


                        if (!inside) {

                            if (
                                dialog.id ===
                                'deptModal'
                            ) {

                                closeModal();

                            } else {

                                closeActivityModal();

                            }

                        }

                    }
                );

            }
        );

    }



    /* =========================================================
       INIT
    ========================================================= */

    function init() {

        /*
         * Search.
         */

        qs('#deptSearch')
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

        qs('#deptPageSize')
            ?.addEventListener(
                'change',
                function () {

                    currentPage =
                        1;


                    renderTable();

                }
            );


        /*
         * CRUD table buttons.
         */

        bindTableActions();


        /*
         * Form.
         */

        qs('#deptForm')
            ?.addEventListener(
                'submit',
                submitForm
            );


        /*
         * Image preview.
         */

        bindImageInput();


        /*
         * KPI Activity.
         */

        bindActivity();


        /*
         * Backdrop.
         */

        bindDialogBackdrop();


        /*
         * First render.
         */

        renderTable();


        refreshIcons();

    }



    /* =========================================================
       GLOBAL FUNCTIONS
    ========================================================= */

    window.openDeptModal =
        function () {

            openModal(
                'add'
            );

        };


    window.closeDeptModal =
        closeModal;


    window.resetDeptFilter =
        resetFilter;


    window.exportDeptCSV =
        exportCSV;


    window.closeDepartemenActivityModal =
        closeActivityModal;



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