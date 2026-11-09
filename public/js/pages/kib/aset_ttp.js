
/*
|--------------------------------------------------------------------------
| K.I.B E — ASET TETAP LAINNYA
| PERUMDAM TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
| Sumber data:
| - kib_aset_tetap_manual
| - kib_aset_tetap_dokumens
|
| Arsip kib_e_s tetap baca-saja.
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('aemApp');

    if (!root || root.dataset.loaded) return;

    root.dataset.loaded = '1';

    const $ = id => document.getElementById(id);

    const form = $('aemForm');
    const formDialog = $('aemFormDialog');
    const detailDialog = $('aemDetailDialog');
    const deleteDialog = $('aemDeleteDialog');

    const base = root.dataset.base.replace(/\/$/, '');
    const token = root.dataset.token;

    const normalize = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');

    const list = value =>
        Array.isArray(value) ? value : [];

    const json = (id, fallback) => {
        try {
            return JSON.parse(
                $(id)?.textContent || ''
            ) || fallback;
        } catch {
            return fallback;
        }
    };

    const master = json('aemMaster', {});
    const history = json('aemHistory', {});

    const combos = new Map();

    const fields = [
        'nama_aset',
        'lokasi',
        'alamat',
        'departemen',
        'divisi',
        'kode_struktur',
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

    let addedFiles = [];
    let saving = false;
    let deleting = false;
    let toastTimer = null;


    /* ======================================================
       HELPER
    ====================================================== */

    const icons = () => {
        window.lucide?.createIcons?.();
    };

    const show = dialog => {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        icons();
    };

    const hide = dialog => {
        if (dialog?.open) dialog.close();
    };

    const txt = (tag, value) => {
        const element = document.createElement(tag);

        element.textContent =
            value === null ||
            value === undefined ||
            value === ''
                ? '—'
                : String(value);

        return element;
    };


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
       VALIDATION ERROR
    ====================================================== */

    function error(message) {
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
       REQUEST LARAVEL
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
                'Sesi login telah habis. Silakan login kembali.'
            );
        }

        const data = await response.json()
            .catch(() => ({}));

        if (!response.ok || data.success === false) {
            const details = data.errors
                ? Object.values(data.errors).flat().join('\n')
                : '';

            let message = details ||
                data.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (response.status === 413) {
                message =
                    'Ukuran file melampaui batas server.';
            }

            if (response.status === 419) {
                message =
                    'Sesi login habis, silakan refresh.';
            }

            throw new Error(message);
        }

        return data;
    }


    /* ======================================================
       WAKTU WITA
    ====================================================== */

    const dateFmt = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const timeFmt = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    function updateClock() {
        const dateNode = $('aemDate');
        const timeNode = $('aemTime');

        if (!dateNode || !timeNode) return;

        const now = new Date();
        const date = dateFmt.format(now);

        dateNode.textContent =
            date.charAt(0).toUpperCase() +
            date.slice(1);

        timeNode.textContent = timeFmt
            .format(now)
            .replace(/\./g, ':');
    }

    updateClock();

    setInterval(updateClock, 1000);


    /* ======================================================
       CLOSE DIALOG
    ====================================================== */

    document
        .querySelectorAll('[data-aem-close]')
        .forEach(button => {

            button.addEventListener('click', () => {
                hide($(button.dataset.aemClose));
            });

        });


    /* ======================================================
       PILIHAN DROPDOWN
    ====================================================== */

    const predefined = {

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
                label: 'Data lama — Cukup'
            },
            {
                value: 'RUSAK RINGAN',
                label: 'Data lama — Rusak Ringan'
            }
        ],

        asal: [
            {
                value: 'PEMBELIAN',
                label: 'Pembelian'
            },
            {
                value: 'PENGADAAN',
                label: 'Pengadaan'
            },
            {
                value: 'HIBAH',
                label: 'Hibah'
            },
            {
                value: 'BANTUAN',
                label: 'Bantuan'
            },
            {
                value: 'LAINNYA',
                label: 'Lainnya'
            }
        ]
    };


    /* ======================================================
       OPSI MASTER DATA
    ====================================================== */

    function getOptions(source) {
        let result = [];

        if (source === 'lokasi') {
            result = list(master.lokasi).map(row => ({
                value: row.lokasi,
                label: row.alamat || '',
                ref: row
            }));
        }

        if (source === 'departemen') {
            result = list(master.departemen).map(row => ({
                value: row.nama_dep,
                label: '',
                ref: row
            }));
        }

        if (source === 'bahan') {
            result = list(master.bahan).map(row => ({
                value: row.nama || row.nama_bahan,
                label: '',
                ref: row
            }));
        }

        if (source === 'divisi') {
            const department = list(master.departemen)
                .find(row =>
                    normalize(row.nama_dep) ===
                    normalize($('aemDep')?.value)
                );

            const available = department
                ? list(master.divisi).filter(row =>
                    String(row.id_dep) ===
                    String(department.id)
                )
                : list(master.divisi);

            result = available.map(row => ({
                value: row.nama_div,
                label: '',
                ref: row
            }));

            if (!department) {
                result.push(
                    ...list(history.divisi).map(value => ({
                        value,
                        label: ''
                    }))
                );
            }
        }

        if (source === 'asal') {
            result = [...predefined.asal];
        }

        if (source === 'kondisi') {
            result = [...predefined.kondisi];
        }

        const extra = {
            lokasi: history.lokasi,
            departemen: history.departemen,
            bahan: history.bahan,
            asal: history.asal_perolehan
        };

        for (const value of list(extra[source])) {
            result.push({
                value: String(value),
                label: ''
            });
        }

        const known = new Set();

        return result.filter(item => {
            const key = normalize(item.value);

            if (!key || known.has(key)) {
                return false;
            }

            known.add(key);

            return true;
        });
    }


    /* ======================================================
       SEARCHABLE DROPDOWN
    ====================================================== */

    function initCombos() {
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


                /* TOGGLE BUTTON */

                const arrow =
                    document.createElement('button');

                arrow.type = 'button';
                arrow.className = 'aem-combo-arrow';
                arrow.textContent = '⌄';

                arrow.setAttribute(
                    'aria-label',
                    'Buka pilihan'
                );


                /* OPTIONS PANEL */

                const panel =
                    document.createElement('div');

                panel.className = 'aem-combo-options';
                panel.id = input.id + '-list';

                panel.hidden = true;
                panel.setAttribute('role', 'listbox');

                input.setAttribute('role', 'combobox');

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
                let active = -1;


                /* CLOSE */

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

                    active = -1;
                }


                /* CHOOSE */

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


                /* RENDER OPTIONS */

                function render(all = false) {
                    combos.forEach((widget, id) => {
                        if (id !== input.id) {
                            widget.close();
                        }
                    });

                    const filter = all
                        ? ''
                        : normalize(input.value);

                    shown = getOptions(source)
                        .filter(item =>
                            normalize(
                                `${item.value} ${item.label || ''}`
                            ).includes(filter)
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
                                : 'Belum ada pilihan. Kamu boleh mengetik nilai baru.';

                        panel.appendChild(empty);
                    }

                    shown.forEach(item => {
                        const button =
                            document.createElement('button');

                        button.type = 'button';
                        button.className = 'aem-combo-item';

                        const label =
                            document.createElement('strong');

                        label.textContent = item.value;

                        button.appendChild(label);

                        if (item.label) {
                            const subtitle =
                                document.createElement('small');

                            subtitle.textContent = item.label;
                            button.appendChild(subtitle);
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
                        window.innerHeight -
                            rect.bottom < 190 &&
                        rect.top > 230
                    );
                }


                /* KEYBOARD */

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
                            const step =
                                event.key === 'ArrowDown'
                                    ? 1
                                    : -1;

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
                        event.key === 'Enter' &&
                        !panel.hidden &&
                        active >= 0
                    ) {
                        event.preventDefault();
                        choose(shown[active]);
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


        /* CLOSE OUTSIDE */

        document.addEventListener('pointerdown', event => {
            combos.forEach(widget => {
                if (!widget.wrapper.contains(event.target)) {
                    widget.close();
                }
            });
        });


        /* DEPENDENCY DEPARTEMEN → DIVISI */

        $('aemDep')?.addEventListener('change', () => {
            if ($('aemDiv').value) {
                $('aemDiv').value = '';
            }

            combos.get('aemDiv')?.close();
        });
    }


    /* ======================================================
       FILE DAN LAMPIRAN
    ====================================================== */

    function resetDocs() {
        addedFiles = [];

        $('aemDocsInput').value = '';
        $('aemSelectedDocs').replaceChildren();
        $('aemSavedDocs').replaceChildren();
    }


    function renderNewDocs() {
        const box = $('aemSelectedDocs');

        box.replaceChildren();

        if (!addedFiles.length) return;

        box.append(
            txt(
                'strong',
                `${addedFiles.length} lampiran baru`
            )
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

            box.append(row);
        });
    }


    $('aemDocsInput')?.addEventListener('change', event => {
        const selected = Array.from(
            event.target.files || []
        );

        for (const file of selected) {
            if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
                toast(
                    `${file.name}: format tidak didukung.`
                );
                continue;
            }

            const duplicate = addedFiles.some(old =>
                old.name === file.name &&
                old.size === file.size &&
                old.lastModified === file.lastModified
            );

            if (!duplicate) {
                addedFiles.push(file);
            }
        }

        event.target.value = '';

        renderNewDocs();
    });


    function renderSavedDocs(documents) {
        const box = $('aemSavedDocs');

        box.replaceChildren();

        if (!list(documents).length) return;

        box.append(
            txt(
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
            box.append(row);
        });
    }


    /* ======================================================
       FORM TAMBAH
    ====================================================== */

    function addForm() {
        editId = null;
        current = null;
        saving = false;

        form.reset();
        resetDocs();
        error('');

        $('aemKondisi').setCustomValidity('');

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


    /* ======================================================
       FORM EDIT
    ====================================================== */

    function editForm(item) {
        editId = Number(item.id);
        current = item;
        saving = false;

        form.reset();
        resetDocs();
        error('');

        $('aemKondisi').setCustomValidity('');

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
       DETAIL BARANG — LEMBAR EXCEL KIB E
    ====================================================== */

    function detail(item) {
        if (!item) return;

        current = item;

        const body = $('aemDetailBody');

        body.replaceChildren();

        $('aemDetailTitle').textContent =
            item.nama_aset || 'Kartu Inventaris Barang E';


        /* PEMBUAT ELEMENT AMAN */

        const make = (
            tag,
            className = '',
            text = null
        ) => {
            const element = document.createElement(tag);

            if (className) {
                element.className = className;
            }

            if (text !== null) {
                element.textContent = String(text);
            }

            return element;
        };

        const shown = value =>
            String(value ?? '').trim() || '—';


        /* FORMAT KONDISI */

        const conditions = {
            'BAIK': 'Baik (B)',
            'KURANG BAIK': 'Kurang Baik (KB)',
            'RUSAK BERAT': 'Rusak Berat (RB)',
            'CUKUP': 'Cukup (data lama)',
            'RUSAK RINGAN': 'Rusak Ringan (data lama)'
        };

        const cond = conditions[
            String(item.kondisi || '')
                .trim()
                .toUpperCase()
        ] || shown(item.kondisi);


        /* LEMBAR KIB */

        const sheet = make(
            'section',
            'aem-kib-sheet'
        );


        /* KOP PERUSAHAAN */

        const heading = make(
            'div',
            'aem-kib-heading'
        );

        const brand = make(
            'div',
            'aem-kib-brand'
        );

        const logo = make(
            'img',
            'aem-kib-logo'
        );

        logo.src = root.dataset.logoUrl || '';
        logo.alt = 'Logo Perumdam Tirta Kencana';

        logo.onerror = () => logo.remove();

        brand.append(
            logo,
            make(
                'strong',
                '',
                'PERUMDAM TIRTA KENCANA'
            ),
            make(
                'strong',
                '',
                'KOTA SAMARINDA'
            )
        );

        const headingTitle = make(
            'div',
            'aem-kib-heading-title'
        );

        headingTitle.append(
            make(
                'div',
                '',
                'KARTU INVENTARIS BARANG (KIB)'
            ),
            make(
                'strong',
                '',
                'E. ASET TETAP LAINNYA'
            )
        );

        heading.append(brand, headingTitle);

        sheet.append(heading);


        /* IDENTITAS ORGANISASI */

        const identity = make(
            'div',
            'aem-kib-identity'
        );

        const info = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDAM TIRTA KENCANA'],
            ['DEPARTEMEN', item.departemen],
            ['DIVISI', item.divisi],
            ['KODE STRUKTUR', item.kode_struktur],
            ['LOKASI / UNIT KERJA', item.lokasi],
            ['ALAMAT', item.alamat]
        ];

        info.forEach(([label, value]) => {
            const row = make(
                'div',
                'aem-kib-identity-row'
            );

            row.append(
                make('span', '', label),
                make('span', '', ':'),
                make('strong', '', shown(value))
            );

            identity.append(row);
        });

        sheet.append(identity);


        /* TABEL EXCEL */

        const scroller = make(
            'div',
            'aem-kib-table-scroll'
        );

        const table = make(
            'table',
            'aem-kib-table'
        );

        const cols = make('colgroup');

        for (let i = 0; i < 10; i++) {
            cols.append(make('col'));
        }

        table.append(cols);

        const thead = make('thead');

        const first = make('tr');
        const second = make('tr');
        const numbers = make('tr');


        /* HEADER HELPER */

        function addHeader(
            row,
            title,
            rowspan = 1,
            colspan = 1
        ) {
            const cell = make(
                'th',
                '',
                title
            );

            cell.rowSpan = rowspan;
            cell.colSpan = colspan;

            row.append(cell);
        }


        /* HEADER UTAMA */

        addHeader(first, 'No.', 2);

        addHeader(
            first,
            'Nama Barang / Jenis Barang',
            2
        );

        addHeader(first, 'Nomor', 1, 2);

        addHeader(
            first,
            'Kondisi Barang (B, KB, RB)',
            2
        );

        addHeader(first, 'Bahan', 2);

        addHeader(
            first,
            'Tahun Pengadaan / Perolehan',
            2
        );

        addHeader(first, 'Jumlah', 2);

        addHeader(
            first,
            'Asal Usul / Cara Perolehan',
            2
        );

        addHeader(first, 'Keterangan', 2);


        /* HEADER NOMOR */

        addHeader(second, 'Kode Barang');
        addHeader(second, 'Register');


        /* NOMOR KOLOM 1–10 */

        for (let i = 1; i <= 10; i++) {
            addHeader(numbers, String(i));
        }

        thead.append(
            first,
            second,
            numbers
        );


        /* ISI BARANG */

        const data = [
            '1',
            shown(item.nama_aset),
            shown(item.kode_inventaris),
            shown(item.nomor_register),
            cond,
            shown(item.bahan),
            shown(item.tahun),
            item.jumlah_unit == null
                ? '—'
                : `${Number(item.jumlah_unit).toLocaleString('id-ID')} buah`,
            shown(item.asal_perolehan),
            shown(item.keterangan)
        ];

        const tbody = make('tbody');
        const dataRow = make('tr');

        data.forEach((value, index) => {
            dataRow.append(
                make(
                    'td',
                    index === 0 ? 'aem-kib-center' : '',
                    value
                )
            );
        });

        tbody.append(dataRow);

        table.append(thead, tbody);
        scroller.append(table);
        sheet.append(scroller);


        /* BLOK PENGESAHAN */

        const signatures = make(
            'div',
            'aem-kib-signatures'
        );

        const date = new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone: 'Asia/Makassar',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }
        ).format(new Date());

        const roles = [
            ['Diketahui Oleh', 'Direktur Umum'],
            ['Diketahui Oleh', 'Manajer Keuangan'],
            ['Diperiksa Oleh', 'Asisten Manajer Aset'],
            ['Dibuat Oleh', 'Staf Aset']
        ];

        roles.forEach(([title, role], index) => {
            const block = make(
                'div',
                'aem-kib-signature'
            );

            if (index === 3) {
                block.append(
                    make(
                        'small',
                        'aem-kib-date',
                        `Samarinda, ${date}`
                    )
                );
            }

            block.append(
                make('span', '', title),
                make('strong', '', role),
                make(
                    'span',
                    'aem-kib-signature-line',
                    'Nama / Tanda Tangan'
                )
            );

            signatures.append(block);
        });

        sheet.append(signatures);
        body.append(sheet);


        /* FOTO DAN DOKUMEN */

        const attachments = make(
            'section',
            'aem-kib-attachments'
        );

        attachments.append(
            make(
                'h3',
                '',
                'Foto dan Dokumen Pendukung'
            )
        );

        const links = make(
            'div',
            'aem-kib-file-links'
        );


        /* TAMPILKAN LINK BERIKON */

        function addLink(url, name, iconName) {
            if (!url) return;

            const link = make(
                'a',
                'aem-kib-file'
            );

            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const icon = make('i');

            icon.setAttribute(
                'data-lucide',
                iconName
            );

            link.append(
                icon,
                make('span', '', name)
            );

            links.append(link);
        }


        /* FOTO UTAMA */

        addLink(
            item.foto_url,
            'Lihat Foto Utama',
            'image'
        );


        /* PDF DAN GAMBAR */

        list(item.dokumens).forEach(doc => {
            addLink(
                doc.url,
                doc.nama || 'Lampiran',
                /\.pdf$/i.test(doc.nama || '')
                    ? 'file-text'
                    : 'image'
            );
        });

        if (!links.childElementCount) {
            links.append(
                make(
                    'p',
                    '',
                    'Belum ada foto atau dokumen.'
                )
            );
        }

        attachments.append(links);
        body.append(attachments);

        show(detailDialog);
        icons();
    }


    /* ======================================================
       AMBIL DETAIL SATU ASET
    ====================================================== */

    async function fetchItem(id) {
        const result = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!result.data) {
            throw new Error(
                'Data aset tidak ditemukan.'
            );
        }

        return result.data;
    }


    /* ======================================================
       DETAIL KELOMPOK
    ====================================================== */

    const groupPanel = $('aemGroupPanel');
    const groupUrl = root.dataset.groupUrl;

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
        return JSON.stringify([lokasi, divisi]);
    }


    function groupMessage(message) {
        const box = $('aemGroupAlert');

        if (!box) return;

        box.textContent = message || '';
        box.hidden = !message;
    }


    /* ======================================================
       OPEN GROUP
    ====================================================== */

    function openGroup(lokasi, divisi) {
        if (!groupPanel || !groupUrl) {
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

        show(groupPanel);

        loadGroup();
    }


    /* ======================================================
       TABLE HELPER
    ====================================================== */

    function addCell(
        row,
        content,
        className = ''
    ) {
        const cell = document.createElement('td');

        if (
            typeof content === 'string' ||
            typeof content === 'number'
        ) {
            cell.textContent = String(content);
        } else if (content) {
            cell.append(content);
        }

        if (className) {
            cell.className = className;
        }

        row.append(cell);

        return cell;
    }


    /* ======================================================
       PANEL KIRI — LOKASI DAN DIVISI
    ====================================================== */

    function renderGroups() {
        const container = $('aemGroupList');

        if (!container) return;

        container.replaceChildren();

        const search = normalize(
            $('aemGroupSearch').value
        );

        const groups = groupState.groups.filter(group =>
            normalize(
                `${group.lokasi} ${group.divisi}`
            ).includes(search)
        );

        if (!groups.length) {
            container.append(
                txt(
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


        for (const [location, children] of locations) {
            const section = document.createElement('div');

            section.className = 'aem-group-location';

            const title = document.createElement('div');

            title.className = 'aem-group-location-title';

            const folder =
                document.createElement('i');

            folder.setAttribute(
                'data-lucide',
                'folder'
            );

            title.append(
                folder,
                txt('span', location)
            );

            section.append(title);


            for (const group of children) {
                const button =
                    document.createElement('button');

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
       PANEL KANAN — DAFTAR BARANG
    ====================================================== */

    function renderGroupRows(items) {
        const body = $('aemGroupRows');

        if (!body) return;

        body.replaceChildren();

        if (!items.length) {
            const row = document.createElement('tr');

            addCell(
                row,
                'Tidak ada aset pada kelompok ini.',
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

            addCell(
                row,
                first + index,
                'aem-center'
            );

            addCell(
                row,
                txt('strong', item.nama_aset || '—')
            );

            addCell(
                row,
                item.kode_inventaris || '—'
            );

            addCell(
                row,
                item.nomor_register || '—'
            );


            /* FOTO */

            const photoBox =
                document.createElement('div');

            function noPhoto() {
                const empty = txt('div', 'Tanpa foto');

                empty.className = 'aem-group-no-photo';

                return empty;
            }

            if (item.foto_url) {
                const img = document.createElement('img');

                img.className = 'aem-group-thumb';
                img.src = item.foto_url;

                img.alt =
                    'Foto ' + (item.nama_aset || 'aset');

                img.onerror = () => {
                    img.replaceWith(noPhoto());
                };

                photoBox.append(img);
            } else {
                photoBox.append(noPhoto());
            }

            addCell(
                row,
                photoBox,
                'aem-center'
            );


            /* VIEW BUTTON */

            const view =
                document.createElement('button');

            view.type = 'button';
            view.className = 'aem-icon view';
            view.title = 'View KIB E';

            view.setAttribute(
                'aria-label',
                `Lihat detail ${item.nama_aset}`
            );

            view.dataset.aemAction = 'view';
            view.dataset.id = String(item.id);

            const eye =
                document.createElement('i');

            eye.setAttribute('data-lucide', 'eye');

            view.append(eye);

            addCell(
                row,
                view,
                'aem-center'
            );

            body.append(row);
        });

        icons();
    }


    /* ======================================================
       LOAD DATA KELOMPOK
    ====================================================== */

    async function loadGroup() {
        if (!groupPanel || !groupUrl) return;

        groupController?.abort();

        const controller = new AbortController();

        groupController = controller;

        groupMessage('');

        const body = $('aemGroupRows');

        const loader = document.createElement('tr');

        addCell(
            loader,
            'Memuat daftar aset...',
            'aem-empty'
        ).colSpan = 6;

        body.replaceChildren(loader);

        const query = new URLSearchParams({
            lokasi: groupState.lokasi,
            divisi: groupState.divisi,
            q: groupState.q,
            page: String(groupState.page)
        });


        try {
            const result = await api(
                `${groupUrl}?${query}`,
                {
                    signal: controller.signal
                }
            );

            if (
                controller.signal.aborted ||
                !groupPanel.open
            ) {
                return;
            }

            groupState.groups = list(result.groups);

            groupState.selected =
                result.selected || null;

            groupState.pagination =
                result.pagination || {};


            /* GROUP TITLE */

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
                    'Belum ada kelompok aset';

                $('aemGroupSubtitle').textContent =
                    'Tambahkan data manual terlebih dahulu.';
            }


            /* PAGINATION */

            const pagination = groupState.pagination;

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


            renderGroups();

            renderGroupRows(
                list(result.items)
            );

        } catch (exception) {
            if (exception.name === 'AbortError') {
                return;
            }

            groupMessage(
                exception.message ||
                'Tidak dapat memuat kelompok aset.'
            );

            body.replaceChildren();
        }
    }


    /* ======================================================
       CLOSE GROUP
    ====================================================== */

    function closeGroup() {
        hide(groupPanel);
    }

    $('aemBack')?.addEventListener(
        'click',
        closeGroup
    );

    $('aemGroupClose')?.addEventListener(
        'click',
        closeGroup
    );

    groupPanel?.addEventListener('close', () => {
        groupController?.abort();

        clearTimeout(searchDelay);
    });


    /* ======================================================
       SEARCH GROUP
    ====================================================== */

    $('aemGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );


    $('aemGroupItemSearch')?.addEventListener(
        'input',
        event => {
            clearTimeout(searchDelay);

            searchDelay = setTimeout(() => {
                groupState.q =
                    event.target.value.trim();

                groupState.page = 1;

                loadGroup();
            }, 300);
        }
    );


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
       PAGINATION GROUP
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
       EVENT DELEGATION — TABEL DAN POPUP
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
            return;
        }


        /* DETAIL KELOMPOK */

        if (action === 'group') {
            openGroup(
                button.dataset.location,
                button.dataset.division
            );

            return;
        }


        /* DELETE */

        if (action === 'delete') {
            confirmDelete(
                id,
                button.dataset.name
            );

            return;
        }


        /* VIEW / EDIT */

        if (!['view', 'edit'].includes(action)) {
            return;
        }

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
       EDIT DARI VIEW
    ====================================================== */

    $('aemEditDetail')?.addEventListener('click', () => {
        if (!current) return;

        const item = current;

        hide(detailDialog);

        editForm(item);
    });


    /* ======================================================
       KONFIRMASI DELETE
    ====================================================== */

    function confirmDelete(id, name) {
        deleteId = Number(id);

        $('aemDeleteName').textContent =
            name || `Aset #${id}`;

        hide(detailDialog);

        show(deleteDialog);
    }


    $('aemDeleteDetail')?.addEventListener('click', () => {
        if (current) {
            confirmDelete(
                current.id,
                current.nama_aset
            );
        }
    });


    /* ======================================================
       DELETE KE DATABASE
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
       SIMPAN CREATE / UPDATE
    ====================================================== */

    form?.addEventListener('submit', async event => {
        event.preventDefault();

        if (saving) return;

        error('');

        const condition = $('aemKondisi');

        condition.value = String(
            condition.value
        ).trim().toUpperCase();

        const allowedConditions = [
            'BAIK',
            'KURANG BAIK',
            'RUSAK BERAT',
            'CUKUP',
            'RUSAK RINGAN'
        ];

        condition.setCustomValidity(
            allowedConditions.includes(condition.value)
                ? ''
                : 'Pilih kondisi yang tersedia.'
        );

        if (!form.reportValidity()) {
            return;
        }

        saving = true;

        const save = $('aemSave');

        save.disabled = true;


        /* FORM DATA */

        const data = new FormData(form);

        data.delete('dokumens[]');

        for (const file of addedFiles) {
            data.append(
                'dokumens[]',
                file,
                file.name
            );
        }


        /* METHOD SPOOFING LARAVEL */

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
       INITIALIZATION
    ====================================================== */

    initCombos();
    icons();

})();
