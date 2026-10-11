document.addEventListener(
    'DOMContentLoaded',
    function () {

        'use strict';


        /* =========================================================
           ROOT
        ========================================================= */

        const page =
            document.getElementById(
                'tanahPage'
            );


        if (!page) {
            return;
        }


        const STORE_URL =
            page.dataset.storeUrl
            || '/kib/tanah';


        const RECORD_BASE_URL =
            page.dataset.recordBaseUrl
            || '/kib/tanah';


        const PENDING_URL =
            page.dataset.pendingUrl
            || '/kib/pending/tanah';


        /* =========================================================
           HELPER
        ========================================================= */

        const $ = (
            selector,
            root = document
        ) => root.querySelector(
            selector
        );


        const $$ = (
            selector,
            root = document
        ) => Array.from(
            root.querySelectorAll(
                selector
            )
        );


        function refreshIcons()
        {
            if (
                window.lucide
                &&
                typeof window
                    .lucide
                    .createIcons
                    === 'function'
            ) {

                window.lucide
                    .createIcons();
            }
        }


        function escapeHtml(
            value
        ) {
            const div =
                document.createElement(
                    'div'
                );


            div.textContent =
                value ?? '';


            return div.innerHTML;
        }


        function formatRupiah(
            value
        ) {
            return (
                'Rp '
                +
                new Intl.NumberFormat(
                    'id-ID'
                )
                    .format(
                        Number(value)
                        || 0
                    )
            );
        }


        function formatNumber(
            value
        ) {
            return new Intl.NumberFormat(
                'id-ID',
                {
                    maximumFractionDigits: 2,
                }
            )
                .format(
                    Number(value)
                    || 0
                );
        }


        function formatDate(
            value
        ) {
            if (!value) {
                return '-';
            }


            const raw =
                String(value)
                    .substring(
                        0,
                        10
                    );


            const parts =
                raw.split('-');


            if (
                parts.length !== 3
            ) {

                return raw;
            }


            return (
                parts[2]
                +
                '/'
                +
                parts[1]
                +
                '/'
                +
                parts[0]
            );
        }


        function dateInput(
            value
        ) {
            return value
                ? String(value)
                    .substring(
                        0,
                        10
                    )
                : '';
        }


        function unwrapData(
            payload
        ) {
            if (
                payload
                &&
                typeof payload
                    === 'object'
                &&
                'data' in payload
            ) {

                return payload.data;
            }


            return payload;
        }


        async function fetchJson(
            url
        ) {
            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            Accept:
                                'application/json',
                        },
                    }
                );


            if (!response.ok) {

                throw new Error(
                    'HTTP '
                    +
                    response.status
                );
            }


            return response.json();
        }


        /* =========================================================
           TOAST
        ========================================================= */

        const toast =
            $('#tanahToast');


        const toastMessage =
            $('#tanahToastMessage');


        let toastTimer =
            null;


        function showToast(
            message,
            type = 'info'
        ) {
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


            toast.classList
                .remove(
                    'is-error'
                );


            if (
                type === 'error'
            ) {

                toast.classList
                    .add(
                        'is-error'
                    );
            }


            toastMessage.textContent =
                message;


            toast.hidden =
                false;


            toastTimer =
                setTimeout(
                    function () {

                        toast.hidden =
                            true;

                    },
                    3500
                );
        }


        /* =========================================================
           DIALOG
        ========================================================= */

        function openDialog(
            dialog
        ) {
            if (!dialog) {
                return;
            }


            if (
                typeof dialog.showModal
                === 'function'
                &&
                !dialog.open
            ) {

                dialog.showModal();
            }


            refreshIcons();
        }


        function closeDialog(
            dialog
        ) {
            if (
                dialog
                &&
                dialog.open
                &&
                typeof dialog.close
                    === 'function'
            ) {

                dialog.close();
            }
        }


        $$(
            '[data-close-dialog]'
        )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            closeDialog(
                                document.getElementById(
                                    button.dataset
                                        .closeDialog
                                )
                            );
                        }
                    );
                }
            );


        $$('dialog')
            .forEach(
                function (dialog) {

                    dialog.addEventListener(
                        'click',
                        function (event) {

                            if (
                                event.target
                                === dialog
                            ) {

                                closeDialog(
                                    dialog
                                );
                            }
                        }
                    );
                }
            );


        /* =========================================================
           MAIN TABLE
        ========================================================= */

        const tableRows =
            $$(
                '.tanah-data-row'
            );


        const searchInput =
            $('#tanahSearch');


        const perPage =
            $('#tanahPerPage');


        const tableInfo =
            $('#tanahTableInfo');


        const pagination =
            $('#tanahPagination');


        let currentPage =
            1;


        function filteredRows()
        {
            const keyword =
                (
                    searchInput?.value
                    || ''
                )
                    .trim()
                    .toLowerCase();


            if (!keyword) {
                return tableRows;
            }


            return tableRows.filter(
                row =>
                    (
                        row.dataset
                            .search
                        || ''
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        )
            );
        }


        function pageButton(
            label,
            target,
            options = {}
        ) {
            const button =
                document.createElement(
                    'button'
                );


            button.type =
                'button';


            button.className =
                'tanah-page-button';


            if (options.active) {

                button.classList
                    .add(
                        'active'
                    );
            }


            button.disabled =
                Boolean(
                    options.disabled
                );


            if (options.icon) {

                button.innerHTML =
                    `<i data-lucide="${options.icon}"></i>`;

            } else {

                button.textContent =
                    label;
            }


            if (
                !button.disabled
                &&
                !options.active
            ) {

                button.addEventListener(
                    'click',
                    function () {

                        currentPage =
                            target;


                        renderTable();
                    }
                );
            }


            return button;
        }


        function renderPagination(
            totalPages
        ) {
            if (!pagination) {
                return;
            }


            pagination.innerHTML =
                '';


            if (
                totalPages <= 1
            ) {

                return;
            }


            pagination.appendChild(
                pageButton(
                    '',
                    currentPage - 1,
                    {
                        icon:
                            'chevron-left',

                        disabled:
                            currentPage === 1,
                    }
                )
            );


            const start =
                Math.max(
                    1,
                    currentPage - 2
                );


            const end =
                Math.min(
                    totalPages,
                    currentPage + 2
                );


            for (
                let number = start;

                number <= end;

                number++
            ) {

                pagination.appendChild(
                    pageButton(
                        String(number),
                        number,
                        {
                            active:
                                number
                                === currentPage,
                        }
                    )
                );
            }


            pagination.appendChild(
                pageButton(
                    '',
                    currentPage + 1,
                    {
                        icon:
                            'chevron-right',

                        disabled:
                            currentPage
                            === totalPages,
                    }
                )
            );


            refreshIcons();
        }


        function renderTable()
        {
            const rows =
                filteredRows();


            const size =
                Number(
                    perPage?.value
                    || 20
                );


            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        rows.length
                        /
                        size
                    )
                );


            if (
                currentPage
                > totalPages
            ) {

                currentPage =
                    totalPages;
            }


            tableRows.forEach(
                row => {
                    row.hidden =
                        true;
                }
            );


            const start =
                (
                    currentPage - 1
                )
                *
                size;


            const end =
                Math.min(
                    start + size,
                    rows.length
                );


            rows
                .slice(
                    start,
                    end
                )
                .forEach(
                    function (
                        row,
                        index
                    ) {

                        row.hidden =
                            false;


                        const numberCell =
                            row.querySelector(
                                '.tanah-row-number'
                            );


                        if (
                            numberCell
                        ) {

                            numberCell
                                .textContent =
                                start
                                +
                                index
                                +
                                1;
                        }
                    }
                );


            if (
                tableInfo
            ) {

                if (
                    rows.length === 0
                ) {

                    tableInfo.textContent =
                        'Tidak ada data yang sesuai';

                } else {

                    tableInfo.textContent =
                        'Menampilkan '
                        +
                        (
                            start + 1
                        )
                            .toLocaleString(
                                'id-ID'
                            )
                        +
                        ' - '
                        +
                        end
                            .toLocaleString(
                                'id-ID'
                            )
                        +
                        ' dari '
                        +
                        rows.length
                            .toLocaleString(
                                'id-ID'
                            )
                        +
                        ' data';
                }
            }


            renderPagination(
                rows.length
                    ? totalPages
                    : 0
            );
        }


        searchInput
            ?.addEventListener(
                'input',
                function () {

                    currentPage =
                        1;

                    renderTable();
                }
            );


        perPage
            ?.addEventListener(
                'change',
                function () {

                    currentPage =
                        1;

                    renderTable();
                }
            );


        $('#tanahResetButton')
            ?.addEventListener(
                'click',
                function () {

                    searchInput.value =
                        '';


                    perPage.value =
                        '20';


                    currentPage =
                        1;


                    renderTable();
                }
            );


        renderTable();


        /* =========================================================
           EXPORT CSV
        ========================================================= */

        $('#tanahExportButton')
            ?.addEventListener(
                'click',
                function () {

                    const rows =
                        filteredRows();


                    if (!rows.length) {

                        showToast(
                            'Tidak ada data untuk diekspor.',
                            'error'
                        );

                        return;
                    }


                    const data = [[
                        'No',
                        'Lokasi',
                        'Alamat',
                        'Penggunaan',
                        'Nilai',
                    ]];


                    rows.forEach(
                        function (
                            row,
                            index
                        ) {

                            const cells =
                                row.querySelectorAll(
                                    'td'
                                );


                            data.push([
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

                                cells[4]
                                    ?.innerText
                                    ?.trim()
                                    || '',
                            ]);
                        }
                    );


                    const csv =
                        data
                            .map(
                                row =>
                                    row
                                        .map(
                                            value =>
                                                '"'
                                                +
                                                String(
                                                    value
                                                )
                                                    .replace(
                                                        /"/g,
                                                        '""'
                                                    )
                                                +
                                                '"'
                                        )
                                        .join(',')
                            )
                            .join(
                                '\r\n'
                            );


                    const blob =
                        new Blob(
                            [
                                '\uFEFF'
                                +
                                csv,
                            ],
                            {
                                type:
                                    'text/csv;charset=utf-8;',
                            }
                        );


                    const url =
                        URL.createObjectURL(
                            blob
                        );


                    const link =
                        document.createElement(
                            'a'
                        );


                    link.href =
                        url;


                    link.download =
                        'data-tanah.csv';


                    document.body
                        .appendChild(
                            link
                        );


                    link.click();

                    link.remove();


                    URL.revokeObjectURL(
                        url
                    );
                }
            );


        /* =========================================================
           PENDING NILAI ASET
        ========================================================= */

        const incomingCard =
            $('#tanahIncomingCard');


        const incomingCount =
            $('#tanahIncomingCount');


        const incomingNew =
            $('#tanahIncomingNew');


        const incomingValue =
            $('#tanahIncomingValue');


        const incomingText =
            $('#tanahIncomingText');


        const incomingButton =
            $('#tanahIncomingButton');


        const sourceBody =
            $('#tanahSourceBody');


        const sourceSearch =
            $('#tanahSourceSearch');


        const sourceTotal =
            $('#tanahSourceTotal');


        let pendingRows =
            [];


        function fallbackPending()
        {
            try {

                return JSON.parse(
                    $('#tanahPendingFallback')
                        ?.textContent
                    || '[]'
                );

            } catch (
                error
            ) {

                return [];
            }
        }


        function pendingSummary(
            data
        ) {
            if (
                data
                &&
                Array.isArray(
                    data.data
                )
            ) {

                return data;
            }


            const rows =
                Array.isArray(
                    data
                )
                    ? data
                    : [];


            return {

                count:
                    rows.length,

                aset_baru:
                    rows.filter(
                        row =>
                            Number(
                                row.jenisn
                            )
                            === 1
                    ).length,

                penambahan_nilai:
                    rows.filter(
                        row =>
                            Number(
                                row.jenisn
                            )
                            === 2
                    ).length,

                data:
                    rows,
            };
        }


        function updateIncoming(
            summary
        ) {
            const total =
                Number(
                    summary.count
                    || 0
                );


            incomingCount.textContent =
                total > 99
                    ? '99+'
                    : total;


            incomingNew.textContent =
                Number(
                    summary.aset_baru
                    || 0
                );


            incomingValue.textContent =
                Number(
                    summary.penambahan_nilai
                    || 0
                );


            incomingCard.classList
                .toggle(
                    'is-empty',
                    total === 0
                );


            incomingButton.disabled =
                total === 0;


            incomingText.textContent =
                total > 0

                    ? (
                        'Ada '
                        +
                        total
                        +
                        ' transaksi Nilai Aset kategori Tanah yang belum diproses.'
                    )

                    : 'Tidak ada transaksi Tanah yang menunggu diproses.';
        }


        async function loadPending()
        {
            try {

                const payload =
                    await fetchJson(
                        PENDING_URL
                    );


                const summary =
                    pendingSummary(
                        payload
                    );


                pendingRows =
                    summary.data;


                updateIncoming(
                    summary
                );


            } catch (
                error
            ) {

                pendingRows =
                    fallbackPending();


                updateIncoming(
                    pendingSummary(
                        pendingRows
                    )
                );
            }


            renderSourceRows();
        }


        function filteredSource()
        {
            const keyword =
                (
                    sourceSearch?.value
                    || ''
                )
                    .trim()
                    .toLowerCase();


            if (!keyword) {
                return pendingRows;
            }


            return pendingRows.filter(
                function (item) {

                    return [
                        item.no_voucher,
                        item.lokasi,
                        item.alamat,
                        item.departemen,
                        item.divisi,
                        item.tahun,
                        item.urai,
                    ]
                        .join(' ')
                        .toLowerCase()
                        .includes(
                            keyword
                        );
                }
            );
        }


        function renderSourceRows()
        {
            if (!sourceBody) {
                return;
            }


            const rows =
                filteredSource();


            sourceTotal.textContent =
                rows.length
                +
                ' data';


            sourceBody.innerHTML =
                '';


            if (!rows.length) {

                sourceBody.innerHTML = `
                    <tr>
                        <td
                            colspan="9"
                            class="tanah-source-empty"
                        >
                            Tidak ada transaksi Tanah.
                        </td>
                    </tr>
                `;

                return;
            }


            rows.forEach(
                function (
                    item,
                    index
                ) {

                    const tr =
                        document.createElement(
                            'tr'
                        );


                    tr.innerHTML = `

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
                                ${escapeHtml(
                                    item.nilai_label
                                    ||
                                    formatRupiah(
                                        item.nilai
                                    )
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
                            >
                                Pilih
                            </button>
                        </td>
                    `;


                    tr.querySelector(
                        '.tanah-source-select'
                    )
                        ?.addEventListener(
                            'click',
                            function () {

                                selectSource(
                                    item
                                );
                            }
                        );


                    sourceBody
                        .appendChild(
                            tr
                        );
                }
            );
        }


        sourceSearch
            ?.addEventListener(
                'input',
                renderSourceRows
            );


        /* =========================================================
           FORM
        ========================================================= */

        const formModal =
            $('#tanahFormModal');


        const form =
            $('#tanahForm');


        const method =
            $('#tanahFormMethod');


        const formTitle =
            $('#tanahFormTitle');


        const nilaiAktivaId =
            $('#tanahNilaiAktivaId');


        const lokasiId =
            $('#tanahLokasiId');


        const lokasiName =
            $('#tanahLokasiName');


        const alamat =
            $('#tanahAlamat');


        const barang =
            $('#tanahBarang');


        const tahun =
            $('#tanahTahun');


        const guna =
            $('#tanahGuna');


        const selectedSource =
            $('#tanahSelectedSource');


        const selectedTitle =
            $('#tanahSelectedTitle');


        const selectedMeta =
            $('#tanahSelectedMeta');


        function resetForm()
        {
            form.reset();


            form.action =
                STORE_URL;


            method.value =
                '';


            formTitle.textContent =
                'Tambah Data Tanah';


            nilaiAktivaId.value =
                '';


            lokasiId.value =
                '';


            lokasiName.value =
                '';


            alamat.value =
                '';


            selectedSource.hidden =
                true;


            $('#tanahFileSelected').hidden =
                true;
        }


        function selectSource(
            item
        ) {
            nilaiAktivaId.value =
                item.id
                ?? '';


            lokasiId.value =
                item.id_lokasi
                ?? '';


            lokasiName.value =
                item.lokasi
                ?? '';


            alamat.value =
                item.alamat
                ?? '';


            tahun.value =
                item.tahun
                ?? '';


            selectedTitle.textContent =
                (
                    item.lokasi
                    || '-'
                )
                +
                ' • '
                +
                (
                    item.no_voucher
                    || '-'
                );


            selectedMeta.textContent =
                (
                    item.departemen
                    || '-'
                )
                +
                ' / '
                +
                (
                    item.divisi
                    || '-'
                )
                +
                ' • '
                +
                formatRupiah(
                    item.nilai
                );


            selectedSource.hidden =
                false;


            refreshIcons();
        }


        $('#tanahAddButton')
            ?.addEventListener(
                'click',
                function () {

                    resetForm();

                    openDialog(
                        formModal
                    );
                }
            );


        incomingButton
            ?.addEventListener(
                'click',
                function () {

                    resetForm();

                    openDialog(
                        formModal
                    );
                }
            );


        $('#tanahChangeSourceButton')
            ?.addEventListener(
                'click',
                function () {

                    sourceSearch
                        ?.focus();
                }
            );


        form
            ?.addEventListener(
                'submit',
                function (event) {

                    const isEdit =
                        method.value
                        === 'PUT';


                    if (
                        !isEdit
                        &&
                        !nilaiAktivaId.value
                    ) {

                        event.preventDefault();


                        showToast(
                            'Pilih data Nilai Aset terlebih dahulu.',
                            'error'
                        );

                        return;
                    }


                    if (
                        !lokasiId.value
                    ) {

                        event.preventDefault();


                        showToast(
                            'Lokasi belum tersedia.',
                            'error'
                        );
                    }
                }
            );


        /* =========================================================
           PDF INPUT
        ========================================================= */

        const pdfInput =
            $('#tanahPdfInput');


        pdfInput
            ?.addEventListener(
                'change',
                function () {

                    const file =
                        pdfInput.files?.[0];


                    const selected =
                        $('#tanahFileSelected');


                    const name =
                        $('#tanahFileName');


                    if (!file) {

                        selected.hidden =
                            true;

                        return;
                    }


                    if (
                        file.type
                        !== 'application/pdf'
                    ) {

                        pdfInput.value =
                            '';


                        selected.hidden =
                            true;


                        showToast(
                            'Dokumen harus berformat PDF.',
                            'error'
                        );

                        return;
                    }


                    if (
                        file.size
                        >
                        15
                        *
                        1024
                        *
                        1024
                    ) {

                        pdfInput.value =
                            '';


                        selected.hidden =
                            true;


                        showToast(
                            'Ukuran PDF maksimal 15 MB.',
                            'error'
                        );

                        return;
                    }


                    name.textContent =
                        file.name;


                    selected.hidden =
                        false;


                    refreshIcons();
                }
            );


        /* =========================================================
           LOAD RECORD
        ========================================================= */

        async function loadRecord(
            id
        ) {
            const payload =
                await fetchJson(
                    RECORD_BASE_URL
                    +
                    '/'
                    +
                    encodeURIComponent(
                        id
                    )
                );


            return unwrapData(
                payload
            );
        }


        /* =========================================================
           VIEW
        ========================================================= */

        const detailModal =
            $('#tanahDetailModal');


        function detailText(
            selector,
            value
        ) {
            const element =
                $(selector);


            if (
                element
            ) {

                element.textContent =
                    value
                    ||
                    '-';
            }
        }


        function fillDetail(
            data
        ) {
            detailText(
                '#detailTanahLokasi',
                data.lokasi
            );


            detailText(
                '#detailTanahAlamat',
                data.alamat
            );


            detailText(
                '#detailTanahBarang',
                data.nama_barang
                ||
                data.barang
            );


            detailText(
                '#detailTanahTahun',
                data.tahun
            );


            detailText(
                '#detailTanahGuna',
                data.guna
            );


            detailText(
                '#detailTanahNilai',
                formatRupiah(
                    data.nilai
                    ||
                    data.total_nilai
                    ||
                    0
                )
            );


            detailText(
                '#detailTanahNoTunjuk',
                data.no_tunjuk
            );


            detailText(
                '#detailTanahTglTunjuk',
                formatDate(
                    data.tgl_tunjuk
                )
            );


            detailText(
                '#detailTanahLuasTunjuk',
                data.luas_tunjuk
                    ? formatNumber(
                        data.luas_tunjuk
                    )
                        +
                        ' m²'
                    : '-'
            );


            detailText(
                '#detailTanahSertifikat',
                data.sertifikat
            );


            detailText(
                '#detailTanahTglSertifikat',
                formatDate(
                    data.tgl_sertifikat
                )
            );


            detailText(
                '#detailTanahLuasSertifikat',
                data.luas_sertifikat
                    ? formatNumber(
                        data.luas_sertifikat
                    )
                        +
                        ' m²'
                    : '-'
            );


            detailText(
                '#detailTanahNoGambar',
                data.no_gambar
            );


            detailText(
                '#detailTanahTglGambar',
                formatDate(
                    data.tgl_gambar
                )
            );


            detailText(
                '#detailTanahLuasGambar',
                data.luas_gambar
                    ? formatNumber(
                        data.luas_gambar
                    )
                        +
                        ' m²'
                    : '-'
            );


            detailText(
                '#detailTanahAsal',
                data.asal
            );


            detailText(
                '#detailTanahHak',
                data.hak
            );


            detailText(
                '#detailTanahPemilik',
                data.pemilik
            );


            detailText(
                '#detailTanahKeterangan',
                data.ket
                ||
                data.keterangan
            );
        }


        async function openRecordView(
            id
        ) {
            try {

                const data =
                    await loadRecord(
                        id
                    );


                fillDetail(
                    data
                );


                openDialog(
                    detailModal
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );


                showToast(
                    'Detail data Tanah gagal dimuat.',
                    'error'
                );
            }
        }


        /* =========================================================
           EDIT
        ========================================================= */

        function value(
            selector,
            data
        ) {
            const element =
                $(selector);


            if (
                element
            ) {

                element.value =
                    data
                    ?? '';
            }
        }


        function fillEdit(
            data
        ) {
            const id =
                data.id
                ??
                data.idT
                ??
                data.id_tanah;


            form.action =
                RECORD_BASE_URL
                +
                '/'
                +
                encodeURIComponent(
                    id
                );


            method.value =
                'PUT';


            formTitle.textContent =
                'Edit Data Tanah';


            value(
                '#tanahNilaiAktivaId',
                data.id_nilai_aktiva
            );


            value(
                '#tanahLokasiId',
                data.id_lokasi
            );


            value(
                '#tanahLokasiName',
                data.lokasi
            );


            value(
                '#tanahAlamat',
                data.alamat
            );


            value(
                '#tanahBarang',
                data.id_barang
            );


            value(
                '#tanahTahun',
                data.tahun
            );


            value(
                '#tanahGuna',
                data.guna
            );


            value(
                '#tanahNoTunjuk',
                data.no_tunjuk
            );


            value(
                '#tanahTglTunjuk',
                dateInput(
                    data.tgl_tunjuk
                )
            );


            value(
                '#tanahLuasTunjuk',
                data.luas_tunjuk
            );


            value(
                '#tanahSertifikat',
                data.sertifikat
            );


            value(
                '#tanahTglSertifikat',
                dateInput(
                    data.tgl_sertifikat
                )
            );


            value(
                '#tanahLuasSertifikat',
                data.luas_sertifikat
            );


            value(
                '#tanahNoGambar',
                data.no_gambar
            );


            value(
                '#tanahTglGambar',
                dateInput(
                    data.tgl_gambar
                )
            );


            value(
                '#tanahLuasGambar',
                data.luas_gambar
            );


            value(
                '#tanahAsal',
                data.asal
            );


            value(
                '#tanahHak',
                data.hak
            );


            value(
                '#tanahPemilik',
                data.pemilik
            );


            value(
                '#tanahKeterangan',
                data.ket
                ??
                data.keterangan
            );


            selectedTitle.textContent =
                data.lokasi
                ||
                'Data Tanah';


            selectedMeta.textContent =
                data.id_nilai_aktiva
                    ? (
                        'Sumber Nilai Aset #'
                        +
                        data.id_nilai_aktiva
                    )
                    : 'Data existing';


            selectedSource.hidden =
                false;
        }


        async function openEdit(
            id
        ) {
            try {

                const data =
                    await loadRecord(
                        id
                    );


                resetForm();


                fillEdit(
                    data
                );


                openDialog(
                    formModal
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );


                showToast(
                    'Data Tanah gagal dimuat untuk diedit.',
                    'error'
                );
            }
        }


        /* =========================================================
           DELETE
        ========================================================= */

        const deleteModal =
            $('#tanahDeleteModal');


        const deleteForm =
            $('#tanahDeleteForm');


        function openDelete(
            id,
            name
        ) {
            if (!id) {

                showToast(
                    'ID Tanah tidak tersedia.',
                    'error'
                );

                return;
            }


            deleteForm.action =
                RECORD_BASE_URL
                +
                '/'
                +
                encodeURIComponent(
                    id
                );


            $('#tanahDeleteName')
                .textContent =
                name
                || 'Data Tanah';


            openDialog(
                deleteModal
            );
        }


        /* =========================================================
           TABLE ACTION EVENTS
        ========================================================= */

        $$(
            '.js-tanah-view'
        )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            openRecordView(
                                button.dataset
                                    .recordId
                            );
                        }
                    );
                }
            );


        $$(
            '.js-tanah-edit'
        )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            openEdit(
                                button.dataset
                                    .recordId
                            );
                        }
                    );
                }
            );


        $$(
            '.js-tanah-delete'
        )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            openDelete(

                                button.dataset
                                    .recordId,

                                button.dataset
                                    .recordName
                            );
                        }
                    );
                }
            );


        /* =========================================================
           PDF PREVIEW
        ========================================================= */

        const pdfModal =
            $('#tanahPdfModal');


        const pdfFrame =
            $('#tanahPdfFrame');


        const pdfTitle =
            $('#tanahPdfTitle');


        const pdfDownload =
            $('#tanahPdfDownload');


        $$(
            '.js-tanah-pdf'
        )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

                            const url =
                                button.dataset
                                    .pdfUrl;


                            if (!url) {

                                showToast(
                                    'Dokumen PDF tidak tersedia.',
                                    'error'
                                );

                                return;
                            }


                            pdfFrame.src =
                                url;


                            pdfTitle.textContent =
                                button.dataset
                                    .pdfName
                                ||
                                'Dokumen Tanah';


                            pdfDownload.href =
                                button.dataset
                                    .pdfDownload
                                ||
                                url;


                            openDialog(
                                pdfModal
                            );
                        }
                    );
                }
            );


        function closePdf()
        {
            closeDialog(
                pdfModal
            );


            if (
                pdfFrame
            ) {

                pdfFrame.src =
                    '';
            }
        }


        $('#tanahPdfClose')
            ?.addEventListener(
                'click',
                closePdf
            );


        pdfModal
            ?.addEventListener(
                'close',
                function () {

                    pdfFrame.src =
                        '';
                }
            );


        /* =========================================================
           GLOBAL SOURCE EVENT
        ========================================================= */

        window.addEventListener(
            'kib:source-selected',
            function (event) {

                if (
                    !event.detail
                ) {

                    return;
                }


                resetForm();


                openDialog(
                    formModal
                );


                selectSource(
                    event.detail
                );
            }
        );


        /* =========================================================
           VALIDATION ERROR
        ========================================================= */

        if (
            page.dataset
                .hasErrors
            === '1'
        ) {

            openDialog(
                formModal
            );
        }


        /* =========================================================
           INITIAL
        ========================================================= */

        loadPending();

        refreshIcons();
    }
);