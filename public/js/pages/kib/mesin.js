
/**
 * ============================================================================
 * K.I.B B — PERALATAN DAN MESIN
 * ============================================================================
 *
 * Modul:
 * 01. Helper dan modal
 * 02. Pencarian dan pagination
 * 03. Export CSV
 * 04. Pending Nilai Aset
 * 05. Tombol Pilih / autofill
 * 06. Tambah dan edit
 * 07. Detail lokasi
 * 08. Hapus
 *
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const root = document.getElementById('mesinPage');

    if (!root || root.dataset.mesinInitialized === '1') {
        return;
    }

    root.dataset.mesinInitialized = '1';

    /*
    |--------------------------------------------------------------------------
    | 01. HELPER
    |--------------------------------------------------------------------------
    */

    const $ = (selector, parent = root) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = root) =>
        Array.from(parent.querySelectorAll(selector));

    const formatter = new Intl.NumberFormat('id-ID');

    const money = value =>
        `Rp ${formatter.format(Number(value) || 0)}`;

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

    const detailUrl = id =>
        `${root.dataset.detailBase}/${encodeURIComponent(id)}`;

    const fileUrl = (id, type) =>
        `${recordUrl(id)}/file/${type}`;

    const formDialog = $('#mesinFormDialog');
    const detailDialog = $('#mesinDetailDialog');

    const form = $('#mesinForm');
    const sourceId = $('#mesinNilaiId');

    const pendingBody = $('#mesinPendingBody');
    const pendingSearch = $('#mesinPendingSearch');

    const mainSearch = $('#mesinSearch');
    const pageSize = $('#mesinPageSize');

    const mainRows = $$('.mesin-data-row');

    let pendingItems = [];
    let selectedSource = null;
    let currentPage = 1;


    /*
    |--------------------------------------------------------------------------
    | HELPER REQUEST JSON
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
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success === false) {
            throw new Error(
                data.message || 'Permintaan gagal.'
            );
        }

        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | HELPER MODAL
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
            const target = $(`#${button.dataset.close}`);

            closeDialog(target);
        });
    });

    [formDialog, detailDialog].forEach(dialog => {
        if (!dialog) return;

        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                closeDialog(dialog);
            }
        });
    });


    /*
    |--------------------------------------------------------------------------
    | 02. PENCARIAN DAN PAGINATION TABEL LOKASI
    |--------------------------------------------------------------------------
    */

    function getFilteredRows() {
        const keyword = mainSearch.value
            .toLowerCase()
            .trim();

        return mainRows.filter(row => {
            const text = row.dataset.search || '';

            return text.includes(keyword);
        });
    }

    function renderMainTable() {
        const rows = getFilteredRows();

        const size = Number(pageSize.value) || 20;

        const totalPages = Math.max(
            1,
            Math.ceil(rows.length / size)
        );

        currentPage = Math.max(
            1,
            Math.min(currentPage, totalPages)
        );

        // Sembunyikan seluruh baris asli.
        mainRows.forEach(row => {
            row.hidden = true;
        });

        // Tampilkan halaman saat ini.
        const startIndex = (currentPage - 1) * size;

        rows
            .slice(startIndex, startIndex + size)
            .forEach((row, index) => {
                row.hidden = false;

                const numberCell = $('.mesin-number', row);

                if (numberCell) {
                    numberCell.textContent =
                        startIndex + index + 1;
                }
            });

        const start = rows.length ? startIndex + 1 : 0;

        const end = Math.min(
            startIndex + size,
            rows.length
        );

        $('#mesinTableInfo').textContent =
            `Menampilkan ${start}–${end} dari ${rows.length} lokasi`;

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        const container = $('#mesinPagination');

        container.replaceChildren();

        const controls = [
            {
                label: '‹',
                page: currentPage - 1,
                disabled: currentPage === 1
            },
            {
                label: String(currentPage),
                page: currentPage,
                disabled: true,
                active: true
            },
            {
                label: `dari ${totalPages}`,
                page: currentPage,
                disabled: true
            },
            {
                label: '›',
                page: currentPage + 1,
                disabled: currentPage === totalPages
            }
        ];

        controls.forEach(item => {
            const button = document.createElement('button');

            button.type = 'button';
            button.textContent = item.label;
            button.disabled = item.disabled;

            if (item.active) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                currentPage = item.page;

                renderMainTable();
            });

            container.appendChild(button);
        });
    }

    mainSearch.addEventListener('input', () => {
        currentPage = 1;

        renderMainTable();
    });

    pageSize.addEventListener('change', () => {
        currentPage = 1;

        renderMainTable();
    });

    $('#mesinReset').addEventListener('click', () => {
        mainSearch.value = '';
        pageSize.value = '20';

        currentPage = 1;

        renderMainTable();
    });


    /*
    |--------------------------------------------------------------------------
    | 03. EXPORT CSV
    |--------------------------------------------------------------------------
    */

    $('#mesinExport').addEventListener('click', () => {
        const rows = [
            [
                'No',
                'Lokasi',
                'Alamat',
                'Jumlah Barang',
                'Nilai'
            ]
        ];

        getFilteredRows().forEach((row, index) => {
            const cells = Array.from(row.cells);

            rows.push([
                index + 1,
                cells[1].innerText.trim(),
                cells[2].innerText.trim(),
                cells[3].innerText.trim(),
                cells[4].innerText.trim()
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
    | 04. AMBIL TRANSAKSI PENDING
    |--------------------------------------------------------------------------
    */

    async function loadPending() {
        pendingBody.innerHTML = `
            <tr>
                <td colspan="9" class="mesin-empty">
                    Memuat transaksi pending...
                </td>
            </tr>
        `;

        try {
            const response = await getJson(
                root.dataset.pendingUrl
            );

            pendingItems = Array.isArray(response.data)
                ? response.data
                : [];

            const count = Number(
                response.count ?? pendingItems.length
            );

            $('#mesinPendingTotal').textContent =
                formatter.format(count);

            $('#mesinPendingLabel').textContent =
                formatter.format(count);

            $('#mesinPendingPill').textContent =
                formatter.format(count);

            renderPending();

        } catch (error) {
            pendingItems = [];

            pendingBody.innerHTML = `
                <tr>
                    <td colspan="9" class="mesin-empty">
                        Data pending gagal dimuat.
                        Periksa endpoint dan permission PostgreSQL.
                    </td>
                </tr>
            `;

            console.error('Pending Mesin:', error);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FILTER DAN RENDER TABEL PENDING
    |--------------------------------------------------------------------------
    */

    function renderPending() {
        const keyword = pendingSearch.value
            .toLowerCase()
            .trim();

        const filtered = pendingItems.filter(item => {
            const text = [
                item.no_voucher,
                item.lokasi,
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
            `${formatter.format(filtered.length)} data ditampilkan`;

        if (!filtered.length) {
            pendingBody.innerHTML = `
                <tr>
                    <td colspan="9" class="mesin-empty">
                        Tidak ada transaksi yang sesuai.
                    </td>
                </tr>
            `;

            return;
        }

        pendingBody.innerHTML = filtered
            .map((item, index) => {
                const jenis = Number(item.jenisn);

                const jenisLabel = jenis === 1
                    ? 'Penambahan Aset'
                    : jenis === 2
                        ? 'Penambahan Nilai (histori)'
                        : 'Jenis lama';

                return `
                    <tr>
                        <td>${index + 1}</td>

                        <td>${escapeHtml(item.no_voucher)}</td>

                        <td>${escapeHtml(item.lokasi)}</td>

                        <td>${escapeHtml(item.departemen)}</td>

                        <td>${escapeHtml(item.divisi)}</td>

                        <td>${jenisLabel}</td>

                        <td>${escapeHtml(item.tahun)}</td>

                        <td>${money(item.nilai)}</td>

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
            })
            .join('');

        refreshIcons();
    }

    pendingSearch.addEventListener('input', renderPending);


    /*
    |--------------------------------------------------------------------------
    | 05. TOMBOL PILIH — AUTOFILL
    |--------------------------------------------------------------------------
    |
    | Yang otomatis terisi:
    | - ID transaksi
    | - Lokasi
    | - Alamat
    | - Departemen
    | - Divisi
    | - No. Voucher
    |
    | Detail barang tetap diisi petugas.
    |
    */

    pendingBody.addEventListener('click', event => {
        const button = event.target.closest('[data-pilih]');

        if (!button) return;

        const source = pendingItems.find(item =>
            Number(item.id) ===
            Number(button.dataset.pilih)
        );

        if (!source) return;

        if (
            !source.id_lokasi
            || !source.dep
            || !source.div
        ) {
            alert(
                'Lokasi, Departemen, atau Divisi pada transaksi Nilai Aset belum lengkap.'
            );

            return;
        }

        selectedSource = source;

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

        // Sembunyikan daftar pending setelah memilih.
        $('#mesinPendingSection').hidden = true;

        // Fokus ke data barang untuk pengisian manual.
        form.querySelector('[name="id_barang"]').focus();
    });


    /*
    |--------------------------------------------------------------------------
    | 06. RESET FORM
    |--------------------------------------------------------------------------
    */

    function resetForm() {
        form.reset();

        selectedSource = null;
        sourceId.value = '';

        $('#mesinMethod').disabled = true;

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
            $(`#${id}`).value = '';
        });

        pendingSearch.value = '';
    }


    /*
    |--------------------------------------------------------------------------
    | OPEN FORM TAMBAH
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
        const isCreate = $('#mesinMethod').disabled;

        if (isCreate && !sourceId.value) {
            event.preventDefault();

            alert('Pilih transaksi Nilai Aset terlebih dahulu.');
        }
    });


    /*
    |--------------------------------------------------------------------------
    | EDIT MESIN
    |--------------------------------------------------------------------------
    */

    async function editMesin(id) {
        try {
            const response = await getJson(
                recordUrl(id)
            );

            const item = response.data;

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
                `Gagal memuat data Mesin: ${error.message}`
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | 07. DETAIL MESIN PER LOKASI
    |--------------------------------------------------------------------------
    */

    async function showDetail(lokasiId) {
        openDialog(detailDialog);

        $('#mesinDetailBody').innerHTML =
            '<p>Memuat data Mesin...</p>';

        try {
            const response = await getJson(
                detailUrl(lokasiId)
            );

            const lokasi = response.lokasi;
            const items = Array.isArray(response.data)
                ? response.data
                : [];

            $('#mesinDetailTitle').textContent =
                lokasi.lokasi || 'Peralatan dan Mesin';

            $('#mesinDetailAddress').textContent =
                lokasi.alamat || '-';

            if (!items.length) {
                $('#mesinDetailBody').innerHTML =
                    '<p>Belum ada barang pada lokasi ini.</p>';

                return;
            }

            $('#mesinDetailBody').innerHTML = items
                .map(item => {
                    const fields = [
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

                    const details = fields
                        .map(([label, value]) => `
                            <div>
                                <dt>${escapeHtml(label)}</dt>
                                <dd>${escapeHtml(value || '-')}</dd>
                            </div>
                        `)
                        .join('');

                    const id = Number(item.id);

                    const dokumen = item.dok
                        && String(item.dok).startsWith(
                            'kib/mesin/dokumen/'
                        )
                        ? `
                            <a
                                class="mesin-button outline small"
                                href="${fileUrl(id, 'dokumen')}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Dokumen
                            </a>
                        `
                        : '';

                    const foto = item.img
                        && String(item.img).startsWith(
                            'kib/mesin/foto/'
                        )
                        ? `
                            <a
                                class="mesin-button outline small"
                                href="${fileUrl(id, 'foto')}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Foto
                            </a>
                        `
                        : '';

                    return `
                        <article class="mesin-detail-card">

                            <div class="mesin-detail-head">

                                <div>
                                    <h3>
                                        ${escapeHtml(item.nama_barang || 'Barang')}
                                    </h3>

                                    <small>
                                        Kode: ${escapeHtml(item.kode)}
                                        · Register: ${escapeHtml(item.reg)}
                                    </small>
                                </div>

                                <strong>
                                    ${money(item.harga)}
                                </strong>

                            </div>

                            <dl class="mesin-detail-grid">
                                ${details}
                            </dl>

                            <div class="mesin-detail-actions">

                                ${dokumen}

                                ${foto}

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
                `Gagal memuat detail: ${error.message}`;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | BUKA DETAIL DARI TABEL
    |--------------------------------------------------------------------------
    */

    $('#mesinTable').addEventListener('click', event => {
        const button = event.target.closest('[data-lokasi]');

        if (!button) return;

        showDetail(button.dataset.lokasi);
    });


    /*
    |--------------------------------------------------------------------------
    | 08. EDIT / HAPUS DARI MODAL DETAIL
    |--------------------------------------------------------------------------
    */

    $('#mesinDetailBody').addEventListener('click', event => {
        const editButton = event.target.closest('[data-edit]');
        const deleteButton = event.target.closest('[data-delete]');

        if (editButton) {
            editMesin(editButton.dataset.edit);
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
    | 09. INITIALIZATION
    |--------------------------------------------------------------------------
    */

    renderMainTable();

    refreshIcons();

    loadPending();

    if ($('.mesin-notice.error')) {
        openCreate();
    }
});
