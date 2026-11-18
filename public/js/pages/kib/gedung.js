
/*
|--------------------------------------------------------------------------
| K.I.B C — GEDUNG DAN BANGUNAN
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| TABEL UTAMA:
| No. | Lokasi | Alamat | Aksi
|
| FITUR:
| - Search dan Pagination
| - Export CSV
| - Data Nilai Aset Pending
| - Tambah Gedung
| - Detail Lokasi
| - Edit Gedung
| - Hapus Gedung
| - Rincian Nilai per Lokasi
| - Dokumen PDF
|
|--------------------------------------------------------------------------
*/

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const root = document.getElementById('gedungPage');

    if (!root || root.dataset.init === '1') return;

    root.dataset.init = '1';

    const $ = (selector, node = root) =>
        node.querySelector(selector);

    const $$ = (selector, node = root) =>
        [...node.querySelectorAll(selector)];

    const numberFormat = new Intl.NumberFormat('id-ID');

    const rupiah = value =>
        'Rp ' + numberFormat.format(Number(value) || 0);

    const esc = value =>
        String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);

    const icons = () =>
        window.lucide?.createIcons?.();

    const base = root.dataset.baseUrl;

    const url = id =>
        base + '/' + encodeURIComponent(id);

    const lokasiUrl = id =>
        base + '/lokasi/' + encodeURIComponent(id);

    const fileUrl = (id, type) =>
        url(id) + '/file/' + type;

    const fmtDate = value => {
        if (!value) return '—';

        const text = String(value).slice(0, 10);

        const match =
            /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

        return match
            ? `${match[3]}/${match[2]}/${match[1]}`
            : text;
    };

    /* ======================================================
       API LARAVEL
    ====================================================== */

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

    /* ======================================================
       MODAL
    ====================================================== */

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

    /* ======================================================
       TABEL UTAMA GEDUNG — EMPAT KOLOM
    ====================================================== */

    const rows = $$('.gedung-row');

    let page = 1;

    function filteredRows() {
        const keyword = $('#gedungSearch')
            .value.trim().toLowerCase();

        return rows.filter(row =>
            (row.dataset.search || '').includes(keyword)
        );
    }

    function renderTable() {
        const selected = filteredRows();

        const pageSize =
            Number($('#gedungPageSize').value) || 20;

        const pageCount = Math.max(
            1,
            Math.ceil(selected.length / pageSize)
        );

        page = Math.min(
            Math.max(1, page),
            pageCount
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

        const first = selected.length
            ? start + 1
            : 0;

        const last = Math.min(
            start + pageSize,
            selected.length
        );

        $('#gedungTableInfo').textContent =
            `Menampilkan ${first}–${last}` +
            ` dari ${selected.length} lokasi`;

        const pagination = $('#gedungPagination');

        pagination.replaceChildren();

        if (pageCount <= 1) return;

        function addButton(
            title,
            target,
            disabled = false
        ) {
            const button = document.createElement('button');

            button.type = 'button';
            button.textContent = title;
            button.disabled = disabled;

            if (
                target === page &&
                /^\d+$/.test(title)
            ) {
                button.classList.add('active');

                button.setAttribute(
                    'aria-current',
                    'page'
                );
            }

            button.addEventListener('click', () => {
                page = target;
                renderTable();
            });

            pagination.appendChild(button);
        }

        function dots() {
            const span = document.createElement('span');
            span.textContent = '…';
            pagination.appendChild(span);
        }

        addButton('‹', page - 1, page === 1);

        const pageNumbers = new Set([
            1,
            pageCount
        ]);

        for (
            let value = Math.max(1, page - 2);
            value <= Math.min(pageCount, page + 2);
            value++
        ) {
            pageNumbers.add(value);
        }

        let previous = 0;

        [...pageNumbers]
            .sort((a, b) => a - b)
            .forEach(value => {
                if (previous && value - previous > 1) {
                    dots();
                }

                addButton(String(value), value);
                previous = value;
            });

        addButton(
            '›',
            page + 1,
            page === pageCount
        );
    }

    /* ======================================================
       PENCARIAN DAN RESET
    ====================================================== */

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

    /* ======================================================
       EXPORT CSV
       NO | LOKASI | ALAMAT
    ====================================================== */

    $('#gedungExport').addEventListener('click', () => {
        const data = [[
            'No',
            'Lokasi',
            'Alamat',
            'Status Kepemilikan'
        ]];

        filteredRows().forEach((row, index) => {
            data.push([
                index + 1,
                row.dataset.exportLokasi || '',
                row.dataset.exportAlamat || '',
                row.dataset.exportStatus || 'belum_diatur'
            ]);
        });

        const csv = '\uFEFF' + data
            .map(row =>
                row.map(value => {
                    let text = String(value ?? '');

                    // Hindari formula Excel dari isi CSV.
                    if (/^\s*[=+@-]/.test(text)) {
                        text = "'" + text;
                    }

                    return '"' +
                        text.replaceAll('"', '""') +
                        '"';
                }).join(';')
            )
            .join('\r\n');

        const blobUrl = URL.createObjectURL(
            new Blob([csv], {
                type: 'text/csv;charset=utf-8'
            })
        );

        const link = document.createElement('a');

        link.href = blobUrl;
        link.download = 'kib-gedung-bangunan.csv';

        document.body.appendChild(link);

        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 500);
    });

    /* ======================================================
       STATE DATA
    ====================================================== */

    let pending = [];
    let selectedId = null;

    let detailItems = [];
    let detailMode = 'view';

    // Lokasi yang saat ini dibuka dalam popup detail.
    let activeLocation = null;

    let nilaiItems = [];

    const form = $('#gedungForm');

    /* ======================================================
       PILIH VOUCHER
    ====================================================== */

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

        renderPending();
    }

    /* ======================================================
       TABEL TRANSAKSI PENDING
    ====================================================== */

    function renderPending() {
        const keyword = $('#gedungPendingSearch')
            .value.trim().toLowerCase();

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
            numberFormat.format(matches.length) +
            ' data';

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
                                <b>${esc(item.lokasi || '—')}</b>
                                <small>${esc(item.alamat || '')}</small>
                            </td>

                            <td>
                                ${esc(item.departemen || '—')}
                            </td>

                            <td>${esc(item.divisi || '—')}</td>
                            <td>${esc(item.tahun || '—')}</td>

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

    /* ======================================================
       LOAD DATA PENDING
    ====================================================== */

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
                    numberFormat.format(
                        Number(data.count ?? pending.length)
                    );
            });

            renderPending();

        } catch (error) {
            $('#gedungPendingBody').innerHTML = `
                <tr>
                    <td colspan="9" class="gedung-empty">
                        ${esc(error.message)}
                        — periksa server.
                    </td>
                </tr>
            `;
        }
    }

    $('#gedungPendingSearch').addEventListener(
        'input',
        renderPending
    );

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

    /* ======================================================
       GANTI VOUCHER
    ====================================================== */

    $('#gedungChange').addEventListener('click', () => {
        // Voucher sumber tidak boleh diganti ketika Edit.
        if (!$('#gedungMethod').disabled) return;

        $('#gedungPendingSection').hidden = false;
        $('#gedungPendingSearch').value = '';

        renderPending();

        $('#gedungPendingSearch').focus();
    });

    /* ======================================================
       SEARCHABLE DROPDOWN FORM GEDUNG
       Select asli tetap mengirimkan value/ID ke Laravel.
       Menu dipasang di dalam dialog (top layer), bukan body.
    ====================================================== */

    const gedungCombos = new Map();

    function syncGedungCombos() {
        gedungCombos.forEach(combo => combo.sync());
    }

    function enhanceGedungSelect(select) {
        if (!select || select.dataset.searchEnhanced === '1') return;
        select.dataset.searchEnhanced = '1';

        const required = select.required;
        select.required = false;
        select.classList.add('gedung-combo-original');

        const wrapper = document.createElement('div');
        wrapper.className = 'gedung-combo';

        const input = document.createElement('input');
        input.type = 'search';
        input.className = 'gedung-combo-input';
        input.placeholder = 'Ketik untuk mencari pilihan...';
        input.autocomplete = 'off';
        input.required = required;
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');

        const menu = document.createElement('div');
        menu.className = 'gedung-combo-menu';
        menu.setAttribute('role', 'listbox');
        menu.hidden = true;

        select.parentNode.insertBefore(wrapper, select);
        wrapper.append(input, select);

        // Ditempatkan di top-layer dialog supaya tidak tertutup overlay.
        const dialog = select.closest('dialog');
        (dialog || document.body).append(menu);

        let visible = [];
        let active = -1;

        function selectable() {
            return [...select.options].filter(option =>
                option.value && !option.disabled && !option.hidden
            );
        }

        function selectedText() {
            const selected = select.selectedOptions[0];
            return selected?.value
                ? selected.textContent.trim().replace(/\s+/g, ' ')
                : '';
        }

        function position() {
            if (menu.hidden) return;
            const r = input.getBoundingClientRect();
            const below = window.innerHeight - r.bottom;
            const h = Math.min(250, Math.max(58, visible.length * 38 + 8));
            const above = below < Math.min(190, h) && r.top > below;
            const maxHeight = above ? r.top - 16 : below - 16;
            menu.style.left = `${Math.round(r.left)}px`;
            menu.style.width = `${Math.round(r.width)}px`;
            menu.style.top = `${Math.round(above ? r.top - Math.min(h, maxHeight) - 4 : r.bottom + 4)}px`;
            menu.style.maxHeight = `${Math.max(80, maxHeight)}px`;
        }

        function closeMenu() {
            menu.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            active = -1;
        }

        function sync() {
            input.value = selectedText();
            input.setCustomValidity(required && !select.value
                ? 'Pilih data dari daftar yang tersedia.' : '');
            if (!menu.hidden) render('', true);
        }

        function choose(option) {
            if (!option || option.disabled || option.hidden) return;
            select.value = option.value;
            closeMenu();
            input.value = selectedText();
            input.setCustomValidity('');
            select.dispatchEvent(new Event('change', {bubbles: true}));
            input.focus();
        }

        function render(keyword = '', showAll = false) {
            const q = String(keyword).trim().toLocaleLowerCase('id-ID');
            visible = selectable().filter(option =>
                showAll || option.textContent.toLocaleLowerCase('id-ID').includes(q)
            ).slice(0, 100);
            menu.replaceChildren();
            if (!visible.length) {
                const empty = document.createElement('div');
                empty.className = 'gedung-combo-empty';
                empty.textContent = 'Tidak ada pilihan yang sesuai.';
                menu.append(empty);
            }
            visible.forEach((option, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'gedung-combo-option';
                btn.textContent = option.textContent.trim().replace(/\s+/g, ' ');
                btn.setAttribute('role', 'option');
                btn.addEventListener('pointerdown', e => e.preventDefault());
                btn.addEventListener('click', () => choose(option));
                menu.append(btn);
            });
            active = -1;
            menu.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            position();
        }

        input.addEventListener('focus', () => render('', true));
        input.addEventListener('click', () => render('', true));
        input.addEventListener('input', () => {
            select.value = '';
            select.dispatchEvent(new Event('change', {bubbles: true}));
            input.setCustomValidity(required ? 'Pilih data dari daftar.' : '');
            render(input.value);
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeMenu();
                input.value = selectedText();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (menu.hidden) render('', true);
                if (!visible.length) return;
                active = e.key === 'ArrowDown'
                    ? Math.min(visible.length - 1, active + 1)
                    : Math.max(0, active - 1);
                menu.querySelectorAll('.gedung-combo-option')
                    .forEach((row, i) => row.classList.toggle('is-focused', i === active));
            }
            if (e.key === 'Enter' && !menu.hidden && visible[active]) {
                e.preventDefault();
                choose(visible[active]);
            }
            if (e.key === 'Tab') closeMenu();
        });
        // Jangan timpa teks yang sedang diketik oleh event change kosong.
        select.addEventListener('change', () => {
            if (select.value || document.activeElement !== input) sync();
        });
        document.addEventListener('pointerdown', event => {
            if (!wrapper.contains(event.target) && !menu.contains(event.target)) closeMenu();
        });
        document.addEventListener('scroll', position, true);
        window.addEventListener('resize', position);
        gedungCombos.set(select.name, {sync, closeMenu, select, input});
        sync();
    }

    form.querySelectorAll('select[name]').forEach(enhanceGedungSelect);

    /* ======================================================
       RESET FORM
    ====================================================== */

    function resetForm() {
        form.querySelectorAll('option[data-gedung-history="1"]').forEach(option => option.remove());
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
        syncGedungCombos();
    }

    /* ======================================================
       TAMBAH GEDUNG
    ====================================================== */

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

    form.addEventListener('submit', event => {
        const creating = $('#gedungMethod').disabled;

        // Input search yang belum dipilih tidak boleh menyimpan ID lama.
        for (const combo of gedungCombos.values()) {
            if (combo.input.required && !combo.select.value) {
                event.preventDefault();
                combo.input.setCustomValidity('Pilih pilihan dari daftar.');
                combo.input.reportValidity();
                combo.input.focus();
                return;
            }
        }

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

    /* ======================================================
       K.I.B C MODEL EXCEL — SESUAI FORMAT LAPORAN PERUSAHAAN
       18 kolom Excel + Status Kepemilikan + kolom Berkas.
    ====================================================== */

    const OWNER_LABELS = {
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    };

    const ownerLabel = value => OWNER_LABELS[String(value || '').trim().toLowerCase()] || 'Belum Diatur';
    const safe = value => esc(String(value ?? '').trim() || '—');
    const dateYear = value => /^\d{4}/.test(String(value || '')) ? String(value).slice(0, 4) : '—';
    const normalize = value => String(value ?? '').trim().toLocaleLowerCase('id-ID');
    const currency = value => value === null || value === undefined || value === ''
        ? '—' : rupiah(value);

    function displayFocus(item) {
        const pane = $('#gedungDetailFocus');
        pane.hidden = false;
        const status = ownerLabel(item.status_kepemilikan);

        pane.innerHTML = `
            <div class="gedung-focus-heading">
                <div>
                    <small>LAMPIRAN & TINDAKAN</small>
                    <h3>${safe(item.nama_barang || 'Gedung dan Bangunan')}</h3>
                    <p>Kode ${safe(item.kode)} · Register ${safe(item.reg)} · ${esc(status)}</p>
                </div>
                <div class="gedung-focus-actions">
                    <button type="button" class="gedung-btn outline" data-edit="${Number(item.id)}">
                        <i data-lucide="square-pen"></i> Edit
                    </button>
                    <button type="button" class="gedung-btn danger" data-delete="${Number(item.id)}">
                        <i data-lucide="trash-2"></i> Hapus
                    </button>
                    <button type="button" class="gedung-btn outline" data-hide-focus>
                        <i data-lucide="chevron-up"></i> Tutup Berkas
                    </button>
                </div>
            </div>
            <div class="gedung-focus-grid">
                <div class="gedung-focus-card">
                    <strong><i data-lucide="image"></i> Foto Gedung</strong>
                    ${item.img ? `
                        <a href="${fileUrl(item.id, 'foto')}" target="_blank" rel="noopener noreferrer">
                            <img src="${fileUrl(item.id, 'foto')}" alt="Foto ${safe(item.nama_barang)}" loading="lazy">
                        </a>` : '<div class="gedung-focus-placeholder">Foto belum tersedia.</div>'}
                </div>
                <div class="gedung-focus-card">
                    <strong><i data-lucide="file-text"></i> Dokumen PDF / IMB</strong>
                    ${item.dok ? `
                        <a class="gedung-btn outline" href="${fileUrl(item.id, 'dokumen')}"
                           target="_blank" rel="noopener noreferrer">
                            <i data-lucide="eye"></i> Lihat Dokumen PDF
                        </a>` : '<div class="gedung-focus-placeholder">Dokumen belum tersedia.</div>'}
                    <p>Dokumen: ${safe(item.no_imb)} · ${esc(fmtDate(item.tgl_imb))}</p>
                </div>
            </div>
        `;
        icons();
        $('#gedungDetailItems').querySelectorAll('[data-gedung-row]')
            .forEach(row => row.classList.toggle('is-selected', row.dataset.gedungRow === String(item.id)));
        pane.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }

    function renderDetailList() {
        const dep = $('#gedungDetailDep').value;
        const div = $('#gedungDetailDiv').value;
        const keyword = normalize($('#gedungDetailSearch').value);
        const items = detailItems.filter(item => {
            const relation = (!dep || String(item.id_departemen) === dep) &&
                (!div || String(item.id_div) === div);
            const searchable = [item.nama_barang, item.kode, item.reg,
                item.alamat_detail, activeLocation?.name, item.no_imb,
                item.ket, item.departemen, item.divisi, item.status_kepemilikan]
                .join(' ').toLocaleLowerCase('id-ID');
            return relation && (!keyword || searchable.includes(keyword));
        });

        $('#gedungDetailCount').textContent = `${items.length} data`;
        $('#gedungDetailFocus').hidden = true;
        const head = `
          <div class="gedung-excel-scroll" role="region" tabindex="0"
               aria-label="Tabel K.I.B C Gedung dan Bangunan">
          <table class="gedung-excel-table">
            <thead>
              <tr class="gedung-excel-head">
                <th rowspan="2">No.</th>
                <th rowspan="2">Nama Barang / Jenis Barang</th>
                <th colspan="2">Nomor</th>
                <th rowspan="2">Kondisi Bangunan</th>
                <th colspan="2">Konstruksi Bangunan</th>
                <th rowspan="2">Luas Lantai (m²)</th>
                <th rowspan="2">Letak / Alamat</th>
                <th colspan="2">Dokumen Gedung</th>
                <th rowspan="2">Luas Tanah (m²)</th>
                <th rowspan="2">Status Tanah</th>
                <th rowspan="2">Nomor Kode Tanah</th>
                <th rowspan="2">Asal Usul</th>
                <th rowspan="2">Harga (Rp.)</th>
                <th rowspan="2">Sumber Dana</th>
                <th rowspan="2">Keterangan</th>
                <th rowspan="2">Status Kepemilikan</th>
                <th rowspan="2">Berkas</th>
              </tr>
              <tr class="gedung-excel-subhead">
                <th>Kode Barang</th><th>Register</th>
                <th>Bertingkat / Tidak</th><th>Beton / Tidak</th>
                <th>Tahun</th><th>Nomor</th>
              </tr>
            </thead>
            <tbody>
              ${items.length ? items.map((item, i) => {
                const status = ownerLabel(item.status_kepemilikan);
                const actionText = detailMode === 'delete' ? 'Hapus'
                    : detailMode === 'edit' ? 'Edit' : 'Berkas';
                const actionAttr = detailMode === 'delete' ? 'data-delete'
                    : detailMode === 'edit' ? 'data-edit' : 'data-focus';
                const actionClass = detailMode === 'delete' ? ' danger' : ' outline';
                const nilai = item.nilai_transaksi ?? item.nilai;
                return `<tr data-gedung-row="${Number(item.id)}">
                    <td class="gedung-excel-index">${i + 1}</td>
                    <td class="gedung-excel-name">${safe(item.nama_barang)}</td>
                    <td>${safe(item.kode)}</td>
                    <td>${safe(item.reg)}</td>
                    <td>${safe(item.kondisi)}</td>
                    <td>${safe(item.konstruksi)}</td>
                    <td>${safe(item.materi)}</td>
                    <td>${safe(item.luas)}</td>
                    <td>${safe(item.alamat_detail || activeLocation?.name)}</td>
                    <td>${esc(dateYear(item.tgl_imb))}</td>
                    <td>${safe(item.no_imb)}</td>
                    <td>${safe(item.luastanah)}</td>
                    <td>${safe(item.status)}</td>
                    <td>${safe(item.kode_tanah)}</td>
                    <td>${safe(item.asal)}</td>
                    <td class="gedung-excel-money">${esc(currency(nilai))}</td>
                    <td>${safe(item.sumber_dana)}</td>
                    <td>${safe(item.ket)}</td>
                    <td><span class="gedung-owner-badge ${status === 'Belum Diatur' ? 'is-unknown' : ''}">${esc(status)}</span></td>
                    <td><button type="button" class="gedung-btn${actionClass}"
                        ${actionAttr}="${Number(item.id)}">${esc(actionText)}</button></td>
                </tr>`;
              }).join('') : '<tr><td colspan="20" class="gedung-excel-empty">Tidak ada data sesuai filter.</td></tr>'}
            </tbody>
          </table></div>`;
        $('#gedungDetailItems').innerHTML = head;
        icons();
    }

    /* ======================================================
       FILTER DEPARTEMEN DAN DIVISI
    ====================================================== */

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
            <option value="">Semua Departemen</option>
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
                <option value="">Semua Divisi</option>
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

    $('#gedungDetailSearch').addEventListener('input', renderDetailList);

    /* ======================================================
       DETAIL LOKASI
    ====================================================== */

    async function showLokasi(lokasiId, mode = 'view') {
        detailMode = mode;

        activeLocation = {
            id: lokasiId,
            name: ''
        };

        $('#gedungDetailTitle').textContent =
            mode === 'edit'
                ? 'Pilih Gedung untuk Edit'
                : mode === 'delete'
                    ? 'Pilih Gedung untuk Hapus'
                    : 'Detail Gedung dan Bangunan';

        $('#gedungDetailAddress').textContent =
            'Memuat lokasi dan daftar bangunan...';

        $('#gedungDetailSearch').value = '';
        $('#gedungDetailCount').textContent = 'Memuat...';
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

            activeLocation.name =
                data.lokasi?.lokasi || '';

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

    /* ======================================================
       EVENT MODAL DETAIL
    ====================================================== */

    $('#gedungDetailItems').addEventListener(
        'click',
        event => {
            const focus = event.target.closest(
                '[data-focus]'
            );

            if (focus) {
                const item = detailItems.find(row =>
                    String(row.id) === focus.dataset.focus
                );

                if (item) displayFocus(item);

                return;
            }

            const edit = event.target.closest(
                '[data-edit]'
            );

            if (edit) {
                editGedung(edit.dataset.edit);
                return;
            }

            const del = event.target.closest(
                '[data-delete]'
            );

            if (!del) {
                const selectedRow = event.target.closest('[data-gedung-row]');
                if (selectedRow) {
                    const selectedItem = detailItems.find(row =>
                        String(row.id) === selectedRow.dataset.gedungRow);
                    if (selectedItem) displayFocus(selectedItem);
                }
                return;
            }

            const item = detailItems.find(row =>
                String(row.id) === del.dataset.delete
            );

            if (!item) return;

            const confirmed = confirm(
                `Hapus hanya inventaris "` +
                `${item.nama_barang || item.kode}"?\n` +
                `Lokasi dan transaksi Nilai Aset ` +
                `tidak dihapus.`
            );

            if (!confirmed) return;

            const deleteForm = $('#gedungDeleteForm');

            deleteForm.action = url(item.id);
            deleteForm.submit();
        }
    );

    $('#gedungDetailFocus').addEventListener('click', event => {
        if (event.target.closest('[data-hide-focus]')) {
            $('#gedungDetailFocus').hidden = true;
            return;
        }
        const edit = event.target.closest('[data-edit]');
        if (edit) {
            editGedung(edit.dataset.edit);
            return;
        }
        const del = event.target.closest('[data-delete]');
        if (!del) return;
        const item = detailItems.find(row => String(row.id) === del.dataset.delete);
        if (!item) return;
        if (!confirm(`Hapus inventaris "${item.nama_barang || item.kode}"?\nData lokasi dan Nilai Aset tidak ikut dihapus.`)) return;
        const deleteForm = $('#gedungDeleteForm');
        deleteForm.action = url(item.id);
        deleteForm.submit();
    });

    /* ======================================================
       EDIT DATA GEDUNG
    ====================================================== */

    async function editGedung(id) {
        try {
            const response = await json(
                url(id)
            );

            const item = response.data;

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

            // Referensi Barang nonaktif yang digunakan data lama
            // tetap terlihat saat Edit, tanpa tersedia pada Tambah.
            const barangSelect = form.elements.namedItem('id_barang');
            if (barangSelect && item.id_barang &&
                ![...barangSelect.options].some(option => option.value === String(item.id_barang))) {
                const historical = document.createElement('option');
                historical.value = String(item.id_barang);
                historical.textContent = `${item.nama_barang || 'Barang lama'} (referensi historis)`;
                historical.dataset.gedungHistory = '1';
                barangSelect.append(historical);
            }

            [
                'id_barang',
                'kode',
                'reg',
                'asal',
                'kondisi',
                'konstruksi',
                'materi',
                'status',
                'status_kepemilikan',
                'sumber_dana',
                'luas',
                'luastanah',
                'kode_tanah',
                'no_imb',
                'guna',
                'ket'
            ].forEach(name => {
                const input = form.elements.namedItem(name);

                if (input) {
                    input.value = item[name] ?? '';
                }
            });

            form.elements.namedItem('tgl_imb').value =
                String(item.tgl_imb || '').slice(0, 10);
            // Sinkronisasi tampilan searchable setelah isi Edit.
            syncGedungCombos();

            close('gedungDetailDialog');
            open('gedungFormDialog');

        } catch (error) {
            alert(
                'Tidak bisa membuka edit: ' +
                error.message
            );
        }
    }

    /* ======================================================
       RINCIAN NILAI GEDUNG
    ====================================================== */

    function renderNilai() {
        const keyword = $('#gedungNilaiSearch')
            .value.trim().toLowerCase();

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
                        <td>${index + 1}</td>

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

            nilaiItems = Array.isArray(data.data)
                ? data.data
                : [];

            $('#gedungNilaiAddress').textContent =
                data.lokasi?.alamat || '—';

            $('#gedungNilaiTotal').textContent =
                rupiah(data.total);

            $('#gedungNilaiCount').textContent =
                numberFormat.format(data.count || 0) +
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

    /* ======================================================
       DOKUMEN PDF PER LOKASI
    ====================================================== */

    async function showPdf(id, name) {
        $('#gedungPdfTitle').textContent =
            'Dokumen PDF — ' + name;

        $('#gedungPdfBody').innerHTML = `
            <tr>
                <td colspan="4" class="gedung-empty">
                    Memuat dokumen...
                </td>
            </tr>
        `;

        open('gedungPdfDialog');

        try {
            const response = await json(
                lokasiUrl(id)
            );

            const documents = (response.data || [])
                .filter(item =>
                    String(item.dok || '')
                        .toLowerCase()
                        .endsWith('.pdf')
                );

            $('#gedungPdfAddress').textContent =
                `${documents.length} dokumen terdaftar`;

            $('#gedungPdfBody').innerHTML =
                documents.length
                    ? documents.map((item, index) => `
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

    /* ======================================================
       NILAI DAN PDF SEKARANG DI POPUP DETAIL
    ====================================================== */

    $('#gedungDetailNilai').addEventListener(
        'click',
        () => {
            if (!activeLocation) return;

            showNilai(
                activeLocation.id,
                activeLocation.name
            );
        }
    );

    $('#gedungDetailPdf').addEventListener(
        'click',
        () => {
            if (!activeLocation) return;

            showPdf(
                activeLocation.id,
                activeLocation.name
            );
        }
    );

    /* ======================================================
       AKSI TABEL UTAMA
    ====================================================== */

    $('#gedungTable').addEventListener(
        'click',
        event => {
            const target = event.target.closest('button');

            if (!target) return;

            // EDIT BERDASARKAN LOKASI
            if (target.dataset.pilihEdit) {
                showLokasi(
                    target.dataset.pilihEdit,
                    'edit'
                );
                return;
            }

            // HAPUS BERDASARKAN LOKASI
            if (target.dataset.pilihHapus) {
                showLokasi(
                    target.dataset.pilihHapus,
                    'delete'
                );
                return;
            }

            // DETAIL LOKASI
            if (target.dataset.lokasi) {
                showLokasi(
                    target.dataset.lokasi,
                    'view'
                );
            }
        }
    );

    /* ======================================================
       INITIALIZATION
    ====================================================== */

    renderTable();

    icons();

    const hasErrors = !!$('.gedung-alert.danger');

    if (hasErrors) {
        const previous = new FormData(form);

        const voucherId =
            previous.get('id_nilai_aktiva');

        open('gedungFormDialog');

        loadPending().then(() => {
            if (voucherId) {
                const source = pending.find(item =>
                    String(item.id) ===
                    String(voucherId)
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