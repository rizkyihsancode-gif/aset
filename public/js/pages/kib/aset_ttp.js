
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
        'keterangan'
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
                                type === 'kondisi'
                                    ? 'Pilih kondisi yang tersedia.'
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

        /* TABEL EXCEL 10 KOLOM */

        const scroll = elem(
            'div',
            'aem-kib-table-scroll'
        );

        const table = elem(
            'table',
            'aem-kib-table'
        );

        const cols = elem('colgroup');

        for (let i = 0; i < 10; i++) {
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

        th(h2, 'Kode Barang');
        th(h2, 'Register');

        for (let i = 1; i <= 10; i++) {
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

            showValue(item.keterangan)
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
        pagination: null
    };

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

        const q = norm(
            $('aemGroupSearch')?.value
        );

        const entries = gs.groups.filter(g =>
            norm(
                `${g.lokasi} ${g.divisi}`
            ).includes(q)
        );

        if (!entries.length) {
            container.append(
                elem(
                    'div',
                    'aem-empty',
                    'Tidak ada kelompok yang sesuai.'
                )
            );

            return;
        }

        const locations = new Map();

        entries.forEach(group => {
            if (!locations.has(group.lokasi)) {
                locations.set(
                    group.lokasi,
                    []
                );
            }

            locations
                .get(group.lokasi)
                .push(group);
        });

        locations.forEach((groups, location) => {
            const section = elem(
                'div',
                'aem-group-location'
            );

            const title = elem(
                'div',
                'aem-group-location-title'
            );

            const folder = elem('i');

            folder.setAttribute(
                'data-lucide',
                'folder'
            );

            title.append(
                folder,
                elem('span', '', location)
            );

            section.append(title);

            groups.forEach(g => {
                const button = elem(
                    'button',
                    'aem-group-select'
                );

                button.type = 'button';

                const chosen =
                    gs.selected &&
                    gs.selected.lokasi === g.lokasi &&
                    gs.selected.divisi === g.divisi;

                if (chosen) {
                    button.classList.add('active');
                }

                button.setAttribute(
                    'aria-pressed',
                    String(Boolean(chosen))
                );

                button.append(
                    elem(
                        'span',
                        '',
                        g.divisi
                    ),

                    elem(
                        'span',
                        '',
                        g.jumlah
                    )
                );

                button.addEventListener('click', () => {
                    gs.lokasi = g.lokasi;
                    gs.divisi = g.divisi;
                    gs.page = 1;
                    gs.q = '';

                    $('aemGroupItemSearch').value = '';

                    loadGroup();
                });

                section.append(button);
            });

            container.append(section);
        });

        icons();
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
       PANEL KANAN — 11 KOLOM SESUAI EXCEL
    ====================================================== */

    function renderGroupRows(items) {
        const tbody = $('aemGroupRows');

        if (!tbody) return;

        tbody.replaceChildren();

        if (!items.length) {
            const tr = elem('tr');

            cell(
                tr,
                'Tidak ada barang pada kelompok ini.',
                'aem-empty'
            ).colSpan = 11;

            tbody.append(tr);

            return;
        }

        const start = Number(
            gs.pagination?.from ?? 1
        );

        items.forEach((item, index) => {
            const tr = elem('tr');

            const condition =
                conditions[
                    String(item.kondisi ?? '')
                        .trim()
                        .toUpperCase()
                ] || showValue(item.kondisi);

            /*
             * KOLOM 1–10
             * URUTAN WAJIB SAMA DENGAN EXCEL
             */

            const values = [
                // 1. No.
                start + index,

                // 2. Nama Barang
                showValue(item.nama_aset),

                // 3. Kode Barang
                showValue(item.kode_inventaris),

                // 4. Register
                showValue(item.nomor_register),

                // 5. Kondisi Barang
                condition,

                // 6. Bahan
                showValue(item.bahan),

                // 7. Tahun
                showValue(item.tahun),

                // 8. Jumlah
                item.jumlah_unit == null
                    ? '—'
                    : `${Number(item.jumlah_unit)
                        .toLocaleString('id-ID')} buah`,

                // 9. Asal Perolehan
                showValue(item.asal_perolehan),

                // 10. Keterangan
                showValue(item.keterangan)
            ];

            values.forEach((value, i) => {
                const centered =
                    [0, 6, 7].includes(i);

                cell(
                    tr,
                    value,
                    centered
                        ? 'aem-center'
                        : i === 9
                            ? 'aem-kib-notes'
                            : ''
                );
            });

            /*
             * KOLOM 11 — TOMBOL VIEW
             * Tidak ada kolom foto tambahan.
             */

            const button = elem(
                'button',
                'aem-icon view'
            );

            button.type = 'button';

            button.title =
                'Lihat Detail KIB E';

            button.dataset.aemAction = 'view';
            button.dataset.id = String(item.id);

            button.setAttribute(
                'aria-label',
                `Lihat detail ${showValue(item.nama_aset)}`
            );

            const eye = elem('i');

            eye.setAttribute(
                'data-lucide',
                'eye'
            );

            button.append(eye);

            cell(
                tr,
                button,
                'aem-center'
            );

            tbody.append(tr);
        });

        icons();
    }

    /* ======================================================
       LOAD KELOMPOK DARI LARAVEL
    ====================================================== */

    async function loadGroup() {
        if (!groupDialog || !groupUrl) return;

        groupRequest?.abort();

        const controller = new AbortController();

        groupRequest = controller;

        groupError('');

        const tbody = $('aemGroupRows');

        const loading = elem('tr');

        cell(
            loading,
            'Memuat data barang...',
            'aem-empty'
        ).colSpan = 11;

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
            gs.pagination = result.pagination || {};

            if (gs.selected) {
                gs.lokasi = gs.selected.lokasi;
                gs.divisi = gs.selected.divisi;

                $('aemGroupTitle').textContent =
                    gs.selected.divisi;

                $('aemGroupSubtitle').textContent =
                    `Lokasi: ${gs.selected.lokasi}`;
            } else {
                $('aemGroupTitle').textContent =
                    'Belum ada kelompok aset';

                $('aemGroupSubtitle').textContent =
                    'Tambahkan data manual terlebih dahulu.';
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

            renderGroupRows(
                asArray(result.items)
            );

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
