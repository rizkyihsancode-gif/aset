
/* ============================================================
   K.I.B E — ASET TETAP LAINNYA
   PERUMDA TIRTA KENCANA
   CRUD, FILTER, DETAIL, PDF, CSV, MODAL
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const root = document.getElementById(
        'asetLainPage'
    );

    if (!root || root.dataset.ready === 'yes') {
        return;
    }

    root.dataset.ready = 'yes';

    const $ = (selector, element = root) =>
        element.querySelector(selector);

    const $$ = (selector, element = root) =>
        [...element.querySelectorAll(selector)];

    const base = root.dataset.base;
    const store = root.dataset.store;
    const csrf = root.dataset.token;

    const money = value =>
        'Rp ' + new Intl.NumberFormat(
            'id-ID',
            { maximumFractionDigits: 0 }
        ).format(Number(value) || 0);

    const number = value =>
        new Intl.NumberFormat('id-ID')
            .format(Number(value) || 0);

    const esc = value =>
        String(value ?? '').replace(
            /[&<>"']/g,
            character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]
        );

    const icon = () =>
        window.lucide?.createIcons?.();

    const assetUrl = id =>
        `${base}/${encodeURIComponent(id)}`;

    const lokasiUrl = id =>
        `${base}/lokasi/${encodeURIComponent(id)}`;

    const fileUrl = (id, type) =>
        `${assetUrl(id)}/file/${type}`;

    function date(value) {
        const match = String(value ?? '')
            .slice(0, 10)
            .match(/^(\d{4})-(\d\d)-(\d\d)$/);

        return match
            ? `${match[3]}/${match[2]}/${match[1]}`
            : (value || '—');
    }

    // ========================================================
    // 1. MODAL
    // ========================================================

    function open(id) {
        const element = $('#' + id);

        if (element && !element.open) {
            element.showModal();
        }

        icon();
    }

    function close(id) {
        const element = $('#' + id);

        if (element?.open) {
            element.close();
        }
    }

    function notify(message) {
        const toast = $('#aetToast');

        toast.textContent = message;
        toast.hidden = false;

        clearTimeout(notify.timer);

        notify.timer = setTimeout(() => {
            toast.hidden = true;
        }, 4500);
    }

    $$('[data-close]').forEach(button => {
        button.addEventListener('click', () => {
            close(button.dataset.close);
        });
    });

    $$('dialog').forEach(dialog => {
        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                dialog.close();
            }
        });
    });

    // ========================================================
    // 2. REQUEST AJAX LARAVEL
    // ========================================================

    async function request(path, options = {}) {
        const response = await fetch(path, {
            credentials: 'same-origin',

            headers: {
                Accept: 'application/json',
                'X-Requested-With':
                    'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf,
                ...options.headers
            },

            ...options
        });

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Respons server bukan JSON ` +
                `(HTTP ${response.status}).`
            );
        }

        if (
            !response.ok ||
            data.success === false
        ) {
            const errors = Object.values(
                data.errors || {}
            )
                .flat()
                .filter(Boolean);

            throw new Error(
                errors.length
                    ? errors.join('\n')
                    : (
                        data.message ||
                        `HTTP ${response.status}`
                    )
            );
        }

        return data;
    }

    // ========================================================
    // 3. FILTER TABEL UTAMA
    // ========================================================

    const rows = $$('.aet-location-row');

    let page = 1;
    let limit = 20;

    function matched() {
        const query = (
            $('#aetSearch').value || ''
        )
            .trim()
            .toLowerCase();

        return rows.filter(row =>
            !query ||
            row.dataset.search.includes(query) ||
            row.dataset.value.includes(query)
        );
    }

    // ========================================================
    // 4. PAGINATION
    // ========================================================

    function renderPage() {
        const all = matched();

        limit = Number(
            $('#aetLimit').value
        ) || 20;

        const max = Math.max(
            1,
            Math.ceil(all.length / limit)
        );

        page = Math.min(
            Math.max(page, 1),
            max
        );

        rows.forEach(row => {
            row.hidden = true;
        });

        const start = (page - 1) * limit;

        all
            .slice(start, start + limit)
            .forEach((row, index) => {
                row.hidden = false;

                row.querySelector(
                    '[data-order]'
                ).textContent = start + index + 1;
            });

        $('#aetPageInfo').textContent =
            `Menampilkan ${
                all.length ? start + 1 : 0
            }–${
                Math.min(
                    start + limit,
                    all.length
                )
            } dari ${
                number(all.length)
            } lokasi`;

        const box = $('#aetPages');

        box.replaceChildren();

        if (max < 2) {
            return;
        }

        function button(
            label,
            target,
            disabled = false
        ) {
            const element =
                document.createElement('button');

            element.type = 'button';
            element.textContent = label;
            element.disabled = disabled;

            if (Number(label) === page) {
                element.classList.add('current');
            }

            element.addEventListener(
                'click',
                () => {
                    page = target;
                    renderPage();
                }
            );

            box.appendChild(element);
        }

        button(
            '‹',
            page - 1,
            page === 1
        );

        const list = new Set([1, max]);

        for (
            let i = Math.max(1, page - 2);
            i <= Math.min(max, page + 2);
            i++
        ) {
            list.add(i);
        }

        let previous = 0;

        [...list]
            .sort((a, b) => a - b)
            .forEach(current => {

                if (
                    previous &&
                    current - previous > 1
                ) {
                    const dot =
                        document.createElement('span');

                    dot.textContent = '…';

                    box.appendChild(dot);
                }

                button(
                    String(current),
                    current
                );

                previous = current;
            });

        button(
            '›',
            page + 1,
            page === max
        );
    }

    // ========================================================
    // 5. SEARCH, RESET, LIMIT
    // ========================================================

    $('#aetSearch').addEventListener(
        'input',
        () => {
            page = 1;
            renderPage();
        }
    );

    $('#aetLimit').addEventListener(
        'change',
        () => {
            page = 1;
            renderPage();
        }
    );

    $('#aetReset').addEventListener(
        'click',
        () => {
            $('#aetSearch').value = '';
            $('#aetLimit').value = '20';

            page = 1;
            renderPage();
        }
    );

    // ========================================================
    // 6. EXPORT CSV
    // ========================================================

    $('#aetExport').addEventListener(
        'click',
        () => {
            const data = [[
                'No',
                'Lokasi',
                'Alamat',
                'Jumlah Aset',
                'Nilai Aktiva'
            ]];

            matched().forEach(
                (row, index) => {
                    data.push([
                        index + 1,
                        row.dataset.name,
                        row.dataset.address,
                        row.dataset.count,
                        row.dataset.value
                    ]);
                }
            );

            const csv = '\uFEFF' +
                data.map(line =>
                    line.map(value => {
                        let text = String(
                            value ?? ''
                        );

                        // Menghindari eksekusi
                        // formula pada spreadsheet.
                        if (/^\s*[=+@-]/.test(text)) {
                            text = "'" + text;
                        }

                        return '"' +
                            text.replaceAll(
                                '"',
                                '""'
                            ) +
                            '"';
                    }).join(';')
                ).join('\r\n');

            const exportUrl =
                URL.createObjectURL(
                    new Blob(
                        [csv],
                        {
                            type:
                                'text/csv;charset=utf-8'
                        }
                    )
                );

            const link =
                document.createElement('a');

            link.href = exportUrl;
            link.download =
                'kib-e-aset-tetap-lainnya.csv';

            document.body.appendChild(link);

            link.click();
            link.remove();

            setTimeout(() => {
                URL.revokeObjectURL(
                    exportUrl
                );
            }, 1000);
        }
    );

    // ========================================================
    // 7. TABS
    // ========================================================

    $$('[data-tab]').forEach(button => {
        button.addEventListener(
            'click',
            () => {
                $$('[data-tab]').forEach(item => {
                    item.classList.toggle(
                        'active',
                        item === button
                    );
                });

                $$('[data-tab-panel]').forEach(
                    panel => {
                        panel.hidden =
                            panel.dataset.tabPanel !==
                            button.dataset.tab;
                    }
                );
            }
        );
    });

    // ========================================================
    // 8. FORM CREATE DAN UPDATE
    // ========================================================

    const form = $('#aetForm');

    const dep = $('#aetDep');
    const div = $('#aetDiv');

    let editing = null;

    function filterDivision(
        preserve = true
    ) {
        const old = div.value;

        [...div.options].forEach(option => {
            if (!option.value) {
                return;
            }

            const okay =
                !!dep.value &&
                option.dataset.dep === dep.value;

            option.hidden = !okay;
            option.disabled = !okay;
        });

        if (
            !preserve ||
            [...div.options]
                .find(
                    option =>
                        option.value === old
                )?.disabled
        ) {
            div.value = '';
        }
    }

    dep.addEventListener(
        'change',
        () => filterDivision(false)
    );

    filterDivision(false);

    // ========================================================
    // 9. RESET DAN ISI FORM
    // ========================================================

    function prepareForm(item = null) {
        form.reset();

        editing = item?.id ?? null;

        $('#aetFormError').hidden = true;

        $('#aetFormTitle').textContent =
            item
                ? 'Edit Aset Tetap Lainnya'
                : 'Tambah Aset Tetap Lainnya';

        if (item) {
            [
                'id_lokasi',
                'id_dep',
                'id_barang',
                'id_bahan',
                'kode',
                'reg',
                'kondisi',
                'tahun',
                'jumlah',
                'asal',
                'ket'
            ].forEach(name => {
                const element =
                    form.elements.namedItem(name);

                if (element) {
                    element.value =
                        item[name] ?? '';
                }
            });

            filterDivision(false);

            div.value = String(
                item.id_div ?? ''
            );

        } else {
            filterDivision(false);
        }

        open('aetFormDialog');
    }

    $('#aetAdd').addEventListener(
        'click',
        () => {
            prepareForm();
        }
    );

    // ========================================================
    // 10. SUBMIT CREATE / UPDATE
    // ========================================================

    form.addEventListener(
        'submit',
        async event => {
            event.preventDefault();

            if (!form.reportValidity()) {
                return;
            }

            const submit = $('#aetSave');
            const errorBox = $('#aetFormError');

            errorBox.hidden = true;
            submit.disabled = true;

            try {
                const payload =
                    new FormData(form);

                const endpoint = editing
                    ? assetUrl(editing)
                    : store;

                // Method spoofing Laravel:
                // Tambah POST, Edit PUT.
                if (editing) {
                    payload.append(
                        '_method',
                        'PUT'
                    );
                }

                const result = await request(
                    endpoint,
                    {
                        method: 'POST',
                        body: payload
                    }
                );

                close('aetFormDialog');

                notify(
                    result.message ||
                    'Data berhasil disimpan.'
                );

                window.location.reload();

            } catch (error) {
                errorBox.textContent =
                    error.message;

                errorBox.hidden = false;

                errorBox.scrollIntoView({
                    block: 'nearest'
                });

            } finally {
                submit.disabled = false;
            }
        }
    );

    // ========================================================
    // 11. EDIT SATU BARANG
    // ========================================================

    async function edit(id) {
        try {
            const data = await request(
                assetUrl(id)
            );

            close('aetDetailDialog');

            prepareForm(
                data.data
            );

        } catch (error) {
            notify(
                'Gagal membuka data Edit: ' +
                error.message
            );
        }
    }

    // ========================================================
    // 12. HAPUS SATU BARANG
    // ========================================================

    async function remove(id) {
        const item = details.find(
            asset =>
                String(asset.id) === String(id)
        );

        const name =
            item?.nama_barang ||
            item?.kode ||
            id;

        const confirmed = confirm(
            `Hapus inventaris "${name}"?\n` +
            'Data transaksi Nilai Aset tidak akan dihapus.'
        );

        if (!confirmed) {
            return;
        }

        try {
            const data = await request(
                assetUrl(id),
                {
                    method: 'DELETE'
                }
            );

            close('aetDetailDialog');

            notify(
                data.message
            );

            window.location.reload();

        } catch (error) {
            notify(
                'Gagal menghapus: ' +
                error.message
            );
        }
    }

    // ========================================================
    // 13. DETAIL INVENTARIS BERDASARKAN LOKASI
    // ========================================================

    let details = [];

    let detailMode = 'view';

    let currentFilter = {
        dep: '',
        div: ''
    };

    // ========================================================
    // 14. TREE DEPARTEMEN DAN DIVISI
    // ========================================================

    function makeTree() {
        const tree = $('#aetTree');

        const departments = new Map();

        details.forEach(item => {
            const depId = String(
                item.id_dep ?? ''
            );

            const divId = String(
                item.id_div ?? ''
            );

            if (!departments.has(depId)) {
                departments.set(
                    depId,
                    {
                        label:
                            item.departemen ||
                            'Tanpa Departemen',

                        items: new Map()
                    }
                );
            }

            departments
                .get(depId)
                .items.set(
                    divId,
                    item.divisi ||
                    'Tanpa Divisi'
                );
        });

        const button = (
            label,
            departemen,
            division = ''
        ) => `
            <button
                type="button"
                class="${
                    departemen === currentFilter.dep &&
                    division === currentFilter.div
                        ? 'active'
                        : ''
                }"
                data-tree-dep="${esc(departemen)}"
                data-tree-div="${esc(division)}"
            >
                ${esc(label)}
            </button>
        `;

        let html = button(
            `Semua Aset (${details.length})`,
            ''
        );

        for (
            const [depId, obj]
            of departments
        ) {
            html += `
                <div class="aet-tree-group">
                    <b>
                        ${esc(obj.label)}
                    </b>

                    ${button(
                        'Semua divisi',
                        depId
                    )}
            `;

            for (
                const [divId, label]
                of obj.items
            ) {
                html += button(
                    label,
                    depId,
                    divId
                );
            }

            html += '</div>';
        }

        tree.innerHTML = html;
    }

    // ========================================================
    // 15. FILTER DAFTAR BARANG
    // ========================================================

    function visibleAssets() {
        const query = $('#aetDetailSearch')
            .value
            .trim()
            .toLowerCase();

        return details.filter(item =>
            (
                !currentFilter.dep ||
                String(item.id_dep) ===
                    currentFilter.dep
            ) &&
            (
                !currentFilter.div ||
                String(item.id_div) ===
                    currentFilter.div
            ) &&
            (
                !query ||
                [
                    item.nama_barang,
                    item.kode,
                    item.reg,
                    item.bahan,
                    item.departemen,
                    item.divisi
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query)
            )
        );
    }

    // ========================================================
    // 16. RENDER TABEL BARANG PER LOKASI
    // ========================================================

    function renderDetail() {
        const list = visibleAssets();

        $('#aetDetailCount').textContent =
            number(list.length) +
            ' inventaris';

        $('#aetDetailBody').innerHTML =
            list.length

                ? list.map(
                    (item, index) => `
                    <tr>
                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${esc(
                                    item.nama_barang || '—'
                                )}
                            </strong>

                            <small>
                                ${esc(item.bahan || '')}
                            </small>
                        </td>

                        <td>
                            ${esc(item.kode || '—')}
                        </td>

                        <td>
                            ${esc(item.reg || '—')}
                        </td>

                        <td>
                            ${number(item.jumlah)}
                        </td>

                        <td>
                            ${
                                item.img
                                    ? `
                                    <img
                                        class="aet-photo-thumb"
                                        loading="lazy"
                                        src="${fileUrl(
                                            item.id,
                                            'foto'
                                        )}"
                                        alt="Foto aset"
                                    >
                                    `
                                    : `
                                    <span class="aet-muted">
                                        —
                                    </span>
                                    `
                            }
                        </td>

                        <td>
                            <div class="aet-actions">

                                <button
                                    type="button"
                                    class="detail"
                                    data-focus="${item.id}"
                                    title="Lihat detail"
                                >
                                    <i data-lucide="eye"></i>
                                </button>

                                <button
                                    type="button"
                                    class="edit"
                                    data-edit="${item.id}"
                                    title="Edit"
                                >
                                    <i data-lucide="square-pen"></i>
                                </button>

                                <button
                                    type="button"
                                    class="delete"
                                    data-delete="${item.id}"
                                    title="Hapus"
                                >
                                    <i data-lucide="trash-2"></i>
                                </button>

                            </div>
                        </td>
                    </tr>
                `
                ).join('')

                : `
                    <tr>
                        <td
                            class="aet-empty"
                            colspan="7"
                        >
                            Belum ada inventaris untuk
                            pilihan departemen/divisi ini.
                        </td>
                    </tr>
                `;

        icon();
    }

    // ========================================================
    // 17. RINCIAN SATU ASET
    // ========================================================

    function focusAsset(item) {
        const attrs = [
            ['Nama Aset', item.nama_barang],
            ['Kode Barang', item.kode],
            ['Register', item.reg],
            ['Lokasi', item.lokasi],
            ['Departemen', item.departemen],
            ['Divisi', item.divisi],
            ['Bahan', item.bahan],
            ['Kondisi', item.kondisi],
            ['Tahun Pengadaan', item.tahun],
            ['Jumlah', item.jumlah],
            ['Asal Perolehan', item.asal],
            ['Keterangan', item.ket]
        ];

        const focus = $('#aetFocus');

        focus.hidden = false;

        focus.innerHTML = `
            <div class="aet-focus-title">

                <h3>
                    ${esc(
                        item.nama_barang ||
                        'Detail Aset'
                    )}
                </h3>

                <button
                    class="aet-btn pale"
                    data-focus-close
                    type="button"
                >
                    Tutup
                </button>

            </div>

            ${
                item.img
                    ? `
                    <div class="aet-focus-photo">
                        <img
                            src="${fileUrl(
                                item.id,
                                'foto'
                            )}"
                            alt="Foto ${esc(
                                item.nama_barang
                            )}"
                        >
                    </div>
                    `
                    : ''
            }

            <dl class="aet-attrs">
                ${
                    attrs.map(
                        ([name, value]) => `
                        <div>
                            <dt>
                                ${esc(name)}
                            </dt>

                            <dd>
                                ${esc(value ?? '—')}
                            </dd>
                        </div>
                        `
                    ).join('')
                }
            </dl>

            <div class="aet-focus-actions">

                ${
                    item.dok
                        ? `
                        <a
                            class="aet-btn pale"
                            href="${fileUrl(
                                item.id,
                                'dokumen'
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i data-lucide="file-text"></i>
                            Buka PDF
                        </a>
                        `
                        : ''
                }

                <button
                    class="aet-btn pale"
                    type="button"
                    data-edit="${item.id}"
                >
                    <i data-lucide="square-pen"></i>
                    Edit Aset
                </button>

                <button
                    class="aet-btn danger"
                    type="button"
                    data-delete="${item.id}"
                >
                    <i data-lucide="trash-2"></i>
                    Hapus Aset
                </button>

            </div>
        `;

        icon();

        focus.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }

    // ========================================================
    // 18. MEMUAT DATA LOKASI
    // ========================================================

    async function loadLokasi(
        id,
        mode = 'view'
    ) {
        detailMode = mode;

        currentFilter = {
            dep: '',
            div: ''
        };

        $('#aetDetailSearch').value = '';
        $('#aetFocus').hidden = true;

        $('#aetDetailBody').innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="aet-empty"
                >
                    Memuat inventaris...
                </td>
            </tr>
        `;

        open('aetDetailDialog');

        try {
            const data = await request(
                lokasiUrl(id)
            );

            details = Array.isArray(data.data)
                ? data.data
                : [];

            $('#aetDetailTitle').textContent =
                `Detail Aset — ${
                    data.lokasi.lokasi || 'Lokasi'
                }`;

            $('#aetDetailSub').textContent =
                `${
                    data.lokasi.alamat || '—'
                } · ${
                    number(details.length)
                } inventaris`;

            makeTree();
            renderDetail();

            if (
                mode === 'edit' ||
                mode === 'delete'
            ) {
                notify(
                    'Pilih ikon ' +
                    (
                        mode === 'edit'
                            ? 'oranye untuk mengedit'
                            : 'merah untuk menghapus'
                    ) +
                    ' salah satu aset.'
                );
            }

        } catch (error) {
            $('#aetDetailBody').innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="aet-empty"
                    >
                        ${esc(error.message)}
                    </td>
                </tr>
            `;
        }
    }

    // ========================================================
    // 19. PILIH DEPARTEMEN / DIVISI
    // ========================================================

    $('#aetTree').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                '[data-tree-dep]'
            );

            if (!button) {
                return;
            }

            currentFilter = {
                dep: button.dataset.treeDep,
                div: button.dataset.treeDiv
            };

            $('#aetFocus').hidden = true;

            makeTree();
            renderDetail();
        }
    );

    $('#aetDetailSearch').addEventListener(
        'input',
        renderDetail
    );

    // ========================================================
    // 20. AKSI PADA DETAIL
    // ========================================================

    function clickAset(event) {
        const button = event.target.closest(
            'button'
        );

        if (!button) {
            return;
        }

        if (button.dataset.focus) {
            const item = details.find(
                value =>
                    String(value.id) ===
                    button.dataset.focus
            );

            if (item) {
                focusAsset(item);
            }

        } else if (button.dataset.edit) {
            edit(button.dataset.edit);

        } else if (button.dataset.delete) {
            remove(button.dataset.delete);

        } else if (
            button.hasAttribute(
                'data-focus-close'
            )
        ) {
            $('#aetFocus').hidden = true;
        }
    }

    $('#aetDetailBody').addEventListener(
        'click',
        clickAset
    );

    $('#aetFocus').addEventListener(
        'click',
        clickAset
    );

    // ========================================================
    // 21. DETAIL NILAI ASET K.I.B E
    // ========================================================

    async function showNilai(id) {
        $('#aetNilaiBody').innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="aet-empty"
                >
                    Memuat transaksi...
                </td>
            </tr>
        `;

        $('#aetNilaiTitle').textContent =
            'Detail Nilai Aset Tetap Lainnya';

        open('aetNilaiDialog');

        try {
            const data = await request(
                lokasiUrl(id) + '/nilai'
            );

            $('#aetNilaiSub').textContent =
                `${
                    data.lokasi.lokasi || '—'
                } · ${
                    data.lokasi.alamat || '—'
                }`;

            $('#aetNilaiTotal').textContent =
                money(data.total);

            $('#aetNilaiCount').textContent =
                `${number(data.count)} transaksi`;

            $('#aetNilaiBody').innerHTML =
                data.data.length

                    ? data.data.map(
                        (item, index) => `
                        <tr>
                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${esc(
                                    item.kode_aktiva || '—'
                                )}
                            </td>

                            <td>
                                ${esc(
                                    item.nama_aktiva || '—'
                                )}
                            </td>

                            <td>
                                ${date(item.tgl_voucher)}
                            </td>

                            <td>
                                ${esc(item.tahun || '—')}
                            </td>

                            <td>
                                <b>
                                    ${money(item.nilai)}
                                </b>
                            </td>

                            <td>
                                ${esc(item.urai || '—')}
                            </td>

                            <td>
                                ${esc(
                                    item.no_voucher || '—'
                                )}
                            </td>
                        </tr>
                        `
                    ).join('')

                    : `
                    <tr>
                        <td
                            colspan="8"
                            class="aet-empty"
                        >
                            Belum ada transaksi
                            Nilai Aset pada lokasi ini.
                        </td>
                    </tr>
                    `;

        } catch (error) {
            $('#aetNilaiBody').innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="aet-empty"
                    >
                        ${esc(error.message)}
                    </td>
                </tr>
            `;
        }
    }

    // ========================================================
    // 22. DAFTAR PDF
    // ========================================================

    async function showPdfs(id) {
        $('#aetPdfList').textContent =
            'Memuat daftar dokumen...';

        open('aetPdfDialog');

        try {
            const data = await request(
                lokasiUrl(id)
            );

            const docs = (
                data.data || []
            ).filter(
                item => !!item.dok
            );

            $('#aetPdfTitle').textContent =
                'PDF — ' +
                (
                    data.lokasi.lokasi ||
                    'Lokasi'
                );

            $('#aetPdfList').innerHTML =
                docs.length

                    ? docs.map(
                        (item, index) => `
                        <div class="aet-pdf-row">

                            <span>
                                ${index + 1}.
                                ${esc(
                                    item.nama_barang ||
                                    'Aset'
                                )}
                                ·
                                ${esc(
                                    item.kode || '—'
                                )}
                            </span>

                            <a
                                class="aet-btn pale"
                                href="${fileUrl(
                                    item.id,
                                    'dokumen'
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i data-lucide="file-text"></i>
                                Buka PDF
                            </a>
                        </div>
                        `
                    ).join('')

                    : `
                    <p>
                        Belum ada dokumen PDF
                        pada lokasi ini.
                    </p>
                    `;

            icon();

        } catch (error) {
            $('#aetPdfList').textContent =
                error.message;
        }
    }

    // ========================================================
    // 23. TOMBOL TABEL UTAMA
    // ========================================================

    $('#aetTable').addEventListener(
        'click',
        event => {
            const button = event.target.closest(
                'button'
            );

            if (!button) {
                return;
            }

            if (button.dataset.nilai) {
                return showNilai(
                    button.dataset.nilai
                );
            }

            if (button.dataset.pdfs) {
                return showPdfs(
                    button.dataset.pdfs
                );
            }

            if (button.dataset.view) {
                return loadLokasi(
                    button.dataset.view,
                    'view'
                );
            }

            if (button.dataset.editLocation) {
                return loadLokasi(
                    button.dataset.editLocation,
                    'edit'
                );
            }

            if (button.dataset.deleteLocation) {
                return loadLokasi(
                    button.dataset.deleteLocation,
                    'delete'
                );
            }
        }
    );

    // ========================================================
    // 24. AKSI DARI TAB ASET TERBARU
    // ========================================================

    $$('[data-aset]').forEach(button => {
        button.addEventListener(
            'click',
            async () => {
                try {
                    const data = await request(
                        assetUrl(button.dataset.aset)
                    );

                    await loadLokasi(
                        data.data.id_lokasi
                    );

                    const item = details.find(
                        value =>
                            String(value.id) ===
                            String(
                                button.dataset.aset
                            )
                    );

                    if (item) {
                        focusAsset(item);
                    }

                } catch (error) {
                    notify(error.message);
                }
            }
        );
    });

    // ========================================================
    // 25. INITIALISASI
    // ========================================================

    renderPage();

    icon();
});
