
/**
 * ============================================================================
 * K.I.B B — PERALATAN DAN MESIN
 * ============================================================================
 *
 * 01. Helper
 * 02. Pencarian dan pagination
 * 03. Export CSV
 * 04. Pending Nilai Aset
 * 05. Autofill tombol Pilih
 * 06. Tambah dan edit
 * 07. Rincian nilai mesin
 * 08. Detail inventaris mesin
 * 09. Hapus barang
 *
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const root = document.getElementById('mesinPage');

    if (!root || root.dataset.initialized === '1') {
        return;
    }

    root.dataset.initialized = '1';

    /*
    |--------------------------------------------------------------------------
    | 01. HELPER
    |--------------------------------------------------------------------------
    */

    const $ = (selector, scope = root) =>
        scope.querySelector(selector);

    const $$ = (selector, scope = root) =>
        Array.from(scope.querySelectorAll(selector));

    const number = new Intl.NumberFormat('id-ID');

    const money = value =>
        `Rp ${number.format(Number(value) || 0)}`;

    const escapeHtml = value =>
        String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);

    const refreshIcons = () => {
        window.lucide?.createIcons?.();
    };

    const recordUrl = id =>
        `${root.dataset.recordBase}/${encodeURIComponent(id)}`;

    const locationUrl = id =>
        `${root.dataset.detailBase}/${encodeURIComponent(id)}`;

    const nilaiUrl = id =>
        `${locationUrl(id)}/nilai`;

    /*
    |--------------------------------------------------------------------------
    | REFERENSI ELEMEN
    |--------------------------------------------------------------------------
    */

    const formDialog = $('#mesinFormDialog');
    const detailDialog = $('#mesinDetailDialog');
    const nilaiDialog = $('#mesinNilaiDialog');

    const form = $('#mesinForm');
    const sourceId = $('#mesinNilaiId');

    const pendingBody = $('#mesinPendingBody');
    const pendingSearch = $('#mesinPendingSearch');

    const mainSearch = $('#mesinSearch');
    const pageSize = $('#mesinPageSize');

    const tableRows = $$('.mesin-data-row');

    let pendingSources = [];
    let currentPage = 1;

    /*
    |--------------------------------------------------------------------------
    | REQUEST DATA JSON
    |--------------------------------------------------------------------------
    */

    async function getJson(url) {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'same-origin',

            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const result = await response.json();

        if (result.success === false) {
            throw new Error(
                result.message || 'Permintaan gagal.'
            );
        }

        return result;
    }

    /*
    |--------------------------------------------------------------------------
    | MODAL
    |--------------------------------------------------------------------------
    */

    function openDialog(dialog) {
        if (!dialog) return;

        if (!dialog.open) {
            dialog.showModal();
        }

        refreshIcons();
    }

    function closeDialog(dialog) {
        if (dialog?.open) {
            dialog.close();
        }
    }

    $$('[data-close]').forEach(button => {
        button.addEventListener('click', () => {
            const dialog = $(
                `#${button.dataset.close}`
            );

            closeDialog(dialog);
        });
    });

    [formDialog, detailDialog, nilaiDialog].forEach(dialog => {
        dialog?.addEventListener('click', event => {
            if (event.target === dialog) {
                closeDialog(dialog);
            }
        });
    });

    /*
    |--------------------------------------------------------------------------
    | 02. PENCARIAN DAN PAGINATION
    |--------------------------------------------------------------------------
    */

    function filteredTableRows() {
        const keyword = mainSearch.value
            .trim()
            .toLowerCase();

        return tableRows.filter(row =>
            (row.dataset.search || '').includes(keyword)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATION - NOMOR HALAMAN SEPERTI K.I.B TANAH
    |
    | Perubahan hanya pada tampilan tombol pagination.
    | Filter, jumlah data, dan pergantian baris tetap sama.
    |--------------------------------------------------------------------------
    */

    function renderPagination(totalPages) {
        const container = $('#mesinPagination');

        container.replaceChildren();

        // Tidak perlu tombol saat hanya satu halaman.
        if (totalPages < 2) {
            return;
        }

        function appendButton(
            label,
            targetPage,
            disabled = false
        ) {
            const button = document.createElement('button');

            const active =
                targetPage === currentPage &&
                /^\d+$/.test(label);

            button.type = 'button';
            button.textContent = label;
            button.disabled = disabled;

            button.classList.toggle('active', active);

            if (active) {
                button.setAttribute(
                    'aria-current',
                    'page'
                );
            }

            if (label === '‹') {
                button.setAttribute(
                    'aria-label',
                    'Halaman sebelumnya'
                );
            } else if (label === '›') {
                button.setAttribute(
                    'aria-label',
                    'Halaman berikutnya'
                );
            } else {
                button.setAttribute(
                    'aria-label',
                    `Halaman ${label}`
                );
            }

            button.addEventListener('click', () => {
                currentPage = targetPage;
                renderTable();
            });

            container.appendChild(button);
        }

        function appendEllipsis() {
            const span = document.createElement('span');

            span.className = 'mesin-page-ellipsis';
            span.textContent = '…';

            span.setAttribute(
                'aria-hidden',
                'true'
            );

            container.appendChild(span);
        }

        // Halaman sebelumnya.
        appendButton(
            '‹',
            currentPage - 1,
            currentPage === 1
        );

        // Selalu tampilkan halaman pertama dan terakhir.
        const visiblePages = new Set([
            1,
            totalPages
        ]);

        // Tampilkan dua halaman sebelum dan sesudah.
        for (
            let page = Math.max(1, currentPage - 2);
            page <= Math.min(
                totalPages,
                currentPage + 2
            );
            page++
        ) {
            visiblePages.add(page);
        }

        const orderedPages = [...visiblePages]
            .sort((a, b) => a - b);

        let previousPage = 0;

        orderedPages.forEach(page => {
            if (
                previousPage !== 0 &&
                page - previousPage > 1
            ) {
                appendEllipsis();
            }

            appendButton(
                String(page),
                page
            );

            previousPage = page;
        });

        // Halaman berikutnya.
        appendButton(
            '›',
            currentPage + 1,
            currentPage >= totalPages
        );
    }

    function renderTable() {
        const rows = filteredTableRows();

        const size = Number(pageSize.value) || 20;

        const totalPages = Math.max(
            1,
            Math.ceil(rows.length / size)
        );

        currentPage = Math.min(
            Math.max(currentPage, 1),
            totalPages
        );

        const startIndex = (
            currentPage - 1
        ) * size;

        tableRows.forEach(row => {
            row.hidden = true;
        });

        rows
            .slice(startIndex, startIndex + size)
            .forEach((row, index) => {
                row.hidden = false;

                const numberCell = $(
                    '.mesin-number',
                    row
                );

                if (numberCell) {
                    numberCell.textContent =
                        startIndex + index + 1;
                }
            });

        const start = rows.length
            ? startIndex + 1
            : 0;

        const end = Math.min(
            startIndex + size,
            rows.length
        );

        $('#mesinTableInfo').textContent =
            `Menampilkan ${start}–${end} dari ${rows.length} lokasi`;

        renderPagination(totalPages);
    }

    mainSearch.addEventListener('input', () => {
        currentPage = 1;
        renderTable();
    });

    pageSize.addEventListener('change', () => {
        currentPage = 1;
        renderTable();
    });

    $('#mesinReset').addEventListener('click', () => {
        mainSearch.value = '';
        pageSize.value = '20';

        currentPage = 1;
        renderTable();
    });

    /*
    |--------------------------------------------------------------------------
    | 03. EXPORT CSV
    |--------------------------------------------------------------------------
    */

    $('#mesinExport').addEventListener('click', () => {
        const rows = [[
            'No',
            'Lokasi',
            'Alamat',
            'Jumlah Barang',
            'Nilai'
        ]];

        filteredTableRows().forEach((row, index) => {
            const cells = Array.from(row.cells);

            rows.push([
                index + 1,
                cells[1]?.innerText.trim() || '',
                cells[2]?.innerText.trim() || '',
                cells[3]?.innerText.trim() || '',
                cells[4]?.innerText.trim() || ''
            ]);
        });

        const csv = '\uFEFF' + rows
            .map(values =>
                values
                    .map(value =>
                        `"${String(value).replaceAll('"', '""')}"`
                    )
                    .join(';')
            )
            .join('\r\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'kib-peralatan-mesin.csv';

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });

    /*
    |--------------------------------------------------------------------------
    | 04. LOAD PENDING NILAI ASET
    |--------------------------------------------------------------------------
    */

    async function loadPending() {
        pendingBody.innerHTML = `
            <tr>
                <td colspan="9" class="mesin-empty">
                    Memuat data pending...
                </td>
            </tr>
        `;

        try {
            const result = await getJson(
                root.dataset.pendingUrl
            );

            pendingSources = Array.isArray(result.data)
                ? result.data
                : [];

            const total = Math.max(
                0,
                Number(result.count ?? pendingSources.length)
            );

            $('#mesinPendingTotal').textContent =
                number.format(total);

            $('#mesinPendingLabel').textContent =
                number.format(total);

            $('#mesinPendingPill').textContent =
                number.format(total);

            renderPending();

        } catch (error) {
            console.error(
                'Gagal mengambil data pending Mesin:',
                error
            );

            pendingSources = [];

            pendingBody.innerHTML = `
                <tr>
                    <td colspan="9" class="mesin-empty">
                        Gagal memuat data pending.
                        Periksa route dan log Laravel.
                    </td>
                </tr>
            `;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FILTER DATA PENDING
    |--------------------------------------------------------------------------
    */

    function renderPending() {
        const keyword = pendingSearch.value
            .trim()
            .toLowerCase();

        const rows = pendingSources.filter(item => {
            const text = [
                item.no_voucher,
                item.lokasi,
                item.alamat,
                item.departemen,
                item.divisi,
                item.tahun,
                item.urai
            ]
                .join(' ')
                .toLowerCase();

            return text.includes(keyword);
        });

        $('#mesinPendingCountText').textContent =
            `${number.format(rows.length)} data ditampilkan`;

        if (!rows.length) {
            pendingBody.innerHTML = `
                <tr>
                    <td colspan="9" class="mesin-empty">
                        Tidak ada transaksi yang sesuai.
                    </td>
                </tr>
            `;

            return;
        }

        pendingBody.innerHTML = rows.map((item, index) => {
            const jenis = Number(item.jenisn);

            const jenisLabel = jenis === 1
                ? 'Penambahan Aset'
                : jenis === 2
                    ? 'Penambahan Nilai (historis)'
                    : 'Jenis lainnya';

            return `
                <tr>
                    <td>${index + 1}</td>

                    <td>
                        <strong>${escapeHtml(item.no_voucher)}</strong>
                    </td>

                    <td>${escapeHtml(item.lokasi)}</td>

                    <td>${escapeHtml(item.departemen)}</td>

                    <td>${escapeHtml(item.divisi)}</td>

                    <td>${escapeHtml(jenisLabel)}</td>

                    <td>${escapeHtml(item.tahun)}</td>

                    <td>
                        <strong>${money(item.nilai)}</strong>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="mesin-button primary small"
                            data-pilih="${Number(item.id)}"
                        >
                            Pilih
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        refreshIcons();
    }

    pendingSearch.addEventListener(
        'input',
        renderPending
    );

    /*
    |--------------------------------------------------------------------------
    | 05. TOMBOL PILIH — AUTOFILL
    |--------------------------------------------------------------------------
    */

    pendingBody.addEventListener('click', event => {
        const button = event.target.closest('[data-pilih]');

        if (!button) return;

        const source = pendingSources.find(item =>
            Number(item.id) ===
            Number(button.dataset.pilih)
        );

        if (!source) return;

        if (
            !source.id_lokasi ||
            !source.dep ||
            !source.div
        ) {
            alert(
                'Lokasi, Departemen, atau Divisi belum lengkap pada transaksi sumber.'
            );

            return;
        }

        sourceId.value = source.id;

        $('#mesinLokasiLabel').value =
            source.lokasi || '';

        $('#mesinAlamatLabel').value =
            source.alamat || '';

        $('#mesinDepartemenLabel').value =
            source.departemen || '';

        $('#mesinDivisiLabel').value =
            source.divisi || '';

        $('#mesinVoucherLabel').value =
            source.no_voucher || '';

        $('#mesinPendingSection').hidden = true;

        form.querySelector('[name="id_barang"]')?.focus();
    });

    /*
    |--------------------------------------------------------------------------
    | 06. RESET FORM
    |--------------------------------------------------------------------------
    */

    function resetForm() {
        form.reset();

        sourceId.value = '';

        $('#mesinMethod').disabled = true;
        $('#mesinMethod').value = 'PUT';

        form.action = root.dataset.storeUrl;

        $('#mesinPendingSection').hidden = false;

        $('#mesinFormTitle').textContent =
            'Tambah Data Mesin';

        [
            'mesinLokasiLabel',
            'mesinAlamatLabel',
            'mesinDepartemenLabel',
            'mesinDivisiLabel',
            'mesinVoucherLabel'
        ].forEach(id => {
            const field = $(`#${id}`);

            if (field) field.value = '';
        });

        pendingSearch.value = '';
    }

    /*
    |--------------------------------------------------------------------------
    | BUKA TAMBAH DATA
    |--------------------------------------------------------------------------
    */

    async function openCreate() {
        resetForm();

        openDialog(formDialog);

        await loadPending();
    }

    $('#mesinAddButton').addEventListener(
        'click',
        openCreate
    );

    $('#mesinOpenPending').addEventListener(
        'click',
        openCreate
    );

    /*
    |--------------------------------------------------------------------------
    | VALIDASI SUBMIT
    |--------------------------------------------------------------------------
    */

    form.addEventListener('submit', event => {
        const creating = $('#mesinMethod').disabled;

        if (creating && !sourceId.value) {
            event.preventDefault();

            alert(
                'Pilih transaksi Nilai Aset terlebih dahulu.'
            );
        }
    });

    /*
    |--------------------------------------------------------------------------
    | EDIT BARANG MESIN
    |--------------------------------------------------------------------------
    */

    async function editMesin(id) {
        try {
            const result = await getJson(
                recordUrl(id)
            );

            const item = result.data;

            resetForm();

            $('#mesinMethod').disabled = false;
            $('#mesinMethod').value = 'PUT';

            form.action = recordUrl(id);

            $('#mesinPendingSection').hidden = true;

            $('#mesinFormTitle').textContent =
                `Edit Data Mesin #${id}`;

            $('#mesinLokasiLabel').value =
                item.lokasi || '';

            $('#mesinAlamatLabel').value =
                item.alamat || '';

            $('#mesinDepartemenLabel').value =
                item.departemen || '';

            $('#mesinDivisiLabel').value =
                item.divisi || '';

            $('#mesinVoucherLabel').value = '';

            const fields = [
                'id_barang',
                'kode',
                'reg',
                'tahun',
                'harga',
                'susut',
                'bahan',
                'asal',
                'ukuran',
                'merk',
                'pabrik',
                'rangka',
                'polisi',
                'bpkb',
                'guna',
                'fungsi',
                'struktur',
                'kondisi',
                'ket'
            ];

            fields.forEach(name => {
                const field = form.elements.namedItem(name);

                if (field) {
                    field.value = item[name] ?? '';
                }
            });

            form.elements.namedItem('nomor_mesin').value =
                item.mesin ?? '';

            closeDialog(detailDialog);
            openDialog(formDialog);

        } catch (error) {
            alert(
                `Gagal membuka edit Mesin: ${error.message}`
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | 07. RINCIAN NILAI MESIN
    |--------------------------------------------------------------------------
    */

    async function showNilaiMesin(
        lokasiId,
        lokasiName = ''
    ) {
        openDialog(nilaiDialog);

        $('#mesinNilaiTitle').textContent =
            `Rincian Nilai Mesin — ${lokasiName || 'Lokasi'}`;

        $('#mesinNilaiSubtitle').textContent =
            'Memuat riwayat transaksi...';

        $('#mesinNilaiTotal').textContent = 'Rp 0';

        $('#mesinNilaiCount').textContent = '0 transaksi';

        $('#mesinNilaiBody').innerHTML = `
            <tr>
                <td colspan="8" class="mesin-empty">
                    Memuat rincian nilai...
                </td>
            </tr>
        `;

        try {
            const result = await getJson(
                nilaiUrl(lokasiId)
            );

            const rows = Array.isArray(result.data)
                ? result.data
                : [];

            $('#mesinNilaiTitle').textContent =
                `Rincian Nilai Mesin — ${
                    result.lokasi?.nama || lokasiName
                }`;

            $('#mesinNilaiSubtitle').textContent =
                result.lokasi?.alamat || '-';

            $('#mesinNilaiTotal').textContent =
                money(result.total);

            $('#mesinNilaiCount').textContent =
                `${number.format(result.count ?? rows.length)} transaksi`;

            if (!rows.length) {
                $('#mesinNilaiBody').innerHTML = `
                    <tr>
                        <td colspan="8" class="mesin-empty">
                            Tidak ada transaksi nilai pada lokasi ini.
                        </td>
                    </tr>
                `;

                return;
            }

            $('#mesinNilaiBody').innerHTML = rows
                .map((item, index) => {
                    const jenis = Number(item.jenisn);

                    const label = jenis === 1
                        ? 'Penambahan Aset'
                        : jenis === 2
                            ? 'Penambahan Nilai'
                            : 'Jenis lainnya';

                    return `
                        <tr>
                            <td>${index + 1}</td>

                            <td>
                                <strong>
                                    ${escapeHtml(item.no_voucher || '-')}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(item.tgl_voucher || '-')}
                            </td>

                            <td>
                                ${escapeHtml(item.tahun || '-')}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(item.kode_aktiva || '-')}
                                </strong>

                                <small>
                                    ${escapeHtml(item.nama_aktiva || '')}
                                </small>
                            </td>

                            <td class="mesin-nilai-uraian">
                                ${escapeHtml(item.urai || '-')}
                            </td>

                            <td>${escapeHtml(label)}</td>

                            <td>
                                <strong class="mesin-currency">
                                    ${money(item.nilai)}
                                </strong>
                            </td>
                        </tr>
                    `;
                })
                .join('');

        } catch (error) {
            console.error(
                'Rincian nilai Mesin:',
                error
            );

            $('#mesinNilaiBody').innerHTML = `
                <tr>
                    <td colspan="8" class="mesin-empty">
                        Gagal mengambil rincian nilai Mesin.
                        Periksa route dan log Laravel.
                    </td>
                </tr>
            `;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | 08. DETAIL INVENTARIS PER LOKASI
    |--------------------------------------------------------------------------
    */

    async function showDetail(lokasiId) {
        openDialog(detailDialog);

        $('#mesinDetailBody').innerHTML =
            '<p>Memuat data inventaris...</p>';

        try {
            const result = await getJson(
                locationUrl(lokasiId)
            );

            const location = result.lokasi || {};

            const items = Array.isArray(result.data)
                ? result.data
                : [];

            $('#mesinDetailTitle').textContent =
                location.lokasi || 'Peralatan dan Mesin';

            $('#mesinDetailAddress').textContent =
                location.alamat || '-';

            if (!items.length) {
                $('#mesinDetailBody').innerHTML =
                    '<p>Belum ada data barang di lokasi ini.</p>';

                return;
            }

            $('#mesinDetailBody').innerHTML = items
                .map(item => {
                    const details = [
                        ['Merk / Tipe', item.merk],
                        ['Tahun', item.tahun],
                        ['Departemen', item.departemen],
                        ['Divisi', item.divisi],
                        ['Penggunaan', item.guna],
                        ['Fungsi', item.fungsi],
                        ['Bahan', item.bahan],
                        ['Asal', item.asal],
                        ['Ukuran', item.ukuran],
                        ['Kondisi', item.kondisi],
                        ['No. Mesin', item.mesin],
                        ['No. Rangka', item.rangka],
                        ['No. Polisi', item.polisi],
                        ['No. BPKB', item.bpkb],
                        ['Keterangan', item.ket]
                    ];

                    const detailHtml = details
                        .map(([label, value]) => `
                            <div>
                                <dt>${escapeHtml(label)}</dt>
                                <dd>${escapeHtml(value || '-')}</dd>
                            </div>
                        `)
                        .join('');

                    const id = Number(item.id);

                    const fileLink = (type, label) => `
                        <a
                            class="mesin-button outline small"
                            href="${recordUrl(id)}/file/${type}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ${label}
                        </a>
                    `;

                    const documentLink = String(item.dok || '')
                        .startsWith('kib/mesin/dokumen/')
                        ? fileLink('dokumen', 'Dokumen')
                        : '';

                    const photoLink = String(item.img || '')
                        .startsWith('kib/mesin/foto/')
                        ? fileLink('foto', 'Foto')
                        : '';

                    return `
                        <article class="mesin-detail-card">

                            <div class="mesin-detail-head">
                                <div>
                                    <h3>
                                        ${escapeHtml(
                                            item.nama_barang || 'Barang'
                                        )}
                                    </h3>

                                    <small>
                                        Kode:
                                        ${escapeHtml(item.kode || '-')}

                                        · Register:
                                        ${escapeHtml(item.reg || '-')}
                                    </small>
                                </div>

                                <strong>
                                    ${money(item.harga)}
                                </strong>
                            </div>

                            <dl class="mesin-detail-grid">
                                ${detailHtml}
                            </dl>

                            <div class="mesin-detail-actions">

                                ${documentLink}
                                ${photoLink}

                                <button
                                    type="button"
                                    class="mesin-button outline small"
                                    data-edit="${id}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="mesin-button danger small"
                                    data-delete="${id}"
                                >
                                    Hapus
                                </button>

                            </div>

                        </article>
                    `;
                })
                .join('');

            refreshIcons();

        } catch (error) {
            $('#mesinDetailBody').textContent =
                `Gagal mengambil detail: ${error.message}`;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | 09. EVENT TOMBOL PADA TABEL UTAMA
    |--------------------------------------------------------------------------
    */

    $('#mesinTable').addEventListener('click', event => {
        const nilaiButton = event.target.closest(
            '[data-nilai-lokasi]'
        );

        if (nilaiButton) {
            showNilaiMesin(
                nilaiButton.dataset.nilaiLokasi,
                nilaiButton.dataset.nilaiNama
            );

            return;
        }

        const detailButton = event.target.closest(
            '[data-lokasi]'
        );

        if (detailButton) {
            showDetail(
                detailButton.dataset.lokasi
            );
        }
    });

    /*
    |--------------------------------------------------------------------------
    | EVENT EDIT DAN HAPUS
    |--------------------------------------------------------------------------
    */

    $('#mesinDetailBody').addEventListener('click', event => {
        const editButton = event.target.closest(
            '[data-edit]'
        );

        const deleteButton = event.target.closest(
            '[data-delete]'
        );

        if (editButton) {
            editMesin(
                editButton.dataset.edit
            );

            return;
        }

        if (deleteButton) {
            const confirmed = confirm(
                'Yakin ingin menghapus data Mesin ini?'
            );

            if (!confirmed) return;

            const deleteForm = $('#mesinDeleteForm');

            deleteForm.action = recordUrl(
                deleteButton.dataset.delete
            );

            deleteForm.submit();
        }
    });

    /*
    |--------------------------------------------------------------------------
    | INITIALIZATION
    |--------------------------------------------------------------------------
    */

    renderTable();
    refreshIcons();
    loadPending();

    if ($('.mesin-notice.error')) {
        openCreate();
    }
});
