
/* ============================================================
   NILAI ASET — PERUMDA TIRTA KENCANA
   Full JavaScript: CRUD, form, filter, PDF, chart, modal.
   Tambah = POST; Edit = PUT; Gedung = K.I.B C.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
    const formatRupiah = value => 'Rp ' + numberFormat.format(Number(value) || 0);
    const refreshIcons = () => window.lucide?.createIcons?.();

    function formatCompact(value) {
        const n = Number(value) || 0;
        const a = Math.abs(n);
        const units = [
            [1_000_000_000_000, ' T'],
            [1_000_000_000, ' M'],
            [1_000_000, ' Jt']
        ];

        for (const [unit, suffix] of units) {
            if (a >= unit) {
                const scaled = n / unit;
                const truncated = (scaled < 0 ? Math.ceil(scaled * 100) : Math.floor(scaled * 100)) / 100;

                return 'Rp ' + truncated.toLocaleString('id-ID', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + suffix;
            }
        }

        return formatRupiah(n);
    }

    function formatDateIndonesia(value) {
        if (!value) return '-';

        const s = String(value).slice(0, 10);
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);

        return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
    }

    function setSelectValue(selector, value) {
        const element = $(selector);

        if (element) {
            element.value = value == null ? '' : String(value);
        }
    }

    function openDialog(dialog) {
        if (dialog && !dialog.open && typeof dialog.showModal === 'function') {
            dialog.showModal();
        }
    }

    function closeDialog(dialog) {
        if (dialog && dialog.open && typeof dialog.close === 'function') {
            dialog.close();
        }
    }

    // ========================================================
    // 1. MENUTUP MODAL
    // ========================================================

    $$('[data-close-dialog]').forEach(button => {
        button.addEventListener('click', () => {
            closeDialog($('#' + button.dataset.closeDialog));
        });
    });

    $$('dialog').forEach(dialog => {
        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                closeDialog(dialog);
            }
        });
    });

    // ========================================================
    // 2. FILTER DEPARTEMEN DAN DIVISI
    // ========================================================

    const departemenSelect = $('#nilaiDepartemen');
    const divisiSelect = $('#nilaiDivisi');

    function filterDivisiByDepartemen(preserveCurrent = false) {
        if (!departemenSelect || !divisiSelect) return;

        const departemen = String(departemenSelect.value || '');
        const previous = divisiSelect.value;

        Array.from(divisiSelect.options).forEach(option => {
            if (!option.value) {
                option.hidden = false;
                option.disabled = false;
                return;
            }

            const allowed =
                !departemen ||
                String(option.dataset.departemen || '') === departemen;

            option.hidden = !allowed;
            option.disabled = !allowed;
        });

        const oldOption = Array.from(divisiSelect.options)
            .find(option => option.value === previous);

        if (preserveCurrent && oldOption && !oldOption.disabled) {
            divisiSelect.value = previous;
        } else if (divisiSelect.selectedOptions[0]?.disabled) {
            divisiSelect.value = '';
        }
    }

    departemenSelect?.addEventListener('change', () => {
        filterDivisiByDepartemen(false);
    });

    filterDivisiByDepartemen(true);

    // ========================================================
    // 3. FILTER KODE AKTIVA — GEDUNG DAN BANGUNAN
    // ========================================================
    //
    // Membutuhkan data-kib pada option nilaiAktiva:
    //
    // data-kib="{{ $item->kib }}"
    //
    // Golongan lain tidak difilter oleh fungsi ini.
    // Validasi kesesuaian tetap dilakukan Controller.
    // ========================================================

    const golonganForm = $('#nilaiGolongan');
    const aktivaForm = $('#nilaiAktiva');

    function normalizeKib(value) {
        return String(value || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function filterAktivaGedung() {
        if (!golonganForm || !aktivaForm) return;

        const golongan = normalizeKib(
            golonganForm.selectedOptions[0]?.textContent
        );

        const isGedung =
            golongan.includes('GEDUNG') &&
            golongan.includes('BANGUNAN');

        for (const option of aktivaForm.options) {
            if (!option.value) continue;

            const kib = normalizeKib(option.dataset.kib);

            const match =
                /(?:^| )KIB C(?: |$)/.test(kib) ||
                (
                    kib.includes('GEDUNG') &&
                    kib.includes('BANGUNAN')
                );

            const allowed = !isGedung || match;

            option.disabled = !allowed;
            option.hidden = !allowed;
        }

        // Kosongkan Kode Aktiva apabila kode sebelumnya
        // tidak sesuai dengan golongan yang baru dipilih.
        if (aktivaForm.selectedOptions[0]?.disabled) {
            aktivaForm.value = '';
        }
    }

    golonganForm?.addEventListener(
        'change',
        filterAktivaGedung
    );

    filterAktivaGedung();

    // ========================================================
    // 4. FORM TAMBAH DAN EDIT NILAI ASET
    // ========================================================

    const formModal = $('#nilaiFormModal');
    const form = $('#nilaiForm');
    const method = $('#nilaiFormMethod');
    const formTitle = $('#nilaiFormTitle');
    const storeUrl = form?.action || '';

    const existingPdf = $('#nilaiExistingPdf');
    const existingPdfName = $('#nilaiExistingPdfName');
    const existingPdfButton = $('#nilaiExistingPdfButton');

    let existingPdfPreviewUrl = null;
    let existingPdfDownloadUrl = null;

    function resetNilaiForm() {
        if (!form) return;

        form.reset();
        form.action = storeUrl;

        // Tambah: gunakan POST murni.
        // _method tidak boleh ikut dikirim.
        if (method) {
            method.value = 'PUT';
            method.disabled = true;
        }

        if (formTitle) {
            formTitle.textContent = 'Tambah Nilai Aset';
        }

        const tahun = $('#nilaiTahun');
        const currentYear = String(new Date().getFullYear());

        if (
            tahun &&
            Array.from(tahun.options).some(
                option => option.value === currentYear
            )
        ) {
            tahun.value = currentYear;
        }

        existingPdfPreviewUrl = null;
        existingPdfDownloadUrl = null;

        if (existingPdf) {
            existingPdf.hidden = true;
        }

        clearLocalPdfPreview();
        filterDivisiByDepartemen(false);
        filterAktivaGedung();
    }

    // ========================================================
    // 5. TOMBOL TAMBAH NILAI ASET
    // ========================================================

    $('#nilaiAddButton')?.addEventListener('click', () => {
        resetNilaiForm();
        openDialog(formModal);
        refreshIcons();
    });

    // ========================================================
    // 6. MENGAMBIL DETAIL DATA DARI CONTROLLER
    // ========================================================

    async function fetchDetail(path) {
        const response = await fetch(path, {
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const body = await response.json();

        if (!body.data) {
            throw new Error(
                'Data tidak ditemukan dalam respons.'
            );
        }

        return body.data;
    }

    // ========================================================
    // 7. EDIT NILAI ASET
    // ========================================================

    $$('.js-edit').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                const data = await fetchDetail(
                    button.dataset.url
                );

                resetNilaiForm();

                form.action = button.dataset.updateUrl;

                // Edit: POST dengan _method=PUT.
                method.value = 'PUT';
                method.disabled = false;

                formTitle.textContent = 'Edit Nilai Aset';

                $('#nilaiNoVoucher').value =
                    data.no_voucher || '';

                $('#nilaiTanggal').value =
                    String(data.tgl_voucher || '').slice(0, 10);

                // Golongan ditentukan terlebih dahulu.
                setSelectValue(
                    '#nilaiGolongan',
                    data.cat
                );

                // Lalu filter Kode Aktiva.
                filterAktivaGedung();

                setSelectValue(
                    '#nilaiAktiva',
                    data.id_aktiva
                );

                setSelectValue(
                    '#nilaiLokasi',
                    data.id_lokasi
                );

                setSelectValue(
                    '#nilaiDepartemen',
                    data.dep
                );

                filterDivisiByDepartemen(false);

                setSelectValue(
                    '#nilaiDivisi',
                    data.div
                );

                setSelectValue(
                    '#nilaiTahun',
                    data.tahun
                );

                setSelectValue(
                    '#nilaiJenis',
                    data.jenisn
                );

                $('#nilaiNominal').value =
                    data.nilai ?? 0;

                $('#nilaiUraian').value =
                    data.urai || '';

                existingPdfPreviewUrl =
                    data.pdf_preview_url || null;

                existingPdfDownloadUrl =
                    data.pdf_download_url || null;

                if (existingPdf) {
                    existingPdf.hidden =
                        !existingPdfPreviewUrl;
                }

                if (existingPdfName) {
                    existingPdfName.textContent =
                        data.dokumen_pdf_nama_asli ||
                        'Dokumen PDF';
                }

                openDialog(formModal);
                refreshIcons();

            } catch (error) {
                console.error('EDIT NILAI:', error);

                alert(
                    'Data Nilai Aset tidak dapat dimuat.'
                );
            }
        });
    });

    // PDF lama pada saat Edit.
    existingPdfButton?.addEventListener('click', () => {
        if (existingPdfPreviewUrl) {
            openPdfModal(
                existingPdfPreviewUrl,
                existingPdfDownloadUrl,
                existingPdfName?.textContent || 'Dokumen PDF'
            );
        }
    });

    // ========================================================
    // 8. MODAL DETAIL NILAI ASET
    // ========================================================

    const detailModal = $('#nilaiDetailModal');
    const detailPdfButton = $('#detailPdfButton');

    let detailPdfPreviewUrl = null;
    let detailPdfDownloadUrl = null;

    $$('.js-view').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                const data = await fetchDetail(
                    button.dataset.url
                );

                const fields = {
                    detailVoucher:
                        data.no_voucher || '-',

                    detailTanggal:
                        formatDateIndonesia(
                            data.tgl_voucher
                        ),

                    detailAktiva:
                        [
                            data.aktiva_kode,
                            data.aktiva_nama
                        ]
                            .filter(Boolean)
                            .join(' | ') || '-',

                    detailTahun:
                        data.tahun || '-',

                    detailLokasi:
                        data.lokasi_nama || '-',

                    detailDepartemen:
                        data.departemen_nama || '-',

                    detailDivisi:
                        data.divisi_nama || '-',

                    detailGolongan:
                        data.golongan_nama || '-',

                    detailJenis:
                        data.jenis_nama || '-',

                    detailNilai:
                        formatRupiah(data.nilai),

                    detailUraian:
                        data.urai || '-'
                };

                for (const [id, value] of Object.entries(fields)) {
                    const element = $('#' + id);

                    if (element) {
                        element.textContent = value;
                    }
                }

                detailPdfPreviewUrl =
                    data.pdf_preview_url || null;

                detailPdfDownloadUrl =
                    data.pdf_download_url || null;

                if (detailPdfButton) {
                    detailPdfButton.hidden =
                        !detailPdfPreviewUrl;
                }

                openDialog(detailModal);
                refreshIcons();

            } catch (error) {
                console.error('DETAIL NILAI:', error);

                alert(
                    'Detail Nilai Aset tidak dapat dimuat.'
                );
            }
        });
    });

    // PDF dari modal Detail.
    detailPdfButton?.addEventListener('click', () => {
        if (detailPdfPreviewUrl) {
            openPdfModal(
                detailPdfPreviewUrl,
                detailPdfDownloadUrl,
                'Dokumen Nilai Aset'
            );
        }
    });

    // ========================================================
    // 9. HAPUS NILAI ASET
    // ========================================================

    const deleteModal = $('#nilaiDeleteModal');
    const deleteForm = $('#nilaiDeleteForm');
    const deleteName = $('#nilaiDeleteName');

    $$('.js-delete').forEach(button => {
        button.addEventListener('click', () => {
            if (!deleteModal || !deleteForm) return;

            deleteForm.action =
                button.dataset.deleteUrl;

            if (deleteName) {
                deleteName.textContent =
                    button.dataset.name || 'data ini';
            }

            openDialog(deleteModal);
            refreshIcons();
        });
    });

    // ========================================================
    // 10. PREVIEW DAN DOWNLOAD PDF SERVER
    // ========================================================

    const pdfModal = $('#nilaiPdfModal');
    const pdfFrame = $('#nilaiPdfFrame');
    const pdfTitle = $('#nilaiPdfTitle');
    const pdfDownload = $('#nilaiPdfDownload');

    function openPdfModal(previewUrl, downloadUrl, title) {
        if (!previewUrl || !pdfModal) return;

        if (pdfFrame) {
            pdfFrame.src = previewUrl;
        }

        if (pdfDownload) {
            pdfDownload.href =
                downloadUrl || previewUrl;
        }

        if (pdfTitle) {
            pdfTitle.textContent =
                title || 'Preview PDF';
        }

        openDialog(pdfModal);
        refreshIcons();
    }

    // Tombol PDF pada tabel Nilai Aset.
    $$('.js-pdf-button').forEach(button => {
        button.addEventListener('click', () => {
            openPdfModal(
                button.dataset.previewUrl,
                button.dataset.downloadUrl,
                button.dataset.pdfName
            );
        });
    });

    // Bersihkan iframe ketika modal PDF ditutup.
    pdfModal?.addEventListener('close', () => {
        if (pdfFrame) {
            pdfFrame.src = 'about:blank';
        }
    });

    // ========================================================
    // 11. PREVIEW PDF LOKAL SEBELUM UPLOAD
    // ========================================================

    const pdfInput = $('#nilaiPdfInput');
    const localPdfPreview = $('#nilaiLocalPdfPreview');
    const localPdfFrame = $('#nilaiLocalPdfFrame');
    const localPdfName = $('#nilaiLocalPdfName');

    let localPdfUrl = null;

    function clearLocalPdfPreview() {
        if (localPdfUrl) {
            URL.revokeObjectURL(localPdfUrl);
            localPdfUrl = null;
        }

        if (localPdfPreview) {
            localPdfPreview.hidden = true;
        }

        if (localPdfFrame) {
            localPdfFrame.src = 'about:blank';
        }

        if (localPdfName) {
            localPdfName.textContent = '';
        }
    }

    pdfInput?.addEventListener('change', () => {
        clearLocalPdfPreview();

        const file = pdfInput.files?.[0];

        if (!file) return;

        const isPdf =
            file.type === 'application/pdf' ||
            file.name.toLowerCase().endsWith('.pdf');

        if (!isPdf) {
            alert(
                'File harus berformat PDF.'
            );

            pdfInput.value = '';
            return;
        }

        const maxSize = 15 * 1024 * 1024;

        if (file.size > maxSize) {
            alert(
                'Ukuran PDF maksimal 15 MB.'
            );

            pdfInput.value = '';
            return;
        }

        localPdfUrl = URL.createObjectURL(file);

        if (localPdfFrame) {
            localPdfFrame.src = localPdfUrl;
        }

        if (localPdfName) {
            localPdfName.textContent = file.name;
        }

        if (localPdfPreview) {
            localPdfPreview.hidden = false;
        }
    });

    // ========================================================
    // 12. VALIDASI ERROR LARAVEL
    // ========================================================

    const pageRoot = $('#nilaiPage');

    if (
        pageRoot?.dataset.validationErrors === '1'
    ) {
        // Jangan reset input ketika validasi gagal.
        // Data lama dari old() Blade tetap ditampilkan.
        filterDivisiByDepartemen(true);
        filterAktivaGedung();

        openDialog(formModal);
    }

    // ========================================================
    // 13. MEMBACA DATA GRAFIK DARI BLADE
    // ========================================================

    let chartData = {
        trendLabels: [],
        trendValues: [],
        categoryLabels: [],
        categoryValues: []
    };

    const chartJson = $('#nilaiChartData');

    if (chartJson) {
        try {
            chartData = JSON.parse(
                chartJson.textContent
            );
        } catch (error) {
            console.error(
                'Chart JSON error:',
                error
            );
        }
    }

    // ========================================================
    // 14. GRAFIK TREND NILAI ASET (CANVAS)
    // ========================================================

    const trendCanvas = $('#nilaiTrendCanvas');

    function drawTrendChart() {
        if (
            !trendCanvas ||
            !trendCanvas.parentElement
        ) {
            return;
        }

        const parent = trendCanvas.parentElement;

        const width = Math.max(
            parent.clientWidth,
            320
        );

        const height = Math.max(
            parent.clientHeight,
            190
        );

        const dpr = window.devicePixelRatio || 1;

        trendCanvas.width = Math.round(
            width * dpr
        );

        trendCanvas.height = Math.round(
            height * dpr
        );

        trendCanvas.style.width = width + 'px';
        trendCanvas.style.height = height + 'px';

        const ctx = trendCanvas.getContext('2d');

        if (!ctx) return;

        ctx.setTransform(
            dpr, 0, 0, dpr, 0, 0
        );

        ctx.clearRect(
            0, 0, width, height
        );

        const labels =
            chartData.trendLabels || [];

        const values =
            (chartData.trendValues || [])
                .map(Number);

        if (!labels.length) return;

        const padding = {
            left: 62,
            right: 22,
            top: 22,
            bottom: 34
        };

        const gw = Math.max(
            1,
            width - padding.left - padding.right
        );

        const gh = Math.max(
            1,
            height - padding.top - padding.bottom
        );

        const maximum = Math.max(
            ...values,
            1
        );

        ctx.font = '11px Arial, sans-serif';
        ctx.lineWidth = 1;

        // Garis grid horizontal dan label nilai.
        for (let i = 0; i <= 4; i++) {
            const y =
                padding.top + gh * i / 4;

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);

            ctx.strokeStyle = '#e1ebf4';
            ctx.stroke();

            ctx.fillStyle = '#70839d';
            ctx.textAlign = 'left';

            ctx.fillText(
                formatCompact(
                    maximum - maximum * i / 4
                ).replace('Rp ', ''),
                4,
                y + 4
            );
        }

        const points = values.map((value, i) => ({
            x:
                labels.length === 1
                    ? padding.left
                    : padding.left +
                      gw * i / (labels.length - 1),

            y:
                padding.top +
                gh -
                value / maximum * gh,

            value
        }));

        // Gradasi area grafik.
        const gradient = ctx.createLinearGradient(
            0,
            padding.top,
            0,
            height - padding.bottom
        );

        gradient.addColorStop(
            0,
            'rgba(8,106,216,.24)'
        );

        gradient.addColorStop(
            1,
            'rgba(8,106,216,.015)'
        );

        ctx.beginPath();

        ctx.moveTo(
            points[0].x,
            height - padding.bottom
        );

        points.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });

        ctx.lineTo(
            points[points.length - 1].x,
            height - padding.bottom
        );

        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Garis tren.
        ctx.beginPath();

        points.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });

        ctx.strokeStyle = '#086ad8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Titik dan label tahun.
        points.forEach((point, i) => {
            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = '#086ad8';
            ctx.fill();

            ctx.fillStyle = '#556e8b';
            ctx.textAlign = 'center';

            ctx.fillText(
                labels[i],
                point.x,
                height - 8
            );
        });
    }

    // ========================================================
    // 15. GRAFIK DONUT DAN LEGENDA
    // ========================================================

    const donutCanvas = $('#nilaiDonutCanvas');
    const donutLegend = $('#nilaiDonutLegend');

    const donutColors = [
        '#3489ef',
        '#ffb42c',
        '#36bd82',
        '#eb5c68',
        '#8d68e8',
        '#5bc3e6',
        '#7190af',
        '#16a5a5'
    ];

    function drawDonutChart() {
        if (
            !donutCanvas ||
            !donutCanvas.parentElement
        ) {
            return;
        }

        const parent = donutCanvas.parentElement;

        const size =
            Math.min(
                parent.clientWidth,
                parent.clientHeight
            ) || 165;

        const dpr = window.devicePixelRatio || 1;

        donutCanvas.width = Math.round(
            size * dpr
        );

        donutCanvas.height = Math.round(
            size * dpr
        );

        donutCanvas.style.width = size + 'px';
        donutCanvas.style.height = size + 'px';

        const ctx = donutCanvas.getContext('2d');

        if (!ctx) return;

        ctx.setTransform(
            dpr, 0, 0, dpr, 0, 0
        );

        ctx.clearRect(
            0, 0, size, size
        );

        const labels =
            chartData.categoryLabels || [];

        const values =
            (chartData.categoryValues || [])
                .map(Number);

        const total = values.reduce(
            (sum, n) => sum + n,
            0
        );

        const center = size / 2;
        const radius = size * 0.39;
        const thickness = size * 0.18;

        // Jika tidak ada data.
        if (total <= 0) {
            ctx.beginPath();

            ctx.arc(
                center,
                center,
                radius,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle = '#e7edf4';
            ctx.lineWidth = thickness;
            ctx.stroke();

            if (donutLegend) {
                donutLegend.replaceChildren();
            }

            return;
        }

        let start = -Math.PI / 2;

        // Menggambar setiap segmen.
        values.forEach((value, i) => {
            const angle =
                value / total * Math.PI * 2;

            ctx.beginPath();

            ctx.arc(
                center,
                center,
                radius,
                start,
                start + angle
            );

            ctx.strokeStyle =
                donutColors[
                    i % donutColors.length
                ];

            ctx.lineWidth = thickness;
            ctx.stroke();

            start += angle;
        });

        // Menampilkan legenda dan persentase.
        if (donutLegend) {
            donutLegend.replaceChildren();

            labels.forEach((label, i) => {
                const row =
                    document.createElement('div');

                row.className = 'nilai-legend-item';

                const dot =
                    document.createElement('span');

                dot.className = 'nilai-legend-dot';

                dot.style.background =
                    donutColors[
                        i % donutColors.length
                    ];

                const name =
                    document.createElement('span');

                name.textContent = label;

                const percentage =
                    document.createElement('strong');

                percentage.textContent =
                    (
                        100 *
                        (values[i] || 0) /
                        total
                    ).toLocaleString(
                        'id-ID',
                        {
                            maximumFractionDigits: 1
                        }
                    ) + '%';

                row.append(
                    dot,
                    name,
                    percentage
                );

                donutLegend.appendChild(row);
            });
        }
    }

    // ========================================================
    // 16. RESPONSIVE GRAFIK
    // ========================================================

    let resizeTimer = null;

    function redrawCharts() {
        drawTrendChart();
        drawDonutChart();
    }

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(
            redrawCharts,
            120
        );
    });

    // ========================================================
    // 17. INITIALISASI
    // ========================================================

    redrawCharts();
    refreshIcons();
});
