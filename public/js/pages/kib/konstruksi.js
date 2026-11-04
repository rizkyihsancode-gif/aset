
/*
|--------------------------------------------------------------------------
| SISTEM ASET — K.I.B F KONSTRUKSI MANUAL
| PERUMDA TIRTA KENCANA KOTA SAMARINDA
|--------------------------------------------------------------------------
|
| Fitur:
| 1. Create / Tambah Konstruksi
| 2. Read / View Detail Konstruksi
| 3. Update / Edit Konstruksi
| 4. Delete / Hapus Konstruksi
| 5. Konfirmasi penghapusan
| 6. Multiple PDF dan gambar
| 7. Hapus lampiran tersimpan saat Edit
| 8. Validasi dan pesan kesalahan
| 9. Tampilan detail dengan format uraian pekerjaan
|
| Database:
| - kib_konstruksi_manual
| - kib_konstruksi_dokumens
|
| Controller:
| - KIBController.php
|
| Arsip lama:
| - kib_f_s (read-only)
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    /*
    |--------------------------------------------------------------------------
    | INISIALISASI
    |--------------------------------------------------------------------------
    */

    const root = document.getElementById('kfApp');

    if (!root || root.dataset.initialized === '1') {
        return;
    }

    root.dataset.initialized = '1';

    const $ = (id) => document.getElementById(id);

    const base = (root.dataset.base || '').replace(/\/$/, '');
    const token = root.dataset.token;

    const form = $('kfForm');
    const formDialog = $('kfModalForm');
    const detailDialog = $('kfModalDetail');
    const deleteDialog = $('kfModalDelete');

    /*
    |--------------------------------------------------------------------------
    | FIELD FORM KONSTRUKSI
    |--------------------------------------------------------------------------
    */

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
        'ket'
    ];

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    let active = null;
    let editId = null;

    let newFiles = [];

    let saving = false;
    let deleting = false;

    let deleteTarget = null;
    let toastTimer = null;


    /*
    |--------------------------------------------------------------------------
    | FORMAT RUPIAH
    |--------------------------------------------------------------------------
    */

    const money = (value) => {
        const number = Number(value) || 0;

        return 'Rp ' + number.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };


    /*
    |--------------------------------------------------------------------------
    | FORMAT KATEGORI
    |--------------------------------------------------------------------------
    */

    function formatKategori(value) {
        const kategori = String(value || '').toUpperCase();

        switch (kategori) {
            case 'IPA':
                return 'Instalasi Pengolahan Air (IPA)';

            case 'BOOSTER':
                return 'Booster';

            case 'PERPIPAAN':
                return 'Perpipaan';

            default:
                return 'Belum Dikategorikan';
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT JENIS BANGUNAN
    |--------------------------------------------------------------------------
    */

    function formatBangunan(value) {
        switch (String(value || '').toUpperCase()) {
            case 'P':
                return 'Permanen';

            case 'SP':
                return 'Semi Permanen';

            case 'D':
                return 'Darurat';

            default:
                return value || '—';
        }
    }


    /*
    |--------------------------------------------------------------------------
    | REFRESH ICON LUCIDE
    |--------------------------------------------------------------------------
    */

    function refreshIcons() {
        if (
            window.lucide &&
            typeof window.lucide.createIcons === 'function'
        ) {
            window.lucide.createIcons();
        }
    }


    /*
    |--------------------------------------------------------------------------
    | MODAL HELPER
    |--------------------------------------------------------------------------
    */

    function openDialog(dialog) {
        if (!dialog) {
            return;
        }

        if (
            !dialog.open &&
            typeof dialog.showModal === 'function'
        ) {
            dialog.showModal();
        }

        refreshIcons();
    }


    function closeDialog(dialog) {
        if (dialog && dialog.open) {
            dialog.close();
        }
    }


    /*
    |--------------------------------------------------------------------------
    | TOAST NOTIFICATION
    |--------------------------------------------------------------------------
    */

    function showToast(message) {
        const node = $('kfToast');

        if (!node) {
            console.warn(message);
            return;
        }

        node.textContent = message;
        node.hidden = false;

        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        toastTimer = setTimeout(() => {
            node.hidden = true;
        }, 4000);
    }


    /*
    |--------------------------------------------------------------------------
    | FORM ERROR MESSAGE
    |--------------------------------------------------------------------------
    */

    function showError(message) {
        const node = $('kfError');

        if (!node) {
            return;
        }

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
    | API HELPER
    |--------------------------------------------------------------------------
    |
    | Menggunakan endpoint Konstruksi yang ada
    | pada KIBController.php.
    |--------------------------------------------------------------------------
    */

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',

            ...options,

            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': token,

                ...(options.headers || {})
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
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
                    'Ukuran unggahan melebihi batas konfigurasi server.';
            }

            if (response.status === 419) {
                message =
                    'Sesi login telah habis. Silakan refresh halaman.';
            }

            if (response.status === 403) {
                message =
                    'Akun tidak memiliki izin untuk melakukan tindakan ini.';
            }

            if (response.status === 404) {
                message =
                    'Data Konstruksi tidak ditemukan.';
            }

            throw new Error(message);
        }

        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | TUTUP MODAL DARI TOMBOL
    |--------------------------------------------------------------------------
    */

    document.querySelectorAll('[data-kf-close]')
        .forEach((button) => {
            button.addEventListener('click', () => {
                const dialogId = button.dataset.kfClose;

                closeDialog($(dialogId));
            });
        });


    /*
    |--------------------------------------------------------------------------
    | TUTUP MODAL DENGAN KLIK BACKDROP
    |--------------------------------------------------------------------------
    */

    [
        formDialog,
        detailDialog,
        deleteDialog
    ].forEach((dialog) => {
        dialog?.addEventListener('click', (event) => {
            if (event.target === dialog) {
                closeDialog(dialog);
            }
        });
    });


    /*
    |--------------------------------------------------------------------------
    | RESET PILIHAN DOKUMEN
    |--------------------------------------------------------------------------
    */

    function resetFiles() {
        newFiles = [];

        const input = $('kfDokumens');

        if (input) {
            input.value = '';
        }

        $('kfSelectedFiles')?.replaceChildren();
        $('kfSavedFiles')?.replaceChildren();
    }


    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN DAFTAR FILE BARU
    |--------------------------------------------------------------------------
    */

    function renderSelectedFiles() {
        const container = $('kfSelectedFiles');

        if (!container) {
            return;
        }

        container.replaceChildren();

        if (newFiles.length === 0) {
            return;
        }

        const heading = document.createElement('strong');

        heading.textContent =
            `${newFiles.length} lampiran baru dipilih:`;

        container.appendChild(heading);

        newFiles.forEach((file, index) => {
            const row = document.createElement('div');

            row.className = 'kf-file-row';

            const filename = document.createElement('span');

            const sizeMB = (
                file.size / 1024 / 1024
            ).toFixed(2);

            filename.textContent =
                `${file.name} (${sizeMB} MB)`;

            const removeButton =
                document.createElement('button');

            removeButton.type = 'button';
            removeButton.className = 'kf-link';
            removeButton.textContent = 'Batalkan';

            removeButton.addEventListener('click', () => {
                newFiles.splice(index, 1);

                renderSelectedFiles();
            });

            row.append(
                filename,
                removeButton
            );

            container.appendChild(row);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD MULTIPLE PDF / GAMBAR
    |--------------------------------------------------------------------------
    |
    | File disimpan dalam array.
    |
    | Contoh:
    | - Pilih 2 PDF
    | - Pilih lagi 3 PDF
    | - Total menjadi 5 PDF
    |
    | Tidak menghapus pilihan sebelumnya.
    |--------------------------------------------------------------------------
    */

    $('kfDokumens')?.addEventListener(
        'change',
        (event) => {
            const selected = Array.from(
                event.target.files || []
            );

            for (const file of selected) {
                const allowed =
                    /\.(pdf|jpe?g|png|webp)$/i.test(file.name);

                if (!allowed) {
                    showToast(
                        `${file.name}: format file tidak didukung.`
                    );

                    continue;
                }

                const duplicate = newFiles.some((old) => {
                    return (
                        old.name === file.name &&
                        old.size === file.size &&
                        old.lastModified === file.lastModified
                    );
                });

                if (!duplicate) {
                    newFiles.push(file);
                }
            }

            /*
             * Reset elemen input agar pengguna
             * bisa memilih file lainnya.
             */

            event.target.value = '';

            renderSelectedFiles();
        }
    );


    /*
    |--------------------------------------------------------------------------
    | LAMPIRAN YANG SUDAH TERSIMPAN
    |--------------------------------------------------------------------------
    */

    function renderSavedFiles(documents) {
        const container = $('kfSavedFiles');

        if (!container) {
            return;
        }

        container.replaceChildren();

        if (!Array.isArray(documents) || documents.length === 0) {
            return;
        }

        const heading = document.createElement('strong');

        heading.textContent =
            'Lampiran tersimpan (centang untuk menghapus saat menyimpan):';

        container.appendChild(heading);

        documents.forEach((doc) => {
            const row = document.createElement('div');

            row.className = 'kf-file-row';

            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            link.textContent = doc.nama || 'Lihat Dokumen';

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
    | CREATE — FORM TAMBAH KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    function newForm() {
        saving = false;

        active = null;
        editId = null;

        if (!form) {
            showToast('Form Konstruksi tidak ditemukan.');
            return;
        }

        form.reset();

        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Tambah Data Konstruksi';

        const submit = $('kfSimpan');

        submit.disabled = false;
        submit.textContent = 'Simpan Konstruksi';

        $('kfTahun').value =
            new Date().getFullYear();

        openDialog(formDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE — FORM EDIT KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    function editForm(item) {
        if (!item || !form) {
            return;
        }

        saving = false;

        active = item;
        editId = Number(item.id);

        form.reset();

        resetFiles();
        showError('');

        $('kfFormTitle').textContent =
            'Edit Data Konstruksi';

        /*
         * Fallback alias dari KIBController.php.
         */

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

            if (!input) {
                continue;
            }

            input.value = String(
                item[key] ??
                fallback[key] ??
                ''
            ).trim();
        }

        /*
         * Tampilkan dokumen yang sudah tersimpan.
         */

        renderSavedFiles(item.dokumens || []);

        const submit = $('kfSimpan');

        submit.disabled = false;
        submit.textContent = 'Simpan Perubahan';

        openDialog(formDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | EVENT TOMBOL TAMBAH
    |--------------------------------------------------------------------------
    */

    $('kfTambah')?.addEventListener(
        'click',
        newForm
    );


    /*
    |--------------------------------------------------------------------------
    | HELPER ELEMEN DETAIL AMAN
    |--------------------------------------------------------------------------
    |
    | textContent menghindari eksekusi HTML
    | dari data yang diinput pengguna.
    |--------------------------------------------------------------------------
    */

    function textElement(
        tag,
        content,
        className = ''
    ) {
        const element = document.createElement(tag);

        if (
            content === null ||
            content === undefined ||
            content === ''
        ) {
            element.textContent = '—';
        } else {
            element.textContent = String(content);
        }

        if (className) {
            element.className = className;
        }

        return element;
    }


    /*
    |--------------------------------------------------------------------------
    | READ — MODAL DETAIL KONSTRUKSI
    |--------------------------------------------------------------------------
    */

    function showDetail(item) {
        if (!item) {
            return;
        }

        active = item;

        $('kfDetailTitle').textContent =
            item.nama_barang ||
            'Detail Konstruksi';

        const body = $('kfDetailBody');

        if (!body) {
            return;
        }

        body.replaceChildren();

        /*
         * Grid informasi konstruksi.
         */

        const grid = document.createElement('div');

        grid.className = 'kf-detail-grid';

        const labels = [
            [
                'Nama Barang / Pekerjaan',
                item.nama_barang
            ],
            [
                'Kategori',
                formatKategori(item.kategori)
            ],
            [
                'Cakupan',
                item.cakupan
            ],
            [
                'Tahun Pekerjaan',
                item.tahun
            ],
            [
                'Lokasi',
                item.nama_lokasi
            ],
            [
                'Alamat Lokasi',
                item.alamat_lokasi
            ],
            [
                'Departemen',
                item.nama_departemen
            ],
            [
                'Divisi',
                item.nama_divisi
            ],
            [
                'Bangunan',
                formatBangunan(item.type)
            ],
            [
                'Bertingkat / Tidak',
                item.struktur
            ],
            [
                'Beton / Tidak',
                item.materi
            ],
            [
                'Letak / Lokasi Alamat',
                item.letak
            ],
            [
                'Status Tanah',
                item.status_tanah
            ],
            [
                'Asal Usul Pembiayaan',
                item.asal
            ],
            [
                'Status Aset',
                item.status_aset
            ],
            [
                'Nilai Konstruksi',
                money(item.nilai)
            ]
        ];

        labels.forEach(([label, value]) => {
            const box = document.createElement('div');

            box.append(
                textElement('small', label),
                textElement('strong', value)
            );

            grid.appendChild(box);
        });

        body.appendChild(grid);

        /*
         * Uraian pekerjaan dengan baris baru.
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
         * Keterangan dan berita acara.
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
         * Foto utama.
         */

        if (item.foto_url) {
            const image = document.createElement('img');

            image.className = 'kf-photo';
            image.src = item.foto_url;
            image.alt = 'Foto Konstruksi';

            body.appendChild(image);
        }

        /*
         * Dokumen pendukung.
         */

        body.appendChild(
            textElement(
                'h3',
                'Dokumen Pendukung'
            )
        );

        const links = document.createElement('div');

        links.className = 'kf-file-list';

        const documents = Array.isArray(item.dokumens)
            ? item.dokumens
            : [];

        if (documents.length === 0) {
            links.appendChild(
                textElement(
                    'p',
                    'Belum ada lampiran.'
                )
            );
        }

        documents.forEach((doc) => {
            const link = document.createElement('a');

            link.href = doc.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            link.className = 'kf-btn kf-outline';

            link.textContent =
                doc.nama || 'Lihat Dokumen';

            links.appendChild(link);
        });

        body.appendChild(links);

        openDialog(detailDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | AMBIL DETAIL DARI CONTROLLER
    |--------------------------------------------------------------------------
    */

    async function fetchKonstruksi(id) {
        const response = await api(
            `${base}/${encodeURIComponent(id)}`
        );

        if (!response.data) {
            throw new Error(
                'Data Konstruksi tidak ditemukan.'
            );
        }

        return response.data;
    }


    /*
    |--------------------------------------------------------------------------
    | CRUD LANGSUNG DARI TABEL
    |--------------------------------------------------------------------------
    |
    | Blade menggunakan:
    |
    | data-kf-action="view"
    | data-kf-action="edit"
    | data-kf-action="delete"
    |
    | data-kf-id="ID"
    |--------------------------------------------------------------------------
    */

    root.addEventListener('click', async (event) => {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const button = target.closest(
            'button[data-kf-action]'
        );

        if (!button || !root.contains(button)) {
            return;
        }

        const id = button.dataset.kfId;
        const action = button.dataset.kfAction;

        if (!/^\d+$/.test(String(id))) {
            showToast('ID Konstruksi tidak valid.');
            return;
        }

        /*
         * DELETE:
         * Buka konfirmasi, jangan langsung menghapus.
         */

        if (action === 'delete') {
            askDelete({
                id: Number(id),

                nama_barang:
                    button.dataset.kfName ||
                    `Konstruksi #${id}`
            });

            return;
        }

        /*
         * VIEW / EDIT:
         * Ambil data terbaru dari database.
         */

        if (!['view', 'edit'].includes(action)) {
            return;
        }

        if (button.disabled) {
            return;
        }

        button.disabled = true;

        try {
            const item = await fetchKonstruksi(id);

            if (action === 'view') {
                showDetail(item);
            }

            if (action === 'edit') {
                editForm(item);
            }

        } catch (exception) {
            showToast(exception.message);

        } finally {
            button.disabled = false;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | EDIT MELALUI MODAL DETAIL
    |--------------------------------------------------------------------------
    */

    $('kfEdit')?.addEventListener('click', () => {
        if (!active) {
            return;
        }

        const item = active;

        closeDialog(detailDialog);

        editForm(item);
    });


    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN MODAL KONFIRMASI DELETE
    |--------------------------------------------------------------------------
    */

    function askDelete(item) {
        if (!item || deleting) {
            return;
        }

        deleteTarget = {
            id: Number(item.id),

            name:
                item.nama_barang ||
                item.nama_pekerjaan ||
                `Konstruksi #${item.id}`
        };

        const nameElement = $('kfDeleteName');

        if (nameElement) {
            nameElement.textContent =
                deleteTarget.name;
        }

        if (detailDialog?.open) {
            closeDialog(detailDialog);
        }

        if (!deleteDialog) {
            showToast(
                'Modal konfirmasi hapus tidak ditemukan.'
            );

            deleteTarget = null;
            return;
        }

        openDialog(deleteDialog);
    }


    /*
    |--------------------------------------------------------------------------
    | HAPUS MELALUI MODAL DETAIL
    |--------------------------------------------------------------------------
    */

    $('kfHapus')?.addEventListener('click', () => {
        if (active) {
            askDelete(active);
        }
    });


    /*
    |--------------------------------------------------------------------------
    | DELETE — KONFIRMASI HAPUS
    |--------------------------------------------------------------------------
    |
    | Request DELETE hanya dikirim setelah
    | pengguna menekan "Ya, Hapus Data".
    |--------------------------------------------------------------------------
    */

    $('kfDeleteConfirm')?.addEventListener(
        'click',
        async () => {
            if (!deleteTarget || deleting) {
                return;
            }

            deleting = true;

            const button = $('kfDeleteConfirm');

            button.disabled = true;

            const id = deleteTarget.id;

            try {
                await api(
                    `${base}/${encodeURIComponent(id)}`,
                    {
                        method: 'DELETE'
                    }
                );

                closeDialog(deleteDialog);

                /*
                 * Refresh agar tabel, jumlah inventaris,
                 * dan nilai konstruksi ikut diperbarui.
                 */

                window.location.reload();

            } catch (exception) {
                showToast(exception.message);

            } finally {
                deleting = false;
                button.disabled = false;
            }
        }
    );


    /*
    |--------------------------------------------------------------------------
    | RESET TARGET DELETE KETIKA MODAL DITUTUP
    |--------------------------------------------------------------------------
    */

    deleteDialog?.addEventListener('close', () => {
        if (!deleting) {
            deleteTarget = null;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | NORMALISASI INPUT KATEGORI
    |--------------------------------------------------------------------------
    */

    $('kfKategori')?.addEventListener(
        'change',
        (event) => {
            event.target.value = String(
                event.target.value || ''
            ).trim().toUpperCase();
        }
    );


    /*
    |--------------------------------------------------------------------------
    | SIMPAN KONSTRUKSI — CREATE / UPDATE
    |--------------------------------------------------------------------------
    */

    form?.addEventListener(
        'submit',
        async (event) => {
            event.preventDefault();

            if (saving) {
                return;
            }

            showError('');

            /*
             * Validasi field required.
             */

            if (!form.reportValidity()) {
                return;
            }

            saving = true;

            const submit = $('kfSimpan');

            submit.disabled = true;

            /*
             * Ambil seluruh input form.
             */

            const data = new FormData(form);

            /*
             * Kategori disimpan uppercase.
             */

            const kategori = String(
                data.get('kategori') || ''
            ).trim().toUpperCase();

            data.set('kategori', kategori);

            /*
             * Semua lampiran diambil dari array.
             *
             * File input sudah direset saat pengguna
             * memilih file agar bisa memilih berulang.
             */

            data.delete('dokumens[]');

            newFiles.forEach((file) => {
                data.append(
                    'dokumens[]',
                    file,
                    file.name
                );
            });

            /*
             * CREATE:
             * POST /kib/konstruksi
             *
             * UPDATE:
             * POST /kib/konstruksi/{id}
             * + _method = PUT
             */

            let url = base;

            if (editId !== null) {
                url = `${base}/${encodeURIComponent(editId)}`;

                data.set('_method', 'PUT');
            }

            try {
                await api(url, {
                    method: 'POST',
                    body: data
                });

                /*
                 * Reload tabel dan statistik.
                 */

                window.location.reload();

            } catch (exception) {
                showError(exception.message);

                submit.disabled = false;
                saving = false;
            }
        }
    );


    /*
    |--------------------------------------------------------------------------
    | INITIALIZATION
    |--------------------------------------------------------------------------
    */

    refreshIcons();

})();
