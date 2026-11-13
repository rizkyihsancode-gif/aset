
/*
|--------------------------------------------------------------------------
| MASTER DATA — KODE AKTIVA
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
| FITUR:
| - Search, filter Golongan dan KIB
| - Pagination
| - Tambah, Detail, Edit, Hapus
| - Validasi data
| - AJAX Laravel + CSRF
| - Export CSV
| - Riwayat perubahan
| - Toast notifikasi
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    /* ======================================================
       INITIAL STATE DAN HELPERS
    ====================================================== */

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));

    const page = $('.aktiva-page');

    if (!page || page.dataset.initialized === '1') {
        return;
    }

    page.dataset.initialized = '1';

    const routes = window.AKTIVA_CRUD || {};

    const modal = $('#aktivaModal');
    const historyModal = $('#aktivaHistoryModal');
    const form = $('#aktivaForm');
    const table = $('#aktivaTable');

    let currentPage = 1;
    let currentMode = 'add';
    let currentRow = null;
    let busy = false;
    let toastTimer = null;

    const value = id =>
        String($('#' + id)?.value ?? '').trim();

    const normalize = text =>
        String(text ?? '')
            .trim()
            .toLocaleLowerCase('id-ID');

    const rows = () =>
        $$('tbody tr[data-row]', table);

    const icons = () =>
        window.lucide?.createIcons?.();

    const token = () =>
        $('meta[name="csrf-token"]')?.content ||
        $('#aktivaForm input[name="_token"]')?.value ||
        '';

    const replaceId = (url, id) =>
        String(url || '').replace(
            '__ID__',
            encodeURIComponent(String(id || ''))
        );

    /* ======================================================
       TANGGAL DAN JAM WITA
    ====================================================== */

    function clock() {

        const now = new Date();

        if ($('#aktivaDate')) {

            $('#aktivaDate').textContent =
                new Intl.DateTimeFormat('id-ID', {
                    timeZone: 'Asia/Makassar',
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).format(now);

        }

        if ($('#aktivaTime')) {

            $('#aktivaTime').textContent =
                new Intl.DateTimeFormat('id-ID', {
                    timeZone: 'Asia/Makassar',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hourCycle: 'h23'
                }).format(now) + ' WITA';

        }
    }

    /* ======================================================
       FILTER DATA
    ====================================================== */

    function filteredRows() {

        const term = normalize(value('aktivaSearch'));
        const gol = value('aktivaGolFilter');
        const kib = value('aktivaKibFilter');

        return rows().filter(row => {

            const text = normalize([
                row.dataset.kode,
                row.dataset.aktiva,
                row.dataset.gol,
                row.dataset.kib
            ].join(' '));

            return (
                (!term || text.includes(term)) &&
                (!gol || row.dataset.gol === gol) &&
                (!kib || row.dataset.kib === kib)
            );

        });
    }

    /* ======================================================
       TOMBOL PAGINATION
    ====================================================== */

    function pageButton(
        label,
        target,
        disabled = false,
        active = false
    ) {

        const button = document.createElement('button');

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

        button.addEventListener('click', () => {

            currentPage = target;

            renderTable();

        });

        return button;
    }

    /* ======================================================
       RENDER PAGINATION
    ====================================================== */

    function renderPagination(lastPage) {

        const nav = $('#aktivaPagination');

        if (!nav) return;

        nav.replaceChildren();

        if (lastPage <= 1) return;

        nav.append(
            pageButton(
                '‹',
                currentPage - 1,
                currentPage === 1
            )
        );

        let first = Math.max(1, currentPage - 2);

        let last = Math.min(
            lastPage,
            first + 4
        );

        first = Math.max(1, last - 4);

        if (first > 1) {

            nav.append(
                pageButton('1', 1)
            );

            if (first > 2) {

                const dots = document.createElement('span');

                dots.className = 'aktiva-page-dots';
                dots.textContent = '…';

                nav.append(dots);
            }
        }

        for (let i = first; i <= last; i++) {

            nav.append(
                pageButton(
                    String(i),
                    i,
                    false,
                    i === currentPage
                )
            );
        }

        if (last < lastPage) {

            if (last < lastPage - 1) {

                const dots = document.createElement('span');

                dots.className = 'aktiva-page-dots';
                dots.textContent = '…';

                nav.append(dots);
            }

            nav.append(
                pageButton(
                    String(lastPage),
                    lastPage
                )
            );
        }

        nav.append(
            pageButton(
                '›',
                currentPage + 1,
                currentPage === lastPage
            )
        );
    }

    /* ======================================================
       RENDER TABEL
    ====================================================== */

    function renderTable() {

        const all = rows();
        const filtered = filteredRows();

        const size = Math.max(
            1,
            Number(value('aktivaPageSize')) || 10
        );

        const lastPage = Math.max(
            1,
            Math.ceil(filtered.length / size)
        );

        currentPage = Math.min(
            Math.max(currentPage, 1),
            lastPage
        );

        const start = (currentPage - 1) * size;

        all.forEach(row => {
            row.hidden = true;
        });

        filtered
            .slice(start, start + size)
            .forEach((row, index) => {

                row.hidden = false;

                const no = $('.aktiva-number', row);

                if (no) {
                    no.textContent =
                        String(start + index + 1);
                }

            });

        const empty = $('#aktivaEmptyRow');

        if (empty) {
            empty.hidden = filtered.length > 0;
        }

        const info = $('#aktivaTableInfo');

        if (info) {

            info.textContent =
                `Menampilkan ${filtered.length ? start + 1 : 0}–` +
                `${Math.min(start + size, filtered.length)} ` +
                `dari ${filtered.length} data`;

        }

        renderPagination(lastPage);
    }

    /* ======================================================
       RESET FILTER
    ====================================================== */

    function resetFilter() {

        [
            'aktivaSearch',
            'aktivaGolFilter',
            'aktivaKibFilter'
        ].forEach(id => {

            if ($('#' + id)) {
                $('#' + id).value = '';
            }

        });

        if ($('#aktivaPageSize')) {
            $('#aktivaPageSize').value = '10';
        }

        currentPage = 1;

        renderTable();
    }

    /* ======================================================
       HAPUS PESAN ERROR FORM
    ====================================================== */

    function clearErrors() {

        $$('[data-error]', form).forEach(node => {
            node.textContent = '';
        });

        const alert = $('#aktivaFormAlert');

        if (alert) {
            alert.hidden = true;
            alert.textContent = '';
        }

        $$('input', form).forEach(input =>
            input.setCustomValidity('')
        );
    }

    /* ======================================================
       TAMPILKAN PESAN ERROR FORM
    ====================================================== */

    function showError(message, errors = {}) {

        for (
            const [name, messages]
            of Object.entries(errors || {})
        ) {

            const target = $$(
                '[data-error]',
                form
            ).find(el =>
                el.dataset.error === name
            );

            if (target) {

                target.textContent =
                    Array.isArray(messages)
                        ? messages[0]
                        : String(messages);

            }
        }

        const alert = $('#aktivaFormAlert');

        if (alert) {

            alert.textContent =
                message ||
                'Periksa kembali input Kode Aktiva.';

            alert.hidden = false;
        }
    }

    /* ======================================================
       TOAST NOTIFIKASI
    ====================================================== */

    function toast(
        title,
        message,
        error = false
    ) {

        const box = $('#aktivaToast');

        if (!box) return;

        clearTimeout(toastTimer);

        box.classList.toggle(
            'error',
            error
        );

        $('#aktivaToastTitle').textContent = title;

        $('#aktivaToastMessage').textContent =
            message || '';

        box.hidden = false;

        toastTimer = setTimeout(() => {
            box.hidden = true;
        }, 4500);
    }

    /* ======================================================
       OPEN MODAL
    ====================================================== */

    function openModal(
        mode,
        row = null
    ) {

        if (!modal || !form) return;

        form.reset();

        clearErrors();

        currentMode = mode;
        currentRow = row;

        const data = row?.dataset || {};

        $('#aktivaKode').value =
            data.kode || '';

        $('#aktivaName').value =
            data.aktiva || '';

        $('#aktivaGol').value =
            data.gol || '';

        $('#aktivaKib').value =
            data.kib || '';

        const readonly =
            mode === 'view' ||
            mode === 'delete';

        [
            'aktivaKode',
            'aktivaName',
            'aktivaGol',
            'aktivaKib'
        ].forEach(id => {

            $('#' + id).readOnly = readonly;

        });

        const titles = {
            add: 'Tambah Kode Aktiva',
            view: 'Detail Kode Aktiva',
            edit: 'Edit Kode Aktiva',
            delete: 'Hapus Kode Aktiva'
        };

        const descriptions = {
            add: 'Tambahkan klasifikasi aktiva baru ke database.',
            view: 'Informasi kode dan klasifikasi aktiva (hanya baca).',
            edit: 'Perbarui data kode dan klasifikasi aktiva.',
            delete: 'Pastikan data yang dipilih benar sebelum dihapus.'
        };

        $('#aktivaModalTitle').textContent =
            titles[mode] || titles.add;

        $('#aktivaModalDescription').textContent =
            descriptions[mode] || descriptions.add;

        const button = $('#saveAktivaButton');

        button.hidden = mode === 'view';

        button.disabled = false;

        button.classList.toggle(
            'delete-mode',
            mode === 'delete'
        );

        $('span', button).textContent =
            mode === 'delete'
                ? 'Hapus Kode Aktiva'
                : mode === 'edit'
                    ? 'Simpan Perubahan'
                    : 'Simpan Kode Aktiva';

        if (!modal.open) {
            modal.showModal();
        }

        icons();

        if (!readonly) {
            $('#aktivaKode').focus();
        }
    }

    /* ======================================================
       CLOSE MODAL
    ====================================================== */

    function closeModal() {

        if (modal?.open) {
            modal.close();
        }
    }

    /* ======================================================
       VALIDASI DATA
    ====================================================== */

    function validate() {

        const data = {
            kode: value('aktivaKode'),
            aktiva: value('aktivaName'),
            gol: value('aktivaGol'),
            kib: value('aktivaKib')
        };

        const errors = {};

        if (!data.kode) {
            errors.kode = ['Kode Aktiva wajib diisi.'];
        }

        if (!data.aktiva) {
            errors.aktiva = ['Nama Aktiva wajib diisi.'];
        }

        for (
            const [key, text]
            of Object.entries(data)
        ) {

            if (text.length > 255) {
                errors[key] = ['Maksimal 255 karakter.'];
            }
        }

        if (Object.keys(errors).length) {

            showError(
                'Ada isian yang belum sesuai.',
                errors
            );

            return null;
        }

        return data;
    }

    /* ======================================================
       AJAX REQUEST LARAVEL
    ====================================================== */

    async function apiRequest(url, options) {

        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                Accept: 'application/json',

                'X-Requested-With':
                    'XMLHttpRequest',

                'X-CSRF-TOKEN':
                    token(),

                ...(options.headers || {})
            }
        });

        const raw = await response.text();

        let body = {};

        try {

            body = raw
                ? JSON.parse(raw)
                : {};

        } catch {

            body = {};
        }

        if (
            !response.ok ||
            body.success === false
        ) {

            let message =
                body.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (response.status === 419) {

                message =
                    'Sesi berakhir (419). Refresh halaman dan login kembali.';

            }

            if (response.status === 500) {

                message =
                    'Server Error (500). Periksa storage/logs/laravel.log pada server.';

            }

            if (
                response.status === 422 &&
                body.errors
            ) {

                message =
                    Object.values(body.errors).flat()[0] ||
                    message;

            }

            const error = new Error(message);

            error.validation = body.errors || {};
            error.status = response.status;

            throw error;
        }

        return body;
    }

    /* ======================================================
       SUBMIT CREATE / UPDATE / DELETE
    ====================================================== */

    async function submit(event) {

        event.preventDefault();

        if (
            busy ||
            currentMode === 'view'
        ) {
            return;
        }

        clearErrors();

        const isDelete =
            currentMode === 'delete';

        const data = isDelete
            ? null
            : validate();

        if (!isDelete && !data) {
            return;
        }

        if (
            isDelete &&
            !window.confirm(
                `Hapus Kode Aktiva "${currentRow?.dataset.aktiva || ''}"?`
            )
        ) {
            return;
        }

        const isEdit =
            currentMode === 'edit';

        const id =
            currentRow?.dataset.id;

        if (
            (isEdit || isDelete) &&
            !id
        ) {

            showError(
                'ID Kode Aktiva tidak ditemukan.'
            );

            return;
        }

        const target = isDelete
            ? replaceId(routes.destroy, id)
            : isEdit
                ? replaceId(routes.update, id)
                : routes.store;

        if (!target) {

            showError(
                'Endpoint CRUD Kode Aktiva tidak tersedia.'
            );

            return;
        }

        const button = $('#saveAktivaButton');
        const span = $('span', button);

        const previous =
            span.textContent;

        busy = true;
        button.disabled = true;

        span.textContent = isDelete
            ? 'Menghapus...'
            : 'Menyimpan...';

        try {

            const body = await apiRequest(
                target,
                isDelete
                    ? {
                        method: 'DELETE'
                    }
                    : {
                        method: isEdit ? 'PUT' : 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify(data)
                    }
            );

            toast(
                'Berhasil',
                body.message ||
                    (
                        isDelete
                            ? 'Data berhasil dihapus.'
                            : 'Data berhasil disimpan.'
                    )
            );

            closeModal();

            window.setTimeout(
                () => window.location.reload(),
                450
            );

        } catch (error) {

            console.error(
                'Kode Aktiva:',
                error
            );

            showError(
                error.message,
                error.validation
            );

            toast(
                'Gagal',
                error.message,
                true
            );

        } finally {

            busy = false;
            button.disabled = false;
            span.textContent = previous;

        }
    }

    /* ======================================================
       RIWAYAT PERUBAHAN
    ====================================================== */

    function historyOpen() {

        if (
            historyModal &&
            !historyModal.open
        ) {
            historyModal.showModal();
        }

        icons();
    }

    function historyClose() {

        if (historyModal?.open) {
            historyModal.close();
        }
    }

    /* ======================================================
       CSV ESCAPING
    ====================================================== */

    function csvCell(value) {

        let text = String(value ?? '');

        if (/^\s*[=+@-]/.test(text)) {
            text = "'" + text;
        }

        return '"' +
            text.replace(/"/g, '""') +
            '"';
    }

    /* ======================================================
       EXPORT CSV
    ====================================================== */

    function exportCsv() {

        const data = [[
            'No',
            'Kode Aktiva',
            'Nama Aktiva',
            'Golongan',
            'Kategori / KIB',
            'Dibuat'
        ]];

        filteredRows().forEach(
            (row, index) => {

                data.push([
                    index + 1,
                    row.dataset.kode || '',
                    row.dataset.aktiva || '',
                    row.dataset.gol || '',
                    row.dataset.kib || '',
                    String(
                        row.dataset.createdAt || ''
                    ).slice(0, 10)
                ]);

            }
        );

        if (data.length === 1) {

            toast(
                'Informasi',
                'Tidak ada data untuk diekspor.',
                true
            );

            return;
        }

        const content = '\uFEFF' +
            data.map(row =>
                row.map(csvCell).join(';')
            ).join('\r\n');

        const url = URL.createObjectURL(
            new Blob([content], {
                type: 'text/csv;charset=utf-8;'
            })
        );

        const link = document.createElement('a');

        link.href = url;

        link.download =
            'kode-aktiva-' +
            new Date().toISOString().slice(0, 10) +
            '.csv';

        document.body.append(link);

        link.click();
        link.remove();

        window.setTimeout(
            () => URL.revokeObjectURL(url),
            1000
        );
    }

    /* ======================================================
       EVENT BINDINGS
    ====================================================== */

    function bind() {

        [
            'aktivaSearch',
            'aktivaGolFilter',
            'aktivaKibFilter',
            'aktivaPageSize'
        ].forEach(id => {

            $('#' + id)?.addEventListener(
                id === 'aktivaSearch'
                    ? 'input'
                    : 'change',
                () => {

                    currentPage = 1;

                    renderTable();
                }
            );

        });

        $('#resetAktivaButton')?.addEventListener(
            'click',
            resetFilter
        );

        $('#exportAktivaButton')?.addEventListener(
            'click',
            exportCsv
        );

        $('#addAktivaButton')?.addEventListener(
            'click',
            () => openModal('add')
        );

        $('#aktivaHistoryButton')?.addEventListener(
            'click',
            historyOpen
        );

        $('#closeAktivaHistory')?.addEventListener(
            'click',
            historyClose
        );

        $('#closeAktivaModal')?.addEventListener(
            'click',
            closeModal
        );

        $('#cancelAktivaButton')?.addEventListener(
            'click',
            closeModal
        );

        form?.addEventListener(
            'submit',
            submit
        );

        table?.addEventListener(
            'click',
            event => {

                if (!(event.target instanceof Element)) {
                    return;
                }

                const button = event.target.closest(
                    'button[data-action]'
                );

                const row = button?.closest(
                    'tr[data-row]'
                );

                if (button && row) {

                    openModal(
                        button.dataset.action,
                        row
                    );
                }

            }
        );

        modal?.addEventListener(
            'click',
            event => {

                if (event.target === modal) {
                    closeModal();
                }
            }
        );

        historyModal?.addEventListener(
            'click',
            event => {

                if (event.target === historyModal) {
                    historyClose();
                }
            }
        );
    }

    /* ======================================================
       INITIALIZATION
    ====================================================== */

    bind();

    clock();

    window.setInterval(clock, 1000);

    renderTable();

    icons();

})();
