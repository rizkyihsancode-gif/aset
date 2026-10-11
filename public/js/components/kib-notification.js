document.addEventListener(
    'DOMContentLoaded',
    function () {

        'use strict';


        const modal =
            document.getElementById(
                'kibPendingModal'
            );


        if (!modal) {
            return;
        }


        const baseUrl =
            modal.dataset
                .pendingBaseUrl;


        const title =
            document.getElementById(
                'kibPendingTitle'
            );


        const description =
            document.getElementById(
                'kibPendingDescription'
            );


        const totalEl =
            document.getElementById(
                'kibPendingTotal'
            );


        const newEl =
            document.getElementById(
                'kibPendingNew'
            );


        const valueEl =
            document.getElementById(
                'kibPendingValue'
            );


        const tbody =
            document.getElementById(
                'kibPendingBody'
            );


        const info =
            document.getElementById(
                'kibPendingInfo'
            );


        const search =
            document.getElementById(
                'kibPendingSearch'
            );


        const closeTop =
            document.getElementById(
                'kibPendingClose'
            );


        const closeBottom =
            document.getElementById(
                'kibPendingCloseBottom'
            );


        let currentRows = [];

        let currentModule = null;


        /*
        |--------------------------------------------------------------------------
        | ICON
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | OPEN / CLOSE
        |--------------------------------------------------------------------------
        */

        function openModal()
        {
            if (
                typeof modal.showModal
                !== 'function'
            ) {

                return;
            }


            if (!modal.open) {

                modal.showModal();
            }
        }


        function closeModal()
        {
            if (
                modal.open
                &&
                typeof modal.close
                    === 'function'
            ) {

                modal.close();
            }
        }


        /*
        |--------------------------------------------------------------------------
        | LOADING
        |--------------------------------------------------------------------------
        */

        function showLoading()
        {
            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="11"
                        class="kib-pending-empty"
                    >

                        <div class="kib-pending-loading">

                            <span class="kib-pending-spinner"></span>

                            Memuat transaksi Nilai Aset...

                        </div>

                    </td>

                </tr>
            `;
        }


        /*
        |--------------------------------------------------------------------------
        | ERROR
        |--------------------------------------------------------------------------
        */

        function showError(
            message
        ) {
            tbody.innerHTML = '';


            const tr =
                document.createElement(
                    'tr'
                );


            const td =
                document.createElement(
                    'td'
                );


            td.colSpan =
                11;


            td.className =
                'kib-pending-empty is-error';


            td.textContent =
                message;


            tr.appendChild(
                td
            );


            tbody.appendChild(
                tr
            );


            info.textContent =
                '0 data';
        }


        /*
        |--------------------------------------------------------------------------
        | DATE
        |--------------------------------------------------------------------------
        */

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


            const pieces =
                raw.split('-');


            if (
                pieces.length
                !== 3
            ) {

                return raw;
            }


            return (
                pieces[2]
                +
                '/'
                +
                pieces[1]
                +
                '/'
                +
                pieces[0]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE NORMAL CELL
        |--------------------------------------------------------------------------
        */

        function createCell(
            value,
            className = ''
        ) {
            const td =
                document.createElement(
                    'td'
                );


            td.textContent =
                value ?? '-';


            if (className) {

                td.className =
                    className;
            }


            return td;
        }


        /*
        |--------------------------------------------------------------------------
        | RENDER ROW
        |--------------------------------------------------------------------------
        */

        function renderRows(
            rows
        ) {
            tbody.innerHTML =
                '';


            if (!rows.length) {

                const tr =
                    document
                        .createElement(
                            'tr'
                        );


                const td =
                    document
                        .createElement(
                            'td'
                        );


                td.colSpan =
                    11;


                td.className =
                    'kib-pending-empty';


                td.textContent =
                    'Tidak ada data yang sesuai.';


                tr.appendChild(
                    td
                );


                tbody.appendChild(
                    tr
                );


                info.textContent =
                    '0 data';


                refreshIcons();

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


                    /*
                    | NO
                    */

                    tr.appendChild(
                        createCell(
                            index + 1,
                            'kib-pending-number'
                        )
                    );


                    /*
                    | VOUCHER
                    */

                    const voucherTd =
                        document
                            .createElement(
                                'td'
                            );


                    const voucherStrong =
                        document
                            .createElement(
                                'strong'
                            );


                    voucherStrong
                        .textContent =
                        item.no_voucher
                        || '-';


                    const voucherSmall =
                        document
                            .createElement(
                                'small'
                            );


                    voucherSmall
                        .textContent =
                        formatDate(
                            item.tgl_voucher
                        );


                    voucherTd.append(
                        voucherStrong,
                        voucherSmall
                    );


                    tr.appendChild(
                        voucherTd
                    );


                    /*
                    | LOKASI
                    */

                    const locationTd =
                        document
                            .createElement(
                                'td'
                            );


                    const locationStrong =
                        document
                            .createElement(
                                'strong'
                            );


                    locationStrong
                        .textContent =
                        item.lokasi
                        || '-';


                    const addressSmall =
                        document
                            .createElement(
                                'small'
                            );


                    addressSmall
                        .textContent =
                        item.alamat
                        || '-';


                    locationTd.append(
                        locationStrong,
                        addressSmall
                    );


                    tr.appendChild(
                        locationTd
                    );


                    /*
                    | DEPARTEMEN
                    */

                    tr.appendChild(
                        createCell(
                            item.departemen
                        )
                    );


                    /*
                    | DIVISI
                    */

                    tr.appendChild(
                        createCell(
                            item.divisi
                        )
                    );


                    /*
                    | AKTIVA
                    */

                    const aktivaTd =
                        document
                            .createElement(
                                'td'
                            );


                    const aktivaStrong =
                        document
                            .createElement(
                                'strong'
                            );


                    aktivaStrong.textContent =
                        item.aktiva_nama
                        || '-';


                    const aktivaSmall =
                        document
                            .createElement(
                                'small'
                            );


                    aktivaSmall.textContent =
                        item.aktiva_kode
                        || '-';


                    aktivaTd.append(
                        aktivaStrong,
                        aktivaSmall
                    );


                    tr.appendChild(
                        aktivaTd
                    );


                    /*
                    | JENIS
                    */

                    const jenisTd =
                        document
                            .createElement(
                                'td'
                            );


                    const jenisBadge =
                        document
                            .createElement(
                                'span'
                            );


                    jenisBadge.className =
                        (
                            Number(
                                item.jenisn
                            ) === 1
                        )

                            ? 'kib-pending-type is-new'

                            : 'kib-pending-type is-value';


                    jenisBadge.textContent =
                        item.jenis_label
                        || '-';


                    jenisTd.appendChild(
                        jenisBadge
                    );


                    tr.appendChild(
                        jenisTd
                    );


                    /*
                    | TAHUN
                    */

                    tr.appendChild(
                        createCell(
                            item.tahun
                        )
                    );


                    /*
                    | NILAI
                    */

                    tr.appendChild(
                        createCell(
                            item.nilai_label,
                            'kib-pending-money'
                        )
                    );


                    /*
                    | URAIAN
                    */

                    tr.appendChild(
                        createCell(
                            item.urai,
                            'kib-pending-description'
                        )
                    );


                    /*
                    | BUTTON PILIH
                    */

                    const actionTd =
                        document
                            .createElement(
                                'td'
                            );


                    actionTd.className =
                        'kib-pending-action';


                    const button =
                        document
                            .createElement(
                                'button'
                            );


                    button.type =
                        'button';


                    button.className =
                        'kib-pending-select';


                    button.innerHTML = `
                        <span>
                            Pilih
                        </span>
                    `;


                    button.addEventListener(
                        'click',
                        function () {

                            /*
                            |--------------------------------------------------------------------------
                            | SIMPAN SOURCE SEMENTARA
                            |--------------------------------------------------------------------------
                            |
                            | Belum mengubah nilai_aktivas.stat.
                            |
                            | stat = 1 hanya setelah CRUD K.I.B berhasil SIMPAN.
                            |
                            */

                            window.KIB_SELECTED_SOURCE =
                                item;


                            /*
                            |--------------------------------------------------------------------------
                            | EVENT GLOBAL
                            |--------------------------------------------------------------------------
                            |
                            | Tanah, Mesin, Gedung dll nanti bisa mendengarkan
                            | event ini dan mengisi form masing-masing.
                            |
                            */

                            window.dispatchEvent(
                                new CustomEvent(
                                    'kib:source-selected',
                                    {
                                        detail:
                                            item,
                                    }
                                )
                            );


                            closeModal();
                        }
                    );


                    actionTd.appendChild(
                        button
                    );


                    tr.appendChild(
                        actionTd
                    );


                    tbody.appendChild(
                        tr
                    );
                }
            );


            info.textContent =
                'Menampilkan '
                +
                rows.length
                    .toLocaleString(
                        'id-ID'
                    )
                +
                ' data';


            refreshIcons();
        }


        /*
        |--------------------------------------------------------------------------
        | FILTER CLIENT SIDE
        |--------------------------------------------------------------------------
        */

        function filterRows()
        {
            const keyword =
                (
                    search.value
                    || ''
                )
                    .trim()
                    .toLowerCase();


            if (!keyword) {

                renderRows(
                    currentRows
                );

                return;
            }


            const filtered =
                currentRows.filter(
                    function (item) {

                        const haystack = [

                            item.no_voucher,

                            item.lokasi,

                            item.alamat,

                            item.departemen,

                            item.divisi,

                            item.aktiva_kode,

                            item.aktiva_nama,

                            item.jenis_label,

                            item.tahun,

                            item.nilai_label,

                            item.urai,

                            item.golongan,

                        ]
                            .join(' ')
                            .toLowerCase();


                        return haystack
                            .includes(
                                keyword
                            );
                    }
                );


            renderRows(
                filtered
            );
        }


        /*
        |--------------------------------------------------------------------------
        | LOAD MODULE
        |--------------------------------------------------------------------------
        */

        async function loadModule(
            module
        ) {
            currentModule =
                module;


            search.value =
                '';


            totalEl.textContent =
                '...';


            newEl.textContent =
                '...';


            valueEl.textContent =
                '...';


            showLoading();

            openModal();


            try {

                const response =
                    await fetch(
                        baseUrl
                        +
                        '/'
                        +
                        encodeURIComponent(
                            module
                        ),
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


                const payload =
                    await response
                        .json();


                currentRows =
                    Array.isArray(
                        payload.data
                    )

                        ? payload.data

                        : [];


                title.textContent =
                    'Data Masuk '
                    +
                    (
                        payload.label
                        || 'K.I.B'
                    );


                description.textContent =
                    'Transaksi Nilai Aset yang belum diproses ke K.I.B '
                    +
                    (
                        payload.label
                        || ''
                    )
                    +
                    '.';


                totalEl.textContent =
                    Number(
                        payload.count
                        || 0
                    )
                        .toLocaleString(
                            'id-ID'
                        );


                newEl.textContent =
                    Number(
                        payload.aset_baru
                        || 0
                    )
                        .toLocaleString(
                            'id-ID'
                        );


                valueEl.textContent =
                    Number(
                        payload.penambahan_nilai
                        || 0
                    )
                        .toLocaleString(
                            'id-ID'
                        );


                renderRows(
                    currentRows
                );


            } catch (error) {

                console.error(
                    'Gagal memuat K.I.B pending:',
                    error
                );


                totalEl.textContent =
                    '0';


                newEl.textContent =
                    '0';


                valueEl.textContent =
                    '0';


                showError(
                    'Data Nilai Aset gagal dimuat. Periksa route, database, atau log Laravel.'
                );
            }
        }


        /*
        |--------------------------------------------------------------------------
        | BUTTON CARD
        |--------------------------------------------------------------------------
        */

        document
            .querySelectorAll(
                '[data-kib-open-pending]'
            )
            .forEach(
                function (button) {

                    button
                        .addEventListener(
                            'click',
                            function () {

                                const module =
                                    button.dataset
                                        .kibOpenPending;


                                if (!module) {
                                    return;
                                }


                                loadModule(
                                    module
                                );
                            }
                        );
                }
            );


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        search.addEventListener(
            'input',
            filterRows
        );


        /*
        |--------------------------------------------------------------------------
        | CLOSE
        |--------------------------------------------------------------------------
        */

        closeTop.addEventListener(
            'click',
            closeModal
        );


        closeBottom.addEventListener(
            'click',
            closeModal
        );


        modal.addEventListener(
            'click',
            function (event) {

                if (
                    event.target
                    === modal
                ) {

                    closeModal();
                }
            }
        );


        /*
        |--------------------------------------------------------------------------
        | ESC
        |--------------------------------------------------------------------------
        */

        document.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key === 'Escape'
                    &&
                    modal.open
                ) {

                    closeModal();
                }
            }
        );


        refreshIcons();
    }
);