
/*
|--------------------------------------------------------------------------
| K.I.B E — ASET TETAP LAINNYA
| PERUMDAM TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
| Database: kib_aset_tetap_manual
| Popup Kelompok: 10 kolom Excel + 1 View
| Popup Detail: Format Excel tanpa TTD
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const root = document.getElementById('aemApp');

    if (!root || root.dataset.loaded === '1') return;

    root.dataset.loaded = '1';

    /* ======================================================
       EXPORT EXCEL XLSX — MENYATU DALAM ASET_TTP.JS
       Sebelumnya file terpisah: aset_ttp_excel.js
       Semua fungsi XLSX tetap dipertahankan.
       ====================================================== */

    const AEMExcel = (() => {
    const encoder = new TextEncoder();
    const ownership = {
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    };
    const conditions = {
        BAIK: 'Baik (B)',
        'KURANG BAIK': 'Kurang Baik (KB)',
        'RUSAK BERAT': 'Rusak Berat (RB)',
        CUKUP: 'Cukup (lama)',
        'RUSAK RINGAN': 'Rusak Ringan (lama)'
    };

    const text = value => String(value ?? '').trim();
    const shown = value => text(value) || '—';
    const xmlEscape = value => String(value)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    function crc32(bytes) {
        let crc = 0xFFFFFFFF;
        for (const byte of bytes) {
            crc ^= byte;
            for (let i = 0; i < 8; i++) {
                crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
            }
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    // ZIP tanpa kompresi valid untuk .xlsx, kompatibel dengan Excel/LibreOffice.
    function zipStore(files) {
        const localParts = [];
        const centralParts = [];
        let offset = 0;
        let centralSize = 0;

        for (const [fileName, xml] of files) {
            const name = encoder.encode(fileName);
            const bytes = encoder.encode(xml);
            const crc = crc32(bytes);
            const local = new Uint8Array(30 + name.length + bytes.length);
            const l = new DataView(local.buffer);
            l.setUint32(0, 0x04034b50, true);
            l.setUint16(4, 20, true);
            l.setUint16(6, 0x0800, true); // Nama UTF-8
            l.setUint16(8, 0, true); // Store (tanpa kompresi)
            l.setUint32(14, crc, true);
            l.setUint32(18, bytes.length, true);
            l.setUint32(22, bytes.length, true);
            l.setUint16(26, name.length, true);
            local.set(name, 30);
            local.set(bytes, 30 + name.length);
            localParts.push(local);

            const central = new Uint8Array(46 + name.length);
            const c = new DataView(central.buffer);
            c.setUint32(0, 0x02014b50, true);
            c.setUint16(4, 20, true);
            c.setUint16(6, 20, true);
            c.setUint16(8, 0x0800, true);
            c.setUint16(10, 0, true);
            c.setUint32(16, crc, true);
            c.setUint32(20, bytes.length, true);
            c.setUint32(24, bytes.length, true);
            c.setUint16(28, name.length, true);
            c.setUint32(42, offset, true);
            central.set(name, 46);
            centralParts.push(central);
            centralSize += central.length;
            offset += local.length;
        }

        const end = new Uint8Array(22);
        const v = new DataView(end.buffer);
        v.setUint32(0, 0x06054b50, true);
        v.setUint16(8, files.length, true);
        v.setUint16(10, files.length, true);
        v.setUint32(12, centralSize, true);
        v.setUint32(16, offset, true);

        const all = [...localParts, ...centralParts, end];
        const result = new Uint8Array(all.reduce((total, part) => total + part.length, 0));
        let at = 0;
        for (const part of all) {
            result.set(part, at);
            at += part.length;
        }
        return result;
    }

    function xlsx(item) {
        if (!item || !item.id) throw new Error('Detail aset belum dipilih.');

        const prefix = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const m = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';

        const cell = (ref, value, style = 0) =>
            `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
        const numberCell = (ref, value, style = 0) =>
            Number.isFinite(Number(value)) && text(value)
                ? `<c r="${ref}" s="${style}"><v>${Number(value)}</v></c>`
                : cell(ref, shown(value), style);
        const row = (index, contents, height = 0) =>
            `<row r="${index}"${height ? ` ht="${height}" customHeight="1"` : ''}>${contents.join('')}</row>`;
        const cols = 'ABCDEFGHIJK'.split('');

        const details = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDAM TIRTA KENCANA'],
            ['DEPARTEMEN', shown(item.departemen)],
            ['DIVISI', shown(item.divisi)],
            ['KODE STRUKTUR', shown(item.kode_struktur)],
            ['LOKASI / UNIT KERJA', shown(item.lokasi)],
            ['ALAMAT', shown(item.alamat)]
        ];
        const headers = [
            'No.', 'Nama Barang / Jenis Barang', 'Kode Barang', 'Register',
            'Kondisi Barang (B, KB, RB)', 'Bahan', 'Tahun Pengadaan / Perolehan',
            'Jumlah', 'Asal Usul / Cara Perolehan', 'Keterangan', 'Status Kepemilikan'
        ];
        const valueList = [
            '1', shown(item.nama_aset), shown(item.kode_inventaris),
            shown(item.nomor_register),
            conditions[text(item.kondisi).toUpperCase()] || shown(item.kondisi),
            shown(item.bahan), item.tahun, item.jumlah_unit,
            shown(item.asal_perolehan), shown(item.keterangan),
            ownership[text(item.status_kepemilikan).toLowerCase()] || 'Belum Diatur'
        ];

        const rows = [
            row(1, [cell('A1', 'KARTU INVENTARIS BARANG (KIB)', 1)], 28),
            row(2, [cell('A2', 'E. ASET TETAP LAINNYA', 1)], 26),
            ...details.map(([key, val], i) => row(4 + i, [cell(`A${4 + i}`, key, 4), cell(`C${4 + i}`, val)])),
            row(13, headers.map((label, i) => cell(`${cols[i]}13`, label, 2)), 40),
            row(14, valueList.map((value, i) => [6, 7].includes(i)
                ? numberCell(`${cols[i]}14`, value, 3)
                : cell(`${cols[i]}14`, value, 3)), 40)
        ];

        const worksheet = prefix + `<worksheet xmlns="${m}">` +
            `<sheetViews><sheetView workbookViewId="0"/></sheetViews>` +
            `<cols>${[9, 42, 22, 18, 30, 21, 23, 15, 32, 50, 27]
                .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` +
            `<sheetData>${rows.join('')}</sheetData>` +
            `<mergeCells count="2"><mergeCell ref="A1:K1"/><mergeCell ref="A2:K2"/></mergeCells>` +
            `</worksheet>`;

        const styles = prefix + `<styleSheet xmlns="${m}">` +
            `<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>` +
            `<font><b/><sz val="14"/><name val="Calibri"/><color rgb="FF12395F"/></font>` +
            `<font><b/><sz val="10"/><name val="Calibri"/><color rgb="FF092D56"/></font></fonts>` +
            `<fills count="3"><fill><patternFill patternType="none"/></fill>` +
            `<fill><patternFill patternType="gray125"/></fill>` +
            `<fill><patternFill patternType="solid"><fgColor rgb="FFDCEBFA"/><bgColor indexed="64"/></patternFill></fill></fills>` +
            `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>` +
            `<border><left style="thin"><color rgb="FF364758"/></left>` +
            `<right style="thin"><color rgb="FF364758"/></right>` +
            `<top style="thin"><color rgb="FF364758"/></top>` +
            `<bottom style="thin"><color rgb="FF364758"/></bottom><diagonal/></border></borders>` +
            `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
            `<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
            `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
            `<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>` +
            `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>` +
            `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
            `</cellXfs></styleSheet>`;

        const workbook = prefix + `<workbook xmlns="${m}" xmlns:r="${rel}">` +
            `<sheets><sheet name="KIB E" sheetId="1" r:id="rId1"/></sheets></workbook>`;
        const workbookRel = prefix + `<Relationships xmlns="${pkg}">` +
            `<Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/>` +
            `<Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/>` +
            `</Relationships>`;
        const rootRel = prefix + `<Relationships xmlns="${pkg}"><Relationship Id="rId1" ` +
            `Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
        const types = prefix + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
            `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
            `<Default Extension="xml" ContentType="application/xml"/>` +
            `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
            `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
            `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
            `</Types>`;

        return zipStore([
            ['[Content_Types].xml', types],
            ['_rels/.rels', rootRel],
            ['xl/workbook.xml', workbook],
            ['xl/_rels/workbook.xml.rels', workbookRel],
            ['xl/styles.xml', styles],
            ['xl/worksheets/sheet1.xml', worksheet]
        ]);
    }

    function download(item) {
        const data = xlsx(item);
        const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const slug = text(item.kode_inventaris || item.id)
            .replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 55);
        anchor.href = url;
        anchor.download = `KIB_E_${slug || 'Detail'}.xlsx`;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    }

        return Object.freeze({ build: xlsx, download });
    })();


    const $ = id => document.getElementById(id);

    const base = String(
        root.dataset.base || ''
    ).replace(/\/$/, '');

    const groupUrl = String(root.dataset.groupUrl || '');
    const token = String(root.dataset.token || '');

    const form = $('aemForm');
    const formDialog = $('aemFormDialog');
    const groupDialog = $('aemGroupPanel');
    const detailDialog = $('aemDetailDialog');
    const deleteDialog = $('aemDeleteDialog');

    const fields = [
        'nama_aset',
        'lokasi',
        'alamat',
        'departemen',
        'divisi',
        'kode_struktur',
        'kode_inventaris',
        'nomor_register',
        'kondisi',
        'bahan',
        'tahun',
        'jumlah_unit',
        'asal_perolehan',
        'keterangan',
        'status_kepemilikan'
    ];

    const norm = value =>
        String(value ?? '')
            .trim()
            .toLocaleLowerCase('id-ID');

    const showValue = value =>
        String(value ?? '').trim() || '—';

    const asArray = value =>
        Array.isArray(value) ? value : [];

    const elem = (
        tag,
        cls = '',
        value = null
    ) => {
        const e = document.createElement(tag);

        if (cls) e.className = cls;

        if (value !== null && value !== undefined) {
            e.textContent = String(value);
        }

        return e;
    };

    const cell = (
        row,
        content,
        cls = ''
    ) => {
        const td = elem('td', cls);

        if (content instanceof Node) {
            td.append(content);
        } else {
            td.textContent = String(content ?? '—');
        }

        row.append(td);

        return td;
    };

    const icons = () =>
        window.lucide?.createIcons?.();

    const open = dialog => {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        icons();
    };

    const close = dialog => {
        if (dialog?.open) dialog.close();
    };

    const parseScript = id => {
        try {
            return JSON.parse(
                $(id)?.textContent || '{}'
            ) || {};
        } catch {
            return {};
        }
    };

    const master = parseScript('aemMaster');
    const history = parseScript('aemHistory');

    const combos = new Map();

    let active = null;
    let editId = null;
    let deleteId = null;

    let saving = false;
    let deleting = false;

    let newFiles = [];
    let toastTimer;

    /* ======================================================
       TOAST
    ====================================================== */

    function toast(message) {
        const box = $('aemToast');

        if (!box) return;

        box.textContent = message;
        box.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            box.hidden = true;
        }, 4000);
    }

    function error(message) {
        const box = $('aemError');

        if (!box) return;

        box.textContent = message || '';
        box.hidden = !message;
    }

    /* ======================================================
       API REQUEST
    ====================================================== */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                Accept: 'application/json',

                'X-Requested-With':
                    'XMLHttpRequest',

                'X-CSRF-TOKEN': token,

                ...(options.headers || {})
            }
        });

        const result = await response
            .json()
            .catch(() => ({}));

        if (
            !response.ok ||
            result.success === false
        ) {
            const validation = result.errors
                ? Object.values(result.errors)
                    .flat()
                    .join('\n')
                : '';

            let message =
                validation ||
                result.message ||
                `Server Error (HTTP ${response.status})`;

            if (response.status === 419) {
                message =
                    'Sesi login habis. Muat ulang halaman.';
            }

            if (response.status === 413) {
                message =
                    'Ukuran file melampaui batas server.';
            }

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                message =
                    'Akses ditolak atau sesi login habis.';
            }

            throw new Error(message);
        }

        return result;
    }

    /* ======================================================
       TOMBOL TUTUP MODAL
    ====================================================== */

    root
        .querySelectorAll('[data-aem-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                close($(button.dataset.aemClose));
            });
        });

    /* ======================================================
       TANGGAL DAN JAM WITA
    ====================================================== */

    const dateFmt = new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone: 'Asia/Makassar',
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }
    );

    const timeFmt = new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone: 'Asia/Makassar',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }
    );

    function tick() {
        if ($('aemDate')) {
            $('aemDate').textContent =
                dateFmt.format(new Date());
        }

        if ($('aemTime')) {
            $('aemTime').textContent =
                timeFmt
                    .format(new Date())
                    .replace(/\./g, ':');
        }
    }

    tick();

    if ($('aemDate') || $('aemTime')) {
        setInterval(tick, 1000);
    }

    /* ======================================================
       SEARCHABLE DROPDOWN
    ====================================================== */

    const presets = {
        kondisi: [
            {
                value: 'BAIK',
                label: 'B — Baik'
            },
            {
                value: 'KURANG BAIK',
                label: 'KB — Kurang Baik'
            },
            {
                value: 'RUSAK BERAT',
                label: 'RB — Rusak Berat'
            },
            {
                value: 'CUKUP',
                label: 'Data lama'
            },
            {
                value: 'RUSAK RINGAN',
                label: 'Data lama'
            }
        ],

        kepemilikan: [
            { value: 'perumdam', label: 'Perumdam Tirta Kencana' },
            { value: 'pusat', label: 'Pemerintah Pusat' },
            { value: 'pemprov', label: 'Pemerintah Provinsi' },
            { value: 'pemkot', label: 'Pemerintah Kota' },
            { value: 'swasta', label: 'Swasta' }
        ],

        asal: [
            'PENGADAAN',
            'PEMBELIAN',
            'HIBAH',
            'BANTUAN',
            'LAINNYA'
        ].map(value => ({ value }))
    };

    function comboOptions(type) {
        let options = [];

        if (type === 'lokasi') {
            options = asArray(master.lokasi)
                .map(o => ({
                    value: o.lokasi,
                    label: o.alamat || '',
                    raw: o
                }));
        }

        if (type === 'departemen') {
            options = asArray(master.departemen)
                .map(o => ({
                    value: o.nama_dep,
                    raw: o
                }));
        }

        if (type === 'divisi') {
            const dep = asArray(master.departemen)
                .find(o =>
                    norm(o.nama_dep) ===
                    norm($('aemDep')?.value)
                );

            const data = dep
                ? asArray(master.divisi)
                    .filter(o =>
                        String(o.id_dep) ===
                        String(dep.id)
                    )
                : asArray(master.divisi);

            options = data.map(o => ({
                value: o.nama_div,
                raw: o
            }));
        }

        if (type === 'bahan') {
            options = asArray(master.bahan)
                .map(o => ({
                    value:
                        o.nama ||
                        o.nama_bahan
                }));
        }

        if (presets[type]) {
            options.push(...presets[type]);
        }

        const more = {
            lokasi: history.lokasi,
            departemen: history.departemen,
            divisi: history.divisi,
            bahan: history.bahan,
            asal: history.asal_perolehan
        };

        for (const value of asArray(more[type])) {
            options.push({
                value: String(value)
            });
        }

        const seen = new Set();

        return options.filter(o => {
            const key = norm(o.value);

            if (!key || seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }

    function initCombos() {
        if (!form) return;

        form
            .querySelectorAll('[data-aem-combo]')
            .forEach(input => {
                if (input.dataset.ready === '1') {
                    return;
                }

                input.dataset.ready = '1';

                const type = input.dataset.aemCombo;

                const wrapper = elem(
                    'div',
                    'aem-combo'
                );

                input.parentNode.insertBefore(
                    wrapper,
                    input
                );

                wrapper.append(input);

                const toggle = elem(
                    'button',
                    'aem-combo-arrow',
                    '⌄'
                );

                toggle.type = 'button';

                toggle.setAttribute(
                    'aria-label',
                    'Tampilkan pilihan'
                );

                const panel = elem(
                    'div',
                    'aem-combo-options'
                );

                panel.hidden = true;
                panel.setAttribute('role', 'listbox');

                wrapper.append(toggle, panel);

                let visible = [];
                let selection = -1;

                function hideList() {
                    panel.hidden = true;

                    wrapper.classList.remove(
                        'opened',
                        'up'
                    );

                    selection = -1;
                }

                function selectOption(option) {
                    input.value = String(option.value);
                    input.setCustomValidity('');

                    if (
                        type === 'lokasi' &&
                        option.raw?.alamat &&
                        $('aemAlamat') &&
                        !$('aemAlamat').value.trim()
                    ) {
                        $('aemAlamat').value =
                            String(option.raw.alamat);
                    }

                    input.dispatchEvent(
                        new Event('change', {
                            bubbles: true
                        })
                    );

                    hideList();

                    input.focus({
                        preventScroll: true
                    });
                }

                function render(showAll = false) {
                    combos.forEach((combo, key) => {
                        if (key !== input.name) {
                            combo.close();
                        }
                    });

                    const search = showAll
                        ? ''
                        : norm(input.value);

                    visible = comboOptions(type)
                        .filter(o =>
                            norm(
                                `${o.value} ${o.label || ''}`
                            ).includes(search)
                        )
                        .slice(0, 150);

                    panel.replaceChildren();
                    selection = -1;

                    if (!visible.length) {
                        panel.append(
                            elem(
                                'div',
                                'aem-combo-empty',
                                ['kondisi', 'kepemilikan'].includes(type)
                                    ? 'Pilih salah satu status yang tersedia.'
                                    : 'Belum ada pilihan. Kamu bisa mengetik nilai baru.'
                            )
                        );
                    }

                    visible.forEach(option => {
                        const button = elem(
                            'button',
                            'aem-combo-item'
                        );

                        button.type = 'button';

                        button.append(
                            elem(
                                'strong',
                                '',
                                option.value
                            )
                        );

                        if (option.label) {
                            button.append(
                                elem(
                                    'small',
                                    '',
                                    option.label
                                )
                            );
                        }

                        button.addEventListener(
                            'mousedown',
                            e => e.preventDefault()
                        );

                        button.addEventListener(
                            'click',
                            () => selectOption(option)
                        );

                        panel.append(button);
                    });

                    panel.hidden = false;
                    wrapper.classList.add('opened');

                    input.setAttribute(
                        'aria-expanded',
                        'true'
                    );

                    const rect =
                        wrapper.getBoundingClientRect();

                    wrapper.classList.toggle(
                        'up',
                        window.innerHeight -
                            rect.bottom < 190 &&
                        rect.top > 230
                    );
                }

                input.addEventListener('focus', () => {
                    if (panel.hidden) {
                        render(true);
                    }
                });

                input.addEventListener('input', () => {
                    input.setCustomValidity('');
                    render(false);
                });

                toggle.addEventListener(
                    'mousedown',
                    e => e.preventDefault()
                );

                toggle.addEventListener('click', () => {
                    if (panel.hidden) {
                        render(true);
                    } else {
                        hideList();
                    }
                });

                input.addEventListener('keydown', e => {
                    if (
                        e.key === 'Escape' &&
                        !panel.hidden
                    ) {
                        e.preventDefault();
                        hideList();
                    }

                    if (e.key === 'Tab') {
                        hideList();
                    }

                    if (
                        ['ArrowDown', 'ArrowUp']
                            .includes(e.key)
                    ) {
                        e.preventDefault();

                        if (panel.hidden) {
                            render(true);
                        }

                        if (visible.length) {
                            selection = (
                                selection +
                                (
                                    e.key === 'ArrowDown'
                                        ? 1
                                        : -1
                                ) +
                                visible.length
                            ) % visible.length;

                            panel
                                .querySelectorAll(
                                    '.aem-combo-item'
                                )
                                .forEach((node, i) => {
                                    node.classList.toggle(
                                        'active',
                                        i === selection
                                    );

                                    if (i === selection) {
                                        node.scrollIntoView({
                                            block: 'nearest'
                                        });
                                    }
                                });
                        }
                    }

                    if (
                        e.key === 'Enter' &&
                        !panel.hidden &&
                        selection >= 0
                    ) {
                        e.preventDefault();

                        selectOption(
                            visible[selection]
                        );
                    }
                });

                combos.set(input.name, {
                    close: hideList,
                    wrapper
                });
            });

        document.addEventListener('pointerdown', e => {
            combos.forEach(combo => {
                if (
                    !combo.wrapper.contains(e.target)
                ) {
                    combo.close();
                }
            });
        });

        $('aemDep')?.addEventListener(
            'change',
            () => {
                if ($('aemDiv')) {
                    $('aemDiv').value = '';
                }

                combos.get('divisi')?.close();
            }
        );
    }

    /* ======================================================
       LAMPIRAN FOTO DAN PDF
    ====================================================== */

    function resetDocs() {
        newFiles = [];

        if ($('aemDocsInput')) {
            $('aemDocsInput').value = '';
        }

        $('aemSelectedDocs')?.replaceChildren();
        $('aemSavedDocs')?.replaceChildren();
    }

    function renderNewDocs() {
        const box = $('aemSelectedDocs');

        if (!box) return;

        box.replaceChildren();

        if (!newFiles.length) return;

        box.append(
            elem(
                'strong',
                '',
                `${newFiles.length} lampiran baru`
            )
        );

        newFiles.forEach((file, index) => {
            const row = elem(
                'div',
                'aem-file-row'
            );

            row.append(
                elem(
                    'span',
                    '',
                    `${file.name} (${(
                        file.size / 1048576
                    ).toFixed(2)} MB)`
                )
            );

            const remove = elem(
                'button',
                'aem-link',
                'Batalkan'
            );

            remove.type = 'button';

            remove.addEventListener('click', () => {
                newFiles.splice(index, 1);
                renderNewDocs();
            });

            row.append(remove);
            box.append(row);
        });
    }

    $('aemDocsInput')?.addEventListener(
        'change',
        e => {
            for (
                const file of Array.from(
                    e.target.files || []
                )
            ) {
                if (
                    !/\.(pdf|jpe?g|png|webp)$/i
                        .test(file.name)
                ) {
                    toast(
                        `${file.name}: format tidak didukung.`
                    );

                    continue;
                }

                const duplicate =
                    newFiles.some(old =>
                        old.name === file.name &&
                        old.size === file.size &&
                        old.lastModified ===
                            file.lastModified
                    );

                if (!duplicate) {
                    newFiles.push(file);
                }
            }

            e.target.value = '';

            renderNewDocs();
        }
    );

    function fileLink(url, name, iconName) {
        if (!url) return null;

        const a = elem(
            'a',
            'aem-kib-file'
        );

        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const i = elem('i');

        i.setAttribute(
            'data-lucide',
            iconName
        );

        a.append(
            i,
            elem(
                'span',
                '',
                name || 'Lampiran'
            )
        );

        return a;
    }

    function renderSavedDocs(docs) {
        const box = $('aemSavedDocs');

        if (!box) return;

        box.replaceChildren();

        if (!asArray(docs).length) return;

        box.append(
            elem(
                'strong',
                '',
                'Lampiran tersimpan:'
            )
        );

        asArray(docs).forEach(doc => {
            const row = elem(
                'div',
                'aem-file-row'
            );

            if (doc.url) {
                const a = fileLink(
                    doc.url,
                    doc.nama,
                    /\.pdf$/i.test(doc.nama || '')
                        ? 'file-text'
                        : 'image'
                );

                if (a) row.append(a);
            }

            if (doc.id != null) {
                const label = elem(
                    'label',
                    'aem-file-remove'
                );

                const check = elem('input');

                check.type = 'checkbox';
                check.name = 'hapus_dokumen_ids[]';
                check.value = String(doc.id);

                label.append(
                    check,
                    document.createTextNode(
                        ' Hapus saat simpan'
                    )
                );

                row.append(label);
            }

            box.append(row);
        });

        icons();
    }

    /* ======================================================
       FORM TAMBAH / EDIT
    ====================================================== */

    function prepareForm() {
        if (!form) return;

        form.reset();
        resetDocs();
        error('');

        saving = false;

        form.querySelectorAll('input')
            .forEach(input => {
                input.setCustomValidity('');
            });

        $('aemSave').disabled = false;

        combos.forEach(combo => combo.close());
    }

    function addForm() {
        if (!form) return;

        prepareForm();

        active = null;
        editId = null;

        if (form.elements.namedItem('tahun')) {
            form.elements.namedItem('tahun').value =
                new Date().getFullYear();
        }

        if (form.elements.namedItem('jumlah_unit')) {
            form.elements.namedItem(
                'jumlah_unit'
            ).value = 1;
        }

        $('aemFormTitle').textContent =
            'Tambah Aset Tetap Lainnya';

        $('aemSave').textContent =
            'Simpan Aset';

        open(formDialog);
    }

    function editForm(item) {
        if (!form || !item) return;

        prepareForm();

        active = item;
        editId = Number(item.id);

        fields.forEach(name => {
            const input =
                form.elements.namedItem(name);

            if (input) {
                input.value = String(
                    item[name] ?? ''
                );
            }
        });

        renderSavedDocs(item.dokumens);

        $('aemFormTitle').textContent =
            'Edit Aset Tetap Lainnya';

        $('aemSave').textContent =
            'Simpan Perubahan';

        open(formDialog);
    }

    $('aemAdd')?.addEventListener(
        'click',
        addForm
    );

    async function fetchItem(id) {
        const res = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!res.data) {
            throw new Error(
                'Data barang tidak ditemukan.'
            );
        }

        return res.data;
    }

    /* ======================================================
       VIEW DETAIL EXCEL KIB E
       TANPA TANDA TANGAN
    ====================================================== */

    const labelKepemilikan = value => ({
        perumdam: 'Perumdam Tirta Kencana',
        pusat: 'Pemerintah Pusat',
        pemprov: 'Pemerintah Provinsi',
        pemkot: 'Pemerintah Kota',
        swasta: 'Swasta'
    }[norm(value)] || 'Belum Diatur');

    function detail(item) {
        if (!item) return;

        active = item;

        const body = $('aemDetailBody');

        if (!body) return;

        body.replaceChildren();

        $('aemDetailTitle').textContent =
            item.nama_aset ||
            'Detail Inventaris KIB E';

        const kondisi = {
            'BAIK': 'Baik (B)',
            'B': 'Baik (B)',
            'KURANG BAIK': 'Kurang Baik (KB)',
            'KB': 'Kurang Baik (KB)',
            'RUSAK BERAT': 'Rusak Berat (RB)',
            'RB': 'Rusak Berat (RB)',
            'CUKUP': 'Cukup (data lama)',
            'RUSAK RINGAN':
                'Rusak Ringan (data lama)'
        }[
            String(item.kondisi ?? '')
                .trim()
                .toUpperCase()
        ] || showValue(item.kondisi);

        /* LEMBAR KIB E */

        const sheet = elem(
            'section',
            'aem-kib-sheet'
        );

        /* KOP PERUSAHAAN */

        const heading = elem(
            'div',
            'aem-kib-heading'
        );

        const brand = elem(
            'div',
            'aem-kib-brand'
        );

        if (root.dataset.logoUrl) {
            const logo = elem(
                'img',
                'aem-kib-logo'
            );

            logo.src = root.dataset.logoUrl;
            logo.alt =
                'Logo Perumdam Tirta Kencana';

            logo.onerror = () => logo.remove();

            brand.append(logo);
        }

        brand.append(
            elem(
                'strong',
                '',
                'PERUMDAM TIRTA KENCANA'
            ),

            elem(
                'strong',
                '',
                'KOTA SAMARINDA'
            )
        );

        const title = elem(
            'div',
            'aem-kib-heading-title'
        );

        title.append(
            elem(
                'div',
                '',
                'KARTU INVENTARIS BARANG (KIB)'
            ),

            elem(
                'strong',
                '',
                'E. ASET TETAP LAINNYA'
            )
        );

        heading.append(brand, title);
        sheet.append(heading);

        /* IDENTITAS ORGANISASI */

        const meta = elem(
            'div',
            'aem-kib-identity'
        );

        const metadata = [
            ['PROVINSI', 'KALIMANTAN TIMUR'],
            ['KOTA', 'SAMARINDA'],
            ['UNIT', 'PERUMDAM TIRTA KENCANA'],
            ['DEPARTEMEN', item.departemen],
            ['DIVISI', item.divisi],
            ['KODE STRUKTUR', item.kode_struktur],
            ['LOKASI / UNIT KERJA', item.lokasi],
            ['ALAMAT', item.alamat]
        ];

        metadata.forEach(([label, value]) => {
            const row = elem(
                'div',
                'aem-kib-identity-row'
            );

            row.append(
                elem('span', '', label),
                elem('span', '', ':'),
                elem(
                    'strong',
                    '',
                    showValue(value)
                )
            );

            meta.append(row);
        });

        sheet.append(meta);

        /* TABEL EXCEL 11 KOLOM: TAMBAHAN STATUS KEPEMILIKAN */

        const scroll = elem(
            'div',
            'aem-kib-table-scroll'
        );

        const table = elem(
            'table',
            'aem-kib-table'
        );

        const cols = elem('colgroup');

        for (let i = 0; i < 11; i++) {
            cols.append(elem('col'));
        }

        table.append(cols);

        const head = elem('thead');

        const h1 = elem('tr');
        const h2 = elem('tr');
        const nums = elem('tr');

        const th = (
            row,
            value,
            rowspan = 1,
            colspan = 1
        ) => {
            const e = elem(
                'th',
                '',
                value
            );

            e.rowSpan = rowspan;
            e.colSpan = colspan;

            row.append(e);
        };

        th(h1, 'No.', 2);

        th(
            h1,
            'Nama Barang / Jenis Barang',
            2
        );

        th(h1, 'Nomor', 1, 2);

        th(
            h1,
            'Kondisi Barang (B, KB, RB)',
            2
        );

        th(h1, 'Bahan', 2);

        th(
            h1,
            'Tahun Pengadaan / Perolehan',
            2
        );

        th(h1, 'Jumlah', 2);

        th(
            h1,
            'Asal Usul / Cara Perolehan',
            2
        );

        th(h1, 'Keterangan', 2);
        th(h1, 'Status Kepemilikan', 2);

        th(h2, 'Kode Barang');
        th(h2, 'Register');

        for (let i = 1; i <= 11; i++) {
            th(nums, String(i));
        }

        head.append(h1, h2, nums);

        /* ISI TABEL DETAIL */

        const tr = elem('tr');

        const values = [
            '1',

            showValue(item.nama_aset),

            showValue(item.kode_inventaris),

            showValue(item.nomor_register),

            kondisi,

            showValue(item.bahan),

            showValue(item.tahun),

            item.jumlah_unit == null
                ? '—'
                : `${Number(item.jumlah_unit)
                    .toLocaleString('id-ID')} buah`,

            showValue(item.asal_perolehan),

            showValue(item.keterangan),
            labelKepemilikan(item.status_kepemilikan)
        ];

        values.forEach((value, index) => {
            cell(
                tr,
                value,
                index === 0
                    ? 'aem-kib-center'
                    : ''
            );
        });

        const tbody = elem('tbody');

        tbody.append(tr);

        table.append(head, tbody);
        scroll.append(table);
        sheet.append(scroll);

        /*
         * TANPA TANDA TANGAN.
         * Setelah tabel langsung tampil.
         */

        body.append(sheet);

        /* FOTO DAN DOKUMEN PENDUKUNG */

        const attachment = elem(
            'section',
            'aem-kib-attachments'
        );

        attachment.append(
            elem(
                'h3',
                '',
                'Foto dan Dokumen Pendukung'
            )
        );

        const links = elem(
            'div',
            'aem-kib-file-links'
        );

        const photo = fileLink(
            item.foto_url,
            'Lihat Foto Utama',
            'image'
        );

        if (photo) {
            links.append(photo);
        }

        asArray(item.dokumens)
            .forEach(doc => {
                const link = fileLink(
                    doc.url,
                    doc.nama || 'Lampiran',
                    /\.pdf$/i.test(doc.nama || '')
                        ? 'file-text'
                        : 'image'
                );

                if (link) {
                    links.append(link);
                }
            });

        if (!links.childElementCount) {
            links.append(
                elem(
                    'p',
                    '',
                    'Belum ada foto atau dokumen pendukung.'
                )
            );
        }

        attachment.append(links);
        body.append(attachment);

        open(detailDialog);
        icons();
    }

    /* ======================================================
       DETAIL KELOMPOK
    ====================================================== */

    const gs = {
        lokasi: '',
        divisi: '',
        q: '',
        page: 1,
        groups: [],
        selected: null,
        pagination: null
    };

    let groupRequest = null;
    let groupTimer = null;

    function groupError(message) {
        const node = $('aemGroupAlert');

        if (!node) return;

        node.textContent = message || '';
        node.hidden = !message;
    }

    function openGroup(lokasi, divisi) {
        if (!groupDialog || !groupUrl) {
            toast(
                'Endpoint Detail Kelompok belum tersedia.'
            );

            return;
        }

        gs.lokasi =
            String(lokasi ?? '').trim() ||
            'Tanpa Lokasi';

        gs.divisi =
            String(divisi ?? '').trim() ||
            'Tanpa Divisi';

        gs.page = 1;
        gs.q = '';

        $('aemGroupSearch').value = '';
        $('aemGroupItemSearch').value = '';

        open(groupDialog);
        loadGroup();
    }

    /* ======================================================
       PANEL KIRI — LOKASI / DIVISI
    ====================================================== */

    function renderGroups() {
        const container = $('aemGroupList');

        if (!container) return;

        container.replaceChildren();

        const q = norm(
            $('aemGroupSearch')?.value
        );

        const entries = gs.groups.filter(g =>
            norm(
                `${g.lokasi} ${g.divisi}`
            ).includes(q)
        );

        if (!entries.length) {
            container.append(
                elem(
                    'div',
                    'aem-empty',
                    'Tidak ada kelompok yang sesuai.'
                )
            );

            return;
        }

        const locations = new Map();

        entries.forEach(group => {
            if (!locations.has(group.lokasi)) {
                locations.set(
                    group.lokasi,
                    []
                );
            }

            locations
                .get(group.lokasi)
                .push(group);
        });

        locations.forEach((groups, location) => {
            const section = elem(
                'div',
                'aem-group-location'
            );

            const title = elem(
                'div',
                'aem-group-location-title'
            );

            const folder = elem('i');

            folder.setAttribute(
                'data-lucide',
                'folder'
            );

            title.append(
                folder,
                elem('span', '', location)
            );

            section.append(title);

            groups.forEach(g => {
                const button = elem(
                    'button',
                    'aem-group-select'
                );

                button.type = 'button';

                const chosen =
                    gs.selected &&
                    gs.selected.lokasi === g.lokasi &&
                    gs.selected.divisi === g.divisi;

                if (chosen) {
                    button.classList.add('active');
                }

                button.setAttribute(
                    'aria-pressed',
                    String(Boolean(chosen))
                );

                button.append(
                    elem(
                        'span',
                        '',
                        g.divisi
                    ),

                    elem(
                        'span',
                        '',
                        g.jumlah
                    )
                );

                button.addEventListener('click', () => {
                    gs.lokasi = g.lokasi;
                    gs.divisi = g.divisi;
                    gs.page = 1;
                    gs.q = '';

                    $('aemGroupItemSearch').value = '';

                    loadGroup();
                });

                section.append(button);
            });

            container.append(section);
        });

        icons();
    }

    /* ======================================================
       LABEL KONDISI BARANG
    ====================================================== */

    const conditions = {
        'BAIK': 'Baik (B)',
        'B': 'Baik (B)',
        'KURANG BAIK': 'Kurang Baik (KB)',
        'KB': 'Kurang Baik (KB)',
        'RUSAK BERAT': 'Rusak Berat (RB)',
        'RB': 'Rusak Berat (RB)',
        'CUKUP': 'Cukup (data lama)',
        'RUSAK RINGAN':
            'Rusak Ringan (data lama)'
    };

    /* ======================================================
       PANEL KANAN — 11 KOLOM EXCEL + 1 VIEW
    ====================================================== */

    function renderGroupRows(items) {
        const tbody = $('aemGroupRows');

        if (!tbody) return;

        tbody.replaceChildren();

        if (!items.length) {
            const tr = elem('tr');

            cell(
                tr,
                'Tidak ada barang pada kelompok ini.',
                'aem-empty'
            ).colSpan = 12;

            tbody.append(tr);

            return;
        }

        const start = Number(
            gs.pagination?.from ?? 1
        );

        items.forEach((item, index) => {
            const tr = elem('tr');

            const condition =
                conditions[
                    String(item.kondisi ?? '')
                        .trim()
                        .toUpperCase()
                ] || showValue(item.kondisi);

            /*
             * KOLOM 1–11
             * URUTAN WAJIB SAMA DENGAN EXCEL
             */

            const values = [
                // 1. No.
                start + index,

                // 2. Nama Barang
                showValue(item.nama_aset),

                // 3. Kode Barang
                showValue(item.kode_inventaris),

                // 4. Register
                showValue(item.nomor_register),

                // 5. Kondisi Barang
                condition,

                // 6. Bahan
                showValue(item.bahan),

                // 7. Tahun
                showValue(item.tahun),

                // 8. Jumlah
                item.jumlah_unit == null
                    ? '—'
                    : `${Number(item.jumlah_unit)
                        .toLocaleString('id-ID')} buah`,

                // 9. Asal Perolehan
                showValue(item.asal_perolehan),

                // 10. Keterangan
                showValue(item.keterangan),

                // 11. Status Kepemilikan
                labelKepemilikan(item.status_kepemilikan)
            ];

            values.forEach((value, i) => {
                const centered =
                    [0, 6, 7].includes(i);

                cell(
                    tr,
                    value,
                    centered
                        ? 'aem-center'
                        : i === 9
                            ? 'aem-kib-notes'
                            : ''
                );
            });

            /*
             * KOLOM 12 — TOMBOL VIEW
             * Tidak ada kolom foto tambahan.
             */

            const button = elem(
                'button',
                'aem-icon view'
            );

            button.type = 'button';

            button.title =
                'Lihat Detail KIB E';

            button.dataset.aemAction = 'view';
            button.dataset.id = String(item.id);

            button.setAttribute(
                'aria-label',
                `Lihat detail ${showValue(item.nama_aset)}`
            );

            const eye = elem('i');

            eye.setAttribute(
                'data-lucide',
                'eye'
            );

            button.append(eye);

            cell(
                tr,
                button,
                'aem-center'
            );

            tbody.append(tr);
        });

        icons();
    }

    /* ======================================================
       LOAD KELOMPOK DARI LARAVEL
    ====================================================== */

    async function loadGroup() {
        if (!groupDialog || !groupUrl) return;

        groupRequest?.abort();

        const controller = new AbortController();

        groupRequest = controller;

        groupError('');

        const tbody = $('aemGroupRows');

        const loading = elem('tr');

        cell(
            loading,
            'Memuat data barang...',
            'aem-empty'
        ).colSpan = 12;

        tbody.replaceChildren(loading);

        const params = new URLSearchParams({
            lokasi: gs.lokasi,
            divisi: gs.divisi,
            q: gs.q,
            page: String(gs.page)
        });

        try {
            const result = await api(
                `${groupUrl}?${params}`,
                {
                    signal: controller.signal
                }
            );

            if (
                controller.signal.aborted ||
                !groupDialog.open
            ) {
                return;
            }

            gs.groups = asArray(result.groups);
            gs.selected = result.selected || null;
            gs.pagination = result.pagination || {};

            if (gs.selected) {
                gs.lokasi = gs.selected.lokasi;
                gs.divisi = gs.selected.divisi;

                $('aemGroupTitle').textContent =
                    gs.selected.divisi;

                $('aemGroupSubtitle').textContent =
                    `Lokasi: ${gs.selected.lokasi}`;
            } else {
                $('aemGroupTitle').textContent =
                    'Belum ada kelompok aset';

                $('aemGroupSubtitle').textContent =
                    'Tambahkan data manual terlebih dahulu.';
            }

            const p = gs.pagination;

            $('aemGroupCount').textContent =
                `${p.total || 0} barang`;

            $('aemGroupInfo').textContent =
                `${p.from || 0}–${p.to || 0} dari ${p.total || 0} data`;

            $('aemGroupPage').textContent =
                `${p.page || 1} / ${p.last_page || 1}`;

            $('aemGroupPrev').disabled =
                (p.page || 1) <= 1;

            $('aemGroupNext').disabled =
                (p.page || 1) >=
                (p.last_page || 1);

            renderGroups();

            renderGroupRows(
                asArray(result.items)
            );

            /*
             * Mulai tabel dari kolom pertama
             * saat kelompok diganti.
             */

            const scroller =
                groupDialog.querySelector(
                    '.aem-group-right .aem-table-wrap'
                );

            if (scroller) {
                scroller.scrollLeft = 0;
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                return;
            }

            groupError(
                e.message ||
                'Gagal mengambil data kelompok.'
            );

            tbody.replaceChildren();
        }
    }

    /* ======================================================
       EVENT DETAIL KELOMPOK
    ====================================================== */

    function closeGroup() {
        close(groupDialog);
    }

    $('aemBack')?.addEventListener(
        'click',
        closeGroup
    );

    $('aemGroupClose')?.addEventListener(
        'click',
        closeGroup
    );

    groupDialog?.addEventListener(
        'close',
        () => {
            groupRequest?.abort();
            clearTimeout(groupTimer);
        }
    );

    $('aemGroupSearch')?.addEventListener(
        'input',
        renderGroups
    );

    $('aemGroupItemSearch')?.addEventListener(
        'input',
        e => {
            const q = e.target.value.trim();

            clearTimeout(groupTimer);

            groupTimer = setTimeout(() => {
                gs.q = q;
                gs.page = 1;

                loadGroup();
            }, 300);
        }
    );

    $('aemGroupRefresh')?.addEventListener(
        'click',
        () => {
            clearTimeout(groupTimer);

            gs.q = '';
            gs.page = 1;

            $('aemGroupItemSearch').value = '';

            loadGroup();
        }
    );

    $('aemGroupPrev')?.addEventListener(
        'click',
        () => {
            if (gs.page > 1) {
                gs.page--;
                loadGroup();
            }
        }
    );

    $('aemGroupNext')?.addEventListener(
        'click',
        () => {
            if (
                gs.page <
                (gs.pagination?.last_page || 1)
            ) {
                gs.page++;
                loadGroup();
            }
        }
    );

    /* ======================================================
       AKSI TABEL UTAMA DAN KELOMPOK
    ====================================================== */

    root.addEventListener('click', async e => {
        if (!(e.target instanceof Element)) {
            return;
        }

        const btn = e.target.closest(
            'button[data-aem-action]'
        );

        if (
            !btn ||
            !root.contains(btn) ||
            btn.disabled
        ) {
            return;
        }

        const action = btn.dataset.aemAction;
        const id = btn.dataset.id;

        if (!/^\d+$/.test(String(id))) {
            toast('ID aset tidak valid.');
            return;
        }

        if (action === 'group') {
            openGroup(
                btn.dataset.location,
                btn.dataset.division
            );

            return;
        }

        if (action === 'delete') {
            confirmDelete(
                id,
                btn.dataset.name
            );

            return;
        }

        if (!['view', 'edit'].includes(action)) {
            return;
        }

        btn.disabled = true;

        try {
            const item = await fetchItem(id);

            if (action === 'edit') {
                editForm(item);
            } else {
                detail(item);
            }
        } catch (err) {
            toast(err.message);
        } finally {
            btn.disabled = false;
        }
    });

    /* ======================================================
       EDIT DARI POPUP VIEW
    ====================================================== */

    $('aemEditDetail')?.addEventListener(
        'click',
        () => {
            if (!active) return;

            const item = active;

            close(detailDialog);
            editForm(item);
        }
    );

    $('aemExportDetail')?.addEventListener('click', () => {
        if (!active) return;

        if (!AEMExcel?.download) {
            toast('Modul ekspor Excel belum tersedia. Muat ulang halaman.');
            return;
        }

        try {
            AEMExcel.download(active);
        } catch (err) {
            console.error('K.I.B E EXPORT EXCEL:', err);
            toast('Gagal membuat Excel: ' + (err.message || 'Kesalahan tak diketahui'));
        }
    });

    /* ======================================================
       DELETE DATA
    ====================================================== */

    function confirmDelete(id, name) {
        deleteId = Number(id);

        $('aemDeleteName').textContent =
            name || `Aset #${id}`;

        close(detailDialog);
        open(deleteDialog);
    }

    $('aemDeleteDetail')?.addEventListener(
        'click',
        () => {
            if (active) {
                confirmDelete(
                    active.id,
                    active.nama_aset
                );
            }
        }
    );

    $('aemConfirmDelete')?.addEventListener(
        'click',
        async () => {
            if (!deleteId || deleting) return;

            deleting = true;

            const btn = $('aemConfirmDelete');

            btn.disabled = true;

            try {
                await api(
                    `${base}/${encodeURIComponent(deleteId)}`,
                    {
                        method: 'DELETE'
                    }
                );

                window.location.assign(base);
            } catch (err) {
                toast(err.message);

                deleting = false;
                btn.disabled = false;
            }
        }
    );

    deleteDialog?.addEventListener(
        'close',
        () => {
            if (!deleting) {
                deleteId = null;
            }
        }
    );

    /* ======================================================
       SIMPAN TAMBAH / EDIT
    ====================================================== */

    form?.addEventListener(
        'submit',
        async e => {
            e.preventDefault();

            if (saving) return;

            error('');

            const condition = $('aemKondisi');

            if (condition) {
                condition.value = String(
                    condition.value ?? ''
                )
                    .trim()
                    .toUpperCase();

                const allowed = [
                    'BAIK',
                    'KURANG BAIK',
                    'RUSAK BERAT',
                    'CUKUP',
                    'RUSAK RINGAN'
                ];

                condition.setCustomValidity(
                    allowed.includes(condition.value)
                        ? ''
                        : 'Pilih BAIK, KURANG BAIK, atau RUSAK BERAT.'
                );
            }

            const ownership = $('aemKepemilikan');
            if (ownership) {
                ownership.value = norm(ownership.value);
                ownership.setCustomValidity(
                    ['perumdam', 'pusat', 'pemprov', 'pemkot', 'swasta'].includes(ownership.value)
                        ? ''
                        : 'Pilih Status Kepemilikan dari lima pilihan yang tersedia.'
                );
            }

            if (!form.reportValidity()) {
                return;
            }

            saving = true;

            const saveBtn = $('aemSave');

            saveBtn.disabled = true;

            const data = new FormData(form);

            data.delete('dokumens[]');

            newFiles.forEach(file => {
                data.append(
                    'dokumens[]',
                    file,
                    file.name
                );
            });

            if (editId !== null) {
                data.set(
                    '_method',
                    'PUT'
                );
            }

            const url = editId === null
                ? base
                : `${base}/${encodeURIComponent(editId)}`;

            try {
                await api(url, {
                    method: 'POST',
                    body: data
                });

                window.location.assign(base);
            } catch (err) {
                error(err.message);

                saving = false;
                saveBtn.disabled = false;
            }
        }
    );

    /* ======================================================
       INITIALIZE
    ====================================================== */

    initCombos();
    icons();

})();
