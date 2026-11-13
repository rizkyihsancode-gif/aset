
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

/* ============================================================
   SEARCHABLE DROPDOWN — KODE AKTIVA

   UNTUK:
   1. Golongan Aktiva (#aktivaGol)
   2. Kategori / KIB (#aktivaKib)

   FITUR:
   - Dropdown saat input diklik
   - Filter realtime saat mengetik
   - Pencarian sebagian kata
   - Prioritas hasil yang diawali kata pencarian
   - Navigasi keyboard
   - Klik untuk memilih
   - Bisa memasukkan nilai baru
   - Mendukung mode Tambah/Edit/View/Delete
   - Tidak mengubah request CRUD lama
============================================================ */

(function () {

    'use strict';

    const COMBO_SELECTOR =
        '[data-aktiva-combo]';

    let comboStates = [];

    /* ========================================================
       NORMALISASI TEKS
       Supaya huruf besar/kecil tidak memengaruhi pencarian.
    ======================================================== */

    function normalizeComboText(value) {

        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('id-ID')
            .trim();

    }

    /* ========================================================
       AMBIL OPSI YANG SEDANG TAMPIL
    ======================================================== */

    function visibleOptions(state) {

        return state.options.filter(
            option => !option.hidden
        );

    }

    /* ========================================================
       TUTUP SATU DROPDOWN
    ======================================================== */

    function closeCombo(state) {

        if (!state) {
            return;
        }

        state.dropdown.hidden = true;

        state.root.classList.remove(
            'is-open',
            'is-up'
        );

        state.input.setAttribute(
            'aria-expanded',
            'false'
        );

        state.input.removeAttribute(
            'aria-activedescendant'
        );

        state.activeIndex = -1;

        state.options.forEach(option => {

            option.classList.remove(
                'is-active'
            );

            option.setAttribute(
                'aria-selected',
                'false'
            );

        });

    }

    /* ========================================================
       TUTUP SEMUA DROPDOWN
    ======================================================== */

    function closeAllCombos(except = null) {

        comboStates.forEach(state => {

            if (state !== except) {
                closeCombo(state);
            }

        });

    }

    /* ========================================================
       PERBARUI PILIHAN YANG AKTIF
    ======================================================== */

    function setActiveOption(
        state,
        index
    ) {

        const visible = visibleOptions(state);

        state.options.forEach(option => {

            option.classList.remove(
                'is-active'
            );

            option.setAttribute(
                'aria-selected',
                'false'
            );

        });

        if (
            index < 0 ||
            index >= visible.length
        ) {

            state.activeIndex = -1;

            state.input.removeAttribute(
                'aria-activedescendant'
            );

            return;
        }

        state.activeIndex = index;

        const selected = visible[index];

        selected.classList.add(
            'is-active'
        );

        selected.setAttribute(
            'aria-selected',
            'true'
        );

        state.input.setAttribute(
            'aria-activedescendant',
            selected.id
        );

        selected.scrollIntoView({
            block: 'nearest',
            behavior: 'auto'
        });

    }

    /* ========================================================
       TENTUKAN POSISI DROPDOWN
       Jika ruang bawah sempit, daftar muncul ke atas.
    ======================================================== */

    function updateComboPosition(state) {

        const rect =
            state.root.getBoundingClientRect();

        const below =
            window.innerHeight - rect.bottom;

        const above = rect.top;

        const needUp =
            below < 280 &&
            above > below &&
            above >= 250;

        state.root.classList.toggle(
            'is-up',
            needUp
        );

    }

    /* ========================================================
       TAMPILKAN / FILTER PILIHAN
    ======================================================== */

    function renderCombo(state) {

        if (
            state.input.readOnly ||
            state.input.disabled
        ) {

            closeCombo(state);

            return;
        }

        closeAllCombos(state);

        const keyword = normalizeComboText(
            state.input.value
        );

        /*
         * Urutan:
         * 1. Teks yang diawali keyword
         * 2. Teks yang mengandung keyword
         * 3. Alfabetis
         */

        const sorted = [...state.options]
            .sort((a, b) => {

                const textA = normalizeComboText(
                    a.dataset.value
                );

                const textB = normalizeComboText(
                    b.dataset.value
                );

                const rankA = (
                    !keyword ||
                    textA.startsWith(keyword)
                ) ? 0 : 1;

                const rankB = (
                    !keyword ||
                    textB.startsWith(keyword)
                ) ? 0 : 1;

                return (
                    rankA - rankB ||
                    textA.localeCompare(
                        textB,
                        'id',
                        {
                            numeric: true,
                            sensitivity: 'base'
                        }
                    )
                );

            });

        let matched = 0;

        sorted.forEach(option => {

            const optionText = normalizeComboText(
                option.dataset.value
            );

            const matches =
                !keyword ||
                optionText.includes(keyword);

            option.hidden = !matches;

            if (matches) {
                matched++;
            }

            state.items.appendChild(option);

        });

        /* EMPTY STATE */

        if (matched === 0) {

            state.empty.hidden = false;

            state.empty.textContent =
                keyword
                    ? 'Tidak ada pilihan yang cocok. ' +
                      'Kamu tetap bisa menggunakan teks baru.'
                    : 'Belum ada pilihan tersedia. ' +
                      'Kamu bisa mengetik nilai baru.';

        } else {

            state.empty.hidden = true;

            state.empty.textContent = '';

        }

        /* OPEN */

        state.dropdown.hidden = false;

        state.root.classList.add(
            'is-open'
        );

        state.input.setAttribute(
            'aria-expanded',
            'true'
        );

        updateComboPosition(state);

        setActiveOption(state, -1);

        state.items.scrollTop = 0;

    }

    /* ========================================================
       PILIH OPSI
    ======================================================== */

    function selectComboOption(
        state,
        option
    ) {

        if (!option) {
            return;
        }

        const selectedValue = String(
            option.dataset.value ?? ''
        ).trim();

        /*
         * Tetap menggunakan input asli:
         * name="gol" atau name="kib"
         *
         * Jadi CRUD lama masih mengirim
         * field yang sama.
         */

        state.input.value = selectedValue;

        state.input.focus({
            preventScroll: true
        });

        closeCombo(state);

        state.input.dispatchEvent(
            new Event('change', {
                bubbles: true
            })
        );

    }

    /* ========================================================
       KEYBOARD NAVIGATION
    ======================================================== */

    function handleComboKeyboard(
        event,
        state
    ) {

        const key = event.key;

        /* ARROW DOWN */

        if (key === 'ArrowDown') {

            event.preventDefault();

            if (state.dropdown.hidden) {

                renderCombo(state);

            }

            const visible = visibleOptions(state);

            if (visible.length) {

                setActiveOption(
                    state,
                    Math.min(
                        state.activeIndex + 1,
                        visible.length - 1
                    )
                );

            }

            return;
        }

        /* ARROW UP */

        if (key === 'ArrowUp') {

            event.preventDefault();

            if (state.dropdown.hidden) {

                renderCombo(state);

            }

            const visible = visibleOptions(state);

            if (visible.length) {

                setActiveOption(
                    state,
                    state.activeIndex <= 0
                        ? visible.length - 1
                        : state.activeIndex - 1
                );

            }

            return;
        }

        /* ENTER */

        if (
            key === 'Enter' &&
            !state.dropdown.hidden
        ) {

            event.preventDefault();

            const visible = visibleOptions(state);

            if (visible.length) {

                const index =
                    state.activeIndex >= 0
                        ? state.activeIndex
                        : 0;

                selectComboOption(
                    state,
                    visible[index]
                );

            } else {

                /*
                 * Tidak ada hasil:
                 * teks yang diketik tetap disimpan.
                 */

                closeCombo(state);

            }

            return;
        }

        /* ESCAPE */

        if (
            key === 'Escape' &&
            !state.dropdown.hidden
        ) {

            event.preventDefault();

            event.stopPropagation();

            closeCombo(state);

            return;
        }

        /* TAB */

        if (key === 'Tab') {

            closeCombo(state);

        }

    }

    /* ========================================================
       INISIALISASI SATU COMBOBOX
    ======================================================== */

    function initializeCombo(root) {

        const input = root.querySelector(
            '[data-aktiva-combo-input]'
        );

        const toggle = root.querySelector(
            '[data-aktiva-combo-toggle]'
        );

        const dropdown = root.querySelector(
            '[data-aktiva-combo-list]'
        );

        const items = root.querySelector(
            '.aktiva-combo-options'
        );

        const empty = root.querySelector(
            '[data-aktiva-combo-empty]'
        );

        if (
            !input ||
            !toggle ||
            !dropdown ||
            !items ||
            !empty
        ) {
            return null;
        }

        const options = [
            ...root.querySelectorAll(
                '[data-aktiva-combo-option]'
            )
        ];

        const state = {
            root,
            input,
            toggle,
            dropdown,
            items,
            empty,
            options,
            activeIndex: -1
        };

        /* INPUT FOCUS */

        input.addEventListener(
            'focus',
            () => {

                renderCombo(state);

            }
        );

        /* REALTIME SEARCH */

        input.addEventListener(
            'input',
            () => {

                renderCombo(state);

            }
        );

        /* KEYBOARD */

        input.addEventListener(
            'keydown',
            event => {

                handleComboKeyboard(
                    event,
                    state
                );

            }
        );

        /* TOMBOL PANAH */

        toggle.addEventListener(
            'click',
            () => {

                if (
                    input.readOnly ||
                    input.disabled
                ) {
                    closeCombo(state);
                    return;
                }

                if (!dropdown.hidden) {

                    closeCombo(state);

                } else {

                    input.focus({
                        preventScroll: true
                    });

                    renderCombo(state);

                }

            }
        );

        /* PILIH DENGAN MOUSE */

        options.forEach(option => {

            /*
             * Cegah input kehilangan fokus
             * sebelum tombol pilihan diklik.
             */

            option.addEventListener(
                'pointerdown',
                event => {

                    event.preventDefault();

                }
            );

            option.addEventListener(
                'click',
                () => {

                    selectComboOption(
                        state,
                        option
                    );

                }
            );

        });

        return state;

    }

    /* ========================================================
       INITIALIZATION
    ======================================================== */

    function initializeAktivaCombos() {

        const roots = [
            ...document.querySelectorAll(
                COMBO_SELECTOR
            )
        ];

        if (!roots.length) {
            return;
        }

        comboStates = roots
            .filter(root => {

                if (
                    root.dataset.comboInitialized === '1'
                ) {
                    return false;
                }

                root.dataset.comboInitialized = '1';

                return true;

            })
            .map(initializeCombo)
            .filter(Boolean);

        /* KLIK DI LUAR COMBOBOX */

        document.addEventListener(
            'pointerdown',
            event => {

                const inside = comboStates.some(
                    state =>
                        state.root.contains(event.target)
                );

                if (!inside) {

                    closeAllCombos();

                }

            }
        );

        /* MODAL DITUTUP */

        const modal = document.getElementById(
            'aktivaModal'
        );

        modal?.addEventListener(
            'close',
            () => {

                closeAllCombos();

            }
        );

        /* FORM RESET */

        const form = document.getElementById(
            'aktivaForm'
        );

        form?.addEventListener(
            'reset',
            () => {

                closeAllCombos();

            }
        );

        /* SUBMIT FORM */

        form?.addEventListener(
            'submit',
            () => {

                closeAllCombos();

            }
        );

        /* RESIZE / SCROLL */

        window.addEventListener(
            'resize',
            () => {

                comboStates.forEach(state => {

                    if (!state.dropdown.hidden) {

                        updateComboPosition(state);

                    }

                });

            }
        );

    }

    /* ========================================================
       START
    ======================================================== */

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initializeAktivaCombos
        );

    } else {

        initializeAktivaCombos();

    }

})();
