(function () {

    'use strict';


    let currentPage = 1;
    let modalMode = 'add';
    let currentRow = null;
    let currentId = null;
    let chart = null;


    const numberFormat =
        new Intl.NumberFormat('id-ID');


    function qs(selector, parent = document) {
        return parent.querySelector(selector);
    }


    function qsa(selector, parent = document) {
        return Array.from(
            parent.querySelectorAll(selector)
        );
    }


    function icons() {

        if (
            window.lucide &&
            typeof window.lucide.createIcons === 'function'
        ) {

            window.lucide.createIcons();
        }
    }


    function csrf() {

        return (
            qs('meta[name="csrf-token"]')
                ?.getAttribute('content')
            ||
            qs('#sdmForm input[name="_token"]')
                ?.value
            ||
            ''
        );
    }


    /* =========================================================
       DATE
    ========================================================= */

    function updateDateTime() {

        const date =
            qs('#sdmCurrentDate');

        const time =
            qs('#sdmCurrentTime');


        if (!date || !time) {
            return;
        }


        const now =
            new Date();


        date.textContent =
            new Intl.DateTimeFormat(
                'id-ID',
                {
                    timeZone: 'Asia/Makassar',
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }
            ).format(now);


        time.textContent =
            new Intl.DateTimeFormat(
                'id-ID',
                {
                    timeZone: 'Asia/Makassar',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hourCycle: 'h23'
                }
            )
                .format(now)
                .replace(/\./g, ':')
            +
            ' WITA';
    }


    /* =========================================================
       DATA
    ========================================================= */

    function rows() {

        return qsa(
            '#sdmTable tbody tr[data-record]'
        );
    }


    function filteredRows() {

        const keyword =
            String(
                qs('#sdmSearch')?.value || ''
            )
                .trim()
                .toLocaleLowerCase('id-ID');


        const dep =
            String(
                qs('#sdmDepartemen')?.value || ''
            );


        const div =
            String(
                qs('#sdmDivisi')?.value || ''
            );


        return rows().filter(function (row) {

            const haystack =
                [
                    row.dataset.nama,
                    row.dataset.nip,
                    row.dataset.jabatan,
                    row.dataset.departemen,
                    row.dataset.divisi
                ]
                    .join(' ')
                    .toLocaleLowerCase('id-ID');


            return (
                (
                    !keyword ||
                    haystack.includes(keyword)
                )
                &&
                (
                    !dep ||
                    row.dataset.idDep === dep
                )
                &&
                (
                    !div ||
                    row.dataset.idDiv === div
                )
            );
        });
    }


    /* =========================================================
       TABLE
    ========================================================= */

    function renderTable() {

        const all =
            rows();


        const filtered =
            filteredRows();


        const size =
            Number(
                qs('#sdmPageSize')?.value
            ) || 10;


        const pages =
            Math.max(
                1,
                Math.ceil(
                    filtered.length / size
                )
            );


        currentPage =
            Math.min(
                Math.max(currentPage, 1),
                pages
            );


        const start =
            (currentPage - 1) * size;


        all.forEach(function (row) {
            row.hidden = true;
        });


        filtered
            .slice(
                start,
                start + size
            )
            .forEach(
                function (row, index) {

                    row.hidden =
                        false;


                    const number =
                        row.querySelector(
                            '.sdm-number'
                        );


                    if (number) {

                        number.textContent =
                            start +
                            index +
                            1;
                    }
                }
            );


        const empty =
            qs('#sdmEmptyRow');


        if (empty) {

            empty.hidden =
                filtered.length !== 0;
        }


        const info =
            qs('#sdmTableInfo');


        if (info) {

            if (!filtered.length) {

                info.textContent =
                    'Menampilkan 0 dari 0 data';

            } else {

                info.textContent =
                    `Menampilkan ${start + 1}–${Math.min(start + size, filtered.length)} dari ${filtered.length} data`;
            }
        }


        renderPagination(pages);
    }


    function renderPagination(pages) {

        const element =
            qs('#sdmPagination');


        if (!element) {
            return;
        }


        element.innerHTML = '';


        function add(
            text,
            page,
            disabled = false,
            active = false
        ) {

            const button =
                document.createElement('button');


            button.type =
                'button';


            button.textContent =
                text;


            button.disabled =
                disabled;


            if (active) {

                button.classList.add(
                    'active'
                );
            }


            button.addEventListener(
                'click',
                function () {

                    if (disabled) {
                        return;
                    }


                    currentPage =
                        page;


                    renderTable();
                }
            );


            element.appendChild(
                button
            );
        }


        add(
            '‹',
            currentPage - 1,
            currentPage <= 1
        );


        let first =
            Math.max(
                1,
                currentPage - 2
            );


        let last =
            Math.min(
                pages,
                first + 4
            );


        first =
            Math.max(
                1,
                last - 4
            );


        for (
            let page = first;
            page <= last;
            page++
        ) {

            add(
                String(page),
                page,
                false,
                page === currentPage
            );
        }


        add(
            '›',
            currentPage + 1,
            currentPage >= pages
        );
    }


    /* =========================================================
       DEPARTEMEN → DIVISI
    ========================================================= */

    function filterDivisiOptions(
        depSelectId,
        divSelectId
    ) {

        const dep =
            qs(`#${depSelectId}`);


        const div =
            qs(`#${divSelectId}`);


        if (!dep || !div) {
            return;
        }


        const depId =
            String(dep.value || '');


        qsa(
            'option[data-id-dep]',
            div
        )
            .forEach(function (option) {

                option.hidden =
                    !!depId &&
                    option.dataset.idDep !== depId;
            });


        const selected =
            div.selectedOptions[0];


        if (
            selected &&
            selected.hidden
        ) {

            div.value =
                '';
        }
    }


    /* =========================================================
       MODAL
    ========================================================= */

    function openModal(
        mode = 'add',
        row = null
    ) {

        const modal =
            qs('#sdmModal');


        if (!modal) {
            return;
        }


        modalMode =
            mode;


        currentRow =
            row;


        currentId =
            row?.dataset.id || null;


        qs('#sdmForm')?.reset();


        hideError();


        const name =
            qs('#sdmName');

        const nip =
            qs('#sdmNip');

        const jabatan =
            qs('#sdmJabatan');

        const dep =
            qs('#sdmFormDepartemen');

        const div =
            qs('#sdmFormDivisi');


        if (row) {

            name.value =
                row.dataset.nama || '';

            nip.value =
                row.dataset.nip === '-'
                    ? ''
                    : (
                        row.dataset.nip || ''
                    );

            jabatan.value =
                row.dataset.idJabat || '';

            dep.value =
                row.dataset.idDep || '';


            filterDivisiOptions(
                'sdmFormDepartemen',
                'sdmFormDivisi'
            );


            div.value =
                row.dataset.idDiv || '';
        }


        const readonly =
            mode === 'view' ||
            mode === 'delete';


        name.readOnly =
            readonly;

        nip.readOnly =
            readonly;

        jabatan.disabled =
            readonly;

        dep.disabled =
            readonly;

        div.disabled =
            readonly;


        const title =
            qs('#sdmModalTitle');

        const desc =
            qs('#sdmModalDescription');

        const save =
            qs('#sdmSaveButton');

        const saveText =
            qs('#sdmSaveText');


        save.hidden =
            mode === 'view';


        save.classList.toggle(
            'sdm-delete-button',
            mode === 'delete'
        );


        if (mode === 'add') {

            title.textContent =
                'Tambah SDM Pendukung';

            desc.textContent =
                'Tambahkan data SDM Pendukung baru.';

            saveText.textContent =
                'Simpan SDM';
        }


        if (mode === 'view') {

            title.textContent =
                'Detail SDM Pendukung';

            desc.textContent =
                'Informasi lengkap SDM Pendukung.';
        }


        if (mode === 'edit') {

            title.textContent =
                'Edit SDM Pendukung';

            desc.textContent =
                'Perbarui data SDM Pendukung.';

            saveText.textContent =
                'Simpan Perubahan';
        }


        if (mode === 'delete') {

            title.textContent =
                'Hapus SDM Pendukung';

            desc.textContent =
                'Periksa data sebelum dihapus.';

            saveText.textContent =
                'Hapus SDM';
        }


        if (!modal.open) {
            modal.showModal();
        }


        icons();
    }


    function closeModal() {

        const modal =
            qs('#sdmModal');


        if (modal?.open) {

            modal.close();
        }


        currentId =
            null;

        currentRow =
            null;

        modalMode =
            'add';
    }


    /* =========================================================
       REQUEST
    ========================================================= */

    async function request(
        url,
        method,
        payload = null
    ) {

        const options = {

            method,

            credentials:
                'same-origin',

            headers: {

                'Accept':
                    'application/json',

                'Content-Type':
                    'application/json',

                'X-Requested-With':
                    'XMLHttpRequest',

                'X-CSRF-TOKEN':
                    csrf()

            }

        };


        if (payload !== null) {

            options.body =
                JSON.stringify(payload);
        }


        const response =
            await fetch(
                url,
                options
            );


        const data =
            await response
                .json()
                .catch(function () {

                    return {};
                });


        if (!response.ok) {

            let message =
                data.message ||
                `Request gagal (${response.status}).`;


            if (
                response.status === 422 &&
                data.errors
            ) {

                const first =
                    Object.values(
                        data.errors
                    )
                        .flat()[0];


                if (first) {

                    message =
                        first;
                }
            }


            throw new Error(
                message
            );
        }


        return data;
    }


    /* =========================================================
       SUBMIT
    ========================================================= */

    async function submit(
        event
    ) {

        event.preventDefault();


        hideError();


        if (modalMode === 'view') {

            closeModal();

            return;
        }


        if (modalMode === 'delete') {

            await remove();

            return;
        }


        const payload = {

            nama_sdm:
                String(
                    qs('#sdmName')?.value || ''
                ).trim(),

            nip:
                String(
                    qs('#sdmNip')?.value || ''
                ).trim(),

            id_jabat:
                Number(
                    qs('#sdmJabatan')?.value || 0
                ),

            id_div:
                Number(
                    qs('#sdmFormDivisi')?.value || 0
                )

        };


        if (!payload.nama_sdm) {

            showError(
                'Nama SDM wajib diisi.'
            );

            return;
        }


        if (!payload.nip) {

            showError(
                'NIP/NIPP wajib diisi.'
            );

            return;
        }


        if (!payload.id_jabat) {

            showError(
                'Jabatan wajib dipilih.'
            );

            return;
        }


        if (!payload.id_div) {

            showError(
                'Divisi wajib dipilih.'
            );

            return;
        }


        let url =
            window.SDM_CRUD.store;


        let method =
            'POST';


        if (modalMode === 'edit') {

            url =
                window.SDM_CRUD.update
                    .replace(
                        '__ID__',
                        encodeURIComponent(
                            currentId
                        )
                    );


            method =
                'PUT';
        }


        const button =
            qs('#sdmSaveButton');


        button.disabled =
            true;


        try {

            const result =
                await request(
                    url,
                    method,
                    payload
                );


            toast(
                result.message ||
                'Data berhasil disimpan.',
                'success'
            );


            closeModal();


            setTimeout(
                function () {

                    window.location.reload();
                },
                400
            );


        } catch (error) {

            showError(
                error.message
            );


        } finally {

            button.disabled =
                false;
        }
    }


    async function remove() {

        if (!currentId) {
            return;
        }


        const confirmed =
            window.confirm(
                `Hapus SDM "${currentRow?.dataset.nama || ''}"?`
            );


        if (!confirmed) {
            return;
        }


        const url =
            window.SDM_CRUD.destroy
                .replace(
                    '__ID__',
                    encodeURIComponent(
                        currentId
                    )
                );


        try {

            const result =
                await request(
                    url,
                    'DELETE'
                );


            toast(
                result.message,
                'success'
            );


            closeModal();


            setTimeout(
                function () {

                    window.location.reload();
                },
                400
            );


        } catch (error) {

            showError(
                error.message
            );
        }
    }


    /* =========================================================
       HISTORY
    ========================================================= */

    function openHistory() {

        const modal =
            qs('#sdmActivityModal');


        if (modal && !modal.open) {

            modal.showModal();
        }
    }


    function closeHistory() {

        const modal =
            qs('#sdmActivityModal');


        if (modal?.open) {

            modal.close();
        }
    }


    function historyFilter(
        type
    ) {

        let number =
            0;


        qsa(
            '[data-sdm-history-row]'
        )
            .forEach(function (row) {

                const show =
                    type === 'all' ||
                    row.dataset.action === type;


                row.hidden =
                    !show;


                if (show) {

                    number++;


                    const no =
                        row.querySelector(
                            '.sdm-history-number'
                        );


                    if (no) {

                        no.textContent =
                            number;
                    }
                }
            });


        qsa(
            '[data-sdm-history-filter]'
        )
            .forEach(function (button) {

                button.classList.toggle(
                    'active',
                    button.dataset.sdmHistoryFilter === type
                );
            });
    }


    /* =========================================================
       CHART
    ========================================================= */

    function initChart() {

        const canvas =
            qs('#sdmDistributionChart');


        if (
            !canvas ||
            typeof window.Chart !== 'function'
        ) {

            return;
        }


        const groups =
            qsa(
                '#sdmLegend [data-count]'
            );


        if (!groups.length) {
            return;
        }


        chart =
            new Chart(
                canvas,
                {

                    type:
                        'doughnut',

                    data: {

                        labels:
                            groups.map(
                                item =>
                                    item.dataset.label
                            ),

                        datasets: [

                            {

                                data:
                                    groups.map(
                                        item =>
                                            Number(
                                                item.dataset.count
                                            )
                                    ),

                                backgroundColor:
                                    groups.map(
                                        item =>
                                            item.dataset.color
                                    ),

                                borderWidth:
                                    2,

                                borderColor:
                                    '#ffffff'

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '68%',

                        plugins: {

                            legend: {
                                display: false
                            }

                        }

                    }

                }
            );
    }


    /* =========================================================
       EXPORT
    ========================================================= */

    function exportCsv() {

        const data =
            filteredRows();


        if (!data.length) {
            return;
        }


        const lines = [

            [
                'No',
                'Nama',
                'NIP',
                'Jabatan',
                'Departemen',
                'Divisi',
                'Created At'
            ]

        ];


        data.forEach(
            function (row, index) {

                lines.push(
                    [

                        index + 1,
                        row.dataset.nama || '',
                        row.dataset.nip || '',
                        row.dataset.jabatan || '',
                        row.dataset.departemen || '',
                        row.dataset.divisi || '',
                        row.dataset.createdAt || ''

                    ]
                );
            }
        );


        const csv =
            lines
                .map(function (line) {

                    return line
                        .map(function (value) {

                            let text =
                                String(value ?? '');


                            if (
                                /^[\s]*[=+@-]/
                                    .test(text)
                            ) {

                                text =
                                    "'" + text;
                            }


                            return (
                                '"' +
                                text.replace(
                                    /"/g,
                                    '""'
                                )
                                +
                                '"'
                            );
                        })
                        .join(',');
                })
                .join('\r\n');


        const blob =
            new Blob(
                [
                    '\uFEFF' +
                    csv
                ],
                {
                    type:
                        'text/csv;charset=utf-8;'
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement('a');


        link.href =
            url;


        link.download =
            'data-sdm-pendukung.csv';


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );
    }


    /* =========================================================
       MESSAGES
    ========================================================= */

    function showError(
        message
    ) {

        const box =
            qs('#sdmFormAlert');


        if (!box) {
            return;
        }


        box.textContent =
            message;


        box.hidden =
            false;
    }


    function hideError() {

        const box =
            qs('#sdmFormAlert');


        if (!box) {
            return;
        }


        box.hidden =
            true;


        box.textContent =
            '';
    }


    function toast(
        message,
        type = 'success'
    ) {

        const container =
            qs('#sdmToastContainer');


        if (!container) {
            return;
        }


        const box =
            document.createElement(
                'div'
            );


        box.className =
            `sdm-toast ${type}`;


        box.textContent =
            message;


        container.appendChild(
            box
        );


        requestAnimationFrame(
            function () {

                box.classList.add(
                    'show'
                );
            }
        );


        setTimeout(
            function () {

                box.remove();
            },
            3000
        );
    }


    /* =========================================================
       INIT
    ========================================================= */

    function init() {

        updateDateTime();


        setInterval(
            updateDateTime,
            1000
        );


        qs('#sdmSearch')
            ?.addEventListener(
                'input',
                function () {

                    currentPage =
                        1;

                    renderTable();
                }
            );


        qs('#sdmDepartemen')
            ?.addEventListener(
                'change',
                function () {

                    filterDivisiOptions(
                        'sdmDepartemen',
                        'sdmDivisi'
                    );


                    currentPage =
                        1;


                    renderTable();
                }
            );


        qs('#sdmDivisi')
            ?.addEventListener(
                'change',
                function () {

                    currentPage =
                        1;

                    renderTable();
                }
            );


        qs('#sdmFormDepartemen')
            ?.addEventListener(
                'change',
                function () {

                    filterDivisiOptions(
                        'sdmFormDepartemen',
                        'sdmFormDivisi'
                    );
                }
            );


        qs('#sdmPageSize')
            ?.addEventListener(
                'change',
                function () {

                    currentPage =
                        1;

                    renderTable();
                }
            );


        qs('#sdmForm')
            ?.addEventListener(
                'submit',
                submit
            );


        qs('#sdmTable')
            ?.addEventListener(
                'click',
                function (event) {

                    const button =
                        event.target.closest(
                            'button[data-action]'
                        );


                    if (!button) {
                        return;
                    }


                    const row =
                        button.closest(
                            'tr[data-record]'
                        );


                    openModal(
                        button.dataset.action,
                        row
                    );
                }
            );


        qs('#sdmTotalActivityCard')
            ?.addEventListener(
                'click',
                openHistory
            );


        qsa(
            '[data-sdm-history-filter]'
        )
            .forEach(function (button) {

                button.addEventListener(
                    'click',
                    function () {

                        historyFilter(
                            button.dataset.sdmHistoryFilter
                        );
                    }
                );
            });


        renderTable();

        initChart();

        icons();
    }


    window.openSdmModal =
        () =>
            openModal('add');


    window.closeSdmModal =
        closeModal;


    window.closeSdmActivityModal =
        closeHistory;


    window.resetSdmFilter =
        function () {

            qs('#sdmSearch').value =
                '';

            qs('#sdmDepartemen').value =
                '';

            qs('#sdmDivisi').value =
                '';


            qsa(
                '#sdmDivisi option'
            )
                .forEach(function (option) {

                    option.hidden =
                        false;
                });


            currentPage =
                1;


            renderTable();
        };


    window.exportSdmCSV =
        exportCsv;


    window.scrollToSdmTable =
        function () {

            qs('.sdm-table-card')
                ?.scrollIntoView(
                    {
                        behavior:
                            'smooth'
                    }
                );
        };


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();
    }

})();