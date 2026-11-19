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
        tab: 'gedung', page: 1, perPage: 10,
        location: null, locationName: '', data: [], selectedIndex: -1,
        editingId: null, editingLegacyOwner: null, exporting: false, requestNo: 0
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
            addButton.disabled = state.tab === 'jembatan' && root.dataset.manualReady !== '1';
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

    /* ------------------------------------------------------------
       DETAIL LOKASI (SELURUH DATA, TIDAK TERPOTONG PAGINATION)
       ------------------------------------------------------------ */
    async function loadDetail(kind, location) {
        const requestNo = ++state.requestNo;
        state.location = Number(location);
        state.data = [];
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
            state.data = response.data || [];
            $('kdDetailTitle').textContent = `DATA ${state.locationName.toUpperCase()}`;
            $('kdDetailSubtitle').textContent = `${kind === 'gedung' ? 'Gedung / Irigasi' : 'Jembatan'} · ${response.lokasi.alamat || 'Alamat belum tersedia'}`;
            $('kdDetailSearch').value = '';
            renderDetail();
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
        $('kdBerkasSource').textContent = item.source === 'arsip'
            ? 'Arsip web lama · hanya baca' : item.source === 'gedung'
            ? 'Tersinkron dengan K.I.B C · kelola di Gedung dan Bangunan'
            : 'Jembatan · data baru';
        $('kdBerkasFoto').innerHTML = item.foto_url
            ? `<a href="${esc(item.foto_url)}" target="_blank" rel="noopener"><img src="${esc(item.foto_url)}" loading="lazy" alt="Foto ${esc(item.nama_barang)}"></a>`
            : 'Foto belum tersedia';
        $('kdBerkasDok').innerHTML = item.dokumen_url
            ? `<a href="${esc(item.dokumen_url)}" target="_blank" rel="noopener">Lihat PDF / Dokumen</a>`
            : 'Dokumen belum tersedia';
        const actions = $('kdBerkasActions');
        if (item.source === 'manual') {
            actions.innerHTML = `<button type="button" class="kd-button outline" data-kd-edit="${Number(item.id)}"><i data-lucide="pencil"></i> Edit</button>` +
                `<button type="button" class="kd-button outline" data-kd-delete="${Number(item.id)}"><i data-lucide="trash-2"></i> Hapus</button>` +
                '<button type="button" class="kd-button outline" data-kd-hide="1">Tutup Berkas</button>';
        } else if (item.source === 'gedung') {
            actions.innerHTML = `<a href="${esc(root.dataset.gedung)}" class="kd-button outline"><i data-lucide="building-2"></i> Kelola di K.I.B C</a>` +
                '<button type="button" class="kd-button outline" data-kd-hide="1">Tutup Berkas</button>';
        } else {
            actions.innerHTML = `<button type="button" class="kd-button outline" data-kd-owner-legacy="${Number(item.id)}"><i data-lucide="user-round-cog"></i> Atur Kepemilikan</button>` +
                '<span class="kd-owner unknown">Data inventaris asli tetap aman</span>' +
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
        const options = [...select.options].filter(option => option.value);
        const show = () => {
            const query = plain(input.value).toLocaleLowerCase('id-ID');
            const matched = options.filter(option => !query ||
                option.textContent.toLocaleLowerCase('id-ID').includes(query)).slice(0, 80);
            menu.innerHTML = matched.length ? matched.map(option =>
                `<button type="button" role="option" data-value="${esc(option.value)}">${esc(option.textContent)}</button>`
            ).join('') : '<div class="kd-option-empty">Pilihan tidak ditemukan</div>';
            menu.hidden = false;
        };
        const selectValue = value => {
            select.value = String(value ?? '');
            const option = options.find(opt => opt.value === select.value);
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
    const nameInput = $('kdNamaBarang');
    nameInput.addEventListener('input', () => { $('kdIdBarang').value = ''; });
    nameInput.addEventListener('change', () => {
        const target = plain(nameInput.value).toLocaleLowerCase('id-ID');
        const match = [...$('kdBarangOptions').options].find(option =>
            plain(option.value).toLocaleLowerCase('id-ID') === target);
        $('kdIdBarang').value = match?.dataset.id || '';
        if (match && !$('kdKode').value.trim()) $('kdKode').value = match.dataset.code || '';
    });

    /* Kepemilikan arsip disimpan pada kolom kib_d_s.status_kepemilikan bila tersedia. */
    function openLegacyOwner(id) {
        const item = state.data.find(row => row.source === 'arsip' && Number(row.id) === id);
        if (!item) return;
        state.editingLegacyOwner = id;
        $('kdOwnerMessage').textContent = '';
        $('kdOwnerTitle').textContent = `Atur Kepemilikan — ${item.nama_barang}`;
        // Ada dua select status: satu milik form Jembatan, satu khusus arsip.
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
       CRUD MANUAL: arsip & gedung read-only.
       ------------------------------------------------------------ */
    async function openForm(id = null) {
        const form = $('kdForm');
        form.reset();
        state.editingId = id;
        $('kdEditId').value = id || '';
        $('kdFormTitle').textContent = id ? 'Edit Data Jembatan' : 'Tambah Data Jembatan';
        $('kdFormMessage').textContent = '';
        $('kdIdBarang').value = '';
        ['id_lokasi','id_departemen','id_div','kondisi',
         'konstruksi','materi','status_kepemilikan']
            .forEach(name => setCombo(name, ''));
        if (id) {
            try {
                const res = await api(`${base}/manual/${id}`);
                for (const [name,value] of Object.entries(res.data)) {
                    if (['id_lokasi','id_departemen','id_div','kondisi','konstruksi',
                         'materi','status_kepemilikan','foto_path','dokumen_path'].includes(name)) continue;
                    const control = form.elements.namedItem(name);
                    if (control && control.type !== 'file') control.value = value ?? '';
                }
                ['id_lokasi','id_departemen','id_div','kondisi',
                 'konstruksi','materi','status_kepemilikan'].forEach(
                    name => setCombo(name, res.data[name]));
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
        if (!locationCombo?.select.value || !owner?.select.value || !nameInput.value.trim()) {
            $('kdFormMessage').textContent = 'Isi lokasi, nama barang dan Status Kepemilikan dari pilihan yang tersedia.';
            return;
        }
        const button = $('kdSave');
        const data = new FormData(form);
        if (state.editingId) data.append('_method', 'PUT');
        button.disabled = true;
        $('kdFormMessage').textContent = 'Menyimpan data...';
        try {
            await api(state.editingId ? `${base}/manual/${state.editingId}` : `${base}/manual`, {
                method:'POST', body:data
            });
            closeDialog('kdFormDialog');
            window.location.reload();
        } catch (error) {
            $('kdFormMessage').textContent = error.message;
        } finally { button.disabled = false; }
    });
    async function deleteManual(id) {
        if (!confirm('Hapus data Jembatan ini? Data arsip tidak akan berubah.')) return;
        try {
            await api(`${base}/manual/${id}`, { method:'DELETE' });
            window.location.reload();
        } catch (error) { alert('Gagal menghapus: ' + error.message); }
    }

    /* ------------------------------------------------------------
       XLSX: satu lokasi, seluruh record, urutan sesuai Excel K.I.B D.
       Text inlineStr melindungi dari eksekusi formula input pengguna.
       ------------------------------------------------------------ */
    function buildXlsx(payload) {
        const items = payload.data;
        if (!Array.isArray(items) || !items.length) {
            throw new Error('Lokasi ini belum memiliki inventaris untuk diekspor.');
        }
        const locationId = Number(payload.lokasi.id);
        if (items.some(item => Number(item.id_lokasi) !== locationId)) {
            throw new Error('Lokasi barang tidak sesuai. Export dibatalkan.');
        }
        const enc = new TextEncoder();
        const decl = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
        const xml = value => String(value ?? '')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
        const cell = (address,value,style=4) => `<c r="${address}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(empty(value))}</t></is></c>`;
        const num = (address,value,style=5) => {
            const n = Number(value);
            return value !== null && value !== undefined && plain(value) !== '' && Number.isFinite(n)
                ? `<c r="${address}" s="${style}"><v>${n}</v></c>` : cell(address, value, style);
        };
        const row = (i,cells,height=25) => `<row r="${i}" ht="${height}" customHeight="1">${cells.join('')}</row>`;
        const keys = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S'];
        const meta = [
            ['PROVINSI','KALIMANTAN TIMUR'],
            ['KOTA','SAMARINDA'],
            ['UNIT','PERUMDAM TIRTA KENCANA KOTA SAMARINDA'],
            ['LOKASI',payload.lokasi.lokasi],
            ['ALAMAT',payload.lokasi.alamat],
            ['KATEGORI',payload.jenis === 'gedung' ? 'GEDUNG / IRIGASI (SUMBER K.I.B C)' : 'JEMBATAN (K.I.B D)'],
            ['JUMLAH INVENTARIS',String(items.length)]
        ];
        const firstHeader = [
            ['A','No.'],['B','Nama Barang / Jenis Barang'],['C','Nomor'],
            ['E','Kondisi Bangunan (B,KB,RB)'],['F','Konstruksi Bangunan'],
            ['H','Luas Lantai (M²)'],['I','Letak / Lokasi Alamat'],
            ['J','Dokumen Gedung'],['L','Luas (M²)'],['M','Status Tanah'],
            ['N','Nomor Kode Tanah'],['O','Asal Usul'],['P','Harga (Rp.)'],
            ['Q','Keterangan'],['R','Status Kepemilikan'],['S','Sumber Data']
        ];
        const rows = [
            row(1,[cell('A1','KARTU INVENTARIS BARANG D',1)],32),
            row(2,[cell('A2','JALAN, IRIGASI DAN JARINGAN',2)],27),
            ...meta.map(([key,value], i) => row(i+3,[cell(`A${i+3}`,key,3),cell(`C${i+3}`,': '+empty(value))])),
            row(10,[]),
            row(11,firstHeader.map(([column,value]) => cell(`${column}11`,value,3)),40),
            row(12,[cell('C12','Kode Barang',3),cell('D12','Register',3),
                cell('F12','Bertingkat / Tidak',3),cell('G12','Beton / Tidak',3),
                cell('J12','Tanggal',3),cell('K12','Nomor',3)],32),
            ...items.map((item,i) => {
                const r = i + 13;
                const values = [i+1,item.nama_barang,item.kode,item.reg,item.kondisi,
                    item.konstruksi,item.materi,item.luas_lantai,item.letak || payload.lokasi.alamat,
                    fmtDate(item.tgl_dok),item.no_dok,item.luas,item.status_tanah,
                    item.kode_tanah,item.asal,item.harga,item.ket,
                    ownerText(item.status_kepemilikan),
                    item.source === 'arsip' ? 'Arsip KIB D' : item.source === 'gedung'
                        ? 'KIB C' : 'KIB D Baru'];
                return row(r,values.map((value,c) => c===0 || c===15
                    ? num(`${keys[c]}${r}`,value)
                    : cell(`${keys[c]}${r}`,value)),27);
            })
        ];
        const vertical = ['A','B','E','H','I','L','M','N','O','P','Q','R','S'];
        const merges = ['A1:S1','A2:S2','C11:D11','F11:G11','J11:K11',
            ...vertical.map(x => `${x}11:${x}12`)];
        const widths = [7,37,21,15,24,20,20,18,37,18,24,15,19,23,25,22,37,26,18];
        const sheet = decl + `<worksheet xmlns="${ns}">` +
            `<dimension ref="A1:S${items.length+12}"/>` +
            '<sheetViews><sheetView workbookViewId="0"><pane xSplit="2" ySplit="12" topLeftCell="C13" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>' +
            `<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>` +
            `<sheetData>${rows.join('')}</sheetData>` +
            `<mergeCells count="${merges.length}">${merges.map(v=>`<mergeCell ref="${v}"/>`).join('')}</mergeCells>` +
            '<pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>' +
            '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
        const styles = decl + `<styleSheet xmlns="${ns}">` +
            '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><name val="Calibri"/></font><font><b/><sz val="10"/><name val="Calibri"/></font></fonts>' +
            '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
            '<fill><patternFill patternType="solid"><fgColor rgb="FFFFEC34"/></patternFill></fill>' +
            '<fill><patternFill patternType="solid"><fgColor rgb="FFF0F6FD"/></patternFill></fill></fills>' +
            '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
            '<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders>' +
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
            '<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
            '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
            '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
            '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
            '<xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"/>' +
            '</cellXfs></styleSheet>';
        const workbook = decl + `<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets><sheet name="KIB D Lokasi" sheetId="1" r:id="rId1"/></sheets></workbook>`;
        const workbookRels = decl + `<Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`;
        const rootRels = decl + `<Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
        const types = decl + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';

        // OpenXML ZIP writer; STORE tanpa kompresi, tanpa pustaka eksternal.
        const table = new Uint32Array(256);
        for (let i=0;i<256;i++) { let n=i;for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xEDB88320:0);table[i]=n>>>0; }
        const crc32 = bytes => { let c=0xFFFFFFFF;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0; };
        const zip = files => {
            const parts=[],central=[];let offset=0,centralSize=0;
            for(const [name,body] of files) {
                const n=enc.encode(name),b=enc.encode(body),crc=crc32(b);
                const local=new Uint8Array(30+n.length+b.length),l=new DataView(local.buffer);
                l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);
                l.setUint32(14,crc,true);l.setUint32(18,b.length,true);l.setUint32(22,b.length,true);
                l.setUint16(26,n.length,true);local.set(n,30);local.set(b,30+n.length);parts.push(local);
                const cd=new Uint8Array(46+n.length),c=new DataView(cd.buffer);
                c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);
                c.setUint32(16,crc,true);c.setUint32(20,b.length,true);c.setUint32(24,b.length,true);
                c.setUint16(28,n.length,true);c.setUint32(42,offset,true);cd.set(n,46);
                central.push(cd);centralSize+=cd.length;offset+=local.length;
            }
            const end=new Uint8Array(22),view=new DataView(end.buffer);
            view.setUint32(0,0x06054b50,true);view.setUint16(8,files.length,true);view.setUint16(10,files.length,true);
            view.setUint32(12,centralSize,true);view.setUint32(16,offset,true);
            const chunks=[...parts,...central,end],result=new Uint8Array(chunks.reduce((s,p)=>s+p.length,0));
            let at=0;for(const part of chunks){result.set(part,at);at+=part.length;}return result;
        };
        return zip([['[Content_Types].xml',types],['_rels/.rels',rootRels],
            ['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',workbookRels],
            ['xl/styles.xml',styles],['xl/worksheets/sheet1.xml',sheet]]);
    }
    async function exportLocation(kind, location) {
        if (state.exporting) return;
        state.exporting = true;
        try {
            // Seluruh baris diambil dari endpoint lokasi, bukan pagination browser.
            const payload = await api(`${base}/${encodeURIComponent(kind)}/lokasi/${encodeURIComponent(location)}`);
            const bytes = buildXlsx(payload);
            const blob = new Blob([bytes], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            const fileLocation = plain(payload.lokasi.lokasi).replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,60);
            anchor.href=url;
            anchor.download=`KIB_D_${kind}_${fileLocation || location}.xlsx`;
            document.body.appendChild(anchor);
            anchor.click();anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch(error) { alert('Export Excel gagal: '+error.message); }
        finally { state.exporting=false; }
    }
    $('kdExportDetail').addEventListener('click', () => exportLocation(state.tab, state.location));
    renderPage();
    icons();
})();
