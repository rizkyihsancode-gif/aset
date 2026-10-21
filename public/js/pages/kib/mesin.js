
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
// MODE FORM STEP 3 (MENGGUNAKAN INPUT ASLI, TANPA DUPLIKASI)
// Kode 31.08.% -> KIB B Kendaraan, lainnya -> standar.
// ==========================================================
const standardFields = $('#mesinStandardFields');
const vehicleGroups = $('#mesinVehicleGroups');
const vehicleBadge = $('#mesinVehicleBadge');
const step3Title = $('#mesinStep3Title');
const step3Description = $('#mesinStep3Desc');
const remarkLabel = form.querySelector('[name="ket"]')?.closest('label');
const barangSelect = standardFields?.querySelector('[name="id_barang"]');
const originalDescription = step3Description?.textContent.trim() || '';
const originalFieldLabels = standardFields ? [...standardFields.children] : [];
const remarkMarker = document.createComment('posisi asli keterangan mesin');
if (remarkLabel) remarkLabel.before(remarkMarker);
const allFieldLabels = new Map();
for (const label of originalFieldLabels) {
    const input = label.querySelector('[name]');
    if (input) {
        allFieldLabels.set(input.name, label);
    }
}
if (remarkLabel) allFieldLabels.set('ket', remarkLabel);
const kodeBarangLabel = document.createElement('label');
kodeBarangLabel.className = 'mesin-vehicle-readonly';
kodeBarangLabel.append(document.createTextNode('Kode Barang (otomatis)'));
const kodeBarangInput = document.createElement('input');
kodeBarangInput.type = 'text';
kodeBarangInput.id = 'mesinKodeBarangOtomatis';
kodeBarangInput.readOnly = true;
kodeBarangInput.placeholder = 'Pilih Nama Barang';
kodeBarangLabel.append(kodeBarangInput);
function syncKodeBarang() {
    kodeBarangInput.value = barangSelect?.selectedOptions[0]?.dataset.kodeBarang || '';
}
barangSelect?.addEventListener('change', syncKodeBarang);
let isVehicleMode = false;
function setJenisFormMesin(kodeAktiva, namaAktiva = '') {
    if (!standardFields || !vehicleGroups || !remarkLabel || !step3Title) return;
    const kode = String(kodeAktiva ?? '').trim();
    const kendaraan = /^31\.08\./.test(kode);
    if (kendaraan !== isVehicleMode) {
        if (kendaraan) {
            vehicleGroups.replaceChildren();
            const groups = [
                ['A', 'Identitas Barang', ['id_barang', 'kode', 'reg', 'merk']],
                ['B', 'Spesifikasi Kendaraan', ['ukuran', 'bahan', 'tahun', 'pabrik']],
                ['C', 'Nomor Identitas Kendaraan', ['rangka', 'nomor_mesin', 'polisi', 'bpkb']],
                ['D', 'Asal Usul dan Pengguna', ['asal', 'guna', 'ket']],
                ['E', 'Administrasi Inventaris', ['fungsi', 'struktur', 'kondisi', 'harga', 'susut', 'foto', 'dokumen']]
            ];
            for (const [letter, title, names] of groups) {
                const section = document.createElement('section');
                section.className = 'mesin-vehicle-group';
                const heading = document.createElement('h4');
                heading.textContent = `${letter}. ${title}`;
                section.append(heading);
                const grid = document.createElement('div');
                grid.className = 'mesin-form-grid cols-2';
                for (const name of names) {
                    const label = allFieldLabels.get(name);
                    if (label) grid.append(label);
                    if (name === 'id_barang') grid.append(kodeBarangLabel);
                }
                section.append(grid);
                vehicleGroups.append(section);
            }
            standardFields.hidden = true;
            vehicleGroups.hidden = false;
        } else {
            for (const label of originalFieldLabels) standardFields.append(label);
            remarkMarker.before(remarkLabel);
            kodeBarangLabel.remove();
            vehicleGroups.replaceChildren();
            vehicleGroups.hidden = true;
            standardFields.hidden = false;
        }
        isVehicleMode = kendaraan;
    }
    step3Title.textContent = kendaraan
        ? 'Detail Inventaris Kendaraan — KIB B'
        : 'Detail Barang Peralatan dan Mesin';
    if (step3Description) {
        step3Description.textContent = kendaraan
            ? 'Lengkapi identitas kendaraan sesuai kolom Excel KIB B. Lokasi dan organisasi tetap otomatis dari transaksi Nilai Aset.'
            : originalDescription;
    }
    if (vehicleBadge) {
        vehicleBadge.hidden = !kendaraan;
        vehicleBadge.textContent = kendaraan ? `${kode} — ${namaAktiva || 'Kendaraan'}` : '';
    }
    syncKodeBarang();
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
                formatAngka(
                    summary.belum_didata
                ) +
                ' kendaraan belum memiliki catatan pembaruan pajak.';

            isiDropdown();

            halamanAktif = 1;

            gambarTabel();

            $('#pajakInfoStatus').textContent =
                `${formatAngka(kendaraan.length)} kendaraan berkode Aktiva 31.08.%`;

        } catch (error) {
            sudahDimuat = false;

            $('#pajakInfoStatus').textContent =
                `Gagal memuat: ${error.message}`;

            $('#pajakTableBody').innerHTML = `
                <tr>
                    <td
                        colspan="10"
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

        kendaraan.forEach(k => {
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
                k.nama_kendaraan
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

            if (
                status &&
                k.status !== status
            ) {
                return false;
            }

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
    // 11. RENDER TABEL 10 KOLOM
    // ======================================================

    function gambarTabel() {
        const data = dataTersaring();

        const ukuran =
            Number($('#pajakLimit').value) || 10;

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
                    const id = nomorId(
                        k.mesin_id
                    );

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

                    return `
                        <tr>
                            <td>
                                ${mulai + idx + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    k.pengguna || '—'
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    k.merk || '—'
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    k.jenis || '—'
                                )}

                                <small>
                                    ${escapeHTML(
                                        k.kode_aktiva || ''
                                    )}
                                </small>
                            </td>

                            <td>
                                ${escapeHTML(
                                    k.nomor_polisi ||
                                    'Belum diisi'
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    k.tahun || '—'
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    k.lokasi || '—'
                                )}
                            </td>

                            <td>
                                ${tanggalIndonesia(
                                    k.jatuh_tempo
                                )}
                            </td>

                            <td>
                                <span
                                    class="pajak-status ${statusClass}"
                                >
                                    ${statusLabel[statusClass]}
                                </span>

                                ${catatan}
                            </td>

                            <td>
                                <div class="pajak-row-actions">

                                    <button
                                        type="button"
                                        class="view"
                                        data-pajak-view="${id}"
                                        title="Detail Pajak"
                                        aria-label="Detail Pajak"
                                    >
                                        <i data-lucide="eye"></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="edit"
                                        data-pajak-edit="${id}"
                                        title="${pajakId ? 'Edit Pajak' : 'Catat Pajak'}"
                                        aria-label="Edit atau Catat Pajak"
                                    >
                                        <i data-lucide="square-pen"></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="delete"
                                        data-pajak-delete="${id}"
                                        title="Hapus Catatan Pajak"
                                        aria-label="Hapus Catatan Pajak"
                                        ${pajakId ? '' : 'disabled'}
                                    >
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
                            colspan="10"
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

            $('#pajakLimit').value = '10';

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

    const cariKendaraan = id =>
        kendaraan.find(
            k =>
                String(k.mesin_id) ===
                String(id)
        );

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

    function lihatDetail(k) {
        $('#pajakDetailTitle').textContent =
            `Pajak — ${
                k.nomor_polisi ||
                k.kode_aktiva ||
                'Kendaraan'
            }`;

        const data = [
            ['Pengguna', k.pengguna],

            ['Merk / Type', k.merk],

            ['Jenis', k.jenis],

            ['Kode Aktiva', k.kode_aktiva],

            ['Nomor Polisi', k.nomor_polisi],

            ['Tahun', k.tahun],

            ['Lokasi', k.lokasi],

            [
                'Pembaruan Pajak',
                tanggalIndonesia(
                    k.tanggal_bayar
                )
            ],

            [
                'Masa Berlaku',
                k.masa_berlaku_bulan
                    ? `${k.masa_berlaku_bulan} Bulan`
                    : 'Riwayat lama'
            ],

            [
                'Berlaku s/d',
                tanggalIndonesia(
                    k.jatuh_tempo
                )
            ],

            [
                'Nominal',
                formatUang(k.nominal)
            ],

            ['Nomor STNK', k.nomor_stnk],

            ['Keterangan', k.keterangan],

            [
                'Status',
                statusLabel[k.status] ||
                    'Belum Dicatat'
            ]
        ];

        $('#pajakDetailData').innerHTML =
            data.map(
                ([label, value]) => `
                    <div>
                        <dt>
                            ${escapeHTML(label)}
                        </dt>

                        <dd>
                            ${escapeHTML(
                                value || '—'
                            )}
                        </dd>
                    </div>
                `
            ).join('');

        const pdf = nomorId(
            k.pajak_id
        );

        $('#pajakDetailDocument').innerHTML =
            k.ada_dokumen && pdf

                ? `
                    <a
                        class="pajak-btn outline"
                        href="${baseURL}/${pdf}/dokumen"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i data-lucide="file-text"></i>
                        Lihat PDF Pajak
                    </a>
                `

                : '';

        tampilkanDialog(
            'pajakDetailDialog'
        );
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

            const id =
                button.dataset.pajakView ||
                button.dataset.pajakEdit ||
                button.dataset.pajakDelete;

            const k = cariKendaraan(id);

            if (!k) {
                return;
            }

            // Detail
            if (button.dataset.pajakView) {
                lihatDetail(k);
                return;
            }

            // Edit / catat
            if (button.dataset.pajakEdit) {
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
