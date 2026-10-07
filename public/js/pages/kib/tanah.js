/* =========================================================
   KIB TANAH
   GROUP BY LOKASI
   IMAGE SOURCE = LOKASIS.IMG
========================================================= */

let tanahCurrentPage = 1;

let tanahPreviousOverflow = '';

let tanahDetailItems = [];

let tanahDetailAbortController = null;

let tanahNilaiAbortController = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        if (
            !document.querySelector(
                '.tanah-page'
            )
        ) {
            return;
        }


        updateTanahDate();


        window.setInterval(
            updateTanahDate,
            1000
        );


        bindTanahEvents();


        renderTanahTable();


        refreshTanahIcons();
    }
);


/* =========================================================
   EVENT
========================================================= */

function bindTanahEvents() {

    document
        .getElementById(
            'tanahSearch'
        )
        ?.addEventListener(
            'input',
            tanahFilterChanged
        );


    document
        .getElementById(
            'tanahJumlahFilter'
        )
        ?.addEventListener(
            'change',
            tanahFilterChanged
        );


    document
        .getElementById(
            'tanahPageSize'
        )
        ?.addEventListener(
            'change',
            tanahFilterChanged
        );


    document
        .getElementById(
            'tanahResetButton'
        )
        ?.addEventListener(
            'click',
            resetTanahFilter
        );


    document
        .getElementById(
            'tanahExportButton'
        )
        ?.addEventListener(
            'click',
            exportTanahCsv
        );


    document
        .getElementById(
            'tanahTable'
        )
        ?.addEventListener(
            'click',
            handleTanahTableClick
        );


    /*
    |--------------------------------------------------------------------------
    | MODAL DETAIL
    |--------------------------------------------------------------------------
    */

    document
        .getElementById(
            'tanahViewClose'
        )
        ?.addEventListener(
            'click',
            closeTanahView
        );


    document
        .getElementById(
            'tanahViewCloseBottom'
        )
        ?.addEventListener(
            'click',
            closeTanahView
        );


    const detailModal =
        document.getElementById(
            'tanahViewModal'
        );


    detailModal
        ?.addEventListener(
            'click',
            function (event) {

                if (
                    event.target
                    ===
                    detailModal
                ) {

                    closeTanahView();
                }
            }
        );


    detailModal
        ?.addEventListener(
            'close',
            function () {

                if (
                    tanahDetailAbortController
                ) {

                    tanahDetailAbortController
                        .abort();


                    tanahDetailAbortController =
                        null;
                }


                restoreTanahBodyOverflow();
            }
        );


    /*
    |--------------------------------------------------------------------------
    | PILIH TANAH / SERTIFIKAT
    |--------------------------------------------------------------------------
    */

    document
        .getElementById(
            'tanahDetailItemsBody'
        )
        ?.addEventListener(
            'click',
            function (event) {

                const row =
                    event.target.closest(
                        'tr[data-detail-index]'
                    );


                if (!row) {
                    return;
                }


                selectTanahDetailItem(
                    Number(
                        row.dataset.detailIndex
                    )
                );
            }
        );


    /*
    |--------------------------------------------------------------------------
    | NILAI
    |--------------------------------------------------------------------------
    */

    document
        .getElementById(
            'tanahNilaiClose'
        )
        ?.addEventListener(
            'click',
            closeTanahNilaiModal
        );


    document
        .getElementById(
            'tanahNilaiCloseBottom'
        )
        ?.addEventListener(
            'click',
            closeTanahNilaiModal
        );


    const nilaiModal =
        document.getElementById(
            'tanahNilaiModal'
        );


    nilaiModal
        ?.addEventListener(
            'click',
            function (event) {

                if (
                    event.target
                    ===
                    nilaiModal
                ) {

                    closeTanahNilaiModal();
                }
            }
        );


    nilaiModal
        ?.addEventListener(
            'close',
            function () {

                if (
                    tanahNilaiAbortController
                ) {

                    tanahNilaiAbortController
                        .abort();


                    tanahNilaiAbortController =
                        null;
                }


                restoreTanahBodyOverflow();
            }
        );
}


/* =========================================================
   WITA
========================================================= */

function updateTanahDate() {

    const date =
        document.getElementById(
            'tanahCurrentDate'
        );


    const time =
        document.getElementById(
            'tanahCurrentTime'
        );


    if (
        !date
        ||
        !time
    ) {
        return;
    }


    const now =
        new Date();


    date.textContent =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone:
                    'Asia/Makassar',

                weekday:
                    'long',

                day:
                    'numeric',

                month:
                    'long',

                year:
                    'numeric'
            }
        )
        .format(now);


    time.textContent =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone:
                    'Asia/Makassar',

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                second:
                    '2-digit',

                hourCycle:
                    'h23'
            }
        )
        .format(now)
        .replace(
            /\./g,
            ':'
        )
        +
        ' WITA';
}


/* =========================================================
   ROWS
========================================================= */

function getTanahRows() {

    return Array.from(
        document.querySelectorAll(
            '#tanahTable tbody tr[data-record]'
        )
    );
}


function normalizeTanahText(
    value
) {

    return String(
        value ?? ''
    )
    .trim()
    .toLocaleLowerCase(
        'id-ID'
    );
}


/* =========================================================
   FILTER
========================================================= */

function getFilteredTanahRows() {

    const search =
        normalizeTanahText(
            document
                .getElementById(
                    'tanahSearch'
                )
                ?.value
        );


    const jumlahFilter =
        document
            .getElementById(
                'tanahJumlahFilter'
            )
            ?.value
        ??
        '';


    return getTanahRows()
        .filter(
            function (row) {

                const searchable =
                    normalizeTanahText(
                        [
                            row.dataset.lokasi,
                            row.dataset.alamat,
                            row.dataset.guna,
                            row.dataset.tahun
                        ]
                        .join(' ')
                    );


                const searchMatch =
                    !search
                    ||
                    searchable.includes(
                        search
                    );


                const jumlah =
                    Number(
                        row.dataset.jumlahData
                    )
                    ||
                    0;


                let jumlahMatch =
                    true;


                if (
                    jumlahFilter
                    ===
                    'single'
                ) {

                    jumlahMatch =
                        jumlah === 1;
                }


                if (
                    jumlahFilter
                    ===
                    'multiple'
                ) {

                    jumlahMatch =
                        jumlah > 1;
                }


                return (
                    searchMatch
                    &&
                    jumlahMatch
                );
            }
        );
}


function tanahFilterChanged() {

    tanahCurrentPage =
        1;


    renderTanahTable();
}


function resetTanahFilter() {

    const search =
        document.getElementById(
            'tanahSearch'
        );


    const jumlah =
        document.getElementById(
            'tanahJumlahFilter'
        );


    const pageSize =
        document.getElementById(
            'tanahPageSize'
        );


    if (search) {
        search.value = '';
    }


    if (jumlah) {
        jumlah.value = '';
    }


    if (pageSize) {
        pageSize.value = '10';
    }


    tanahCurrentPage =
        1;


    renderTanahTable();
}


/* =========================================================
   TABLE
========================================================= */

function renderTanahTable() {

    const rows =
        getTanahRows();


    const filtered =
        getFilteredTanahRows();


    const pageSize =
        Number(
            document
                .getElementById(
                    'tanahPageSize'
                )
                ?.value
        )
        ||
        10;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filtered.length
                /
                pageSize
            )
        );


    tanahCurrentPage =
        Math.min(
            Math.max(
                tanahCurrentPage,
                1
            ),
            totalPages
        );


    const start =
        (
            tanahCurrentPage
            -
            1
        )
        *
        pageSize;


    const visible =
        filtered.slice(
            start,
            start + pageSize
        );


    rows.forEach(
        function (row) {

            row.hidden =
                true;
        }
    );


    visible.forEach(
        function (
            row,
            index
        ) {

            row.hidden =
                false;


            const number =
                row.querySelector(
                    '.tanah-row-number'
                );


            if (number) {

                number.textContent =
                    start
                    +
                    index
                    +
                    1;
            }
        }
    );


    const empty =
        document.getElementById(
            'tanahFilterEmpty'
        );


    if (empty) {

        empty.hidden =
            !(
                rows.length > 0
                &&
                filtered.length === 0
            );
    }


    const from =
        filtered.length
            ?
            start + 1
            :
            0;


    const to =
        Math.min(
            start + pageSize,
            filtered.length
        );


    const info =
        document.getElementById(
            'tanahTableInfo'
        );


    if (info) {

        info.textContent =
            `Menampilkan ${from}–${to} dari ${filtered.length} lokasi`;
    }


    renderTanahPagination(
        totalPages
    );
}


/* =========================================================
   PAGINATION
========================================================= */

function renderTanahPagination(
    totalPages
) {

    const container =
        document.getElementById(
            'tanahPagination'
        );


    if (!container) {
        return;
    }


    container.replaceChildren();


    createTanahPageButton(
        container,
        '‹',
        tanahCurrentPage - 1,
        tanahCurrentPage === 1
    );


    let first =
        Math.max(
            1,
            tanahCurrentPage - 2
        );


    let last =
        Math.min(
            totalPages,
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

        createTanahPageButton(
            container,
            String(page),
            page,
            false,
            page === tanahCurrentPage
        );
    }


    createTanahPageButton(
        container,
        '›',
        tanahCurrentPage + 1,
        tanahCurrentPage === totalPages
    );
}


function createTanahPageButton(
    container,
    label,
    page,
    disabled = false,
    active = false
) {

    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.textContent =
        label;


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

            tanahCurrentPage =
                page;


            renderTanahTable();
        }
    );


    container.appendChild(
        button
    );
}


/* =========================================================
   TABLE ACTION
========================================================= */

function handleTanahTableClick(
    event
) {

    const button =
        event.target.closest(
            '[data-action]'
        );


    if (!button) {
        return;
    }


    const row =
        button.closest(
            'tr[data-record]'
        );


    if (!row) {
        return;
    }


    if (
        button.dataset.action
        ===
        'view'
    ) {

        openTanahView(
            row
        );


        return;
    }


    if (
        button.dataset.action
        ===
        'nilai'
    ) {

        openTanahNilaiModal(
            row
        );
    }
}


/* =========================================================
   OPEN VIEW
========================================================= */

async function openTanahView(
    row
) {

    const modal =
        document.getElementById(
            'tanahViewModal'
        );


    if (!modal) {
        return;
    }


    tanahDetailItems =
        [];


    document
        .getElementById(
            'tanahDetailItemsBody'
        )
        ?.replaceChildren();


    setTanahText(
        'detailTanahHeaderLocation',
        row.dataset.lokasi
    );


    setTanahText(
        'detailLokasiNama',
        row.dataset.lokasi
    );


    setTanahText(
        'detailLokasiAlamat',
        row.dataset.alamat
    );


    setTanahText(
        'detailLokasiJumlah',
        row.dataset.jumlahData
    );


    setTanahText(
        'detailLokasiNilai',
        formatTanahRupiah(
            row.dataset.nilai
        )
    );


    /*
    |--------------------------------------------------------------------------
    | RESET GAMBAR
    |--------------------------------------------------------------------------
    */

    setTanahDetailImage(
        '',
        row.dataset.lokasi
    );


    setElementHidden(
        'tanahDetailContent',
        true
    );


    setElementHidden(
        'tanahDetailError',
        true
    );


    setElementHidden(
        'tanahDetailLoading',
        false
    );


    lockTanahBody();


    if (!modal.open) {

        modal.showModal();
    }


    refreshTanahIcons();


    if (
        tanahDetailAbortController
    ) {

        tanahDetailAbortController
            .abort();
    }


    tanahDetailAbortController =
        new AbortController();


    try {

        const endpoint =
            window.TANAH_ENDPOINTS
                ?.detail;


        if (!endpoint) {

            throw new Error(
                'Endpoint detail Tanah tidak tersedia.'
            );
        }


        const id =
            row.dataset.idLokasi;


        const url =
            String(endpoint)
                .replace(
                    '__ID__',
                    encodeURIComponent(id)
                );


        const response =
            await fetch(
                url,
                {

                    method:
                        'GET',

                    headers: {

                        'Accept':
                            'application/json',

                        'X-Requested-With':
                            'XMLHttpRequest'

                    },

                    signal:
                        tanahDetailAbortController
                            .signal

                }
            );


        const result =
            await readTanahJsonResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                result.message
                ||
                `HTTP ${response.status}`
            );
        }


        renderTanahDetailData(
            result
        );


    } catch (error) {

        if (
            error.name
            ===
            'AbortError'
        ) {
            return;
        }


        console.error(
            'DETAIL TANAH:',
            error
        );


        setElementHidden(
            'tanahDetailContent',
            true
        );


        showTanahError(
            'tanahDetailError',
            'tanahDetailErrorText',
            error.message
            ||
            'Detail tanah gagal dimuat.'
        );


    } finally {

        setElementHidden(
            'tanahDetailLoading',
            true
        );
    }
}


/* =========================================================
   RENDER DETAIL
========================================================= */

function renderTanahDetailData(
    result
) {

    const items =
        Array.isArray(
            result.data
        )
            ?
            result.data
            :
            [];


    tanahDetailItems =
        items;


    /*
    |--------------------------------------------------------------------------
    | INFORMASI LOKASI
    |--------------------------------------------------------------------------
    */

    if (
        result.lokasi
    ) {

        setTanahText(
            'detailLokasiNama',
            result.lokasi.lokasi
        );


        setTanahText(
            'detailLokasiAlamat',
            result.lokasi.alamat
        );


        /*
        |--------------------------------------------------------------------------
        | GAMBAR LOKASIS.IMG
        |--------------------------------------------------------------------------
        |
        | Hanya dijalankan sekali saat modal dibuka.
        |
        */

        setTanahDetailImage(

            result.lokasi.image_url
            ||
            '',

            result.lokasi.lokasi

        );


        /*
        |--------------------------------------------------------------------------
        | DEBUG
        |--------------------------------------------------------------------------
        */

        console.log(
            '[LOKASI IMAGE]',
            {
                lokasi:
                    result.lokasi.lokasi,

                database:
                    result.lokasi.img,

                url:
                    result.lokasi.image_url
            }
        );
    }


    setTanahText(
        'detailLokasiJumlah',
        String(
            result.jumlah
            ??
            items.length
        )
    );


    const tbody =
        document.getElementById(
            'tanahDetailItemsBody'
        );


    if (!tbody) {
        return;
    }


    tbody.replaceChildren();


    if (!items.length) {

        setElementHidden(
            'tanahDetailContent',
            true
        );


        showTanahError(
            'tanahDetailError',
            'tanahDetailErrorText',
            'Tidak ada data Tanah pada lokasi ini.'
        );


        return;
    }


    /*
    |--------------------------------------------------------------------------
    | LIST PEMILIK / TANAH
    |--------------------------------------------------------------------------
    */

    items.forEach(
        function (
            item,
            index
        ) {

            const tr =
                document.createElement(
                    'tr'
                );


            tr.dataset.detailIndex =
                String(index);


            appendTextCell(
                tr,
                index + 1
            );


            appendTextCell(
                tr,
                item.pemilik
                ||
                '—'
            );


            appendTextCell(
                tr,
                formatTanahArea(
                    item.luas_sertifikat
                    ||
                    item.luas_tunjuk
                )
            );


            appendTextCell(
                tr,
                item.guna
                ||
                '—'
            );


            tbody.appendChild(
                tr
            );
        }
    );


    setElementHidden(
        'tanahDetailError',
        true
    );


    setElementHidden(
        'tanahDetailContent',
        false
    );


    /*
    |--------------------------------------------------------------------------
    | PILIH DATA PERTAMA
    |--------------------------------------------------------------------------
    */

    selectTanahDetailItem(
        0
    );
}


/* =========================================================
   SELECT DETAIL TANAH
========================================================= */

function selectTanahDetailItem(
    index
) {

    const item =
        tanahDetailItems[index];


    if (!item) {
        return;
    }


    document
        .querySelectorAll(
            '#tanahDetailItemsBody tr[data-detail-index]'
        )
        .forEach(
            function (row) {

                row.classList.toggle(

                    'active',

                    Number(
                        row.dataset.detailIndex
                    )
                    ===
                    index

                );
            }
        );


    /*
    |--------------------------------------------------------------------------
    | PENTING
    |--------------------------------------------------------------------------
    |
    | JANGAN mengubah gambar di sini.
    |
    | Gambar adalah milik LOKASI:
    |
    | lokasis.img
    |
    */


    setTanahText(
        'detailTanahId',

        item.id
            ?
            `#${item.id}`
            :
            '—'
    );


    setTanahText(
        'detailTanahGunaTitle',
        item.guna
    );


    setTanahText(
        'detailTanahAlamat',

        document
            .getElementById(
                'detailLokasiAlamat'
            )
            ?.textContent
    );


    setTanahText(
        'detailTanahBarang',
        item.nama_barang
    );


    setTanahText(
        'detailTanahKode',
        item.kode_barang
    );


    setTanahText(
        'detailTanahAsal',
        item.asal
    );


    setTanahText(
        'detailTanahTahun',
        item.tahun
    );


    setTanahText(
        'detailTanahGuna',
        item.guna
    );


    /*
    |--------------------------------------------------------------------------
    | PENUNJUKAN
    |--------------------------------------------------------------------------
    */

    setTanahText(
        'detailNoTunjuk',
        item.no_tunjuk
    );


    setTanahText(
        'detailTglTunjuk',

        formatTanahDateOnly(
            item.tgl_tunjuk
        )
    );


    setTanahText(
        'detailLuasTunjuk',

        formatTanahArea(
            item.luas_tunjuk
        )
    );


    /*
    |--------------------------------------------------------------------------
    | SERTIFIKAT
    |--------------------------------------------------------------------------
    */

    setTanahText(
        'detailSertifikat',
        item.sertifikat
    );


    setTanahText(
        'detailTglSertifikat',

        formatTanahDateOnly(
            item.tgl_sertifikat
        )
    );


    setTanahText(
        'detailLuasSertifikat',

        formatTanahArea(
            item.luas_sertifikat
        )
    );


    /*
    |--------------------------------------------------------------------------
    | GAMBAR SITUASI
    |--------------------------------------------------------------------------
    */

    setTanahText(
        'detailNoGambar',
        item.no_gambar
    );


    setTanahText(
        'detailTglGambar',

        formatTanahDateOnly(
            item.tgl_gambar
        )
    );


    setTanahText(
        'detailLuasGambar',

        formatTanahArea(
            item.luas_gambar
        )
    );


    /*
    |--------------------------------------------------------------------------
    | HAK
    |--------------------------------------------------------------------------
    */

    setTanahText(
        'detailTanahHak',
        item.hak
    );


    setTanahText(
        'detailTanahPemilik',
        item.pemilik
    );


    setTanahText(
        'detailTanahKet',
        item.ket
    );
}


/* =========================================================
   GAMBAR LOKASI
========================================================= */

function setTanahDetailImage(
    url,
    lokasi
) {

    const image =
        document.getElementById(
            'detailTanahImage'
        );


    const empty =
        document.getElementById(
            'detailTanahImageEmpty'
        );


    if (
        !image
        ||
        !empty
    ) {
        return;
    }


    const source =
        String(
            url
            ??
            ''
        )
        .trim();


    image.onload =
        null;


    image.onerror =
        null;


    /*
    |--------------------------------------------------------------------------
    | KOSONG
    |--------------------------------------------------------------------------
    */

    if (!source) {

        image.hidden =
            true;


        image.removeAttribute(
            'src'
        );


        empty.hidden =
            false;


        return;
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD
    |--------------------------------------------------------------------------
    */

    image.hidden =
        true;


    empty.hidden =
        false;


    image.alt =
        `Foto ${lokasi || 'lokasi tanah'}`;


    image.onload =
        function () {

            image.hidden =
                false;


            empty.hidden =
                true;
        };


    image.onerror =
        function () {

            console.error(
                '[GAMBAR LOKASI GAGAL]',
                source
            );


            image.hidden =
                true;


            empty.hidden =
                false;


            image.removeAttribute(
                'src'
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Browser memanggil endpoint Laravel
    |--------------------------------------------------------------------------
    */

    image.src =
        source;
}


/* =========================================================
   CLOSE DETAIL
========================================================= */

function closeTanahView() {

    const modal =
        document.getElementById(
            'tanahViewModal'
        );


    if (
        modal
        &&
        modal.open
    ) {

        modal.close();
    }
}


/* =========================================================
   NILAI
========================================================= */

async function openTanahNilaiModal(
    row
) {

    const modal =
        document.getElementById(
            'tanahNilaiModal'
        );


    if (!modal) {
        return;
    }


    resetTanahNilaiModal();


    setTanahText(
        'nilaiTanahLokasi',

        `${row.dataset.lokasi || '—'} • ${row.dataset.alamat || '—'}`
    );


    setTanahText(
        'nilaiTanahTotal',

        formatTanahRupiah(
            row.dataset.nilai
        )
    );


    setTanahText(
        'nilaiTanahJumlah',
        row.dataset.jumlahTransaksi
    );


    lockTanahBody();


    if (!modal.open) {

        modal.showModal();
    }


    setElementHidden(
        'tanahNilaiLoading',
        false
    );


    refreshTanahIcons();


    if (
        tanahNilaiAbortController
    ) {

        tanahNilaiAbortController
            .abort();
    }


    tanahNilaiAbortController =
        new AbortController();


    try {

        const endpoint =
            window.TANAH_ENDPOINTS
                ?.nilai;


        if (!endpoint) {

            throw new Error(
                'Endpoint nilai belum tersedia.'
            );
        }


        const url =
            String(endpoint)
                .replace(
                    '__ID__',
                    encodeURIComponent(
                        row.dataset.idLokasi
                    )
                );


        const response =
            await fetch(
                url,
                {

                    method:
                        'GET',

                    headers: {

                        'Accept':
                            'application/json',

                        'X-Requested-With':
                            'XMLHttpRequest'

                    },

                    signal:
                        tanahNilaiAbortController
                            .signal
                }
            );


        const result =
            await readTanahJsonResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                result.message
                ||
                `HTTP ${response.status}`
            );
        }


        renderTanahNilaiData(
            result
        );


    } catch (error) {

        if (
            error.name
            ===
            'AbortError'
        ) {
            return;
        }


        console.error(
            'NILAI TANAH:',
            error
        );


        showTanahError(
            'tanahNilaiError',
            'tanahNilaiErrorText',
            error.message
        );


    } finally {

        setElementHidden(
            'tanahNilaiLoading',
            true
        );
    }
}


/* =========================================================
   RENDER NILAI
========================================================= */

function renderTanahNilaiData(
    result
) {

    const records =
        Array.isArray(
            result.data
        )
            ?
            result.data
            :
            [];


    setTanahText(
        'nilaiTanahTotal',

        formatTanahRupiah(
            result.total
        )
    );


    setTanahText(
        'nilaiTanahJumlah',

        String(
            result.jumlah_transaksi
            ??
            records.length
        )
    );


    if (result.lokasi) {

        setTanahText(
            'nilaiTanahLokasi',

            `${result.lokasi.lokasi || '—'} • ${result.lokasi.alamat || '—'}`
        );
    }


    const tbody =
        document.getElementById(
            'tanahNilaiTableBody'
        );


    if (!tbody) {
        return;
    }


    tbody.replaceChildren();


    setElementHidden(
        'tanahNilaiError',
        true
    );


    if (!records.length) {

        setElementHidden(
            'tanahNilaiTableWrap',
            true
        );


        setElementHidden(
            'tanahNilaiEmpty',
            false
        );


        refreshTanahIcons();


        return;
    }


    records.forEach(
        function (
            item,
            index
        ) {

            const row =
                document.createElement(
                    'tr'
                );


            appendTextCell(
                row,
                index + 1
            );


            appendTextCell(
                row,
                item.kode_aktiva
                ||
                '—',
                'nilai-code'
            );


            appendTextCell(
                row,
                item.nama_aktiva
                ||
                '—'
            );


            appendTextCell(
                row,

                formatTanahDateOnly(
                    item.tgl_voucher
                )
            );


            appendTextCell(
                row,
                item.tahun
                ||
                '—'
            );


            appendTextCell(
                row,

                formatTanahRupiah(
                    item.nilai
                ),

                'nilai-money'
            );


            appendTextCell(
                row,
                item.urai
                ||
                '—',
                'nilai-uraian'
            );


            tbody.appendChild(
                row
            );
        }
    );


    setElementHidden(
        'tanahNilaiEmpty',
        true
    );


    setElementHidden(
        'tanahNilaiTableWrap',
        false
    );
}


/* =========================================================
   NILAI RESET/CLOSE
========================================================= */

function resetTanahNilaiModal() {

    document
        .getElementById(
            'tanahNilaiTableBody'
        )
        ?.replaceChildren();


    setElementHidden(
        'tanahNilaiTableWrap',
        true
    );


    setElementHidden(
        'tanahNilaiEmpty',
        true
    );


    setElementHidden(
        'tanahNilaiError',
        true
    );
}


function closeTanahNilaiModal() {

    const modal =
        document.getElementById(
            'tanahNilaiModal'
        );


    if (
        modal
        &&
        modal.open
    ) {

        modal.close();
    }
}


/* =========================================================
   HELPER
========================================================= */

function appendTextCell(
    row,
    value,
    className = ''
) {

    const td =
        document.createElement(
            'td'
        );


    td.textContent =
        String(
            value
            ??
            '—'
        );


    if (className) {

        td.className =
            className;
    }


    row.appendChild(
        td
    );
}


function showTanahError(
    boxId,
    textId,
    message
) {

    const box =
        document.getElementById(
            boxId
        );


    const text =
        document.getElementById(
            textId
        );


    if (text) {

        text.textContent =
            message
            ||
            'Terjadi kesalahan.';
    }


    if (box) {

        box.hidden =
            false;
    }


    refreshTanahIcons();
}


async function readTanahJsonResponse(
    response
) {

    const text =
        await response.text();


    if (!text) {
        return {};
    }


    try {

        return JSON.parse(
            text
        );

    } catch (_) {

        throw new Error(
            `Respons server tidak valid (HTTP ${response.status}).`
        );
    }
}


/* =========================================================
   FORMAT
========================================================= */

function formatTanahRupiah(
    value
) {

    return new Intl.NumberFormat(
        'id-ID',
        {
            style:
                'currency',

            currency:
                'IDR',

            maximumFractionDigits:
                0
        }
    )
    .format(
        Number(value)
        ||
        0
    );
}


function formatTanahArea(
    value
) {

    const clean =
        String(
            value
            ??
            ''
        )
        .trim();


    if (!clean) {
        return '—';
    }


    return `${clean} m²`;
}


function formatTanahDateOnly(
    value
) {

    if (!value) {
        return '—';
    }


    const text =
        String(value)
            .trim();


    const match =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    if (!match) {
        return text;
    }


    const date =
        new Date(
            Date.UTC(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3])
            )
        );


    return new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone:
                'UTC',

            day:
                '2-digit',

            month:
                'short',

            year:
                'numeric'
        }
    )
    .format(date);
}


/* =========================================================
   ELEMENT
========================================================= */

function setTanahText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    const clean =
        String(
            value
            ??
            ''
        )
        .trim();


    element.textContent =
        clean
        ||
        '—';
}


function setElementHidden(
    id,
    hidden
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.hidden =
            hidden;
    }
}


/* =========================================================
   BODY
========================================================= */

function lockTanahBody() {

    tanahPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';
}


function restoreTanahBodyOverflow() {

    document.body.style.overflow =
        tanahPreviousOverflow;
}


/* =========================================================
   ICON
========================================================= */

function refreshTanahIcons() {

    if (window.lucide) {

        window.lucide.createIcons();
    }
}


/* =========================================================
   EXPORT
========================================================= */

function exportTanahCsv() {

    const rows =
        getFilteredTanahRows();


    if (!rows.length) {
        return;
    }


    const records = [[

        'No',

        'ID Lokasi',

        'Lokasi',

        'Alamat',

        'Penggunaan',

        'Jumlah Data Tanah',

        'Rentang Tahun',

        'Jumlah Transaksi Nilai',

        'Nilai Tanah'

    ]];


    rows.forEach(
        function (
            row,
            index
        ) {

            records.push([

                index + 1,

                row.dataset.idLokasi
                ||
                '',

                row.dataset.lokasi
                ||
                '',

                row.dataset.alamat
                ||
                '',

                row.dataset.guna
                ||
                '',

                row.dataset.jumlahData
                ||
                '0',

                row.dataset.tahun
                ||
                '',

                row.dataset.jumlahTransaksi
                ||
                '0',

                row.dataset.nilai
                ||
                '0'

            ]);
        }
    );


    const csv =
        records

            .map(
                row =>
                    row
                        .map(
                            tanahCsvCell
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
                csv
            ],
            {
                type:
                    'text/csv;charset=utf-8;'
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
        'data-lokasi-tanah.csv';


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    window.setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        500
    );
}


function tanahCsvCell(
    value
) {

    let text =
        String(
            value
            ??
            ''
        );


    if (
        /^[\s]*[=+@-]/.test(
            text
        )
    ) {

        text =
            "'"
            +
            text;
    }


    return (
        '"'
        +
        text.replace(
            /"/g,
            '""'
        )
        +
        '"'
    );
}