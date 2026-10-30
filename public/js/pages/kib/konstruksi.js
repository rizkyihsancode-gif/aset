
/*
============================================================
K.I.B F — KONSTRUKSI
Perumda Tirta Kencana Kota Samarinda

Sumber data:
- kib_f_s
- nilai_aktivas
- Lokasi / Departemen / Divisi
- Modal Pending global
============================================================
*/

(() => {
    'use strict';

    const app = document.getElementById('kfApp');

    if (!app || window.__kfConstructed) {
        return;
    }

    window.__kfConstructed = true;

    const $ = id => document.getElementById(id);

    const base = app.dataset.base;

    const esc = s =>
        String(s ?? '').replace(
            /[&<>"']/g,
            c => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[c])
        );

    const str = s =>
        String(s ?? '').trim();

    const rupiah = n =>
        'Rp ' + new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0
        }).format(Number(n) || 0);

    const icons = () =>
        window.lucide?.createIcons?.();

    const show = id => {
        if (!$(id).open) {
            $(id).showModal();
        }

        icons();
    };

    const hide = id => {
        if ($(id).open) {
            $(id).close();
        }
    };

    let locationId = null;
    let depId = null;
    let divId = null;

    let source = null;
    let editId = null;
    let assetId = null;

    let locationData = [];
    let page = 1;

    const rows = [
        ...document.querySelectorAll(
            '[data-kf-row]'
        )
    ];

    /*
    ========================================================
    API
    ========================================================
    */

    async function api(url, options = {}) {

        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                Accept: 'application/json',

                'X-Requested-With':
                    'XMLHttpRequest',

                'X-CSRF-TOKEN':
                    app.dataset.token,

                ...(options.headers || {})
            }
        });

        const result = await response
            .json()
            .catch(() => ({}));

        if (
            !response.ok
            || result.success === false
        ) {
            const validation = result.errors
                ? Object.values(result.errors)
                    .flat()
                    .join('\n')
                : '';

            throw Error(
                validation
                || result.message
                || `HTTP ${response.status}`
            );
        }

        return result;
    }

    /*
    ========================================================
    SEARCH DAN PAGINATION
    ========================================================
    */

    function pages() {

        const filter = $('kfCari')
            .value
            .toLowerCase()
            .trim();

        const limit = Number(
            $('kfLimit').value
        ) || 20;

        const filtered = rows.filter(
            r => (
                r.dataset.search || ''
            ).includes(filter)
        );

        const total = Math.max(
            1,
            Math.ceil(
                filtered.length / limit
            )
        );

        page = Math.min(page, total);

        rows.forEach(
            r => r.hidden = true
        );

        filtered
            .slice(
                (page - 1) * limit,
                page * limit
            )
            .forEach(
                r => r.hidden = false
            );

        const first = filtered.length
            ? (page - 1) * limit + 1
            : 0;

        $('kfInfo').textContent =
            `${first}–${Math.min(
                page * limit,
                filtered.length
            )} dari ${filtered.length} lokasi`;

        $('kfPages').innerHTML = '';

        for (let i = 1; i <= total; i++) {

            const b =
                document.createElement(
                    'button'
                );

            b.type = 'button';

            b.textContent = i;

            b.className =
                'kf-page-btn ' +
                (i === page ? 'active' : '');

            b.onclick = () => {
                page = i;
                pages();
            };

            $('kfPages').append(b);
        }
    }

    $('kfCari').addEventListener(
        'input',
        () => {
            page = 1;
            pages();
        }
    );

    $('kfLimit').addEventListener(
        'change',
        () => {
            page = 1;
            pages();
        }
    );

    $('kfReset').onclick = () => {
        $('kfCari').value = '';
        $('kfLimit').value = '20';

        page = 1;
        pages();
    };

    pages();

    /*
    ========================================================
    UTILITAS HIERARKI
    ========================================================
    */

    const distinct = (values, key) =>
        [
            ...new Map(
                values.map(
                    v => [key(v), v]
                )
            ).values()
        ];

    const depName = r =>
        str(
            r.departemen || r.kode_dep
        ) || 'Tanpa Departemen';

    const divName = r =>
        str(
            r.divisi
        ) || 'Tanpa Divisi';

    /*
    ========================================================
    1. RENDER DEPARTEMEN
    ========================================================
    */

    function drawDepartemen() {

        const deps = distinct(
            locationData,
            r => String(r.id_dep ?? 0)
        );

        $('kfDepartemenTree').innerHTML =
            '<h4>Departemen</h4>' +

            (
                deps.length

                    ? deps.map(r => `
                        <button
                            type="button"
                            class="kf-tree-btn ${
                                Number(r.id_dep || 0) === depId
                                    ? 'active'
                                    : ''
                            }"
                            data-dep="${Number(r.id_dep || 0)}"
                        >
                            <i data-lucide="folder"></i>

                            ${esc(depName(r))}
                        </button>
                    `).join('')

                    : '<p class="kf-muted">Tidak ada Departemen.</p>'
            );

        drawDivisi();
    }

    /*
    ========================================================
    2. RENDER DIVISI
    ========================================================
    */

    function drawDivisi() {

        const byDep = locationData.filter(
            r =>
                Number(r.id_dep || 0) === depId
        );

        const divs = distinct(
            byDep,
            r => String(r.id_div ?? 0)
        );

        $('kfDivisiTree').innerHTML =
            '<h4>Divisi</h4>' +

            (
                divs.length

                    ? divs.map(r => `
                        <button
                            type="button"
                            class="kf-tree-btn child ${
                                Number(r.id_div || 0) === divId
                                    ? 'active'
                                    : ''
                            }"
                            data-div="${Number(r.id_div || 0)}"
                        >
                            <i data-lucide="folder-open"></i>

                            ${esc(divName(r))}
                        </button>
                    `).join('')

                    : '<p class="kf-muted">Tidak ada Divisi.</p>'
            );

        drawInventaris();

        icons();
    }

    /*
    ========================================================
    3. TABEL INVENTARIS PER DIVISI
    ========================================================
    */

    function drawInventaris() {

        const selected = locationData.filter(
            r =>
                Number(r.id_dep || 0) === depId
                &&
                Number(r.id_div || 0) === divId
        );

        const first = selected[0];

        $('kfJudulUnit').textContent = first

            ? `${depName(first)} / ${divName(first)}`

            : 'Daftar Inventaris';

        $('kfTabelInventaris').innerHTML =
            selected.length

                ? selected.map((r, i) => `
                    <tr>
                        <td>
                            ${i + 1}
                        </td>

                        <td>
                            <strong>
                                ${esc(r.nama_barang || 'Tanpa nama')}
                            </strong>
                        </td>

                        <td>
                            ${esc(r.urai)}
                        </td>

                        <td>
                            ${esc(r.tahun)}
                        </td>

                        <td>
                            ${rupiah(r.nilai)}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="kf-icon-btn"
                                data-aset="${Number(r.id)}"
                                title="Lihat Detail"
                            >
                                <i data-lucide="eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')

                : `
                    <tr>
                        <td
                            colspan="6"
                            class="kf-empty"
                        >
                            Tidak ada inventaris pada Divisi ini.
                        </td>
                    </tr>
                `;

        const print = $('kfCetak');

        const available =
            locationId > 0
            && depId > 0
            && divId > 0
            && selected.length > 0;

        print.hidden = !available;

        if (available) {
            print.href =
                `${app.dataset.print}/` +
                `${locationId}/${depId}/${divId}`;
        }

        icons();
    }

    /*
    ========================================================
    BUKA DETAIL LOKASI
    ========================================================
    */

    async function openLokasi(id, nama) {

        locationId = id;

        $('kfJudulLokasi').textContent =
            nama || 'Detail Lokasi';

        $('kfDepartemenTree').textContent =
            'Memuat organisasi...';

        $('kfDivisiTree').textContent = '';

        $('kfTabelInventaris').innerHTML = '';

        $('kfCetak').hidden = true;

        show('kfModalLokasi');

        try {

            const result = await api(
                `${base}/lokasi/${id}`
            );

            locationData = result.data || [];

            depId = Number(
                locationData[0]?.id_dep || 0
            );

            divId = Number(
                locationData[0]?.id_div || 0
            );

            drawDepartemen();

        } catch (err) {

            $('kfDepartemenTree').textContent =
                err.message;
        }
    }

    /*
    ========================================================
    EVENT DETAIL LOKASI
    ========================================================
    */

    $('kfTabelLokasi').addEventListener(
        'click',
        e => {

            const button = e.target.closest(
                '[data-kf-lokasi]'
            );

            if (!button) {
                return;
            }

            openLokasi(
                Number(
                    button.dataset.kfLokasi
                ),
                button.dataset.kfNama
            );
        }
    );

    /*
    ========================================================
    EVENT PILIH DEPARTEMEN
    ========================================================
    */

    $('kfDepartemenTree').addEventListener(
        'click',
        e => {

            const b = e.target.closest(
                '[data-dep]'
            );

            if (!b) {
                return;
            }

            depId = Number(
                b.dataset.dep
            );

            divId = Number(
                locationData.find(
                    r =>
                        Number(r.id_dep || 0) === depId
                )?.id_div || 0
            );

            drawDepartemen();
        }
    );

    /*
    ========================================================
    EVENT PILIH DIVISI
    ========================================================
    */

    $('kfDivisiTree').addEventListener(
        'click',
        e => {

            const b = e.target.closest(
                '[data-div]'
            );

            if (!b) {
                return;
            }

            divId = Number(
                b.dataset.div
            );

            drawDivisi();
        }
    );

    /*
    ========================================================
    EVENT PILIH INVENTARIS
    ========================================================
    */

    $('kfTabelInventaris').addEventListener(
        'click',
        e => {

            const b = e.target.closest(
                '[data-aset]'
            );

            if (b) {
                openAset(
                    Number(b.dataset.aset)
                );
            }
        }
    );

    /*
    ========================================================
    FORMAT FIELD DETAIL
    ========================================================
    */

    const detailField = (label, value) => `
        <div class="kf-field">
            <small>${esc(label)}</small>

            <strong>
                ${esc(
                    value === ''
                    || value === null
                    || value === undefined
                        ? '—'
                        : value
                )}
            </strong>
        </div>
    `;

    /*
    ========================================================
    DETAIL SATU INVENTARIS
    ========================================================
    */

    async function openAset(id) {

        assetId = id;

        $('kfIsiDetail').textContent =
            'Memuat inventaris...';

        show('kfModalDetail');

        try {

            const { data: r } = await api(
                `${base}/${id}`
            );

            $('kfJudulDetail').textContent =
                r.nama_barang || 'Detail Konstruksi';

            $('kfIsiDetail').innerHTML = `

                <div class="kf-summary">

                    <strong>
                        ${esc(r.nama_barang)}
                    </strong>

                    <p>
                        ${esc(r.lokasi)} ·
                        ${esc(r.departemen)} ·
                        ${esc(r.divisi)}
                    </p>

                </div>

                ${
                    r.foto_url

                        ? `
                            <img
                                class="kf-photo"
                                src="${esc(r.foto_url)}"
                                alt="Foto konstruksi"
                            >
                        `

                        : `
                            <p class="kf-muted">
                                Foto belum tersedia.
                            </p>
                        `
                }

                <div class="kf-detail-grid">

                    ${detailField('Tahun', r.tahun)}

                    ${detailField(
                        'Bangunan (P/SP/D)',
                        r.type
                    )}

                    ${detailField(
                        'Bertingkat / Tidak',
                        r.struktur
                    )}

                    ${detailField(
                        'Beton / Tidak',
                        r.materi
                    )}

                    ${detailField(
                        'Luas (m²)',
                        r.luas
                    )}

                    ${detailField(
                        'Letak / Alamat',
                        r.letak || r.alamat
                    )}

                    ${detailField(
                        'Status Tanah',
                        r.status_tanah
                    )}

                    ${detailField(
                        'Asal Pembiayaan',
                        r.asal
                    )}

                    ${detailField(
                        'Status Aset',
                        r.status_aset
                    )}

                    ${detailField(
                        'Nilai Aset',
                        rupiah(r.nilai)
                    )}

                </div>

                <div class="kf-detail-text">

                    <h3>Uraian Pekerjaan</h3>

                    <p>${esc(r.urai || '—')}</p>

                    <h3>Keterangan / Dokumen</h3>

                    <p>${esc(r.ket || '—')}</p>

                    ${
                        r.dokumen_url

                            ? `
                                <a
                                    class="kf-btn outline"
                                    href="${esc(r.dokumen_url)}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    Lihat Dokumen PDF
                                </a>
                            `

                            : `
                                <span class="kf-muted">
                                    PDF belum tersedia.
                                </span>
                            `
                    }

                </div>
            `;

        } catch (err) {

            $('kfIsiDetail').textContent =
                err.message;
        }
    }

    /*
    ========================================================
    BUKA DATA PENDING GLOBAL
    ========================================================
    */

    function pending() {

        const button = document.querySelector(
            '[data-kib-open-pending="konstruksi"]'
        );

        if (!button || button.disabled) {

            alert(
                'Belum ada Data Pending Konstruksi. ' +
                'Tambahkan terlebih dahulu ' +
                'pada menu Nilai Aset.'
            );

            return;
        }

        button.click();
    }

    $('kfTambah').onclick = pending;

    $('kfPilihUlang').onclick = pending;

    /*
    ========================================================
    ORGANISASI OTOMATIS
    ========================================================
    */

    function organisasi(r) {

        $('kfLokasi').value =
            r.lokasi || '—';

        $('kfDepartemen').value =
            r.departemen || '—';

        $('kfDivisi').value =
            r.divisi || '—';
    }

    /*
    ========================================================
    FIELD FORM
    ========================================================
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

    /*
    ========================================================
    MEMPERTAHANKAN NILAI LEGACY PADA SELECT
    ========================================================
    */

    function setSelect(el, value) {

        const val = str(value);

        if (
            val
            &&
            ![...el.options].some(
                o => o.value === val
            )
        ) {
            el.add(
                new Option(
                    `${val} (data lama)`,
                    val
                )
            );
        }

        el.value = val;
    }

    /*
    ========================================================
    ISI FORM EDIT
    ========================================================
    */

    function fill(r) {

        fields.forEach(name => {

            const control = $('kfForm')
                .elements
                .namedItem(name);

            if (!control) {
                return;
            }

            if (
                control.tagName === 'SELECT'
            ) {
                setSelect(
                    control,
                    r[name]
                );

            } else {

                control.value =
                    r[name] ?? '';
            }
        });

        $('kfNilai').value =
            rupiah(r.nilai);
    }

    /*
    ========================================================
    PESAN VALIDASI
    ========================================================
    */

    function errorMsg(message) {

        $('kfError').hidden =
            !message;

        $('kfError').textContent =
            message || '';
    }

    /*
    ========================================================
    PILIH TRANSAKSI PENDING
    ========================================================
    */

    function sourceSelected(r) {

        if (!r || !r.id) {
            return;
        }

        if (Number(r.jenisn) !== 1) {

            alert(
                'Untuk form K.I.B F ini, pilih ' +
                'transaksi Penambahan Aset ' +
                '(bukan Penambahan Nilai).'
            );

            return;
        }

        if (
            !r.id_lokasi
            || !r.dep
            || !r.div
        ) {

            alert(
                'Lokasi, Departemen, atau Divisi ' +
                'pada voucher belum lengkap.'
            );

            return;
        }

        source = r;
        editId = null;

        $('kfForm').reset();

        errorMsg('');

        $('kfSourceId').value =
            r.id;

        $('kfVoucher').textContent =
            `Voucher ${r.no_voucher || r.id}`;

        $('kfVoucherUrai').textContent =
            r.urai || 'Penambahan Aset';

        organisasi(r);

        $('kfTahun').value =
            r.tahun === '-'
                ? ''
                : (r.tahun || '');

        $('kfLetak').value =
            r.alamat === '-'
                ? ''
                : (r.alamat || '');

        $('kfUrai').value =
            r.urai === '-'
                ? ''
                : (r.urai || '');

        $('kfNilai').value =
            rupiah(r.nilai);

        $('kfPilihUlang').hidden = false;

        $('kfJudulForm').textContent =
            'Tambah Konstruksi';

        $('kfSimpan').textContent =
            'Simpan Inventaris';

        show('kfModalForm');
    }

    /*
    ========================================================
    EVENT MODAL PENDING GLOBAL
    ========================================================
    */

    window.addEventListener(
        'kib:source-selected',
        event => sourceSelected(
            event.detail
        )
    );

    /*
    ========================================================
    EDIT
    ========================================================
    */

    $('kfEdit').onclick = async () => {

        if (!assetId) {
            return;
        }

        try {

            const { data: r } = await api(
                `${base}/${assetId}`
            );

            editId = assetId;
            source = null;

            $('kfForm').reset();

            errorMsg('');

            fill(r);

            organisasi(r);

            $('kfSourceId').value = '';

            $('kfVoucher').textContent =
                'Edit inventaris dari database lama';

            $('kfVoucherUrai').textContent =
                'Nominal dan struktur organisasi ' +
                'dipertahankan.';

            $('kfPilihUlang').hidden = true;

            $('kfJudulForm').textContent =
                'Edit Konstruksi';

            $('kfSimpan').textContent =
                'Simpan Perubahan';

            hide('kfModalDetail');

            show('kfModalForm');

        } catch (err) {

            alert(err.message);
        }
    };

    /*
    ========================================================
    HAPUS
    ========================================================
    */

    $('kfHapus').onclick = async () => {

        if (
            !assetId
            ||
            !confirm(
                'Hapus inventaris ini secara permanen?\n\n' +
                'Voucher Nilai Aset tidak akan ' +
                'diubah statusnya.'
            )
        ) {
            return;
        }

        try {

            const result = await api(
                `${base}/${assetId}`,
                {
                    method: 'DELETE'
                }
            );

            alert(result.message);

            location.reload();

        } catch (err) {

            alert(err.message);
        }
    };

    /*
    ========================================================
    SIMPAN TAMBAH / EDIT
    ========================================================
    */

    $('kfForm').addEventListener(
        'submit',
        async e => {

            e.preventDefault();

            errorMsg('');

            if (!editId && !source) {

                errorMsg(
                    'Pilih Data Pending terlebih dahulu.'
                );

                return;
            }

            const button = $('kfSimpan');

            button.disabled = true;

            try {

                const form = new FormData(
                    e.currentTarget
                );

                if (editId) {

                    form.set(
                        '_method',
                        'PUT'
                    );
                }

                const result = await api(
                    editId
                        ? `${base}/${editId}`
                        : app.dataset.save,

                    {
                        method: 'POST',
                        body: form
                    }
                );

                alert(result.message);

                location.reload();

            } catch (err) {

                errorMsg(err.message);

            } finally {

                button.disabled = false;
            }
        }
    );

    /*
    ========================================================
    TUTUP MODAL
    ========================================================
    */

    document
        .querySelectorAll(
            '[data-kf-close]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => hide(
                    button.dataset.kfClose
                )
            );
        });

    icons();

})();
