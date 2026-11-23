/* ============================================================
   K.I.B D — JALAN, IRIGASI DAN JARINGAN
   Satu JS: dua tab, detail Excel, CRUD Jembatan, XLSX per lokasi.
   ============================================================ */
(() => {
    'use strict';
    const root = document.getElementById('jalanPage');
    if (!root || root.dataset.initialized === '1') return;
    root.dataset.initialized = '1';

    const $ = id => document.getElementById(id);
    const base = root.dataset.base;
    const token = root.dataset.token;
    const ownerNames = Object.freeze({
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta',
        campuran: 'Campuran',
        belum_diatur: 'Belum Diatur'
    });
    const state = {
        pending: [], pendingLoaded: false, pendingPage: 1, voucher: null,
        tab: 'gedung', page: 1, perPage: 10,
        location: null, locationName: '', data: [], selectedIndex: -1,
        editingId: null, editingLegacyOwner: null, exporting: false, requestNo: 0, groupAction: null
    };
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    })[char]);
    const plain = value => String(value ?? '').trim();
    const empty = value => plain(value) || '—';
    const money = value => value === null || value === undefined || plain(value) === ''
        ? '—' : 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(value) || 0);
    const ownerText = value => ownerNames[plain(value).toLowerCase()] || (plain(value) || 'Belum Diatur');
    const ownerBadge = value => {
        const key = plain(value).toLowerCase();
        const type = key === 'campuran' ? 'mixed' : ownerNames[key] && key !== 'belum_diatur' ? 'known' : 'unknown';
        return `<span class="kd-owner ${type}">${esc(ownerText(value))}</span>`;
    };
    const icons = () => window.lucide?.createIcons?.();
    const fmtDate = date => {
        const v = plain(date);
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
        return match ? `${match[3]}/${match[2]}/${match[1]}` : empty(v);
    };

    async function api(url, config = {}) {
        const res = await fetch(url, {
            credentials:'same-origin', ...config,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': token,
                ...(config.headers || {})
            }
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || result.success === false) {
            const validation = result.errors
                ? Object.values(result.errors).flat().join(' · ') : '';
            throw new Error(validation || result.message || `HTTP ${res.status}`);
        }
        return result;
    }
    function openDialog(id) {
        const dialog = $(id);
        if (dialog?.showModal && !dialog.open) dialog.showModal();
    }
    function closeDialog(id) {
        const dialog = $(id);
        if (dialog?.open) dialog.close();
    }
    root.querySelectorAll('[data-kd-close]').forEach(button => {
        button.addEventListener('click', () => closeDialog(button.dataset.kdClose));
    });
    root.querySelectorAll('dialog').forEach(dialog => {
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close();
        });
    });

    /* ------------------------------------------------------------
       TABEL UTAMA: hanya lokasi / alamat / status / aksi.
       ------------------------------------------------------------ */
    function visibleRows() {
        const search = plain($('kdSearch').value).toLocaleLowerCase('id-ID');
        const status = $('kdOwnerFilter').value;
        const panel = root.querySelector(`[data-kd-pane="${state.tab}"]`);
        return Array.from(panel.querySelectorAll('[data-kd-row]')).filter(row => {
            const text = row.dataset.query || '';
            return (!search || text.includes(search)) &&
                (!status || status === row.dataset.status);
        });
    }
    function renderPage() {
        const addButton = $('kdNew');
        if (addButton) {
            addButton.innerHTML = state.tab === 'gedung'
                ? '<i data-lucide="building-2"></i> Kelola Gedung / Irigasi'
                : '<i data-lucide="plus"></i> Tambah Jembatan';
            addButton.disabled = false;
        }
        const panel = root.querySelector(`[data-kd-pane="${state.tab}"]`);
        const rows = Array.from(panel.querySelectorAll('[data-kd-row]'));
        const filtered = visibleRows();
        const pages = Math.max(1, Math.ceil(filtered.length / state.perPage));
        state.page = Math.min(Math.max(1, state.page), pages);
        rows.forEach(row => { row.hidden = true; });
        filtered.slice((state.page - 1) * state.perPage, state.page * state.perPage)
            .forEach((row, index) => {
                row.hidden = false;
                row.querySelector('[data-kd-number]').textContent =
                    String((state.page - 1) * state.perPage + index + 1);
            });
        const begin = filtered.length ? (state.page - 1) * state.perPage + 1 : 0;
        const end = Math.min(state.page * state.perPage, filtered.length);
        $('kdRange').textContent = `${begin}–${end} dari ${filtered.length} lokasi`;
        const container = $('kdPages');
        container.replaceChildren();
        if (pages > 1) {
            const button = (text, page, active = false, disabled = false) => {
                const el = document.createElement('button');
                el.type = 'button';
                el.textContent = text;
                el.classList.toggle('active', active);
                el.disabled = disabled;
                el.addEventListener('click', () => { state.page = page; renderPage(); });
                container.appendChild(el);
            };
            button('‹', state.page - 1, false, state.page === 1);
            const start = Math.max(1, state.page - 2);
            const endPage = Math.min(pages, start + 4);
            for (let page = start; page <= endPage; page++) {
                button(String(page), page, page === state.page);
            }
            button('›', state.page + 1, false, state.page === pages);
        }
    }
    root.querySelectorAll('[data-kd-tab]').forEach(button => {
        button.addEventListener('click', () => {
            state.tab = button.dataset.kdTab;
            state.page = 1;
            root.querySelectorAll('[data-kd-tab]').forEach(tab => {
                const selected = tab === button;
                tab.classList.toggle('active', selected);
                tab.setAttribute('aria-selected', String(selected));
            });
            root.querySelectorAll('[data-kd-pane]').forEach(pane => {
                pane.hidden = pane.dataset.kdPane !== state.tab;
            });
            renderPage();
        });
    });
    $('kdSearch').addEventListener('input', () => { state.page = 1; renderPage(); });
    $('kdOwnerFilter').addEventListener('change', () => { state.page = 1; renderPage(); });
    $('kdPerPage').addEventListener('change', event => {
        state.perPage = Number(event.target.value) || 10;
        state.page = 1;
        renderPage();
    });

    /* Kelompok lokasi mengikuti model Konstruksi. */
    function renderGroups() {
        const pane = root.querySelector(`[data-kd-pane="${state.tab}"]`);
        const query = plain($('kdGroupSearch').value).toLocaleLowerCase('id-ID');
        const list = [...pane.querySelectorAll('[data-kd-row]')]
            .filter(row => !query || (row.dataset.query || '').includes(query));
        $('kdGroupList').innerHTML = list.length ? list.map(row => `
            <button type="button" class="kd-group-item ${Number(row.dataset.location)===state.location?'active':''}"
                data-group-location="${Number(row.dataset.location)}">
                <strong>${esc(row.dataset.name)}</strong>
                <small>${esc(row.querySelector('.kd-primary-cell small')?.textContent || '')}</small>
            </button>`).join('') : '<p class="kd-group-empty">Lokasi tidak ditemukan.</p>';
    }
    $('kdGroupSearch').addEventListener('input', renderGroups);
    $('kdGroupList').addEventListener('click', event => {
        const group = event.target.closest('[data-group-location]');
        if (group) loadDetail(state.tab, group.dataset.groupLocation);
    });

    /* ------------------------------------------------------------
       DETAIL LOKASI (SELURUH DATA, TIDAK TERPOTONG PAGINATION)
       ------------------------------------------------------------ */
    async function loadDetail(kind, location, groupAction = null) {
        const requestNo = ++state.requestNo;
        state.groupAction = groupAction;
        $('kdGroupActionNote').hidden = true;
        state.location = Number(location);
        $('kdGroupSearch').value = '';
        renderGroups();
        state.data = [];
        $('kdExportDetail').disabled = true;
        state.selectedIndex = -1;
        $('kdDetailTitle').textContent = 'Memuat inventaris...';
        $('kdDetailSubtitle').textContent = kind === 'gedung' ? 'Gedung / Irigasi' : 'Jembatan';
        $('kdExcelBody').innerHTML = '<tr><td colspan="19">Memuat data lokasi...</td></tr>';
        $('kdBerkas').hidden = true;
        openDialog('kdDetailDialog');
        try {
            const response = await api(`${base}/${encodeURIComponent(kind)}/lokasi/${encodeURIComponent(location)}`);
            if (requestNo !== state.requestNo) return;
            state.tab = kind;
            state.location = Number(response.lokasi.id);
            state.locationName = response.lokasi.lokasi || 'Tanpa Lokasi';
            renderGroups();
            state.data = response.data || [];
            $('kdExportDetail').disabled = !state.data.length;
            $('kdDetailTitle').textContent = `DATA ${state.locationName.toUpperCase()}`;
            $('kdDetailSubtitle').textContent = `${kind === 'gedung' ? 'Gedung / Irigasi' : 'Jembatan'} · ${response.lokasi.alamat || 'Alamat belum tersedia'}`;
            $('kdDetailSearch').value = '';
            renderDetail();
            if (state.groupAction && kind === 'jembatan') {
                const action = state.groupAction === 'delete' ? 'dihapus' : 'diedit';
                const note = $('kdGroupActionNote');
                note.textContent = `Lokasi ini berisi ${state.data.length} barang. Pilih baris barang yang ingin ${action}, lalu gunakan tombol tindakan pada panel Berkas. Tidak ada penghapusan otomatis terhadap satu lokasi.`;
                note.hidden = false;
                if (state.data.length === 1) showBerkas(0);
            }
        } catch (error) {
            $('kdExcelBody').innerHTML = `<tr><td colspan="19">${esc(error.message)}</td></tr>`;
            $('kdDetailCount').textContent = 'Gagal memuat';
        }
    }
    function renderDetail() {
        const query = plain($('kdDetailSearch').value).toLocaleLowerCase('id-ID');
        const rows = state.data.map((item,index) => ({item,index})).filter(({item}) =>
            !query || [item.nama_barang,item.kode,item.reg,item.asal,item.departemen,item.divisi]
                .some(part => plain(part).toLocaleLowerCase('id-ID').includes(query))
        );
        $('kdDetailCount').textContent = `${rows.length} dari ${state.data.length} data`;
        $('kdExcelBody').innerHTML = rows.length ? rows.map(({item,index}, position) => {
            const cells = [
                position + 1, item.nama_barang, item.kode, item.reg,
                item.kondisi, item.konstruksi, item.materi, item.luas_lantai,
                item.letak || $('kdDetailSubtitle').textContent.split(' · ').slice(1).join(' · '),
                fmtDate(item.tgl_dok), item.no_dok, item.luas,
                item.status_tanah, item.kode_tanah, item.asal,
                money(item.harga), item.ket
            ];
            return `<tr class="${state.selectedIndex === index ? 'selected' : ''}" data-kd-detail-row="${index}">` +
                cells.map((value,i) => `<td class="${i===15 ? 'kd-money' : ''}">${esc(empty(value))}</td>`).join('') +
                `<td>${ownerBadge(item.status_kepemilikan)}</td>` +
                `<td class="kd-cell-action"><button type="button" class="kd-button small outline" data-kd-berkas="${index}">Berkas</button></td></tr>`;
        }).join('') : '<tr><td colspan="19">Tidak ada barang sesuai pencarian.</td></tr>';
        icons();
    }
    function showBerkas(index) {
        const item = state.data[index];
        if (!item) return;
        state.selectedIndex = index;
        renderDetail();
        $('kdBerkas').hidden = false;
        $('kdBerkasTitle').textContent = item.nama_barang || 'Inventaris';
        $('kdBerkasSource').textContent = item.source === 'gedung'
            ? 'Terhubung dengan K.I.B C — kelola melalui Gedung dan Bangunan'
            : 'Jembatan — data asli web lama (kib_d_s)';
        $('kdBerkasFoto').innerHTML = item.foto_url
            ? `<a href="${esc(item.foto_url)}" target="_blank" rel="noopener"><img src="${esc(item.foto_url)}" loading="lazy" alt="Foto ${esc(item.nama_barang)}"></a>`
            : 'Foto belum tersedia';
        $('kdBerkasDok').innerHTML = item.dokumen_url
            ? `<a href="${esc(item.dokumen_url)}" target="_blank" rel="noopener">Lihat PDF / Dokumen</a>`
            : 'Dokumen belum tersedia';
        const actions = $('kdBerkasActions');
        if (item.source === 'jembatan') {
            actions.innerHTML = `<button type="button" class="kd-button outline" data-kd-edit="${Number(item.id)}"><i data-lucide="pencil"></i> Edit</button>` +
                `<button type="button" class="kd-button outline" data-kd-delete="${Number(item.id)}"><i data-lucide="trash-2"></i> Hapus</button>` +
                '<button type="button" class="kd-button outline" data-kd-hide="1">Tutup Berkas</button>';
        } else if (item.source === 'gedung') {
            actions.innerHTML = `<a href="${esc(root.dataset.gedung)}" class="kd-button outline"><i data-lucide="building-2"></i> Kelola di K.I.B C</a>` +
                '<button type="button" class="kd-button outline" data-kd-hide="1">Tutup Berkas</button>';
        }
        icons();
    }
    $('kdDetailSearch').addEventListener('input', renderDetail);
    $('kdExcelBody').addEventListener('click', event => {
        const trigger = event.target.closest('[data-kd-berkas]');
        const row = event.target.closest('[data-kd-detail-row]');
        if (trigger || row) showBerkas(Number(trigger?.dataset.kdBerkas ?? row.dataset.kdDetailRow));
    });
    $('kdBerkasActions').addEventListener('click', async event => {
        const edit = event.target.closest('[data-kd-edit]');
        const del = event.target.closest('[data-kd-delete]');
        const legacyOwner = event.target.closest('[data-kd-owner-legacy]');
        if (legacyOwner) return openLegacyOwner(Number(legacyOwner.dataset.kdOwnerLegacy));
        if (event.target.closest('[data-kd-hide]')) { $('kdBerkas').hidden = true; return; }
        if (edit) return openForm(Number(edit.dataset.kdEdit));
        if (del) return deleteManual(Number(del.dataset.kdDelete));
    });
    root.addEventListener('click', event => {
        const detail = event.target.closest('[data-kd-detail]');
        const excel = event.target.closest('[data-kd-export]');
        const groupAction = event.target.closest('[data-kd-group-action]');
        if (groupAction) {
            return loadDetail(groupAction.dataset.kind,
                groupAction.dataset.kdLocation,
                groupAction.dataset.kdGroupAction);
        }
        if (detail) return loadDetail(detail.dataset.kind, detail.dataset.kdDetail);
        if (excel) return exportLocation(excel.dataset.kind, excel.dataset.kdExport);
    });

    /* ------------------------------------------------------------
       SEARCHABLE DROPDOWN — ID asli tetap dikirim ke Laravel.
       ------------------------------------------------------------ */
    const comboControls = [];
    root.querySelectorAll('[data-kd-combo]').forEach(wrapper => {
        const input = wrapper.querySelector('[data-kd-search]');
        const select = wrapper.querySelector('[data-kd-native]');
        const menu = wrapper.querySelector('[data-kd-menu]');
        const options = () => [...select.options].filter(option => option.value);
        const show = () => {
            const query = plain(input.value).toLocaleLowerCase('id-ID');
            const matched = options().filter(option =>
                (select.name !== 'id_barang' || state.editingId || option.dataset.status === 'aktif') &&
                (!query ||
                option.textContent.toLocaleLowerCase('id-ID').includes(query))).slice(0, 80);
            menu.innerHTML = matched.length ? matched.map(option =>
                `<button type="button" role="option" data-value="${esc(option.value)}">${esc(option.textContent)}</button>`
            ).join('') : '<div class="kd-option-empty">Pilihan tidak ditemukan</div>';
            menu.hidden = false;
        };
        const selectValue = value => {
            select.value = String(value ?? '');
            const option = options().find(opt => opt.value === select.value);
            input.value = option?.textContent.trim() || '';
            menu.hidden = true;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        };
        input.addEventListener('focus', show);
        input.addEventListener('input', () => { select.value = ''; show(); });
        input.addEventListener('keydown', event => {
            if (event.key === 'Escape') { menu.hidden = true; input.blur(); }
            if (event.key === 'Enter' && !menu.hidden) {
                const first = menu.querySelector('button[data-value]');
                if (first) { event.preventDefault(); selectValue(first.dataset.value); }
            }
            if (event.key === 'ArrowDown' && !menu.hidden) {
                event.preventDefault(); menu.querySelector('button[data-value]')?.focus();
            }
        });
        menu.addEventListener('click', event => {
            const button = event.target.closest('button[data-value]');
            if (button) selectValue(button.dataset.value);
        });
        menu.addEventListener('keydown', event => {
            const buttons = [...menu.querySelectorAll('button[data-value]')];
            const current = buttons.indexOf(document.activeElement);
            if (event.key === 'ArrowDown') { event.preventDefault(); buttons[Math.min(current + 1, buttons.length - 1)]?.focus(); }
            if (event.key === 'ArrowUp') { event.preventDefault(); (buttons[current-1] || input)?.focus(); }
            if (event.key === 'Escape') { event.preventDefault(); menu.hidden = true; input.focus(); }
        });
        comboControls.push({ wrapper, input, select, menu, selectValue });
    });
    root.addEventListener('click', event => {
        comboControls.forEach(control => {
            if (!control.wrapper.contains(event.target)) control.menu.hidden = true;
        });
    });
    const setCombo = (field, value) => {
        const combo = comboControls.find(control =>
            control.select.name === field && control.wrapper.closest('#kdForm'));
        combo?.selectValue(value);
    };
    const locationCombo = comboControls.find(c => c.select.name === 'id_lokasi');
    locationCombo?.select.addEventListener('change', () => {
        const selected = locationCombo.select.selectedOptions[0];
        $('kdAlamat').value = selected?.dataset.alamat || '';
    });
    const barangCombo = comboControls.find(c => c.select.name === 'id_barang');
    barangCombo?.select.addEventListener('change', () => {
        const option = barangCombo.select.selectedOptions[0];
        $('kdKode').value = option?.dataset.code || $('kdKode').value;
    });
    function syncAlamat() {
        $('kdLetak').value = $('kdAlamat').value;
    }
    locationCombo?.select.addEventListener('change', syncAlamat);
    const depCombo = comboControls.find(c => c.select.name === 'id_departemen');
    const divCombo = comboControls.find(c => c.select.name === 'id_div');
    depCombo?.select.addEventListener('change', () => {
        if (!divCombo) return;
        const dep = depCombo.select.value;
        [...divCombo.select.options].forEach(option => {
            option.hidden = Boolean(option.value && option.dataset.dep && dep && option.dataset.dep !== dep);
        });
        if (divCombo.select.selectedOptions[0]?.hidden) divCombo.selectValue('');
    });

    /* Update Status Kepemilikan langsung di kib_d_s. */
    function openLegacyOwner(id) {
        const item = state.data.find(row => row.source === 'jembatan' && Number(row.id) === id);
        if (!item) return;
        state.editingLegacyOwner = id;
        $('kdOwnerMessage').textContent = '';
        $('kdOwnerTitle').textContent = `Atur Kepemilikan — ${item.nama_barang}`;
        // Status dapat diubah tanpa menimpa field lain.
        const legacyCombo = comboControls.find(c => c.wrapper.closest('#kdOwnerForm'));
        legacyCombo?.selectValue(item.status_kepemilikan);
        openDialog('kdOwnerDialog');
    }
    $('kdOwnerForm').addEventListener('submit', async event => {
        event.preventDefault();
        const ownerCombo = comboControls.find(c => c.wrapper.closest('#kdOwnerForm'));
        if (!ownerCombo?.select.value || !state.editingLegacyOwner) {
            $('kdOwnerMessage').textContent = 'Pilih salah satu status kepemilikan.';
            return;
        }
        try {
            await api(`${base}/arsip/${state.editingLegacyOwner}/kepemilikan`, {
                method:'PUT',
                headers: {'Content-Type':'application/json'},
                body:JSON.stringify({status_kepemilikan:ownerCombo.select.value})
            });
            closeDialog('kdOwnerDialog');
            window.location.reload();
        } catch(error) { $('kdOwnerMessage').textContent = error.message; }
    });

    /* ------------------------------------------------------------
       CRUD JEMBATAN: langsung kib_d_s. Gedung dari K.I.B C.
       ------------------------------------------------------------ */
    /* Pending Nilai Aset, mengikuti form K.I.R; endpoint existing /kib/pending/jalan. */
    function pendingRows() {
        const text = plain($('kdPendingSearch').value).toLocaleLowerCase('id-ID');
        return state.pending.filter(row => [row.no_voucher, row.lokasi,
            row.departemen, row.divisi, row.urai]
            .some(value => plain(value).toLocaleLowerCase('id-ID').includes(text)));
    }
    function renderPending() {
        const matches = pendingRows();
        const perPage = 50;
        const pages = Math.max(1, Math.ceil(matches.length / perPage));
        state.pendingPage = Math.min(Math.max(1, state.pendingPage), pages);
        const offset = (state.pendingPage - 1) * perPage;
        const visible = matches.slice(offset, offset + perPage);
        const readyCount = matches.filter(row => row.siap !== false).length;
        $('kdPendingCount').textContent =
            `${matches.length} voucher · ${readyCount} siap dipilih`;
        $('kdPendingPageLabel').textContent = `Halaman ${state.pendingPage} / ${pages}`;
        $('kdPendingPrev').disabled = state.pendingPage <= 1;
        $('kdPendingNext').disabled = state.pendingPage >= pages;
        $('kdPendingBody').innerHTML = visible.length ? visible.map((row,i) => `
            <tr><td>${offset+i+1}</td>
            <td><strong>${esc(row.no_voucher)}</strong><small>${esc(fmtDate(row.tgl_voucher))}</small></td>
            <td>${esc(row.lokasi)}</td><td>${esc(row.departemen)}</td><td>${esc(row.divisi)}</td>
            <td class="kd-money">${esc(money(row.nilai))}</td><td>${esc(row.urai)}</td>
            <td>${row.siap === false
                ? '<span title="Lokasi, departemen, atau divisi pada voucher belum lengkap">Perbaiki data voucher</span>'
                : `<button type="button" class="kd-button small primary" data-pick-pending="${Number(row.id)}">Pilih</button>`}</td></tr>`
        ).join('') : '<tr><td colspan="8" class="kd-empty-pending">Tidak ada voucher Penambahan Aset K.I.B D yang cocok. Periksa kategori dan jenis transaksi pada menu Nilai Aset.</td></tr>';
    }
    async function loadPending() {
        $('kdPendingBody').innerHTML = '<tr><td colspan="8">Memuat transaksi Nilai Aset...</td></tr>';
        try {
            const response = await api(root.dataset.pending);
            state.pending = Array.isArray(response.data) ? response.data : [];
            state.pendingLoaded = true;
            state.pendingPage = 1;
            renderPending();
            if (response.truncated) {
                $('kdPendingCount').textContent += ' · Hanya 3.000 baris pertama ditampilkan';
            }
        } catch (error) {
            state.pending = [];
            $('kdPendingBody').innerHTML = `<tr><td colspan="8">${esc(error.message)}</td></tr>`;
            $('kdPendingCount').textContent = 'Gagal memuat pending';
            $('kdPendingPageLabel').textContent = '—';
            $('kdPendingPrev').disabled = true;
            $('kdPendingNext').disabled = true;
        }
    }
    $('kdPendingPrev').addEventListener('click', () => {
        state.pendingPage--;
        renderPending();
    });
    $('kdPendingNext').addEventListener('click', () => {
        state.pendingPage++;
        renderPending();
    });

    function useVoucher(row) {
        state.voucher = row;
        $('kdVoucherId').value = String(row?.id || '');
        $('kdSelectedVoucher').hidden = !row;
        $('kdPendingPicker').hidden = Boolean(row);
        $('kdVoucherLabel').textContent = row?.no_voucher || 'Input tanpa voucher';
        $('kdVoucherMeta').textContent = row
            ? `${row.lokasi || '—'} · ${money(row.nilai)}` : '';
        if (!row) return;
        setCombo('id_lokasi', row.id_lokasi);
        setCombo('id_departemen', row.dep);
        setCombo('id_div', row.div);
        $('kdHarga').value = row.nilai ?? '';
        $('kdHarga').readOnly = true;
        syncAlamat();
    }
    $('kdPendingSearch').addEventListener('input', () => {
        state.pendingPage = 1;
        renderPending();
    });
    $('kdPendingBody').addEventListener('click', event => {
        const button = event.target.closest('[data-pick-pending]');
        if (!button) return;
        const found = state.pending.find(row => Number(row.id) === Number(button.dataset.pickPending));
        if (found) useVoucher(found);
    });
    $('kdDirectInput').addEventListener('click', () => {
        useVoucher(null); $('kdPendingPicker').hidden = true;
        $('kdSelectedVoucher').hidden = false;
        $('kdVoucherLabel').textContent = 'Input langsung tanpa voucher';
        $('kdVoucherMeta').textContent = 'Isi data lokasi dan inventaris secara manual';
        $('kdHarga').readOnly = false;
    });
    $('kdChangeVoucher').addEventListener('click', () => {
        useVoucher(null); $('kdSelectedVoucher').hidden = true;
        $('kdPendingPicker').hidden = false;
        $('kdHarga').readOnly = false;
        loadPending();
    });
    $('kdViewPending').addEventListener('click', () => {
        // Tab Gedung dibaca dari K.I.B C; pending K.I.B D dipakai untuk Jembatan.
        if (state.tab !== 'jembatan') root.querySelector('[data-kd-tab="jembatan"]')?.click();
        openForm();
    });

    async function openForm(id = null) {
        const form = $('kdForm');
        form.reset();
        state.editingId = id;
        $('kdEditId').value = id || '';
        $('kdFormTitle').textContent = id ? 'Edit Data Jembatan' : 'Tambah Data Jembatan';
        $('kdFormMessage').textContent = '';
        useVoucher(null);
        $('kdHarga').readOnly = false;
        $('kdPendingPicker').hidden = false;
        $('kdPendingSection').hidden = Boolean(id);
        if (!id) loadPending();
        ['id_barang','id_lokasi','id_departemen','id_div','kondisi',
         'konstruksi','materi','status_kepemilikan']
            .forEach(name => setCombo(name, ''));
        syncAlamat();
        if (id) {
            try {
                const res = await api(`${base}/item/${id}`);
                for (const [name,value] of Object.entries(res.data)) {
                    if (['id_barang','id_lokasi','id_departemen','id_div','kondisi','konstruksi',
                         'materi','status_kepemilikan','foto_path','dokumen_path'].includes(name)) continue;
                    const control = form.elements.namedItem(name);
                    if (control && control.type !== 'file') control.value = value ?? '';
                }
                ['id_barang','id_lokasi','id_departemen','id_div','kondisi',
                 'konstruksi','materi','status_kepemilikan'].forEach(
                    name => setCombo(name, res.data[name]));
                syncAlamat();
                $('kdHarga').readOnly = Boolean(res.data.id_nilai_aktiva);
            } catch (error) { alert(error.message); return; }
        }
        openDialog('kdFormDialog');
    }
    $('kdNew').addEventListener('click', () => {
        if (state.tab === 'gedung') {
            window.location.assign(root.dataset.gedung);
            return;
        }
        openForm();
    });
    $('kdForm').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const owner = comboControls.find(c =>
            c.select.name === 'status_kepemilikan' && c.wrapper.closest('#kdForm'));
        if (!locationCombo?.select.value || !owner?.select.value || !barangCombo?.select.value) {
            $('kdFormMessage').textContent = 'Pilih Lokasi, Nama Barang, dan Status Kepemilikan dari dropdown.';
            return;
        }
        const button = $('kdSave');
        const data = new FormData(form);
        if (state.editingId) data.append('_method', 'PUT');
        button.disabled = true;
        $('kdFormMessage').textContent = 'Menyimpan data...';
        try {
            await api(state.editingId ? `${base}/item/${state.editingId}` : `${base}/item`, {
                method:'POST', body:data
            });
            closeDialog('kdFormDialog');
            window.location.reload();
        } catch (error) {
            $('kdFormMessage').textContent = error.message;
        } finally { button.disabled = false; }
    });
    async function deleteManual(id) {
        if (!confirm('Hapus inventaris Jembatan ini dari database? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            await api(`${base}/item/${id}`, { method:'DELETE' });
            window.location.reload();
        } catch (error) { alert('Gagal menghapus: ' + error.message); }
    }

    /* ------------------------------------------------------------
       XLSX: satu lokasi, seluruh record, urutan sesuai Excel K.I.B D.
       Text inlineStr melindungi dari eksekusi formula input pengguna.
       ------------------------------------------------------------ */
    // Tombol Print Excel membuka dialog standar Tanah (bukan langsung download).
    // Event dikonsumsi modul laporan pada file jalan.js yang SAMA.
    function exportLocation(kind, location) {
        if (!['gedung', 'jembatan'].includes(kind)) return;
        const id = Number(location);
        if (!Number.isSafeInteger(id) || id < 0) return;
        document.dispatchEvent(new CustomEvent('kibd:report', {
            detail: { kind, location: id }
        }));
    }
    $('kdExportDetail').addEventListener('click', () => {
        if (state.data.length && state.location !== null) {
            exportLocation(state.tab, state.location);
        }
    });
    renderPage();
    icons();
})();


/* K.I.B D - Modal laporan dan XLSX 17 kolom, standar PRD v2.1. */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const page = document.getElementById('jalanPage');
    const dialog = document.getElementById('kdReportDialog');
    if (!page || !dialog || !page.dataset.reportBaseUrl) return;

    const $ = selector => dialog.querySelector(selector);
    const form = $('#kdReportForm');
    const month = $('#kdReportPeriod');
    const info = $('#kdReportInfo');
    const previewBox = $('#kdReportPreviewBox');
    const preview = $('#kdReportPreview');
    const download = $('#kdReportDownload');
    const print = $('#kdReportPrint');
    const reportBody = $('.kd-report-body');
    const signerFields = Array.from(form.querySelectorAll('.kd-report-person'));
    const scope = $('#kdReportScope');
    const roles = [
        ['diketahui', 'Diketahui oleh'],
        ['periksa_1', 'Diperiksa oleh (1)'],
        ['periksa_2', 'Diperiksa oleh (2)'],
        ['dibuat', 'Dibuat oleh'],
    ];
    const state = { lokasi: null, organisasi: {}, data: [], sdm: [], jenis: 'jembatan' };
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
    const fmtDate = v => {
        const hit = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        return hit ? `${hit[3]}/${hit[2]}/${hit[1]}` : cell(v);
    };
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
    // Hanya ID dari pilihan Master SDM yang valid untuk penandatangan.
    const chosen = key => {
        const field = signerFields.find(item => item.dataset.kdPerson === key);
        const id = field?.querySelector('.kd-report-person-id')?.value;
        return id ? state.sdm.find(person => String(person.id) === id) || null : null;
    };
    const ready = () => Boolean(periodName() && state.data.length && roles.every(([key]) => chosen(key)));
    // Header persis 17 kolom template K.I.B D (KIB D.jpeg).
    const columns = [
        'No.', 'Nama Barang / Jenis Barang', 'Kode Barang', 'Register',
        'Kondisi Bangunan', 'Bertingkat / Tidak', 'Beton / Tidak',
        'Luas Lantai (M2)', 'Letak / Lokasi Alamat',
        'Tanggal Dokumen', 'Nomor Dokumen', 'Luas (M2)',
        'Status Tanah', 'Nomor Kode Tanah', 'Asal Usul',
        'Harga (Rp)', 'Keterangan'
    ];
    const groups = [
        { first: 3, last: 4, title: 'NOMOR' },
        { first: 6, last: 7, title: 'KONSTRUKSI BANGUNAN' },
        { first: 10, last: 11, title: 'DOKUMEN GEDUNG' },
    ];
    const rows = () => state.data.map((g, i) => [
        i + 1, g.nama_barang, g.kode, g.reg, g.kondisi,
        g.konstruksi, g.materi, g.luas_lantai,
        g.letak || state.lokasi?.alamat || state.lokasi?.nama,
        fmtDate(g.tgl_dok), g.no_dok, g.luas,
        g.status_tanah, g.kode_tanah, g.asal,
        money(g.harga), g.ket
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
            ['KODE STRUKTUR', o.kode_struktur || '-'],
        ];
    };
    const title = () => 'D. JALAN, IRIGASI DAN JARINGAN';
    const jenisNama = () => state.jenis === 'gedung' ? 'GEDUNG / IRIGASI' : 'JEMBATAN';

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

    // Pencarian SDM kustom dengan popover agar tidak terpotong scroll modal.
    function closeSignerOptions(except = null) {
        signerFields.forEach(field => {
            if (field === except) return;
            const options = field.querySelector('.kd-report-person-options');
            const input = field.querySelector('.kd-report-person-search');
            if (options?.matches(':popover-open')) options.hidePopover();
            if (options) options.hidden = true;
            if (input) {
                input.setAttribute('aria-expanded', 'false');
                input.removeAttribute('aria-activedescendant');
            }
        });
    }

    function positionSignerOptions(field) {
        const input = field.querySelector('.kd-report-person-search');
        const options = field.querySelector('.kd-report-person-options');
        if (!input || !options || options.hidden || !options.matches(':popover-open')) return;
        const rect = input.getBoundingClientRect();
        const bodyRect = reportBody.getBoundingClientRect();
        const dialogRect = dialog.getBoundingClientRect();
        if (rect.bottom <= bodyRect.top || rect.top >= bodyRect.bottom) {
            closeSignerOptions();
            return;
        }
        const padding = 9;
        const topLimit = Math.max(padding, dialogRect.top + padding);
        const bottomLimit = Math.min(window.innerHeight - padding, dialogRect.bottom - padding);
        const below = Math.max(0, bottomLimit - rect.bottom - 5);
        const above = Math.max(0, rect.top - topLimit - 5);
        const desired = 248;
        const useAbove = below < 130 && above > below;
        const available = useAbove ? above : below;
        const height = Math.max(0, Math.min(desired, available));
        if (height < 30) {
            closeSignerOptions();
            return;
        }
        const width = Math.min(rect.width, window.innerWidth - padding * 2);
        const left = Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding));
        Object.assign(options.style, {
            top: `${Math.round(useAbove ? rect.top - height - 5 : rect.bottom + 5)}px`,
            left: `${Math.round(left)}px`,
            bottom: 'auto',
            width: `${Math.round(width)}px`,
            maxHeight: `${Math.round(height)}px`,
        });
    }

    function selectSigner(field, person) {
        if (!person) return;
        const input = field.querySelector('.kd-report-person-search');
        const id = field.querySelector('.kd-report-person-id');
        const description = field.querySelector('.kd-report-person-description');
        input.value = String(person.nama || '');
        id.value = String(person.id);
        description.textContent = [
            person.jabatan,
            person.nip ? `NIP. ${person.nip}` : ''
        ].filter(Boolean).join(' · ') || 'Dipilih dari Master SDM Pendukung.';
        closeSignerOptions();
        updatePreview();
    }

    function showSignerOptions(field) {
        const input = field.querySelector('.kd-report-person-search');
        const options = field.querySelector('.kd-report-person-options');
        if (!input || !options || !dialog.open) return;
        closeSignerOptions(field);
        const keyword = input.value.trim().toLocaleLowerCase('id-ID');
        const matches = state.sdm.filter(person =>
            [person.nama, person.nip, person.jabatan].some(value =>
                String(value || '').toLocaleLowerCase('id-ID').includes(keyword)
            )
        ).slice(0, 100);
        options.replaceChildren();
        matches.forEach((person, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'kd-report-person-option';
            button.dataset.personId = String(person.id);
            button.id = `${options.id}-option-${index}`;
            button.setAttribute('role', 'option');
            const name = document.createElement('strong');
            name.textContent = person.nama || '-';
            const detail = document.createElement('small');
            detail.textContent = [
                person.jabatan,
                person.nip ? `NIP. ${person.nip}` : ''
            ].filter(Boolean).join(' · ') || 'Belum ada jabatan/NIP';
            button.append(name, detail);
            options.appendChild(button);
        });
        if (!matches.length) {
            const empty = document.createElement('div');
            empty.className = 'kd-report-person-empty';
            empty.textContent = state.sdm.length
                ? 'Nama, NIP, atau jabatan tidak ditemukan.'
                : 'Master SDM Pendukung belum memiliki SDM aktif.';
            options.appendChild(empty);
        }
        options.hidden = false;
        if (typeof options.showPopover === 'function') {
            if (!options.matches(':popover-open')) options.showPopover();
            positionSignerOptions(field);
        }
        input.setAttribute('aria-expanded', 'true');
    }

    signerFields.forEach(field => {
        const input = field.querySelector('.kd-report-person-search');
        const options = field.querySelector('.kd-report-person-options');
        const id = field.querySelector('.kd-report-person-id');
        const description = field.querySelector('.kd-report-person-description');
        if (!input || !options || !id) return;
        input.addEventListener('focus', () => showSignerOptions(field));
        input.addEventListener('input', () => {
            id.value = '';
            description.textContent = 'Pilih nama dari daftar, bukan hanya mengetik.';
            showSignerOptions(field);
            updatePreview();
        });
        input.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !options.hidden) {
                event.preventDefault();
                event.stopPropagation();
                closeSignerOptions();
                return;
            }
            if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
            if (options.hidden) showSignerOptions(field);
            const buttons = Array.from(options.querySelectorAll('button[data-person-id]'));
            if (!buttons.length) return;
            event.preventDefault();
            const active = buttons.findIndex(button => button.classList.contains('is-highlighted'));
            if (event.key === 'Enter') {
                const selected = buttons[active >= 0 ? active : 0];
                selectSigner(field, state.sdm.find(person => String(person.id) === selected.dataset.personId));
                return;
            }
            const next = event.key === 'ArrowDown'
                ? (active + 1) % buttons.length
                : (active - 1 + buttons.length) % buttons.length;
            buttons.forEach(button => button.classList.remove('is-highlighted'));
            buttons[next].classList.add('is-highlighted');
            buttons[next].scrollIntoView({block: 'nearest'});
            input.setAttribute('aria-activedescendant', buttons[next].id);
        });
        options.addEventListener('click', event => {
            const button = event.target.closest('button[data-person-id]');
            if (!button) return;
            selectSigner(field, state.sdm.find(person => String(person.id) === button.dataset.personId));
        });
    });
    reportBody.addEventListener('scroll', () => signerFields.forEach(positionSignerOptions), {passive: true});
    window.addEventListener('resize', () => signerFields.forEach(positionSignerOptions));
    dialog.addEventListener('cancel', () => closeSignerOptions());
    document.addEventListener('pointerdown', event => {
        if (dialog.open && !event.target.closest('.kd-report-person')) closeSignerOptions();
    });

    function paperHtml() {
        const body = rows().map(row => `<tr>${row.map(value =>
            `<td>${escapeHtml(cell(value))}</td>`).join('')}</tr>`).join('');
        const metadata = meta().map(([key, value]) => `<div><b>${escapeHtml(key)}</b><span>: ${escapeHtml(cell(value))}</span></div>`).join('');
        const signatures = roles.map(([key, label]) => {
            const person = chosen(key);
            return `<div class="kd-report-signature"><b>${escapeHtml(label)},</b>
                <span>${escapeHtml(cell(person?.jabatan))}</span>
                <u>${escapeHtml(cell(person?.nama))}</u>
                <span>NIP. ${escapeHtml(cell(person?.nip))}</span></div>`;
        }).join('');
        return `<article class="kd-report-paper">
            <div class="kd-report-kop">
                <img src="${escapeHtml(page.dataset.reportLogo)}" alt="Logo horizontal Perumda Tirta Kencana">
                <div class="kd-report-kop-title">
                    <strong>KARTU INVENTARIS BARANG (K.I.B)</strong>
                    <strong>${escapeHtml(title())}</strong>
                    <small>${escapeHtml(jenisNama())} · ${escapeHtml(state.lokasi?.nama || '-')}</small>
                    <strong>PERIODE ${escapeHtml(periodName())}</strong>
                </div>
            </div>
            <div class="kd-report-meta">${metadata}</div>
            <div class="kd-report-table-scroll"><table class="kd-report-table">
                <thead>${tableHead()}</thead><tbody>${body}</tbody>
            </table></div>
            <div class="kd-report-date">Samarinda, ${escapeHtml(dateName())}</div>
            <div class="kd-report-signatures">${signatures}</div>
        </article>`;
    }

    function updatePreview() {
        const ok = ready();
        print.disabled = download.disabled = !ok;
        previewBox.hidden = !ok;
        if (!ok) preview.replaceChildren();
        if (!state.data.length) {
            info.textContent = 'Belum ada data K.I.B D pada lokasi ini atau data masih dimuat.';
        } else if (!ok) {
            info.textContent = `${state.data.length} data K.I.B D siap. Pilih periode dan 4 penandatangan dari Master SDM.`;
        } else {
            info.textContent = `Preview siap: ${state.data.length} data K.I.B D di lokasi ${state.lokasi?.nama || '-'}. Status Kepemilikan tidak dicetak.`;
            $('#kdReportCount').textContent = `${state.data.length} data`;
            preview.innerHTML = paperHtml();
        }
    }

    async function openReport(kind, lokasiId) {
        const version = ++requestVersion;
        state.data = [];
        state.sdm = [];
        state.lokasi = null;
        state.organisasi = {};
        state.jenis = kind;
        form.reset();
        closeSignerOptions();
        signerFields.forEach(field => {
            const id = field.querySelector('.kd-report-person-id');
            const description = field.querySelector('.kd-report-person-description');
            if (id) id.value = '';
            if (description) description.textContent = 'Pilih dari Master SDM Pendukung.';
        });
        const parts = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric', month: '2-digit', timeZone: 'Asia/Makassar'
        }).formatToParts(new Date());
        month.value = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
        scope.textContent = 'Memuat seluruh inventaris pada Detail lokasi terpilih...';
        info.textContent = 'Memuat sumber laporan dan Master SDM Pendukung...';
        updatePreview();
        if (!dialog.open) dialog.showModal();
        window.lucide?.createIcons?.();
        try {
            const url = `${page.dataset.reportBaseUrl}/${encodeURIComponent(kind)}/lokasi/${encodeURIComponent(lokasiId)}/laporan`;
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
            state.jenis = json.jenis || kind;
            scope.textContent = `${jenisNama()} · lokasi ${state.lokasi?.nama || '-'} · ${state.data.length} data`;
            // Daftar SDM akan muncul saat pengguna fokus pada kolom penandatangan.
            // ID SDM disimpan terpisah untuk menangani nama yang sama.
            updatePreview();
        } catch (error) {
            if (!dialog.open || version !== requestVersion) return;
            console.error('K.I.B D: gagal memuat laporan:', error);
            state.data = [];
            updatePreview();
            info.textContent = `Gagal memuat laporan: ${error.message}`;
        }
    }
    document.addEventListener('kibd:report', event => {
        const kind = event.detail?.kind;
        const location = Number(event.detail?.location);
        if (['gedung', 'jembatan'].includes(kind) && Number.isSafeInteger(location) && location >= 0) {
            openReport(kind, location);
        }
    });
    dialog.querySelectorAll('[data-kd-report-close]').forEach(button => {
        button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('close', () => {
        requestVersion++;
        closeSignerOptions();
    });
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

    /** Workbook Office OpenXML 17 kolom sesuai contoh K.I.B D. */
    function buildXlsx(logoBytes) {
        const count = 17;
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
        merged(dateRow, 13, dateRow, 17, `Samarinda, ${dateName()}`, 5);
        const slots = [[1,4], [5,8], [9,12], [13,17]];
        roles.forEach(([key, label], i) => {
            const signer = chosen(key);
            const [a, b] = slots[i];
            merged(dateRow + 2, a, dateRow + 2, b, `${label},`, 5);
            merged(dateRow + 3, a, dateRow + 3, b, cell(signer?.jabatan), 5);
            merged(dateRow + 8, a, dateRow + 8, b, cell(signer?.nama), 6);
            merged(dateRow + 9, a, dateRow + 9, b, `NIP. ${cell(signer?.nip)}`, 5);
        });
        const lastRow = dateRow + 10;
        const widths = [7,30,22,14,21,19,18,17,34,20,28,17,22,24,22,22,38];
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
            <dimension ref="A1:Q${lastRow}"/>
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
            <workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="KIB D - Inventaris" sheetId="1" r:id="rId1"/></sheets>
            <definedNames>
                <definedName name="_xlnm.Print_Titles" localSheetId="0">'KIB D - Inventaris'!$17:$19</definedName>
                <definedName name="_xlnm.Print_Area" localSheetId="0">'KIB D - Inventaris'!$A$1:$Q$${lastRow}</definedName>
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
            a.download = `KIB_D_Inventaris_${String(state.lokasi?.nama || 'Lokasi')
                .normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48)}_${month.value}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Gagal membuat Excel K.I.B D:', error);
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
          <title>K.I.B D — Jalan, Irigasi dan Jaringan</title><link rel="stylesheet" href="${cssUrl}">
          <style>@page { size:A3 landscape; margin:10mm; }
          html,body{margin:0;padding:0;background:#fff}
          .kd-report-paper{width:100%;max-width:none;min-width:0;box-shadow:none;border:0;padding:0}
          .kd-report-table-scroll{overflow:visible}
          .kd-report-table{font-size:8px}
          .kd-report-table thead{display:table-header-group}
          .kd-report-table tr{break-inside:avoid}
          .kd-report-signatures{break-inside:avoid}
          </style></head><body>${paperHtml()}</body></html>`);
        w.document.close();
        w.addEventListener('load', () => { w.focus(); w.print(); }, {once:true});
    });
});