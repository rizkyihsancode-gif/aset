
/*
|--------------------------------------------------------------------------
| K.I.B F — KONSTRUKSI MANUAL
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| Fitur:
| - Tabel utama Konstruksi
| - Popup Detail Kelompok
| - Panel Kategori / Lokasi / Divisi
| - Panel Daftar Pekerjaan
| - Popup Detail Excel KIB F
| - Link PDF / Gambar dengan ikon
| - Create, Edit, Delete
| - Searchable Dropdown
| - Master Data dan saran historis
| - Multiple File Upload
| - Jam WITA
|
| Database:
| - kib_konstruksi_manual
| - kib_konstruksi_dokumens
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('kfApp');

    if (!root || root.dataset.initialized === '1') {
        return;
    }

    root.dataset.initialized = '1';

    const $ = id => document.getElementById(id);

    const base = (root.dataset.base || '').replace(/\/$/, '');
    const groupUrl = root.dataset.groupUrl || '';
    const csrfToken = root.dataset.token || '';

    const form = $('kfForm');

    const formDialog = $('kfModalForm');
    const groupDialog = $('kfGroupDialog');
    const detailDialog = $('kfModalDetail');
    const deleteDialog = $('kfModalDelete');

    const fields = [
        'nama_barang_manual',
        'kategori',
        'cakupan',
        'lokasi_manual',
        'alamat_manual',
        'departemen_manual',
        'divisi_manual',
        'tahun',
        'type',
        'struktur',
        'materi',
        'letak',
        'status_tanah',
        'asal',
        'status_aset',
        'nilai',
        'urai',
        'ket'
    ];

    const normalize = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');

    const uppercase = value => String(value ?? '')
        .trim()
        .toUpperCase();

    const display = value => {
        const string = String(value ?? '').trim();
        return string || '—';
    };

    const rupiah = value =>
        'Rp ' + (Number(value) || 0)
            .toLocaleString('id-ID', {
                maximumFractionDigits: 2
            });

    const list = value =>
        Array.isArray(value) ? value : [];

    let active = null;
    let editId = null;
    let deleteTarget = null;

    let saving = false;
    let deleting = false;

    let newFiles = [];

    let toastTimer = null;

    const combos = new Map();


    /* ======================================================
       MASTER DATA DAN SARAN
    ====================================================== */

    function readJson(id, fallback) {
        try {
            const element = $(id);

            if (!element) return fallback;

            return JSON.parse(element.textContent) || fallback;

        } catch (exception) {
            console.warn('JSON tidak dapat dibaca:', id);

            return fallback;
        }
    }

    const suggestions = readJson('kfSuggestions', {});
    const master = readJson('kfMasterOptions', {});


    /* ======================================================
       DOM HELPER
    ====================================================== */

    function refreshIcons() {
        window.lucide?.createIcons?.();
    }

    function makeElement(
        tag,
        className = '',
        value = null
    ) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (value !== null && value !== undefined) {
            element.textContent = String(value);
        }

        return element;
    }

    function makeCell(
        row,
        content,
        className = ''
    ) {
        const td = document.createElement('td');

        if (
            typeof content === 'string' ||
            typeof content === 'number'
        ) {
            td.textContent = String(content);

        } else if (content) {
            td.appendChild(content);
        }

        if (className) {
            td.className = className;
        }

        row.appendChild(td);

        return td;
    }


    /* ======================================================
       MODAL
    ====================================================== */

    function openDialog(dialog) {
        if (!dialog || dialog.open) {
            return;
        }

        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        }

        refreshIcons();
    }

    function closeDialog(dialog) {
        if (dialog?.open) {
            dialog.close();
        }
    }

    document.querySelectorAll('[data-kf-close]')
        .forEach(button => {

            button.addEventListener('click', () => {
                closeDialog(
                    $(button.dataset.kfClose)
                );
            });
        });


    /* ======================================================
       TOAST
    ====================================================== */

    function showToast(message) {
        const node = $('kfToast');

        if (!node) return;

        node.textContent = message;
        node.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            node.hidden = true;
        }, 4000);
    }


    /* ======================================================
       ERROR FORM
    ====================================================== */

    function showError(message) {
        const node = $('kfError');

        if (!node) return;

        node.textContent = message || '';
        node.hidden = !message;

        if (message) {
            node.scrollIntoView({
                block: 'nearest'
            });
        }
    }


    /* ======================================================
       REQUEST LARAVEL
    ====================================================== */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken,

                ...(options.headers || {})
            }
        });

        if (
            response.redirected &&
            response.url.includes('/login')
        ) {
            throw new Error(
                'Sesi login habis. Silakan login kembali.'
            );
        }

        const data = await response
            .json()
            .catch(() => ({}));

        if (!response.ok || data.success === false) {

            const validation = data.errors
                ? Object.values(data.errors)
                    .flat()
                    .join('\n')
                : '';

            let message = validation ||
                data.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (response.status === 413) {
                message =
                    'Ukuran unggahan melebihi batas server.';
            }

            if (response.status === 419) {
                message =
                    'Sesi login habis. Refresh halaman.';
            }

            if (response.status === 403) {
                message =
                    'Akun tidak memiliki izin.';
            }

            if (response.status === 404) {
                message =
                    'Data atau endpoint tidak ditemukan.';
            }

            throw new Error(message);
        }

        return data;
    }


    /* ======================================================
       TANGGAL DAN JAM WITA
    ====================================================== */

    function initializeClock() {
        const dateNode = $('kfTanggal');
        const timeNode = $('kfJam');

        if (!dateNode || !timeNode) return;

        const dateFormatter = new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone: 'Asia/Makassar',
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        );

        const timeFormatter = new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone: 'Asia/Makassar',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }
        );

        function update() {
            const now = new Date();

            const date = dateFormatter.format(now);

            dateNode.textContent =
                date.charAt(0).toUpperCase() +
                date.slice(1);

            timeNode.textContent = timeFormatter
                .format(now)
                .replace(/\./g, ':');
        }

        update();

        setInterval(update, 1000);
    }


    /* ======================================================
       SEARCHABLE DROPDOWN
    ====================================================== */

    const predefined = {
        kategori: [
            {
                value: 'IPA',
                label: 'Instalasi Pengolahan Air (IPA)'
            },
            {
                value: 'BOOSTER',
                label: 'Booster'
            },
            {
                value: 'PERPIPAAN',
                label: 'Perpipaan'
            }
        ],

        bangunan: [
            {
                value: 'P',
                label: 'Permanen'
            },
            {
                value: 'SP',
                label: 'Semi Permanen'
            },
            {
                value: 'D',
                label: 'Darurat'
            }
        ],

        struktur: [
            { value: 'BERTINGKAT' },
            { value: 'TIDAK BERTINGKAT' }
        ],

        materi: [
            { value: 'BETON' },
            { value: 'TIDAK BETON' }
        ],

        status_tanah: [
            { value: 'Pemkot' },
            { value: 'Hak Pakai' },
            { value: 'Milik Perumda' }
        ],

        asal: [
            { value: 'Pemprov' },
            { value: 'Pemkot' },
            { value: 'Perumda' },
            { value: 'Hibah' }
        ],

        status_aset: [
            { value: 'Serah Terima' },
            { value: 'Dalam Pengerjaan' },
            { value: 'Selesai' }
        ]
    };


    /*
     * Ambil opsi dari Master Data dan
     * data historis manual.
     */

    function getOptions(source) {
        let result = [];

        if (predefined[source]) {
            result.push(...predefined[source]);
        }

        if (source === 'lokasi') {

            result.push(
                ...list(master.lokasi)
                    .filter(row => row.lokasi)
                    .map(row => ({
                        value: row.lokasi,
                        label: row.alamat || '',
                        ref: row
                    }))
            );

        } else if (source === 'departemen') {

            result.push(
                ...list(master.departemen)
                    .filter(row => row.nama_dep)
                    .map(row => ({
                        value: row.nama_dep,
                        ref: row
                    }))
            );

        } else if (source === 'divisi') {

            const department = list(master.departemen)
                .find(row =>
                    normalize(row.nama_dep) ===
                    normalize($('kfDepartemen')?.value)
                );

            const available = department
                ? list(master.divisi).filter(row =>
                    String(row.id_dep) ===
                    String(department.id)
                )
                : list(master.divisi);

            result.push(
                ...available
                    .filter(row => row.nama_div)
                    .map(row => ({
                        value: row.nama_div,
                        ref: row
                    }))
            );
        }

        const aliases = {
            lokasi: 'lokasi',
            departemen: 'departemen',
            divisi: 'divisi',
            cakupan: 'cakupan'
        };

        const key = aliases[source];

        if (key) {
            result.push(
                ...list(suggestions[key]).map(value => ({
                    value: String(value)
                }))
            );
        }

        const seen = new Set();

        return result.filter(item => {
            const key = normalize(item.value);

            if (!key || seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }


    /*
     * Dropdown custom:
     * - dapat dicari
     * - dapat dipilih
     * - dapat diketik manual untuk field bebas
     * - mendukung keyboard
     */

    function initializeComboboxes() {
        if (!form) return;

        const inputs = form.querySelectorAll(
            '[data-kf-combo]'
        );

        inputs.forEach(input => {

            if (input.dataset.ready === '1') return;

            input.dataset.ready = '1';
            input.autocomplete = 'off';

            const source = input.dataset.kfCombo;

            const wrapper = makeElement(
                'div',
                'kf-combo'
            );

            input.parentNode.insertBefore(
                wrapper,
                input
            );

            wrapper.appendChild(input);

            const arrow = makeElement(
                'button',
                'kf-combo-arrow',
                '⌄'
            );

            arrow.type = 'button';

            arrow.setAttribute(
                'aria-label',
                'Tampilkan pilihan'
            );

            const panel = makeElement(
                'div',
                'kf-combo-list'
            );

            panel.hidden = true;
            panel.setAttribute('role', 'listbox');

            wrapper.append(arrow, panel);

            const widgetId = input.name;

            let shown = [];
            let activeIndex = -1;


            function close() {
                panel.hidden = true;

                wrapper.classList.remove(
                    'opened',
                    'up'
                );

                input.setAttribute(
                    'aria-expanded',
                    'false'
                );

                activeIndex = -1;
            }


            function choose(item) {
                input.value = String(item.value);
                input.setCustomValidity('');

                if (
                    source === 'lokasi' &&
                    item.ref?.alamat &&
                    !$('kfAlamat').value.trim()
                ) {
                    $('kfAlamat').value =
                        String(item.ref.alamat);
                }

                input.dispatchEvent(
                    new Event('change', {
                        bubbles: true
                    })
                );

                close();

                input.focus({
                    preventScroll: true
                });
            }


            function highlight(index) {
                const buttons = Array.from(
                    panel.querySelectorAll(
                        '.kf-combo-option'
                    )
                );

                if (!buttons.length) return;

                activeIndex =
                    (index + buttons.length) %
                    buttons.length;

                buttons.forEach((button, i) => {
                    button.classList.toggle(
                        'active',
                        i === activeIndex
                    );
                });

                buttons[activeIndex]?.scrollIntoView({
                    block: 'nearest'
                });
            }


            function render(showAll = false) {

                combos.forEach((widget, id) => {
                    if (id !== widgetId) {
                        widget.close();
                    }
                });

                const q = showAll
                    ? ''
                    : normalize(input.value);

                shown = getOptions(source)
                    .filter(item =>
                        normalize(
                            `${item.value} ${item.label || ''}`
                        ).includes(q)
                    )
                    .slice(0, 150);

                panel.replaceChildren();
                activeIndex = -1;

                if (!shown.length) {

                    panel.appendChild(
                        makeElement(
                            'div',
                            'kf-combo-empty',
                            source === 'kategori'
                                ? 'Pilih IPA, BOOSTER, atau PERPIPAAN.'
                                : 'Tidak ditemukan. Nilai manual tetap dapat diketik.'
                        )
                    );
                }

                shown.forEach(item => {

                    const button = makeElement(
                        'button',
                        'kf-combo-option'
                    );

                    button.type = 'button';

                    button.appendChild(
                        makeElement(
                            'strong',
                            '',
                            item.value
                        )
                    );

                    if (item.label) {
                        button.appendChild(
                            makeElement(
                                'small',
                                '',
                                item.label
                            )
                        );
                    }

                    button.addEventListener(
                        'mousedown',
                        event => event.preventDefault()
                    );

                    button.addEventListener(
                        'click',
                        () => choose(item)
                    );

                    panel.appendChild(button);
                });

                panel.hidden = false;

                wrapper.classList.add('opened');

                input.setAttribute(
                    'aria-expanded',
                    'true'
                );

                const rect =
                    wrapper.getBoundingClientRect();

                wrapper.classList.toggle(
                    'up',
                    window.innerHeight - rect.bottom < 190 &&
                    rect.top > 230
                );
            }


            input.addEventListener('focus', () => {
                if (panel.hidden) {
                    render(true);
                }
            });

            input.addEventListener('input', () => {
                input.setCustomValidity('');

                render(false);
            });

            arrow.addEventListener(
                'mousedown',
                event => event.preventDefault()
            );

            arrow.addEventListener('click', () => {
                if (!panel.hidden) {
                    close();
                } else {
                    input.focus({
                        preventScroll: true
                    });
                    render(true);
                }
            });

            input.addEventListener('keydown', event => {

                if (event.key === 'Escape') {
                    if (!panel.hidden) {
                        event.preventDefault();
                        close();
                    }
                }

                if (
                    event.key === 'ArrowDown' ||
                    event.key === 'ArrowUp'
                ) {
                    event.preventDefault();

                    if (panel.hidden) render(true);

                    if (shown.length) {
                        const step =
                            event.key === 'ArrowDown'
                                ? 1
                                : -1;

                        highlight(activeIndex + step);
                    }
                }

                if (
                    event.key === 'Enter' &&
                    !panel.hidden &&
                    activeIndex >= 0
                ) {
                    event.preventDefault();

                    choose(shown[activeIndex]);
                }

                if (event.key === 'Tab') {
                    close();
                }
            });

            combos.set(widgetId, {
                close,
                render,
                wrapper
            });

        });


        document.addEventListener('pointerdown', event => {
            combos.forEach(widget => {
                if (!widget.wrapper.contains(event.target)) {
                    widget.close();
                }
            });
        });


        $('kfDepartemen')?.addEventListener(
            'change',
            () => {

                const divisi = $('kfDivisi');

                if (divisi) {
                    divisi.value = '';
                }

                combos.get('divisi_manual')?.close();
            }
        );
    }


    /* ======================================================
       DOKUMEN PENDUKUNG
    ====================================================== */

    function resetFiles() {
        newFiles = [];

        if ($('kfDokumens')) {
            $('kfDokumens').value = '';
        }

        $('kfSelectedFiles')?.replaceChildren();
        $('kfSavedFiles')?.replaceChildren();
    }


    /*
     * Menampilkan file baru sebelum disimpan.
     */

    function renderSelectedFiles() {
        const container = $('kfSelectedFiles');

        if (!container) return;

        container.replaceChildren();

        if (!newFiles.length) return;

        container.appendChild(
            makeElement(
                'strong',
                '',
                `${newFiles.length} file baru dipilih`
            )
        );

        newFiles.forEach((file, index) => {

            const row = makeElement(
                'div',
                'kf-file-row'
            );

            row.appendChild(
                makeElement(
                    'span',
                    '',
                    `${file.name} (${(file.size / 1048576).toFixed(2)} MB)`
                )
            );

            const remove = makeElement(
                'button',
                'kf-link',
                'Batalkan'
            );

            remove.type = 'button';

            remove.addEventListener('click', () => {
                newFiles.splice(index, 1);

                renderSelectedFiles();
            });

            row.appendChild(remove);

            container.appendChild(row);
        });
    }


    /*
     * Bisa memilih dokumen berkali-kali.
     */

    $('kfDokumens')?.addEventListener(
        'change',
        event => {

            for (
                const file of Array.from(
                    event.target.files || []
                )
            ) {

                if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
                    showToast(
                        `${file.name}: format tidak didukung.`
                    );

                    continue;
                }

                const exists = newFiles.some(old =>
                    old.name === file.name &&
                    old.size === file.size &&
                    old.lastModified === file.lastModified
                );

                if (!exists) {
                    newFiles.push(file);
                }
            }

            event.target.value = '';

            renderSelectedFiles();
        }
    );


    /*
     * Lampiran tersimpan saat Edit.
     */

    function renderSavedFiles(documents) {
        const container = $('kfSavedFiles');

        if (!container) return;

        container.replaceChildren();

        if (!list(documents).length) return;

        container.appendChild(
            makeElement(
                'strong',
                '',
                'Lampiran tersimpan:'
            )
        );

        documents.forEach(doc => {

            const row = makeElement(
                'div',
                'kf-file-row'
            );

            const link = makeFileLink(doc);

            if (link) {
                row.appendChild(link);
            }

            if (doc.id != null) {

                const label = makeElement(
                    'label',
                    'kf-remove-file'
                );

                const checkbox = document.createElement(
                    'input'
                );

                checkbox.type = 'checkbox';
                checkbox.name = 'hapus_dokumen_ids[]';
                checkbox.value = String(doc.id);

                label.append(
                    checkbox,
                    document.createTextNode(
                        ' Hapus saat simpan'
                    )
                );

                row.appendChild(label);
            }

            container.appendChild(row);
        });

        refreshIcons();
    }


    /* ======================================================
       LINK PDF DAN GAMBAR BERIKON
    ====================================================== */

    function makeFileLink(doc) {
        if (!doc || !doc.url) {
            return null;
        }

        const fileName =
            doc.nama || 'Lihat Dokumen';

        const pdf = /\.pdf$/i.test(fileName);

        const link = makeElement(
            'a',
            `kf-doc-link ${pdf ? 'kf-doc-pdf' : 'kf-doc-image'}`
        );

        link.href = doc.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        const icon = document.createElement('i');

        icon.setAttribute(
            'data-lucide',
            pdf ? 'file-text' : 'image'
        );

        link.append(
            icon,
            makeElement('span', '', fileName)
        );

        return link;
    }


    /* ======================================================
       FORM TAMBAH
    ====================================================== */

    function newForm() {
        if (!form) return;

        active = null;
        editId = null;
        saving = false;

        form.reset();

        resetFiles();
        showError('');

        const category = $('kfKategori');

        if (category) {
            category.setCustomValidity('');
        }

        $('kfFormTitle').textContent =
            'Tambah Data Konstruksi';

        $('kfSimpan').disabled = false;
        $('kfSimpan').textContent =
            'Simpan Konstruksi';

        $('kfTahun').value =
            new Date().getFullYear();

        combos.forEach(widget => widget.close());

        openDialog(formDialog);
    }


    /* ======================================================
       FORM EDIT
    ====================================================== */

    function editForm(item) {
        if (!form || !item) return;

        active = item;
        editId = Number(item.id);
        saving = false;

        form.reset();

        resetFiles();
        showError('');

        const fallback = {
            nama_barang_manual:
                item.nama_barang ?? item.nama_pekerjaan,

            lokasi_manual:
                item.nama_lokasi ?? item.lokasi,

            alamat_manual:
                item.alamat_lokasi ?? item.alamat,

            departemen_manual:
                item.nama_departemen ?? item.departemen,

            divisi_manual:
                item.nama_divisi ?? item.divisi,

            type: item.jenis_bangunan,
            struktur: item.bertingkat,
            materi: item.material,
            asal: item.asal_pembiayaan,
            urai: item.uraian_pekerjaan,
            ket: item.keterangan
        };

        for (const field of fields) {

            const input = form.elements.namedItem(field);

            if (!input) continue;

            input.value = String(
                item[field] ??
                fallback[field] ??
                ''
            ).trim();

            if (
                typeof input.setCustomValidity === 'function'
            ) {
                input.setCustomValidity('');
            }
        }

        renderSavedFiles(
            item.dokumens || []
        );

        $('kfFormTitle').textContent =
            'Edit Data Konstruksi';

        $('kfSimpan').disabled = false;
        $('kfSimpan').textContent =
            'Simpan Perubahan';

        combos.forEach(widget => widget.close());

        openDialog(formDialog);
    }


    $('kfTambah')?.addEventListener('click', newForm);


    /* ======================================================
       AMBIL SATU DATA KONSTRUKSI
    ====================================================== */

    async function fetchItem(id) {
        const response = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!response.data) {
            throw new Error(
                'Data Konstruksi tidak ditemukan.'
            );
        }

        return response.data;
    }


    /* ======================================================
       FORMAT NILAI DETAIL
    ====================================================== */

    function formatCategory(value) {
        return {
            'IPA': 'Instalasi Pengolahan Air (IPA)',
            'BOOSTER': 'Booster',
            'PERPIPAAN': 'Perpipaan'
        }[uppercase(value)] || display(value);
    }

    function formatBuilding(value) {
        return {
            'P': 'Permanen',
            'SP': 'Semi Permanen',
            'D': 'Darurat'
        }[uppercase(value)] || display(value);
    }


    /* ======================================================
       VIEW DETAIL EXCEL KIB F
    ====================================================== */

    function showDetail(item) {
        if (!item) return;

        active = item;

        $('kfDetailTitle').textContent =
            item.nama_barang ||
            item.nama_pekerjaan ||
            'Detail Konstruksi';

        const body = $('kfDetailBody');

        body.replaceChildren();

        /*
         * KOP EXCEL
         */

        const period = new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone: 'Asia/Makassar',
                month: 'long',
                year: 'numeric'
            }
        )
            .format(new Date())
            .toUpperCase();

        const heading = makeElement(
            'div',
            'kf-excel-heading'
        );

        heading.append(
            makeElement(
                'strong',
                '',
                'KARTU INVENTARIS BARANG (KIB) F'
            ),

            makeElement('h3', '', 'KONSTRUKSI'),

            makeElement(
                'span',
                '',
                `S/D BULAN ${period}`
            )
        );

        body.appendChild(heading);


        /*
         * IDENTITAS ORGANISASI
         */

        const meta = makeElement(
            'div',
            'kf-excel-meta'
        );

        const metadata = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDA TIRTA KENCANA'],
            [
                'DEPARTEMEN',
                item.nama_departemen ??
                item.departemen
            ],
            [
                'DIVISI',
                item.nama_divisi ??
                item.divisi
            ],
            [
                'KATEGORI',
                formatCategory(item.kategori)
            ],
            ['CAKUPAN', item.cakupan],
            [
                'LOKASI',
                item.nama_lokasi ??
                item.lokasi
            ]
        ];

        metadata.forEach(([label, value]) => {

            const row = makeElement(
                'div',
                'kf-excel-meta-row'
            );

            row.append(
                makeElement('span', '', label),
                makeElement('span', '', ':'),
                makeElement('strong', '', display(value))
            );

            meta.appendChild(row);
        });

        body.appendChild(meta);


        /*
         * TABEL KIB F
         */

        const scroll = makeElement(
            'div',
            'kf-excel-scroll'
        );

        const table = makeElement(
            'table',
            'kf-excel-table'
        );

        const thead = document.createElement('thead');

        const header1 = document.createElement('tr');
        const header2 = document.createElement('tr');


        function addHeader(
            row,
            text,
            className = '',
            rowSpan = 1,
            colSpan = 1
        ) {
            const th = makeElement(
                'th',
                className,
                text
            );

            th.rowSpan = rowSpan;
            th.colSpan = colSpan;

            row.appendChild(th);
        }


        /*
         * HEADER BERTINGKAT MENYERUPAI EXCEL
         */

        addHeader(header1, 'No.', '', 2);

        addHeader(
            header1,
            'Nama Barang / Jenis Barang',
            'kf-col-name',
            2
        );

        addHeader(
            header1,
            'Tahun',
            'kf-col-year',
            2
        );

        addHeader(
            header1,
            'Bangunan (P, SP, D)',
            'kf-col-small',
            2
        );

        addHeader(
            header1,
            'Konstruksi Bangunan',
            '',
            1,
            2
        );

        addHeader(
            header1,
            'Letak / Lokasi Alamat',
            'kf-col-location',
            2
        );

        addHeader(
            header1,
            'Status Tanah',
            'kf-col-small',
            2
        );

        addHeader(
            header1,
            'Asal Usul Pembiayaan',
            'kf-col-small',
            2
        );

        addHeader(
            header1,
            'Status Aset',
            'kf-col-small',
            2
        );

        addHeader(
            header1,
            'Nilai (Rp)',
            'kf-col-money',
            2
        );

        addHeader(
            header1,
            'Dokumen Pendukung',
            'kf-col-doc',
            2
        );

        addHeader(
            header2,
            'Bertingkat / Tidak',
            'kf-col-small'
        );

        addHeader(
            header2,
            'Beton / Tidak',
            'kf-col-small'
        );

        thead.append(header1, header2);


        /*
         * ISI TABEL
         */

        const tbody = document.createElement('tbody');

        const row = document.createElement('tr');


        // NO

        makeCell(
            row,
            '1',
            'kf-excel-center'
        );


        // NAMA DAN URAIAN

        const nameCell = makeElement(
            'td',
            'kf-excel-name'
        );

        nameCell.append(
            makeElement(
                'strong',
                '',
                display(
                    item.nama_barang ??
                    item.nama_pekerjaan
                )
            ),

            makeElement(
                'div',
                'kf-excel-subtitle',
                'Uraian Pekerjaan:'
            ),

            makeElement(
                'div',
                'kf-excel-multiline',
                display(
                    item.urai ??
                    item.uraian_pekerjaan
                )
            )
        );

        row.appendChild(nameCell);


        // TAHUN

        makeCell(
            row,
            display(item.tahun),
            'kf-excel-center'
        );


        // BANGUNAN

        makeCell(
            row,
            formatBuilding(
                item.type ??
                item.jenis_bangunan
            ),
            'kf-excel-center'
        );


        // BERTINGKAT

        makeCell(
            row,
            display(
                item.struktur ??
                item.bertingkat
            ),
            'kf-excel-center'
        );


        // BETON

        makeCell(
            row,
            display(
                item.materi ??
                item.material
            ),
            'kf-excel-center'
        );


        // LOKASI / ALAMAT

        const location = [
            item.nama_lokasi ?? item.lokasi,
            item.alamat_lokasi ?? item.alamat,
            item.letak
        ]
            .map(value => String(value ?? '').trim())
            .filter(Boolean)
            .filter((value, index, array) =>
                array.findIndex(
                    other =>
                        normalize(other) === normalize(value)
                ) === index
            )
            .join('\n');

        makeCell(
            row,
            display(location),
            'kf-excel-multiline'
        );


        // STATUS TANAH

        makeCell(
            row,
            display(item.status_tanah),
            'kf-excel-center'
        );


        // ASAL PEMBIAYAAN

        makeCell(
            row,
            display(
                item.asal ??
                item.asal_pembiayaan
            ),
            'kf-excel-center'
        );


        // STATUS ASET

        makeCell(
            row,
            display(item.status_aset),
            'kf-excel-center'
        );


        // NILAI

        makeCell(
            row,
            rupiah(item.nilai),
            'kf-excel-money'
        );


        /*
         * DOKUMEN PENDUKUNG
         * Teks keterangan + link PDF/gambar.
         */

        const documentCell = makeElement('td');

        documentCell.appendChild(
            makeElement(
                'div',
                'kf-excel-multiline',
                display(
                    item.ket ??
                    item.keterangan
                )
            )
        );


        const attachments = makeElement(
            'div',
            'kf-excel-attachments'
        );

        for (const doc of list(item.dokumens)) {

            const link = makeFileLink(doc);

            if (link) {
                attachments.appendChild(link);
            }
        }


        /*
         * Foto utama sebagai link, bukan gambar besar.
         */

        if (item.foto_url) {

            const photoLink = makeFileLink({
                nama: 'Foto Utama Konstruksi.jpg',
                url: item.foto_url
            });

            if (photoLink) {
                attachments.appendChild(photoLink);
            }
        }

        if (attachments.childElementCount > 0) {
            documentCell.appendChild(attachments);
        }

        row.appendChild(documentCell);


        tbody.appendChild(row);

        table.append(thead, tbody);

        scroll.appendChild(table);

        body.appendChild(scroll);


        /*
         * INFORMASI PENDUKUNG DI BAWAH TABEL
         */

        const note = makeElement(
            'section',
            'kf-excel-section'
        );

        note.appendChild(
            makeElement(
                'h4',
                '',
                'Informasi Dokumen dan Keterangan'
            )
        );

        note.appendChild(
            makeElement(
                'p',
                'kf-preline',
                display(
                    item.ket ??
                    item.keterangan
                )
            )
        );

        body.appendChild(note);


        /*
         * Buka popup di atas Detail Kelompok.
         */

        openDialog(detailDialog);

        refreshIcons();
    }


    /* ======================================================
       DETAIL KELOMPOK — STATE
    ====================================================== */

    const groupState = {
        kategori: '',
        lokasi: '',
        divisi: '',
        q: '',
        page: 1,

        groups: [],
        selected: null,
        pagination: null
    };

    let groupRequest = null;
    let groupSearchTimer = null;


    /* ======================================================
       BUKA POPUP KELOMPOK
    ====================================================== */

    function openGroup(kategori, lokasi, divisi) {

        if (!groupDialog || !groupUrl) {
            showToast(
                'Endpoint Detail Kelompok belum tersedia.'
            );
            return;
        }

        groupState.kategori =
            String(kategori || '').trim() ||
            'Tanpa Kategori';

        groupState.lokasi =
            String(lokasi || '').trim() ||
            'Tanpa Lokasi';

        groupState.divisi =
            String(divisi || '').trim() ||
            'Tanpa Divisi';

        groupState.q = '';
        groupState.page = 1;

        $('kfGroupSearch').value = '';
        $('kfGroupItemSearch').value = '';

        openDialog(groupDialog);

        loadGroup();
    }


    /* ======================================================
       PANEL KIRI — RENDER KELOMPOK
    ====================================================== */

    function renderGroups() {
        const container = $('kfGroupList');

        if (!container) return;

        container.replaceChildren();

        const search = normalize(
            $('kfGroupSearch').value
        );

        const filtered = groupState.groups.filter(group =>
            normalize(
                `${group.kategori} ${group.lokasi} ${group.divisi}`
            ).includes(search)
        );

        if (!filtered.length) {

            container.appendChild(
                makeElement(
                    'div',
                    'kf-empty',
                    'Tidak ada kelompok yang cocok.'
                )
            );

            return;
        }

        const categories = new Map();

        filtered.forEach(group => {

            if (!categories.has(group.kategori)) {
                categories.set(group.kategori, []);
            }

            categories
                .get(group.kategori)
                .push(group);
        });


        categories.forEach((groups, category) => {

            const section = makeElement(
                'section',
                'kf-group-category'
            );

            section.appendChild(
                makeElement(
                    'h4',
                    '',
                    formatCategory(category)
                )
            );


            groups.forEach(group => {

                const button = makeElement(
                    'button',
                    'kf-group-option'
                );

                button.type = 'button';

                const selected =
                    groupState.selected &&
                    ['kategori', 'lokasi', 'divisi']
                        .every(key =>
                            groupState.selected[key] === group[key]
                        );

                if (selected) {
                    button.classList.add('active');
                }

                button.setAttribute(
                    'aria-pressed',
                    String(Boolean(selected))
                );

                button.append(
                    makeElement(
                        'span',
                        '',
                        group.lokasi
                    ),

                    makeElement(
                        'small',
                        '',
                        `${group.divisi} · ${group.jumlah} pekerjaan`
                    )
                );


                button.addEventListener('click', () => {

                    groupState.kategori =
                        group.kategori;

                    groupState.lokasi =
                        group.lokasi;

                    groupState.divisi =
                        group.divisi;

                    groupState.q = '';
                    groupState.page = 1;

                    $('kfGroupItemSearch').value = '';

                    loadGroup();
                });

                section.appendChild(button);
            });

            container.appendChild(section);
        });
    }


    /* ======================================================
       PANEL KANAN — TABEL PEKERJAAN
    ====================================================== */

    function renderGroupItems(items) {
        const tbody = $('kfGroupRows');

        if (!tbody) return;

        tbody.replaceChildren();

        if (!items.length) {

            const row = document.createElement('tr');

            makeCell(
                row,
                'Tidak ada pekerjaan pada kelompok ini.',
                'kf-empty'
            ).colSpan = 6;

            tbody.appendChild(row);
            return;
        }

        const first = Number(
            groupState.pagination?.from || 1
        );


        items.forEach((item, index) => {

            const row = document.createElement('tr');


            // NOMOR

            makeCell(
                row,
                first + index
            );


            // NAMA PEKERJAAN

            const nameBox = makeElement('div');

            nameBox.appendChild(
                makeElement(
                    'strong',
                    '',
                    item.nama_barang || '—'
                )
            );

            if (item.cakupan) {
                nameBox.appendChild(
                    makeElement(
                        'small',
                        '',
                        item.cakupan
                    )
                );
            }

            makeCell(row, nameBox);


            // TAHUN

            makeCell(
                row,
                display(item.tahun),
                'kf-excel-center'
            );


            // NILAI

            makeCell(
                row,
                rupiah(item.nilai),
                'kf-money'
            );


            // DOKUMEN

            const docBox = makeElement(
                'div',
                'kf-group-docs'
            );

            const docs = list(item.dokumens);

            docs.slice(0, 2).forEach(doc => {

                const link = makeFileLink(doc);

                if (link) {
                    docBox.appendChild(link);
                }
            });

            if (docs.length > 2) {
                docBox.appendChild(
                    makeElement(
                        'small',
                        '',
                        `+${docs.length - 2} lampiran lainnya`
                    )
                );
            }

            if (!docs.length && item.foto_url) {

                const photoLink = makeFileLink({
                    nama: 'Foto Konstruksi.jpg',
                    url: item.foto_url
                });

                if (photoLink) {
                    docBox.appendChild(photoLink);
                }
            }

            if (!docBox.childElementCount) {
                docBox.textContent = '—';
            }

            makeCell(row, docBox);


            // TOMBOL VIEW

            const button = makeElement(
                'button',
                'kf-action-btn kf-action-view'
            );

            button.type = 'button';
            button.title = 'View Tabel KIB F';

            button.dataset.kfAction = 'view';
            button.dataset.kfId = String(item.id);

            button.setAttribute(
                'aria-label',
                `Lihat ${item.nama_barang || 'pekerjaan'}`
            );

            const icon = document.createElement('i');

            icon.setAttribute('data-lucide', 'eye');

            button.appendChild(icon);

            makeCell(
                row,
                button,
                'kf-excel-center'
            );

            tbody.appendChild(row);
        });

        refreshIcons();
    }


    /* ======================================================
       LOAD KELOMPOK DARI POSTGRESQL
    ====================================================== */

    async function loadGroup() {

        if (!groupDialog || !groupUrl) return;

        groupRequest?.abort();

        const controller = new AbortController();

        groupRequest = controller;

        const errorBox = $('kfGroupError');

        errorBox.hidden = true;
        errorBox.textContent = '';

        const tbody = $('kfGroupRows');

        const loader = document.createElement('tr');

        makeCell(
            loader,
            'Memuat daftar pekerjaan...',
            'kf-empty'
        ).colSpan = 6;

        tbody.replaceChildren(loader);


        const params = new URLSearchParams({
            kategori: groupState.kategori,
            lokasi: groupState.lokasi,
            divisi: groupState.divisi,
            q: groupState.q,
            page: String(groupState.page)
        });


        try {

            const result = await api(
                `${groupUrl}?${params.toString()}`,
                {
                    signal: controller.signal
                }
            );

            if (
                !groupDialog.open ||
                controller.signal.aborted
            ) {
                return;
            }

            groupState.groups =
                list(result.groups);

            groupState.selected =
                result.selected || null;

            groupState.pagination =
                result.pagination || {};


            /*
             * Kelompok aktif.
             */

            if (result.selected) {

                groupState.kategori =
                    result.selected.kategori;

                groupState.lokasi =
                    result.selected.lokasi;

                groupState.divisi =
                    result.selected.divisi;

                $('kfGroupTitle').textContent =
                    `${result.selected.lokasi} / ${result.selected.divisi}`;

                $('kfGroupCaption').textContent =
                    `Kategori: ${formatCategory(result.selected.kategori)}`;

            } else {

                $('kfGroupTitle').textContent =
                    'Belum Ada Pekerjaan';

                $('kfGroupCaption').textContent =
                    'Tambahkan data manual terlebih dahulu.';
            }


            /*
             * Pagination dan total.
             */

            const page = groupState.pagination;

            $('kfGroupCount').textContent =
                `${page.total || 0} pekerjaan`;

            $('kfGroupInfo').textContent =
                `${page.from || 0}–${page.to || 0} dari ${page.total || 0} data`;

            $('kfGroupPage').textContent =
                `${page.page || 1} / ${page.last_page || 1}`;

            $('kfGroupPrev').disabled =
                (page.page || 1) <= 1;

            $('kfGroupNext').disabled =
                (page.page || 1) >=
                (page.last_page || 1);


            renderGroups();

            renderGroupItems(
                list(result.items)
            );

        } catch (exception) {

            if (exception.name === 'AbortError') {
                return;
            }

            errorBox.textContent =
                exception.message ||
                'Gagal mengambil data kelompok.';

            errorBox.hidden = false;

            tbody.replaceChildren();
        }
    }


    /* ======================================================
       PENCARIAN DAN PAGINATION KELOMPOK
    ====================================================== */

    $('kfGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );


    $('kfGroupItemSearch')?.addEventListener(
        'input',
        event => {

            clearTimeout(groupSearchTimer);

            const search = event.target.value.trim();

            groupSearchTimer = setTimeout(() => {

                groupState.q = search;
                groupState.page = 1;

                loadGroup();

            }, 300);
        }
    );


    $('kfGroupReset')?.addEventListener('click', () => {

        clearTimeout(groupSearchTimer);

        groupState.q = '';
        groupState.page = 1;

        $('kfGroupItemSearch').value = '';

        loadGroup();
    });


    $('kfGroupPrev')?.addEventListener('click', () => {

        if (groupState.page > 1) {

            groupState.page--;

            loadGroup();
        }
    });


    $('kfGroupNext')?.addEventListener('click', () => {

        const last =
            groupState.pagination?.last_page || 1;

        if (groupState.page < last) {

            groupState.page++;

            loadGroup();
        }
    });


    groupDialog?.addEventListener('close', () => {

        groupRequest?.abort();

        clearTimeout(groupSearchTimer);
    });


    /* ======================================================
       AKSI TABEL UTAMA DAN PANEL KANAN
    ====================================================== */

    root.addEventListener('click', async event => {

        if (!(event.target instanceof Element)) {
            return;
        }

        const button = event.target.closest(
            'button[data-kf-action]'
        );

        if (
            !button ||
            !root.contains(button) ||
            button.disabled
        ) {
            return;
        }

        const action = button.dataset.kfAction;
        const id = button.dataset.kfId;

        if (!/^\d+$/.test(String(id))) {
            showToast('ID Konstruksi tidak valid.');
            return;
        }


        /*
         * DETAIL KELOMPOK
         */

        if (action === 'group') {

            openGroup(
                button.dataset.kfCategory,
                button.dataset.kfLocation,
                button.dataset.kfDivision
            );

            return;
        }


        /*
         * DELETE
         */

        if (action === 'delete') {

            askDelete({
                id: Number(id),
                nama_barang: button.dataset.kfName
            });

            return;
        }


        /*
         * VIEW / EDIT
         */

        if (!['view', 'edit'].includes(action)) {
            return;
        }

        button.disabled = true;

        try {

            const item = await fetchItem(id);

            if (action === 'edit') {
                editForm(item);
            } else {
                showDetail(item);
            }

        } catch (exception) {

            showToast(exception.message);

        } finally {

            button.disabled = false;
        }
    });


    /* ======================================================
       EDIT DARI VIEW DETAIL
    ====================================================== */

    $('kfEdit')?.addEventListener('click', () => {

        if (!active) return;

        const item = active;

        closeDialog(detailDialog);

        editForm(item);
    });


    /* ======================================================
       KONFIRMASI DELETE
    ====================================================== */

    function askDelete(item) {

        if (!item || deleting) return;

        deleteTarget = {
            id: Number(item.id),

            name:
                item.nama_barang ||
                item.nama_pekerjaan ||
                `Konstruksi #${item.id}`
        };

        $('kfDeleteName').textContent =
            deleteTarget.name;

        closeDialog(detailDialog);

        openDialog(deleteDialog);
    }


    $('kfHapus')?.addEventListener('click', () => {

        if (active) {
            askDelete(active);
        }
    });


    /* ======================================================
       HAPUS DARI DATABASE
    ====================================================== */

    $('kfDeleteConfirm')?.addEventListener(
        'click',
        async () => {

            if (!deleteTarget || deleting) return;

            deleting = true;

            const button = $('kfDeleteConfirm');

            button.disabled = true;

            try {

                await api(
                    `${base}/${encodeURIComponent(deleteTarget.id)}`,
                    {
                        method: 'DELETE'
                    }
                );

                window.location.assign(base);

            } catch (exception) {

                showToast(exception.message);

                deleting = false;
                button.disabled = false;
            }
        }
    );


    deleteDialog?.addEventListener('close', () => {

        if (!deleting) {
            deleteTarget = null;
        }
    });


    /* ======================================================
       VALIDASI FORM
    ====================================================== */

    function validateChoices() {

        const rules = [
            {
                id: 'kfKategori',
                allowed: [
                    'IPA',
                    'BOOSTER',
                    'PERPIPAAN'
                ],
                required: true
            },

            {
                id: 'kfType',
                allowed: ['P', 'SP', 'D'],
                required: false
            },

            {
                id: 'kfStruktur',
                allowed: [
                    'BERTINGKAT',
                    'TIDAK BERTINGKAT'
                ],
                required: false
            },

            {
                id: 'kfMateri',
                allowed: [
                    'BETON',
                    'TIDAK BETON'
                ],
                required: false
            }
        ];

        for (const rule of rules) {

            const input = $(rule.id);

            if (!input) continue;

            input.value = uppercase(input.value);

            const valid =
                (!rule.required && input.value === '') ||
                rule.allowed.includes(input.value);

            input.setCustomValidity(
                valid
                    ? ''
                    : `Pilihan ${rule.id} tidak valid.`
            );

            if (!valid) {
                input.reportValidity();
                return false;
            }
        }

        return true;
    }


    /* ======================================================
       SIMPAN CREATE / UPDATE
    ====================================================== */

    form?.addEventListener('submit', async event => {

        event.preventDefault();

        if (saving) return;

        showError('');

        if (!validateChoices()) return;

        if (!form.reportValidity()) return;

        saving = true;

        const save = $('kfSimpan');

        save.disabled = true;


        /*
         * Siapkan FormData.
         */

        const data = new FormData(form);

        data.set(
            'kategori',
            uppercase(data.get('kategori'))
        );


        /*
         * Multiple attachment.
         */

        data.delete('dokumens[]');

        newFiles.forEach(file => {

            data.append(
                'dokumens[]',
                file,
                file.name
            );
        });


        /*
         * CREATE: POST
         * UPDATE: POST dengan _method=PUT
         */

        let url = base;

        if (editId !== null) {

            url = `${base}/${encodeURIComponent(editId)}`;

            data.set('_method', 'PUT');
        }


        try {

            await api(url, {
                method: 'POST',
                body: data
            });

            window.location.assign(base);

        } catch (exception) {

            showError(exception.message);

            saving = false;
            save.disabled = false;
        }
    });


    /* ======================================================
       INITIALIZATION
    ====================================================== */

    initializeClock();

    initializeComboboxes();

    refreshIcons();

})();
