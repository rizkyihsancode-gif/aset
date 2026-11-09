
/*
|--------------------------------------------------------------------------
| K.I.B E — ASET TETAP LAINNYA
| PERUMDAM TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| FITUR:
| 1. Daftar Aset Tetap Lainnya
| 2. Form Tambah dan Edit
| 3. Searchable Dropdown
| 4. Popup Detail Kelompok
| 5. Pengelompokan Lokasi dan Divisi
| 6. Pencarian dan Pagination
| 7. View Detail Format Excel KIB E
| 8. Foto dan Dokumen PDF
| 9. Hapus Data
|
| CATATAN:
| - Tanpa tanda tangan / pengesahan.
| - Kode Barang dan Register diisi manual.
| - Tidak terhubung dengan Kode Aktiva.
| - Arsip kib_e_s tetap read-only.
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    /* ======================================================
       INITIAL CONFIGURATION
    ====================================================== */

    const root = document.getElementById('aemApp');

    if (!root || root.dataset.loaded === '1') {
        return;
    }

    root.dataset.loaded = '1';

    const $ = id => document.getElementById(id);

    const form = $('aemForm');

    const formDialog = $('aemFormDialog');
    const detailDialog = $('aemDetailDialog');
    const deleteDialog = $('aemDeleteDialog');
    const groupDialog = $('aemGroupPanel');

    const base = String(
        root.dataset.base || ''
    ).replace(/\/$/, '');

    const groupUrl = root.dataset.groupUrl || '';
    const token = root.dataset.token || '';

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


    /* ======================================================
       HELPERS
    ====================================================== */

    const normalize = value =>
        String(value ?? '')
            .trim()
            .toLocaleLowerCase('id-ID');

    const showValue = value =>
        String(value ?? '').trim() || '—';

    const array = value =>
        Array.isArray(value) ? value : [];

    function create(
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

    function addCell(row, content, className = '') {
        const cell = document.createElement('td');

        if (className) {
            cell.className = className;
        }

        if (
            typeof content === 'string' ||
            typeof content === 'number'
        ) {
            cell.textContent = String(content);

        } else if (content instanceof Node) {
            cell.appendChild(content);
        }

        row.appendChild(cell);

        return cell;
    }

    function icons() {
        window.lucide?.createIcons?.();
    }

    function showDialog(dialog) {
        if (!dialog || dialog.open) {
            return;
        }

        dialog.showModal();

        icons();
    }

    function hideDialog(dialog) {
        if (dialog?.open) {
            dialog.close();
        }
    }

    function readJson(id, fallback = {}) {
        try {
            const node = $(id);

            if (!node) return fallback;

            return JSON.parse(node.textContent) || fallback;

        } catch (error) {
            console.warn(
                'Gagal membaca data JSON:',
                id,
                error
            );

            return fallback;
        }
    }

    const master = readJson('aemMaster');
    const history = readJson('aemHistory');

    const combos = new Map();

    let current = null;
    let editId = null;
    let deleteId = null;

    let addedFiles = [];

    let saving = false;
    let deleting = false;

    let toastTimer = null;


    /* ======================================================
       TOAST
    ====================================================== */

    function toast(message) {
        const node = $('aemToast');

        if (!node) return;

        node.textContent = message;
        node.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            node.hidden = true;
        }, 4000);
    }


    /* ======================================================
       FORM ERROR
    ====================================================== */

    function showError(message) {
        const node = $('aemError');

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
       AJAX API LARAVEL
    ====================================================== */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                'Accept': 'application/json',

                'X-Requested-With':
                    'XMLHttpRequest',

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
                    'Sesi login habis. Refresh halaman.';
            }

            if (response.status === 413) {
                message =
                    'Ukuran file melebihi batas server.';
            }

            if (response.status === 403) {
                message =
                    'Anda tidak memiliki izin.';
            }

            if (response.status === 404) {
                message =
                    'Data atau endpoint tidak ditemukan.';
            }

            throw new Error(message);
        }

        return result;
    }


    /* ======================================================
       TANGGAL DAN JAM WITA
    ====================================================== */

    function initClock() {
        const dateNode = $('aemDate');
        const timeNode = $('aemTime');

        if (!dateNode || !timeNode) {
            return;
        }

        const dateFormat = new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone: 'Asia/Makassar',
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        );

        const timeFormat = new Intl.DateTimeFormat(
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

            const date = dateFormat.format(now);

            dateNode.textContent =
                date.charAt(0).toUpperCase() +
                date.slice(1);

            timeNode.textContent = timeFormat
                .format(now)
                .replace(/\./g, ':');
        }

        update();

        setInterval(update, 1000);
    }


    /* ======================================================
       TOMBOL CLOSE MODAL
    ====================================================== */

    root
        .querySelectorAll('[data-aem-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                hideDialog(
                    $(button.dataset.aemClose)
                );
            });
        });


    /* ======================================================
       SEARCHABLE DROPDOWN
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
                label: 'Kondisi data lama'
            },
            {
                value: 'RUSAK RINGAN',
                label: 'Kondisi data lama'
            }
        ],

        asal: [
            {
                value: 'PENGADAAN',
                label: 'Pengadaan barang'
            },
            {
                value: 'PEMBELIAN',
                label: 'Pembelian langsung'
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
                label: 'Perolehan lainnya'
            }
        ]
    };


    /* ======================================================
       OPTIONS MASTER DATA
    ====================================================== */

    function getOptions(source) {
        let result = [];

        if (source === 'lokasi') {
            result = array(master.lokasi)
                .filter(row => row.lokasi)
                .map(row => ({
                    value: row.lokasi,
                    label: row.alamat || '',
                    ref: row
                }));
        }

        if (source === 'departemen') {
            result = array(master.departemen)
                .filter(row => row.nama_dep)
                .map(row => ({
                    value: row.nama_dep,
                    ref: row
                }));
        }

        if (source === 'divisi') {
            const selectedDepartment =
                array(master.departemen)
                    .find(row =>
                        normalize(row.nama_dep) ===
                        normalize($('aemDep')?.value)
                    );

            const available = selectedDepartment
                ? array(master.divisi).filter(row =>
                    String(row.id_dep) ===
                    String(selectedDepartment.id)
                )
                : array(master.divisi);

            result = available
                .filter(row => row.nama_div)
                .map(row => ({
                    value: row.nama_div,
                    ref: row
                }));

            if (!selectedDepartment) {
                result.push(
                    ...array(history.divisi)
                        .map(value => ({
                            value: String(value)
                        }))
                );
            }
        }

        if (source === 'bahan') {
            result = array(master.bahan)
                .map(row => ({
                    value:
                        row.nama ||
                        row.nama_bahan ||
                        ''
                }));
        }

        if (predefined[source]) {
            result.push(
                ...predefined[source]
            );
        }

        const extras = {
            lokasi: history.lokasi,
            departemen: history.departemen,
            bahan: history.bahan,
            asal: history.asal_perolehan
        };

        for (const value of array(extras[source])) {
            result.push({
                value: String(value)
            });
        }

        const known = new Set();

        return result.filter(option => {
            const key = normalize(option.value);

            if (!key || known.has(key)) {
                return false;
            }

            known.add(key);

            return true;
        });
    }


    /* ======================================================
       INITIALIZE COMBOBOXES
    ====================================================== */

    function initCombos() {
        if (!form) return;

        form
            .querySelectorAll('[data-aem-combo]')
            .forEach(input => {
                if (input.dataset.ready === '1') {
                    return;
                }

                input.dataset.ready = '1';

                const source =
                    input.dataset.aemCombo;

                const wrapper = create(
                    'div',
                    'aem-combo'
                );

                input.parentNode.insertBefore(
                    wrapper,
                    input
                );

                wrapper.appendChild(input);


                /* BUTTON DROPDOWN */

                const arrow = create(
                    'button',
                    'aem-combo-arrow',
                    '⌄'
                );

                arrow.type = 'button';

                arrow.setAttribute(
                    'aria-label',
                    'Tampilkan pilihan'
                );


                /* OPTION PANEL */

                const panel = create(
                    'div',
                    'aem-combo-options'
                );

                panel.hidden = true;
                panel.setAttribute('role', 'listbox');

                wrapper.append(arrow, panel);

                let displayed = [];
                let activeIndex = -1;


                function close() {
                    panel.hidden = true;

                    wrapper.classList.remove(
                        'opened',
                        'up'
                    );

                    activeIndex = -1;

                    input.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }


                function choose(option) {
                    input.value = String(
                        option.value
                    );

                    input.setCustomValidity('');

                    if (
                        source === 'lokasi' &&
                        option.ref?.alamat &&
                        $('aemAlamat') &&
                        !$('aemAlamat').value.trim()
                    ) {
                        $('aemAlamat').value =
                            String(option.ref.alamat);
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


                function render(showAll = false) {
                    combos.forEach((combo, key) => {
                        if (key !== input.name) {
                            combo.close();
                        }
                    });

                    const search = showAll
                        ? ''
                        : normalize(input.value);

                    displayed = getOptions(source)
                        .filter(option =>
                            normalize(
                                `${option.value} ${option.label || ''}`
                            ).includes(search)
                        )
                        .slice(0, 150);

                    panel.replaceChildren();

                    activeIndex = -1;


                    if (!displayed.length) {
                        panel.appendChild(
                            create(
                                'div',
                                'aem-combo-empty',
                                source === 'kondisi'
                                    ? 'Pilih kondisi yang tersedia.'
                                    : 'Tidak ada pilihan. Nilai manual dapat diketik.'
                            )
                        );
                    }


                    displayed.forEach(option => {
                        const button = create(
                            'button',
                            'aem-combo-item'
                        );

                        button.type = 'button';

                        button.appendChild(
                            create(
                                'strong',
                                '',
                                option.value
                            )
                        );

                        if (option.label) {
                            button.appendChild(
                                create(
                                    'small',
                                    '',
                                    option.label
                                )
                            );
                        }

                        button.addEventListener(
                            'mousedown',
                            event => event.preventDefault()
                        );

                        button.addEventListener(
                            'click',
                            () => choose(option)
                        );

                        panel.appendChild(button);
                    });


                    panel.hidden = false;

                    wrapper.classList.add(
                        'opened'
                    );

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


                function highlight(index) {
                    const buttons = Array.from(
                        panel.querySelectorAll(
                            '.aem-combo-item'
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

                    buttons[activeIndex].scrollIntoView({
                        block: 'nearest'
                    });
                }


                input.addEventListener(
                    'focus',
                    () => {
                        if (panel.hidden) {
                            render(true);
                        }
                    }
                );

                input.addEventListener(
                    'input',
                    () => {
                        input.setCustomValidity('');
                        render(false);
                    }
                );


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


                input.addEventListener(
                    'keydown',
                    event => {
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

                            if (displayed.length) {
                                const step =
                                    event.key === 'ArrowDown'
                                        ? 1
                                        : -1;

                                highlight(
                                    activeIndex + step
                                );
                            }
                        }

                        if (
                            event.key === 'Enter' &&
                            !panel.hidden &&
                            activeIndex >= 0
                        ) {
                            event.preventDefault();

                            choose(
                                displayed[activeIndex]
                            );
                        }

                        if (event.key === 'Tab') {
                            close();
                        }
                    }
                );


                combos.set(input.name, {
                    close,
                    wrapper
                });
            });


        document.addEventListener(
            'pointerdown',
            event => {
                combos.forEach(combo => {
                    if (
                        !combo.wrapper.contains(
                            event.target
                        )
                    ) {
                        combo.close();
                    }
                });
            }
        );


        /* DEPARTEMEN → DIVISI */

        $('aemDep')?.addEventListener(
            'change',
            () => {
                const division = $('aemDiv');

                if (division) {
                    division.value = '';
                }

                combos.get('divisi')?.close();
            }
        );
    }


    /* ======================================================
       FILE UPLOAD
    ====================================================== */

    function resetDocs() {
        addedFiles = [];

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

        if (!addedFiles.length) return;

        box.appendChild(
            create(
                'strong',
                '',
                `${addedFiles.length} lampiran baru`
            )
        );


        addedFiles.forEach((file, index) => {
            const row = create(
                'div',
                'aem-file-row'
            );

            row.appendChild(
                create(
                    'span',
                    '',
                    `${file.name} (${(
                        file.size / 1048576
                    ).toFixed(2)} MB)`
                )
            );

            const remove = create(
                'button',
                'aem-link',
                'Batalkan'
            );

            remove.type = 'button';

            remove.addEventListener(
                'click',
                () => {
                    addedFiles.splice(index, 1);
                    renderNewDocs();
                }
            );

            row.appendChild(remove);
            box.appendChild(row);
        });
    }


    $('aemDocsInput')?.addEventListener(
        'change',
        event => {
            const selected = Array.from(
                event.target.files || []
            );

            for (const file of selected) {
                if (
                    !/\.(pdf|jpe?g|png|webp)$/i.test(
                        file.name
                    )
                ) {
                    toast(
                        `${file.name}: format file tidak didukung.`
                    );

                    continue;
                }

                const duplicate =
                    addedFiles.some(old =>
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
        }
    );


    /* ======================================================
       LAMPIRAN TERSIMPAN
    ====================================================== */

    function renderSavedDocs(documents) {
        const box = $('aemSavedDocs');

        if (!box) return;

        box.replaceChildren();

        if (!array(documents).length) return;

        box.appendChild(
            create(
                'strong',
                '',
                'Lampiran yang sudah tersimpan:'
            )
        );


        documents.forEach(doc => {
            const row = create(
                'div',
                'aem-file-row'
            );

            if (doc.url) {
                const link = create(
                    'a',
                    '',
                    doc.nama || 'Dokumen'
                );

                link.href = doc.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                row.appendChild(link);
            }

            if (doc.id != null) {
                const label = create(
                    'label',
                    'aem-file-remove'
                );

                const checkbox =
                    document.createElement('input');

                checkbox.type = 'checkbox';
                checkbox.name =
                    'hapus_dokumen_ids[]';

                checkbox.value =
                    String(doc.id);

                label.append(
                    checkbox,
                    document.createTextNode(
                        ' Hapus saat simpan'
                    )
                );

                row.appendChild(label);
            }

            box.appendChild(row);
        });
    }


    /* ======================================================
       FORM TAMBAH
    ====================================================== */

    function addForm() {
        if (!form) return;

        current = null;
        editId = null;
        saving = false;

        form.reset();

        resetDocs();
        showError('');

        form.querySelectorAll('input')
            .forEach(input => {
                input.setCustomValidity('');
            });

        const year = form.elements.namedItem(
            'tahun'
        );

        if (year) {
            year.value =
                new Date().getFullYear();
        }

        const quantity = form.elements.namedItem(
            'jumlah_unit'
        );

        if (quantity) {
            quantity.value = 1;
        }

        $('aemFormTitle').textContent =
            'Tambah Aset Tetap Lainnya';

        $('aemSave').disabled = false;
        $('aemSave').textContent =
            'Simpan Aset';

        combos.forEach(combo => combo.close());

        showDialog(formDialog);
    }


    /* ======================================================
       FORM EDIT
    ====================================================== */

    function editForm(item) {
        if (!form || !item) return;

        current = item;
        editId = Number(item.id);
        saving = false;

        form.reset();

        resetDocs();
        showError('');

        form.querySelectorAll('input')
            .forEach(input => {
                input.setCustomValidity('');
            });

        fields.forEach(field => {
            const input =
                form.elements.namedItem(field);

            if (input) {
                input.value =
                    item[field] ?? '';
            }
        });

        renderSavedDocs(
            item.dokumens || []
        );

        $('aemFormTitle').textContent =
            'Edit Aset Tetap Lainnya';

        $('aemSave').disabled = false;
        $('aemSave').textContent =
            'Simpan Perubahan';

        combos.forEach(combo => combo.close());

        showDialog(formDialog);
    }


    $('aemAdd')?.addEventListener(
        'click',
        addForm
    );


    /* ======================================================
       AMBIL DETAIL SATU BARANG
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
       VIEW DETAIL KIB E — EXCEL
       TANPA TANDA TANGAN / PENGESAHAN
    ====================================================== */

    function detail(item) {
        if (!item) return;

        current = item;

        const body = $('aemDetailBody');

        if (!body) return;

        body.replaceChildren();

        $('aemDetailTitle').textContent =
            item.nama_aset ||
            'Kartu Inventaris Barang (KIB) E';


        /* KONDISI BARANG */

        const conditions = {
            'BAIK': 'Baik (B)',
            'KURANG BAIK': 'Kurang Baik (KB)',
            'RUSAK BERAT': 'Rusak Berat (RB)',
            'CUKUP': 'Cukup (data lama)',
            'RUSAK RINGAN':
                'Rusak Ringan (data lama)'
        };

        const condition =
            conditions[
                String(item.kondisi ?? '')
                    .trim()
                    .toUpperCase()
            ] || showValue(item.kondisi);


        /* LEMBAR KIB E */

        const sheet = create(
            'section',
            'aem-kib-sheet'
        );


        /* ==============================================
           KOP LAPORAN
        ============================================== */

        const heading = create(
            'div',
            'aem-kib-heading'
        );

        const brand = create(
            'div',
            'aem-kib-brand'
        );

        if (root.dataset.logoUrl) {
            const logo = create(
                'img',
                'aem-kib-logo'
            );

            logo.src = root.dataset.logoUrl;

            logo.alt =
                'Logo Perumdam Tirta Kencana';

            logo.onerror = () => {
                logo.remove();
            };

            brand.appendChild(logo);
        }

        brand.append(
            create(
                'strong',
                '',
                'PERUMDAM TIRTA KENCANA'
            ),

            create(
                'strong',
                '',
                'KOTA SAMARINDA'
            )
        );


        const headingTitle = create(
            'div',
            'aem-kib-heading-title'
        );

        headingTitle.append(
            create(
                'div',
                '',
                'KARTU INVENTARIS BARANG (KIB)'
            ),

            create(
                'strong',
                '',
                'E. ASET TETAP LAINNYA'
            )
        );

        heading.append(
            brand,
            headingTitle
        );

        sheet.appendChild(heading);


        /* ==============================================
           IDENTITAS ORGANISASI
        ============================================== */

        const identity = create(
            'div',
            'aem-kib-identity'
        );

        const info = [
            [
                'PROVINSI',
                'KALIMANTAN TIMUR'
            ],
            [
                'KOTA',
                'SAMARINDA'
            ],
            [
                'UNIT',
                'PERUMDAM TIRTA KENCANA'
            ],
            [
                'DEPARTEMEN',
                item.departemen
            ],
            [
                'DIVISI',
                item.divisi
            ],
            [
                'KODE STRUKTUR',
                item.kode_struktur
            ],
            [
                'LOKASI / UNIT KERJA',
                item.lokasi
            ],
            [
                'ALAMAT',
                item.alamat
            ]
        ];


        info.forEach(([label, value]) => {
            const row = create(
                'div',
                'aem-kib-identity-row'
            );

            row.append(
                create(
                    'span',
                    '',
                    label
                ),

                create(
                    'span',
                    '',
                    ':'
                ),

                create(
                    'strong',
                    '',
                    showValue(value)
                )
            );

            identity.appendChild(row);
        });

        sheet.appendChild(identity);


        /* ==============================================
           TABEL EXCEL KIB E
        ============================================== */

        const scroll = create(
            'div',
            'aem-kib-table-scroll'
        );

        const table = create(
            'table',
            'aem-kib-table'
        );

        const colgroup = create('colgroup');

        for (let i = 0; i < 10; i++) {
            colgroup.appendChild(
                create('col')
            );
        }

        table.appendChild(colgroup);


        /* HEADER */

        const thead = create('thead');

        const header1 = create('tr');
        const header2 = create('tr');
        const headerNumbers = create('tr');


        function addHeader(
            row,
            title,
            rowSpan = 1,
            colSpan = 1
        ) {
            const cell = create(
                'th',
                '',
                title
            );

            cell.rowSpan = rowSpan;
            cell.colSpan = colSpan;

            row.appendChild(cell);
        }


        /* HEADER BARIS PERTAMA */

        addHeader(
            header1,
            'No.',
            2
        );

        addHeader(
            header1,
            'Nama Barang / Jenis Barang',
            2
        );

        addHeader(
            header1,
            'Nomor',
            1,
            2
        );

        addHeader(
            header1,
            'Kondisi Barang (B, KB, RB)',
            2
        );

        addHeader(
            header1,
            'Bahan',
            2
        );

        addHeader(
            header1,
            'Tahun Pengadaan / Perolehan',
            2
        );

        addHeader(
            header1,
            'Jumlah',
            2
        );

        addHeader(
            header1,
            'Asal Usul / Cara Perolehan',
            2
        );

        addHeader(
            header1,
            'Keterangan',
            2
        );


        /* HEADER BARIS KEDUA */

        addHeader(
            header2,
            'Kode Barang'
        );

        addHeader(
            header2,
            'Register'
        );


        /* NOMOR KOLOM EXCEL */

        for (let i = 1; i <= 10; i++) {
            addHeader(
                headerNumbers,
                String(i)
            );
        }

        thead.append(
            header1,
            header2,
            headerNumbers
        );


        /* ==============================================
           ISI TABEL BARANG
        ============================================== */

        const tbody = create('tbody');

        const dataRow = create('tr');

        const data = [
            '1',

            showValue(item.nama_aset),

            showValue(item.kode_inventaris),

            showValue(item.nomor_register),

            condition,

            showValue(item.bahan),

            showValue(item.tahun),

            item.jumlah_unit == null
                ? '—'
                : (
                    Number(item.jumlah_unit)
                        .toLocaleString('id-ID') +
                    ' buah'
                ),

            showValue(item.asal_perolehan),

            showValue(item.keterangan)
        ];


        data.forEach((value, index) => {
            const cell = create(
                'td',
                index === 0
                    ? 'aem-kib-center'
                    : '',
                value
            );

            dataRow.appendChild(cell);
        });

        tbody.appendChild(dataRow);

        table.append(
            thead,
            tbody
        );

        scroll.appendChild(table);

        sheet.appendChild(scroll);


        /* ==============================================
           TANPA BAGIAN PENGESAHAN / TTD

           Setelah tabel langsung ditampilkan.
           Tidak ada Direktur Umum,
           Manajer Keuangan,
           Asisten Manajer Aset,
           ataupun Staf Aset.
        ============================================== */

        body.appendChild(sheet);


        /* ==============================================
           FOTO DAN DOKUMEN PENDUKUNG
        ============================================== */

        const attachments = create(
            'section',
            'aem-kib-attachments'
        );

        attachments.appendChild(
            create(
                'h3',
                '',
                'Foto dan Dokumen Pendukung'
            )
        );

        const links = create(
            'div',
            'aem-kib-file-links'
        );


        /* MEMBUAT LINK FILE */

        function addLink(
            url,
            name,
            iconName
        ) {
            if (!url) return;

            const link = create(
                'a',
                'aem-kib-file'
            );

            link.href = url;
            link.target = '_blank';

            link.rel =
                'noopener noreferrer';

            const icon = create('i');

            icon.setAttribute(
                'data-lucide',
                iconName
            );

            link.append(
                icon,
                create('span', '', name)
            );

            links.appendChild(link);
        }


        /* FOTO UTAMA */

        addLink(
            item.foto_url,
            'Lihat Foto Utama',
            'image'
        );


        /* DOKUMEN PDF / GAMBAR */

        array(item.dokumens).forEach(doc => {
            if (!doc.url) return;

            const fileName =
                doc.nama || 'Lampiran';

            const isPdf = /\.pdf$/i.test(
                fileName
            );

            addLink(
                doc.url,
                fileName,
                isPdf
                    ? 'file-text'
                    : 'image'
            );
        });


        /* JIKA TIDAK ADA LAMPIRAN */

        if (!links.childElementCount) {
            links.appendChild(
                create(
                    'p',
                    '',
                    'Belum ada foto atau dokumen pendukung.'
                )
            );
        }

        attachments.appendChild(links);

        body.appendChild(attachments);


        /* BUKA POPUP DETAIL */

        showDialog(detailDialog);

        icons();
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

    let groupController = null;
    let searchTimer = null;


    function groupKey(location, division) {
        return JSON.stringify([
            location,
            division
        ]);
    }


    function groupError(message) {
        const node = $('aemGroupAlert');

        if (!node) return;

        node.textContent = message || '';
        node.hidden = !message;
    }


    /* ======================================================
       BUKA DETAIL KELOMPOK
    ====================================================== */

    function openGroup(location, division) {
        if (!groupDialog || !groupUrl) {
            toast(
                'Route Detail Kelompok belum tersedia.'
            );

            return;
        }

        groupState.lokasi =
            String(location ?? '').trim() ||
            'Tanpa Lokasi';

        groupState.divisi =
            String(division ?? '').trim() ||
            'Tanpa Divisi';

        groupState.q = '';
        groupState.page = 1;

        $('aemGroupItemSearch').value = '';
        $('aemGroupSearch').value = '';

        showDialog(groupDialog);

        loadGroup();
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

        const groups =
            groupState.groups.filter(group =>
                normalize(
                    `${group.lokasi} ${group.divisi}`
                ).includes(search)
            );

        if (!groups.length) {
            container.appendChild(
                create(
                    'div',
                    'aem-empty',
                    'Tidak ada kelompok yang cocok.'
                )
            );

            return;
        }


        /* KELOMPOKKAN BERDASARKAN LOKASI */

        const locations = new Map();

        groups.forEach(group => {
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


        locations.forEach((children, location) => {
            const section = create(
                'div',
                'aem-group-location'
            );

            const title = create(
                'div',
                'aem-group-location-title'
            );

            const folder = create('i');

            folder.setAttribute(
                'data-lucide',
                'folder'
            );

            title.append(
                folder,
                create(
                    'span',
                    '',
                    location
                )
            );

            section.appendChild(title);


            /* DAFTAR DIVISI */

            children.forEach(group => {
                const button = create(
                    'button',
                    'aem-group-select'
                );

                button.type = 'button';

                const selected =
                    groupState.selected &&
                    groupKey(
                        groupState.selected.lokasi,
                        groupState.selected.divisi
                    ) === groupKey(
                        group.lokasi,
                        group.divisi
                    );

                if (selected) {
                    button.classList.add(
                        'active'
                    );
                }

                button.setAttribute(
                    'aria-pressed',
                    String(Boolean(selected))
                );

                button.append(
                    create(
                        'span',
                        '',
                        group.divisi
                    ),

                    create(
                        'span',
                        '',
                        group.jumlah
                    )
                );


                button.addEventListener(
                    'click',
                    () => {
                        groupState.lokasi =
                            group.lokasi;

                        groupState.divisi =
                            group.divisi;

                        groupState.q = '';
                        groupState.page = 1;

                        $('aemGroupItemSearch').value =
                            '';

                        loadGroup();
                    }
                );

                section.appendChild(button);
            });

            container.appendChild(section);
        });

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
            const row = create('tr');

            addCell(
                row,
                'Tidak ada aset pada kelompok ini.',
                'aem-empty'
            ).colSpan = 6;

            body.appendChild(row);

            return;
        }

        const first = Number(
            groupState.pagination?.from || 1
        );


        items.forEach((item, index) => {
            const row = create('tr');


            /* NOMOR */

            addCell(
                row,
                first + index,
                'aem-center'
            );


            /* NAMA BARANG */

            const name = create('div');

            name.appendChild(
                create(
                    'strong',
                    '',
                    item.nama_aset || '—'
                )
            );

            addCell(row, name);


            /* KODE BARANG */

            addCell(
                row,
                showValue(item.kode_inventaris)
            );


            /* REGISTER */

            addCell(
                row,
                showValue(item.nomor_register)
            );


            /* FOTO */

            const photoBox = create('div');

            function noPhoto() {
                return create(
                    'div',
                    'aem-group-no-photo',
                    'Tanpa foto'
                );
            }

            if (item.foto_url) {
                const image = create(
                    'img',
                    'aem-group-thumb'
                );

                image.src = item.foto_url;

                image.alt =
                    'Foto ' +
                    (item.nama_aset || 'aset');

                image.onerror = () => {
                    image.replaceWith(
                        noPhoto()
                    );
                };

                photoBox.appendChild(image);

            } else {
                photoBox.appendChild(
                    noPhoto()
                );
            }

            addCell(
                row,
                photoBox,
                'aem-center'
            );


            /* TOMBOL VIEW */

            const view = create(
                'button',
                'aem-icon view'
            );

            view.type = 'button';

            view.title =
                'Lihat Detail Excel KIB E';

            view.dataset.aemAction = 'view';

            view.dataset.id =
                String(item.id);

            view.setAttribute(
                'aria-label',
                `Lihat detail ${item.nama_aset || 'aset'}`
            );

            const eye = create('i');

            eye.setAttribute(
                'data-lucide',
                'eye'
            );

            view.appendChild(eye);

            addCell(
                row,
                view,
                'aem-center'
            );

            body.appendChild(row);
        });

        icons();
    }


    /* ======================================================
       AMBIL DATA DETAIL KELOMPOK
    ====================================================== */

    async function loadGroup() {
        if (!groupDialog || !groupUrl) {
            return;
        }

        groupController?.abort();

        const controller =
            new AbortController();

        groupController = controller;

        groupError('');

        const body = $('aemGroupRows');

        const loader = create('tr');

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
                `${groupUrl}?${query.toString()}`,
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

            groupState.groups =
                array(result.groups);

            groupState.selected =
                result.selected || null;

            groupState.pagination =
                result.pagination || {};


            /* KELOMPOK TERPILIH */

            if (result.selected) {
                groupState.lokasi =
                    result.selected.lokasi;

                groupState.divisi =
                    result.selected.divisi;

                $('aemGroupTitle').textContent =
                    result.selected.divisi;

                $('aemGroupSubtitle').textContent =
                    'Lokasi: ' +
                    result.selected.lokasi;

            } else {
                $('aemGroupTitle').textContent =
                    'Belum ada kelompok aset';

                $('aemGroupSubtitle').textContent =
                    'Tambahkan data manual terlebih dahulu.';
            }


            /* PAGINATION */

            const pagination =
                groupState.pagination;

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
                array(result.items)
            );

        } catch (exception) {
            if (exception.name === 'AbortError') {
                return;
            }

            groupError(
                exception.message ||
                'Tidak dapat memuat kelompok.'
            );

            body.replaceChildren();
        }
    }


    /* ======================================================
       TUTUP KELOMPOK
    ====================================================== */

    function closeGroup() {
        hideDialog(groupDialog);
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
            groupController?.abort();

            clearTimeout(searchTimer);
        }
    );


    /* ======================================================
       PENCARIAN KELOMPOK
    ====================================================== */

    $('aemGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );


    $('aemGroupItemSearch')?.addEventListener(
        'input',
        event => {
            clearTimeout(searchTimer);

            const search =
                event.target.value.trim();

            searchTimer = setTimeout(
                () => {
                    groupState.q = search;
                    groupState.page = 1;

                    loadGroup();
                },
                300
            );
        }
    );


    $('aemGroupRefresh')?.addEventListener(
        'click',
        () => {
            clearTimeout(searchTimer);

            groupState.q = '';
            groupState.page = 1;

            $('aemGroupItemSearch').value =
                '';

            loadGroup();
        }
    );


    /* ======================================================
       PAGINATION KELOMPOK
    ====================================================== */

    $('aemGroupPrev')?.addEventListener(
        'click',
        () => {
            if (groupState.page > 1) {
                groupState.page--;

                loadGroup();
            }
        }
    );


    $('aemGroupNext')?.addEventListener(
        'click',
        () => {
            const lastPage =
                groupState.pagination?.last_page ||
                1;

            if (groupState.page < lastPage) {
                groupState.page++;

                loadGroup();
            }
        }
    );


    /* ======================================================
       TOMBOL AKSI TABEL
    ====================================================== */

    root.addEventListener(
        'click',
        async event => {
            if (
                !(event.target instanceof Element)
            ) {
                return;
            }

            const button =
                event.target.closest(
                    'button[data-aem-action]'
                );

            if (
                !button ||
                !root.contains(button) ||
                button.disabled
            ) {
                return;
            }

            const action =
                button.dataset.aemAction;

            const id =
                button.dataset.id;

            if (
                !/^\d+$/.test(
                    String(id)
                )
            ) {
                toast('ID aset tidak valid.');
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


            /* HAPUS DATA */

            if (action === 'delete') {
                confirmDelete(
                    id,
                    button.dataset.name
                );

                return;
            }


            /* VIEW DAN EDIT */

            if (
                !['view', 'edit'].includes(action)
            ) {
                return;
            }

            button.disabled = true;

            try {
                const item =
                    await fetchItem(id);

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
        }
    );


    /* ======================================================
       EDIT DARI DETAIL
    ====================================================== */

    $('aemEditDetail')?.addEventListener(
        'click',
        () => {
            if (!current) return;

            const item = current;

            hideDialog(detailDialog);

            editForm(item);
        }
    );


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


    $('aemDeleteDetail')?.addEventListener(
        'click',
        () => {
            if (!current) return;

            confirmDelete(
                current.id,
                current.nama_aset
            );
        }
    );


    /* ======================================================
       HAPUS KE DATABASE
    ====================================================== */

    $('aemConfirmDelete')?.addEventListener(
        'click',
        async () => {
            if (!deleteId || deleting) {
                return;
            }

            deleting = true;

            const button =
                $('aemConfirmDelete');

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


    deleteDialog?.addEventListener(
        'close',
        () => {
            if (!deleting) {
                deleteId = null;
            }
        }
    );


    /* ======================================================
       VALIDASI KONDISI BARANG
    ====================================================== */

    function validateCondition() {
        const input = $('aemKondisi');

        if (!input) return true;

        input.value = String(
            input.value ?? ''
        )
            .trim()
            .toUpperCase();

        const allowed = [
            'BAIK',
            'KURANG BAIK',
            'RUSAK BERAT',

            // Nilai lama
            'CUKUP',
            'RUSAK RINGAN'
        ];

        const valid =
            allowed.includes(input.value);

        input.setCustomValidity(
            valid
                ? ''
                : 'Pilih BAIK, KURANG BAIK, atau RUSAK BERAT.'
        );

        if (!valid) {
            input.reportValidity();
        }

        return valid;
    }


    /* ======================================================
       SIMPAN TAMBAH / EDIT
    ====================================================== */

    form?.addEventListener(
        'submit',
        async event => {
            event.preventDefault();

            if (saving) return;

            showError('');

            if (!validateCondition()) {
                return;
            }

            if (!form.reportValidity()) {
                return;
            }

            saving = true;

            const button = $('aemSave');

            button.disabled = true;


            /* FORM DATA */

            const data = new FormData(form);


            /* LAMPIRAN BARU */

            data.delete('dokumens[]');

            addedFiles.forEach(file => {
                data.append(
                    'dokumens[]',
                    file,
                    file.name
                );
            });


            /* UPDATE MENGGUNAKAN PUT */

            if (editId !== null) {
                data.set(
                    '_method',
                    'PUT'
                );
            }

            const url = editId !== null
                ? `${base}/${encodeURIComponent(editId)}`
                : base;


            try {
                await api(
                    url,
                    {
                        method: 'POST',
                        body: data
                    }
                );

                window.location.assign(base);

            } catch (exception) {
                showError(exception.message);

                saving = false;

                button.disabled = false;
            }
        }
    );


    /* ======================================================
       INITIALIZE
    ====================================================== */

    initClock();

    initCombos();

    icons();

})();
    