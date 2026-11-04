
/*
|--------------------------------------------------------------------------
| SISTEM ASET — K.I.B F KONSTRUKSI MANUAL
| Perumda Tirta Kencana Kota Samarinda
|--------------------------------------------------------------------------
|
| - Tanpa voucher / kode aktiva / Data Pending
| - Tambah, Edit, Detail, Hapus
| - Pemilihan banyak PDF / gambar
| - File baru tidak menghapus lampiran yang sudah ada
|
*/

(() => {
    'use strict';

    const root = document.getElementById('kfApp');

    if (!root || root.dataset.initialized === '1') {
        return;
    }

    root.dataset.initialized = '1';

    const $ = id => document.getElementById(id);

    const base = root.dataset.base;
    const token = root.dataset.token;

    const form = $('kfForm');
    const formDialog = $('kfModalForm');
    const detailDialog = $('kfModalDetail');

    const fields = [
        'nama_barang_manual',
        'kategori',
        'cakupan',
        'lokasi_manual',
        'alamat_manual',
        'departemen_manual',
        'divisi_manual',
        'tahun',
        'type',
        'struktur',
        'materi',
        'letak',
        'status_tanah',
        'asal',
        'status_aset',
        'nilai',
        'urai',
        'ket',
    ];

    const money = value =>
        'Rp ' + (Number(value) || 0)
            .toLocaleString('id-ID');

    let active = null;
    let editId = null;
    let newFiles = [];
    let saving = false;


    /*
    |--------------------------------------------------------------------------
    | ICON LUCIDE
    |--------------------------------------------------------------------------
    */

    function refreshIcons() {
        window.lucide?.createIcons?.();
    }


    /*
    |--------------------------------------------------------------------------
    | MODAL
    |--------------------------------------------------------------------------
    */

    function openDialog(dialog) {
        if (
            dialog &&
            !dialog.open &&
            typeof dialog.showModal === 'function'
        ) {
            dialog.showModal();
        }

        refreshIcons();
    }

    function closeDialog(dialog) {
        if (dialog?.open) {
            dialog.close();
        }
    }


    /*
    |--------------------------------------------------------------------------
    | TOAST NOTIFIKASI
    |--------------------------------------------------------------------------
    */

    let toastTimer;

    function toast(message) {
        const node = $('kfToast');

        if (!node) return;

        node.textContent = message;
        node.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            node.hidden = true;
        }, 3800);
    }


    /*
    |--------------------------------------------------------------------------
    | PESAN VALIDASI
    |--------------------------------------------------------------------------
    */

    function showError(message) {
        const node = $('kfError');

        if (!node) return;

        node.textContent = message || '';
        node.hidden = !message;

        if (message) {
            node.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH LARAVEL
    |--------------------------------------------------------------------------
    */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                Accept: 'application/json',

                'X-Requested-With': 'XMLHttpRequest',

                'X-CSRF-TOKEN': token,

                ...options.headers
            }
        });

        const data = await response
            .json()
            .catch(() => ({}));

        if (
            !response.ok ||
            data.success === false
        ) {

            const validationMessages = data.errors
                ? Object.values(data.errors)
                    .flat()
                    .join('\n')
                : '';

            let message =
                validationMessages ||
                data.message ||
                `Permintaan gagal (HTTP ${response.status}).`;

            if (response.status === 413) {
                message =
                    'Ukuran total dokumen melebihi batas upload server.';
            }

            if (response.status === 419) {
                message =
                    'Sesi login telah habis. Refresh halaman dan login kembali.';
            }

            throw new Error(message);
        }

        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | TUTUP MODAL
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll('[data-kf-close]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const dialogId =
                    button.dataset.kfClose;

                closeDialog($(dialogId));
            });
        });

    for (const dialog of [
        formDialog,
        detailDialog
    ]) {

        dialog?.addEventListener('click', event => {

            if (event.target === dialog) {
                closeDialog(dialog);
            }
        });
    }


    /*
    |--------------------------------------------------------------------------
    | RESET LAMPIRAN BARU
    |--------------------------------------------------------------------------
    */

    function resetFiles() {
        newFiles = [];

        if ($('kfDokumens')) {
            $('kfDokumens').value = '';
        }

        $('kfSelectedFiles')?.replaceChildren();

        $('kfSavedFiles')?.replaceChildren();
    }


    /*
    |--------------------------------------------------------------------------
    | DAFTAR FILE YANG DIPILIH
    |--------------------------------------------------------------------------
    */

    function syncFiles() {
        const list = $('kfSelectedFiles');

        if (!list) return;

        list.replaceChildren();

        if (!newFiles.length) return;

        const heading = document.createElement('strong');

        heading.textContent =
            `${newFiles.length} lampiran baru dipilih:`;

        list.appendChild(heading);

        newFiles.forEach((file, index) => {

            const row = document.createElement('div');
            row.className = 'kf-file-row';

            const span = document.createElement('span');

            const sizeMB = (
                file.size / 1024 / 1024
            ).toFixed(2);

            span.textContent =
                `${file.name} (${sizeMB} MB)`;

            const removeButton =
                document.createElement('button');

            removeButton.type = 'button';
            removeButton.className = 'kf-link';
            removeButton.textContent = 'Batalkan';

            removeButton.addEventListener('click', () => {

                newFiles.splice(index, 1);

                syncFiles();
            });

            row.append(
                span,
                removeButton
            );

            list.appendChild(row);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | PILIH FILE BERULANG
    |--------------------------------------------------------------------------
    |
    | File disimpan sementara dalam array newFiles.
    | Memilih file berikutnya tidak mengganti file sebelumnya.
    |
    */

    $('kfDokumens')?.addEventListener(
        'change',
        event => {

            const selected = Array.from(
                event.target.files || []
            );

            for (const file of selected) {

                const allowed = /\.(pdf|jpe?g|png|webp)$/i
                    .test(file.name);

                if (!allowed) {

                    toast(
                        `${file.name}: format file tidak didukung.`
                    );

                    continue;
                }

                const duplicate = newFiles.some(old =>
                    old.name === file.name &&
                    old.size === file.size &&
                    old.lastModified === file.lastModified
                );

                if (!duplicate) {
                    newFiles.push(file);
                }
            }

            /*
             * Reset elemen file input.
             * Daftar tetap disimpan dalam newFiles.
             */

            event.target.value = '';

            syncFiles();
        }
    );


    /*
    |--------------------------------------------------------------------------
    | LAMPIRAN YANG SUDAH TERSIMPAN
    |--------------------------------------------------------------------------
    */

    function renderSavedFiles(documents) {
        const container = $('kfSavedFiles');

        if (!container) return;

        container.replaceChildren();

        if (!documents?.length) return;

        const heading = document.createElement('strong');

        heading.textContent =
            'Lampiran tersimpan. Centang untuk menghapus saat Edit:';

        container.appendChild(heading);

        documents.forEach(doc => {

            const row = document.createElement('div');
            row.className = 'kf-file-row';

            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = doc.nama;

            row.appendChild(link);

            if (
                doc.id !== null &&
                doc.id !== undefined
            ) {

                const label = document.createElement('label');

                label.className = 'kf-remove-file';

                const checkbox = document.createElement('input');

                checkbox.type = 'checkbox';
                checkbox.name = 'hapus_dokumen_ids[]';
                checkbox.value = String(doc.id);

                label.append(
                    checkbox,
                    document.createTextNode(' Hapus lampiran')
                );

                row.appendChild(label);
            }

            container.appendChild(row);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | FORM TAMBAH
    |--------------------------------------------------------------------------
    */

    function newForm() {
        editId = null;
        active = null;

        form.reset();
        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Tambah Data Konstruksi';

        $('kfSimpan').disabled = false;

        $('kfSimpan').textContent =
            'Simpan Konstruksi';

        saving = false;

        $('kfTahun').value =
            new Date().getFullYear();

        openDialog(formDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | FORM EDIT
    |--------------------------------------------------------------------------
    */

    function editForm(item) {
        editId = Number(item.id);

        form.reset();
        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Edit Data Konstruksi';

        const fallback = {
            nama_barang_manual:
                item.nama_barang,

            lokasi_manual:
                item.nama_lokasi,

            alamat_manual:
                item.alamat_lokasi,

            departemen_manual:
                item.nama_departemen,

            divisi_manual:
                item.nama_divisi
        };

        for (const key of fields) {

            const input = form.elements.namedItem(key);

            if (!input) continue;

            input.value = String(
                item[key] ??
                fallback[key] ??
                ''
            ).trim();
        }

        renderSavedFiles(
            item.dokumens || []
        );

        saving = false;

        $('kfSimpan').disabled = false;
        $('kfSimpan').textContent = 'Simpan Perubahan';

        openDialog(formDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | KLIK TAMBAH KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    $('kfTambah')?.addEventListener(
        'click',
        newForm
    );


    /*
    |--------------------------------------------------------------------------
    | PEMBUAT ELEMEN AMAN
    |--------------------------------------------------------------------------
    |
    | Data database ditempatkan dengan textContent.
    | Tidak menjalankan HTML dari isian pengguna.
    |
    */

    function textElement(
        tag,
        content,
        className = ''
    ) {

        const element = document.createElement(tag);

        element.textContent =
            content === null ||
            content === undefined ||
            content === ''
                ? '—'
                : String(content);

        if (className) {
            element.className = className;
        }

        return element;
    }


    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN DETAIL KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    function showDetail(item) {

        active = item;

        $('kfDetailTitle').textContent =
            item.nama_barang ||
            'Detail Konstruksi';

        const body = $('kfDetailBody');

        body.replaceChildren();

        const grid = document.createElement('div');

        grid.className = 'kf-detail-grid';

        const labels = [

            ['Kategori', (
                item.kategori === 'IPA'
                    ? 'Instalasi Pengolahan Air (IPA)'
                    : item.kategori
            ) || 'Belum Dikategorikan'],

            ['Cakupan', item.cakupan],

            ['Nama Pekerjaan', item.nama_barang],

            ['Tahun Pekerjaan', item.tahun],

            ['Lokasi', item.nama_lokasi],

            ['Alamat', item.alamat_lokasi],

            ['Departemen', item.nama_departemen],

            ['Divisi', item.nama_divisi],

            ['Bangunan', {
                P: 'Permanen',
                SP: 'Semi Permanen',
                D: 'Darurat'
            }[item.type] || item.type],

            ['Bertingkat / Tidak', item.struktur],

            ['Beton / Tidak', item.materi],

            ['Letak', item.letak],

            ['Status Tanah', item.status_tanah],

            ['Asal Pembiayaan', item.asal],

            ['Status Aset', item.status_aset],

            ['Nilai Konstruksi', money(item.nilai)]

        ];

        for (const [label, value] of labels) {

            const box = document.createElement('div');

            box.append(
                textElement('small', label),
                textElement('strong', value)
            );

            grid.appendChild(box);
        }

        body.appendChild(grid);


        /*
         * Uraian Pekerjaan.
         */

        body.append(
            textElement(
                'h3',
                'Uraian Pekerjaan'
            ),

            textElement(
                'p',
                item.urai,
                'kf-preline'
            )
        );


        /*
         * Keterangan.
         */

        body.append(
            textElement(
                'h3',
                'Keterangan / Berita Acara'
            ),

            textElement(
                'p',
                item.ket,
                'kf-preline'
            )
        );


        /*
         * Foto konstruksi.
         */

        if (item.foto_url) {

            const img = document.createElement('img');

            img.className = 'kf-photo';
            img.src = item.foto_url;
            img.alt = 'Foto konstruksi';

            body.appendChild(img);
        }


        /*
         * Dokumen pendukung.
         */

        body.appendChild(
            textElement('h3', 'Dokumen Pendukung')
        );

        const links = document.createElement('div');

        links.className = 'kf-file-list';

        if (!item.dokumens?.length) {

            links.appendChild(
                textElement(
                    'p',
                    'Belum ada lampiran.'
                )
            );
        }

        for (const doc of (item.dokumens || [])) {

            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            link.className =
                'kf-btn kf-outline';

            link.textContent = doc.nama;

            links.appendChild(link);
        }

        body.appendChild(links);

        openDialog(detailDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | TOMBOL DETAIL PADA TABEL
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll('[data-kf-detail]')
        .forEach(button => {

            button.addEventListener(
                'click',
                async () => {

                    const id =
                        button.dataset.kfDetail;

                    button.disabled = true;

                    try {

                        const response = await api(
                            `${base}/${encodeURIComponent(id)}`
                        );

                        showDetail(response.data);

                    } catch (e) {

                        toast(e.message);

                    } finally {

                        button.disabled = false;
                    }
                }
            );
        });


    /*
    |--------------------------------------------------------------------------
    | TOMBOL EDIT
    |--------------------------------------------------------------------------
    */

    $('kfEdit')?.addEventListener('click', () => {

        if (!active) return;

        closeDialog(detailDialog);

        editForm(active);
    });


    /*
    |--------------------------------------------------------------------------
    | TOMBOL HAPUS
    |--------------------------------------------------------------------------
    */

    $('kfHapus')?.addEventListener(
        'click',
        async () => {

            if (!active) return;

            const confirmDelete = confirm(
                `Hapus catatan konstruksi "${active.nama_barang}"?`
            );

            if (!confirmDelete) return;

            const button = $('kfHapus');

            button.disabled = true;

            try {

                await api(
                    `${base}/${active.id}`,
                    {
                        method: 'DELETE'
                    }
                );

                window.location.reload();

            } catch (e) {

                toast(e.message);

                button.disabled = false;
            }
        }
    );


    /*
    |--------------------------------------------------------------------------
    | SUBMIT TAMBAH / EDIT
    |--------------------------------------------------------------------------
    */

    form?.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            if (saving) return;

            showError('');

            if (!form.reportValidity()) {
                return;
            }

            saving = true;

            const submit = $('kfSimpan');

            submit.disabled = true;

            /*
             * Ambil seluruh isi form.
             */

            const data = new FormData(form);

            /*
             * File input sudah dikosongkan saat
             * pengguna memilih dokumen.
             * Lampiran diambil dari array newFiles.
             */

            data.delete('dokumens[]');

            for (const file of newFiles) {

                data.append(
                    'dokumens[]',
                    file,
                    file.name
                );
            }

            /*
             * Laravel:
             * Tambah = POST
             * Edit   = POST + _method PUT
             */

            if (editId !== null) {
                data.append('_method', 'PUT');
            }

            const url = editId === null
                ? base
                : `${base}/${editId}`;

            try {

                await api(url, {
                    method: 'POST',
                    body: data
                });

                window.location.reload();

            } catch (e) {

                showError(e.message);

                submit.disabled = false;
                saving = false;
            }
        }
    );

    refreshIcons();

})();
