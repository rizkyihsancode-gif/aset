
/*
|--------------------------------------------------------------------------
| MASTER DATA — LOKASI
| SISTEM ASET PERUMDA TIRTA KENCANA
|--------------------------------------------------------------------------
| Fitur:
| CRUD, image preview, validasi koordinat, wilayah,
| search, pagination, export CSV, grafik, riwayat, toast.
|--------------------------------------------------------------------------
*/

(() => {
    'use strict';

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const app = $('.lokasi-page');

    if (!app) return;

    let currentPage = 1;
    let mode = 'add';
    let currentRow = null;
    let currentId = null;
    let pending = false;
    let previewUrl = null;
    let chart = null;
    let toastTimeout = null;
    let oldOverflow = '';

    const formatter = new Intl.NumberFormat('id-ID');
    const form = $('#lokasiForm');
    const modal = $('#lokasiModal');
    const history = $('#lokasiHistoryModal');
    const routes = window.LOKASI_CRUD || {};

    /* ======================================================
       HELPERS
    ====================================================== */

    function icons() {
        window.lucide?.createIcons?.();
    }

    function field(id) {
        return $('#' + id);
    }

    function norm(value) {
        return String(value ?? '')
            .trim()
            .toLocaleLowerCase('id-ID');
    }

    function rows() {
        return $$('#lokasiTable tbody tr[data-record]');
    }

    function csrf() {
        return $('meta[name="csrf-token"]')?.content ||
            $('#lokasiForm input[name="_token"]')?.value ||
            '';
    }

    function urlWithId(template) {
        if (!template || !currentId) {
            throw new Error(
                'Route atau ID Lokasi tidak tersedia.'
            );
        }

        return String(template).replace(
            '__ID__',
            encodeURIComponent(currentId)
        );
    }

    /* ======================================================
       JAM WITA
    ====================================================== */

    function updateClock() {
        const now = new Date();

        const dateOptions = {
            timeZone: 'Asia/Makassar',
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        };

        const timeOptions = {
            timeZone: 'Asia/Makassar',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        };

        if (field('lokasiCurrentDate')) {
            field('lokasiCurrentDate').textContent =
                new Intl.DateTimeFormat(
                    'id-ID',
                    dateOptions
                ).format(now);
        }

        if (field('lokasiCurrentTime')) {
            field('lokasiCurrentTime').textContent =
                new Intl.DateTimeFormat(
                    'id-ID',
                    timeOptions
                ).format(now) + ' WITA';
        }
    }

    /* ======================================================
       FILTER DATA
    ====================================================== */

    function filteredRows() {
        const search = norm(
            field('lokasiSearch')?.value
        );

        const region = String(
            field('lokasiWilayahFilter')?.value || ''
        ).trim();

        return rows().filter(row => {
            const text = norm([
                row.dataset.id,
                row.dataset.lokasi,
                row.dataset.alamat,
                row.dataset.wilayah,
                row.dataset.lat,
                row.dataset.long
            ].join(' '));

            const regionId = String(
                row.dataset.wilayahId ?? ''
            ).trim();

            const matchesRegion =
                !region ||
                (
                    region === '__NULL__'
                        ? !regionId
                        : regionId === region
                );

            return matchesRegion &&
                (!search || text.includes(search));
        });
    }

    /* ======================================================
       TOMBOL PAGINATION
    ====================================================== */

    function makePageButton(
        label,
        page,
        disabled = false,
        active = false
    ) {
        const button = document.createElement('button');

        button.type = 'button';
        button.textContent = label;
        button.disabled = disabled;

        button.setAttribute(
            'aria-label',
            label === '‹'
                ? 'Halaman sebelumnya'
                : label === '›'
                    ? 'Halaman berikutnya'
                    : 'Halaman ' + page
        );

        if (active) {
            button.classList.add('active');

            button.setAttribute(
                'aria-current',
                'page'
            );
        }

        button.addEventListener('click', () => {
            currentPage = page;
            renderTable();

            field('lokasiList')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });

        return button;
    }

    function renderPagination(totalPages) {
        const nav = field('lokasiPagination');

        if (!nav) return;

        nav.replaceChildren();

        if (totalPages <= 1) return;

        nav.append(
            makePageButton(
                '‹',
                currentPage - 1,
                currentPage <= 1
            )
        );

        let first = Math.max(
            1,
            currentPage - 2
        );

        let last = Math.min(
            totalPages,
            first + 4
        );

        first = Math.max(
            1,
            last - 4
        );

        for (
            let page = first;
            page <= last;
            page++
        ) {
            nav.append(
                makePageButton(
                    String(page),
                    page,
                    false,
                    page === currentPage
                )
            );
        }

        nav.append(
            makePageButton(
                '›',
                currentPage + 1,
                currentPage >= totalPages
            )
        );
    }

    /* ======================================================
       RENDER TABEL
    ====================================================== */

    function renderTable() {
        const all = rows();
        const list = filteredRows();

        const size = Math.max(
            1,
            Number(field('lokasiPageSize')?.value) || 10
        );

        const totalPages = Math.max(
            1,
            Math.ceil(list.length / size)
        );

        currentPage = Math.min(
            Math.max(currentPage, 1),
            totalPages
        );

        const start = (currentPage - 1) * size;

        all.forEach(row => {
            row.hidden = true;
        });

        list.slice(start, start + size)
            .forEach((row, index) => {
                row.hidden = false;

                const number = $(
                    '.lokasi-row-number',
                    row
                );

                if (number) {
                    number.textContent =
                        String(start + index + 1);
                }
            });

        if (field('lokasiEmptyRow')) {
            field('lokasiEmptyRow').hidden =
                list.length > 0;
        }

        const from = list.length
            ? start + 1
            : 0;

        const to = Math.min(
            start + size,
            list.length
        );

        if (field('lokasiTableInfo')) {
            field('lokasiTableInfo').textContent =
                `Menampilkan ${from}–${to} dari ` +
                `${formatter.format(list.length)} data` +
                (
                    list.length !== all.length
                        ? ` (total ${formatter.format(all.length)})`
                        : ''
                );
        }

        renderPagination(totalPages);
        icons();
    }

    function resetFilter() {
        if (field('lokasiSearch')) {
            field('lokasiSearch').value = '';
        }

        if (field('lokasiWilayahFilter')) {
            field('lokasiWilayahFilter').value = '';
        }

        if (field('lokasiPageSize')) {
            field('lokasiPageSize').value = '10';
        }

        currentPage = 1;
        renderTable();
    }

    /* ======================================================
       PREVIEW FOTO
    ====================================================== */

    function clearPreviewUrl() {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        previewUrl = null;
    }

    function setPreview(url) {
        const img = field('lokasiImagePreview');
        const empty = field('lokasiImagePlaceholder');

        if (!img || !empty) return;

        if (url) {
            img.src = url;
            img.hidden = false;
            empty.hidden = true;
        } else {
            img.removeAttribute('src');
            img.hidden = true;
            empty.hidden = false;
        }
    }

    /* ======================================================
       TOAST
    ====================================================== */

    function showToast(
        title,
        message,
        isError = false
    ) {
        const toast = field('lokasiToast');

        if (!toast) return;

        clearTimeout(toastTimeout);

        field('lokasiToastTitle').textContent = title;
        field('lokasiToastMessage').textContent = message;

        toast.classList.toggle(
            'is-error',
            isError
        );

        const icon = $('[data-lucide]', toast);

        if (icon) {
            icon.setAttribute(
                'data-lucide',
                isError ? 'circle-x' : 'circle-check'
            );
        }

        toast.hidden = false;
        icons();

        toastTimeout = setTimeout(() => {
            toast.hidden = true;
        }, 4500);
    }

    /* ======================================================
       FORM ERROR
    ====================================================== */

    function clearErrors() {
        $$('#lokasiForm .lokasi-form-group')
            .forEach(group => {
                group.classList.remove('has-error');
            });

        $$('#lokasiForm [data-error-for]')
            .forEach(node => {
                node.textContent = '';
            });

        if (field('lokasiFormAlert')) {
            field('lokasiFormAlert').hidden = true;
            field('lokasiFormAlert').textContent = '';
        }

        $$('#lokasiForm input').forEach(input => {
            input.setCustomValidity('');
        });
    }

    function showErrors(errors, fallback) {
        let first = null;

        for (
            const [rawName, messages]
            of Object.entries(errors || {})
        ) {
            const name = rawName === 'wilayah_id'
                ? 'wilayah'
                : rawName;

            const fieldNode =
                form?.elements.namedItem(name);

            const message = Array.isArray(messages)
                ? messages[0]
                : String(messages);

            const output = $$('#lokasiForm [data-error-for]')
                .find(node =>
                    node.dataset.errorFor === name
                );

            if (output) {
                output.textContent = message;
            }

            fieldNode?.closest('.lokasi-form-group')
                ?.classList.add('has-error');

            if (!first && fieldNode?.focus) {
                first = fieldNode;
            }
        }

        const alert = field('lokasiFormAlert');

        if (alert) {
            alert.textContent = fallback ||
                'Periksa kembali isian yang ditandai.';

            alert.hidden = false;
        }

        first?.focus();
    }

    /* ======================================================
       VALIDASI KOORDINAT

       Latitude  : -90 sampai 90
       Longitude : -180 sampai 180
    ====================================================== */

    function parseCoordinate(value, max) {
        const text = String(value ?? '').trim();

        if (!text) {
            return {
                empty: true,
                value: ''
            };
        }

        if (
            !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)
        ) {
            return {
                error: 'Gunakan angka desimal dengan titik (.).'
            };
        }

        const number = Number(text);

        if (
            !Number.isFinite(number) ||
            Math.abs(number) > max
        ) {
            return {
                error: `Harus berada dalam rentang -${max} sampai ${max}.`
            };
        }

        return {
            empty: false,
            value: text
        };
    }

    /* ======================================================
       LINK GOOGLE MAPS
    ====================================================== */

    function mapLink() {
        const link = field('lokasiMapLink');

        if (!link) return;

        const lat = parseCoordinate(
            field('lokasiLat')?.value,
            90
        );

        const lng = parseCoordinate(
            field('lokasiLong')?.value,
            180
        );

        if (
            lat.error ||
            lng.error ||
            lat.empty ||
            lng.empty
        ) {
            link.hidden = true;
            link.removeAttribute('href');
            return;
        }

        link.href = 'https://www.google.com/maps?q=' +
            encodeURIComponent(
                lat.value + ',' + lng.value
            );

        link.hidden = false;
    }

    /* ======================================================
       RESET FORM
    ====================================================== */

    function resetForm() {
        form?.reset();

        clearErrors();
        clearPreviewUrl();
        setPreview('');

        currentId = null;
        currentRow = null;

        if (field('lokasiSaveButton')) {
            field('lokasiSaveButton').disabled = false;
        }

        mapLink();
    }

    /* ======================================================
       MODAL
    ====================================================== */

    function closeModal() {
        if (modal?.open) {
            modal.close();
        }
    }

    function openModal(nextMode = 'add', row = null) {
        if (!modal || !form) return;

        resetForm();

        mode = nextMode;
        currentRow = row;

        currentId = String(
            row?.dataset.id ?? ''
        ).trim() || null;

        if (row) {
            field('lokasiName').value =
                String(row.dataset.lokasi ?? '').trim();

            field('lokasiWilayah').value =
                String(row.dataset.wilayahId ?? '').trim();

            field('lokasiAddress').value =
                String(row.dataset.alamat ?? '').trim();

            field('lokasiLat').value =
                String(row.dataset.lat ?? '').trim();

            field('lokasiLong').value =
                String(row.dataset.long ?? '').trim();

            setPreview(
                String(row.dataset.imageUrl ?? '').trim()
            );
        }

        const titles = {
            add: 'Tambah Lokasi',
            edit: 'Edit Lokasi',
            view: 'Detail Lokasi',
            delete: 'Hapus Lokasi'
        };

        const descriptions = {
            add: 'Tambahkan data lokasi baru ke database.',
            edit: 'Perbarui informasi data lokasi.',
            view: 'Lihat informasi lengkap data lokasi.',
            delete: 'Periksa kembali data sebelum dihapus.'
        };

        field('lokasiModalTitle').textContent =
            titles[mode] || titles.add;

        field('lokasiModalDescription').textContent =
            descriptions[mode] || descriptions.add;

        const readOnly =
            mode === 'view' ||
            mode === 'delete';

        [
            'lokasiName',
            'lokasiAddress',
            'lokasiLat',
            'lokasiLong'
        ].forEach(id => {
            field(id).readOnly = readOnly;
        });

        field('lokasiWilayah').disabled = readOnly;
        field('lokasiImage').disabled = readOnly;
        field('lokasiFileButton').hidden = readOnly;

        field('lokasiSaveButton').hidden =
            mode === 'view';

        field('lokasiSaveButton').classList.toggle(
            'is-delete',
            mode === 'delete'
        );

        $('span', field('lokasiSaveButton')).textContent =
            mode === 'delete'
                ? 'Hapus Lokasi'
                : mode === 'edit'
                    ? 'Simpan Perubahan'
                    : 'Simpan Lokasi';

        const saveIcon = $(
            '[data-lucide]',
            field('lokasiSaveButton')
        );

        if (saveIcon) {
            saveIcon.setAttribute(
                'data-lucide',
                mode === 'delete' ? 'trash-2' : 'save'
            );
        }

        field('lokasiModalNote').classList.toggle(
            'is-danger',
            mode === 'delete'
        );

        field('lokasiModalNote').textContent =
            mode === 'delete'
                ? 'Lokasi yang masih digunakan pada modul lain mungkin tidak dapat dihapus.'
                : mode === 'view'
                    ? 'Mode detail hanya menampilkan data.'
                    : 'Nama Lokasi wajib diisi. Wilayah, gambar, dan koordinat bersifat opsional.';

        oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        if (!modal.open) {
            modal.showModal();
        }

        mapLink();
        icons();

        if (!readOnly) {
            setTimeout(() =>
                field('lokasiName')?.focus(), 20
            );
        }
    }

    /* ======================================================
       LOADING TOMBOL
    ====================================================== */

    function loading(value) {
        const button = field('lokasiSaveButton');

        if (!button) return;

        button.disabled = value;

        const span = $('span', button);

        if (!span) return;

        if (value) {
            button.dataset.previousLabel =
                span.textContent;

            span.textContent = mode === 'delete'
                ? 'Menghapus...'
                : 'Menyimpan...';
        } else if (button.dataset.previousLabel) {
            span.textContent =
                button.dataset.previousLabel;

            delete button.dataset.previousLabel;
        }
    }

    /* ======================================================
       VALIDASI FORM SEBELUM REQUEST
    ====================================================== */

    function validate() {
        const name = String(
            field('lokasiName').value || ''
        ).trim();

        const address = String(
            field('lokasiAddress').value || ''
        ).trim();

        const wilayah = String(
            field('lokasiWilayah').value || ''
        ).trim();

        const lat = parseCoordinate(
            field('lokasiLat').value,
            90
        );

        const lng = parseCoordinate(
            field('lokasiLong').value,
            180
        );

        const errors = {};

        if (!name) {
            errors.lokasi = [
                'Nama Lokasi wajib diisi.'
            ];
        }

        if (name.length > 255) {
            errors.lokasi = [
                'Nama Lokasi maksimal 255 karakter.'
            ];
        }

        if (address.length > 255) {
            errors.alamat = [
                'Alamat maksimal 255 karakter.'
            ];
        }

        if (
            wilayah &&
            (
                !/^\d+$/.test(wilayah) ||
                ![...field('lokasiWilayah').options]
                    .some(opt =>
                        opt.value.trim() === wilayah
                    )
            )
        ) {
            errors.wilayah = [
                'Pilih wilayah yang terdaftar.'
            ];
        }

        if (lat.error) {
            errors.lat = [lat.error];
        }

        if (lng.error) {
            errors.long = [lng.error];
        }

        if (lat.empty !== lng.empty) {
            if (lat.empty) {
                errors.lat = [
                    'Isi Latitude atau kosongkan kedua koordinat.'
                ];
            }

            if (lng.empty) {
                errors.long = [
                    'Isi Longitude atau kosongkan kedua koordinat.'
                ];
            }
        }

        const image =
            field('lokasiImage').files?.[0];

        if (
            image &&
            ![
                'image/jpeg',
                'image/png',
                'image/webp'
            ].includes(image.type)
        ) {
            errors.img = [
                'Gambar harus JPG, PNG, atau WEBP.'
            ];
        }

        if (
            image &&
            image.size > 4 * 1024 * 1024
        ) {
            errors.img = [
                'Gambar maksimal 4 MB.'
            ];
        }

        if (Object.keys(errors).length) {
            showErrors(
                errors,
                'Ada data yang belum valid. Periksa kolom yang ditandai.'
            );

            return null;
        }

        return {
            name,
            address,
            wilayah,
            lat: lat.value,
            lng: lng.value
        };
    }

    /* ======================================================
       REQUEST AJAX LARAVEL
    ====================================================== */

    async function apiRequest(url, options) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,

            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf(),
                ...(options?.headers || {})
            }
        });

        const raw = await response.text();

        let result = {};

        if (raw) {
            try {
                result = JSON.parse(raw);
            } catch {
                result = {};
            }
        }

        if (
            !response.ok ||
            result.success === false
        ) {
            let message =
                response.status === 419
                    ? 'Sesi berakhir (419). Muat ulang halaman dan login kembali.'
                    : response.status === 413
                        ? 'Ukuran gambar melebihi batas server (413).'
                        : response.status === 500
                            ? 'Terjadi kesalahan server (500). Periksa storage/logs/laravel.log.'
                            : result.message ||
                                `Permintaan gagal (HTTP ${response.status}).`;

            if (
                response.status === 422 &&
                result.errors
            ) {
                message = Object.values(
                    result.errors
                ).flat()[0] || message;
            }

            const error = new Error(message);

            error.validation = result.errors || null;
            error.status = response.status;

            throw error;
        }

        return result;
    }

    /* ======================================================
       CREATE / UPDATE / DELETE
    ====================================================== */

    async function save(event) {
        event.preventDefault();

        if (pending) return;

        clearErrors();

        if (mode === 'view') {
            closeModal();
            return;
        }

        let validated = null;

        if (mode !== 'delete') {
            validated = validate();

            if (!validated) return;
        }

        if (
            mode === 'delete' &&
            !window.confirm(
                `Hapus Lokasi "${String(currentRow?.dataset.lokasi || '').trim()}"?`
            )
        ) {
            return;
        }

        pending = true;
        loading(true);

        try {
            let response;

            if (mode === 'delete') {
                response = await apiRequest(
                    urlWithId(routes.destroy),
                    { method: 'DELETE' }
                );
            } else {
                const edit = mode === 'edit';

                const target = edit
                    ? urlWithId(routes.update)
                    : routes.store;

                if (!target) {
                    throw new Error(
                        'Route simpan Lokasi tidak tersedia.'
                    );
                }

                const formData = new FormData(form);

                // Nilai bersih, tanpa spasi berlebih.
                formData.set('lokasi', validated.name);
                formData.set('alamat', validated.address);
                formData.set('wilayah', validated.wilayah);
                formData.set('lat', validated.lat);
                formData.set('long', validated.lng);

                // Method spoofing multipart Laravel.
                if (edit) {
                    formData.set('_method', 'PUT');
                } else {
                    formData.delete('_method');
                }

                // Tidak mengirim file kosong.
                if (
                    !field('lokasiImage').files?.length
                ) {
                    formData.delete('img');
                }

                response = await apiRequest(target, {
                    method: 'POST',
                    body: formData
                });
            }

            showToast(
                'Berhasil',
                response.message ||
                (
                    mode === 'delete'
                        ? 'Lokasi berhasil dihapus.'
                        : mode === 'edit'
                            ? 'Lokasi berhasil diperbarui.'
                            : 'Lokasi berhasil ditambahkan.'
                )
            );

            closeModal();

            setTimeout(() => {
                window.location.reload();
            }, 550);

        } catch (error) {
            console.error(
                'Gagal memproses data Lokasi:',
                error
            );

            showErrors(
                error.validation || {},
                error.message
            );

            showToast(
                'Gagal',
                error.message,
                true
            );
        } finally {
            pending = false;
            loading(false);
        }
    }

    /* ======================================================
       UPLOAD IMAGE PREVIEW
    ====================================================== */

    function handleImageChange(event) {
        clearErrors();
        clearPreviewUrl();

        const image = event.target.files?.[0];

        if (!image) {
            setPreview(
                String(
                    currentRow?.dataset.imageUrl || ''
                ).trim()
            );

            return;
        }

        if (
            ![
                'image/jpeg',
                'image/png',
                'image/webp'
            ].includes(image.type) ||
            image.size > 4 * 1024 * 1024
        ) {
            showErrors(
                {
                    img: [
                        'Gambar harus JPG/PNG/WEBP dan maksimal 4 MB.'
                    ]
                },
                'Gambar tidak valid.'
            );

            event.target.value = '';

            setPreview(
                String(
                    currentRow?.dataset.imageUrl || ''
                ).trim()
            );

            return;
        }

        previewUrl = URL.createObjectURL(image);
        setPreview(previewUrl);
    }

    /* ======================================================
       RIWAYAT
    ====================================================== */

    function openHistory() {
        if (!history) return;

        oldOverflow =
            document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        if (!history.open) {
            history.showModal();
        }

        icons();
    }

    function closeHistory() {
        if (history?.open) {
            history.close();
        }
    }

    /* ======================================================
       EXPORT CSV
    ====================================================== */

    function csvCell(value) {
        let text = String(value ?? '');

        if (/^\s*[=+@-]/.test(text)) {
            text = "'" + text;
        }

        return '"' +
            text.replace(/"/g, '""') +
            '"';
    }

    function exportCSV() {
        const list = filteredRows();

        if (!list.length) {
            showToast(
                'Informasi',
                'Tidak ada data untuk diekspor.',
                true
            );

            return;
        }

        const data = [[
            'No',
            'Lokasi',
            'Alamat',
            'Wilayah',
            'Latitude',
            'Longitude',
            'Dibuat'
        ]];

        list.forEach((row, index) => {
            const date = String(
                row.dataset.createdAt || ''
            ).trim().slice(0, 10);

            data.push([
                index + 1,
                String(row.dataset.lokasi || '').trim(),
                String(row.dataset.alamat || '').trim(),
                String(row.dataset.wilayah || '').trim(),
                String(row.dataset.lat || '').trim(),
                String(row.dataset.long || '').trim(),
                date
            ]);
        });

        const csv = '\uFEFF' +
            data.map(row =>
                row.map(csvCell).join(';')
            ).join('\r\n');

        const blob = URL.createObjectURL(
            new Blob([csv], {
                type: 'text/csv;charset=utf-8'
            })
        );

        const link = document.createElement('a');

        link.href = blob;
        link.download =
            'data-lokasi-' +
            new Date().toISOString().slice(0, 10) +
            '.csv';

        document.body.append(link);

        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(blob);
        }, 1000);
    }

    /* ======================================================
       GRAFIK DISTRIBUSI
    ====================================================== */

    function initChart() {
        const canvas = field('lokasiDistributionChart');

        if (!canvas) return;

        const groups = $$('#lokasiLegend [data-count]');

        if (!groups.length) return;

        const labels = groups.map(node =>
            String(node.dataset.label || '').trim()
        );

        const data = groups.map(node =>
            Number(node.dataset.count) || 0
        );

        const colors = groups.map(node =>
            node.dataset.color
        );

        const total = data.reduce(
            (sum, value) => sum + value,
            0
        );

        const center = $(
            '.lokasi-chart-center strong',
            canvas.parentElement
        );

        if (center) {
            center.textContent =
                formatter.format(total);
        }

        chart?.destroy?.();

        const wrap = canvas.closest(
            '.lokasi-chart-wrap'
        );

        // Grafik tetap terlihat jika Chart.js gagal dimuat.
        if (typeof window.Chart !== 'function') {
            let angle = 0;

            const gradient = data.map((count, i) => {
                const from = angle;

                angle += total
                    ? count / total * 360
                    : 0;

                return `${colors[i]} ${from}deg ${angle}deg`;
            });

            canvas.hidden = true;

            wrap?.classList.add(
                'lokasi-chart-fallback'
            );

            if (wrap) {
                wrap.style.background = total
                    ? `conic-gradient(${gradient.join(',')})`
                    : '#e7ecf2';
            }

            return;
        }

        canvas.hidden = false;

        wrap?.classList.remove(
            'lokasi-chart-fallback'
        );

        if (wrap) {
            wrap.style.background = '';
        }

        chart = new window.Chart(canvas, {
            type: 'doughnut',

            data: {
                labels,

                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderColor: '#fff',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: context =>
                                `${context.label}: ` +
                                `${formatter.format(context.raw)} lokasi`
                        }
                    }
                }
            }
        });
    }

    /* ======================================================
       EVENT BINDING
    ====================================================== */

    function bind() {
        field('lokasiSearch')?.addEventListener(
            'input',
            () => {
                currentPage = 1;
                renderTable();
            }
        );

        field('lokasiWilayahFilter')?.addEventListener(
            'change',
            () => {
                currentPage = 1;
                renderTable();
            }
        );

        field('lokasiPageSize')?.addEventListener(
            'change',
            () => {
                currentPage = 1;
                renderTable();
            }
        );

        field('lokasiResetButton')?.addEventListener(
            'click',
            resetFilter
        );

        field('lokasiExportButton')?.addEventListener(
            'click',
            exportCSV
        );

        field('lokasiAddButton')?.addEventListener(
            'click',
            () => openModal('add')
        );

        field('lokasiHistoryTrigger')?.addEventListener(
            'click',
            openHistory
        );

        field('lokasiHistoryClose')?.addEventListener(
            'click',
            closeHistory
        );

        field('lokasiHistoryCloseBottom')?.addEventListener(
            'click',
            closeHistory
        );

        field('lokasiModalClose')?.addEventListener(
            'click',
            closeModal
        );

        field('lokasiCancelButton')?.addEventListener(
            'click',
            closeModal
        );

        field('lokasiViewAll')?.addEventListener(
            'click',
            () => {
                resetFilter();

                field('lokasiList')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        );

        field('lokasiTable')?.addEventListener(
            'click',
            event => {
                if (
                    !(event.target instanceof Element)
                ) {
                    return;
                }

                const button = event.target.closest(
                    '[data-action]'
                );

                const row = button?.closest(
                    'tr[data-record]'
                );

                if (button && row) {
                    openModal(
                        button.dataset.action,
                        row
                    );
                }
            }
        );

        form?.addEventListener(
            'submit',
            save
        );

        field('lokasiImage')?.addEventListener(
            'change',
            handleImageChange
        );

        field('lokasiLat')?.addEventListener(
            'input',
            mapLink
        );

        field('lokasiLong')?.addEventListener(
            'input',
            mapLink
        );

        modal?.addEventListener(
            'click',
            event => {
                if (event.target === modal) {
                    closeModal();
                }
            }
        );

        history?.addEventListener(
            'click',
            event => {
                if (event.target === history) {
                    closeHistory();
                }
            }
        );

        modal?.addEventListener('close', () => {
            document.body.style.overflow =
                oldOverflow;

            clearPreviewUrl();
        });

        history?.addEventListener('close', () => {
            document.body.style.overflow =
                oldOverflow;
        });
    }

    /* ======================================================
       INITIALIZATION
    ====================================================== */

    function init() {
        if (
            app.dataset.lokasiInitialized === '1'
        ) {
            return;
        }

        app.dataset.lokasiInitialized = '1';

        bind();
        updateClock();

        setInterval(updateClock, 1000);

        renderTable();
        initChart();
        icons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            init
        );
    } else {
        init();
    }

})();
