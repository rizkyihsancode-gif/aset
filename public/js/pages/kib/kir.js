
/*
|--------------------------------------------------------------------------
| K.I.R — KARTU INVENTARIS RUANGAN
| Perumda Tirta Kencana Kota Samarinda
|--------------------------------------------------------------------------
| Menggunakan data PostgreSQL asli.
| Tidak menggunakan data kendaraan atau data demo.
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const app = document.getElementById('kirApp');

    if (!app || window.__kirModernReady) {
        return;
    }

    window.__kirModernReady = true;

    const $ = id => document.getElementById(id);

    const base = app.dataset.base;
    const csrf = app.dataset.token;

    const esc = value =>
        String(value ?? '').replace(
            /[&<>"']/g,
            character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character])
        );

    const str = value =>
        String(value ?? '').trim();

    const rp = value =>
        'Rp ' + new Intl.NumberFormat('id-ID').format(
            Number(value) || 0
        );

    const kirOwnershipOptions = Object.freeze({
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    });

    const ownershipLabel = value => {
        const key = str(value).toLowerCase();
        return kirOwnershipOptions[key] || (str(value) || 'Belum Diatur');
    };

    const ownershipBadge = value => {
        const key = str(value).toLowerCase();
        const category = kirOwnershipOptions[key] ? '' : ' is-unknown';
        return `<span class="kir-owner-badge${category}">${esc(ownershipLabel(value))}</span>`;
    };

    const icons = () =>
        window.lucide?.createIcons?.();

    const rows = Array.from(
        document.querySelectorAll('[data-kir-row]')
    );

    const state = {
        page: 1,

        locationId: null,
        locationName: '',

        units: [],
        activeUnit: null,
        roomItems: [],

        selectedItem: null,
        selectedRoomId: null,
        roomItemRequest: 0,
        roomLoadRequest: 0,
        locationIntent: 'detail',

        pending: [],
        voucher: null,

        editId: null,
        legacyOwnership: '',
        saving: false,
        exporting: false,
        locationCount: 0
    };

    /*
    |--------------------------------------------------------------------------
    | API LARAVEL
    |--------------------------------------------------------------------------
    */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf,

                ...(options.headers || {})
            }
        });

        const result = await response
            .json()
            .catch(() => ({}));

        if (!response.ok || result.success === false) {
            const errors = result.errors
                ? Object.values(result.errors)
                    .flat()
                    .join('\n')
                : '';

            const special = {
                401: 'Silakan login kembali.',

                403:
                    'Akses ditolak. Pastikan sesi login valid.',

                419:
                    'Sesi kedaluwarsa, muat ulang halaman.'
            };

            throw Error(
                errors ||
                special[response.status] ||
                result.message ||
                `HTTP ${response.status}`
            );
        }

        return result;
    }

    /*
    |--------------------------------------------------------------------------
    | MODAL
    |--------------------------------------------------------------------------
    */

    function openModal(id) {
        [
            'kirModalNilai',
            'kirModalLokasi',
            'kirModalBarang',
            'kirModalForm'
        ].forEach(other => {
            if (
                other !== id &&
                $(other)?.open
            ) {
                $(other).close();
            }
        });

        if (!$(id).open) {
            $(id).showModal();
        }

        icons();
    }

    document.querySelectorAll(
        '[data-kir-close]'
    ).forEach(button => {
        button.addEventListener('click', () => {
            const modal = $(
                button.dataset.kirClose
            );

            if (modal?.open) {
                modal.close();
            }
        });
    });

    function error(message) {
        $('kirError').textContent =
            message || '';

        $('kirError').hidden =
            !message;
    }

    /*
    |--------------------------------------------------------------------------
    | TANGGAL DAN JAM WITA
    |--------------------------------------------------------------------------
    */

    function clock() {
        const now = new Date();

        $('kirTanggal').textContent =
            new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
            }).format(now);

        $('kirJam').textContent =
            new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(now).replaceAll('.', ':');
    }

    clock();

    setInterval(clock, 1000);

    /*
    |--------------------------------------------------------------------------
    | FILTER DAN PAGINATION
    |--------------------------------------------------------------------------
    */

    function paginate() {
        const keyword = str(
            $('kirCari').value
        ).toLocaleLowerCase('id-ID');

        const limit = Number(
            $('kirLimit').value
        ) || 20;

        const visible = rows.filter(row =>
            str(row.dataset.search)
                .toLocaleLowerCase('id-ID')
                .includes(keyword)
        );

        const pages = Math.max(
            1,
            Math.ceil(visible.length / limit)
        );

        state.page = Math.min(
            Math.max(1, state.page),
            pages
        );

        const start =
            (state.page - 1) * limit;

        rows.forEach(row => {
            row.hidden = true;
        });

        visible
            .slice(start, start + limit)
            .forEach((row, index) => {
                row.hidden = false;

                row.querySelector(
                    'td:first-child'
                ).textContent =
                    start + index + 1;
            });

        $('kirInfo').textContent = visible.length
            ? `${start + 1}–${Math.min(start + limit, visible.length)} dari ${visible.length} lokasi`
            : 'Tidak ada lokasi yang cocok.';

        const target = $('kirPages');

        target.replaceChildren();

        if (pages <= 1) {
            return;
        }

        function add(
            label,
            to,
            disabled,
            active = false
        ) {
            const button =
                document.createElement('button');

            button.type = 'button';
            button.textContent = label;
            button.disabled = disabled;

            button.className = active
                ? 'active'
                : '';

            button.addEventListener('click', () => {
                state.page = to;
                paginate();
            });

            target.append(button);
        }

        add(
            '‹',
            state.page - 1,
            state.page === 1
        );

        for (
            let page = Math.max(1, state.page - 2);
            page <= Math.min(pages, state.page + 2);
            page++
        ) {
            add(
                String(page),
                page,
                false,
                page === state.page
            );
        }

        add(
            '›',
            state.page + 1,
            state.page === pages
        );
    }

    $('kirCari').addEventListener('input', () => {
        state.page = 1;
        paginate();
    });

    $('kirLimit').addEventListener('change', () => {
        state.page = 1;
        paginate();
    });

    $('kirReset').addEventListener('click', () => {
        $('kirCari').value = '';
        $('kirLimit').value = '20';

        state.page = 1;

        paginate();
    });

    /*
    |--------------------------------------------------------------------------
    | RINCIAN NILAI KIR
    |--------------------------------------------------------------------------
    */

    async function valueLocation(id, name) {
        $('kirNilaiJudul').textContent =
            `Nilai KIR — ${name}`;

        $('kirNilaiBody').innerHTML = `
            <tr>
                <td colspan="7" class="kir-empty">
                    Memuat transaksi...
                </td>
            </tr>
        `;

        $('kirNilaiTotal').textContent =
            'Memuat...';

        openModal('kirModalNilai');

        try {
            const response = await api(
                `${base}/lokasi/${id}/nilai`
            );

            const data = response.data || [];

            $('kirNilaiTotal').textContent =
                rp(response.total);

            $('kirNilaiBody').innerHTML = data.length
                ? data.map((row, index) => `
                    <tr>
                        <td>${index + 1}</td>

                        <td>
                            <strong>
                                ${esc(row.kode || '—')}
                            </strong>
                        </td>

                        <td>
                            ${esc(row.aktiva || '—')}
                        </td>

                        <td>
                            <strong>
                                ${esc(row.no_voucher || '—')}
                            </strong>

                            <small>
                                ${esc(row.tgl_voucher || '—')}
                            </small>
                        </td>

                        <td>
                            ${esc(row.tahun || '—')}
                        </td>

                        <td>
                            <strong class="kir-price">
                                ${rp(row.nilai)}
                            </strong>
                        </td>

                        <td class="kir-wrap">
                            ${esc(row.urai || '—')}
                        </td>
                    </tr>
                `).join('')

                : `
                    <tr>
                        <td colspan="7" class="kir-empty">
                            Tidak ada transaksi Nilai KIR
                            pada lokasi ini.
                        </td>
                    </tr>
                `;

        } catch (exception) {
            $('kirNilaiTotal').textContent = '—';

            $('kirNilaiBody').innerHTML = `
                <tr>
                    <td colspan="7" class="kir-empty">
                        ${esc(exception.message)}
                    </td>
                </tr>
            `;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STRUKTUR UNIT
    |--------------------------------------------------------------------------
    */

    const unitKey = item =>
        [
            item.lokasi,
            item.dep,
            item.div,
            item.gedung,
            item.ruangan
        ].join('::');

    const unitQuery = unit =>
        new URLSearchParams({
            lokasi: unit.lokasi,
            dep: unit.dep,
            div: unit.div,
            gedung: unit.gedung,
            ruangan: unit.ruangan
        }).toString();

    const orgLabel = unit =>
        `${unit.departemen || 'Tanpa Departemen'} / ${unit.divisi || 'Tanpa Divisi'}`;

    function renderTree() {
        const target = $('kirUnitTree');

        if (!state.units.length) {
            target.innerHTML = `
                <p class="kir-muted">
                    Belum ada inventaris pada lokasi ini.
                    Gunakan Tambah KIR.
                </p>
            `;

            $('kirRoomTitle').textContent =
                'Belum Ada Ruangan';

            $('kirRoomContent').innerHTML = `
                <p class="kir-empty">
                    Tambahkan barang untuk membuat
                    entri ruangan baru.
                </p>
            `;

            return;
        }

        const groups = new Map();

        state.units.forEach((unit, index) => {
            const label = orgLabel(unit);

            if (!groups.has(label)) {
                groups.set(label, []);
            }

            groups.get(label).push({
                ...unit,
                index
            });
        });

        target.innerHTML = [...groups]
            .map(([label, units]) => `
                <h4>${esc(label)}</h4>

                ${units.map(unit => `
                    <button
                        type="button"
                        class="kir-tree-btn ${
                            state.activeUnit &&
                            unitKey(state.activeUnit) === unitKey(unit)
                                ? 'active'
                                : ''
                        }"
                        data-unit="${unit.index}"
                    >
                        <i data-lucide="door-open"></i>

                        <span>
                            <strong>
                                ${esc(unit.ruangan)}
                            </strong>

                            <small>
                                ${esc(unit.gedung)}
                                · ${Number(unit.jumlah)} barang
                            </small>
                        </span>
                    </button>
                `).join('')}
            `)
            .join('');

        icons();
    }

    /*
    |--------------------------------------------------------------------------
    | PILIH RUANGAN
    |--------------------------------------------------------------------------
    */

    async function selectUnit(index) {
        state.roomItemRequest++;
        const roomRequestId = ++state.roomLoadRequest;
        state.selectedRoomId = null;
        const unit = state.units[index];

        if (!unit) {
            return;
        }

        state.activeUnit = unit;

        renderTree();

        $('kirRoomTitle').textContent =
            `${unit.gedung} / ${unit.ruangan}`;

        $('kirRoomSubtitle').textContent =
            orgLabel(unit);

        $('kirRoomContent').innerHTML = `
            <p class="kir-empty">
                Memuat barang di ruangan...
            </p>
        `;

        try {
            const response = await api(
                `${base}/ruangan?${unitQuery(unit)}`
            );

            if (roomRequestId !== state.roomLoadRequest) return;
            state.roomItems = response.data || [];

            renderRoomItems();

        } catch (exception) {
            if (roomRequestId !== state.roomLoadRequest) return;
            $('kirRoomContent').textContent =
                exception.message;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TABEL BARANG PER RUANGAN
    |--------------------------------------------------------------------------
    */

    function renderRoomItems() {
        const items = state.roomItems;

        $('kirRoomContent').innerHTML = `
            <div class="kir-room-intro">
                <strong>KARTU INVENTARIS RUANGAN</strong>
                <span>${items.length} barang pada ruangan ini</span>
            </div>
            ${state.locationIntent === 'detail' ? '' : `
                <p class="kir-room-action-guidance" role="status">
                    ${state.locationIntent === 'edit'
                        ? 'Pilih barang pada ruangan ini, kemudian klik ikon pensil untuk Edit.'
                        : 'Pilih barang yang tepat, kemudian klik ikon tempat sampah untuk Hapus. Tidak ada penghapusan massal.'}
                </p>`}
            <div class="kir-table-wrap kir-excel-scroll" role="region"
                 tabindex="0" aria-label="Tabel inventaris ruangan">
                <table class="kir-table kir-items-table kir-excel-table">
                    <thead>
                        <tr>
                            <th rowspan="2">No.</th>
                            <th rowspan="2">Nama Barang</th>
                            <th rowspan="2">Kode Barang</th>
                            <th rowspan="2">Merk / Type</th>
                            <th rowspan="2">Bahan</th>
                            <th rowspan="2">Jumlah</th>
                            <th rowspan="2">Satuan</th>
                            <th colspan="3" class="kir-excel-group">Kondisi</th>
                            <th rowspan="2">Keterangan</th>
                            <th rowspan="2">Status Kepemilikan</th>
                            <th rowspan="2">Aksi</th>
                        </tr>
                        <tr>
                            <th>Baik</th>
                            <th>Rusak Ringan</th>
                            <th>Rusak Berat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.length
                            ? items.map((item, index) => `
                                <tr class="kir-room-data-row" data-kir-room-row="${Number(item.id)}"
                                    title="Klik baris untuk melihat foto dan dokumen di bawah tabel">
                                    <td class="kir-excel-center">${index + 1}</td>
                                    <td><strong>${esc(item.nama_barang || '—')}</strong></td>
                                    <td>${esc(item.kode_barang || '—')}</td>
                                    <td>${esc(item.merk || '—')}</td>
                                    <td>${esc(item.nama_bahan || '—')}</td>
                                    <td class="kir-excel-center">${esc(item.jumlah ?? 0)}</td>
                                    <td class="kir-excel-center">${esc(item.satuan || '—')}</td>
                                    <td class="kir-excel-center">${esc(item.baik ?? 0)}</td>
                                    <td class="kir-excel-center">${esc(item.ringan ?? 0)}</td>
                                    <td class="kir-excel-center">${esc(item.berat ?? 0)}</td>
                                    <td class="kir-wrap">${esc(item.ket || '—')}</td>
                                    <td>${ownershipBadge(item.status_kepemilikan)}</td>
                                    <td>
                                        <div class="kir-actions kir-excel-actions">
                                            <button type="button" class="kir-icon view"
                                                data-item-view="${Number(item.id)}"
                                                title="Detail & lampiran di bawah tabel"
                                                aria-label="Lihat detail dan lampiran ${esc(item.nama_barang || 'barang')}">
                                                <i data-lucide="eye"></i>
                                            </button>
                                            <button type="button" class="kir-icon edit"
                                                data-item-edit="${item.id}" title="Edit">
                                                <i data-lucide="pencil"></i>
                                            </button>
                                            <button type="button" class="kir-icon delete"
                                                data-item-delete="${item.id}" title="Hapus">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')
                            : `<tr><td colspan="13" class="kir-empty">
                                Belum ada barang pada ruangan ini.
                               </td></tr>`}
                    </tbody>
                </table>
            </div>
            <p class="kir-excel-hint">
                Geser tabel ke kanan untuk melihat seluruh kolom dan aksi.
                Klik baris atau ikon Detail untuk menampilkan foto dan berkas di bawah tabel.
                Print Excel Lokasi mencakup seluruh ruangan dalam lokasi yang dipilih.
            </p>

            <section class="kir-inline-files" id="kirInlineFiles" aria-live="polite"
                     aria-label="Lampiran barang KIR terpilih">
                <div class="kir-inline-files-head">
                    <div>
                        <small>LAMPIRAN &amp; TINDAKAN</small>
                        <h4 id="kirInlineTitle">Pilih salah satu barang</h4>
                        <p id="kirInlineSubtitle">Klik baris inventaris atau ikon Detail untuk melihat lampiran.</p>
                    </div>
                    <span class="kir-inline-files-status" id="kirInlineStatus">Belum dipilih</span>
                </div>
                <div class="kir-inline-files-grid">
                    <article class="kir-inline-file-card">
                        <h5><i data-lucide="image"></i> Foto Aset</h5>
                        <div class="kir-inline-file-content" id="kirInlinePhoto">
                            <div class="kir-berkas-empty">Pilih barang untuk melihat foto.</div>
                        </div>
                    </article>
                    <article class="kir-inline-file-card">
                        <h5><i data-lucide="file-text"></i> Dokumen PDF / Berkas</h5>
                        <div class="kir-inline-file-content" id="kirInlineDocument">
                            <div class="kir-berkas-empty">Pilih barang untuk melihat dokumen.</div>
                        </div>
                    </article>
                </div>
            </section>
        `;

        icons();
    }

    /*
    |--------------------------------------------------------------------------
    | LAMPIRAN INLINE — DIBUKA DI BAWAH TABEL RUANGAN
    | Tidak mengubah data. PDF hanya ditampilkan jika API menyediakan URL.
    |--------------------------------------------------------------------------
    */

    const kirSafeAttachmentUrl = value => {
        const url = str(value);
        return (/^\/(?!\/)/.test(url) || /^https?:\/\//i.test(url))
            ? url
            : '';
    };

    async function showRoomAttachments(id) {
        const selected = state.roomItems.find(item => Number(item.id) === Number(id));
        const panel = $('kirInlineFiles');
        if (!selected || !panel) return;

        const requestId = ++state.roomItemRequest;
        state.selectedRoomId = Number(id);
        $('kirInlineTitle').textContent = selected.nama_barang || 'Barang K.I.R';
        $('kirInlineSubtitle').textContent = 'Memuat lampiran barang...';
        $('kirInlineStatus').textContent = 'Memuat...';
        $('kirInlinePhoto').innerHTML = '<div class="kir-berkas-empty">Memuat foto...</div>';
        $('kirInlineDocument').innerHTML = '<div class="kir-berkas-empty">Memuat dokumen...</div>';

        document.querySelectorAll('#kirRoomContent [data-kir-room-row]').forEach(row => {
            row.classList.toggle('is-selected', Number(row.dataset.kirRoomRow) === Number(id));
        });
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        try {
            const response = await api(`${base}/${Number(id)}`);
            if (requestId !== state.roomItemRequest ||
                Number(state.selectedRoomId) !== Number(id) ||
                !$('kirInlineFiles')) return;

            const item = response.data || {};
            const photo = kirSafeAttachmentUrl(item.foto_url);
            const doc = kirSafeAttachmentUrl(item.dokumen_url || item.pdf_url);
            const docName = str(item.dokumen_nama || item.pdf_nama || 'Lihat dokumen PDF');

            $('kirInlineTitle').textContent = item.nama_barang || 'Barang K.I.R';
            $('kirInlineSubtitle').textContent = [item.gedung, item.ruangan]
                .filter(Boolean).join(' / ') || 'Inventaris ruangan';
            $('kirInlineStatus').textContent = `ID #${Number(id)}`;
            $('kirInlinePhoto').innerHTML = photo
                ? `<a class="kir-inline-photo-link" href="${esc(photo)}" target="_blank"
                      rel="noopener noreferrer" title="Buka foto asli">
                      <img src="${esc(photo)}" loading="lazy" alt="Foto ${esc(item.nama_barang || 'aset')}">
                      <span>Buka foto ukuran asli</span>
                   </a>`
                : '<div class="kir-berkas-empty">Foto aset belum tersedia.</div>';
            $('kirInlineDocument').innerHTML = doc
                ? `<a class="kir-inline-pdf-link" href="${esc(doc)}" target="_blank"
                      rel="noopener noreferrer">
                      <i data-lucide="file-text"></i>
                      <span>${esc(docName)}</span>
                      <i data-lucide="external-link"></i>
                   </a>`
                : `<div class="kir-berkas-empty">
                      Dokumen PDF belum tersedia pada inventaris K.I.R ini.
                   </div>`;
            icons();
        } catch (exception) {
            if (requestId !== state.roomItemRequest || !$('kirInlineFiles')) return;
            $('kirInlineStatus').textContent = 'Gagal memuat';
            $('kirInlineSubtitle').textContent = exception.message;
            $('kirInlinePhoto').innerHTML = '<div class="kir-berkas-empty">Lampiran tidak dapat dimuat.</div>';
            $('kirInlineDocument').innerHTML = '<div class="kir-berkas-empty">Coba pilih ulang barang.</div>';
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL LOKASI
    |--------------------------------------------------------------------------
    */

    async function openLocation(id, name, intent = 'detail') {
        state.roomItemRequest++;
        state.roomLoadRequest++;
        state.selectedRoomId = null;
        state.locationIntent = intent;
        state.locationId = id;
        state.locationName = name;

        state.units = [];
        state.activeUnit = null;
        state.roomItems = [];
        state.locationCount = 0;
        $('kirExportLokasi').disabled = true;
        $('kirExportSummary').textContent = 'Memuat jumlah barang...';

        $('kirLokasiJudul').textContent = name;

        $('kirUnitTree').textContent =
            'Memuat struktur...';

        $('kirRoomContent').textContent = '';

        openModal('kirModalLokasi');

        try {
            const response = await api(
                `${base}/lokasi/${id}`
            );

            state.units = response.data || [];
            state.locationCount = state.units.reduce(
                (sum, unit) => sum + (Number(unit.jumlah) || 0), 0
            );
            $('kirExportSummary').textContent =
                `${state.locationCount} barang di lokasi ini`;
            $('kirExportLokasi').disabled = state.locationCount === 0;

            renderTree();

            if (state.units.length) {
                await selectUnit(0);
            }

        } catch (exception) {
            $('kirUnitTree').textContent =
                exception.message;
        }
    }

    $('kirUnitTree').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-unit]'
            );

            if (button) {
                selectUnit(
                    Number(button.dataset.unit)
                );
            }
        }
    );

    /* ========================================================================
     * K.I.R — PRINT EXCEL PER LOKASI (standar K.I.B A)
     * - 11 kolom sesuai referensi KIR.jpeg
     * - seluruh inventaris satu lokasi lintas ruangan; tanpa pagination
     * - periode & empat penandatangan Master SDM aktif
     * - satu kir.js, tanpa library eksternal
     * ======================================================================== */

    const kirReport = {
        payload: null,
        locationId: null,
        requestId: 0,
        busy: false,
        selected: [null, null, null, null],
        currentChoice: [-1, -1, -1, -1]
    };
    const kirSignerLabels = ['Diketahui oleh', 'Diperiksa oleh (1)',
        'Diperiksa oleh (2)', 'Dibuat oleh'];
    const kirReportInputs = [0, 1, 2, 3].map(i => $(`kirReportSigner${i}`));
    const kirReportLists = [0, 1, 2, 3].map(i => $(`kirReportList${i}`));
    const kirReportDialog = $('kirReportDialog');

    function kirReportPeriodLabel() {
        const value = $('kirReportPeriod')?.value || '';
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return '';
        const [year, month] = value.split('-').map(Number);
        return `${new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: 'UTC' })
            .format(new Date(Date.UTC(year, month - 1, 1)))} ${year}`.toUpperCase();
    }

    function kirUnique(items, key, label = 'BERAGAM') {
        const values = [...new Set(items.map(item => str(item[key])).filter(Boolean))];
        return values.length === 1 ? values[0] : (values.length > 1 ? label : '—');
    }

    function kirReportMetadata(payload) {
        const items = payload.data || [];
        const depCode = kirUnique(items, 'kode_dep', 'BERAGAM');
        const divCode = kirUnique(items, 'kode_div', 'BERAGAM');
        const deptDivCode = depCode === '—' && divCode === '—'
            ? '—' : `${depCode} / ${divCode}`;
        return [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDA TIRTA KENCANA'],
            ['DEPARTEMEN', kirUnique(items, 'departemen')],
            ['DIVISI', kirUnique(items, 'divisi')],
            ['LOKASI', str(payload.lokasi?.nama) || '—'],
            ['RUANG', kirUnique(items, 'ruangan', 'BERBAGAI RUANGAN')],
            ['KODE DEPT / DIV', deptDivCode]
        ];
    }

    function kirReportSignerLabel(sdm) {
        return `${str(sdm.nama)} — ${str(sdm.jabatan) || 'Tanpa Jabatan'} — NIP ${str(sdm.nip) || '—'}`;
    }

    function kirReportValid() {
        return kirReport.payload && kirReport.payload.data?.length > 0 &&
            kirReportPeriodLabel() && kirReport.selected.every((selected, i) =>
                selected && kirReportInputs[i]?.value === kirReportSignerLabel(selected));
    }

    function kirCloseSignerList(index) {
        const list = kirReportLists[index];
        if (list) {
            if (list.matches(':popover-open')) list.hidePopover();
            list.hidden = true;
        }
        kirReportInputs[index]?.setAttribute('aria-expanded', 'false');
        kirReportInputs[index]?.removeAttribute('aria-activedescendant');
    }

    function kirCloseOtherSignerLists(except) {
        kirReportLists.forEach((_, index) => {
            if (index !== except) kirCloseSignerList(index);
        });
    }

    // Dropdown SDM memakai popover top-layer agar tidak tertutup oleh scroll modal.
    // Jika bidang berada di dekat bawah modal, daftar tampil ke arah atas.
    function kirPositionSignerList(index) {
        const input = kirReportInputs[index];
        const list = kirReportLists[index];
        if (!input || !list || list.hidden || !list.matches(':popover-open')) return;

        const rect = input.getBoundingClientRect();
        const scrollArea = kirReportDialog.querySelector('.kir-report-body');
        const bodyRect = scrollArea.getBoundingClientRect();
        const dialogRect = kirReportDialog.getBoundingClientRect();
        if (rect.bottom <= bodyRect.top || rect.top >= bodyRect.bottom) {
            kirCloseSignerList(index);
            return;
        }
        const padding = 9;
        const topLimit = Math.max(padding, dialogRect.top + padding);
        const bottomLimit = Math.min(window.innerHeight - padding, dialogRect.bottom - padding);
        const below = Math.max(0, bottomLimit - rect.bottom - 5);
        const above = Math.max(0, rect.top - topLimit - 5);
        const showAbove = below < 130 && above > below;
        const available = showAbove ? above : below;
        const height = Math.min(248, Math.max(0, available));
        if (height < 35) {
            kirCloseSignerList(index);
            return;
        }
        const width = Math.min(rect.width, window.innerWidth - padding * 2);
        const left = Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding));
        Object.assign(list.style, {
            top: `${Math.round(showAbove ? rect.top - height - 5 : rect.bottom + 5)}px`,
            left: `${Math.round(left)}px`,
            right: 'auto',
            bottom: 'auto',
            width: `${Math.round(width)}px`,
            maxHeight: `${Math.round(height)}px`
        });
    }

    function kirSelectSigner(index, signer) {
        kirReport.selected[index] = signer;
        kirReportInputs[index].value = kirReportSignerLabel(signer);
        kirCloseSignerList(index);
        kirReportUpdate();
    }

    function kirRenderSignerList(index) {
        const list = kirReportLists[index];
        const input = kirReportInputs[index];
        if (!list || !input || !kirReportDialog.open) return;
        kirCloseOtherSignerLists(index);
        const query = input.value.toLocaleLowerCase('id-ID').trim();
        const options = Array.isArray(kirReport.payload?.sdm) ? kirReport.payload.sdm : [];
        const filtered = options.filter(person =>
            [person.nama, person.jabatan, person.nip, kirReportSignerLabel(person)]
                .some(value => str(value).toLocaleLowerCase('id-ID').includes(query))
        ).slice(0, 100);
        list.replaceChildren();
        kirReport.currentChoice[index] = -1;
        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.className = 'kir-report-suggestion-empty';
            empty.textContent = options.length
                ? 'Tidak ada SDM aktif yang cocok.'
                : 'Belum ada SDM Pendukung berstatus aktif.';
            list.appendChild(empty);
        }
        filtered.forEach((person, optionIndex) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'kir-report-suggestion';
            button.setAttribute('role', 'option');
            button.id = `kirReportOption${index}-${optionIndex}`;
            button.dataset.optionIndex = String(optionIndex);
            const name = document.createElement('strong');
            name.textContent = str(person.nama);
            const detail = document.createElement('small');
            detail.textContent = `${str(person.jabatan) || 'Tanpa Jabatan'} · NIP ${str(person.nip) || '—'}`;
            button.append(name, detail);
            button.addEventListener('mousedown', event => event.preventDefault());
            button.addEventListener('click', () => kirSelectSigner(index, person));
            list.appendChild(button);
        });
        list.hidden = false;
        if (typeof list.showPopover === 'function') {
            if (!list.matches(':popover-open')) list.showPopover();
            kirPositionSignerList(index);
        }
        input.setAttribute('aria-expanded', 'true');
    }

    kirReportInputs.forEach((input, index) => {
        if (!input) return;
        input.addEventListener('focus', () => kirRenderSignerList(index));
        input.addEventListener('input', () => {
            kirReport.selected[index] = null;
            kirRenderSignerList(index);
            kirReportUpdate();
        });
        input.addEventListener('keydown', event => {
            const list = kirReportLists[index];
            if (event.key === 'Escape') {
                kirCloseSignerList(index);
                return;
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (list?.hidden) kirRenderSignerList(index);
                const buttons = [...list.querySelectorAll('button')];
                if (!buttons.length) return;
                event.preventDefault();
                kirReport.currentChoice[index] = event.key === 'ArrowDown'
                    ? (kirReport.currentChoice[index] + 1) % buttons.length
                    : (kirReport.currentChoice[index] + buttons.length - 1) % buttons.length;
                buttons.forEach((button, i) =>
                    button.classList.toggle('is-selected', i === kirReport.currentChoice[index]));
                buttons[kirReport.currentChoice[index]].scrollIntoView({ block: 'nearest' });
            }
            if (event.key === 'Enter' && !list?.hidden) {
                const buttons = [...list.querySelectorAll('button')];
                const button = buttons[kirReport.currentChoice[index]] || buttons[0];
                if (button) {
                    event.preventDefault();
                    button.click();
                }
            }
        });
        input.addEventListener('blur', () => {
            setTimeout(() => kirCloseSignerList(index), 120);
        });
    });
    document.addEventListener('pointerdown', event => {
        kirReportInputs.forEach((input, i) => {
            if (!input?.closest('[data-kir-signer-field]')?.contains(event.target)) {
                kirCloseSignerList(i);
            }
        });
    });

    function kirReportPreviewHtml(payload, period, signers) {
        const meta = kirReportMetadata(payload).map(([label, value]) =>
            `<div class="kir-report-meta-line"><strong>${esc(label)}</strong><span>: ${esc(value)}</span></div>`
        ).join('');
        const dataRows = payload.data.map((item, i) => {
            const c = value => esc(str(value) || '—');
            const cond = n => Number(n) > 0 ? String(Number(n)) : '—';
            return `<tr><td>${i + 1}</td><td>${c(item.nama_barang)}</td>` +
                `<td>${c(item.kode_barang)}</td><td>${c(item.merk)}</td>` +
                `<td>${c(item.nama_bahan)}</td><td>${Number(item.jumlah) || 0}</td>` +
                `<td>${c(item.satuan)}</td><td>${cond(item.baik)}</td>` +
                `<td>${cond(item.ringan)}</td><td>${cond(item.berat)}</td>` +
                `<td>${c(item.ket)}</td></tr>`;
        }).join('');
        const signatures = signers.map((signer, i) =>
            `<section><strong>${esc(kirSignerLabels[i])},</strong>` +
            `<span>${esc(str(signer.jabatan) || '—')}</span>` +
            `<u>${esc(str(signer.nama))}</u>` +
            `<small>NIP. ${esc(str(signer.nip) || '—')}</small></section>`
        ).join('');
        const dateText = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date());
        return `<article class="kir-report-sheet">` +
            `<div class="kir-report-sheet-top"><img src="${esc(app.dataset.logo)}" alt="Logo Perumda Tirta Kencana">` +
            `<div class="kir-report-sheet-title"><strong>KARTU INVENTARIS RUANGAN</strong>` +
            `<strong>PERIODE ${esc(period)}</strong></div></div>` +
            `<div class="kir-report-meta">${meta}</div>` +
            `<div class="kir-report-table-wrap"><table class="kir-report-table">` +
            `<thead><tr><th rowspan="2">NO.</th><th rowspan="2">NAMA BARANG</th>` +
            `<th rowspan="2">KODE BARANG</th><th rowspan="2">MERK/TYPE</th>` +
            `<th rowspan="2">BAHAN</th><th rowspan="2">JUMLAH</th>` +
            `<th rowspan="2">SATUAN</th><th colspan="3">KONDISI</th>` +
            `<th rowspan="2">KETERANGAN</th></tr>` +
            `<tr><th>BAIK</th><th>RUSAK RINGAN</th><th>RUSAK BERAT</th></tr></thead>` +
            `<tbody>${dataRows}</tbody></table></div>` +
            `<div class="kir-report-dateline"><span>Samarinda, ${esc(dateText)}</span></div>` +
            `<div class="kir-report-sheet-signers">${signatures}</div></article>`;
    }

    function kirReportUpdate() {
        const valid = Boolean(kirReportValid());
        const info = $('kirReportInfo');
        const previewBox = $('kirReportPreviewBox');
        $('kirReportPrint').disabled = !valid || kirReport.busy;
        $('kirReportDownload').disabled = !valid || kirReport.busy;
        previewBox.hidden = !valid;
        if (!kirReport.payload) {
            info.textContent = 'Memuat inventaris lokasi dan SDM Pendukung aktif...';
            return;
        }
        if (!kirReport.payload.sdm?.length) {
            info.textContent = 'Belum ada SDM Pendukung aktif. Atur status di Master SDM Pendukung.';
        } else if (!valid) {
            info.textContent = 'Pilih periode dan keempat penandatangan dari daftar SDM aktif untuk melihat preview.';
        } else {
            info.textContent = `Preview siap: ${kirReport.payload.data.length} barang dari lokasi ${kirReport.payload.lokasi.nama}; 11 kolom K.I.R, tanpa Status Kepemilikan.`;
            $('kirReportPreviewCount').textContent = `${kirReport.payload.data.length} barang`;
            $('kirReportPreview').innerHTML = kirReportPreviewHtml(
                kirReport.payload, kirReportPeriodLabel(), kirReport.selected);
        }
    }

    async function exportLocation(id, locationName = '') {
        const locationId = Number(id);
        if (!Number.isSafeInteger(locationId) || locationId < 1) return;
        const requestId = ++kirReport.requestId;
        kirReport.payload = null;
        kirReport.locationId = locationId;
        kirReport.selected = [null, null, null, null];
        kirReportInputs.forEach(input => { if (input) input.value = ''; });
        const month = new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit'
        }).format(new Date());
        $('kirReportPeriod').value = month;
        $('kirReportSubtitle').textContent = `Seluruh inventaris di ${locationName || 'lokasi terpilih'} · memuat data...`;
        if (!kirReportDialog.open) kirReportDialog.showModal();
        kirReportUpdate();
        try {
            const response = await api(`${base}/lokasi/${locationId}/export-data`);
            if (requestId !== kirReport.requestId || !kirReportDialog.open) return;
            if (!Array.isArray(response.data) || !response.data.length) {
                throw new Error('Belum ada inventaris untuk dicetak pada lokasi ini.');
            }
            if (response.data.some(item => Number(item.id_lokasi) !== locationId)) {
                throw new Error('Respons mengandung barang dari lokasi lain; laporan dibatalkan.');
            }
            kirReport.payload = response;
            $('kirReportSubtitle').textContent =
                `Seluruh inventaris lokasi ${response.lokasi.nama} · ${response.data.length} barang dari semua ruangan`;
            kirReportUpdate();
        } catch (exception) {
            if (requestId === kirReport.requestId) {
                $('kirReportInfo').textContent = `Laporan gagal dimuat: ${exception.message}`;
            }
        }
    }

    // Mencegah respons lama mengganti lokasi setelah dialog ditutup.
    kirReportDialog?.addEventListener('close', () => {
        kirReport.requestId += 1;
        kirReportLists.forEach((list, i) => kirCloseSignerList(i));
    });
    kirReportDialog?.querySelector('.kir-report-body')?.addEventListener('scroll', () => {
        kirReportLists.forEach((_, index) => kirPositionSignerList(index));
    }, { passive: true });
    window.addEventListener('resize', () => {
        if (kirReportDialog?.open) {
            kirReportLists.forEach((_, index) => kirPositionSignerList(index));
        }
    });
    $('kirReportPeriod')?.addEventListener('change', kirReportUpdate);
    $('kirExportLokasi')?.addEventListener('click', () => {
        if (state.locationId) exportLocation(state.locationId, state.locationName);
    });

    /* XLSX OpenXML 11 kolom, kop, logo, 4 tanda tangan, border utuh. */
    function buildKirLocationXlsx(payload, period, signers, logoBytes) {
        const items = payload?.data;
        if (!Array.isArray(items) || !items.length || !payload?.lokasi?.id) {
            throw new Error('Tidak ada inventaris KIR untuk dicetak.');
        }
        const enc = new TextEncoder();
        const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
        const xml = value => String(value ?? '')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
        const ref = (col, row) => `${String.fromCharCode(64 + col)}${row}`;
        const cell = (c, r, value, style = 6) =>
            `<c r="${ref(c, r)}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
        const number = (c, r, value, style = 6) =>
            `<c r="${ref(c,r)}" s="${style}"><v>${Number(value) || 0}</v></c>`;
        const row = (r, entries, height = 21) =>
            `<row r="${r}" ht="${height}" customHeight="1">${entries.join('')}</row>`;
        const merges = [];
        const makeMerge = (r1,c1,r2,c2) => {
            merges.push(`${ref(c1,r1)}:${ref(c2,r2)}`);
        };
        const widths = [7, 36, 22, 26, 17, 11, 13, 11, 16, 16, 39];
        const rows = [];
        for (let r = 1; r <= 7; r++) {
            const cells = [];
            for (let c = 1; c <= 11; c++) {
                cells.push(cell(c,r, (c === 1 && r === 2) ? 'KARTU INVENTARIS RUANGAN' :
                    (c === 1 && r === 3) ? `PERIODE ${period}` : '', r === 2 ? 1 : r === 3 ? 2 : 0));
            }
            rows.push(row(r,cells,r === 1 ? 16 : 21));
        }
        makeMerge(2,1,2,11); makeMerge(3,1,3,11);
        kirReportMetadata(payload).forEach(([label, value], i) => {
            const r = i + 8;
            const entries = [];
            for (let c = 1; c <= 11; c++) {
                entries.push(cell(c,r,c===1 ? label : c===3 ? `: ${value}` : '', c===1 ? 3 : 4));
            }
            rows.push(row(r, entries, 19));
            makeMerge(r, 1, r, 2); makeMerge(r, 3, r, 6);
        });
        rows.push(row(16, [], 15)); rows.push(row(17, [], 15));
        const h1 = ['NO.', 'NAMA BARANG', 'KODE BARANG', 'MERK / TYPE', 'BAHAN',
            'JUMLAH', 'SATUAN', 'KONDISI', '', '', 'KETERANGAN'];
        const h2 = ['', '', '', '', '', '', '', 'BAIK', 'RUSAK RINGAN', 'RUSAK BERAT', ''];
        rows.push(row(18,h1.map((v,i)=>cell(i+1,18,v,5)),30));
        rows.push(row(19,h2.map((v,i)=>cell(i+1,19,v,5)),27));
        for(let c=1;c<=11;c++) if(c<8 || c===11) makeMerge(18,c,19,c);
        makeMerge(18,8,18,10);
        rows.push(row(20,Array.from({length:11},(_,i)=>number(i+1,20,i+1,5)),21));
        items.forEach((item, i)=> {
            const r=21+i;
            const fields=[i+1, str(item.nama_barang)||'—', str(item.kode_barang)||'—',
                str(item.merk)||'—', str(item.nama_bahan)||'—', Number(item.jumlah)||0,
                str(item.satuan)||'—', Number(item.baik)>0?Number(item.baik):'—',
                Number(item.ringan)>0?Number(item.ringan):'—',
                Number(item.berat)>0?Number(item.berat):'—', str(item.ket)||'—'];
            const maxLines=Math.max(1,Math.ceil(fields[1].length/38),Math.ceil(fields[10].length/43));
            rows.push(row(r,fields.map((value,c)=>
                typeof value==='number'?number(c+1,r,value,c===1||c===10?7:6)
                    :cell(c+1,r,value,c===1||c===10?7:6)),Math.min(110,Math.max(26,maxLines*16+8))));
        });
        const lastData=20+items.length;
        const dateRow=lastData+2;
        const labelRow=dateRow+2;
        const positionRow=labelRow+1;
        const nameRow=labelRow+5;
        const nipRow=nameRow+1;
        const today=new Intl.DateTimeFormat('id-ID',{
            timeZone:'Asia/Makassar',day:'numeric',month:'long',year:'numeric'
        }).format(new Date());
        // Tanggal terpusat persis di atas tanda tangan keempat (Dibuat oleh: J-K).
        rows.push(row(dateRow,[cell(10,dateRow,`Samarinda, ${today}`,9)],23));
        makeMerge(dateRow,10,dateRow,11);
        const signatureCells = new Map([
            [labelRow, []], [positionRow, []], [nameRow, []], [nipRow, []]
        ]);
        [[1,2],[4,5],[7,8],[10,11]].forEach(([start,end],i)=>{
            const s=signers[i];
            for(const [r,textValue,style] of [
                [labelRow,`${kirSignerLabels[i]},`,9],
                [positionRow,str(s.jabatan)||'—',9],
                [nameRow,str(s.nama),10],
                [nipRow,`NIP. ${str(s.nip)||'—'}`,9]
            ]){
                signatureCells.get(r).push(cell(start,r,textValue,style));
                makeMerge(r,start,r,end);
            }
        });
        for (const [r, cells] of signatureCells) {
            rows.push(row(r,cells,20));
        }
        const lastRow=nipRow+2;
        const styles=declaration+`<styleSheet xmlns="${ns}">`+
            '<fonts count="4"><font><sz val="10"/><name val="Arial"/></font>'+
            '<font><b/><sz val="14"/><name val="Arial"/></font>'+
            '<font><b/><sz val="10"/><name val="Arial"/></font>'+
            '<font><b/><u/><sz val="10"/><name val="Arial"/></font></fonts>'+
            '<fills count="3"><fill><patternFill patternType="none"/></fill>'+
            '<fill><patternFill patternType="gray125"/></fill>'+
            '<fill><patternFill patternType="solid"><fgColor rgb="FFD5DFEA"/></patternFill></fill></fills>'+
            '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'+
            '<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders>'+
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
            '<cellXfs count="11">'+
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
            '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
            '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
            '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>'+
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>'+
            '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'+
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'+
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>'+
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
            '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
            '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
            '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
        const sheet=declaration+`<worksheet xmlns="${ns}" xmlns:r="${rel}">`+
            // SpreadsheetML: sheetPr HARUS sebelum dimension/sheetViews/sheetData.
            // Excel dapat meminta repair jika sheetPr diletakkan setelah pageMargins.
            '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'+
            `<dimension ref="A1:K${lastRow}"/>`+
            '<sheetViews><sheetView workbookViewId="0"><pane ySplit="20" topLeftCell="A21" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
            `<cols>${widths.map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('')}</cols>`+
            `<sheetData>${rows.join('')}</sheetData>`+
            `<mergeCells count="${merges.length}">${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`+
            '<printOptions horizontalCentered="1"/>'+
            '<pageMargins left="0.23" right="0.23" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>'+
            '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>'+
            '<drawing r:id="rId1"/>'+
            '</worksheet>';
        const workbook=declaration+`<workbook xmlns="${ns}" xmlns:r="${rel}">`+
            '<sheets><sheet name="KIR - Inventaris Ruangan" sheetId="1" r:id="rId1"/></sheets>'+
            `<definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'KIR - Inventaris Ruangan'!$18:$20</definedName>`+
            `<definedName name="_xlnm.Print_Area" localSheetId="0">'KIR - Inventaris Ruangan'!$A$1:$K$${lastRow}</definedName></definedNames></workbook>`;
        const rootRels=declaration+`<Relationships xmlns="${pkg}">`+
            `<Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
        const workbookRels=declaration+`<Relationships xmlns="${pkg}">`+
            `<Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/>`+
            `<Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`;
        const sheetRels=declaration+`<Relationships xmlns="${pkg}">`+
            `<Relationship Id="rId1" Type="${rel}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`;
        const drawing=declaration+'<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" '+
            'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '+
            `xmlns:r="${rel}"><xdr:oneCellAnchor><xdr:from>`+
            '<xdr:col>0</xdr:col><xdr:colOff>120000</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>20000</xdr:rowOff></xdr:from>'+
            '<xdr:ext cx="2450000" cy="775000"/><xdr:pic><xdr:nvPicPr>'+
            '<xdr:cNvPr id="1" name="Logo Perumda"/><xdr:cNvPicPr/></xdr:nvPicPr>'+
            '<xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>'+
            '<xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>'+
            '</xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>';
        const drawingRels=declaration+`<Relationships xmlns="${pkg}">`+
            `<Relationship Id="rId1" Type="${rel}/image" Target="../media/logo.png"/></Relationships>`;
        const contentTypes=declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
            '<Default Extension="xml" ContentType="application/xml"/>'+
            '<Default Extension="png" ContentType="image/png"/>'+
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
            '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'+
            '</Types>';
        // ZIP writer: menyimpan bytes logo PNG TANPA konversi menjadi teks.
        const crcTable=new Uint32Array(256);
        for(let i=0;i<256;i++){
            let c=i;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xEDB88320:0);
            crcTable[i]=c>>>0;
        }
        const crc32=bytes=>{
            let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);
            return (c^0xFFFFFFFF)>>>0;
        };
        function zipStore(files){
            const localParts=[],centralParts=[];let offset=0,centralSize=0;
            for(const [filename,content] of files){
                const name=enc.encode(filename),bytes=content instanceof Uint8Array?content:enc.encode(content);
                const crc=crc32(bytes);
                const local=new Uint8Array(30+name.length+bytes.length),l=new DataView(local.buffer);
                l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);
                l.setUint32(14,crc,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);
                l.setUint16(26,name.length,true);local.set(name,30);local.set(bytes,30+name.length);
                localParts.push(local);
                const central=new Uint8Array(46+name.length),d=new DataView(central.buffer);
                d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);
                d.setUint16(8,0x0800,true);d.setUint32(16,crc,true);d.setUint32(20,bytes.length,true);
                d.setUint32(24,bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);
                central.set(name,46);centralParts.push(central);
                centralSize+=central.length;offset+=local.length;
            }
            const tail=new Uint8Array(22),t=new DataView(tail.buffer);
            t.setUint32(0,0x06054b50,true);t.setUint16(8,files.length,true);
            t.setUint16(10,files.length,true);t.setUint32(12,centralSize,true);t.setUint32(16,offset,true);
            const parts=[...localParts,...centralParts,tail];
            const out=new Uint8Array(parts.reduce((sum,p)=>sum+p.length,0));
            let pos=0;for(const part of parts){out.set(part,pos);pos+=part.length;}
            return out;
        }
        return zipStore([
            ['[Content_Types].xml',contentTypes],['_rels/.rels',rootRels],
            ['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',workbookRels],
            ['xl/styles.xml',styles],['xl/worksheets/sheet1.xml',sheet],
            ['xl/worksheets/_rels/sheet1.xml.rels',sheetRels],
            ['xl/drawings/drawing1.xml',drawing],['xl/drawings/_rels/drawing1.xml.rels',drawingRels],
            ['xl/media/logo.png',logoBytes]
        ]);
    }

    $('kirReportPrint')?.addEventListener('click', () => {
        if (!kirReportValid()) return;
        const printHtml = kirReportPreviewHtml(kirReport.payload,
            kirReportPeriodLabel(), kirReport.selected);
        const styles = `<style>*{box-sizing:border-box}body{font:11px Arial,sans-serif;margin:12mm;color:#111}`+
            `.kir-report-sheet-top{display:flex;align-items:center;justify-content:space-between;position:relative;height:105px}`+
            `.kir-report-sheet-top img{width:230px;height:auto}`+
            `.kir-report-sheet-title{position:absolute;left:27%;right:12%;display:grid;text-align:center;gap:5px;font-size:14px}`+
            `.kir-report-meta{display:grid;gap:4px;margin:12px 0 22px}`+
            `.kir-report-meta-line{display:grid;grid-template-columns:160px 1fr}`+
            `.kir-report-table{border-collapse:collapse;width:100%;table-layout:fixed}`+
            `.kir-report-table th,.kir-report-table td{border:1px solid #444;padding:5px;font-size:10px;vertical-align:middle;text-align:center;overflow-wrap:anywhere}`+
            `.kir-report-table td:nth-child(2),.kir-report-table td:nth-child(11){text-align:left}`+
            `.kir-report-table th{background:#d5dfea}`+
            `.kir-report-dateline{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}`+
            `.kir-report-dateline>span{grid-column:4;text-align:center}`+
            `.kir-report-sheet-signers{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}`+
            `.kir-report-sheet-signers section{display:grid;text-align:center;gap:5px;min-height:125px}`+
            `.kir-report-sheet-signers u{margin-top:35px;font-weight:bold}`+
            `@page{size:A4 landscape;margin:9mm}thead{display:table-header-group}`+
            `</style>`;
        const iframe=document.createElement('iframe');
        iframe.style.position='fixed';iframe.style.width='0';iframe.style.height='0';
        iframe.style.opacity='0';iframe.style.pointerEvents='none';
        document.body.appendChild(iframe);
        const doc=iframe.contentDocument;
        doc.open();doc.write(`<!doctype html><html><head><title>Print K.I.R</title>${styles}</head>`+
            `<body>${printHtml}</body></html>`);doc.close();
        const printNow=()=>{
            try{iframe.contentWindow.focus();iframe.contentWindow.print();}
            finally{setTimeout(()=>iframe.remove(),1500);}
        };
        const img=doc.querySelector('img');
        if(img&&!img.complete){img.addEventListener('load',printNow,{once:true});
            img.addEventListener('error',printNow,{once:true});}
        else printNow();
    });

    $('kirReportDownload')?.addEventListener('click', async () => {
        if (!kirReportValid() || kirReport.busy) return;
        kirReport.busy=true;kirReportUpdate();
        try{
            const img=await fetch(app.dataset.logo,{credentials:'same-origin'});
            if(!img.ok)throw new Error('Logo horizontal tidak ditemukan di public/images/logo_hr.png.');
            const logoBytes=new Uint8Array(await img.arrayBuffer());
            const bytes=buildKirLocationXlsx(kirReport.payload,kirReportPeriodLabel(),
                kirReport.selected,logoBytes);
            const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            const url=URL.createObjectURL(blob);
            const anchor=document.createElement('a');
            const safeName=str(kirReport.payload.lokasi?.nama).normalize('NFKD')
                .replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,60)||'LOKASI';
            anchor.href=url;
            anchor.download=`KIR_${safeName}_${$('kirReportPeriod').value}.xlsx`;
            document.body.appendChild(anchor);anchor.click();anchor.remove();
            setTimeout(()=>URL.revokeObjectURL(url),3000);
        }catch(exception){
            console.error('KIR XLSX:',exception);
            alert('Download Excel KIR gagal: '+exception.message);
        }finally{kirReport.busy=false;kirReportUpdate();}
    });

        /*
    |--------------------------------------------------------------------------
    | EVENT TABEL LOKASI
    |--------------------------------------------------------------------------
    */

    $('kirTabelLokasi').addEventListener(
        'click',
        event => {
            const nilai = event.target.closest(
                '[data-kir-value]'
            );

            if (nilai) {
                return valueLocation(
                    Number(nilai.dataset.kirValue),
                    nilai.dataset.name
                );
            }

            const groupEdit = event.target.closest('[data-kir-group-edit]');
            if (groupEdit) {
                return openLocation(Number(groupEdit.dataset.kirGroupEdit),
                    groupEdit.dataset.name, 'edit');
            }

            const groupDelete = event.target.closest('[data-kir-group-delete]');
            if (groupDelete) {
                return openLocation(Number(groupDelete.dataset.kirGroupDelete),
                    groupDelete.dataset.name, 'delete');
            }

            const view = event.target.closest(
                '[data-kir-location]'
            );

            if (view) {
                return openLocation(
                    Number(view.dataset.kirLocation),
                    view.dataset.name
                );
            }

            // Tambah tersedia di tombol global dan Detail ruangan.
            // Tidak ada lagi tombol Tambah pada kolom Aksi lokasi.
        }
    );

    /*
    |--------------------------------------------------------------------------
    | DETAIL SATU BARANG
    |--------------------------------------------------------------------------
    */

    async function viewItem(id) {
        state.selectedItem = null;
        $('kirBarangDetail').textContent = 'Memuat detail inventaris...';
        $('kirEditDetail').disabled = true;
        $('kirDeleteDetail').disabled = true;
        openModal('kirModalBarang');

        try {
            const response = await api(`${base}/${id}`);
            const item = response.data;
            state.selectedItem = item;
            $('kirBarangTitle').textContent =
                item.nama_barang || 'Detail KIR';

            $('kirBarangDetail').innerHTML = `
                <div class="kir-excel-item-heading">
                    <div>
                        <small>KARTU INVENTARIS RUANGAN</small>
                        <h3>${esc(item.nama_lokasi || 'Lokasi belum diatur')}</h3>
                        <p>${esc(item.departemen || '—')} / ${esc(item.divisi || '—')}
                           · ${esc(item.gedung || '—')} / ${esc(item.ruangan || '—')}</p>
                    </div>
                    <span class="kir-excel-item-count">1 barang</span>
                </div>
                <div class="kir-table-wrap kir-excel-scroll" role="region"
                     tabindex="0" aria-label="Tabel detail barang KIR">
                    <table class="kir-table kir-excel-table kir-item-detail-table">
                        <thead>
                            <tr>
                                <th rowspan="2">No.</th>
                                <th rowspan="2">Nama Barang</th>
                                <th rowspan="2">Kode Barang</th>
                                <th rowspan="2">Merk / Type</th>
                                <th rowspan="2">Bahan</th>
                                <th rowspan="2">Jumlah</th>
                                <th rowspan="2">Satuan</th>
                                <th colspan="3" class="kir-excel-group">Kondisi</th>
                                <th rowspan="2">Keterangan</th>
                                <th rowspan="2">Status Kepemilikan</th>
                            </tr>
                            <tr>
                                <th>Baik</th>
                                <th>Rusak Ringan</th>
                                <th>Rusak Berat</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="kir-excel-center">1</td>
                                <td><strong>${esc(item.nama_barang || '—')}</strong></td>
                                <td>${esc(item.kode_barang || '—')}</td>
                                <td>${esc(item.merk || '—')}</td>
                                <td>${esc(item.nama_bahan || '—')}</td>
                                <td class="kir-excel-center">${esc(item.jumlah ?? 0)}</td>
                                <td class="kir-excel-center">${esc(item.satuan || '—')}</td>
                                <td class="kir-excel-center">${esc(item.baik ?? 0)}</td>
                                <td class="kir-excel-center">${esc(item.ringan ?? 0)}</td>
                                <td class="kir-excel-center">${esc(item.berat ?? 0)}</td>
                                <td class="kir-wrap">${esc(item.ket || '—')}</td>
                                <td>${ownershipBadge(item.status_kepemilikan)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="kir-excel-hint">Geser tabel secara horizontal jika diperlukan.</p>
                <section class="kir-berkas-panel">
                    <h3><i data-lucide="image"></i> Foto &amp; Berkas</h3>
                    ${item.foto_url
                        ? `<a href="${esc(item.foto_url)}" target="_blank"
                              rel="noopener noreferrer" title="Buka foto asli">
                               <img class="kir-detail-photo" src="${esc(item.foto_url)}"
                                    alt="Foto ${esc(item.nama_barang || 'barang')}" loading="lazy">
                           </a>`
                        : `<div class="kir-berkas-empty">Foto belum tersedia.</div>`}
                </section>
            `;
            $('kirEditDetail').disabled = false;
            $('kirDeleteDetail').disabled = false;
            icons();
        } catch (exception) {
            $('kirBarangDetail').textContent = exception.message;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DATA PENDING
    |--------------------------------------------------------------------------
    */

    function renderPending() {
        const keyword = str(
            $('kirPendingSearch').value
        ).toLocaleLowerCase('id-ID');

        const data = state.pending.filter(row =>
            [
                row.no_voucher,
                row.lokasi,
                row.departemen,
                row.divisi,
                row.urai
            ]
                .join(' ')
                .toLocaleLowerCase('id-ID')
                .includes(keyword)
        );

        $('kirPendingCount').textContent =
            `${data.length} data`;

        $('kirPendingBody').innerHTML = data.length
            ? data.map((row, index) => `
                <tr>
                    <td>${index + 1}</td>

                    <td>
                        <strong>
                            ${esc(row.no_voucher)}
                        </strong>

                        <small>
                            ${esc(row.tgl_voucher)}
                        </small>
                    </td>

                    <td>
                        ${esc(row.lokasi)}

                        <small>
                            ${esc(row.alamat)}
                        </small>
                    </td>

                    <td>${esc(row.departemen)}</td>
                    <td>${esc(row.divisi)}</td>

                    <td class="kir-price">
                        ${rp(row.nilai)}
                    </td>

                    <td class="kir-wrap">
                        ${esc(row.urai)}
                    </td>

                    <td>
                        <button
                            class="kir-btn primary"
                            type="button"
                            data-pick-pending="${row.id}"
                        >
                            Pilih
                        </button>
                    </td>
                </tr>
            `).join('')

            : `
                <tr>
                    <td colspan="8" class="kir-empty">
                        Tidak ada transaksi KIR
                        yang menunggu diproses.
                    </td>
                </tr>
            `;
    }

    async function loadPending() {
        $('kirPendingBody').innerHTML = `
            <tr>
                <td colspan="8" class="kir-empty">
                    Memuat data pending...
                </td>
            </tr>
        `;

        try {
            const response = await api(
                app.dataset.pending
            );

            state.pending = (
                response.data || []
            ).filter(row =>
                Number(row.jenisn) === 1 &&
                Number(row.stat) === 0
            );

            renderPending();

        } catch (exception) {
            $('kirPendingBody').innerHTML = `
                <tr>
                    <td colspan="8" class="kir-empty">
                        ${esc(exception.message)}
                    </td>
                </tr>
            `;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RELASI DEPARTEMEN DAN DIVISI
    |--------------------------------------------------------------------------
    */

    function updateDivisi() {
        const departemen = $('kirDep').value;

        Array.from(
            $('kirDiv').options
        ).forEach(option => {
            option.hidden =
                Boolean(option.value) &&
                option.dataset.dep !== departemen;
        });

        const chosen =
            $('kirDiv').selectedOptions[0];

        if (chosen?.hidden) {
            $('kirDiv').value = '';
        }
    }

    function updateAddress() {
        $('kirAlamat').value =
            $('kirLokasi').selectedOptions[0]
                ?.dataset.alamat || '';
    }

    function updateKode() {
        $('kirKode').value =
            $('kirBarang').selectedOptions[0]
                ?.dataset.kode || '';
    }

    $('kirDep').addEventListener('change', () => {
        $('kirDiv').value = '';
        updateDivisi();
    });

    $('kirLokasi').addEventListener(
        'change',
        updateAddress
    );

    $('kirBarang').addEventListener(
        'change',
        updateKode
    );

    /*
    |--------------------------------------------------------------------------
    | FORM UTILITAS
    |--------------------------------------------------------------------------
    */

    function selectLegacy(id, value) {
        const input = $(id);
        const selected = str(value);

        if (
            selected &&
            ![...input.options].some(
                option => option.value === selected
            )
        ) {
            input.add(
                new Option(
                    `${selected} (data lama)`,
                    selected
                )
            );
        }

        input.value = selected;
    }

    function setContext(context = {}) {
        $('kirLokasi').value =
            context.lokasi || '';

        $('kirDep').value =
            context.dep || '';

        updateDivisi();

        $('kirDiv').value =
            context.div || '';

        $('kirGedung').value =
            context.gedung || '';

        $('kirRuang').value =
            context.ruangan || '';

        updateAddress();
    }

    function changeMode(voucher) {
        $('kirPendingSection').hidden =
            Boolean(voucher);

        $('kirSelectedVoucher').hidden =
            !voucher;

        $('kirChangeVoucher').hidden =
            state.editId !== null;
    }

    function syncKirOwnership() {
        const input = $('kirKepemilikanCari');
        const hidden = $('kirKepemilikan');
        const typed = str(input.value).toLowerCase();
        const found = Object.entries(kirOwnershipOptions).find(
            ([key, label]) => typed === key || typed === label.toLowerCase()
        );
        hidden.value = found ? found[0] : '';

        const isLegacyUntouched = Boolean(
            state.editId && state.legacyOwnership &&
            typed === state.legacyOwnership.toLowerCase()
        );
        input.setCustomValidity(
            typed && !found && !isLegacyUntouched
                ? 'Pilih salah satu status kepemilikan dari daftar.'
                : ''
        );
        return Boolean(found || isLegacyUntouched || (!typed && state.editId));
    }

    $('kirKepemilikanCari').addEventListener('input', syncKirOwnership);
    $('kirKepemilikanCari').addEventListener('change', syncKirOwnership);

    function resetForm() {
        state.voucher = null;
        state.editId = null;
        state.legacyOwnership = '';

        $('kirForm').reset();
        $('kirKepemilikanCari').required = true;
        $('kirKepemilikanCari').setCustomValidity('');
        $('kirKepemilikan').value = '';

        error('');

        $('kirVoucherId').value = '';
        $('kirPendingSearch').value = '';

        $('kirFormTitle').textContent =
            'Tambah Data KIR';

        $('kirSimpan').textContent =
            'Simpan Data KIR';

        $('kirRoomExisting').hidden = true;

        [
            'kirLokasi',
            'kirDep',
            'kirDiv'
        ].forEach(id => {
            $(id).disabled = false;
        });

        $('kirGedung').readOnly = false;
        $('kirRuang').readOnly = false;

        updateDivisi();
        updateAddress();
        updateKode();
    }

    /*
    |--------------------------------------------------------------------------
    | BUKA FORM TAMBAH
    |--------------------------------------------------------------------------
    */

    async function openCreate(
        pending = true,
        context = {}
    ) {
        resetForm();

        setContext(context);
        changeMode(!pending);

        if (!pending) {
            $('kirVoucherLabel').textContent =
                'Input langsung tanpa voucher';

            $('kirVoucherDesc').textContent =
                'Nilai KIR tidak terhubung '
                + 'ke voucher untuk input manual.';
        }

        $('kirChangeVoucher').hidden = true;

        openModal('kirModalForm');

        if (pending) {
            await loadPending();
        }

        if (context.ruangan) {
            loadExisting();
        }
    }

    $('kirTambah').addEventListener(
        'click',
        () => openCreate(true)
    );

    $('kirDataMasuk').addEventListener(
        'click',
        () => openCreate(true)
    );

    /*
    |--------------------------------------------------------------------------
    | INPUT MANUAL DAN GANTI VOUCHER
    |--------------------------------------------------------------------------
    */

    $('kirManualMode').addEventListener(
        'click',
        () => {
            state.voucher = null;

            $('kirVoucherId').value = '';

            changeMode(true);

            $('kirChangeVoucher').hidden = false;

            $('kirVoucherLabel').textContent =
                'Input langsung tanpa voucher';

            $('kirVoucherDesc').textContent =
                'Nilai tidak dihubungkan dengan voucher.';
        }
    );

    $('kirChangeVoucher').addEventListener(
        'click',
        () => {
            state.voucher = null;

            $('kirVoucherId').value = '';

            [
                'kirLokasi',
                'kirDep',
                'kirDiv'
            ].forEach(id => {
                $(id).disabled = false;
            });

            changeMode(false);

            loadPending();
        }
    );

    $('kirPendingSearch').addEventListener(
        'input',
        renderPending
    );

    /*
    |--------------------------------------------------------------------------
    | PILIH VOUCHER PENDING
    |--------------------------------------------------------------------------
    */

    $('kirPendingBody').addEventListener(
        'click',
        async event => {
            const button = event.target.closest(
                '[data-pick-pending]'
            );

            if (!button) {
                return;
            }

            const row = state.pending.find(
                item =>
                    Number(item.id) ===
                    Number(button.dataset.pickPending)
            );

            if (!row) {
                return;
            }

            if (
                !row.id_lokasi ||
                !row.dep ||
                !row.div
            ) {
                error(
                    'Voucher belum memiliki Lokasi, '
                    + 'Departemen, dan Divisi yang lengkap.'
                );

                return;
            }

            state.voucher = row;

            $('kirVoucherId').value =
                row.id;

            $('kirVoucherLabel').textContent =
                `Voucher ${row.no_voucher}`;

            $('kirVoucherDesc').textContent =
                `${row.lokasi} · ${row.departemen} / ` +
                `${row.divisi} · ${rp(row.nilai)}`;

            setContext({
                lokasi: row.id_lokasi,
                dep: row.dep,
                div: row.div
            });

            [
                'kirLokasi',
                'kirDep',
                'kirDiv'
            ].forEach(id => {
                $(id).disabled = true;
            });

            changeMode(true);

            $('kirChangeVoucher').hidden = false;

            error('');

            /*
             * Gedung dan ruangan tidak tersedia
             * langsung pada nilai_aktivas.
             *
             * Autoisi hanya jika satu kandidat.
             */

            try {
                const response = await api(
                    `${base}/lokasi/${row.id_lokasi}`
                );

                const matches = (
                    response.data || []
                ).filter(unit =>
                    Number(unit.dep) === Number(row.dep) &&
                    Number(unit.div) === Number(row.div)
                );

                const gedungs = [
                    ...new Set(
                        matches
                            .map(unit => str(unit.gedung))
                            .filter(Boolean)
                    )
                ];

                if (gedungs.length === 1) {
                    $('kirGedung').value = gedungs[0];
                }

                const rooms = matches
                    .filter(unit =>
                        unit.gedung ===
                        $('kirGedung').value
                    )
                    .map(unit => str(unit.ruangan))
                    .filter(Boolean);

                const uniqueRooms = [
                    ...new Set(rooms)
                ];

                if (uniqueRooms.length === 1) {
                    $('kirRuang').value =
                        uniqueRooms[0];
                }

                if ($('kirRuang').value) {
                    loadExisting();
                }

            } catch (exception) {
                error(exception.message);
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | DATA INVENTARIS EXISTING DI FORM
    |--------------------------------------------------------------------------
    */

    async function loadExisting() {
        const context = {
            lokasi: $('kirLokasi').value,
            dep: $('kirDep').value,
            div: $('kirDiv').value,
            gedung: $('kirGedung').value,
            ruangan: $('kirRuang').value
        };

        if (
            Object.values(context).some(
                value => !str(value)
            )
        ) {
            $('kirRoomExisting').hidden = true;
            return;
        }

        $('kirRoomExisting').hidden = false;

        $('kirExistingBody').innerHTML = `
            <tr>
                <td colspan="4" class="kir-empty">
                    Memuat inventaris...
                </td>
            </tr>
        `;

        try {
            const response = await api(
                `${base}/ruangan?${unitQuery(context)}`
            );

            $('kirExistingBody').innerHTML =
                response.data.length

                    ? response.data.map(item => `
                        <tr>
                            <td>
                                ${esc(item.nama_barang)}
                            </td>

                            <td>
                                ${esc(item.merk || '—')}
                            </td>

                            <td>${esc(item.jumlah)}</td>

                            <td>
                                ${esc(item.baik)} /
                                ${esc(item.ringan)} /
                                ${esc(item.berat)}
                            </td>
                        </tr>
                    `).join('')

                    : `
                        <tr>
                            <td colspan="4" class="kir-empty">
                                Belum ada aset di ruangan ini.
                            </td>
                        </tr>
                    `;

        } catch (exception) {
            $('kirExistingBody').innerHTML = `
                <tr>
                    <td colspan="4" class="kir-empty">
                        ${esc(exception.message)}
                    </td>
                </tr>
            `;
        }
    }

    [
        'kirGedung',
        'kirRuang'
    ].forEach(id => {
        $(id).addEventListener(
            'change',
            loadExisting
        );
    });

    /*
    |--------------------------------------------------------------------------
    | TAMBAH DARI DETAIL RUANGAN
    |--------------------------------------------------------------------------
    */

    $('kirAddFromDetail').addEventListener(
        'click',
        () => {
            const unit = state.activeUnit;

            openCreate(
                false,
                unit
                    ? {
                        lokasi: unit.lokasi,
                        dep: unit.dep,
                        div: unit.div,
                        gedung: unit.gedung,
                        ruangan: unit.ruangan
                    }
                    : {
                        lokasi: state.locationId
                    }
            );
        }
    );

    /*
    |--------------------------------------------------------------------------
    | AKSI PER BARANG
    |--------------------------------------------------------------------------
    */

    $('kirRoomContent').addEventListener(
        'click',
        event => {
            const view = event.target.closest(
                '[data-item-view]'
            );

            const edit = event.target.closest(
                '[data-item-edit]'
            );

            const del = event.target.closest(
                '[data-item-delete]'
            );

            if (view) {
                showRoomAttachments(Number(view.dataset.itemView));

            } else if (edit) {
                startEdit(
                    Number(edit.dataset.itemEdit)
                );

            } else if (del) {
                deleteItem(
                    Number(del.dataset.itemDelete)
                );
            } else {
                const row = event.target.closest('[data-kir-room-row]');
                if (row) showRoomAttachments(Number(row.dataset.kirRoomRow));
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | EDIT INVENTARIS
    |--------------------------------------------------------------------------
    */

    async function startEdit(id) {
        try {
            const response = await api(
                `${base}/${id}`
            );

            const item = response.data;

            resetForm();

            state.editId = id;

            $('kirFormTitle').textContent =
                'Edit Inventaris KIR';

            $('kirSimpan').textContent =
                'Simpan Perubahan';

            setContext({
                lokasi: item.id_lokasi,
                dep: item.id_departemen,
                div: item.id_div,
                gedung: item.gedung,
                ruangan: item.ruangan
            });

            [
                'kirLokasi',
                'kirDep',
                'kirDiv'
            ].forEach(key => {
                $(key).disabled = true;
            });

            selectLegacy(
                'kirBarang',
                item.id_barang
            );

            selectLegacy(
                'kirBahan',
                item.bahan
            );

            const ownershipRaw = str(item.status_kepemilikan);
            const ownershipKnown = Boolean(kirOwnershipOptions[ownershipRaw.toLowerCase()]);
            state.legacyOwnership = ownershipKnown ? '' : ownershipRaw;
            $('kirKepemilikanCari').required = false;
            $('kirKepemilikanCari').value = ownershipKnown
                ? kirOwnershipOptions[ownershipRaw.toLowerCase()]
                : ownershipRaw;
            syncKirOwnership();

            $('kirMerk').value = item.merk || '';
            $('kirJumlah').value = item.jumlah;
            $('kirSatuan').value = item.satuan || '';
            $('kirBaik').value = item.baik;
            $('kirRingan').value = item.ringan;
            $('kirBerat').value = item.berat;
            $('kirKet').value = item.ket || '';

            updateKode();

            $('kirGedung').readOnly = true;
            $('kirRuang').readOnly = true;

            $('kirVoucherId').value = '';

            $('kirPendingSection').hidden = true;
            $('kirSelectedVoucher').hidden = true;

            openModal('kirModalForm');

            loadExisting();

        } catch (exception) {
            alert(exception.message);
        }
    }

    $('kirEditDetail').addEventListener(
        'click',
        () => {
            if (state.selectedItem) {
                startEdit(
                    Number(state.selectedItem.id)
                );
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | HAPUS INVENTARIS
    |--------------------------------------------------------------------------
    */

    async function deleteItem(id) {
        if (
            !id ||
            state.saving ||
            !confirm(
                `Hapus satu inventaris KIR (ID ${id}) secara permanen?\n` +
                'Status voucher asal tidak akan diubah.'
            )
        ) {
            return;
        }

        state.saving = true;

        try {
            const response = await api(
                `${base}/${id}`,
                {
                    method: 'DELETE'
                }
            );

            alert(response.message);

            location.reload();

        } catch (exception) {
            alert(exception.message);

            state.saving = false;
        }
    }

    $('kirDeleteDetail').addEventListener(
        'click',
        () => {
            if (state.selectedItem) {
                deleteItem(
                    Number(state.selectedItem.id)
                );
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | SIMPAN TAMBAH / EDIT
    |--------------------------------------------------------------------------
    */

    $('kirForm').addEventListener(
        'submit',
        async event => {
            event.preventDefault();

            if (state.saving) {
                return;
            }

            error('');

            const jumlah = Number(
                $('kirJumlah').value
            );

            const sum =
                Number($('kirBaik').value) +
                Number($('kirRingan').value) +
                Number($('kirBerat').value);

            if (jumlah !== sum) {
                error(
                    'Jumlah harus sama dengan Baik + '
                    + 'Rusak Ringan + Rusak Berat.'
                );

                return;
            }

            // Input pencarian harus dipilih dari opsi yang sah.
            // Edit arsip lama boleh tanpa mengganti status yang sudah ada.
            syncKirOwnership();
            if (!event.currentTarget.reportValidity()) {
                return;
            }

            state.saving = true;

            const button = $('kirSimpan');

            button.disabled = true;
            button.textContent = 'Menyimpan...';

            try {
                const form = new FormData(
                    event.currentTarget
                );

                /*
                 * Select organisasi disabled pada
                 * voucher dan Edit.
                 * Nilainya tetap harus dikirim.
                 */

                [
                    'kirLokasi',
                    'kirDep',
                    'kirDiv'
                ].forEach(id => {
                    form.set(
                        $(id).name,
                        $(id).value
                    );
                });

                if (state.editId) {
                    form.set(
                        '_method',
                        'PUT'
                    );

                    form.delete('id_nilai_aktiva');

                } else if (state.voucher) {
                    form.set(
                        'id_nilai_aktiva',
                        String(state.voucher.id)
                    );

                } else {
                    form.delete('id_nilai_aktiva');
                }

                const url = state.editId
                    ? `${base}/${state.editId}`
                    : base;

                const response = await api(
                    url,
                    {
                        method: 'POST',
                        body: form
                    }
                );

                alert(response.message);

                location.reload();

            } catch (exception) {
                error(exception.message);

                button.disabled = false;

                button.textContent =
                    state.editId
                        ? 'Simpan Perubahan'
                        : 'Simpan KIR';

                state.saving = false;
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | RESET LOCK FORM
    |--------------------------------------------------------------------------
    */

    $('kirModalForm').addEventListener(
        'close',
        () => {
            $('kirGedung').readOnly = false;
            $('kirRuang').readOnly = false;
        }
    );

    /*
    |--------------------------------------------------------------------------
    | INISIALISASI
    |--------------------------------------------------------------------------
    */

    paginate();

    icons();

})();