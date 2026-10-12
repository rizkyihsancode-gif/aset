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
 * 10. View Data Tanah seperti web aset lama
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


                return searchValue
                    .includes(keyword);
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
                    perPageSelect.value =
                        '20';
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


    /**
     * ========================================================================
     * 19. UPLOAD PDF
     * ========================================================================
     */

    let temporaryPdfUrl =
        null;


    const pdfInput =
        $('#tanahPdfInput');


    pdfInput
        ?.addEventListener(
            'change',
            function (event) {

                const file =
                    event.target
                        .files?.[0];


                const selectedFile =
                    $('#tanahFileSelected');


                const previewButton =
                    $('#tanahPreviewSelectedPdf');


                if (!file) {

                    if (selectedFile) {
                        selectedFile.hidden =
                            true;
                    }


                    if (previewButton) {
                        previewButton.hidden =
                            true;
                    }


                    return;
                }


                const validPdf =
                    file.type
                    === 'application/pdf'
                    ||
                    file.name
                        .toLowerCase()
                        .endsWith('.pdf');


                const validSize =
                    file.size
                    <=
                    15
                    *
                    1024
                    *
                    1024;


                if (
                    !validPdf
                    ||
                    !validSize
                ) {
                    event.target.value =
                        '';


                    notify(
                        'Pilih file PDF maksimal 15 MB.',
                        true
                    );

                    return;
                }


                $('#tanahFileName').textContent =
                    file.name;


                if (selectedFile) {
                    selectedFile.hidden =
                        false;
                }


                if (previewButton) {
                    previewButton.hidden =
                        false;
                }

            }
        );


    $('#tanahPreviewSelectedPdf')
        ?.addEventListener(
            'click',
            function () {

                const file =
                    pdfInput?.files?.[0];


                if (!file) {
                    return;
                }


                if (temporaryPdfUrl) {
                    URL.revokeObjectURL(
                        temporaryPdfUrl
                    );
                }


                temporaryPdfUrl =
                    URL.createObjectURL(
                        file
                    );


                showPdf(
                    {
                        view_url:
                            temporaryPdfUrl,

                        download_url:
                            temporaryPdfUrl,

                        nama:
                            file.name,
                    },
                    true
                );

            }
        );


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

    function selectCertificate(record)
    {
        if (!record) {
            return;
        }


        activeCertificate =
            record;


        /**
         * Aktifkan baris sertifikat di panel kiri.
         */

        $$(
            '.tanah-legacy-list-row',
            $('#tanahLegacyList')
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
                        'aria-pressed',
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


        $('#tanahLegacyEmpty').hidden =
            true;


        $('#tanahLegacyDetails').hidden =
            false;


        /**
         * Pada layar kecil,
         * pindah ke bagian detail.
         */

        if (
            window.innerWidth
            <= 850
        ) {
            $('#tanahLegacyDetails')
                ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
        }


        refreshIcons();
    }


    /**
     * ========================================================================
     * 22. BUKA DATA TANAH PER LOKASI
     * ========================================================================
     */

    async function openLocation(
        locationId,
        locationName,
        preferredCertificateId = null
    ) {
        activeLocationId =
            String(locationId);


        activeLocationName =
            locationName
            || 'Lokasi';


        activeCertificate =
            null;


        const requestId =
            ++locationRequestSequence;


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


        const list =
            $('#tanahLegacyList');


        if (list) {
            list.innerHTML = `
                <p class="tanah-legacy-loading">
                    Memuat daftar sertifikat...
                </p>
            `;
        }


        $('#tanahLegacyEmpty').hidden =
            false;


        $('#tanahLegacyDetails').hidden =
            true;


        showLocationPhoto(null);


        openDialog(
            'tanahLocationModal'
        );


        try {

            /**
             * Load daftar sertifikat.
             */

            const result =
                await getJson(
                    `${LOCATION_URL}/${
                        encodeURIComponent(
                            locationId
                        )
                    }/sertifikat`
                );


            if (
                requestId
                !==
                locationRequestSequence
            ) {
                return;
            }


            const rows =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            setLegacyText(
                'tanahLegacyLocationAddress',
                result.lokasi?.alamat
                ||
                `Lokasi: ${
                    activeLocationName
                }`
            );


            setLegacyText(
                'tanahLegacyRecordCount',
                `${
                    integerFormatter.format(
                        rows.length
                    )
                } data`
            );


            list?.replaceChildren();


            if (
                rows.length === 0
            ) {

                if (list) {
                    list.innerHTML = `
                        <p class="tanah-legacy-loading">
                            Belum ada sertifikat pada lokasi ini.
                        </p>
                    `;
                }

            }


            rows.forEach(
                (
                    record,
                    index
                ) => {

                    const button =
                        document.createElement(
                            'button'
                        );


                    button.type =
                        'button';


                    button.className =
                        'tanah-legacy-list-row';


                    button.dataset.id =
                        record.id;


                    button.setAttribute(
                        'aria-pressed',
                        'false'
                    );


                    button.innerHTML = `
                        <span class="tanah-legacy-list-no">
                            ${index + 1}
                        </span>

                        <span class="tanah-legacy-list-owner">

                            <strong>
                                ${escapeHtml(
                                    (
                                        record.pemilik
                                        &&
                                        record.pemilik !== '-'
                                    )
                                        ? record.pemilik
                                        : (
                                            record.nama_barang
                                            || 'Tanah'
                                        )
                                )}
                            </strong>

                            <small>
                                Tahun ${
                                    escapeHtml(
                                        record.tahun
                                        || '-'
                                    )
                                }
                            </small>

                        </span>

                        <span class="tanah-legacy-list-area">
                            ${escapeHtml(
                                formatArea(
                                    record.luas_sertifikat
                                )
                            )}
                        </span>
                    `;


                    button.addEventListener(
                        'click',
                        function () {

                            selectCertificate(
                                record
                            );

                        }
                    );


                    list?.appendChild(
                        button
                    );

                }
            );


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


                        showLocationPhoto(
                            detail.lokasi
                                ?.image_url
                            || null
                        );

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
                list.innerHTML = `
                    <p class="tanah-legacy-loading">
                        Gagal memuat daftar sertifikat.
                    </p>
                `;
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

});