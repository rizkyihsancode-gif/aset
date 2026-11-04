
/*
|--------------------------------------------------------------------------
| SISTEM ASET — K.I.B E ASET TETAP LAINNYA
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| Fitur:
| - Create, View, Update, Delete
| - Searchable dropdown
| - Master Data Lokasi, Departemen, Divisi, Bahan
| - Multiple PDF dan gambar
| - Hapus lampiran tersimpan
| - Jam WITA
| - Arsip data lama read-only
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    /*
    |--------------------------------------------------------------------------
    | INISIALISASI
    |--------------------------------------------------------------------------
    */

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

    const base = (root.dataset.base || '').replace(/\/$/, '');
    const token = root.dataset.token;

    const normalize = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');


    /*
    |--------------------------------------------------------------------------
    | DATA MASTER DARI BLADE
    |--------------------------------------------------------------------------
    */

    function readJson(id, fallback) {
        try {
            const text = $(id)?.textContent || '';

            return JSON.parse(text) || fallback;
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

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const combos = new Map();

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

    let addedFiles = [];

    let saving = false;
    let deleting = false;

    let toastTimer;


    /*
    |--------------------------------------------------------------------------
    | ICON LUCIDE
    |--------------------------------------------------------------------------
    */

    function refreshIcons() {
        window.lucide?.createIcons?.();
    }


    /*
    |--------------------------------------------------------------------------
    | MODAL
    |--------------------------------------------------------------------------
    */

    function showDialog(dialog) {
        if (
            dialog &&
            !dialog.open &&
            typeof dialog.showModal === 'function'
        ) {
            dialog.showModal();
        }

        refreshIcons();
    }

    function hideDialog(dialog) {
        if (dialog?.open) {
            dialog.close();
        }
    }


    /*
    |--------------------------------------------------------------------------
    | NOTIFIKASI
    |--------------------------------------------------------------------------
    */

    function showToast(message) {
        const element = $('aemToast');

        if (!element) {
            console.warn(message);
            return;
        }

        element.textContent = message;
        element.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.hidden = true;
        }, 4000);
    }


    /*
    |--------------------------------------------------------------------------
    | ERROR VALIDASI FORM
    |--------------------------------------------------------------------------
    */

    function showError(message) {
        const element = $('aemError');

        if (!element) {
            return;
        }

        element.textContent = message || '';
        element.hidden = !message;

        if (message) {
            element.scrollIntoView({
                block: 'nearest'
            });
        }
    }


    /*
    |--------------------------------------------------------------------------
    | API LARAVEL
    |--------------------------------------------------------------------------
    */

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

            const details = data.errors
                ? Object.values(data.errors)
                    .flat()
                    .join('\n')
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
                    'Sesi login habis. Silakan refresh halaman.';
            }

            if (response.status === 403) {
                message =
                    'Akun tidak memiliki izin untuk melakukan tindakan ini.';
            }

            throw new Error(message);
        }

        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | JAM WITA
    |--------------------------------------------------------------------------
    */

    function initializeClock() {
        const dateElement = $('aemDate');
        const timeElement = $('aemTime');

        if (!dateElement || !timeElement) {
            return;
        }

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

        function updateClock() {
            const now = new Date();

            const date = dateFormatter.format(now);

            dateElement.textContent =
                date.charAt(0).toUpperCase() +
                date.slice(1);

            timeElement.textContent = timeFormatter
                .format(now)
                .replace(/\./g, ':');
        }

        updateClock();

        setInterval(updateClock, 1000);
    }


    /*
    |--------------------------------------------------------------------------
    | TUTUP MODAL
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll('[data-aem-close]')
        .forEach(button => {

            button.addEventListener('click', () => {

                hideDialog(
                    $(button.dataset.aemClose)
                );
            });
        });


    /*
    |--------------------------------------------------------------------------
    | SEARCHABLE DROPDOWN
    |--------------------------------------------------------------------------
    | Data Master hanya digunakan sebagai pilihan.
    | Nilai akhir tetap berupa teks manual.
    |--------------------------------------------------------------------------
    */

    const predefined = {

        kondisi: [
            {
                value: 'BAIK',
                label: 'Baik'
            },
            {
                value: 'CUKUP',
                label: 'Cukup'
            },
            {
                value: 'RUSAK RINGAN',
                label: 'Rusak Ringan'
            },
            {
                value: 'RUSAK BERAT',
                label: 'Rusak Berat'
            }
        ],

        asal: [
            {
                value: 'PEMBELIAN',
                label: 'Pembelian'
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


    /*
    |--------------------------------------------------------------------------
    | AMBIL PILIHAN BERDASARKAN JENIS
    |--------------------------------------------------------------------------
    */

    function getOptions(source) {
        let list = [];

        if (source === 'lokasi') {

            list = (master.lokasi || []).map(row => ({
                value: row.lokasi,
                label: row.alamat || '',
                ref: row
            }));

        } else if (source === 'departemen') {

            list = (master.departemen || []).map(row => ({
                value: row.nama_dep,
                label: '',
                ref: row
            }));

        } else if (source === 'bahan') {

            list = (master.bahan || []).map(row => ({
                value: row.nama,
                label: '',
                ref: row
            }));

        } else if (source === 'divisi') {

            /*
             * Filter divisi berdasarkan departemen.
             */

            const selectedDepartment = normalize(
                $('aemDep')?.value
            );

            const department = (
                master.departemen || []
            ).find(row =>
                normalize(row.nama_dep) ===
                selectedDepartment
            );

            const available = department
                ? (master.divisi || []).filter(row =>
                    String(row.id_dep) ===
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
                    ...(history.divisi || []).map(
                        value => ({
                            value,
                            label: ''
                        })
                    )
                );
            }

        } else if (source === 'asal') {

            list = [...predefined.asal];

        } else if (source === 'kondisi') {

            list = [...predefined.kondisi];
        }


        /*
         * Gabungkan pilihan dengan data manual
         * yang pernah disimpan.
         */

        let extra = [];

        if (source === 'lokasi') {
            extra = history.lokasi || [];
        }

        if (source === 'departemen') {
            extra = history.departemen || [];
        }

        if (source === 'bahan') {
            extra = history.bahan || [];
        }

        if (source === 'asal') {
            extra = history.asal_perolehan || [];
        }

        if (Array.isArray(extra)) {

            list.push(
                ...extra.map(value => ({
                    value: String(value),
                    label: ''
                }))
            );
        }


        /*
         * Hilangkan duplikasi.
         */

        const known = new Set();

        return list.filter(option => {

            const key = normalize(option.value);

            if (!key || known.has(key)) {
                return false;
            }

            known.add(key);

            return true;
        });
    }


    /*
    |--------------------------------------------------------------------------
    | INISIALISASI CUSTOM COMBOBOX
    |--------------------------------------------------------------------------
    */

    function initializeComboboxes() {
        if (!form) {
            return;
        }

        form
            .querySelectorAll('[data-aem-combo]')
            .forEach(input => {

                const source = input.dataset.aemCombo;

                /*
                 * Bungkus input dengan elemen dropdown.
                 */

                const wrapper =
                    document.createElement('div');

                wrapper.className = 'aem-combo';

                input.parentNode.insertBefore(
                    wrapper,
                    input
                );

                wrapper.appendChild(input);


                /*
                 * Tombol panah.
                 */

                const arrow =
                    document.createElement('button');

                arrow.type = 'button';
                arrow.className = 'aem-combo-arrow';

                arrow.setAttribute(
                    'aria-label',
                    'Buka pilihan'
                );

                arrow.textContent = '⌄';


                /*
                 * Panel pilihan.
                 */

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


                /*
                 * State dropdown.
                 */

                let shown = [];
                let active = -1;


                function closeMenu() {
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


                /*
                 * Memilih opsi.
                 */

                function choose(item) {
                    input.value = String(item.value);

                    input.setCustomValidity('');


                    /*
                     * Isi alamat otomatis jika lokasi
                     * dipilih dari Master Data.
                     */

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

                    closeMenu();

                    input.focus({
                        preventScroll: true
                    });
                }


                /*
                 * Tampilkan pilihan.
                 */

                function render(showAll = false) {

                    combos.forEach((widget, id) => {

                        if (id !== input.id) {
                            widget.close();
                        }
                    });

                    const filter = showAll
                        ? ''
                        : normalize(input.value);

                    shown = getOptions(source)
                        .filter(item => normalize(
                            item.value +
                            ' ' +
                            (item.label || '')
                        ).includes(filter))
                        .slice(0, 150);

                    panel.replaceChildren();

                    active = -1;


                    /*
                     * Tidak ditemukan.
                     */

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


                    /*
                     * Daftar opsi.
                     */

                    shown.forEach((item, index) => {

                        const button =
                            document.createElement('button');

                        button.type = 'button';
                        button.className = 'aem-combo-item';

                        button.id =
                            `${panel.id}-item-${index}`;

                        button.setAttribute(
                            'role',
                            'option'
                        );

                        const title =
                            document.createElement('strong');

                        title.textContent = item.value;

                        button.appendChild(title);

                        if (item.label) {

                            const subtitle =
                                document.createElement('small');

                            subtitle.textContent = item.label;

                            button.appendChild(subtitle);
                        }

                        button.addEventListener(
                            'mousedown',
                            event => {
                                event.preventDefault();
                            }
                        );

                        button.addEventListener(
                            'click',
                            () => choose(item)
                        );

                        panel.appendChild(button);
                    });


                    /*
                     * Buka panel.
                     */

                    panel.hidden = false;

                    wrapper.classList.add('opened');

                    input.setAttribute(
                        'aria-expanded',
                        'true'
                    );


                    /*
                     * Jika ruang di bawah tidak cukup,
                     * tampilkan dropdown ke atas.
                     */

                    const rect =
                        wrapper.getBoundingClientRect();

                    wrapper.classList.toggle(
                        'up',
                        window.innerHeight - rect.bottom < 190 &&
                        rect.top > 230
                    );
                }


                /*
                 * Fokus input.
                 */

                input.addEventListener('focus', () => {

                    if (panel.hidden) {
                        render(true);
                    }
                });


                /*
                 * Pencarian realtime.
                 */

                input.addEventListener('input', () => {

                    input.setCustomValidity('');

                    render(false);
                });


                /*
                 * Tombol panah dropdown.
                 */

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

                        closeMenu();
                    }
                });


                /*
                 * Navigasi keyboard.
                 */

                input.addEventListener(
                    'keydown',
                    event => {

                        if (event.key === 'Escape') {

                            if (!panel.hidden) {
                                event.preventDefault();
                                closeMenu();
                            }

                        } else if (
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

                                active = (
                                    active +
                                    direction +
                                    shown.length
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

                        } else if (
                            event.key === 'Enter' &&
                            !panel.hidden &&
                            active >= 0
                        ) {

                            event.preventDefault();

                            choose(shown[active]);

                        } else if (
                            event.key === 'Tab'
                        ) {

                            closeMenu();
                        }
                    }
                );


                /*
                 * Simpan instance dropdown.
                 */

                combos.set(input.id, {
                    close: closeMenu,
                    render,
                    wrapper
                });

            });


        /*
         * Tutup saat klik di luar.
         */

        document.addEventListener('pointerdown', event => {

            combos.forEach(widget => {

                if (!widget.wrapper.contains(event.target)) {
                    widget.close();
                }
            });
        });


        /*
         * Jika Departemen berubah,
         * reset Divisi agar tidak salah pasangan.
         */

        $('aemDep')?.addEventListener('change', () => {

            if ($('aemDiv').value) {
                $('aemDiv').value = '';
            }

            combos.get('aemDiv')?.close();
        });
    }


    /*
    |--------------------------------------------------------------------------
    | RESET DOKUMEN
    |--------------------------------------------------------------------------
    */

    function resetDocuments() {
        addedFiles = [];

        $('aemDocsInput').value = '';

        $('aemSelectedDocs').replaceChildren();

        $('aemSavedDocs').replaceChildren();
    }


    /*
    |--------------------------------------------------------------------------
    | FILE BARU YANG DIPILIH
    |--------------------------------------------------------------------------
    */

    function renderNewDocuments() {
        const container = $('aemSelectedDocs');

        container.replaceChildren();

        if (!addedFiles.length) {
            return;
        }

        const heading = document.createElement('strong');

        heading.textContent =
            `${addedFiles.length} lampiran baru`;

        container.appendChild(heading);


        addedFiles.forEach((file, index) => {

            const row = document.createElement('div');

            row.className = 'aem-file-row';


            const label = document.createElement('span');

            label.textContent =
                `${file.name} (${(file.size / 1048576).toFixed(2)} MB)`;


            const remove = document.createElement('button');

            remove.type = 'button';
            remove.textContent = 'Batalkan';
            remove.className = 'aem-link';

            remove.addEventListener('click', () => {

                addedFiles.splice(index, 1);

                renderNewDocuments();
            });


            row.append(label, remove);

            container.appendChild(row);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | PILIH FILE BERULANG
    |--------------------------------------------------------------------------
    */

    $('aemDocsInput')?.addEventListener(
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

            renderNewDocuments();
        }
    );


    /*
    |--------------------------------------------------------------------------
    | LAMPIRAN TERSIMPAN
    |--------------------------------------------------------------------------
    */

    function renderSavedDocuments(documents) {
        const container = $('aemSavedDocs');

        container.replaceChildren();

        if (!documents?.length) {
            return;
        }

        const heading = document.createElement('strong');

        heading.textContent =
            'Lampiran yang sudah tersimpan:';

        container.appendChild(heading);


        documents.forEach(doc => {

            const row = document.createElement('div');

            row.className = 'aem-file-row';


            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            link.textContent = doc.nama;

            row.appendChild(link);


            /*
             * Checkbox untuk menghapus lampiran.
             */

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

            row.appendChild(label);

            container.appendChild(row);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE — BUKA FORM TAMBAH
    |--------------------------------------------------------------------------
    */

    function addForm() {

        editId = null;
        current = null;
        saving = false;

        form.reset();

        $('aemKondisi').setCustomValidity('');

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


    /*
    |--------------------------------------------------------------------------
    | UPDATE — BUKA FORM EDIT
    |--------------------------------------------------------------------------
    */

    function editForm(item) {

        editId = Number(item.id);
        current = item;
        saving = false;

        form.reset();

        $('aemKondisi').setCustomValidity('');

        resetDocuments();
        showError('');


        /*
         * Isi seluruh field dari database.
         */

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

        $('aemSave').textContent =
            'Simpan Perubahan';


        combos.forEach(widget => widget.close());

        showDialog(formDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | TOMBOL TAMBAH ASET
    |--------------------------------------------------------------------------
    */

    $('aemAdd')?.addEventListener(
        'click',
        addForm
    );


    /*
    |--------------------------------------------------------------------------
    | HELPER ELEMEN DETAIL
    |--------------------------------------------------------------------------
    */

    function textElement(tag, value) {
        const element = document.createElement(tag);

        element.textContent =
            value === null ||
            value === undefined ||
            value === ''
                ? '—'
                : String(value);

        return element;
    }


    /*
    |--------------------------------------------------------------------------
    | READ — VIEW DETAIL
    |--------------------------------------------------------------------------
    */

    function detail(item) {
        current = item;

        const body = $('aemDetailBody');

        body.replaceChildren();

        $('aemDetailTitle').textContent =
            item.nama_aset || 'Detail Inventaris';


        /*
         * Grid informasi lengkap.
         */

        const grid = document.createElement('div');

        grid.className = 'aem-detail-grid';

        const details = [
            ['Nama Aset', item.nama_aset],
            ['Kode Inventaris', item.kode_inventaris],
            ['Nomor Register', item.nomor_register],
            ['Lokasi', item.lokasi],
            ['Alamat', item.alamat],
            ['Departemen', item.departemen],
            ['Divisi', item.divisi],
            ['Bahan', item.bahan],
            ['Tahun Pengadaan', item.tahun],
            ['Jumlah Unit', item.jumlah_unit],
            ['Kondisi', item.kondisi],
            ['Asal Perolehan', item.asal_perolehan]
        ];


        for (const [label, value] of details) {

            const cell = document.createElement('div');

            cell.append(
                textElement('small', label),
                textElement('strong', value)
            );

            grid.appendChild(cell);
        }


        body.appendChild(grid);


        /*
         * Keterangan.
         */

        body.append(
            textElement('h3', 'Keterangan'),
            textElement('p', item.keterangan)
        );


        /*
         * Foto.
         */

        if (item.foto_url) {

            const photo = document.createElement('img');

            photo.className = 'aem-photo';

            photo.src = item.foto_url;

            photo.alt = 'Foto Aset';

            body.appendChild(photo);
        }


        /*
         * Lampiran.
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


        for (const doc of (item.dokumens || [])) {

            const link = document.createElement('a');

            link.href = doc.url;

            link.textContent = doc.nama;

            link.target = '_blank';

            link.rel = 'noopener noreferrer';

            link.className = 'aem-btn outline';

            documents.appendChild(link);
        }


        body.appendChild(documents);

        showDialog(detailDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | AMBIL DETAIL DARI CONTROLLER
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | AKSI CRUD DARI TABEL
    |--------------------------------------------------------------------------
    */

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


        /*
         * DELETE
         */

        if (action === 'delete') {

            confirmDelete(
                id,
                button.dataset.name
            );

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

                detail(item);
            }

        } catch (exception) {

            showToast(exception.message);

        } finally {

            button.disabled = false;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | EDIT DARI MODAL DETAIL
    |--------------------------------------------------------------------------
    */

    $('aemEditDetail')?.addEventListener(
        'click',
        () => {

            if (!current) {
                return;
            }

            const item = current;

            hideDialog(detailDialog);

            editForm(item);
        }
    );


    /*
    |--------------------------------------------------------------------------
    | MODAL KONFIRMASI HAPUS
    |--------------------------------------------------------------------------
    */

    function confirmDelete(id, name) {
        deleteId = Number(id);

        $('aemDeleteName').textContent =
            name || `Aset #${id}`;

        hideDialog(detailDialog);

        showDialog(deleteDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | HAPUS DARI DETAIL
    |--------------------------------------------------------------------------
    */

    $('aemDeleteDetail')?.addEventListener(
        'click',
        () => {

            if (current) {

                confirmDelete(
                    current.id,
                    current.nama_aset
                );
            }
        }
    );


    /*
    |--------------------------------------------------------------------------
    | DELETE — REQUEST KE CONTROLLER
    |--------------------------------------------------------------------------
    */

    $('aemConfirmDelete')?.addEventListener(
        'click',
        async () => {

            if (!deleteId || deleting) {
                return;
            }

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

                window.location.reload();

            } catch (exception) {

                showToast(exception.message);

                deleting = false;
                button.disabled = false;
            }
        }
    );


    /*
    |--------------------------------------------------------------------------
    | RESET DELETE STATE
    |--------------------------------------------------------------------------
    */

    deleteDialog?.addEventListener('close', () => {

        if (!deleting) {
            deleteId = null;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | CREATE / UPDATE — SUBMIT FORM
    |--------------------------------------------------------------------------
    */

    form?.addEventListener('submit', async event => {

        event.preventDefault();

        if (saving) {
            return;
        }

        showError('');


        /*
         * Validasi kondisi.
         */

        const input = $('aemKondisi');

        input.value = String(
            input.value
        ).trim().toUpperCase();

        const allowed = [
            'BAIK',
            'CUKUP',
            'RUSAK RINGAN',
            'RUSAK BERAT'
        ];

        input.setCustomValidity(
            allowed.includes(input.value)
                ? ''
                : 'Pilih kondisi yang tersedia.'
        );


        if (!form.reportValidity()) {
            return;
        }


        saving = true;

        const save = $('aemSave');

        save.disabled = true;


        /*
         * Ambil seluruh form.
         */

        const data = new FormData(form);


        /*
         * Lampiran baru dikirim dari array.
         */

        data.delete('dokumens[]');

        addedFiles.forEach(file => {

            data.append(
                'dokumens[]',
                file,
                file.name
            );
        });


        /*
         * Edit memakai POST + method spoofing PUT.
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
             * Refresh ke data manual.
             */

            window.location.assign(base);

        } catch (exception) {

            showError(exception.message);

            saving = false;
            save.disabled = false;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | INITIALIZATION
    |--------------------------------------------------------------------------
    */

    initializeClock();
    initializeComboboxes();
    refreshIcons();

})();
