
/*
|--------------------------------------------------------------------------
| K.I.B F — KONSTRUKSI
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
| Tabel Utama:
| No | Nama | Kategori | Lokasi | Cakupan | Tahun |
| Status | Nilai | Aksi
|
| Detail Excel:
| No | Nama | Tahun | Bangunan | Bertingkat | Beton |
| Lokasi | Cakupan | Status Tanah | Asal Pembiayaan |
| Status Aset | Nilai | Dokumen
|
| Database tetap:
| kib_konstruksi_manual
| kib_konstruksi_dokumens
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('kfApp');

    if (!root || root.dataset.initialized === '1') return;

    root.dataset.initialized = '1';

    const $ = id => document.getElementById(id);

    const base = String(root.dataset.base || '')
        .replace(/\/$/, '');

    const groupUrl = root.dataset.groupUrl || '';
    const token = root.dataset.token || '';

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

    const norm = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');

    const shown = value =>
        String(value ?? '').trim() || '—';

    const upper = value =>
        String(value ?? '').trim().toUpperCase();

    const asArray = value =>
        Array.isArray(value) ? value : [];

    const money = value =>
        'Rp ' + (Number(value) || 0)
            .toLocaleString('id-ID', {
                maximumFractionDigits: 2
            });

    const el = (tag, className = '', value = null) => {
        const node = document.createElement(tag);

        if (className) node.className = className;

        if (value !== null && value !== undefined) {
            node.textContent = String(value);
        }

        return node;
    };

    const icons = () =>
        window.lucide?.createIcons?.();

    function addCell(row, value, className = '') {
        const td = el('td', className);

        if (value instanceof Node) {
            td.appendChild(value);
        } else {
            td.textContent = String(value ?? '—');
        }

        row.appendChild(td);
        return td;
    }

    function openDialog(dialog) {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        icons();
    }

    function closeDialog(dialog) {
        if (dialog?.open) dialog.close();
    }

    function parseJson(id) {
        try {
            return JSON.parse($(id)?.textContent || '{}') || {};
        } catch {
            return {};
        }
    }

    const suggestions = parseJson('kfSuggestions');
    const master = parseJson('kfMasterOptions');

    const combos = new Map();

    let active = null;
    let editId = null;
    let deleteTarget = null;

    let newFiles = [];
    let saving = false;
    let deleting = false;
    let toastTimer = null;

    /* ======================================================
       TOAST DAN ERROR
    ====================================================== */

    function toast(message) {
        const box = $('kfToast');
        if (!box) return;

        box.textContent = message;
        box.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            box.hidden = true;
        }, 4000);
    }

    function showError(message) {
        const box = $('kfError');
        if (!box) return;

        box.textContent = message || '';
        box.hidden = !message;
    }

    /* ======================================================
       API LARAVEL
    ====================================================== */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': token,
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

        const result = await response.json()
            .catch(() => ({}));

        if (!response.ok || result.success === false) {
            const validation = result.errors
                ? Object.values(result.errors)
                    .flat()
                    .join('\n')
                : '';

            let message = validation ||
                result.message ||
                `Server Error (HTTP ${response.status})`;

            if (response.status === 419) {
                message = 'Sesi habis. Refresh halaman.';
            }

            if (response.status === 413) {
                message = 'Ukuran file terlalu besar.';
            }

            throw new Error(message);
        }

        return result;
    }

    /* ======================================================
       JAM WITA
    ====================================================== */

    function initClock() {
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

        function tick() {
            const now = new Date();
            const date = dateFormatter.format(now);

            dateNode.textContent =
                date.charAt(0).toUpperCase() + date.slice(1);

            timeNode.textContent = timeFormatter
                .format(now)
                .replace(/\./g, ':');
        }

        tick();
        setInterval(tick, 1000);
    }

    /* ======================================================
       TOMBOL TUTUP MODAL
    ====================================================== */

    root.querySelectorAll('[data-kf-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                closeDialog($(button.dataset.kfClose));
            });
        });

    /* ======================================================
       SEARCHABLE DROPDOWN
    ====================================================== */

    const presets = {
        kategori: [
            {
                value: 'IPA',
                label: 'Instalasi Pengolahan Air'
            },
            { value: 'BOOSTER', label: 'Booster' },
            { value: 'PERPIPAAN', label: 'Perpipaan' }
        ],

        bangunan: [
            { value: 'P', label: 'Permanen' },
            { value: 'SP', label: 'Semi Permanen' },
            { value: 'D', label: 'Darurat' }
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

    function getOptions(source) {
        let options = [...(presets[source] || [])];

        if (source === 'lokasi') {
            options.push(
                ...asArray(master.lokasi).map(row => ({
                    value: row.lokasi,
                    label: row.alamat || '',
                    raw: row
                }))
            );
        }

        if (source === 'departemen') {
            options.push(
                ...asArray(master.departemen).map(row => ({
                    value: row.nama_dep,
                    raw: row
                }))
            );
        }

        if (source === 'divisi') {
            const department = asArray(master.departemen)
                .find(row =>
                    norm(row.nama_dep) ===
                    norm($('kfDepartemen')?.value)
                );

            const divisions = department
                ? asArray(master.divisi).filter(row =>
                    String(row.id_dep) ===
                    String(department.id)
                )
                : asArray(master.divisi);

            options.push(
                ...divisions.map(row => ({
                    value: row.nama_div,
                    raw: row
                }))
            );
        }

        const suggestionKey = {
            lokasi: 'lokasi',
            departemen: 'departemen',
            divisi: 'divisi',
            cakupan: 'cakupan'
        }[source];

        if (suggestionKey) {
            options.push(
                ...asArray(suggestions[suggestionKey])
                    .map(value => ({
                        value: String(value)
                    }))
            );
        }

        const seen = new Set();

        return options.filter(option => {
            const key = norm(option.value);

            if (!key || seen.has(key)) return false;

            seen.add(key);
            return true;
        });
    }

    function initCombos() {
        if (!form) return;

        form.querySelectorAll('[data-kf-combo]')
            .forEach(input => {
                if (input.dataset.ready === '1') return;

                input.dataset.ready = '1';

                const source = input.dataset.kfCombo;

                const wrapper = el('div', 'kf-combo');
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);

                const arrow = el(
                    'button',
                    'kf-combo-arrow',
                    '⌄'
                );

                arrow.type = 'button';

                const panel = el('div', 'kf-combo-list');
                panel.hidden = true;

                wrapper.append(arrow, panel);

                let visible = [];
                let selected = -1;

                function close() {
                    panel.hidden = true;
                    selected = -1;

                    wrapper.classList.remove(
                        'opened',
                        'up'
                    );
                }

                function choose(option) {
                    input.value = String(option.value);
                    input.setCustomValidity('');

                    if (
                        source === 'lokasi' &&
                        option.raw?.alamat &&
                        $('kfAlamat') &&
                        !$('kfAlamat').value.trim()
                    ) {
                        $('kfAlamat').value =
                            option.raw.alamat;
                    }

                    input.dispatchEvent(
                        new Event('change', {
                            bubbles: true
                        })
                    );

                    close();
                    input.focus({ preventScroll: true });
                }

                function highlight(index) {
                    const buttons = Array.from(
                        panel.querySelectorAll(
                            '.kf-combo-option'
                        )
                    );

                    if (!buttons.length) return;

                    selected =
                        (index + buttons.length) %
                        buttons.length;

                    buttons.forEach((button, i) => {
                        button.classList.toggle(
                            'active',
                            i === selected
                        );
                    });

                    buttons[selected]?.scrollIntoView({
                        block: 'nearest'
                    });
                }

                function render(all = false) {
                    combos.forEach((combo, key) => {
                        if (key !== input.name) {
                            combo.close();
                        }
                    });

                    const q = all ? '' : norm(input.value);

                    visible = getOptions(source)
                        .filter(option =>
                            norm(
                                `${option.value} ${option.label || ''}`
                            ).includes(q)
                        )
                        .slice(0, 150);

                    panel.replaceChildren();
                    selected = -1;

                    if (!visible.length) {
                        panel.appendChild(
                            el(
                                'div',
                                'kf-combo-empty',
                                'Pilihan tidak ditemukan.'
                            )
                        );
                    }

                    visible.forEach(option => {
                        const button = el(
                            'button',
                            'kf-combo-option'
                        );

                        button.type = 'button';

                        button.appendChild(
                            el(
                                'strong',
                                '',
                                option.value
                            )
                        );

                        if (option.label) {
                            button.appendChild(
                                el(
                                    'small',
                                    '',
                                    option.label
                                )
                            );
                        }

                        button.addEventListener(
                            'mousedown',
                            e => e.preventDefault()
                        );

                        button.addEventListener(
                            'click',
                            () => choose(option)
                        );

                        panel.appendChild(button);
                    });

                    panel.hidden = false;
                    wrapper.classList.add('opened');

                    const rect =
                        wrapper.getBoundingClientRect();

                    wrapper.classList.toggle(
                        'up',
                        window.innerHeight - rect.bottom < 190 &&
                        rect.top > 230
                    );
                }

                input.addEventListener('focus', () => {
                    if (panel.hidden) render(true);
                });

                input.addEventListener('input', () => {
                    input.setCustomValidity('');
                    render(false);
                });

                arrow.addEventListener(
                    'mousedown',
                    e => e.preventDefault()
                );

                arrow.addEventListener('click', () => {
                    if (panel.hidden) {
                        input.focus({
                            preventScroll: true
                        });
                        render(true);
                    } else {
                        close();
                    }
                });

                input.addEventListener('keydown', event => {
                    if (event.key === 'Escape') {
                        close();
                        return;
                    }

                    if (event.key === 'Tab') {
                        close();
                        return;
                    }

                    if (
                        event.key === 'ArrowDown' ||
                        event.key === 'ArrowUp'
                    ) {
                        event.preventDefault();

                        if (panel.hidden) render(true);

                        if (visible.length) {
                            highlight(
                                selected +
                                (event.key === 'ArrowDown'
                                    ? 1
                                    : -1)
                            );
                        }
                    }

                    if (
                        event.key === 'Enter' &&
                        !panel.hidden &&
                        selected >= 0
                    ) {
                        event.preventDefault();
                        choose(visible[selected]);
                    }
                });

                combos.set(input.name, {
                    close,
                    wrapper
                });
            });

        document.addEventListener('pointerdown', event => {
            combos.forEach(combo => {
                if (!combo.wrapper.contains(event.target)) {
                    combo.close();
                }
            });
        });

        $('kfDepartemen')?.addEventListener(
            'change',
            () => {
                const div = $('kfDivisi');

                if (div) div.value = '';

                combos.get('divisi_manual')?.close();
            }
        );
    }

    /* ======================================================
       DOKUMEN BERIKON
    ====================================================== */

    function fileLink(url, name, fallbackIcon = 'image') {
        if (!url) return null;

        const link = el('a', 'kf-doc-link');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        const filename = name || 'Lampiran';

        const isPdf = /\.pdf$/i.test(filename);

        link.classList.add(
            isPdf ? 'kf-doc-pdf' : 'kf-doc-image'
        );

        const icon = el('i');

        icon.setAttribute(
            'data-lucide',
            isPdf ? 'file-text' : fallbackIcon
        );

        link.append(
            icon,
            el('span', '', filename)
        );

        return link;
    }

    function resetFiles() {
        newFiles = [];

        if ($('kfDokumens')) {
            $('kfDokumens').value = '';
        }

        $('kfSelectedFiles')?.replaceChildren();
        $('kfSavedFiles')?.replaceChildren();
    }

    function renderNewFiles() {
        const box = $('kfSelectedFiles');
        if (!box) return;

        box.replaceChildren();

        if (!newFiles.length) return;

        box.appendChild(
            el(
                'strong',
                '',
                `${newFiles.length} lampiran baru`
            )
        );

        newFiles.forEach((file, index) => {
            const row = el('div', 'kf-file-row');

            row.appendChild(
                el(
                    'span',
                    '',
                    `${file.name} (${(
                        file.size / 1048576
                    ).toFixed(2)} MB)`
                )
            );

            const remove = el(
                'button',
                'kf-link',
                'Batalkan'
            );

            remove.type = 'button';

            remove.addEventListener('click', () => {
                newFiles.splice(index, 1);
                renderNewFiles();
            });

            row.appendChild(remove);
            box.appendChild(row);
        });
    }

    $('kfDokumens')?.addEventListener(
        'change',
        event => {
            for (
                const file of Array.from(
                    event.target.files || []
                )
            ) {
                if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
                    toast(`Format ${file.name} tidak didukung.`);
                    continue;
                }

                const duplicate = newFiles.some(other =>
                    other.name === file.name &&
                    other.size === file.size &&
                    other.lastModified === file.lastModified
                );

                if (!duplicate) newFiles.push(file);
            }

            event.target.value = '';
            renderNewFiles();
        }
    );

    function renderSavedFiles(docs) {
        const box = $('kfSavedFiles');
        if (!box) return;

        box.replaceChildren();

        if (!asArray(docs).length) return;

        box.appendChild(
            el('strong', '', 'Lampiran tersimpan:')
        );

        asArray(docs).forEach(doc => {
            const row = el('div', 'kf-file-row');

            const link = fileLink(
                doc.url,
                doc.nama
            );

            if (link) row.appendChild(link);

            if (doc.id != null) {
                const label = el(
                    'label',
                    'kf-remove-file'
                );

                const check = el('input');
                check.type = 'checkbox';
                check.name = 'hapus_dokumen_ids[]';
                check.value = String(doc.id);

                label.append(
                    check,
                    document.createTextNode(
                        ' Hapus saat simpan'
                    )
                );

                row.appendChild(label);
            }

            box.appendChild(row);
        });

        icons();
    }

    /* ======================================================
       TAMBAH / EDIT
    ====================================================== */

    function prepareForm() {
        if (!form) return;

        form.reset();
        resetFiles();
        showError('');

        saving = false;
        $('kfSimpan').disabled = false;

        form.querySelectorAll('input')
            .forEach(input => {
                input.setCustomValidity('');
            });

        combos.forEach(combo => combo.close());
    }

    function addForm() {
        if (!form) return;

        prepareForm();

        active = null;
        editId = null;

        $('kfTahun').value = new Date().getFullYear();

        $('kfFormTitle').textContent =
            'Tambah Data Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Konstruksi';

        openDialog(formDialog);
    }

    function editForm(item) {
        if (!form || !item) return;

        prepareForm();

        active = item;
        editId = Number(item.id);

        const aliases = {
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

        fields.forEach(field => {
            const input = form.elements.namedItem(field);

            if (input) {
                input.value = String(
                    item[field] ??
                    aliases[field] ??
                    ''
                );
            }
        });

        renderSavedFiles(item.dokumens);

        $('kfFormTitle').textContent =
            'Edit Data Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Perubahan';

        openDialog(formDialog);
    }

    $('kfTambah')?.addEventListener('click', addForm);

    async function fetchItem(id) {
        const res = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!res.data) {
            throw new Error(
                'Data Konstruksi tidak ditemukan.'
            );
        }

        return res.data;
    }

    /* ======================================================
       FORMAT KATEGORI DAN BANGUNAN
    ====================================================== */

    function categoryName(value) {
        return {
            IPA: 'Instalasi Pengolahan Air (IPA)',
            BOOSTER: 'Booster',
            PERPIPAAN: 'Perpipaan'
        }[upper(value)] || shown(value);
    }

    function buildingName(value) {
        return {
            P: 'Permanen',
            SP: 'Semi Permanen',
            D: 'Darurat'
        }[upper(value)] || shown(value);
    }

    /* ======================================================
       VIEW DETAIL EXCEL KIB F
       LOKASI → CAKUPAN → STATUS TANAH
    ====================================================== */

    function showDetail(item) {
        if (!item) return;

        active = item;

        const body = $('kfDetailBody');
        if (!body) return;

        body.replaceChildren();

        $('kfDetailTitle').textContent =
            item.nama_barang ||
            item.nama_pekerjaan ||
            'Detail Konstruksi';

        /* KOP KIB F */

        const period = new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone: 'Asia/Makassar',
                month: 'long',
                year: 'numeric'
            }
        ).format(new Date()).toUpperCase();

        const heading = el(
            'div',
            'kf-excel-heading'
        );

        heading.append(
            el(
                'strong',
                '',
                'KARTU INVENTARIS BARANG (KIB) F'
            ),
            el('h3', '', 'KONSTRUKSI'),
            el('span', '', `S/D BULAN ${period}`)
        );

        body.appendChild(heading);

        /* IDENTITAS ORGANISASI */

        const meta = el('div', 'kf-excel-meta');

        const metadata = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDA TIRTA KENCANA'],

            [
                'DEPARTEMEN',
                item.nama_departemen ?? item.departemen
            ],

            [
                'DIVISI',
                item.nama_divisi ?? item.divisi
            ],

            [
                'KATEGORI',
                categoryName(item.kategori)
            ],

            [
                'CAKUPAN',
                item.cakupan
            ],

            [
                'LOKASI',
                item.nama_lokasi ?? item.lokasi
            ]
        ];

        metadata.forEach(([label, value]) => {
            const row = el(
                'div',
                'kf-excel-meta-row'
            );

            row.append(
                el('span', '', label),
                el('span', '', ':'),
                el('strong', '', shown(value))
            );

            meta.appendChild(row);
        });

        body.appendChild(meta);

        /* ==================================================
           TABEL KIB F — 13 KOLOM
        ================================================== */

        const scroll = el(
            'div',
            'kf-excel-scroll'
        );

        const table = el(
            'table',
            'kf-excel-table'
        );

        /*
         * Lebar kolom ditentukan CSS.
         * Jumlah tepat 13.
         */

        const colgroup = el('colgroup');

        for (let i = 0; i < 13; i++) {
            colgroup.appendChild(el('col'));
        }

        table.appendChild(colgroup);

        const thead = el('thead');

        const header1 = el('tr');
        const header2 = el('tr');

        function th(
            row,
            title,
            rowSpan = 1,
            colSpan = 1
        ) {
            const cell = el('th', '', title);

            cell.rowSpan = rowSpan;
            cell.colSpan = colSpan;

            row.appendChild(cell);
        }

        /* HEADER BARIS PERTAMA */

        th(header1, 'No.', 2);

        th(
            header1,
            'Nama Barang / Jenis Barang',
            2
        );

        th(header1, 'Tahun', 2);

        th(
            header1,
            'Bangunan (P, SP, D)',
            2
        );

        th(
            header1,
            'Konstruksi Bangunan',
            1,
            2
        );

        th(
            header1,
            'Letak / Lokasi Alamat',
            2
        );

        /*
         * KOLOM BARU:
         * LANGSUNG SETELAH LOKASI.
         */

        th(
            header1,
            'Cakupan',
            2
        );

        th(header1, 'Status Tanah', 2);

        th(
            header1,
            'Asal Usul Pembiayaan',
            2
        );

        th(header1, 'Status Aset', 2);

        th(header1, 'Nilai (Rp)', 2);

        th(
            header1,
            'Dokumen Pendukung',
            2
        );

        /* SUBHEADER KONSTRUKSI */

        th(
            header2,
            'Bertingkat / Tidak'
        );

        th(
            header2,
            'Beton / Tidak'
        );

        thead.append(
            header1,
            header2
        );

        /* ==================================================
           ISI DATA EXCEL — 13 SEL
        ================================================== */

        const tbody = el('tbody');
        const dataRow = el('tr');

        /* 1. NOMOR */

        addCell(
            dataRow,
            '1',
            'kf-excel-center'
        );

        /* 2. NAMA DAN URAIAN PEKERJAAN */

        const nameBox = el(
            'div',
            'kf-excel-name'
        );

        nameBox.append(
            el(
                'strong',
                '',
                shown(
                    item.nama_barang ??
                    item.nama_pekerjaan
                )
            ),

            el(
                'div',
                'kf-excel-subtitle',
                'Uraian Pekerjaan:'
            ),

            el(
                'div',
                'kf-excel-multiline',
                shown(
                    item.urai ??
                    item.uraian_pekerjaan
                )
            )
        );

        addCell(dataRow, nameBox);

        /* 3. TAHUN */

        addCell(
            dataRow,
            shown(item.tahun),
            'kf-excel-center'
        );

        /* 4. BANGUNAN */

        addCell(
            dataRow,
            buildingName(
                item.type ??
                item.jenis_bangunan
            ),
            'kf-excel-center'
        );

        /* 5. BERTINGKAT */

        addCell(
            dataRow,
            shown(
                item.struktur ??
                item.bertingkat
            ),
            'kf-excel-center'
        );

        /* 6. BETON */

        addCell(
            dataRow,
            shown(
                item.materi ??
                item.material
            ),
            'kf-excel-center'
        );

        /* 7. LETAK / LOKASI ALAMAT */

        const location = [
            item.nama_lokasi ?? item.lokasi,
            item.alamat_lokasi ?? item.alamat,
            item.letak
        ]
            .map(value => String(value ?? '').trim())
            .filter(Boolean)
            .filter((value, index, values) =>
                values.findIndex(
                    other => norm(other) === norm(value)
                ) === index
            )
            .join('\n');

        addCell(
            dataRow,
            shown(location),
            'kf-excel-multiline'
        );

        /* ==================================================
           8. CAKUPAN — KOLOM TAMBAHAN
           DATA DARI item.cakupan
        ================================================== */

        addCell(
            dataRow,
            shown(item.cakupan),
            'kf-excel-cakupan'
        );

        /* 9. STATUS TANAH */

        addCell(
            dataRow,
            shown(item.status_tanah),
            'kf-excel-center'
        );

        /* 10. ASAL USUL PEMBIAYAAN */

        addCell(
            dataRow,
            shown(
                item.asal ??
                item.asal_pembiayaan
            ),
            'kf-excel-center'
        );

        /* 11. STATUS ASET */

        addCell(
            dataRow,
            shown(item.status_aset),
            'kf-excel-center'
        );

        /* 12. NILAI */

        addCell(
            dataRow,
            money(item.nilai),
            'kf-excel-money'
        );

        /* ==================================================
           13. DOKUMEN PENDUKUNG
        ================================================== */

        const docBox = el(
            'div',
            'kf-excel-document'
        );

        docBox.appendChild(
            el(
                'div',
                'kf-excel-multiline',
                shown(
                    item.ket ??
                    item.keterangan
                )
            )
        );

        const attachmentBox = el(
            'div',
            'kf-excel-attachments'
        );

        asArray(item.dokumens).forEach(doc => {
            const link = fileLink(
                doc.url,
                doc.nama,
                'image'
            );

            if (link) {
                attachmentBox.appendChild(link);
            }
        });

        if (item.foto_url) {
            const photo = fileLink(
                item.foto_url,
                'Foto Utama Konstruksi',
                'image'
            );

            if (photo) {
                attachmentBox.appendChild(photo);
            }
        }

        if (attachmentBox.childElementCount) {
            docBox.appendChild(attachmentBox);
        }

        addCell(dataRow, docBox);

        /* PASANG TABEL */

        tbody.appendChild(dataRow);

        table.append(
            thead,
            tbody
        );

        scroll.appendChild(table);

        body.appendChild(scroll);

        /* KETERANGAN DI BAWAH TABEL */

        const note = el(
            'section',
            'kf-excel-section'
        );

        note.append(
            el(
                'h4',
                '',
                'Informasi Dokumen dan Keterangan'
            ),

            el(
                'p',
                'kf-preline',
                shown(
                    item.ket ??
                    item.keterangan
                )
            )
        );

        body.appendChild(note);

        openDialog(detailDialog);
        icons();
    }

    /* ======================================================
       DETAIL KELOMPOK
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
    let groupTimer = null;

    function groupError(message) {
        const box = $('kfGroupError');

        if (!box) return;

        box.textContent = message || '';
        box.hidden = !message;
    }

    function openGroup(kategori, lokasi, divisi) {
        if (!groupDialog || !groupUrl) {
            toast(
                'Endpoint Detail Kelompok tidak tersedia.'
            );
            return;
        }

        groupState.kategori =
            String(kategori ?? '').trim() ||
            'Tanpa Kategori';

        groupState.lokasi =
            String(lokasi ?? '').trim() ||
            'Tanpa Lokasi';

        groupState.divisi =
            String(divisi ?? '').trim() ||
            'Tanpa Divisi';

        groupState.q = '';
        groupState.page = 1;

        $('kfGroupSearch').value = '';
        $('kfGroupItemSearch').value = '';

        openDialog(groupDialog);
        loadGroups();
    }

    /* ======================================================
       PANEL KIRI: KATEGORI / LOKASI / DIVISI
    ====================================================== */

    function renderGroups() {
        const container = $('kfGroupList');
        if (!container) return;

        container.replaceChildren();

        const search = norm(
            $('kfGroupSearch').value
        );

        const filtered = groupState.groups.filter(group =>
            norm(
                `${group.kategori} ${group.lokasi} ${group.divisi}`
            ).includes(search)
        );

        if (!filtered.length) {
            container.appendChild(
                el(
                    'div',
                    'kf-group-empty',
                    'Tidak ada kelompok yang sesuai.'
                )
            );
            return;
        }

        const categories = new Map();

        filtered.forEach(group => {
            if (!categories.has(group.kategori)) {
                categories.set(group.kategori, []);
            }

            categories.get(group.kategori).push(group);
        });

        categories.forEach((groups, category) => {
            const section = el(
                'section',
                'kf-group-category'
            );

            section.appendChild(
                el(
                    'h4',
                    '',
                    categoryName(category)
                )
            );

            groups.forEach(group => {
                const button = el(
                    'button',
                    'kf-group-option'
                );

                button.type = 'button';

                const selected =
                    groupState.selected &&
                    ['kategori', 'lokasi', 'divisi']
                        .every(key =>
                            groupState.selected[key] ===
                            group[key]
                        );

                if (selected) {
                    button.classList.add('active');
                }

                button.append(
                    el('span', '', group.lokasi),

                    el(
                        'small',
                        '',
                        `${group.divisi} · ${group.jumlah} pekerjaan`
                    )
                );

                button.addEventListener('click', () => {
                    groupState.kategori = group.kategori;
                    groupState.lokasi = group.lokasi;
                    groupState.divisi = group.divisi;

                    groupState.q = '';
                    groupState.page = 1;

                    $('kfGroupItemSearch').value = '';

                    loadGroups();
                });

                section.appendChild(button);
            });

            container.appendChild(section);
        });
    }

    /* ======================================================
       PANEL KANAN: DAFTAR PEKERJAAN
    ====================================================== */

    function renderGroupItems(items) {
        const body = $('kfGroupRows');

        if (!body) return;

        body.replaceChildren();

        if (!items.length) {
            const row = el('tr');

            addCell(
                row,
                'Tidak ada pekerjaan pada kelompok ini.',
                'kf-empty'
            ).colSpan = 6;

            body.appendChild(row);
            return;
        }

        const start = Number(
            groupState.pagination?.from || 1
        );

        items.forEach((item, index) => {
            const row = el('tr');

            /* NOMOR */

            addCell(row, start + index);

            /* NAMA PEKERJAAN */

            const name = el('div');

            name.appendChild(
                el(
                    'strong',
                    '',
                    shown(item.nama_barang)
                )
            );

            if (item.cakupan) {
                name.appendChild(
                    el(
                        'small',
                        '',
                        `Cakupan: ${item.cakupan}`
                    )
                );
            }

            addCell(row, name);

            /* TAHUN */

            addCell(
                row,
                shown(item.tahun),
                'kf-excel-center'
            );

            /* NILAI */

            addCell(
                row,
                money(item.nilai),
                'kf-money'
            );

            /* DOKUMEN */

            const docs = el(
                'div',
                'kf-group-docs'
            );

            const attachments = asArray(item.dokumens);

            attachments.slice(0, 2).forEach(doc => {
                const link = fileLink(
                    doc.url,
                    doc.nama
                );

                if (link) docs.appendChild(link);
            });

            if (attachments.length > 2) {
                docs.appendChild(
                    el(
                        'small',
                        '',
                        `+${attachments.length - 2} lampiran`
                    )
                );
            }

            if (!docs.childElementCount && item.foto_url) {
                const photo = fileLink(
                    item.foto_url,
                    'Foto Konstruksi',
                    'image'
                );

                if (photo) docs.appendChild(photo);
            }

            if (!docs.childElementCount) {
                docs.textContent = '—';
            }

            addCell(row, docs);

            /* VIEW DETAIL EXCEL */

            const button = el(
                'button',
                'kf-action-btn kf-action-view'
            );

            button.type = 'button';
            button.title = 'View KIB F';

            button.dataset.kfAction = 'view';
            button.dataset.kfId = String(item.id);

            const eye = el('i');
            eye.setAttribute('data-lucide', 'eye');

            button.appendChild(eye);

            addCell(
                row,
                button,
                'kf-excel-center'
            );

            body.appendChild(row);
        });

        icons();
    }

    /* ======================================================
       AMBIL DATA KELOMPOK
    ====================================================== */

    async function loadGroups() {
        if (!groupDialog || !groupUrl) return;

        groupRequest?.abort();

        const controller = new AbortController();
        groupRequest = controller;

        groupError('');

        const body = $('kfGroupRows');

        const loading = el('tr');

        addCell(
            loading,
            'Memuat daftar pekerjaan...',
            'kf-empty'
        ).colSpan = 6;

        body.replaceChildren(loading);

        const params = new URLSearchParams({
            kategori: groupState.kategori,
            lokasi: groupState.lokasi,
            divisi: groupState.divisi,
            q: groupState.q,
            page: String(groupState.page)
        });

        try {
            const res = await api(
                `${groupUrl}?${params.toString()}`,
                {
                    signal: controller.signal
                }
            );

            if (
                controller.signal.aborted ||
                !groupDialog.open
            ) {
                return;
            }

            groupState.groups = asArray(res.groups);
            groupState.selected = res.selected || null;
            groupState.pagination = res.pagination || {};

            if (res.selected) {
                groupState.kategori =
                    res.selected.kategori;

                groupState.lokasi =
                    res.selected.lokasi;

                groupState.divisi =
                    res.selected.divisi;

                $('kfGroupTitle').textContent =
                    `${res.selected.lokasi} / ${res.selected.divisi}`;

                $('kfGroupCaption').textContent =
                    `Kategori: ${categoryName(
                        res.selected.kategori
                    )}`;

            } else {
                $('kfGroupTitle').textContent =
                    'Belum Ada Pekerjaan';

                $('kfGroupCaption').textContent =
                    'Tambahkan data konstruksi manual.';
            }

            const p = groupState.pagination;

            $('kfGroupCount').textContent =
                `${p.total || 0} pekerjaan`;

            $('kfGroupInfo').textContent =
                `${p.from || 0}–${p.to || 0} dari ${p.total || 0} data`;

            $('kfGroupPage').textContent =
                `${p.page || 1} / ${p.last_page || 1}`;

            $('kfGroupPrev').disabled =
                (p.page || 1) <= 1;

            $('kfGroupNext').disabled =
                (p.page || 1) >= (p.last_page || 1);

            renderGroups();
            renderGroupItems(asArray(res.items));

        } catch (error) {
            if (error.name === 'AbortError') return;

            groupError(
                error.message ||
                'Gagal memuat data konstruksi.'
            );

            body.replaceChildren();
        }
    }

    /* ======================================================
       EVENT KELOMPOK
    ====================================================== */

    $('kfGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );

    $('kfGroupItemSearch')?.addEventListener(
        'input',
        event => {
            clearTimeout(groupTimer);

            const q = event.target.value.trim();

            groupTimer = setTimeout(() => {
                groupState.q = q;
                groupState.page = 1;
                loadGroups();
            }, 300);
        }
    );

    $('kfGroupReset')?.addEventListener(
        'click',
        () => {
            clearTimeout(groupTimer);

            groupState.q = '';
            groupState.page = 1;

            $('kfGroupItemSearch').value = '';

            loadGroups();
        }
    );

    $('kfGroupPrev')?.addEventListener(
        'click',
        () => {
            if (groupState.page > 1) {
                groupState.page--;
                loadGroups();
            }
        }
    );

    $('kfGroupNext')?.addEventListener(
        'click',
        () => {
            if (
                groupState.page <
                (groupState.pagination?.last_page || 1)
            ) {
                groupState.page++;
                loadGroups();
            }
        }
    );

    groupDialog?.addEventListener(
        'close',
        () => {
            groupRequest?.abort();
            clearTimeout(groupTimer);
        }
    );

    /* ======================================================
       TOMBOL AKSI TABEL
    ====================================================== */

    root.addEventListener('click', async event => {
        if (!(event.target instanceof Element)) return;

        const button = event.target.closest(
            'button[data-kf-action]'
        );

        if (
            !button ||
            !root.contains(button) ||
            button.disabled
        ) return;

        const action = button.dataset.kfAction;
        const id = button.dataset.kfId;

        if (!/^\d+$/.test(String(id))) {
            toast('ID Konstruksi tidak valid.');
            return;
        }

        if (action === 'group') {
            openGroup(
                button.dataset.kfCategory,
                button.dataset.kfLocation,
                button.dataset.kfDivision
            );
            return;
        }

        if (action === 'delete') {
            confirmDelete({
                id: Number(id),
                nama_barang: button.dataset.kfName
            });
            return;
        }

        if (!['view', 'edit'].includes(action)) return;

        button.disabled = true;

        try {
            const item = await fetchItem(id);

            if (action === 'edit') {
                editForm(item);
            } else {
                showDetail(item);
            }

        } catch (error) {
            toast(error.message);

        } finally {
            button.disabled = false;
        }
    });

    /* ======================================================
       EDIT DARI DETAIL
    ====================================================== */

    $('kfEdit')?.addEventListener(
        'click',
        () => {
            if (!active) return;

            const item = active;

            closeDialog(detailDialog);
            editForm(item);
        }
    );

    /* ======================================================
       KONFIRMASI HAPUS
    ====================================================== */

    function confirmDelete(item) {
        if (!item) return;

        deleteTarget = {
            id: Number(item.id),

            nama:
                item.nama_barang ||
                item.nama_pekerjaan ||
                `Konstruksi #${item.id}`
        };

        $('kfDeleteName').textContent =
            deleteTarget.nama;

        closeDialog(detailDialog);
        openDialog(deleteDialog);
    }

    $('kfHapus')?.addEventListener(
        'click',
        () => {
            if (active) confirmDelete(active);
        }
    );

    $('kfDeleteConfirm')?.addEventListener(
        'click',
        async () => {
            if (!deleteTarget || deleting) return;

            deleting = true;

            const button = $('kfDeleteConfirm');
            button.disabled = true;

            try {
                await api(
                    `${base}/${encodeURIComponent(
                        deleteTarget.id
                    )}`,
                    { method: 'DELETE' }
                );

                window.location.assign(base);

            } catch (error) {
                toast(error.message);

                deleting = false;
                button.disabled = false;
            }
        }
    );

    deleteDialog?.addEventListener(
        'close',
        () => {
            if (!deleting) deleteTarget = null;
        }
    );

    /* ======================================================
       VALIDASI FORM
    ====================================================== */

    function validateFormChoices() {
        const rules = [
            [
                'kfKategori',
                ['IPA', 'BOOSTER', 'PERPIPAAN'],
                true
            ],

            [
                'kfType',
                ['P', 'SP', 'D'],
                false
            ],

            [
                'kfStruktur',
                ['BERTINGKAT', 'TIDAK BERTINGKAT'],
                false
            ],

            [
                'kfMateri',
                ['BETON', 'TIDAK BETON'],
                false
            ]
        ];

        for (const [id, allowed, required] of rules) {
            const input = $(id);

            if (!input) continue;

            input.value = upper(input.value);

            const valid =
                (!required && !input.value) ||
                allowed.includes(input.value);

            input.setCustomValidity(
                valid
                    ? ''
                    : 'Pilih nilai yang tersedia.'
            );

            if (!valid) {
                input.reportValidity();
                return false;
            }
        }

        return true;
    }

    /* ======================================================
       SIMPAN TAMBAH / EDIT
    ====================================================== */

    form?.addEventListener('submit', async event => {
        event.preventDefault();

        if (saving) return;

        showError('');

        if (!validateFormChoices()) return;
        if (!form.reportValidity()) return;

        saving = true;

        const button = $('kfSimpan');
        button.disabled = true;

        const data = new FormData(form);

        data.set(
            'kategori',
            upper(data.get('kategori'))
        );

        data.delete('dokumens[]');

        newFiles.forEach(file => {
            data.append(
                'dokumens[]',
                file,
                file.name
            );
        });

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

        } catch (error) {
            showError(error.message);

            saving = false;
            button.disabled = false;
        }
    });

    /* ======================================================
       INITIALIZE
    ====================================================== */

    initClock();
    initCombos();
    icons();

})();
    