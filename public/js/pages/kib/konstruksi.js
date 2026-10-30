
/*
|--------------------------------------------------------------------------
| K.I.B F — KONSTRUKSI
| Perumda Tirta Kencana Kota Samarinda
|--------------------------------------------------------------------------
|
| File:
| public/js/pages/kib/konstruksi.js
|
| Database:
| - kib_f_s
| - nilai_aktivas
| - barangs
| - lokasis
| - departemens
| - divisis
|
| Fitur:
| - Pencarian dan pagination
| - Detail lokasi, departemen, divisi
| - Detail inventaris
| - Tambah dari Data Pending
| - Edit inventaris
| - Hapus inventaris
| - Preview foto dan dokumen PDF
| - Validasi dan penanganan error
|
| Tidak mengubah modul K.I.B lainnya.
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const app = document.getElementById('kfApp');

    if (!app || window.__kfConstructed) {
        return;
    }

    window.__kfConstructed = true;

    /*
    |--------------------------------------------------------------------------
    | 1. KONFIGURASI DASAR
    |--------------------------------------------------------------------------
    */

    const $ = id => document.getElementById(id);

    const base = app.dataset.base;

    const saveUrl = app.dataset.save;

    const csrfToken = app.dataset.token;

    const state = {
        page: 1,
        lokasiId: null,
        departemenId: null,
        divisiId: null,
        inventarisId: null,
        editId: null,
        source: null,
        lokasiData: [],
        detailLoading: false,
        busy: false
    };

    const rows = Array.from(
        document.querySelectorAll('[data-kf-row]')
    );

    const str = value =>
        String(value ?? '').trim();

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

    const rupiah = value =>
        'Rp ' + new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0
        }).format(Number(value) || 0);

    const icons = () => {
        window.lucide?.createIcons?.();
    };

    /*
    |--------------------------------------------------------------------------
    | 2. UTILITAS MODAL
    |--------------------------------------------------------------------------
    */

    function showModal(id) {
        const modal = $(id);

        if (!modal) {
            return;
        }

        if (!modal.open) {
            modal.showModal();
        }

        icons();
    }

    function closeModal(id) {
        const modal = $(id);

        if (modal?.open) {
            modal.close();
        }
    }

    document.querySelectorAll(
        '[data-kf-close]'
    ).forEach(button => {
        button.addEventListener('click', () => {
            closeModal(button.dataset.kfClose);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | 3. ERROR DAN NOTIFIKASI
    |--------------------------------------------------------------------------
    */

    function showError(message) {
        const element = $('kfError');

        if (!element) {
            return;
        }

        const value = str(message);

        element.hidden = !value;
        element.textContent = value;
    }

    function notify(message) {
        alert(message);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. REQUEST API
    |--------------------------------------------------------------------------
    */

    async function api(url, options = {}) {
        const headers = {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
            ...(options.headers || {})
        };

        const response = await fetch(url, {
            ...options,
            credentials: 'same-origin',
            headers
        });

        const result = await response.json()
            .catch(() => ({}));

        if (!response.ok || result.success === false) {
            let message = result.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (result.errors) {
                message = Object.values(result.errors)
                    .flat()
                    .join('\n');
            }

            if (response.status === 401) {
                message =
                    'Sesi login telah berakhir. ' +
                    'Silakan login kembali.';
            }

            if (response.status === 403) {
                message =
                    'Akses ditolak. Pastikan akun ' +
                    'sudah login dan memiliki hak akses.';
            }

            if (response.status === 419) {
                message =
                    'Sesi keamanan telah berakhir. ' +
                    'Muat ulang halaman kemudian coba lagi.';
            }

            throw new Error(message);
        }

        return result;
    }

    /*
    |--------------------------------------------------------------------------
    | 5. PENCARIAN DAN PAGINATION
    |--------------------------------------------------------------------------
    */

    function renderPagination() {
        const keyword = str(
            $('kfCari').value
        ).toLocaleLowerCase('id-ID');

        const limit = Math.max(
            1,
            Number($('kfLimit').value) || 20
        );

        const filtered = rows.filter(row => {
            const text = str(
                row.dataset.search
            ).toLocaleLowerCase('id-ID');

            return text.includes(keyword);
        });

        const total = filtered.length;

        const totalPages = Math.max(
            1,
            Math.ceil(total / limit)
        );

        state.page = Math.min(
            Math.max(state.page, 1),
            totalPages
        );

        const start = (state.page - 1) * limit;

        const end = start + limit;

        rows.forEach(row => {
            row.hidden = true;
        });

        filtered.slice(start, end).forEach(
            (row, index) => {
                row.hidden = false;

                const numberCell =
                    row.querySelector('td:first-child');

                if (numberCell) {
                    numberCell.textContent =
                        start + index + 1;
                }
            }
        );

        $('kfInfo').textContent = total
            ? `Menampilkan ${start + 1}–${Math.min(end, total)} dari ${total} lokasi`
            : 'Tidak ada lokasi yang sesuai.';

        const container = $('kfPages');

        container.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        function addPage(label, target, disabled, active) {
            const button = document.createElement('button');

            button.type = 'button';
            button.className = active
                ? 'active'
                : '';

            button.textContent = label;

            button.disabled = disabled;

            button.addEventListener('click', () => {
                state.page = target;
                renderPagination();
            });

            container.appendChild(button);
        }

        addPage(
            '‹',
            state.page - 1,
            state.page === 1,
            false
        );

        const first = Math.max(
            1,
            state.page - 2
        );

        const last = Math.min(
            totalPages,
            first + 4
        );

        for (let i = first; i <= last; i++) {
            addPage(
                String(i),
                i,
                false,
                i === state.page
            );
        }

        addPage(
            '›',
            state.page + 1,
            state.page === totalPages,
            false
        );
    }

    $('kfCari').addEventListener('input', () => {
        state.page = 1;
        renderPagination();
    });

    $('kfLimit').addEventListener('change', () => {
        state.page = 1;
        renderPagination();
    });

    $('kfReset').addEventListener('click', () => {
        $('kfCari').value = '';
        $('kfLimit').value = '20';

        state.page = 1;

        renderPagination();
    });

    /*
    |--------------------------------------------------------------------------
    | 6. UTILITAS STRUKTUR ORGANISASI
    |--------------------------------------------------------------------------
    */

    function uniqueRows(data, field) {
        const map = new Map();

        data.forEach(row => {
            const key = Number(row[field] || 0);

            if (!map.has(key)) {
                map.set(key, row);
            }
        });

        return Array.from(map.values());
    }

    function departemenName(row) {
        return str(
            row.departemen || row.kode_dep
        ) || 'Tanpa Departemen';
    }

    function divisiName(row) {
        return str(
            row.divisi
        ) || 'Tanpa Divisi';
    }

    /*
    |--------------------------------------------------------------------------
    | 7. RENDER DEPARTEMEN
    |--------------------------------------------------------------------------
    */

    function renderDepartemen() {
        const data = uniqueRows(
            state.lokasiData,
            'id_dep'
        );

        const container = $('kfDepartemenTree');

        container.innerHTML = `
            <h4>Departemen</h4>

            ${
                data.length
                    ? data.map(row => `
                        <button
                            type="button"
                            class="kf-tree-btn ${
                                Number(row.id_dep || 0) ===
                                state.departemenId
                                    ? 'active'
                                    : ''
                            }"
                            data-dep="${Number(row.id_dep || 0)}"
                        >
                            <i data-lucide="folder"></i>
                            ${esc(departemenName(row))}
                        </button>
                    `).join('')
                    : `
                        <p class="kf-muted">
                            Tidak ada Departemen.
                        </p>
                    `
            }
        `;

        renderDivisi();
    }

    /*
    |--------------------------------------------------------------------------
    | 8. RENDER DIVISI
    |--------------------------------------------------------------------------
    */

    function renderDivisi() {
        const byDepartemen = state.lokasiData.filter(
            row =>
                Number(row.id_dep || 0) ===
                state.departemenId
        );

        const data = uniqueRows(
            byDepartemen,
            'id_div'
        );

        const container = $('kfDivisiTree');

        container.innerHTML = `
            <h4>Divisi</h4>

            ${
                data.length
                    ? data.map(row => `
                        <button
                            type="button"
                            class="kf-tree-btn ${
                                Number(row.id_div || 0) ===
                                state.divisiId
                                    ? 'active'
                                    : ''
                            }"
                            data-div="${Number(row.id_div || 0)}"
                        >
                            <i data-lucide="folder-open"></i>
                            ${esc(divisiName(row))}
                        </button>
                    `).join('')
                    : `
                        <p class="kf-muted">
                            Tidak ada Divisi.
                        </p>
                    `
            }
        `;

        renderInventaris();
    }

    /*
    |--------------------------------------------------------------------------
    | 9. RENDER TABEL INVENTARIS
    |--------------------------------------------------------------------------
    */

    function renderInventaris() {
        const selected = state.lokasiData.filter(
            row =>
                Number(row.id_dep || 0) ===
                    state.departemenId &&
                Number(row.id_div || 0) ===
                    state.divisiId
        );

        const first = selected[0];

        $('kfJudulUnit').textContent = first
            ? `${departemenName(first)} / ${divisiName(first)}`
            : 'Daftar Inventaris';

        const container = $('kfTabelInventaris');

        if (!selected.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="kf-empty">
                        Belum ada inventaris.
                    </td>
                </tr>
            `;

            return;
        }

        container.innerHTML = selected.map(
            (row, index) => `
                <tr>
                    <td>${index + 1}</td>

                    <td>
                        <strong>
                            ${esc(row.nama_barang || 'Tanpa nama')}
                        </strong>
                    </td>

                    <td>
                        ${esc(row.urai || '—')}
                    </td>

                    <td>
                        ${esc(row.tahun || '—')}
                    </td>

                    <td>
                        ${rupiah(row.nilai)}
                    </td>

                    <td>
                        <button
                            type="button"
                            class="kf-icon-btn"
                            data-aset="${Number(row.id)}"
                            title="Lihat Detail"
                        >
                            <i data-lucide="eye"></i>
                        </button>
                    </td>
                </tr>
            `
        ).join('');

        icons();
    }

    /*
    |--------------------------------------------------------------------------
    | 10. BUKA DETAIL LOKASI
    |--------------------------------------------------------------------------
    */

    async function openLokasi(id, nama) {
        state.lokasiId = id;
        state.lokasiData = [];
        state.departemenId = null;
        state.divisiId = null;

        $('kfJudulLokasi').textContent =
            nama || 'Detail Lokasi';

        $('kfDepartemenTree').textContent =
            'Memuat Departemen...';

        $('kfDivisiTree').innerHTML = '';

        $('kfTabelInventaris').innerHTML = '';

        $('kfJudulUnit').textContent =
            'Daftar Inventaris';

        showModal('kfModalLokasi');

        try {
            const response = await api(
                `${base}/lokasi/${id}`
            );

            state.lokasiData = Array.isArray(response.data)
                ? response.data
                : [];

            if (!state.lokasiData.length) {
                $('kfDepartemenTree').textContent =
                    'Belum ada data untuk lokasi ini.';

                return;
            }

            const first = state.lokasiData[0];

            state.departemenId = Number(
                first.id_dep || 0
            );

            state.divisiId = Number(
                first.id_div || 0
            );

            renderDepartemen();

        } catch (error) {
            $('kfDepartemenTree').textContent =
                error.message;
        }
    }

    $('kfTabelLokasi').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-kf-lokasi]'
            );

            if (!button) {
                return;
            }

            openLokasi(
                Number(button.dataset.kfLokasi),
                button.dataset.kfNama
            );
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 11. PILIH DEPARTEMEN
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

            state.departemenId = Number(
                button.dataset.dep
            );

            const first = state.lokasiData.find(
                row =>
                    Number(row.id_dep || 0) ===
                    state.departemenId
            );

            state.divisiId = Number(
                first?.id_div || 0
            );

            renderDepartemen();
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 12. PILIH DIVISI
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

            state.divisiId = Number(
                button.dataset.div
            );

            renderDivisi();
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 13. FORMAT FIELD DETAIL
    |--------------------------------------------------------------------------
    */

    function detailField(label, value) {
        const text = str(value) || '—';

        return `
            <div>
                <small>${esc(label)}</small>
                <strong>${esc(text)}</strong>
            </div>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | 14. DETAIL SATU INVENTARIS
    |--------------------------------------------------------------------------
    */

    async function openInventaris(id) {
        state.inventarisId = null;
        state.detailLoading = true;

        $('kfEdit').disabled = true;
        $('kfHapus').disabled = true;

        $('kfIsiDetail').textContent =
            'Memuat data Konstruksi...';

        $('kfJudulDetail').textContent =
            'Detail Konstruksi';

        showModal('kfModalDetail');

        try {
            const response = await api(
                `${base}/${id}`
            );

            const r = response.data;

            if (!r) {
                throw new Error(
                    'Data Konstruksi tidak ditemukan.'
                );
            }

            state.inventarisId = Number(r.id);

            const namaLokasi =
                r.nama_lokasi ||
                r.lokasi ||
                'Belum Dipetakan';

            const alamat =
                r.alamat_lokasi ||
                r.alamat ||
                '';

            $('kfJudulDetail').textContent =
                r.nama_barang || 'Detail Konstruksi';

            const image = r.foto_url
                ? `
                    <img
                        class="kf-photo"
                        src="${esc(r.foto_url)}"
                        alt="Foto konstruksi"
                        loading="lazy"
                    >
                `
                : `
                    <p class="kf-muted">
                        Foto konstruksi belum tersedia.
                    </p>
                `;

            const pdf = r.dokumen_url
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
                    <span class="kf-muted">
                        Dokumen PDF belum tersedia.
                    </span>
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

                ${image}

                <div class="kf-detail-grid">
                    ${detailField('Kode Barang', r.kode_barang)}
                    ${detailField('Tahun', r.tahun)}
                    ${detailField('Bangunan (P/SP/D)', r.type)}
                    ${detailField('Struktur', r.struktur)}
                    ${detailField('Material', r.materi)}
                    ${detailField('Luas (m²)', r.luas)}
                    ${detailField('Letak / Alamat', r.letak || alamat)}
                    ${detailField('Status Tanah', r.status_tanah)}
                    ${detailField('Asal Pembiayaan', r.asal)}
                    ${detailField('Status Aset', r.status_aset)}
                    ${detailField('Nilai Aset', rupiah(r.nilai))}
                </div>

                <div class="kf-detail-text">
                    <h3>Uraian Pekerjaan</h3>

                    <p>${esc(r.urai || '—')}</p>

                    <h3>Keterangan / Dokumen</h3>

                    <p>${esc(r.ket || '—')}</p>

                    ${pdf}
                </div>
            `;

            $('kfEdit').disabled = false;
            $('kfHapus').disabled = false;

            icons();

        } catch (error) {
            state.inventarisId = null;

            $('kfIsiDetail').textContent =
                error.message;

        } finally {
            state.detailLoading = false;
        }
    }

    $('kfTabelInventaris').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-aset]'
            );

            if (!button) {
                return;
            }

            openInventaris(
                Number(button.dataset.aset)
            );
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 15. FORM DAN FIELD
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

    function fillForm(data) {
        const form = $('kfForm');

        fields.forEach(name => {
            const control = form.elements.namedItem(name);

            if (!control) {
                return;
            }

            const value = data[name] ?? '';

            if (control.tagName === 'SELECT') {
                setSelect(control, value);
            } else {
                control.value = str(value);
            }
        });

        $('kfNilai').value = rupiah(data.nilai);
    }

    function fillOrganisasi(data) {
        $('kfLokasi').value =
            str(
                data.nama_lokasi ||
                data.lokasi
            ) || '—';

        $('kfDepartemen').value =
            str(data.departemen) || '—';

        $('kfDivisi').value =
            str(data.divisi) || '—';
    }

    /*
    |--------------------------------------------------------------------------
    | 16. BUKA DATA PENDING
    |--------------------------------------------------------------------------
    */

    function openPending() {
        const button = document.querySelector(
            '[data-kib-open-pending="konstruksi"]'
        );

        if (!button || button.disabled) {
            notify(
                'Belum ada Data Pending Konstruksi.\n\n' +
                'Buat transaksi Penambahan Aset pada ' +
                'menu Nilai Aset terlebih dahulu.'
            );

            return;
        }

        button.click();
    }

    $('kfTambah').addEventListener(
        'click',
        openPending
    );

    $('kfPilihUlang').addEventListener(
        'click',
        openPending
    );

    /*
    |--------------------------------------------------------------------------
    | 17. TERIMA VOUCHER DARI PENDING GLOBAL
    |--------------------------------------------------------------------------
    */

    function sourceSelected(data) {
        if (!data || !data.id) {
            return;
        }

        if (Number(data.jenisn) !== 1) {
            notify(
                'Pilih transaksi Penambahan Aset, ' +
                'bukan Penambahan Nilai.'
            );

            return;
        }

        if (
            !data.id_lokasi ||
            !data.dep ||
            !data.div
        ) {
            notify(
                'Lokasi, Departemen, dan Divisi ' +
                'pada voucher belum lengkap.'
            );

            return;
        }

        state.source = data;
        state.editId = null;

        const form = $('kfForm');

        form.reset();

        showError('');

        $('kfSourceId').value = data.id;

        $('kfVoucher').textContent =
            `Voucher ${data.no_voucher || data.id}`;

        $('kfVoucherUrai').textContent =
            data.urai || 'Penambahan Aset';

        fillOrganisasi(data);

        const tahun = str(data.tahun);

        $('kfTahun').value =
            /^\d{4}$/.test(tahun)
                ? tahun
                : '';

        $('kfLetak').value =
            data.alamat === '-'
                ? ''
                : (data.alamat || '');

        $('kfUrai').value =
            data.urai === '-'
                ? ''
                : (data.urai || '');

        $('kfNilai').value =
            rupiah(data.nilai);

        $('kfPilihUlang').hidden = false;

        $('kfJudulForm').textContent =
            'Tambah Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Inventaris';

        showModal('kfModalForm');
    }

    window.addEventListener(
        'kib:source-selected',
        event => {
            sourceSelected(event.detail);
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 18. EDIT KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    $('kfEdit').addEventListener(
        'click',
        async () => {
            if (
                !state.inventarisId ||
                state.detailLoading
            ) {
                return;
            }

            const button = $('kfEdit');

            button.disabled = true;

            try {
                const response = await api(
                    `${base}/${state.inventarisId}`
                );

                const data = response.data;

                if (!data) {
                    throw new Error(
                        'Data inventaris tidak ditemukan.'
                    );
                }

                state.editId = Number(data.id);
                state.source = null;

                $('kfForm').reset();

                showError('');

                fillForm(data);
                fillOrganisasi(data);

                $('kfSourceId').value = '';

                $('kfVoucher').textContent =
                    'Edit inventaris Konstruksi';

                $('kfVoucherUrai').textContent =
                    'Nilai aset dan struktur organisasi ' +
                    'tetap mengikuti data asal.';

                $('kfPilihUlang').hidden = true;

                $('kfJudulForm').textContent =
                    'Edit Konstruksi';

                $('kfSimpan').textContent =
                    'Simpan Perubahan';

                closeModal('kfModalDetail');

                showModal('kfModalForm');

            } catch (error) {
                notify(error.message);

            } finally {
                button.disabled = false;
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 19. SIMPAN TAMBAH / EDIT
    |--------------------------------------------------------------------------
    */

    $('kfForm').addEventListener(
        'submit',
        async event => {
            event.preventDefault();

            if (state.busy) {
                return;
            }

            showError('');

            if (
                !state.editId &&
                !state.source
            ) {
                showError(
                    'Pilih Data Pending terlebih dahulu.'
                );

                return;
            }

            const formElement = event.currentTarget;

            if (!formElement.reportValidity()) {
                return;
            }

            const submitButton = $('kfSimpan');

            const originalText =
                submitButton.textContent;

            state.busy = true;

            submitButton.disabled = true;
            submitButton.textContent = 'Menyimpan...';

            try {
                const formData = new FormData(
                    formElement
                );

                const isEditing = Boolean(
                    state.editId
                );

                let url = saveUrl;

                if (isEditing) {
                    url = `${base}/${state.editId}`;

                    // Method spoofing Laravel.
                    formData.set('_method', 'PUT');

                    formData.delete('id_nilai_aktiva');

                } else {
                    formData.set(
                        'id_nilai_aktiva',
                        String(state.source.id)
                    );
                }

                const result = await api(url, {
                    method: 'POST',
                    body: formData
                });

                notify(
                    result.message ||
                    'Data Konstruksi berhasil disimpan.'
                );

                window.location.reload();

            } catch (error) {
                showError(error.message);

                const errorElement = $('kfError');

                errorElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

            } finally {
                state.busy = false;

                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 20. HAPUS KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    $('kfHapus').addEventListener(
        'click',
        async () => {
            const id = state.inventarisId;

            if (
                !id ||
                state.detailLoading ||
                state.busy
            ) {
                return;
            }

            const confirmed = confirm(
                'Apakah kamu yakin ingin menghapus ' +
                'inventaris Konstruksi ini?\n\n' +
                'Data dan file baru yang terhubung ' +
                'akan dihapus secara permanen.\n\n' +
                'Status voucher Nilai Aset asal ' +
                'tidak akan diubah.'
            );

            if (!confirmed) {
                return;
            }

            const button = $('kfHapus');

            state.busy = true;
            button.disabled = true;

            try {
                const result = await api(
                    `${base}/${id}`,
                    {
                        method: 'DELETE'
                    }
                );

                notify(
                    result.message ||
                    'Inventaris berhasil dihapus.'
                );

                window.location.reload();

            } catch (error) {
                notify(error.message);

            } finally {
                state.busy = false;
                button.disabled = false;
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 21. INISIALISASI HALAMAN
    |--------------------------------------------------------------------------
    */

    renderPagination();

    icons();

})();
