
/*
|--------------------------------------------------------------------------
| K.I.B E — ASET TETAP LAINNYA
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| Fitur:
| 1. Tabel utama Aset Tetap Lainnya
| 2. Popup Detail Kelompok
| 3. Panel lokasi dan divisi
| 4. Panel daftar barang
| 5. Popup View barang dengan foto utama
| 6. Create / Edit / Delete
| 7. Searchable dropdown Master Data
| 8. Upload banyak PDF dan gambar
| 9. Arsip lama tetap read-only
|
| Database:
| - kib_aset_tetap_manual
| - kib_aset_tetap_dokumens
|
| Tidak memiliki relasi wajib ke Kode Aktiva.
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('aemApp');

    if (!root || root.dataset.loaded === '1') return;

    root.dataset.loaded = '1';

    const $ = id => document.getElementById(id);

    const base = (root.dataset.base || '').replace(/\/$/, '');
    const groupUrl = root.dataset.groupUrl;
    const token = root.dataset.token;

    const form = $('aemForm');

    const groupDialog = $('aemGroupPanel');
    const detailDialog = $('aemDetailDialog');
    const formDialog = $('aemFormDialog');
    const deleteDialog = $('aemDeleteDialog');

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

    const combos = new Map();

    const normalize = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');


    /* ======================================================
       BACA DATA MASTER DARI BLADE
    ====================================================== */

    function readJson(id, fallback) {
        try {
            const element = $(id);

            if (!element) return fallback;

            return JSON.parse(element.textContent) || fallback;
        } catch (exception) {
            console.warn(
                'Data JSON tidak dapat dibaca:',
                id,
                exception
            );

            return fallback;
        }
    }

    const master = readJson('aemMaster', {});
    const history = readJson('aemHistory', {});

    const list = value =>
        Array.isArray(value) ? value : [];


    /* ======================================================
       ICON DAN DOM HELPER
    ====================================================== */

    function refreshIcons() {
        window.lucide?.createIcons?.();
    }

    function textElement(tag, value, className = '') {
        const element = document.createElement(tag);

        element.textContent =
            value === null ||
            value === undefined ||
            value === ''
                ? '—'
                : String(value);

        if (className) {
            element.className = className;
        }

        return element;
    }

    function addCell(row, content, className = '') {
        const cell = document.createElement('td');

        if (
            typeof content === 'string' ||
            typeof content === 'number'
        ) {
            cell.textContent = String(content);
        } else if (content) {
            cell.appendChild(content);
        }

        if (className) {
            cell.className = className;
        }

        row.appendChild(cell);

        return cell;
    }


    /* ======================================================
       HELPER MODAL
    ====================================================== */

    function showDialog(dialog) {
        if (!dialog || dialog.open) return;

        dialog.showModal();
        refreshIcons();
    }

    function hideDialog(dialog) {
        if (dialog?.open) {
            dialog.close();
        }
    }

    document
        .querySelectorAll('[data-aem-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                hideDialog($(button.dataset.aemClose));
            });
        });


    /* ======================================================
       TOAST
    ====================================================== */

    function toast(message) {
        const element = $('aemToast');

        if (!element) return;

        element.textContent = message;
        element.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.hidden = true;
        }, 4000);
    }


    /* ======================================================
       ERROR VALIDASI
    ====================================================== */

    function showError(message) {
        const element = $('aemError');

        if (!element) return;

        element.textContent = message || '';
        element.hidden = !message;

        if (message) {
            element.scrollIntoView({
                block: 'nearest'
            });
        }
    }


    /* ======================================================
       REQUEST KE LARAVEL
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

        const data = await response
            .json()
            .catch(() => ({}));

        if (!response.ok || data.success === false) {
            const errors = data.errors
                ? Object.values(data.errors)
                    .flat()
                    .join('\n')
                : '';

            let message = errors ||
                data.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (response.status === 413) {
                message =
                    'Ukuran lampiran melebihi batas server.';
            }

            if (response.status === 419) {
                message =
                    'Sesi login telah habis. Refresh halaman.';
            }

            if (response.status === 403) {
                message =
                    'Akun tidak memiliki izin untuk tindakan ini.';
            }

            if (response.status === 404) {
                message =
                    'Data atau halaman tidak ditemukan.';
            }

            throw new Error(message);
        }

        return data;
    }


    /* ======================================================
       TANGGAL DAN JAM WITA
    ====================================================== */

    function initializeClock() {
        const dateElement = $('aemDate');
        const timeElement = $('aemTime');

        if (!dateElement || !timeElement) return;

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

            dateElement.textContent =
                date.charAt(0).toUpperCase() +
                date.slice(1);

            timeElement.textContent = timeFormatter
                .format(now)
                .replace(/\./g, ':');
        }

        update();

        setInterval(update, 1000);
    }


    /* ======================================================
       PILIHAN DROPDOWN
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
        let options = [];

        if (source === 'lokasi') {
            options = list(master.lokasi)
                .filter(row => row.lokasi)
                .map(row => ({
                    value: row.lokasi,
                    label: row.alamat || '',
                    ref: row
                }));
        }

        if (source === 'departemen') {
            options = list(master.departemen)
                .filter(row => row.nama_dep)
                .map(row => ({
                    value: row.nama_dep,
                    label: '',
                    ref: row
                }));
        }

        if (source === 'bahan') {
            options = list(master.bahan)
                .map(row => ({
                    value: row.nama || row.nama_bahan,
                    label: '',
                    ref: row
                }))
                .filter(row => row.value);
        }

        if (source === 'divisi') {
            const departmentName = normalize(
                $('aemDep')?.value
            );

            const department = list(master.departemen)
                .find(row =>
                    normalize(row.nama_dep) === departmentName
                );

            const available = department
                ? list(master.divisi).filter(
                    row => String(row.id_dep) ===
                        String(department.id)
                )
                : list(master.divisi);

            options = available
                .filter(row => row.nama_div)
                .map(row => ({
                    value: row.nama_div,
                    label: '',
                    ref: row
                }));

            if (!department) {
                options.push(
                    ...list(history.divisi).map(value => ({
                        value,
                        label: ''
                    }))
                );
            }
        }

        if (source === 'asal') {
            options = [...predefined.asal];
        }

        if (source === 'kondisi') {
            options = [...predefined.kondisi];
        }

        const histories = {
            lokasi: history.lokasi,
            departemen: history.departemen,
            bahan: history.bahan,
            asal: history.asal_perolehan
        };

        for (const value of list(histories[source])) {
            options.push({
                value: String(value),
                label: ''
            });
        }

        const used = new Set();

        return options.filter(option => {
            const key = normalize(option.value);

            if (!key || used.has(key)) {
                return false;
            }

            used.add(key);
            return true;
        });
    }


    /* ======================================================
       SEARCHABLE DROPDOWN CUSTOM
    ====================================================== */

    function initializeComboboxes() {
        if (!form) return;

        form.querySelectorAll('[data-aem-combo]')
            .forEach(input => {
                const source = input.dataset.aemCombo;

                if (input.dataset.initialized === '1') {
                    return;
                }

                input.dataset.initialized = '1';
                input.autocomplete = 'off';

                const wrapper = document.createElement('div');
                wrapper.className = 'aem-combo';

                input.parentNode.insertBefore(
                    wrapper,
                    input
                );

                wrapper.appendChild(input);

                const arrow = document.createElement('button');

                arrow.type = 'button';
                arrow.className = 'aem-combo-arrow';
                arrow.textContent = '⌄';

                arrow.setAttribute(
                    'aria-label',
                    'Tampilkan pilihan'
                );

                const panel = document.createElement('div');

                panel.id = `${input.id}-list`;
                panel.className = 'aem-combo-options';
                panel.hidden = true;

                panel.setAttribute('role', 'listbox');

                input.setAttribute('role', 'combobox');
                input.setAttribute(
                    'aria-autocomplete',
                    'list'
                );

                input.setAttribute(
                    'aria-controls',
                    panel.id
                );

                input.setAttribute(
                    'aria-expanded',
                    'false'
                );

                wrapper.append(arrow, panel);

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

                    input.removeAttribute(
                        'aria-activedescendant'
                    );

                    activeIndex = -1;
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
                            '.aem-combo-item'
                        )
                    );

                    if (!buttons.length) return;

                    activeIndex = (
                        index + buttons.length
                    ) % buttons.length;

                    buttons.forEach((button, i) => {
                        const selected = i === activeIndex;

                        button.classList.toggle(
                            'active',
                            selected
                        );

                        button.setAttribute(
                            'aria-selected',
                            String(selected)
                        );

                        if (selected) {
                            input.setAttribute(
                                'aria-activedescendant',
                                button.id
                            );

                            button.scrollIntoView({
                                block: 'nearest'
                            });
                        }
                    });
                }


                function render(showAll = false) {
                    combos.forEach((widget, id) => {
                        if (id !== input.id) {
                            widget.close();
                        }
                    });

                    const query = showAll
                        ? ''
                        : normalize(input.value);

                    shown = getOptions(source)
                        .filter(item => {
                            return normalize(
                                `${item.value} ${item.label || ''}`
                            ).includes(query);
                        })
                        .slice(0, 150);

                    panel.replaceChildren();
                    activeIndex = -1;

                    if (!shown.length) {
                        const empty =
                            document.createElement('div');

                        empty.className = 'aem-combo-empty';

                        empty.textContent =
                            source === 'kondisi'
                                ? 'Pilih kondisi yang tersedia.'
                                : 'Data tidak ditemukan. Kamu boleh mengetik nilai baru.';

                        panel.appendChild(empty);
                    }

                    shown.forEach((item, index) => {
                        const button =
                            document.createElement('button');

                        button.type = 'button';
                        button.id =
                            `${panel.id}-item-${index}`;

                        button.className = 'aem-combo-item';

                        button.setAttribute('role', 'option');

                        button.appendChild(
                            textElement('strong', item.value)
                        );

                        if (item.label) {
                            button.appendChild(
                                textElement('small', item.label)
                            );
                        }

                        button.addEventListener(
                            'mousedown',
                            event => event.preventDefault()
                        );

                        button.addEventListener('click', () => {
                            choose(item);
                        });

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
                        window.innerHeight -
                            rect.bottom < 190 &&
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
                    event => event.preventDefault()
                );

                arrow.addEventListener('click', () => {
                    if (!panel.hidden) {
                        close();
                        return;
                    }

                    input.focus({
                        preventScroll: true
                    });

                    render(true);
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

                        if (panel.hidden) {
                            render(true);
                        }

                        if (shown.length) {
                            const direction =
                                event.key === 'ArrowDown'
                                    ? 1
                                    : -1;

                            highlight(
                                activeIndex + direction
                            );
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


                combos.set(input.id, {
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


        $('aemDep')?.addEventListener('change', () => {
            if ($('aemDiv').value) {
                $('aemDiv').value = '';
            }

            combos.get('aemDiv')?.close();
        });
    }


    /* ======================================================
       FILE DOKUMEN
    ====================================================== */

    function resetDocuments() {
        addedFiles = [];

        const input = $('aemDocsInput');

        if (input) input.value = '';

        $('aemSelectedDocs')?.replaceChildren();
        $('aemSavedDocs')?.replaceChildren();
    }


    function renderNewDocuments() {
        const container = $('aemSelectedDocs');

        if (!container) return;

        container.replaceChildren();

        if (!addedFiles.length) return;

        container.appendChild(
            textElement(
                'strong',
                `${addedFiles.length} lampiran baru`
            )
        );

        addedFiles.forEach((file, index) => {
            const row = document.createElement('div');
            row.className = 'aem-file-row';

            const label = textElement(
                'span',
                `${file.name} (${(file.size / 1048576).toFixed(2)} MB)`
            );

            const remove = document.createElement('button');

            remove.type = 'button';
            remove.className = 'aem-link';
            remove.textContent = 'Batalkan';

            remove.addEventListener('click', () => {
                addedFiles.splice(index, 1);
                renderNewDocuments();
            });

            row.append(label, remove);
            container.appendChild(row);
        });
    }


    $('aemDocsInput')?.addEventListener('change', event => {
        const files = Array.from(
            event.target.files || []
        );

        for (const file of files) {
            if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
                toast(
                    `${file.name}: format tidak didukung.`
                );

                continue;
            }

            const duplicate = addedFiles.some(old => (
                old.name === file.name &&
                old.size === file.size &&
                old.lastModified === file.lastModified
            ));

            if (!duplicate) {
                addedFiles.push(file);
            }
        }

        event.target.value = '';

        renderNewDocuments();
    });


    function renderSavedDocuments(documents) {
        const container = $('aemSavedDocs');

        if (!container) return;

        container.replaceChildren();

        if (!Array.isArray(documents) || !documents.length) {
            return;
        }

        container.appendChild(
            textElement(
                'strong',
                'Lampiran yang sudah tersimpan:'
            )
        );

        documents.forEach(doc => {
            const row = document.createElement('div');
            row.className = 'aem-file-row';

            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = doc.nama || 'Dokumen';

            row.appendChild(link);

            if (doc.id != null) {
                const label = document.createElement('label');

                label.className = 'aem-file-remove';

                const checkbox =
                    document.createElement('input');

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
    }


    /* ======================================================
       FORM TAMBAH ASET
    ====================================================== */

    function addForm() {
        if (!form) return;

        current = null;
        editId = null;
        saving = false;

        form.reset();

        $('aemKondisi')?.setCustomValidity('');

        resetDocuments();
        showError('');

        form.elements.namedItem('tahun').value =
            new Date().getFullYear();

        form.elements.namedItem('jumlah_unit').value = 1;

        $('aemFormTitle').textContent =
            'Tambah Aset Tetap Lainnya';

        $('aemSave').disabled = false;
        $('aemSave').textContent = 'Simpan Aset';

        combos.forEach(widget => widget.close());

        showDialog(formDialog);
    }


    /* ======================================================
       FORM EDIT ASET
    ====================================================== */

    function editForm(item) {
        if (!form || !item) return;

        current = item;
        editId = Number(item.id);
        saving = false;

        form.reset();

        $('aemKondisi')?.setCustomValidity('');

        resetDocuments();
        showError('');

        fields.forEach(field => {
            const input = form.elements.namedItem(field);

            if (input) {
                input.value = item[field] ?? '';
            }
        });

        renderSavedDocuments(item.dokumens || []);

        $('aemFormTitle').textContent =
            'Edit Aset Tetap Lainnya';

        $('aemSave').disabled = false;
        $('aemSave').textContent = 'Simpan Perubahan';

        combos.forEach(widget => widget.close());

        showDialog(formDialog);
    }


    $('aemAdd')?.addEventListener('click', addForm);


    /* ======================================================
       AMBIL DETAIL SATU BARANG
    ====================================================== */

    async function fetchItem(id) {
        const response = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!response.data) {
            throw new Error(
                'Data aset tidak ditemukan.'
            );
        }

        return response.data;
    }


    /* ======================================================
       PLACEHOLDER FOTO
    ====================================================== */

    function photoPlaceholder() {
        const box = document.createElement('div');

        box.className = 'aem-photo-placeholder';

        const icon = document.createElement('i');

        icon.setAttribute(
            'data-lucide',
            'image-off'
        );

        box.append(
            icon,
            textElement(
                'span',
                'Foto aset belum tersedia'
            )
        );

        return box;
    }


    /* ======================================================
       POPUP VIEW BARANG
       Foto besar, detail lengkap dan dokumen.
    ====================================================== */

    function showDetail(item) {
        current = item;

        const body = $('aemDetailBody');

        body.replaceChildren();

        $('aemDetailTitle').textContent =
            item.nama_aset || 'Detail Inventaris';


        /*
         * FOTO UTAMA
         */

        if (item.foto_url) {
            const photo = document.createElement('img');

            photo.src = item.foto_url;
            photo.alt =
                'Foto ' + (item.nama_aset || 'aset');

            photo.className = 'aem-photo-large';

            photo.addEventListener('error', () => {
                photo.replaceWith(photoPlaceholder());
                refreshIcons();
            });

            body.appendChild(photo);
        } else {
            body.appendChild(photoPlaceholder());
        }


        /*
         * NAMA BARANG
         */

        body.appendChild(
            textElement(
                'div',
                item.nama_aset || 'Inventaris K.I.B E',
                'aem-detail-caption'
            )
        );


        /*
         * INFORMASI INVENTARIS
         */

        const grid = document.createElement('div');

        grid.className = 'aem-detail-grid';

        const details = [
            [
                'Kode Inventaris (Manual)',
                item.kode_inventaris
            ],
            [
                'Nama Barang',
                item.nama_aset
            ],
            [
                'Nomor Register',
                item.nomor_register
            ],
            [
                'Jumlah Unit',
                item.jumlah_unit != null
                    ? `${item.jumlah_unit} Unit`
                    : '—'
            ],
            [
                'Kondisi',
                item.kondisi
            ],
            [
                'Bahan',
                item.bahan
            ],
            [
                'Tahun Pengadaan',
                item.tahun
            ],
            [
                'Asal Perolehan',
                item.asal_perolehan
            ],
            [
                'Lokasi / Unit Kerja',
                item.lokasi
            ],
            [
                'Alamat',
                item.alamat
            ],
            [
                'Departemen',
                item.departemen
            ],
            [
                'Divisi',
                item.divisi
            ]
        ];

        details.forEach(([label, value]) => {
            const box = document.createElement('div');

            box.append(
                textElement('small', label),
                textElement('strong', value)
            );

            grid.appendChild(box);
        });

        body.appendChild(grid);


        /*
         * KETERANGAN
         */

        body.append(
            textElement('h3', 'Keterangan'),
            textElement('p', item.keterangan)
        );


        /*
         * DOKUMEN PENDUKUNG
         */

        body.appendChild(
            textElement('h3', 'Dokumen Pendukung')
        );

        const documents = document.createElement('div');

        documents.className = 'aem-doc-links';

        if (!item.dokumens?.length) {
            documents.appendChild(
                textElement('p', 'Belum ada lampiran.')
            );
        }

        for (const doc of item.dokumens || []) {
            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            link.textContent =
                doc.nama || 'Lihat Dokumen';

            link.className = 'aem-btn outline';

            documents.appendChild(link);
        }

        body.appendChild(documents);


        /*
         * Modal View dibuka di atas Modal Kelompok.
         * Popup Kelompok tetap terbuka di bawah.
         */

        showDialog(detailDialog);
    }


    /* ======================================================
       STATE DETAIL KELOMPOK
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

    let groupController = null;
    let searchDelay = null;


    function groupKey(lokasi, divisi) {
        return JSON.stringify([
            lokasi,
            divisi
        ]);
    }


    function groupMessage(message) {
        const element = $('aemGroupAlert');

        if (!element) return;

        element.textContent = message || '';
        element.hidden = !message;
    }


    /* ======================================================
       BUKA POPUP DETAIL KELOMPOK
    ====================================================== */

    function openGroup(lokasi, divisi) {
        if (!groupDialog || !groupUrl) {
            toast(
                'Route Detail Kelompok belum tersedia.'
            );

            return;
        }

        groupState.lokasi =
            String(lokasi || '').trim() ||
            'Tanpa Lokasi';

        groupState.divisi =
            String(divisi || '').trim() ||
            'Tanpa Divisi';

        groupState.q = '';
        groupState.page = 1;

        $('aemGroupItemSearch').value = '';
        $('aemGroupSearch').value = '';

        showDialog(groupDialog);

        loadGroup();
    }


    /* ======================================================
       RENDER PANEL KIRI
       Daftar lokasi dan divisi dari database manual.
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
            container.appendChild(
                textElement(
                    'div',
                    'Tidak ada lokasi atau divisi yang cocok.'
                )
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


        /*
         * SETIAP LOKASI
         */

        for (const [location, children] of locations) {
            const section = document.createElement('div');

            section.className = 'aem-group-location';

            const title = document.createElement('div');

            title.className = 'aem-group-location-title';

            const folderIcon =
                document.createElement('i');

            folderIcon.setAttribute(
                'data-lucide',
                'folder'
            );

            title.append(
                folderIcon,
                textElement('span', location)
            );

            section.appendChild(title);


            /*
             * SETIAP DIVISI DALAM LOKASI
             */

            for (const group of children) {
                const button = document.createElement('button');

                button.type = 'button';
                button.className = 'aem-group-select';

                const isSelected =
                    groupState.selected &&
                    groupKey(
                        groupState.selected.lokasi,
                        groupState.selected.divisi
                    ) === groupKey(
                        group.lokasi,
                        group.divisi
                    );

                if (isSelected) {
                    button.classList.add('active');
                }

                button.setAttribute(
                    'aria-pressed',
                    String(Boolean(isSelected))
                );

                button.append(
                    textElement('span', group.divisi),
                    textElement('span', group.jumlah)
                );

                button.addEventListener('click', () => {
                    groupState.lokasi = group.lokasi;
                    groupState.divisi = group.divisi;

                    groupState.page = 1;
                    groupState.q = '';

                    $('aemGroupItemSearch').value = '';

                    loadGroup();
                });

                section.appendChild(button);
            }

            container.appendChild(section);
        }

        refreshIcons();
    }


    /* ======================================================
       RENDER TABEL PANEL KANAN
    ====================================================== */

    function renderGroupRows(items) {
        const body = $('aemGroupRows');

        if (!body) return;

        body.replaceChildren();

        if (!items.length) {
            const row = document.createElement('tr');

            addCell(
                row,
                'Tidak ada aset pada kelompok atau pencarian ini.',
                'aem-empty'
            ).colSpan = 6;

            body.appendChild(row);

            return;
        }

        const first = Number(
            groupState.pagination?.from || 1
        );

        items.forEach((item, index) => {
            const row = document.createElement('tr');

            /*
             * NOMOR
             */

            addCell(
                row,
                first + index,
                'aem-center'
            );


            /*
             * NAMA BARANG
             */

            addCell(
                row,
                textElement(
                    'strong',
                    item.nama_aset || '—'
                )
            );


            /*
             * KODE INVENTARIS MANUAL
             */

            addCell(
                row,
                item.kode_inventaris || '—'
            );


            /*
             * NOMOR REGISTER
             */

            addCell(
                row,
                item.nomor_register || '—'
            );


            /*
             * THUMBNAIL FOTO
             */

            const photoBox = document.createElement('div');

            if (item.foto_url) {
                const image = document.createElement('img');

                image.className = 'aem-group-thumb';
                image.src = item.foto_url;

                image.alt =
                    'Foto ' + (item.nama_aset || 'aset');

                image.addEventListener('error', () => {
                    const placeholder = textElement(
                        'div',
                        'Tanpa foto',
                        'aem-group-no-photo'
                    );

                    image.replaceWith(placeholder);
                });

                photoBox.appendChild(image);
            } else {
                photoBox.appendChild(
                    textElement(
                        'div',
                        'Tanpa foto',
                        'aem-group-no-photo'
                    )
                );
            }

            addCell(
                row,
                photoBox,
                'aem-center'
            );


            /*
             * AKSI VIEW BARANG
             */

            const view = document.createElement('button');

            view.type = 'button';
            view.className = 'aem-action view';
            view.title = 'View Barang';

            view.dataset.aemAction = 'view';
            view.dataset.id = String(item.id);

            view.setAttribute(
                'aria-label',
                `Lihat detail ${item.nama_aset || 'aset'}`
            );

            const icon = document.createElement('i');

            icon.setAttribute(
                'data-lucide',
                'eye'
            );

            view.appendChild(icon);

            addCell(
                row,
                view,
                'aem-center'
            );

            body.appendChild(row);
        });

        refreshIcons();
    }


    /* ======================================================
       REQUEST DAFTAR KELOMPOK KE CONTROLLER
    ====================================================== */

    async function loadGroup() {
        if (!groupDialog || !groupUrl) return;

        if (groupController) {
            groupController.abort();
        }

        groupController = new AbortController();

        groupMessage('');

        const body = $('aemGroupRows');

        const loaderRow = document.createElement('tr');

        addCell(
            loaderRow,
            'Memuat daftar aset...',
            'aem-group-spinner'
        ).colSpan = 6;

        body.replaceChildren(loaderRow);


        /*
         * PARAMETER FILTER
         */

        const params = new URLSearchParams({
            lokasi: groupState.lokasi,
            divisi: groupState.divisi,
            q: groupState.q,
            page: String(groupState.page)
        });


        try {
            const result = await api(
                `${groupUrl}?${params.toString()}`,
                {
                    signal: groupController.signal
                }
            );

            if (!groupDialog.open) return;

            groupState.groups =
                Array.isArray(result.groups)
                    ? result.groups
                    : [];

            groupState.selected =
                result.selected || null;

            groupState.pagination =
                result.pagination || null;


            /*
             * JUDUL KELOMPOK
             */

            if (result.selected) {
                groupState.lokasi =
                    result.selected.lokasi;

                groupState.divisi =
                    result.selected.divisi;

                $('aemGroupTitle').textContent =
                    result.selected.divisi;

                $('aemGroupSubtitle').textContent =
                    'Lokasi: ' + result.selected.lokasi;
            } else {
                $('aemGroupTitle').textContent =
                    'Belum Ada Kelompok Aset';

                $('aemGroupSubtitle').textContent =
                    'Tambahkan data manual terlebih dahulu.';
            }


            /*
             * INFORMASI JUMLAH DAN PAGINATION
             */

            const pagination = result.pagination || {};

            $('aemGroupCount').textContent =
                `${pagination.total || 0} barang`;

            $('aemGroupInfo').textContent =
                `${pagination.from || 0}–${pagination.to || 0} dari ${pagination.total || 0} data`;

            $('aemGroupPage').textContent =
                `${pagination.page || 1} / ${pagination.last_page || 1}`;

            $('aemGroupPrev').disabled =
                (pagination.page || 1) <= 1;

            $('aemGroupNext').disabled =
                (pagination.page || 1) >=
                (pagination.last_page || 1);


            /*
             * PERBARUI PANEL KIRI DAN KANAN
             */

            renderGroups();

            renderGroupRows(
                Array.isArray(result.items)
                    ? result.items
                    : []
            );

        } catch (exception) {
            if (exception.name === 'AbortError') return;

            groupMessage(
                exception.message ||
                'Tidak dapat mengambil data kelompok.'
            );

            body.replaceChildren();
        }
    }


    /* ======================================================
       MENUTUP POPUP KELOMPOK
    ====================================================== */

    function closeGroupDialog() {
        hideDialog(groupDialog);
    }

    $('aemBack')?.addEventListener(
        'click',
        closeGroupDialog
    );

    $('aemGroupClose')?.addEventListener(
        'click',
        closeGroupDialog
    );

    groupDialog?.addEventListener('close', () => {
        groupController?.abort();
        clearTimeout(searchDelay);
    });


    /* ======================================================
       CARI KELOMPOK DI PANEL KIRI
    ====================================================== */

    $('aemGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );


    /* ======================================================
       CARI BARANG DI PANEL KANAN
    ====================================================== */

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


    /* ======================================================
       RESET PENCARIAN
    ====================================================== */

    $('aemGroupRefresh')?.addEventListener(
        'click',
        () => {
            clearTimeout(searchDelay);

            groupState.q = '';
            groupState.page = 1;

            $('aemGroupItemSearch').value = '';

            loadGroup();
        }
    );


    /* ======================================================
       PAGINATION
    ====================================================== */

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
        if (!(event.target instanceof Element)) {
            return;
        }

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

        if (!/^\d+$/.test(String(id))) {
            toast('ID aset tidak valid.');
            return;
        }


        /*
         * DETAIL KELOMPOK
         */

        if (action === 'group') {
            openGroup(
                button.dataset.location,
                button.dataset.division
            );

            return;
        }


        /*
         * DELETE LANGSUNG
         */

        if (action === 'delete') {
            confirmDelete(
                id,
                button.dataset.name
            );

            return;
        }


        /*
         * VIEW ATAU EDIT BARANG
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
            toast(exception.message);
        } finally {
            button.disabled = false;
        }
    });


    /* ======================================================
       EDIT DARI POPUP VIEW
    ====================================================== */

    $('aemEditDetail')?.addEventListener('click', () => {
        if (!current) return;

        const item = current;

        hideDialog(detailDialog);

        editForm(item);
    });


    /* ======================================================
       KONFIRMASI DELETE
    ====================================================== */

    function confirmDelete(id, name) {
        deleteId = Number(id);

        $('aemDeleteName').textContent =
            name || `Aset #${id}`;

        hideDialog(detailDialog);

        showDialog(deleteDialog);
    }


    $('aemDeleteDetail')?.addEventListener('click', () => {
        if (!current) return;

        confirmDelete(
            current.id,
            current.nama_aset
        );
    });


    /* ======================================================
       HAPUS DATA DARI DATABASE
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
                    `${base}/${encodeURIComponent(deleteId)}`,
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
        if (!deleting) {
            deleteId = null;
        }
    });


    /* ======================================================
       SIMPAN FORM CREATE / UPDATE
    ====================================================== */

    form?.addEventListener('submit', async event => {
        event.preventDefault();

        if (saving) return;

        showError('');


        /*
         * VALIDASI KONDISI
         */

        const condition = $('aemKondisi');

        condition.value = String(
            condition.value || ''
        ).trim().toUpperCase();

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

        if (!form.reportValidity()) {
            return;
        }


        /*
         * KUNCI TOMBOL SAAT MENYIMPAN
         */

        saving = true;

        const save = $('aemSave');

        save.disabled = true;


        /*
         * AMBIL DATA FORM
         */

        const data = new FormData(form);

        data.delete('dokumens[]');


        /*
         * MASUKKAN SEMUA DOKUMEN BARU
         */

        addedFiles.forEach(file => {
            data.append(
                'dokumens[]',
                file,
                file.name
            );
        });


        /*
         * UPDATE MEMAKAI METHOD SPOOFING PUT
         */

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

            /*
             * KEMBALI KE HALAMAN MANUAL
             */

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
