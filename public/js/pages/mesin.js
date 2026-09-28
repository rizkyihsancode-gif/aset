/* =========================================================
   K.I.B - PERALATAN DAN MESIN
   mesin.js

   Fungsi:
   - Search
   - Filter Departemen
   - Filter Lokasi
   - Filter Kondisi
   - Filter Tahun
   - Reset Filter
   - Pagination
   - Tab halaman
   - Select All
   - Modal Tambah
   - Modal Detail
   - Modal Edit
   - Modal Hapus
   - Export CSV
   - Lucide Icon

   Catatan:
   Data masih berasal dari Blade.
   CRUD database belum dihubungkan.
========================================================= */


/* =========================================================
   GLOBAL
========================================================= */

let mesinCurrentPage = 1;

let mesinPreviousOverflow = '';

const mesinNumber =
    new Intl.NumberFormat('id-ID');


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        /*
         * Pastikan JS hanya berjalan
         * pada halaman Peralatan dan Mesin.
         */
        if (
            !document.querySelector(
                '.mesin-page'
            )
        ) {
            return;
        }


        /*
         * Render icon Lucide
         */
        refreshMesinIcons();


        /*
         * Inisialisasi seluruh fungsi.
         */
        initMesinSearch();

        initMesinFilters();

        initMesinPagination();

        initMesinTable();

        initMesinTabs();

        initMesinModal();

        initMesinSelectAll();


        /*
         * Render tabel pertama kali.
         */
        renderMesinTable();

    }
);


/* =========================================================
   LUCIDE ICON
========================================================= */

function refreshMesinIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons === 'function'
    ) {

        window.lucide.createIcons();

    }

}


/* =========================================================
   SEARCH
========================================================= */

function initMesinSearch() {

    const search =
        document.getElementById(
            'mesinSearch'
        );


    if (!search) {
        return;
    }


    search.addEventListener(
        'input',
        function () {

            mesinCurrentPage = 1;

            renderMesinTable();

        }
    );

}


/* =========================================================
   FILTER
========================================================= */

function initMesinFilters() {

    const filterIds = [

        'mesinDepartemen',

        'mesinLokasi',

        'mesinKondisi',

        'mesinTahun'

    ];


    filterIds.forEach(
        function (id) {

            const element =
                document.getElementById(id);


            if (!element) {
                return;
            }


            element.addEventListener(
                'change',
                function () {

                    mesinCurrentPage = 1;

                    renderMesinTable();

                }
            );

        }
    );


    /*
     * Page size
     */
    const pageSize =
        document.getElementById(
            'mesinPageSize'
        );


    if (pageSize) {

        pageSize.addEventListener(
            'change',
            function () {

                mesinCurrentPage = 1;

                renderMesinTable();

            }
        );

    }

}


/* =========================================================
   GET TABLE ROW
========================================================= */

function getMesinRows() {

    return Array.from(

        document.querySelectorAll(
            '#mesinTable tbody tr[data-record]'
        )

    );

}


/* =========================================================
   GET FILTERED ROW
========================================================= */

function getFilteredMesinRows() {

    const searchElement =
        document.getElementById(
            'mesinSearch'
        );


    const departemenElement =
        document.getElementById(
            'mesinDepartemen'
        );


    const lokasiElement =
        document.getElementById(
            'mesinLokasi'
        );


    const kondisiElement =
        document.getElementById(
            'mesinKondisi'
        );


    const tahunElement =
        document.getElementById(
            'mesinTahun'
        );


    const search =

        searchElement
            ? searchElement.value
                .trim()
                .toLocaleLowerCase('id-ID')
            : '';


    const departemen =

        departemenElement
            ? departemenElement.value
            : '';


    const lokasi =

        lokasiElement
            ? lokasiElement.value
            : '';


    const kondisi =

        kondisiElement
            ? kondisiElement.value
            : '';


    const tahun =

        tahunElement
            ? tahunElement.value
            : '';


    return getMesinRows().filter(
        function (row) {

            /*
             * Kolom tabel:
             *
             * 0 = Checkbox
             * 1 = No
             * 2 = Kode Aset
             * 3 = Thumbnail
             * 4 = Nama Aset
             * 5 = Merk / Tipe
             * 6 = No. Seri
             * 7 = Tahun
             * 8 = Lokasi
             * 9 = Nilai Perolehan
             * 10 = Nilai Buku
             * 11 = Kondisi
             * 12 = Aksi
             */

            const searchable = [

                row.cells[2]?.textContent,

                row.cells[4]?.textContent,

                row.cells[5]?.textContent,

                row.cells[6]?.textContent,

                row.cells[8]?.textContent

            ]
                .join(' ')
                .toLocaleLowerCase('id-ID');


            return (

                (
                    !search ||
                    searchable.includes(search)
                )

                &&

                (
                    !departemen ||
                    row.dataset.departemen === departemen
                )

                &&

                (
                    !lokasi ||
                    row.dataset.lokasi === lokasi
                )

                &&

                (
                    !kondisi ||
                    row.dataset.kondisi === kondisi
                )

                &&

                (
                    !tahun ||
                    row.dataset.tahun === tahun
                )

            );

        }
    );

}


/* =========================================================
   CHECK ACTIVE FILTER
========================================================= */

function hasMesinFilter() {

    const search =
        document.getElementById(
            'mesinSearch'
        )?.value.trim();


    const departemen =
        document.getElementById(
            'mesinDepartemen'
        )?.value;


    const lokasi =
        document.getElementById(
            'mesinLokasi'
        )?.value;


    const kondisi =
        document.getElementById(
            'mesinKondisi'
        )?.value;


    const tahun =
        document.getElementById(
            'mesinTahun'
        )?.value;


    return Boolean(

        search ||

        departemen ||

        lokasi ||

        kondisi ||

        tahun

    );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderMesinTable() {

    const allRows =
        getMesinRows();


    const filteredRows =
        getFilteredMesinRows();


    const pageSize =
        Number(

            document.getElementById(
                'mesinPageSize'
            )?.value

        ) || 10;


    /*
     * Pagination berdasarkan
     * data yang benar-benar tersedia
     * di Blade.
     */
    const totalPages =

        Math.max(

            1,

            Math.ceil(
                filteredRows.length /
                pageSize
            )

        );


    /*
     * Pastikan halaman tidak
     * melebihi total halaman.
     */
    mesinCurrentPage =

        Math.min(

            Math.max(
                1,
                mesinCurrentPage
            ),

            totalPages

        );


    const start =

        (
            mesinCurrentPage - 1
        ) * pageSize;


    const end =

        start + pageSize;


    const visibleRows =

        filteredRows.slice(
            start,
            end
        );


    /*
     * Sembunyikan seluruh row.
     */
    allRows.forEach(
        function (row) {

            row.hidden = true;

        }
    );


    /*
     * Tampilkan row sesuai halaman.
     */
    visibleRows.forEach(
        function (row, index) {

            row.hidden = false;


            /*
             * Nomor tabel.
             */
            if (row.cells[1]) {

                row.cells[1].textContent =

                    start + index + 1;

            }

        }
    );


    /*
     * Empty state.
     */
    const emptyRow =
        document.getElementById(
            'mesinEmptyRow'
        );


    if (emptyRow) {

        emptyRow.hidden =
            filteredRows.length > 0;

    }


    /*
     * Table information.
     */
    updateMesinTableInfo(

        filteredRows.length,

        allRows.length,

        start,

        visibleRows.length

    );


    /*
     * Pagination.
     */
    renderMesinPagination(
        totalPages
    );


    /*
     * Checkbox kembali direset
     * setiap render.
     */
    resetMesinSelectAll();


    refreshMesinIcons();

}


/* =========================================================
   TABLE INFORMATION
========================================================= */

function updateMesinTableInfo(

    filteredCount,

    totalCount,

    start,

    visibleCount

) {

    const info =
        document.getElementById(
            'mesinTableInfo'
        );


    if (!info) {
        return;
    }


    if (filteredCount === 0) {

        info.textContent =
            'Tidak ada data yang ditampilkan.';

        return;

    }


    const from =
        start + 1;


    const to =
        start + visibleCount;


    /*
     * Jika tidak ada filter.
     */
    if (!hasMesinFilter()) {

        info.textContent =

            `Menampilkan ${mesinNumber.format(from)}–${mesinNumber.format(to)} dari ${mesinNumber.format(totalCount)} data contoh`;

    }

    else {

        info.textContent =

            `Menampilkan ${mesinNumber.format(from)}–${mesinNumber.format(to)} dari ${mesinNumber.format(filteredCount)} hasil filter`;

    }

}


/* =========================================================
   PAGINATION INIT
========================================================= */

function initMesinPagination() {

    /*
     * Pagination dibuat dinamis
     * melalui renderMesinPagination().
     */

}


/* =========================================================
   PAGINATION
========================================================= */

function renderMesinPagination(
    totalPages
) {

    const pagination =
        document.getElementById(
            'mesinPagination'
        );


    if (!pagination) {
        return;
    }


    pagination.replaceChildren();


    /*
     * Helper membuat button.
     */
    function createButton(

        label,

        page,

        options = {}

    ) {

        const button =
            document.createElement(
                'button'
            );


        button.type = 'button';


        button.disabled =
            Boolean(
                options.disabled
            );


        if (options.active) {

            button.classList.add(
                'active'
            );


            button.setAttribute(
                'aria-current',
                'page'
            );

        }


        if (options.icon) {

            const icon =
                document.createElement(
                    'i'
                );


            icon.setAttribute(
                'data-lucide',
                options.icon
            );


            icon.setAttribute(
                'aria-hidden',
                'true'
            );


            button.appendChild(
                icon
            );

        }

        else {

            button.textContent =
                label;

        }


        button.setAttribute(

            'aria-label',

            options.aria || label

        );


        button.addEventListener(
            'click',
            function () {

                if (
                    page ===
                    mesinCurrentPage
                ) {

                    return;

                }


                mesinCurrentPage =
                    page;


                renderMesinTable();


                /*
                 * Scroll ke bagian atas
                 * tabel tanpa mengganggu
                 * seluruh halaman.
                 */
                document
                    .getElementById(
                        'mesinTable'
                    )
                    ?.scrollIntoView({

                        behavior:
                            'smooth',

                        block:
                            'nearest'

                    });

            }
        );


        pagination.appendChild(
            button
        );

    }


    /*
     * Jika hanya 1 halaman,
     * pagination tetap ditampilkan
     * tetapi tombol disabled.
     */
    createButton(

        '',

        Math.max(
            1,
            mesinCurrentPage - 1
        ),

        {

            disabled:
                mesinCurrentPage === 1,

            icon:
                'chevron-left',

            aria:
                'Halaman sebelumnya'

        }

    );


    /*
     * Pagination maksimal 7 angka.
     */
    if (totalPages <= 7) {

        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            createButton(

                String(page),

                page,

                {

                    active:
                        page ===
                        mesinCurrentPage

                }

            );

        }

    }

    else {

        /*
         * Halaman pertama.
         */
        createButton(

            '1',

            1,

            {

                active:
                    mesinCurrentPage === 1

            }

        );


        /*
         * Jika halaman aktif
         * cukup dekat dengan awal.
         */
        if (
            mesinCurrentPage <= 4
        ) {

            for (
                let page = 2;
                page <= 5;
                page++
            ) {

                createButton(

                    String(page),

                    page,

                    {

                        active:
                            page ===
                            mesinCurrentPage

                    }

                );

            }


            createDots(
                pagination
            );


        }


        /*
         * Halaman tengah.
         */
        else if (
            mesinCurrentPage <
            totalPages - 3
        ) {

            createDots(
                pagination
            );


            for (
                let page =
                    mesinCurrentPage - 1;

                page <=
                    mesinCurrentPage + 1;

                page++
            ) {

                createButton(

                    String(page),

                    page,

                    {

                        active:
                            page ===
                            mesinCurrentPage

                    }

                );

            }


            createDots(
                pagination
            );

        }


        /*
         * Dekat halaman terakhir.
         */
        else {

            createDots(
                pagination
            );


            for (
                let page =
                    totalPages - 4;

                page <=
                    totalPages - 1;

                page++
            ) {

                createButton(

                    String(page),

                    page,

                    {

                        active:
                            page ===
                            mesinCurrentPage

                    }

                );

            }

        }


        /*
         * Halaman terakhir.
         */
        createButton(

            String(totalPages),

            totalPages,

            {

                active:
                    mesinCurrentPage ===
                    totalPages

            }

        );

    }


    /*
     * Next.
     */
    createButton(

        '',

        Math.min(

            totalPages,

            mesinCurrentPage + 1

        ),

        {

            disabled:
                mesinCurrentPage ===
                totalPages,

            icon:
                'chevron-right',

            aria:
                'Halaman berikutnya'

        }

    );


    refreshMesinIcons();

}


/* =========================================================
   PAGINATION DOTS
========================================================= */

function createDots(
    container
) {

    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.disabled =
        true;


    button.textContent =
        '...';


    button.setAttribute(
        'aria-hidden',
        'true'
    );


    container.appendChild(
        button
    );

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetMesinFilter() {

    const ids = [

        'mesinSearch',

        'mesinDepartemen',

        'mesinLokasi',

        'mesinKondisi',

        'mesinTahun'

    ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value = '';

            }

        }
    );


    mesinCurrentPage = 1;


    renderMesinTable();

}


/* =========================================================
   TABLE ACTION
========================================================= */

function initMesinTable() {

    const table =
        document.getElementById(
            'mesinTable'
        );


    if (!table) {
        return;
    }


    table.addEventListener(
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


            if (!row) {
                return;
            }


            const action =
                button.dataset.action;


            openMesinModal(
                action,
                row
            );

        }
    );

}


/* =========================================================
   SELECT ALL
========================================================= */

function initMesinSelectAll() {

    const table =
        document.getElementById(
            'mesinTable'
        );


    if (!table) {
        return;
    }


    const selectAll =
        table.querySelector(
            'thead input[type="checkbox"]'
        );


    if (!selectAll) {
        return;
    }


    selectAll.addEventListener(
        'change',
        function () {

            const rows =
                getMesinRows();


            rows.forEach(
                function (row) {

                    if (
                        row.hidden
                    ) {
                        return;
                    }


                    const checkbox =
                        row.querySelector(
                            'input[type="checkbox"]'
                        );


                    if (checkbox) {

                        checkbox.checked =
                            selectAll.checked;

                    }

                }
            );

        }
    );


    /*
     * Update select all jika
     * checkbox individual berubah.
     */
    table.addEventListener(
        'change',
        function (event) {

            const checkbox =
                event.target;


            if (
                !checkbox.matches(
                    'tbody input[type="checkbox"]'
                )
            ) {
                return;
            }


            updateMesinSelectAllState();

        }
    );

}


/* =========================================================
   UPDATE SELECT ALL STATE
========================================================= */

function updateMesinSelectAllState() {

    const table =
        document.getElementById(
            'mesinTable'
        );


    if (!table) {
        return;
    }


    const selectAll =
        table.querySelector(
            'thead input[type="checkbox"]'
        );


    if (!selectAll) {
        return;
    }


    const visibleRows =
        getMesinRows().filter(
            function (row) {

                return !row.hidden;

            }
        );


    const checkedRows =
        visibleRows.filter(
            function (row) {

                return row.querySelector(
                    'tbody input[type="checkbox"]'
                )?.checked;

            }
        );


    /*
     * Cari checkbox pada row dengan
     * cara langsung.
     */
    const checked =
        visibleRows.filter(
            function (row) {

                const checkbox =
                    row.querySelector(
                        'input[type="checkbox"]'
                    );


                return checkbox?.checked;

            }
        );


    selectAll.checked =

        visibleRows.length > 0 &&

        checked.length ===
        visibleRows.length;


    selectAll.indeterminate =

        checked.length > 0 &&

        checked.length <
        visibleRows.length;

}


/* =========================================================
   RESET SELECT ALL
========================================================= */

function resetMesinSelectAll() {

    const table =
        document.getElementById(
            'mesinTable'
        );


    if (!table) {
        return;
    }


    const selectAll =
        table.querySelector(
            'thead input[type="checkbox"]'
        );


    if (selectAll) {

        selectAll.checked =
            false;

        selectAll.indeterminate =
            false;

    }

}


/* =========================================================
   TABS
========================================================= */

function initMesinTabs() {

    const tabs =
        document.querySelectorAll(
            '[data-mesin-tab]'
        );


    if (!tabs.length) {
        return;
    }


    tabs.forEach(
        function (tab) {

            tab.addEventListener(
                'click',
                function () {

                    tabs.forEach(
                        function (item) {

                            item.classList.remove(
                                'active'
                            );

                        }
                    );


                    tab.classList.add(
                        'active'
                    );


                    const selected =
                        tab.dataset.mesinTab;


                    /*
                     * Saat ini tab masih berupa
                     * navigasi UI.
                     *
                     * Data Rekapitulasi,
                     * Grafik, dan Penyusutan
                     * dapat dihubungkan nanti.
                     */
                    document.dispatchEvent(

                        new CustomEvent(
                            'mesin:tabChanged',
                            {
                                detail: {
                                    tab: selected
                                }
                            }
                        )

                    );

                }
            );

        }
    );

}


/* =========================================================
   MODAL INIT
========================================================= */

function initMesinModal() {

    const modal =
        document.getElementById(
            'mesinModal'
        );


    if (!modal) {
        return;
    }


    /*
     * Klik backdrop.
     */
    modal.addEventListener(
        'click',
        function (event) {

            if (
                event.target !==
                modal
            ) {
                return;
            }


            closeMesinModal();

        }
    );


    /*
     * Ketika modal ditutup,
     * kembalikan scroll body.
     */
    modal.addEventListener(
        'close',
        function () {

            document.body.style.overflow =
                mesinPreviousOverflow;

        }
    );


    /*
     * Form belum mengirim ke database.
     */
    const form =
        document.getElementById(
            'mesinForm'
        );


    form?.addEventListener(
        'submit',
        function (event) {

            event.preventDefault();


            /*
             * CRUD database akan
             * dihubungkan pada tahap backend.
             */

        }
    );

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openMesinModal(

    mode = 'add',

    row = null

) {

    const modal =
        document.getElementById(
            'mesinModal'
        );


    if (
        !modal ||
        modal.open
    ) {
        return;
    }


    /*
     * Judul modal.
     */
    const titles = {

        add:
            'Tambah Aset',

        view:
            'Detail Aset',

        edit:
            'Edit Aset',

        delete:
            'Hapus Aset'

    };


    /*
     * Deskripsi modal.
     */
    const descriptions = {

        add:
            'Tambahkan data peralatan dan mesin.',

        view:
            'Informasi detail aset peralatan dan mesin.',

        edit:
            'Perbarui informasi aset peralatan dan mesin.',

        delete:
            'Periksa aset yang akan dihapus.'

    };


    const readonly =

        mode === 'view' ||

        mode === 'delete';


    /*
     * Reset form.
     */
    const form =
        document.getElementById(
            'mesinForm'
        );


    form?.reset();


    /*
     * Title.
     */
    const title =
        document.getElementById(
            'mesinModalTitle'
        );


    if (title) {

        title.textContent =

            titles[mode] ||
            titles.add;

    }


    /*
     * Description.
     */
    const description =
        document.getElementById(
            'mesinModalDescription'
        );


    if (description) {

        description.textContent =

            descriptions[mode] ||
            descriptions.add;

    }


    /*
     * Ambil field.
     */
    const code =
        document.getElementById(
            'mesinCode'
        );


    const name =
        document.getElementById(
            'mesinName'
        );


    const merk =
        document.getElementById(
            'mesinMerk'
        );


    const serial =
        document.getElementById(
            'mesinSerial'
        );


    const tahun =
        document.getElementById(
            'mesinFormTahun'
        );


    const lokasi =
        document.getElementById(
            'mesinFormLokasi'
        );


    const perolehan =
        document.getElementById(
            'mesinPerolehan'
        );


    const buku =
        document.getElementById(
            'mesinBuku'
        );


    const kondisi =
        document.getElementById(
            'mesinFormKondisi'
        );


    /*
     * Isi data ketika row dipilih.
     */
    if (row) {

        /*
         * Kode Aset
         */
        if (code) {

            code.value =

                row.cells[2]
                    ?.textContent
                    .trim() || '';

        }


        /*
         * Nama Aset
         */
        if (name) {

            name.value =

                row.cells[4]
                    ?.textContent
                    .trim() || '';

        }


        /*
         * Merk / Tipe
         */
        if (merk) {

            merk.value =

                cleanMesinCellText(

                    row.cells[5]
                        ?.textContent

                );

        }


        /*
         * Nomor Seri
         */
        if (serial) {

            serial.value =

                cleanMesinCellText(

                    row.cells[6]
                        ?.textContent

                );

        }


        /*
         * Tahun
         */
        if (tahun) {

            tahun.value =

                row.cells[7]
                    ?.textContent
                    .trim() || '';

        }


        /*
         * Lokasi
         */
        if (lokasi) {

            lokasi.value =

                row.cells[8]
                    ?.textContent
                    .trim() || '';

        }


        /*
         * Nilai Perolehan
         */
        if (perolehan) {

            perolehan.value =

                row.cells[9]
                    ?.textContent
                    .trim() || '';

        }


        /*
         * Nilai Buku
         */
        if (buku) {

            buku.value =

                row.cells[10]
                    ?.textContent
                    .trim() || '';

        }


        /*
         * Kondisi
         */
        if (kondisi) {

            kondisi.value =

                row.cells[11]
                    ?.textContent
                    .trim() || 'Baik';

        }

    }


    /*
     * Set readonly.
     */
    [

        code,

        name,

        merk,

        serial,

        tahun,

        lokasi,

        perolehan,

        buku

    ].forEach(
        function (field) {

            if (!field) {
                return;
            }


            field.readOnly =
                readonly;

        }
    );


    /*
     * Select kondisi.
     */
    if (kondisi) {

        kondisi.disabled =
            readonly;

    }


    /*
     * Save button.
     */
    const save =
        document.getElementById(
            'mesinSaveButton'
        );


    if (save) {

        /*
         * View tidak membutuhkan
         * tombol simpan.
         */
        save.hidden =
            mode === 'view';


        /*
         * Database belum dihubungkan.
         */
        save.disabled =
            true;


        save.textContent =

            mode === 'delete'

                ? 'Hapus Aset'

                : 'Simpan Aset';


        save.classList.toggle(

            'mesin-delete-button',

            mode === 'delete'

        );

    }


    /*
     * Catatan modal.
     */
    const note =
        document.getElementById(
            'mesinModalNote'
        );


    if (note) {

        if (
            mode === 'view'
        ) {

            note.textContent =

                'Data contoh untuk pratinjau tampilan.';

        }

        else if (
            mode === 'delete'
        ) {

            note.textContent =

                'Pratinjau konfirmasi. Penghapusan database belum dihubungkan.';

        }

        else {

            note.textContent =

                'Form UI contoh. Penyimpanan database belum dihubungkan.';

        }

    }


    /*
     * Lock body scroll.
     */
    mesinPreviousOverflow =
        document.body.style.overflow;


    document.body.style.overflow =
        'hidden';


    /*
     * Buka native dialog.
     */
    modal.showModal();


    /*
     * Fokus field pertama.
     */
    if (
        !readonly &&
        code
    ) {

        code.focus();

    }


    refreshMesinIcons();

}


/* =========================================================
   CLEAN CELL TEXT
========================================================= */

function cleanMesinCellText(
    value
) {

    return String(
        value || ''
    )
        .replace(
            /\s+/g,
            ' '
        )
        .trim();

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeMesinModal() {

    const modal =
        document.getElementById(
            'mesinModal'
        );


    if (
        modal &&
        modal.open
    ) {

        modal.close();

    }

}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportMesinCSV() {

    const rows =
        getFilteredMesinRows();


    /*
     * Header CSV.
     */
    const records = [

        [

            'No',

            'Kode Aset',

            'Nama Aset',

            'Merk / Tipe',

            'No. Seri',

            'Tahun',

            'Lokasi',

            'Nilai Perolehan',

            'Nilai Buku',

            'Kondisi'

        ]

    ];


    /*
     * Ambil data tabel.
     */
    rows.forEach(
        function (row, index) {

            records.push(

                [

                    index + 1,

                    cleanMesinCellText(
                        row.cells[2]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[4]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[5]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[6]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[7]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[8]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[9]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[10]?.textContent
                    ),

                    cleanMesinCellText(
                        row.cells[11]?.textContent
                    )

                ]

            );

        }
    );


    /*
     * Convert ke CSV.
     */
    const csv =

        records
            .map(
                function (record) {

                    return record
                        .map(
                            mesinCsvCell
                        )
                        .join(',');

                }
            )
            .join('\r\n');


    /*
     * BOM agar Excel membaca UTF-8.
     */
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
        'data-peralatan-dan-mesin.csv';


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
        1000
    );

}


/* =========================================================
   SAFE CSV CELL
========================================================= */

function mesinCsvCell(
    value
) {

    let text =
        String(
            value ?? ''
        );


    /*
     * Mencegah formula injection
     * ketika file dibuka menggunakan Excel.
     */
    if (

        /^[\s]*[=+@-]/.test(
            text
        )

        ||

        /^[\t\r\n]/.test(
            text
        )

    ) {

        text =
            "'" + text;

    }


    /*
     * Escape tanda kutip.
     */
    text =
        text.replace(
            /"/g,
            '""'
        );


    return (
        '"' +
        text +
        '"'
    );

}


/* =========================================================
   OPTIONAL:
   GET SELECTED ASSET
========================================================= */

function getSelectedMesinRows() {

    const rows =
        getMesinRows();


    return rows.filter(
        function (row) {

            const checkbox =
                row.querySelector(
                    'input[type="checkbox"]'
                );


            return (
                checkbox &&
                checkbox.checked
            );

        }
    );

}


/* =========================================================
   OPTIONAL:
   CLEAR SELECTION
========================================================= */

function clearMesinSelection() {

    getMesinRows().forEach(
        function (row) {

            const checkbox =
                row.querySelector(
                    'input[type="checkbox"]'
                );


            if (checkbox) {

                checkbox.checked =
                    false;

            }

        }
    );


    resetMesinSelectAll();

}


/* =========================================================
   EXPOSE GLOBAL FUNCTION
   Agar onclick="" pada Blade dapat
   memanggil fungsi dengan aman.
========================================================= */

window.openMesinModal =
    openMesinModal;


window.closeMesinModal =
    closeMesinModal;


window.resetMesinFilter =
    resetMesinFilter;


window.exportMesinCSV =
    exportMesinCSV;


window.getSelectedMesinRows =
    getSelectedMesinRows;


window.clearMesinSelection =
    clearMesinSelection;