
/*
|--------------------------------------------------------------------------
| MASTER DATA — DEPARTEMEN
| SISTEM ASET PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| Kontrak database legacy:
|
| nama_dep = Kode Departemen
| kode_dep = Nama Departemen
|
| Tabel utama:
|
| No. | Kode Departemen | Nama Departemen | Dibuat | Aksi
|
| Fitur yang dipertahankan:
|
| - Search data
| - Pagination 10 / 25 / 50
| - Reset filter
| - View Departemen
| - Tambah Departemen
| - Edit Departemen
| - Hapus Departemen
| - Validasi form
| - AJAX Laravel
| - CSRF Token
| - Upload image
| - Preview image
| - Image yang sudah tersimpan
| - Role Departemen
| - Export CSV
| - Riwayat perubahan
| - Filter riwayat
| - Toast notification
| - Modal dialog
| - Backdrop dan Escape
|
|--------------------------------------------------------------------------
*/

(function () {

    'use strict';

    /* =========================================================
       GLOBAL STATE
    ========================================================= */

    let currentPage = 1;

    let modalMode = 'add';

    let currentRow = null;

    let currentId = null;

    let previewObjectUrl = null;

    let isSubmitting = false;

    let toastTimer = null;

    /* =========================================================
       HELPERS
    ========================================================= */

    function qs(
        selector,
        parent = document
    ) {

        return parent.querySelector(selector);

    }

    function qsa(
        selector,
        parent = document
    ) {

        return Array.from(
            parent.querySelectorAll(selector)
        );

    }

    function csrfToken() {

        return (
            qs('meta[name="csrf-token"]')
                ?.getAttribute('content')
            ||
            qs('#deptForm input[name="_token"]')
                ?.value
            ||
            ''
        );

    }

    function refreshIcons() {

        if (
            window.lucide &&
            typeof window.lucide.createIcons === 'function'
        ) {

            window.lucide.createIcons();

        }

    }

    function normalize(value) {

        return String(value ?? '')
            .trim()
            .toLocaleLowerCase('id-ID');

    }

    function getRoutes() {

        return window.DEPARTEMEN_CRUD || {};

    }

    function routeWithId(template, id) {

        if (!template || !id) {
            return null;
        }

        return String(template).replace(
            '__ID__',
            encodeURIComponent(String(id))
        );

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

        const keyword = normalize(
            qs('#deptSearch')?.value
        );

        return rows().filter(function (row) {

            /*
             * Hanya Kode dan Nama yang dicari.
             * Role dan Image tidak tampil di tabel.
             */

            const haystack = [

                row.dataset.kode,

                row.dataset.nama

            ].join(' ');

            return (
                !keyword ||
                normalize(haystack).includes(keyword)
            );

        });

    }

    /* =========================================================
       RENDER TABLE
    ========================================================= */

    function renderTable() {

        const allRows = rows();

        const filtered = filteredRows();

        const pageSize = Math.max(
            1,
            Number(qs('#deptPageSize')?.value) || 10
        );

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / pageSize)
        );

        currentPage = Math.min(
            Math.max(currentPage, 1),
            totalPages
        );

        const start =
            (currentPage - 1) * pageSize;

        const end =
            start + pageSize;

        /*
         * Sembunyikan semua baris record.
         */

        allRows.forEach(function (row) {

            row.hidden = true;

        });

        /*
         * Tampilkan data halaman aktif.
         */

        filtered
            .slice(start, end)
            .forEach(function (row, index) {

                row.hidden = false;

                const no = row.querySelector(
                    '.dept-number'
                );

                if (no) {

                    no.textContent =
                        start + index + 1;

                }

            });

        /*
         * Empty state pencarian.
         */

        const empty = qs('#deptEmptyRow');

        if (empty) {

            empty.hidden =
                filtered.length !== 0 ||
                allRows.length === 0;

        }

        /*
         * Empty database.
         */

        const serverEmpty =
            qs('#deptServerEmpty');

        if (serverEmpty) {

            serverEmpty.hidden =
                allRows.length !== 0;

        }

        /*
         * Jumlah data.
         */

        updateTableInfo(
            filtered.length,
            start,
            pageSize
        );

        /*
         * Render pagination.
         */

        renderPagination(
            totalPages
        );

    }

    /* =========================================================
       TABLE INFORMATION
    ========================================================= */

    function updateTableInfo(
        total,
        start,
        size
    ) {

        const element = qs('#deptTableInfo');

        if (!element) {
            return;
        }

        if (!total) {

            element.textContent =
                'Tidak ada data';

            return;
        }

        const from = start + 1;

        const to = Math.min(
            start + size,
            total
        );

        element.textContent =
            `Menampilkan ${from}–${to} dari ${total} data`;

    }

    /* =========================================================
       PAGINATION
    ========================================================= */

    function renderPagination(totalPages) {

        const container = qs('#deptPagination');

        if (!container) {
            return;
        }

        container.replaceChildren();

        /*
         * Previous.
         */

        container.appendChild(
            createPageButton(
                '‹',
                currentPage - 1,
                currentPage === 1
            )
        );

        /*
         * Tentukan range nomor halaman.
         */

        let startPage = Math.max(
            1,
            currentPage - 2
        );

        let endPage = Math.min(
            totalPages,
            startPage + 4
        );

        startPage = Math.max(
            1,
            endPage - 4
        );

        /*
         * Tombol nomor halaman.
         */

        for (
            let page = startPage;
            page <= endPage;
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

        /*
         * Next.
         */

        container.appendChild(
            createPageButton(
                '›',
                currentPage + 1,
                currentPage >= totalPages
            )
        );

    }

    /* =========================================================
       CREATE PAGE BUTTON
    ========================================================= */

    function createPageButton(
        label,
        page,
        disabled,
        active = false
    ) {

        const button =
            document.createElement('button');

        button.type = 'button';

        button.textContent = label;

        button.disabled = disabled;

        if (active) {

            button.classList.add('active');

            button.setAttribute(
                'aria-current',
                'page'
            );

        }

        if (!disabled) {

            button.addEventListener(
                'click',
                function () {

                    currentPage = page;

                    renderTable();

                }
            );

        }

        return button;

    }

    /* =========================================================
       RESET FILTER
    ========================================================= */

    function resetFilter() {

        const search = qs('#deptSearch');

        const size = qs('#deptPageSize');

        if (search) {

            search.value = '';

        }

        if (size) {

            size.value = '10';

        }

        currentPage = 1;

        renderTable();

    }

    /* =========================================================
       IMAGE PREVIEW
    ========================================================= */

    function setImagePreview(url) {

        const image = qs(
            '#deptImagePreviewImg'
        );

        const empty = qs(
            '#deptImagePreviewEmpty'
        );

        if (!image || !empty) {
            return;
        }

        if (url) {

            image.src = url;

            image.hidden = false;

            empty.hidden = true;

        } else {

            image.removeAttribute('src');

            image.hidden = true;

            empty.hidden = false;

        }

    }

    /* =========================================================
       REVOKE IMAGE PREVIEW
    ========================================================= */

    function clearPreviewObjectURL() {

        if (previewObjectUrl) {

            URL.revokeObjectURL(
                previewObjectUrl
            );

            previewObjectUrl = null;

        }

    }

    /* =========================================================
       VALIDATE IMAGE
    ========================================================= */

    function validateImage(file) {

        if (!file) {

            return true;

        }

        const validTypes = [

            'image/jpeg',

            'image/png',

            'image/webp'

        ];

        if (!validTypes.includes(file.type)) {

            showFormError(
                'Format image harus JPG, JPEG, PNG, atau WEBP.'
            );

            return false;

        }

        if (file.size > 2 * 1024 * 1024) {

            showFormError(
                'Ukuran image maksimal 2 MB.'
            );

            return false;

        }

        return true;

    }

    /* =========================================================
       BIND IMAGE INPUT
    ========================================================= */

    function bindImageInput() {

        const input = qs('#deptImage');

        if (!input) {
            return;
        }

        input.addEventListener(
            'change',
            function () {

                hideFormError();

                const file = input.files?.[0];

                if (!file) {

                    clearPreviewObjectURL();

                    setImagePreview(
                        currentRow?.dataset.imgUrl || ''
                    );

                    return;
                }

                if (!validateImage(file)) {

                    input.value = '';

                    return;
                }

                clearPreviewObjectURL();

                previewObjectUrl =
                    URL.createObjectURL(file);

                setImagePreview(
                    previewObjectUrl
                );

            }
        );

    }

    /* =========================================================
       OPEN CRUD MODAL
    ========================================================= */

    function openModal(
        mode = 'add',
        row = null
    ) {

        const dialog = qs('#deptModal');

        if (!dialog) {
            return;
        }

        modalMode = mode;

        currentRow = row;

        currentId = row
            ? row.dataset.id
            : null;

        const form = qs('#deptForm');

        if (form) {

            form.reset();

            form.querySelectorAll('input')
                .forEach(function (input) {

                    input.setCustomValidity('');

                });

        }

        hideFormError();

        clearPreviewObjectURL();

        /*
         * Elements.
         */

        const code = qs('#deptCode');

        const name = qs('#deptName');

        const role = qs('#deptRole');

        const image = qs('#deptImage');

        const currentImage =
            qs('#deptCurrentImage');

        const title = qs('#deptModalTitle');

        const description =
            qs('#deptModalDescription');

        const saveButton =
            qs('#deptSaveButton');

        const saveText =
            qs('#deptSaveText');

        const hiddenId = qs('#deptId');

        /*
         * Legacy Database:
         *
         * nama_dep = Kode Departemen
         * kode_dep = Nama Departemen
         *
         * Data attribute disusun oleh Blade.
         */

        if (code) {

            code.value =
                row?.dataset.kode || '';

        }

        if (name) {

            name.value =
                row?.dataset.nama || '';

        }

        if (role) {

            role.value =
                row?.dataset.role || '';

        }

        if (hiddenId) {

            hiddenId.value =
                row?.dataset.id || '';

        }

        if (image) {

            image.value = '';

        }

        /*
         * Existing image.
         */

        const existingImageUrl =
            row?.dataset.imgUrl || '';

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
         * View dan Delete readonly.
         */

        const readonly =
            mode === 'view' ||
            mode === 'delete';

        if (code) {

            code.readOnly = readonly;

        }

        if (name) {

            name.readOnly = readonly;

        }

        if (role) {

            role.readOnly = readonly;

        }

        if (image) {

            image.disabled = readonly;

        }

        /*
         * Reset save button.
         */

        if (saveButton) {

            saveButton.hidden =
                mode === 'view';

            saveButton.disabled = false;

            saveButton.classList.toggle(
                'dept-delete-button',
                mode === 'delete'
            );

        }

        /*
         * Title berdasarkan mode.
         */

        if (mode === 'add') {

            title.textContent =
                'Tambah Departemen';

            description.textContent =
                'Tambahkan data Departemen baru.';

            saveText.textContent =
                'Simpan Departemen';

        }

        if (mode === 'view') {

            title.textContent =
                'Detail Departemen';

            description.textContent =
                'Informasi lengkap Departemen.';

        }

        if (mode === 'edit') {

            title.textContent =
                'Edit Departemen';

            description.textContent =
                'Perbarui data Departemen.';

            saveText.textContent =
                'Simpan Perubahan';

        }

        if (mode === 'delete') {

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

        document.body.classList.add(
            'dept-modal-open'
        );

        refreshIcons();

    }

    /* =========================================================
       CLOSE CRUD MODAL
    ========================================================= */

    function closeModal() {

        const dialog = qs('#deptModal');

        if (dialog?.open) {

            dialog.close();

        }

        document.body.classList.remove(
            'dept-modal-open'
        );

        clearPreviewObjectURL();

        modalMode = 'add';

        currentId = null;

        currentRow = null;

        isSubmitting = false;

        hideFormError();

    }

    /* =========================================================
       VALIDASI FORM
    ========================================================= */

    function validateFormData() {

        const codeInput = qs('#deptCode');

        const nameInput = qs('#deptName');

        const roleInput = qs('#deptRole');

        const code = String(
            codeInput?.value ?? ''
        ).trim();

        const name = String(
            nameInput?.value ?? ''
        ).trim();

        const role = String(
            roleInput?.value ?? ''
        ).trim();

        if (!code) {

            showFormError(
                'Kode Departemen wajib diisi.'
            );

            codeInput?.focus();

            return null;

        }

        if (!name) {

            showFormError(
                'Nama Departemen wajib diisi.'
            );

            nameInput?.focus();

            return null;

        }

        if (
            code.length > 255 ||
            name.length > 255
        ) {

            showFormError(
                'Kode dan Nama Departemen maksimal 255 karakter.'
            );

            return null;

        }

        if (
            role &&
            !/^-?\d+$/.test(role)
        ) {

            showFormError(
                'Role harus berupa bilangan bulat.'
            );

            roleInput?.focus();

            return null;

        }

        const image = qs('#deptImage')?.files?.[0];

        if (!validateImage(image)) {

            return null;

        }

        return {

            code,

            name,

            role,

            image

        };

    }

    /* =========================================================
       FORM SUBMIT
    ========================================================= */

    async function submitForm(event) {

        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        hideFormError();

        /*
         * VIEW tidak melakukan submit.
         */

        if (modalMode === 'view') {

            closeModal();

            return;

        }

        /*
         * DELETE.
         */

        if (modalMode === 'delete') {

            await deleteRecord();

            return;

        }

        /*
         * Validasi.
         */

        const validated = validateFormData();

        if (!validated) {
            return;
        }

        /*
         * FormData diperlukan karena image.
         */

        const formData = new FormData();

        /*
         * MAPPING DATABASE LEGACY
         *
         * nama_dep = Kode Departemen
         * kode_dep = Nama Departemen
         *
         * Jangan ditukar dengan field standar.
         */

        formData.append(
            'nama_dep',
            validated.code
        );

        formData.append(
            'kode_dep',
            validated.name
        );

        formData.append(
            'role',
            validated.role
        );

        if (validated.image) {

            formData.append(
                'img',
                validated.image,
                validated.image.name
            );

        }

        /*
         * Endpoint.
         */

        const routes = getRoutes();

        let url = routes.store;

        if (modalMode === 'edit') {

            if (!currentId) {

                showFormError(
                    'ID Departemen tidak ditemukan.'
                );

                return;

            }

            url = routeWithId(
                routes.update,
                currentId
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

        if (!url) {

            showFormError(
                'Endpoint penyimpanan Departemen tidak tersedia.'
            );

            return;

        }

        /*
         * Button loading.
         */

        const saveButton =
            qs('#deptSaveButton');

        const saveText =
            qs('#deptSaveText');

        const originalText =
            saveText?.textContent ||
            'Simpan';

        isSubmitting = true;

        if (saveButton) {

            saveButton.disabled = true;

        }

        if (saveText) {

            saveText.textContent =
                'Menyimpan...';

        }

        try {

            const response = await requestForm(
                url,
                formData
            );

            showToast(
                response.message ||
                'Data Departemen berhasil disimpan.',
                'success'
            );

            closeModal();

            /*
             * Reload agar database tetap
             * menjadi sumber data utama.
             */

            setTimeout(function () {

                window.location.reload();

            }, 400);

        } catch (error) {

            showFormError(
                error.message ||
                'Departemen gagal disimpan.'
            );

        } finally {

            isSubmitting = false;

            if (saveButton) {

                saveButton.disabled = false;

            }

            if (saveText) {

                saveText.textContent =
                    originalText;

            }

        }

    }

    /* =========================================================
       REQUEST FORM DATA
    ========================================================= */

    async function requestForm(
        url,
        formData
    ) {

        const response = await fetch(
            url,
            {

                method: 'POST',

                credentials: 'same-origin',

                headers: {

                    'Accept':
                        'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest',

                    'X-CSRF-TOKEN':
                        csrfToken()

                },

                body: formData

            }
        );

        /*
         * Server bisa saja mengembalikan
         * JSON error validasi Laravel.
         */

        const data = await response
            .json()
            .catch(function () {

                return {};

            });

        if (
            !response.ok ||
            data.success === false
        ) {

            let message =
                data.message ||
                `Request gagal (${response.status}).`;

            /*
             * Laravel validation.
             */

            if (
                response.status === 422 &&
                data.errors
            ) {

                const firstError =
                    Object.values(
                        data.errors
                    )
                        .flat()[0];

                if (firstError) {

                    message = firstError;

                }

            }

            /*
             * Expired CSRF.
             */

            if (response.status === 419) {

                message =
                    'Sesi login berakhir. Muat ulang halaman dan login kembali.';

            }

            /*
             * Upload size.
             */

            if (response.status === 413) {

                message =
                    'Ukuran file melebihi batas server.';

            }

            throw new Error(message);

        }

        return data;

    }

    /* =========================================================
       DELETE DEPARTEMEN
    ========================================================= */

    async function deleteRecord() {

        if (!currentId) {

            showFormError(
                'ID Departemen tidak ditemukan.'
            );

            return;

        }

        if (isSubmitting) {
            return;
        }

        const departmentName =
            currentRow?.dataset.nama ||
            'Departemen';

        /*
         * Konfirmasi hanya menghapus
         * data yang dipilih berdasarkan ID.
         */

        const confirmed =
            window.confirm(
                `Hapus Departemen "${departmentName}"?`
            );

        if (!confirmed) {
            return;
        }

        const route = routeWithId(
            getRoutes().destroy,
            currentId
        );

        if (!route) {

            showFormError(
                'Endpoint hapus Departemen tidak tersedia.'
            );

            return;

        }

        const button =
            qs('#deptSaveButton');

        const buttonText =
            qs('#deptSaveText');

        isSubmitting = true;

        if (button) {

            button.disabled = true;

        }

        if (buttonText) {

            buttonText.textContent =
                'Menghapus...';

        }

        try {

            const response = await fetch(
                route,
                {

                    method: 'DELETE',

                    credentials: 'same-origin',

                    headers: {

                        'Accept':
                            'application/json',

                        'X-Requested-With':
                            'XMLHttpRequest',

                        'X-CSRF-TOKEN':
                            csrfToken()

                    }

                }
            );

            const data = await response
                .json()
                .catch(function () {

                    return {};

                });

            if (
                !response.ok ||
                data.success === false
            ) {

                let message =
                    data.message ||
                    `Delete gagal (${response.status}).`;

                if (response.status === 419) {

                    message =
                        'Sesi login berakhir. Muat ulang halaman.';

                }

                throw new Error(message);

            }

            showToast(
                data.message ||
                'Departemen berhasil dihapus.',
                'success'
            );

            closeModal();

            setTimeout(function () {

                window.location.reload();

            }, 400);

        } catch (error) {

            showFormError(
                error.message ||
                'Departemen gagal dihapus.'
            );

        } finally {

            isSubmitting = false;

            if (button) {

                button.disabled = false;

            }

            if (buttonText) {

                buttonText.textContent =
                    'Hapus Departemen';

            }

        }

    }

    /* =========================================================
       OPEN ACTIVITY MODAL
    ========================================================= */

    function openActivityModal() {

        const dialog =
            qs('#departemenActivityModal');

        if (!dialog) {
            return;
        }

        filterHistory('all');

        if (!dialog.open) {

            dialog.showModal();

        }

        document.body.classList.add(
            'dept-modal-open'
        );

        refreshIcons();

    }

    /* =========================================================
       CLOSE ACTIVITY MODAL
    ========================================================= */

    function closeActivityModal() {

        const dialog =
            qs('#departemenActivityModal');

        if (dialog?.open) {

            dialog.close();

        }

        document.body.classList.remove(
            'dept-modal-open'
        );

    }

    /* =========================================================
       FILTER HISTORY
    ========================================================= */

    function filterHistory(filter) {

        /*
         * Active filter button.
         */

        qsa('[data-dept-history-filter]')
            .forEach(function (button) {

                const active =
                    button.dataset.deptHistoryFilter ===
                    filter;

                button.classList.toggle(
                    'active',
                    active
                );

                button.setAttribute(
                    'aria-pressed',
                    String(active)
                );

            });

        /*
         * Filter history rows.
         */

        const historyRows =
            qsa('[data-dept-history-row]');

        let visible = 0;

        historyRows.forEach(function (row) {

            const show =
                filter === 'all' ||
                row.dataset.action === filter;

            row.hidden = !show;

            if (show) {

                visible++;

                const number = row.querySelector(
                    '.dept-history-number'
                );

                if (number) {

                    number.textContent =
                        String(visible);

                }

            }

        });

        /*
         * Empty filter.
         */

        const empty =
            qs('#deptHistoryFilteredEmpty');

        if (empty) {

            empty.hidden =
                visible !== 0 ||
                historyRows.length === 0;

        }

    }

    /* =========================================================
       BIND ACTIVITY
    ========================================================= */

    function bindActivity() {

        const card =
            qs('#departemenTotalActivityCard');

        /*
         * Click KPI to open history.
         */

        card?.addEventListener(
            'click',
            openActivityModal
        );

        /*
         * Keyboard access.
         */

        card?.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {

                    event.preventDefault();

                    openActivityModal();

                }

            }
        );

        /*
         * Bind filter.
         */

        qsa('[data-dept-history-filter]')
            .forEach(function (button) {

                button.addEventListener(
                    'click',
                    function () {

                        filterHistory(
                            button.dataset.deptHistoryFilter
                        );

                    }
                );

            });

    }

    /* =========================================================
       EXPORT CSV
    ========================================================= */

    function exportCSV() {

        const data = filteredRows();

        if (!data.length) {

            showToast(
                'Tidak ada data untuk diekspor.',
                'error'
            );

            return;

        }

        /*
         * Kolom CSV mengikuti tabel baru.
         *
         * Tidak ada kolom Role dan Image.
         */

        const csvRows = [

            [

                'No',

                'Kode Departemen',

                'Nama Departemen',

                'Dibuat'

            ]

        ];

        data.forEach(
            function (
                row,
                index
            ) {

                const createdCell =
                    row.querySelector(
                        '.dept-created-cell'
                    );

                csvRows.push(

                    [

                        index + 1,

                        row.dataset.kode || '',

                        row.dataset.nama || '',

                        createdCell
                            ?.textContent
                            ?.trim() || ''

                    ]

                );

            }
        );

        /*
         * Generate CSV UTF-8.
         * Delimiter titik koma untuk Excel Indonesia.
         */

        const csv = '\uFEFF' +

            csvRows.map(function (row) {

                return row.map(function (value) {

                    /*
                     * Proteksi CSV injection.
                     */

                    let cellText =
                        String(value ?? '');

                    if (
                        /^\s*[=+@-]/.test(cellText)
                    ) {

                        cellText = "'" + cellText;

                    }

                    return (

                        '"' +

                        cellText.replace(
                            /"/g,
                            '""'
                        ) +

                        '"'

                    );

                }).join(';');

            }).join('\r\n');

        const blob = new Blob(
            [csv],
            {
                type: 'text/csv;charset=utf-8'
            }
        );

        const objectUrl =
            URL.createObjectURL(blob);

        const link =
            document.createElement('a');

        link.href = objectUrl;

        link.download =
            'data-departemen-' +
            new Date()
                .toISOString()
                .slice(0, 10) +
            '.csv';

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(function () {

            URL.revokeObjectURL(
                objectUrl
            );

        }, 1000);

    }

    /* =========================================================
       FORM ERROR
    ========================================================= */

    function showFormError(message) {

        const element =
            qs('#deptFormAlert');

        if (!element) {
            return;
        }

        element.textContent =
            message || 'Terjadi kesalahan.';

        element.hidden = false;

    }

    function hideFormError() {

        const element =
            qs('#deptFormAlert');

        if (!element) {
            return;
        }

        element.textContent = '';

        element.hidden = true;

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
            return;
        }

        const toast =
            document.createElement('div');

        toast.className =
            'dept-toast ' + type;

        /*
         * Icon.
         */

        const icon =
            document.createElement('i');

        icon.setAttribute(
            'data-lucide',
            type === 'success'
                ? 'circle-check'
                : 'triangle-alert'
        );

        /*
         * Text.
         */

        const label =
            document.createElement('span');

        label.textContent = message;

        toast.appendChild(icon);

        toast.appendChild(label);

        container.appendChild(toast);

        refreshIcons();

        /*
         * Animate in.
         */

        requestAnimationFrame(function () {

            toast.classList.add('show');

        });

        /*
         * Animate out.
         */

        clearTimeout(toastTimer);

        toastTimer = setTimeout(
            function () {

                toast.classList.remove('show');

                setTimeout(function () {

                    toast.remove();

                }, 250);

            },
            3700
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

                /*
                 * Aman untuk klik langsung
                 * pada ikon SVG atau tombol.
                 */

                if (
                    !(event.target instanceof Element)
                ) {
                    return;
                }

                const button =
                    event.target.closest(
                        'button[data-action]'
                    );

                if (!button) {
                    return;
                }

                if (button.disabled) {
                    return;
                }

                const row =
                    button.closest(
                        'tr[data-record]'
                    );

                if (!row) {
                    return;
                }

                /*
                 * view / edit / delete
                 */

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

            qs('#departemenActivityModal')

        ];

        dialogs.forEach(
            function (dialog) {

                if (!dialog) {
                    return;
                }

                dialog.addEventListener(
                    'click',
                    function (event) {

                        if (event.target !== dialog) {
                            return;
                        }

                        /*
                         * Deteksi klik di luar box modal.
                         */

                        const box =
                            dialog.querySelector(
                                '.dept-modal'
                            )?.getBoundingClientRect();

                        if (!box) {
                            return;
                        }

                        const inside =

                            event.clientX >= box.left &&
                            event.clientX <= box.right &&

                            event.clientY >= box.top &&
                            event.clientY <= box.bottom;

                        if (!inside) {

                            if (
                                dialog.id === 'deptModal'
                            ) {

                                closeModal();

                            } else {

                                closeActivityModal();

                            }

                        }

                    }
                );

                /*
                 * Esc: browser menutup dialog,
                 * state CSS ikut dibersihkan.
                 */

                dialog.addEventListener(
                    'close',
                    function () {

                        document.body.classList.remove(
                            'dept-modal-open'
                        );

                        if (dialog.id === 'deptModal') {

                            clearPreviewObjectURL();

                        }

                    }
                );

            }
        );

    }

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    function init() {

        /*
         * Hindari inisialisasi dua kali
         * jika script termuat berulang.
         */

        const page =
            qs('.dept-page');

        if (!page) {
            return;
        }

        if (page.dataset.deptInitialized === '1') {
            return;
        }

        page.dataset.deptInitialized = '1';

        /*
         * Search.
         */

        qs('#deptSearch')
            ?.addEventListener(
                'input',
                function () {

                    currentPage = 1;

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

                    currentPage = 1;

                    renderTable();

                }
            );

        /*
         * CRUD Table buttons.
         */

        bindTableActions();

        /*
         * Form submit.
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
         * Activity history.
         */

        bindActivity();

        /*
         * Dialog backdrop.
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
       DIPANGGIL OLEH BLADE
    ========================================================= */

    window.openDeptModal =
        function () {

            openModal('add');

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
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();

    }

})();
