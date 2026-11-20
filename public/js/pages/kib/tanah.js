/**
 * ============================================================================
 * K.I.B A - TANAH
 * Sistem Aset Perumda Tirta Kencana
 * ============================================================================
 *
 * FUNGSI FILE:
 * 01. Helper umum
 * 02. Dialog / modal
 * 03. Toast notification
 * 04. Search, filter, pagination tabel utama
 * 05. Export CSV
 * 06. Data Nilai Aset yang menunggu diproses
 * 07. Pilih Nilai Aset → isi Lokasi dan Alamat otomatis
 * 08. Form Tambah / Edit Tanah
 * 09. Upload dan preview PDF
 * 10. View Data Tanah dengan tabel K.I.B A horizontal
 * 11. Detail Nilai Aset per lokasi
 * 12. Daftar PDF per lokasi
 * 13. Delete sertifikat
 * 14. Pemulihan validation error Laravel
 *
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {

    'use strict';


    /**
     * ========================================================================
     * 01. ROOT & KONFIGURASI URL
     * ========================================================================
     */

    const root = document.getElementById('tanahPage');

    if (!root) {
        return;
    }


    const BASE_URL =
        root.dataset.recordBaseUrl
        || '/kib/tanah';


    const LOCATION_URL =
        root.dataset.locationBaseUrl
        || `${BASE_URL}/lokasi`;


    const PENDING_URL =
        root.dataset.pendingUrl
        || '/kib/pending/tanah';


    /**
     * ========================================================================
     * 02. HELPER DOM
     * ========================================================================
     */

    const $ = (
        selector,
        element = document
    ) => element.querySelector(selector);


    const $$ = (
        selector,
        element = document
    ) => Array.from(
        element.querySelectorAll(selector)
    );


    const dialog = id =>
        document.getElementById(id);


    /**
     * ========================================================================
     * 03. HELPER FORMAT ANGKA / TANGGAL
     * ========================================================================
     */

    const integerFormatter =
        new Intl.NumberFormat(
            'id-ID',
            {
                maximumFractionDigits: 0,
            }
        );


    const decimalFormatter =
        new Intl.NumberFormat(
            'id-ID',
            {
                maximumFractionDigits: 2,
            }
        );


    function formatRupiah(value)
    {
        return (
            'Rp '
            +
            integerFormatter.format(
                Number(value) || 0
            )
        );
    }


    function formatNumber(value)
    {
        return decimalFormatter.format(
            Number(value) || 0
        );
    }


    function formatDate(value)
    {
        if (
            !value
            ||
            value === '-'
        ) {
            return '-';
        }


        const dateParts =
            String(value)
                .slice(0, 10)
                .split('-');


        if (dateParts.length !== 3) {
            return String(value);
        }


        return (
            dateParts[2]
            +
            '/'
            +
            dateParts[1]
            +
            '/'
            +
            dateParts[0]
        );
    }


    function toDateInput(value)
    {
        const date =
            String(value || '');


        if (
            /^\d{4}-\d{2}-\d{2}/
                .test(date)
        ) {
            return date.slice(0, 10);
        }


        return '';
    }


    /**
     * ========================================================================
     * 04. HELPER KEAMANAN HTML
     * ========================================================================
     */

    function escapeHtml(value)
    {
        return String(
            value ?? ''
        ).replace(
            /[&<>"']/g,
            character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character]
        );
    }


    /**
     * ========================================================================
     * 05. LUCIDE ICON
     * ========================================================================
     */

    function refreshIcons()
    {
        if (
            window.lucide
            &&
            typeof window.lucide.createIcons
                === 'function'
        ) {
            window.lucide.createIcons();
        }
    }


    /**
     * ========================================================================
     * 06. DIALOG / MODAL
     * ========================================================================
     */

    function openDialog(id)
    {
        const element =
            dialog(id);


        if (
            element
            &&
            !element.open
        ) {
            element.showModal();
        }


        refreshIcons();
    }


    function closeDialog(id)
    {
        const element =
            dialog(id);


        if (
            element
            &&
            element.open
        ) {
            element.close();
        }
    }


    /**
     * Tombol dengan:
     *
     * data-close-dialog="namaModal"
     *
     * otomatis menutup modal.
     */

    $$('[data-close-dialog]')
        .forEach(button => {

            button.addEventListener(
                'click',
                function () {

                    closeDialog(
                        button.dataset
                            .closeDialog
                    );
                }
            );

        });


    /**
     * Klik backdrop dialog untuk menutup.
     */

    $$('dialog', root)
        .forEach(modal => {

            modal.addEventListener(
                'click',
                function (event) {

                    if (
                        event.target
                        === modal
                    ) {
                        modal.close();
                    }

                }
            );

        });


    /**
     * ========================================================================
     * 07. TOAST NOTIFICATION
     * ========================================================================
     */

    let toastTimer = null;


    function notify(
        message,
        isError = false
    ) {
        const toast =
            $('#tanahToast');


        const toastMessage =
            $('#tanahToastMessage');


        if (
            !toast
            ||
            !toastMessage
        ) {
            return;
        }


        clearTimeout(
            toastTimer
        );


        toastMessage.textContent =
            message;


        toast.hidden =
            false;


        toast.classList.toggle(
            'is-error',
            isError
        );


        toastTimer =
            setTimeout(
                function () {

                    toast.hidden =
                        true;

                },
                4300
            );
    }


    /**
     * ========================================================================
     * 08. FETCH JSON
     * ========================================================================
     */

    async function getJson(url)
    {
        const response =
            await fetch(
                url,
                {
                    method: 'GET',

                    credentials:
                        'same-origin',

                    headers: {
                        Accept:
                            'application/json',
                    },
                }
            );


        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        if (
            data.success
            === false
        ) {
            throw new Error(
                data.message
                || 'Permintaan gagal.'
            );
        }


        return data;
    }


    function handleError(
        error,
        message
    ) {
        console.error(
            message,
            error
        );


        notify(
            `${message} (${error.message || 'periksa Laravel log'})`,
            true
        );
    }


    /**
     * ========================================================================
     * 09. FILTER & PAGINATION TABEL UTAMA
     * ========================================================================
     */

    const mainRows =
        $$('.tanah-data-row', root);


    const searchInput =
        $('#tanahSearch');


    const perPageSelect =
        $('#tanahPerPage');

    const ownershipFilter = $('#tanahKepemilikanFilter');

    const ownershipLabels = {
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta',
        campuran: 'Campuran',
    };

    function ownershipLabel(value) {
        return ownershipLabels[String(value || '').toLowerCase()] || 'Belum Diatur';
    }


    const tableInfo =
        $('#tanahTableInfo');


    const pagination =
        $('#tanahPagination');


    let currentPage = 1;


    function getFilteredMainRows()
    {
        const keyword =
            (
                searchInput?.value
                || ''
            )
                .trim()
                .toLocaleLowerCase(
                    'id-ID'
                );


        return mainRows.filter(
            row => {

                const searchValue =
                    (
                        row.dataset.search
                        || ''
                    )
                        .toLocaleLowerCase(
                            'id-ID'
                        );


                const status = ownershipFilter?.value || '';
                return searchValue.includes(keyword) &&
                    (!status || row.dataset.statusKepemilikan === status);
            }
        );
    }


    function createPaginationButton(
        label,
        targetPage,
        disabled = false
    ) {
        const button =
            document.createElement(
                'button'
            );


        button.type =
            'button';


        button.className =
            'tanah-page-button';


        button.textContent =
            label;


        button.disabled =
            disabled;


        button.classList.toggle(
            'active',
            (
                targetPage
                === currentPage
            )
            &&
            /^\d+$/.test(label)
        );


        button.addEventListener(
            'click',
            function () {

                currentPage =
                    targetPage;


                renderPagination();

            }
        );


        pagination.appendChild(
            button
        );
    }


    function renderPagination()
    {
        const records =
            getFilteredMainRows();


        const perPage =
            Math.max(
                1,
                Number(
                    perPageSelect?.value
                    || 20
                )
            );


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    records.length
                    /
                    perPage
                )
            );


        currentPage =
            Math.min(
                Math.max(
                    1,
                    currentPage
                ),
                totalPages
            );


        /**
         * Sembunyikan semua baris dahulu.
         */

        mainRows.forEach(
            row => {

                row.hidden =
                    true;

            }
        );


        const startIndex =
            (
                currentPage - 1
            )
            *
            perPage;


        const endIndex =
            Math.min(
                startIndex
                +
                perPage,
                records.length
            );


        /**
         * Tampilkan hanya baris pada halaman aktif.
         */

        records
            .slice(
                startIndex,
                endIndex
            )
            .forEach(
                (
                    row,
                    index
                ) => {

                    row.hidden =
                        false;


                    const numberCell =
                        $(
                            '.tanah-row-number',
                            row
                        );


                    if (numberCell) {
                        numberCell.textContent =
                            startIndex
                            +
                            index
                            +
                            1;
                    }

                }
            );


        /**
         * Informasi jumlah data.
         */

        if (tableInfo) {

            if (
                records.length
                === 0
            ) {
                tableInfo.textContent =
                    'Tidak ada lokasi yang sesuai';

            } else {

                tableInfo.textContent =
                    `Menampilkan ${
                        integerFormatter.format(
                            startIndex + 1
                        )
                    }–${
                        integerFormatter.format(
                            endIndex
                        )
                    } dari ${
                        integerFormatter.format(
                            records.length
                        )
                    } lokasi`;

            }

        }


        /**
         * Pagination button.
         */

        if (!pagination) {
            return;
        }


        pagination.replaceChildren();


        if (totalPages < 2) {
            return;
        }


        createPaginationButton(
            '‹',
            currentPage - 1,
            currentPage === 1
        );


        const from =
            Math.max(
                1,
                currentPage - 2
            );


        const to =
            Math.min(
                totalPages,
                currentPage + 2
            );


        if (from > 1) {
            createPaginationButton(
                '1',
                1
            );
        }


        for (
            let page = from;
            page <= to;
            page++
        ) {
            createPaginationButton(
                String(page),
                page
            );
        }


        if (to < totalPages) {
            createPaginationButton(
                String(totalPages),
                totalPages
            );
        }


        createPaginationButton(
            '›',
            currentPage + 1,
            currentPage
            === totalPages
        );
    }


    searchInput
        ?.addEventListener(
            'input',
            function () {

                currentPage = 1;

                renderPagination();

            }
        );


    ownershipFilter?.addEventListener('change', () => {
        currentPage = 1;
        renderPagination();
    });

    perPageSelect
        ?.addEventListener(
            'change',
            function () {

                currentPage = 1;

                renderPagination();

            }
        );


    $('#tanahResetButton')
        ?.addEventListener(
            'click',
            function () {

                if (searchInput) {
                    searchInput.value =
                        '';
                }


                if (perPageSelect) {
                    perPageSelect.value = '20';
                }
                if (ownershipFilter) {
                    ownershipFilter.value = '';
                }


                currentPage = 1;

                renderPagination();

            }
        );


    renderPagination();


    /**
     * ========================================================================
     * 10. EXPORT CSV
     * ========================================================================
     */

    $('#tanahExportButton')
        ?.addEventListener(
            'click',
            function () {

                const rows =
                    getFilteredMainRows();


                if (
                    rows.length
                    === 0
                ) {
                    notify(
                        'Belum ada data untuk diekspor.',
                        true
                    );

                    return;
                }


                const csvRows = [
                    [
                        'No',
                        'Lokasi',
                        'Alamat',
                        'Penggunaan',
                        'Status Kepemilikan',
                        'Data Tanah',
                        'Tahun',
                        'Nilai',
                        'PDF',
                    ],
                ];


                rows.forEach(
                    (
                        row,
                        index
                    ) => {

                        const cells =
                            $$(
                                'td',
                                row
                            );


                        csvRows.push([
                            index + 1,

                            cells[1]
                                ?.innerText
                                ?.trim()
                            || '',

                            cells[2]
                                ?.innerText
                                ?.trim()
                            || '',

                            cells[3]
                                ?.innerText
                                ?.trim()
                            || '',

                            ownershipLabel(row.dataset.statusKepemilikan),

                            `${
                                row.dataset.jumlah
                                || 0
                            } sertifikat`,

                            row.dataset.tahun
                            || '-',

                            formatRupiah(
                                row.dataset.nilai
                            ),

                            `${
                                row.dataset.pdf
                                || 0
                            } PDF`,
                        ]);

                    }
                );


                const csvContent =
                    '\uFEFF'
                    +
                    csvRows
                        .map(
                            row => {

                                return row
                                    .map(
                                        value => {

                                            return (
                                                '"'
                                                +
                                                String(
                                                    value
                                                    ?? ''
                                                )
                                                    .replace(
                                                        /"/g,
                                                        '""'
                                                    )
                                                +
                                                '"'
                                            );

                                        }
                                    )
                                    .join(',');

                            }
                        )
                        .join('\r\n');


                const objectUrl =
                    URL.createObjectURL(
                        new Blob(
                            [csvContent],
                            {
                                type:
                                    'text/csv;charset=utf-8',
                            }
                        )
                    );


                const link =
                    document.createElement(
                        'a'
                    );


                link.href =
                    objectUrl;


                link.download =
                    'kib-tanah.csv';


                document.body
                    .appendChild(link);


                link.click();


                link.remove();


                setTimeout(
                    function () {

                        URL.revokeObjectURL(
                            objectUrl
                        );

                    },
                    100
                );

            }
        );


    /**
     * ========================================================================
     * 11. FORM TAMBAH / EDIT
     * ========================================================================
     */

    const form =
        $('#tanahForm');


    const formMethod =
        $('#tanahFormMethod');


    const sourceBody =
        $('#tanahSourceBody');


    let pendingTransactions = [];


    function setField(
        id,
        value
    ) {
        const element =
            document.getElementById(id);


        if (element) {
            element.value =
                value ?? '';
        }
    }


    function selectValue(
        selector,
        value
    ) {
        const element =
            $(selector);


        if (!element) {
            return;
        }


        const finalValue =
            String(
                value ?? ''
            );


        /**
         * Jika SELECT belum memiliki option,
         * tambahkan supaya data lama tetap bisa diedit.
         */

        if (
            element.tagName
            === 'SELECT'
            &&
            finalValue
            &&
            !Array.from(
                element.options
            )
                .some(
                    option =>
                        option.value
                        === finalValue
                )
        ) {
            element.add(
                new Option(
                    finalValue,
                    finalValue
                )
            );
        }


        element.value =
            finalValue;
    }


    // ========================================================================
    // DROPDOWN SEARCHABLE: Barang, Status Kepemilikan, Asal, Hak
    // Select asli tetap digunakan untuk pengiriman ID/nilai ke controller.
    // Menu dipasang di dialog agar dapat dibuka di modal top-layer.
    // ========================================================================

    const tanahCombos = [];

    function syncTanahCombos() {
        tanahCombos.forEach(combo => combo.sync());
    }

    function setupTanahCombo(select) {
        if (!select || select.dataset.searchable === '1') return;

        select.dataset.searchable = '1';
        const required = select.required;
        select.required = false;

        const wrap = document.createElement('div');
        wrap.className = 'tanah-combo';
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(select);

        const input = document.createElement('input');
        input.type = 'search';
        input.id = `${select.id}_search`;
        const associatedLabel = select.closest('.tanah-field')?.querySelector(`label[for="${select.id}"]`);
        if (associatedLabel) associatedLabel.htmlFor = input.id;
        input.className = 'tanah-combo-input';
        input.autocomplete = 'off';
        input.placeholder = 'Ketik untuk mencari pilihan...';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-autocomplete', 'list');
        input.required = required;
        wrap.insertBefore(input, select);
        select.classList.add('tanah-select-native');
        select.tabIndex = -1;

        const menu = document.createElement('div');
        menu.className = 'tanah-combo-menu';
        menu.hidden = true;
        menu.setAttribute('role', 'listbox');
        // Agar menu pencarian tampil di atas <dialog> modal (top layer).
        const menuHost = select.closest('dialog') || document.body;
        menuHost.appendChild(menu);
        let available = [];
        let focusIndex = -1;

        function options() {
            return Array.from(select.options).filter(opt =>
                opt.value && !opt.disabled && !opt.hidden
            );
        }

        function selectedText() {
            return select.selectedOptions[0]?.value
                ? select.selectedOptions[0].textContent.trim().replace(/\s+/g, ' ')
                : '';
        }

        function position() {
            if (menu.hidden) return;
            const r = input.getBoundingClientRect();
            const below = window.innerHeight - r.bottom;
            const flip = below < 180 && r.top > below;
            menu.style.left = `${Math.max(4, r.left)}px`;
            menu.style.width = `${r.width}px`;
            menu.style.maxHeight = `${Math.min(280, Math.max(100, flip ? r.top - 12 : below - 12))}px`;
            menu.style.top = flip ? 'auto' : `${r.bottom + 4}px`;
            menu.style.bottom = flip ? `${window.innerHeight - r.top + 4}px` : 'auto';
        }

        function close() {
            menu.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            focusIndex = -1;
        }

        function sync() {
            input.value = selectedText();
            input.setCustomValidity(required && !select.value
                ? 'Pilih salah satu opsi dari daftar.' : '');
            if (!menu.hidden) render(input.value);
        }

        function choose(option) {
            if (!option) return;
            select.value = option.value;
            input.value = selectedText();
            input.setCustomValidity('');
            select.dispatchEvent(new Event('change', { bubbles: true }));
            close();
        }

        function render(text = '') {
            const keyword = String(text).trim().toLocaleLowerCase('id-ID');
            available = options().filter(option =>
                option.textContent.toLocaleLowerCase('id-ID').includes(keyword)
            ).slice(0, 100);
            menu.replaceChildren();
            available.forEach(option => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'tanah-combo-item';
                item.textContent = option.textContent.trim().replace(/\s+/g, ' ');
                item.addEventListener('pointerdown', event => event.preventDefault());
                item.addEventListener('click', () => choose(option));
                menu.appendChild(item);
            });
            if (!available.length) {
                const empty = document.createElement('div');
                empty.className = 'tanah-combo-empty';
                empty.textContent = 'Tidak ada data yang sesuai.';
                menu.appendChild(empty);
            }
            menu.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            focusIndex = -1;
            position();
        }

        input.addEventListener('focus', () => render(''));
        input.addEventListener('click', () => render(''));
        input.addEventListener('input', () => {
            select.value = '';
            input.setCustomValidity(required ? 'Pilih salah satu opsi dari daftar.' : '');
            render(input.value);
        });
        input.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                close();
                sync();
                return;
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (menu.hidden) render('');
                if (!available.length) return;
                focusIndex = Math.max(0, Math.min(available.length - 1,
                    focusIndex + (event.key === 'ArrowDown' ? 1 : -1)));
                Array.from(menu.querySelectorAll('button')).forEach((item, index) => {
                    item.classList.toggle('highlighted', index === focusIndex);
                });
            }
            if (event.key === 'Enter' && !menu.hidden && available[focusIndex]) {
                event.preventDefault();
                choose(available[focusIndex]);
            }
            if (event.key === 'Tab') close();
        });
        select.addEventListener('change', sync);
        document.addEventListener('pointerdown', event => {
            if (!wrap.contains(event.target) && !menu.contains(event.target)) close();
        });
        document.addEventListener('scroll', position, true);
        window.addEventListener('resize', position);
        tanahCombos.push({ sync, close });
        sync();
    }

    form?.querySelectorAll('select[name]').forEach(setupTanahCombo);

    /**
     * ========================================================================
     * 12. PILIH TRANSAKSI NILAI ASET
     * ========================================================================
     *
     * Yang otomatis diisi:
     * - ID Nilai Aktiva
     * - ID Lokasi
     * - Nama Lokasi
     * - Alamat
     *
     * Yang TIDAK otomatis diisi:
     * - Tahun Tanah
     * - Barang
     * - Penggunaan
     * - Penunjukan
     * - Sertifikat
     * - Gambar Situasi
     * - Kepemilikan
     *
     * Bagian tersebut harus dilengkapi petugas Tanah.
     */

    function chooseSource(source)
    {
        if (
            !source?.id
            ||
            !source?.id_lokasi
        ) {
            notify(
                'Transaksi ini belum mempunyai ID atau lokasi yang valid.',
                true
            );

            return;
        }


        setField(
            'tanahNilaiAktivaId',
            source.id
        );


        setField(
            'tanahLokasiId',
            source.id_lokasi
        );


        setField(
            'tanahLokasiName',
            source.lokasi || ''
        );


        setField(
            'tanahAlamat',
            source.alamat || ''
        );


        /**
         * Tahun sengaja dikosongkan.
         * Tahun Tanah diisi oleh petugas.
         */

        setField(
            'tanahTahun',
            ''
        );


        const selectedSource =
            $('#tanahSelectedSource');


        if (selectedSource) {
            selectedSource.hidden =
                false;
        }


        const selectedTitle =
            $('#tanahSelectedTitle');


        if (selectedTitle) {

            selectedTitle.textContent =
                `${source.lokasi || '-'} · ${
                    source.no_voucher
                    || '-'
                }`;

        }


        const jenis =
            Number(source.jenisn) === 2
                ? 'Penambahan Nilai'
                : 'Penambahan Aset';


        const selectedMeta =
            $('#tanahSelectedMeta');


        if (selectedMeta) {

            selectedMeta.textContent =
                `${jenis}`
                +
                ` · Tahun transaksi ${
                    source.tahun || '-'
                }`
                +
                ` · ${
                    source.departemen
                    || '-'
                } / ${
                    source.divisi
                    || '-'
                }`
                +
                ` · ${
                    formatRupiah(
                        source.nilai
                    )
                }`;

        }


        /**
         * Sembunyikan daftar Nilai Aset
         * setelah transaksi dipilih.
         */

        const sourceSection =
            $('#tanahSourceSection');


        if (sourceSection) {
            sourceSection.hidden =
                true;
        }


        /**
         * Scroll ke bagian Informasi Tanah.
         */

        const formSections =
            $(
                '.tanah-form-section',
                form
            );


        const informationSection =
            $$('.tanah-form-section', form)[1];


        informationSection
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
    }


    /**
     * Reset form ke mode Tambah.
     */

    function resetForm()
    {
        form?.reset();
        form?.querySelectorAll('option[data-tanah-historical="1"]').forEach(opt => opt.remove());
        resetTanahAttachments();
        syncTanahCombos();

        if (form) {
            form.action =
                BASE_URL;
        }


        if (formMethod) {
            formMethod.value =
                '';

            formMethod.disabled =
                true;
        }


        setField(
            'tanahEditingId',
            ''
        );


        const formTitle =
            $('#tanahFormTitle');


        if (formTitle) {
            formTitle.textContent =
                'Tambah Data Tanah';
        }


        [
            'tanahNilaiAktivaId',
            'tanahLokasiId',
            'tanahLokasiName',
            'tanahAlamat',
        ].forEach(
            id => setField(
                id,
                ''
            )
        );


        const selectedSource =
            $('#tanahSelectedSource');


        if (selectedSource) {
            selectedSource.hidden =
                true;
        }


        const sourceSection =
            $('#tanahSourceSection');


        if (sourceSection) {
            sourceSection.hidden =
                false;
        }


        const fileSelected =
            $('#tanahFileSelected');


        if (fileSelected) {
            fileSelected.hidden =
                true;
        }


        const previewSelectedPdf =
            $('#tanahPreviewSelectedPdf');


        if (previewSelectedPdf) {
            previewSelectedPdf.hidden =
                true;
        }
    }


    /**
     * ========================================================================
     * 13. FILTER DATA NILAI ASET
     * ========================================================================
     */

    function getFilteredPending()
    {
        const keyword =
            (
                $('#tanahSourceSearch')
                    ?.value
                || ''
            )
                .trim()
                .toLowerCase();


        return pendingTransactions
            .filter(
                item => {

                    const searchable = [
                        item.no_voucher,
                        item.lokasi,
                        item.alamat,
                        item.departemen,
                        item.divisi,
                        item.tahun,
                        item.urai,
                        item.nilai,
                    ]
                        .join(' ')
                        .toLowerCase();


                    return searchable
                        .includes(keyword);

                }
            );
    }


    /**
     * ========================================================================
     * 14. RENDER TABEL NILAI ASET
     * ========================================================================
     *
     * Semua transaksi pending kategori Tanah
     * mendapatkan tombol "Pilih".
     *
     * Tidak dibedakan antara:
     * - jenisn = 1 Penambahan Aset
     * - jenisn = 2 Penambahan Nilai
     */

    function renderPending()
    {
        if (!sourceBody) {
            return;
        }


        sourceBody.replaceChildren();


        const data =
            getFilteredPending();


        const totalLabel =
            $('#tanahSourceTotal');


        if (totalLabel) {
            totalLabel.textContent =
                `${
                    integerFormatter.format(
                        data.length
                    )
                } data`;
        }


        if (
            data.length === 0
        ) {
            sourceBody.innerHTML = `
                <tr>
                    <td
                        colspan="9"
                        class="tanah-source-empty"
                    >
                        Tidak ada transaksi yang sesuai.
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(
            (
                item,
                index
            ) => {

                const row =
                    document.createElement(
                        'tr'
                    );


                row.innerHTML = `
                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(
                                item.no_voucher
                                || '-'
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                formatDate(
                                    item.tgl_voucher
                                )
                            )}
                        </small>
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(
                                item.lokasi
                                || '-'
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                item.alamat
                                || '-'
                            )}
                        </small>
                    </td>

                    <td>
                        ${escapeHtml(
                            item.departemen
                            || '-'
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.divisi
                            || '-'
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.tahun
                            || '-'
                        )}
                    </td>

                    <td>
                        <strong>
                            ${formatRupiah(
                                item.nilai
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            item.urai
                            || '-'
                        )}
                    </td>

                    <td>
                        <button
                            type="button"
                            class="tanah-source-select"
                            title="Gunakan transaksi ini untuk mengisi data Tanah"
                        >
                            Pilih
                        </button>
                    </td>
                `;


                const chooseButton =
                    $(
                        '.tanah-source-select',
                        row
                    );


                chooseButton
                    ?.addEventListener(
                        'click',
                        function () {

                            chooseSource(item);

                        }
                    );


                sourceBody
                    .appendChild(row);
            }
        );
    }


    $('#tanahSourceSearch')
        ?.addEventListener(
            'input',
            renderPending
        );


    /**
     * ========================================================================
     * 15. LOAD DATA PENDING
     * ========================================================================
     */

    /**
 * ========================================================================
 * LOAD DATA NILAI ASET PENDING TANAH
 * ========================================================================
 *
 * Endpoint:
 * /kib/pending/tanah
 *
 * Kompatibilitas:
 * - Penambahan Aset yang belum diproses
 * - Penambahan Nilai historis yang masih stat = 0
 *
 * Jumlah pending ditampilkan sebagai satu badge.
 *
 */

async function loadPending()
{
    try {

        /*
        |--------------------------------------------------------------------------
        | 01. AMBIL DATA DARI SERVER
        |--------------------------------------------------------------------------
        */

        const response = await getJson(PENDING_URL);

        if (!response.success) {
            throw new Error(
                'Endpoint pending tidak mengembalikan status sukses.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | 02. SIMPAN ARRAY TRANSAKSI
        |--------------------------------------------------------------------------
        */

        pendingTransactions = Array.isArray(response.data)
            ? response.data
            : [];

        /*
        |--------------------------------------------------------------------------
        | 03. TOTAL PENDING
        |--------------------------------------------------------------------------
        */

        const total = Math.max(
            0,
            Number(
                response.pending_inventaris
                ?? response.count
                ?? pendingTransactions.length
            ) || 0
        );

        /*
        |--------------------------------------------------------------------------
        | 04. UPDATE BADGE TOTAL
        |--------------------------------------------------------------------------
        */

        const incomingCount = $('#tanahIncomingCount');

        if (incomingCount) {
            incomingCount.textContent = total > 99
                ? '99+'
                : integerFormatter.format(total);
        }

        /*
        |--------------------------------------------------------------------------
        | 05. UPDATE SATU BADGE PENDING
        |--------------------------------------------------------------------------
        */

        const incomingNew = $('#tanahIncomingNew');

        if (incomingNew) {
            incomingNew.textContent =
                integerFormatter.format(total);
        }

        /*
        |--------------------------------------------------------------------------
        | 06. UPDATE KETERANGAN
        |--------------------------------------------------------------------------
        */

        const incomingText = $('#tanahIncomingText');

        if (incomingText) {
            incomingText.textContent = total > 0
                ? `Ada ${
                    integerFormatter.format(total)
                } transaksi Nilai Aset kategori Tanah yang menunggu pendataan K.I.B.`
                : 'Tidak ada transaksi Tanah yang menunggu diproses.';
        }

        /*
        |--------------------------------------------------------------------------
        | 07. STATUS KARTU
        |--------------------------------------------------------------------------
        */

        $('#tanahIncomingCard')
            ?.classList.toggle(
                'is-empty',
                total === 0
            );

    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | 08. PENANGANAN ERROR
        |--------------------------------------------------------------------------
        */

        console.error(
            'Gagal memuat Pending Tanah:',
            error
        );

        pendingTransactions = [];

        const incomingText = $('#tanahIncomingText');

        if (incomingText) {
            incomingText.textContent =
                'Notifikasi belum bisa dimuat. Periksa koneksi dan log Laravel.';
        }
    }

    /*
    |--------------------------------------------------------------------------
    | 09. RENDER TABEL PILIH DATA NILAI ASET
    |--------------------------------------------------------------------------
    */

    renderPending();
}

    /**
     * ========================================================================
     * 16. BUTTON TAMBAH
     * ========================================================================
     */

    function openCreateForm()
    {
        resetForm();

        openDialog(
            'tanahFormModal'
        );
    }


    $('#btnTambah')
        ?.addEventListener(
            'click',
            openCreateForm
        );


    $('#tanahAddButton')
        ?.addEventListener(
            'click',
            openCreateForm
        );


    $('#tanahIncomingButton')
        ?.addEventListener(
            'click',
            openCreateForm
        );


    /**
     * Ganti transaksi sumber.
     */

    $('#tanahChangeSourceButton')
        ?.addEventListener(
            'click',
            function () {

                const section =
                    $('#tanahSourceSection');


                if (section) {
                    section.hidden =
                        false;
                }


                $('#tanahSourceSearch')
                    ?.focus();

            }
        );


    /**
     * Event dari komponen notification global.
     */

    window.addEventListener(
        'kib:source-selected',
        function (event) {

            if (!event.detail) {
                return;
            }


            resetForm();


            openDialog(
                'tanahFormModal'
            );


            chooseSource(
                event.detail
            );

        }
    );


    /**
     * ========================================================================
     * 17. EDIT DATA TANAH
     * ========================================================================
     */

    function fillEditForm(data)
    {
        resetForm();


        if (form) {
            form.action =
                `${BASE_URL}/${
                    encodeURIComponent(
                        data.id
                    )
                }`;
        }


        if (formMethod) {
            formMethod.value =
                'PUT';

            formMethod.disabled =
                false;
        }


        setField(
            'tanahEditingId',
            data.id
        );


        $('#tanahFormTitle').textContent =
            'Edit Sertifikat Tanah';


        $('#tanahSourceSection').hidden =
            true;


        $('#tanahSelectedSource').hidden =
            false;


        $('#tanahSelectedTitle').textContent =
            `${data.lokasi || '-'} · ${
                data.sertifikat
                || '-'
            }`;


        $('#tanahSelectedMeta').textContent =
            `Tahun ${
                data.tahun || '-'
            } · ID sertifikat ${
                data.id
            }`;


        const fields = {

            tanahNilaiAktivaId:
                data.nilai_aktiva_id,

            tanahLokasiId:
                data.id_lokasi,

            tanahLokasiName:
                data.lokasi,

            tanahAlamat:
                data.alamat,

            tanahBarang:
                data.id_barang,

            tanahStatusKepemilikan:
                data.status_kepemilikan,

            tanahTahun:
                data.tahun,

            tanahGuna:
                data.guna,

            tanahNoTunjuk:
                data.no_tunjuk,

            tanahTglTunjuk:
                toDateInput(
                    data.tgl_tunjuk
                ),

            tanahLuasTunjuk:
                data.luas_tunjuk,

            tanahSertifikat:
                data.sertifikat,

            tanahTglSertifikat:
                toDateInput(
                    data.tgl_sertifikat
                ),

            tanahLuasSertifikat:
                data.luas_sertifikat,

            tanahNoGambar:
                data.no_gambar,

            tanahTglGambar:
                toDateInput(
                    data.tgl_gambar
                ),

            tanahLuasGambar:
                data.luas_gambar,

            tanahAsal:
                data.asal,

            tanahHak:
                data.hak,

            tanahPemilik:
                data.pemilik,

            tanahKeterangan:
                data.ket,
        };


        // Barang lama yang nonaktif tidak ada di dropdown Tambah, namun tetap
        // boleh dipertahankan tanpa mengubah hubungan historis.
        const barangOptionExists = Array.from($('#tanahBarang')?.options || [])
            .some(opt => opt.value === String(data.id_barang));
        if (data.id_barang && !barangOptionExists) {
            const oldOption = new Option(
                [data.kode_barang, data.nama_barang].filter(Boolean).join(' - ') + ' (Historis)',
                String(data.id_barang)
            );
            oldOption.dataset.tanahHistorical = '1';
            $('#tanahBarang')?.add(oldOption);
        }

        Object.entries(
            fields
        )
            .forEach(
                (
                    [id, value]
                ) => {

                    selectValue(
                        `#${id}`,
                        value === '-'
                            ? ''
                            : value
                    );

                }
            );
        syncTanahCombos();
    }


    /**
     * ========================================================================
     * 18. VALIDASI FORM SEBELUM SUBMIT
     * ========================================================================
     */

    form?.addEventListener(
        'submit',
        function (event) {

            const isCreateMode =
                formMethod?.disabled
                !== false;


            if (
                isCreateMode
                &&
                !$('#tanahNilaiAktivaId')
                    ?.value
            ) {
                event.preventDefault();


                notify(
                    'Pilih sumber transaksi Nilai Aset terlebih dahulu.',
                    true
                );

                return;
            }


            if (
                !$('#tanahLokasiId')
                    ?.value
            ) {
                event.preventDefault();


                notify(
                    'Lokasi Tanah belum tersedia.',
                    true
                );

                return;
            }


            if (
                !form.checkValidity()
            ) {
                event.preventDefault();


                form.reportValidity();

                return;
            }


            const submitButton =
                $(
                    'button[type="submit"]',
                    form
                );


            if (submitButton) {
                submitButton.disabled =
                    true;
            }

        }
    );


    // ========================================================================
    // 19. MULTI UPLOAD PDF / FOTO (TANPA LIMIT UKURAN KHUSUS FRONTEND)
    // ========================================================================

    let temporaryPdfUrl = null;
    const pdfInput = $('#tanahPdfInput');
    const fotoInput = $('#tanahFotoInput');
    const pdfPreview = $('#tanahPreviewSelectedPdf');
    const attachmentTypes = [
        { input: pdfInput, list: $('#tanahPdfSelectedList'), kind: 'pdf', files: [] },
        { input: fotoInput, list: $('#tanahFotoSelectedList'), kind: 'gambar', files: [] },
    ];

    function syncNativeFiles(type) {
        if (!type.input) return;
        if (typeof DataTransfer === 'undefined') return;
        const transfer = new DataTransfer();
        type.files.forEach(file => transfer.items.add(file));
        type.input.files = transfer.files;
    }

    function renderAttachments(type) {
        if (!type.list) return;
        type.list.replaceChildren();
        type.list.hidden = type.files.length === 0;

        for (const [index, file] of type.files.entries()) {
            const row = document.createElement('div');
            row.className = 'tanah-attachment-row';
            const name = document.createElement('span');
            name.textContent = `${file.name} (${(file.size / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 2 })} MB)`;
            const actions = document.createElement('div');
            actions.className = 'tanah-attachment-actions';
            const view = document.createElement('button');
            view.type = 'button';
            view.textContent = 'Preview';
            view.addEventListener('click', () => {
                const url = URL.createObjectURL(file);
                if (type.kind === 'pdf') {
                    if (temporaryPdfUrl) URL.revokeObjectURL(temporaryPdfUrl);
                    temporaryPdfUrl = url;
                    showPdf({ view_url: url, download_url: url, nama: file.name }, true);
                } else {
                    window.open(url, '_blank', 'noopener');
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                }
            });
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Hapus';
            remove.addEventListener('click', () => {
                type.files.splice(index, 1);
                syncNativeFiles(type);
                renderAttachments(type);
            });
            actions.append(view, remove);
            row.append(name, actions);
            type.list.appendChild(row);
        }

        const selected = $('#tanahFileSelected');
        const total = attachmentTypes.reduce((sum, item) => sum + item.files.length, 0);
        if (selected) selected.hidden = total === 0;
        if ($('#tanahFileName')) $('#tanahFileName').textContent = `${total} file dipilih`;
        if (pdfPreview) pdfPreview.hidden = attachmentTypes[0].files.length === 0;
    }

    function resetTanahAttachments() {
        attachmentTypes.forEach(type => {
            type.files = [];
            if (type.input) type.input.value = '';
            renderAttachments(type);
        });
        if (temporaryPdfUrl) {
            URL.revokeObjectURL(temporaryPdfUrl);
            temporaryPdfUrl = null;
        }
    }

    attachmentTypes.forEach(type => {
        type.input?.addEventListener('change', () => {
            const incoming = Array.from(type.input.files || []);
            for (const file of incoming) {
                const valid = type.kind === 'pdf'
                    ? (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))
                    : ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
                if (!valid) {
                    notify(`${file.name}: format lampiran tidak didukung.`, true);
                    continue;
                }
                if (!type.files.some(old => old.name === file.name &&
                    old.size === file.size && old.lastModified === file.lastModified)) {
                    type.files.push(file);
                }
            }
            syncNativeFiles(type);
            renderAttachments(type);
        });
    });

    pdfPreview?.addEventListener('click', () => {
        const first = attachmentTypes[0].files[0];
        if (!first) return;
        if (temporaryPdfUrl) URL.revokeObjectURL(temporaryPdfUrl);
        temporaryPdfUrl = URL.createObjectURL(first);
        showPdf({ view_url: temporaryPdfUrl, download_url: temporaryPdfUrl, nama: first.name }, true);
    });

    /**
     * ========================================================================
     * 20. VIEW DATA TANAH - DESAIN WEB LAMA
     * ========================================================================
     *
     * Kiri:
     * - daftar sertifikat
     * - pemilik asal
     * - luas
     *
     * Kanan:
     * - foto lokasi
     * - informasi barang
     * - penunjukan
     * - sertifikat
     * - gambar situasi
     * - hak / pemilik
     * - PDF
     */

    let activeLocationId =
        null;

    let fallbackLocationPhotoUrl = null;


    let activeLocationName =
        '';


    let activeCertificate =
        null;


    let locationRequestSequence =
        0;


    function setLegacyText(
        id,
        value
    ) {
        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        const finalValue =
            value === null
            ||
            value === undefined
            ||
            String(value)
                .trim()
                === ''
                ? '-'
                : String(value);


        element.textContent =
            finalValue;
    }


    function formatArea(value)
    {
        const area =
            value === null
            ||
            value === undefined
                ? ''
                : String(value)
                    .trim();


        return (
            area
            &&
            area !== '-'
        )
            ? `${area} m²`
            : '-';
    }


    /**
     * Foto lokasi.
     */

    function showLocationPhoto(url)
    {
        const image =
            $('#tanahLegacyPhoto');


        const emptyState =
            $('#tanahLegacyPhotoEmpty');


        if (
            !image
            ||
            !emptyState
        ) {
            return;
        }


        image.onerror =
            function () {

                image.hidden =
                    true;


                emptyState.hidden =
                    false;

            };


        if (url) {

            image.src =
                url;


            image.hidden =
                false;


            emptyState.hidden =
                true;

        } else {

            image.removeAttribute(
                'src'
            );


            image.hidden =
                true;


            emptyState.hidden =
                false;

        }
    }


    /**
     * ========================================================================
     * 21. PILIH SERTIFIKAT PADA MODAL VIEW
     * ========================================================================
     */

    function selectCertificate(record, revealAttachments = false)
    {
        if (!record) {
            return;
        }


        activeCertificate =
            record;


        /**
         * Aktifkan baris sertifikat pada tabel K.I.B A.
         */

        $$(
            '.tanah-excel-row',
            $('#tanahExcelBody')
        )
            .forEach(
                button => {

                    const active =
                        String(
                            button.dataset.id
                        )
                        ===
                        String(
                            record.id
                        );


                    button.classList.toggle(
                        'active',
                        active
                    );


                    button.setAttribute(
                        'aria-selected',
                        String(active)
                    );

                }
            );


        /**
         * Isi informasi detail.
         */

        const mapping = {

            tanahLegacyGuna:
                record.guna,

            tanahLegacyKode:
                `Sertifikat #${
                    record.id
                } • ${
                    record.sertifikat
                    || 'Tanpa nomor sertifikat'
                }`,

            tanahLegacyAlamat:
                record.alamat,

            tanahLegacyBarang:
                record.nama_barang,

            tanahLegacyKodeBarang:
                record.kode_barang,

            tanahLegacyAsal:
                record.asal,

            tanahLegacyTahun:
                record.tahun,

            tanahLegacyPenggunaan:
                record.guna,

            tanahLegacyNoTunjuk:
                record.no_tunjuk,

            tanahLegacyTglTunjuk:
                formatDate(
                    record.tgl_tunjuk
                ),

            tanahLegacyLuasTunjuk:
                formatArea(
                    record.luas_tunjuk
                ),

            tanahLegacySertifikat:
                record.sertifikat,

            tanahLegacyTglSertifikat:
                formatDate(
                    record.tgl_sertifikat
                ),

            tanahLegacyLuasSertifikat:
                formatArea(
                    record.luas_sertifikat
                ),

            tanahLegacyNoGambar:
                record.no_gambar,

            tanahLegacyTglGambar:
                formatDate(
                    record.tgl_gambar
                ),

            tanahLegacyLuasGambar:
                formatArea(
                    record.luas_gambar
                ),

            tanahLegacyStatusKepemilikan:
                ownershipLabel(record.status_kepemilikan),

            tanahLegacyHak:
                record.hak,

            tanahLegacyPemilik:
                record.pemilik,

            tanahLegacyKeterangan:
                record.ket,
        };


        Object.entries(
            mapping
        )
            .forEach(
                (
                    [id, value]
                ) => {

                    setLegacyText(
                        id,
                        value
                    );

                }
            );


        const gallery = $('#tanahLegacyPhotoGallery');
        if (gallery) {
            gallery.replaceChildren();
            const photos = Array.isArray(record.gambar) ? record.gambar : [];
            gallery.hidden = photos.length === 0;
            photos.forEach(photo => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'tanah-photo-thumb';
                item.title = photo.nama || 'Lihat foto';
                const img = document.createElement('img');
                img.src = photo.view_url;
                img.alt = photo.nama || 'Foto tanah';
                img.loading = 'lazy';
                item.appendChild(img);
                item.addEventListener('click', () => showLocationPhoto(photo.view_url));
                gallery.appendChild(item);
            });
            if (photos[0]?.view_url) {
                showLocationPhoto(photos[0].view_url);
            } else {
                showLocationPhoto(fallbackLocationPhotoUrl);
            }
        }

        /**
         * Dokumen PDF sertifikat.
         */

        const documentList =
            $('#tanahLegacyDocuments');


        if (documentList) {

            documentList
                .replaceChildren();


            if (
                !Array.isArray(
                    record.pdfs
                )
                ||
                record.pdfs.length
                === 0
            ) {
                const empty =
                    document.createElement(
                        'span'
                    );


                empty.className =
                    'tanah-legacy-doc-empty';


                empty.textContent =
                    'Belum ada PDF untuk sertifikat ini.';


                documentList
                    .appendChild(empty);

            } else {

                record.pdfs
                    .forEach(
                        pdf => {

                            const group =
                                document.createElement(
                                    'div'
                                );


                            group.className =
                                'tanah-legacy-doc-item';


                            const fileName =
                                document.createElement(
                                    'span'
                                );


                            fileName.textContent =
                                pdf.nama
                                || 'Dokumen Tanah';


                            fileName.title =
                                pdf.nama
                                || 'Dokumen Tanah';


                            const preview =
                                document.createElement(
                                    'button'
                                );


                            preview.type =
                                'button';


                            preview.className =
                                'tanah-legacy-doc-preview';


                            preview.textContent =
                                'Lihat PDF';


                            preview.addEventListener(
                                'click',
                                function () {

                                    showPdf(pdf);

                                }
                            );


                            const download =
                                document.createElement(
                                    'a'
                                );


                            download.className =
                                'tanah-legacy-doc-download';


                            download.textContent =
                                'Unduh';


                            download.href =
                                pdf.download_url;


                            group.append(
                                fileName,
                                preview,
                                download
                            );


                            documentList
                                .appendChild(
                                    group
                                );

                        }
                    );

            }

        }


        const attachmentsPanel = $('#tanahLegacyDetails');
        const emptyPanel = $('#tanahLegacyEmpty');

        if (emptyPanel) {
            emptyPanel.hidden = true;
        }

        if (attachmentsPanel && revealAttachments) {
            attachmentsPanel.hidden = false;
        }


        /**
         * Pada layar kecil,
         * pindah ke bagian detail.
         */

        // Tabel panjang tetap berada pada posisi awal, termasuk di layar kecil.


        refreshIcons();
    }


    // Tutup panel lampiran tanpa menutup tabel inventaris.
    $('#tanahCloseAttachments')?.addEventListener('click', () => {
        const panel = $('#tanahLegacyDetails');
        if (panel) panel.hidden = true;
        $('#tanahExcelScroll')?.focus({ preventScroll: true });
    });

    /**
     * ========================================================================
     * 22. BUKA DATA TANAH PER LOKASI
     * ========================================================================
     */

    /**
     * Membuat satu baris K.I.B A bergaya Excel.
     * Gunakan textContent agar data dari database tidak ditafsirkan sebagai HTML.
     * Seluruh field mengikuti JSON endpoint lokasi/{id}/sertifikat yang sudah ada.
     */
    function createTanahExcelRow(record, index) {
        const row = document.createElement('tr');
        row.className = 'tanah-excel-row';
        row.dataset.id = String(record.id);
        row.tabIndex = 0;
        row.setAttribute('aria-selected', 'false');
        row.setAttribute('aria-label', `Sertifikat ${index + 1}: ${record.nama_barang || 'Tanah'}`);

        const appendCell = (value, className = '', detail = null) => {
            const cell = document.createElement('td');
            if (className) cell.className = className;
            const primary = document.createElement('span');
            primary.className = 'tanah-excel-primary';
            const normalized = value == null ? '' : String(value).trim();
            primary.textContent = normalized || '-';
            cell.appendChild(primary);
            if (detail != null && String(detail).trim() && String(detail).trim() !== '-') {
                const secondary = document.createElement('small');
                secondary.className = 'tanah-excel-secondary';
                secondary.textContent = String(detail);
                cell.appendChild(secondary);
            }
            row.appendChild(cell);
            return cell;
        };

        appendCell(index + 1, 'tanah-excel-no');
        appendCell(record.alamat || activeLocationName, 'tanah-excel-alamat');
        appendCell(record.nama_barang, 'tanah-excel-nama');
        appendCell(record.kode_barang, 'tanah-excel-kode');
        appendCell(record.no_tunjuk, '', formatDate(record.tgl_tunjuk));
        appendCell(record.tahun, 'tanah-excel-center');
        appendCell(record.luas_tunjuk, 'tanah-excel-number');
        appendCell(record.hak);
        appendCell(record.sertifikat, '', formatDate(record.tgl_sertifikat));
        appendCell(record.luas_sertifikat, 'tanah-excel-number');
        appendCell(record.guna);
        appendCell(record.asal);
        appendCell(record.ket);

        const ownerCell = appendCell('', 'tanah-excel-owner-cell');
        ownerCell.replaceChildren();
        const badge = document.createElement('span');
        const status = String(record.status_kepemilikan || '').toLowerCase();
        badge.className = `tanah-ownership-badge ${['perumdam','pusat','pemprov','pemkot','swasta'].includes(status) ? status : 'belum'}`;
        badge.textContent = ownershipLabel(status);
        ownerCell.appendChild(badge);

        const actionCell = document.createElement('td');
        actionCell.className = 'tanah-excel-actions';
        const detailButton = document.createElement('button');
        detailButton.type = 'button';
        detailButton.className = 'tanah-excel-detail-button';
        detailButton.textContent = 'Berkas';
        detailButton.setAttribute('aria-label', `Lihat berkas dan tindakan sertifikat ${index + 1}`);

        const revealSelected = () => {
            selectCertificate(record, true);
            requestAnimationFrame(() => {
                $('#tanahLegacyDetails')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            });
        };

        detailButton.addEventListener('click', event => {
            event.stopPropagation();
            revealSelected();
        });
        actionCell.appendChild(detailButton);
        row.appendChild(actionCell);

        row.addEventListener('click', revealSelected);
        row.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                if (event.target !== row) return;
                event.preventDefault();
                revealSelected();
            }
        });
        return row;
    }

    // Cari di seluruh kolom utama K.I.B A tanpa request tambahan.
    let excelLocationRecords = [];

    function renderExcelRows() {
        const body = $('#tanahExcelBody');
        if (!body) return;

        const keyword = String($('#tanahExcelSearch')?.value || '')
            .trim()
            .toLocaleLowerCase('id-ID');

        const filtered = excelLocationRecords.filter(record => {
            if (!keyword) return true;

            return [
                record.alamat,
                record.nama_barang,
                record.kode_barang,
                record.no_tunjuk,
                record.sertifikat,
                record.tahun,
                record.hak,
                record.guna,
                record.asal,
                record.ket,
                ownershipLabel(record.status_kepemilikan)
            ].some(value => String(value ?? '')
                .toLocaleLowerCase('id-ID')
                .includes(keyword));
        });

        body.replaceChildren();

        if (!filtered.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 15;
            cell.className = 'tanah-excel-message';
            cell.textContent = excelLocationRecords.length
                ? 'Tidak ada data tanah yang sesuai pencarian.'
                : 'Belum ada sertifikat pada lokasi ini.';
            row.appendChild(cell);
            body.appendChild(row);
        } else {
            filtered.forEach((record, index) => {
                body.appendChild(createTanahExcelRow(record, index));
            });
        }

        setLegacyText(
            'tanahLegacyRecordCount',
            keyword
                ? `${filtered.length} dari ${excelLocationRecords.length} data`
                : `${excelLocationRecords.length} data`
        );

        const selected = activeCertificate?.id;
        if (selected != null) {
            $$('.tanah-excel-row', body).forEach(row => {
                const active = row.dataset.id === String(selected);
                row.classList.toggle('active', active);
                row.setAttribute('aria-selected', String(active));
            });
        }
    }

    $('#tanahExcelSearch')?.addEventListener('input', renderExcelRows);

    async function openLocation(
        locationId,
        locationName,
        preferredCertificateId = null
    ) {
        activeLocationId =
            String(locationId);
        fallbackLocationPhotoUrl = null;


        activeLocationName =
            locationName
            || 'Lokasi';


        activeCertificate =
            null;


        const requestId =
            ++locationRequestSequence;

        // Modal selalu dimulai dari posisi awal, tidak mewarisi posisi scroll sebelumnya.
        excelLocationRecords = [];
        const searchInput = $('#tanahExcelSearch');
        if (searchInput) searchInput.value = '';
        const attachments = $('#tanahLegacyDetails');
        if (attachments) attachments.hidden = true;
        const workspace = $('.tanah-sheet-workspace');
        const tableScroll = $('#tanahExcelScroll');
        if (workspace) workspace.scrollTop = 0;
        if (tableScroll) {
            tableScroll.scrollLeft = 0;
            tableScroll.scrollTop = 0;
        }


        setLegacyText(
            'tanahLocationTitle',
            `DATA TANAH • ${
                activeLocationName
            }`
        );


        setLegacyText(
            'tanahLegacyLocationAddress',
            'Memuat data lokasi...'
        );


        setLegacyText(
            'tanahLegacyRecordCount',
            '0 data'
        );


        const list = $('#tanahExcelBody');

        if (list) {
            list.innerHTML = '<tr><td colspan="15" class="tanah-excel-message">Memuat daftar sertifikat...</td></tr>';
        }

        $('#tanahLegacyEmpty').hidden = false;
        $('#tanahLegacyDetails').hidden = true;
        showLocationPhoto(null);
        openDialog('tanahLocationModal');
        requestAnimationFrame(() => {
            const sheet = $('.tanah-sheet-workspace');
            const table = $('#tanahExcelScroll');
            if (sheet) sheet.scrollTop = 0;
            if (table) {
                table.scrollLeft = 0;
                table.scrollTop = 0;
            }
        });

        try {
            const result = await getJson(
                `${LOCATION_URL}/${encodeURIComponent(locationId)}/sertifikat`
            );

            if (requestId !== locationRequestSequence) return;

            const rows = Array.isArray(result.data) ? result.data : [];

            setLegacyText(
                'tanahLegacyLocationAddress',
                result.lokasi?.alamat || `Lokasi: ${activeLocationName}`
            );
            setLegacyText(
                'tanahLegacyRecordCount',
                `${integerFormatter.format(rows.length)} data`
            );

            excelLocationRecords = rows;
            renderExcelRows();


            /**
             * Pilih sertifikat yang diminta.
             * Jika tidak ada, pilih sertifikat pertama.
             */

            if (
                rows.length > 0
            ) {
                const preferred =
                    rows.find(
                        record =>
                            String(record.id)
                            ===
                            String(
                                preferredCertificateId
                            )
                    );


                selectCertificate(
                    preferred
                    || rows[0]
                );
            }


            refreshIcons();


            /**
             * Load foto lokasi dari endpoint detail
             * KIBController yang sudah ada.
             */

            getJson(
                `${LOCATION_URL}/${
                    encodeURIComponent(
                        locationId
                    )
                }/detail`
            )
                .then(
                    detail => {

                        if (
                            requestId
                            !==
                            locationRequestSequence
                        ) {
                            return;
                        }


                        fallbackLocationPhotoUrl = detail.lokasi?.image_url || null;
                        if (!activeCertificate?.gambar?.length) {
                            showLocationPhoto(fallbackLocationPhotoUrl);
                        }

                    }
                )
                .catch(
                    function () {

                        showLocationPhoto(
                            null
                        );

                    }
                );

        } catch (error) {

            handleError(
                error,
                'Detail Tanah gagal dimuat'
            );


            if (list) {
                list.innerHTML = '<tr><td colspan="15" class="tanah-excel-message">Gagal memuat daftar sertifikat.</td></tr>';
            }


            setLegacyText(
                'tanahLegacyLocationAddress',
                'Silakan periksa koneksi atau log Laravel.'
            );

        }
    }


    /**
     * ========================================================================
     * 23. ACTION DI MODAL VIEW
     * ========================================================================
     */

    $('#tanahLegacyEditButton')
        ?.addEventListener(
            'click',
            function () {

                if (
                    activeCertificate
                ) {
                    editRecord(
                        activeCertificate.id
                    );
                }

            }
        );


    $('#tanahLegacyDeleteButton')
        ?.addEventListener(
            'click',
            function () {

                if (
                    activeCertificate
                ) {
                    askDelete(
                        activeCertificate.id,

                        `${
                            activeCertificate.pemilik
                            ||
                            activeCertificate.sertifikat
                            ||
                            'Sertifikat'
                        } (${
                            activeLocationName
                        })`
                    );
                }

            }
        );


    $('#tanahLegacyNilaiButton')
        ?.addEventListener(
            'click',
            function () {

                if (
                    activeLocationId
                ) {
                    openNilai(
                        activeLocationId,
                        activeLocationName
                    );
                }

            }
        );


    /**
     * ========================================================================
     * 24. ACTION TABEL UTAMA
     * ========================================================================
     */

    $('#tanahTableBody')
        ?.addEventListener(
            'click',
            function (event) {

                const row =
                    event.target.closest(
                        '.tanah-data-row'
                    );


                if (!row) {
                    return;
                }


                const locationId =
                    row.dataset.locationId;


                const locationName =
                    $(
                        '.tanah-location-cell strong',
                        row
                    )
                        ?.textContent
                        ?.trim()
                    || 'Lokasi';


                /**
                 * Klik Nilai.
                 */

                if (
                    event.target.closest(
                        '.js-tanah-nilai'
                    )
                ) {
                    openNilai(
                        locationId,
                        locationName
                    );

                    return;
                }


                /**
                 * Klik PDF.
                 */

                if (
                    event.target.closest(
                        '.js-tanah-pdf-list'
                    )
                ) {
                    openDocuments(
                        locationId,
                        locationName
                    );

                    return;
                }


                /**
                 * View / Edit / Delete pada tabel lokasi
                 * membuka daftar sertifikat lebih dahulu.
                 */

                if (
                    event.target.closest(
                        '.js-tanah-view, .js-tanah-edit, .js-tanah-delete'
                    )
                ) {
                    openLocation(
                        locationId,
                        locationName
                    );
                }

            }
        );


    /**
     * ========================================================================
     * 25. RIWAYAT NILAI ASET
     * ========================================================================
     */

    async function openNilai(
        locationId,
        locationName,
        selectedItem = null
    ) {
        $('#tanahNilaiTitle').textContent =
            `Riwayat Nilai • ${
                locationName
            }`;


        $('#tanahNilaiTotal').textContent =
            'Memuat...';


        $('#tanahNilaiBody').innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="tanah-empty"
                >
                    Memuat transaksi...
                </td>
            </tr>
        `;


        openDialog(
            'tanahNilaiModal'
        );


        try {

            const result =
                await getJson(
                    `${LOCATION_URL}/${
                        encodeURIComponent(
                            locationId
                        )
                    }/nilai`
                );


            const rows =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            /**
             * Jika transaksi yang dipilih belum ada
             * pada hasil query lama, tampilkan juga
             * di popup tanpa mengubah total database.
             */

            if (
                selectedItem
                &&
                !rows.some(
                    record =>
                        String(record.id)
                        ===
                        String(
                            selectedItem.id
                        )
                )
            ) {
                rows.unshift(
                    selectedItem
                );
            }


            $('#tanahNilaiTotal').textContent =
                formatRupiah(
                    result.total
                );


            const body =
                $('#tanahNilaiBody');


            body.replaceChildren();


            if (
                rows.length === 0
            ) {
                body.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            class="tanah-empty"
                        >
                            Belum ada transaksi Nilai Aset.
                        </td>
                    </tr>
                `;

                return;
            }


            let selectedRow =
                null;


            rows.forEach(
                (
                    record,
                    index
                ) => {

                    const row =
                        document.createElement(
                            'tr'
                        );


                    if (
                        selectedItem
                        &&
                        String(record.id)
                        ===
                        String(
                            selectedItem.id
                        )
                    ) {
                        row.classList.add(
                            'tanah-nilai-selected'
                        );


                        selectedRow =
                            row;
                    }


                    row.innerHTML = `
                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.no_voucher
                                || '-'
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                formatDate(
                                    record.tgl_voucher
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.tahun
                                || '-'
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.nama_aktiva
                                ||
                                record.aktiva
                                ||
                                '-'
                            )}
                        </td>

                        <td class="tanah-text-wrap">
                            ${escapeHtml(
                                record.urai
                                || '-'
                            )}
                        </td>

                        <td class="tanah-value-cell">
                            ${formatRupiah(
                                record.nilai
                            )}
                        </td>

                        <td>

                            ${
                                record.pdf_preview_url

                                    ? `
                                        <button
                                            type="button"
                                            class="tanah-pdf-button js-nilai-pdf"
                                        >
                                            <i data-lucide="file-text"></i>
                                            PDF
                                        </button>
                                    `

                                    : `
                                        <span class="tanah-pdf-empty">
                                            -
                                        </span>
                                    `
                            }

                        </td>
                    `;


                    if (
                        record.pdf_preview_url
                    ) {
                        $('.js-nilai-pdf', row)
                            ?.addEventListener(
                                'click',
                                function () {

                                    showPdf({
                                        view_url:
                                            record.pdf_preview_url,

                                        download_url:
                                            record.pdf_download_url,

                                        nama:
                                            record.pdf_nama
                                            ||
                                            'Dokumen Nilai Aset',
                                    });

                                }
                            );
                    }


                    body.appendChild(
                        row
                    );

                }
            );


            refreshIcons();


            selectedRow
                ?.scrollIntoView({
                    block: 'nearest',
                });

        } catch (error) {

            handleError(
                error,
                'Riwayat nilai gagal dimuat'
            );


            $('#tanahNilaiBody').innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="tanah-empty"
                    >
                        Gagal memuat nilai.
                    </td>
                </tr>
            `;

        }
    }


    /**
     * ========================================================================
     * 26. FETCH SATU DATA TANAH
     * ========================================================================
     */

    async function fetchRecord(id)
    {
        const result =
            await getJson(
                `${BASE_URL}/${
                    encodeURIComponent(id)
                }`
            );


        return result.data;
    }


    /**
     * ========================================================================
     * 27. VIEW SATU SERTIFIKAT
     * ========================================================================
     */

    async function viewRecord(id)
    {
        try {

            const record =
                await fetchRecord(id);


            await openLocation(
                record.id_lokasi,
                record.lokasi
                || 'Lokasi',
                record.id
            );

        } catch (error) {

            handleError(
                error,
                'Detail sertifikat gagal dimuat'
            );

        }
    }


    /**
     * ========================================================================
     * 28. EDIT SATU SERTIFIKAT
     * ========================================================================
     */

    async function editRecord(id)
    {
        try {

            const record =
                await fetchRecord(id);


            closeDialog(
                'tanahLocationModal'
            );


            fillEditForm(
                record
            );


            openDialog(
                'tanahFormModal'
            );

        } catch (error) {

            handleError(
                error,
                'Sertifikat gagal dimuat untuk diedit'
            );

        }
    }


    /**
     * ========================================================================
     * 29. DELETE SATU SERTIFIKAT
     * ========================================================================
     */

    function askDelete(
        id,
        name
    ) {
        if (!id) {

            notify(
                'ID sertifikat belum tersedia.',
                true
            );

            return;
        }


        const deleteForm =
            $('#tanahDeleteForm');


        if (deleteForm) {
            deleteForm.action =
                `${BASE_URL}/${
                    encodeURIComponent(id)
                }`;
        }


        $('#tanahDeleteName').textContent =
            name
            ||
            `Sertifikat #${id}`;


        closeDialog(
            'tanahLocationModal'
        );


        openDialog(
            'tanahDeleteModal'
        );
    }


    /**
     * ========================================================================
     * 30. DAFTAR PDF PER LOKASI
     * ========================================================================
     */

    async function openDocuments(
        locationId,
        locationName
    ) {
        $('#tanahDocumentsTitle').textContent =
            `Dokumen • ${
                locationName
            }`;


        $('#tanahDocumentsBody').innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="tanah-empty"
                >
                    Memuat dokumen PDF...
                </td>
            </tr>
        `;


        openDialog(
            'tanahDocumentsModal'
        );


        try {

            const result =
                await getJson(
                    `${LOCATION_URL}/${
                        encodeURIComponent(
                            locationId
                        )
                    }/pdf`
                );


            const rows =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            const body =
                $('#tanahDocumentsBody');


            body.replaceChildren();


            if (
                rows.length === 0
            ) {
                body.innerHTML = `
                    <tr>
                        <td
                            colspan="5"
                            class="tanah-empty"
                        >
                            Belum ada PDF untuk lokasi ini.
                        </td>
                    </tr>
                `;

                return;
            }


            rows.forEach(
                (
                    record,
                    index
                ) => {

                    const row =
                        document.createElement(
                            'tr'
                        );


                    row.innerHTML = `
                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.sertifikat
                                || '-'
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.tahun
                                || '-'
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.nama
                                || 'Dokumen PDF'
                            )}
                        </td>

                        <td>

                            <div class="tanah-actions">

                                <button
                                    type="button"
                                    class="view"
                                    title="Preview PDF"
                                >
                                    <i data-lucide="eye"></i>
                                </button>

                                <a
                                    class="tanah-pdf-button"
                                    href="${escapeHtml(
                                        record.download_url
                                    )}"
                                    download
                                    title="Unduh PDF"
                                >
                                    <i data-lucide="download"></i>

                                    Download
                                </a>

                            </div>

                        </td>
                    `;


                    $('button', row)
                        ?.addEventListener(
                            'click',
                            function () {

                                showPdf(
                                    record
                                );

                            }
                        );


                    body.appendChild(
                        row
                    );

                }
            );


            refreshIcons();

        } catch (error) {

            handleError(
                error,
                'Dokumen PDF gagal dimuat'
            );


            $('#tanahDocumentsBody').innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="tanah-empty"
                    >
                        Gagal mengambil dokumen.
                    </td>
                </tr>
            `;

        }
    }


    /**
     * ========================================================================
     * 31. PREVIEW PDF
     * ========================================================================
     */

    function showPdf(
        pdf,
        temporary = false
    ) {
        if (
            !pdf
            ||
            !pdf.view_url
        ) {
            notify(
                'Lokasi file PDF tidak tersedia.',
                true
            );

            return;
        }


        $('#tanahPdfTitle').textContent =
            pdf.nama
            ||
            'Dokumen Tanah';


        $('#tanahPdfFrame').src =
            pdf.view_url;


        const download =
            $('#tanahPdfDownload');


        if (download) {

            download.href =
                pdf.download_url
                ||
                pdf.view_url;


            download.download =
                temporary
                    ? (
                        pdf.nama
                        ||
                        'Dokumen.pdf'
                    )
                    : '';

        }


        openDialog(
            'tanahPdfModal'
        );
    }


    function clearPdfFrame()
    {
        const frame =
            $('#tanahPdfFrame');


        if (frame) {
            frame.removeAttribute(
                'src'
            );
        }


        if (temporaryPdfUrl) {

            URL.revokeObjectURL(
                temporaryPdfUrl
            );


            temporaryPdfUrl =
                null;
        }
    }


    $('#tanahPdfClose')
        ?.addEventListener(
            'click',
            function () {

                closeDialog(
                    'tanahPdfModal'
                );

            }
        );


    dialog('tanahPdfModal')
        ?.addEventListener(
            'close',
            clearPdfFrame
        );


    /**
     * ========================================================================
     * 32. RESTORE FORM SETELAH VALIDATION ERROR LARAVEL
     * ========================================================================
     */

    if (
        root.dataset.hasErrors
        === '1'
    ) {
        resetForm();


        try {

            const oldInput =
                JSON.parse(
                    $('#tanahOldInput')
                        ?.textContent
                    ||
                    '{}'
                );


            const inputMap = {

                tanahNilaiAktivaId:
                    'id_nilai_aktiva',

                tanahLokasiId:
                    'id_lokasi',

                tanahBarang:
                    'id_barang',

                tanahTahun:
                    'tahun',

                tanahGuna:
                    'guna',

                tanahNoTunjuk:
                    'no_tunjuk',

                tanahTglTunjuk:
                    'tgl_tunjuk',

                tanahLuasTunjuk:
                    'luas_tunjuk',

                tanahSertifikat:
                    'sertifikat',

                tanahTglSertifikat:
                    'tgl_sertifikat',

                tanahLuasSertifikat:
                    'luas_sertifikat',

                tanahNoGambar:
                    'no_gambar',

                tanahTglGambar:
                    'tgl_gambar',

                tanahLuasGambar:
                    'luas_gambar',

                tanahAsal:
                    'asal',

                tanahHak:
                    'hak',

                tanahStatusKepemilikan:
                    'status_kepemilikan',

                tanahPemilik:
                    'pemilik',

                tanahKeterangan:
                    'ket',
            };


            Object.entries(
                inputMap
            )
                .forEach(
                    (
                        [id, key]
                    ) => {

                        selectValue(
                            `#${id}`,
                            oldInput[key]
                            ?? ''
                        );

                    }
                );


            /**
             * Jika sebelumnya Edit.
             */

            if (
                oldInput.tanah_id
                &&
                oldInput._method
                === 'PUT'
            ) {
                formMethod.value =
                    'PUT';


                formMethod.disabled =
                    false;


                form.action =
                    `${BASE_URL}/${
                        encodeURIComponent(
                            oldInput.tanah_id
                        )
                    }`;


                setField(
                    'tanahEditingId',
                    oldInput.tanah_id
                );


                $('#tanahSourceSection').hidden =
                    true;


                $('#tanahFormTitle').textContent =
                    'Edit Sertifikat Tanah';
            }


            /**
             * Jika sebelumnya memilih Nilai Aset.
             */

            if (
                oldInput.id_nilai_aktiva
            ) {
                $('#tanahSelectedSource').hidden =
                    false;


                $('#tanahSelectedTitle').textContent =
                    `Transaksi Nilai Aset #${
                        oldInput.id_nilai_aktiva
                    }`;


                $('#tanahSelectedMeta').textContent =
                    'Lengkapi kembali data yang diperlukan.';
            }

        } catch (error) {

            console.error(
                'Pemulihan validasi Tanah:',
                error
            );

        }


        syncTanahCombos();
        openDialog(
            'tanahFormModal'
        );


        notify(
            'Periksa kembali isian yang ditandai Laravel.',
            true
        );
    }


    /**
     * ========================================================================
     * 33. INITIALIZE
     * ========================================================================
     */

    loadPending();

    refreshIcons();


    /**
     * ========================================================================
     * 34. PRINT EXCEL K.I.B A — SELURUH MENU TANAH (LINTAS LOKASI)
     * ========================================================================
     * - Penandatangan berasal dari Master SDM Pendukung (ID tersimpan di form).
     * - Laporan dibaca ulang dari endpoint khusus, tidak dari pagination.
     * - Preview, print, dan workbook memakai snapshot data yang sama.
     * - XLSX OpenXML asli, ZIP dibuat di browser tanpa pustaka/CDN tambahan.
     * - Kolom Status Kepemilikan dan Lampiran TIDAK masuk laporan.
     */

    const TANAH_REPORT_ROLES = [
        ['diketahui', 'Diketahui'],
        ['diperiksa1', 'Diperiksa Oleh'],
        ['diperiksa2', 'Diperiksa Oleh'],
        ['dibuat', 'Dibuat Oleh'],
    ];

    let tanahReportSource = null;
    let tanahReportStaff = [];
    let tanahReportSequence = 0;
    const tanahReportSelections = Object.create(null);

    const reportForm = $('#tanahReportForm');
    const reportPeriod = $('#tanahReportPeriod');
    const reportPreview = $('#tanahReportPreview');
    const reportPreviewSection = $('#tanahReportPreviewSection');
    const reportState = $('#tanahReportState');
    const reportDownloadButton = $('#tanahReportDownload');
    const reportPrintButton = $('#tanahReportPrint');

    function reportWitaDate() {
        return new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Makassar',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date());
    }

    function reportDefaultMonth() {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Makassar',
            month: '2-digit',
            year: 'numeric',
        }).formatToParts(new Date());
        return `${parts.find(part => part.type === 'year').value}-${parts.find(part => part.type === 'month').value}`;
    }

    function reportPeriodName() {
        const match = String(reportPeriod?.value || '').match(/^(\d{4})-(0[1-9]|1[0-2])$/);
        if (!match) return '';
        return new Intl.DateTimeFormat('id-ID', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
    }

    function reportCellValue(value) {
        const text = String(value ?? '').trim();
        return text || '-';
    }

    function reportNomorDanTanggal(nomor, tanggal) {
        const result = reportCellValue(nomor);
        const date = formatDate(tanggal);
        return date !== '-' ? `${result}\n${date}` : result;
    }

    function reportTableRows() {
        return Array.isArray(tanahReportSource?.data) ? tanahReportSource.data : [];
    }

    function reportPersonById(id) {
        return tanahReportStaff.find(item => String(item.id) === String(id));
    }

    function reportSigner(role) {
        return reportPersonById(tanahReportSelections[role]);
    }

    function reportReady() {
        return Boolean(
            tanahReportSource &&
            reportTableRows().length &&
            reportPeriodName() &&
            TANAH_REPORT_ROLES.every(([role]) => reportSigner(role))
        );
    }

    function reportSetMessage(message, error = false) {
        if (!reportState) return;
        reportState.textContent = message;
        reportState.classList.toggle('is-error', error);
    }

    function reportCloseSuggestions(except = null) {
        $$('.tanah-report-person', reportForm).forEach(field => {
            if (field === except) return;
            const container = $('.tanah-report-person-options', field);
            const input = $('.tanah-report-person-search', field);
            if (container) container.hidden = true;
            if (input) input.setAttribute('aria-expanded', 'false');
        });
    }

    function reportSearchOptions(field) {
        const input = $('.tanah-report-person-search', field);
        const options = $('.tanah-report-person-options', field);
        if (!input || !options) return;

        reportCloseSuggestions(field);
        const term = input.value.trim().toLocaleLowerCase('id-ID');
        const filtered = tanahReportStaff.filter(person =>
            [person.nama, person.nip, person.jabatan]
                .some(value => String(value || '').toLocaleLowerCase('id-ID').includes(term))
        ).slice(0, 70);

        options.replaceChildren();
        filtered.forEach((person, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tanah-report-person-option';
            button.setAttribute('role', 'option');
            button.dataset.personId = String(person.id);
            button.id = `${options.id}-option-${index}`;
            const name = document.createElement('strong');
            name.textContent = person.nama;
            const details = document.createElement('small');
            details.textContent = [person.jabatan, person.nip ? `NIP. ${person.nip}` : '']
                .filter(Boolean).join(' · ') || 'Belum ada jabatan/NIP';
            button.append(name, details);
            options.appendChild(button);
        });

        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.className = 'tanah-report-person-option';
            empty.textContent = 'Tidak ditemukan dalam Master SDM aktif.';
            options.appendChild(empty);
        }

        options.hidden = false;
        input.setAttribute('aria-expanded', 'true');
    }

    function reportSelectPerson(field, person) {
        const input = $('.tanah-report-person-search', field);
        const hidden = $('.tanah-report-person-id', field);
        if (!input || !hidden || !person) return;
        const role = field.dataset.role;
        input.value = person.nama;
        hidden.value = String(person.id);
        tanahReportSelections[role] = person.id;
        $('.tanah-report-person-description', field).textContent =
            [person.jabatan, person.nip ? `NIP. ${person.nip}` : ''].filter(Boolean).join(' · ') ||
            'Nama dipilih dari Master SDM Pendukung';
        reportCloseSuggestions();
        reportUpdatePreview();
    }

    $$('.tanah-report-person', reportForm).forEach(field => {
        const input = $('.tanah-report-person-search', field);
        const options = $('.tanah-report-person-options', field);
        const hidden = $('.tanah-report-person-id', field);
        if (!input || !options || !hidden) return;

        input.addEventListener('focus', () => reportSearchOptions(field));
        input.addEventListener('input', () => {
            tanahReportSelections[field.dataset.role] = null;
            hidden.value = '';
            $('.tanah-report-person-description', field).textContent =
                'Pilih nama yang muncul pada daftar, bukan sekadar mengetik.';
            reportSearchOptions(field);
            reportUpdatePreview();
        });
        input.addEventListener('keydown', event => {
            const enabled = $$('button[role="option"]', options);
            if (event.key === 'Escape') {
                options.hidden = true;
                input.setAttribute('aria-expanded', 'false');
                return;
            }
            if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
            if (options.hidden) reportSearchOptions(field);
            const current = enabled.findIndex(button => button.classList.contains('is-highlighted'));
            if (!enabled.length) return;
            event.preventDefault();
            if (event.key === 'Enter') {
                const button = enabled[current >= 0 ? current : 0];
                reportSelectPerson(field, reportPersonById(button.dataset.personId));
                return;
            }
            const next = event.key === 'ArrowDown'
                ? (current + 1) % enabled.length
                : (current - 1 + enabled.length) % enabled.length;
            enabled.forEach(button => button.classList.remove('is-highlighted'));
            enabled[next].classList.add('is-highlighted');
            enabled[next].scrollIntoView({ block: 'nearest' });
            input.setAttribute('aria-activedescendant', enabled[next].id);
        });
        options.addEventListener('click', event => {
            const button = event.target.closest('button[data-person-id]');
            if (!button) return;
            reportSelectPerson(field, reportPersonById(button.dataset.personId));
        });
    });

    reportForm?.addEventListener('submit', event => event.preventDefault());
    reportPeriod?.addEventListener('change', reportUpdatePreview);
    document.addEventListener('click', event => {
        if (reportForm && !reportForm.contains(event.target)) reportCloseSuggestions();
    });

    // HTML yang dipakai bersama untuk preview dan jendela Print.
    function reportRenderPaper() {
        const rows = reportTableRows();
        const org = tanahReportSource.organisasi || {};
        const loc = tanahReportSource.lokasi || {};
        const meta = [
            ['PROVINSI', org.provinsi],
            ['KOTA', org.kota],
            ['UNIT', org.unit],
            ['DEPARTEMEN', org.departemen],
            ['DIVISI', org.divisi],
            ['LOKASI', loc.lokasi],
            ['ALAMAT', loc.alamat],
        ];
        const metaHtml = meta.map(([label, value]) =>
            `<b>${escapeHtml(label)}</b><span>: ${escapeHtml(reportCellValue(value))}</span>`
        ).join('');
        const header = [
            '<tr>',
            '<th rowspan="2" style="width:3%">No.</th>',
            '<th rowspan="2" style="width:14%">Alamat / Letak</th>',
            '<th rowspan="2" style="width:14%">Nama Barang / Jenis Barang</th>',
            '<th colspan="2" style="width:20%">Nomor</th>',
            '<th rowspan="2" style="width:6%">Tahun Pengadaan</th>',
            '<th rowspan="2" style="width:7%">Luas (m²)</th>',
            '<th rowspan="2" style="width:8%">Hak</th>',
            '<th rowspan="2" style="width:11%">Nomor Surat / SPPT / Sertifikat</th>',
            '<th rowspan="2" style="width:8%">Luas Tanah (m²)</th>',
            '<th rowspan="2" style="width:11%">Keperluan</th>',
            '<th rowspan="2" style="width:7%">Asal Usul</th>',
            '<th rowspan="2" style="width:10%">Keterangan</th>',
            '</tr>',
            '<tr><th>Kode Barang</th><th>Nomor Surat Penunjukan</th></tr>',
            `<tr>${Array.from({ length: 13 }, (_, i) => `<th>${i + 1}</th>`).join('')}</tr>`,
        ].join('');
        const body = rows.map((item, i) => {
            const values = [
                i + 1, item.alamat || item.lokasi || loc.alamat || loc.lokasi,
                item.nama_barang, item.kode_barang,
                reportNomorDanTanggal(item.no_tunjuk, item.tgl_tunjuk),
                item.tahun, item.luas_tunjuk, item.hak,
                reportNomorDanTanggal(item.sertifikat, item.tgl_sertifikat),
                item.luas_sertifikat, item.guna, item.asal, item.ket,
            ];
            return `<tr>${values.map((value, index) =>
                `<td${index === 0 ? ' class="tanah-report-number"' : ''}>${escapeHtml(reportCellValue(value)).replace(/\n/g, '<br>')}</td>`
            ).join('')}</tr>`;
        }).join('');
        const signatures = TANAH_REPORT_ROLES.map(([role, title]) => {
            const signer = reportSigner(role);
            return `<div class="tanah-report-signature">
                <strong>${escapeHtml(title)},</strong>
                <span>${escapeHtml(signer?.jabatan || '-')}</span>
                <u>${escapeHtml(signer?.nama || '-')}</u>
                <span>${escapeHtml(signer?.nip ? `NIP. ${signer.nip}` : 'NIP. -')}</span>
            </div>`;
        }).join('');
        return `
            <div class="tanah-report-paper-header">
                <!-- Logo horizontal sudah mengandung nama perusahaan, jadi tidak dicetak dua kali. -->
                <img class="tanah-report-paper-logo" src="${escapeHtml(root.dataset.reportLogoUrl || '')}" alt="Perumda Tirta Kencana Kota Samarinda">
                <div class="tanah-report-paper-title">
                    <strong>KARTU INVENTARIS BARANG (K.I.B)</strong>
                    <strong>A. KARTU INVENTARIS TANAH</strong>
                    <span>PERIODE ${escapeHtml(reportPeriodName().toUpperCase())}</span>
                </div>
            </div>
            <div class="tanah-report-meta">${metaHtml}</div>
            <table class="tanah-report-paper-table"><thead>${header}</thead><tbody>${body}</tbody></table>
            <div class="tanah-report-sign-date">Samarinda, ${escapeHtml(reportWitaDate())}</div>
            <div class="tanah-report-signatures">${signatures}</div>`;
    }

    function reportUpdatePreview() {
        const ready = reportReady();
        if (reportPrintButton) reportPrintButton.disabled = !ready;
        if (reportDownloadButton) reportDownloadButton.disabled = !ready;
        if (!reportPreviewSection || !reportPreview) return;
        reportPreviewSection.hidden = !ready;
        if (!tanahReportSource) return;

        if (!reportTableRows().length) {
            reportSetMessage('Belum ada data Tanah untuk dicetak.', true);
        } else if (!reportPeriodName()) {
            reportSetMessage('Pilih bulan dan tahun periode laporan.');
        } else if (!ready) {
            reportSetMessage('Pilih keempat penandatangan dari Master SDM Pendukung untuk menampilkan preview.');
        } else {
            reportSetMessage(`Preview siap: ${integerFormatter.format(reportTableRows().length)} data Tanah dari seluruh lokasi.`);
            reportPreview.innerHTML = reportRenderPaper();
            const total = $('#tanahReportTotal');
            if (total) total.textContent = `${integerFormatter.format(reportTableRows().length)} sertifikat`;
        }
    }

    $('#tanahReportOpen')?.addEventListener('click', async () => {
        const mySequence = ++tanahReportSequence;
        tanahReportSource = null;
        tanahReportStaff = [];
        TANAH_REPORT_ROLES.forEach(([role]) => { tanahReportSelections[role] = null; });
        $$('.tanah-report-person', reportForm).forEach(field => {
            $('.tanah-report-person-search', field).value = '';
            $('.tanah-report-person-id', field).value = '';
            $('.tanah-report-person-description', field).textContent =
                'Pilih dari Master SDM Pendukung.';
        });
        reportCloseSuggestions();
        if (reportPeriod) reportPeriod.value = reportDefaultMonth();
        const locationText = $('#tanahReportLocation');
        if (locationText) locationText.textContent = 'Cakupan: seluruh data Tanah pada semua lokasi';
        if (reportPreviewSection) reportPreviewSection.hidden = true;
        reportSetMessage('Memuat seluruh data Tanah (semua lokasi) dan Master SDM Pendukung...');
        if (reportDownloadButton) reportDownloadButton.disabled = true;
        if (reportPrintButton) reportPrintButton.disabled = true;
        openDialog('tanahReportModal');

        try {
            const data = await getJson(
                `${BASE_URL}/laporan`
            );
            if (mySequence !== tanahReportSequence) return;
            tanahReportSource = data;
            tanahReportStaff = Array.isArray(data.sdm) ? data.sdm : [];
            if (locationText) locationText.textContent =
                `Cakupan: seluruh menu K.I.B A · ${data.jumlah || 0} data dari semua lokasi`;
            if (!tanahReportStaff.length) {
                reportSetMessage('Tidak ada SDM aktif di Master SDM Pendukung. Aktifkan data SDM sebelum mencetak.', true);
            } else {
                reportUpdatePreview();
            }
        } catch (error) {
            console.error('Gagal memuat laporan K.I.B A:', error);
            reportSetMessage(`Gagal memuat laporan: ${error.message}`, true);
            notify('Data cetak Tanah gagal dimuat. Periksa log Laravel.', true);
        }
    });

    // ---------------------- PEMBUAT FILE XLSX OPENXML -----------------------

    function reportXmlEscape(value) {
        return String(value ?? '')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function reportColumnName(number) {
        let name = '';
        let n = number;
        while (n > 0) {
            name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
            n = Math.floor((n - 1) / 26);
        }
        return name;
    }

    function reportNumeric(value) {
        const text = String(value ?? '').trim().replace(/\s/g, '');
        if (!text || text === '-') return null;
        let cleaned = text;
        if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (/^-?\d+(,\d+)?$/.test(cleaned)) {
            cleaned = cleaned.replace(',', '.');
        }
        if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
        const number = Number(cleaned);
        return Number.isFinite(number) ? number : null;
    }

    // ZIP tanpa kompresi adalah ZIP/XLSX standar valid. Tidak memakai CSV terselubung.
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

    function reportBuildXlsx(logoBytes) {
        const rows = reportTableRows();
        const org = tanahReportSource.organisasi || {};
        const loc = tanahReportSource.lokasi || {};
        const entries = new Map();
        const merges = [];
        const heights = new Map();
        let finalRow = 18 + rows.length;
        // Satu koordinat Excel hanya boleh menghasilkan satu elemen <c>.
        // Penting untuk sel merge: seluruh sel header harus memiliki border,
        // agar garis tabel tidak hilang ketika workbook diperbesar/diperkecil.
        const put = (r, col, value, style = 0, numeric = false) => {
            if (!entries.has(r)) entries.set(r, new Map());
            entries.get(r).set(col, { col, value: value ?? '', style, numeric });
        };
        const merged = (r1, col1, r2, col2, value, style = 0) => {
            for (let row = r1; row <= r2; row++) {
                for (let col = col1; col <= col2; col++) {
                    const isPrimary = row === r1 && col === col1;
                    // Border + fill dibentuk pada setiap sel penyusun merge,
                    // bukan hanya pada sel pojok kiri atas.
                    put(row, col, isPrimary ? value : '', style);
                }
            }
            merges.push(`${reportColumnName(col1)}${r1}:${reportColumnName(col2)}${r2}`);
        };
        const blank = value => reportCellValue(value);

        // Kop: logo horizontal mengisi sisi kiri (A:D), judul berada
        // hampir tepat di pusat lebar seluruh tabel A:M.
        // Kolom E:J memiliki titik tengah ~139.5 dari 272 unit lebar kolom,
        // sedangkan titik tengah tabel A:M = 136; jauh lebih tepat daripada G:M.
        if (logoBytes?.length) {
            merges.push('A1:D5');
        } else {
            // Teks cadangan bila logo tidak tersedia, agar identitas tidak hilang.
            merged(2, 1, 2, 4, 'PERUMDA TIRTA KENCANA', 13);
            merged(3, 1, 3, 4, 'KOTA SAMARINDA', 13);
        }
        merged(2, 5, 2, 10, 'KARTU INVENTARIS BARANG (K.I.B)', 1);
        merged(3, 5, 3, 10, 'A. KARTU INVENTARIS TANAH', 2);
        merged(4, 5, 4, 10, `PERIODE ${reportPeriodName().toUpperCase()}`, 2);
        heights.set(1, 26);
        heights.set(2, 28);
        heights.set(3, 24);
        heights.set(4, 24);
        heights.set(5, 23);

        const metadata = [
            ['PROVINSI', org.provinsi], ['KOTA', org.kota],
            ['UNIT', org.unit], ['DEPARTEMEN', org.departemen],
            ['DIVISI', org.divisi], ['LOKASI', loc.lokasi],
            ['ALAMAT', loc.alamat],
        ];
        metadata.forEach(([name, value], index) => {
            const r = 7 + index;
            merged(r, 1, r, 2, name, 3);
            merged(r, 3, r, 7, `: ${blank(value)}`, 4);
            heights.set(r, 19);
        });

        const h = 15;
        const header = (col, col2, title) => merged(h, col, h + 1, col2, title, 5);
        header(1, 1, 'No.');
        header(2, 2, 'ALAMAT / LETAK');
        header(3, 3, 'NAMA BARANG / JENIS BARANG');
        merged(h, 4, h, 5, 'NOMOR', 5);
        put(h + 1, 4, 'KODE BARANG', 5);
        put(h + 1, 5, 'NOMOR SURAT PENUNJUKAN', 5);
        for (const [column, title] of [
            [6, 'TAHUN PENGADAAN'], [7, 'LUAS (M2)'], [8, 'HAK'],
            [9, 'NOMOR SURAT / SPPT / SERTIFIKAT'], [10, 'LUAS TANAH (M2)'],
            [11, 'KEPERLUAN'], [12, 'ASAL USUL'], [13, 'KETERANGAN'],
        ]) header(column, column, title);
        heights.set(h, 34);
        heights.set(h + 1, 34);
        for (let c = 1; c <= 13; c++) put(h + 2, c, c, 9, true);
        heights.set(h + 2, 21);

        rows.forEach((item, index) => {
            const r = h + 3 + index;
            const data = [
                index + 1, blank(item.alamat || item.lokasi || loc.alamat || loc.lokasi),
                blank(item.nama_barang), blank(item.kode_barang),
                reportNomorDanTanggal(item.no_tunjuk, item.tgl_tunjuk),
                blank(item.tahun), blank(item.luas_tunjuk), blank(item.hak),
                reportNomorDanTanggal(item.sertifikat, item.tgl_sertifikat),
                blank(item.luas_sertifikat), blank(item.guna),
                blank(item.asal), blank(item.ket),
            ];
            data.forEach((value, col) => {
                const numeric = [0, 5, 6, 9].includes(col) ? reportNumeric(value) : null;
                put(r, col + 1, numeric !== null ? numeric : value,
                    col === 0 ? 7 : numeric !== null ? 8 : 6, numeric !== null);
            });
            const maxLength = Math.max(...data.map(value => String(value).length));
            heights.set(r, Math.min(90, Math.max(28, Math.ceil(maxLength / 47) * 15 + 9)));
        });

        const dateRow = h + 3 + rows.length + 2;
        finalRow = dateRow + 11;
        merged(dateRow, 10, dateRow, 13, `Samarinda, ${reportWitaDate()}`, 10);
        const slots = [[1, 3], [4, 6], [7, 9], [10, 13]];
        TANAH_REPORT_ROLES.forEach(([role, label], i) => {
            const person = reportSigner(role);
            const [start, end] = slots[i];
            merged(dateRow + 2, start, dateRow + 2, end, `${label},`, 10);
            merged(dateRow + 3, start, dateRow + 3, end, blank(person?.jabatan), 11);
            merged(dateRow + 8, start, dateRow + 8, end, blank(person?.nama), 12);
            merged(dateRow + 9, start, dateRow + 9, end,
                person?.nip ? `NIP. ${person.nip}` : 'NIP. -', 11);
        });
        heights.set(dateRow + 8, 24);

        const columnWidths = [7, 26, 33, 17, 24, 12, 14, 17, 29, 17, 26, 19, 31];
        const colsXml = columnWidths.map((width, index) =>
            `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
        ).join('');
        const rowXml = [...entries.keys()].sort((a, b) => a - b).map(r => {
            const cells = [...entries.get(r).values()].sort((a, b) => a.col - b.col).map(entry => {
                const address = `${reportColumnName(entry.col)}${r}`;
                if (entry.numeric) return `<c r="${address}" s="${entry.style}"><v>${entry.value}</v></c>`;
                const value = reportXmlEscape(entry.value);
                return `<c r="${address}" t="inlineStr" s="${entry.style}"><is><t xml:space="preserve">${value}</t></is></c>`;
            }).join('');
            return `<row r="${r}"${heights.has(r) ? ` ht="${heights.get(r)}" customHeight="1"` : ''}>${cells}</row>`;
        }).join('');
        const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <worksheet xmlns="${main}" xmlns:r="${rel}">
              <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
              <dimension ref="A1:M${finalRow}"/>
              <sheetViews><sheetView workbookViewId="0" showGridLines="0">
                <pane ySplit="17" topLeftCell="A18" activePane="bottomLeft" state="frozen"/>
              </sheetView></sheetViews>
              <sheetFormatPr defaultRowHeight="17"/>
              <cols>${colsXml}</cols>
              <sheetData>${rowXml}</sheetData>
              <mergeCells count="${merges.length}">${merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>
              <printOptions horizontalCentered="1" gridLines="0"/>
              <pageMargins left="0.28" right="0.28" top="0.4" bottom="0.4" header="0.15" footer="0.15"/>
              <pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
              ${logoBytes?.length ? '<drawing r:id="rId1"/>' : ''}
            </worksheet>`;

        const fonts = [
            '<font><sz val="10"/><name val="Arial"/></font>',
            '<font><b/><sz val="13"/><name val="Arial"/></font>',
            '<font><b/><sz val="11"/><name val="Arial"/></font>',
            '<font><b/><sz val="9"/><name val="Arial"/></font>',
            '<font><u/><b/><sz val="10"/><name val="Arial"/></font>',
        ].join('');
        const fill = '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD5DFEA"/><bgColor indexed="64"/></patternFill></fill></fills>';
        // Border tegas: 1 = isi tabel, 2 = header (lebih jelas saat zoom).
        const borderColor = 'FF354454';
        const borderEdges = line => `<left style="${line}"><color rgb="${borderColor}"/></left>`
            + `<right style="${line}"><color rgb="${borderColor}"/></right>`
            + `<top style="${line}"><color rgb="${borderColor}"/></top>`
            + `<bottom style="${line}"><color rgb="${borderColor}"/></bottom><diagonal/>`;
        const border = `<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border>`
            + `<border>${borderEdges('thin')}</border><border>${borderEdges('medium')}</border></borders>`;
        const xfs = [
            [0, 0, 0, 'left', 'center', 1],
            [1, 0, 0, 'center', 'center', 1],
            [2, 0, 0, 'center', 'center', 1],
            [3, 0, 0, 'left', 'center', 1],
            [0, 0, 0, 'left', 'center', 1],
            [3, 2, 2, 'center', 'center', 1],
            [0, 0, 1, 'center', 'center', 1],
            [0, 0, 1, 'center', 'center', 1],
            [0, 0, 1, 'center', 'center', 1],
            [3, 2, 2, 'center', 'center', 1],
            [2, 0, 0, 'center', 'center', 1],
            [0, 0, 0, 'center', 'center', 1],
            [4, 0, 0, 'center', 'center', 1],
            [2, 0, 0, 'left', 'center', 1],
        ].map(([font, fillId, borderId, horizontal, vertical, wrap]) =>
            `<xf numFmtId="0" fontId="${font}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyAlignment="1"><alignment horizontal="${horizontal}" vertical="${vertical}" wrapText="${wrap}"/></xf>`
        ).join('');
        const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${main}">
            <fonts count="5">${fonts}</fonts>${fill}${border}
            <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
            <cellXfs count="14">${xfs}</cellXfs>
            <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
        </styleSheet>`;
        const packageFiles = [
            { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
            { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${main}" xmlns:r="${rel}"><bookViews><workbookView/></bookViews><sheets><sheet name="KIB A - Tanah" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'KIB A - Tanah'!$15:$17</definedName><definedName name="_xlnm.Print_Area" localSheetId="0">'KIB A - Tanah'!$A$1:$M${finalRow}</definedName></definedNames></workbook>` },
            { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>` },
            { name: 'xl/styles.xml', data: styles },
            { name: 'xl/worksheets/sheet1.xml', data: sheet },
        ];
        if (logoBytes?.length) {
            packageFiles.push(
                { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/drawing" Target="../drawings/drawing1.xml"/></Relationships>` },
                { name: 'xl/drawings/_rels/drawing1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/image" Target="../media/image1.png"/></Relationships>` },
                { name: 'xl/drawings/drawing1.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${rel}"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>160000</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>170000</xdr:rowOff></xdr:from><xdr:ext cx="3800000" cy="1205000"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Logo Perumda Tirta Kencana"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>` },
                { name: 'xl/media/image1.png', data: logoBytes },
            );
        }
        const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logoBytes?.length ? '<Default Extension="png" ContentType="image/png"/>' : ''}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${logoBytes?.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''}</Types>`;
        packageFiles.unshift({ name: '[Content_Types].xml', data: contentTypes });
        return reportZip(packageFiles);
    }

    reportDownloadButton?.addEventListener('click', async () => {
        if (!reportReady()) return;
        reportDownloadButton.disabled = true;
        try {
            let logoBytes = null;
            try {
                const imageResponse = await fetch(root.dataset.reportLogoUrl, { credentials: 'same-origin' });
                if (imageResponse.ok) logoBytes = new Uint8Array(await imageResponse.arrayBuffer());
            } catch (imageError) {
                console.warn('Logo Excel tidak ditemukan, file tetap dibuat.', imageError);
            }
            const file = reportBuildXlsx(logoBytes);
            const name = `KIB_A_Tanah_Seluruh_Data_${reportPeriod.value}.xlsx`;
            const link = document.createElement('a');
            const url = URL.createObjectURL(file);
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            notify(`${reportTableRows().length} data Tanah disiapkan dalam file Excel.`);
        } catch (error) {
            console.error('Gagal membuat XLSX Tanah:', error);
            notify(`Gagal membuat Excel: ${error.message}`, true);
        } finally {
            reportDownloadButton.disabled = !reportReady();
        }
    });

    reportPrintButton?.addEventListener('click', () => {
        if (!reportReady()) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            notify('Browser memblokir jendela Print. Izinkan pop-up situs ini.', true);
            return;
        }
        const stylesUrl = escapeHtml(root.dataset.reportCssUrl || '');
        const title = escapeHtml('K.I.B A Tanah - Seluruh Lokasi');
        printWindow.document.open();
        printWindow.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8">
            <title>${title}</title><link rel="stylesheet" href="${stylesUrl}">
            <style>
                @page { size: A3 landscape; margin: 10mm; }
                html, body { margin:0; padding:0; background:#fff; color:#111; }
                .tanah-report-paper { font-family:Arial,sans-serif; font-size:10px; width:100%; min-width:0; box-sizing:border-box; padding:0; box-shadow:none; }
                .tanah-report-paper-header { position:relative; display:flex; align-items:center; justify-content:center; min-height:145px; padding:6px 12px; }
                .tanah-report-paper-logo { position:absolute; left:14px; top:50%; transform:translateY(-50%); width:395px; max-width:33%; height:auto; max-height:130px; object-fit:contain; margin:0; }
                .tanah-report-paper-title { width:100%; text-align:center; align-self:center; }
                .tanah-report-meta { width:60%; }
                .tanah-report-paper-table { font-size:9px; page-break-inside:auto; }
                .tanah-report-paper-table thead { display:table-header-group; }
                .tanah-report-paper-table tr { page-break-inside:avoid; }
                .tanah-report-signatures { break-inside:avoid; }
                .tanah-report-paper-table th, .tanah-report-paper-table td {
                    border:1px solid #354454;
                    text-align:center;
                    vertical-align:middle;
                }
                .tanah-report-paper-table td { overflow-wrap:anywhere; }
                @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
            </style></head><body><main class="tanah-report-paper">${reportRenderPaper()}</main></body></html>`);
        printWindow.addEventListener('load', () => {
            printWindow.focus();
            printWindow.print();
        }, { once: true });
        printWindow.document.close();
    });

});