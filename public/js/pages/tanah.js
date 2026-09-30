/* ==========================================================
   K.I.B - TANAH
   Full UI Controller
   ----------------------------------------------------------
   Fungsi:
   - Search
   - Filter Lokasi
   - Filter Hak
   - Filter Tahun
   - Reset Filter
   - Pagination
   - Tambah Tanah
   - Detail Tanah
   - Edit Tanah
   - Hapus Tanah
   - Update KPI
   - Export CSV
   - Update tanggal
   - Lucide icon refresh
========================================================== */

(() => {
    'use strict';

    /* ==========================================================
       STATE
    ========================================================== */

    let currentPage = 1;
    let modalMode = 'add';
    let editingRow = null;
    let previousOverflow = '';

    /* ==========================================================
       FORMATTER
    ========================================================== */

    const number = new Intl.NumberFormat('id-ID');

    const rupiah = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    /* ==========================================================
       INITIALIZATION
    ========================================================== */

    document.addEventListener('DOMContentLoaded', () => {

        /*
         * Pastikan script hanya bekerja pada halaman Tanah.
         */
        if (!document.querySelector('.tanah-page')) {
            return;
        }

        bindEvents();

        updateDate();

        renderTable();

        updateKpiFromRows();

        refreshIcons();
    });


    /* ==========================================================
       EVENT BINDING
    ========================================================== */

    function bindEvents() {

        const search = document.getElementById('tanahSearch');

        const lokasi = document.getElementById('tanahLokasi');

        const hak = document.getElementById('tanahHak');

        const tahun = document.getElementById('tanahTahun');

        const pageSize = document.getElementById('tanahPageSize');

        const table = document.getElementById('tanahTable');

        const form = document.getElementById('tanahForm');

        const modal = document.getElementById('tanahModal');

        const viewAll = document.getElementById('tanahViewAll');


        /* ======================================================
           SEARCH
        ====================================================== */

        search?.addEventListener('input', () => {

            currentPage = 1;

            renderTable();

        });


        /* ======================================================
           FILTER SELECT
        ====================================================== */

        [lokasi, hak, tahun].forEach(element => {

            element?.addEventListener('change', () => {

                currentPage = 1;

                renderTable();

            });

        });


        /* ======================================================
           PAGE SIZE
        ====================================================== */

        pageSize?.addEventListener('change', () => {

            currentPage = 1;

            renderTable();

        });


        /* ======================================================
           TABLE ACTION
        ====================================================== */

        table?.addEventListener('click', event => {

            const button = event.target.closest(
                'button[data-action]'
            );

            if (!button) {
                return;
            }


            const row = button.closest(
                'tr[data-record]'
            );

            if (!row) {
                return;
            }


            openTanahModal(
                button.dataset.action,
                row
            );

        });


        /* ======================================================
           FORM SUBMIT
        ====================================================== */

        form?.addEventListener(
            'submit',
            saveTanah
        );


        /* ======================================================
           MODAL CLOSE
        ====================================================== */

        modal?.addEventListener(
            'close',
            () => {

                document.body.style.overflow =
                    previousOverflow;

                editingRow = null;

                refreshIcons();

            }
        );


        /* ======================================================
           VIEW ALL
        ====================================================== */

        viewAll?.addEventListener(
            'click',
            event => {

                event.preventDefault();

                resetTanahFilter();

                document
                    .getElementById('tanahList')
                    ?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

            }
        );

    }


    /* ==========================================================
       DATE
    ========================================================== */

    function updateDate() {

        const target =
            document.getElementById(
                'tanahCurrentDate'
            );

        if (!target) {
            return;
        }


        target.textContent =
            new Intl.DateTimeFormat(
                'id-ID',
                {
                    timeZone: 'Asia/Makassar',

                    weekday: 'long',

                    day: 'numeric',

                    month: 'long',

                    year: 'numeric'
                }
            ).format(new Date());

    }


    /* ==========================================================
       GET ALL TABLE ROWS
    ========================================================== */

    function getRows() {

        return [
            ...document.querySelectorAll(
                '#tanahTable tbody tr[data-record]'
            )
        ];

    }


    /* ==========================================================
       GET FILTERED ROWS
    ========================================================== */

    function getFilteredRows() {

        const search =
            document
                .getElementById('tanahSearch')
                ?.value
                .trim()
                .toLowerCase() || '';


        const lokasi =
            document
                .getElementById('tanahLokasi')
                ?.value || '';


        const hak =
            document
                .getElementById('tanahHak')
                ?.value || '';


        const tahun =
            document
                .getElementById('tanahTahun')
                ?.value || '';


        return getRows().filter(row => {

            const text = [

                row.cells[1]?.textContent,

                row.cells[2]?.textContent,

                row.cells[3]?.textContent,

                row.cells[5]?.textContent

            ]
                .join(' ')
                .toLowerCase();


            const matchSearch =
                !search ||
                text.includes(search);


            const matchLokasi =
                !lokasi ||
                row.dataset.lokasi === lokasi;


            const matchHak =
                !hak ||
                row.dataset.hak === hak;


            const matchTahun =
                !tahun ||
                row.dataset.tahun === tahun;


            return (
                matchSearch &&
                matchLokasi &&
                matchHak &&
                matchTahun
            );

        });

    }


    /* ==========================================================
       RENDER TABLE
    ========================================================== */

    function renderTable() {

        const rows =
            getRows();


        const filtered =
            getFilteredRows();


        const empty =
            document.getElementById(
                'tanahEmptyRow'
            );


        const info =
            document.getElementById(
                'tanahTableInfo'
            );


        const pageSize =
            Number(
                document
                    .getElementById(
                        'tanahPageSize'
                    )
                    ?.value || 10
            );


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filtered.length /
                    pageSize
                )
            );


        /*
         * Jangan sampai halaman aktif melebihi
         * jumlah halaman setelah filter.
         */

        currentPage =
            Math.min(
                Math.max(
                    1,
                    currentPage
                ),
                totalPages
            );


        const start =
            (currentPage - 1) *
            pageSize;


        const visible =
            filtered.slice(
                start,
                start + pageSize
            );


        /* ======================================================
           HIDE SEMUA ROW
        ====================================================== */

        rows.forEach(row => {

            row.hidden = true;

        });


        /* ======================================================
           SHOW ROW SESUAI PAGE
        ====================================================== */

        visible.forEach(
            (row, index) => {

                row.hidden = false;

                row.cells[0].textContent =
                    String(
                        start + index + 1
                    );

            }
        );


        /* ======================================================
           EMPTY STATE
        ====================================================== */

        if (empty) {

            empty.hidden =
                filtered.length > 0;

        }


        /* ======================================================
           TABLE INFORMATION
        ====================================================== */

        if (info) {

            if (filtered.length) {

                const from =
                    start + 1;

                const to =
                    Math.min(
                        start + pageSize,
                        filtered.length
                    );


                info.textContent =
                    `Menampilkan ${number.format(from)}–${number.format(to)} dari ${number.format(filtered.length)} data contoh`;

            } else {

                info.textContent =
                    'Tidak ada data yang sesuai.';

            }

        }


        /* ======================================================
           PAGINATION
        ====================================================== */

        renderPagination(
            totalPages
        );


        /* ======================================================
           UPDATE KPI
        ====================================================== */

        updateKpiFromRows();


        /* ======================================================
           REFRESH ICON
        ====================================================== */

        refreshIcons();

    }


    /* ==========================================================
       PAGINATION
    ========================================================== */

    function renderPagination(totalPages) {

        const container =
            document.getElementById(
                'tanahPagination'
            );


        if (!container) {
            return;
        }


        container.replaceChildren();


        /* ======================================================
           CREATE PAGINATION BUTTON
        ====================================================== */

        const makeButton = (
            label,
            page,
            disabled,
            active,
            icon
        ) => {

            const button =
                document.createElement(
                    'button'
                );


            button.type = 'button';

            button.disabled =
                disabled;

            button.className =
                active
                    ? 'active'
                    : '';


            button.setAttribute(
                'aria-label',
                label
            );


            if (active) {

                button.setAttribute(
                    'aria-current',
                    'page'
                );

            }


            if (icon) {

                const i =
                    document.createElement(
                        'i'
                    );


                i.dataset.lucide =
                    icon;


                button.appendChild(i);

            } else {

                button.textContent =
                    page;

            }


            button.addEventListener(
                'click',
                () => {

                    currentPage =
                        page;

                    renderTable();

                }
            );


            container.appendChild(
                button
            );

        };


        /* ======================================================
           PREVIOUS
        ====================================================== */

        makeButton(
            'Halaman sebelumnya',

            Math.max(
                1,
                currentPage - 1
            ),

            currentPage === 1,

            false,

            'chevron-left'
        );


        /* ======================================================
           PAGE NUMBER
        ====================================================== */

        const maxPages = 5;


        let start =
            Math.max(
                1,
                currentPage - 2
            );


        start =
            Math.min(
                start,
                Math.max(
                    1,
                    totalPages -
                    maxPages +
                    1
                )
            );


        const end =
            Math.min(
                totalPages,
                start + maxPages - 1
            );


        for (
            let page = start;
            page <= end;
            page++
        ) {

            makeButton(
                `Halaman ${page}`,

                page,

                false,

                page === currentPage,

                null
            );

        }


        /* ======================================================
           NEXT
        ====================================================== */

        makeButton(
            'Halaman berikutnya',

            Math.min(
                totalPages,
                currentPage + 1
            ),

            currentPage === totalPages,

            false,

            'chevron-right'
        );


        refreshIcons();

    }


    /* ==========================================================
       FILTER TABLE
    ========================================================== */

    function filterTanahTable() {

        currentPage = 1;

        renderTable();

    }


    /* ==========================================================
       RESET FILTER
    ========================================================== */

    function resetTanahFilter() {

        const fields = [

            'tanahSearch',

            'tanahLokasi',

            'tanahHak',

            'tanahTahun'

        ];


        fields.forEach(id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value = '';

            }

        });


        currentPage = 1;

        renderTable();

    }


    /* ==========================================================
       UPDATE KPI
    ========================================================== */

    function updateKpiFromRows() {

        const rows =
            getRows();


        /*
         * Jumlah data contoh pada tabel.
         */

        const total =
            rows.length;


        /*
         * Hitung luas dari seluruh row
         * yang tersedia.
         */

        const area =
            rows.reduce(
                (sum, row) => {

                    return (
                        sum +
                        Number(
                            row.dataset.area ||
                            0
                        )
                    );

                },
                0
            );


        /*
         * Hitung nilai aset.
         */

        const value =
            rows.reduce(
                (sum, row) => {

                    return (
                        sum +
                        Number(
                            row.dataset.value ||
                            0
                        )
                    );

                },
                0
            );


        const totalAset =
            document.getElementById(
                'tanahTotalAset'
            );


        const totalLuas =
            document.getElementById(
                'tanahTotalLuas'
            );


        const totalNilai =
            document.getElementById(
                'tanahTotalNilai'
            );


        const chartTotal =
            document.getElementById(
                'tanahChartTotal'
            );


        /*
         * ======================================================
         * BASELINE DATA
         * ======================================================
         *
         * Desain halaman menunjukkan:
         *
         * Total Aset Tanah = 245
         *
         * Sedangkan tabel hanya memiliki 8 data contoh.
         *
         * Jadi:
         *
         * 237 data lainnya
         * +
         * 8 data contoh
         * =
         * 245
         *
         * Jika user menambah:
         *
         * 8 + 1 = 9
         * 237 + 9 = 246
         *
         * Jika user menghapus:
         *
         * 8 - 1 = 7
         * 237 + 7 = 244
         *
         * Dengan demikian angka KPI tetap
         * mengikuti desain sambil CRUD UI berjalan.
         */

        const hiddenAssetBaseline = 237;


        const displayTotal =
            hiddenAssetBaseline +
            total;


        /* ======================================================
           TOTAL ASET
        ====================================================== */

        if (totalAset) {

            totalAset.textContent =
                number.format(
                    displayTotal
                );

        }


        /* ======================================================
           TOTAL LUAS
        ====================================================== */

        /*
         * Nilai utama desain tetap digunakan.
         */

        if (totalLuas) {

            totalLuas.textContent =
                '1.248.560 m²';

        }


        /* ======================================================
           TOTAL NILAI
        ====================================================== */

        if (totalNilai) {

            totalNilai.textContent =
                'Rp 245,6 M';

        }


        /* ======================================================
           CHART TOTAL
        ====================================================== */

        if (chartTotal) {

            chartTotal.textContent =
                number.format(
                    displayTotal
                );

        }

    }


    /* ==========================================================
       SHORT RUPIAH
    ========================================================== */

    function formatShortRupiah(value) {

        if (value >= 1e9) {

            return `Rp ${(value / 1e9).toLocaleString(
                'id-ID',
                {
                    maximumFractionDigits: 1
                }
            )} M`;

        }


        if (value >= 1e6) {

            return `Rp ${(value / 1e6).toLocaleString(
                'id-ID',
                {
                    maximumFractionDigits: 1
                }
            )} Jt`;

        }


        return rupiah.format(value);

    }


    /* ==========================================================
       OPEN MODAL
    ========================================================== */

    function openTanahModal(
        mode = 'add',
        row = null
    ) {

        const modal =
            document.getElementById(
                'tanahModal'
            );


        if (!modal) {
            return;
        }


        modalMode =
            mode;


        editingRow =
            row;


        const title =
            document.getElementById(
                'tanahModalTitle'
            );


        const description =
            document.getElementById(
                'tanahModalDescription'
            );


        const save =
            document.getElementById(
                'tanahSaveButton'
            );


        const form =
            document.getElementById(
                'tanahForm'
            );


        /* ======================================================
           RESET FORM
        ====================================================== */

        form?.reset();


        /* ======================================================
           MODAL TYPE
        ====================================================== */

        const isView =
            mode === 'view';


        const isDelete =
            mode === 'delete';


        /* ======================================================
           TITLE
        ====================================================== */

        if (title) {

            title.textContent =
                mode === 'add'
                    ? 'Tambah Tanah'

                    : mode === 'edit'
                        ? 'Edit Tanah'

                        : mode === 'delete'
                            ? 'Hapus Tanah'

                            : 'Detail Tanah';

        }


        /* ======================================================
           DESCRIPTION
        ====================================================== */

        if (description) {

            description.textContent =
                mode === 'add'
                    ? 'Tambahkan data aset tanah baru.'

                    : mode === 'edit'
                        ? 'Perbarui data aset tanah.'

                        : mode === 'delete'
                            ? 'Periksa data sebelum menghapus.'

                            : 'Informasi data aset tanah.';

        }


        /* ======================================================
           SAVE BUTTON
        ====================================================== */

        if (save) {

            save.textContent =
                isDelete
                    ? 'Hapus Tanah'
                    : 'Simpan';


            save.classList.toggle(
                'tanah-delete-button',
                isDelete
            );


            save.disabled =
                isView;

        }


        /* ======================================================
           FILL FORM
        ====================================================== */

        if (row) {

            fillModal(row);

        }


        /* ======================================================
           INPUT LOCK
        ====================================================== */

        [

            'tanahCode',

            'tanahFormLokasi',

            'tanahPenggunaan',

            'tanahLuas',

            'tanahFormTahun',

            'tanahNilai'

        ].forEach(id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.readOnly =
                    isView ||
                    isDelete;

            }

        });


        /* ======================================================
           SELECT LOCK
        ====================================================== */

        [

            'tanahFormHak',

            'tanahStatus'

        ].forEach(id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.disabled =
                    isView ||
                    isDelete;

            }

        });


        /* ======================================================
           SHOW MODAL
        ====================================================== */

        previousOverflow =
            document.body.style.overflow;


        document.body.style.overflow =
            'hidden';


        modal.showModal();


        refreshIcons();

    }


    /* ==========================================================
       FILL MODAL
    ========================================================== */

    function fillModal(row) {

        const code =
            document.getElementById(
                'tanahCode'
            );


        const lokasi =
            document.getElementById(
                'tanahFormLokasi'
            );


        const penggunaan =
            document.getElementById(
                'tanahPenggunaan'
            );


        const luas =
            document.getElementById(
                'tanahLuas'
            );


        const hak =
            document.getElementById(
                'tanahFormHak'
            );


        const tahun =
            document.getElementById(
                'tanahFormTahun'
            );


        const nilai =
            document.getElementById(
                'tanahNilai'
            );


        const status =
            document.getElementById(
                'tanahStatus'
            );


        if (code) {

            code.value =
                row.cells[1]
                    ?.textContent
                    .trim() || '';

        }


        if (lokasi) {

            lokasi.value =
                row.cells[2]
                    ?.textContent
                    .trim() || '';

        }


        if (penggunaan) {

            penggunaan.value =
                row.cells[3]
                    ?.textContent
                    .trim() || '';

        }


        if (luas) {

            luas.value =
                row.dataset.area || '';

        }


        if (hak) {

            hak.value =
                row.dataset.hak ||
                'Hak Pakai';

        }


        if (tahun) {

            tahun.value =
                row.dataset.tahun || '';

        }


        if (nilai) {

            nilai.value =
                row.dataset.value || '';

        }


        if (status) {

            status.value =
                row.cells[8]
                    ?.textContent
                    .trim() ||
                'Aktif';

        }

    }


    /* ==========================================================
       CLOSE MODAL
    ========================================================== */

    function closeTanahModal() {

        const modal =
            document.getElementById(
                'tanahModal'
            );


        modal?.close();

    }


    /* ==========================================================
       SAVE TANAH
    ========================================================== */

    function saveTanah(event) {

        event.preventDefault();


        /*
         * VIEW MODE tidak boleh menyimpan.
         */

        if (modalMode === 'view') {

            return;

        }


        /* ======================================================
           DELETE
        ====================================================== */

        if (modalMode === 'delete') {

            if (editingRow) {

                editingRow.remove();

                document.body.dataset.tanahLocalCrud =
                    '1';


                closeTanahModal();


                currentPage = 1;


                renderTable();

            }

            return;

        }


        /* ======================================================
           GET FORM VALUE
        ====================================================== */

        const code =
            document
                .getElementById(
                    'tanahCode'
                )
                .value
                .trim();


        const lokasi =
            document
                .getElementById(
                    'tanahFormLokasi'
                )
                .value
                .trim();


        const penggunaan =
            document
                .getElementById(
                    'tanahPenggunaan'
                )
                .value
                .trim();


        const area =
            Number(
                document
                    .getElementById(
                        'tanahLuas'
                    )
                    .value || 0
            );


        const hak =
            document
                .getElementById(
                    'tanahFormHak'
                )
                .value;


        const tahun =
            document
                .getElementById(
                    'tanahFormTahun'
                )
                .value;


        const value =
            Number(
                document
                    .getElementById(
                        'tanahNilai'
                    )
                    .value || 0
            );


        const status =
            document
                .getElementById(
                    'tanahStatus'
                )
                .value;


        /* ======================================================
           VALIDATION
        ====================================================== */

        if (
            !code ||
            !lokasi ||
            !penggunaan ||
            !area ||
            !tahun ||
            value < 0
        ) {

            return;

        }


        /* ======================================================
           UPDATE
        ====================================================== */

        if (editingRow) {

            updateRow(
                editingRow,
                {
                    code,
                    lokasi,
                    penggunaan,
                    area,
                    hak,
                    tahun,
                    value,
                    status
                }
            );

        }

        /* ======================================================
           CREATE
        ====================================================== */

        else {

            createRow(
                {
                    code,
                    lokasi,
                    penggunaan,
                    area,
                    hak,
                    tahun,
                    value,
                    status
                }
            );

        }


        /*
         * Tandai bahwa data sudah mengalami
         * perubahan lokal.
         */

        document.body.dataset.tanahLocalCrud =
            '1';


        closeTanahModal();


        currentPage = 1;


        renderTable();

    }


    /* ==========================================================
       UPDATE ROW
    ========================================================== */

    function updateRow(
        row,
        data
    ) {

        /* ======================================================
           UPDATE DATA ATTRIBUTE
        ====================================================== */

        row.dataset.lokasi =
            data.lokasi;


        row.dataset.hak =
            data.hak;


        row.dataset.tahun =
            data.tahun;


        row.dataset.area =
            data.area;


        row.dataset.value =
            data.value;


        /* ======================================================
           UPDATE TABLE CELL
        ====================================================== */

        row.cells[1].textContent =
            data.code;


        row.cells[2].textContent =
            data.lokasi;


        row.cells[3].textContent =
            data.penggunaan;


        row.cells[4].textContent =
            `${number.format(
                data.area
            )} m²`;


        row.cells[5].textContent =
            data.hak;


        row.cells[6].textContent =
            data.tahun;


        row.cells[7].textContent =
            rupiah.format(
                data.value
            );


        row.cells[8].innerHTML = `
            <span class="tanah-status ${statusClass(data.status)}">
                ${escapeHtml(data.status)}
            </span>
        `;


        refreshIcons();

    }


    /* ==========================================================
       CREATE ROW
    ========================================================== */

    function createRow(data) {

        const tbody =
            document.getElementById(
                'tanahTableBody'
            );


        const empty =
            document.getElementById(
                'tanahEmptyRow'
            );


        if (!tbody) {
            return;
        }


        const row =
            document.createElement(
                'tr'
            );


        row.dataset.record =
            '';


        row.dataset.lokasi =
            data.lokasi;


        row.dataset.hak =
            data.hak;


        row.dataset.tahun =
            data.tahun;


        row.dataset.area =
            data.area;


        row.dataset.value =
            data.value;


        row.innerHTML = `

            <td></td>

            <td class="tanah-code">
                ${escapeHtml(data.code)}
            </td>

            <td>
                ${escapeHtml(data.lokasi)}
            </td>

            <td>
                ${escapeHtml(data.penggunaan)}
            </td>

            <td>
                ${number.format(data.area)} m²
            </td>

            <td>
                ${escapeHtml(data.hak)}
            </td>

            <td>
                ${escapeHtml(data.tahun)}
            </td>

            <td>
                ${rupiah.format(data.value)}
            </td>

            <td>
                <span class="tanah-status ${statusClass(data.status)}">
                    ${escapeHtml(data.status)}
                </span>
            </td>

            <td>

                <div class="tanah-actions">

                    <button
                        type="button"
                        class="view"
                        data-action="view"
                        title="Lihat"
                    >
                        <i data-lucide="eye"></i>
                    </button>


                    <button
                        type="button"
                        class="edit"
                        data-action="edit"
                        title="Edit"
                    >
                        <i data-lucide="square-pen"></i>
                    </button>


                    <button
                        type="button"
                        class="delete"
                        data-action="delete"
                        title="Hapus"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>

                </div>

            </td>
        `;


        /*
         * Masukkan row sebelum empty state.
         */

        if (empty) {

            tbody.insertBefore(
                row,
                empty
            );

        } else {

            tbody.appendChild(
                row
            );

        }


        refreshIcons();

    }


    /* ==========================================================
       STATUS CLASS
    ========================================================== */

    function statusClass(status) {

        if (
            status === 'Verifikasi'
        ) {

            return 'review';

        }


        if (
            status === 'Draft'
        ) {

            return 'draft';

        }


        return 'active';

    }


    /* ==========================================================
       ESCAPE HTML
    ========================================================== */

    function escapeHtml(value) {

        const div =
            document.createElement(
                'div'
            );


        div.textContent =
            String(
                value ?? ''
            );


        return div.innerHTML;

    }


    /* ==========================================================
       EXPORT CSV
    ========================================================== */

    function exportTanahCSV() {

        const rows =
            getFilteredRows();


        const header = [

            'No',

            'Kode Tanah',

            'Lokasi',

            'Penggunaan / Letak',

            'Luas',

            'Hak',

            'Tahun',

            'Nilai',

            'Status'

        ];


        const data = [
            header
        ];


        rows.forEach(
            (row, index) => {

                data.push([

                    index + 1,

                    row.cells[1]
                        ?.textContent
                        .trim() || '',

                    row.cells[2]
                        ?.textContent
                        .trim() || '',

                    row.cells[3]
                        ?.textContent
                        .trim() || '',

                    row.cells[4]
                        ?.textContent
                        .trim() || '',

                    row.cells[5]
                        ?.textContent
                        .trim() || '',

                    row.cells[6]
                        ?.textContent
                        .trim() || '',

                    row.cells[7]
                        ?.textContent
                        .trim() || '',

                    row.cells[8]
                        ?.textContent
                        .trim() || ''

                ]);

            }
        );


        /* ======================================================
           BUILD CSV
        ====================================================== */

        const csv =
            data
                .map(row => {

                    return row
                        .map(value => {

                            let v =
                                String(
                                    value ?? ''
                                );


                            /*
                             * CSV Injection protection.
                             */

                            if (
                                /^[=+@-]/.test(v)
                            ) {

                                v =
                                    `'${v}`;

                            }


                            return `"${v.replace(
                                /"/g,
                                '""'
                            )}"`;

                        })
                        .join(',');

                })
                .join('\r\n');


        /* ======================================================
           DOWNLOAD
        ====================================================== */

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
            'data-tanah.csv';


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );

    }


    /* ==========================================================
       LUCIDE ICON
    ========================================================== */

    function refreshIcons() {

        if (
            window.lucide &&
            typeof window.lucide.createIcons ===
                'function'
        ) {

            window.lucide.createIcons();

        }

    }


    /* ==========================================================
       GLOBAL FUNCTION
       Dipakai oleh tombol onclick pada Blade.
    ========================================================== */

    window.openTanahModal =
        openTanahModal;


    window.closeTanahModal =
        closeTanahModal;


    window.filterTanahTable =
        filterTanahTable;


    window.resetTanahFilter =
        resetTanahFilter;


    window.exportTanahCSV =
        exportTanahCSV;


})();