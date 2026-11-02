
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

        pending: [],
        voucher: null,

        editId: null,
        saving: false
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

            state.roomItems = response.data || [];

            renderRoomItems();

        } catch (exception) {
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
            <div class="kir-table-wrap">
                <table class="kir-table kir-items-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Nama Aset / Kode</th>
                            <th>Merk/Type</th>
                            <th>Bahan</th>
                            <th>Jumlah</th>
                            <th>Satuan</th>
                            <th>Baik</th>
                            <th>Ringan</th>
                            <th>Berat</th>
                            <th>Foto</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${
                            items.length
                                ? items.map((item, index) => `
                                    <tr>
                                        <td>${index + 1}</td>

                                        <td>
                                            <strong>
                                                ${esc(item.nama_barang || '—')}
                                            </strong>

                                            <small>
                                                ${esc(item.kode_barang || '')}
                                            </small>
                                        </td>

                                        <td>${esc(item.merk || '—')}</td>
                                        <td>${esc(item.nama_bahan || '—')}</td>
                                        <td>${esc(item.jumlah)}</td>
                                        <td>${esc(item.satuan || '—')}</td>
                                        <td>${esc(item.baik)}</td>
                                        <td>${esc(item.ringan)}</td>
                                        <td>${esc(item.berat)}</td>

                                        <td>
                                            ${
                                                item.foto_url
                                                    ? `
                                                        <img
                                                            class="kir-thumb"
                                                            src="${esc(item.foto_url)}"
                                                            alt="Foto aset"
                                                            loading="lazy"
                                                        >
                                                    `
                                                    : '—'
                                            }
                                        </td>

                                        <td>
                                            <div class="kir-actions">
                                                <button
                                                    type="button"
                                                    class="kir-icon view"
                                                    data-item-view="${item.id}"
                                                    title="Detail"
                                                >
                                                    <i data-lucide="eye"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    class="kir-icon edit"
                                                    data-item-edit="${item.id}"
                                                    title="Edit"
                                                >
                                                    <i data-lucide="pencil"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    class="kir-icon delete"
                                                    data-item-delete="${item.id}"
                                                    title="Hapus"
                                                >
                                                    <i data-lucide="trash-2"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')

                                : `
                                    <tr>
                                        <td colspan="11" class="kir-empty">
                                            Belum ada barang pada ruangan.
                                        </td>
                                    </tr>
                                `
                        }
                    </tbody>
                </table>
            </div>
        `;

        icons();
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL LOKASI
    |--------------------------------------------------------------------------
    */

    async function openLocation(id, name) {
        state.locationId = id;
        state.locationName = name;

        state.units = [];
        state.activeUnit = null;
        state.roomItems = [];

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

            const view = event.target.closest(
                '[data-kir-location]'
            );

            if (view) {
                return openLocation(
                    Number(view.dataset.kirLocation),
                    view.dataset.name
                );
            }

            const add = event.target.closest(
                '[data-kir-add-location]'
            );

            if (add) {
                return openCreate(
                    false,
                    {
                        lokasi: Number(
                            add.dataset.kirAddLocation
                        )
                    }
                );
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | DETAIL SATU BARANG
    |--------------------------------------------------------------------------
    */

    const field = (name, value) => `
        <div class="kir-detail-field">
            <small>${esc(name)}</small>

            <strong>
                ${esc(str(value) || '—')}
            </strong>
        </div>
    `;

    async function viewItem(id) {
        state.selectedItem = null;

        $('kirBarangDetail').textContent =
            'Memuat detail inventaris...';

        $('kirEditDetail').disabled = true;
        $('kirDeleteDetail').disabled = true;

        openModal('kirModalBarang');

        try {
            const response = await api(
                `${base}/${id}`
            );

            const item = response.data;

            state.selectedItem = item;

            $('kirBarangTitle').textContent =
                item.nama_barang || 'Detail KIR';

            $('kirBarangDetail').innerHTML = `
                <div class="kir-detail-hero">
                    <div>
                        <strong>
                            ${esc(item.nama_barang || '—')}
                        </strong>

                        <p>
                            ${esc(item.nama_lokasi || '—')}
                            · ${esc(item.divisi || '—')}
                            / ${esc(item.gedung || '—')}
                            / ${esc(item.ruangan || '—')}
                        </p>
                    </div>
                </div>

                ${
                    item.foto_url
                        ? `
                            <img
                                class="kir-detail-photo"
                                src="${esc(item.foto_url)}"
                                alt="Foto inventaris"
                            >
                        `
                        : `
                            <p class="kir-muted">
                                Belum ada foto.
                            </p>
                        `
                }

                <div class="kir-detail-grid">
                    ${field('Kode Aset', item.kode_barang)}
                    ${field('Nama Aset', item.nama_barang)}
                    ${field('Merk/Type', item.merk)}
                    ${field('Bahan', item.nama_bahan)}
                    ${field('Jumlah', item.jumlah)}
                    ${field('Satuan', item.satuan)}
                    ${field('Kondisi Baik', item.baik)}
                    ${field('Rusak Ringan', item.ringan)}
                    ${field('Rusak Berat', item.berat)}
                    ${field('Gedung', item.gedung)}
                    ${field('Ruangan', item.ruangan)}
                    ${field('Keterangan', item.ket)}
                </div>
            `;

            $('kirEditDetail').disabled = false;
            $('kirDeleteDetail').disabled = false;

        } catch (exception) {
            $('kirBarangDetail').textContent =
                exception.message;
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

    function resetForm() {
        state.voucher = null;
        state.editId = null;

        $('kirForm').reset();

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
                viewItem(
                    Number(view.dataset.itemView)
                );

            } else if (edit) {
                startEdit(
                    Number(edit.dataset.itemEdit)
                );

            } else if (del) {
                deleteItem(
                    Number(del.dataset.itemDelete)
                );
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
