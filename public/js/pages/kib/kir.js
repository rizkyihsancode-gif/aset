
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
            <div class="kir-room-intro">
                <strong>KARTU INVENTARIS RUANGAN</strong>
                <span>${items.length} barang pada ruangan ini</span>
            </div>
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
                            <th rowspan="2">Berkas &amp; Aksi</th>
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
                                <tr>
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
                                            <button type="button" class="kir-btn outline kir-berkas-btn"
                                                data-item-view="${item.id}" title="Buka Detail dan Foto">
                                                <i data-lucide="folder-open"></i> Berkas
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
                Geser tabel ke kanan untuk melihat kondisi, keterangan, dan berkas.
                Export Excel Lokasi mencakup seluruh ruangan dalam lokasi yang dipilih.
            </p>
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

    /*
    |--------------------------------------------------------------------------
    | EXPORT EXCEL K.I.R PER LOKASI (XLSX ASLI, SATU kir.js)
    |--------------------------------------------------------------------------
    | - Seluruh data berdasarkan id_lokasi, lintas ruangan dan gedung.
    | - Tidak menggunakan hanya baris pagination atau ruangan yang dipilih.
    | - Satu baris pada worksheet = satu record inventaris KIR.
    | - Tidak perlu CDN, Composer, atau JavaScript kedua.
    | - Text XML menjadi inlineStr sehingga formula injection tidak dieksekusi.
    */

    function buildKirLocationXlsx(payload) {
        const lokasi = payload?.lokasi;
        const items = payload?.data;
        if (!lokasi?.id || !Array.isArray(items) || !items.length) {
            throw new Error('Tidak ada barang KIR untuk diekspor pada lokasi ini.');
        }

        // Menjamin satu XLSX hanya memuat record dari satu lokasi yang diminta.
        if (items.some(item => Number(item.id_lokasi) !== Number(lokasi.id))) {
            throw new Error('Data inventaris berisi lokasi yang tidak sesuai. Ekspor dibatalkan.');
        }

        const enc = new TextEncoder();
        const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
        const cellText = value => String(value ?? '').trim() || '—';
        const xml = value => String(value ?? '')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        const cell = (ref, value, style = 6) =>
            `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
        const numeric = (ref, value, style = 7) => {
            const number = Number(value);
            return value !== null && value !== undefined &&
                String(value).trim() !== '' && Number.isFinite(number)
                ? `<c r="${ref}" s="${style}"><v>${number}</v></c>`
                : cell(ref, cellText(value), style);
        };
        const condition = (ref, value) =>
            Number(value) > 0 ? numeric(ref, value) : cell(ref, '—', 7);
        const row = (r, cells, height = 22) =>
            `<row r="${r}" ht="${height}" customHeight="1">${cells.join('')}</row>`;
        const unique = (key, fallback = '—') => {
            const values = [...new Set(items.map(item =>
                String(item[key] ?? '').trim()
            ).filter(Boolean))];
            return values.length === 1 ? values[0] :
                values.length > 1 ? 'Beberapa (lihat kolom tabel)' : fallback;
        };
        const totalUnit = items.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
        const code = unique('kode_dep') !== '—' || unique('kode_div') !== '—'
            ? `${unique('kode_dep')} / ${unique('kode_div')}` : '—';

        // Kolom A:K sama seperti contoh Excel KIR.
        // L: status kepemilikan; M:P identitas unit/ruangan.
        // Satu lokasi berisi seluruh barang tanpa terpengaruh pagination.
        const meta = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDAM TIRTA KENCANA KOTA SAMARINDA'],
            ['LOKASI', cellText(lokasi.nama)],
            ['ALAMAT', cellText(lokasi.alamat)],
            ['DEPARTEMEN', unique('departemen')],
            ['DIVISI', unique('divisi')],
            ['GEDUNG / RUANGAN', `${unique('gedung')} / ${unique('ruangan')}`],
            ['KODE DEPT / DIV', code],
            ['JUMLAH INVENTARIS', `${items.length} barang · ${totalUnit} unit`]
        ];

        const rows = [
            row(1, [cell('A1', 'KARTU INVENTARIS RUANGAN', 1)], 30),
            row(2, [cell('A2', `KIR PER LOKASI — ${cellText(lokasi.nama)}`, 2)], 25),
            ...meta.map(([label, value], index) => row(index + 4, [
                cell(`A${index + 4}`, label, 3),
                cell(`C${index + 4}`, `: ${value}`, 4)
            ])),
            row(15, [
                cell('A15', 'NO.', 5),
                cell('B15', 'NAMA BARANG', 5),
                cell('C15', 'KODE BARANG', 5),
                cell('D15', 'MERK / TYPE', 5),
                cell('E15', 'BAHAN', 5),
                cell('F15', 'JUMLAH', 5),
                cell('G15', 'SATUAN', 5),
                cell('H15', 'KONDISI', 5),
                cell('K15', 'KETERANGAN', 5),
                cell('L15', 'STATUS KEPEMILIKAN', 5),
                cell('M15', 'DEPARTEMEN', 5),
                cell('N15', 'DIVISI', 5),
                cell('O15', 'GEDUNG', 5),
                cell('P15', 'RUANGAN', 5)
            ], 34),
            row(16, [
                cell('H16', 'BAIK', 5),
                cell('I16', 'RUSAK RINGAN', 5),
                cell('J16', 'RUSAK BERAT', 5)
            ], 28),
            ...items.map((item, index) => {
                const r = index + 17;
                return row(r, [
                    numeric(`A${r}`, index + 1),
                    cell(`B${r}`, cellText(item.nama_barang)),
                    cell(`C${r}`, cellText(item.kode_barang)),
                    cell(`D${r}`, cellText(item.merk)),
                    cell(`E${r}`, cellText(item.nama_bahan)),
                    numeric(`F${r}`, item.jumlah ?? 0),
                    cell(`G${r}`, cellText(item.satuan)),
                    condition(`H${r}`, item.baik),
                    condition(`I${r}`, item.ringan),
                    condition(`J${r}`, item.berat),
                    cell(`K${r}`, cellText(item.ket)),
                    cell(`L${r}`, ownershipLabel(item.status_kepemilikan)),
                    cell(`M${r}`, cellText(item.departemen)),
                    cell(`N${r}`, cellText(item.divisi)),
                    cell(`O${r}`, cellText(item.gedung)),
                    cell(`P${r}`, cellText(item.ruangan))
                ], 26);
            })
        ];

        const widths = [8, 38, 22, 28, 20, 12, 14, 12, 17, 17, 42, 28, 28, 28, 24, 26];
        const merges = ['A1:P1', 'A2:P2', 'H15:J15',
            ...'ABCDEFGKLMNOP'.split('').map(col => `${col}15:${col}16`)];
        const lastRow = 16 + items.length;
        const sheet = declaration + `<worksheet xmlns="${ns}">` +
            `<dimension ref="A1:P${lastRow}"/>` +
            '<sheetViews><sheetView workbookViewId="0">' +
            '<pane xSplit="2" ySplit="16" topLeftCell="C17" activePane="bottomRight" state="frozen"/>' +
            '</sheetView></sheetViews>' +
            `<cols>${widths.map((width, i) =>
                `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`
            ).join('')}</cols>` +
            `<sheetData>${rows.join('')}</sheetData>` +
            `<mergeCells count="${merges.length}">${merges.map(ref =>
                `<mergeCell ref="${ref}"/>`
            ).join('')}</mergeCells>` +
            `<printOptions horizontalCentered="1"/>` +
            `<pageMargins left="0.25" right="0.25" top="0.45" bottom="0.45" header="0.2" footer="0.2"/>` +
            '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>' +
            '</worksheet>';

        const styles = declaration + `<styleSheet xmlns="${ns}">` +
            '<fonts count="3">' +
            '<font><sz val="11"/><name val="Calibri"/></font>' +
            '<font><b/><sz val="16"/><name val="Calibri"/><color rgb="FF173B66"/></font>' +
            '<font><b/><sz val="10"/><name val="Calibri"/><color rgb="FF163F6E"/></font>' +
            '</fonts>' +
            '<fills count="4">' +
            '<fill><patternFill patternType="none"/></fill>' +
            '<fill><patternFill patternType="gray125"/></fill>' +
            '<fill><patternFill patternType="solid"><fgColor rgb="FFD8E4F1"/></patternFill></fill>' +
            '<fill><patternFill patternType="solid"><fgColor rgb="FFF4F8FD"/></patternFill></fill>' +
            '</fills>' +
            '<borders count="2">' +
            '<border><left/><right/><top/><bottom/><diagonal/></border>' +
            '<border><left style="thin"><color rgb="FF56677A"/></left>' +
            '<right style="thin"><color rgb="FF56677A"/></right>' +
            '<top style="thin"><color rgb="FF56677A"/></top>' +
            '<bottom style="thin"><color rgb="FF56677A"/></bottom><diagonal/></border>' +
            '</borders>' +
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
            '<cellXfs count="8">' +
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
            '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
            '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
            '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
            '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
            '</cellXfs></styleSheet>';
        const workbook = declaration + `<workbook xmlns="${ns}" xmlns:r="${rel}">` +
            '<sheets><sheet name="KIR Lokasi" sheetId="1" r:id="rId1"/></sheets></workbook>';
        const workbookRels = declaration + `<Relationships xmlns="${pkg}">` +
            `<Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/>` +
            `<Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`;
        const rootRels = declaration + `<Relationships xmlns="${pkg}">` +
            `<Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/>` +
            '</Relationships>';
        const contentTypes = declaration +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
            '</Types>';

        // Writer ZIP tanpa kompresi, sah untuk format .xlsx OpenXML.
        const crcTable = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c >>> 1) ^ ((c & 1) ? 0xEDB88320 : 0);
            }
            crcTable[i] = c >>> 0;
        }
        const crc32 = bytes => {
            let crc = 0xFFFFFFFF;
            for (const b of bytes) {
                crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
            }
            return (crc ^ 0xFFFFFFFF) >>> 0;
        };
        const zipStore = files => {
            const localParts = [];
            const centralParts = [];
            let offset = 0;
            let centralSize = 0;
            for (const [filename, content] of files) {
                const name = enc.encode(filename);
                const bytes = enc.encode(content);
                const crc = crc32(bytes);
                const local = new Uint8Array(30 + name.length + bytes.length);
                const l = new DataView(local.buffer);
                l.setUint32(0, 0x04034b50, true);
                l.setUint16(4, 20, true);
                l.setUint16(6, 0x0800, true);
                l.setUint32(14, crc, true);
                l.setUint32(18, bytes.length, true);
                l.setUint32(22, bytes.length, true);
                l.setUint16(26, name.length, true);
                local.set(name, 30);
                local.set(bytes, 30 + name.length);
                localParts.push(local);
                const central = new Uint8Array(46 + name.length);
                const c = new DataView(central.buffer);
                c.setUint32(0, 0x02014b50, true);
                c.setUint16(4, 20, true);
                c.setUint16(6, 20, true);
                c.setUint16(8, 0x0800, true);
                c.setUint32(16, crc, true);
                c.setUint32(20, bytes.length, true);
                c.setUint32(24, bytes.length, true);
                c.setUint16(28, name.length, true);
                c.setUint32(42, offset, true);
                central.set(name, 46);
                centralParts.push(central);
                centralSize += central.length;
                offset += local.length;
            }
            const tail = new Uint8Array(22);
            const t = new DataView(tail.buffer);
            t.setUint32(0, 0x06054b50, true);
            t.setUint16(8, files.length, true);
            t.setUint16(10, files.length, true);
            t.setUint32(12, centralSize, true);
            t.setUint32(16, offset, true);
            const parts = [...localParts, ...centralParts, tail];
            const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
            let at = 0;
            for (const part of parts) {
                result.set(part, at);
                at += part.length;
            }
            return result;
        };
        return zipStore([
            ['[Content_Types].xml', contentTypes],
            ['_rels/.rels', rootRels],
            ['xl/workbook.xml', workbook],
            ['xl/_rels/workbook.xml.rels', workbookRels],
            ['xl/styles.xml', styles],
            ['xl/worksheets/sheet1.xml', sheet]
        ]);
    }

    async function exportLocation(id, locationName = '', trigger = null) {
        const locationId = Number(id);
        if (!Number.isSafeInteger(locationId) || locationId < 1 || state.exporting) {
            return;
        }
        state.exporting = true;
        const disabledBefore = trigger?.disabled ?? false;
        if (trigger) trigger.disabled = true;
        const button = $('kirExportLokasi');
        if (button) button.disabled = true;
        const summary = $('kirExportSummary');
        const summaryOld = summary?.textContent;
        if (summary && state.locationId === locationId) {
            summary.textContent = 'Menyiapkan Excel lokasi...';
        }
        try {
            const result = await api(`${base}/lokasi/${locationId}/export-data`);
            const count = (result.data || []).length;
            if (count === 0) {
                throw new Error('Lokasi ini belum mempunyai barang inventaris KIR.');
            }
            const xlsx = buildKirLocationXlsx(result);
            const blob = new Blob([xlsx], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            const fileName = String(result.lokasi?.nama || locationName || locationId)
                .normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '_')
                .replace(/^_+|_+$/g, '').slice(0, 65) || String(locationId);
            anchor.href = url;
            anchor.download = `KIR_Lokasi_${fileName}_${locationId}.xlsx`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
            if (summary && state.locationId === locationId) {
                summary.textContent = `${count} barang berhasil disiapkan untuk Excel`;
            }
        } catch (exception) {
            console.error('EXPORT KIR LOKASI:', exception);
            alert('Export Excel KIR gagal: ' + exception.message);
            if (summary && state.locationId === locationId) {
                summary.textContent = summaryOld || 'Export gagal';
            }
        } finally {
            state.exporting = false;
            if (trigger) trigger.disabled = disabledBefore;
            if (button) button.disabled = state.locationCount === 0 || !state.locationId;
        }
    }

    $('kirExportLokasi')?.addEventListener('click', event => {
        if (state.locationId) {
            exportLocation(state.locationId, state.locationName, event.currentTarget);
        }
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

            const exportButton = event.target.closest(
                '[data-kir-export-location]'
            );

            if (exportButton) {
                return exportLocation(
                    Number(exportButton.dataset.kirExportLocation),
                    exportButton.dataset.name,
                    exportButton
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
