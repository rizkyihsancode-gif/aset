
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // =====================================================
    // 1. INITIALISASI HALAMAN
    // =====================================================

    const root = document.getElementById('gedungPage');

    if (!root || root.dataset.init === '1') return;

    root.dataset.init = '1';

    const $ = (selector, node = root) =>
        node.querySelector(selector);

    const $$ = (selector, node = root) =>
        [...node.querySelectorAll(selector)];

    const format = new Intl.NumberFormat('id-ID');

    const rupiah = value =>
        'Rp ' + format.format(Number(value) || 0);

    const esc = value =>
        String(value ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);

    const icons = () =>
        window.lucide?.createIcons?.();

    const base = root.dataset.baseUrl;

    const url = id =>
        base + '/' + encodeURIComponent(id);

    const lokasiUrl = id =>
        base + '/lokasi/' + encodeURIComponent(id);

    const fileUrl = (id, type) =>
        url(id) + '/file/' + type;

    const fmtDate = date => {
        if (!date) return '—';

        const s = String(date).slice(0, 10);
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);

        return m
            ? `${m[3]}/${m[2]}/${m[1]}`
            : s;
    };

    // =====================================================
    // 2. FETCH JSON DARI LARAVEL
    // =====================================================

    async function json(path) {
        const response = await fetch(path, {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(
                'Server merespons HTTP ' + response.status
            );
        }

        const data = await response.json();

        if (data.success === false) {
            throw new Error(
                data.message || 'Permintaan gagal.'
            );
        }

        return data;
    }

    // =====================================================
    // 3. MODAL
    // =====================================================

    function open(id) {
        const dialog = $('#' + id);

        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        icons();
    }

    function close(id) {
        const dialog = $('#' + id);

        if (dialog?.open) {
            dialog.close();
        }
    }

    $$('[data-close]').forEach(element => {
        element.addEventListener('click', () => {
            close(element.dataset.close);
        });
    });

    $$('dialog').forEach(dialog => {
        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                dialog.close();
            }
        });
    });

    // =====================================================
    // 4. TABEL UTAMA DAN PAGINATION
    // =====================================================

    const rows = $$('.gedung-row');

    let page = 1;

    function filteredRows() {
        const keyword = $('#gedungSearch')
            .value.trim()
            .toLowerCase();

        return rows.filter(row =>
            row.dataset.search.includes(keyword)
        );
    }

    function renderTable() {
        const selected = filteredRows();

        const pageSize =
            Number($('#gedungPageSize').value) || 20;

        const count = Math.max(
            1,
            Math.ceil(selected.length / pageSize)
        );

        page = Math.min(
            Math.max(1, page),
            count
        );

        const start = (page - 1) * pageSize;

        rows.forEach(row => {
            row.hidden = true;
        });

        selected
            .slice(start, start + pageSize)
            .forEach((row, index) => {
                row.hidden = false;

                row.querySelector(
                    '.gedung-row-number'
                ).textContent = start + index + 1;
            });

        const shown = selected.length
            ? start + 1
            : 0;

        $('#gedungTableInfo').textContent =
            `Menampilkan ${shown}–` +
            `${Math.min(start + pageSize, selected.length)}` +
            ` dari ${selected.length} lokasi`;

        const parent = $('#gedungPagination');

        parent.replaceChildren();

        if (count <= 1) return;

        function add(text, target, disabled = false) {
            const element = document.createElement('button');

            element.type = 'button';
            element.textContent = text;
            element.disabled = disabled;

            if (
                target === page &&
                /^\d+$/.test(text)
            ) {
                element.classList.add('active');

                element.setAttribute(
                    'aria-current',
                    'page'
                );
            }

            element.addEventListener('click', () => {
                page = target;
                renderTable();
            });

            parent.appendChild(element);
        }

        function dot() {
            const span = document.createElement('span');

            span.textContent = '…';

            parent.appendChild(span);
        }

        add('‹', page - 1, page === 1);

        const pages = new Set([1, count]);

        for (
            let p = Math.max(1, page - 2);
            p <= Math.min(count, page + 2);
            p++
        ) {
            pages.add(p);
        }

        let last = 0;

        [...pages]
            .sort((a, b) => a - b)
            .forEach(p => {
                if (last && p - last > 1) {
                    dot();
                }

                add(String(p), p);
                last = p;
            });

        add('›', page + 1, page === count);
    }

    // =====================================================
    // 5. PENCARIAN DAN RESET
    // =====================================================

    $('#gedungSearch').addEventListener('input', () => {
        page = 1;
        renderTable();
    });

    $('#gedungPageSize').addEventListener('change', () => {
        page = 1;
        renderTable();
    });

    $('#gedungReset').addEventListener('click', () => {
        $('#gedungSearch').value = '';
        $('#gedungPageSize').value = '20';

        page = 1;
        renderTable();
    });

    // =====================================================
    // 6. EXPORT CSV
    // =====================================================

    $('#gedungExport').addEventListener('click', () => {
        const out = [[
            'No',
            'Lokasi',
            'Alamat',
            'Nilai',
            'Jumlah PDF'
        ]];

        filteredRows().forEach((row, index) => {
            out.push([
                index + 1,
                row.dataset.exportLokasi,
                row.dataset.exportAlamat,
                row.dataset.exportNilai,
                row.dataset.exportPdf
            ]);
        });

        const csv = '\uFEFF' + out.map(row =>
            row.map(value => {
                let text = String(value ?? '');

                if (/^\s*[=+@-]/.test(text)) {
                    text = "'" + text;
                }

                return '"' +
                    text.replaceAll('"', '""') +
                    '"';

            }).join(';')

        ).join('\r\n');

        const link = document.createElement('a');

        const blobUrl = URL.createObjectURL(
            new Blob([csv], {
                type: 'text/csv;charset=utf-8'
            })
        );

        link.href = blobUrl;
        link.download = 'kib-gedung-bangunan.csv';

        document.body.appendChild(link);

        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 500);
    });

    // =====================================================
    // 7. STATE NILAI ASET DAN GEDUNG
    // =====================================================

    let pending = [];
    let selectedId = null;

    let detailItems = [];
    let detailMode = 'view';

    let nilaiItems = [];

    const form = $('#gedungForm');

    // =====================================================
    // 8. STATUS DATA NILAI ASET TERPILIH
    // =====================================================

    function selection(source) {
        selectedId = String(source.id);

        $('#gedungVoucherId').value = source.id;

        $('#gedungLokasi').value =
            source.lokasi || '';

        $('#gedungAlamat').value =
            source.alamat || '';

        $('#gedungDepartemen').value =
            source.departemen || '';

        $('#gedungDivisi').value =
            source.divisi || '';

        $('#gedungVoucher').value =
            source.no_voucher || '';

        $('#gedungSelected').hidden = false;

        $('#gedungSelectedTitle').textContent =
            `${source.no_voucher || '—'} · ` +
            `${source.lokasi || '—'}`;

        $('#gedungSelectedMeta').textContent =
            `Tahun ${source.tahun || '—'} · ` +
            `${source.departemen || '—'} / ` +
            `${source.divisi || '—'} · ` +
            `${rupiah(source.nilai)}`;

        // Tabel tetap tampil,
        // baris voucher diberi status Terpilih.
        renderPending();
    }

    // =====================================================
    // 9. RENDER DATA PENDING
    // =====================================================

    function renderPending() {
        const keyword = $('#gedungPendingSearch')
            .value.trim()
            .toLowerCase();

        const matches = pending.filter(item =>
            [
                item.no_voucher,
                item.lokasi,
                item.departemen,
                item.divisi,
                item.tahun,
                item.nilai,
                item.urai,
                item.kode_aktiva
            ]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
        );

        $('#gedungPendingCount').textContent =
            format.format(matches.length) + ' data';

        $('#gedungPendingBody').innerHTML =
            matches.length
                ? matches.map((item, index) => {
                    const chosen =
                        String(item.id) === selectedId;

                    return `
                        <tr class="${chosen ? 'selected' : ''}">

                            <td>${index + 1}</td>

                            <td>
                                <b>
                                    ${esc(item.no_voucher || '—')}
                                </b>

                                <small>
                                    ${esc(fmtDate(item.tgl_voucher))}
                                </small>
                            </td>

                            <td>
                                <b>
                                    ${esc(item.lokasi || '—')}
                                </b>

                                <small>
                                    ${esc(item.alamat || '')}
                                </small>
                            </td>

                            <td>
                                ${esc(item.departemen || '—')}
                            </td>

                            <td>
                                ${esc(item.divisi || '—')}
                            </td>

                            <td>
                                ${esc(item.tahun || '—')}
                            </td>

                            <td>
                                <b>${rupiah(item.nilai)}</b>
                            </td>

                            <td class="gedung-uraian">
                                ${esc(item.urai || '—')}
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="gedung-choose ${
                                        chosen ? 'chosen' : ''
                                    }"
                                    data-source="${Number(item.id)}"
                                >
                                    ${
                                        chosen
                                            ? '✓ Terpilih'
                                            : 'Pilih'
                                    }
                                </button>
                            </td>

                        </tr>
                    `;
                }).join('')
                : `
                    <tr>
                        <td colspan="9" class="gedung-empty">
                            Tidak ada transaksi yang sesuai.
                        </td>
                    </tr>
                `;
    }

    // =====================================================
    // 10. LOAD DATA PENDING DARI KIBController
    // =====================================================

    async function loadPending() {
        $('#gedungPendingBody').innerHTML = `
            <tr>
                <td colspan="9" class="gedung-empty">
                    Memuat transaksi pending...
                </td>
            </tr>
        `;

        try {
            const data = await json(
                root.dataset.pendingUrl
            );

            pending = Array.isArray(data.data)
                ? data.data
                : [];

            [
                '#gedungPendingKpi',
                '#gedungIncomingBadge',
                '#gedungPendingLabel',
                '#gedungPendingPill'
            ].forEach(selector => {
                $(selector).textContent =
                    format.format(
                        Number(data.count ?? pending.length)
                    );
            });

            renderPending();

        } catch (error) {
            $('#gedungPendingBody').innerHTML = `
                <tr>
                    <td colspan="9" class="gedung-empty">
                        ${esc(error.message)} —
                        periksa server.
                    </td>
                </tr>
            `;
        }
    }

    $('#gedungPendingSearch').addEventListener(
        'input',
        renderPending
    );

    // =====================================================
    // 11. PILIH VOUCHER
    // =====================================================

    $('#gedungPendingBody').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-source]'
            );

            if (!button) return;

            const source = pending.find(item =>
                String(item.id) ===
                button.dataset.source
            );

            if (!source) return;

            if (
                !source.id_lokasi ||
                !source.dep ||
                !source.div
            ) {
                alert(
                    'Voucher belum memiliki Lokasi, ' +
                    'Departemen, atau Divisi lengkap.'
                );

                return;
            }

            selection(source);
        }
    );

    // =====================================================
    // 12. GANTI VOUCHER
    // =====================================================

    $('#gedungChange').addEventListener('click', () => {
        // Pada mode Edit, voucher sumber
        // tidak boleh diubah.
        if (!$('#gedungMethod').disabled) return;

        $('#gedungPendingSection').hidden = false;
        $('#gedungPendingSearch').value = '';

        renderPending();

        $('#gedungPendingSearch').focus();
    });

    // =====================================================
    // 13. RESET FORM
    // =====================================================

    function resetForm() {
        form.reset();

        form.action = root.dataset.storeUrl;

        $('#gedungMethod').disabled = true;
        $('#gedungVoucherId').value = '';

        selectedId = null;

        $('#gedungSelected').hidden = true;
        $('#gedungChange').hidden = false;

        $('#gedungPendingSection').hidden = false;

        $('#gedungFormTitle').textContent =
            'Tambah Data Gedung';

        [
            'gedungLokasi',
            'gedungAlamat',
            'gedungDepartemen',
            'gedungDivisi',
            'gedungVoucher'
        ].forEach(id => {
            $('#' + id).value = '';
        });

        $('#gedungPendingSearch').value = '';
    }

    // =====================================================
    // 14. TAMBAH GEDUNG
    // =====================================================

    async function create() {
        resetForm();

        open('gedungFormDialog');

        await loadPending();
    }

    $('#gedungAdd').addEventListener('click', create);

    $('#gedungOpenPending').addEventListener(
        'click',
        create
    );

    // =====================================================
    // 15. VALIDASI SIMPAN
    // =====================================================

    form.addEventListener('submit', event => {
        const creating = $('#gedungMethod').disabled;

        if (
            creating &&
            !$('#gedungVoucherId').value
        ) {
            event.preventDefault();

            alert(
                'Pilih data Nilai Aset terlebih dahulu.'
            );
        }
    });

    // =====================================================
    // 16. ATRIBUT DETAIL GEDUNG
    // =====================================================

    function detailAttributes(item) {
        return [
            ['Kode Inventaris', item.kode],
            ['Nama Gedung', item.nama_barang],
            ['Penggunaan', item.guna],
            ['No. Register', item.reg],
            ['Departemen', item.departemen],
            ['Divisi', item.divisi],
            ['Kondisi', item.kondisi],
            ['Konstruksi', item.konstruksi],
            ['Material / Bahan', item.materi],
            ['Luas Bangunan', item.luas],
            ['Luas Lantai / Tanah', item.luastanah],
            ['Status Tanah', item.status],
            ['Kode Tanah', item.kode_tanah],
            ['Tanggal Dokumen', fmtDate(item.tgl_imb)],
            ['No. IMB / Dokumen', item.no_imb],
            ['Asal Perolehan', item.asal],
            ['Keterangan', item.ket]
        ];
    }

    // =====================================================
    // 17. DETAIL SATU GEDUNG
    // =====================================================

    function displayFocus(item) {
        const pane = $('#gedungDetailFocus');

        pane.hidden = false;

        pane.innerHTML = `
            <div class="gedung-focus-heading">

                <h3>
                    Rincian:
                    ${esc(item.nama_barang || 'Gedung')}
                </h3>

                <button
                    type="button"
                    class="gedung-btn outline"
                    data-hide-focus
                >
                    Tutup rincian
                </button>

            </div>

            ${
                item.img
                    ? `
                        <div class="gedung-focus-media">
                            <a
                                href="${fileUrl(item.id, 'foto')}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src="${fileUrl(item.id, 'foto')}"
                                    alt="Foto ${esc(item.nama_barang)}"
                                    loading="lazy"
                                >
                            </a>
                        </div>
                    `
                    : ''
            }

            <dl class="gedung-attributes">
                ${
                    detailAttributes(item)
                        .map(([name, value]) => `
                            <div>
                                <dt>
                                    ${esc(name)}
                                </dt>

                                <dd>
                                    ${esc(value || '—')}
                                </dd>
                            </div>
                        `)
                        .join('')
                }
            </dl>

            ${
                item.dok
                    ? `
                        <a
                            class="gedung-btn outline"
                            href="${fileUrl(item.id, 'dokumen')}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i data-lucide="file-text"></i>
                            Lihat Dokumen PDF
                        </a>
                    `
                    : ''
            }
        `;

        icons();

        pane.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }

    // =====================================================
    // 18. DAFTAR GEDUNG BERDASARKAN LOKASI
    // =====================================================

    function renderDetailList() {
        const dep = $('#gedungDetailDep').value;
        const div = $('#gedungDetailDiv').value;

        const items = detailItems.filter(item =>
            (!dep || String(item.id_departemen) === dep) &&
            (!div || String(item.id_div) === div)
        );

        $('#gedungDetailItems').innerHTML =
            items.length
                ? items.map(item => {
                    const button =
                        detailMode === 'delete'
                            ? `
                                <button
                                    type="button"
                                    class="gedung-btn danger"
                                    data-delete="${item.id}"
                                >
                                    <i data-lucide="trash-2"></i>
                                    Hapus
                                </button>
                            `
                            : detailMode === 'edit'
                                ? `
                                    <button
                                        type="button"
                                        class="gedung-btn outline"
                                        data-edit="${item.id}"
                                    >
                                        <i data-lucide="square-pen"></i>
                                        Edit
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        class="gedung-btn outline"
                                        data-focus="${item.id}"
                                    >
                                        <i data-lucide="eye"></i>
                                        Lihat Rincian
                                    </button>
                                `;

                    return `
                        <article class="gedung-inventory">

                            <div>
                                <strong>
                                    ${esc(item.nama_barang || 'Gedung')}
                                </strong>

                                <small>
                                    ${esc(item.kode || '—')} ·
                                    ${esc(item.departemen || '—')} /
                                    ${esc(item.divisi || '—')} ·
                                    ${esc(item.kondisi || '—')}
                                </small>
                            </div>

                            ${button}

                        </article>
                    `;
                }).join('')
                : `
                    <p class="gedung-empty">
                        Tidak ada inventaris untuk
                        filter tersebut.
                    </p>
                `;

        icons();
    }

    // =====================================================
    // 19. FILTER DEPARTEMEN DAN DIVISI
    // =====================================================

    function renderDetailFilters() {
        const dep = $('#gedungDetailDep');
        const div = $('#gedungDetailDiv');

        const departments = new Map();

        detailItems.forEach(item => {
            departments.set(
                String(item.id_departemen),
                item.departemen || 'Tanpa departemen'
            );
        });

        dep.innerHTML = `
            <option value="">
                Semua Departemen
            </option>
        ` + [...departments]
            .map(([id, name]) => `
                <option value="${esc(id)}">
                    ${esc(name)}
                </option>
            `)
            .join('');

        function makeDiv() {
            const divisions = new Map();

            detailItems
                .filter(item =>
                    !dep.value ||
                    String(item.id_departemen) === dep.value
                )
                .forEach(item => {
                    divisions.set(
                        String(item.id_div),
                        item.divisi || 'Tanpa divisi'
                    );
                });

            div.innerHTML = `
                <option value="">
                    Semua Divisi
                </option>
            ` + [...divisions]
                .map(([id, name]) => `
                    <option value="${esc(id)}">
                        ${esc(name)}
                    </option>
                `)
                .join('');

            renderDetailList();
        }

        dep.onchange = makeDiv;
        div.onchange = renderDetailList;

        makeDiv();
    }

    // =====================================================
    // 20. MEMBUKA DETAIL LOKASI
    // =====================================================

    async function showLokasi(lokasiId, mode = 'view') {
        detailMode = mode;

        $('#gedungDetailTitle').textContent =
            mode === 'edit'
                ? 'Pilih Gedung untuk Edit'
                : mode === 'delete'
                    ? 'Pilih Gedung untuk Hapus'
                    : 'Detail Gedung dan Bangunan';

        $('#gedungDetailAddress').textContent =
            'Memuat lokasi dan daftar bangunan...';

        $('#gedungDetailItems').innerHTML = `
            <p class="gedung-empty">
                Memuat data...
            </p>
        `;

        $('#gedungDetailFocus').hidden = true;

        open('gedungDetailDialog');

        try {
            const data = await json(
                lokasiUrl(lokasiId)
            );

            detailItems = Array.isArray(data.data)
                ? data.data
                : [];

            $('#gedungDetailAddress').textContent =
                `${data.lokasi.lokasi || '—'} · ` +
                `${data.lokasi.alamat || '—'} · ` +
                `${detailItems.length} gedung`;

            renderDetailFilters();

        } catch (error) {
            $('#gedungDetailItems').textContent =
                'Gagal memuat data: ' + error.message;
        }
    }

    // =====================================================
    // 21. EVENT MODAL DETAIL
    // =====================================================

    $('#gedungDetailItems').addEventListener(
        'click',
        event => {
            // LIHAT RINCIAN
            const focus = event.target.closest(
                '[data-focus]'
            );

            if (focus) {
                const item = detailItems.find(
                    item =>
                        String(item.id) === focus.dataset.focus
                );

                if (item) {
                    displayFocus(item);
                }

                return;
            }

            // EDIT
            const edit = event.target.closest(
                '[data-edit]'
            );

            if (edit) {
                editGedung(edit.dataset.edit);
                return;
            }

            // HAPUS
            const del = event.target.closest(
                '[data-delete]'
            );

            if (!del) return;

            const item = detailItems.find(
                item =>
                    String(item.id) === del.dataset.delete
            );

            if (!item) return;

            const confirmed = confirm(
                `Hapus hanya inventaris "` +
                `${item.nama_barang || item.kode}"?\n` +
                `Lokasi dan transaksi Nilai Aset ` +
                `tidak dihapus.`
            );

            if (!confirmed) return;

            const formDel = $('#gedungDeleteForm');

            formDel.action = url(item.id);

            formDel.submit();
        }
    );

    $('#gedungDetailFocus').addEventListener(
        'click',
        event => {
            if (
                event.target.closest('[data-hide-focus]')
            ) {
                $('#gedungDetailFocus').hidden = true;
            }
        }
    );

    // =====================================================
    // 22. EDIT DATA GEDUNG
    // =====================================================

    async function editGedung(id) {
        try {
            const result = await json(
                url(id)
            );

            const item = result.data;

            resetForm();

            $('#gedungMethod').disabled = false;

            form.action = url(id);

            $('#gedungFormTitle').textContent =
                'Edit Data Gedung #' + id;

            $('#gedungPendingSection').hidden = true;
            $('#gedungSelected').hidden = false;

            $('#gedungSelectedTitle').textContent =
                `${item.lokasi || '—'} · ` +
                `${item.kode || '—'}`;

            $('#gedungSelectedMeta').textContent =
                'Mode Edit — sumber transaksi dan ' +
                'organisasi tidak diubah.';

            $('#gedungChange').hidden = true;

            $('#gedungLokasi').value =
                item.lokasi || '';

            $('#gedungAlamat').value =
                item.alamat || '';

            $('#gedungDepartemen').value =
                item.departemen || '';

            $('#gedungDivisi').value =
                item.divisi || '';

            $('#gedungVoucher').value =
                item.nilai_aktiva_id
                    ? `Nilai Aset #${item.nilai_aktiva_id}`
                    : 'Data lama';

            [
                'id_barang',
                'kode',
                'reg',
                'asal',
                'kondisi',
                'konstruksi',
                'materi',
                'status',
                'luas',
                'luastanah',
                'kode_tanah',
                'no_imb',
                'guna',
                'ket'
            ].forEach(name => {
                const field = form.elements.namedItem(name);

                if (field) {
                    field.value = item[name] ?? '';
                }
            });

            form.elements.namedItem('tgl_imb').value =
                String(item.tgl_imb || '').slice(0, 10);

            close('gedungDetailDialog');

            open('gedungFormDialog');

        } catch (error) {
            alert(
                'Tidak bisa membuka edit: ' +
                error.message
            );
        }
    }

    // =====================================================
    // 23. RENDER RINCIAN NILAI GEDUNG
    // =====================================================

    function renderNilai() {
        const keyword = $('#gedungNilaiSearch')
            .value.trim()
            .toLowerCase();

        const values = nilaiItems.filter(item =>
            [
                item.kode_aktiva,
                item.nama_aktiva,
                item.no_voucher,
                item.urai,
                item.tahun,
                item.nilai
            ]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
        );

        $('#gedungNilaiBody').innerHTML =
            values.length
                ? values.map((item, index) => `
                    <tr>
                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${esc(item.kode_aktiva || '—')}
                        </td>

                        <td>
                            ${esc(item.nama_aktiva || '—')}
                        </td>

                        <td>
                            ${esc(fmtDate(item.tgl_voucher))}
                        </td>

                        <td>
                            ${esc(item.tahun || '—')}
                        </td>

                        <td>
                            <strong>
                                ${rupiah(item.nilai)}
                            </strong>
                        </td>

                        <td class="gedung-uraian">
                            ${esc(item.urai || '—')}
                        </td>

                        <td>
                            ${esc(item.no_voucher || '—')}
                        </td>
                    </tr>
                `).join('')
                : `
                    <tr>
                        <td colspan="8" class="gedung-empty">
                            Tidak ada rincian nilai yang cocok.
                        </td>
                    </tr>
                `;
    }

    // =====================================================
    // 24. DETAIL NILAI PER LOKASI
    // =====================================================

    async function showNilai(id, name) {
        $('#gedungNilaiTitle').textContent =
            'Detail Nilai — ' + name;

        $('#gedungNilaiAddress').textContent =
            'Memuat rincian...';

        $('#gedungNilaiBody').innerHTML = `
            <tr>
                <td colspan="8" class="gedung-empty">
                    Memuat transaksi...
                </td>
            </tr>
        `;

        $('#gedungNilaiSearch').value = '';

        open('gedungNilaiDialog');

        try {
            const data = await json(
                lokasiUrl(id) + '/nilai'
            );

            nilaiItems = data.data || [];

            $('#gedungNilaiAddress').textContent =
                data.lokasi.alamat || '—';

            $('#gedungNilaiTotal').textContent =
                rupiah(data.total);

            $('#gedungNilaiCount').textContent =
                format.format(data.count) +
                ' transaksi';

            renderNilai();

        } catch (error) {
            $('#gedungNilaiBody').innerHTML = `
                <tr>
                    <td colspan="8" class="gedung-empty">
                        ${esc(error.message)}
                    </td>
                </tr>
            `;
        }
    }

    $('#gedungNilaiSearch').addEventListener(
        'input',
        renderNilai
    );

    // =====================================================
    // 25. DAFTAR PDF GEDUNG
    // =====================================================

    async function showPdf(id, name) {
        $('#gedungPdfTitle').textContent =
            'Dokumen PDF — ' + name;

        $('#gedungPdfBody').innerHTML = `
            <tr>
                <td colspan="4" class="gedung-empty">
                    Memuat...
                </td>
            </tr>
        `;

        open('gedungPdfDialog');

        try {
            const response = await json(
                lokasiUrl(id)
            );

            const docs = (response.data || [])
                .filter(item =>
                    String(item.dok || '')
                        .toLowerCase()
                        .endsWith('.pdf')
                );

            $('#gedungPdfAddress').textContent =
                `${docs.length} dokumen terdaftar`;

            $('#gedungPdfBody').innerHTML =
                docs.length
                    ? docs.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>

                            <td>
                                ${esc(item.nama_barang || '—')}
                            </td>

                            <td>
                                ${esc(item.kode || '—')}
                            </td>

                            <td>
                                <a
                                    class="gedung-pdf-btn"
                                    href="${fileUrl(item.id, 'dokumen')}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i data-lucide="file-text"></i>
                                    Buka PDF
                                </a>
                            </td>
                        </tr>
                    `).join('')
                    : `
                        <tr>
                            <td colspan="4" class="gedung-empty">
                                Tidak ada dokumen PDF.
                            </td>
                        </tr>
                    `;

            icons();

        } catch (error) {
            $('#gedungPdfBody').textContent =
                'Gagal memuat PDF: ' +
                error.message;
        }
    }

    // =====================================================
    // 26. EVENT TOMBOL TABEL UTAMA
    // =====================================================

    $('#gedungTable').addEventListener(
        'click',
        event => {
            const target = event.target.closest('button');

            if (!target) return;

            // DETAIL NILAI
            if (target.dataset.nilaiLokasi) {
                return showNilai(
                    target.dataset.nilaiLokasi,
                    target.dataset.nama || ''
                );
            }

            // DAFTAR PDF
            if (target.dataset.pdfLokasi) {
                return showPdf(
                    target.dataset.pdfLokasi,
                    target.dataset.nama || ''
                );
            }

            // EDIT GEDUNG
            if (target.dataset.pilihEdit) {
                return showLokasi(
                    target.dataset.pilihEdit,
                    'edit'
                );
            }

            // HAPUS GEDUNG
            if (target.dataset.pilihHapus) {
                return showLokasi(
                    target.dataset.pilihHapus,
                    'delete'
                );
            }

            // DETAIL GEDUNG
            if (target.dataset.lokasi) {
                return showLokasi(
                    target.dataset.lokasi,
                    'view'
                );
            }
        }
    );

    // =====================================================
    // 27. INITIALISASI HALAMAN
    // =====================================================

    renderTable();

    icons();

    // Apabila terjadi error validasi dari Laravel,
    // buka kembali form dan pertahankan data lama.
    const hasErrors = !!$('.gedung-alert.danger');

    if (hasErrors) {
        const previous = new FormData(form);

        const previousVoucher =
            previous.get('id_nilai_aktiva');

        open('gedungFormDialog');

        loadPending().then(() => {
            if (previousVoucher) {
                const source = pending.find(item =>
                    String(item.id) ===
                    String(previousVoucher)
                );

                if (source) {
                    selection(source);
                }
            }
        });

    } else {
        loadPending();
    }
});
