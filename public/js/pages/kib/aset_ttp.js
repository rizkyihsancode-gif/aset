
/*
|--------------------------------------------------------------------------
| K.I.B E — ASET TETAP LAINNYA
| PERUMDAM TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
| Database: kib_aset_tetap_manual
| Popup Kelompok: 10 kolom Excel + 1 View
| Popup Detail: Format Excel tanpa TTD
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('aemApp');

    if (!root || root.dataset.loaded === '1') return;

    root.dataset.loaded = '1';

    /* ======================================================
       EXPORT EXCEL XLSX — MENYATU DALAM ASET_TTP.JS
       Sebelumnya file terpisah: aset_ttp_excel.js
       Semua fungsi XLSX tetap dipertahankan.
       ====================================================== */

    // Ekspor langsung versi lama (satu barang/tanpa popup) telah diganti
    // oleh modal laporan baku K.I.B E di bagian akhir file ini.
    // Seluruh kode CRUD/Form/Detail tetap dipertahankan.

    const $ = id => document.getElementById(id);

    const base = String(
        root.dataset.base || ''
    ).replace(/\/$/, '');

    const groupUrl = String(root.dataset.groupUrl || '');
    const token = String(root.dataset.token || '');

    const form = $('aemForm');
    const formDialog = $('aemFormDialog');
    const groupDialog = $('aemGroupPanel');
    const detailDialog = $('aemDetailDialog');
    const deleteDialog = $('aemDeleteDialog');

    const fields = [
        'nama_aset',
        'lokasi',
        'alamat',
        'departemen',
        'divisi',
        'kode_struktur',
        'kode_inventaris',
        'nomor_register',
        'kondisi',
        'bahan',
        'tahun',
        'jumlah_unit',
        'asal_perolehan',
        'keterangan',
        'status_kepemilikan'
    ];

    const norm = value =>
        String(value ?? '')
            .trim()
            .toLocaleLowerCase('id-ID');

    const showValue = value =>
        String(value ?? '').trim() || '—';

    const asArray = value =>
        Array.isArray(value) ? value : [];

    const elem = (
        tag,
        cls = '',
        value = null
    ) => {
        const e = document.createElement(tag);

        if (cls) e.className = cls;

        if (value !== null && value !== undefined) {
            e.textContent = String(value);
        }

        return e;
    };

    const cell = (
        row,
        content,
        cls = ''
    ) => {
        const td = elem('td', cls);

        if (content instanceof Node) {
            td.append(content);
        } else {
            td.textContent = String(content ?? '—');
        }

        row.append(td);

        return td;
    };

    const icons = () =>
        window.lucide?.createIcons?.();

    const open = dialog => {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        icons();
    };

    const close = dialog => {
        if (dialog?.open) dialog.close();
    };

    const parseScript = id => {
        try {
            return JSON.parse(
                $(id)?.textContent || '{}'
            ) || {};
        } catch {
            return {};
        }
    };

    const master = parseScript('aemMaster');
    const history = parseScript('aemHistory');

    const combos = new Map();

    let active = null;
    let editId = null;
    let deleteId = null;

    let saving = false;
    let deleting = false;

    let newFiles = [];
    let toastTimer;

    /* ======================================================
       TOAST
    ====================================================== */

    function toast(message) {
        const box = $('aemToast');

        if (!box) return;

        box.textContent = message;
        box.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            box.hidden = true;
        }, 4000);
    }

    function error(message) {
        const box = $('aemError');

        if (!box) return;

        box.textContent = message || '';
        box.hidden = !message;
    }

    /* ======================================================
       API REQUEST
    ====================================================== */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                Accept: 'application/json',

                'X-Requested-With':
                    'XMLHttpRequest',

                'X-CSRF-TOKEN': token,

                ...(options.headers || {})
            }
        });

        const result = await response
            .json()
            .catch(() => ({}));

        if (
            !response.ok ||
            result.success === false
        ) {
            const validation = result.errors
                ? Object.values(result.errors)
                    .flat()
                    .join('\n')
                : '';

            let message =
                validation ||
                result.message ||
                `Server Error (HTTP ${response.status})`;

            if (response.status === 419) {
                message =
                    'Sesi login habis. Muat ulang halaman.';
            }

            if (response.status === 413) {
                message =
                    'Ukuran file melampaui batas server.';
            }

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                message =
                    'Akses ditolak atau sesi login habis.';
            }

            throw new Error(message);
        }

        return result;
    }

    /* ======================================================
       TOMBOL TUTUP MODAL
    ====================================================== */

    root
        .querySelectorAll('[data-aem-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                close($(button.dataset.aemClose));
            });
        });

    /* ======================================================
       TANGGAL DAN JAM WITA
    ====================================================== */

    const dateFmt = new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone: 'Asia/Makassar',
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }
    );

    const timeFmt = new Intl.DateTimeFormat(
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
        if ($('aemDate')) {
            $('aemDate').textContent =
                dateFmt.format(new Date());
        }

        if ($('aemTime')) {
            $('aemTime').textContent =
                timeFmt
                    .format(new Date())
                    .replace(/\./g, ':');
        }
    }

    tick();

    if ($('aemDate') || $('aemTime')) {
        setInterval(tick, 1000);
    }

    /* ======================================================
       SEARCHABLE DROPDOWN
    ====================================================== */

    const presets = {
        kondisi: [
            {
                value: 'BAIK',
                label: 'B — Baik'
            },
            {
                value: 'KURANG BAIK',
                label: 'KB — Kurang Baik'
            },
            {
                value: 'RUSAK BERAT',
                label: 'RB — Rusak Berat'
            },
            {
                value: 'CUKUP',
                label: 'Data lama'
            },
            {
                value: 'RUSAK RINGAN',
                label: 'Data lama'
            }
        ],

        kepemilikan: [
            { value: 'perumdam', label: 'Perumdam Tirta Kencana' },
            { value: 'pusat', label: 'Pemerintah Pusat' },
            { value: 'pemprov', label: 'Pemerintah Provinsi' },
            { value: 'pemkot', label: 'Pemerintah Kota' },
            { value: 'swasta', label: 'Swasta' }
        ],

        asal: [
            'PENGADAAN',
            'PEMBELIAN',
            'HIBAH',
            'BANTUAN',
            'LAINNYA'
        ].map(value => ({ value }))
    };

    function comboOptions(type) {
        let options = [];

        if (type === 'lokasi') {
            options = asArray(master.lokasi)
                .map(o => ({
                    value: o.lokasi,
                    label: o.alamat || '',
                    raw: o
                }));
        }

        if (type === 'departemen') {
            options = asArray(master.departemen)
                .map(o => ({
                    value: o.nama_dep,
                    raw: o
                }));
        }

        if (type === 'divisi') {
            const dep = asArray(master.departemen)
                .find(o =>
                    norm(o.nama_dep) ===
                    norm($('aemDep')?.value)
                );

            const data = dep
                ? asArray(master.divisi)
                    .filter(o =>
                        String(o.id_dep) ===
                        String(dep.id)
                    )
                : asArray(master.divisi);

            options = data.map(o => ({
                value: o.nama_div,
                raw: o
            }));
        }

        if (type === 'bahan') {
            options = asArray(master.bahan)
                .map(o => ({
                    value:
                        o.nama ||
                        o.nama_bahan
                }));
        }

        if (presets[type]) {
            options.push(...presets[type]);
        }

        const more = {
            lokasi: history.lokasi,
            departemen: history.departemen,
            divisi: history.divisi,
            bahan: history.bahan,
            asal: history.asal_perolehan
        };

        for (const value of asArray(more[type])) {
            options.push({
                value: String(value)
            });
        }

        const seen = new Set();

        return options.filter(o => {
            const key = norm(o.value);

            if (!key || seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }

    function initCombos() {
        if (!form) return;

        form
            .querySelectorAll('[data-aem-combo]')
            .forEach(input => {
                if (input.dataset.ready === '1') {
                    return;
                }

                input.dataset.ready = '1';

                const type = input.dataset.aemCombo;

                const wrapper = elem(
                    'div',
                    'aem-combo'
                );

                input.parentNode.insertBefore(
                    wrapper,
                    input
                );

                wrapper.append(input);

                const toggle = elem(
                    'button',
                    'aem-combo-arrow',
                    '⌄'
                );

                toggle.type = 'button';

                toggle.setAttribute(
                    'aria-label',
                    'Tampilkan pilihan'
                );

                const panel = elem(
                    'div',
                    'aem-combo-options'
                );

                panel.hidden = true;
                panel.setAttribute('role', 'listbox');

                wrapper.append(toggle, panel);

                let visible = [];
                let selection = -1;

                function hideList() {
                    panel.hidden = true;

                    wrapper.classList.remove(
                        'opened',
                        'up'
                    );

                    selection = -1;
                }

                function selectOption(option) {
                    input.value = String(option.value);
                    input.setCustomValidity('');

                    if (
                        type === 'lokasi' &&
                        option.raw?.alamat &&
                        $('aemAlamat') &&
                        !$('aemAlamat').value.trim()
                    ) {
                        $('aemAlamat').value =
                            String(option.raw.alamat);
                    }

                    input.dispatchEvent(
                        new Event('change', {
                            bubbles: true
                        })
                    );

                    hideList();

                    input.focus({
                        preventScroll: true
                    });
                }

                function render(showAll = false) {
                    combos.forEach((combo, key) => {
                        if (key !== input.name) {
                            combo.close();
                        }
                    });

                    const search = showAll
                        ? ''
                        : norm(input.value);

                    visible = comboOptions(type)
                        .filter(o =>
                            norm(
                                `${o.value} ${o.label || ''}`
                            ).includes(search)
                        )
                        .slice(0, 150);

                    panel.replaceChildren();
                    selection = -1;

                    if (!visible.length) {
                        panel.append(
                            elem(
                                'div',
                                'aem-combo-empty',
                                ['kondisi', 'kepemilikan'].includes(type)
                                    ? 'Pilih salah satu status yang tersedia.'
                                    : 'Belum ada pilihan. Kamu bisa mengetik nilai baru.'
                            )
                        );
                    }

                    visible.forEach(option => {
                        const button = elem(
                            'button',
                            'aem-combo-item'
                        );

                        button.type = 'button';

                        button.append(
                            elem(
                                'strong',
                                '',
                                option.value
                            )
                        );

                        if (option.label) {
                            button.append(
                                elem(
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
                            () => selectOption(option)
                        );

                        panel.append(button);
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
                        window.innerHeight -
                            rect.bottom < 190 &&
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

                toggle.addEventListener(
                    'mousedown',
                    e => e.preventDefault()
                );

                toggle.addEventListener('click', () => {
                    if (panel.hidden) {
                        render(true);
                    } else {
                        hideList();
                    }
                });

                input.addEventListener('keydown', e => {
                    if (
                        e.key === 'Escape' &&
                        !panel.hidden
                    ) {
                        e.preventDefault();
                        hideList();
                    }

                    if (e.key === 'Tab') {
                        hideList();
                    }

                    if (
                        ['ArrowDown', 'ArrowUp']
                            .includes(e.key)
                    ) {
                        e.preventDefault();

                        if (panel.hidden) {
                            render(true);
                        }

                        if (visible.length) {
                            selection = (
                                selection +
                                (
                                    e.key === 'ArrowDown'
                                        ? 1
                                        : -1
                                ) +
                                visible.length
                            ) % visible.length;

                            panel
                                .querySelectorAll(
                                    '.aem-combo-item'
                                )
                                .forEach((node, i) => {
                                    node.classList.toggle(
                                        'active',
                                        i === selection
                                    );

                                    if (i === selection) {
                                        node.scrollIntoView({
                                            block: 'nearest'
                                        });
                                    }
                                });
                        }
                    }

                    if (
                        e.key === 'Enter' &&
                        !panel.hidden &&
                        selection >= 0
                    ) {
                        e.preventDefault();

                        selectOption(
                            visible[selection]
                        );
                    }
                });

                combos.set(input.name, {
                    close: hideList,
                    wrapper
                });
            });

        document.addEventListener('pointerdown', e => {
            combos.forEach(combo => {
                if (
                    !combo.wrapper.contains(e.target)
                ) {
                    combo.close();
                }
            });
        });

        $('aemDep')?.addEventListener(
            'change',
            () => {
                if ($('aemDiv')) {
                    $('aemDiv').value = '';
                }

                combos.get('divisi')?.close();
            }
        );
    }

    /* ======================================================
       LAMPIRAN FOTO DAN PDF
    ====================================================== */

    function resetDocs() {
        newFiles = [];

        if ($('aemDocsInput')) {
            $('aemDocsInput').value = '';
        }

        $('aemSelectedDocs')?.replaceChildren();
        $('aemSavedDocs')?.replaceChildren();
    }

    function renderNewDocs() {
        const box = $('aemSelectedDocs');

        if (!box) return;

        box.replaceChildren();

        if (!newFiles.length) return;

        box.append(
            elem(
                'strong',
                '',
                `${newFiles.length} lampiran baru`
            )
        );

        newFiles.forEach((file, index) => {
            const row = elem(
                'div',
                'aem-file-row'
            );

            row.append(
                elem(
                    'span',
                    '',
                    `${file.name} (${(
                        file.size / 1048576
                    ).toFixed(2)} MB)`
                )
            );

            const remove = elem(
                'button',
                'aem-link',
                'Batalkan'
            );

            remove.type = 'button';

            remove.addEventListener('click', () => {
                newFiles.splice(index, 1);
                renderNewDocs();
            });

            row.append(remove);
            box.append(row);
        });
    }

    $('aemDocsInput')?.addEventListener(
        'change',
        e => {
            for (
                const file of Array.from(
                    e.target.files || []
                )
            ) {
                if (
                    !/\.(pdf|jpe?g|png|webp)$/i
                        .test(file.name)
                ) {
                    toast(
                        `${file.name}: format tidak didukung.`
                    );

                    continue;
                }

                const duplicate =
                    newFiles.some(old =>
                        old.name === file.name &&
                        old.size === file.size &&
                        old.lastModified ===
                            file.lastModified
                    );

                if (!duplicate) {
                    newFiles.push(file);
                }
            }

            e.target.value = '';

            renderNewDocs();
        }
    );

    function fileLink(url, name, iconName) {
        if (!url) return null;

        const a = elem(
            'a',
            'aem-kib-file'
        );

        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const i = elem('i');

        i.setAttribute(
            'data-lucide',
            iconName
        );

        a.append(
            i,
            elem(
                'span',
                '',
                name || 'Lampiran'
            )
        );

        return a;
    }

    function renderSavedDocs(docs) {
        const box = $('aemSavedDocs');

        if (!box) return;

        box.replaceChildren();

        if (!asArray(docs).length) return;

        box.append(
            elem(
                'strong',
                '',
                'Lampiran tersimpan:'
            )
        );

        asArray(docs).forEach(doc => {
            const row = elem(
                'div',
                'aem-file-row'
            );

            if (doc.url) {
                const a = fileLink(
                    doc.url,
                    doc.nama,
                    /\.pdf$/i.test(doc.nama || '')
                        ? 'file-text'
                        : 'image'
                );

                if (a) row.append(a);
            }

            if (doc.id != null) {
                const label = elem(
                    'label',
                    'aem-file-remove'
                );

                const check = elem('input');

                check.type = 'checkbox';
                check.name = 'hapus_dokumen_ids[]';
                check.value = String(doc.id);

                label.append(
                    check,
                    document.createTextNode(
                        ' Hapus saat simpan'
                    )
                );

                row.append(label);
            }

            box.append(row);
        });

        icons();
    }

    /* ======================================================
       FORM TAMBAH / EDIT
    ====================================================== */

    function prepareForm() {
        if (!form) return;

        form.reset();
        resetDocs();
        error('');

        saving = false;

        form.querySelectorAll('input')
            .forEach(input => {
                input.setCustomValidity('');
            });

        $('aemSave').disabled = false;

        combos.forEach(combo => combo.close());
    }

    function addForm() {
        if (!form) return;

        prepareForm();

        active = null;
        editId = null;

        if (form.elements.namedItem('tahun')) {
            form.elements.namedItem('tahun').value =
                new Date().getFullYear();
        }

        if (form.elements.namedItem('jumlah_unit')) {
            form.elements.namedItem(
                'jumlah_unit'
            ).value = 1;
        }

        $('aemFormTitle').textContent =
            'Tambah Aset Tetap Lainnya';

        $('aemSave').textContent =
            'Simpan Aset';

        open(formDialog);
    }

    function editForm(item) {
        if (!form || !item) return;

        prepareForm();

        active = item;
        editId = Number(item.id);

        fields.forEach(name => {
            const input =
                form.elements.namedItem(name);

            if (input) {
                input.value = String(
                    item[name] ?? ''
                );
            }
        });

        renderSavedDocs(item.dokumens);

        $('aemFormTitle').textContent =
            'Edit Aset Tetap Lainnya';

        $('aemSave').textContent =
            'Simpan Perubahan';

        open(formDialog);
    }

    $('aemAdd')?.addEventListener(
        'click',
        addForm
    );

    async function fetchItem(id) {
        const res = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!res.data) {
            throw new Error(
                'Data barang tidak ditemukan.'
            );
        }

        return res.data;
    }

    /* ======================================================
       VIEW DETAIL EXCEL KIB E
       TANPA TANDA TANGAN
    ====================================================== */

    const labelKepemilikan = value => ({
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    }[norm(value)] || 'Belum Diatur');

    function detail(item) {
        if (!item) return;

        active = item;

        const body = $('aemDetailBody');

        if (!body) return;

        body.replaceChildren();

        $('aemDetailTitle').textContent =
            item.nama_aset ||
            'Detail Inventaris KIB E';

        const kondisi = {
            'BAIK': 'Baik (B)',
            'B': 'Baik (B)',
            'KURANG BAIK': 'Kurang Baik (KB)',
            'KB': 'Kurang Baik (KB)',
            'RUSAK BERAT': 'Rusak Berat (RB)',
            'RB': 'Rusak Berat (RB)',
            'CUKUP': 'Cukup (data lama)',
            'RUSAK RINGAN':
                'Rusak Ringan (data lama)'
        }[
            String(item.kondisi ?? '')
                .trim()
                .toUpperCase()
        ] || showValue(item.kondisi);

        /* LEMBAR KIB E */

        const sheet = elem(
            'section',
            'aem-kib-sheet'
        );

        /* KOP PERUSAHAAN */

        const heading = elem(
            'div',
            'aem-kib-heading'
        );

        const brand = elem(
            'div',
            'aem-kib-brand'
        );

        if (root.dataset.logoUrl) {
            const logo = elem(
                'img',
                'aem-kib-logo'
            );

            logo.src = root.dataset.logoUrl;
            logo.alt =
                'Logo Perumdam Tirta Kencana';

            logo.onerror = () => logo.remove();

            brand.append(logo);
        }

        brand.append(
            elem(
                'strong',
                '',
                'PERUMDAM TIRTA KENCANA'
            ),

            elem(
                'strong',
                '',
                'KOTA SAMARINDA'
            )
        );

        const title = elem(
            'div',
            'aem-kib-heading-title'
        );

        title.append(
            elem(
                'div',
                '',
                'KARTU INVENTARIS BARANG (KIB)'
            ),

            elem(
                'strong',
                '',
                'E. ASET TETAP LAINNYA'
            ),

            elem(
                'strong',
                '',
                'DETAIL INVENTARIS (K.I.B E)'
            )
        );

        heading.append(brand, title);
        sheet.append(heading);

        /* IDENTITAS ORGANISASI */

        const meta = elem(
            'div',
            'aem-kib-identity'
        );

        const metadata = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDAM TIRTA KENCANA'],
            ['DEPARTEMEN', item.departemen],
            ['DIVISI', item.divisi],
            ['KODE STRUKTUR', item.kode_struktur],
            ['LOKASI / UNIT KERJA', item.lokasi],
            ['ALAMAT', item.alamat]
        ];

        metadata.forEach(([label, value]) => {
            const row = elem(
                'div',
                'aem-kib-identity-row'
            );

            row.append(
                elem('span', '', label),
                elem('span', '', ':'),
                elem(
                    'strong',
                    '',
                    showValue(value)
                )
            );

            meta.append(row);
        });

        sheet.append(meta);

        /* TABEL EXCEL 11 KOLOM: TAMBAHAN STATUS KEPEMILIKAN */

        const scroll = elem(
            'div',
            'aem-kib-table-scroll'
        );

        const table = elem(
            'table',
            'aem-kib-table'
        );

        const cols = elem('colgroup');

        for (let i = 0; i < 11; i++) {
            cols.append(elem('col'));
        }

        table.append(cols);

        const head = elem('thead');

        const h1 = elem('tr');
        const h2 = elem('tr');
        const nums = elem('tr');

        const th = (
            row,
            value,
            rowspan = 1,
            colspan = 1
        ) => {
            const e = elem(
                'th',
                '',
                value
            );

            e.rowSpan = rowspan;
            e.colSpan = colspan;

            row.append(e);
        };

        th(h1, 'No.', 2);

        th(
            h1,
            'Nama Barang / Jenis Barang',
            2
        );

        th(h1, 'Nomor', 1, 2);

        th(
            h1,
            'Kondisi Barang (B, KB, RB)',
            2
        );

        th(h1, 'Bahan', 2);

        th(
            h1,
            'Tahun Pengadaan / Perolehan',
            2
        );

        th(h1, 'Jumlah', 2);

        th(
            h1,
            'Asal Usul / Cara Perolehan',
            2
        );

        th(h1, 'Keterangan', 2);
        th(h1, 'Status Kepemilikan', 2);

        th(h2, 'Kode Barang');
        th(h2, 'Register');

        for (let i = 1; i <= 11; i++) {
            th(nums, String(i));
        }

        head.append(h1, h2, nums);

        /* ISI TABEL DETAIL */

        const tr = elem('tr');

        const values = [
            '1',

            showValue(item.nama_aset),

            showValue(item.kode_inventaris),

            showValue(item.nomor_register),

            kondisi,

            showValue(item.bahan),

            showValue(item.tahun),

            item.jumlah_unit == null
                ? '—'
                : `${Number(item.jumlah_unit)
                    .toLocaleString('id-ID')} buah`,

            showValue(item.asal_perolehan),

            showValue(item.keterangan),
            labelKepemilikan(item.status_kepemilikan)
        ];

        values.forEach((value, index) => {
            cell(
                tr,
                value,
                index === 0
                    ? 'aem-kib-center'
                    : ''
            );
        });

        const tbody = elem('tbody');

        tbody.append(tr);

        table.append(head, tbody);
        scroll.append(table);
        sheet.append(scroll);

        /*
         * TANPA TANDA TANGAN.
         * Setelah tabel langsung tampil.
         */

        body.append(sheet);

        /* FOTO DAN DOKUMEN PENDUKUNG */

        const attachment = elem(
            'section',
            'aem-kib-attachments'
        );

        attachment.append(
            elem(
                'h3',
                '',
                'Foto dan Dokumen Pendukung'
            )
        );

        const links = elem(
            'div',
            'aem-kib-file-links'
        );

        const photo = fileLink(
            item.foto_url,
            'Lihat Foto Utama',
            'image'
        );

        if (photo) {
            links.append(photo);
        }

        asArray(item.dokumens)
            .forEach(doc => {
                const link = fileLink(
                    doc.url,
                    doc.nama || 'Lampiran',
                    /\.pdf$/i.test(doc.nama || '')
                        ? 'file-text'
                        : 'image'
                );

                if (link) {
                    links.append(link);
                }
            });

        if (!links.childElementCount) {
            links.append(
                elem(
                    'p',
                    '',
                    'Belum ada foto atau dokumen pendukung.'
                )
            );
        }

        attachment.append(links);
        body.append(attachment);

        open(detailDialog);
        icons();
    }

    /* ======================================================
       DETAIL KELOMPOK
    ====================================================== */

    const gs = {
        lokasi: '',
        divisi: '',
        q: '',
        page: 1,
        groups: [],
        selected: null,
        pagination: null,
        currentItems: [],
        activeItemId: null,
        selectedItem: null
    };

    let inspectSequence = 0;
    let groupRequest = null;
    let groupTimer = null;

    function groupError(message) {
        const node = $('aemGroupAlert');

        if (!node) return;

        node.textContent = message || '';
        node.hidden = !message;
    }

    function openGroup(lokasi, divisi) {
        if (!groupDialog || !groupUrl) {
            toast(
                'Endpoint Detail Kelompok belum tersedia.'
            );

            return;
        }

        gs.lokasi =
            String(lokasi ?? '').trim() ||
            'Tanpa Lokasi';

        gs.divisi =
            String(divisi ?? '').trim() ||
            'Tanpa Divisi';

        gs.page = 1;
        gs.q = '';
        gs.activeItemId = null;
        gs.selectedItem = null;
        inspectSequence++;
        if ($('aemGroupInspect')) $('aemGroupInspect').hidden = true;

        $('aemGroupSearch').value = '';
        $('aemGroupItemSearch').value = '';

        open(groupDialog);
        loadGroup();
    }

    /* ======================================================
       PANEL KIRI — LOKASI / DIVISI
    ====================================================== */

    function renderGroups() {
        const container = $('aemGroupList');
        if (!container) return;

        container.replaceChildren();
        const q = norm($('aemGroupSearch')?.value);
        const entries = gs.groups.filter(group =>
            norm(`${group.lokasi} ${group.divisi}`).includes(q)
        );

        if (!entries.length) {
            container.append(elem('div', 'aem-empty', 'Tidak ada lokasi yang sesuai.'));
            return;
        }

        entries.forEach(group => {
            const button = elem('button', 'aem-location-card');
            button.type = 'button';
            const selected = gs.selected &&
                gs.selected.lokasi === group.lokasi &&
                gs.selected.divisi === group.divisi;
            if (selected) button.classList.add('active');
            button.setAttribute('aria-pressed', String(Boolean(selected)));
            button.title = `Lokasi ${group.lokasi} · Divisi ${group.divisi}`;

            button.append(
                elem('strong', '', group.lokasi),
                elem('small', '', `Divisi: ${group.divisi}`),
                elem('span', '', `${Number(group.jumlah || 0).toLocaleString('id-ID')} inventaris`)
            );

            button.addEventListener('click', () => {
                gs.lokasi = group.lokasi;
                gs.divisi = group.divisi;
                gs.page = 1;
                gs.q = '';
                gs.activeItemId = null;
                gs.selectedItem = null;
                inspectSequence++;
                if ($('aemGroupInspect')) $('aemGroupInspect').hidden = true;
                $('aemGroupItemSearch').value = '';
                loadGroup();
            });
            container.append(button);
        });
    }

    /* ======================================================
       LABEL KONDISI BARANG
    ====================================================== */

    const conditions = {
        'BAIK': 'Baik (B)',
        'B': 'Baik (B)',
        'KURANG BAIK': 'Kurang Baik (KB)',
        'KB': 'Kurang Baik (KB)',
        'RUSAK BERAT': 'Rusak Berat (RB)',
        'RB': 'Rusak Berat (RB)',
        'CUKUP': 'Cukup (data lama)',
        'RUSAK RINGAN':
            'Rusak Ringan (data lama)'
    };

    /* ======================================================
       PANEL KANAN — 11 KOLOM EXCEL + 1 VIEW
    ====================================================== */

    function renderGroupRows(items) {
        const tbody = $('aemGroupRows');
        if (!tbody) return;
        tbody.replaceChildren();
        gs.currentItems = items;

        if (!items.length) {
            const tr = elem('tr');
            cell(tr, 'Tidak ada barang pada kelompok ini.', 'aem-empty').colSpan = 12;
            tbody.append(tr);
            return;
        }

        const start = Number(gs.pagination?.from ?? 1);

        items.forEach((item, index) => {
            const tr = elem('tr', 'aem-inventory-row');
            tr.dataset.aemRowId = String(item.id);
            tr.tabIndex = 0;
            tr.setAttribute('aria-label', `Lihat lampiran ${showValue(item.nama_aset)}`);
            if (Number(gs.activeItemId) === Number(item.id)) tr.classList.add('is-selected');

            const condition = conditions[String(item.kondisi ?? '').trim().toUpperCase()] ||
                showValue(item.kondisi);
            const values = [
                start + index,
                showValue(item.nama_aset),
                showValue(item.kode_inventaris),
                showValue(item.nomor_register),
                condition,
                showValue(item.bahan),
                showValue(item.tahun),
                item.jumlah_unit == null ? '—' :
                    `${Number(item.jumlah_unit).toLocaleString('id-ID')} buah`,
                showValue(item.asal_perolehan),
                showValue(item.keterangan),
                labelKepemilikan(item.status_kepemilikan),
            ];

            values.forEach((value, i) => {
                cell(tr, value, [0, 6, 7].includes(i) ? 'aem-center' :
                    i === 9 ? 'aem-kib-notes' : '');
            });

            const button = elem('button', 'aem-icon view');
            button.type = 'button';
            button.dataset.aemInspect = String(item.id);
            button.title = 'Lihat lampiran dan tindakan';
            button.setAttribute('aria-label', `Pilih ${showValue(item.nama_aset)}`);
            const eye = elem('i');
            eye.setAttribute('data-lucide', 'eye');
            button.append(eye);
            cell(tr, button, 'aem-center');
            tbody.append(tr);
        });
        icons();
    }

    function markSelectedGroupRow(id) {
        $('aemGroupRows')?.querySelectorAll('[data-aem-row-id]').forEach(row => {
            row.classList.toggle('is-selected', Number(row.dataset.aemRowId) === Number(id));
        });
    }

    function buildInspectFiles(item) {
        const photoTarget = $('aemInspectPhoto');
        const docTarget = $('aemInspectDocs');
        if (!photoTarget || !docTarget) return;
        photoTarget.replaceChildren();
        docTarget.replaceChildren();

        if (item.foto_url) {
            const link = elem('a', 'aem-inspect-photo-link');
            link.href = item.foto_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            const img = elem('img');
            img.src = item.foto_url;
            img.alt = `Foto ${showValue(item.nama_aset)}`;
            img.loading = 'lazy';
            img.addEventListener('error', () => {
                link.replaceChildren(elem('span', '', 'Foto tidak dapat dimuat.'));
            }, { once: true });
            link.append(img);
            photoTarget.append(link);
        } else {
            photoTarget.append(elem('span', '', 'Foto belum tersedia'));
        }

        const docs = asArray(item.dokumens);
        if (!docs.length) {
            docTarget.append(elem('span', '', 'Dokumen belum tersedia'));
        } else {
            docs.forEach(doc => {
                const link = fileLink(doc.url, doc.nama || 'Dokumen pendukung',
                    /\.pdf$/i.test(doc.nama || '') ? 'file-text' : 'file');
                if (link) docTarget.append(link);
            });
        }
    }

    async function inspectGroupItem(id) {
        if (!groupDialog?.open || !Number.isSafeInteger(Number(id))) return;
        const selectedId = Number(id);
        gs.activeItemId = selectedId;
        gs.selectedItem = null;
        markSelectedGroupRow(selectedId);
        const sequence = ++inspectSequence;
        const section = $('aemGroupInspect');
        if (section) section.hidden = false;
        $('aemInspectTitle').textContent = 'Memuat detail inventaris...';
        $('aemInspectMeta').textContent = 'Memeriksa foto dan dokumen pendukung.';
        $('aemInspectPhoto').textContent = 'Memuat foto...';
        $('aemInspectDocs').textContent = 'Memuat dokumen...';
        ['aemInspectView', 'aemInspectEdit', 'aemInspectDelete'].forEach(name => {
            if ($(name)) $(name).disabled = true;
        });

        try {
            const item = await fetchItem(selectedId);
            if (sequence !== inspectSequence || !groupDialog.open) return;
            gs.selectedItem = item;
            $('aemInspectTitle').textContent = showValue(item.nama_aset);
            $('aemInspectMeta').textContent =
                `${showValue(item.lokasi)} · ${showValue(item.divisi)} · ` +
                `Status Kepemilikan: ${labelKepemilikan(item.status_kepemilikan)}`;
            buildInspectFiles(item);
            ['aemInspectView', 'aemInspectEdit', 'aemInspectDelete'].forEach(name => {
                if ($(name)) $(name).disabled = false;
            });
            icons();
        } catch (error) {
            if (sequence !== inspectSequence) return;
            $('aemInspectTitle').textContent = 'Data tidak dapat dimuat';
            $('aemInspectMeta').textContent = error.message || 'Gagal mengambil detail.';
            $('aemInspectPhoto').textContent = 'Foto tidak tersedia';
            $('aemInspectDocs').textContent = 'Dokumen tidak tersedia';
        }
    }

    $('aemGroupRows')?.addEventListener('click', event => {
        const target = event.target.closest('[data-aem-row-id]');
        if (target) inspectGroupItem(target.dataset.aemRowId);
    });

    $('aemGroupRows')?.addEventListener('keydown', event => {
        if (!['Enter', ' '].includes(event.key)) return;
        const target = event.target.closest('[data-aem-row-id]');
        if (!target || event.target.closest('button')) return;
        event.preventDefault();
        inspectGroupItem(target.dataset.aemRowId);
    });

    $('aemInspectView')?.addEventListener('click', () => {
        if (gs.selectedItem) detail(gs.selectedItem);
    });
    $('aemInspectEdit')?.addEventListener('click', () => {
        if (gs.selectedItem) editForm(gs.selectedItem);
    });
    $('aemInspectDelete')?.addEventListener('click', () => {
        if (gs.selectedItem) confirmDelete(gs.selectedItem.id, gs.selectedItem.nama_aset);
    });

    /* ======================================================
       LOAD KELOMPOK DARI LARAVEL
    ====================================================== */

    async function loadGroup() {
        if (!groupDialog || !groupUrl) return;

        groupRequest?.abort();

        const controller = new AbortController();

        groupRequest = controller;

        groupError('');
        if ($('aemGroupPrint')) $('aemGroupPrint').disabled = true;

        const tbody = $('aemGroupRows');

        const loading = elem('tr');

        cell(
            loading,
            'Memuat data barang...',
            'aem-empty'
        ).colSpan = 12;

        tbody.replaceChildren(loading);

        const params = new URLSearchParams({
            lokasi: gs.lokasi,
            divisi: gs.divisi,
            q: gs.q,
            page: String(gs.page)
        });

        try {
            const result = await api(
                `${groupUrl}?${params}`,
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

            gs.groups = asArray(result.groups);
            gs.selected = result.selected || null;
            if ($('aemGroupPrint')) $('aemGroupPrint').disabled = !gs.selected || !(Number(result.pagination?.total) > 0);
            gs.pagination = result.pagination || {};

            if (gs.selected) {
                gs.lokasi = gs.selected.lokasi;
                gs.divisi = gs.selected.divisi;
                $('aemGroupDialogTitle').textContent = `DATA ${gs.selected.lokasi.toUpperCase()}`;
                $('aemGroupDialogSubtitle').textContent =
                    `Aset Tetap Lainnya · Divisi ${gs.selected.divisi}`;
                $('aemGroupTitle').textContent = gs.selected.divisi;
                $('aemGroupSubtitle').textContent =
                    `Divisi: ${gs.selected.divisi} · Lokasi: ${gs.selected.lokasi}`;
            } else {
                $('aemGroupDialogTitle').textContent = 'DETAIL ASET TETAP LAINNYA';
                $('aemGroupDialogSubtitle').textContent = 'Belum ada kelompok aset.';
                $('aemGroupTitle').textContent = 'Belum ada kelompok';
                $('aemGroupSubtitle').textContent = 'Tambahkan data manual terlebih dahulu.';
            }

            const p = gs.pagination;

            $('aemGroupCount').textContent =
                `${p.total || 0} barang`;

            $('aemGroupInfo').textContent =
                `${p.from || 0}–${p.to || 0} dari ${p.total || 0} data`;

            $('aemGroupPage').textContent =
                `${p.page || 1} / ${p.last_page || 1}`;

            $('aemGroupPrev').disabled =
                (p.page || 1) <= 1;

            $('aemGroupNext').disabled =
                (p.page || 1) >=
                (p.last_page || 1);

            renderGroups();

            const visibleItems = asArray(result.items);
            renderGroupRows(visibleItems);
            const stillVisible = visibleItems.some(item => Number(item.id) === Number(gs.activeItemId));
            if (!stillVisible) {
                gs.selectedItem = null;
                gs.activeItemId = null;
                inspectSequence++;
                if ($('aemGroupInspect')) $('aemGroupInspect').hidden = true;
            }
            if (visibleItems.length && !stillVisible) {
                inspectGroupItem(visibleItems[0].id);
            }

            /*
             * Mulai tabel dari kolom pertama
             * saat kelompok diganti.
             */

            const scroller =
                groupDialog.querySelector(
                    '.aem-group-right .aem-table-wrap'
                );

            if (scroller) {
                scroller.scrollLeft = 0;
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                return;
            }

            groupError(
                e.message ||
                'Gagal mengambil data kelompok.'
            );

            tbody.replaceChildren();
        }
    }

    /* ======================================================
       EVENT DETAIL KELOMPOK
    ====================================================== */

    function closeGroup() {
        close(groupDialog);
    }

    $('aemBack')?.addEventListener(
        'click',
        closeGroup
    );

    $('aemGroupClose')?.addEventListener(
        'click',
        closeGroup
    );

    groupDialog?.addEventListener(
        'close',
        () => {
            groupRequest?.abort();
            inspectSequence++;
            clearTimeout(groupTimer);
        }
    );

    $('aemGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );

    $('aemGroupItemSearch')?.addEventListener(
        'input',
        e => {
            const q = e.target.value.trim();

            clearTimeout(groupTimer);

            groupTimer = setTimeout(() => {
                gs.q = q;
                gs.page = 1;

                loadGroup();
            }, 300);
        }
    );

    $('aemGroupRefresh')?.addEventListener(
        'click',
        () => {
            clearTimeout(groupTimer);

            gs.q = '';
            gs.page = 1;

            $('aemGroupItemSearch').value = '';

            loadGroup();
        }
    );

    $('aemGroupPrev')?.addEventListener(
        'click',
        () => {
            if (gs.page > 1) {
                gs.page--;
                loadGroup();
            }
        }
    );

    $('aemGroupNext')?.addEventListener(
        'click',
        () => {
            if (
                gs.page <
                (gs.pagination?.last_page || 1)
            ) {
                gs.page++;
                loadGroup();
            }
        }
    );

    /* ======================================================
       AKSI TABEL UTAMA DAN KELOMPOK
    ====================================================== */

    root.addEventListener('click', async e => {
        if (!(e.target instanceof Element)) {
            return;
        }

        const btn = e.target.closest(
            'button[data-aem-action]'
        );

        if (
            !btn ||
            !root.contains(btn) ||
            btn.disabled
        ) {
            return;
        }

        const action = btn.dataset.aemAction;
        const id = btn.dataset.id;

        if (!/^\d+$/.test(String(id))) {
            toast('ID aset tidak valid.');
            return;
        }

        if (action === 'group') {
            openGroup(
                btn.dataset.location,
                btn.dataset.division
            );

            return;
        }

        if (action === 'delete') {
            confirmDelete(
                id,
                btn.dataset.name
            );

            return;
        }

        if (!['view', 'edit'].includes(action)) {
            return;
        }

        btn.disabled = true;

        try {
            const item = await fetchItem(id);

            if (action === 'edit') {
                editForm(item);
            } else {
                detail(item);
            }
        } catch (err) {
            toast(err.message);
        } finally {
            btn.disabled = false;
        }
    });

    /* ======================================================
       EDIT DARI POPUP VIEW
    ====================================================== */

    $('aemEditDetail')?.addEventListener(
        'click',
        () => {
            if (!active) return;

            const item = active;

            close(detailDialog);
            editForm(item);
        }
    );

    $('aemExportDetail')?.addEventListener('click', () => {
        if (!active?.id) return;
        document.dispatchEvent(new CustomEvent('kibe:report', {
            detail: { mode: 'detail', id: active.id }
        }));
    });

    $('aemGroupPrint')?.addEventListener('click', () => {
        if (!gs.selected) return;
        document.dispatchEvent(new CustomEvent('kibe:report', {
            detail: { mode: 'kelompok', lokasi: gs.selected.lokasi, divisi: gs.selected.divisi }
        }));
    });

    /* ======================================================
       DELETE DATA
    ====================================================== */

    function confirmDelete(id, name) {
        deleteId = Number(id);

        $('aemDeleteName').textContent =
            name || `Aset #${id}`;

        close(detailDialog);
        open(deleteDialog);
    }

    $('aemDeleteDetail')?.addEventListener(
        'click',
        () => {
            if (active) {
                confirmDelete(
                    active.id,
                    active.nama_aset
                );
            }
        }
    );

    $('aemConfirmDelete')?.addEventListener(
        'click',
        async () => {
            if (!deleteId || deleting) return;

            deleting = true;

            const btn = $('aemConfirmDelete');

            btn.disabled = true;

            try {
                await api(
                    `${base}/${encodeURIComponent(deleteId)}`,
                    {
                        method: 'DELETE'
                    }
                );

                window.location.assign(base);
            } catch (err) {
                toast(err.message);

                deleting = false;
                btn.disabled = false;
            }
        }
    );

    deleteDialog?.addEventListener(
        'close',
        () => {
            if (!deleting) {
                deleteId = null;
            }
        }
    );

    /* ======================================================
       SIMPAN TAMBAH / EDIT
    ====================================================== */

    form?.addEventListener(
        'submit',
        async e => {
            e.preventDefault();

            if (saving) return;

            error('');

            const condition = $('aemKondisi');

            if (condition) {
                condition.value = String(
                    condition.value ?? ''
                )
                    .trim()
                    .toUpperCase();

                const allowed = [
                    'BAIK',
                    'KURANG BAIK',
                    'RUSAK BERAT',
                    'CUKUP',
                    'RUSAK RINGAN'
                ];

                condition.setCustomValidity(
                    allowed.includes(condition.value)
                        ? ''
                        : 'Pilih BAIK, KURANG BAIK, atau RUSAK BERAT.'
                );
            }

            const ownership = $('aemKepemilikan');
            if (ownership) {
                ownership.value = norm(ownership.value);
                ownership.setCustomValidity(
                    ['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta'].includes(ownership.value)
                        ? ''
                        : 'Pilih Status Kepemilikan dari lima pilihan yang tersedia.'
                );
            }

            if (!form.reportValidity()) {
                return;
            }

            saving = true;

            const saveBtn = $('aemSave');

            saveBtn.disabled = true;

            const data = new FormData(form);

            data.delete('dokumens[]');

            newFiles.forEach(file => {
                data.append(
                    'dokumens[]',
                    file,
                    file.name
                );
            });

            if (editId !== null) {
                data.set(
                    '_method',
                    'PUT'
                );
            }

            const url = editId === null
                ? base
                : `${base}/${encodeURIComponent(editId)}`;

            try {
                await api(url, {
                    method: 'POST',
                    body: data
                });

                window.location.assign(base);
            } catch (err) {
                error(err.message);

                saving = false;
                saveBtn.disabled = false;
            }
        }
    );

    /* ======================================================
       INITIALIZE
    ====================================================== */

    initCombos();
    icons();

})();


/* K.I.B E - Modal laporan dan XLSX 10 kolom sesuai Detail, standar PRD v2.1. */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const page = document.getElementById('aemApp');
    const dialog = document.getElementById('aemReportDialog');
    if (!page || !dialog || !page.dataset.reportUrl) return;

    const $ = selector => dialog.querySelector(selector);
    const form = $('#aemReportForm');
    const month = $('#aemReportPeriod');
    const info = $('#aemReportInfo');
    const previewBox = $('#aemReportPreviewBox');
    const preview = $('#aemReportPreview');
    const download = $('#aemReportDownload');
    const print = $('#aemReportPrint');
    const datalist = $('#aemReportStaff');
    const scope = $('#aemReportScope');
    const roles = [
        ['diketahui', 'Diketahui oleh'],
        ['periksa_1', 'Diperiksa oleh (1)'],
        ['periksa_2', 'Diperiksa oleh (2)'],
        ['dibuat', 'Dibuat oleh'],
    ];
    const state = { lokasi: null, organisasi: {}, data: [], sdm: [], mode: 'detail' };
    let requestVersion = 0;

    const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const cell = v => {
        const text = String(v ?? '').trim();
        return text && text !== 'null' ? text : '-';
    };
    const periodName = () => {
        if (!/^\d{4}-\d{2}$/.test(month.value)) return '';
        const [year, m] = month.value.split('-').map(Number);
        if (m < 1 || m > 12) return '';
        return new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long',
            timeZone: 'Asia/Makassar' }).format(new Date(Date.UTC(year, m-1, 1))).toUpperCase();
    };
    const dateName = () => new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar'
    }).format(new Date());
    const yearOf = v => {
        if (!v) return '-';
        const m = String(v).match(/^(\d{4})/);
        return m ? m[1] : cell(v);
    };
    const money = n => {
        if (n === null || n === undefined || String(n).trim() === '') return '-';
        const num = Number(n);
        return Number.isFinite(num) ? new Intl.NumberFormat('id-ID').format(num) : cell(n);
    };
    const staffLabel = p => `${p.nama} — ${p.jabatan || 'Jabatan -'} — ${p.nip || 'NIP -'} (#${p.id})`;
    const chosen = key => {
        const label = $(`[data-aem-report-role="${key}"]`)?.value.trim();
        return state.sdm.find(p => staffLabel(p) === label) || null;
    };
    const ready = () => Boolean(periodName() && state.data.length && roles.every(([key]) => chosen(key)));
    // K.I.B E: mengikuti sepuluh kolom inventaris yang sudah ada di Detail.
    // Contoh Excel final E belum tersedia; tidak menambahkan kolom tanpa sumber.
    const columns = [
        'No.', 'Nama Barang / Jenis Barang', 'Kode Barang', 'Register',
        'Kondisi Barang (B, KB, RB)', 'Bahan', 'Tahun Pengadaan / Perolehan',
        'Jumlah', 'Asal Usul / Cara Perolehan', 'Keterangan'
    ];
    const groups = [{ first: 3, last: 4, title: 'NOMOR' }];
    const conditions = {
        BAIK: 'Baik (B)', 'KURANG BAIK': 'Kurang Baik (KB)',
        'RUSAK BERAT': 'Rusak Berat (RB)', CUKUP: 'Cukup (lama)',
        'RUSAK RINGAN': 'Rusak Ringan (lama)'
    };
    const rows = () => state.data.map((e, i) => [
        i + 1, e.nama_aset, e.kode_inventaris, e.nomor_register,
        conditions[String(e.kondisi ?? '').trim().toUpperCase()] || e.kondisi,
        e.bahan, e.tahun, e.jumlah_unit, e.asal_perolehan, e.keterangan
    ].map(cell));
    // Standar metadata laporan K.I.B E sesuai referensi Excel perusahaan.
    // Hanya enam atribut resmi, tersusun vertikal dalam urutan yang sama.
    // Identitas lokasi tetap digunakan untuk memilih cakupan laporan,
    // tetapi tidak menjadi baris tambahan pada kop Excel K.I.B E.
    const meta = () => {
        const o = state.organisasi || {};
        return [
            ['PROVINSI', o.provinsi || 'KALIMANTAN TIMUR'],
            ['KOTA', o.kota || 'SAMARINDA'],
            ['UNIT', o.unit || 'PERUMDA TIRTA KENCANA'],
            ['DEPARTEMEN', o.departemen || '-'],
            ['DIVISI', o.divisi || '-'],
            ['KODE STRUKTUR', o.kode_struktur || '-'],
        ];
    };
    const title = () => 'E. ASET TETAP LAINNYA';
    const jenisNama = () => state.mode === 'kelompok' ? 'KELOMPOK LOKASI / DIVISI' : 'DETAIL BARANG';

    function tableHead() {
        let first = '';
        let second = '';
        for (let n = 1; n <= columns.length; n++) {
            const group = groups.find(g => g.first === n);
            if (group) {
                first += `<th colspan="${group.last - group.first + 1}">${escapeHtml(group.title)}</th>`;
                for (let c = group.first; c <= group.last; c++) {
                    second += `<th>${escapeHtml(columns[c-1])}</th>`;
                }
            } else if (!groups.some(g => n > g.first && n <= g.last)) {
                first += `<th rowspan="2">${escapeHtml(columns[n-1])}</th>`;
            }
        }
        return `<tr>${first}</tr><tr>${second}</tr><tr>${columns.map((_, i) =>
            `<th>${i+1}</th>`).join('')}</tr>`;
    }

    function paperHtml() {
        const body = rows().map(row => `<tr>${row.map(value =>
            `<td>${escapeHtml(cell(value))}</td>`).join('')}</tr>`).join('');
        const metadata = meta().map(([key, value]) => `<div><b>${escapeHtml(key)}</b><span>: ${escapeHtml(cell(value))}</span></div>`).join('');
        const signatures = roles.map(([key, label]) => {
            const person = chosen(key);
            return `<div class="aem-report-signature"><b>${escapeHtml(label)},</b>
                <span>${escapeHtml(cell(person?.jabatan))}</span>
                <u>${escapeHtml(cell(person?.nama))}</u>
                <span>NIP. ${escapeHtml(cell(person?.nip))}</span></div>`;
        }).join('');
        return `<article class="aem-report-paper">
            <div class="aem-report-kop">
                <img src="${escapeHtml(page.dataset.reportLogo)}" alt="Logo horizontal Perumda Tirta Kencana">
                <div class="aem-report-kop-title">
                    <strong>KARTU INVENTARIS BARANG (K.I.B)</strong>
                    <strong>${escapeHtml(title())}</strong>
                    <small>${escapeHtml(jenisNama())} · ${escapeHtml(state.lokasi?.nama || '-')}</small>
                    <strong>PERIODE ${escapeHtml(periodName())}</strong>
                </div>
            </div>
            <div class="aem-report-meta">${metadata}</div>
            <div class="aem-report-table-scroll"><table class="aem-report-table">
                <thead>${tableHead()}</thead><tbody>${body}</tbody>
            </table></div>
            <div class="aem-report-date">Samarinda, ${escapeHtml(dateName())}</div>
            <div class="aem-report-signatures">${signatures}</div>
        </article>`;
    }

    function updatePreview() {
        const ok = ready();
        print.disabled = download.disabled = !ok;
        previewBox.hidden = !ok;
        if (!ok) preview.replaceChildren();
        if (!state.data.length) {
            info.textContent = 'Belum ada data K.I.B E pada lokasi ini atau data masih dimuat.';
        } else if (!ok) {
            info.textContent = `${state.data.length} data K.I.B E siap. Pilih periode dan 4 penandatangan dari Master SDM.`;
        } else {
            info.textContent = `Preview siap: ${state.data.length} data K.I.B E di lokasi ${state.lokasi?.nama || '-'}. Status Kepemilikan tidak dicetak.`;
            $('#aemReportCount').textContent = `${state.data.length} data`;
            preview.innerHTML = paperHtml();
        }
    }

    async function openReport(options) {
        const version = ++requestVersion;
        state.data = []; state.sdm = []; state.lokasi = null; state.organisasi = {};
        state.mode = options.mode === 'kelompok' ? 'kelompok' : 'detail';
        form.reset(); datalist.replaceChildren();
        const parts = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric', month: '2-digit', timeZone: 'Asia/Makassar'
        }).formatToParts(new Date());
        month.value = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
        scope.textContent = 'Memuat inventaris yang dipilih...';
        info.textContent = 'Memuat sumber laporan dan Master SDM Pendukung...';
        updatePreview();
        if (!dialog.open) dialog.showModal();
        window.lucide?.createIcons?.();
        try {
            const query = new URLSearchParams({mode: state.mode});
            if (state.mode === 'kelompok') {
                query.set('lokasi', options.lokasi || 'Tanpa Lokasi');
                query.set('divisi', options.divisi || 'Tanpa Divisi');
            } else {
                query.set('id', String(options.id || ''));
            }
            const response = await fetch(`${page.dataset.reportUrl}?${query}`, {
                credentials: 'same-origin',
                headers: {Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest'}
            });
            const json = await response.json();
            if (!response.ok || !json.success || !Array.isArray(json.data)) {
                throw new Error(json.message || `HTTP ${response.status}`);
            }
            if (!dialog.open || version !== requestVersion) return;
            state.data = json.data; state.sdm = Array.isArray(json.sdm) ? json.sdm : [];
            state.lokasi = json.lokasi || null;
            state.organisasi = json.organisasi || {};
            state.mode = json.mode || state.mode;
            scope.textContent = `${jenisNama()} · ${state.lokasi?.nama || '-'} · ${state.data.length} data`;
            datalist.replaceChildren(...state.sdm.map(p => {
                const option = document.createElement('option');
                option.value = staffLabel(p);
                return option;
            }));
            updatePreview();
        } catch (error) {
            if (version !== requestVersion || !dialog.open) return;
            info.textContent = `Gagal memuat laporan: ${error.message}`;
            console.error('K.I.B E: gagal memuat laporan:', error);
        }
    }
    document.addEventListener('kibe:report', event => {
        const options = event.detail || {};
        if (options.mode === 'detail' && !Number.isInteger(Number(options.id))) return;
        if (!['detail','kelompok'].includes(options.mode)) return;
        openReport(options);
    });

    dialog.querySelectorAll('[data-aem-report-close]').forEach(button => {
        button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('close', () => { requestVersion++; });
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', updatePreview);

    function reportZip(entries) {
        const encoder = new TextEncoder();
        const crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let bit = 0; bit < 8; bit++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            crcTable[n] = c >>> 0;
        }
        const crc32 = bytes => {
            let crc = 0xFFFFFFFF;
            for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
            return (crc ^ 0xFFFFFFFF) >>> 0;
        };
        const bytesOf = value => value instanceof Uint8Array ? value : encoder.encode(value);
        const localParts = [];
        const centralParts = [];
        let offset = 0;
        let centralLength = 0;
        const write16 = (view, pos, val) => view.setUint16(pos, val, true);
        const write32 = (view, pos, val) => view.setUint32(pos, val >>> 0, true);

        for (const entry of entries) {
            const nameBytes = encoder.encode(entry.name);
            const data = bytesOf(entry.data);
            const checksum = crc32(data);
            const local = new Uint8Array(30 + nameBytes.length);
            const l = new DataView(local.buffer);
            write32(l, 0, 0x04034B50);
            write16(l, 4, 20);
            write16(l, 6, 0x0800); // UTF-8
            write16(l, 8, 0);      // stored/no compression
            write32(l, 14, checksum);
            write32(l, 18, data.length);
            write32(l, 22, data.length);
            write16(l, 26, nameBytes.length);
            local.set(nameBytes, 30);
            localParts.push(local, data);

            const central = new Uint8Array(46 + nameBytes.length);
            const c = new DataView(central.buffer);
            write32(c, 0, 0x02014B50);
            write16(c, 4, 20);
            write16(c, 6, 20);
            write16(c, 8, 0x0800);
            write16(c, 10, 0);
            write32(c, 16, checksum);
            write32(c, 20, data.length);
            write32(c, 24, data.length);
            write16(c, 28, nameBytes.length);
            write32(c, 42, offset);
            central.set(nameBytes, 46);
            centralParts.push(central);
            offset += local.length + data.length;
            centralLength += central.length;
        }
        const end = new Uint8Array(22);
        const v = new DataView(end.buffer);
        write32(v, 0, 0x06054B50);
        write16(v, 8, entries.length);
        write16(v, 10, entries.length);
        write32(v, 12, centralLength);
        write32(v, 16, offset);
        return new Blob([...localParts, ...centralParts, end], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
    }


    function xmlText(value) {
        return String(value ?? '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }
    function colName(n) {
        let result = '';
        while (n > 0) {
            result = String.fromCharCode(65 + (n - 1) % 26) + result;
            n = Math.floor((n - 1) / 26);
        }
        return result;
    }

    /** Workbook Office OpenXML 10 kolom mengikuti Detail K.I.B E saat ini. */
    function buildXlsx(logoBytes) {
        const count = 10;
        const entries = new Map();
        const merges = [];
        const heights = new Map();
        function put(r, c, value, style = 0) {
            if (!entries.has(r)) entries.set(r, new Map());
            entries.get(r).set(c, { value: value ?? '', style });
        }
        function merged(r1, c1, r2, c2, value, style = 0) {
            for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
                put(r, c, '', style);
            }
            put(r1, c1, value, style);
            merges.push(`${colName(c1)}${r1}:${colName(c2)}${r2}`);
        }
        // Judul dipusatkan terhadap SELURUH lebar tabel A:R. Logo horizontal
        // diletakkan sebagai drawing di kiri, tanpa teks perusahaan tambahan.
        merged(3, 1, 3, count, 'KARTU INVENTARIS BARANG (K.I.B)', 1);
        merged(4, 1, 4, count, title(), 1);
        merged(5, 1, 5, count, `PERIODE ${periodName()}`, 1);
        [29, 25, 26, 25, 24, 27].forEach((n, i) => heights.set(i + 1, n));
        // Baris 8–13: PROVINSI, KOTA, UNIT, DEPARTEMEN, DIVISI,
        // KODE STRUKTUR. Baris 14–16: ruang kosong sebelum tabel.
        meta().forEach(([key, value], i) => {
            merged(8+i, 1, 8+i, 2, key, 4);
            merged(8+i, 3, 8+i, 6, `: ${cell(value)}`, 4);
            heights.set(8+i, 19);
        });

        const header = 17;
        const grouped = c => groups.find(g => c >= g.first && c <= g.last);
        for (let c = 1; c <= count; c++) {
            const group = grouped(c);
            if (group && group.first === c) {
                merged(header, group.first, header, group.last, group.title, 2);
                for (let x = group.first; x <= group.last; x++) {
                    put(header + 1, x, columns[x-1].toUpperCase(), 2);
                }
            } else if (!group) {
                merged(header, c, header + 1, c, columns[c-1].toUpperCase(), 2);
            }
            put(header + 2, c, String(c), 2);
        }
        heights.set(header, 33);
        heights.set(header + 1, 34);
        heights.set(header + 2, 20);
        const data = rows();
        data.forEach((values, i) => {
            const row = header + 3 + i;
            values.forEach((value, column) => put(row, column + 1, cell(value), 3));
            // Tinggi disesuaikan dengan konten panjang, tetap wrap dan middle.
            const longest = Math.max(...values.map(v => String(v ?? '').length));
            heights.set(row, Math.min(145, Math.max(29, Math.ceil(longest / 34) * 15 + 9)));
        });
        const dateRow = header + 3 + data.length + 2;
        merged(dateRow, 7, dateRow, 10, `Samarinda, ${dateName()}`, 5);
        const slots = [[1,2], [3,5], [6,8], [9,10]];
        roles.forEach(([key, label], i) => {
            const signer = chosen(key);
            const [a, b] = slots[i];
            merged(dateRow + 2, a, dateRow + 2, b, `${label},`, 5);
            merged(dateRow + 3, a, dateRow + 3, b, cell(signer?.jabatan), 5);
            merged(dateRow + 8, a, dateRow + 8, b, cell(signer?.nama), 6);
            merged(dateRow + 9, a, dateRow + 9, b, `NIP. ${cell(signer?.nip)}`, 5);
        });
        const lastRow = dateRow + 10;
        const widths = [7,38,24,17,26,22,23,16,36,44];
        const colsXml = widths.map((w, i) =>
            `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
        const rowsXml = [...entries].sort(([a], [b]) => a - b).map(([r, row]) => {
            const cellsXml = [...row].sort(([a], [b]) => a - b).map(([c, item]) =>
                `<c r="${colName(c)}${r}" s="${item.style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(item.value)}</t></is></c>`).join('');
            return `<row r="${r}"${heights.has(r)?` ht="${heights.get(r)}" customHeight="1"`:''}>${cellsXml}</row>`;
        }).join('');
        const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const xmlSheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <worksheet xmlns="${main}" xmlns:r="${rel}">
            <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
            <dimension ref="A1:J${lastRow}"/>
            <sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
            <sheetFormatPr defaultRowHeight="18"/>
            <cols>${colsXml}</cols><sheetData>${rowsXml}</sheetData>
            <mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>
            <printOptions horizontalCentered="1" gridLines="0"/>
            <pageMargins left="0.25" right="0.25" top="0.40" bottom="0.40" header="0.15" footer="0.15"/>
            <pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
            ${logoBytes?.length?'<drawing r:id="rId1"/>':''}
          </worksheet>`;
        const fonts = [
            '<font><sz val="10"/><name val="Arial"/></font>',
            '<font><b/><sz val="12"/><name val="Arial"/></font>',
            '<font><b/><sz val="9"/><name val="Arial"/></font>',
            '<font><b/><u/><sz val="10"/><name val="Arial"/></font>',
        ].join('');
        const fills = '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCEBFA"/><bgColor indexed="64"/></patternFill></fill></fills>';
        const borders = '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF243344"/></left><right style="thin"><color rgb="FF243344"/></right><top style="thin"><color rgb="FF243344"/></top><bottom style="thin"><color rgb="FF243344"/></bottom><diagonal/></border></borders>';
        const xfs = [
            [0,0,0,'left'], [1,0,0,'center'], [2,2,1,'center'],
            [0,0,1,'center'], [2,0,0,'left'],
            [0,0,0,'center'], [3,0,0,'center'],
        ].map(([font, fill, border, align]) =>
            `<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyAlignment="1"><alignment horizontal="${align}" vertical="center" wrapText="1"/></xf>`).join('');
        const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <styleSheet xmlns="${main}"><fonts count="4">${fonts}</fonts>${fills}${borders}
            <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
            <cellXfs count="7">${xfs}</cellXfs>
            <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
        const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="KIB E - Inventaris" sheetId="1" r:id="rId1"/></sheets>
            <definedNames>
                <definedName name="_xlnm.Print_Titles" localSheetId="0">'KIB E - Inventaris'!$17:$19</definedName>
                <definedName name="_xlnm.Print_Area" localSheetId="0">'KIB E - Inventaris'!$A$1:$J$${lastRow}</definedName>
            </definedNames></workbook>`;
        const files = [
            { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
            { name: 'xl/workbook.xml', data: workbook },
            { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>` },
            { name: 'xl/worksheets/sheet1.xml', data: xmlSheet },
            { name: 'xl/styles.xml', data: styles },
        ];
        if (logoBytes?.length) {
            let cy = 950000;
            if (logoBytes.length >= 24 && logoBytes[0] === 137 && logoBytes[1] === 80) {
                const image = new DataView(logoBytes.buffer, logoBytes.byteOffset, logoBytes.byteLength);
                const w = image.getUint32(16, false);
                const h = image.getUint32(20, false);
                if (w && h) cy = Math.round(3000000 * h / w);
            }
            files.push(
                { name: 'xl/media/image1.png', data: logoBytes },
                { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/drawing" Target="../drawings/drawing1.xml"/></Relationships>` },
                { name: 'xl/drawings/_rels/drawing1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/image" Target="../media/image1.png"/></Relationships>` },
                { name: 'xl/drawings/drawing1.xml', data: `<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${rel}"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>120000</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>20000</xdr:rowOff></xdr:from><xdr:ext cx="3000000" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Logo Perumda Tirta Kencana"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>` },
            );
        }
        const types = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logoBytes?.length?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${logoBytes?.length?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':''}</Types>`;
        files.unshift({name:'[Content_Types].xml', data:types});
        return reportZip(files);
    }

    download.addEventListener('click', async () => {
        if (!ready()) return;
        download.disabled = true;
        try {
            let logoBytes = null;
            try {
                const response = await fetch(page.dataset.reportLogo, {credentials: 'same-origin'});
                if (response.ok) logoBytes = new Uint8Array(await response.arrayBuffer());
            } catch (error) {
                console.warn('Logo laporan tidak dimuat; Excel tetap dihasilkan.', error);
            }
            const workbook = buildXlsx(logoBytes);
            const url = URL.createObjectURL(workbook);
            const a = document.createElement('a');
            a.href = url;
            a.download = `KIB_E_Inventaris_${String(state.lokasi?.nama || 'Lokasi')
                .normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48)}_${month.value}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Gagal membuat Excel K.I.B E:', error);
            info.textContent = `Gagal membuat Excel: ${error.message}`;
        } finally {
            download.disabled = !ready();
        }
    });

    print.addEventListener('click', () => {
        if (!ready()) return;
        const w = window.open('', '_blank');
        if (!w) {
            info.textContent = 'Browser memblokir popup Print. Izinkan popup untuk situs ini.';
            return;
        }
        const cssUrl = escapeHtml(page.dataset.reportCss || '');
        w.document.open();
        w.document.write(`<!doctype html><html lang="id"><head><meta charset="UTF-8">
          <title>K.I.B E — Aset Tetap Lainnya</title><link rel="stylesheet" href="${cssUrl}">
          <style>@page { size:A3 landscape; margin:10mm; }
          html,body{margin:0;padding:0;background:#fff}
          .aem-report-paper{width:100%;max-width:none;min-width:0;box-shadow:none;border:0;padding:0}
          .aem-report-table-scroll{overflow:visible}
          .aem-report-table{font-size:8px}
          .aem-report-table thead{display:table-header-group}
          .aem-report-table tr{break-inside:avoid}
          .aem-report-signatures{break-inside:avoid}
          </style></head><body>${paperHtml()}</body></html>`);
        w.document.close();
        w.addEventListener('load', () => { w.focus(); w.print(); }, {once:true});
    });
});