
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

        // Hindari mencetak lokasi lama saat permintaan Detail baru sedang dimuat.
        const reportButton = $('#gedungDetailReport');
        if (reportButton) {
            reportButton.disabled = true;
            delete reportButton.dataset.lokasiId;
        }

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

            const reportButton = $('#gedungDetailReport');
            if (reportButton) {
                reportButton.disabled = detailItems.length === 0;
                reportButton.dataset.lokasiId = String(lokasiId);
            }

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
/* ==========================================================================
   K.I.B C — PRINT EXCEL GEDUNG DAN BANGUNAN PER LOKASI
   Acuan UI: K.I.B A Tanah | Acuan kolom: KIB C.jpeg (18 kolom).
   Tetap SATU file gedung.js; tidak mengubah CRUD/Detail/PDF.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const page = document.getElementById('gedungPage');
    const dialog = document.getElementById('gedungReportDialog');
    if (!page || !dialog || !page.dataset.reportBaseUrl) return;

    const $ = selector => dialog.querySelector(selector);
    const form = $('#gedungReportForm');
    const month = $('#gedungReportPeriod');
    const info = $('#gedungReportInfo');
    const previewBox = $('#gedungReportPreviewBox');
    const preview = $('#gedungReportPreview');
    const download = $('#gedungReportDownload');
    const print = $('#gedungReportPrint');
    const datalist = $('#gedungReportStaff');
    const scope = $('#gedungReportScope');
    const roles = [
        ['diketahui', 'Diketahui oleh'],
        ['periksa_1', 'Diperiksa oleh (1)'],
        ['periksa_2', 'Diperiksa oleh (2)'],
        ['dibuat', 'Dibuat oleh'],
    ];
    const state = { lokasi: null, organisasi: {}, data: [], sdm: [] };
    let requestVersion = 0;

    const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const cell = v => {
        const text = String(v ?? '').trim();
        return text && text !== 'null' ? text : '-';
    };
    const periodName = () => {
        if (!/^\d{4}-\d{2}$/.test(month.value)) return '';
        const [year, m] = month.value.split('-').map(Number);
        if (m < 1 || m > 12) return '';
        return new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long',
            timeZone: 'Asia/Makassar' }).format(new Date(Date.UTC(year, m-1, 1))).toUpperCase();
    };
    const dateName = () => new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar'
    }).format(new Date());
    const yearOf = v => {
        if (!v) return '-';
        const m = String(v).match(/^(\d{4})/);
        return m ? m[1] : cell(v);
    };
    const money = n => {
        if (n === null || n === undefined || String(n).trim() === '') return '-';
        const num = Number(n);
        return Number.isFinite(num) ? new Intl.NumberFormat('id-ID').format(num) : cell(n);
    };
    const staffLabel = p => `${p.nama} — ${p.jabatan || 'Jabatan -'} — ${p.nip || 'NIP -'} (#${p.id})`;
    const chosen = key => {
        const label = $(`[data-gedung-report-role="${key}"]`)?.value.trim();
        return state.sdm.find(p => staffLabel(p) === label) || null;
    };
    const ready = () => Boolean(periodName() && state.data.length && roles.every(([key]) => chosen(key)));
    const columns = [
        'No.', 'Nama Barang / Jenis Barang', 'Kode Barang', 'Register',
        'Kondisi Bangunan', 'Bertingkat / Tidak', 'Beton / Tidak',
        'Luas Lantai (M2)', 'Letak / Lokasi Alamat',
        'Tahun Perolehan', 'Nomor Dokumen', 'Luas (M2)',
        'Status Tanah', 'Nomor Kode Tanah', 'Asal Usul',
        'Harga (Rp)', 'Sumber Dana', 'Keterangan'
    ];
    const groups = [
        { first: 3, last: 4, title: 'NOMOR' },
        { first: 6, last: 7, title: 'KONSTRUKSI BANGUNAN' },
        { first: 10, last: 11, title: 'DOKUMEN GEDUNG' },
    ];
    const rows = () => state.data.map((g, i) => [
        i+1, g.nama_barang, g.kode || g.kode_barang, g.reg, g.kondisi,
        g.konstruksi, g.materi, g.luas,
        g.alamat_detail || state.lokasi?.alamat || state.lokasi?.nama,
        yearOf(g.tgl_imb), g.no_imb, g.luastanah,
        g.status, g.kode_tanah, g.asal,
        money(g.nilai_transaksi ?? g.nilai), g.sumber_dana, g.ket
    ].map(cell));
    const meta = () => {
        const o = state.organisasi || {};
        return [
            ['PROVINSI', o.provinsi || 'KALIMANTAN TIMUR'],
            ['KOTA', o.kota || 'SAMARINDA'],
            ['UNIT', o.unit || 'PERUMDA TIRTA KENCANA'],
            ['DEPARTEMEN', o.departemen || '-'],
            ['DIVISI', o.divisi || '-'],
            ['LOKASI', state.lokasi?.nama || '-'],
            ['NO KODE STRUKTUR', o.kode_struktur || '-'],
        ];
    };
    const title = () => 'C. GEDUNG DAN BANGUNAN';

    function tableHead() {
        let first = '';
        let second = '';
        for (let n = 1; n <= columns.length; n++) {
            const group = groups.find(g => g.first === n);
            if (group) {
                first += `<th colspan="${group.last - group.first + 1}">${escapeHtml(group.title)}</th>`;
                for (let c = group.first; c <= group.last; c++) {
                    second += `<th>${escapeHtml(columns[c-1])}</th>`;
                }
            } else if (!groups.some(g => n > g.first && n <= g.last)) {
                first += `<th rowspan="2">${escapeHtml(columns[n-1])}</th>`;
            }
        }
        return `<tr>${first}</tr><tr>${second}</tr><tr>${columns.map((_, i) =>
            `<th>${i+1}</th>`).join('')}</tr>`;
    }

    function paperHtml() {
        const body = rows().map(row => `<tr>${row.map(value =>
            `<td>${escapeHtml(cell(value))}</td>`).join('')}</tr>`).join('');
        const metadata = meta().map(([key, value]) => `<div><b>${escapeHtml(key)}</b><span>: ${escapeHtml(cell(value))}</span></div>`).join('');
        const signatures = roles.map(([key, label]) => {
            const person = chosen(key);
            return `<div class="gedung-report-signature"><b>${escapeHtml(label)},</b>
                <span>${escapeHtml(cell(person?.jabatan))}</span>
                <u>${escapeHtml(cell(person?.nama))}</u>
                <span>NIP. ${escapeHtml(cell(person?.nip))}</span></div>`;
        }).join('');
        return `<article class="gedung-report-paper">
            <div class="gedung-report-kop">
                <img src="${escapeHtml(page.dataset.reportLogo)}" alt="Logo horizontal Perumda Tirta Kencana">
                <div class="gedung-report-kop-title">
                    <strong>KARTU INVENTARIS BARANG (K.I.B)</strong>
                    <strong>${escapeHtml(title)}</strong>
                    <strong>PERIODE ${escapeHtml(periodName())}</strong>
                </div>
            </div>
            <div class="gedung-report-meta">${metadata}</div>
            <div class="gedung-report-table-scroll"><table class="gedung-report-table">
                <thead>${tableHead()}</thead><tbody>${body}</tbody>
            </table></div>
            <div class="gedung-report-date">Samarinda, ${escapeHtml(dateName())}</div>
            <div class="gedung-report-signatures">${signatures}</div>
        </article>`;
    }

    function updatePreview() {
        const ok = ready();
        print.disabled = download.disabled = !ok;
        previewBox.hidden = !ok;
        if (!ok) preview.replaceChildren();
        if (!state.data.length) {
            info.textContent = 'Belum ada data Gedung pada lokasi ini atau data masih dimuat.';
        } else if (!ok) {
            info.textContent = `${state.data.length} data Gedung siap. Pilih periode dan 4 penandatangan dari Master SDM.`;
        } else {
            info.textContent = `Preview siap: ${state.data.length} data Gedung di lokasi ${state.lokasi?.nama || '-'}. Status Kepemilikan tidak dicetak.`;
            $('#gedungReportCount').textContent = `${state.data.length} gedung`;
            preview.innerHTML = paperHtml();
        }
    }

    async function openReport(lokasiId) {
        const version = ++requestVersion;
        state.data = [];
        state.sdm = [];
        state.lokasi = null;
        state.organisasi = {};
        form.reset();
        datalist.replaceChildren();
        const parts = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric', month: '2-digit', timeZone: 'Asia/Makassar'
        }).formatToParts(new Date());
        month.value = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
        scope.textContent = 'Memuat seluruh Gedung pada lokasi yang dipilih...';
        info.textContent = 'Memuat sumber laporan dan Master SDM Pendukung...';
        updatePreview();
        dialog.showModal();
        window.lucide?.createIcons?.();
        try {
            const url = `${page.dataset.reportBaseUrl}/${encodeURIComponent(lokasiId)}/laporan`;
            const response = await fetch(url, { credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            const json = await response.json();
            if (!response.ok || !json.success || !Array.isArray(json.data)) {
                throw new Error(json.message || `HTTP ${response.status}`);
            }
            if (!dialog.open || version !== requestVersion) return;
            state.data = json.data;
            state.sdm = Array.isArray(json.sdm) ? json.sdm : [];
            state.lokasi = json.lokasi || null;
            state.organisasi = json.organisasi || {};
            scope.textContent = `Seluruh gedung di lokasi ${state.lokasi?.nama || '-'} · ${state.data.length} data`;
            datalist.replaceChildren(...state.sdm.map(p => {
                const option = document.createElement('option');
                option.value = staffLabel(p);
                return option;
            }));
            if (!state.sdm.length) info.textContent = 'SDM aktif tidak ditemukan di Master SDM Pendukung.';
            else updatePreview();
        } catch (error) {
            if (!dialog.open || version !== requestVersion) return;
            console.error('K.I.B C Print Excel gagal memuat laporan:', error);
            info.textContent = `Gagal memuat laporan: ${error.message}`;
        }
    }

    document.getElementById('gedungDetailReport')?.addEventListener('click', () => {
        // Tombol hanya aktif ketika Detail berhasil dibuka.
        const button = document.getElementById('gedungDetailReport');
        const id = Number(button?.dataset?.lokasiId);
        if (Number.isSafeInteger(id) && id > 0) openReport(id);
    });
    dialog.querySelectorAll('[data-gedung-report-close]').forEach(button => {
        button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('close', () => { requestVersion++; });
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', updatePreview);

    function reportZip(entries) {
        const encoder = new TextEncoder();
        const crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let bit = 0; bit < 8; bit++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            crcTable[n] = c >>> 0;
        }
        const crc32 = bytes => {
            let crc = 0xFFFFFFFF;
            for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
            return (crc ^ 0xFFFFFFFF) >>> 0;
        };
        const bytesOf = value => value instanceof Uint8Array ? value : encoder.encode(value);
        const localParts = [];
        const centralParts = [];
        let offset = 0;
        let centralLength = 0;
        const write16 = (view, pos, val) => view.setUint16(pos, val, true);
        const write32 = (view, pos, val) => view.setUint32(pos, val >>> 0, true);

        for (const entry of entries) {
            const nameBytes = encoder.encode(entry.name);
            const data = bytesOf(entry.data);
            const checksum = crc32(data);
            const local = new Uint8Array(30 + nameBytes.length);
            const l = new DataView(local.buffer);
            write32(l, 0, 0x04034B50);
            write16(l, 4, 20);
            write16(l, 6, 0x0800); // UTF-8
            write16(l, 8, 0);      // stored/no compression
            write32(l, 14, checksum);
            write32(l, 18, data.length);
            write32(l, 22, data.length);
            write16(l, 26, nameBytes.length);
            local.set(nameBytes, 30);
            localParts.push(local, data);

            const central = new Uint8Array(46 + nameBytes.length);
            const c = new DataView(central.buffer);
            write32(c, 0, 0x02014B50);
            write16(c, 4, 20);
            write16(c, 6, 20);
            write16(c, 8, 0x0800);
            write16(c, 10, 0);
            write32(c, 16, checksum);
            write32(c, 20, data.length);
            write32(c, 24, data.length);
            write16(c, 28, nameBytes.length);
            write32(c, 42, offset);
            central.set(nameBytes, 46);
            centralParts.push(central);
            offset += local.length + data.length;
            centralLength += central.length;
        }
        const end = new Uint8Array(22);
        const v = new DataView(end.buffer);
        write32(v, 0, 0x06054B50);
        write16(v, 8, entries.length);
        write16(v, 10, entries.length);
        write32(v, 12, centralLength);
        write32(v, 16, offset);
        return new Blob([...localParts, ...centralParts, end], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
    }


    function xmlText(value) {
        return String(value ?? '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }
    function colName(n) {
        let result = '';
        while (n > 0) {
            result = String.fromCharCode(65 + (n - 1) % 26) + result;
            n = Math.floor((n - 1) / 26);
        }
        return result;
    }

    /** Workbook Office OpenXML 18 kolom sesuai contoh K.I.B C. */
    function buildXlsx(logoBytes) {
        const count = 18;
        const entries = new Map();
        const merges = [];
        const heights = new Map();
        function put(r, c, value, style = 0) {
            if (!entries.has(r)) entries.set(r, new Map());
            entries.get(r).set(c, { value: value ?? '', style });
        }
        function merged(r1, c1, r2, c2, value, style = 0) {
            for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
                put(r, c, '', style);
            }
            put(r1, c1, value, style);
            merges.push(`${colName(c1)}${r1}:${colName(c2)}${r2}`);
        }
        // Judul dipusatkan terhadap SELURUH lebar tabel A:R. Logo horizontal
        // diletakkan sebagai drawing di kiri, tanpa teks perusahaan tambahan.
        merged(3, 1, 3, count, 'KARTU INVENTARIS BARANG (K.I.B)', 1);
        merged(4, 1, 4, count, title(), 1);
        merged(5, 1, 5, count, `PERIODE ${periodName()}`, 1);
        [29, 25, 26, 25, 24, 27].forEach((n, i) => heights.set(i + 1, n));
        meta().forEach(([key, value], i) => {
            merged(8+i, 1, 8+i, 2, key, 4);
            merged(8+i, 3, 8+i, 6, `: ${cell(value)}`, 4);
            heights.set(8+i, 19);
        });

        const header = 17;
        const grouped = c => groups.find(g => c >= g.first && c <= g.last);
        for (let c = 1; c <= count; c++) {
            const group = grouped(c);
            if (group && group.first === c) {
                merged(header, group.first, header, group.last, group.title, 2);
                for (let x = group.first; x <= group.last; x++) {
                    put(header + 1, x, columns[x-1].toUpperCase(), 2);
                }
            } else if (!group) {
                merged(header, c, header + 1, c, columns[c-1].toUpperCase(), 2);
            }
            put(header + 2, c, String(c), 2);
        }
        heights.set(header, 33);
        heights.set(header + 1, 34);
        heights.set(header + 2, 20);
        const data = rows();
        data.forEach((values, i) => {
            const row = header + 3 + i;
            values.forEach((value, column) => put(row, column + 1, cell(value), 3));
            // Tinggi disesuaikan dengan konten panjang, tetap wrap dan middle.
            const longest = Math.max(...values.map(v => String(v ?? '').length));
            heights.set(row, Math.min(145, Math.max(29, Math.ceil(longest / 34) * 15 + 9)));
        });
        const dateRow = header + 3 + data.length + 2;
        merged(dateRow, 14, dateRow, 18, `Samarinda, ${dateName()}`, 5);
        const slots = [[1,4], [5,9], [10,13], [14,18]];
        roles.forEach(([key, label], i) => {
            const signer = chosen(key);
            const [a, b] = slots[i];
            merged(dateRow + 2, a, dateRow + 2, b, `${label},`, 5);
            merged(dateRow + 3, a, dateRow + 3, b, cell(signer?.jabatan), 5);
            merged(dateRow + 8, a, dateRow + 8, b, cell(signer?.nama), 6);
            merged(dateRow + 9, a, dateRow + 9, b, `NIP. ${cell(signer?.nip)}`, 5);
        });
        const lastRow = dateRow + 10;
        const widths = [7,30,21,13,20,18,18,17,35,20,28,17,22,24,19,22,21,35];
        const colsXml = widths.map((w, i) =>
            `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
        const rowsXml = [...entries].sort(([a], [b]) => a - b).map(([r, row]) => {
            const cellsXml = [...row].sort(([a], [b]) => a - b).map(([c, item]) =>
                `<c r="${colName(c)}${r}" s="${item.style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(item.value)}</t></is></c>`).join('');
            return `<row r="${r}"${heights.has(r)?` ht="${heights.get(r)}" customHeight="1"`:''}>${cellsXml}</row>`;
        }).join('');
        const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const xmlSheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <worksheet xmlns="${main}" xmlns:r="${rel}">
            <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
            <dimension ref="A1:R${lastRow}"/>
            <sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
            <sheetFormatPr defaultRowHeight="18"/>
            <cols>${colsXml}</cols><sheetData>${rowsXml}</sheetData>
            <mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>
            <printOptions horizontalCentered="1" gridLines="0"/>
            <pageMargins left="0.25" right="0.25" top="0.40" bottom="0.40" header="0.15" footer="0.15"/>
            <pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
            ${logoBytes?.length?'<drawing r:id="rId1"/>':''}
          </worksheet>`;
        const fonts = [
            '<font><sz val="10"/><name val="Arial"/></font>',
            '<font><b/><sz val="12"/><name val="Arial"/></font>',
            '<font><b/><sz val="9"/><name val="Arial"/></font>',
            '<font><b/><u/><sz val="10"/><name val="Arial"/></font>',
        ].join('');
        const fills = '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills>';
        const borders = '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF243344"/></left><right style="thin"><color rgb="FF243344"/></right><top style="thin"><color rgb="FF243344"/></top><bottom style="thin"><color rgb="FF243344"/></bottom><diagonal/></border></borders>';
        const xfs = [
            [0,0,0,'left'], [1,0,0,'center'], [2,2,1,'center'],
            [0,0,1,'center'], [2,0,0,'left'],
            [0,0,0,'center'], [3,0,0,'center'],
        ].map(([font, fill, border, align]) =>
            `<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyAlignment="1"><alignment horizontal="${align}" vertical="center" wrapText="1"/></xf>`).join('');
        const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <styleSheet xmlns="${main}"><fonts count="4">${fonts}</fonts>${fills}${borders}
            <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
            <cellXfs count="7">${xfs}</cellXfs>
            <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
        const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="KIB C - Gedung" sheetId="1" r:id="rId1"/></sheets>
            <definedNames>
                <definedName name="_xlnm.Print_Titles" localSheetId="0">'KIB C - Gedung'!$17:$19</definedName>
                <definedName name="_xlnm.Print_Area" localSheetId="0">'KIB C - Gedung'!$A$1:$R$${lastRow}</definedName>
            </definedNames></workbook>`;
        const files = [
            { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
            { name: 'xl/workbook.xml', data: workbook },
            { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>` },
            { name: 'xl/worksheets/sheet1.xml', data: xmlSheet },
            { name: 'xl/styles.xml', data: styles },
        ];
        if (logoBytes?.length) {
            let cy = 950000;
            if (logoBytes.length >= 24 && logoBytes[0] === 137 && logoBytes[1] === 80) {
                const image = new DataView(logoBytes.buffer, logoBytes.byteOffset, logoBytes.byteLength);
                const w = image.getUint32(16, false);
                const h = image.getUint32(20, false);
                if (w && h) cy = Math.round(3000000 * h / w);
            }
            files.push(
                { name: 'xl/media/image1.png', data: logoBytes },
                { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/drawing" Target="../drawings/drawing1.xml"/></Relationships>` },
                { name: 'xl/drawings/_rels/drawing1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/image" Target="../media/image1.png"/></Relationships>` },
                { name: 'xl/drawings/drawing1.xml', data: `<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${rel}"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>120000</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>20000</xdr:rowOff></xdr:from><xdr:ext cx="3000000" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Logo Perumda Tirta Kencana"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>` },
            );
        }
        const types = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logoBytes?.length?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${logoBytes?.length?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':''}</Types>`;
        files.unshift({name:'[Content_Types].xml', data:types});
        return reportZip(files);
    }

    download.addEventListener('click', async () => {
        if (!ready()) return;
        download.disabled = true;
        try {
            let logoBytes = null;
            try {
                const response = await fetch(page.dataset.reportLogo, {credentials: 'same-origin'});
                if (response.ok) logoBytes = new Uint8Array(await response.arrayBuffer());
            } catch (error) {
                console.warn('Logo laporan tidak dimuat; Excel tetap dihasilkan.', error);
            }
            const workbook = buildXlsx(logoBytes);
            const url = URL.createObjectURL(workbook);
            const a = document.createElement('a');
            a.href = url;
            a.download = `KIB_C_Gedung_${String(state.lokasi?.nama || 'Lokasi')
                .normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48)}_${month.value}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Gagal membuat Excel K.I.B C:', error);
            info.textContent = `Gagal membuat Excel: ${error.message}`;
        } finally {
            download.disabled = !ready();
        }
    });

    print.addEventListener('click', () => {
        if (!ready()) return;
        const w = window.open('', '_blank');
        if (!w) {
            info.textContent = 'Browser memblokir popup Print. Izinkan popup untuk situs ini.';
            return;
        }
        const cssUrl = escapeHtml(page.dataset.reportCss || '');
        w.document.open();
        w.document.write(`<!doctype html><html lang="id"><head><meta charset="UTF-8">
          <title>K.I.B C — Gedung dan Bangunan</title><link rel="stylesheet" href="${cssUrl}">
          <style>@page { size:A3 landscape; margin:10mm; }
          html,body{margin:0;padding:0;background:#fff}
          .gedung-report-paper{width:100%;max-width:none;min-width:0;box-shadow:none;border:0;padding:0}
          .gedung-report-table-scroll{overflow:visible}
          .gedung-report-table{font-size:8px}
          .gedung-report-table thead{display:table-header-group}
          .gedung-report-table tr{break-inside:avoid}
          .gedung-report-signatures{break-inside:avoid}
          </style></head><body>${paperHtml()}</body></html>`);
        w.document.close();
        w.addEventListener('load', () => { w.focus(); w.print(); }, {once:true});
    });
});