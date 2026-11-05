
/*
|--------------------------------------------------------------------------
| K.I.B F — KONSTRUKSI MANUAL
| SISTEM ASET PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| TABEL AWAL:
| 9 Kolom:
| No, Nama Barang, Kategori, Cakupan,
| Tahun, Lokasi, Status, Nilai, Aksi
|
| MODUL:
| - Create / Tambah
| - Read / View Detail Lengkap
| - Update / Edit
| - Delete / Hapus
| - Searchable Dropdown
| - Master Data Lokasi, Departemen, Divisi
| - Upload Multiple PDF dan Gambar
| - Penghapusan Lampiran Terpilih
| - Jam WITA
|
| CONTROLLER: KIBController.php
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    /*
    |--------------------------------------------------------------------------
    | ELEMENT ROOT
    |--------------------------------------------------------------------------
    */

    const root = document.getElementById('kfApp');

    if (!root || root.dataset.initialized === '1') {
        return;
    }

    root.dataset.initialized = '1';

    const $ = id => document.getElementById(id);

    const base = (root.dataset.base || '').replace(/\/$/, '');
    const token = root.dataset.token;

    const form = $('kfForm');
    const formDialog = $('kfModalForm');
    const detailDialog = $('kfModalDetail');
    const deleteDialog = $('kfModalDelete');

    /*
    |--------------------------------------------------------------------------
    | FIELD FORM
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | STATE CRUD
    |--------------------------------------------------------------------------
    */

    let active = null;
    let editId = null;
    let deleteTarget = null;

    let saving = false;
    let deleting = false;

    let newFiles = [];
    let toastTimer = null;

    /*
    |--------------------------------------------------------------------------
    | FORMAT
    |--------------------------------------------------------------------------
    */

    const money = value => {
        const number = Number(value) || 0;

        return 'Rp ' + number.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const normalize = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');

    const upper = value => String(value ?? '')
        .trim()
        .toUpperCase();

    const categories = ['IPA', 'BOOSTER', 'PERPIPAAN'];

    const validBangunan = ['P', 'SP', 'D'];

    const validStruktur = [
        'BERTINGKAT',
        'TIDAK BERTINGKAT'
    ];

    const validMaterial = [
        'BETON',
        'TIDAK BETON'
    ];


    /*
    |--------------------------------------------------------------------------
    | PARSE JSON DARI BLADE
    |--------------------------------------------------------------------------
    */

    function readJson(id, fallback) {
        try {
            const element = $(id);

            if (!element) {
                return fallback;
            }

            const parsed = JSON.parse(element.textContent);

            return parsed ?? fallback;

        } catch (error) {
            console.warn(
                'Gagal membaca data pilihan:',
                id,
                error
            );

            return fallback;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | MASTER DATA
    |--------------------------------------------------------------------------
    */

    const master = readJson('kfMasterOptions', {
        lokasi: [],
        departemen: [],
        divisi: []
    });

    const history = readJson('kfHistoryOptions', {});

    const masterLokasi = Array.isArray(master.lokasi)
        ? master.lokasi
        : [];

    const masterDepartemen = Array.isArray(master.departemen)
        ? master.departemen
        : [];

    const masterDivisi = Array.isArray(master.divisi)
        ? master.divisi
        : [];


    /*
    |--------------------------------------------------------------------------
    | ICON
    |--------------------------------------------------------------------------
    */

    function refreshIcons() {
        if (
            window.lucide &&
            typeof window.lucide.createIcons === 'function'
        ) {
            window.lucide.createIcons();
        }
    }


    /*
    |--------------------------------------------------------------------------
    | JAM WITA
    |--------------------------------------------------------------------------
    */

    function initializeClock() {
        const tanggal = $('kfTanggal');
        const jam = $('kfJam');

        if (!tanggal || !jam) {
            return;
        }

        const tanggalFormat = new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone: 'Asia/Makassar',
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        );

        const jamFormat = new Intl.DateTimeFormat(
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

            const formattedDate = tanggalFormat.format(now);

            tanggal.textContent =
                formattedDate.charAt(0).toUpperCase() +
                formattedDate.slice(1);

            jam.textContent = jamFormat
                .format(now)
                .replace(/\./g, ':');
        }

        updateClock();

        window.setInterval(updateClock, 1000);
    }


    /*
    |--------------------------------------------------------------------------
    | MODAL HELPER
    |--------------------------------------------------------------------------
    */

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
                closeDialog($(button.dataset.kfClose));
            });

        });


    /*
    |--------------------------------------------------------------------------
    | KLIK LUAR MODAL
    |--------------------------------------------------------------------------
    */

    [
        formDialog,
        detailDialog,
        deleteDialog
    ].forEach(dialog => {

        dialog?.addEventListener('click', event => {
            if (event.target !== dialog) {
                return;
            }

            const rect = dialog.getBoundingClientRect();

            const outside =
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom;

            if (outside) {
                closeDialog(dialog);
            }
        });

    });


    /*
    |--------------------------------------------------------------------------
    | TOAST
    |--------------------------------------------------------------------------
    */

    function showToast(message) {
        const node = $('kfToast');

        if (!node) {
            console.warn(message);
            return;
        }

        node.textContent = message;
        node.hidden = false;

        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        toastTimer = window.setTimeout(() => {
            node.hidden = true;
        }, 4000);
    }


    /*
    |--------------------------------------------------------------------------
    | ERROR VALIDASI
    |--------------------------------------------------------------------------
    */

    function showError(message) {
        const node = $('kfError');

        if (!node) {
            return;
        }

        node.textContent = message || '';
        node.hidden = !message;

        if (message) {
            node.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }


    /*
    |--------------------------------------------------------------------------
    | API REQUEST LARAVEL
    |--------------------------------------------------------------------------
    */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                'Accept': 'application/json',
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

        const data = await response.json().catch(() => ({}));

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
                    'Ukuran unggahan melebihi batas konfigurasi server.';
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
                    'Data Konstruksi tidak ditemukan.';
            }

            throw new Error(message);
        }

        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCHABLE DROPDOWN
    |--------------------------------------------------------------------------
    | Dropdown dibuat custom, bukan datalist.
    | Bisa memilih, mencari, dan mengetik nilai manual.
    |--------------------------------------------------------------------------
    */

    const comboWidgets = new Map();

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
            {
                value: 'BERTINGKAT',
                label: 'Bertingkat'
            },
            {
                value: 'TIDAK BERTINGKAT',
                label: 'Tidak Bertingkat'
            }
        ],

        material: [
            {
                value: 'BETON',
                label: 'Beton'
            },
            {
                value: 'TIDAK BETON',
                label: 'Tidak Beton'
            }
        ],

        status_tanah: [
            {
                value: 'Pemkot',
                label: ''
            },
            {
                value: 'Hak Pakai',
                label: ''
            },
            {
                value: 'Milik Perumda',
                label: ''
            }
        ],

        asal: [
            {
                value: 'Pemprov',
                label: ''
            },
            {
                value: 'Pemkot',
                label: ''
            },
            {
                value: 'Perumda',
                label: ''
            },
            {
                value: 'Hibah',
                label: ''
            }
        ],

        status_aset: [
            {
                value: 'Serah Terima',
                label: ''
            },
            {
                value: 'Dalam Pengerjaan',
                label: ''
            },
            {
                value: 'Selesai',
                label: ''
            }
        ]
    };


    /*
    |--------------------------------------------------------------------------
    | PILIHAN DARI DATA MANUAL YANG SUDAH TERSIMPAN
    |--------------------------------------------------------------------------
    */

    function historicalOptions(source) {
        const list = Array.isArray(history[source])
            ? history[source]
            : [];

        return list
            .filter(value => value != null && String(value).trim())
            .map(value => ({
                value: String(value),
                label: '',
                info: null
            }));
    }


    /*
    |--------------------------------------------------------------------------
    | GABUNGKAN DAN HAPUS OPSI DUPLIKAT
    |--------------------------------------------------------------------------
    */

    function uniqueOptions(options) {
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


    /*
    |--------------------------------------------------------------------------
    | AMBIL PILIHAN DROPDOWN
    |--------------------------------------------------------------------------
    */

    function getOptions(source) {
        let options = [];

        if (source === 'lokasi') {

            options = masterLokasi
                .filter(row => row.lokasi)
                .map(row => ({
                    value: String(row.lokasi),
                    label: String(row.alamat || ''),
                    info: row
                }));

            options.push(...historicalOptions('lokasi'));

        } else if (source === 'departemen') {

            options = masterDepartemen
                .filter(row => row.nama_dep)
                .map(row => ({
                    value: String(row.nama_dep),
                    label: '',
                    info: row
                }));

            options.push(...historicalOptions('departemen'));

        } else if (source === 'divisi') {

            const chosenDepartment = normalize(
                $('kfDepartemen')?.value
            );

            const department = masterDepartemen.find(
                row =>
                    normalize(row.nama_dep) === chosenDepartment
            );

            const filtered = department
                ? masterDivisi.filter(
                    row =>
                        String(row.id_dep) === String(department.id)
                )
                : masterDivisi;

            options = filtered
                .filter(row => row.nama_div)
                .map(row => ({
                    value: String(row.nama_div),
                    label: '',
                    info: row
                }));

            // Data historis bebas hanya ditampilkan
            // bila departemen tidak cocok dengan Master.
            if (!department) {
                options.push(...historicalOptions('divisi'));
            }

        } else if (source === 'cakupan') {

            options = historicalOptions('cakupan');

        } else {

            options = predefined[source] || [];

        }

        return uniqueOptions(options);
    }


    /*
    |--------------------------------------------------------------------------
    | TUTUP SEMUA DROPDOWN
    |--------------------------------------------------------------------------
    */

    function closeAllComboboxes(exceptId = null) {
        comboWidgets.forEach((widget, id) => {
            if (id !== exceptId) {
                widget.closeMenu();
            }
        });
    }


    /*
    |--------------------------------------------------------------------------
    | INISIALISASI SEMUA INPUT SEARCHABLE
    |--------------------------------------------------------------------------
    */

    function initializeComboboxes() {
        if (!form) {
            return;
        }

        const inputs = form.querySelectorAll(
            'input[data-kf-combo]'
        );

        inputs.forEach(input => {

            if (input.dataset.ready === '1') {
                return;
            }

            input.dataset.ready = '1';

            const source = input.dataset.kfCombo;

            input.autocomplete = 'off';
            input.setAttribute('role', 'combobox');
            input.setAttribute('aria-autocomplete', 'list');
            input.setAttribute('aria-expanded', 'false');


            /*
             * WRAPPER
             */

            const wrapper = document.createElement('div');

            wrapper.className = 'kf-combo';

            input.parentNode.insertBefore(
                wrapper,
                input
            );

            wrapper.appendChild(input);


            /*
             * TOMBOL PANAH
             */

            const arrow = document.createElement('button');

            arrow.type = 'button';
            arrow.className = 'kf-combo-arrow';

            arrow.setAttribute(
                'aria-label',
                'Tampilkan pilihan'
            );

            arrow.innerHTML = `
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="m6 9 6 6 6-6"></path>
                </svg>
            `;


            /*
             * DAFTAR PILIHAN
             */

            const panel = document.createElement('div');

            panel.id = `${input.id}-options`;
            panel.className = 'kf-combo-options';
            panel.hidden = true;

            panel.setAttribute('role', 'listbox');

            input.setAttribute(
                'aria-controls',
                panel.id
            );

            wrapper.append(arrow, panel);


            /*
             * STATE SATU DROPDOWN
             */

            let visible = false;
            let currentOptions = [];
            let activeIndex = -1;


            /*
             * TUTUP
             */

            function closeMenu() {
                visible = false;

                panel.hidden = true;

                wrapper.classList.remove(
                    'kf-combo-open',
                    'kf-combo-up'
                );

                input.setAttribute(
                    'aria-expanded',
                    'false'
                );

                input.removeAttribute(
                    'aria-activedescendant'
                );
            }


            /*
             * HIGHLIGHT PILIHAN
             */

            function highlight(index) {
                const rows = Array.from(
                    panel.querySelectorAll('.kf-combo-option')
                );

                if (!rows.length) {
                    return;
                }

                activeIndex =
                    (index + rows.length) % rows.length;

                rows.forEach((row, i) => {
                    const chosen = i === activeIndex;

                    row.classList.toggle(
                        'active',
                        chosen
                    );

                    row.setAttribute(
                        'aria-selected',
                        String(chosen)
                    );

                    if (chosen) {
                        input.setAttribute(
                            'aria-activedescendant',
                            row.id
                        );

                        row.scrollIntoView({
                            block: 'nearest'
                        });
                    }
                });
            }


            /*
             * PILIH OPSI
             */

            function selectOption(option) {
                input.value = option.value;

                input.setCustomValidity('');


                /*
                 * Ketika lokasi dipilih dari Master Data,
                 * alamat terisi jika masih kosong.
                 */

                if (
                    source === 'lokasi' &&
                    option.info?.alamat
                ) {
                    const address = $('kfAlamat');

                    if (address && !address.value.trim()) {
                        address.value = String(
                            option.info.alamat
                        );
                    }
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
             * PENEMPATAN DROPDOWN
             */

            function updatePlacement() {
                const rect = wrapper.getBoundingClientRect();

                const bodyRect = $('kfModalForm')
                    ?.getBoundingClientRect();

                const lowerBoundary = Math.min(
                    window.innerHeight - 18,
                    (bodyRect?.bottom ?? window.innerHeight) - 65
                );

                const upperBoundary = Math.max(
                    18,
                    (bodyRect?.top ?? 0) + 60
                );

                const below = lowerBoundary - rect.bottom;
                const above = rect.top - upperBoundary;

                wrapper.classList.toggle(
                    'kf-combo-up',
                    below < 175 && above > below
                );
            }


            /*
             * TAMPILKAN / FILTER PILIHAN
             */

            function renderOptions(showAll = false) {
                closeAllComboboxes(input.id);

                const query = showAll
                    ? ''
                    : normalize(input.value);

                currentOptions = getOptions(source)
                    .filter(option => {
                        const text = normalize(
                            `${option.value} ${option.label}`
                        );

                        return text.includes(query);
                    })
                    .slice(0, 100);

                activeIndex = -1;

                panel.replaceChildren();


                /*
                 * JIKA TIDAK ADA PILIHAN
                 */

                if (currentOptions.length === 0) {
                    const empty = document.createElement('div');

                    empty.className = 'kf-combo-empty';

                    empty.textContent =
                        source === 'kategori'
                            ? 'Pilih IPA, Booster, atau Perpipaan.'
                            : 'Tidak ditemukan. Kamu tetap dapat mengetik nilai baru.';

                    panel.appendChild(empty);
                }


                /*
                 * DAFTAR PILIHAN
                 */

                currentOptions.forEach((option, index) => {
                    const button = document.createElement('button');

                    button.type = 'button';
                    button.className = 'kf-combo-option';

                    button.id = `${panel.id}-${index}`;

                    button.setAttribute(
                        'role',
                        'option'
                    );

                    button.setAttribute(
                        'aria-selected',
                        'false'
                    );

                    const title = document.createElement('strong');

                    title.textContent = option.value;

                    button.appendChild(title);

                    if (
                        option.label &&
                        normalize(option.label) !==
                        normalize(option.value)
                    ) {
                        const subtitle =
                            document.createElement('small');

                        subtitle.textContent = option.label;

                        button.appendChild(subtitle);
                    }

                    button.addEventListener(
                        'mousedown',
                        event => event.preventDefault()
                    );

                    button.addEventListener(
                        'click',
                        () => selectOption(option)
                    );

                    panel.appendChild(button);
                });


                /*
                 * BUKA PANEL
                 */

                visible = true;
                panel.hidden = false;

                wrapper.classList.add('kf-combo-open');

                input.setAttribute(
                    'aria-expanded',
                    'true'
                );

                updatePlacement();
            }


            /*
             * KETIKA PENGGUNA MENGETIK
             */

            input.addEventListener('input', () => {
                input.setCustomValidity('');

                renderOptions(false);
            });


            /*
             * KETIKA INPUT MENDAPAT FOKUS
             */

            input.addEventListener('focus', () => {
                if (!visible) {
                    renderOptions(true);
                }
            });


            /*
             * NAVIGASI KEYBOARD
             */

            input.addEventListener('keydown', event => {

                if (event.key === 'Escape') {

                    if (visible) {
                        event.preventDefault();
                        closeMenu();
                    }

                } else if (event.key === 'ArrowDown') {

                    event.preventDefault();

                    if (!visible) {
                        renderOptions(true);
                    }

                    if (currentOptions.length) {
                        highlight(activeIndex + 1);
                    }

                } else if (event.key === 'ArrowUp') {

                    event.preventDefault();

                    if (!visible) {
                        renderOptions(true);
                    }

                    if (currentOptions.length) {
                        highlight(activeIndex - 1);
                    }

                } else if (
                    event.key === 'Enter' &&
                    visible &&
                    activeIndex >= 0
                ) {

                    event.preventDefault();

                    selectOption(
                        currentOptions[activeIndex]
                    );

                } else if (event.key === 'Tab') {

                    closeMenu();

                }
            });


            /*
             * TOMBOL PANAH
             */

            arrow.addEventListener(
                'mousedown',
                event => event.preventDefault()
            );

            arrow.addEventListener('click', () => {

                if (visible) {

                    closeMenu();

                } else {

                    input.focus({
                        preventScroll: true
                    });

                    if (!visible) {
                        renderOptions(true);
                    }
                }
            });


            /*
             * TUTUP SAAT FOKUS BERPINDAH
             */

            input.addEventListener('blur', () => {
                window.setTimeout(() => {
                    if (!wrapper.contains(document.activeElement)) {
                        closeMenu();
                    }
                }, 0);
            });


            comboWidgets.set(input.id, {
                wrapper,
                closeMenu,
                renderOptions
            });

        });


        /*
         * KLIK DI LUAR DROPDOWN
         */

        document.addEventListener('pointerdown', event => {
            comboWidgets.forEach(widget => {
                if (!widget.wrapper.contains(event.target)) {
                    widget.closeMenu();
                }
            });
        });


        /*
         * DEPARTEMEN BERUBAH
         * UPDATE PILIHAN DIVISI
         */

        $('kfDepartemen')?.addEventListener('input', () => {
            const widget = comboWidgets.get('kfDivisi');

            if (
                widget &&
                widget.wrapper.classList.contains('kf-combo-open')
            ) {
                widget.renderOptions(true);
            }
        });


        $('kfDepartemen')?.addEventListener('change', () => {
            const widget = comboWidgets.get('kfDivisi');

            if (
                widget &&
                widget.wrapper.classList.contains('kf-combo-open')
            ) {
                widget.renderOptions(true);
            }
        });


        /*
         * RESET DROPDOWN SAAT FORM DI-RESET
         */

        form.addEventListener('reset', () => {
            comboWidgets.forEach(widget => {
                widget.closeMenu();
            });
        });

    }


    /*
    |--------------------------------------------------------------------------
    | RESET FILE
    |--------------------------------------------------------------------------
    */

    function resetFiles() {
        newFiles = [];

        const input = $('kfDokumens');

        if (input) {
            input.value = '';
        }

        $('kfSelectedFiles')?.replaceChildren();
        $('kfSavedFiles')?.replaceChildren();
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER LAMPIRAN BARU
    |--------------------------------------------------------------------------
    */

    function renderSelectedFiles() {
        const container = $('kfSelectedFiles');

        if (!container) {
            return;
        }

        container.replaceChildren();

        if (!newFiles.length) {
            return;
        }

        const heading = document.createElement('strong');

        heading.textContent =
            `${newFiles.length} file baru dipilih:`;

        container.appendChild(heading);


        newFiles.forEach((file, index) => {

            const row = document.createElement('div');

            row.className = 'kf-file-row';

            const filename = document.createElement('span');

            filename.textContent =
                `${file.name} — ${(file.size / 1048576).toFixed(2)} MB`;

            const remove = document.createElement('button');

            remove.type = 'button';
            remove.className = 'kf-link';
            remove.textContent = 'Batalkan';

            remove.addEventListener('click', () => {
                newFiles.splice(index, 1);

                renderSelectedFiles();
            });

            row.append(filename, remove);

            container.appendChild(row);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | INPUT MULTIPLE PDF / GAMBAR
    |--------------------------------------------------------------------------
    */

    $('kfDokumens')?.addEventListener('change', event => {

        const selected = Array.from(
            event.target.files || []
        );

        selected.forEach(file => {

            if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
                showToast(
                    `${file.name}: format tidak didukung.`
                );

                return;
            }

            const exists = newFiles.some(old =>
                old.name === file.name &&
                old.size === file.size &&
                old.lastModified === file.lastModified
            );

            if (!exists) {
                newFiles.push(file);
            }
        });

        // Agar bisa memilih file lagi.
        event.target.value = '';

        renderSelectedFiles();
    });


    /*
    |--------------------------------------------------------------------------
    | DOKUMEN YANG SUDAH DISIMPAN
    |--------------------------------------------------------------------------
    */

    function renderSavedFiles(documents) {
        const container = $('kfSavedFiles');

        if (!container) {
            return;
        }

        container.replaceChildren();

        if (!Array.isArray(documents) || !documents.length) {
            return;
        }

        const heading = document.createElement('strong');

        heading.textContent = 'Lampiran tersimpan:';

        container.appendChild(heading);


        documents.forEach(doc => {

            const row = document.createElement('div');

            row.className = 'kf-file-row';

            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            link.textContent = doc.nama || 'Lihat Dokumen';

            row.appendChild(link);


            /*
             * Hapus lampiran saat edit.
             */

            if (doc.id != null) {

                const label = document.createElement('label');

                label.className = 'kf-remove-file';

                const checkbox = document.createElement('input');

                checkbox.type = 'checkbox';
                checkbox.name = 'hapus_dokumen_ids[]';
                checkbox.value = String(doc.id);

                label.append(
                    checkbox,
                    document.createTextNode(' Hapus saat simpan')
                );

                row.appendChild(label);
            }

            container.appendChild(row);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE — FORM TAMBAH KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    function newForm() {
        if (!form) {
            return;
        }

        active = null;
        editId = null;
        saving = false;

        form.reset();
        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Tambah Data Konstruksi';

        const submit = $('kfSimpan');

        submit.disabled = false;
        submit.textContent = 'Simpan Konstruksi';

        $('kfTahun').value =
            new Date().getFullYear();

        openDialog(formDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE — FORM EDIT KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    function editForm(item) {
        if (!form || !item) {
            return;
        }

        active = item;
        editId = Number(item.id);
        saving = false;

        form.reset();
        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Edit Data Konstruksi';


        /*
         * Controller mengembalikan alias field
         * untuk kompatibilitas dengan form.
         */

        const fallback = {
            nama_barang_manual: item.nama_barang,
            lokasi_manual: item.nama_lokasi,
            alamat_manual: item.alamat_lokasi,
            departemen_manual: item.nama_departemen,
            divisi_manual: item.nama_divisi
        };

        fields.forEach(field => {

            const input = form.elements.namedItem(field);

            if (!input) {
                return;
            }

            input.value = String(
                item[field] ??
                fallback[field] ??
                ''
            ).trim();
        });


        renderSavedFiles(item.dokumens || []);

        const submit = $('kfSimpan');

        submit.disabled = false;
        submit.textContent = 'Simpan Perubahan';

        openDialog(formDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | TOMBOL TAMBAH
    |--------------------------------------------------------------------------
    */

    $('kfTambah')?.addEventListener('click', newForm);


    /*
    |--------------------------------------------------------------------------
    | HELPER DOM AMAN
    |--------------------------------------------------------------------------
    */

    function createText(tag, content, className = '') {
        const element = document.createElement(tag);

        element.textContent =
            content == null || content === ''
                ? '—'
                : String(content);

        if (className) {
            element.className = className;
        }

        return element;
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT KATEGORI
    |--------------------------------------------------------------------------
    */

    function formatCategory(value) {
        return {
            IPA: 'Instalasi Pengolahan Air (IPA)',
            BOOSTER: 'Booster',
            PERPIPAAN: 'Perpipaan'
        }[upper(value)] || 'Belum Dikategorikan';
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT JENIS BANGUNAN
    |--------------------------------------------------------------------------
    */

    function formatBuilding(value) {
        return {
            P: 'Permanen',
            SP: 'Semi Permanen',
            D: 'Darurat'
        }[upper(value)] || value || '—';
    }


   
/*
|--------------------------------------------------------------------------
| VIEW DETAIL K.I.B F — FORMAT TABEL MEMANJANG
| Mengikuti susunan Excel Kartu Inventaris Barang.
|--------------------------------------------------------------------------
*/

function showDetail(item) {
    if (!item) return;

    active = item;

    const body = $('kfDetailBody');
    const title = $('kfDetailTitle');

    if (!body || !title) return;

    body.replaceChildren();

    title.textContent =
        item.nama_barang || 'Detail Konstruksi';


    /*
     * HELPER PEMBUATAN ELEMENT AMAN
     */

    function element(tag, className = '', value = null) {
        const node = document.createElement(tag);

        if (className) {
            node.className = className;
        }

        if (value !== null && value !== undefined) {
            node.textContent = String(value);
        }

        return node;
    }

    const display = value => {
        const text = String(value ?? '').trim();
        return text || '—';
    };

    const period = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        month: 'long',
        year: 'numeric'
    }).format(new Date()).toUpperCase();

    const category = {
        IPA: 'Instalasi Pengolahan Air (IPA)',
        BOOSTER: 'Booster',
        PERPIPAAN: 'Perpipaan'
    }[String(item.kategori || '').toUpperCase()]
        || display(item.kategori);

    const building = {
        P: 'Permanen',
        SP: 'Semi Permanen',
        D: 'Darurat'
    }[String(item.type || '').toUpperCase()]
        || display(item.type);


    /*
     * KOP KIB F
     */

    const heading = element('div', 'kf-excel-heading');

    heading.append(
        element(
            'strong',
            '',
            'KARTU INVENTARIS BARANG (KIB) F'
        ),
        element('h3', '', 'KONSTRUKSI'),
        element('span', '', `S/D BULAN ${period}`)
    );

    body.appendChild(heading);


    /*
     * INFORMASI ORGANISASI DI ATAS TABEL
     */

    const meta = element('div', 'kf-excel-meta');

    const metadata = [
        ['PROVINSI', 'KALIMANTAN TIMUR'],
        ['KOTA', 'SAMARINDA'],
        ['UNIT', 'PERUMDA TIRTA KENCANA'],
        ['DEPARTEMEN', item.nama_departemen],
        ['DIVISI', item.nama_divisi],
        ['KATEGORI', category],
        ['CAKUPAN', item.cakupan],
        ['LOKASI / UNIT KERJA', item.nama_lokasi]
    ];

    metadata.forEach(([label, value]) => {
        const row = element('div', 'kf-excel-meta-row');

        row.append(
            element('span', 'kf-excel-meta-label', label),
            element('span', 'kf-excel-meta-colon', ':'),
            element('strong', '', display(value))
        );

        meta.appendChild(row);
    });

    body.appendChild(meta);


    /*
     * KONTAINER TABEL HORIZONTAL
     */

    const scroll = element('div', 'kf-excel-scroll');

    const table = element('table', 'kf-excel-table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = [
        'No.',
        'Nama Barang / Jenis Barang',
        'Tahun',
        'Bangunan (P, SP, D)',
        'Bertingkat / Tidak',
        'Beton / Tidak',
        'Letak / Lokasi Alamat',
        'Status Tanah',
        'Asal Usul Pembiayaan',
        'Status Aset',
        'Nilai (Rp)',
        'Dokumen Pendukung'
    ];

    headers.forEach(text => {
        headerRow.appendChild(
            element('th', '', text)
        );
    });

    thead.appendChild(headerRow);


    /*
     * DATA TUNGGAL KONSTRUKSI
     */

    const tbody = document.createElement('tbody');

    const dataRow = document.createElement('tr');


    /*
     * KOLOM NO.
     */

    dataRow.appendChild(
        element('td', 'kf-excel-number', '1')
    );


    /*
     * KOLOM NAMA BARANG DAN URAIAN
     */

    const nameCell = element('td', 'kf-excel-name');

    nameCell.appendChild(
        element(
            'strong',
            'kf-excel-item-name',
            display(item.nama_barang)
        )
    );

    nameCell.appendChild(
        element(
            'div',
            'kf-excel-subtitle',
            'Uraian Pekerjaan:'
        )
    );

    nameCell.appendChild(
        element(
            'div',
            'kf-excel-multiline',
            display(item.urai)
        )
    );

    dataRow.appendChild(nameCell);


    /*
     * KOLOM TAHUN
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-center',
            display(item.tahun)
        )
    );


    /*
     * KOLOM JENIS BANGUNAN
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-center',
            building
        )
    );


    /*
     * KOLOM BERTINGKAT / TIDAK
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-center',
            display(item.struktur)
        )
    );


    /*
     * KOLOM BETON / TIDAK
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-center',
            display(item.materi)
        )
    );


    /*
     * KOLOM LOKASI DAN ALAMAT
     */

    const location = [
        item.nama_lokasi,
        item.alamat_lokasi,
        item.letak
    ]
        .map(value => String(value ?? '').trim())
        .filter(Boolean)
        .filter((value, index, array) =>
            array.findIndex(
                x => x.toLowerCase() === value.toLowerCase()
            ) === index
        )
        .join('\n');

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-multiline',
            display(location)
        )
    );


    /*
     * KOLOM STATUS TANAH
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-center',
            display(item.status_tanah)
        )
    );


    /*
     * KOLOM ASAL PEMBIAYAAN
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-center',
            display(item.asal)
        )
    );


    /*
     * KOLOM STATUS ASET
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-center',
            display(item.status_aset)
        )
    );


    /*
     * KOLOM NILAI KONSTRUKSI
     */

    const nominal = Number(item.nilai) || 0;

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-money',
            'Rp ' + nominal.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            })
        )
    );


    /*
     * KOLOM DOKUMEN PENDUKUNG / KETERANGAN
     */

    dataRow.appendChild(
        element(
            'td',
            'kf-excel-multiline',
            display(item.ket)
        )
    );


    tbody.appendChild(dataRow);

    table.append(thead, tbody);
    scroll.appendChild(table);

    body.appendChild(scroll);


    /*
     * FOTO UTAMA DI BAWAH TABEL
     */

    if (item.foto_url) {
        const photoSection = element(
            'section',
            'kf-excel-section'
        );

        photoSection.appendChild(
            element('h4', '', 'Foto Konstruksi')
        );

        const photo = document.createElement('img');

        photo.src = item.foto_url;
        photo.alt = 'Foto Konstruksi';
        photo.className = 'kf-excel-photo';

        photoSection.appendChild(photo);
        body.appendChild(photoSection);
    }


    /*
     * LAMPIRAN PDF DAN GAMBAR
     */

    const documentSection = element(
        'section',
        'kf-excel-section'
    );

    documentSection.appendChild(
        element('h4', '', 'Lampiran Dokumen Pendukung')
    );

    const documentList = element(
        'div',
        'kf-excel-files'
    );

    const documents = Array.isArray(item.dokumens)
        ? item.dokumens
        : [];

    if (!documents.length) {
        documentList.appendChild(
            element('p', '', 'Belum ada lampiran.')
        );
    }

    documents.forEach(doc => {
        if (!doc.url) return;

        const link = document.createElement('a');

        link.href = doc.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        link.className = 'kf-btn kf-outline';
        link.textContent = doc.nama || 'Lihat Dokumen';

        documentList.appendChild(link);
    });

    documentSection.appendChild(documentList);
    body.appendChild(documentSection);


    /*
     * TAMPILKAN MODAL DETAIL
     */

    openDialog(detailDialog);
}



    /*
    |--------------------------------------------------------------------------
    | AMBIL DATA DARI KIBCONTROLLER
    |--------------------------------------------------------------------------
    */

    async function fetchKonstruksi(id) {
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


    /*
    |--------------------------------------------------------------------------
    | AKSI VIEW / EDIT / DELETE DARI TABEL
    |--------------------------------------------------------------------------
    */

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

            const item = await fetchKonstruksi(id);

            if (action === 'view') {
                showDetail(item);
            } else {
                editForm(item);
            }

        } catch (error) {

            showToast(error.message);

        } finally {

            button.disabled = false;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | EDIT MELALUI VIEW DETAIL
    |--------------------------------------------------------------------------
    */

    $('kfEdit')?.addEventListener('click', () => {
        if (!active) {
            return;
        }

        const item = active;

        closeDialog(detailDialog);

        editForm(item);
    });


    /*
    |--------------------------------------------------------------------------
    | KONFIRMASI DELETE
    |--------------------------------------------------------------------------
    */

    function askDelete(item) {
        if (!item || deleting) {
            return;
        }

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


    /*
    |--------------------------------------------------------------------------
    | DELETE MELALUI DETAIL
    |--------------------------------------------------------------------------
    */

    $('kfHapus')?.addEventListener('click', () => {
        if (active) {
            askDelete(active);
        }
    });


    /*
    |--------------------------------------------------------------------------
    | HAPUS DATA SETELAH KONFIRMASI
    |--------------------------------------------------------------------------
    */

    $('kfDeleteConfirm')?.addEventListener(
        'click',
        async () => {

            if (!deleteTarget || deleting) {
                return;
            }

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

                window.location.reload();

            } catch (error) {

                showToast(error.message);

                deleting = false;
                button.disabled = false;
            }
        }
    );


    /*
    |--------------------------------------------------------------------------
    | RESET TARGET DELETE
    |--------------------------------------------------------------------------
    */

    deleteDialog?.addEventListener('close', () => {
        if (!deleting) {
            deleteTarget = null;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | VALIDASI PILIHAN TERTENTU
    |--------------------------------------------------------------------------
    | Kategori, Bangunan, Bertingkat, dan Material harus
    | mengikuti nilai yang diterima KIBController.php.
    | Field lain dapat diisi manual.
    |--------------------------------------------------------------------------
    */

    function validateComboValues() {

        const checks = [
            {
                input: $('kfKategori'),
                allowed: categories,
                required: true,
                message: 'Pilih kategori IPA, BOOSTER, atau PERPIPAAN.'
            },

            {
                input: $('kfType'),
                allowed: validBangunan,
                required: false,
                message: 'Jenis Bangunan harus P, SP, atau D.'
            },

            {
                input: $('kfStruktur'),
                allowed: validStruktur,
                required: false,
                message: 'Pilih BERTINGKAT atau TIDAK BERTINGKAT.'
            },

            {
                input: $('kfMateri'),
                allowed: validMaterial,
                required: false,
                message: 'Pilih BETON atau TIDAK BETON.'
            }
        ];

        for (const check of checks) {

            if (!check.input) {
                continue;
            }

            const value = upper(check.input.value);

            check.input.value = value;
            check.input.setCustomValidity('');

            if (
                (check.required || value !== '') &&
                !check.allowed.includes(value)
            ) {

                check.input.setCustomValidity(
                    check.message
                );

                check.input.reportValidity();

                return false;
            }
        }

        return true;
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE / UPDATE — SIMPAN FORM
    |--------------------------------------------------------------------------
    */

    form?.addEventListener('submit', async event => {

        event.preventDefault();

        if (saving) {
            return;
        }

        showError('');

        if (!validateComboValues()) {
            return;
        }

        if (!form.reportValidity()) {
            return;
        }

        saving = true;

        const submit = $('kfSimpan');

        submit.disabled = true;


        /*
         * AMBIL INPUT FORM
         */

        const data = new FormData(form);

        data.set(
            'kategori',
            upper(data.get('kategori'))
        );


        /*
         * SIMPAN SEMUA FILE YANG DIPILIH
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
         * CREATE:
         * POST /kib/konstruksi
         *
         * UPDATE:
         * POST /kib/konstruksi/{id}
         * _method=PUT
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


            /*
             * SETELAH SUKSES
             */

            const params = new URLSearchParams(
                window.location.search
            );

            if (params.get('view') === 'arsip') {

                window.location.assign(base);

            } else {

                window.location.reload();
            }

        } catch (error) {

            showError(error.message);

            submit.disabled = false;
            saving = false;
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
