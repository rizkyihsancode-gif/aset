
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const root = document.getElementById('mesinPage');

    if (!root || root.dataset.initialized === '1') return;
    root.dataset.initialized = '1';

    // ==========================================
    // HELPER
    // ==========================================


const $ = (selector, node = root) => {
    return node.querySelector(selector)
        ?? document
            .getElementById('mesinPage')
            ?.querySelector(selector)
        ?? null;
};


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

// ==========================================================
// MODE FORM K.I.B B SESUAI DUA TABEL EXCEL REFERENSI
// 31.08: Kendaraan, selain itu: Peralatan & Mesin.
// Satu set field asli dipindah antar kelompok. Tidak ada input duplikat.
// ==========================================================
const standardFields = $('#mesinStandardFields');
const vehicleGroups = $('#mesinVehicleGroups');
const vehicleBadge = $('#mesinVehicleBadge');
const commonGrid = $('#mesinCommonGrid');
const commonSection = $('#mesinCommonSection');
const extraGrid = $('#mesinExtraGrid');
const extraDetails = $('#mesinExtraDetails');
const step3Title = $('#mesinStep3Title');
const step3Description = $('#mesinStep3Desc');
const remarkLabel = form.querySelector('[name="ket"]')?.closest('label');
const barangSelect = standardFields?.querySelector('[name="id_barang"]');
const originalDescription = step3Description?.textContent.trim() || '';
const originalFieldLabels = standardFields ? [...standardFields.children] : [];
const allFieldLabels = new Map();
for (const label of originalFieldLabels) {
    const input = label.querySelector('[name]');
    if (input) allFieldLabels.set(input.name, label);
}
if (remarkLabel) allFieldLabels.set('ket', remarkLabel);
const submitLabel = $('#mesinSubmitLabel');
const formTitle = $('#mesinFormTitle');
const kodeInventarisField = form.elements.namedItem('kode');
let kodeInventarisAuto = '';
let isVehicleMode = false;
let renderedFormMode = null;

// Urutan sama dengan kolom Excel; No. adalah nomor urut otomatis saat laporan.
const machineColumns = [
    'id_barang', 'kode', 'reg', 'merk', 'ukuran', 'fungsi', 'guna',
    'bahan', 'kondisi', 'tahun', 'asal', 'nomor_dokumen', 'harga', 'ket'
];
const vehicleColumns = [
    ['A', 'Identitas Kendaraan', ['id_barang', 'kode', 'reg', 'merk', 'ukuran', 'bahan', 'tahun']],
    ['B', 'Nomor Identitas Kendaraan', ['pabrik', 'rangka', 'nomor_mesin', 'polisi', 'bpkb']],
    ['C', 'Perolehan dan Keterangan', ['asal', 'ket']],
];
const commonColumns = ['status_kepemilikan', 'foto', 'dokumen'];
const machineExtraColumns = ['susut', 'struktur'];
const vehicleExtraColumns = ['harga', 'susut', 'kondisi', 'fungsi', 'guna', 'struktur'];
const labelsByMode = {
    machine: {
        id_barang: 'Nama Barang *', kode: 'Kode Inventaris *',
        reg: 'No. Register', merk: 'Merk / Type', ukuran: 'Ukuran',
        fungsi: 'Fungsi', guna: 'Penggunaan', bahan: 'Bahan',
        kondisi: 'Kondisi (Baik / Rusak Ringan / Rusak Berat)',
        tahun: 'Tahun Pengadaan *', asal: 'Asal Usul',
        nomor_dokumen: 'No. Dokumen', harga: 'Harga (Rp)', ket: 'Keterangan',
    },
    vehicle: {
        id_barang: 'Nama Barang / Jenis Barang *', kode: 'Kode Barang *',
        reg: 'Nomor Register', merk: 'Merk / Type', ukuran: 'Ukuran / CC',
        bahan: 'Bahan', tahun: 'Tahun Pembelian *',
        pabrik: 'Nomor Pabrik', rangka: 'Nomor Rangka',
        nomor_mesin: 'Nomor Mesin', polisi: 'Nomor Polisi',
        bpkb: 'Nomor BPKB', asal: 'Asal Usul / Cara Perolehan',
        ket: 'Keterangan',
    },
};
const originalTextNodes = new Map();
for (const [name, label] of allFieldLabels) {
    const node = [...label.childNodes].find(child => child.nodeType === 3 && child.textContent.trim());
    if (node) originalTextNodes.set(name, node);
}
function setFormFieldCaptions(vehicle) {
    const captions = labelsByMode[vehicle ? 'vehicle' : 'machine'];
    for (const [name, node] of originalTextNodes) {
        const caption = captions[name];
        if (caption) node.textContent = `\n                                    ${caption}\n                                    `;
    }
}
function syncKodeInventarisKendaraan() {
    if (!isVehicleMode || !barangSelect || !kodeInventarisField) return;
    const kodeBarang = String(barangSelect.selectedOptions[0]?.dataset.kodeBarang || '').trim();
    const existing = String(kodeInventarisField.value || '').trim();
    if (kodeBarang && (!existing || existing === kodeInventarisAuto)) {
        kodeInventarisField.value = kodeBarang;
        kodeInventarisAuto = kodeBarang;
    }
}
barangSelect?.addEventListener('change', syncKodeInventarisKendaraan);
kodeInventarisField?.addEventListener('input', () => {
    if (kodeInventarisField.value.trim() !== kodeInventarisAuto) kodeInventarisAuto = '';
});

function setJenisFormMesin(kodeAktiva, namaAktiva = '') {
    const kode = String(kodeAktiva || '').trim();
    const kendaraan = /^31\.08(?:\.|$)/.test(kode);
    isVehicleMode = kendaraan;
    if (!standardFields || !vehicleGroups || !remarkLabel || !commonGrid || !extraGrid) return;

    // Tidak membuat field baru: semua label/input tetap satu, hanya pindah kontainer.
    // Peralihan mode tidak menghapus isi input milik inventaris yang sedang diedit.
    if (renderedFormMode !== kendaraan) {
        standardFields.replaceChildren();
        vehicleGroups.replaceChildren();
        commonGrid.replaceChildren();
        extraGrid.replaceChildren();

        const put = (container, names) => {
            for (const name of names) {
                const label = allFieldLabels.get(name);
                if (label) container.append(label);
            }
        };
        if (kendaraan) {
            for (const [letter, title, names] of vehicleColumns) {
                const section = document.createElement('section');
                section.className = 'mesin-vehicle-group';
                const heading = document.createElement('h4');
                heading.textContent = `${letter}. ${title}`;
                section.append(heading);
                const grid = document.createElement('div');
                grid.className = 'mesin-form-grid cols-2';
                put(grid, names);
                section.append(grid);
                vehicleGroups.append(section);
            }
            put(extraGrid, vehicleExtraColumns);
        } else {
            put(standardFields, machineColumns);
            put(extraGrid, machineExtraColumns);
        }
        put(commonGrid, commonColumns);
        standardFields.hidden = kendaraan;
        vehicleGroups.hidden = !kendaraan;
        renderedFormMode = kendaraan;
    }
    setFormFieldCaptions(kendaraan);
    if (step3Title) step3Title.textContent = kendaraan
        ? 'Form K.I.B B — Kendaraan'
        : 'Form K.I.B B — Peralatan dan Mesin';
    if (submitLabel) submitLabel.textContent = kendaraan
        ? 'Simpan Data Kendaraan' : 'Simpan Data Mesin';
    if (formTitle && $('#mesinMethod')?.disabled) formTitle.textContent = kendaraan
        ? 'Tambah Data Kendaraan' : 'Tambah Data Mesin';
    formDialog?.classList.toggle('is-vehicle-mode', kendaraan);
    if (step3Description) step3Description.textContent = kendaraan
        ? 'Kolom utama mengikuti K.I.B B Kendaraan (15 kolom). Nomor Pabrik, Rangka, Mesin, Polisi dan BPKB khusus kendaraan.'
        : 'Kolom utama mengikuti K.I.B B Peralatan dan Mesin (17 kolom), tanpa atribut kendaraan.';
    if (vehicleBadge) {
        vehicleBadge.hidden = !kendaraan;
        vehicleBadge.textContent = kendaraan ? `${kode} — ${namaAktiva || 'Kendaraan'}` : '';
    }
    if (extraDetails) extraDetails.open = false;
    syncKodeInventarisKendaraan();
}

// Field nonaktif yang sementara terlepas dari DOM harus tetap di-reset.
// Ini mencegah identitas kendaraan sebelumnya tertinggal saat Tambah berikutnya.
function resetDetachedFieldsMesin() {
    for (const label of allFieldLabels.values()) {
        if (label.isConnected) continue;
        const field = label.querySelector('[name]');
        if (!field) continue;
        if (field instanceof HTMLSelectElement) field.selectedIndex = 0;
        else if (field.type === 'file') field.value = '';
        else field.value = '';
    }
}

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
        'Status Kepemilikan',
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
            row.dataset.exportKepemilikan || 'Belum Diatur',
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
                item.nilai,
                item.kode_aktiva,
                item.nama_aktiva
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
                                ${escapeHtml(selectedJenis(item))}
                            </small>
                            <small class="mesin-source-aktiva">
                                ${escapeHtml(item.kode_aktiva || 'Kode Aktiva belum tercatat')}
                                ${escapeHtml(item.nama_aktiva || '')}
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
        setJenisFormMesin(source.kode_aktiva, source.nama_aktiva);
        renderPending();

        // Form tetap bisa dilanjutkan.
        // Fokus ke kolom pencarian, bukan select tersembunyi.
        const cariBarang = form.querySelector(
            '[name="id_barang"]'
        )?.closest('.mesin-searchable-wrap')
            ?.querySelector('.mesin-searchable-input');

        (cariBarang || form.querySelector('[name="id_barang"]'))?.focus();
    });

    // ==========================================
    // RESET FORM
    // ==========================================

    function resetForm() {
        form.reset();
        resetDetachedFieldsMesin();
        kodeInventarisAuto = '';

        // Opsi Barang historis hanya untuk Edit, jangan terbawa ke Tambah.
        barangSelect?.querySelectorAll('option[data-historical="1"]')
            .forEach(option => option.remove());

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
        setJenisFormMesin('');
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

            // Dukung inventaris yang terhubung voucher maupun klasifikasi legacy.
            let kodeAktivaEdit = item.kode_aktiva || '';
            let namaAktivaEdit = item.nama_aktiva || '';
            if (!kodeAktivaEdit) {
                try {
                    const klasifikasi = await getJson(`${recordUrl(id)}/klasifikasi`);
                    kodeAktivaEdit = klasifikasi.data?.kode_aktiva || '';
                    namaAktivaEdit = klasifikasi.data?.nama_aktiva || '';
                } catch (error) {
                    console.warn('Klasifikasi Edit Mesin tidak tersedia; memakai form standar.', error);
                }
            }
            setJenisFormMesin(kodeAktivaEdit, namaAktivaEdit);

            $('#mesinMethod').disabled = false;
            $('#mesinMethod').value = 'PUT';

            form.action = recordUrl(id);

            $('#mesinPendingSection').hidden = true;

            $('#mesinFormTitle').textContent =
                `${isVehicleMode ? 'Edit Data Kendaraan' : 'Edit Data Mesin'} #${id}`;

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

            // Inventaris lama boleh memiliki Barang yang kini Nonaktif.
            // Tampilkan sebagai nilai historis hanya ketika Edit.
            const historicalBarang = String(item.id_barang ?? '');
            if (barangSelect && historicalBarang &&
                !Array.from(barangSelect.options).some(option => option.value === historicalBarang)) {
                const option = document.createElement('option');
                option.value = historicalBarang;
                option.textContent = `${item.nama_barang || 'Barang lama'} (historis)`;
                option.dataset.historical = '1';
                barangSelect.append(option);
            }

            const fields = [
                'id_barang',
                'status_kepemilikan',
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
                'nomor_dokumen',
                'ket'
            ];

            fields.forEach(name => {
                const field = form.elements.namedItem(name)
                    || allFieldLabels.get(name)?.querySelector('[name]');

                if (field) {
                    field.value = item[name] ?? '';
                }
            });

            const noMesin = allFieldLabels.get('nomor_mesin')?.querySelector('[name]');

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

    // ========================================================
    // DETAIL K.I.B B: POLA K.I.B A TANAH
    // --------------------------------------------------------
    // Tabel inventaris tampil langsung. Satu item = satu baris.
    // Klik baris/Berkas membuka foto, PDF, Nilai Lokasi,
    // Edit dan Hapus pada panel terpisah di bawah tabel.
    // Tabel mesin dan kendaraan memakai format Excel sendiri.
    // ========================================================

    const mesinOwnerLabels = Object.freeze({
        perumdam: 'Perumdam',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    });

    const mesinSheetState = {
        items: [],
        location: {},
        selectedId: null,
        activeTab: 'machine'
    };

    function mesinSheetCell(value) {
        if (value === null || value === undefined) return '—';
        const text = String(value).trim();
        return text && text !== '-' ? escapeHtml(text) : '—';
    }

    function mesinOwnerBadge(value) {
        const key = String(value ?? '').trim().toLowerCase();
        const label = mesinOwnerLabels[key] || 'Belum Diatur';
        return `<span class="mesin-owner-badge ${mesinOwnerLabels[key] ? 'is-owned' : 'is-empty'}">${escapeHtml(label)}</span>`;
    }

    function isVehicleItem(item) {
        // Klasifikasi wajib menggunakan Kode Aktiva, bukan adanya Polisi/Rangka.
        // Field kendaraan warisan tidak boleh memindahkan mesin biasa ke tab Kendaraan.
        const code = String(item.kode_aktiva || '').trim();
        return /^31\.08(?:\.|$)/.test(code);
    }

    function mesinConditionMark(item, kind) {
        const condition = String(item.kondisi ?? '').trim().toLowerCase();
        const matches = kind === 'baik'
            ? condition === 'baik'
            : kind === 'ringan'
                ? condition.includes('rusak ringan')
                : condition.includes('rusak berat');
        return matches ? '<strong class="mesin-sheet-check" aria-label="Ya">✓</strong>' : '—';
    }

    function mesinSheetId(item) {
        const id = Number(item.id);
        return Number.isSafeInteger(id) && id > 0 ? id : null;
    }

    function mesinHasFile(item, kind) {
        const prefix = kind === 'dokumen' ? 'kib/mesin/dokumen/' : 'kib/mesin/foto/';
        const value = kind === 'dokumen' ? item.dok : item.img;
        return String(value || '').startsWith(prefix);
    }

    function mesinSheetDocument(item) {
        return mesinHasFile(item, 'dokumen') ? 'Tersedia' : '—';
    }

    function mesinSheetSearchText(item) {
        return escapeHtml([
            item.nama_barang, item.kode_barang, item.kode, item.reg,
            item.merk, item.ukuran, item.fungsi, item.guna, item.bahan,
            item.polisi, item.rangka, item.mesin, item.bpkb,
            item.asal, item.tahun, item.ket, item.status_kepemilikan
        ].map(value => String(value ?? '')).join(' ').toLocaleLowerCase('id-ID'));
    }

    function mesinSheetAction(item) {
        const id = mesinSheetId(item);
        if (!id) return '—';
        return `<button type="button" class="mesin-sheet-open" data-sheet-open="${id}" aria-label="Lihat berkas dan tindakan inventaris nomor ${id}">Berkas</button>`;
    }

    function renderMachineRow(item, index) {
        const id = mesinSheetId(item);
        return `<tr class="mesin-sheet-row" tabindex="0" aria-selected="false"
            data-sheet-id="${id || ''}" data-sheet-search="${mesinSheetSearchText(item)}">
            <td class="mesin-sheet-no">${index + 1}</td>
            <td class="mesin-sheet-name">${mesinSheetCell(item.nama_barang)}</td>
            <td class="mesin-sheet-code">${mesinSheetCell(item.kode)}</td>
            <td>${mesinSheetCell(item.reg)}</td>
            <td>${mesinSheetCell(item.merk)}</td>
            <td>${mesinSheetCell(item.ukuran)}</td>
            <td>${mesinSheetCell(item.fungsi)}</td>
            <td>${mesinSheetCell(item.guna)}</td>
            <td>${mesinSheetCell(item.bahan)}</td>
            <td class="mesin-sheet-center">${mesinConditionMark(item, 'baik')}</td>
            <td class="mesin-sheet-center">${mesinConditionMark(item, 'ringan')}</td>
            <td class="mesin-sheet-center">${mesinConditionMark(item, 'berat')}</td>
            <td class="mesin-sheet-center">${mesinSheetCell(item.tahun)}</td>
            <td>${mesinSheetCell(item.asal)}</td>
            <td>${mesinSheetCell(item.nomor_dokumen)}</td>
            <td class="mesin-sheet-money">${money(item.harga)}</td>
            <td>${mesinSheetCell(item.ket)}</td>
            <td class="mesin-sheet-owner">${mesinOwnerBadge(item.status_kepemilikan)}</td>
            <td class="mesin-sheet-actions-cell">${mesinSheetAction(item)}</td>
        </tr>`;
    }

    function renderVehicleRow(item, index) {
        const id = mesinSheetId(item);
        return `<tr class="mesin-sheet-row" tabindex="0" aria-selected="false"
            data-sheet-id="${id || ''}" data-sheet-search="${mesinSheetSearchText(item)}">
            <td class="mesin-sheet-no">${index + 1}</td>
            <td class="mesin-sheet-code">${mesinSheetCell(item.kode_barang || item.kode)}</td>
            <td class="mesin-sheet-name">${mesinSheetCell(item.nama_barang)}</td>
            <td class="mesin-sheet-center">${mesinSheetCell(item.reg)}</td>
            <td>${mesinSheetCell(item.merk)}</td>
            <td>${mesinSheetCell(item.ukuran)}</td>
            <td>${mesinSheetCell(item.bahan)}</td>
            <td class="mesin-sheet-center">${mesinSheetCell(item.tahun)}</td>
            <td>${mesinSheetCell(item.pabrik)}</td>
            <td>${mesinSheetCell(item.rangka)}</td>
            <td>${mesinSheetCell(item.mesin)}</td>
            <td>${mesinSheetCell(item.polisi)}</td>
            <td>${mesinSheetCell(item.bpkb)}</td>
            <td>${mesinSheetCell(item.asal)}</td>
            <td>${mesinSheetCell(item.ket)}</td>
            <td class="mesin-sheet-owner">${mesinOwnerBadge(item.status_kepemilikan)}</td>
            <td class="mesin-sheet-actions-cell">${mesinSheetAction(item)}</td>
        </tr>`;
    }

    function renderMachineSheet(items) {
        return `<div class="mesin-excel-scroll" tabindex="0" role="region" aria-label="Tabel K.I.B B Peralatan dan Mesin, geser horizontal untuk melihat semua kolom">
            <table class="mesin-excel-table mesin-excel-machine">
                <caption class="mesin-sheet-visually-hidden">Kartu inventaris peralatan dan mesin, termasuk status kepemilikan</caption>
                <thead>
                    <tr class="mesin-sheet-group-head">
                        <th rowspan="2">No.</th><th rowspan="2">Nama Barang</th>
                        <th rowspan="2">Kode Inventaris</th><th rowspan="2">No. Register</th>
                        <th rowspan="2">Merk / Type</th><th rowspan="2">Ukuran</th>
                        <th rowspan="2">Fungsi</th><th rowspan="2">Penggunaan</th>
                        <th rowspan="2">Bahan</th><th colspan="3">Kondisi</th>
                        <th rowspan="2">Tahun Pengadaan</th><th rowspan="2">Asal Usul</th>
                        <th rowspan="2">No. Dokumen</th><th rowspan="2">Harga (Rp)</th>
                        <th rowspan="2">Keterangan</th><th rowspan="2">Status Kepemilikan</th>
                        <th rowspan="2">Detail</th>
                    </tr>
                    <tr class="mesin-sheet-sub-head"><th>Baik</th><th>Rusak Ringan</th><th>Rusak Berat</th></tr>
                </thead>
                <tbody>${items.map(renderMachineRow).join('')}</tbody>
            </table>
        </div>`;
    }

    function renderVehicleSheet(items) {
        return `<div class="mesin-excel-scroll" tabindex="0" role="region" aria-label="Tabel K.I.B B Kendaraan, geser horizontal untuk melihat semua kolom">
            <table class="mesin-excel-table mesin-excel-vehicle">
                <caption class="mesin-sheet-visually-hidden">Kartu inventaris kendaraan, termasuk status kepemilikan</caption>
                <thead>
                    <tr class="mesin-sheet-group-head">
                        <th rowspan="2">No.</th><th rowspan="2">Kode Barang</th>
                        <th rowspan="2">Nama Barang / Jenis</th><th rowspan="2">Nomor Register</th>
                        <th rowspan="2">Merk / Type</th><th rowspan="2">Ukuran / CC</th>
                        <th rowspan="2">Bahan</th><th rowspan="2">Tahun Pembelian</th>
                        <th colspan="5">Nomor</th>
                        <th rowspan="2">Asal Usul / Cara Perolehan</th>
                        <th rowspan="2">Keterangan</th><th rowspan="2">Status Kepemilikan</th>
                        <th rowspan="2">Detail</th>
                    </tr>
                    <tr class="mesin-sheet-sub-head"><th>Pabrik</th><th>Rangka</th><th>Mesin</th><th>Polisi</th><th>BPKB</th></tr>
                </thead>
                <tbody>${items.map(renderVehicleRow).join('')}</tbody>
            </table>
        </div>`;
    }

    function renderMesinSheetAttachments(item) {
        const id = mesinSheetId(item);
        if (!id) return '';

        const photoAvailable = mesinHasFile(item, 'foto');
        const pdfAvailable = mesinHasFile(item, 'dokumen');
        const photoUrl = `${recordUrl(id)}/file/foto`;
        const pdfUrl = `${recordUrl(id)}/file/dokumen`;
        const selectedName = escapeHtml(item.nama_barang || 'Inventaris');
        const locationId = Number(mesinSheetState.location.id);
        const locationIsValid = Number.isSafeInteger(locationId) && locationId > 0;

        return `<div class="mesin-sheet-attachment-head">
            <div>
                <small>LAMPIRAN &amp; TINDAKAN</small>
                <h4>${selectedName}</h4>
                <p>Kode: ${mesinSheetCell(item.kode_barang || item.kode)}
                    · Register: ${mesinSheetCell(item.reg)}
                    · ${mesinOwnerBadge(item.status_kepemilikan)}</p>
            </div>
            <div class="mesin-sheet-attachment-actions">
                ${locationIsValid ? `<button type="button" class="mesin-sheet-mini value" data-sheet-nilai="${locationId}">Nilai Lokasi</button>` : ''}
                <button type="button" class="mesin-sheet-mini edit" data-edit="${id}">Edit</button>
                <button type="button" class="mesin-sheet-mini delete" data-delete="${id}">Hapus</button>
                <button type="button" class="mesin-sheet-mini close" data-sheet-close="1">Tutup Berkas</button>
            </div>
        </div>
        <div class="mesin-sheet-attachment-grid">
            <section class="mesin-sheet-attachment-card">
                <h5>Foto Inventaris</h5>
                ${photoAvailable
                    ? `<a href="${photoUrl}" target="_blank" rel="noopener noreferrer" class="mesin-sheet-photo-link"><img src="${photoUrl}" loading="lazy" alt="Foto ${selectedName}"></a><a href="${photoUrl}" target="_blank" rel="noopener noreferrer" class="mesin-sheet-attachment-link">Lihat Foto</a>`
                    : '<div class="mesin-sheet-no-photo"><span>▧</span>Foto belum tersedia</div>'}
            </section>
            <section class="mesin-sheet-attachment-card">
                <h5>Dokumen PDF / Hasil Scan</h5>
                ${pdfAvailable
                    ? `<div class="mesin-sheet-document-row"><span>Dokumen inventaris #${id}</span><div><a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="mesin-sheet-attachment-link">Lihat PDF</a><a href="${pdfUrl}" download class="mesin-sheet-attachment-link secondary">Unduh</a></div></div>`
                    : '<div class="mesin-sheet-no-document">Belum ada dokumen PDF untuk inventaris ini.</div>'}
            </section>
        </div>`;
    }

    function hideMesinSheetAttachments() {
        mesinSheetState.selectedId = null;
        const panel = $('#mesinSheetAttachments');
        if (panel) {
            panel.hidden = true;
            panel.replaceChildren();
        }
        $$('.mesin-sheet-row', $('#mesinDetailBody')).forEach(row => {
            row.classList.remove('is-selected');
            row.setAttribute('aria-selected', 'false');
        });
    }

    function selectMesinSheetItem(id) {
        const numericId = Number(id);
        const item = mesinSheetState.items.find(row => Number(row.id) === numericId);
        if (!item) return;

        const panel = $('#mesinSheetAttachments');
        if (!panel) return;
        mesinSheetState.selectedId = numericId;

        $$('.mesin-sheet-row', $('#mesinDetailBody')).forEach(row => {
            const selected = Number(row.dataset.sheetId) === numericId;
            row.classList.toggle('is-selected', selected);
            row.setAttribute('aria-selected', selected ? 'true' : 'false');
        });

        panel.innerHTML = renderMesinSheetAttachments(item);
        panel.hidden = false;
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function applyMesinSheetSearch() {
        const query = String($('#mesinSheetSearch')?.value ?? '')
            .trim().toLocaleLowerCase('id-ID');
        const active = $(`[data-sheet-panel="${mesinSheetState.activeTab}"]`);
        let visible = 0;
        $$('.mesin-sheet-row', $('#mesinDetailBody')).forEach(row => {
            const matched = row.dataset.sheetSearch.includes(query);
            row.hidden = !matched;
            if (matched && active?.contains(row)) visible++;
        });
        const count = $('#mesinSheetVisibleCount');
        if (count) count.textContent = `${visible} data`;
        if (mesinSheetState.selectedId !== null) {
            const selected = $(`.mesin-sheet-row[data-sheet-id="${mesinSheetState.selectedId}"]`);
            if (!selected || selected.hidden || !active?.contains(selected)) hideMesinSheetAttachments();
        }
    }

    async function showDetail(lokasiId) {
        openDialog(detailDialog);
        const body = $('#mesinDetailBody');
        body.textContent = 'Memuat daftar inventaris...';
        mesinSheetState.items = [];
        mesinSheetState.selectedId = null;

        try {
            const result = await getJson(locationUrl(lokasiId));
            if (!detailDialog.open) return;

            const location = result.lokasi || {};
            const items = Array.isArray(result.data) ? result.data : [];
            mesinSheetState.items = items;
            mesinSheetState.location = location;

            $('#mesinDetailTitle').textContent = `DATA K.I.B B · ${String(location.lokasi || 'PERALATAN DAN MESIN').toUpperCase()}`;
            $('#mesinDetailAddress').textContent = location.alamat || 'Perumda Tirta Kencana Kota Samarinda';

            if (!items.length) {
                body.textContent = 'Belum ada data Peralatan, Mesin, atau Kendaraan pada lokasi ini.';
                return;
            }

            const machines = items.filter(item => !isVehicleItem(item));
            const vehicles = items.filter(isVehicleItem);
            const firstTab = machines.length ? 'machine' : 'vehicle';
            mesinSheetState.activeTab = firstTab;

            body.innerHTML = `
                <section class="mesin-sheet-section" aria-label="Kartu inventaris K.I.B B">
                    <div class="mesin-sheet-toolbar">
                        <div class="mesin-sheet-toolbar-heading">
                            <h3>Daftar Peralatan, Mesin &amp; Kendaraan</h3>
                            <p>Tampilan tabel mengikuti format K.I.B B perusahaan. Satu baris mewakili satu inventaris.</p>
                        </div>
                        <div class="mesin-sheet-toolbar-controls">
                            <label class="mesin-sheet-search">
                                <i data-lucide="search"></i>
                                <input id="mesinSheetSearch" type="search" autocomplete="off"
                                    placeholder="Cari barang, kode, register, atau kendaraan..."
                                    aria-label="Cari inventaris K.I.B B">
                            </label>
                            <span class="mesin-sheet-count" id="mesinSheetVisibleCount">${firstTab === 'machine' ? machines.length : vehicles.length} data</span>
                        </div>
                    </div>
                    <div class="mesin-sheet-identitas mesin-identitas-ringkas" aria-label="Identitas K.I.B B lokasi">
                        ${(() => {
                            const uniqueValue = key => {
                                const values = [...new Set(items.map(x => String(x[key] || '').trim()).filter(Boolean))];
                                return values.length === 1 ? values[0] : values.length ? 'BERAGAM' : '-';
                            };
                            const fields = [
                                ['PROVINSI', 'KALIMANTAN TIMUR'],
                                ['KOTA', 'SAMARINDA'],
                                ['UNIT', 'PERUMDA TIRTA KENCANA'],
                                ['DEPARTEMEN', uniqueValue('departemen')],
                                ['DIVISI', uniqueValue('divisi')],
                                ['LOKASI', location.lokasi || '-'],
                                ['ALAMAT', location.alamat || '-'],
                                ['KODE AKTIVA', uniqueValue('kode_aktiva')],
                            ];
                            return fields.map(([key, value]) => `<div><strong>${key}</strong><span>: ${escapeHtml(value)}</span></div>`).join('');
                        })()}
                    </div>
                    <div class="mesin-sheet-actions-top">
                        <div><strong>Seluruh inventaris lokasi</strong>
                            <small>${items.length} barang (Peralatan/Mesin: ${machines.length}, Kendaraan: ${vehicles.length})</small></div>
                        <button type="button" class="mesin-button mesin-sheet-print-location"
                            data-mesin-report-lokasi="${Number(location.id) || Number(lokasiId)}">
                            <i data-lucide="file-spreadsheet"></i>
                            <span>Print Excel Lokasi · ${items.length} Data</span>
                        </button>
                    </div>
                    <div class="mesin-sheet-tabs" role="tablist" aria-label="Jenis tabel K.I.B B">
                        <button type="button" class="mesin-sheet-tab ${firstTab === 'machine' ? 'active' : ''}"
                            data-sheet-tab="machine" role="tab" aria-selected="${firstTab === 'machine'}">Peralatan &amp; Mesin (${machines.length})</button>
                        <button type="button" class="mesin-sheet-tab ${firstTab === 'vehicle' ? 'active' : ''}"
                            data-sheet-tab="vehicle" role="tab" aria-selected="${firstTab === 'vehicle'}">Kendaraan (${vehicles.length})</button>
                    </div>
                    <div class="mesin-sheet-panel" data-sheet-panel="machine" role="tabpanel" ${firstTab !== 'machine' ? 'hidden' : ''}>
                        ${machines.length ? renderMachineSheet(machines) : '<p class="mesin-sheet-empty">Tidak ada data Peralatan/Mesin pada lokasi ini.</p>'}
                    </div>
                    <div class="mesin-sheet-panel" data-sheet-panel="vehicle" role="tabpanel" ${firstTab !== 'vehicle' ? 'hidden' : ''}>
                        ${vehicles.length ? renderVehicleSheet(vehicles) : '<p class="mesin-sheet-empty">Tidak ada data Kendaraan pada lokasi ini.</p>'}
                    </div>
                    <div class="mesin-sheet-footnote">
                        <span>↔ Geser tabel ke kanan untuk melihat kolom lanjutan</span>
                        <span>▤ Klik <b>Berkas</b> untuk foto, PDF, Edit dan Hapus</span>
                        <span>Excel lokasi mencakup <b>seluruh ${items.length} barang</b>, tanpa Status Kepemilikan</span>
                    </div>
                </section>
                <section id="mesinSheetAttachments" class="mesin-sheet-attachments" aria-label="Lampiran inventaris terpilih" hidden></section>
            `;
            refreshIcons();
        } catch (error) {
            body.textContent = `Gagal memuat detail K.I.B B: ${error.message}`;
        }
    }

    // Delegasi tetap pada #mesinDetailBody; tombol CRUD lama
    // (data-edit dan data-delete) tetap ditangani di bawah.
    $('#mesinDetailBody').addEventListener('click', event => {
        const tab = event.target.closest('[data-sheet-tab]');
        if (tab) {
            mesinSheetState.activeTab = tab.dataset.sheetTab;
            $$('.mesin-sheet-tab', $('#mesinDetailBody')).forEach(button => {
                const active = button.dataset.sheetTab === mesinSheetState.activeTab;
                button.classList.toggle('active', active);
                button.setAttribute('aria-selected', String(active));
            });
            $$('[data-sheet-panel]', $('#mesinDetailBody')).forEach(panel => {
                panel.hidden = panel.dataset.sheetPanel !== mesinSheetState.activeTab;
            });
            hideMesinSheetAttachments();
            applyMesinSheetSearch();
            return;
        }
        if (event.target.closest('[data-sheet-close]')) {
            hideMesinSheetAttachments();
            return;
        }
        const nilai = event.target.closest('[data-sheet-nilai]');
        if (nilai) {
            showNilaiMesin(nilai.dataset.sheetNilai, mesinSheetState.location.lokasi || '');
            return;
        }
        const openButton = event.target.closest('[data-sheet-open]');
        if (openButton) {
            selectMesinSheetItem(openButton.dataset.sheetOpen);
            return;
        }
        const row = event.target.closest('.mesin-sheet-row');
        if (row?.dataset.sheetId) selectMesinSheetItem(row.dataset.sheetId);
    });

    $('#mesinDetailBody').addEventListener('keydown', event => {
        const row = event.target.closest('.mesin-sheet-row');
        if (!row || !['Enter', ' '].includes(event.key)) return;
        if (event.target.closest('button, a, input')) return;
        event.preventDefault();
        if (row.dataset.sheetId) selectMesinSheetItem(row.dataset.sheetId);
    });

    $('#mesinDetailBody').addEventListener('input', event => {
        if (event.target.id === 'mesinSheetSearch') applyMesinSheetSearch();
    });


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
 * MODUL MASA PAJAK KENDARAAN
 *
 * FILE: public/js/pages/kib/mesin.js
 *
 * Kode Aktiva : 31.08.%
 * Pengguna    : mesins.guna
 * Merk / Type : mesins.merk
 * No. Polisi  : mesins.polisi
 * Masa Berlaku: 8 atau 12 bulan
 * Peringatan  : H-14 sampai H-1
 * Kedaluwarsa : H-0 dan sesudahnya
 *
 * Seluruh fungsi inventaris Mesin sebelumnya
 * tetap berada di bagian atas file ini.
 * ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ======================================================
    // 01. INISIALISASI
    // ======================================================

    const halaman = document.getElementById('mesinPage');

    const panel = document.getElementById(
        'mesinPajakPanel'
    );

    const panelDaftar = document.getElementById(
        'mesinDaftarPanel'
    );

    if (
        !halaman ||
        !panel ||
        !panelDaftar ||
        panel.dataset.pajakInitialized === '1'
    ) {
        return;
    }

    panel.dataset.pajakInitialized = '1';

    const $ = selector =>
        panel.querySelector(selector)
        ?? halaman.querySelector(selector)
        ?? null;

    const $$ = selector =>
        [...panel.querySelectorAll(selector)];

    const token = panel.dataset.token;
    const baseURL = panel.dataset.base;
    const apiData = panel.dataset.api;

    const nf = new Intl.NumberFormat('id-ID');

    const statusLabel = {
        aktif: 'Aktif',
        segera_habis: 'Segera Habis',
        kedaluwarsa: 'Kedaluwarsa',
        belum_didata: 'Belum Dicatat'
    };

    let kendaraan = [];
    let halamanAktif = 1;
    let editId = null;

    let sudahDimuat = false;
    let sedangMemuat = false;
    let sedangMengirim = false;

    // ======================================================
    // 02. HELPER
    // ======================================================

    const escapeHTML = value =>
        String(value ?? '').replace(
            /[&<>"']/g,
            karakter => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[karakter]
        );

    const formatAngka = nilai =>
        nf.format(Number(nilai) || 0);

    const formatUang = nilai =>
        nilai == null || nilai === ''
            ? '—'
            : 'Rp ' + formatAngka(nilai);

    const refreshIcons = () =>
        window.lucide?.createIcons?.();

    const nomorId = value =>
        Number.isSafeInteger(Number(value)) &&
        Number(value) > 0
            ? Number(value)
            : null;

    // ======================================================
    // 03. FORMAT TANGGAL
    // ======================================================

    function parseTanggal(iso) {
        const match = String(iso ?? '')
            .slice(0, 10)
            .match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

        if (!match) {
            return null;
        }

        const tanggal = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );

        if (
            tanggal.getFullYear() !== Number(match[1]) ||
            tanggal.getMonth() !== Number(match[2]) - 1 ||
            tanggal.getDate() !== Number(match[3])
        ) {
            return null;
        }

        return tanggal;
    }

    function tanggalIndonesia(value) {
        const tanggal = parseTanggal(value);

        if (!tanggal) {
            return '—';
        }

        return new Intl.DateTimeFormat(
            'id-ID',
            {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }
        ).format(tanggal);
    }

    // ======================================================
    // 04. HITUNG MASA BERLAKU OTOMATIS
    // ======================================================

    /*
     * Contoh:
     *
     * Tanggal pembaruan : 12 September 2026
     * Masa berlaku      : 8 bulan
     * Berlaku s/d       : 12 Mei 2027
     *
     * Perhitungan ini menggunakan metode yang sama
     * dengan Carbon::addMonthsNoOverflow().
     */

    function hitungJatuhTempo(
        tanggal,
        bulan
    ) {
        const awal = parseTanggal(tanggal);
        const durasi = Number(bulan);

        if (
            !awal ||
            ![8, 12].includes(durasi)
        ) {
            return '';
        }

        const awalBulanTujuan = new Date(
            awal.getFullYear(),
            awal.getMonth() + durasi,
            1
        );

        const hariTerakhir = new Date(
            awalBulanTujuan.getFullYear(),
            awalBulanTujuan.getMonth() + 1,
            0
        ).getDate();

        const tujuan = new Date(
            awalBulanTujuan.getFullYear(),
            awalBulanTujuan.getMonth(),
            Math.min(
                awal.getDate(),
                hariTerakhir
            )
        );

        return [
            tujuan.getFullYear(),

            String(
                tujuan.getMonth() + 1
            ).padStart(2, '0'),

            String(
                tujuan.getDate()
            ).padStart(2, '0')

        ].join('-');
    }

    function updatePreview() {
        const hasil = hitungJatuhTempo(
            $('#pajakTanggalBayar').value,
            $('#pajakMasaBulan').value
        );

        $('#pajakTanggalPreview').value =
            hasil
                ? tanggalIndonesia(hasil)
                : '';
    }

    $('#pajakTanggalBayar').addEventListener(
        'input',
        updatePreview
    );

    $('#pajakMasaBulan').addEventListener(
        'change',
        updatePreview
    );

    // ======================================================
    // 05. NAVBAR DUA TAB
    // ======================================================

    const tabButtons = [
        ...halaman.querySelectorAll(
            '[data-mesin-tab]'
        )
    ];

    function bukaTab(
        tab,
        ubahHash = true
    ) {
        const pajak = tab === 'pajak';

        panelDaftar.hidden = pajak;
        panel.hidden = !pajak;

        halaman.classList.toggle(
            'mesin-pajak-active',
            pajak
        );

        
// =====================================================
// PERGANTIAN KARTU KPI SESUAI TAB AKTIF
// =====================================================

// Gunakan boolean yang sudah dihitung fungsi tab:
// pajak === true jika Masa Pajak aktif.

const kpiMesin = document.getElementById(
    'mesinInventarisKpiGrid'
);

const kpiPajak = document.getElementById(
    'mesinPajakKpiGrid'
);

if (kpiMesin) {
    kpiMesin.hidden = pajak;
}

if (kpiPajak) {
    kpiPajak.hidden = !pajak;
}

document.getElementById('mesinPage')
    .classList.toggle(
        'mesin-pajak-active',
        pajak
    );


        tabButtons.forEach(button => {
            const aktif =
                button.dataset.mesinTab === tab;

            button.setAttribute(
                'aria-selected',
                String(aktif)
            );

            button.tabIndex =
                aktif ? 0 : -1;
        });

        if (ubahHash) {
            const hash = pajak
                ? '#masa-pajak'
                : '#daftar-mesin';

            if (location.hash !== hash) {
                history.replaceState(
                    null,
                    '',
                    hash
                );
            }
        }

        if (pajak && !sudahDimuat) {
            muatData();
        }

        refreshIcons();
    }

    tabButtons.forEach(button => {
        button.addEventListener(
            'click',
            () => {
                bukaTab(
                    button.dataset.mesinTab
                );
            }
        );
    });

    window.addEventListener(
        'hashchange',
        () => {
            bukaTab(
                location.hash === '#masa-pajak'
                    ? 'pajak'
                    : 'daftar',
                false
            );
        }
    );

    bukaTab(
        location.hash === '#masa-pajak'
            ? 'pajak'
            : 'daftar',
        false
    );

    // ======================================================
    // 06. REQUEST AJAX LARAVEL
    // ======================================================

    async function request(
        url,
        opsi = {}
    ) {
        const response = await fetch(
            url,
            {
                credentials: 'same-origin',

                ...opsi,

                headers: {
                    Accept: 'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest',

                    'X-CSRF-TOKEN':
                        token,

                    ...(opsi.headers || {})
                }
            }
        );

        const responseText =
            await response.text();

        let json;

        try {
            json = JSON.parse(
                responseText
            );

        } catch {
            throw new Error(
                `Server tidak mengirim JSON ` +
                `(HTTP ${response.status}). ` +
                'Periksa log Laravel.'
            );
        }

        if (
            !response.ok ||
            json.success === false
        ) {
            const validasi = Object.values(
                json.errors || {}
            )
                .flat()
                .filter(Boolean)
                .join('\n');

            throw new Error(
                validasi ||
                json.message ||
                `HTTP ${response.status}`
            );
        }

        return json;
    }

    // ======================================================
    // 07. MODAL
    // ======================================================

    function tampilkanDialog(
        id,
        buka = true
    ) {
        const dialog = $('#' + id);

        if (!dialog) {
            return;
        }

        if (buka && !dialog.open) {
            dialog.showModal();
        }

        if (!buka && dialog.open) {
            dialog.close();
        }

        refreshIcons();
    }

    $$('[data-pajak-close]').forEach(
        button => {
            button.addEventListener(
                'click',
                () => {
                    tampilkanDialog(
                        button.dataset.pajakClose,
                        false
                    );
                }
            );
        }
    );

    $$('dialog').forEach(dialog => {
        dialog.addEventListener(
            'click',
            event => {
                if (event.target === dialog) {
                    dialog.close();
                }
            }
        );
    });

    // ======================================================
    // 08. LOAD KENDARAAN DARI KIBController
    // ======================================================

    async function muatData() {
        if (sedangMemuat) {
            return;
        }

        sedangMemuat = true;

        $('#pajakInfoStatus').textContent =
            'Memuat kendaraan Kode Aktiva 31.08...';

        try {
            const json = await request(
                apiData
            );

            if (
                !Array.isArray(json.data) ||
                !json.summary
            ) {
                throw new Error(
                    'Format respons kendaraan tidak sesuai.'
                );
            }

            kendaraan = json.data;
            sudahDimuat = true;

            const summary = json.summary;

            // Kartu statistik
            
// =====================================================
// KPI MASA PAJAK — SEKARANG BERADA DI HEADER
// =====================================================

// Gunakan json dan formatAngka jika itu nama
// variabel pada fungsi muatData() milikmu.

document.getElementById('pajakTotal').textContent =
    formatAngka(json.summary.total);

document.getElementById('pajakAktif').textContent =
    formatAngka(json.summary.aktif);

document.getElementById('pajakSegera').textContent =
    formatAngka(json.summary.segera_habis);

document.getElementById('pajakTerlambat').textContent =
    formatAngka(json.summary.kedaluwarsa);


            $('#pajakBelumDicatat').textContent =
                formatAngka(summary.belum_didata) +
                ' belum memiliki catatan pajak · ' +
                formatAngka(summary.data_belum_lengkap || 0) +
                ' kendaraan dengan identitas belum lengkap.';

            isiDropdown();

            halamanAktif = 1;

            gambarTabel();

            $('#pajakInfoStatus').textContent =
                `${formatAngka(kendaraan.length)} data berkode 31.08 · ` +
                `${formatAngka(summary.sudah_inventaris || 0)} inventaris · ` +
                `${formatAngka(summary.belum_inventaris || 0)} referensi Nilai Aset · ` +
                `${formatAngka(summary.data_belum_lengkap || 0)} identitas perlu dilengkapi`;

        } catch (error) {
            sudahDimuat = false;

            $('#pajakInfoStatus').textContent =
                `Gagal memuat: ${error.message}`;

            $('#pajakTableBody').innerHTML = `
                <tr>
                    <td
                        colspan="17"
                        class="pajak-empty"
                    >
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;

        } finally {
            sedangMemuat = false;
        }
    }

    // ======================================================
    // 09. ISI DROPDOWN JENIS / LOKASI / KENDARAAN
    // ======================================================

    function isiDropdown() {
        const jenis = $('#pajakJenis');
        const lokasi = $('#pajakLokasi');

        const pilihanJenis = jenis.value;
        const pilihanLokasi = lokasi.value;

        const tipe = [
            ...new Set(
                kendaraan
                    .map(k => k.jenis)
                    .filter(Boolean)
            )
        ].sort((a, b) =>
            a.localeCompare(b, 'id')
        );

        const tempat = [
            ...new Set(
                kendaraan
                    .map(k => k.lokasi)
                    .filter(Boolean)
            )
        ].sort((a, b) =>
            a.localeCompare(b, 'id')
        );

        function isi(
            select,
            judul,
            items
        ) {
            select.replaceChildren(
                new Option(
                    judul,
                    ''
                )
            );

            items.forEach(value => {
                select.add(
                    new Option(
                        value,
                        value
                    )
                );
            });
        }

        isi(
            jenis,
            'Semua Jenis Kendaraan',
            tipe
        );

        isi(
            lokasi,
            'Semua Lokasi',
            tempat
        );

        jenis.value =
            tipe.includes(pilihanJenis)
                ? pilihanJenis
                : '';

        lokasi.value =
            tempat.includes(pilihanLokasi)
                ? pilihanLokasi
                : '';

        // Dropdown kendaraan pada modal
        const selectKendaraan =
            $('#pajakMesinId');

        selectKendaraan.replaceChildren(
            new Option(
                'Pilih kendaraan',
                ''
            )
        );

        kendaraan.filter(k => k.terinventaris && nomorId(k.mesin_id)).forEach(k => {
            const label = [
                k.kode_aktiva || '31.08',
                k.merk ||
                    k.nama_kendaraan ||
                    'Kendaraan',
                k.nomor_polisi ||
                    'Polisi belum diisi',
                k.lokasi ||
                    'Tanpa lokasi'
            ].join(' — ');

            selectKendaraan.add(
                new Option(
                    label,
                    String(k.mesin_id)
                )
            );
        });
    }

    // ======================================================
    // 10. FILTER KENDARAAN
    // ======================================================

    function dataTersaring() {
        const pencarian = $('#pajakCari')
            .value
            .trim()
            .toLocaleLowerCase('id-ID');

        const jenis = $('#pajakJenis').value;
        const lokasi = $('#pajakLokasi').value;
        const status = $('#pajakStatus').value;
        const masa = $('#pajakTempo').value;

        return kendaraan.filter(k => {
            const isi = [
                k.pengguna,
                k.merk,
                k.jenis,
                k.kode_aktiva,
                k.nomor_polisi,
                k.tahun,
                k.lokasi,
                k.nama_kendaraan, k.kode_barang, k.register, k.ukuran,
                k.bahan, k.pabrik, k.rangka, k.nomor_mesin, k.bpkb,
                k.asal, k.ket
            ]
                .join(' ')
                .toLocaleLowerCase('id-ID');

            if (
                pencarian &&
                !isi.includes(pencarian)
            ) {
                return false;
            }

            if (
                jenis &&
                k.jenis !== jenis
            ) {
                return false;
            }

            if (
                lokasi &&
                k.lokasi !== lokasi
            ) {
                return false;
            }

            if (status === 'belum_lengkap' && k.kelengkapan !== 'belum_lengkap') return false;
            if (status === 'belum_inventaris' && k.terinventaris) return false;
            if (status && !['belum_lengkap', 'belum_inventaris'].includes(status) && k.status !== status) return false;

            const hari =
                k.sisa_hari == null
                    ? null
                    : Number(k.sisa_hari);

            // Kedaluwarsa termasuk H-0
            if (
                masa === 'terlambat' &&
                !(
                    hari != null &&
                    hari <= 0
                )
            ) {
                return false;
            }

            // Filter 7 atau 14 hari
            if (
                ['7', '14'].includes(masa) &&
                !(
                    hari != null &&
                    hari > 0 &&
                    hari <= Number(masa)
                )
            ) {
                return false;
            }

            return true;
        });
    }

    // ======================================================
    // 11. TABEL KENDARAAN — 15 KOLOM K.I.B B + STATUS/AKSI PAJAK
    // ======================================================

    const kendaraanCell = value => escapeHTML(
        value === null || value === undefined || String(value).trim() === ''
            ? '—' : String(value)
    );

    function gambarTabel() {
        const data = dataTersaring();

        const ukuran =
            (Number($('#pajakLimit').value) || data.length || 10);

        const jumlahHalaman = Math.max(
            1,
            Math.ceil(
                data.length / ukuran
            )
        );

        halamanAktif = Math.min(
            Math.max(1, halamanAktif),
            jumlahHalaman
        );

        const mulai =
            (halamanAktif - 1) * ukuran;

        const baris = data.slice(
            mulai,
            mulai + ukuran
        );

        $('#pajakTableBody').innerHTML =
            baris.length
                ? baris.map((k, idx) => {
                    const id = nomorId(k.mesin_id);
                    const key = k.kunci || (id ? `m-${id}` : `n-${k.nilai_id}`);

                    const pajakId = nomorId(
                        k.pajak_id
                    );

                    const hari =
                        k.sisa_hari == null
                            ? null
                            : Number(k.sisa_hari);

                    const catatan =
                        k.status === 'segera_habis' &&
                        hari != null

                            ? `
                                <small>
                                    ${formatAngka(hari)}
                                    hari lagi
                                    ${
                                        hari <= 7
                                            ? ' • Prioritas'
                                            : ''
                                    }
                                </small>
                            `
                            : '';

                    const statusClass =
                        Object.hasOwn(
                            statusLabel,
                            k.status
                        )
                            ? k.status
                            : 'belum_didata';

                    const nilaiTeks = k.terinventaris
                        ? `${kendaraanCell(k.nama_kendaraan || k.jenis)}<small class="mesin-kendaraan-lokasi">Lokasi: ${kendaraanCell(k.lokasi)}</small>`
                        : `${kendaraanCell(k.nama_kendaraan || k.jenis)}<small class="mesin-uninventoried">Belum Inventaris · Referensi Nilai Aset</small><small class="mesin-kendaraan-lokasi">Lokasi: ${kendaraanCell(k.lokasi)}</small>`;
                    const kurang = Array.isArray(k.kolom_belum_lengkap) ? k.kolom_belum_lengkap : [];
                    const detailKurang = kurang.length ? kurang.join(', ') : '';
                    const badgeLengkap = !k.terinventaris
                        ? '<span class="mesin-vehicle-completeness is-pending">Belum Inventaris</span>'
                        : k.kelengkapan === 'belum_lengkap'
                            ? `<span class="mesin-vehicle-completeness is-incomplete" title="${escapeHTML(detailKurang)}">Data Belum Lengkap (${kurang.length})</span><button type="button" class="mesin-vehicle-fix" data-kendaraan-fix="${id}" title="Lengkapi: ${escapeHTML(detailKurang)}">Lengkapi Data</button>`
                            : '<span class="mesin-vehicle-completeness is-complete">Identitas Lengkap</span>';
                    return `
                        <tr>
                            <td>${mulai + idx + 1}</td>
                            <td>${kendaraanCell(k.kode_barang)}</td>
                            <td class="mesin-kendaraan-nama">${nilaiTeks}</td>
                            <td>${kendaraanCell(k.register)}</td>
                            <td>${kendaraanCell(k.merk)}</td>
                            <td>${kendaraanCell(k.ukuran)}</td>
                            <td>${kendaraanCell(k.bahan)}</td>
                            <td>${kendaraanCell(k.tahun)}</td>
                            <td>${kendaraanCell(k.pabrik)}</td>
                            <td>${kendaraanCell(k.rangka)}</td>
                            <td>${kendaraanCell(k.nomor_mesin)}</td>
                            <td>${kendaraanCell(k.nomor_polisi)}</td>
                            <td>${kendaraanCell(k.bpkb)}</td>
                            <td>${kendaraanCell(k.asal)}</td>
                            <td>${kendaraanCell(k.ket)}</td>
                            <td class="mesin-kendaraan-status">
                                ${badgeLengkap}
                                <span class="pajak-status ${statusClass}">${statusLabel[statusClass]}</span>
                                ${catatan}
                                <small>${tanggalIndonesia(k.jatuh_tempo)}</small>
                            </td>
                            <td>
                                <div class="pajak-row-actions">
                                    <button type="button" class="view" data-pajak-view="${escapeHTML(key)}"
                                        title="Detail Kendaraan dan Pajak" aria-label="Detail Kendaraan dan Pajak">
                                        <i data-lucide="eye"></i>
                                    </button>
                                    <button type="button" class="edit" data-pajak-edit="${escapeHTML(key)}"
                                        title="${pajakId ? 'Edit Pajak' : 'Catat Pajak'}"
                                        aria-label="Edit atau Catat Pajak" ${k.terinventaris ? '' : 'disabled'}>
                                        <i data-lucide="square-pen"></i>
                                    </button>
                                    <button type="button" class="delete" data-pajak-delete="${id || ''}"
                                        title="Hapus Catatan Pajak" aria-label="Hapus Catatan Pajak"
                                        ${pajakId ? '' : 'disabled'}>
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')

                : `
                    <tr>
                        <td
                            colspan="17"
                            class="pajak-empty"
                        >
                            Tidak ada kendaraan sesuai filter.
                        </td>
                    </tr>
                `;

        $('#pajakTableInfo').textContent =
            `Menampilkan ${
                data.length ? mulai + 1 : 0
            }–${
                Math.min(
                    mulai + ukuran,
                    data.length
                )
            } dari ${
                formatAngka(data.length)
            } kendaraan`;

        gambarPagination(jumlahHalaman);

        refreshIcons();
    }

    // ======================================================
    // 12. PAGINATION
    // ======================================================

    function gambarPagination(jumlah) {
        const container = $('#pajakPages');

        container.replaceChildren();

        if (jumlah <= 1) {
            return;
        }

        function tombol(
            teks,
            target,
            disabled = false
        ) {
            const button =
                document.createElement('button');

            button.type = 'button';
            button.textContent = teks;
            button.disabled = disabled;

            if (
                /^\d+$/.test(teks) &&
                halamanAktif === target
            ) {
                button.classList.add('active');
            }

            button.addEventListener(
                'click',
                () => {
                    halamanAktif = target;
                    gambarTabel();
                }
            );

            container.appendChild(button);
        }

        tombol(
            '‹',
            halamanAktif - 1,
            halamanAktif === 1
        );

        let sebelumnya = 0;

        const tampil = new Set([
            1,
            jumlah
        ]);

        for (
            let n = Math.max(
                1,
                halamanAktif - 2
            );
            n <= Math.min(
                jumlah,
                halamanAktif + 2
            );
            n++
        ) {
            tampil.add(n);
        }

        [...tampil]
            .sort((a, b) => a - b)
            .forEach(n => {
                if (
                    sebelumnya &&
                    n - sebelumnya > 1
                ) {
                    container.append(' … ');
                }

                tombol(
                    String(n),
                    n
                );

                sebelumnya = n;
            });

        tombol(
            '›',
            halamanAktif + 1,
            halamanAktif === jumlah
        );
    }

    // ======================================================
    // 13. FILTER DAN RESET
    // ======================================================

    [
        'pajakCari',
        'pajakJenis',
        'pajakStatus',
        'pajakLokasi',
        'pajakTempo',
        'pajakLimit'
    ].forEach(id => {
        $('#' + id).addEventListener(
            id === 'pajakCari'
                ? 'input'
                : 'change',

            () => {
                halamanAktif = 1;
                gambarTabel();
            }
        );
    });

    $('#pajakReset').addEventListener(
        'click',
        () => {
            [
                'pajakCari',
                'pajakJenis',
                'pajakStatus',
                'pajakLokasi',
                'pajakTempo'
            ].forEach(id => {
                $('#' + id).value = '';
            });

            $('#pajakLimit').value = '0';

            halamanAktif = 1;

            gambarTabel();
        }
    );

    // ======================================================
    // 14. EXPORT CSV
    // ======================================================

    $('#pajakExport').addEventListener(
        'click',
        () => {
            const data = [[
                'No',
                'Pengguna',
                'Merk / Type',
                'Jenis',
                'Kode Aktiva',
                'Nomor Polisi',
                'Tahun',
                'Lokasi',
                'Berlaku s/d',
                'Status'
            ]];

            dataTersaring().forEach(
                (k, i) => {
                    data.push([
                        i + 1,
                        k.pengguna,
                        k.merk,
                        k.jenis,
                        k.kode_aktiva,
                        k.nomor_polisi,
                        k.tahun,
                        k.lokasi,
                        k.jatuh_tempo,
                        statusLabel[k.status] ||
                            'Belum Dicatat'
                    ]);
                }
            );

            const csv = '\uFEFF' +
                data.map(row =>
                    row.map(value => {
                        let isi = String(
                            value ?? ''
                        );

                        // Mencegah formula spreadsheet.
                        if (
                            /^\s*[=+@-]/.test(isi)
                        ) {
                            isi = "'" + isi;
                        }

                        return '"' +
                            isi.replaceAll('"', '""') +
                            '"';

                    }).join(';')

                ).join('\r\n');

            const url = URL.createObjectURL(
                new Blob(
                    [csv],
                    {
                        type:
                            'text/csv;charset=utf-8'
                    }
                )
            );

            const link =
                document.createElement('a');

            link.href = url;

            link.download =
                'masa-pajak-kendaraan-31-08.csv';

            document.body.appendChild(link);

            link.click();
            link.remove();

            setTimeout(
                () => URL.revokeObjectURL(url),
                1000
            );
        }
    );

    // ======================================================
    // 15. PILIH KENDARAAN
    // ======================================================

    const form = $('#pajakForm');

    // Pencarian berdasarkan ID inventaris digunakan oleh form pajak.
    const cariKendaraan = id => kendaraan.find(k =>
        k.terinventaris && String(k.mesin_id) === String(id));
    // Pencarian berdasarkan kunci unik digunakan oleh tabel gabungan.
    const cariBarisKendaraan = key => kendaraan.find(k =>
        String(k.kunci || (k.mesin_id ? `m-${k.mesin_id}` : `n-${k.nilai_id}`)) === String(key));

    function informasiKendaraan() {
        const k = cariKendaraan(
            $('#pajakMesinId').value
        );

        $('#pajakKendaraanInfo').textContent =
            k
                ? [
                    `Pengguna: ${k.pengguna || '—'}`,
                    `Merk: ${k.merk || '—'}`,
                    `Polisi: ${k.nomor_polisi || 'Belum diisi'}`,
                    `Lokasi: ${k.lokasi || '—'}`
                ].join(' | ')

                : (
                    'Pengguna, merk, nomor polisi, ' +
                    'dan lokasi diambil otomatis dari inventaris Mesin.'
                );
    }

    $('#pajakMesinId').addEventListener(
        'change',
        informasiKendaraan
    );

    // ======================================================
    // 16. MODAL TAMBAH DAN EDIT PAJAK
    // ======================================================

    function bukaForm(k = null) {
        form.reset();

        editId = nomorId(
            k?.pajak_id
        );

        // Saat edit, kendaraan induk tidak diganti.
        $('#pajakMesinId').disabled =
            Boolean(editId);

        $('#pajakFormError').hidden = true;

        $('#pajakFormTitle').textContent =
            editId
                ? 'Edit Pembaruan Pajak'
                : 'Pembaruan Pajak Kendaraan';

        if (k) {
            $('#pajakMesinId').value =
                String(k.mesin_id);

            [
                'tanggal_bayar',
                'masa_berlaku_bulan',
                'nominal',
                'nomor_stnk',
                'keterangan'
            ].forEach(nama => {
                const field =
                    form.elements.namedItem(nama);

                if (field) {
                    field.value =
                        k[nama] ?? '';
                }
            });
        }

        informasiKendaraan();
        updatePreview();

        tampilkanDialog(
            'pajakFormDialog'
        );
    }

    $('#pajakTambah').addEventListener(
        'click',
        () => bukaForm()
    );

    // ======================================================
    // 17. MODAL DETAIL PAJAK
    // ======================================================

    // ======================================================
    // 17. DETAIL KENDARAAN MODEL EXCEL K.I.B B
    // ======================================================

    /*
     * Tombol mata pada Masa Pajak sekarang membuka tabel
     * inventaris kendaraan dengan format Excel K.I.B B.
     * Data identitas lengkap dibaca dari route showMesin:
     * GET /kib/mesin/{mesin}.
     *
     * Catatan pajak tetap ditampilkan sebagai tabel kedua
     * agar informasi pajak lama tidak hilang.
     */

    const statusKepemilikanLabels = {
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    };

    function pajakCell(value) {
        const label = String(value ?? '').trim();
        return escapeHTML(label && label !== '-' ? label : '—');
    }

    function pajakOwnerBadge(value) {
        const key = String(value ?? '').trim().toLowerCase();
        const label = statusKepemilikanLabels[key] ?? 'Belum Diatur';
        const cls = statusKepemilikanLabels[key]
            ? 'is-known'
            : 'is-unknown';

        return `<span class="pajak-excel-owner ${cls}">${escapeHTML(label)}</span>`;
    }

    async function getInventarisPajak(mesinId) {
        const id = nomorId(mesinId);
        if (!id) throw new Error('ID kendaraan tidak valid.');

        const rootPage = document.getElementById('mesinPage');
        const base = rootPage?.dataset.recordBase;
        if (!base) throw new Error('Alamat detail inventaris tidak tersedia.');

        const response = await fetch(
            `${base}/${encodeURIComponent(id)}`,
            {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        if (!json?.data) {
            throw new Error('Respons inventaris tidak berisi data.');
        }

        return json.data;
    }

    function renderTabelExcelKendaraan(inventaris, pajak) {
        const item = inventaris || {};
        const jenis = item.nama_barang || pajak.nama_kendaraan || pajak.jenis;

        const columns = [
            pajakCell(item.kode),
            pajakCell(jenis),
            pajakCell(item.reg),
            pajakCell(item.merk || pajak.merk),
            pajakCell(item.ukuran),
            pajakCell(item.bahan),
            pajakCell(item.tahun || pajak.tahun),
            pajakCell(item.pabrik),
            pajakCell(item.rangka),
            pajakCell(item.mesin),
            pajakCell(item.polisi || pajak.nomor_polisi),
            pajakCell(item.bpkb),
            pajakCell(item.asal),
            pajakCell(item.ket),
            pajakOwnerBadge(item.status_kepemilikan)
        ];

        return `
            <div class="pajak-excel-scroll" role="region" tabindex="0"
                aria-label="Tabel Kartu Inventaris Kendaraan, geser mendatar untuk kolom selanjutnya">
                <table class="pajak-excel-table pajak-excel-vehicle">
                    <caption class="pajak-excel-sr-only">Kartu Inventaris Barang B — Kendaraan</caption>
                    <thead>
                        <tr class="pajak-excel-group-head">
                            <th scope="col" rowspan="2">No.</th>
                            <th scope="col" rowspan="2">Kode Barang</th>
                            <th scope="col" rowspan="2">Nama Barang / Jenis Barang</th>
                            <th scope="col" rowspan="2">Nomor Register</th>
                            <th scope="col" rowspan="2">Merk / Type</th>
                            <th scope="col" rowspan="2">Ukuran / CC</th>
                            <th scope="col" rowspan="2">Bahan</th>
                            <th scope="col" rowspan="2">Tahun Pembelian</th>
                            <th scope="colgroup" colspan="5">Nomor</th>
                            <th scope="col" rowspan="2">Asal Usul / Cara Perolehan</th>
                            <th scope="col" rowspan="2">Keterangan</th>
                            <th scope="col" rowspan="2">Status Kepemilikan</th>
                        </tr>
                        <tr class="pajak-excel-sub-head">
                            <th scope="col">Pabrik</th>
                            <th scope="col">Rangka</th>
                            <th scope="col">Mesin</th>
                            <th scope="col">Polisi</th>
                            <th scope="col">BPKB</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="pajak-excel-number">1</td>
                            ${columns.map(value => `<td>${value}</td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="pajak-excel-help">↔ Geser tabel ke kanan untuk melihat seluruh nomor dan Status Kepemilikan.</p>`;
    }

    function renderTabelExcelPajak(k) {
        const status = Object.hasOwn(statusLabel, k.status)
            ? k.status
            : 'belum_didata';

        const bulan = k.masa_berlaku_bulan
            ? `${k.masa_berlaku_bulan} bulan`
            : 'Riwayat lama';

        const values = [
            pajakCell(k.pengguna),
            pajakCell(k.lokasi),
            pajakCell(tanggalIndonesia(k.tanggal_bayar)),
            pajakCell(bulan),
            pajakCell(tanggalIndonesia(k.jatuh_tempo)),
            escapeHTML(formatUang(k.nominal)),
            pajakCell(k.nomor_stnk),
            `<span class="pajak-status ${status}">${escapeHTML(statusLabel[status])}</span>`,
            pajakCell(k.keterangan)
        ];

        return `
            <section class="pajak-excel-tax-section">
                <div class="pajak-excel-section-heading">
                    <div>
                        <strong>Informasi Masa Pajak</strong>
                        <p>Riwayat pajak tetap tersedia tanpa mengubah data inventaris kendaraan.</p>
                    </div>
                </div>
                <div class="pajak-excel-scroll" role="region" tabindex="0"
                    aria-label="Tabel informasi masa pajak kendaraan">
                    <table class="pajak-excel-table pajak-excel-tax">
                        <thead><tr>
                            <th>Pengguna</th><th>Lokasi</th><th>Pembaruan Pajak</th>
                            <th>Masa Berlaku</th><th>Berlaku s/d</th>
                            <th>Nominal</th><th>Nomor STNK</th>
                            <th>Status Pajak</th><th>Keterangan Pajak</th>
                        </tr></thead>
                        <tbody><tr>
                            ${values.map(value => `<td>${value}</td>`).join('')}
                        </tr></tbody>
                    </table>
                </div>
            </section>`;
    }

    async function lihatDetail(k) {
        const title = $('#pajakDetailTitle');
        const detail = $('#pajakDetailData');
        const documents = $('#pajakDetailDocument');

        if (!detail || !documents) return;

        const nomor = k.nomor_polisi || k.kode_aktiva || 'Kendaraan';
        if (title) title.textContent = `Detail Kendaraan — ${nomor}`;

        detail.innerHTML = '<p class="pajak-excel-loading">Memuat identitas kendaraan...</p>';
        documents.replaceChildren();

        tampilkanDialog('pajakDetailDialog');

        let inventaris = null;
        let warning = '';

        try {
            inventaris = await getInventarisPajak(k.mesin_id);
        } catch (error) {
            console.error('DETAIL KENDARAAN K.I.B B:', error);
            warning = 'Sebagian identitas inventaris belum dapat diambil. '
                + 'Informasi pajak yang tersedia tetap ditampilkan.';
        }

        detail.innerHTML = `
            ${warning ? `<p class="pajak-excel-warning">${escapeHTML(warning)}</p>` : ''}
            ${renderTabelExcelKendaraan(inventaris, k)}
            ${renderTabelExcelPajak(k)}
        `;

        const pajakId = nomorId(k.pajak_id);
        const mesinId = nomorId(k.mesin_id);
        const rootPage = document.getElementById('mesinPage');
        const recordBase = rootPage?.dataset.recordBase || '';

        const actions = [];

        if (k.ada_dokumen && pajakId) {
            actions.push(`<a class="pajak-btn outline"
                href="${baseURL}/${pajakId}/dokumen"
                target="_blank" rel="noopener noreferrer">
                <i data-lucide="file-text"></i> PDF Pajak
            </a>`);
        }

        if (inventaris && mesinId && recordBase) {
            if (String(inventaris.dok || '').startsWith('kib/mesin/dokumen/')) {
                actions.push(`<a class="pajak-btn outline"
                    href="${recordBase}/${mesinId}/file/dokumen"
                    target="_blank" rel="noopener noreferrer">
                    <i data-lucide="file-text"></i> Dokumen Inventaris
                </a>`);
            }

            if (String(inventaris.img || '').startsWith('kib/mesin/foto/')) {
                actions.push(`<a class="pajak-btn outline"
                    href="${recordBase}/${mesinId}/file/foto"
                    target="_blank" rel="noopener noreferrer">
                    <i data-lucide="image"></i> Foto Kendaraan
                </a>`);
            }
        }

        documents.innerHTML = actions.length
            ? `<strong>Berkas Kendaraan</strong><div class="pajak-excel-links">${actions.join('')}</div>`
            : '<span class="pajak-excel-no-doc">Belum ada dokumen atau foto yang tersedia.</span>';

        refreshIcons();
    }

    // ======================================================
    // 18. AKSI DETAIL, EDIT, HAPUS
    // ======================================================

    $('#pajakTableBody').addEventListener(
        'click',

        async event => {
            const button =
                event.target.closest('button');

            if (!button) {
                return;
            }

            const perbaikiId = button.dataset.kendaraanFix;
            if (perbaikiId) {
                await editMesin(perbaikiId);
                return;
            }

            const id =
                button.dataset.pajakView ||
                button.dataset.pajakEdit ||
                button.dataset.pajakDelete;

            const k = cariBarisKendaraan(id);

            if (!k) {
                return;
            }

            // Detail
            if (button.dataset.pajakView) {
                if (!k.terinventaris) {
                    const detail = $('#pajakDetailData');
                    $('#pajakDetailTitle').textContent = `Referensi Kendaraan — ${k.kode_aktiva}`;
                    detail.innerHTML = `<p class="pajak-excel-warning">Transaksi Nilai Aset #${escapeHTML(k.nilai_id)} belum menjadi inventaris kendaraan. Lengkapi data melalui menu Peralatan dan Mesin sebelum pencatatan pajak.</p><p>${escapeHTML(k.nama_kendaraan || k.jenis || '-')} · ${escapeHTML(k.lokasi || '-')}</p>`;
                    $('#pajakDetailDocument').replaceChildren();
                    tampilkanDialog('pajakDetailDialog');
                } else {
                    lihatDetail(k);
                }
                return;
            }

            // Edit / catat
            if (button.dataset.pajakEdit) {
                if (!k.terinventaris) return;
                bukaForm(k);
                return;
            }

            // Hapus
            if (
                !button.dataset.pajakDelete ||
                !nomorId(k.pajak_id)
            ) {
                return;
            }

            const konfirmasi = confirm(
                `Hapus catatan pajak ${
                    k.nomor_polisi ||
                    k.kode_aktiva
                }?\nInventaris Mesin tidak akan dihapus.`
            );

            if (!konfirmasi) {
                return;
            }

            button.disabled = true;

            try {
                await request(
                    `${baseURL}/${nomorId(k.pajak_id)}`,
                    {
                        method: 'DELETE'
                    }
                );

                await muatData();

            } catch (error) {
                alert(
                    'Gagal menghapus catatan pajak: ' +
                    error.message
                );

                button.disabled = false;
            }
        }
    );

    // ======================================================
    // 19. SIMPAN PEMBARUAN PAJAK
    // ======================================================

    form.addEventListener(
        'submit',

        async event => {
            event.preventDefault();

            if (
                sedangMengirim ||
                !form.reportValidity()
            ) {
                return;
            }

            const preview = hitungJatuhTempo(
                $('#pajakTanggalBayar').value,
                $('#pajakMasaBulan').value
            );

            if (!preview) {
                $('#pajakFormError').textContent =
                    'Tanggal pembaruan dan masa berlaku harus valid.';

                $('#pajakFormError').hidden = false;
                return;
            }

            sedangMengirim = true;

            $('#pajakSimpan').disabled = true;

            $('#pajakFormError').hidden = true;

            try {
                const data = new FormData(
                    form
                );

                const url = editId
                    ? `${baseURL}/${editId}`
                    : baseURL;

                /*
                 * CREATE:
                 * POST /kib/mesin/pajak
                 *
                 * UPDATE:
                 * POST + _method=PUT
                 */

                if (editId) {
                    data.set(
                        '_method',
                        'PUT'
                    );
                }

                await request(
                    url,
                    {
                        method: 'POST',
                        body: data
                    }
                );

                tampilkanDialog(
                    'pajakFormDialog',
                    false
                );

                await muatData();

            } catch (error) {
                $('#pajakFormError').textContent =
                    error.message;

                $('#pajakFormError').hidden = false;

            } finally {
                sedangMengirim = false;

                $('#pajakSimpan').disabled = false;
            }
        }
    );
});

/* ==========================================================
   AKHIR MODUL MASA PAJAK KENDARAAN
   Seluruh fungsi berada dalam mesin.js
   ========================================================== */



/* ============================================================
   REFERENSI 31.08.xx — BACA SAJA, TIDAK DIHITUNG KPI PAJAK
   Tidak mengubah alur inventaris dan CRUD pajak.
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const page = document.getElementById('mesinPage');
    const panel = document.getElementById('mesinPajakPanel');
    const tbody = document.getElementById('mesinReferenceBody');
    const summary = document.getElementById('mesinReferenceSummary');
    const search = document.getElementById('mesinReferenceSearch');
    const statusFilter = document.getElementById('mesinReferenceStatus');
    const tab = document.getElementById('mesinTabPajak');
    if (!page || !panel || !tbody || !summary || !search || !statusFilter || !tab) return;
    const api = panel.dataset.referensiApi;
    const nf = new Intl.NumberFormat('id-ID');
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
    const formatRp = value => value === null || value === undefined
        ? '—' : `Rp ${nf.format(Number(value) || 0)}`;
    const formatDate = value => {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
        return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
    };
    const statusText = {
        pending: 'Pending',
        historis: 'Historis',
        perlu_verifikasi: 'Perlu Verifikasi'
    };
    let records = [];
    let loaded = false;
    let loading = false;
    function render() {
        const key = search.value.toLowerCase().trim();
        const status = statusFilter.value;
        const filtered = records.filter(row => {
            if (status && row.status !== status) return false;
            return [row.id, row.kode_aktiva, row.jenis_aktiva, row.no_voucher,
                row.uraian, row.lokasi, row.tahun]
                .join(' ').toLowerCase().includes(key);
        });
        summary.textContent = `Menampilkan ${nf.format(filtered.length)} dari ${nf.format(records.length)} transaksi referensi. `
            + 'Data ini belum tentu merepresentasikan satu unit kendaraan.';
        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="mesin-reference-empty">Tidak ada transaksi yang cocok.</td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map((row, index) => {
            const st = Object.hasOwn(statusText, row.status) ? row.status : 'perlu_verifikasi';
            return `<tr>
                <td>${index + 1}</td>
                <td><strong>${esc(row.kode_aktiva || '—')}</strong><small>${esc(row.jenis_aktiva || '')}</small></td>
                <td><strong>${esc(row.no_voucher || '—')}</strong><small>${esc(formatDate(row.tgl_voucher))}</small></td>
                <td class="mesin-reference-uraian">${esc(row.uraian || '—')}</td>
                <td>${esc(row.lokasi || '—')}</td>
                <td>${esc(formatRp(row.nilai))}</td>
                <td><span class="mesin-reference-status ${st}">${statusText[st]}</span></td>
            </tr>`;
        }).join('');
    }
    async function loadReferences() {
        if (loaded || loading) return;
        if (!api) {
            summary.textContent = 'Route referensi kendaraan belum dikonfigurasi.';
            return;
        }
        loading = true;
        summary.textContent = 'Memuat data referensi Aktiva kendaraan...';
        try {
            const response = await fetch(api, { credentials: 'same-origin', headers: {
                'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest'
            }});
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            if (json.success === false || !Array.isArray(json.data)) {
                throw new Error(json.message || 'Format JSON referensi tidak sesuai.');
            }
            records = json.data;
            loaded = true;
            render();
        } catch (error) {
            summary.textContent = 'Referensi belum dapat dimuat: ' + error.message;
            tbody.innerHTML = '<tr><td colspan="7" class="mesin-reference-empty">Periksa route, Controller, dan log Laravel.</td></tr>';
        } finally {
            loading = false;
        }
    }
    search.addEventListener('input', render);
    statusFilter.addEventListener('change', render);
    tab.addEventListener('click', loadReferences);
    window.addEventListener('hashchange', () => {
        if (location.hash === '#masa-pajak') loadReferences();
    });
    if (location.hash === '#masa-pajak' || !panel.hidden) loadReferences();
});


/* ================================================================
   SISTEM ASET PERUMDA TIRTA KENCANA
   K.I.B B — MASA PAJAK KENDARAAN

   MODUL DELETE LENGKAP

   Fungsi:
   1. Mengaktifkan interaksi tombol Delete.
   2. Memeriksa keberadaan catatan pajak.
   3. Memberi informasi jika pajak belum dicatat.
   4. Menampilkan konfirmasi sebelum penghapusan.
   5. Menghapus catatan pajak berdasarkan pajak_id.
   6. Tidak menghapus inventaris kendaraan.
   7. Menangani CSRF dan error server.
   8. Memuat ulang data setelah berhasil.
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

    'use strict';

    // ============================================================
    // 01. ELEMENT UTAMA
    // ============================================================

    const panel = document.getElementById(
        'mesinPajakPanel'
    );

    const tabel = document.getElementById(
        'pajakTableBody'
    );

    if (!panel || !tabel) {
        return;
    }

    // Hindari inisialisasi ganda.

    if (tabel.dataset.deletePajakReady === '1') {
        return;
    }

    tabel.dataset.deletePajakReady = '1';

    // ============================================================
    // 02. KONFIGURASI API LARAVEL
    // ============================================================

    const apiData = panel.dataset.api;

    const baseUrl = (
        panel.dataset.base || ''
    ).replace(/\/$/, '');

    const csrfToken =
        panel.dataset.token ||
        document.querySelector(
            'meta[name="csrf-token"]'
        )?.content ||
        '';

    let deleting = false;

    // ============================================================
    // 03. AKTIFKAN INTERAKSI TOMBOL DELETE
    // ============================================================

    function aktifkanTombolDelete() {

        const buttons = tabel.querySelectorAll(
            'button[data-pajak-delete]'
        );

        buttons.forEach(button => {

            /*
             * Tombol dapat ditekan, termasuk ketika
             * kendaraan belum mempunyai catatan pajak.
             *
             * Jika belum ada catatan pajak,
             * tampilkan informasi tanpa menghapus data.
             */

            // Hanya inventaris yang memiliki ID mesins dapat menjalankan
            // pemeriksaan/hapus pajak. Referensi Nilai Aset (tanpa mesins.id)
            // tidak boleh mengaktifkan tombol Delete.
            const mesinId = Number(button.dataset.pajakDelete);
            if (!Number.isSafeInteger(mesinId) || mesinId <= 0) {
                button.disabled = true;
                button.title = 'Belum diinventarisasi — tidak ada catatan pajak';
                return;
            }

            button.disabled = false;

            button.title =
                'Hapus atau periksa catatan pajak';

            button.setAttribute(
                'aria-label',
                'Hapus atau periksa catatan pajak'
            );

        });

    }

    aktifkanTombolDelete();

    // ============================================================
    // 04. PANTAU PERUBAHAN TABEL
    // ============================================================

    /*
     * Tabel Masa Pajak digambar ulang ketika:
     *
     * - Data dimuat
     * - Pencarian berubah
     * - Filter digunakan
     * - Pagination berubah
     * - Pembaruan pajak disimpan
     *
     * MutationObserver memastikan tombol Delete
     * tetap mempunyai interaksi setelah render.
     */

    const observer = new MutationObserver(() => {

        aktifkanTombolDelete();

    });

    observer.observe(
        tabel,
        {
            childList: true,
            subtree: true
        }
    );

    // ============================================================
    // 05. AMBIL DATA PAJAK TERBARU
    // ============================================================

    async function ambilDataPajak() {

        if (!apiData) {

            throw new Error(
                'Endpoint data Masa Pajak tidak ditemukan.'
            );

        }

        const response = await fetch(
            apiData,
            {
                method: 'GET',

                credentials: 'same-origin',

                headers: {
                    Accept: 'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest'
                }
            }
        );

        const json = await response
            .json()
            .catch(() => null);

        if (
            !response.ok ||
            !json ||
            !Array.isArray(json.data)
        ) {

            throw new Error(
                json?.message ||
                `Gagal membaca data pajak. HTTP ${response.status}`
            );

        }

        return json.data;

    }

    // ============================================================
    // 06. REQUEST DELETE KE LARAVEL
    // ============================================================

    async function hapusCatatanPajak(pajakId) {

        if (!baseUrl) {

            throw new Error(
                'Endpoint penghapusan pajak tidak tersedia.'
            );

        }

        if (!csrfToken) {

            throw new Error(
                'Token CSRF tidak tersedia. Muat ulang halaman.'
            );

        }

        const url =
            `${baseUrl}/${encodeURIComponent(pajakId)}`;

        const response = await fetch(
            url,
            {
                method: 'DELETE',

                credentials: 'same-origin',

                headers: {
                    Accept: 'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest',

                    'X-CSRF-TOKEN':
                        csrfToken
                }
            }
        );

        const json = await response
            .json()
            .catch(() => null);

        if (
            !response.ok ||
            json?.success === false
        ) {

            throw new Error(
                json?.message ||
                `Penghapusan gagal. HTTP ${response.status}`
            );

        }

        return json;

    }

    // ============================================================
    // 07. AKSI DELETE PADA TABEL
    // ============================================================

    /*
     * Capture listener mencegah handler Delete lama
     * menjalankan permintaan penghapusan yang sama
     * dua kali.
     */

    tabel.addEventListener(
        'click',

        async event => {

            const button = event.target.closest(
                'button[data-pajak-delete]'
            );

            if (
                !button ||
                !tabel.contains(button)
            ) {
                return;
            }

            event.preventDefault();

            event.stopImmediatePropagation();

            if (deleting) {
                return;
            }

            // ====================================================
            // IDENTIFIKASI KENDARAAN
            // ====================================================

            const mesinId = Number(
                button.dataset.pajakDelete
            );

            if (
                !Number.isSafeInteger(mesinId) ||
                mesinId <= 0
            ) {

                alert(
                    'Identitas kendaraan tidak valid.'
                );

                return;
            }

            deleting = true;

            button.disabled = true;

            try {

                // =================================================
                // MEMBACA CATATAN PAJAK TERBARU
                // =================================================

                const data = await ambilDataPajak();

                const kendaraan = data.find(
                    item =>
                        Number(item.mesin_id) === mesinId
                );

                if (!kendaraan) {

                    alert(
                        'Kendaraan tidak ditemukan ' +
                        'pada data Masa Pajak.'
                    );

                    return;
                }

                // =================================================
                // PERIKSA ID CATATAN PAJAK
                // =================================================

                const pajakId = Number(
                    kendaraan.pajak_id
                );

                /*
                 * Jika pajak_id kosong:
                 *
                 * Kendaraan tetap berada di inventaris.
                 * Tidak ada riwayat pajak yang bisa dihapus.
                 */

                if (
                    !Number.isSafeInteger(pajakId) ||
                    pajakId <= 0
                ) {

                    alert(
                        'Kendaraan ini berstatus Belum Dicatat.\n\n' +
                        'Belum ada catatan pembaruan pajak ' +
                        'yang dapat dihapus.\n\n' +
                        'Untuk mengubah klasifikasi atau ' +
                        'menghapus inventaris kendaraan, ' +
                        'gunakan menu Daftar Peralatan dan Mesin.'
                    );

                    return;
                }

                // =================================================
                // IDENTITAS KENDARAAN
                // =================================================

                const identitas = String(
                    kendaraan.nomor_polisi ||
                    kendaraan.merk ||
                    `ID Mesin ${mesinId}`
                ).trim();

                // =================================================
                // KONFIRMASI PENGHAPUSAN
                // =================================================

                const konfirmasi = confirm(
                    `Hapus catatan pajak kendaraan ${identitas}?\n\n` +
                    'Catatan pembaruan pajak akan dihapus.\n' +
                    'Data inventaris kendaraan tidak akan dihapus.'
                );

                if (!konfirmasi) {
                    return;
                }

                // =================================================
                // EKSEKUSI DELETE
                // =================================================

                await hapusCatatanPajak(
                    pajakId
                );

                // =================================================
                // NOTIFIKASI BERHASIL
                // =================================================

                alert(
                    'Catatan pajak berhasil dihapus.\n\n' +
                    'Data kendaraan tetap tersimpan dalam inventaris.'
                );

                // =================================================
                // MUAT ULANG TABEL DAN STATISTIK
                // =================================================

                window.location.reload();

            } catch (error) {

                console.error(
                    '[MASA PAJAK] Gagal menghapus:',
                    error
                );

                alert(
                    'Gagal menghapus catatan pajak:\n' +
                    error.message
                );

            } finally {

                deleting = false;

                if (button.isConnected) {

                    button.disabled = false;

                }

            }

        },

        true
    );

});

/* ================================================================
   AKHIR MODUL DELETE MASA PAJAK KENDARAAN
   ================================================================ */


/* ============================================================
   K.I.B B — SEARCHABLE SELECT (FORM TAMBAH/EDIT & PAJAK)
   ------------------------------------------------------------
   - Dropdown hanya diubah jika memiliki data-kib-searchable.
   - <select> asli tetap menyimpan nilai dan mengirim ke Laravel.
   - Opsi yang disabled/hidden tidak ikut pencarian.
   - Pilihan historis pada form Edit tetap terbaca.
   - Modal dialog didukung tanpa menu tertutup backdrop.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const root = document.getElementById('mesinPage');
    if (!root) return;

    const comboboxes = [];
    let opened = null;
    let counter = 0;

    const normalize = text => String(text ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('id-ID')
        .replace(/\s+/g, ' ')
        .trim();

    function closeAll(except = null) {
        for (const combo of comboboxes) {
            if (combo !== except) combo.close();
        }
    }

    function buildCombo(select) {
        if (!select || select.dataset.kibSearchReady === '1') return;
        select.dataset.kibSearchReady = '1';

        const originalRequired = select.required;
        const originalTabIndex = select.tabIndex;
        const originalAria = select.getAttribute('aria-label');
        const id = `mesin-combo-${++counter}`;
        const dialog = select.closest('dialog');
        const host = dialog || document.body;
        const label = select.closest('label');
        const labelText = label?.childNodes?.[0]?.textContent?.trim()
            || 'Pilihan';

        const wrap = document.createElement('span');
        wrap.className = 'mesin-searchable-wrap';
        select.before(wrap);
        wrap.appendChild(select);

        const input = document.createElement('input');
        input.type = 'search';
        input.className = 'mesin-searchable-input';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = select.dataset.kibPlaceholder || 'Ketik untuk mencari pilihan...';
        input.required = originalRequired;
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-haspopup', 'listbox');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-label', `Cari ${labelText.replace(/\*/g, '').trim()}`);

        const arrow = document.createElement('span');
        arrow.className = 'mesin-searchable-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '⌄';

        wrap.prepend(input);
        wrap.appendChild(arrow);

        const menu = document.createElement('div');
        menu.id = `${id}-listbox`;
        menu.className = 'mesin-searchable-menu';
        menu.setAttribute('role', 'listbox');
        menu.hidden = true;
        host.appendChild(menu);
        input.setAttribute('aria-controls', menu.id);

        // Required dipindahkan ke input yang terlihat agar pesan validasi
        // browser tidak mencoba fokus ke select tersembunyi.
        select.required = false;
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');
        select.classList.add('mesin-searchable-native');

        let active = -1;
        let results = [];
        let lastSelection = '';

        function selectedOption() {
            return [...select.options].find(
                option => option.value && option.value === select.value
            );
        }

        function getOptions() {
            return [...select.options].filter(option =>
                option.value !== '' &&
                !option.disabled &&
                !option.hidden
            );
        }

        function validSelection() {
            return Boolean(select.value && selectedOption());
        }

        function sync() {
            const option = selectedOption();
            input.disabled = select.disabled;
            input.required = originalRequired && !select.disabled;
            input.value = option ? option.textContent.trim().replace(/\s+/g, ' ') : '';
            lastSelection = select.value;
            input.setCustomValidity(
                originalRequired && !select.disabled && !validSelection()
                    ? 'Pilih salah satu data dari daftar.'
                    : ''
            );
            if (!menu.hidden) close();
        }

        function position() {
            if (menu.hidden) return;
            if (!input.isConnected || (dialog && !dialog.open)) {
                close();
                return;
            }

            const rect = input.getBoundingClientRect();
            const limits = dialog?.getBoundingClientRect() || {
                top: 0, bottom: window.innerHeight,
                left: 0, right: window.innerWidth
            };
            const leftLimit = Math.max(8, limits.left + 9);
            const rightLimit = Math.min(window.innerWidth - 8, limits.right - 9);
            const bottomLimit = Math.min(window.innerHeight - 8, limits.bottom - 9);
            const topLimit = Math.max(8, limits.top + 9);
            const below = bottomLimit - rect.bottom - 5;
            const above = rect.top - topLimit - 5;
            const desired = Math.min(268, 38 * Math.min(results.length || 1, 7) + 12);
            const useAbove = below < Math.min(desired, 145) && above > below;
            const available = Math.max(72, useAbove ? above : below);
            const height = Math.min(desired, available);

            menu.style.width = `${Math.min(rect.width, rightLimit - leftLimit)}px`;
            menu.style.left = `${Math.min(Math.max(rect.left, leftLimit), rightLimit - rect.width)}px`;
            menu.style.maxHeight = `${height}px`;
            menu.style.top = `${Math.round(useAbove ? rect.top - height - 4 : rect.bottom + 4)}px`;
        }

        function close() {
            menu.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            active = -1;
            if (opened === combo) opened = null;
        }

        function paintActive() {
            const buttons = menu.querySelectorAll('.mesin-searchable-option');
            buttons.forEach((button, index) => {
                button.classList.toggle('is-active', index === active);
                button.setAttribute('aria-selected', String(index === active));
            });
            if (buttons[active]) {
                input.setAttribute('aria-activedescendant', buttons[active].id);
                buttons[active].scrollIntoView({block: 'nearest'});
            } else {
                input.removeAttribute('aria-activedescendant');
            }
        }

        function choose(option) {
            if (!option || option.disabled || option.hidden) return;
            select.value = option.value;
            select.dispatchEvent(new Event('change', {bubbles: true}));
            sync();
            close();
            input.focus({preventScroll: true});
        }

        function render(keyword = '') {
            if (input.disabled) return;
            closeAll(combo);
            opened = combo;
            const query = normalize(keyword);
            const options = getOptions();
            results = options.filter(option =>
                !query || normalize(option.textContent).includes(query)
                    || normalize(option.dataset.kodeBarang).includes(query)
            ).slice(0, 150);
            active = -1;
            menu.replaceChildren();
            if (!results.length) {
                const empty = document.createElement('div');
                empty.className = 'mesin-searchable-empty';
                empty.textContent = 'Tidak ada data yang cocok.';
                menu.appendChild(empty);
            } else {
                results.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'mesin-searchable-option';
                    button.id = `${id}-option-${index}`;
                    button.setAttribute('role', 'option');
                    button.textContent = option.textContent.trim().replace(/\s+/g, ' ');
                    button.addEventListener('pointerdown', event => event.preventDefault());
                    button.addEventListener('click', () => choose(option));
                    menu.appendChild(button);
                });
                if (options.length > 150 && !query) {
                    const hint = document.createElement('div');
                    hint.className = 'mesin-searchable-empty';
                    hint.textContent = 'Ketik kata yang lebih spesifik untuk melihat pilihan lainnya.';
                    menu.appendChild(hint);
                }
            }
            menu.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            position();
        }

        function onInput() {
            if (select.value) {
                select.value = '';
                select.dispatchEvent(new Event('change', {bubbles: true}));
            }
            input.setCustomValidity(
                originalRequired ? 'Pilih data dari daftar yang tersedia.' : ''
            );
            render(input.value);
        }

        input.addEventListener('focus', () => render(''));
        input.addEventListener('click', () => render(''));
        input.addEventListener('input', onInput);
        input.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                close();
                sync();
                event.stopPropagation();
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (menu.hidden) render(input.value);
                if (!results.length) return;
                const delta = event.key === 'ArrowDown' ? 1 : -1;
                active = active < 0
                    ? (delta > 0 ? 0 : results.length - 1)
                    : (active + delta + results.length) % results.length;
                paintActive();
            } else if (event.key === 'Enter' && !menu.hidden) {
                event.preventDefault();
                if (results.length) choose(results[active >= 0 ? active : 0]);
            } else if (event.key === 'Tab') {
                close();
                // Tidak mengganti teks yang belum benar dengan ID lama.
                if (!select.value && !originalRequired) input.value = '';
            }
        });

        select.addEventListener('change', () => {
            // Event akibat mengetik membersihkan ID; input pencarian tetap utuh.
            if (select.value || document.activeElement !== input) sync();
        });

        const observer = new MutationObserver(() => {
            if (select.value !== lastSelection && !menu.hidden) close();
            sync();
        });
        observer.observe(select, {childList: true, subtree: true, attributes: true,
            attributeFilter: ['disabled', 'hidden']});

        const combo = {input, select, menu, close, sync, position};
        comboboxes.push(combo);
        sync();

        const containingForm = select.closest('form');
        containingForm?.addEventListener('reset', () => {
            queueMicrotask(() => sync());
        });
        dialog?.addEventListener('close', close);
    }

    root.querySelectorAll(
        '#mesinForm select[data-kib-searchable], #pajakForm select[data-kib-searchable]'
    ).forEach(buildCombo);

    // Program Edit men-set .value secara langsung. Mutation pada atribut
    // 'open' dialog memberi kesempatan untuk sinkronkan hasilnya.
    root.querySelectorAll('#mesinFormDialog, #pajakFormDialog').forEach(dialog => {
        const watcher = new MutationObserver(() => {
            for (const combo of comboboxes) {
                if (dialog.contains(combo.input)) {
                    combo.sync();
                }
            }
            if (!dialog.open) closeAll();
        });
        watcher.observe(dialog, {attributes: true, attributeFilter: ['open']});
    });

    document.addEventListener('pointerdown', event => {
        if (!opened) return;
        if (!opened.menu.contains(event.target) &&
            !opened.input.contains(event.target)) {
            opened.close();
        }
    }, true);

    document.addEventListener('scroll', () => opened?.position(), true);
    window.addEventListener('resize', () => opened?.position());

    // Jika select dinonaktifkan saat Edit Pajak, kotak cari juga dinonaktifkan.
    // Panggilan ini tidak mengubah data form atau request ke server.
    root.addEventListener('click', event => {
        if (event.target.closest('#pajakTambah, [data-pajak-edit]')) {
            queueMicrotask(() => comboboxes.forEach(combo => combo.sync()));
        }
    });
});

/* ==========================================================================
   K.I.B B -- LAPORAN KENDARAAN & PERALATAN/MESIN (GABUNGAN)
   Seluruh fitur cetak tetap berada pada satu mesin.js.
   Tidak membutuhkan file JavaScript laporan terpisah.
   ========================================================================== */
/**
 * K.I.B B — Print Excel Kendaraan (seluruh 31.08) dan Mesin (per lokasi Detail).
 * Endpoint hanya baca. Tidak membuat inventaris, mengubah pajak, atau Nilai Aset.
 * XLSX asli berupa paket Office OpenXML, tanpa dependensi CDN.
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const page = document.getElementById('mesinPage');
    const dialog = document.getElementById('mesinReportDialog');
    if (!page || !dialog || !page.dataset.reportUrl) return;

    const $ = selector => dialog.querySelector(selector);
    // Urutan peran selalu mengacu pada popup K.I.B A Tanah (PRD v2.1).
    const roles = [
        ['diketahui', 'Diketahui oleh'],
        ['periksa_1', 'Diperiksa oleh (1)'],
        ['periksa_2', 'Diperiksa oleh (2)'],
        ['dibuat', 'Dibuat oleh'],
    ];
    const org = { provinsi: 'KALIMANTAN TIMUR', kota: 'SAMARINDA', unit: 'PERUMDA TIRTA KENCANA' };
    const state = { jenis: 'kendaraan', data: [], sdm: [], organisasi: org, lokasi: null };
    // Respons popup sebelumnya tidak boleh mengganti data lokasi/jenis yang baru dibuka.
    let reportRequestVersion = 0;
    const form = $('#mesinReportForm');
    const month = $('#mesinReportPeriod');
    const info = $('#mesinReportInfo');
    const previewBox = $('#mesinReportPreviewBox');
    const preview = $('#mesinReportPreview');
    const download = $('#mesinReportDownload');
    const print = $('#mesinReportPrint');
    const optionList = $('#mesinReportStaff');
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
        char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const cell = value => {
        const v = String(value ?? '').trim();
        return v && v !== 'null' ? v : '-';
    };
    const periodName = () => {
        if (!/^\d{4}-\d{2}$/.test(month.value)) return '';
        const [year, m] = month.value.split('-').map(Number);
        if (m < 1 || m > 12) return '';
        const display = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' });
        return display.format(new Date(Date.UTC(year, m - 1, 1))).toUpperCase();
    };
    const dateName = () => new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
    const staffLabel = person => `${person.nama} — ${person.jabatan || 'Jabatan belum diisi'} — ${person.nip || 'NIP -'} (#${person.id})`;
    const chosen = role => {
        const value = $(`[data-report-role="${role}"]`)?.value.trim();
        return state.sdm.find(person => staffLabel(person) === value) || null;
    };
    const ready = () => Boolean(periodName() && state.data.length && roles.every(([r]) => chosen(r)));

    function columns() {
        if (state.jenis === 'kendaraan') {
            return [
                'No.', 'Kode Barang', 'Nama Barang / Jenis Barang', 'Nomor Register',
                'Merk / Type', 'Ukuran / CC', 'Bahan', 'Tahun Pembelian',
                'Pabrik', 'Rangka', 'Mesin', 'Polisi', 'BPKB',
                'Asal Usul Cara Perolehan', 'Keterangan'
            ];
        }
        return [
            'No.', 'Nama Barang', 'Kode Inventaris', 'No. Register',
            'Merk / Type', 'Ukuran', 'Fungsi', 'Penggunaan', 'Bahan',
            'Baik', 'Rusak Ringan', 'Rusak Berat',
            'Tahun Pengadaan', 'Asal Usul', 'No. Dokumen', 'Harga (Rp)', 'Keterangan'
        ];
    }

    function rowValues(row, index) {
        if (state.jenis === 'kendaraan') {
            return [index + 1, row.kode_barang || '-', row.nama_kendaraan || row.jenis || '-',
                row.register || '-', row.merk || '-', row.ukuran || '-', row.bahan || '-',
                row.tahun || '-', row.pabrik || '-', row.rangka || '-', row.nomor_mesin || '-',
                row.nomor_polisi || '-', row.bpkb || '-', row.asal || '-',
                [row.ket, !row.terinventaris ? `Belum Inventaris (Nilai Aset #${row.nilai_id})` : '']
                    .filter(Boolean).join(' · ') || '-'];
        }
        const kondisi = String(row.kondisi ?? '').toLowerCase();
        const baik = (kondisi === 'b' || kondisi.includes('baik'))
            && !kondisi.includes('tidak');
        const ringan = kondisi.includes('ringan') || ['kb', 'rr'].includes(kondisi);
        const berat = kondisi.includes('berat') || kondisi === 'rb';
        return [index + 1, row.nama_barang || '-', row.kode_barang || '-', row.register || '-',
            row.merk || '-', row.ukuran || '-', row.fungsi || '-', row.penggunaan || '-',
            row.bahan || '-', baik ? '√' : '-', ringan ? '√' : '-', berat ? '√' : '-',
            row.tahun || '-', row.asal || '-', row.no_dokumen || '-',
            row.harga === null || row.harga === undefined ? '-' : String(row.harga),
            row.keterangan || '-'];
    }

    // Metadata tidak disalin dari K.I.B A. Setiap jenis mengikuti contoh Excel K.I.B B.
    // KODE STRUKTUR bukan Kode Aktiva 31.08; jangan menampilkan nilai fiktif.
    function metaEntries() {
        const o = state.organisasi || org;
        const umum = [
            ['PROVINSI', o.provinsi || org.provinsi],
            ['KOTA', o.kota || org.kota],
            ['UNIT', o.unit || org.unit],
            ['DEPARTEMEN', o.departemen || '-'],
            ['DIVISI', o.divisi || '-'],
        ];
        if (state.jenis === 'kendaraan') {
            // Referensi: KIB B Kendaraan.jpeg — enam baris identitas.
            return [...umum, ['KODE STRUKTUR', o.kode_struktur || '-']];
        }
        // Referensi: KIB B mesin.jpeg — tujuh baris identitas.
        return [
            ...umum,
            ['LOKASI', state.lokasi?.nama || state.data[0]?.lokasi || '-'],
            ['KODE STI / STRUKTUR', state.lokasi?.kode_struktur || o.kode_struktur || '-'],
        ];
    }
    const title = () => state.jenis === 'kendaraan'
        ? 'B. KENDARAAN MOBIL TRUK & ALAT BERAT'
        : 'B. PERALATAN DAN MESIN';

    function updatePreview() {
        const ok = ready();
        print.disabled = download.disabled = !ok;
        previewBox.hidden = !ok;
        if (!ok) preview.replaceChildren();
        if (!state.data.length) {
            info.textContent = 'Tidak ada data yang memenuhi kriteria laporan.';
        } else if (!ok) {
            info.textContent = `${state.data.length} baris siap. Pilih periode dan keempat penandatangan untuk melihat preview.`;
        } else {
            info.textContent = `Preview siap: ${state.data.length} baris ${state.jenis === 'mesin' ? 'di lokasi ini' : 'kendaraan'}. Status Kepemilikan tidak dicetak.`;
            preview.innerHTML = paperHtml();
        }
    }

    function paperHtml() {
        const labels = columns();
        const group = state.jenis === 'kendaraan'
            ? { index: 8, length: 5, label: 'Nomor' }
            : { index: 9, length: 3, label: 'Kondisi' };
        const top = labels.map((name, i) => i === group.index
            ? `<th colspan="${group.length}">${group.label}</th>`
            : i > group.index && i < group.index + group.length ? ''
                : `<th rowspan="2">${escapeHtml(name)}</th>`).join('');
        const second = labels.slice(group.index, group.index + group.length)
            .map(name => `<th>${escapeHtml(name)}</th>`).join('');
        const data = state.data.map((row, i) => `<tr>${rowValues(row, i)
            .map(v => `<td>${escapeHtml(cell(v))}</td>`).join('')}</tr>`).join('');
        const meta = metaEntries().map(([k, v]) => `<div><b>${escapeHtml(k)}</b><span>: ${escapeHtml(cell(v))}</span></div>`).join('');
        const signers = roles.map(([role, label]) => {
            const person = chosen(role);
            return `<div class="mesin-report-signature"><b>${escapeHtml(label)},</b>
                <span>${escapeHtml(cell(person?.jabatan))}</span>
                <u>${escapeHtml(cell(person?.nama))}</u>
                <span>NIP. ${escapeHtml(cell(person?.nip))}</span></div>`;
        }).join('');
        return `<article class="mesin-report-paper">
            <div class="mesin-report-kop">
                <img src="${escapeHtml(page.dataset.reportLogo)}" alt="Logo Perumda Tirta Kencana">
                <div class="mesin-report-kop-title"><strong>KARTU INVENTARIS BARANG (K.I.B)</strong>
                    <strong>${escapeHtml(title())}</strong><strong>PERIODE ${escapeHtml(periodName())}</strong></div>
            </div>
            <div class="mesin-report-meta">${meta}</div>
            <div class="mesin-report-table-scroll"><table class="mesin-report-table">
                <thead><tr>${top}</tr><tr>${second}</tr><tr>${labels.map((_, i) => `<th>${i+1}</th>`).join('')}</tr></thead>
                <tbody>${data}</tbody>
            </table></div>
            <div class="mesin-report-date">Samarinda, ${escapeHtml(dateName())}</div>
            <div class="mesin-report-signatures">${signers}</div>
        </article>`;
    }

    async function openReport({ lokasiId = null, mesinId = null } = {}) {
        const currentRequest = ++reportRequestVersion;
        state.jenis = lokasiId || mesinId ? 'mesin' : 'kendaraan';
        state.data = [];
        state.sdm = [];
        state.lokasi = null;
        state.organisasi = org;
        info.textContent = 'Memuat data laporan dan Master SDM Pendukung...';
        $('#mesinReportTitle').textContent = lokasiId ? 'Print Excel Seluruh Mesin per Lokasi'
            : mesinId ? 'Print Excel Mesin' : 'Print Excel Seluruh Kendaraan';
        $('#mesinReportScope').textContent = lokasiId
            ? 'Seluruh inventaris pada lokasi terpilih (tanpa batas tab/pagination)'
            : mesinId ? 'Satu inventaris (mode lama)' : 'Seluruh Kode Aktiva 31.08 dari Nilai Aset dan inventaris';
        form.reset();
        const dateParts = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric', month: '2-digit', timeZone: 'Asia/Makassar'
        }).formatToParts(new Date());
        month.value = `${dateParts.find(p => p.type === 'year').value}-${dateParts.find(p => p.type === 'month').value}`;
        optionList.replaceChildren();
        updatePreview();
        if (!dialog.open) dialog.showModal();
        try {
            const url = new URL(page.dataset.reportUrl, location.origin);
            if (lokasiId) url.searchParams.set('lokasi_id', String(lokasiId));
            else if (mesinId) url.searchParams.set('mesin_id', String(mesinId));
            const resp = await fetch(url, { credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            const json = await resp.json();
            if (!resp.ok || !json.success || !Array.isArray(json.data))
                throw new Error(json.message || `HTTP ${resp.status}`);
            if (!dialog.open || currentRequest !== reportRequestVersion) return;
            state.jenis = json.jenis || state.jenis;
            state.data = json.data;
            state.sdm = Array.isArray(json.sdm) ? json.sdm : [];
            state.organisasi = json.organisasi || org;
            state.lokasi = json.lokasi || null;
            const scope = state.jenis === 'kendaraan'
                ? `Seluruh kendaraan Kode Aktiva 31.08 · ${state.data.length} baris dari semua lokasi`
                : `Seluruh barang di lokasi ${state.lokasi?.nama || 'terpilih'} · ${state.data.length} baris`;
            $('#mesinReportScope').textContent = scope;
            optionList.replaceChildren(...state.sdm.map(person => {
                const option = document.createElement('option');
                option.value = staffLabel(person);
                return option;
            }));
            if (!state.sdm.length) info.textContent = 'Master SDM Pendukung belum memiliki SDM aktif.';
            else updatePreview();
        } catch (error) {
            // Jangan tampilkan error dari dialog lama pada dialog yang baru.
            if (!dialog.open || currentRequest !== reportRequestVersion) return;
            console.error('Gagal mengambil laporan K.I.B B:', error);
            info.textContent = `Gagal memuat: ${error.message}`;
        }
    }

    document.getElementById('mesinReportKendaraanBtn')?.addEventListener('click', () => openReport());
    document.getElementById('mesinDetailBody')?.addEventListener('click', event => {
        const button = event.target.closest('[data-mesin-report-lokasi]');
        if (button) {
            const lokasiId = Number(button.dataset.mesinReportLokasi);
            if (Number.isSafeInteger(lokasiId) && lokasiId > 0) openReport({ lokasiId });
        }
    });
    dialog.querySelectorAll('[data-mesin-report-close]').forEach(button =>
        button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => { reportRequestVersion++; });
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', updatePreview);

    // ZIP tanpa kompresi adalah XLSX Office OpenXML valid. Semua string
    // ditulis sebagai inlineStr sehingga kode barang tidak ditafsir formula.
    function reportZip(entries) {
        const encoder = new TextEncoder();
        const crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let bit = 0; bit < 8; bit++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            crcTable[n] = c >>> 0;
        }
        const crc32 = bytes => {
            let crc = 0xFFFFFFFF;
            for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
            return (crc ^ 0xFFFFFFFF) >>> 0;
        };
        const bytesOf = value => value instanceof Uint8Array ? value : encoder.encode(value);
        const localParts = [];
        const centralParts = [];
        let offset = 0;
        let centralLength = 0;
        const write16 = (view, pos, val) => view.setUint16(pos, val, true);
        const write32 = (view, pos, val) => view.setUint32(pos, val >>> 0, true);

        for (const entry of entries) {
            const nameBytes = encoder.encode(entry.name);
            const data = bytesOf(entry.data);
            const checksum = crc32(data);
            const local = new Uint8Array(30 + nameBytes.length);
            const l = new DataView(local.buffer);
            write32(l, 0, 0x04034B50);
            write16(l, 4, 20);
            write16(l, 6, 0x0800); // UTF-8
            write16(l, 8, 0);      // stored/no compression
            write32(l, 14, checksum);
            write32(l, 18, data.length);
            write32(l, 22, data.length);
            write16(l, 26, nameBytes.length);
            local.set(nameBytes, 30);
            localParts.push(local, data);

            const central = new Uint8Array(46 + nameBytes.length);
            const c = new DataView(central.buffer);
            write32(c, 0, 0x02014B50);
            write16(c, 4, 20);
            write16(c, 6, 20);
            write16(c, 8, 0x0800);
            write16(c, 10, 0);
            write32(c, 16, checksum);
            write32(c, 20, data.length);
            write32(c, 24, data.length);
            write16(c, 28, nameBytes.length);
            write32(c, 42, offset);
            central.set(nameBytes, 46);
            centralParts.push(central);
            offset += local.length + data.length;
            centralLength += central.length;
        }
        const end = new Uint8Array(22);
        const v = new DataView(end.buffer);
        write32(v, 0, 0x06054B50);
        write16(v, 8, entries.length);
        write16(v, 10, entries.length);
        write32(v, 12, centralLength);
        write32(v, 16, offset);
        return new Blob([...localParts, ...centralParts, end], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
    }


    function xmlText(value) {
        return String(value ?? '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }
    function colName(n) {
        let result = '';
        while (n > 0) {
            result = String.fromCharCode(65 + (n - 1) % 26) + result;
            n = Math.floor((n - 1) / 26);
        }
        return result;
    }

    function buildXlsx(logoBytes) {
        const labels = columns();
        const count = labels.length;
        const entries = new Map();
        const merges = [];
        const heights = new Map();
        function put(r, c, value, style = 0) {
            if (!entries.has(r)) entries.set(r, new Map());
            entries.get(r).set(c, { value: value ?? '', style });
        }
        function merged(r1, c1, r2, c2, value, style = 0) {
            for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) put(r, c, '', style);
            put(r1, c1, value, style);
            merges.push(`${colName(c1)}${r1}:${colName(c2)}${r2}`);
        }
        const meta = metaEntries();
        // Logo horizontal menempati kiri; judul dipusatkan relatif SELURUH tabel.
        // Gambar ditempatkan sebagai drawing overlay, bukan merge A1:C5.
        // Dengan demikian tidak bertabrakan dengan judul gabungan A2:O2.
        merged(2, 1, 2, count, 'KARTU INVENTARIS BARANG (K.I.B)', 1);
        merged(3, 1, 3, count, title(), 1);
        merged(4, 1, 4, count, `PERIODE ${periodName()}`, 1);
        [26, 26, 25, 25, 24, 23].forEach((height, i) => heights.set(i + 1, height));
        meta.forEach(([k, v], i) => {
            merged(7+i, 1, 7+i, 2, k, 4);
            merged(7+i, 3, 7+i, 6, `: ${cell(v)}`, 4);
            heights.set(7+i, 18);
        });

        const group = state.jenis === 'kendaraan'
            ? { start: 9, end: 13, title: 'NOMOR' }
            : { start: 10, end: 12, title: 'KONDISI' };
        const header = Math.max(17, 7 + meta.length + 2);
        for (let c = 1; c <= count; c++) {
            if (c === group.start) {
                merged(header, group.start, header, group.end, group.title, 2);
                for (let k = group.start; k <= group.end; k++) put(header + 1, k, labels[k - 1].toUpperCase(), 2);
            } else if (c < group.start || c > group.end) {
                merged(header, c, header + 1, c, labels[c - 1].toUpperCase(), 2);
            }
            put(header + 2, c, String(c), 2);
        }
        heights.set(header, 33);
        heights.set(header + 1, 30);
        heights.set(header + 2, 20);

        state.data.forEach((r, index) => {
            const row = header + 3 + index;
            const values = rowValues(r, index);
            values.forEach((value, c) => put(row, c + 1, cell(value), 3));
            const longest = Math.max(...values.map(v => String(v ?? '').length));
            heights.set(row, Math.min(130, Math.max(29, Math.ceil(longest / 42) * 16 + 12)));
        });
        const dateRow = header + 3 + state.data.length + 2;
        merged(dateRow, Math.floor(count * .67), dateRow, count, `Samarinda, ${dateName()}`, 5);
        const slots = [
            [1, Math.floor(count/4)],
            [Math.floor(count/4)+1, Math.floor(count/2)],
            [Math.floor(count/2)+1, Math.floor(count*3/4)],
            [Math.floor(count*3/4)+1, count]
        ];
        roles.forEach(([role, label], index) => {
            const person = chosen(role);
            const [a, b] = slots[index];
            merged(dateRow + 2, a, dateRow + 2, b, `${label},`, 5);
            merged(dateRow + 3, a, dateRow + 3, b, cell(person?.jabatan), 5);
            merged(dateRow + 8, a, dateRow + 8, b, cell(person?.nama), 6);
            merged(dateRow + 9, a, dateRow + 9, b, `NIP. ${cell(person?.nip)}`, 5);
        });
        const finalRow = dateRow + 10;
        const columnXml = labels.map((_, i) => {
            const width = i === 0 ? 7 : (labels[i].length > 18 ? 25 : 17);
            return `<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`;
        }).join('');
        const rowXml = [...entries].sort(([a],[b]) => a-b).map(([r, row]) => {
            const cells = [...row].sort(([a],[b]) => a-b).map(([c, data]) =>
                `<c r="${colName(c)}${r}" s="${data.style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(data.value)}</t></is></c>`).join('');
            return `<row r="${r}"${heights.has(r)?` ht="${heights.get(r)}" customHeight="1"`:''}>${cells}</row>`;
        }).join('');
        const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const mergesXml = merges.map(ref => `<mergeCell ref="${ref}"/>`).join('');
        const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <worksheet xmlns="${main}" xmlns:r="${rel}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
            <dimension ref="A1:${colName(count)}${finalRow}"/>
            <sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
            <sheetFormatPr defaultRowHeight="18"/><cols>${columnXml}</cols>
            <sheetData>${rowXml}</sheetData>
            <mergeCells count="${merges.length}">${mergesXml}</mergeCells>
            <printOptions horizontalCentered="1" gridLines="0"/>
            <pageMargins left="0.24" right="0.24" top="0.4" bottom="0.4" header="0.15" footer="0.15"/>
            <pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
            ${logoBytes?.length ? '<drawing r:id="rId1"/>' : ''}</worksheet>`;
        const fonts = [
            '<font><sz val="10"/><name val="Arial"/></font>',
            '<font><b/><sz val="12"/><name val="Arial"/></font>',
            '<font><b/><sz val="9"/><name val="Arial"/></font>',
            '<font><b/><u/><sz val="10"/><name val="Arial"/></font>',
        ].join('');
        const fills = '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFEF37"/><bgColor indexed="64"/></patternFill></fill></fills>';
        const borders = '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders>';
        const xfs = [
            [0, 0, 0, 'left'], [1, 0, 0, 'center'], [2, 2, 1, 'center'],
            [0, 0, 1, 'center'], [2, 0, 0, 'left'],
            [0, 0, 0, 'center'], [3, 0, 0, 'center']
        ].map(([fontId, fillId, borderId, align]) =>
            `<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyAlignment="1"><alignment horizontal="${align}" vertical="center" wrapText="1"/></xf>`).join('');
        const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <styleSheet xmlns="${main}"><fonts count="4">${fonts}</fonts>${fills}${borders}
            <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
            <cellXfs count="7">${xfs}</cellXfs>
            <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
        const sheetName = `KIB B - ${state.jenis === 'kendaraan' ? 'Kendaraan' : 'Mesin'}`;
        const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets>
            <definedNames>
                <definedName name="_xlnm.Print_Titles" localSheetId="0">'${sheetName}'!$${header}:$${header+2}</definedName>
                <definedName name="_xlnm.Print_Area" localSheetId="0">'${sheetName}'!$A$1:$${colName(count)}$${finalRow}</definedName>
            </definedNames></workbook>`;
        const files = [
            { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
            { name: 'xl/workbook.xml', data: workbook },
            { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>` },
            { name: 'xl/worksheets/sheet1.xml', data: sheet },
            { name: 'xl/styles.xml', data: styles }
        ];
        if (logoBytes?.length) {
            // Ukuran logo horizontal dihitung dari IHDR PNG agar tidak terdistorsi.
            let logoHeightEmu = 950000;
            if (logoBytes.length >= 24 && logoBytes[0] === 137 && logoBytes[1] === 80) {
                const view = new DataView(logoBytes.buffer, logoBytes.byteOffset, logoBytes.byteLength);
                const imageWidth = view.getUint32(16, false);
                const imageHeight = view.getUint32(20, false);
                if (imageWidth > 0 && imageHeight > 0) {
                    logoHeightEmu = Math.round(3000000 * imageHeight / imageWidth);
                }
            }
            files.push(
                { name: 'xl/media/image1.png', data: logoBytes },
                { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/drawing" Target="../drawings/drawing1.xml"/></Relationships>` },
                { name: 'xl/drawings/_rels/drawing1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/image" Target="../media/image1.png"/></Relationships>` },
                { name: 'xl/drawings/drawing1.xml', data: `<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${rel}"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>120000</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>25000</xdr:rowOff></xdr:from><xdr:ext cx="3000000" cy="${logoHeightEmu}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Logo Perumda Tirta Kencana"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>` }
            );
        }
        const types = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logoBytes?.length?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${logoBytes?.length?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':''}</Types>`;
        files.unshift({ name: '[Content_Types].xml', data: types });
        return reportZip(files);
    }

    download.addEventListener('click', async () => {
        if (!ready()) return;
        download.disabled = true;
        try {
            let logoBytes = null;
            try {
                const resp = await fetch(page.dataset.reportLogo, { credentials: 'same-origin' });
                if (resp.ok) logoBytes = new Uint8Array(await resp.arrayBuffer());
            } catch (error) {
                console.warn('Logo cetak tidak dapat dimuat; laporan tetap diekspor.', error);
            }
            const blob = buildXlsx(logoBytes);
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            const slugLokasi = String(state.lokasi?.nama || 'Lokasi')
                .normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48);
            link.download = `KIB_B_${state.jenis === 'kendaraan' ? 'Seluruh_Kendaraan' : `Lokasi_${slugLokasi}`}_${month.value}.xlsx`;
            document.body.appendChild(link);
            link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('XLSX K.I.B B gagal dibuat:', error);
            info.textContent = `Gagal membuat Excel: ${error.message}`;
        } finally { download.disabled = !ready(); }
    });

    print.addEventListener('click', () => {
        if (!ready()) return;
        const popup = window.open('', '_blank');
        if (!popup) { info.textContent = 'Browser memblokir pop-up. Izinkan pop-up untuk mencetak.'; return; }
        popup.document.open();
        popup.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>K.I.B B ${escapeHtml(state.jenis)}</title>
            <link rel="stylesheet" href="${escapeHtml(document.querySelector('link[href*="mesin.css"]')?.href || '/css/pages/kib/mesin.css')}">
            <style>@page{size:A3 landscape;margin:9mm}body{margin:0;color:#111;background:#fff}.mesin-report-paper{min-width:0;width:100%;padding:0;box-shadow:none}.mesin-report-table-scroll{overflow:visible}.mesin-report-table{font-size:8px}.mesin-report-table thead{display:table-header-group}.mesin-report-table tr{break-inside:avoid}.mesin-report-signatures{break-inside:avoid}</style>
            </head><body>${paperHtml()}</body></html>`);
        popup.document.close();
        popup.addEventListener('load', () => popup.print(), { once: true });
    });
});