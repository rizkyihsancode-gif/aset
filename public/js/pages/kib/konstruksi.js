
/*
|--------------------------------------------------------------------------
| K.I.B F — KONSTRUKSI MANUAL
| SISTEM ASET PERUMDA TIRTA KENCANA
|--------------------------------------------------------------------------
| Controller : KIBController.php
| Database   : kib_konstruksi_manual
| Dokumen    : kib_konstruksi_dokumens
| Arsip      : kib_f_s (read-only)
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('kfApp');

    if (!root || root.dataset.initialized === '1') return;

    root.dataset.initialized = '1';

    const $ = id => document.getElementById(id);
    const base = (root.dataset.base || '').replace(/\/$/, '');
    const token = root.dataset.token;

    const form = $('kfForm');
    const formDialog = $('kfModalForm');
    const detailDialog = $('kfModalDetail');
    const deleteDialog = $('kfModalDelete');

    let active = null;
    let editId = null;
    let deleteTarget = null;
    let saving = false;
    let deleting = false;
    let newFiles = [];
    let toastTimer = null;

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

    const money = value => {
        return 'Rp ' + (Number(value) || 0)
            .toLocaleString('id-ID', {
                maximumFractionDigits: 2
            });
    };

    const normalize = value => String(value ?? '')
        .trim()
        .toLocaleLowerCase('id-ID');

    const normalizeCategory = value => String(value ?? '')
        .trim()
        .toUpperCase();

    const categories = ['IPA', 'BOOSTER', 'PERPIPAAN'];


    /* ======================================================
       MASTER DATA DARI BLADE
    ====================================================== */

    function readJson(id, fallback) {
        try {
            const element = $(id);

            if (!element) return fallback;

            return JSON.parse(element.textContent);
        } catch (error) {
            console.warn('Gagal membaca data:', id, error);
            return fallback;
        }
    }

    const master = readJson('kfMasterOptions', {
        lokasi: [],
        departemen: [],
        divisi: []
    });

    const history = readJson('kfHistoryOptions', {});

    const masterLokasi = Array.isArray(master.lokasi)
        ? master.lokasi : [];

    const masterDepartemen = Array.isArray(master.departemen)
        ? master.departemen : [];

    const masterDivisi = Array.isArray(master.divisi)
        ? master.divisi : [];


    /* ======================================================
       ICON
    ====================================================== */

    function refreshIcons() {
        window.lucide?.createIcons?.();
    }


    /* ======================================================
       JAM WITA
    ====================================================== */

    function initializeClock() {
        const tanggal = $('kfTanggal');
        const jam = $('kfJam');

        if (!tanggal || !jam) return;

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

            const dateText = dateFormatter.format(now);

            tanggal.textContent =
                dateText.charAt(0).toUpperCase() +
                dateText.slice(1);

            jam.textContent = timeFormatter
                .format(now)
                .replace(/\./g, ':');
        }

        updateClock();

        setInterval(updateClock, 1000);
    }


    /* ======================================================
       MODAL
    ====================================================== */

    function openDialog(dialog) {
        if (!dialog || dialog.open) return;

        dialog.showModal();
        refreshIcons();
    }

    function closeDialog(dialog) {
        if (dialog?.open) dialog.close();
    }

    document.querySelectorAll('[data-kf-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                closeDialog($(button.dataset.kfClose));
            });
        });


    /* ======================================================
       NOTIFIKASI
    ====================================================== */

    function showToast(message) {
        const node = $('kfToast');

        if (!node) {
            console.warn(message);
            return;
        }

        node.textContent = message;
        node.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            node.hidden = true;
        }, 4000);
    }

    function showError(message) {
        const node = $('kfError');

        if (!node) return;

        node.textContent = message || '';
        node.hidden = !message;

        if (message) {
            node.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }


    /* ======================================================
       REQUEST API LARAVEL
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

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
            const validation = data.errors
                ? Object.values(data.errors).flat().join('\n')
                : '';

            let message = validation || data.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (response.status === 413) {
                message = 'Ukuran unggahan melebihi batas server.';
            }

            if (response.status === 419) {
                message = 'Sesi login habis. Refresh halaman.';
            }

            if (response.status === 403) {
                message = 'Kamu tidak memiliki izin untuk tindakan ini.';
            }

            throw new Error(message);
        }

        return data;
    }


    /* ======================================================
       SEARCHABLE DROPDOWN
    ====================================================== */

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
            { value: 'P', label: 'Permanen' },
            { value: 'SP', label: 'Semi Permanen' },
            { value: 'D', label: 'Darurat' }
        ],

        struktur: [
            { value: 'BERTINGKAT', label: 'Bertingkat' },
            {
                value: 'TIDAK BERTINGKAT',
                label: 'Tidak Bertingkat'
            }
        ],

        material: [
            { value: 'BETON', label: 'Beton' },
            { value: 'TIDAK BETON', label: 'Tidak Beton' }
        ],

        status_tanah: [
            { value: 'Pemkot', label: '' },
            { value: 'Hak Pakai', label: '' },
            { value: 'Milik Perumda', label: '' }
        ],

        asal: [
            { value: 'Pemprov', label: '' },
            { value: 'Pemkot', label: '' },
            { value: 'Perumda', label: '' },
            { value: 'Hibah', label: '' }
        ],

        status_aset: [
            { value: 'Serah Terima', label: '' },
            { value: 'Dalam Pengerjaan', label: '' },
            { value: 'Selesai', label: '' }
        ]
    };


    function historicalOptions(source) {
        const key = {
            lokasi: 'lokasi',
            departemen: 'departemen',
            divisi: 'divisi',
            cakupan: 'cakupan'
        }[source];

        const list = key && Array.isArray(history[key])
            ? history[key]
            : [];

        return list.map(value => ({
            value: String(value),
            label: '',
            info: null
        }));
    }


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
        }

        else if (source === 'departemen') {
            options = masterDepartemen
                .filter(row => row.nama_dep)
                .map(row => ({
                    value: String(row.nama_dep),
                    label: '',
                    info: row
                }));
        }

        else if (source === 'divisi') {
            const selectedDepartment = normalize(
                $('kfDepartemen')?.value
            );

            const department = masterDepartemen.find(
                row => normalize(row.nama_dep) ===
                    selectedDepartment
            );

            const filtered = department
                ? masterDivisi.filter(
                    row => String(row.id_dep) ===
                        String(department.id)
                )
                : masterDivisi;

            options = filtered
                .filter(row => row.nama_div)
                .map(row => ({
                    value: String(row.nama_div),
                    label: '',
                    info: row
                }));
        }

        else if (source === 'cakupan') {
            options = historicalOptions('cakupan');
        }

        else {
            options = predefined[source] || [];
        }

        /*
         * Gabungkan Master Data dengan data manual
         * yang pernah disimpan sebelumnya.
         */

        if (['lokasi', 'departemen', 'divisi'].includes(source)) {
            options = [
                ...options,
                ...historicalOptions(source)
            ];
        }

        /*
         * Hapus pilihan duplikat.
         */

        const used = new Set();

        return options.filter(option => {
            const key = normalize(option.value);

            if (!key || used.has(key)) return false;

            used.add(key);
            return true;
        });
    }


    function initializeComboboxes() {
        if (!form) return;

        const inputs = form.querySelectorAll(
            'input[data-kf-combo]'
        );

        inputs.forEach(input => {
            if (input.dataset.ready === '1') return;

            input.dataset.ready = '1';

            const source = input.dataset.kfCombo;

            input.autocomplete = 'off';
            input.setAttribute('role', 'combobox');
            input.setAttribute('aria-autocomplete', 'list');
            input.setAttribute('aria-expanded', 'false');

            const wrapper = document.createElement('div');

            wrapper.className = 'kf-combo';

            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            /*
             * Tombol dropdown.
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
             * Daftar pilihan.
             */

            const panel = document.createElement('div');

            panel.id = `${input.id}-options`;
            panel.className = 'kf-combo-options';

            panel.setAttribute('role', 'listbox');

            panel.hidden = true;

            input.setAttribute('aria-controls', panel.id);

            wrapper.append(arrow, panel);

            let visible = false;
            let currentOptions = [];
            let activeIndex = -1;


            function closeMenu() {
                visible = false;

                panel.hidden = true;

                wrapper.classList.remove('kf-combo-open');

                input.setAttribute('aria-expanded', 'false');
                input.removeAttribute('aria-activedescendant');
            }


            function highlight(index) {
                const rows = Array.from(
                    panel.querySelectorAll('.kf-combo-option')
                );

                if (!rows.length) return;

                activeIndex =
                    (index + rows.length) % rows.length;

                rows.forEach((row, i) => {
                    const selected = i === activeIndex;

                    row.classList.toggle('active', selected);

                    row.setAttribute(
                        'aria-selected',
                        String(selected)
                    );

                    if (selected) {
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


            function selectOption(option) {
                input.value = option.value;

                /*
                 * Isi alamat lokasi otomatis hanya
                 * jika alamat belum diisi.
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
                    new Event('input', { bubbles: true })
                );

                input.dispatchEvent(
                    new Event('change', { bubbles: true })
                );

                closeMenu();

                input.focus({ preventScroll: true });
            }


            function renderOptions(showAll = false) {
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

                panel.replaceChildren();

                activeIndex = -1;

                if (currentOptions.length === 0) {
                    const empty = document.createElement('div');

                    empty.className = 'kf-combo-empty';

                    empty.textContent = source === 'kategori'
                        ? 'Pilih IPA, Booster, atau Perpipaan.'
                        : 'Data tidak ditemukan. Kamu tetap dapat mengetik nilai baru.';

                    panel.appendChild(empty);
                }

                currentOptions.forEach((option, index) => {
                    const button = document.createElement('button');

                    button.type = 'button';
                    button.className = 'kf-combo-option';

                    button.id = `${panel.id}-${index}`;

                    button.setAttribute('role', 'option');
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

                    button.addEventListener('click', () => {
                        selectOption(option);
                    });

                    panel.appendChild(button);
                });

                visible = true;
                panel.hidden = false;

                wrapper.classList.add('kf-combo-open');

                input.setAttribute('aria-expanded', 'true');
            }


            /*
             * Mengetik akan memfilter pilihan.
             */

            input.addEventListener('input', () => {
                input.setCustomValidity('');
                renderOptions();
            });


            /*
             * Fokus membuka daftar.
             */

            input.addEventListener('focus', () => {
                if (!visible) renderOptions();
            });


            /*
             * Navigasi keyboard.
             */

            input.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    if (visible) {
                        event.preventDefault();
                        closeMenu();
                    }
                }

                else if (event.key === 'ArrowDown') {
                    event.preventDefault();

                    if (!visible) renderOptions();

                    if (currentOptions.length) {
                        highlight(activeIndex + 1);
                    }
                }

                else if (event.key === 'ArrowUp') {
                    event.preventDefault();

                    if (!visible) renderOptions();

                    if (currentOptions.length) {
                        highlight(activeIndex - 1);
                    }
                }

                else if (
                    event.key === 'Enter' &&
                    visible &&
                    activeIndex >= 0
                ) {
                    event.preventDefault();

                    selectOption(
                        currentOptions[activeIndex]
                    );
                }
            });


            /*
             * Tombol panah.
             */

            arrow.addEventListener(
                'mousedown',
                event => event.preventDefault()
            );

            arrow.addEventListener('click', () => {
                if (visible) {
                    closeMenu();
                } else {
                    input.focus({ preventScroll: true });
                    renderOptions(true);
                }
            });

            comboWidgets.set(input.id, {
                wrapper,
                closeMenu,
                renderOptions
            });
        });


        /*
         * Klik di luar dropdown menutup pilihan.
         */

        document.addEventListener('pointerdown', event => {
            comboWidgets.forEach(widget => {
                if (!widget.wrapper.contains(event.target)) {
                    widget.closeMenu();
                }
            });
        });


        /*
         * Departemen berubah: perbarui pilihan Divisi.
         */

        $('kfDepartemen')?.addEventListener('input', () => {
            const widget = comboWidgets.get('kfDivisi');

            if (
                widget &&
                widget.wrapper.classList.contains('kf-combo-open')
            ) {
                widget.renderOptions();
            }
        });


        form.addEventListener('reset', () => {
            comboWidgets.forEach(widget => {
                widget.closeMenu();
            });
        });
    }


    /* ======================================================
       DOKUMEN BARU
    ====================================================== */

    function resetFiles() {
        newFiles = [];

        const input = $('kfDokumens');

        if (input) input.value = '';

        $('kfSelectedFiles')?.replaceChildren();
        $('kfSavedFiles')?.replaceChildren();
    }


    function renderSelectedFiles() {
        const container = $('kfSelectedFiles');

        if (!container) return;

        container.replaceChildren();

        if (!newFiles.length) return;

        const heading = document.createElement('strong');

        heading.textContent =
            `${newFiles.length} file baru dipilih`;

        container.appendChild(heading);

        newFiles.forEach((file, index) => {
            const row = document.createElement('div');

            row.className = 'kf-file-row';

            const name = document.createElement('span');

            name.textContent =
                `${file.name} — ${(file.size / 1048576).toFixed(2)} MB`;

            const remove = document.createElement('button');

            remove.type = 'button';
            remove.className = 'kf-link';
            remove.textContent = 'Batalkan';

            remove.addEventListener('click', () => {
                newFiles.splice(index, 1);
                renderSelectedFiles();
            });

            row.append(name, remove);
            container.appendChild(row);
        });
    }


    $('kfDokumens')?.addEventListener('change', event => {
        const files = Array.from(event.target.files || []);

        files.forEach(file => {
            if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
                showToast(`${file.name}: format tidak didukung.`);
                return;
            }

            const exists = newFiles.some(old =>
                old.name === file.name &&
                old.size === file.size &&
                old.lastModified === file.lastModified
            );

            if (!exists) newFiles.push(file);
        });

        event.target.value = '';

        renderSelectedFiles();
    });


    function renderSavedFiles(documents) {
        const container = $('kfSavedFiles');

        if (!container) return;

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
            link.textContent = doc.nama || 'Dokumen';

            row.appendChild(link);

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


    /* ======================================================
       FORM CREATE
    ====================================================== */

    function newForm() {
        if (!form) return;

        active = null;
        editId = null;
        saving = false;

        form.reset();
        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Tambah Data Konstruksi';

        $('kfSimpan').disabled = false;

        $('kfSimpan').innerHTML =
            '<span>Simpan Konstruksi</span>';

        $('kfTahun').value = new Date().getFullYear();

        openDialog(formDialog);
    }


    /* ======================================================
       FORM UPDATE
    ====================================================== */

    function editForm(item) {
        if (!form || !item) return;

        active = item;
        editId = Number(item.id);
        saving = false;

        form.reset();
        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Edit Data Konstruksi';

        const fallback = {
            nama_barang_manual: item.nama_barang,
            lokasi_manual: item.nama_lokasi,
            alamat_manual: item.alamat_lokasi,
            departemen_manual: item.nama_departemen,
            divisi_manual: item.nama_divisi
        };

        fields.forEach(field => {
            const input = form.elements.namedItem(field);

            if (!input) return;

            input.value = String(
                item[field] ?? fallback[field] ?? ''
            ).trim();
        });

        renderSavedFiles(item.dokumens || []);

        $('kfSimpan').disabled = false;

        $('kfSimpan').textContent = 'Simpan Perubahan';

        openDialog(formDialog);
    }


    $('kfTambah')?.addEventListener('click', newForm);


    /* ======================================================
       DETAIL HELPER AMAN
    ====================================================== */

    function createText(tag, content, className = '') {
        const element = document.createElement(tag);

        element.textContent =
            content == null || content === ''
                ? '—'
                : String(content);

        if (className) element.className = className;

        return element;
    }


    function formatCategory(value) {
        return {
            IPA: 'Instalasi Pengolahan Air (IPA)',
            BOOSTER: 'Booster',
            PERPIPAAN: 'Perpipaan'
        }[normalizeCategory(value)] || 'Belum Dikategorikan';
    }


    function formatBuilding(value) {
        return {
            P: 'Permanen',
            SP: 'Semi Permanen',
            D: 'Darurat'
        }[String(value || '').toUpperCase()] || value || '—';
    }


    /* ======================================================
       VIEW DETAIL
    ====================================================== */

    function showDetail(item) {
        active = item;

        $('kfDetailTitle').textContent =
            item.nama_barang || 'Detail Konstruksi';

        const body = $('kfDetailBody');

        body.replaceChildren();

        const grid = document.createElement('div');

        grid.className = 'kf-detail-grid';

        const info = [
            ['Nama Pekerjaan', item.nama_barang],
            ['Kategori', formatCategory(item.kategori)],
            ['Cakupan', item.cakupan],
            ['Tahun', item.tahun],
            ['Lokasi', item.nama_lokasi],
            ['Alamat', item.alamat_lokasi],
            ['Departemen', item.nama_departemen],
            ['Divisi', item.nama_divisi],
            ['Bangunan', formatBuilding(item.type)],
            ['Bertingkat / Tidak', item.struktur],
            ['Beton / Tidak', item.materi],
            ['Letak / Lokasi Alamat', item.letak],
            ['Status Tanah', item.status_tanah],
            ['Asal Pembiayaan', item.asal],
            ['Status Aset', item.status_aset],
            ['Nilai Konstruksi', money(item.nilai)]
        ];

        info.forEach(([label, value]) => {
            const box = document.createElement('div');

            box.append(
                createText('small', label),
                createText('strong', value)
            );

            grid.appendChild(box);
        });

        body.appendChild(grid);

        body.append(
            createText('h3', 'Uraian Pekerjaan'),
            createText('p', item.urai, 'kf-preline')
        );

        body.append(
            createText('h3', 'Keterangan / Berita Acara'),
            createText('p', item.ket, 'kf-preline')
        );

        if (item.foto_url) {
            const image = document.createElement('img');

            image.src = item.foto_url;
            image.alt = 'Foto konstruksi';
            image.className = 'kf-photo';

            body.appendChild(image);
        }

        body.appendChild(
            createText('h3', 'Dokumen Pendukung')
        );

        const links = document.createElement('div');

        links.className = 'kf-file-list';

        if (!item.dokumens?.length) {
            links.appendChild(
                createText('p', 'Belum ada lampiran.')
            );
        }

        (item.dokumens || []).forEach(doc => {
            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'kf-btn kf-outline';
            link.textContent = doc.nama || 'Lihat Dokumen';

            links.appendChild(link);
        });

        body.appendChild(links);

        openDialog(detailDialog);
    }


    /* ======================================================
       FETCH DETAIL
    ====================================================== */

    async function fetchKonstruksi(id) {
        const response = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!response.data) {
            throw new Error('Data Konstruksi tidak ditemukan.');
        }

        return response.data;
    }


    /* ======================================================
       AKSI LANGSUNG DARI TABEL
    ====================================================== */

    root.addEventListener('click', async event => {
        if (!(event.target instanceof Element)) return;

        const button = event.target.closest(
            'button[data-kf-action]'
        );

        if (!button || button.disabled) return;

        const action = button.dataset.kfAction;
        const id = button.dataset.kfId;

        if (!/^\d+$/.test(String(id))) {
            showToast('ID Konstruksi tidak valid.');
            return;
        }

        if (action === 'delete') {
            askDelete({
                id: Number(id),
                nama_barang: button.dataset.kfName
            });

            return;
        }

        if (!['view', 'edit'].includes(action)) return;

        button.disabled = true;

        try {
            const item = await fetchKonstruksi(id);

            if (action === 'view') {
                showDetail(item);
            } else {
                editForm(item);
            }
        } catch (exception) {
            showToast(exception.message);
        } finally {
            button.disabled = false;
        }
    });


    /* ======================================================
       EDIT DAN DELETE MELALUI DETAIL
    ====================================================== */

    $('kfEdit')?.addEventListener('click', () => {
        if (!active) return;

        const item = active;

        closeDialog(detailDialog);
        editForm(item);
    });


    function askDelete(item) {
        if (!item || deleting) return;

        deleteTarget = {
            id: Number(item.id),
            name: item.nama_barang ||
                item.nama_pekerjaan ||
                `Konstruksi #${item.id}`
        };

        $('kfDeleteName').textContent = deleteTarget.name;

        closeDialog(detailDialog);

        openDialog(deleteDialog);
    }


    $('kfHapus')?.addEventListener('click', () => {
        if (active) askDelete(active);
    });


    /* ======================================================
       KONFIRMASI DELETE
    ====================================================== */

    $('kfDeleteConfirm')?.addEventListener(
        'click',
        async () => {
            if (!deleteTarget || deleting) return;

            deleting = true;

            const button = $('kfDeleteConfirm');

            button.disabled = true;

            try {
                await api(
                    `${base}/${deleteTarget.id}`,
                    { method: 'DELETE' }
                );

                window.location.reload();
            } catch (exception) {
                showToast(exception.message);
            } finally {
                deleting = false;
                button.disabled = false;
            }
        }
    );


    deleteDialog?.addEventListener('close', () => {
        if (!deleting) deleteTarget = null;
    });


    /* ======================================================
       VALIDASI KATEGORI
    ====================================================== */

    function validateCategory() {
        const input = $('kfKategori');

        if (!input) return true;

        const value = normalizeCategory(input.value);

        input.value = value;

        input.setCustomValidity('');

        if (!categories.includes(value)) {
            input.setCustomValidity(
                'Pilih kategori IPA, BOOSTER, atau PERPIPAAN.'
            );

            input.reportValidity();

            return false;
        }

        return true;
    }


    /* ======================================================
       SUBMIT CREATE / UPDATE
    ====================================================== */

    form?.addEventListener('submit', async event => {
        event.preventDefault();

        if (saving) return;

        showError('');

        if (!validateCategory()) return;

        if (!form.reportValidity()) return;

        saving = true;

        const submit = $('kfSimpan');

        submit.disabled = true;

        const data = new FormData(form);

        data.set(
            'kategori',
            normalizeCategory(data.get('kategori'))
        );

        /*
         * Dokumen dipilih berulang.
         * Gunakan array newFiles.
         */

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

            /*
             * Jika tambah dari tab arsip,
             * kembali ke daftar manual baru.
             */

            const params = new URLSearchParams(
                window.location.search
            );

            if (params.get('view') === 'arsip') {
                window.location.assign(base);
            } else {
                window.location.reload();
            }
        } catch (exception) {
            showError(exception.message);

            submit.disabled = false;
            saving = false;
        }
    });


    /* ======================================================
       INISIALISASI
    ====================================================== */

    initializeClock();
    initializeComboboxes();
    refreshIcons();

})();
