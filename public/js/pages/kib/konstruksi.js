

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
        'luas',
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

    const pembiayaanNames = Object.freeze({
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    });

    function pembiayaanLabel(value) {
        const original = String(value ?? '').trim();
        if (!original) return 'Belum Diatur';
        return pembiayaanNames[norm(original)] || original;
    }

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

        // Asal Usul Pembiayaan memakai standar kepemilikan,
        // bukan daftar teks bebas seperti versi sebelumnya.
        asal: [
            { value: 'perumdam', label: 'Perumdam Tirta Kencana' },
            { value: 'pusat', label: 'Pemerintah Pusat' },
            { value: 'pemprov', label: 'Pemerintah Provinsi' },
            { value: 'pemkot', label: 'Pemerintah Kota' },
            { value: 'swasta', label: 'Swasta' }
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
                ...asArray(master.departemen).filter(row =>
                    !/^[0-9.\s\/\-]+$/.test(String(row.nama_dep ?? ''))
                    && !String(row.nama_dep ?? '').startsWith('Nama belum diatur')
                ).map(row => ({
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
                    .map(value => {
                        if (source === 'departemen') {
                            const raw = String(value);
                            const match = asArray(master.departemen).find(row =>
                                [row.nama_dep, row.kode_dep, row.id]
                                    .some(part => norm(part) === norm(raw))
                            );
                            return { value: String(match?.nama_dep || raw) };
                        }
                        return { value: String(value) };
                    })
                    .filter(row => source !== 'departemen' || (
                        !/^[0-9.\s\/\-]+$/.test(row.value)
                        && !row.value.startsWith('Nama belum diatur')
                    ))
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
        if ($('kfAsal')) $('kfAsal').required = true;

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

        // Jika sumber pembiayaan data historis kosong, boleh tetap
        // kosong saat mengubah field lain. Entri baru tetap wajib diisi.
        if ($('kfAsal')) {
            $('kfAsal').required = Boolean(String(
                item.asal_pembiayaan ?? item.asal ?? ''
            ).trim());
        }

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
        const exportButton = $('kfExportExcel');
        if (exportButton) exportButton.disabled = false;

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
                'KARTU INVENTARIS BARANG (K.I.B) F'
            ),
            el('h3', '', 'KONSTRUKSI'),
            el('span', '', `PERIODE ${period}`)
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
                'KODE STRUKTUR',
                item.kode_struktur ?? '-'
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

        th(header1, 'Luas (M²)', 2);

        th(header1, 'Letak / Lokasi Alamat', 2);

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

        /* 7. LUAS (jika kolom tersedia dalam database) */
        addCell(dataRow, shown(item.luas), 'kf-excel-center');

        /* 8. LETAK / LOKASI ALAMAT */

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

        /* 9. STATUS TANAH */

        addCell(
            dataRow,
            shown(item.status_tanah),
            'kf-excel-center'
        );

        /* 10. ASAL USUL PEMBIAYAAN */

        addCell(
            dataRow,
            pembiayaanLabel(item.asal ?? item.asal_pembiayaan),
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
       EXPORT DETAIL K.I.B F KE XLSX ASLI (SATU FILE JS)
       - Tidak memerlukan CDN atau plugin tambahan.
       - Teks ditulis sebagai inlineStr: tidak dieksekusi sebagai formula.
       - Foto/PDF tidak ditanam di dalam XLSX; nama lampiran dicatat.
    ====================================================== */

    // Generator historis satu barang tidak lagi dipanggil oleh tombol laporan.
    // Dipertahankan sementara untuk keamanan kompatibilitas kode lama.
    function buildKonstruksiXlsx(item) {
        if (!item || !item.id) {
            throw new Error('Pilih Detail Konstruksi terlebih dahulu.');
        }

        const encoder = new TextEncoder();
        const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';

        const xml = value => String(value ?? '')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

        const string = value => String(value ?? '').trim() || '—';
        const safeCell = (ref, value, style = 0) =>
            `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
        const numericCell = (ref, value, style = 0) => {
            const n = Number(value);
            return value !== null && value !== undefined &&
                String(value).trim() !== '' && Number.isFinite(n)
                ? `<c r="${ref}" s="${style}"><v>${n}</v></c>`
                : safeCell(ref, string(value), style);
        };
        const row = (index, cells, height = 0) =>
            `<row r="${index}"${height ? ` ht="${height}" customHeight="1"` : ''}>${cells.join('')}</row>`;

        function crc32(bytes) {
            let crc = 0xFFFFFFFF;
            for (const byte of bytes) {
                crc ^= byte;
                for (let i = 0; i < 8; i++) {
                    crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
                }
            }
            return (crc ^ 0xFFFFFFFF) >>> 0;
        }

        function zipStore(files) {
            const localParts = [];
            const centralParts = [];
            let offset = 0;
            let centralSize = 0;

            for (const [filename, content] of files) {
                const name = encoder.encode(filename);
                const bytes = encoder.encode(content);
                const crc = crc32(bytes);

                const local = new Uint8Array(30 + name.length + bytes.length);
                const l = new DataView(local.buffer);
                l.setUint32(0, 0x04034b50, true);
                l.setUint16(4, 20, true);
                l.setUint16(6, 0x0800, true);
                l.setUint32(14, crc, true);
                l.setUint32(18, bytes.length, true);
                l.setUint32(22, bytes.length, true);
                l.setUint16(26, name.length, true);
                local.set(name, 30);
                local.set(bytes, 30 + name.length);
                localParts.push(local);

                const central = new Uint8Array(46 + name.length);
                const c = new DataView(central.buffer);
                c.setUint32(0, 0x02014b50, true);
                c.setUint16(4, 20, true);
                c.setUint16(6, 20, true);
                c.setUint16(8, 0x0800, true);
                c.setUint32(16, crc, true);
                c.setUint32(20, bytes.length, true);
                c.setUint32(24, bytes.length, true);
                c.setUint16(28, name.length, true);
                c.setUint32(42, offset, true);
                central.set(name, 46);
                centralParts.push(central);
                centralSize += central.length;
                offset += local.length;
            }

            const tail = new Uint8Array(22);
            const v = new DataView(tail.buffer);
            v.setUint32(0, 0x06054b50, true);
            v.setUint16(8, files.length, true);
            v.setUint16(10, files.length, true);
            v.setUint32(12, centralSize, true);
            v.setUint32(16, offset, true);

            const chunks = [...localParts, ...centralParts, tail];
            const result = new Uint8Array(
                chunks.reduce((size, part) => size + part.length, 0)
            );
            let at = 0;
            for (const chunk of chunks) {
                result.set(chunk, at);
                at += chunk.length;
            }
            return result;
        }

        const place = [
            item.nama_lokasi ?? item.lokasi,
            item.alamat_lokasi ?? item.alamat,
            item.letak
        ].map(value => String(value ?? '').trim())
         .filter(Boolean)
         .filter((value, i, all) =>
             all.findIndex(other => norm(other) === norm(value)) === i
         ).join('\n');

        const docs = asArray(item.dokumens)
            .map(doc => String(doc.nama || '').trim())
            .filter(Boolean);
        if (item.foto_url) docs.push('Foto Utama Konstruksi');
        const note = [
            string(item.ket ?? item.keterangan),
            docs.length ? `Lampiran: ${docs.join(', ')}` : ''
        ].filter(value => value && value !== '—').join('\n');

        const columns = 'ABCDEFGHIJKLM'.split('');
        const headers = [
            'No.', 'Nama Barang / Jenis Barang', 'Tahun',
            'Bangunan (P, SP, D)', 'Bertingkat / Tidak', 'Beton / Tidak',
            'Letak / Lokasi Alamat', 'Cakupan', 'Status Tanah',
            'Asal Usul Pembiayaan', 'Status Aset', 'Nilai (Rp)',
            'Dokumen Pendukung / Keterangan'
        ];
        const values = [
            1,
            string(item.nama_barang ?? item.nama_pekerjaan),
            item.tahun,
            buildingName(item.type ?? item.jenis_bangunan),
            string(item.struktur ?? item.bertingkat),
            string(item.materi ?? item.material),
            string(place),
            string(item.cakupan),
            string(item.status_tanah),
            pembiayaanLabel(item.asal ?? item.asal_pembiayaan),
            string(item.status_aset),
            item.nilai,
            string(note)
        ];
        const metadata = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDA TIRTA KENCANA'],
            ['DEPARTEMEN', string(item.nama_departemen ?? item.departemen)],
            ['DIVISI', string(item.nama_divisi ?? item.divisi)],
            ['KATEGORI', categoryName(item.kategori)],
            ['CAKUPAN', string(item.cakupan)],
            ['LOKASI', string(item.nama_lokasi ?? item.lokasi)]
        ];

        const rows = [
            row(1, [safeCell('A1', 'KARTU INVENTARIS BARANG (K.I.B) F', 1)], 28),
            row(2, [safeCell('A2', 'KONSTRUKSI DALAM PENGERJAAN', 1)], 26),
            ...metadata.map(([label, value], index) => row(index + 4, [
                safeCell(`A${index + 4}`, label, 4),
                safeCell(`C${index + 4}`, value)
            ])),
            row(13, headers.map((label, index) =>
                safeCell(`${columns[index]}13`, label, 2)
            ), 48),
            row(14, values.map((value, index) =>
                [0, 2, 11].includes(index)
                    ? numericCell(`${columns[index]}14`, value, 3)
                    : safeCell(`${columns[index]}14`, value, 3)
            ), 60)
        ];

        const widths = [8, 42, 12, 24, 24, 20, 42, 30, 24, 28, 24, 22, 45];
        const sheet = declaration + `<worksheet xmlns="${ns}">` +
            `<sheetViews><sheetView workbookViewId="0"/></sheetViews>` +
            `<cols>${widths.map((width, index) =>
                `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
            ).join('')}</cols>` +
            `<sheetData>${rows.join('')}</sheetData>` +
            '<mergeCells count="2"><mergeCell ref="A1:M1"/>' +
            '<mergeCell ref="A2:M2"/></mergeCells></worksheet>';

        const styles = declaration + `<styleSheet xmlns="${ns}">` +
            '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>' +
            '<font><b/><sz val="14"/><name val="Calibri"/><color rgb="FF133D67"/></font>' +
            '<font><b/><sz val="10"/><name val="Calibri"/><color rgb="FF143B64"/></font></fonts>' +
            '<fills count="3"><fill><patternFill patternType="none"/></fill>' +
            '<fill><patternFill patternType="gray125"/></fill>' +
            '<fill><patternFill patternType="solid"><fgColor rgb="FFDCEBFA"/></patternFill></fill></fills>' +
            '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
            '<border><left style="thin"><color rgb="FF293746"/></left>' +
            '<right style="thin"><color rgb="FF293746"/></right>' +
            '<top style="thin"><color rgb="FF293746"/></top>' +
            '<bottom style="thin"><color rgb="FF293746"/></bottom><diagonal/></border></borders>' +
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
            '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
            '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
            '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
            '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>';
        const workbook = declaration + `<workbook xmlns="${ns}" xmlns:r="${rel}">` +
            '<sheets><sheet name="KIB F" sheetId="1" r:id="rId1"/></sheets></workbook>';
        const workbookRels = declaration + `<Relationships xmlns="${pkg}">` +
            `<Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/>` +
            `<Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`;
        const rootRels = declaration + `<Relationships xmlns="${pkg}">` +
            `<Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
        const contentTypes = declaration +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';

        return zipStore([
            ['[Content_Types].xml', contentTypes],
            ['_rels/.rels', rootRels],
            ['xl/workbook.xml', workbook],
            ['xl/_rels/workbook.xml.rels', workbookRels],
            ['xl/styles.xml', styles],
            ['xl/worksheets/sheet1.xml', sheet]
        ]);
    }

    // Export versi lama per satu barang digantikan popup baku per kelompok.
    // Handler baru didefinisikan pada blok K.I.B F Report di bawah.

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

    /* ================================================================
       K.I.B F — LAPORAN PER KELOMPOK (PRD v2.1)
       Pola popup/preview/cetak mengikuti K.I.B A Tanah.
       Konstruksi hanya diekspor per kategori + lokasi + divisi;
       tidak pernah memakai pagination Detail sebagai batas ekspor.
       ================================================================ */

    const reportDialog = $('kfReportDialog');
    const reportInputs = ['known', 'checked1', 'checked2', 'created']
        .map(name => $(
            'kfReportSigner' + ({known:'Known',checked1:'Checked1',checked2:'Checked2',created:'Created'}[name])
        ));
    const reportState = { response: null, loading: false, request: 0 };
    const reportPeriod = $('kfReportPeriod');
    const reportInfo = $('kfReportInfo');
    const reportPreview = $('kfReportPreview');
    const reportPreviewBox = $('kfReportPreviewBox');
    const reportPrint = $('kfReportPrint');
    const reportDownload = $('kfReportDownload');
    const reportRoles = ['Diketahui oleh', 'Diperiksa oleh (1)', 'Diperiksa oleh (2)', 'Dibuat oleh'];
    const reportColumns = [
        'No.', 'Nama Barang / Jenis Barang', 'Tahun', 'Bangunan (P, SP, D)',
        'Bertingkat / Tidak', 'Beton / Tidak', 'Luas (M²)', 'Letak / Lokasi Alamat',
        'Status Tanah', 'Asal Usul Pembiayaan', 'Status Aset', 'Nilai (Rp)', 'Dokumen Pendukung'
    ];
    const reportHtml = value => String(value ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const reportCell = value => String(value ?? '').trim() || '—';
    const reportMonth = () => {
        const parts = String(reportPeriod?.value || '').split('-');
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        if (!year || month < 1 || month > 12) return '';
        return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
            .format(new Date(Date.UTC(year, month-1, 1))).toUpperCase();
    };
    function reportSdmOption(s) {
        return `${s.nama} — ${s.jabatan || 'Tanpa Jabatan'} — NIP ${s.nip || '-'}`;
    }
    const reportSigner = input =>
        asArray(reportState.response?.sdm).find(s => reportSdmOption(s) === input?.value.trim()) || null;
    function reportReady() {
        return !!reportState.response && !reportState.loading && !!reportMonth()
            && reportInputs.every(input => !!reportSigner(input))
            && asArray(reportState.response.items).length > 0;
    }
    function reportLocation(row) {
        return [...new Set([row.lokasi,row.alamat,row.letak]
            .map(x => String(x ?? '').trim()).filter(Boolean))].join('\n') || '—';
    }
    function reportDocument(row) {
        return [row.keterangan, ...asArray(row.dokumens)]
            .map(s => String(s ?? '').trim()).filter(Boolean).join('\n') || '—';
    }
    function reportValues(row, index) {
        const bangunan = {P:'Permanen',SP:'Semi Permanen',D:'Darurat'}[String(row.bangunan ?? '').toUpperCase()]
            || reportCell(row.bangunan);
        const financing = pembiayaanLabel(row.asal_pembiayaan);
        // Satu baris kosong antara identitas barang/cakupan dan uraian pekerjaan.
        // Pemisah \n\n dipertahankan pada preview, Print, serta sel Excel (wrap text).
        const nameHeader = [reportCell(row.nama),
            row.cakupan ? `Cakupan: ${String(row.cakupan).trim()}` : '']
            .filter(Boolean).join('\n');
        const name = String(row.uraian ?? '').trim()
            ? `${nameHeader}\n\nUraian Pekerjaan:\n${String(row.uraian).trim()}`
            : nameHeader;
        return [index+1,name,reportCell(row.tahun),bangunan,reportCell(row.bertingkat),
            reportCell(row.beton),reportCell(row.luas),reportLocation(row),
            reportCell(row.status_tanah),financing,reportCell(row.status_aset),
            Number(row.nilai || 0),reportDocument(row)];
    }
    const reportMetadata = () => {
        const m = reportState.response?.organisasi || {};
        return [
            ['PROVINSI',m.provinsi], ['KOTA',m.kota], ['UNIT',m.unit],
            ['DEPARTEMEN',m.departemen], ['DIVISI',m.divisi],
            ['KODE STRUKTUR',m.kode_struktur]
        ];
    };
    const reportPeriodToday = () => {
        const p = new Intl.DateTimeFormat('en-US', {
            timeZone:'Asia/Makassar', year:'numeric', month:'2-digit'
        }).formatToParts(new Date());
        return `${p.find(x=>x.type==='year').value}-${p.find(x=>x.type==='month').value}`;
    };
    if (reportPeriod && !reportPeriod.value) reportPeriod.value = reportPeriodToday();
    function reportPaper() {
        const state = reportState.response;
        if (!state || !reportReady()) return '';
        const rows = asArray(state.items).map((item, i) =>
            `<tr>${reportValues(item,i).map((v, c) =>
                `<td${c===1 || c===12 ? ' class="kf-report-align-left"' : ''}>${reportHtml(c===11 ? money(v) : v).replace(/\n/g,'<br>')}</td>`).join('')}</tr>`).join('');
        const header = reportColumns.map((c,i) => i===4
            ? '<th colspan="2">Konstruksi Bangunan</th>'
            : (i===5 ? '' : `<th${i===4||i===5?'':' rowspan="2"'}>${reportHtml(c)}</th>`)).join('');
        // Konstruksi Bangunan mempunyai dua subkolom (5, 6).
        const columns = reportColumns.map((name,i) => i===4 || i===5
            ? (i===4 ? '<th colspan="2">Konstruksi Bangunan</th>' : '')
            : `<th rowspan="2">${reportHtml(name)}</th>`).join('');
        const signers = reportInputs.map((input, index) => {
            const s=reportSigner(input);
            return `<div class="kf-report-sign"><b>${reportRoles[index]},</b><span>${reportHtml(s.jabatan || '-')}</span><strong>${reportHtml(s.nama)}</strong><small>NIP. ${reportHtml(s.nip||'-')}</small></div>`;
        }).join('');
        const logo = root.dataset.reportLogo || '';
        return `<article class="kf-report-paper">
          <header class="kf-report-paper-head">
            <img src="${reportHtml(logo)}" alt="Logo Perumda Tirta Kencana">
            <div class="kf-report-paper-heading"><b>KARTU INVENTARIS BARANG (K.I.B) F</b>
            <strong>KONSTRUKSI</strong><span>PERIODE ${reportHtml(reportMonth())}</span></div>
          </header>
          <section class="kf-report-org">${reportMetadata().map(([k,v])=>
              `<div><b>${reportHtml(k)}</b><span>: ${reportHtml(reportCell(v))}</span></div>`).join('')}</section>
          <table class="kf-report-sheet"><thead><tr>${columns}</tr><tr><th>Bertingkat / Tidak</th><th>Beton / Tidak</th></tr></thead><tbody>${rows}</tbody></table>
          <p class="kf-report-date">Samarinda, ${reportHtml(new Intl.DateTimeFormat('id-ID', {
              timeZone:'Asia/Makassar',day:'numeric',month:'long',year:'numeric'
          }).format(new Date()))}</p>
          <section class="kf-report-signatures">${signers}</section>
        </article>`;
    }
    function renderReport() {
        const ok = reportReady();
        if (reportPrint) reportPrint.disabled=!ok;
        if (reportDownload) reportDownload.disabled=!ok;
        if (reportPreviewBox) reportPreviewBox.hidden=!ok;
        if (reportPreview) reportPreview.innerHTML=ok?reportPaper():'';
        if (reportInfo && !reportState.loading) {
            reportInfo.textContent = reportState.response
                ? (asArray(reportState.response.sdm).length === 0
                    ? 'Belum ada SDM berstatus aktif pada Master SDM Pendukung. Aktifkan SDM yang berwenang sebelum mencetak.'
                    : (ok
                        ? `Preview siap: ${reportState.response.items.length} data dalam kelompok ${reportState.response.kelompok.lokasi}.`
                        : `Pilih periode dan empat penandatangan dari SDM Pendukung yang aktif untuk melihat preview. ${reportState.response.items.length} data tersedia.`))
                : 'Pilih kelompok Konstruksi untuk memuat laporan.';
            if (reportState.response?.keterangan_luas) reportInfo.textContent += ` ${reportState.response.keterangan_luas}`;
        }
    }
    async function openKfReport(group) {
        if (!reportDialog) return;
        const kategori=String(group?.kategori ?? '').trim();
        const lokasi=String(group?.lokasi ?? '').trim();
        const divisi=String(group?.divisi ?? '').trim();
        if (!kategori || !lokasi || !divisi) {
            toast('Pilih kelompok Konstruksi terlebih dahulu.');return;
        }
        const version=++reportState.request;
        reportState.response=null;
        reportState.loading=true;
        reportInputs.forEach(input => {if(input)input.value='';});
        closeSignerMenus();
        // Hapus pilihan laporan sebelumnya sebelum mengambil daftar SDM aktif terbaru.
        $('kfReportSdmOptions')?.replaceChildren();
        $('kfReportCount').textContent=`${kategori} / ${lokasi} / ${divisi}`;
        if(reportInfo)reportInfo.textContent='Memuat seluruh data kelompok dan SDM Pendukung...';
        reportDialog.showModal();
        renderReport();
        const url=new URL(root.dataset.reportUrl,window.location.href);
        url.searchParams.set('kategori',kategori);
        url.searchParams.set('lokasi',lokasi);
        url.searchParams.set('divisi',divisi);
        try {
            const result=await api(url.toString());
            if(version!==reportState.request || !reportDialog.open)return;
            reportState.response=result;
            const list=$('kfReportSdmOptions');
            if(list){ list.replaceChildren();
                asArray(result.sdm).forEach(s => {
                    const option=document.createElement('option');
                    option.value=reportSdmOption(s);
                    list.appendChild(option);
                });
            }
        } catch(error) {
            if(version===reportState.request && reportInfo) {
                reportInfo.textContent='Gagal memuat laporan: '+error.message;
            }
        } finally {
            if(version===reportState.request){reportState.loading=false;renderReport();}
        }
    }
    $('kfGroupReportOpen')?.addEventListener('click', () => {
        if(groupState.selected)openKfReport(groupState.selected);
        else toast('Pilih kelompok lokasi terlebih dahulu.');
    });
    $('kfExportExcel')?.addEventListener('click', () => {
        if(!active)return;
        openKfReport({
            kategori: String(active.kategori||'Tanpa Kategori'),
            lokasi: String(active.lokasi||'Tanpa Lokasi'),
            divisi: String(active.divisi||'Tanpa Divisi')
        });
    });
    // Dropdown kustom SDM: tidak memakai popup native <datalist> Chromium.
    // Sumber data tetap response.sdm dari backend (SDM aktif saja).
    const signerMenus = reportInputs.map(input =>
        $(input?.getAttribute('aria-controls') || '')
    );

    function closeSignerMenus(exceptInput = null) {
        reportInputs.forEach((input, index) => {
            if (!input || input === exceptInput) return;
            const menu = signerMenus[index];
            if (menu) {
                menu.hidden = true;
                menu.replaceChildren();
                menu.dataset.activeIndex = '-1';
            }
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
        });
    }

    function chooseSigner(input, sdm) {
        if (!input || !sdm) return;
        input.value = reportSdmOption(sdm);
        closeSignerMenus();
        renderReport();
    }

    function openSignerMenu(input) {
        const idx = reportInputs.indexOf(input);
        const menu = signerMenus[idx];
        if (!menu || !reportDialog?.open) return;

        closeSignerMenus(input);
        menu.replaceChildren();
        menu.dataset.activeIndex = '-1';
        input.removeAttribute('aria-activedescendant');

        const term = String(input.value || '').trim().toLocaleLowerCase('id-ID');
        const matches = asArray(reportState.response?.sdm).filter(sdm =>
            [sdm.nama, sdm.jabatan, sdm.nip, reportSdmOption(sdm)].some(value =>
                String(value ?? '').toLocaleLowerCase('id-ID').includes(term)
            )
        ).slice(0, 20);

        if (!reportState.response || reportState.loading) {
            menu.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            return;
        }

        if (!matches.length) {
            const empty = document.createElement('div');
            empty.className = 'kf-report-suggestion-empty';
            empty.textContent = asArray(reportState.response?.sdm).length
                ? 'Tidak ada SDM aktif yang cocok.'
                : 'Belum ada SDM Pendukung aktif.';
            menu.appendChild(empty);
        }

        matches.forEach((sdm, optionIndex) => {
            const option = document.createElement('div');
            option.id = `${menu.id}-option-${optionIndex}`;
            option.className = 'kf-report-suggestion';
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', 'false');
            option.dataset.value = reportSdmOption(sdm);

            const name = document.createElement('strong');
            name.textContent = String(sdm.nama || 'Tanpa nama');
            const detail = document.createElement('small');
            detail.textContent = `${sdm.jabatan || 'Tanpa Jabatan'} · NIP ${sdm.nip || '-'}`;
            option.append(name, detail);

            // Pilih saat pointerdown agar tidak kalah oleh blur input.
            option.addEventListener('pointerdown', event => {
                event.preventDefault();
                chooseSigner(input, sdm);
            });
            option.addEventListener('click', () => {
                if (!menu.hidden) chooseSigner(input, sdm);
            });
            menu.appendChild(option);
        });

        menu.hidden = false;
        input.setAttribute('aria-expanded', 'true');
    }

    function setSignerActive(input, nextIndex) {
        const menu = signerMenus[reportInputs.indexOf(input)];
        if (!menu || menu.hidden) return;
        const options = [...menu.querySelectorAll('[role="option"]')];
        if (!options.length) return;
        const idx = Math.max(0, Math.min(options.length - 1, nextIndex));
        options.forEach((option, n) => {
            option.classList.toggle('is-active', n === idx);
            option.setAttribute('aria-selected', n === idx ? 'true' : 'false');
        });
        menu.dataset.activeIndex = String(idx);
        input.setAttribute('aria-activedescendant', options[idx].id);
        options[idx].scrollIntoView({block:'nearest'});
    }

    reportInputs.forEach(input => {
        if (!input) return;
        input.addEventListener('focus', () => openSignerMenu(input));
        input.addEventListener('click', () => {
            const menu = signerMenus[reportInputs.indexOf(input)];
            if (menu?.hidden) openSignerMenu(input);
        });
        input.addEventListener('input', () => {
            renderReport();
            openSignerMenu(input);
        });
        input.addEventListener('change', renderReport);
        input.addEventListener('keydown', event => {
            const menu = signerMenus[reportInputs.indexOf(input)];
            if (event.key === 'Escape' && menu && !menu.hidden) {
                event.preventDefault();
                closeSignerMenus();
                return;
            }
            if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
            if (menu?.hidden && event.key !== 'Enter') openSignerMenu(input);
            const choices = menu?.querySelectorAll('[role="option"]') || [];
            if (!choices.length || menu?.hidden) return;
            const current = Number(menu.dataset.activeIndex || -1);
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setSignerActive(input, current + (event.key === 'ArrowDown' ? 1 : -1));
            } else if (event.key === 'Enter' && current >= 0) {
                event.preventDefault();
                const item = asArray(reportState.response?.sdm).find(s =>
                    reportSdmOption(s) === choices[current]?.dataset.value
                );
                if (item) chooseSigner(input, item);
            }
        });
    });

    reportDialog?.addEventListener('pointerdown', event => {
        if (!event.target.closest('.kf-report-signer-field')) closeSignerMenus();
    });
    reportPeriod?.addEventListener('change', renderReport);
    reportDialog?.querySelectorAll('[data-kf-report-close]').forEach(btn =>
        btn.addEventListener('click',()=>reportDialog.close()));
    reportDialog?.addEventListener('close',()=>{closeSignerMenus();reportState.request++;reportState.loading=false;});

    const reportPrintCss = `@page{size:A3 landscape;margin:10mm}
      body{margin:0;font-family:Arial,sans-serif}
      .kf-report-paper{background:#fff;color:#111;padding:12px;font:11px Arial;min-width:0}
      .kf-report-paper-head{position:relative;display:flex;justify-content:center;align-items:center;min-height:95px;margin-bottom:15px}
      .kf-report-paper-head img{position:absolute;left:8px;max-width:275px;max-height:72px;width:auto;height:auto;object-fit:contain}
      .kf-report-paper-heading{text-align:center;display:flex;flex-direction:column;gap:4px;font-weight:700}
      .kf-report-org{margin:12px 0 18px;width:400px;max-width:100%;display:grid;gap:3px}
      .kf-report-org>div{display:grid;grid-template-columns:140px 1fr;gap:5px}
      .kf-report-sheet{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px}
      .kf-report-sheet th,.kf-report-sheet td{border:1px solid #2e394a;text-align:center;vertical-align:middle;padding:6px 4px;overflow-wrap:anywhere}
      .kf-report-sheet th{background:#cbdff1;font-weight:700}
      .kf-report-sheet td{white-space:normal;line-height:1.35}
      .kf-report-sheet td.kf-report-align-left{text-align:left;vertical-align:middle}
      .kf-report-sheet tr{break-inside:avoid}
      .kf-report-sheet thead{display:table-header-group}
      .kf-report-date{text-align:right;font-weight:bold;margin:20px 15px 8px}
      .kf-report-signatures{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;text-align:center}
      .kf-report-sign{display:flex;flex-direction:column;align-items:center;gap:6px;min-height:125px}
      .kf-report-sign strong{margin-top:auto;text-decoration:underline}`;
    reportPrint?.addEventListener('click',()=>{
        if(!reportReady())return;
        const windowPrint=window.open('','_blank');
        if(!windowPrint){if(reportInfo)reportInfo.textContent='Izinkan popup untuk mencetak laporan.';return;}
        windowPrint.document.open();
        windowPrint.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>K.I.B F — Konstruksi</title><style>${reportPrintCss}</style></head><body>${reportPaper()}</body></html>`);
        windowPrint.document.close();
        windowPrint.addEventListener('load',()=>{windowPrint.focus();windowPrint.print();},{once:true});
    });

    // ZIP store tanpa dependensi: Uint8Array asli untuk logo PNG, bukan UTF-8 string.
    function reportZip(entries) {
        const encoder=new TextEncoder();
        const crcTable=new Uint32Array(256);
        for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);crcTable[i]=c>>>0;}
        const crc32=bytes=>{let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
        const local=[],central=[];let offset=0,size=0;
        for(const entry of entries){
            const name=encoder.encode(entry.name);
            const bytes=entry.data instanceof Uint8Array?entry.data:encoder.encode(String(entry.data));
            const crc=crc32(bytes);
            const head=new Uint8Array(30+name.length);const h=new DataView(head.buffer);
            h.setUint32(0,0x04034B50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);
            h.setUint32(14,crc,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);
            h.setUint16(26,name.length,true);head.set(name,30);local.push(head,bytes);
            const center=new Uint8Array(46+name.length);const c=new DataView(center.buffer);
            c.setUint32(0,0x02014B50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);
            c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);
            c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
            center.set(name,46);central.push(center);offset+=head.length+bytes.length;size+=center.length;
        }
        const end=new Uint8Array(22);const v=new DataView(end.buffer);v.setUint32(0,0x06054B50,true);
        v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);
        v.setUint32(12,size,true);v.setUint32(16,offset,true);
        return new Blob([...local,...central,end], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    }
    const reportXml=value=>String(value??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
    const reportLetter=n=>String.fromCharCode(64+n);
    function reportXlsx(logoBytes) {
        const data=asArray(reportState.response?.items);
        const cells=new Map(),merges=[],heights=new Map();
        const put=(r,c,val,style=0)=>{if(!cells.has(r))cells.set(r,new Map());cells.get(r).set(c,{val:val??'',style});};
        const merged=(r1,c1,r2,c2,val,style=0)=>{
            for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)put(r,c,'',style);
            put(r1,c1,val,style);merges.push(`${reportLetter(c1)}${r1}:${reportLetter(c2)}${r2}`);
        };
        merged(3,1,3,13,'KARTU INVENTARIS BARANG (K.I.B) F',1);
        merged(4,1,4,13,'KONSTRUKSI',1);
        merged(5,1,5,13,`PERIODE ${reportMonth()}`,1);
        for(let i=1;i<=6;i++)heights.set(i,25);
        reportMetadata().forEach(([key,value],i)=>{
            merged(8+i,1,8+i,2,key,4);merged(8+i,3,8+i,6,`: ${reportCell(value)}`,4);heights.set(8+i,19);
        });
        const header=16;
        for(let c=1;c<=13;c++){
            if(c===5){merged(header,5,header,6,'KONSTRUKSI BANGUNAN',2);
                put(header+1,5,'BERTINGKAT / TIDAK',2);put(header+1,6,'BETON / TIDAK',2);
            }else if(c!==6){merged(header,c,header+1,c,reportColumns[c-1].toUpperCase(),2);}
            put(header+2,c,String(c),2);
        }
        heights.set(header,32);heights.set(header+1,32);heights.set(header+2,19);
        data.forEach((item,i)=>{
            const r=header+3+i;const values=reportValues(item,i);
            // Kolom B (Nama + Uraian) dan M (Dokumen Pendukung): rata kiri + middle.
            values.forEach((v,c)=>put(r,c+1,v,c===11 ? 7 : (c===1 || c===12 ? 8 : 3)));
            // Tinggi baris memperhitungkan newline kosong dan pembungkusan per kolom.
            const wrapWidths=[5,35,10,14,18,16,13,36,19,21,18,17,43];
            const maxLines=Math.max(...values.map((value,col) =>
                String(value??'').split(/\r?\n/).reduce((sum,line) =>
                    sum+Math.max(1,Math.ceil(line.length/wrapWidths[col])),0)
            ));
            heights.set(r,Math.min(390,Math.max(38,maxLines*15+15)));
        });
        const signatureRow=header+data.length+6;
        merged(signatureRow,10,signatureRow,13,
            `Samarinda, ${new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',day:'numeric',month:'long',year:'numeric'}).format(new Date())}`,5);
        [[1,3],[4,6],[7,9],[10,13]].forEach(([a,b],i)=>{
            const s=reportSigner(reportInputs[i]);
            merged(signatureRow+2,a,signatureRow+2,b,`${reportRoles[i]},`,5);
            merged(signatureRow+3,a,signatureRow+3,b,reportCell(s.jabatan),5);
            merged(signatureRow+8,a,signatureRow+8,b,s.nama,6);
            merged(signatureRow+9,a,signatureRow+9,b,`NIP. ${reportCell(s.nip)}`,5);
        });
        const lastRow=signatureRow+10;
        const widths=[7,42,12,17,20,19,15,42,22,24,20,21,50];
        const cols=widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
        const rows=[...cells].sort(([a],[b])=>a-b).map(([r,map])=>
            `<row r="${r}"${heights.has(r)?` ht="${heights.get(r)}" customHeight="1"`:''}>`+
                [...map].sort(([a],[b])=>a-b).map(([c,obj])=>
                    obj.style===7
                        ? `<c r="${reportLetter(c)}${r}" s="7"><v>${Number(obj.val)||0}</v></c>`
                        : `<c r="${reportLetter(c)}${r}" s="${obj.style}" t="inlineStr"><is><t xml:space="preserve">${reportXml(obj.val)}</t></is></c>`).join('')+
                '</row>').join('');
        const main='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const pkg='http://schemas.openxmlformats.org/package/2006/relationships';
        const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <worksheet xmlns="${main}" xmlns:r="${rel}">
          <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:M${lastRow}"/>
          <sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
          <cols>${cols}</cols><sheetData>${rows}</sheetData>
          <mergeCells count="${merges.length}">${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>
          <printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.15" footer="0.15"/>
          <pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
          ${logoBytes?.length?'<drawing r:id="rId1"/>':''}</worksheet>`;
        const fonts=[
            '<font><sz val="10"/><name val="Arial"/></font>',
            '<font><b/><sz val="12"/><name val="Arial"/></font>',
            '<font><b/><sz val="9"/><name val="Arial"/></font>',
            '<font><b/><u/><sz val="10"/><name val="Arial"/></font>'
        ].join('');
        const fills='<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC7DFF0"/></patternFill></fill></fills>';
        const borders='<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders>';
        const xfs=[[0,0,0,'left'],[1,0,0,'center'],[2,2,1,'center'],[0,0,1,'center'],
            [2,0,0,'left'],[0,0,0,'center'],[3,0,0,'center'],[0,0,1,'right'],[0,0,1,'left']]
            .map(([f,fill,border,align],i)=>`<xf numFmtId="${i===7?4:0}" fontId="${f}" fillId="${fill}" borderId="${border}" xfId="0" applyAlignment="1"><alignment horizontal="${align}" vertical="center" wrapText="1"/></xf>`).join('');
        const styles=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="${main}">
          <fonts count="4">${fonts}</fonts>${fills}${borders}
          <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
          <cellXfs count="9">${xfs}</cellXfs></styleSheet>`;
        const book=`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${main}" xmlns:r="${rel}">
          <sheets><sheet name="KIB F - Konstruksi" sheetId="1" r:id="rId1"/></sheets>
          <definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'KIB F - Konstruksi'!$16:$18</definedName>
          <definedName name="_xlnm.Print_Area" localSheetId="0">'KIB F - Konstruksi'!$A$1:$M$${lastRow}</definedName></definedNames></workbook>`;
        const files=[
            {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
            {name:'xl/workbook.xml',data:book},
            {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`},
            {name:'xl/worksheets/sheet1.xml',data:sheet},
            {name:'xl/styles.xml',data:styles},
        ];
        if(logoBytes?.length){
            let cy=750000;
            if(logoBytes[0]===137&&logoBytes[1]===80&&logoBytes.length>=24){
                const view=new DataView(logoBytes.buffer,logoBytes.byteOffset,logoBytes.byteLength);
                const w=view.getUint32(16,false),h=view.getUint32(20,false);
                if(w&&h)cy=Math.round(2700000*h/w);
            }
            files.push(
                {name:'xl/media/logo.png',data:logoBytes},
                {name:'xl/worksheets/_rels/sheet1.xml.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`},
                {name:'xl/drawings/_rels/drawing1.xml.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/image" Target="../media/logo.png"/></Relationships>`},
                {name:'xl/drawings/drawing1.xml',data:`<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${rel}"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>110000</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>20000</xdr:rowOff></xdr:from><xdr:ext cx="2700000" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Logo Perumda"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`}
            );
        }
        const types=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logoBytes?.length?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${logoBytes?.length?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':''}</Types>`;
        files.unshift({name:'[Content_Types].xml',data:types});
        return reportZip(files);
    }
    reportDownload?.addEventListener('click',async()=>{
        if(!reportReady())return;
        reportDownload.disabled=true;
        try{
            let logo=null;
            try{const response=await fetch(root.dataset.reportLogo,{credentials:'same-origin'});
                if(response.ok)logo=new Uint8Array(await response.arrayBuffer());
            }catch(e){console.warn('Logo tidak termuat',e);}
            const blob=reportXlsx(logo);
            const link=document.createElement('a');
            const href=URL.createObjectURL(blob);
            const lokasi=String(reportState.response.kelompok.lokasi).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,35);
            link.href=href;link.download=`KIB_F_Konstruksi_${lokasi}_${reportPeriod.value}.xlsx`;
            document.body.appendChild(link);link.click();link.remove();
            setTimeout(()=>URL.revokeObjectURL(href),12000);
        }catch(e){if(reportInfo)reportInfo.textContent='Gagal membuat Excel: '+e.message;}
        finally{reportDownload.disabled=!reportReady();}
    });

    /* ======================================================
       INITIALIZE
    ====================================================== */

    initClock();
    initCombos();
    icons();

})();