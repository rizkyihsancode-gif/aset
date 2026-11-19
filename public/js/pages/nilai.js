
/* ============================================================
   NILAI ASET — PERUMDA TIRTA KENCANA

   FULL JAVASCRIPT
   ------------------------------------------------------------
   Fitur:
   01. Format angka dan tanggal
   02. Searchable dropdown
   03. Filter Master Data Aktif
   04. Referensi historis pada form Edit
   05. Filter Departemen dan Divisi
   06. Filter Kode Aktiva Gedung / K.I.B C
   07. CRUD Nilai Aset
   08. Modal Detail dan Hapus
   09. Multi PDF dan Preview
   10. Validasi Form
   11. Grafik Tren Nilai Aset
   12. Grafik Donut Kategori
   13. Responsive Chart

   Ketentuan:
   - Tambah menggunakan POST.
   - Edit menggunakan POST + _method PUT.
   - Master Nonaktif tidak tersedia untuk data baru.
   - Data historis tidak dihapus.
   - Filtering utama wajib dilakukan Controller.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ========================================================
    // 1. HELPER DAN FORMAT DATA
    // ========================================================

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));

    const numberFormat = new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0
    });

    const formatRupiah = value =>
        'Rp ' + numberFormat.format(Number(value) || 0);

    const refreshIcons = () =>
        window.lucide?.createIcons?.();

    function formatCompact(value) {
        const n = Number(value) || 0;
        const a = Math.abs(n);

        const units = [
            [1_000_000_000_000, ' T'],
            [1_000_000_000, ' M'],
            [1_000_000, ' Jt']
        ];

        for (const [unit, suffix] of units) {
            if (a >= unit) {
                const scaled = n / unit;

                const truncated = (
                    scaled < 0
                        ? Math.ceil(scaled * 100)
                        : Math.floor(scaled * 100)
                ) / 100;

                return 'Rp ' + truncated.toLocaleString('id-ID', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + suffix;
            }
        }

        return formatRupiah(n);
    }

    function formatDateIndonesia(value) {
        if (!value) return '-';

        const s = String(value).slice(0, 10);

        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);

        return m
            ? `${m[3]}/${m[2]}/${m[1]}`
            : s;
    }

    function normalizeStatus(value) {
        return String(value ?? '')
            .trim()
            .toLocaleLowerCase('id-ID');
    }

    function normalizeId(value) {
        return value == null
            ? ''
            : String(value).trim();
    }

    // ========================================================
    // 2. KONFIGURASI MASTER DATA
    // ========================================================

    /*
     * Dropdown Master yang digunakan pada Nilai Aset:
     *
     * #nilaiAktiva       -> aktivas
     * #nilaiLokasi       -> lokasis
     * #nilaiDepartemen   -> departemens
     * #nilaiDivisi       -> divisis
     *
     * Controller seharusnya hanya mengirim data:
     *
     * WHERE status = 'aktif'
     *
     * JavaScript ini juga memeriksa data-status apabila
     * atribut tersebut tersedia pada <option>.
     *
     * Option tanpa data-status dianggap sebagai data yang
     * sudah difilter oleh Controller.
     */

    const MASTER_SELECTORS = [
        '#nilaiAktiva',
        '#nilaiLokasi',
        '#nilaiDepartemen',
        '#nilaiDivisi'
    ];

    let nilaiFormMode = 'create';

    const historicalSelections = new Map();

    function isMasterSelect(select) {
        return !!select && MASTER_SELECTORS.some(
            selector => $(selector) === select
        );
    }

    function isHistoricalOption(option) {
        return option?.dataset.historical === '1';
    }

    function isOptionActive(option) {
        if (!option || !option.value) return false;

        const status = normalizeStatus(
            option.dataset.status
        );

        // Jika Controller telah memfilter, data-status
        // tidak harus tersedia pada setiap option.
        if (!status) {
            return true;
        }

        return status === 'aktif';
    }

    function removeHistoricalOptions() {
        for (const selector of MASTER_SELECTORS) {
            const select = $(selector);

            if (!select) continue;

            Array.from(select.options).forEach(option => {
                if (isHistoricalOption(option)) {
                    option.remove();
                }
            });
        }

        historicalSelections.clear();
    }

    function applyMasterStatusFilter() {
        for (const selector of MASTER_SELECTORS) {
            const select = $(selector);

            if (!select) continue;

            const historicalId = historicalSelections.get(
                select.id
            );

            for (const option of select.options) {
                if (!option.value) {
                    option.disabled = false;
                    option.hidden = false;
                    continue;
                }

                const historical =
                    nilaiFormMode === 'edit' &&
                    isHistoricalOption(option) &&
                    normalizeId(option.value) === historicalId;

                const allowed =
                    isOptionActive(option) ||
                    historical;

                option.disabled = !allowed;
                option.hidden = !allowed;
            }

            if (
                select.value &&
                select.selectedOptions[0]?.disabled
            ) {
                select.value = '';
            }
        }
    }

    function setSelectValue(selector, value) {
        const element = $(selector);

        if (!element) return;

        element.value = normalizeId(value);
    }

    /*
     * Membuat option sementara untuk data historis.
     *
     * Digunakan hanya ketika Edit dan referensi lama
     * tidak lagi tersedia dalam dropdown aktif.
     *
     * Option historis dihapus saat membuka form Tambah.
     */

    function setHistoricalMasterValue(
        selector,
        value,
        label = '',
        extraData = {}
    ) {
        const select = $(selector);

        if (!select) return;

        const id = normalizeId(value);

        if (!id) {
            select.value = '';
            return;
        }

        let option = Array.from(select.options).find(
            item => item.value === id
        );

        if (!option) {
            option = document.createElement('option');

            option.value = id;

            option.textContent = label
                ? `${label} (Data Historis)`
                : `ID ${id} (Data Historis)`;

            option.dataset.historical = '1';
            option.dataset.status = 'nonaktif';

            if (extraData.departemen != null) {
                option.dataset.departemen =
                    normalizeId(extraData.departemen);
            }

            if (extraData.kib != null) {
                option.dataset.kib = String(extraData.kib);
            }

            select.appendChild(option);
        }

        if (
            option.dataset.status &&
            normalizeStatus(option.dataset.status) !== 'aktif'
        ) {
            option.dataset.historical = '1';
        }

        if (isHistoricalOption(option)) {
            historicalSelections.set(select.id, id);

            option.disabled = false;
            option.hidden = false;
        }

        select.value = id;
    }

    // ========================================================
    // 3. SEARCHABLE DROPDOWN NILAI ASET
    // ========================================================

    /*
     * Select asli tetap menyimpan ID.
     *
     * Searchable dropdown hanya mempercantik interaksi.
     * Data yang dikirim tetap melalui select asli.
     */

    const nilaiCombos = new Map();

    function syncCombos() {
        for (const combo of nilaiCombos.values()) {
            combo.sync();
        }
    }

    function enhanceSearchableSelect(select) {
        if (
            !select ||
            select.dataset.combobox === 'yes'
        ) {
            return;
        }

        select.dataset.combobox = 'yes';

        const originallyRequired = select.required;

        select.required = false;

        const wrapper = document.createElement('div');
        wrapper.className = 'nilai-combo';

        const input = document.createElement('input');

        input.type = 'text';
        input.className = 'nilai-combo-search';
        input.autocomplete = 'off';

        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');

        input.setAttribute(
            'aria-label',
            'Cari ' + (
                select.closest('.nilai-field')
                    ?.querySelector('label')
                    ?.textContent || 'pilihan'
            ).trim()
        );

        input.placeholder = 'Ketik untuk mencari...';

        input.required = originallyRequired;

        const menu = document.createElement('div');

        menu.className = 'nilai-combo-options';
        menu.setAttribute('role', 'listbox');
        menu.hidden = true;

        const parent = select.parentNode;

        parent.insertBefore(wrapper, select);

        wrapper.append(input, menu, select);

        select.classList.add('nilai-original-select');
        select.tabIndex = -1;

        let visibleOptions = [];
        let activeIndex = -1;

        function selectedLabel() {
            const option = select.selectedOptions?.[0];

            if (!option?.value) return '';

            return option.textContent
                .trim()
                .replace(/\s+/g, ' ');
        }

        function selectable() {
            return Array.from(select.options).filter(option => {
                if (!option.value) return false;
                if (option.disabled || option.hidden) return false;

                if (!isMasterSelect(select)) {
                    return true;
                }

                if (isOptionActive(option)) {
                    return true;
                }

                // Data lama yang sedang diedit boleh
                // ditampilkan sebagai referensi historis.
                return (
                    nilaiFormMode === 'edit' &&
                    isHistoricalOption(option) &&
                    historicalSelections.get(select.id) ===
                        normalizeId(option.value)
                );
            });
        }

        function positionMenu() {
            if (menu.hidden) return;

            const rect = input.getBoundingClientRect();

            const availableBelow =
                window.innerHeight - rect.bottom;

            const height = Math.min(
                260,
                (visibleOptions.length || 1) * 38 + 8
            );

            const above =
                availableBelow < Math.min(190, height) &&
                rect.top > availableBelow;

            menu.style.left =
                Math.round(rect.left) + 'px';

            menu.style.width =
                Math.round(rect.width) + 'px';

            menu.style.top = Math.round(
                above
                    ? Math.max(4, rect.top - height - 4)
                    : rect.bottom + 4
            ) + 'px';

            menu.style.maxHeight = Math.max(
                80,
                above
                    ? rect.top - 12
                    : availableBelow - 12
            ) + 'px';
        }

        function close() {
            menu.hidden = true;

            input.setAttribute(
                'aria-expanded',
                'false'
            );

            activeIndex = -1;
        }

        function sync() {
            input.value = selectedLabel();

            input.setCustomValidity(
                originallyRequired && !select.value
                    ? 'Pilih salah satu data yang tersedia.'
                    : ''
            );

            if (!menu.hidden) {
                render('', true);
            }
        }

        function choose(option) {
            if (
                !option ||
                option.disabled ||
                option.hidden
            ) {
                return;
            }

            select.value = option.value;

            input.value = selectedLabel();
            input.setCustomValidity('');

            select.dispatchEvent(
                new Event('change', {
                    bubbles: true
                })
            );

            close();
            input.focus();
        }

        function render(keyword = '', showAll = false) {
            const text = String(keyword)
                .trim()
                .toLocaleLowerCase('id-ID');

            const options = selectable().filter(option => {
                return (
                    showAll ||
                    option.textContent
                        .toLocaleLowerCase('id-ID')
                        .includes(text)
                );
            });

            visibleOptions = options.slice(0, 100);

            menu.replaceChildren();

            if (visibleOptions.length === 0) {
                const info = document.createElement('div');

                info.className = 'nilai-combo-empty';
                info.textContent = 'Tidak ada data yang cocok.';

                menu.appendChild(info);
            }

            for (const option of visibleOptions) {
                const row = document.createElement('button');

                row.type = 'button';
                row.className = 'nilai-combo-option';
                row.setAttribute('role', 'option');

                row.textContent = option.textContent
                    .trim()
                    .replace(/\s+/g, ' ');

                row.addEventListener(
                    'pointerdown',
                    event => event.preventDefault()
                );

                row.addEventListener(
                    'click',
                    () => choose(option)
                );

                menu.appendChild(row);
            }

            if (options.length > 100) {
                const info = document.createElement('div');

                info.className = 'nilai-combo-empty';

                info.textContent =
                    'Masih ada pilihan lain; ketik lebih spesifik.';

                menu.appendChild(info);
            }

            activeIndex = -1;
            menu.hidden = false;

            input.setAttribute(
                'aria-expanded',
                'true'
            );

            positionMenu();
        }

        input.addEventListener('focus', () => {
            render('', true);
        });

        input.addEventListener('click', () => {
            render('', true);
        });

        input.addEventListener('input', () => {
            // ID lama dibersihkan ketika pengguna mengetik.
            select.value = '';

            select.dispatchEvent(
                new Event('change', {
                    bubbles: true
                })
            );

            input.setCustomValidity(
                'Pilih salah satu data yang tersedia.'
            );

            render(input.value);
        });

        input.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                close();

                input.value = selectedLabel();

                event.stopPropagation();
                return;
            }

            if (
                event.key === 'ArrowDown' ||
                event.key === 'ArrowUp'
            ) {
                event.preventDefault();

                if (menu.hidden) {
                    render('', true);
                }

                if (!visibleOptions.length) {
                    return;
                }

                const direction =
                    event.key === 'ArrowDown' ? 1 : -1;

                activeIndex = Math.max(
                    0,
                    Math.min(
                        visibleOptions.length - 1,
                        activeIndex + direction
                    )
                );

                menu.querySelectorAll(
                    '.nilai-combo-option'
                ).forEach((row, index) => {
                    row.classList.toggle(
                        'highlighted',
                        index === activeIndex
                    );
                });
            }

            if (
                event.key === 'Enter' &&
                !menu.hidden &&
                visibleOptions[activeIndex]
            ) {
                event.preventDefault();

                choose(visibleOptions[activeIndex]);
            }

            if (event.key === 'Tab') {
                close();
            }
        });

        select.addEventListener('change', () => {
            if (
                select.value ||
                document.activeElement !== input
            ) {
                sync();
            }
        });

        document.addEventListener('pointerdown', event => {
            if (!wrapper.contains(event.target)) {
                close();
            }
        });

        window.addEventListener(
            'resize',
            positionMenu
        );

        document.addEventListener(
            'scroll',
            positionMenu,
            true
        );

        nilaiCombos.set(select.id, {
            sync,
            close,
            select
        });

        sync();
    }

    document.querySelectorAll(
        '#nilaiForm select[name]'
    ).forEach(enhanceSearchableSelect);

    // ========================================================
    // 4. MODAL
    // ========================================================

    function openDialog(dialog) {
        if (
            dialog &&
            !dialog.open &&
            typeof dialog.showModal === 'function'
        ) {
            dialog.showModal();
        }
    }

    function closeDialog(dialog) {
        if (
            dialog &&
            dialog.open &&
            typeof dialog.close === 'function'
        ) {
            dialog.close();
        }
    }

    $$('[data-close-dialog]').forEach(button => {
        button.addEventListener('click', () => {
            closeDialog(
                $('#' + button.dataset.closeDialog)
            );
        });
    });

    $$('dialog').forEach(dialog => {
        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                closeDialog(dialog);
            }
        });
    });

    // ========================================================
    // 5. FILTER DEPARTEMEN DAN DIVISI
    // ========================================================

    const departemenSelect = $('#nilaiDepartemen');
    const divisiSelect = $('#nilaiDivisi');

    function filterDivisiByDepartemen(
        preserveCurrent = false
    ) {
        if (
            !departemenSelect ||
            !divisiSelect
        ) {
            return;
        }

        const departemen = normalizeId(
            departemenSelect.value
        );

        const previous = divisiSelect.value;

        const historicalId = historicalSelections.get(
            divisiSelect.id
        );

        Array.from(divisiSelect.options).forEach(option => {
            if (!option.value) {
                option.hidden = false;
                option.disabled = false;
                return;
            }

            const statusAllowed =
                isOptionActive(option) ||
                (
                    nilaiFormMode === 'edit' &&
                    isHistoricalOption(option) &&
                    normalizeId(option.value) === historicalId
                );

            const relationAllowed =
                !departemen ||
                normalizeId(option.dataset.departemen) ===
                    departemen;

            const allowed =
                statusAllowed && relationAllowed;

            option.hidden = !allowed;
            option.disabled = !allowed;
        });

        const oldOption = Array.from(divisiSelect.options)
            .find(option => option.value === previous);

        if (
            preserveCurrent &&
            oldOption &&
            !oldOption.disabled
        ) {
            divisiSelect.value = previous;
        } else if (
            divisiSelect.selectedOptions[0]?.disabled
        ) {
            divisiSelect.value = '';
        }

        syncCombos();
    }

    departemenSelect?.addEventListener('change', () => {
        filterDivisiByDepartemen(false);
    });

    // ========================================================
    // 6. FILTER KODE AKTIVA BERDASARKAN GOLONGAN
    // ========================================================

    const golonganForm = $('#nilaiGolongan');
    const aktivaForm = $('#nilaiAktiva');

    function normalizeKib(value) {
        return String(value || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function filterAktivaGedung() {
        if (
            !golonganForm ||
            !aktivaForm
        ) {
            return;
        }

        const golongan = normalizeKib(
            golonganForm.selectedOptions[0]?.textContent
        );

        const isGedung =
            golongan.includes('GEDUNG') &&
            golongan.includes('BANGUNAN');

        const historicalId = historicalSelections.get(
            aktivaForm.id
        );

        for (const option of aktivaForm.options) {
            if (!option.value) {
                option.hidden = false;
                option.disabled = false;
                continue;
            }

            const historical =
                nilaiFormMode === 'edit' &&
                isHistoricalOption(option) &&
                normalizeId(option.value) === historicalId;

            const statusAllowed =
                isOptionActive(option) ||
                historical;

            const kib = normalizeKib(
                option.dataset.kib
            );

            const match =
                /(?:^| )KIB C(?: |$)/.test(kib) ||
                (
                    kib.includes('GEDUNG') &&
                    kib.includes('BANGUNAN')
                );

            const golonganAllowed =
                !isGedung ||
                match ||
                historical;

            const allowed =
                statusAllowed &&
                golonganAllowed;

            option.disabled = !allowed;
            option.hidden = !allowed;
        }

        if (
            aktivaForm.selectedOptions[0]?.disabled
        ) {
            aktivaForm.value = '';
        }

        syncCombos();
    }

    golonganForm?.addEventListener(
        'change',
        filterAktivaGedung
    );

    // ========================================================
    // 7. FORM TAMBAH DAN EDIT
    // ========================================================

    const formModal = $('#nilaiFormModal');
    const form = $('#nilaiForm');
    const method = $('#nilaiFormMethod');
    const formTitle = $('#nilaiFormTitle');

    const storeUrl = form?.action || '';

    const existingPdf = $('#nilaiExistingPdf');
    const existingPdfName = $('#nilaiExistingPdfName');
    const existingPdfButton = $('#nilaiExistingPdfButton');

    let existingPdfPreviewUrl = null;
    let existingPdfDownloadUrl = null;

    function resetNilaiForm() {
        if (!form) return;

        nilaiFormMode = 'create';

        removeHistoricalOptions();

        form.reset();
        form.action = storeUrl;

        // Tambah: POST murni.
        if (method) {
            method.value = 'PUT';
            method.disabled = true;
        }

        if (formTitle) {
            formTitle.textContent = 'Tambah Nilai Aset';
        }

        const tahun = $('#nilaiTahun');

        const currentYear = String(
            new Date().getFullYear()
        );

        if (
            tahun &&
            Array.from(tahun.options).some(
                option => option.value === currentYear
            )
        ) {
            tahun.value = currentYear;
        }

        existingPdfPreviewUrl = null;
        existingPdfDownloadUrl = null;

        if (existingPdf) {
            existingPdf.hidden = true;
        }

        renderSavedDocuments([]);
        clearLocalPdfPreview();
        resetSelectedPdfFiles();

        applyMasterStatusFilter();
        filterDivisiByDepartemen(false);
        filterAktivaGedung();

        syncCombos();
    }

    // ========================================================
    // 8. TOMBOL TAMBAH NILAI ASET
    // ========================================================

    $('#nilaiAddButton')?.addEventListener('click', () => {
        resetNilaiForm();

        openDialog(formModal);

        refreshIcons();
    });

    // ========================================================
    // 9. FETCH DETAIL DARI CONTROLLER
    // ========================================================

    async function fetchDetail(path) {
        if (!path) {
            throw new Error('URL detail transaksi belum tersedia.');
        }

        let response;
        try {
            response = await fetch(path, {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
        } catch (networkError) {
            console.error('Koneksi detail Nilai Aset gagal:', networkError);
            throw new Error('Tidak dapat terhubung ke server. Periksa koneksi.');
        }

        const contentType = response.headers.get('content-type') || '';
        let body = null;
        if (contentType.includes('json')) {
            body = await response.json().catch(() => null);
        }

        if (!response.ok) {
            const serverMessage = typeof body?.message === 'string'
                ? body.message.trim().slice(0, 300)
                : '';
            const hint = response.status === 404
                ? 'Transaksi atau alamat endpoint tidak ditemukan.'
                : response.status === 401 || response.status === 419
                    ? 'Sesi login tidak berlaku. Silakan masuk kembali.'
                    : response.status === 403
                        ? 'Akses transaksi ditolak.'
                        : response.status === 500
                            ? 'Terjadi kesalahan server. Periksa storage/logs/laravel.log.'
                            : 'Periksa koneksi dan log Laravel.';
            console.error('Gagal mengambil detail Nilai Aset:', {
                url: path,
                status: response.status,
                message: serverMessage
            });
            throw new Error(`HTTP ${response.status}. ${hint}${serverMessage ? ' (' + serverMessage + ')' : ''}`);
        }

        if (!body || body.success === false || !body.data) {
            throw new Error('Respons detail tidak berisi data JSON yang valid.');
        }

        return body.data;
    }

    // ========================================================
    // 10. DAFTAR DOKUMEN PDF
    // ========================================================

    const documentsModal = $('#nilaiDocumentsModal');
    const documentsList = $('#nilaiDocumentsList');
    const savedDocuments = $('#nilaiSavedDocuments');

    function formatBytes(bytes) {
        const n = Number(bytes) || 0;

        if (n <= 0) {
            return 'Ukuran tidak tersedia';
        }

        const units = [
            'B',
            'KB',
            'MB',
            'GB',
            'TB'
        ];

        let size = n;
        let unit = 0;

        while (
            size >= 1024 &&
            unit < units.length - 1
        ) {
            size /= 1024;
            unit++;
        }

        return size.toLocaleString('id-ID', {
            maximumFractionDigits: 2
        }) + ' ' + units[unit];
    }

    function createDocumentRow(doc) {
        const row = document.createElement('div');
        row.className = 'nilai-document-item';

        const info = document.createElement('div');

        const name = document.createElement('strong');
        name.textContent = doc.name || 'Dokumen PDF';

        const size = document.createElement('small');
        size.textContent = formatBytes(doc.size);

        info.append(name, size);

        const actions = document.createElement('div');
        actions.className = 'nilai-document-actions';

        const preview = document.createElement('button');

        preview.type = 'button';
        preview.className = 'nilai-outline-button';
        preview.textContent = 'Preview';

        preview.addEventListener('click', () => {
            openPdfModal(
                doc.preview_url,
                doc.download_url,
                doc.name
            );
        });

        const download = document.createElement('a');

        download.className = 'nilai-outline-button';
        download.href = doc.download_url || '#';
        download.textContent = 'Download';

        actions.append(preview, download);
        row.append(info, actions);

        return row;
    }

    function renderSavedDocuments(documents) {
        if (!savedDocuments) return;

        savedDocuments.replaceChildren();

        savedDocuments.hidden =
            !documents.length;

        if (documents.length) {
            const heading = document.createElement('strong');

            heading.textContent =
                'Dokumen yang sudah tersimpan (' +
                documents.length + ')';

            savedDocuments.appendChild(heading);

            documents.forEach(doc => {
                savedDocuments.appendChild(
                    createDocumentRow(doc)
                );
            });
        }
    }

    function openDocuments(documents) {
        if (
            !documentsModal ||
            !documentsList
        ) {
            return;
        }

        documentsList.replaceChildren();

        if (!documents.length) {
            const info = document.createElement('p');

            info.textContent =
                'Belum ada PDF untuk transaksi ini.';

            documentsList.appendChild(info);
        } else {
            documents.forEach(doc => {
                documentsList.appendChild(
                    createDocumentRow(doc)
                );
            });
        }

        openDialog(documentsModal);
    }

    // ========================================================
    // 11. EDIT NILAI ASET
    // ========================================================

    $$('.js-edit').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                if (!form) return;

                const data = await fetchDetail(
                    button.dataset.url
                );

                resetNilaiForm();

                nilaiFormMode = 'edit';

                form.action = button.dataset.updateUrl;

                // Edit: POST dengan _method=PUT.
                if (method) {
                    method.value = 'PUT';
                    method.disabled = false;
                }

                if (formTitle) {
                    formTitle.textContent = 'Edit Nilai Aset';
                }

                const voucher = $('#nilaiNoVoucher');
                const tanggal = $('#nilaiTanggal');
                const nominal = $('#nilaiNominal');
                const uraian = $('#nilaiUraian');

                if (voucher) {
                    voucher.value = data.no_voucher || '';
                }

                if (tanggal) {
                    tanggal.value = String(
                        data.tgl_voucher || ''
                    ).slice(0, 10);
                }

                // Golongan dipilih terlebih dahulu.
                setSelectValue(
                    '#nilaiGolongan',
                    data.cat
                );

                // Pilih Master Kode Aktiva.
                setHistoricalMasterValue(
                    '#nilaiAktiva',
                    data.id_aktiva,
                    [
                        data.aktiva_kode,
                        data.aktiva_nama
                    ].filter(Boolean).join(' | '),
                    {
                        kib: data.aktiva_kib || ''
                    }
                );

                // Pilih Master Lokasi.
                setHistoricalMasterValue(
                    '#nilaiLokasi',
                    data.id_lokasi,
                    data.lokasi_nama || ''
                );

                // Pilih Master Departemen.
                setHistoricalMasterValue(
                    '#nilaiDepartemen',
                    data.dep,
                    data.departemen_nama || ''
                );

                // Pilih Master Divisi.
                setHistoricalMasterValue(
                    '#nilaiDivisi',
                    data.div,
                    data.divisi_nama || '',
                    {
                        departemen: data.dep
                    }
                );

                setSelectValue(
                    '#nilaiTahun',
                    data.tahun
                );

                setSelectValue(
                    '#nilaiJenis',
                    data.jenisn
                );

                if (nominal) {
                    nominal.value = data.nilai ?? 0;
                }

                if (uraian) {
                    uraian.value = data.urai || '';
                }

                existingPdfPreviewUrl =
                    data.pdf_preview_url || null;

                existingPdfDownloadUrl =
                    data.pdf_download_url || null;

                if (existingPdf) {
                    existingPdf.hidden = true;
                }

                if (existingPdfName) {
                    existingPdfName.textContent =
                        data.dokumen_pdf_nama_asli ||
                        'Dokumen PDF';
                }

                renderSavedDocuments(
                    data.documents || []
                );

                applyMasterStatusFilter();

                filterDivisiByDepartemen(true);
                filterAktivaGedung();

                syncCombos();

                openDialog(formModal);
                refreshIcons();

            } catch (error) {
                console.error(
                    'EDIT NILAI:',
                    error
                );

                alert(
                    'Data Nilai Aset tidak dapat dimuat.\n' + error.message
                );
            }
        });
    });

    // ========================================================
    // 12. PDF LAMA
    // ========================================================

    existingPdfButton?.addEventListener('click', () => {
        if (existingPdfPreviewUrl) {
            openPdfModal(
                existingPdfPreviewUrl,
                existingPdfDownloadUrl,
                existingPdfName?.textContent || 'Dokumen PDF'
            );
        }
    });

    // ========================================================
    // 13. MODAL DETAIL NILAI ASET
    // ========================================================

    const detailModal = $('#nilaiDetailModal');
    const detailPdfButton = $('#detailPdfButton');

    let detailPdfPreviewUrl = null;
    let detailPdfDownloadUrl = null;
    let detailDocuments = [];

    $$('.js-view').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                const data = await fetchDetail(
                    button.dataset.url
                );

                const fields = {
                    detailVoucher:
                        data.no_voucher || '-',

                    detailTanggal:
                        formatDateIndonesia(
                            data.tgl_voucher
                        ),

                    detailAktiva:
                        [
                            data.aktiva_kode,
                            data.aktiva_nama
                        ]
                            .filter(Boolean)
                            .join(' | ') || '-',

                    detailTahun:
                        data.tahun || '-',

                    detailLokasi:
                        data.lokasi_nama || '-',

                    detailDepartemen:
                        data.departemen_nama || '-',

                    detailDivisi:
                        data.divisi_nama || '-',

                    detailGolongan:
                        data.golongan_nama || '-',

                    detailJenis:
                        data.jenis_nama || '-',

                    detailNilai:
                        formatRupiah(data.nilai),

                    detailUraian:
                        data.urai || '-'
                };

                for (
                    const [id, value]
                    of Object.entries(fields)
                ) {
                    const element = $('#' + id);

                    if (element) {
                        element.textContent = value;
                    }
                }

                detailPdfPreviewUrl =
                    data.pdf_preview_url || null;

                detailPdfDownloadUrl =
                    data.pdf_download_url || null;

                detailDocuments = Array.isArray(
                    data.documents
                )
                    ? data.documents
                    : [];

                if (detailPdfButton) {
                    detailPdfButton.hidden =
                        detailDocuments.length === 0;

                    detailPdfButton.textContent =
                        `Lihat ${detailDocuments.length} Dokumen PDF`;
                }

                openDialog(detailModal);
                refreshIcons();

            } catch (error) {
                console.error(
                    'DETAIL NILAI:',
                    error
                );

                alert(
                    'Detail Nilai Aset tidak dapat dimuat.\n' + error.message
                );
            }
        });
    });

    detailPdfButton?.addEventListener('click', () => {
        openDocuments(detailDocuments);
    });

    // ========================================================
    // 14. HAPUS NILAI ASET
    // ========================================================

    const deleteModal = $('#nilaiDeleteModal');
    const deleteForm = $('#nilaiDeleteForm');
    const deleteName = $('#nilaiDeleteName');

    $$('.js-delete').forEach(button => {
        button.addEventListener('click', () => {
            if (
                !deleteModal ||
                !deleteForm
            ) {
                return;
            }

            deleteForm.action =
                button.dataset.deleteUrl;

            if (deleteName) {
                deleteName.textContent =
                    button.dataset.name || 'data ini';
            }

            openDialog(deleteModal);
            refreshIcons();
        });
    });

    // ========================================================
    // 15. PREVIEW DAN DOWNLOAD PDF
    // ========================================================

    const pdfModal = $('#nilaiPdfModal');
    const pdfFrame = $('#nilaiPdfFrame');
    const pdfTitle = $('#nilaiPdfTitle');
    const pdfDownload = $('#nilaiPdfDownload');

    function openPdfModal(
        previewUrl,
        downloadUrl,
        title
    ) {
        if (
            !previewUrl ||
            !pdfModal
        ) {
            return;
        }

        if (pdfFrame) {
            pdfFrame.src = previewUrl;
        }

        if (pdfDownload) {
            pdfDownload.href =
                downloadUrl || previewUrl;
        }

        if (pdfTitle) {
            pdfTitle.textContent =
                title || 'Preview PDF';
        }

        openDialog(pdfModal);
        refreshIcons();
    }

    $$('.js-pdf-button').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                const data = await fetchDetail(
                    button.dataset.url
                );

                openDocuments(
                    data.documents || []
                );

            } catch (error) {
                console.error(
                    'Gagal membuka daftar dokumen:',
                    error
                );

                alert(
                    'Daftar dokumen tidak dapat dimuat.\n' + error.message
                );
            }
        });
    });

    pdfModal?.addEventListener('close', () => {
        if (pdfFrame) {
            pdfFrame.src = 'about:blank';
        }
    });

    // ========================================================
    // 16. MULTI PDF
    // ========================================================

    const pdfInput = $('#nilaiPdfInput');

    const localPdfPreview = $('#nilaiLocalPdfPreview');
    const localPdfFrame = $('#nilaiLocalPdfFrame');
    const localPdfName = $('#nilaiLocalPdfName');
    const selectedPdfList = $('#nilaiSelectedPdfList');

    let localPdfUrl = null;
    let selectedPdfFiles = [];

    function clearLocalPdfPreview() {
        if (localPdfUrl) {
            URL.revokeObjectURL(localPdfUrl);
            localPdfUrl = null;
        }

        if (localPdfPreview) {
            localPdfPreview.hidden = true;
        }

        if (localPdfFrame) {
            localPdfFrame.src = 'about:blank';
        }

        if (localPdfName) {
            localPdfName.textContent = '';
        }
    }

    function setPdfInputFiles() {
        if (!pdfInput) return;

        const dataTransfer = new DataTransfer();

        selectedPdfFiles.forEach(file => {
            dataTransfer.items.add(file);
        });

        pdfInput.files = dataTransfer.files;
    }

    function previewSelectedPdf(index) {
        clearLocalPdfPreview();

        const file = selectedPdfFiles[index];

        if (!file) return;

        localPdfUrl = URL.createObjectURL(file);

        if (localPdfFrame) {
            localPdfFrame.src = localPdfUrl;
        }

        if (localPdfName) {
            localPdfName.textContent = file.name;
        }

        if (localPdfPreview) {
            localPdfPreview.hidden = false;
        }
    }

    function renderSelectedPdfFiles() {
        if (!selectedPdfList) return;

        selectedPdfList.replaceChildren();

        selectedPdfList.hidden =
            selectedPdfFiles.length === 0;

        if (!selectedPdfFiles.length) {
            clearLocalPdfPreview();
            return;
        }

        const summary = document.createElement('strong');

        summary.textContent =
            selectedPdfFiles.length + ' PDF siap diunggah';

        selectedPdfList.appendChild(summary);

        selectedPdfFiles.forEach((file, index) => {
            const row = document.createElement('div');
            row.className = 'nilai-document-item';

            const details = document.createElement('div');

            const name = document.createElement('strong');
            name.textContent = file.name;

            const size = document.createElement('small');
            size.textContent = formatBytes(file.size);

            details.append(name, size);

            const buttons = document.createElement('div');
            buttons.className = 'nilai-document-actions';

            const preview = document.createElement('button');

            preview.type = 'button';
            preview.textContent = 'Preview';

            preview.addEventListener('click', () => {
                previewSelectedPdf(index);
            });

            const remove = document.createElement('button');

            remove.type = 'button';
            remove.textContent = 'Hapus';

            remove.addEventListener('click', () => {
                selectedPdfFiles.splice(index, 1);

                setPdfInputFiles();
                renderSelectedPdfFiles();

                if (selectedPdfFiles.length) {
                    previewSelectedPdf(0);
                }
            });

            buttons.append(preview, remove);
            row.append(details, buttons);

            selectedPdfList.appendChild(row);
        });
    }

    function resetSelectedPdfFiles() {
        selectedPdfFiles = [];

        if (pdfInput) {
            pdfInput.value = '';
        }

        renderSelectedPdfFiles();
    }

    pdfInput?.addEventListener('change', () => {
        const incoming = Array.from(
            pdfInput.files || []
        );

        for (const file of incoming) {
            const pdf =
                file.type === 'application/pdf' ||
                file.name.toLowerCase().endsWith('.pdf');

            if (!pdf) {
                alert(
                    file.name + ' bukan file PDF.'
                );

                continue;
            }

            const duplicate = selectedPdfFiles.some(old => {
                return (
                    old.name === file.name &&
                    old.size === file.size &&
                    old.lastModified === file.lastModified
                );
            });

            if (!duplicate) {
                selectedPdfFiles.push(file);
            }
        }

        setPdfInputFiles();
        renderSelectedPdfFiles();

        if (selectedPdfFiles.length) {
            previewSelectedPdf(0);
        }
    });

    // ========================================================
    // 17. VALIDASI MASTER DATA SEBELUM SUBMIT
    // ========================================================

    /*
     * Validasi JS membantu pengguna.
     *
     * Backend tetap wajib memastikan bahwa:
     * - ID Master Data valid.
     * - Master Aktif boleh digunakan.
     * - Master Nonaktif tidak boleh dipilih untuk input baru.
     * - Referensi historis yang tidak berubah tetap aman
     *   sesuai aturan validasi update di Controller.
     */

    form?.addEventListener('submit', event => {
        for (const selector of MASTER_SELECTORS) {
            const select = $(selector);

            if (
                !select ||
                !select.value
            ) {
                continue;
            }

            const option = select.selectedOptions?.[0];

            if (!option) continue;

            if (
                option.disabled ||
                option.hidden
            ) {
                event.preventDefault();

                alert(
                    'Terdapat pilihan Master Data yang tidak tersedia. ' +
                    'Silakan pilih data aktif.'
                );

                select.closest('.nilai-combo')
                    ?.querySelector('.nilai-combo-search')
                    ?.focus();

                return;
            }

            const historical =
                nilaiFormMode === 'edit' &&
                isHistoricalOption(option) &&
                historicalSelections.get(select.id) ===
                    normalizeId(option.value);

            if (
                !isOptionActive(option) &&
                !historical
            ) {
                event.preventDefault();

                alert(
                    'Data Master berstatus Nonaktif tidak boleh ' +
                    'digunakan untuk transaksi baru.'
                );

                return;
            }
        }
    });

    // ========================================================
    // 18. VALIDASI ERROR LARAVEL
    // ========================================================

    const pageRoot = $('#nilaiPage');

    if (
        pageRoot?.dataset.validationErrors === '1'
    ) {
        /*
         * Pertahankan old() dari Blade.
         *
         * Jika validasi gagal saat Edit, Controller/Blade
         * harus mengirim kembali referensi historis yang
         * benar agar data tidak kehilangan pilihan.
         */

        const oldMethod = normalizeStatus(
            method?.value
        );

        nilaiFormMode =
            method &&
            !method.disabled &&
            oldMethod === 'put'
                ? 'edit'
                : 'create';

        applyMasterStatusFilter();

        filterDivisiByDepartemen(true);
        filterAktivaGedung();

        syncCombos();

        openDialog(formModal);
    }

    // ========================================================
    // 19. MEMBACA DATA GRAFIK DARI BLADE
    // ========================================================

    let chartData = {
        trendLabels: [],
        trendValues: [],
        categoryLabels: [],
        categoryValues: []
    };

    const chartJson = $('#nilaiChartData');

    if (chartJson) {
        try {
            chartData = JSON.parse(
                chartJson.textContent
            );
        } catch (error) {
            console.error(
                'Chart JSON error:',
                error
            );
        }
    }

    // ========================================================
    // 20. GRAFIK TREN NILAI ASET
    // ========================================================

    const trendCanvas = $('#nilaiTrendCanvas');

    function drawTrendChart() {
        if (
            !trendCanvas ||
            !trendCanvas.parentElement
        ) {
            return;
        }

        const parent = trendCanvas.parentElement;

        const width = Math.max(
            parent.clientWidth,
            320
        );

        const height = Math.max(
            parent.clientHeight,
            190
        );

        const dpr = window.devicePixelRatio || 1;

        trendCanvas.width = Math.round(
            width * dpr
        );

        trendCanvas.height = Math.round(
            height * dpr
        );

        trendCanvas.style.width = width + 'px';
        trendCanvas.style.height = height + 'px';

        const ctx = trendCanvas.getContext('2d');

        if (!ctx) return;

        ctx.setTransform(
            dpr, 0, 0, dpr, 0, 0
        );

        ctx.clearRect(
            0, 0, width, height
        );

        const labels =
            chartData.trendLabels || [];

        const values =
            (chartData.trendValues || []).map(Number);

        if (!labels.length) return;

        const padding = {
            left: 62,
            right: 22,
            top: 22,
            bottom: 34
        };

        const gw = Math.max(
            1,
            width - padding.left - padding.right
        );

        const gh = Math.max(
            1,
            height - padding.top - padding.bottom
        );

        const maximum = Math.max(
            ...values,
            1
        );

        ctx.font = '11px Arial, sans-serif';
        ctx.lineWidth = 1;

        // Grid dan label.
        for (let i = 0; i <= 4; i++) {
            const y =
                padding.top + gh * i / 4;

            ctx.beginPath();

            ctx.moveTo(
                padding.left,
                y
            );

            ctx.lineTo(
                width - padding.right,
                y
            );

            ctx.strokeStyle = '#e1ebf4';
            ctx.stroke();

            ctx.fillStyle = '#70839d';
            ctx.textAlign = 'left';

            ctx.fillText(
                formatCompact(
                    maximum - maximum * i / 4
                ).replace('Rp ', ''),
                4,
                y + 4
            );
        }

        const points = values.map((value, index) => ({
            x:
                labels.length === 1
                    ? padding.left
                    : padding.left +
                      gw * index / (labels.length - 1),

            y:
                padding.top +
                gh -
                value / maximum * gh,

            value
        }));

        const gradient = ctx.createLinearGradient(
            0,
            padding.top,
            0,
            height - padding.bottom
        );

        gradient.addColorStop(
            0,
            'rgba(8,106,216,.24)'
        );

        gradient.addColorStop(
            1,
            'rgba(8,106,216,.015)'
        );

        // Area di bawah garis.
        ctx.beginPath();

        ctx.moveTo(
            points[0].x,
            height - padding.bottom
        );

        points.forEach(point => {
            ctx.lineTo(
                point.x,
                point.y
            );
        });

        ctx.lineTo(
            points[points.length - 1].x,
            height - padding.bottom
        );

        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        // Garis tren.
        ctx.beginPath();

        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(
                    point.x,
                    point.y
                );
            } else {
                ctx.lineTo(
                    point.x,
                    point.y
                );
            }
        });

        ctx.strokeStyle = '#086ad8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Titik dan tahun.
        points.forEach((point, index) => {
            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = '#086ad8';
            ctx.fill();

            ctx.fillStyle = '#556e8b';
            ctx.textAlign = 'center';

            ctx.fillText(
                labels[index],
                point.x,
                height - 8
            );
        });

        trendCanvas.onpointermove = event => {
            const rect =
                trendCanvas.getBoundingClientRect();

            const x = event.clientX - rect.left;

            const nearest = points.reduce(
                (winner, point, index) => {
                    return Math.abs(point.x - x) <
                        Math.abs(points[winner].x - x)
                        ? index
                        : winner;
                },
                0
            );

            trendCanvas.title =
                labels[nearest] + ': ' +
                formatRupiah(
                    points[nearest].value
                );
        };
    }

    // ========================================================
    // 21. GRAFIK DONUT NILAI ASET
    // ========================================================

    const donutCanvas = $('#nilaiDonutCanvas');
    const donutLegend = $('#nilaiDonutLegend');

    const donutColors = [
        '#3489ef',
        '#ffb42c',
        '#36bd82',
        '#eb5c68',
        '#8d68e8',
        '#5bc3e6',
        '#7190af',
        '#16a5a5'
    ];

    function drawDonutChart() {
        if (
            !donutCanvas ||
            !donutCanvas.parentElement
        ) {
            return;
        }

        const parent = donutCanvas.parentElement;

        const size = Math.min(
            parent.clientWidth,
            parent.clientHeight
        ) || 165;

        const dpr = window.devicePixelRatio || 1;

        donutCanvas.width = Math.round(
            size * dpr
        );

        donutCanvas.height = Math.round(
            size * dpr
        );

        donutCanvas.style.width = size + 'px';
        donutCanvas.style.height = size + 'px';

        const ctx = donutCanvas.getContext('2d');

        if (!ctx) return;

        ctx.setTransform(
            dpr, 0, 0, dpr, 0, 0
        );

        ctx.clearRect(
            0, 0, size, size
        );

        const labels =
            chartData.categoryLabels || [];

        const values =
            (chartData.categoryValues || []).map(Number);

        const total = values.reduce(
            (sum, value) => sum + value,
            0
        );

        const center = size / 2;
        const radius = size * 0.39;
        const thickness = size * 0.18;

        // Kondisi tidak ada data.
        if (total <= 0) {
            ctx.beginPath();

            ctx.arc(
                center,
                center,
                radius,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle = '#e7edf4';
            ctx.lineWidth = thickness;
            ctx.stroke();

            if (donutLegend) {
                donutLegend.replaceChildren();
            }

            return;
        }

        let start = -Math.PI / 2;

        // Segmen donut.
        values.forEach((value, index) => {
            const angle =
                value / total * Math.PI * 2;

            ctx.beginPath();

            ctx.arc(
                center,
                center,
                radius,
                start,
                start + angle
            );

            ctx.strokeStyle =
                donutColors[
                    index % donutColors.length
                ];

            ctx.lineWidth = thickness;
            ctx.stroke();

            start += angle;
        });

        // Tooltip.
        donutCanvas.onpointermove = event => {
            const rect =
                donutCanvas.getBoundingClientRect();

            const x =
                event.clientX - rect.left - center;

            const y =
                event.clientY - rect.top - center;

            const distance = Math.hypot(x, y);

            if (
                distance < radius - thickness ||
                distance > radius + thickness
            ) {
                donutCanvas.title =
                    'Nilai K.I.B: ' +
                    formatRupiah(total);

                return;
            }

            let angle =
                Math.atan2(y, x) + Math.PI / 2;

            if (angle < 0) {
                angle += Math.PI * 2;
            }

            let cursor = 0;

            for (let i = 0; i < values.length; i++) {
                cursor +=
                    values[i] / total * Math.PI * 2;

                if (angle <= cursor) {
                    donutCanvas.title =
                        labels[i] + ': ' +
                        formatRupiah(values[i]);

                    break;
                }
            }
        };

        // Legenda.
        if (donutLegend) {
            donutLegend.replaceChildren();

            labels.forEach((label, index) => {
                const row = document.createElement('div');
                row.className = 'nilai-legend-item';

                const dot = document.createElement('span');
                dot.className = 'nilai-legend-dot';

                dot.style.background =
                    donutColors[
                        index % donutColors.length
                    ];

                const name = document.createElement('span');
                name.textContent = label;

                const percentage =
                    document.createElement('strong');

                percentage.textContent = (
                    100 *
                    (values[index] || 0) /
                    total
                ).toLocaleString('id-ID', {
                    maximumFractionDigits: 1
                }) + '%';

                row.append(
                    dot,
                    name,
                    percentage
                );

                donutLegend.appendChild(row);
            });
        }
    }

    // ========================================================
    // 22. RESPONSIVE GRAFIK
    // ========================================================

    let resizeTimer = null;

    function redrawCharts() {
        drawTrendChart();
        drawDonutChart();
    }

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(
            redrawCharts,
            120
        );
    });

    // ========================================================
    // 23. INITIALISASI
    // ========================================================

    applyMasterStatusFilter();

    filterDivisiByDepartemen(true);
    filterAktivaGedung();

    syncCombos();
    redrawCharts();
    refreshIcons();

    // ========================================================
    // END NILAI ASET JAVASCRIPT
    // ========================================================
});
