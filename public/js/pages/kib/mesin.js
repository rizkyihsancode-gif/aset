
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const root = document.getElementById('mesinPage');

    if (!root || root.dataset.initialized === '1') return;
    root.dataset.initialized = '1';

    // ==========================================
    // HELPER
    // ==========================================

    const $ = (selector, scope = root) =>
        scope.querySelector(selector);

    const $$ = (selector, scope = root) =>
        [...scope.querySelectorAll(selector)];

    const formatter = new Intl.NumberFormat('id-ID');

    const money = value =>
        `Rp ${formatter.format(Number(value) || 0)}`;

    const escapeHtml = value =>
        String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);

    const refreshIcons = () => {
        window.lucide?.createIcons?.();
    };

    const recordUrl = id =>
        `${root.dataset.recordBase}/${encodeURIComponent(id)}`;

    const locationUrl = id =>
        `${root.dataset.detailBase}/${encodeURIComponent(id)}`;

    const nilaiUrl = id =>
        `${locationUrl(id)}/nilai`;

    // ==========================================
    // ELEMENT
    // ==========================================

   
const formDialog = $('#mesinFormDialog');
const detailDialog = $('#mesinDetailDialog');
const nilaiDialog = $('#mesinNilaiDialog');

// Modal dokumen PDF per lokasi
const pdfDialog = $('#mesinPdfDialog');


    const form = $('#mesinForm');
    const sourceId = $('#mesinNilaiId');

    const selectedCard = $('#mesinSelectedSource');
    const pendingBody = $('#mesinPendingBody');
    const pendingSearch = $('#mesinPendingSearch');

    const mainSearch = $('#mesinSearch');
    const pageSize = $('#mesinPageSize');

    const tableRows = $$('.mesin-data-row');

    let pendingSources = [];
    let currentPage = 1;

    // ID voucher yang sedang dipilih.
    let selectedSourceId = null;

    // ==========================================
    // DETAIL TANGGAL DAN JENIS VOUCHER
    // ==========================================

    function voucherDate(value) {
        if (!value) return '—';

        const date = String(value).slice(0, 10);

        const match =
            /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

        return match
            ? `${match[3]}/${match[2]}/${match[1]}`
            : date;
    }

    function selectedJenis(item) {
        const jenis = Number(item.jenisn);

        if (jenis === 1) return 'Penambahan Aset';

        if (jenis === 2) {
            return 'Penambahan Nilai (historis)';
        }

        return 'Jenis lainnya';
    }

    // ==========================================
    // STATUS HIJAU VOUCHER TERPILIH
    // ==========================================

    function showSourceSummary(item) {
        selectedCard.hidden = false;

        $('#mesinSelectedTitle').textContent =
            `${item.lokasi || '—'} · ` +
            `${item.no_voucher || '—'}`;

        $('#mesinSelectedMeta').textContent =
            `${selectedJenis(item)} · ` +
            `Tahun ${item.tahun || '—'} · ` +
            `${item.departemen || '—'} / ` +
            `${item.divisi || '—'} · ` +
            `${money(item.nilai)}`;

        $('#mesinChangeSourceButton').hidden = false;
    }

    // ==========================================
    // API
    // ==========================================

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

    // ==========================================
    // MODAL
    // ==========================================

    function openDialog(dialog) {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        refreshIcons();
    }

    function closeDialog(dialog) {
        if (dialog?.open) dialog.close();
    }

    $$('[data-close]').forEach(button => {
        button.addEventListener('click', () => {
            closeDialog(
                document.getElementById(
                    button.dataset.close
                )
            );
        });
    });

   
[
    formDialog,
    detailDialog,
    nilaiDialog,
    pdfDialog
].forEach(dialog => {
    dialog?.addEventListener('click', event => {
        if (event.target === dialog) {
            closeDialog(dialog);
        }
    });
});


    // ==========================================
    // PENCARIAN TABEL UTAMA
    // ==========================================

    function filteredTableRows() {
        const keyword = mainSearch.value
            .trim()
            .toLowerCase();

        return tableRows.filter(row =>
            (row.dataset.search || '').includes(keyword)
        );
    }

    // ==========================================
    // PAGINATION SEPERTI TANAH
    // ==========================================

    function renderPagination(totalPages) {
        const container = $('#mesinPagination');

        container.replaceChildren();

        if (totalPages < 2) return;

        function button(label, page, disabled = false) {
            const element = document.createElement('button');

            const active =
                page === currentPage &&
                /^\d+$/.test(label);

            element.type = 'button';
            element.textContent = label;
            element.disabled = disabled;

            element.classList.toggle('active', active);

            if (active) {
                element.setAttribute(
                    'aria-current',
                    'page'
                );
            }

            element.addEventListener('click', () => {
                currentPage = page;
                renderTable();
            });

            container.appendChild(element);
        }

        function dots() {
            const element = document.createElement('span');
            element.className = 'mesin-page-ellipsis';
            element.textContent = '…';
            container.appendChild(element);
        }

        button(
            '‹',
            currentPage - 1,
            currentPage === 1
        );

        const pages = new Set([1, totalPages]);

        for (
            let page = Math.max(1, currentPage - 2);
            page <= Math.min(totalPages, currentPage + 2);
            page++
        ) {
            pages.add(page);
        }

        let previous = 0;

        [...pages]
            .sort((a, b) => a - b)
            .forEach(page => {
                if (
                    previous &&
                    page - previous > 1
                ) {
                    dots();
                }

                button(String(page), page);
                previous = page;
            });

        button(
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

        currentPage = Math.max(
            1,
            Math.min(currentPage, totalPages)
        );

        const startIndex = (currentPage - 1) * size;

        tableRows.forEach(row => {
            row.hidden = true;
        });

        rows.slice(startIndex, startIndex + size)
            .forEach((row, index) => {
                row.hidden = false;

                const numberCell = row.querySelector(
                    '.mesin-number'
                );

                if (numberCell) {
                    numberCell.textContent =
                        startIndex + index + 1;
                }
            });

        const first = rows.length
            ? startIndex + 1
            : 0;

        const last = Math.min(
            startIndex + size,
            rows.length
        );

        $('#mesinTableInfo').textContent =
            `Menampilkan ${first}–${last} ` +
            `dari ${rows.length} lokasi`;

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

    // ==========================================
    // EXPORT CSV TABEL UTAMA
    // ==========================================

    
/*
|--------------------------------------------------------------------------
| EXPORT CSV K.I.B MESIN
| STRUKTUR TABEL LAMA + PDF
|--------------------------------------------------------------------------
*/

$('#mesinExport').addEventListener('click', () => {

    const rows = [[
        'No',
        'Lokasi',
        'Alamat',
        'Nilai',
        'Jumlah PDF'
    ]];

    // Ekspor seluruh hasil pencarian,
    // bukan hanya halaman pagination aktif.
    filteredTableRows().forEach((row, index) => {

        rows.push([
            index + 1,
            row.dataset.exportLokasi || '',
            row.dataset.exportAlamat || '',
            row.dataset.exportNilai || '0',
            row.dataset.exportPdf || '0'
        ]);

    });

    // Format CSV yang kompatibel dengan Excel.
    const csv = '\uFEFF' + rows.map(values =>

        values.map(value => {

            let text = String(value ?? '');

            // Hindari formula injection pada CSV.
            if (/^\s*[=+@-]/.test(text)) {
                text = "'" + text;
            }

            // Escape karakter tanda kutip.
            return `"${text.replaceAll('"', '""')}"`;

        }).join(';')

    ).join('\r\n');

    const blob = new Blob(
        [csv],
        { type: 'text/csv;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download = 'kib-peralatan-mesin.csv';

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
});


    // ==========================================
    // LOAD DATA PENDING
    // ==========================================

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
                Number(
                    result.count ?? pendingSources.length
                )
            );

            [
                '#mesinPendingTotal',
                '#mesinPendingLabel',
                '#mesinPendingPill',
                '#mesinIncomingCount'
            ].forEach(selector => {
                const element = $(selector);

                if (element) {
                    element.textContent =
                        formatter.format(total);
                }
            });

            $('#mesinIncomingCard')?.classList.toggle(
                'is-empty',
                total === 0
            );

            renderPending();

        } catch (error) {
            console.error(
                'Gagal memuat pending Mesin:',
                error
            );

            pendingSources = [];

            pendingBody.innerHTML = `
                <tr>
                    <td colspan="9" class="mesin-empty">
                        Gagal mengambil data pending.
                        Periksa endpoint dan log Laravel.
                    </td>
                </tr>
            `;
        }
    }

    // ==========================================
    // TABEL PILIH NILAI ASET
    // ==========================================

    function renderPending() {
        const keyword = pendingSearch.value
            .trim()
            .toLowerCase();

        const rows = pendingSources.filter(item =>
            [
                item.no_voucher,
                item.tgl_voucher,
                item.lokasi,
                item.alamat,
                item.departemen,
                item.divisi,
                item.tahun,
                item.urai,
                item.nilai
            ]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
        );

        $('#mesinPendingCountText').textContent =
            `${formatter.format(rows.length)} data`;

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

        pendingBody.innerHTML = rows.map(
            (item, index) => {
                const selected =
                    String(item.id) ===
                    String(selectedSourceId);

                return `
                    <tr class="${
                        selected ? 'is-selected' : ''
                    }">
                        <td>${index + 1}</td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    item.no_voucher || '—'
                                )}
                            </strong>
                            <small>
                                ${escapeHtml(
                                    voucherDate(item.tgl_voucher)
                                )}
                            </small>
                            <small class="mesin-source-type">
                                ${escapeHtml(
                                    selectedJenis(item)
                                )}
                            </small>
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(item.lokasi || '—')}
                            </strong>
                            <small>
                                ${escapeHtml(item.alamat || '—')}
                            </small>
                        </td>

                        <td>
                            ${escapeHtml(
                                item.departemen || '—'
                            )}
                        </td>

                        <td>
                            ${escapeHtml(item.divisi || '—')}
                        </td>

                        <td>
                            ${escapeHtml(item.tahun || '—')}
                        </td>

                        <td>
                            <strong class="mesin-currency">
                                ${money(item.nilai)}
                            </strong>
                        </td>

                        <td class="mesin-source-uraian">
                            ${escapeHtml(item.urai || '—')}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="mesin-source-select ${
                                    selected ? 'is-selected' : ''
                                }"
                                data-pilih="${Number(item.id)}"
                                aria-pressed="${selected}"
                            >
                                ${
                                    selected
                                        ? '✓ Terpilih'
                                        : 'Pilih'
                                }
                            </button>
                        </td>
                    </tr>
                `;
            }
        ).join('');

        refreshIcons();
    }

    pendingSearch.addEventListener(
        'input',
        renderPending
    );

    // ==========================================
    // TOMBOL GANTI VOUCHER
    // ==========================================

    $('#mesinChangeSourceButton').addEventListener(
        'click',
        () => {
            // Sumber transaksi tidak diganti
            // ketika sedang mengedit inventaris.
            if (!$('#mesinMethod').disabled) return;

            $('#mesinPendingSection').hidden = false;
            pendingSearch.value = '';

            renderPending();
            pendingSearch.focus();

            $('#mesinPendingSection').scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    );

    // ==========================================
    // TOMBOL PILIH VOUCHER
    // ==========================================

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
                'Lokasi, Departemen, atau Divisi ' +
                'belum lengkap pada transaksi sumber.'
            );
            return;
        }

        // Hidden input yang dibutuhkan Controller.
        sourceId.value = source.id;

        // Data organisasi tetap autofill.
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

        // PERBAIKAN UTAMA:
        // Daftar voucher TIDAK disembunyikan.
        selectedSourceId = String(source.id);

        showSourceSummary(source);
        renderPending();

        // Form tetap bisa dilanjutkan.
        form.querySelector(
            '[name="id_barang"]'
        )?.focus();
    });

    // ==========================================
    // RESET FORM
    // ==========================================

    function resetForm() {
        form.reset();

        sourceId.value = '';
        selectedSourceId = null;

        selectedCard.hidden = true;

        $('#mesinChangeSourceButton').hidden = false;

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
            const field = document.getElementById(id);

            if (field) field.value = '';
        });

        pendingSearch.value = '';
    }

    // ==========================================
    // TAMBAH DATA MESIN
    // ==========================================

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

    // ==========================================
    // VALIDASI SIMPAN
    // ==========================================

    form.addEventListener('submit', event => {
        const creating = $('#mesinMethod').disabled;

        if (creating && !sourceId.value) {
            event.preventDefault();

            alert(
                'Pilih transaksi Nilai Aset terlebih dahulu.'
            );
        }
    });

    // ==========================================
    // EDIT DATA MESIN
    // ==========================================

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

            // Informasi Edit tetap terlihat,
            // tetapi sumber transaksi tidak diganti.
            selectedCard.hidden = false;

            $('#mesinSelectedTitle').textContent =
                `${item.lokasi || '—'} · Inventaris #${id}`;

            $('#mesinSelectedMeta').textContent =
                'Mode Edit — informasi lokasi dan ' +
                'sumber transaksi tidak diubah.';

            $('#mesinChangeSourceButton').hidden = true;

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

            const noMesin = form.elements.namedItem(
                'nomor_mesin'
            );

            if (noMesin) noMesin.value = item.mesin ?? '';

            closeDialog(detailDialog);
            openDialog(formDialog);

        } catch (error) {
            alert(
                'Gagal membuka edit Mesin: ' +
                error.message
            );
        }
    }

    // ==========================================
    // RINCIAN NILAI ASET
    // ==========================================

    async function showNilaiMesin(
        lokasiId,
        lokasiName = ''
    ) {
        openDialog(nilaiDialog);

        $('#mesinNilaiTitle').textContent =
            `Rincian Nilai Mesin — ${lokasiName}`;

        $('#mesinNilaiSubtitle').textContent =
            'Memuat riwayat transaksi...';

        $('#mesinNilaiTotal').textContent = 'Rp 0';
        $('#mesinNilaiCount').textContent = '0 transaksi';

        $('#mesinNilaiBody').innerHTML = `
            <tr>
                <td colspan="10" class="mesin-empty">
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
                result.lokasi?.alamat || '—';

            $('#mesinNilaiTotal').textContent =
                money(result.total);

            $('#mesinNilaiCount').textContent =
                `${formatter.format(
                    result.count ?? rows.length
                )} transaksi`;

            if (!rows.length) {
                $('#mesinNilaiBody').innerHTML = `
                    <tr>
                        <td colspan="10" class="mesin-empty">
                            Belum ada transaksi pada lokasi ini.
                        </td>
                    </tr>
                `;
                return;
            }

            $('#mesinNilaiBody').innerHTML =
                rows.map((item, index) => {
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
                                ${escapeHtml(
                                    item.no_voucher || '—'
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    item.tgl_voucher || '—'
                                )}
                            </td>

                            <td>
                                ${escapeHtml(item.tahun || '—')}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        item.kode_aktiva || '—'
                                    )}
                                </strong>
                                <small>
                                    ${escapeHtml(
                                        item.nama_aktiva || ''
                                    )}
                                </small>
                            </td>

                            <td class="mesin-nilai-uraian">
                                ${escapeHtml(item.urai || '—')}
                            </td>

                            <td>
                                ${escapeHtml(label)}
                            </td>

                            <td>
                                ${escapeHtml(
                                    item.departemen || '—'
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    item.divisi || '—'
                                )}
                            </td>

                            <td>
                                <strong class="mesin-currency">
                                    ${money(item.nilai)}
                                </strong>
                            </td>
                        </tr>
                    `;
                }).join('');

        } catch (error) {
            console.error(error);

            $('#mesinNilaiBody').innerHTML = `
                <tr>
                    <td colspan="10" class="mesin-empty">
                        Gagal mengambil rincian nilai Mesin.
                    </td>
                </tr>
            `;
        }
    }

    // ==========================================
    // DETAIL INVENTARIS MESIN
    // ==========================================

    async function showDetail(lokasiId) {
        openDialog(detailDialog);

        $('#mesinDetailBody').textContent =
            'Memuat data inventaris...';

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
                location.alamat || '—';

            if (!items.length) {
                $('#mesinDetailBody').textContent =
                    'Belum ada data barang di lokasi ini.';
                return;
            }

            $('#mesinDetailBody').innerHTML =
                items.map(item => {
                    const id = Number(item.id);

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

                    const fields = details.map(
                        ([name, value]) => `
                            <div>
                                <dt>${escapeHtml(name)}</dt>
                                <dd>
                                    ${escapeHtml(value || '—')}
                                </dd>
                            </div>
                        `
                    ).join('');

                    const fileUrl = type =>
                        `${recordUrl(id)}/file/${type}`;

                    const dokumen = String(item.dok || '')
                        .startsWith('kib/mesin/dokumen/')
                        ? `
                            <a
                                class="mesin-button outline small"
                                href="${fileUrl('dokumen')}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Lihat Dokumen
                            </a>
                        `
                        : '';

                    const foto = String(item.img || '')
                        .startsWith('kib/mesin/foto/')
                        ? `
                            <a
                                class="mesin-button outline small"
                                href="${fileUrl('foto')}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Lihat Foto
                            </a>
                        `
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
                                        ${escapeHtml(item.kode || '—')}
                                        · Register:
                                        ${escapeHtml(item.reg || '—')}
                                    </small>
                                </div>

                                <strong>
                                    ${money(item.harga)}
                                </strong>
                            </div>

                            <dl class="mesin-detail-grid">
                                ${fields}
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
                }).join('');

            refreshIcons();

        } catch (error) {
            $('#mesinDetailBody').textContent =
                'Gagal mengambil detail: ' +
                error.message;
        }
    }

    
    
/*
|--------------------------------------------------------------------------
| PILIH BARANG UNTUK EDIT ATAU HAPUS
|--------------------------------------------------------------------------
|
| Satu baris tabel utama = satu lokasi.
| Edit / Hapus harus memilih barang fisik,
| bukan langsung mengubah seluruh lokasi.
|
| Memakai modal dan route yang sudah tersedia.
|
*/

async function chooseMesinAction(lokasiId, action) {
    const isDelete = action === 'delete';
    const targetId = Number(lokasiId);

    if (
        !Number.isSafeInteger(targetId) ||
        targetId < 1
    ) {
        return;
    }

    openDialog(detailDialog);

    const title = isDelete
        ? 'Pilih Mesin yang Akan Dihapus'
        : 'Pilih Mesin yang Akan Diedit';

    $('#mesinDetailTitle').textContent = title;

    $('#mesinDetailAddress').textContent =
        'Pilih satu barang. Lokasi dan barang lain tidak akan diubah.';

    $('#mesinDetailBody').textContent =
        'Memuat daftar barang...';

    try {
        // Endpoint detail lokasi yang sudah ada.
        const result = await getJson(
            locationUrl(targetId)
        );

        if (!detailDialog.open) return;

        const location = result.lokasi || {};

        const items = Array.isArray(result.data)
            ? result.data
            : [];

        $('#mesinDetailTitle').textContent = title;

        $('#mesinDetailAddress').textContent =
            `${location.lokasi || 'Lokasi Mesin'} · ` +
            `${items.length} barang terdaftar`;

        if (!items.length) {
            $('#mesinDetailBody').textContent =
                'Belum ada barang Mesin di lokasi ini.';
            return;
        }

        $('#mesinDetailBody').innerHTML =
            items.map(item => {

                const id = Number(item.id);

                if (
                    !Number.isSafeInteger(id) ||
                    id < 1
                ) {
                    return '';
                }

                const actionButton = isDelete
                    ? `
                        <button
                            type="button"
                            class="mesin-button danger small"
                            data-delete="${id}"
                        >
                            <i data-lucide="trash-2"></i>
                            Hapus Barang
                        </button>
                    `
                    : `
                        <button
                            type="button"
                            class="mesin-button mesin-action-edit small"
                            data-edit="${id}"
                        >
                            <i data-lucide="pencil"></i>
                            Edit Barang
                        </button>
                    `;

                return `
                    <article class="mesin-action-picker-item">

                        <div class="mesin-action-picker-info">

                            <strong class="mesin-action-picker-name">
                                ${escapeHtml(
                                    item.nama_barang || 'Barang Mesin'
                                )}
                            </strong>

                            <span>
                                Kode:
                                ${escapeHtml(item.kode || '—')}
                                · Register:
                                ${escapeHtml(item.reg || '—')}
                                · Tahun:
                                ${escapeHtml(item.tahun || '—')}
                            </span>

                            <small>
                                Merk:
                                ${escapeHtml(item.merk || '—')}
                            </small>

                        </div>

                        ${actionButton}

                    </article>
                `;

            }).join('');

        refreshIcons();

    } catch (error) {
        console.error(
            'Gagal memuat pilihan aksi Mesin:',
            error
        );

        $('#mesinDetailBody').textContent =
            'Daftar Mesin tidak dapat dimuat. ' +
            'Periksa akses dan log Laravel.';
    }
}


/*
|--------------------------------------------------------------------------
| DOKUMEN PDF MESIN PER LOKASI
|--------------------------------------------------------------------------
|
| Menggunakan endpoint yang sudah tersedia:
| GET /kib/mesin/lokasi/{lokasi}
|
| Setiap dokumen memakai route:
| GET /kib/mesin/{mesin}/file/dokumen
|
| Tidak membutuhkan Controller atau route baru.
|
*/

async function showPdfLokasi(
    lokasiId,
    lokasiNama = ''
) {
    // Buka modal PDF.
    openDialog(pdfDialog);

    // Reset judul dan status.
    $('#mesinPdfTitle').textContent =
        `Dokumen PDF — ${lokasiNama || 'Lokasi Mesin'}`;

    $('#mesinPdfAddress').textContent =
        'Memuat dokumen...';

    $('#mesinPdfStatus').textContent = '';

    $('#mesinPdfBody').innerHTML = `
        <tr>
            <td
                colspan="5"
                class="mesin-empty"
            >
                Memuat daftar PDF...
            </td>
        </tr>
    `;

    try {
        // Mengambil detail seluruh barang
        // di lokasi yang diklik.
        const result = await getJson(
            locationUrl(lokasiId)
        );

        if (!pdfDialog.open) return;

        const location = result.lokasi || {};

        const all = Array.isArray(result.data)
            ? result.data
            : [];

        // Filter barang yang memiliki dokumen.
        const documents = all.filter(item =>
            String(item.dok ?? '').trim() !== '' &&
            String(item.dok).trim() !== '-'
        );

        // Menampilkan judul sesuai lokasi.
        $('#mesinPdfTitle').textContent =
            `Dokumen PDF — ${
                location.lokasi || lokasiNama
            }`;

        $('#mesinPdfAddress').textContent =
            location.alamat || 'Lokasi Mesin';

        // Jumlah dokumen.
        $('#mesinPdfStatus').textContent =
            `${number.format(
                documents.length
            )} dokumen terdaftar`;

        // Tidak ada PDF.
        if (!documents.length) {
            $('#mesinPdfBody').innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="mesin-empty"
                    >
                        Belum ada dokumen PDF
                        pada lokasi ini.
                    </td>
                </tr>
            `;

            return;
        }

        // Menampilkan dokumen per barang.
        $('#mesinPdfBody').innerHTML =
            documents.map((item, index) => {

                const id = Number(item.id);

                // Route yang saat ini dapat membuka
                // file dari folder penyimpanan baru.
                const available =
                    Number.isSafeInteger(id) &&
                    id > 0 &&
                    String(item.dok).startsWith(
                        'kib/mesin/dokumen/'
                    );

                const link = available
                    ? `
                        <a
                            class="mesin-button mesin-pdf-button small"
                            href="${recordUrl(id)}/file/dokumen"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i data-lucide="file-text"></i>
                            Buka PDF
                        </a>
                    `
                    : `
                        <span
                            class="mesin-pdf-unavailable"
                            title="File lama belum tersedia melalui endpoint PDF saat ini"
                        >
                            File lama
                        </span>
                    `;

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.nama_barang || 'Barang'
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.kode || '—'
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.tahun || '—'
                            )}
                        </td>

                        <td>
                            ${link}
                        </td>

                    </tr>
                `;

            }).join('');

        // Aktifkan ikon di baris dokumen.
        refreshIcons();

    } catch (error) {

        console.error(
            'Gagal memuat PDF Mesin:',
            error
        );

        $('#mesinPdfStatus').textContent =
            'Gagal membaca dokumen dari server.';

        $('#mesinPdfBody').innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="mesin-empty"
                >
                    Gagal mengambil PDF.
                    Periksa koneksi dan izin akses.
                </td>
            </tr>
        `;
    }
}


   

/*
|--------------------------------------------------------------------------
| EVENT TABEL UTAMA MESIN
|--------------------------------------------------------------------------
|
| Nilai  -> Rincian voucher
| PDF    -> Daftar dokumen PDF
| Detail -> Rincian seluruh barang
| Edit   -> Pilih barang untuk diedit
| Hapus  -> Pilih barang untuk dihapus
|
*/

$('#mesinTable').addEventListener('click', event => {

    // NILAI
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

    // PDF
    const pdfButton = event.target.closest(
        '[data-pdf-lokasi]'
    );

    if (pdfButton) {
        showPdfLokasi(
            pdfButton.dataset.pdfLokasi,
            pdfButton.dataset.pdfNama
        );
        return;
    }

    // EDIT
    const editButton = event.target.closest(
        '[data-edit-lokasi]'
    );

    if (editButton) {
        chooseMesinAction(
            editButton.dataset.editLokasi,
            'edit'
        );
        return;
    }

    // HAPUS
    const deleteButton = event.target.closest(
        '[data-delete-lokasi]'
    );

    if (deleteButton) {
        chooseMesinAction(
            deleteButton.dataset.deleteLokasi,
            'delete'
        );
        return;
    }

    // DETAIL
    const detailButton = event.target.closest(
        '[data-lokasi]'
    );

    if (detailButton) {
        showDetail(
            detailButton.dataset.lokasi
        );
    }
});



    // ==========================================
    // EDIT DAN HAPUS INVENTARIS
    // ==========================================

    $('#mesinDetailBody').addEventListener(
        'click',
        event => {
            const edit = event.target.closest(
                '[data-edit]'
            );

            if (edit) {
                editMesin(edit.dataset.edit);
                return;
            }

            const hapus = event.target.closest(
                '[data-delete]'
            );

            if (!hapus) return;

            const confirmed = confirm(
                'Yakin ingin menghapus data Mesin ini?'
            );

            if (!confirmed) return;

            const deleteForm = $('#mesinDeleteForm');

            deleteForm.action = recordUrl(
                hapus.dataset.delete
            );

            deleteForm.submit();
        }
    );

    // ==========================================
    // INITIALISASI
    // ==========================================

    renderTable();
    refreshIcons();
    loadPending();

    if ($('.mesin-notice.error')) {
        openCreate();
    }
});


/* ==========================================================
   K.I.B B — PERALATAN DAN MESIN
   MASA PAJAK KENDARAAN
   PERUMDA TIRTA KENCANA
========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const mesin = document.getElementById('mesinPage');
    const root = document.getElementById('mesinPajakPanel');

    if (!mesin || !root || root.dataset.ready === '1') {
        return;
    }

    root.dataset.ready = '1';

    const $ = (selector, node = root) =>
        node.querySelector(selector);

    const $$ = (selector, node = root) =>
        [...node.querySelectorAll(selector)];

    const numberFormat = new Intl.NumberFormat('id-ID');

    const number = value =>
        numberFormat.format(Number(value) || 0);

    const money = value =>
        value == null || value === ''
            ? '—'
            : 'Rp ' + number(value);

    const esc = value =>
        String(value ?? '').replace(
            /[&<>"']/g,
            char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char]
        );

    const date = value => {
        const match = String(value ?? '')
            .slice(0, 10)
            .match(/^(\d{4})-(\d{2})-(\d{2})$/);

        return match
            ? `${match[3]}/${match[2]}/${match[1]}`
            : '—';
    };

    const icons = () =>
        window.lucide?.createIcons?.();

    const endpoint = root.dataset.base;
    const token = root.dataset.token;

    const STATUS = {
        aktif: 'Aktif',
        segera_habis: 'Segera Habis',
        kedaluwarsa: 'Kedaluwarsa',
        belum_didata: 'Belum Dicatat'
    };

    let vehicles = [];
    let currentPage = 1;
    let editing = null;
    let loaded = false;

    // =====================================================
    // 1. NAVBAR DUA TAB
    // =====================================================

    const daftarPanel = document.getElementById(
        'mesinDaftarPanel'
    );

    const tabs = [
        ...mesin.querySelectorAll('[data-mesin-tab]')
    ];

    function activateTab(tab) {
        const isPajak = tab === 'pajak';

        daftarPanel.hidden = isPajak;
        root.hidden = !isPajak;

        mesin.classList.toggle(
            'mesin-pajak-active',
            isPajak
        );

        tabs.forEach(button => {
            const active =
                button.dataset.mesinTab === tab;

            button.setAttribute(
                'aria-selected',
                active ? 'true' : 'false'
            );

            button.tabIndex = active ? 0 : -1;
        });

        history.replaceState(
            null,
            '',
            isPajak
                ? '#masa-pajak'
                : '#daftar-mesin'
        );

        if (isPajak && !loaded) {
            loadPajak();
        }

        icons();
    }

    tabs.forEach(button => {
        button.addEventListener('click', () => {
            activateTab(button.dataset.mesinTab);
        });
    });

    activateTab(
        location.hash === '#masa-pajak'
            ? 'pajak'
            : 'daftar'
    );

    window.addEventListener('hashchange', () => {
        activateTab(
            location.hash === '#masa-pajak'
                ? 'pajak'
                : 'daftar'
        );
    });

    // =====================================================
    // 2. AJAX KE KIBController
    // =====================================================

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': token,
                ...(options.headers || {})
            }
        });

        const raw = await response.text();

        let result;

        try {
            result = JSON.parse(raw);
        } catch {
            throw new Error(
                `Respons server bukan JSON (HTTP ${response.status}).`
            );
        }

        if (!response.ok || result.success === false) {
            const errors = Object.values(
                result.errors || {}
            )
                .flat()
                .filter(Boolean)
                .join('\n');

            throw new Error(
                errors ||
                result.message ||
                `HTTP ${response.status}`
            );
        }

        return result;
    }

    // =====================================================
    // 3. MODAL
    // =====================================================

    function dialog(id, show = true) {
        const element = $('#' + id);

        if (!element) return;

        if (show && !element.open) {
            element.showModal();
        }

        if (!show && element.open) {
            element.close();
        }

        icons();
    }

    $$('[data-pajak-close]').forEach(button => {
        button.addEventListener('click', () => {
            dialog(
                button.dataset.pajakClose,
                false
            );
        });
    });

    $$('dialog').forEach(element => {
        element.addEventListener('click', event => {
            if (event.target === element) {
                element.close();
            }
        });
    });

    // =====================================================
    // 4. MENGAMBIL DATA PAJAK
    // =====================================================

    async function loadPajak() {
        $('#pajakInfoStatus').textContent =
            'Memuat masa pajak kendaraan...';

        try {
            const result = await api(
                root.dataset.api
            );

            if (!Array.isArray(result.data)) {
                throw new Error(
                    'Format data kendaraan tidak sesuai.'
                );
            }

            vehicles = result.data;
            loaded = true;

            const summary = result.summary;

            $('#pajakTotal').textContent =
                number(summary.total);

            $('#pajakAktif').textContent =
                number(summary.aktif);

            $('#pajakSegera').textContent =
                number(summary.segera_habis);

            $('#pajakTerlambat').textContent =
                number(summary.kedaluwarsa);

            $('#pajakBelumDicatat').textContent =
                `${number(summary.belum_didata)} kendaraan ` +
                'belum memiliki catatan masa pajak. ' +
                'Kendaraan tersebut tidak dihitung sebagai pajak aktif.';

            populateFilters();
            populateVehicleOptions();

            currentPage = 1;
            renderTable();

            $('#pajakInfoStatus').textContent =
                'Data kendaraan berasal dari inventaris Mesin.';

        } catch (error) {
            loaded = false;

            $('#pajakInfoStatus').textContent =
                'Gagal memuat: ' + error.message;

            $('#pajakTableBody').innerHTML = `
                <tr>
                    <td colspan="10" class="pajak-empty">
                        ${esc(error.message)}
                    </td>
                </tr>
            `;
        }
    }

    // =====================================================
    // 5. PILIHAN FILTER
    // =====================================================

    function populateFilters() {
        const jenisSelect = $('#pajakJenis');
        const lokasiSelect = $('#pajakLokasi');

        const selectedJenis = jenisSelect.value;
        const selectedLokasi = lokasiSelect.value;

        const jenis = [
            ...new Set(
                vehicles
                    .map(item => item.nama_kendaraan)
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, 'id'));

        const lokasi = [
            ...new Set(
                vehicles
                    .map(item => item.lokasi)
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, 'id'));

        jenisSelect.innerHTML =
            '<option value="">Semua Jenis Kendaraan</option>' +
            jenis.map(value => `
                <option value="${esc(value)}">
                    ${esc(value)}
                </option>
            `).join('');

        lokasiSelect.innerHTML =
            '<option value="">Semua Lokasi</option>' +
            lokasi.map(value => `
                <option value="${esc(value)}">
                    ${esc(value)}
                </option>
            `).join('');

        jenisSelect.value =
            jenis.includes(selectedJenis)
                ? selectedJenis : '';

        lokasiSelect.value =
            lokasi.includes(selectedLokasi)
                ? selectedLokasi : '';
    }

    // =====================================================
    // 6. DROPDOWN KENDARAAN
    // =====================================================

    function populateVehicleOptions() {
        const select = $('#pajakMesinId');

        select.innerHTML = `
            <option value="">
                Pilih kendaraan dari inventaris Mesin
            </option>
        ` + vehicles.map(item => `
            <option value="${Number(item.mesin_id)}">
                ${esc(item.nomor_polisi)}
                —
                ${esc(item.nama_kendaraan)}
                (${esc(item.lokasi)})
            </option>
        `).join('');
    }

    // =====================================================
    // 7. FILTER MASA PAJAK
    // =====================================================

    function filteredVehicles() {
        const search = $('#pajakCari')
            .value.trim().toLowerCase();

        const jenis = $('#pajakJenis').value;
        const status = $('#pajakStatus').value;
        const lokasi = $('#pajakLokasi').value;
        const tempo = $('#pajakTempo').value;

        return vehicles.filter(item => {
            const text = [
                item.nomor_polisi,
                item.nama_kendaraan,
                item.merk,
                item.lokasi
            ].join(' ').toLowerCase();

            if (search && !text.includes(search)) {
                return false;
            }

            if (jenis && item.nama_kendaraan !== jenis) {
                return false;
            }

            if (status && item.status !== status) {
                return false;
            }

            if (lokasi && item.lokasi !== lokasi) {
                return false;
            }

            const days = item.sisa_hari;

            if (
                tempo === 'terlambat' &&
                (days == null || days >= 0)
            ) {
                return false;
            }

            if (
                tempo === '30' &&
                (days == null || days < 0 || days > 30)
            ) {
                return false;
            }

            if (
                tempo === '90' &&
                (days == null || days < 0 || days > 90)
            ) {
                return false;
            }

            return true;
        });
    }

    // =====================================================
    // 8. RENDER TABEL
    // =====================================================

    function renderTable() {
        const matches = filteredVehicles();

        const pageSize =
            Number($('#pajakLimit').value) || 10;

        const totalPages = Math.max(
            1,
            Math.ceil(matches.length / pageSize)
        );

        currentPage = Math.min(
            Math.max(1, currentPage),
            totalPages
        );

        const start = (currentPage - 1) * pageSize;

        const rows = matches.slice(
            start,
            start + pageSize
        );

        $('#pajakTableBody').innerHTML =
            rows.length

            ? rows.map((item, index) => `
                <tr>
                    <td>${start + index + 1}</td>

                    <td>
                        <strong>
                            ${esc(item.nomor_polisi)}
                        </strong>
                    </td>

                    <td>
                        ${esc(item.nama_kendaraan)}
                    </td>

                    <td>
                        ${esc(item.merk || '—')}
                    </td>

                    <td>
                        ${esc(item.tahun || '—')}
                    </td>

                    <td>
                        ${esc(item.lokasi)}
                    </td>

                    <td>
                        ${date(item.tanggal_bayar)}
                    </td>

                    <td>
                        ${date(item.jatuh_tempo)}
                    </td>

                    <td>
                        <span class="pajak-status ${esc(item.status)}">
                            ${STATUS[item.status] || '—'}
                        </span>

                        ${
                            item.sisa_hari != null &&
                            item.sisa_hari >= 0
                                ? `<small>
                                    ${number(item.sisa_hari)}
                                    hari lagi
                                   </small>`
                                : ''
                        }
                    </td>

                    <td>
                        <div class="pajak-row-actions">

                            <button
                                type="button"
                                class="view"
                                data-pajak-view="${Number(item.mesin_id)}"
                                title="Detail Pajak"
                            >
                                <i data-lucide="eye"></i>
                            </button>

                            <button
                                type="button"
                                class="edit"
                                data-pajak-edit="${Number(item.mesin_id)}"
                                title="${item.pajak_id ? 'Edit Pajak' : 'Catat Pajak'}"
                            >
                                <i data-lucide="square-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="delete"
                                data-pajak-delete="${Number(item.mesin_id)}"
                                ${!item.pajak_id ? 'disabled' : ''}
                                title="Hapus Catatan Pajak"
                            >
                                <i data-lucide="trash-2"></i>
                            </button>

                        </div>
                    </td>
                </tr>
            `).join('')

            : `
                <tr>
                    <td colspan="10" class="pajak-empty">
                        Tidak ada kendaraan sesuai filter.
                    </td>
                </tr>
            `;

        $('#pajakTableInfo').textContent =
            `Menampilkan ${
                matches.length ? start + 1 : 0
            }–${
                Math.min(start + pageSize, matches.length)
            } dari ${number(matches.length)} kendaraan`;

        renderPagination(totalPages);
        icons();
    }

    // =====================================================
    // 9. PAGINATION
    // =====================================================

    function renderPagination(totalPages) {
        const container = $('#pajakPages');

        container.replaceChildren();

        if (totalPages <= 1) return;

        function addButton(
            title,
            target,
            disabled = false
        ) {
            const button = document.createElement('button');

            button.type = 'button';
            button.textContent = title;
            button.disabled = disabled;

            if (
                target === currentPage &&
                /^\d+$/.test(title)
            ) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                currentPage = target;
                renderTable();
            });

            container.appendChild(button);
        }

        addButton(
            '‹',
            currentPage - 1,
            currentPage === 1
        );

        const pages = new Set([1, totalPages]);

        for (
            let p = Math.max(1, currentPage - 2);
            p <= Math.min(totalPages, currentPage + 2);
            p++
        ) {
            pages.add(p);
        }

        let last = 0;

        [...pages]
            .sort((a, b) => a - b)
            .forEach(p => {
                if (last && p - last > 1) {
                    const span = document.createElement('span');
                    span.textContent = '…';
                    container.appendChild(span);
                }

                addButton(String(p), p);

                last = p;
            });

        addButton(
            '›',
            currentPage + 1,
            currentPage === totalPages
        );
    }

    // =====================================================
    // 10. EVENT FILTER DAN RESET
    // =====================================================

    [
        'pajakCari',
        'pajakJenis',
        'pajakStatus',
        'pajakLokasi',
        'pajakTempo',
        'pajakLimit'
    ].forEach(id => {
        const element = $('#' + id);

        element.addEventListener(
            id === 'pajakCari' ? 'input' : 'change',
            () => {
                currentPage = 1;
                renderTable();
            }
        );
    });

    $('#pajakReset').addEventListener('click', () => {
        [
            'pajakCari',
            'pajakJenis',
            'pajakStatus',
            'pajakLokasi',
            'pajakTempo'
        ].forEach(id => {
            $('#' + id).value = '';
        });

        $('#pajakLimit').value = '10';

        currentPage = 1;
        renderTable();
    });

    // =====================================================
    // 11. EXPORT CSV
    // =====================================================

    $('#pajakExport').addEventListener('click', () => {
        const data = [[
            'No',
            'Nomor Polisi',
            'Kendaraan',
            'Merk',
            'Tahun',
            'Lokasi',
            'Tanggal Bayar',
            'Jatuh Tempo',
            'Status',
            'Nominal'
        ]];

        filteredVehicles().forEach((item, index) => {
            data.push([
                index + 1,
                item.nomor_polisi,
                item.nama_kendaraan,
                item.merk,
                item.tahun,
                item.lokasi,
                item.tanggal_bayar,
                item.jatuh_tempo,
                STATUS[item.status],
                item.nominal
            ]);
        });

        const csv = '\uFEFF' + data.map(row =>
            row.map(value => {
                let text = String(value ?? '');

                // Mencegah formula dieksekusi pada spreadsheet.
                if (/^\s*[=+@-]/.test(text)) {
                    text = "'" + text;
                }

                return '"' +
                    text.replaceAll('"', '""') +
                    '"';

            }).join(';')
        ).join('\r\n');

        const objectUrl = URL.createObjectURL(
            new Blob([csv], {
                type: 'text/csv;charset=utf-8'
            })
        );

        const link = document.createElement('a');

        link.href = objectUrl;
        link.download = 'masa-pajak-kendaraan.csv';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 1000);
    });

    // =====================================================
    // 12. TAMBAH / EDIT MASA PAJAK
    // =====================================================

    const form = $('#pajakForm');

    const findVehicle = id =>
        vehicles.find(item =>
            String(item.mesin_id) === String(id)
        );

    function openForm(item = null) {
        form.reset();

        editing = item?.pajak_id || null;

        $('#pajakFormError').hidden = true;

        $('#pajakFormTitle').textContent =
            editing
                ? 'Edit Masa Pajak Kendaraan'
                : 'Catat Masa Pajak Kendaraan';

        // Saat edit, kendaraan induk tidak dapat diganti.
        $('#pajakMesinId').disabled = !!editing;

        if (item) {
            $('#pajakMesinId').value =
                String(item.mesin_id);

            [
                'tanggal_bayar',
                'jatuh_tempo',
                'nominal',
                'nomor_stnk',
                'keterangan'
            ].forEach(name => {
                const field = form.elements.namedItem(name);

                if (field) {
                    field.value = item[name] ?? '';
                }
            });
        }

        dialog('pajakFormDialog');
    }

    $('#pajakTambah').addEventListener('click', () => {
        openForm();
    });

    // =====================================================
    // 13. DETAIL DAN AKSI TABEL
    // =====================================================

    $('#pajakTableBody').addEventListener(
        'click',
        async event => {
            const button = event.target.closest('button');

            if (!button) return;

            const id =
                button.dataset.pajakView ||
                button.dataset.pajakEdit ||
                button.dataset.pajakDelete;

            const item = findVehicle(id);

            if (!item) return;

            if (button.dataset.pajakView) {
                showDetail(item);
                return;
            }

            if (button.dataset.pajakEdit) {
                openForm(item);
                return;
            }

            if (
                button.dataset.pajakDelete &&
                item.pajak_id
            ) {
                const confirmed = confirm(
                    `Hapus catatan pajak ${item.nomor_polisi}?\n` +
                    'Inventaris kendaraan tetap disimpan.'
                );

                if (!confirmed) return;

                try {
                    await api(
                        `${endpoint}/${Number(item.pajak_id)}`,
                        { method: 'DELETE' }
                    );

                    await loadPajak();

                } catch (error) {
                    alert(
                        'Gagal menghapus pajak: ' +
                        error.message
                    );
                }
            }
        }
    );

    // =====================================================
    // 14. MODAL DETAIL
    // =====================================================

    function showDetail(item) {
        $('#pajakDetailTitle').textContent =
            'Pajak — ' + item.nomor_polisi;

        const fields = [
            ['Nama Kendaraan', item.nama_kendaraan],
            ['Nomor Polisi', item.nomor_polisi],
            ['Merk / Tipe', item.merk],
            ['Lokasi', item.lokasi],
            ['Tahun', item.tahun],
            ['Tanggal Bayar', date(item.tanggal_bayar)],
            ['Jatuh Tempo', date(item.jatuh_tempo)],
            ['Nominal Pajak', money(item.nominal)],
            ['Nomor STNK', item.nomor_stnk],
            ['Keterangan', item.keterangan],
            ['Status', STATUS[item.status]]
        ];

        $('#pajakDetailData').innerHTML =
            fields.map(([label, value]) => `
                <div>
                    <dt>${esc(label)}</dt>
                    <dd>${esc(value ?? '—')}</dd>
                </div>
            `).join('');

        $('#pajakDetailDocument').innerHTML =
            item.ada_dokumen && item.pajak_id
                ? `
                    <a
                        class="pajak-btn outline"
                        href="${endpoint}/${Number(item.pajak_id)}/dokumen"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i data-lucide="file-text"></i>
                        Lihat Dokumen Pajak (PDF)
                    </a>
                `
                : '';

        dialog('pajakDetailDialog');
    }

    // =====================================================
    // 15. SIMPAN DATA PAJAK
    // =====================================================

    form.addEventListener('submit', async event => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const errorBox = $('#pajakFormError');
        const submit = $('#pajakSimpan');

        errorBox.hidden = true;
        submit.disabled = true;

        try {
            const data = new FormData(form);

            const url = editing
                ? `${endpoint}/${Number(editing)}`
                : endpoint;

            // Laravel: POST untuk Create,
            // POST + _method=PUT untuk Update.
            if (editing) {
                data.append('_method', 'PUT');
            }

            await api(url, {
                method: 'POST',
                body: data
            });

            dialog('pajakFormDialog', false);

            await loadPajak();

        } catch (error) {
            errorBox.textContent = error.message;
            errorBox.hidden = false;

        } finally {
            submit.disabled = false;
        }
    });

});

