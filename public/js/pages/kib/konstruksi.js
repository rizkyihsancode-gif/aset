
/*
|--------------------------------------------------------------------------
| K.I.B F — KONSTRUKSI
| Perumda Tirta Kencana Kota Samarinda
|--------------------------------------------------------------------------
| Mengikuti pola CRUD K.I.B A Tanah
| Backend tetap menggunakan KIBController asli.
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('kfApp');

    if (!root || window.__kfConstructed) {
        return;
    }

    window.__kfConstructed = true;

    /*
    |--------------------------------------------------------------------------
    | KONFIGURASI
    |--------------------------------------------------------------------------
    */

    const $ = id => document.getElementById(id);

    const base = root.dataset.base;
    const endpointPending = root.dataset.pending;
    const token = root.dataset.token;

    const state = {
        page: 1,
        lokasi: null,
        departemen: null,
        divisi: null,
        lokasiData: [],
        pending: [],
        selected: null,
        id: null,
        editId: null,
        saving: false
    };

    const allRows = Array.from(
        document.querySelectorAll('[data-kf-row]')
    );

    /*
    |--------------------------------------------------------------------------
    | UTILITAS
    |--------------------------------------------------------------------------
    */

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

    const string = value =>
        String(value ?? '').trim();

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

        if (dialog.open) {
            dialog.close();
        }
    }

    document.querySelectorAll(
        '[data-kf-close]'
    ).forEach(button => {
        button.addEventListener('click', () => {
            closeDialog(button.dataset.kfClose);
        });
    });

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

                'X-CSRF-TOKEN': token,

                ...(options.headers || {})
            }
        });

        const result = await response
            .json()
            .catch(() => ({}));

        if (!response.ok || result.success === false) {
            const validation = result.errors
                ? Object.values(result.errors)
                    .flat()
                    .join('\n')
                : '';

            const defaults = {
                401: 'Sesi login berakhir. Silakan login kembali.',

                403: 'Akses ditolak. Pastikan sudah login dan memiliki izin.',

                419: 'Sesi keamanan berakhir. Muat ulang halaman.'
            };

            throw new Error(
                validation ||
                defaults[response.status] ||
                result.message ||
                `Gagal memproses permintaan (HTTP ${response.status}).`
            );
        }

        return result;
    }

    function showError(message) {
        const error = $('kfError');

        error.textContent = message || '';
        error.hidden = !message;
    }

    /*
    |--------------------------------------------------------------------------
    | PENCARIAN DAN PAGINATION
    |--------------------------------------------------------------------------
    */

    function renderPages() {
        const keyword = string(
            $('kfCari').value
        ).toLocaleLowerCase('id-ID');

        const limit = Math.max(
            1,
            Number($('kfLimit').value) || 20
        );

        const found = allRows.filter(row => {
            return (row.dataset.search || '')
                .toLocaleLowerCase('id-ID')
                .includes(keyword);
        });

        const totalPages = Math.max(
            1,
            Math.ceil(found.length / limit)
        );

        state.page = Math.max(
            1,
            Math.min(state.page, totalPages)
        );

        const start = (state.page - 1) * limit;

        allRows.forEach(row => {
            row.hidden = true;
        });

        found
            .slice(start, start + limit)
            .forEach((row, index) => {
                row.hidden = false;

                const numberCell =
                    row.querySelector('td:first-child');

                if (numberCell) {
                    numberCell.textContent =
                        String(start + index + 1);
                }
            });

        $('kfInfo').textContent = found.length
            ? `Menampilkan ${start + 1}–${Math.min(start + limit, found.length)} dari ${found.length} lokasi`
            : 'Tidak ditemukan lokasi yang sesuai.';

        const container = $('kfPages');

        container.replaceChildren();

        if (totalPages <= 1) {
            return;
        }

        function paginationButton(
            label,
            target,
            disabled = false,
            active = false
        ) {
            const button = document.createElement('button');

            button.type = 'button';

            button.className = `kf-page-btn ${active ? 'active' : ''}`;

            button.textContent = label;
            button.disabled = disabled;

            button.addEventListener('click', () => {
                state.page = target;
                renderPages();
            });

            container.append(button);
        }

        paginationButton(
            '‹',
            state.page - 1,
            state.page === 1
        );

        for (
            let i = Math.max(1, state.page - 2);
            i <= Math.min(totalPages, state.page + 2);
            i++
        ) {
            paginationButton(
                String(i),
                i,
                false,
                i === state.page
            );
        }

        paginationButton(
            '›',
            state.page + 1,
            state.page === totalPages
        );
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

    const unique = (data, key) => {
        return Array.from(
            new Map(
                data.map(row => [
                    Number(row[key] || 0),
                    row
                ])
            ).values()
        );
    };

    const depName = row =>
        string(
            row.departemen || row.kode_dep
        ) || 'Tanpa Departemen';

    const divName = row =>
        string(row.divisi) || 'Tanpa Divisi';

    /*
    |--------------------------------------------------------------------------
    | RENDER DEPARTEMEN
    |--------------------------------------------------------------------------
    */

    function renderDepartemen() {
        const data = unique(
            state.lokasiData,
            'id_dep'
        );

        $('kfDepartemenTree').innerHTML =
            '<h4>Departemen</h4>' +
            (
                data.length
                    ? data.map(row => `
                        <button
                            class="kf-tree-btn ${
                                Number(row.id_dep || 0) === state.departemen
                                    ? 'active'
                                    : ''
                            }"
                            type="button"
                            data-dep="${Number(row.id_dep || 0)}"
                        >
                            <i data-lucide="folder"></i>
                            ${esc(depName(row))}
                        </button>
                    `).join('')
                    : `
                        <p class="kf-muted">
                            Tidak ada departemen.
                        </p>
                    `
            );

        renderDivisi();
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER DIVISI
    |--------------------------------------------------------------------------
    */

    function renderDivisi() {
        const selected = state.lokasiData.filter(row => {
            return Number(row.id_dep || 0) ===
                state.departemen;
        });

        const data = unique(
            selected,
            'id_div'
        );

        $('kfDivisiTree').innerHTML =
            '<h4>Divisi</h4>' +
            (
                data.length
                    ? data.map(row => `
                        <button
                            class="kf-tree-btn child ${
                                Number(row.id_div || 0) === state.divisi
                                    ? 'active'
                                    : ''
                            }"
                            type="button"
                            data-div="${Number(row.id_div || 0)}"
                        >
                            <i data-lucide="folder-open"></i>
                            ${esc(divName(row))}
                        </button>
                    `).join('')
                    : `
                        <p class="kf-muted">
                            Tidak ada divisi.
                        </p>
                    `
            );

        renderInventaris();
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT BANGUNAN
    |--------------------------------------------------------------------------
    */

    function labelBangunan(value) {
        const labels = {
            P: 'Permanen',
            SP: 'Semi Permanen',
            D: 'Darurat'
        };

        return labels[string(value).toUpperCase()] ||
            string(value) ||
            '—';
    }

    /*
    |--------------------------------------------------------------------------
    | TABEL INVENTARIS SESUAI KIB F EXCEL
    |--------------------------------------------------------------------------
    */

    function renderInventaris() {
        const data = state.lokasiData.filter(row => {
            return (
                Number(row.id_dep || 0) === state.departemen &&
                Number(row.id_div || 0) === state.divisi
            );
        });

        const first = data[0];

        $('kfJudulUnit').textContent = first
            ? `${depName(first)} / ${divName(first)}`
            : 'Daftar Konstruksi';

        $('kfTabelInventaris').innerHTML = data.length
            ? data.map((r, i) => `
                <tr>
                    <td>${i + 1}</td>

                    <td class="kf-excel-name">
                        <strong>
                            ${esc(r.nama_barang || 'Tanpa nama')}
                        </strong>

                        <p>${esc(r.urai || '—')}</p>
                    </td>

                    <td>
                        <strong>${esc(r.tahun || '—')}</strong>
                    </td>

                    <td>${esc(labelBangunan(r.type))}</td>
                    <td>${esc(r.struktur || '—')}</td>
                    <td>${esc(r.materi || '—')}</td>
                    <td>${esc(r.luas || '—')}</td>

                    <td>
                        ${esc(r.letak || r.alamat_lokasi || '—')}
                    </td>

                    <td>${esc(r.status_tanah || '—')}</td>
                    <td>${esc(r.asal || '—')}</td>
                    <td>${esc(r.status_aset || '—')}</td>

                    <td>
                        <strong class="kf-price">
                            ${rupiah(r.nilai)}
                        </strong>
                    </td>

                    <td class="kf-excel-document">
                        <p>${esc(r.ket || '—')}</p>

                        <button
                            type="button"
                            class="kf-btn outline"
                            data-aset="${Number(r.id)}"
                        >
                            <i data-lucide="eye"></i>
                            Detail
                        </button>
                    </td>
                </tr>
            `).join('')
            : `
                <tr>
                    <td colspan="13" class="kf-empty">
                        Belum ada inventaris pada unit ini.
                    </td>
                </tr>
            `;

        icons();
    }

    /*
    |--------------------------------------------------------------------------
    | BUKA DETAIL LOKASI
    |--------------------------------------------------------------------------
    */

    async function openLokasi(id, nama) {
        state.lokasi = id;
        state.lokasiData = [];
        state.departemen = null;
        state.divisi = null;

        $('kfJudulLokasi').textContent =
            nama || 'Detail Lokasi';

        $('kfDepartemenTree').textContent =
            'Memuat data organisasi...';

        $('kfDivisiTree').innerHTML = '';
        $('kfTabelInventaris').innerHTML = '';

        openDialog('kfModalLokasi');

        try {
            const result = await api(
                `${base}/lokasi/${id}`
            );

            state.lokasiData = Array.isArray(result.data)
                ? result.data
                : [];

            const first = state.lokasiData[0];

            if (!first) {
                $('kfDepartemenTree').textContent =
                    'Lokasi ini belum memiliki inventaris.';

                return;
            }

            state.departemen = Number(first.id_dep || 0);
            state.divisi = Number(first.id_div || 0);

            renderDepartemen();

        } catch (error) {
            $('kfDepartemenTree').textContent =
                error.message;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EVENT TABEL LOKASI
    |--------------------------------------------------------------------------
    */

    $('kfTabelLokasi').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-kf-lokasi]'
            );

            if (button) {
                openLokasi(
                    Number(button.dataset.kfLokasi),
                    button.dataset.kfNama
                );
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | EVENT PILIH DEPARTEMEN
    |--------------------------------------------------------------------------
    */

    $('kfDepartemenTree').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-dep]'
            );

            if (!button) {
                return;
            }

            state.departemen = Number(
                button.dataset.dep
            );

            state.divisi = Number(
                state.lokasiData.find(row =>
                    Number(row.id_dep || 0) === state.departemen
                )?.id_div || 0
            );

            renderDepartemen();
        }
    );

    /*
    |--------------------------------------------------------------------------
    | EVENT PILIH DIVISI
    |--------------------------------------------------------------------------
    */

    $('kfDivisiTree').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-div]'
            );

            if (!button) {
                return;
            }

            state.divisi = Number(
                button.dataset.div
            );

            renderDivisi();
        }
    );

    /*
    |--------------------------------------------------------------------------
    | EVENT DETAIL INVENTARIS
    |--------------------------------------------------------------------------
    */

    $('kfTabelInventaris').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-aset]'
            );

            if (button) {
                openInventaris(
                    Number(button.dataset.aset)
                );
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | FORMAT FIELD DETAIL
    |--------------------------------------------------------------------------
    */

    function field(label, value) {
        return `
            <div class="kf-field">
                <small>${esc(label)}</small>

                <strong>
                    ${esc(string(value) || '—')}
                </strong>
            </div>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL SATU INVENTARIS
    |--------------------------------------------------------------------------
    */

    async function openInventaris(id) {
        state.id = null;

        $('kfEdit').disabled = true;
        $('kfHapus').disabled = true;

        $('kfIsiDetail').textContent =
            'Memuat data konstruksi...';

        openDialog('kfModalDetail');

        try {
            const { data: r } = await api(
                `${base}/${id}`
            );

            if (!r) {
                throw new Error(
                    'Data konstruksi tidak ditemukan.'
                );
            }

            state.id = Number(r.id);

            $('kfJudulDetail').textContent =
                r.nama_barang || 'Detail Konstruksi';

            const namaLokasi =
                r.nama_lokasi ||
                r.lokasi ||
                'Belum Dipetakan';

            const alamat =
                r.alamat_lokasi ||
                r.alamat ||
                '—';

            const fotoHtml = r.foto_url
                ? `
                    <img
                        class="kf-photo"
                        src="${esc(r.foto_url)}"
                        alt="Foto Konstruksi"
                        loading="lazy"
                    >
                `
                : `
                    <p class="kf-muted">
                        Foto belum tersedia.
                    </p>
                `;

            const dokumenHtml = r.dokumen_url
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
                : `
                    <p class="kf-muted">
                        PDF belum tersedia.
                    </p>
                `;

            $('kfIsiDetail').innerHTML = `
                <div class="kf-summary">
                    <strong>
                        ${esc(r.nama_barang || 'Konstruksi')}
                    </strong>

                    <p>
                        ${esc(namaLokasi)}
                        · ${esc(r.departemen || '—')}
                        · ${esc(r.divisi || '—')}
                    </p>
                </div>

                ${fotoHtml}

                <h3 class="kf-detail-section-heading">
                    Identitas K.I.B F
                </h3>

                <div class="kf-detail-grid">
                    ${field('Nama Barang / Jenis Barang', r.nama_barang)}

                    ${field('Kode Barang', r.kode_barang)}

                    ${field('Tahun', r.tahun)}

                    ${field(
                        'Bangunan (P, SP, D)',
                        labelBangunan(r.type)
                    )}

                    ${field(
                        'Konstruksi: Bertingkat / Tidak',
                        r.struktur
                    )}

                    ${field(
                        'Konstruksi: Beton / Tidak',
                        r.materi
                    )}

                    ${field('Luas (m²)', r.luas)}

                    ${field(
                        'Letak / Lokasi Alamat',
                        r.letak || alamat
                    )}

                    ${field('Status Tanah', r.status_tanah)}

                    ${field(
                        'Asal Usul Pembiayaan',
                        r.asal
                    )}

                    ${field('Status Aset', r.status_aset)}

                    ${field(
                        'Nilai (Rp)',
                        rupiah(r.nilai)
                    )}
                </div>

                <div class="kf-detail-text">
                    <h3>Uraian Pekerjaan</h3>

                    <p>
                        ${esc(r.urai || '—')}
                    </p>

                    <h3>Dokumen Pendukung</h3>

                    <p>
                        ${esc(r.ket || '—')}
                    </p>

                    ${dokumenHtml}
                </div>
            `;

            $('kfEdit').disabled = false;
            $('kfHapus').disabled = false;

            icons();

        } catch (error) {
            state.id = null;

            $('kfIsiDetail').textContent =
                error.message;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FILTER DATA PENDING
    |--------------------------------------------------------------------------
    */

    function pendingFiltered() {
        const keyword = string(
            $('kfPendingCari').value
        ).toLocaleLowerCase('id-ID');

        return state.pending.filter(row => {
            return [
                row.no_voucher,
                row.lokasi,
                row.alamat,
                row.departemen,
                row.divisi,
                row.tahun,
                row.nilai,
                row.urai
            ].join(' ')
                .toLocaleLowerCase('id-ID')
                .includes(keyword);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | TABEL DATA PENDING
    |--------------------------------------------------------------------------
    */

    function renderPending() {
        const list = pendingFiltered();

        $('kfPendingTotal').textContent =
            `${list.length} data`;

        $('kfPendingBody').innerHTML = list.length
            ? list.map((r, i) => `
                <tr>
                    <td>${i + 1}</td>

                    <td>
                        <strong>
                            ${esc(r.no_voucher || r.id)}
                        </strong>

                        <small>
                            ${esc(r.tgl_voucher || '—')}
                        </small>
                    </td>

                    <td>
                        <strong>
                            ${esc(r.lokasi || '—')}
                        </strong>

                        <small>
                            ${esc(r.alamat || '—')}
                        </small>
                    </td>

                    <td>
                        ${esc(r.departemen || '—')}
                    </td>

                    <td>
                        ${esc(r.divisi || '—')}
                    </td>

                    <td>
                        ${esc(r.tahun || '—')}
                    </td>

                    <td>
                        <strong class="kf-price">
                            ${rupiah(r.nilai)}
                        </strong>
                    </td>

                    <td class="kf-pending-uraian">
                        ${esc(r.urai || '—')}
                    </td>

                    <td>
                        <button
                            type="button"
                            class="kf-btn primary"
                            data-pending-id="${Number(r.id)}"
                            ${
                                Number(r.jenisn) !== 1
                                    ? 'disabled title="Bukan Penambahan Aset"'
                                    : ''
                            }
                        >
                            Pilih
                        </button>
                    </td>
                </tr>
            `).join('')
            : `
                <tr>
                    <td colspan="9" class="kf-empty">
                        Tidak ada transaksi Konstruksi
                        yang menunggu diproses.
                    </td>
                </tr>
            `;
    }

    /*
    |--------------------------------------------------------------------------
    | MEMUAT DATA PENDING DARI DATABASE
    |--------------------------------------------------------------------------
    */

    async function loadPending() {
        $('kfPendingBody').innerHTML = `
            <tr>
                <td colspan="9" class="kf-empty">
                    Memuat transaksi Nilai Aset...
                </td>
            </tr>
        `;

        $('kfPendingTotal').textContent =
            'Memuat...';

        try {
            const response = await api(
                endpointPending
            );

            state.pending = (
                Array.isArray(response.data)
                    ? response.data
                    : []
            ).filter(row => {
                return Number(row.jenisn) === 1;
            });

            renderPending();

        } catch (error) {
            state.pending = [];

            $('kfPendingBody').innerHTML = `
                <tr>
                    <td colspan="9" class="kf-empty">
                        ${esc(error.message)}
                    </td>
                </tr>
            `;

            $('kfPendingTotal').textContent =
                'Gagal memuat';
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SELECT UNTUK KOMPATIBILITAS DATA LAMA
    |--------------------------------------------------------------------------
    */

    function setSelect(element, value) {
        const selected = string(value);

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

    /*
    |--------------------------------------------------------------------------
    | PENGISIAN OTOMATIS ORGANISASI
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | STATUS VOUCHER TERPILIH
    |--------------------------------------------------------------------------
    */

    function selectedSource(visible, allowChange) {
        $('kfSourceSelected').hidden = !visible;
        $('kfSourceSection').hidden = visible;
        $('kfPilihUlang').hidden = !allowChange;
    }

    /*
    |--------------------------------------------------------------------------
    | RESET FORM TAMBAH
    |--------------------------------------------------------------------------
    */

    function resetCreate() {
        state.selected = null;
        state.editId = null;

        $('kfForm').reset();

        showError('');

        [
            'kfSourceId',
            'kfLokasi',
            'kfAlamat',
            'kfDepartemen',
            'kfDivisi',
            'kfNilai'
        ].forEach(id => {
            $(id).value = '';
        });

        $('kfPendingCari').value = '';

        $('kfJudulForm').textContent =
            'Tambah Data Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Data Konstruksi';

        $('kfVoucher').textContent = '—';
        $('kfVoucherUrai').textContent = '';

        selectedSource(false, true);
    }

    /*
    |--------------------------------------------------------------------------
    | BUKA FORM TAMBAH
    |--------------------------------------------------------------------------
    */

    function openCreate() {
        resetCreate();

        openDialog('kfModalForm');

        loadPending();
    }

    $('kfTambah').addEventListener(
        'click',
        openCreate
    );

    $('kfLihatMasuk').addEventListener(
        'click',
        openCreate
    );

    $('kfPendingCari').addEventListener(
        'input',
        renderPending
    );

    /*
    |--------------------------------------------------------------------------
    | GANTI VOUCHER
    |--------------------------------------------------------------------------
    */

    $('kfPilihUlang').addEventListener(
        'click',
        () => {
            state.selected = null;

            $('kfSourceId').value = '';

            selectedSource(false, true);

            loadPending();
        }
    );

    /*
    |--------------------------------------------------------------------------
    | PILIH DATA NILAI ASET
    |--------------------------------------------------------------------------
    */

    $('kfPendingBody').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-pending-id]'
            );

            if (!button) {
                return;
            }

            const row = state.pending.find(item => {
                return Number(item.id) ===
                    Number(button.dataset.pendingId);
            });

            if (!row || Number(row.jenisn) !== 1) {
                return;
            }

            if (
                !row.id_lokasi ||
                !row.dep ||
                !row.div
            ) {
                showError(
                    'Voucher belum memiliki Lokasi, ' +
                    'Departemen dan Divisi yang lengkap. ' +
                    'Perbaiki pada Nilai Aset dahulu.'
                );

                return;
            }

            showError('');

            state.selected = row;

            $('kfSourceId').value =
                String(row.id);

            $('kfVoucher').textContent =
                `Voucher ${row.no_voucher || row.id}`;

            $('kfVoucherUrai').textContent =
                `${row.lokasi || '—'} · ` +
                `${row.departemen || '—'} / ` +
                `${row.divisi || '—'} · ` +
                rupiah(row.nilai);

            organisasi(row);

            $('kfTahun').value =
                /^\d{4}$/.test(string(row.tahun))
                    ? row.tahun
                    : '';

            $('kfLetak').value =
                string(row.alamat) === '-'
                    ? ''
                    : string(row.alamat);

            $('kfUrai').value =
                string(row.urai) === '-'
                    ? ''
                    : string(row.urai);

            $('kfNilai').value =
                rupiah(row.nilai);

            selectedSource(true, true);

            $('kfBarang').focus();
        }
    );

    /*
    |--------------------------------------------------------------------------
    | FIELD EDIT
    |--------------------------------------------------------------------------
    */

    const editableFields = [
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

    function fillEdit(row) {
        $('kfForm').reset();

        editableFields.forEach(name => {
            const input = $('kfForm')
                .elements
                .namedItem(name);

            if (!input) {
                return;
            }

            if (input.tagName === 'SELECT') {
                setSelect(
                    input,
                    row[name]
                );
            } else {
                input.value = row[name] ?? '';
            }
        });

        organisasi(row);

        $('kfSourceId').value = '';

        $('kfNilai').value =
            rupiah(row.nilai);

        $('kfVoucher').textContent =
            'Edit data inventaris yang sudah tercatat';

        $('kfVoucherUrai').textContent =
            'Nilai dan organisasi tetap mengikuti transaksi asal.';

        $('kfJudulForm').textContent =
            'Edit Data Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Perubahan';

        selectedSource(true, false);

        showError('');
    }

    /*
    |--------------------------------------------------------------------------
    | EDIT KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    $('kfEdit').addEventListener(
        'click',
        async () => {
            if (!state.id) {
                return;
            }

            const button = $('kfEdit');

            button.disabled = true;

            try {
                const { data } = await api(
                    `${base}/${state.id}`
                );

                state.editId = state.id;
                state.selected = null;

                fillEdit(data);

                closeDialog('kfModalDetail');

                openDialog('kfModalForm');

            } catch (error) {
                alert(error.message);

            } finally {
                button.disabled = false;
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | HAPUS KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    $('kfHapus').addEventListener(
        'click',
        async () => {
            if (!state.id || state.saving) {
                return;
            }

            const confirmed = confirm(
                'Hapus inventaris Konstruksi ini ' +
                'secara permanen?\n\n' +
                'Status voucher Nilai Aset asal tidak diubah.'
            );

            if (!confirmed) {
                return;
            }

            state.saving = true;
            $('kfHapus').disabled = true;

            try {
                const result = await api(
                    `${base}/${state.id}`,
                    {
                        method: 'DELETE'
                    }
                );

                alert(
                    result.message ||
                    'Data konstruksi berhasil dihapus.'
                );

                window.location.reload();

            } catch (error) {
                alert(error.message);

                $('kfHapus').disabled = false;
                state.saving = false;
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | SIMPAN TAMBAH / EDIT
    |--------------------------------------------------------------------------
    */

    $('kfForm').addEventListener(
        'submit',
        async event => {
            event.preventDefault();

            if (state.saving) {
                return;
            }

            showError('');

            if (
                !state.editId &&
                !state.selected
            ) {
                showError(
                    'Pilih satu transaksi Nilai Aset ' +
                    'pada tabel terlebih dahulu.'
                );

                return;
            }

            if (!event.currentTarget.reportValidity()) {
                return;
            }

            const button = $('kfSimpan');
            const original = button.textContent;

            button.disabled = true;
            button.textContent = 'Menyimpan...';

            state.saving = true;

            try {
                const form = new FormData(
                    event.currentTarget
                );

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

                const result = await api(
                    url,
                    {
                        method: 'POST',
                        body: form
                    }
                );

                alert(
                    result.message ||
                    'Data Konstruksi berhasil disimpan.'
                );

                window.location.reload();

            } catch (error) {
                showError(error.message);

                $('kfError').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                state.saving = false;

                button.disabled = false;
                button.textContent = original;
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | INISIALISASI
    |--------------------------------------------------------------------------
    */

    renderPages();
    icons();

})();
