
/*
|--------------------------------------------------------------------------
| K.I.B F — KONSTRUKSI
| Perumda Tirta Kencana Kota Samarinda
|--------------------------------------------------------------------------
| CRUD, Data Pending, Detail, Edit, Hapus, Nilai dan Jam WITA
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('kfApp');

    if (!root || window.__kfConstructed) {
        return;
    }

    window.__kfConstructed = true;

    const $ = id => document.getElementById(id);

    const base = root.dataset.base;
    const pendingUrl = root.dataset.pending;
    const token = root.dataset.token;

    const state = {
        page: 1,
        lokasiData: [],
        pending: [],
        lokasi: null,
        departemen: null,
        divisi: null,
        id: null,
        editId: null,
        selected: null,
        pickerMode: 'view',
        saving: false
    };

    const rows = Array.from(
        document.querySelectorAll('[data-kf-row]')
    );

    /*
    |--------------------------------------------------------------------------
    | UTILITAS
    |--------------------------------------------------------------------------
    */

    const str = value => String(value ?? '').trim();

    const esc = value => String(value ?? '').replace(
        /[&<>"']/g,
        char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char])
    );

    const rupiah = value =>
        'Rp ' + new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0
        }).format(Number(value) || 0);

    const icons = () => {
        window.lucide?.createIcons?.();
    };

    function openDialog(id) {
        const dialog = $(id);

        if (!dialog.open) {
            dialog.showModal();
        }

        icons();
    }

    function closeDialog(id) {
        const dialog = $(id);

        if (dialog?.open) {
            dialog.close();
        }
    }

    document.querySelectorAll('[data-kf-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                closeDialog(button.dataset.kfClose);
            });
        });

    /*
    |--------------------------------------------------------------------------
    | TANGGAL DAN JAM WITA
    |--------------------------------------------------------------------------
    */

    function updateClock() {
        const now = new Date();

        $('kfTanggal').textContent =
            new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }).format(now);

        $('kfJam').textContent =
            new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(now).replaceAll('.', ':');
    }

    updateClock();

    setInterval(updateClock, 1000);

    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

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

        const result = await response.json()
            .catch(() => ({}));

        if (!response.ok || result.success === false) {
            const validation = result.errors
                ? Object.values(result.errors).flat().join('\n')
                : '';

            const messages = {
                401: 'Sesi login berakhir.',
                403: 'Akses ditolak. Pastikan akun sudah login.',
                419: 'Sesi keamanan berakhir. Muat ulang halaman.'
            };

            throw new Error(
                validation ||
                messages[response.status] ||
                result.message ||
                `HTTP ${response.status}`
            );
        }

        return result;
    }

    function showError(message) {
        const box = $('kfError');

        box.textContent = message || '';
        box.hidden = !message;
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH DAN PAGINATION
    |--------------------------------------------------------------------------
    */

    function renderPages() {
        const keyword = str(
            $('kfCari').value
        ).toLowerCase();

        const limit = Number($('kfLimit').value) || 20;

        const filtered = rows.filter(row =>
            (row.dataset.search || '')
                .toLowerCase()
                .includes(keyword)
        );

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / limit)
        );

        state.page = Math.min(
            state.page,
            totalPages
        );

        const start = (state.page - 1) * limit;

        rows.forEach(row => {
            row.hidden = true;
        });

        filtered.slice(start, start + limit)
            .forEach((row, index) => {
                row.hidden = false;

                const cell =
                    row.querySelector('td:first-child');

                if (cell) {
                    cell.textContent = start + index + 1;
                }
            });

        $('kfInfo').textContent = filtered.length
            ? `Menampilkan ${start + 1}–${Math.min(start + limit, filtered.length)} dari ${filtered.length} lokasi`
            : 'Tidak ada lokasi yang sesuai.';

        const container = $('kfPages');

        container.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        function addPage(label, target, disabled, active) {
            const button = document.createElement('button');

            button.type = 'button';
            button.className = active ? 'active' : '';
            button.textContent = label;
            button.disabled = disabled;

            button.addEventListener('click', () => {
                state.page = target;
                renderPages();
            });

            container.appendChild(button);
        }

        addPage('‹', state.page - 1, state.page === 1, false);

        for (
            let i = Math.max(1, state.page - 2);
            i <= Math.min(totalPages, state.page + 2);
            i++
        ) {
            addPage(String(i), i, false, i === state.page);
        }

        addPage('›', state.page + 1, state.page === totalPages, false);
    }

    $('kfCari').addEventListener('input', () => {
        state.page = 1;
        renderPages();
    });

    $('kfLimit').addEventListener('change', () => {
        state.page = 1;
        renderPages();
    });

    $('kfReset').addEventListener('click', () => {
        $('kfCari').value = '';
        $('kfLimit').value = '20';

        state.page = 1;
        renderPages();
    });

    /*
    |--------------------------------------------------------------------------
    | STRUKTUR ORGANISASI
    |--------------------------------------------------------------------------
    */

    function unique(data, key) {
        return Array.from(
            new Map(
                data.map(row => [
                    Number(row[key] || 0),
                    row
                ])
            ).values()
        );
    }

    const depName = row =>
        str(row.departemen || row.kode_dep) ||
        'Tanpa Departemen';

    const divName = row =>
        str(row.divisi) ||
        'Tanpa Divisi';

    function renderDepartemen() {
        const data = unique(
            state.lokasiData,
            'id_dep'
        );

        $('kfDepartemenTree').innerHTML =
            '<h4>Departemen</h4>' +
            data.map(row => `
                <button
                    type="button"
                    class="kf-tree-btn ${
                        Number(row.id_dep || 0) === state.departemen
                            ? 'active'
                            : ''
                    }"
                    data-dep="${Number(row.id_dep || 0)}"
                >
                    <i data-lucide="folder"></i>
                    ${esc(depName(row))}
                </button>
            `).join('');

        renderDivisi();
    }

    function renderDivisi() {
        const data = unique(
            state.lokasiData.filter(row =>
                Number(row.id_dep || 0) === state.departemen
            ),
            'id_div'
        );

        $('kfDivisiTree').innerHTML =
            '<h4>Divisi</h4>' +
            data.map(row => `
                <button
                    type="button"
                    class="kf-tree-btn ${
                        Number(row.id_div || 0) === state.divisi
                            ? 'active'
                            : ''
                    }"
                    data-div="${Number(row.id_div || 0)}"
                >
                    <i data-lucide="folder-open"></i>
                    ${esc(divName(row))}
                </button>
            `).join('');

        renderInventaris();
    }

    function bangunan(value) {
        const values = {
            P: 'Permanen',
            SP: 'Semi Permanen',
            D: 'Darurat'
        };

        return values[str(value).toUpperCase()] ||
            str(value) ||
            '—';
    }

    /*
    |--------------------------------------------------------------------------
    | TABEL INVENTARIS FORMAT EXCEL
    |--------------------------------------------------------------------------
    */

    function renderInventaris() {
        const data = state.lokasiData.filter(row =>
            Number(row.id_dep || 0) === state.departemen &&
            Number(row.id_div || 0) === state.divisi
        );

        const first = data[0];

        $('kfJudulUnit').textContent = first
            ? `${depName(first)} / ${divName(first)}`
            : 'Daftar Inventaris';

        $('kfTabelInventaris').innerHTML = data.length
            ? data.map((r, i) => `
                <tr>
                    <td>${i + 1}</td>

                    <td class="kf-excel-name">
                        <strong>${esc(r.nama_barang || 'Tanpa nama')}</strong>
                        <p>${esc(r.urai || '—')}</p>
                    </td>

                    <td>${esc(r.tahun || '—')}</td>
                    <td>${esc(bangunan(r.type))}</td>
                    <td>${esc(r.struktur || '—')}</td>
                    <td>${esc(r.materi || '—')}</td>
                    <td>${esc(r.luas || '—')}</td>
                    <td>${esc(r.letak || r.alamat_lokasi || '—')}</td>
                    <td>${esc(r.status_tanah || '—')}</td>
                    <td>${esc(r.asal || '—')}</td>
                    <td>${esc(r.status_aset || '—')}</td>

                    <td>
                        <button
                            type="button"
                            class="kf-value-button"
                            data-item-value="${Number(r.id)}"
                        >
                            <strong>${rupiah(r.nilai)}</strong>
                            <i data-lucide="external-link"></i>
                        </button>
                    </td>

                    <td>
                        <p>${esc(r.ket || '—')}</p>

                        <div class="kf-actions">

                            <button
                                type="button"
                                class="kf-icon-btn view"
                                data-aset="${Number(r.id)}"
                                title="Detail"
                            >
                                <i data-lucide="eye"></i>
                            </button>

                            <button
                                type="button"
                                class="kf-icon-btn edit"
                                data-edit-aset="${Number(r.id)}"
                                title="Edit"
                            >
                                <i data-lucide="pencil"></i>
                            </button>

                            <button
                                type="button"
                                class="kf-icon-btn delete"
                                data-delete-aset="${Number(r.id)}"
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
                    <td colspan="13" class="kf-empty">
                        Tidak ada inventaris pada unit ini.
                    </td>
                </tr>
            `;

        icons();
    }

    /*
    |--------------------------------------------------------------------------
    | PEMILIHAN INVENTARIS UNTUK EDIT / HAPUS
    |--------------------------------------------------------------------------
    */

    function renderQuickActions() {
        const panel = $('kfQuickActions');
        const mode = state.pickerMode;

        if (mode === 'view') {
            panel.hidden = true;
            panel.innerHTML = '';
            return;
        }

        const editing = mode === 'edit';

        panel.hidden = false;

        panel.innerHTML = `
            <div class="kf-quick-heading">
                <strong>
                    Pilih inventaris untuk
                    ${editing ? 'diedit' : 'dihapus'}
                </strong>

                <p>
                    Lokasi ini memiliki
                    ${state.lokasiData.length} inventaris.
                </p>
            </div>

            <div class="kf-quick-list">
                ${state.lokasiData.map(r => `
                    <div class="kf-quick-row">

                        <div>
                            <strong>
                                ${esc(r.nama_barang || 'Tanpa nama')}
                            </strong>

                            <small>
                                ${esc(depName(r))} /
                                ${esc(divName(r))}
                                · ${rupiah(r.nilai)}
                            </small>
                        </div>

                        <button
                            type="button"
                            class="kf-btn ${editing ? 'warning' : 'danger'}"
                            data-quick-${editing ? 'edit' : 'delete'}="${Number(r.id)}"
                        >
                            <i data-lucide="${editing ? 'pencil' : 'trash-2'}"></i>
                            ${editing ? 'Edit' : 'Hapus'}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        icons();
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL LOKASI
    |--------------------------------------------------------------------------
    */

    async function openLokasi(id, nama, mode = 'view') {
        state.lokasi = id;
        state.pickerMode = mode;

        state.lokasiData = [];
        state.departemen = null;
        state.divisi = null;

        $('kfJudulLokasi').textContent =
            nama || 'Detail Lokasi';

        $('kfDepartemenTree').textContent =
            'Memuat data...';

        $('kfDivisiTree').innerHTML = '';
        $('kfTabelInventaris').innerHTML = '';
        $('kfQuickActions').hidden = true;

        openDialog('kfModalLokasi');

        try {
            const response = await api(
                `${base}/lokasi/${id}`
            );

            state.lokasiData = Array.isArray(response.data)
                ? response.data
                : [];

            const first = state.lokasiData[0];

            if (!first) {
                $('kfDepartemenTree').textContent =
                    'Belum ada data pada lokasi ini.';
                return;
            }

            state.departemen = Number(first.id_dep || 0);
            state.divisi = Number(first.id_div || 0);

            renderDepartemen();
            renderQuickActions();

        } catch (error) {
            $('kfDepartemenTree').textContent =
                error.message;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EVENT TABEL UTAMA
    |--------------------------------------------------------------------------
    */

    $('kfTabelLokasi').addEventListener('click', event => {
        const nilai = event.target.closest('[data-kf-value]');

        if (nilai) {
            openNilaiLokasi(
                Number(nilai.dataset.kfValue),
                nilai.dataset.kfNama
            );

            return;
        }

        const action = event.target.closest('[data-kf-action]');

        if (action) {
            openLokasi(
                Number(action.dataset.kfLokasi),
                action.dataset.kfNama,
                action.dataset.kfAction
            );
        }
    });

    $('kfDepartemenTree').addEventListener('click', event => {
        const button = event.target.closest('[data-dep]');

        if (!button) {
            return;
        }

        state.departemen = Number(button.dataset.dep);

        const first = state.lokasiData.find(row =>
            Number(row.id_dep || 0) === state.departemen
        );

        state.divisi = Number(first?.id_div || 0);

        renderDepartemen();
    });

    $('kfDivisiTree').addEventListener('click', event => {
        const button = event.target.closest('[data-div]');

        if (!button) {
            return;
        }

        state.divisi = Number(button.dataset.div);
        renderDivisi();
    });

    $('kfTabelInventaris').addEventListener('click', event => {
        const detail = event.target.closest('[data-aset]');
        const edit = event.target.closest('[data-edit-aset]');
        const hapus = event.target.closest('[data-delete-aset]');
        const nilai = event.target.closest('[data-item-value]');

        if (detail) {
            openInventaris(Number(detail.dataset.aset));

        } else if (edit) {
            startEdit(Number(edit.dataset.editAset));

        } else if (hapus) {
            deleteInventory(Number(hapus.dataset.deleteAset));

        } else if (nilai) {
            const row = state.lokasiData.find(item =>
                Number(item.id) === Number(nilai.dataset.itemValue)
            );

            if (row) {
                renderNilai([row], row.nama_barang);
            }
        }
    });

    $('kfQuickActions').addEventListener('click', event => {
        const edit = event.target.closest('[data-quick-edit]');
        const hapus = event.target.closest('[data-quick-delete]');

        if (edit) {
            startEdit(Number(edit.dataset.quickEdit));

        } else if (hapus) {
            deleteInventory(Number(hapus.dataset.quickDelete));
        }
    });

    /*
    |--------------------------------------------------------------------------
    | RINCIAN NILAI
    |--------------------------------------------------------------------------
    */

    function renderNilai(data, nama) {
        $('kfNilaiJudul').textContent =
            `Rincian Nilai — ${nama || 'Konstruksi'}`;

        const total = data.reduce(
            (sum, r) => sum + Number(r.nilai || 0),
            0
        );

        $('kfNilaiTotal').textContent = rupiah(total);

        $('kfNilaiBody').innerHTML = data.length
            ? data.map((r, i) => `
                <tr>
                    <td>${i + 1}</td>

                    <td>
                        <strong>${esc(r.nama_barang || 'Tanpa nama')}</strong>
                        <small>${esc(r.urai || '')}</small>
                    </td>

                    <td>
                        ${esc(depName(r))} /
                        ${esc(divName(r))}
                    </td>

                    <td>${esc(r.tahun || '—')}</td>

                    <td>
                        <strong class="kf-price">
                            ${rupiah(r.nilai)}
                        </strong>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="kf-icon-btn view"
                            data-nilai-detail="${Number(r.id)}"
                        >
                            <i data-lucide="eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('')
            : `
                <tr>
                    <td colspan="6" class="kf-empty">
                        Belum ada nilai tercatat.
                    </td>
                </tr>
            `;

        openDialog('kfModalNilai');

        icons();
    }

    async function openNilaiLokasi(id, nama) {
        $('kfNilaiJudul').textContent =
            `Rincian Nilai — ${nama}`;

        $('kfNilaiTotal').textContent = 'Memuat...';

        $('kfNilaiBody').innerHTML = `
            <tr>
                <td colspan="6" class="kf-empty">
                    Memuat rincian nilai...
                </td>
            </tr>
        `;

        openDialog('kfModalNilai');

        try {
            const response = await api(
                `${base}/lokasi/${id}`
            );

            renderNilai(
                Array.isArray(response.data) ? response.data : [],
                nama
            );

        } catch (error) {
            $('kfNilaiTotal').textContent = '—';

            $('kfNilaiBody').textContent = error.message;
        }
    }

    $('kfNilaiBody').addEventListener('click', event => {
        const button = event.target.closest(
            '[data-nilai-detail]'
        );

        if (button) {
            openInventaris(
                Number(button.dataset.nilaiDetail)
            );
        }
    });

    /*
    |--------------------------------------------------------------------------
    | DETAIL INVENTARIS
    |--------------------------------------------------------------------------
    */

    function field(label, value) {
        return `
            <div class="kf-detail-field">
                <small>${esc(label)}</small>
                <strong>${esc(str(value) || '—')}</strong>
            </div>
        `;
    }

    async function openInventaris(id) {
        state.id = null;

        $('kfEdit').disabled = true;
        $('kfHapus').disabled = true;

        $('kfIsiDetail').textContent =
            'Memuat data konstruksi...';

        openDialog('kfModalDetail');

        try {
            const response = await api(
                `${base}/${id}`
            );

            const r = response.data;

            if (!r) {
                throw new Error('Data tidak ditemukan.');
            }

            state.id = Number(r.id);

            $('kfJudulDetail').textContent =
                r.nama_barang || 'Detail Konstruksi';

            $('kfIsiDetail').innerHTML = `
                <div class="kf-summary">
                    <strong>
                        ${esc(r.nama_barang || 'Konstruksi')}
                    </strong>

                    <p>
                        ${esc(r.nama_lokasi || 'Belum Dipetakan')}
                        · ${esc(r.departemen || '—')}
                        · ${esc(r.divisi || '—')}
                    </p>
                </div>

                ${
                    r.foto_url
                        ? `
                            <img
                                class="kf-photo"
                                src="${esc(r.foto_url)}"
                                alt="Foto Konstruksi"
                            >
                        `
                        : '<p class="kf-muted">Foto belum tersedia.</p>'
                }

                <h3 class="kf-detail-title">
                    Informasi K.I.B F
                </h3>

                <div class="kf-detail-grid">
                    ${field('Nama Barang / Jenis Barang', r.nama_barang)}
                    ${field('Kode Barang', r.kode_barang)}
                    ${field('Tahun', r.tahun)}
                    ${field('Bangunan (P, SP, D)', bangunan(r.type))}
                    ${field('Bertingkat / Tidak', r.struktur)}
                    ${field('Beton / Tidak', r.materi)}
                    ${field('Luas (m²)', r.luas)}
                    ${field('Letak / Lokasi Alamat', r.letak || r.alamat_lokasi)}
                    ${field('Status Tanah', r.status_tanah)}
                    ${field('Asal Usul Pembiayaan', r.asal)}
                    ${field('Status Aset', r.status_aset)}
                    ${field('Nilai (Rp)', rupiah(r.nilai))}
                </div>

                <div class="kf-detail-text">

                    <h3>Uraian Pekerjaan</h3>
                    <p>${esc(r.urai || '—')}</p>

                    <h3>Dokumen Pendukung</h3>
                    <p>${esc(r.ket || '—')}</p>

                    ${
                        r.dokumen_url
                            ? `
                                <a
                                    class="kf-btn outline"
                                    href="${esc(r.dokumen_url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i data-lucide="file-text"></i>
                                    Lihat Dokumen PDF
                                </a>
                            `
                            : '<p class="kf-muted">PDF belum tersedia.</p>'
                    }
                </div>
            `;

            $('kfEdit').disabled = false;
            $('kfHapus').disabled = false;

            icons();

        } catch (error) {
            state.id = null;
            $('kfIsiDetail').textContent = error.message;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DATA PENDING
    |--------------------------------------------------------------------------
    */

    function renderPending() {
        const keyword = str(
            $('kfPendingCari').value
        ).toLowerCase();

        const data = state.pending.filter(row =>
            [
                row.no_voucher,
                row.lokasi,
                row.alamat,
                row.departemen,
                row.divisi,
                row.urai
            ].join(' ').toLowerCase().includes(keyword)
        );

        $('kfPendingTotal').textContent =
            `${data.length} data`;

        $('kfPendingBody').innerHTML = data.length
            ? data.map((r, i) => `
                <tr>
                    <td>${i + 1}</td>

                    <td>
                        <strong>${esc(r.no_voucher || r.id)}</strong>
                        <small>${esc(r.tgl_voucher || '—')}</small>
                    </td>

                    <td>
                        <strong>${esc(r.lokasi || '—')}</strong>
                        <small>${esc(r.alamat || '—')}</small>
                    </td>

                    <td>${esc(r.departemen || '—')}</td>
                    <td>${esc(r.divisi || '—')}</td>
                    <td>${esc(r.tahun || '—')}</td>

                    <td>
                        <strong class="kf-price">
                            ${rupiah(r.nilai)}
                        </strong>
                    </td>

                    <td>${esc(r.urai || '—')}</td>

                    <td>
                        <button
                            type="button"
                            class="kf-btn primary"
                            data-pending-id="${Number(r.id)}"
                        >
                            Pilih
                        </button>
                    </td>
                </tr>
            `).join('')
            : `
                <tr>
                    <td colspan="9" class="kf-empty">
                        Tidak ada Data Pending Konstruksi.
                    </td>
                </tr>
            `;
    }

    async function loadPending() {
        $('kfPendingBody').innerHTML = `
            <tr>
                <td colspan="9" class="kf-empty">
                    Memuat Data Pending...
                </td>
            </tr>
        `;

        try {
            const response = await api(pendingUrl);

            state.pending = (
                Array.isArray(response.data)
                    ? response.data
                    : []
            ).filter(r => Number(r.jenisn) === 1);

            renderPending();

        } catch (error) {
            state.pending = [];
            $('kfPendingTotal').textContent = 'Gagal';

            $('kfPendingBody').textContent =
                error.message;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORM TAMBAH
    |--------------------------------------------------------------------------
    */

    function selectedSource(visible, change) {
        $('kfSourceSection').hidden = visible;
        $('kfSourceSelected').hidden = !visible;
        $('kfPilihUlang').hidden = !change;
    }

    function organisasi(row) {
        $('kfLokasi').value =
            row.nama_lokasi || row.lokasi || '';

        $('kfAlamat').value =
            row.alamat_lokasi || row.alamat || '';

        $('kfDepartemen').value =
            row.departemen || '';

        $('kfDivisi').value =
            row.divisi || '';
    }

    function resetCreate() {
        state.selected = null;
        state.editId = null;

        $('kfForm').reset();

        showError('');

        ['kfSourceId', 'kfLokasi', 'kfAlamat',
            'kfDepartemen', 'kfDivisi', 'kfNilai'
        ].forEach(id => {
            $(id).value = '';
        });

        $('kfPendingCari').value = '';

        $('kfJudulForm').textContent =
            'Tambah Data Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Data Konstruksi';

        selectedSource(false, true);
    }

    function openCreate() {
        resetCreate();
        openDialog('kfModalForm');
        loadPending();
    }

    $('kfTambah').addEventListener('click', openCreate);

    $('kfLihatMasuk').addEventListener(
        'click',
        openCreate
    );

    $('kfPendingCari').addEventListener(
        'input',
        renderPending
    );

    $('kfPilihUlang').addEventListener('click', () => {
        state.selected = null;
        $('kfSourceId').value = '';

        selectedSource(false, true);
        loadPending();
    });

    $('kfPendingBody').addEventListener('click', event => {
        const button = event.target.closest(
            '[data-pending-id]'
        );

        if (!button) {
            return;
        }

        const row = state.pending.find(r =>
            Number(r.id) === Number(button.dataset.pendingId)
        );

        if (!row) {
            return;
        }

        if (!row.id_lokasi || !row.dep || !row.div) {
            showError(
                'Lokasi, Departemen, dan Divisi pada ' +
                'voucher belum lengkap.'
            );
            return;
        }

        state.selected = row;

        $('kfSourceId').value = row.id;

        $('kfVoucher').textContent =
            `Voucher ${row.no_voucher || row.id}`;

        $('kfVoucherUrai').textContent =
            `${row.lokasi || '—'} · ${rupiah(row.nilai)}`;

        organisasi(row);

        $('kfTahun').value =
            /^\d{4}$/.test(str(row.tahun))
                ? row.tahun
                : '';

        $('kfLetak').value =
            row.alamat === '-' ? '' : (row.alamat || '');

        $('kfUrai').value =
            row.urai === '-' ? '' : (row.urai || '');

        $('kfNilai').value = rupiah(row.nilai);

        showError('');
        selectedSource(true, true);

        $('kfBarang').focus();
    });

    /*
    |--------------------------------------------------------------------------
    | EDIT
    |--------------------------------------------------------------------------
    */

    const fields = [
        'id_barang',
        'tahun',
        'type',
        'struktur',
        'materi',
        'luas',
        'letak',
        'status_tanah',
        'asal',
        'status_aset',
        'urai',
        'ket'
    ];

    function setSelect(element, value) {
        const selected = str(value);

        if (
            selected &&
            !Array.from(element.options).some(
                option => option.value === selected
            )
        ) {
            element.add(
                new Option(
                    `${selected} (data lama)`,
                    selected
                )
            );
        }

        element.value = selected;
    }

    function fillEdit(row) {
        $('kfForm').reset();

        fields.forEach(name => {
            const input = $('kfForm')
                .elements
                .namedItem(name);

            if (!input) {
                return;
            }

            if (input.tagName === 'SELECT') {
                setSelect(input, row[name]);
            } else {
                input.value = row[name] ?? '';
            }
        });

        organisasi(row);

        $('kfSourceId').value = '';
        $('kfNilai').value = rupiah(row.nilai);

        $('kfVoucher').textContent =
            'Edit Inventaris Konstruksi';

        $('kfVoucherUrai').textContent =
            'Nilai dan struktur organisasi dipertahankan.';

        $('kfJudulForm').textContent =
            'Edit Data Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Perubahan';

        selectedSource(true, false);
        showError('');
    }

    async function startEdit(id) {
        if (!id || state.saving) {
            return;
        }

        try {
            const response = await api(
                `${base}/${id}`
            );

            if (!response.data) {
                throw new Error('Data tidak ditemukan.');
            }

            state.id = id;
            state.editId = id;
            state.selected = null;

            fillEdit(response.data);

            closeDialog('kfModalDetail');
            closeDialog('kfModalLokasi');
            closeDialog('kfModalNilai');

            openDialog('kfModalForm');

        } catch (error) {
            alert(error.message);
        }
    }

    $('kfEdit').addEventListener('click', () => {
        if (state.id) {
            startEdit(state.id);
        }
    });

    /*
    |--------------------------------------------------------------------------
    | HAPUS
    |--------------------------------------------------------------------------
    */

    async function deleteInventory(id) {
        if (!id || state.saving) {
            return;
        }

        if (!confirm(
            'Hapus satu inventaris Konstruksi ini?\n\n' +
            'Data akan dihapus permanen. ' +
            'Status voucher Nilai Aset tidak berubah.'
        )) {
            return;
        }

        state.saving = true;

        try {
            const result = await api(
                `${base}/${id}`,
                { method: 'DELETE' }
            );

            alert(result.message || 'Data berhasil dihapus.');

            window.location.reload();

        } catch (error) {
            state.saving = false;
            alert(error.message);
        }
    }

    $('kfHapus').addEventListener('click', () => {
        if (state.id) {
            deleteInventory(state.id);
        }
    });

    /*
    |--------------------------------------------------------------------------
    | SIMPAN TAMBAH / EDIT
    |--------------------------------------------------------------------------
    */

    $('kfForm').addEventListener('submit', async event => {
        event.preventDefault();

        if (state.saving) {
            return;
        }

        if (!state.editId && !state.selected) {
            showError(
                'Pilih Data Nilai Aset terlebih dahulu.'
            );
            return;
        }

        const button = $('kfSimpan');
        const text = button.textContent;

        button.disabled = true;
        button.textContent = 'Menyimpan...';

        state.saving = true;
        showError('');

        try {
            const form = new FormData(event.currentTarget);

            let url = root.dataset.save;

            if (state.editId) {
                url = `${base}/${state.editId}`;
                form.set('_method', 'PUT');
                form.delete('id_nilai_aktiva');

            } else {
                form.set(
                    'id_nilai_aktiva',
                    String(state.selected.id)
                );
            }

            const result = await api(url, {
                method: 'POST',
                body: form
            });

            alert(
                result.message ||
                'Data Konstruksi berhasil disimpan.'
            );

            window.location.reload();

        } catch (error) {
            state.saving = false;

            button.disabled = false;
            button.textContent = text;

            showError(error.message);

            $('kfError').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    });

    /*
    |--------------------------------------------------------------------------
    | INISIALISASI
    |--------------------------------------------------------------------------
    */

    renderPages();
    icons();

})();
