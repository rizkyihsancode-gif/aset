
/*
|--------------------------------------------------------------------------
| K.I.B E — ASET TETAP LAINNYA
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
| Database:
| - kib_aset_tetap_manual
| - kib_aset_tetap_dokumens
|
| Fitur:
| - Tabel utama
| - Detail kelompok lokasi dan divisi
| - Daftar barang di panel kanan
| - Modal View foto dan informasi lengkap
| - Create, Edit, Delete
| - Searchable dropdown
| - Master Data sebagai saran pilihan
| - Upload multiple PDF / gambar
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('aemApp');

    if (!root || root.dataset.loaded === '1') return;

    root.dataset.loaded = '1';

    const $ = id => document.getElementById(id);

    const base = root.dataset.base.replace(/\/$/, '');
    const groupUrl = root.dataset.groupUrl;
    const token = root.dataset.token;

    const form = $('aemForm');

    const formDialog = $('aemFormDialog');
    const detailDialog = $('aemDetailDialog');
    const deleteDialog = $('aemDeleteDialog');

    const listPanel = $('aemListPanel');
    const groupPanel = $('aemGroupPanel');

    const normalize = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');

    const fields = [
        'nama_aset',
        'lokasi',
        'alamat',
        'departemen',
        'divisi',
        'kode_inventaris',
        'nomor_register',
        'bahan',
        'tahun',
        'jumlah_unit',
        'kondisi',
        'asal_perolehan',
        'keterangan'
    ];

    let current = null;
    let editId = null;
    let deleteId = null;

    let saving = false;
    let deleting = false;

    let addedFiles = [];

    let toastTimer = null;
    let groupController = null;
    let searchDelay = null;

    const combos = new Map();


    /* ======================================================
       DATA MASTER
    ====================================================== */

    function readJson(id, fallback) {
        try {
            const element = $(id);

            if (!element) return fallback;

            return JSON.parse(element.textContent) || fallback;
        } catch {
            return fallback;
        }
    }

    const master = readJson('aemMaster', {
        lokasi: [],
        departemen: [],
        divisi: [],
        bahan: []
    });

    const history = readJson('aemHistory', {});


    /* ======================================================
       DOM HELPER
    ====================================================== */

    function icons() {
        window.lucide?.createIcons?.();
    }

    function txt(tag, value) {
        const element = document.createElement(tag);

        element.textContent =
            value === null ||
            value === undefined ||
            value === ''
                ? '—'
                : String(value);

        return element;
    }

    function cell(row, content, className = '') {
        const td = document.createElement('td');

        if (
            typeof content === 'string' ||
            typeof content === 'number'
        ) {
            td.textContent = String(content);
        } else if (content) {
            td.append(content);
        }

        if (className) td.className = className;

        row.append(td);

        return td;
    }


    /* ======================================================
       MODAL
    ====================================================== */

    function show(dialog) {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        icons();
    }

    function hide(dialog) {
        if (dialog?.open) dialog.close();
    }

    document
        .querySelectorAll('[data-aem-close]')
        .forEach(button => {

            button.addEventListener('click', () => {
                hide($(button.dataset.aemClose));
            });

        });


    /* ======================================================
       TOAST DAN ERROR
    ====================================================== */

    function toast(message) {
        const element = $('aemToast');

        element.textContent = message;
        element.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.hidden = true;
        }, 4000);
    }

    function error(message) {
        const element = $('aemError');

        element.textContent = message || '';
        element.hidden = !message;

        if (message) {
            element.scrollIntoView({
                block: 'nearest'
            });
        }
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
                'Sesi login telah habis. Login kembali.'
            );
        }

        const data = await response
            .json()
            .catch(() => ({}));

        if (!response.ok || data.success === false) {
            const details = data.errors
                ? Object.values(data.errors).flat().join('\n')
                : '';

            let message = details ||
                data.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (response.status === 413) {
                message = 'Ukuran file melebihi batas server.';
            }

            if (response.status === 419) {
                message = 'Sesi login habis. Refresh halaman.';
            }

            throw new Error(message);
        }

        return data;
    }


    /* ======================================================
       JAM WITA
    ====================================================== */

    const dateFormat = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const timeFormat = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    function updateClock() {
        const now = new Date();

        const date = dateFormat.format(now);

        $('aemDate').textContent =
            date.charAt(0).toUpperCase() + date.slice(1);

        $('aemTime').textContent = timeFormat
            .format(now)
            .replace(/\./g, ':');
    }

    updateClock();

    setInterval(updateClock, 1000);


    /* ======================================================
       SEARCHABLE DROPDOWN
    ====================================================== */

    const predefined = {
        kondisi: [
            { value: 'BAIK', label: 'Baik' },
            { value: 'CUKUP', label: 'Cukup' },
            { value: 'RUSAK RINGAN', label: 'Rusak Ringan' },
            { value: 'RUSAK BERAT', label: 'Rusak Berat' }
        ],

        asal: [
            { value: 'PEMBELIAN', label: 'Pembelian' },
            { value: 'HIBAH', label: 'Hibah' },
            { value: 'BANTUAN', label: 'Bantuan' },
            { value: 'LAINNYA', label: 'Lainnya' }
        ]
    };

    function getOptions(source) {
        let list = [];

        if (source === 'lokasi') {
            list = (master.lokasi || []).map(row => ({
                value: row.lokasi,
                label: row.alamat || '',
                ref: row
            }));
        }

        if (source === 'departemen') {
            list = (master.departemen || []).map(row => ({
                value: row.nama_dep,
                label: '',
                ref: row
            }));
        }

        if (source === 'bahan') {
            list = (master.bahan || []).map(row => ({
                value: row.nama,
                label: '',
                ref: row
            }));
        }

        if (source === 'divisi') {
            const department = (master.departemen || [])
                .find(row =>
                    normalize(row.nama_dep) ===
                    normalize($('aemDep')?.value)
                );

            const available = department
                ? (master.divisi || []).filter(
                    row => String(row.id_dep) ===
                        String(department.id)
                )
                : (master.divisi || []);

            list = available.map(row => ({
                value: row.nama_div,
                label: '',
                ref: row
            }));

            if (!department) {
                list.push(
                    ...(history.divisi || []).map(value => ({
                        value,
                        label: ''
                    }))
                );
            }
        }

        if (source === 'asal') {
            list = [...predefined.asal];
        }

        if (source === 'kondisi') {
            list = [...predefined.kondisi];
        }

        const extras = {
            lokasi: history.lokasi || [],
            departemen: history.departemen || [],
            bahan: history.bahan || [],
            asal: history.asal_perolehan || []
        };

        for (const value of extras[source] || []) {
            list.push({
                value: String(value),
                label: ''
            });
        }

        const known = new Set();

        return list.filter(item => {
            const key = normalize(item.value);

            if (!key || known.has(key)) return false;

            known.add(key);

            return true;
        });
    }


    function initializeComboboxes() {
        if (!form) return;

        form
            .querySelectorAll('[data-aem-combo]')
            .forEach(input => {

                const source = input.dataset.aemCombo;

                const wrapper =
                    document.createElement('div');

                wrapper.className = 'aem-combo';

                input.parentNode.insertBefore(
                    wrapper,
                    input
                );

                wrapper.appendChild(input);

                const arrow =
                    document.createElement('button');

                arrow.type = 'button';
                arrow.className = 'aem-combo-arrow';
                arrow.textContent = '⌄';

                const panel =
                    document.createElement('div');

                panel.className = 'aem-combo-options';
                panel.id = input.id + '-list';
                panel.hidden = true;

                panel.setAttribute('role', 'listbox');

                input.setAttribute('role', 'combobox');
                input.setAttribute('aria-controls', panel.id);
                input.setAttribute('aria-expanded', 'false');
                input.setAttribute('aria-autocomplete', 'list');

                wrapper.append(arrow, panel);

                let shown = [];
                let active = -1;

                function close() {
                    panel.hidden = true;
                    wrapper.classList.remove('opened', 'up');

                    input.setAttribute(
                        'aria-expanded',
                        'false'
                    );

                    active = -1;
                }

                function choose(item) {
                    input.value = String(item.value);
                    input.setCustomValidity('');

                    if (
                        source === 'lokasi' &&
                        item.ref?.alamat &&
                        !$('aemAlamat').value.trim()
                    ) {
                        $('aemAlamat').value =
                            String(item.ref.alamat);
                    }

                    input.dispatchEvent(
                        new Event('change', { bubbles: true })
                    );

                    close();

                    input.focus({ preventScroll: true });
                }

                function render(showAll = false) {
                    combos.forEach((widget, id) => {
                        if (id !== input.id) widget.close();
                    });

                    const query = showAll
                        ? ''
                        : normalize(input.value);

                    shown = getOptions(source)
                        .filter(item =>
                            normalize(
                                `${item.value} ${item.label || ''}`
                            ).includes(query)
                        )
                        .slice(0, 150);

                    panel.replaceChildren();
                    active = -1;

                    if (!shown.length) {
                        const empty =
                            document.createElement('div');

                        empty.className = 'aem-combo-empty';

                        empty.textContent =
                            source === 'kondisi'
                                ? 'Pilih kondisi yang tersedia.'
                                : 'Tidak ditemukan. Kamu boleh mengetik nilai baru.';

                        panel.append(empty);
                    }

                    shown.forEach(item => {
                        const button =
                            document.createElement('button');

                        button.type = 'button';
                        button.className = 'aem-combo-item';

                        const label = txt('strong', item.value);

                        button.append(label);

                        if (item.label) {
                            button.append(
                                txt('small', item.label)
                            );
                        }

                        button.addEventListener(
                            'mousedown',
                            e => e.preventDefault()
                        );

                        button.addEventListener(
                            'click',
                            () => choose(item)
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
                        input.focus({ preventScroll: true });
                        render(true);
                    } else {
                        close();
                    }
                });

                input.addEventListener('keydown', e => {
                    if (e.key === 'Escape') {
                        if (!panel.hidden) {
                            e.preventDefault();
                            close();
                        }
                    }

                    if (
                        e.key === 'ArrowDown' ||
                        e.key === 'ArrowUp'
                    ) {
                        e.preventDefault();

                        if (panel.hidden) render(true);

                        if (shown.length) {
                            const step =
                                e.key === 'ArrowDown' ? 1 : -1;

                            active = (
                                active + step + shown.length
                            ) % shown.length;

                            panel
                                .querySelectorAll('.aem-combo-item')
                                .forEach((element, index) => {
                                    element.classList.toggle(
                                        'active',
                                        index === active
                                    );
                                });

                            panel.children[active]
                                ?.scrollIntoView({
                                    block: 'nearest'
                                });
                        }
                    }

                    if (
                        e.key === 'Enter' &&
                        !panel.hidden &&
                        active >= 0
                    ) {
                        e.preventDefault();
                        choose(shown[active]);
                    }

                    if (e.key === 'Tab') close();
                });

                combos.set(input.id, {
                    close,
                    render,
                    wrapper
                });
            });

        document.addEventListener('pointerdown', e => {
            combos.forEach(widget => {
                if (!widget.wrapper.contains(e.target)) {
                    widget.close();
                }
            });
        });

        $('aemDep')?.addEventListener('change', () => {
            $('aemDiv').value = '';
            combos.get('aemDiv')?.close();
        });
    }

    initializeComboboxes();


    /* ======================================================
       DOKUMEN DAN LAMPIRAN
    ====================================================== */

    function resetDocs() {
        addedFiles = [];

        $('aemDocsInput').value = '';

        $('aemSelectedDocs').replaceChildren();
        $('aemSavedDocs').replaceChildren();
    }

    function renderNewDocs() {
        const container = $('aemSelectedDocs');

        container.replaceChildren();

        if (!addedFiles.length) return;

        container.append(
            txt('strong', `${addedFiles.length} lampiran baru`)
        );

        addedFiles.forEach((file, index) => {
            const row = document.createElement('div');

            row.className = 'aem-file-row';

            const label = txt(
                'span',
                `${file.name} (${(file.size / 1048576).toFixed(2)} MB)`
            );

            const remove = document.createElement('button');

            remove.type = 'button';
            remove.className = 'aem-link';
            remove.textContent = 'Batalkan';

            remove.addEventListener('click', () => {
                addedFiles.splice(index, 1);
                renderNewDocs();
            });

            row.append(label, remove);
            container.append(row);
        });
    }

    $('aemDocsInput')?.addEventListener('change', e => {
        for (const file of Array.from(e.target.files || [])) {
            if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
                toast(`${file.name}: format tidak didukung.`);
                continue;
            }

            const duplicate = addedFiles.some(old =>
                old.name === file.name &&
                old.size === file.size &&
                old.lastModified === file.lastModified
            );

            if (!duplicate) addedFiles.push(file);
        }

        e.target.value = '';

        renderNewDocs();
    });

    function renderSavedDocs(documents) {
        const container = $('aemSavedDocs');

        container.replaceChildren();

        if (!documents?.length) return;

        container.append(
            txt('strong', 'Lampiran yang sudah tersimpan:')
        );

        documents.forEach(doc => {
            const row = document.createElement('div');

            row.className = 'aem-file-row';

            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = doc.nama;

            const label = document.createElement('label');

            label.className = 'aem-file-remove';

            const checkbox = document.createElement('input');

            checkbox.type = 'checkbox';
            checkbox.name = 'hapus_dokumen_ids[]';
            checkbox.value = String(doc.id);

            label.append(
                checkbox,
                document.createTextNode(' Hapus saat simpan')
            );

            row.append(link, label);
            container.append(row);
        });
    }


    /* ======================================================
       FORM TAMBAH / EDIT
    ====================================================== */

    function addForm() {
        editId = null;
        current = null;
        saving = false;

        form.reset();
        resetDocs();
        error('');

        form.elements.namedItem('tahun').value =
            new Date().getFullYear();

        form.elements.namedItem('jumlah_unit').value = 1;

        $('aemFormTitle').textContent =
            'Tambah Aset Tetap Lainnya';

        $('aemSave').disabled = false;
        $('aemSave').textContent = 'Simpan Aset';

        combos.forEach(widget => widget.close());

        show(formDialog);
    }

    function editForm(item) {
        editId = Number(item.id);
        current = item;
        saving = false;

        form.reset();
        resetDocs();
        error('');

        fields.forEach(field => {
            const input = form.elements.namedItem(field);

            if (input) {
                input.value = item[field] ?? '';
            }
        });

        renderSavedDocs(item.dokumens || []);

        $('aemFormTitle').textContent =
            'Edit Aset Tetap Lainnya';

        $('aemSave').disabled = false;
        $('aemSave').textContent = 'Simpan Perubahan';

        combos.forEach(widget => widget.close());

        show(formDialog);
    }

    $('aemAdd')?.addEventListener('click', addForm);


    /* ======================================================
       VIEW BARANG — FOTO BESAR DI ATAS
    ====================================================== */

    function makePhotoPlaceholder() {
        const box = document.createElement('div');

        box.className = 'aem-photo-placeholder';

        const imageIcon = document.createElement('i');

        imageIcon.setAttribute('data-lucide', 'image-off');

        box.append(
            imageIcon,
            txt('span', 'Foto aset belum tersedia')
        );

        return box;
    }

    function detail(item) {
        current = item;

        const body = $('aemDetailBody');

        body.replaceChildren();

        $('aemDetailTitle').textContent =
            item.nama_aset || 'Detail Inventaris';

        // Foto utama.
        if (item.foto_url) {
            const photo = document.createElement('img');

            photo.src = item.foto_url;
            photo.alt = 'Foto ' + (item.nama_aset || 'aset');
            photo.className = 'aem-photo-large';

            photo.onerror = () => {
                photo.replaceWith(makePhotoPlaceholder());
                icons();
            };

            body.append(photo);
        } else {
            body.append(makePhotoPlaceholder());
        }

        const caption = txt(
            'div',
            item.nama_aset || 'Inventaris K.I.B E'
        );

        caption.className = 'aem-detail-caption';

        body.append(caption);

        // Informasi lengkap.
        const grid = document.createElement('div');

        grid.className = 'aem-detail-grid';

        const details = [
            ['Kode Inventaris (Manual)', item.kode_inventaris],
            ['Nama Aset', item.nama_aset],
            ['Nomor Register', item.nomor_register],
            ['Jumlah Unit', item.jumlah_unit],
            ['Kondisi', item.kondisi],
            ['Bahan', item.bahan],
            ['Tahun Pengadaan', item.tahun],
            ['Asal Perolehan', item.asal_perolehan],
            ['Lokasi', item.lokasi],
            ['Alamat', item.alamat],
            ['Departemen', item.departemen],
            ['Divisi', item.divisi]
        ];

        for (const [label, value] of details) {
            const box = document.createElement('div');

            box.append(
                txt('small', label),
                txt('strong', value)
            );

            grid.append(box);
        }

        body.append(
            grid,
            txt('h3', 'Keterangan'),
            txt('p', item.keterangan)
        );

        body.append(
            txt('h3', 'Dokumen Pendukung')
        );

        const documents = document.createElement('div');

        documents.className = 'aem-doc-links';

        if (!item.dokumens?.length) {
            documents.append(
                txt('p', 'Belum ada lampiran.')
            );
        }

        for (const doc of item.dokumens || []) {
            const link = document.createElement('a');

            link.href = doc.url;
            link.textContent = doc.nama || 'Dokumen';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'aem-btn outline';

            documents.append(link);
        }

        body.append(documents);

        show(detailDialog);
    }

    async function fetchItem(id) {
        const response = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!response.data) {
            throw new Error('Data aset tidak ditemukan.');
        }

        return response.data;
    }


    /* ======================================================
       DETAIL KELOMPOK
    ====================================================== */

    const groupState = {
        lokasi: '',
        divisi: '',
        q: '',
        page: 1,
        groups: [],
        selected: null,
        pagination: null
    };

    function groupKey(lokasi, divisi) {
        return JSON.stringify([lokasi, divisi]);
    }

    function groupMessage(message) {
        const element = $('aemGroupAlert');

        if (!element) return;

        element.textContent = message || '';
        element.hidden = !message;
    }

    function openGroup(lokasi, divisi) {
        if (!groupPanel || !groupUrl) return;

        groupState.lokasi =
            String(lokasi || '').trim() || 'Tanpa Lokasi';

        groupState.divisi =
            String(divisi || '').trim() || 'Tanpa Divisi';

        groupState.q = '';
        groupState.page = 1;

        $('aemGroupItemSearch').value = '';
        $('aemGroupSearch').value = '';

        listPanel.hidden = true;
        groupPanel.hidden = false;

        groupPanel.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        loadGroup();
    }


    /* ======================================================
       PANEL KIRI — LOKASI DAN DIVISI
    ====================================================== */

    function renderGroups() {
        const container = $('aemGroupList');

        if (!container) return;

        container.replaceChildren();

        const query = normalize(
            $('aemGroupSearch').value
        );

        const groups = groupState.groups.filter(group =>
            normalize(
                `${group.lokasi} ${group.divisi}`
            ).includes(query)
        );

        if (!groups.length) {
            container.append(
                txt('div', 'Tidak ada kelompok yang cocok.')
            );

            return;
        }

        const locations = new Map();

        for (const group of groups) {
            if (!locations.has(group.lokasi)) {
                locations.set(group.lokasi, []);
            }

            locations.get(group.lokasi).push(group);
        }

        for (const [location, children] of locations) {
            const section = document.createElement('div');

            section.className = 'aem-group-location';

            const title = document.createElement('div');

            title.className = 'aem-group-location-title';

            const icon = document.createElement('i');

            icon.setAttribute('data-lucide', 'folder');

            title.append(
                icon,
                txt('span', location)
            );

            section.append(title);

            for (const group of children) {
                const button = document.createElement('button');

                button.type = 'button';
                button.className = 'aem-group-select';

                const chosen =
                    groupState.selected &&
                    groupKey(
                        groupState.selected.lokasi,
                        groupState.selected.divisi
                    ) === groupKey(
                        group.lokasi,
                        group.divisi
                    );

                if (chosen) {
                    button.classList.add('active');
                }

                button.setAttribute(
                    'aria-pressed',
                    String(Boolean(chosen))
                );

                button.append(
                    txt('span', group.divisi),
                    txt('span', group.jumlah)
                );

                button.addEventListener('click', () => {
                    groupState.lokasi = group.lokasi;
                    groupState.divisi = group.divisi;
                    groupState.page = 1;
                    groupState.q = '';

                    $('aemGroupItemSearch').value = '';

                    loadGroup();
                });

                section.append(button);
            }

            container.append(section);
        }

        icons();
    }


    /* ======================================================
       PANEL KANAN — TABEL BARANG
    ====================================================== */

    function renderGroupRows(items) {
        const body = $('aemGroupRows');

        if (!body) return;

        body.replaceChildren();

        if (!items.length) {
            const row = document.createElement('tr');

            cell(
                row,
                'Tidak ada aset dalam kelompok ini.',
                'aem-empty'
            ).colSpan = 6;

            body.append(row);
            return;
        }

        const first = Number(
            groupState.pagination?.from || 1
        );

        items.forEach((item, index) => {
            const row = document.createElement('tr');

            cell(row, first + index, 'aem-center');

            cell(
                row,
                txt('strong', item.nama_aset || '—')
            );

            cell(
                row,
                item.kode_inventaris || '—'
            );

            cell(
                row,
                item.nomor_register || '—'
            );

            // Thumbnail foto.
            const photoBox = document.createElement('div');

            if (item.foto_url) {
                const image = document.createElement('img');

                image.className = 'aem-group-thumb';
                image.src = item.foto_url;
                image.alt = 'Foto ' + item.nama_aset;

                image.onerror = () => {
                    const empty = txt('div', 'Tanpa foto');

                    empty.className = 'aem-group-no-photo';

                    image.replaceWith(empty);
                };

                photoBox.append(image);
            } else {
                const empty = txt('div', 'Tanpa foto');

                empty.className = 'aem-group-no-photo';

                photoBox.append(empty);
            }

            cell(row, photoBox, 'aem-center');

            // Tombol View per barang.
            const view = document.createElement('button');

            view.type = 'button';
            view.className = 'aem-action view';
            view.title = 'View Barang';

            view.dataset.aemAction = 'view';
            view.dataset.id = String(item.id);

            view.setAttribute(
                'aria-label',
                'View ' + item.nama_aset
            );

            const icon = document.createElement('i');

            icon.setAttribute('data-lucide', 'eye');

            view.append(icon);

            cell(row, view, 'aem-center');

            body.append(row);
        });

        icons();
    }


    /* ======================================================
       LOAD DETAIL KELOMPOK KE CONTROLLER
    ====================================================== */

    async function loadGroup() {
        if (!groupPanel || !groupUrl) return;

        if (groupController) {
            groupController.abort();
        }

        groupController = new AbortController();

        groupMessage('');

        const body = $('aemGroupRows');

        const loader = document.createElement('tr');

        cell(
            loader,
            'Memuat daftar aset...',
            'aem-group-spinner'
        ).colSpan = 6;

        body.replaceChildren(loader);

        const params = new URLSearchParams({
            lokasi: groupState.lokasi,
            divisi: groupState.divisi,
            q: groupState.q,
            page: String(groupState.page)
        });

        try {
            const result = await api(
                `${groupUrl}?${params}`,
                {
                    signal: groupController.signal
                }
            );

            groupState.groups = result.groups || [];
            groupState.selected = result.selected;
            groupState.pagination = result.pagination;

            if (result.selected) {
                groupState.lokasi = result.selected.lokasi;
                groupState.divisi = result.selected.divisi;

                $('aemGroupTitle').textContent =
                    result.selected.divisi;

                $('aemGroupSubtitle').textContent =
                    'Lokasi: ' + result.selected.lokasi;
            } else {
                $('aemGroupTitle').textContent =
                    'Belum Ada Kelompok Aset';

                $('aemGroupSubtitle').textContent =
                    'Tambahkan catatan inventaris terlebih dahulu.';
            }

            $('aemGroupCount').textContent =
                `${result.pagination?.total || 0} barang`;

            $('aemGroupInfo').textContent =
                `${result.pagination?.from || 0}–${result.pagination?.to || 0} dari ${result.pagination?.total || 0} data`;

            $('aemGroupPage').textContent =
                `${result.pagination?.page || 1} / ${result.pagination?.last_page || 1}`;

            $('aemGroupPrev').disabled =
                (result.pagination?.page || 1) <= 1;

            $('aemGroupNext').disabled =
                (result.pagination?.page || 1) >=
                (result.pagination?.last_page || 1);

            renderGroups();

            renderGroupRows(result.items || []);
        } catch (exception) {
            if (exception.name === 'AbortError') return;

            groupMessage(exception.message);

            body.replaceChildren();
        }
    }


    /* ======================================================
       KONTROL NAVIGASI KELOMPOK
    ====================================================== */

    $('aemBack')?.addEventListener('click', () => {
        groupController?.abort();

        groupPanel.hidden = true;
        listPanel.hidden = false;

        listPanel.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });

    $('aemGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );

    $('aemGroupItemSearch')?.addEventListener(
        'input',
        event => {
            clearTimeout(searchDelay);

            searchDelay = setTimeout(() => {
                groupState.q = event.target.value.trim();
                groupState.page = 1;

                loadGroup();
            }, 300);
        }
    );

    $('aemGroupRefresh')?.addEventListener('click', () => {
        clearTimeout(searchDelay);

        groupState.q = '';
        groupState.page = 1;

        $('aemGroupItemSearch').value = '';

        loadGroup();
    });

    $('aemGroupPrev')?.addEventListener('click', () => {
        if (groupState.page > 1) {
            groupState.page--;
            loadGroup();
        }
    });

    $('aemGroupNext')?.addEventListener('click', () => {
        const lastPage =
            groupState.pagination?.last_page || 1;

        if (groupState.page < lastPage) {
            groupState.page++;
            loadGroup();
        }
    });


    /* ======================================================
       AKSI TABEL UTAMA DAN PANEL KANAN
    ====================================================== */

    root.addEventListener('click', async event => {
        if (!(event.target instanceof Element)) return;

        const button = event.target.closest(
            'button[data-aem-action]'
        );

        if (
            !button ||
            !root.contains(button) ||
            button.disabled
        ) {
            return;
        }

        const action = button.dataset.aemAction;
        const id = button.dataset.id;

        if (!/^\d+$/.test(String(id))) return;

        // Detail kelompok dari tabel utama.
        if (action === 'group') {
            openGroup(
                button.dataset.location,
                button.dataset.division
            );

            return;
        }

        // Delete dari tabel utama.
        if (action === 'delete') {
            confirmDelete(id, button.dataset.name);
            return;
        }

        if (!['view', 'edit'].includes(action)) return;

        button.disabled = true;

        try {
            const item = await fetchItem(id);

            if (action === 'edit') {
                editForm(item);
            } else {
                detail(item);
            }
        } catch (exception) {
            toast(exception.message);
        } finally {
            button.disabled = false;
        }
    });


    /* ======================================================
       EDIT / DELETE DARI MODAL VIEW
    ====================================================== */

    $('aemEditDetail')?.addEventListener('click', () => {
        if (!current) return;

        const item = current;

        hide(detailDialog);
        editForm(item);
    });

    function confirmDelete(id, name) {
        deleteId = Number(id);

        $('aemDeleteName').textContent =
            name || `Aset #${id}`;

        hide(detailDialog);

        show(deleteDialog);
    }

    $('aemDeleteDetail')?.addEventListener('click', () => {
        if (current) {
            confirmDelete(current.id, current.nama_aset);
        }
    });


    /* ======================================================
       DELETE DATABASE
    ====================================================== */

    $('aemConfirmDelete')?.addEventListener(
        'click',
        async () => {
            if (!deleteId || deleting) return;

            deleting = true;

            const button = $('aemConfirmDelete');

            button.disabled = true;

            try {
                await api(
                    `${base}/${deleteId}`,
                    {
                        method: 'DELETE'
                    }
                );

                window.location.assign(base);
            } catch (exception) {
                toast(exception.message);

                deleting = false;
                button.disabled = false;
            }
        }
    );

    deleteDialog?.addEventListener('close', () => {
        if (!deleting) deleteId = null;
    });


    /* ======================================================
       CREATE / UPDATE DATABASE
    ====================================================== */

    form?.addEventListener('submit', async event => {
        event.preventDefault();

        if (saving) return;

        error('');

        const condition = $('aemKondisi');

        condition.value = String(condition.value)
            .trim()
            .toUpperCase();

        const validConditions = [
            'BAIK',
            'CUKUP',
            'RUSAK RINGAN',
            'RUSAK BERAT'
        ];

        condition.setCustomValidity(
            validConditions.includes(condition.value)
                ? ''
                : 'Pilih kondisi yang tersedia.'
        );

        if (!form.reportValidity()) return;

        saving = true;

        const save = $('aemSave');

        save.disabled = true;

        const data = new FormData(form);

        // File yang dipilih berulang kali.
        data.delete('dokumens[]');

        for (const file of addedFiles) {
            data.append(
                'dokumens[]',
                file,
                file.name
            );
        }

        if (editId !== null) {
            data.set('_method', 'PUT');
        }

        const url = editId !== null
            ? `${base}/${encodeURIComponent(editId)}`
            : base;

        try {
            await api(url, {
                method: 'POST',
                body: data
            });

            window.location.assign(base);
        } catch (exception) {
            error(exception.message);

            saving = false;
            save.disabled = false;
        }
    });


    /* ======================================================
       SELESAI
    ====================================================== */

    icons();

})();
