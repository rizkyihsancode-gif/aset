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


        const LOCATION_BASE_URL =
            page.dataset.locationBaseUrl
            || '/kib/tanah/lokasi';


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
                'Rp ' +
                new Intl.NumberFormat(
                    'id-ID',
                    {
                        maximumFractionDigits:
                            0,
                    }
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
                    maximumFractionDigits:
                        2,
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
                parts.length
                !== 3
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


        function dateInputValue(
            value
        ) {
            if (!value) {
                return '';
            }


            return String(value)
                .substring(
                    0,
                    10
                );
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
                        method:
                            'GET',

                        headers: {
                            'Accept':
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
                    'is-error',
                    'is-success'
                );


            if (
                type === 'error'
            ) {

                toast.classList
                    .add(
                        'is-error'
                    );

            } else if (
                type === 'success'
            ) {

                toast.classList
                    .add(
                        'is-success'
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
                    3800
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
                !dialog
                ||
                !dialog.open
            ) {

                return;
            }


            if (
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
                function (
                    button
                ) {

                    button.addEventListener(
                        'click',
                        function () {

                            const id =
                                button.dataset
                                    .closeDialog;


                            closeDialog(
                                document
                                    .getElementById(
                                        id
                                    )
                            );
                        }
                    );
                }
            );


        $$('dialog')
            .forEach(
                function (
                    dialog
                ) {

                    dialog.addEventListener(
                        'click',
                        function (
                            event
                        ) {

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
           MAIN TABLE FILTER + PAGINATION
        ========================================================= */

        const tableRows =
            $$(
                '.tanah-data-row'
            );


        const searchInput =
            $('#tanahSearch');


        const perPageSelect =
            $('#tanahPerPage');


        const resetButton =
            $('#tanahResetButton');


        const tableInfo =
            $('#tanahTableInfo');


        const pagination =
            $('#tanahPagination');


        let currentPage =
            1;


        function getFilteredRows()
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
                function (
                    row
                ) {

                    return (
                        row.dataset
                            .search
                        || ''
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        );
                }
            );
        }


        function createPageButton(
            label,
            pageNumber,
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


            if (
                options.active
            ) {

                button.classList
                    .add(
                        'active'
                    );
            }


            if (
                options.disabled
            ) {

                button.disabled =
                    true;
            }


            if (
                options.icon
            ) {

                button.innerHTML =
                    `<i data-lucide="${options.icon}"></i>`;

            } else {

                button.textContent =
                    label;
            }


            if (
                !options.disabled
                &&
                !options.active
            ) {

                button.addEventListener(
                    'click',
                    function () {

                        currentPage =
                            pageNumber;


                        renderMainTable();
                    }
                );
            }


            return button;
        }


        function renderMainPagination(
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
                createPageButton(
                    '',
                    Math.max(
                        1,
                        currentPage - 1
                    ),
                    {
                        icon:
                            'chevron-left',

                        disabled:
                            currentPage
                            === 1,
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


            if (
                start > 1
            ) {

                pagination.appendChild(
                    createPageButton(
                        '1',
                        1,
                        {
                            active:
                                currentPage
                                === 1,
                        }
                    )
                );


                if (
                    start > 2
                ) {

                    const dots =
                        document
                            .createElement(
                                'span'
                            );


                    dots.textContent =
                        '...';


                    pagination.appendChild(
                        dots
                    );
                }
            }


            for (
                let pageNumber =
                    start;

                pageNumber <= end;

                pageNumber++
            ) {

                pagination.appendChild(
                    createPageButton(
                        String(
                            pageNumber
                        ),
                        pageNumber,
                        {
                            active:
                                currentPage
                                ===
                                pageNumber,
                        }
                    )
                );
            }


            if (
                end < totalPages
            ) {

                if (
                    end
                    <
                    totalPages - 1
                ) {

                    const dots =
                        document
                            .createElement(
                                'span'
                            );


                    dots.textContent =
                        '...';


                    pagination.appendChild(
                        dots
                    );
                }


                pagination.appendChild(
                    createPageButton(
                        String(
                            totalPages
                        ),
                        totalPages,
                        {
                            active:
                                currentPage
                                ===
                                totalPages,
                        }
                    )
                );
            }


            pagination.appendChild(
                createPageButton(
                    '',
                    Math.min(
                        totalPages,
                        currentPage + 1
                    ),
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


        function renderMainTable()
        {
            const filtered =
                getFilteredRows();


            const perPage =
                Math.max(
                    1,
                    Number(
                        perPageSelect
                            ?.value
                        || 20
                    )
                );


            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        filtered.length
                        /
                        perPage
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
                function (
                    row
                ) {

                    row.hidden =
                        true;
                }
            );


            const start =
                (
                    currentPage - 1
                )
                *
                perPage;


            const end =
                Math.min(
                    start
                    +
                    perPage,
                    filtered.length
                );


            filtered
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


            if (tableInfo) {

                if (
                    filtered.length
                    === 0
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
                        filtered.length
                            .toLocaleString(
                                'id-ID'
                            )
                        +
                        ' data';
                }
            }


            renderMainPagination(
                filtered.length
                === 0
                    ? 0
                    : totalPages
            );
        }


        searchInput
            ?.addEventListener(
                'input',
                function () {

                    currentPage =
                        1;


                    renderMainTable();
                }
            );


        perPageSelect
            ?.addEventListener(
                'change',
                function () {

                    currentPage =
                        1;


                    renderMainTable();
                }
            );


        resetButton
            ?.addEventListener(
                'click',
                function () {

                    if (
                        searchInput
                    ) {

                        searchInput.value =
                            '';
                    }


                    if (
                        perPageSelect
                    ) {

                        perPageSelect.value =
                            '20';
                    }


                    currentPage =
                        1;


                    renderMainTable();
                }
            );


        renderMainTable();


        /* =========================================================
           EXPORT CSV
        ========================================================= */

        $('#tanahExportButton')
            ?.addEventListener(
                'click',
                function () {

                    const rows =
                        getFilteredRows();


                    if (
                        !rows.length
                    ) {

                        showToast(
                            'Tidak ada data untuk diekspor.',
                            'error'
                        );

                        return;
                    }


                    const csvRows = [
                        [
                            'No',
                            'Lokasi',
                            'Alamat',
                            'Barang',
                            'Penggunaan',
                            'Penunjukan',
                        ],
                    ];


                    rows.forEach(
                        function (
                            row,
                            index
                        ) {

                            const cells =
                                Array.from(
                                    row.querySelectorAll(
                                        'td'
                                    )
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

                                cells[4]
                                    ?.innerText
                                    ?.trim()
                                    || '',

                                cells[5]
                                    ?.innerText
                                    ?.trim()
                                    || '',
                            ]);
                        }
                    );


                    const content =
                        csvRows
                            .map(
                                function (
                                    row
                                ) {

                                    return row
                                        .map(
                                            function (
                                                value
                                            ) {

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
                            .join(
                                '\r\n'
                            );


                    const blob =
                        new Blob(
                            [
                                '\uFEFF'
                                +
                                content,
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
                        'data-kib-tanah.csv';


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


        function getFallbackPending()
        {
            const script =
                $('#tanahPendingFallback');


            if (!script) {
                return [];
            }


            try {

                const parsed =
                    JSON.parse(
                        script.textContent
                        || '[]'
                    );


                return Array.isArray(
                    parsed
                )
                    ? parsed
                    : [];

            } catch (
                error
            ) {

                console.error(
                    'Fallback pending JSON:',
                    error
                );


                return [];
            }
        }


        function normalizePendingPayload(
            payload
        ) {
            if (
                payload
                &&
                Array.isArray(
                    payload.data
                )
            ) {

                return payload;
            }


            if (
                Array.isArray(
                    payload
                )
            ) {

                return {
                    count:
                        payload.length,

                    aset_baru:
                        payload
                            .filter(
                                item =>
                                    Number(
                                        item.jenisn
                                    )
                                    === 1
                            )
                            .length,

                    penambahan_nilai:
                        payload
                            .filter(
                                item =>
                                    Number(
                                        item.jenisn
                                    )
                                    === 2
                            )
                            .length,

                    data:
                        payload,
                };
            }


            return {
                count:
                    0,

                aset_baru:
                    0,

                penambahan_nilai:
                    0,

                data:
                    [],
            };
        }


        function updateIncomingCard(
            summary
        ) {
            const total =
                Number(
                    summary.count
                    || 0
                );


            const asetBaru =
                Number(
                    summary.aset_baru
                    || 0
                );


            const tambahNilai =
                Number(
                    summary.penambahan_nilai
                    || 0
                );


            if (
                incomingCount
            ) {

                incomingCount.textContent =
                    total > 999
                        ? '999+'
                        : total
                            .toLocaleString(
                                'id-ID'
                            );
            }


            if (
                incomingNew
            ) {

                incomingNew.textContent =
                    asetBaru
                        .toLocaleString(
                            'id-ID'
                        );
            }


            if (
                incomingValue
            ) {

                incomingValue.textContent =
                    tambahNilai
                        .toLocaleString(
                            'id-ID'
                        );
            }


            incomingCard
                ?.classList
                .toggle(
                    'is-empty',
                    total === 0
                );


            if (
                incomingText
            ) {

                incomingText.textContent =
                    total > 0

                        ? (
                            'Ada '
                            +
                            total
                                .toLocaleString(
                                    'id-ID'
                                )
                            +
                            ' transaksi Nilai Aset kategori Tanah yang belum diproses.'
                        )

                        : 'Tidak ada transaksi Tanah yang menunggu diproses.';
            }


            if (
                incomingButton
            ) {

                incomingButton.disabled =
                    total === 0;
            }
        }


        async function loadPendingData()
        {
            try {

                const payload =
                    await fetchJson(
                        PENDING_URL
                    );


                const summary =
                    normalizePendingPayload(
                        payload
                    );


                pendingRows =
                    summary.data;


                updateIncomingCard(
                    summary
                );


                renderSourceRows();

            } catch (
                error
            ) {

                console.warn(
                    'Endpoint pending belum tersedia, menggunakan fallback.',
                    error
                );


                pendingRows =
                    getFallbackPending();


                const summary =
                    normalizePendingPayload(
                        pendingRows
                    );


                updateIncomingCard(
                    summary
                );


                renderSourceRows();
            }
        }


        /* =========================================================
           SOURCE TABLE
        ========================================================= */

        function getFilteredSourceRows()
        {
            const keyword =
                (
                    sourceSearch
                        ?.value
                    || ''
                )
                    .trim()
                    .toLowerCase();


            if (!keyword) {

                return pendingRows;
            }


            return pendingRows
                .filter(
                    function (
                        item
                    ) {

                        const haystack = [

                            item.no_voucher,

                            item.lokasi,

                            item.alamat,

                            item.departemen,

                            item.divisi,

                            item.tahun,

                            item.nilai_label,

                            item.urai,

                        ]
                            .join(' ')
                            .toLowerCase();


                        return haystack
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
                getFilteredSourceRows();


            sourceBody.innerHTML =
                '';


            if (
                sourceTotal
            ) {

                sourceTotal.textContent =
                    rows.length
                        .toLocaleString(
                            'id-ID'
                        )
                    +
                    ' data';
            }


            if (
                rows.length === 0
            ) {

                sourceBody.innerHTML = `
                    <tr>

                        <td
                            colspan="9"
                            class="tanah-source-empty"
                        >

                            Tidak ada transaksi Tanah yang tersedia.

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
                        document
                            .createElement(
                                'tr'
                            );


                    const nominal =
                        item.nilai_label
                        ||
                        formatRupiah(
                            item.nilai
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
                                    nominal
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


                    tr
                        .querySelector(
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
           SOURCE TOGGLE
        ========================================================= */

        const sourcePanel =
            $('#tanahSourcePanel');


        const sourceToggle =
            $('#tanahSourceToggle');


        function setSourcePanel(
            open
        ) {
            if (
                !sourcePanel
                ||
                !sourceToggle
            ) {

                return;
            }


            sourcePanel.hidden =
                !open;


            const icon =
                sourceToggle
                    .querySelector(
                        'svg'
                    );


            const text =
                sourceToggle
                    .querySelector(
                        'span'
                    );


            if (
                icon
            ) {

                icon.setAttribute(
                    'data-lucide',
                    open
                        ? 'chevron-up'
                        : 'chevron-down'
                );
            }


            if (
                text
            ) {

                text.textContent =
                    open
                        ? 'Sembunyikan'
                        : 'Tampilkan';
            }


            refreshIcons();
        }


        sourceToggle
            ?.addEventListener(
                'click',
                function () {

                    setSourcePanel(
                        sourcePanel
                            ?.hidden
                        === true
                    );
                }
            );


        /* =========================================================
           FORM
        ========================================================= */

        const formModal =
            $('#tanahFormModal');


        const form =
            $('#tanahForm');


        const formMethod =
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


        const noTunjuk =
            $('#tanahNoTunjuk');


        const tglTunjuk =
            $('#tanahTglTunjuk');


        const luasTunjuk =
            $('#tanahLuasTunjuk');


        const sertifikat =
            $('#tanahSertifikat');


        const tglSertifikat =
            $('#tanahTglSertifikat');


        const luasSertifikat =
            $('#tanahLuasSertifikat');


        const noGambar =
            $('#tanahNoGambar');


        const tglGambar =
            $('#tanahTglGambar');


        const luasGambar =
            $('#tanahLuasGambar');


        const asal =
            $('#tanahAsal');


        const hak =
            $('#tanahHak');


        const pemilik =
            $('#tanahPemilik');


        const keterangan =
            $('#tanahKeterangan');


        const selectedSource =
            $('#tanahSelectedSource');


        const selectedTitle =
            $('#tanahSelectedTitle');


        const selectedMeta =
            $('#tanahSelectedMeta');


        const changeSource =
            $('#tanahChangeSourceButton');


        let selectedSourceData =
            null;


        function clearTechnicalFields()
        {
            if (barang) {
                barang.value =
                    '';
            }


            if (guna) {
                guna.value =
                    '';
            }


            if (noTunjuk) {
                noTunjuk.value =
                    '';
            }


            if (tglTunjuk) {
                tglTunjuk.value =
                    '';
            }


            if (luasTunjuk) {
                luasTunjuk.value =
                    '';
            }


            if (sertifikat) {
                sertifikat.value =
                    '';
            }


            if (tglSertifikat) {
                tglSertifikat.value =
                    '';
            }


            if (luasSertifikat) {
                luasSertifikat.value =
                    '';
            }


            if (noGambar) {
                noGambar.value =
                    '';
            }


            if (tglGambar) {
                tglGambar.value =
                    '';
            }


            if (luasGambar) {
                luasGambar.value =
                    '';
            }


            if (asal) {
                asal.value =
                    '';
            }


            if (hak) {
                hak.value =
                    '';
            }


            if (pemilik) {
                pemilik.value =
                    '';
            }


            if (keterangan) {
                keterangan.value =
                    '';
            }
        }


        function resetCreateForm()
        {
            if (!form) {
                return;
            }


            form.reset();


            form.action =
                STORE_URL;


            if (
                formMethod
            ) {

                formMethod.value =
                    '';
            }


            if (
                formTitle
            ) {

                formTitle.textContent =
                    'Tambah Data Tanah';
            }


            if (
                nilaiAktivaId
            ) {

                nilaiAktivaId.value =
                    '';
            }


            if (
                lokasiId
            ) {

                lokasiId.value =
                    '';
            }


            if (
                lokasiName
            ) {

                lokasiName.value =
                    '';
            }


            if (
                alamat
            ) {

                alamat.value =
                    '';
            }


            if (
                tahun
            ) {

                tahun.value =
                    '';
            }


            selectedSourceData =
                null;


            if (
                selectedSource
            ) {

                selectedSource.hidden =
                    true;
            }


            setSourcePanel(
                true
            );


            clearTechnicalFields();
        }


        function selectSource(
            item
        ) {
            selectedSourceData =
                item;


            if (
                nilaiAktivaId
            ) {

                nilaiAktivaId.value =
                    item.id
                    ?? '';
            }


            if (
                lokasiId
            ) {

                lokasiId.value =
                    item.id_lokasi
                    ?? '';
            }


            if (
                lokasiName
            ) {

                lokasiName.value =
                    item.lokasi
                    ?? '';
            }


            if (
                alamat
            ) {

                alamat.value =
                    item.alamat
                    ?? '';
            }


            if (
                tahun
            ) {

                tahun.value =
                    item.tahun
                    ?? '';
            }


            if (
                selectedTitle
            ) {

                selectedTitle.textContent =
                    (
                        item.lokasi
                        || 'Lokasi'
                    )
                    +
                    ' • '
                    +
                    (
                        item.no_voucher
                        || 'Tanpa Voucher'
                    );
            }


            if (
                selectedMeta
            ) {

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
                    (
                        item.nilai_label
                        ||
                        formatRupiah(
                            item.nilai
                        )
                    );
            }


            if (
                selectedSource
            ) {

                selectedSource.hidden =
                    false;
            }


            setSourcePanel(
                false
            );


            document
                .querySelector(
                    '.tanah-form-section'
                )
                ?.scrollIntoView(
                    {
                        behavior:
                            'smooth',

                        block:
                            'start',
                    }
                );


            refreshIcons();
        }


        changeSource
            ?.addEventListener(
                'click',
                function () {

                    setSourcePanel(
                        true
                    );


                    sourceSearch
                        ?.focus();
                }
            );


        $('#tanahAddButton')
            ?.addEventListener(
                'click',
                function () {

                    resetCreateForm();

                    openDialog(
                        formModal
                    );
                }
            );


        incomingButton
            ?.addEventListener(
                'click',
                function () {

                    resetCreateForm();

                    openDialog(
                        formModal
                    );


                    setSourcePanel(
                        true
                    );
                }
            );


        /* =========================================================
           FORM VALIDATION BEFORE SUBMIT
        ========================================================= */

        form
            ?.addEventListener(
                'submit',
                function (
                    event
                ) {

                    const isCreate =
                        !formMethod
                        ||
                        formMethod.value
                        !== 'PUT';


                    if (
                        isCreate
                        &&
                        !nilaiAktivaId
                            ?.value
                    ) {

                        event.preventDefault();


                        showToast(
                            'Pilih sumber transaksi Nilai Aset terlebih dahulu.',
                            'error'
                        );


                        setSourcePanel(
                            true
                        );


                        sourceSearch
                            ?.focus();


                        return;
                    }


                    if (
                        !lokasiId
                            ?.value
                    ) {

                        event.preventDefault();


                        showToast(
                            'Lokasi Tanah belum tersedia.',
                            'error'
                        );
                    }
                }
            );


        /* =========================================================
           LOCATION DETAILS
        ========================================================= */

        const locationModal =
            $('#tanahLocationModal');


        const locationTitle =
            $('#tanahLocationTitle');


        const locationBody =
            $('#tanahLocationBody');


        async function openLocationDetail(
            locationIdValue,
            locationNameValue
        ) {
            if (
                !locationIdValue
            ) {

                showToast(
                    'ID lokasi tidak tersedia.',
                    'error'
                );

                return;
            }


            if (
                locationTitle
            ) {

                locationTitle.textContent =
                    locationNameValue
                    || 'Detail Lokasi';
            }


            if (
                locationBody
            ) {

                locationBody.innerHTML = `
                    <tr>

                        <td
                            colspan="7"
                            class="tanah-location-empty"
                        >

                            Memuat data lokasi...

                        </td>

                    </tr>
                `;
            }


            openDialog(
                locationModal
            );


            try {

                const payload =
                    await fetchJson(
                        LOCATION_BASE_URL
                        +
                        '/'
                        +
                        encodeURIComponent(
                            locationIdValue
                        )
                    );


                const data =
                    unwrapData(
                        payload
                    );


                const records =
                    Array.isArray(
                        data
                    )
                        ? data
                        : [];


                renderLocationRecords(
                    records
                );

            } catch (
                error
            ) {

                console.error(
                    'Location detail:',
                    error
                );


                if (
                    locationBody
                ) {

                    locationBody.innerHTML = `
                        <tr>

                            <td
                                colspan="7"
                                class="tanah-location-empty"
                            >

                                Data lokasi gagal dimuat.

                            </td>

                        </tr>
                    `;
                }
            }
        }


        function recordId(
            record
        ) {
            return (
                record.id
                ??
                record.idT
                ??
                record.id_tanah
                ??
                null
            );
        }


        function renderLocationRecords(
            records
        ) {
            if (!locationBody) {
                return;
            }


            locationBody.innerHTML =
                '';


            if (
                records.length === 0
            ) {

                locationBody.innerHTML = `
                    <tr>

                        <td
                            colspan="7"
                            class="tanah-location-empty"
                        >

                            Tidak ada detail tanah pada lokasi ini.

                        </td>

                    </tr>
                `;


                return;
            }


            records.forEach(
                function (
                    record,
                    index
                ) {

                    const id =
                        recordId(
                            record
                        );


                    const tr =
                        document
                            .createElement(
                                'tr'
                            );


                    tr.innerHTML = `

                        <td>
                            ${index + 1}
                        </td>

                        <td>

                            ${escapeHtml(
                                record.nama_barang
                                ||
                                record.barang
                                ||
                                '-'
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                record.guna
                                || '-'
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                record.pemilik
                                || '-'
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                formatNumber(
                                    record.luas_sertifikat
                                )
                            )}

                            m²

                        </td>

                        <td>

                            ${escapeHtml(
                                record.hak
                                || '-'
                            )}

                        </td>

                        <td>

                            <div class="tanah-record-actions">

                                <button
                                    type="button"
                                    class="view js-record-view"
                                    title="Lihat"
                                >

                                    <i data-lucide="eye"></i>

                                </button>


                                <button
                                    type="button"
                                    class="edit js-record-edit"
                                    title="Edit"
                                >

                                    <i data-lucide="pencil"></i>

                                </button>


                                <button
                                    type="button"
                                    class="delete js-record-delete"
                                    title="Hapus"
                                >

                                    <i data-lucide="trash-2"></i>

                                </button>

                            </div>

                        </td>
                    `;


                    tr
                        .querySelector(
                            '.js-record-view'
                        )
                        ?.addEventListener(
                            'click',
                            function () {

                                openRecordView(
                                    id
                                );
                            }
                        );


                    tr
                        .querySelector(
                            '.js-record-edit'
                        )
                        ?.addEventListener(
                            'click',
                            function () {

                                openEditForm(
                                    id
                                );
                            }
                        );


                    tr
                        .querySelector(
                            '.js-record-delete'
                        )
                        ?.addEventListener(
                            'click',
                            function () {

                                openDeleteDialog(
                                    id,
                                    record.lokasi
                                    ||
                                    record.nama_barang
                                    ||
                                    'Data Tanah'
                                );
                            }
                        );


                    locationBody
                        .appendChild(
                            tr
                        );
                }
            );


            refreshIcons();
        }


        $$('.js-tanah-location-detail')
            .forEach(
                function (
                    button
                ) {

                    button.addEventListener(
                        'click',
                        function () {

                            openLocationDetail(

                                button.dataset
                                    .locationId,

                                button.dataset
                                    .locationName
                            );
                        }
                    );
                }
            );


        /* =========================================================
           RECORD DETAIL
        ========================================================= */

        const detailModal =
            $('#tanahDetailModal');


        function setDetailText(
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
                    ??
                    '-';
            }
        }


        function fillDetailModal(
            data
        ) {
            setDetailText(
                '#detailTanahLokasi',
                data.lokasi
                || '-'
            );


            setDetailText(
                '#detailTanahAlamat',
                data.alamat
                || '-'
            );


            setDetailText(
                '#detailTanahBarang',
                data.nama_barang
                ||
                data.barang
                ||
                '-'
            );


            setDetailText(
                '#detailTanahTahun',
                data.tahun
                || '-'
            );


            setDetailText(
                '#detailTanahGuna',
                data.guna
                || '-'
            );


            setDetailText(
                '#detailTanahNoTunjuk',
                data.no_tunjuk
                || '-'
            );


            setDetailText(
                '#detailTanahTglTunjuk',
                formatDate(
                    data.tgl_tunjuk
                )
            );


            setDetailText(
                '#detailTanahLuasTunjuk',
                data.luas_tunjuk

                    ? (
                        formatNumber(
                            data.luas_tunjuk
                        )
                        +
                        ' m²'
                    )

                    : '-'
            );


            setDetailText(
                '#detailTanahSertifikat',
                data.sertifikat
                || '-'
            );


            setDetailText(
                '#detailTanahTglSertifikat',
                formatDate(
                    data.tgl_sertifikat
                )
            );


            setDetailText(
                '#detailTanahLuasSertifikat',
                data.luas_sertifikat

                    ? (
                        formatNumber(
                            data.luas_sertifikat
                        )
                        +
                        ' m²'
                    )

                    : '-'
            );


            setDetailText(
                '#detailTanahNoGambar',
                data.no_gambar
                || '-'
            );


            setDetailText(
                '#detailTanahTglGambar',
                formatDate(
                    data.tgl_gambar
                )
            );


            setDetailText(
                '#detailTanahLuasGambar',
                data.luas_gambar

                    ? (
                        formatNumber(
                            data.luas_gambar
                        )
                        +
                        ' m²'
                    )

                    : '-'
            );


            setDetailText(
                '#detailTanahAsal',
                data.asal
                || '-'
            );


            setDetailText(
                '#detailTanahHak',
                data.hak
                || '-'
            );


            setDetailText(
                '#detailTanahPemilik',
                data.pemilik
                || '-'
            );


            setDetailText(
                '#detailTanahKeterangan',
                data.ket
                ||
                data.keterangan
                ||
                '-'
            );
        }


        async function loadRecord(
            id
        ) {
            if (!id) {

                throw new Error(
                    'ID Tanah tidak tersedia.'
                );
            }


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


        async function openRecordView(
            id
        ) {
            try {

                const data =
                    await loadRecord(
                        id
                    );


                fillDetailModal(
                    data
                );


                closeDialog(
                    locationModal
                );


                openDialog(
                    detailModal
                );

            } catch (
                error
            ) {

                console.error(
                    'View Tanah:',
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

        function setValue(
            element,
            value
        ) {
            if (!element) {
                return;
            }


            element.value =
                value
                ??
                '';
        }


        function fillEditForm(
            data
        ) {
            selectedSourceData =
                null;


            form.action =
                RECORD_BASE_URL
                +
                '/'
                +
                encodeURIComponent(
                    data.id
                    ??
                    data.idT
                    ??
                    data.id_tanah
                );


            formMethod.value =
                'PUT';


            formTitle.textContent =
                'Edit Data Tanah';


            setValue(
                nilaiAktivaId,
                data.id_nilai_aktiva
            );


            setValue(
                lokasiId,
                data.id_lokasi
            );


            setValue(
                lokasiName,
                data.lokasi
            );


            setValue(
                alamat,
                data.alamat
            );


            setValue(
                barang,
                data.id_barang
            );


            setValue(
                tahun,
                data.tahun
            );


            setValue(
                guna,
                data.guna
            );


            setValue(
                noTunjuk,
                data.no_tunjuk
            );


            setValue(
                tglTunjuk,
                dateInputValue(
                    data.tgl_tunjuk
                )
            );


            setValue(
                luasTunjuk,
                data.luas_tunjuk
            );


            setValue(
                sertifikat,
                data.sertifikat
            );


            setValue(
                tglSertifikat,
                dateInputValue(
                    data.tgl_sertifikat
                )
            );


            setValue(
                luasSertifikat,
                data.luas_sertifikat
            );


            setValue(
                noGambar,
                data.no_gambar
            );


            setValue(
                tglGambar,
                dateInputValue(
                    data.tgl_gambar
                )
            );


            setValue(
                luasGambar,
                data.luas_gambar
            );


            setValue(
                asal,
                data.asal
            );


            setValue(
                hak,
                data.hak
            );


            setValue(
                pemilik,
                data.pemilik
            );


            setValue(
                keterangan,
                data.ket
                ??
                data.keterangan
            );


            /*
            | Edit tidak perlu memilih ulang
            | sumber Nilai Aset.
            */

            setSourcePanel(
                false
            );


            if (
                selectedSource
            ) {

                selectedSource.hidden =
                    false;
            }


            if (
                selectedTitle
            ) {

                selectedTitle.textContent =
                    data.lokasi
                    ||
                    'Data Tanah';
            }


            if (
                selectedMeta
            ) {

                selectedMeta.textContent =
                    data.id_nilai_aktiva

                        ? (
                            'Sumber Nilai Aset #'
                            +
                            data.id_nilai_aktiva
                        )

                        : 'Data existing tanpa referensi Nilai Aset';
            }
        }


        async function openEditForm(
            id
        ) {
            try {

                const data =
                    await loadRecord(
                        id
                    );


                closeDialog(
                    locationModal
                );


                fillEditForm(
                    data
                );


                openDialog(
                    formModal
                );

            } catch (
                error
            ) {

                console.error(
                    'Edit Tanah:',
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


        const deleteName =
            $('#tanahDeleteName');


        function openDeleteDialog(
            id,
            name
        ) {
            if (
                !id
                ||
                !deleteForm
            ) {

                showToast(
                    'ID data Tanah tidak tersedia.',
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


            if (
                deleteName
            ) {

                deleteName.textContent =
                    name
                    ||
                    'Data Tanah';
            }


            openDialog(
                deleteModal
            );
        }


        /* =========================================================
           OPTIONAL DIRECT ACTIONS
        ========================================================= */

        $$('[data-tanah-record-view]')
            .forEach(
                function (
                    button
                ) {

                    button.addEventListener(
                        'click',
                        function () {

                            openRecordView(
                                button.dataset
                                    .tanahRecordView
                            );
                        }
                    );
                }
            );


        $$('[data-tanah-record-edit]')
            .forEach(
                function (
                    button
                ) {

                    button.addEventListener(
                        'click',
                        function () {

                            openEditForm(
                                button.dataset
                                    .tanahRecordEdit
                            );
                        }
                    );
                }
            );


        /* =========================================================
           GENERIC EVENT FROM GLOBAL KIB NOTIFICATION
        ========================================================= */

        window.addEventListener(
            'kib:source-selected',
            function (
                event
            ) {

                const item =
                    event.detail;


                if (!item) {
                    return;
                }


                /*
                | Pastikan hanya data Tanah.
                | Jika global modal dipakai dari halaman lain,
                | tetap aman.
                */

                resetCreateForm();


                openDialog(
                    formModal
                );


                selectSource(
                    item
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
           INITIAL LOAD
        ========================================================= */

        loadPendingData();

        refreshIcons();
    }
);