(() => {
    'use strict';

    // 01. Inisialisasi dan helper
    const root = document.getElementById('arsipPage');
    if (!root)
        return;
    const $ = id => document.getElementById(id);
    const indices = JSON.parse(root.dataset.indices || '[]');
    const s = v => v === null || v === undefined ? '' : String(v).trim();
    const display = v => s(v) || '—';
    const distinct = (rows, key) => [...new Set(rows.map(r => s(r[key])).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
    const indexLabel = i => `Gedung ${display(i.gedung)} / Filling ${display(i.fill)} / Rak ${display(i.rak)} / Baris ${display(i.no_file)} — ${display(i.nama_dok)} (#${i.id})`;
    const options = (el, values, empty, previous = el.value) => {
        el.replaceChildren(new Option(empty, ''));
        for (const [value, label] of values)
            el.add(new Option(label, value));
        if (previous && !Array.from(el.options).some(o => o.value === String(previous)))
            el.add(new Option(`${previous} (tidak tersedia)`, previous));
        el.value = previous || '';
    };

    // 02. Filter dan lokasi bertingkat
    const filter = $('arFilter');
    const g = $('arBuilding'),
        f = $('arFilling'),
        r = $('arRack'),
        idx = $('arIndex'),
        yr = $('arYear');
    function refreshFilters(initial = false, resetLevel = '') {
        const previous = el => initial ? el.dataset.current : el.value;
        const gp = previous(g), fp = resetLevel === 'g' ? '' : previous(f), rp = ['g', 'f'].includes(resetLevel) ? '' : previous(r), ip = resetLevel ? '' : previous(idx);
        options(g, distinct(indices, 'gedung').map(x => [x, `Gedung ${x}`]), 'Semua Gedung', gp);
        const gs = indices.filter(i => !g.value || s(i.gedung) === g.value);
        options(f, distinct(gs, 'fill').map(x => [x, `Filling ${x}`]), 'Semua Filling', fp);
        const fs = gs.filter(i => !f.value || s(i.fill) === f.value);
        options(r, distinct(fs, 'rak').map(x => [x, `Rak ${x}`]), 'Semua Rak', rp);
        const rs = fs.filter(i => !r.value || s(i.rak) === r.value);
        options(idx, rs.map(i => [s(i.id), indexLabel(i)]), 'Semua Baris / Indeks', ip);
        options(yr, distinct(indices, 'tahun').reverse().map(x => [x, x]), 'Semua Tahun', previous(yr));
        $('arPathBuilding').textContent = g.value ? `Gedung ${g.value}` : 'Semua Gedung';
        $('arPathFilling').textContent = f.value ? `Filling ${f.value}` : 'Semua Filling';
        $('arPathRack').textContent = r.value ? `Rak ${r.value}` : 'Semua Rak';
        const selected = indices.find(i => s(i.id) === idx.value);
        $('arPathIndex').textContent = selected ? `Baris ${display(selected.no_file)}` : 'Semua Baris';
    }
    refreshFilters(true);
    g.addEventListener('change', () => refreshFilters(false, 'g'));
    f.addEventListener('change', () => refreshFilters(false, 'f'));
    r.addEventListener('change', () => refreshFilters(false, 'r'));
    idx.addEventListener('change', () => refreshFilters());
    root.querySelectorAll('[data-focus]').forEach(b => b.addEventListener('click', () => $(b.dataset.focus)?.focus()));
    const quick = $('arQuickBuildings');
    distinct(indices, 'gedung').forEach(value => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ar-quick-btn';
        b.textContent = `Gedung ${value}`;
        b.addEventListener('click', () => { g.value = value; refreshFilters(false, 'g'); filter.requestSubmit(); });
        quick.append(b);
    });
    if (!quick.childElementCount)
        quick.textContent = 'Belum ada gedung terdaftar.';

    // 03. Detail dokumen dan PDF
    const money = value => s(value) === '' ? '—' : `Rp ${s(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    const date = value => /^\d{4}-\d{2}-\d{2}$/.test(s(value)) ? s(value).split('-').reverse().join('/') : display(value);
    const tableRows = Array.from(root.querySelectorAll('tr[data-row]'));
    let current = null;
    const linkState = (id, url, enabled) => {
        const a = $(id);
        if (enabled) {
            a.href = url;
            a.removeAttribute('aria-disabled');
            a.removeAttribute('tabindex');
        }
        else {
            a.removeAttribute('href');
            a.setAttribute('aria-disabled', 'true');
            a.tabIndex = -1;
        }
    };
    function detail(row) {
        current = JSON.parse(row.dataset.row);
        tableRows.forEach(tr => tr.classList.toggle('ar-selected', tr === row));
        $('arWorkspace').classList.remove('ar-detail-closed');
        $('arDetail').hidden = false;
        $('arDetailBody').hidden = false;
        $('arDetailEmpty').hidden = true;
        const values = {
            ...current, nilai: money(current.nilai), retensi_akhir: date(current.retensi_akhir), remaining: current.retention?.remaining, retention_label: current.retention?.label, file_name: current.has_file ? (current.file_name || 'PDF tersedia') : 'Belum ada PDF digital', id: `#${current.id}`, gedung: current.gedung == null ? '—' : `Gedung ${current.gedung}`, fill: current.fill == null ? '—' : `Filling ${current.fill}`
        };
        root.querySelectorAll('[data-detail]').forEach(el => el.textContent = display(values[el.dataset.detail]));
        const condition = root.querySelector('[data-detail="kondisi"]');
        condition.classList.toggle('ar-good', ['baik', 'lengkap'].includes(s(current.kondisi).toLowerCase()));
        const ret = root.querySelector('[data-detail="retention_label"]');
        ret.className = `ar-retention ar-${current.retention?.key || 'unknown'}`;
        linkState('arViewPdf', current.view_url, current.has_file);
        linkState('arDownloadPdf', current.download_url, current.has_file);
    }
    $('arCloseDetail').addEventListener('click', () => { $('arDetail').hidden = true; $('arWorkspace').classList.add('ar-detail-closed'); });

    // 04. Form tambah dan edit arsip
    const dialog = $('arDialog'), form = $('arForm'), select = $('arFormIndex'), search = $('arIndexSearch');
    const field = name => form.elements.namedItem(name);
    function refreshIndex(value = select.value) {
        const q = s(search.value).toLocaleLowerCase('id');
        const matches = indices.filter(i => !q || indexLabel(i).toLocaleLowerCase('id').includes(q) || s(i.kode_dok).includes(q) || s(i.id) === String(value));
        options(select, matches.map(i => [s(i.id), indexLabel(i)]), 'Pilih indeks', value);
        const item = indices.find(i => s(i.id) === select.value);
        $('arIndexInfo').textContent = item ? `Kode: ${display(item.kode_dok)} · Tahun: ${display(item.tahun)} · ${indexLabel(item)}` : '';
    }
    function mode() {
        const isNew = field('index_mode').value === 'new';
        $('arExistingIndex').hidden = isNew;
        $('arNewIndex').hidden = !isNew;
        select.required = !isNew;
        select.disabled = isNew;
        search.disabled = isNew;
        $('arNewIndex').querySelectorAll('input,select,textarea').forEach(el => { el.disabled = !isNew; el.required = isNew && el.hasAttribute('data-required'); });
    }
    const dep = $('arDepartment'), div = $('arDivision');
    const allDivs = Array.from(div.options).slice(1).map(o => ({ value: o.value, label: o.textContent, dep: o.dataset.dep }));
    function divisions(previous = div.value) { options(div, allDivs.filter(o => o.dep === dep.value).map(o => [o.value, o.label]), 'Pilih Divisi', previous); }
    dep.addEventListener('change', () => divisions(''));
    form.querySelectorAll('[name="index_mode"]').forEach(el => el.addEventListener('change', mode));
    search.addEventListener('input', () => refreshIndex());
    select.addEventListener('change', () => refreshIndex());
    function open(item = null, indexId = '') {
        form.reset();
        for (const name of [
            'judul', 'reg', 'kondisi', 'rekanan', 'nilai', 'retensi', 'retensi_akhir', 'ket', 'gedung', 'fill', 'rak', 'no_file', 'nama_dok', 'kode_dok', 'bulan', 'tahun', 'id_departemen', 'index_ket'
        ])
            field(name).value = '';
        search.value = '';
        field('index_mode').value = 'existing';
        field('editing_id').value = item ? item.id : 0;
        form.action = item ? item.edit_url : form.dataset.store;
        $('arMethod').disabled = !item;
        $('arDialogTitle').textContent = item ? 'Edit Arsip' : (indexId ? 'Tambah Dokumen pada Indeks' : 'Tambah Arsip');
        $('arFileHint').textContent = item?.has_file ? `PDF saat ini: ${display(item.file_name)}. Kosongkan jika tidak mengganti.` : 'Unggah PDF jika dokumen digital tersedia.';
        if (item) {
            for (const name of [
                'judul', 'reg', 'kondisi', 'rekanan', 'nilai', 'retensi', 'retensi_akhir', 'ket'
            ])
                field(name).value = s(item[name]);
            // Pre-fill new-index fields as a convenience if user deliberately chooses a new index.
            for (const name of [
                'gedung', 'fill', 'rak', 'no_file', 'nama_dok', 'kode_dok', 'bulan', 'tahun', 'id_departemen'
            ])
                field(name).value = s(item[name]);
            divisions(s(item.id_div));
            refreshIndex(s(item.id_indeks));
        }
        else {
            divisions('');
            refreshIndex(s(indexId));
        }
        mode();
        dialog.showModal();
    }

    // 05. Penelusuran indeks fisik (Gedung, Filling, Rak, Baris)
    const browserBuilding = $('arBrowserBuilding');
    const browserTree = $('arBrowserTree');
    const browserSearch = $('arBrowserSearch');
    const browserSize = $('arBrowserSize');
    const browserRows = $('arBrowserRows');
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const appliedIndexId = s(idx.dataset.current);
    const appliedIndex = indices.find(i => s(i.id) === appliedIndexId);
    const browserState = {
        building: s(appliedIndex?.gedung) || s(g.dataset.current),
        filling: s(appliedIndex?.fill) || s(f.dataset.current),
        rack: s(appliedIndex?.rak) || s(r.dataset.current),
        page: 1
    };

    function monthLabel(value) {
        return months[Number(value) - 1] || display(value);
    }

    function browserButton(label, className, handler) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = label;
        button.addEventListener('click', handler);
        return button;
    }

    function contentsUrl(index) {
        const url = new URL(filter.action, window.location.href);
        url.search = '';
        url.searchParams.set('index_id', s(index.id));
        url.hash = 'arDocumentList';
        return url.href;
    }

    function chooseRack(filling, rack) {
        browserState.filling = filling;
        browserState.rack = rack;
        browserState.page = 1;
        browserSearch.value = '';
        renderBrowserTree();
        renderBrowserRows();
    }

    function renderBrowserTree() {
        browserTree.replaceChildren();
        const buildingRows = indices.filter(i => s(i.gedung) === browserState.building);
        if (!browserState.building || !buildingRows.length) {
            browserTree.textContent = 'Pilih Gedung untuk melihat Filling dan Rak.';
            return;
        }

        for (const filling of distinct(buildingRows, 'fill')) {
            const group = document.createElement('div');
            group.className = 'ar-tree-group';
            const title = document.createElement('strong');
            title.textContent = `Filling ${filling}`;
            group.append(title);

            for (const rack of distinct(buildingRows.filter(i => s(i.fill) === filling), 'rak')) {
                const selected = browserState.filling === filling && browserState.rack === rack;
                const button = browserButton(`Rak ${rack}`, 'ar-tree-rack', () => chooseRack(filling, rack));
                button.setAttribute('aria-pressed', String(selected));
                group.append(button);
            }
            browserTree.append(group);
        }

        if (!browserTree.childElementCount) {
            browserTree.textContent = 'Belum ada Filling atau Rak lengkap pada gedung ini.';
        }
    }

    function renderBrowserRows() {
        const ready = Boolean(browserState.building && browserState.filling && browserState.rack);
        browserSearch.disabled = !ready;
        const rows = ready ? indices.filter(i =>
            s(i.gedung) === browserState.building &&
            s(i.fill) === browserState.filling &&
            s(i.rak) === browserState.rack
        ) : [];
        const term = s(browserSearch.value).toLocaleLowerCase('id');
        const matches = rows.filter(i => [
            i.no_file, i.nama_dok, i.kode_dok, i.tahun, i.bulan, monthLabel(i.bulan)
        ].some(value => s(value).toLocaleLowerCase('id').includes(term)));
        const size = Number(browserSize.value) || 10;
        const pages = Math.max(1, Math.ceil(matches.length / size));
        browserState.page = Math.min(Math.max(1, browserState.page), pages);
        const start = (browserState.page - 1) * size;
        const visible = matches.slice(start, start + size);

        $('arBrowserContext').textContent = ready
            ? `Gedung ${browserState.building} / Filling ${browserState.filling} / Rak ${browserState.rack}`
            : 'Pilih Gedung dan Rak untuk melihat daftar baris.';
        browserRows.replaceChildren();

        function cell(row, value) {
            const td = document.createElement('td');
            td.textContent = value;
            row.append(td);
            return td;
        }

        for (const index of visible) {
            const row = document.createElement('tr');
            if (s(index.id) === appliedIndexId) {
                row.classList.add('ar-selected');
            }
            const link = document.createElement('a');
            link.className = 'ar-index-link';
            link.href = contentsUrl(index);
            link.textContent = display(index.no_file);
            link.title = `Lihat isi indeks #${index.id}`;
            cell(row, '').append(link);
            cell(row, display(index.nama_dok));
            cell(row, monthLabel(index.bulan));
            cell(row, display(index.kode_dok));
            cell(row, display(index.tahun));
            cell(row, `${Number(index.jumlah_dokumen || 0)} dokumen`);
            const add = browserButton('+', 'ar-btn ar-outline ar-add-index', () => open(null, index.id));
            add.setAttribute('aria-label', `Tambah dokumen pada baris ${display(index.no_file)}, indeks ${index.id}`);
            cell(row, '').append(add);
            browserRows.append(row);
        }

        if (!visible.length) {
            const row = document.createElement('tr');
            const empty = cell(row, ready ? 'Tidak ada indeks yang sesuai.' : 'Pilih rak pada panel kiri.');
            empty.colSpan = 7;
            empty.className = 'ar-empty';
            browserRows.append(row);
        }

        $('arBrowserCount').textContent = `Menampilkan ${visible.length ? start + 1 : 0}–${start + visible.length} dari ${matches.length} indeks`;
        $('arBrowserPage').textContent = `${browserState.page} / ${pages}`;
        $('arBrowserPrev').disabled = browserState.page <= 1;
        $('arBrowserNext').disabled = browserState.page >= pages;
    }

    options(browserBuilding, distinct(indices, 'gedung').map(x => [x, `Gedung ${x}`]), 'Pilih Gedung', browserState.building);
    browserBuilding.addEventListener('change', () => {
        browserState.building = browserBuilding.value;
        browserState.filling = '';
        browserState.rack = '';
        browserState.page = 1;
        browserSearch.value = '';
        renderBrowserTree();
        renderBrowserRows();
    });
    browserSearch.addEventListener('input', () => {
        browserState.page = 1;
        renderBrowserRows();
    });
    browserSize.addEventListener('change', () => {
        browserState.page = 1;
        renderBrowserRows();
    });
    $('arBrowserPrev').addEventListener('click', () => {
        browserState.page--;
        renderBrowserRows();
    });
    $('arBrowserNext').addEventListener('click', () => {
        browserState.page++;
        renderBrowserRows();
    });
    root.querySelectorAll('[data-add-index]').forEach(button => {
        button.addEventListener('click', () => open(null, button.dataset.addIndex));
    });
    renderBrowserTree();
    renderBrowserRows();

    // 06. Event dan inisialisasi halaman
    $('arAdd').addEventListener('click', () => open());
    $('arDetailEdit').addEventListener('click', () => { if (current)
        open(current); });
    root.querySelectorAll('[data-close-dialog]').forEach(b => b.addEventListener('click', () => dialog.close()));
    tableRows.forEach(row => {
        row.addEventListener('click', e => {
            const action = e.target.closest('[data-act]');
            if (action) {
                detail(row);
                if (action.dataset.act === 'edit')
                    open(current);
                return;
            }
            if (!e.target.closest('button,a,input,select'))
                detail(row);
        });
    });
    if (tableRows.length)
        detail(tableRows[0]);
    if (root.dataset.reopen === '1') {
        refreshIndex(select.dataset.current || '');
        divisions(div.dataset.current || '');
        mode();
        dialog.showModal();
    }
    else {
        refreshIndex();
        divisions('');
        mode();
    }
    form.addEventListener('submit', () => {
        const b = form.querySelector('[type="submit"]');
        b.disabled = true;
        b.textContent = 'Menyimpan…';
    });

    // 07. Jam WITA
    function clock() { const now = new Date(); $('arDate').textContent = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(now); $('arTime').textContent = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(now).replace('.', ':') + ' WITA'; }
    clock();
    setInterval(clock, 30000);
})();