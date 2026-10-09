document.addEventListener(
    'DOMContentLoaded',
    function () {

        'use strict';


        /* =====================================================
           HELPERS
        ====================================================== */

        const $ = (
            selector,
            root = document
        ) => root.querySelector(
            selector
        );


        const $$ = (
            selector,
            root = document
        ) => Array.from(
            root.querySelectorAll(
                selector
            )
        );


        function formatRupiah(value)
        {
            const number =
                Number(value) || 0;

            return (
                'Rp ' +
                new Intl.NumberFormat(
                    'id-ID',
                    {
                        maximumFractionDigits: 0,
                    }
                ).format(number)
            );
        }


        function formatCompact(value)
        {
            const number =
                Number(value) || 0;

            const absolute =
                Math.abs(number);


            function truncate(
                input,
                precision = 2
            ) {
                const factor =
                    Math.pow(
                        10,
                        precision
                    );

                return input >= 0

                    ? Math.floor(
                        input *
                        factor
                    )
                    /
                    factor

                    : Math.ceil(
                        input *
                        factor
                    )
                    /
                    factor;
            }


            if (
                absolute >=
                1_000_000_000_000
            ) {

                const result =
                    truncate(
                        number /
                        1_000_000_000_000
                    );

                return (
                    'Rp ' +
                    result.toLocaleString(
                        'id-ID',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )
                    +
                    ' T'
                );
            }


            if (
                absolute >=
                1_000_000_000
            ) {

                const result =
                    truncate(
                        number /
                        1_000_000_000
                    );

                return (
                    'Rp ' +
                    result.toLocaleString(
                        'id-ID',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )
                    +
                    ' M'
                );
            }


            if (
                absolute >=
                1_000_000
            ) {

                const result =
                    truncate(
                        number /
                        1_000_000
                    );

                return (
                    'Rp ' +
                    result.toLocaleString(
                        'id-ID',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )
                    +
                    ' Jt'
                );
            }


            return formatRupiah(
                number
            );
        }


        function openDialog(dialog)
        {
            if (!dialog) {
                return;
            }

            if (
                typeof dialog.showModal
                === 'function'
                &&
                !dialog.open
            ) {
                dialog.showModal();
            }
        }


        function closeDialog(dialog)
        {
            if (!dialog) {
                return;
            }

            if (
                typeof dialog.close
                === 'function'
                &&
                dialog.open
            ) {
                dialog.close();
            }
        }


        function setSelectValue(
            selector,
            value
        ) {
            const select =
                $(selector);

            if (!select) {
                return;
            }

            select.value =
                value === null
                ||
                typeof value
                    === 'undefined'

                    ? ''

                    : String(value);
        }


        function refreshIcons()
        {
            if (
                window.lucide
                &&
                typeof window.lucide
                    .createIcons
                    === 'function'
            ) {
                window.lucide
                    .createIcons();
            }
        }


        /* =====================================================
           DIALOG CLOSE
        ====================================================== */

        $$(
            '[data-close-dialog]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    function () {

                        const dialogId =
                            button.dataset
                                .closeDialog;

                        closeDialog(
                            document
                                .getElementById(
                                    dialogId
                                )
                        );
                    }
                );

            }
        );


        /*
        |--------------------------------------------------------------------------
        | ESCAPE akan otomatis ditangani <dialog>.
        | Klik backdrop kita tangani manual.
        |--------------------------------------------------------------------------
        */

        $$('dialog')
            .forEach(
                dialog => {

                    dialog.addEventListener(
                        'click',
                        function (event) {

                            if (
                                event.target
                                !== dialog
                            ) {
                                return;
                            }

                            closeDialog(
                                dialog
                            );
                        }
                    );

                }
            );


        /* =====================================================
           DEPARTEMEN -> DIVISI
        ====================================================== */

        const departemenSelect =
            $('#nilaiDepartemen');

        const divisiSelect =
            $('#nilaiDivisi');


        function filterDivisiByDepartemen(
            preserveCurrent = false
        ) {
            if (
                !departemenSelect
                ||
                !divisiSelect
            ) {
                return;
            }


            const departemenId =
                String(
                    departemenSelect
                        .value
                    || ''
                );


            const previousValue =
                divisiSelect.value;


            Array.from(
                divisiSelect.options
            ).forEach(
                option => {

                    if (
                        !option.value
                    ) {

                        option.hidden =
                            false;

                        option.disabled =
                            false;

                        return;
                    }


                    const optionDepartment =
                        String(
                            option.dataset
                                .departemen
                            || ''
                        );


                    const allowed =
                        !departemenId
                        ||
                        optionDepartment
                        === departemenId;


                    option.hidden =
                        !allowed;

                    option.disabled =
                        !allowed;
                }
            );


            if (
                preserveCurrent
                &&
                previousValue
            ) {

                const oldOption =
                    Array.from(
                        divisiSelect.options
                    )
                    .find(
                        option =>
                            option.value
                            ===
                            previousValue
                    );


                if (
                    oldOption
                    &&
                    !oldOption.disabled
                ) {

                    divisiSelect.value =
                        previousValue;

                    return;
                }
            }


            const selectedOption =
                divisiSelect
                    .selectedOptions[0];


            if (
                selectedOption
                &&
                selectedOption.disabled
            ) {
                divisiSelect.value =
                    '';
            }
        }


        if (
            departemenSelect
            &&
            divisiSelect
        ) {

            departemenSelect
                .addEventListener(
                    'change',
                    function () {

                        filterDivisiByDepartemen(
                            false
                        );
                    }
                );


            filterDivisiByDepartemen(
                true
            );
        }


        /* =====================================================
           FORM CREATE / EDIT
        ====================================================== */

        const formModal =
            $('#nilaiFormModal');

        const nilaiForm =
            $('#nilaiForm');

        const nilaiFormMethod =
            $('#nilaiFormMethod');

        const nilaiFormTitle =
            $('#nilaiFormTitle');

        const addButton =
            $('#nilaiAddButton');


        const storeUrl =
            nilaiForm
                ? nilaiForm.action
                : '';


        const existingPdf =
            $('#nilaiExistingPdf');

        const existingPdfName =
            $('#nilaiExistingPdfName');

        const existingPdfButton =
            $('#nilaiExistingPdfButton');


        let existingPdfPreviewUrl =
            null;

        let existingPdfDownloadUrl =
            null;


        function resetNilaiForm()
        {
            if (!nilaiForm) {
                return;
            }


            nilaiForm.reset();

            nilaiForm.action =
                storeUrl;


            if (
                nilaiFormMethod
            ) {
                nilaiFormMethod.value =
                    '';
            }


            if (
                nilaiFormTitle
            ) {
                nilaiFormTitle
                    .textContent =
                    'Tambah Nilai Aset';
            }


            const yearSelect =
                $('#nilaiTahun');


            if (yearSelect) {

                const currentYear =
                    String(
                        new Date()
                            .getFullYear()
                    );

                if (
                    Array.from(
                        yearSelect.options
                    )
                    .some(
                        option =>
                            option.value
                            ===
                            currentYear
                    )
                ) {
                    yearSelect.value =
                        currentYear;
                }
            }


            existingPdfPreviewUrl =
                null;

            existingPdfDownloadUrl =
                null;


            if (
                existingPdf
            ) {
                existingPdf.hidden =
                    true;
            }


            clearLocalPdfPreview();


            filterDivisiByDepartemen(
                false
            );
        }


        if (addButton) {

            addButton.addEventListener(
                'click',
                function () {

                    resetNilaiForm();

                    openDialog(
                        formModal
                    );

                    refreshIcons();
                }
            );
        }


        /* =====================================================
           EDIT
        ====================================================== */

        $$('.js-edit')
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        async function () {

                            try {

                                const response =
                                    await fetch(
                                        button.dataset
                                            .url,
                                        {
                                            headers: {
                                                'Accept':
                                                    'application/json',
                                            },
                                        }
                                    );


                                if (
                                    !response.ok
                                ) {

                                    throw new Error(
                                        'HTTP ' +
                                        response.status
                                    );
                                }


                                const result =
                                    await response
                                        .json();


                                const data =
                                    result.data;


                                resetNilaiForm();


                                nilaiForm.action =
                                    button.dataset
                                        .updateUrl;


                                nilaiFormMethod.value =
                                    'PUT';


                                nilaiFormTitle
                                    .textContent =
                                    'Edit Nilai Aset';


                                $('#nilaiNoVoucher')
                                    .value =
                                    data.no_voucher
                                    || '';


                                $('#nilaiTanggal')
                                    .value =
                                    data.tgl_voucher
                                    || '';


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


                                /*
                                | Setelah Departemen dipilih,
                                | tampilkan Divisi miliknya.
                                */

                                filterDivisiByDepartemen(
                                    false
                                );


                                setSelectValue(
                                    '#nilaiDivisi',
                                    data.div
                                );


                                setSelectValue(
                                    '#nilaiGolongan',
                                    data.cat
                                );


                                setSelectValue(
                                    '#nilaiTahun',
                                    data.tahun
                                );


                                setSelectValue(
                                    '#nilaiJenis',
                                    data.jenisn
                                );


                                $('#nilaiNominal')
                                    .value =
                                    data.nilai
                                    ?? 0;


                                $('#nilaiUraian')
                                    .value =
                                    data.urai
                                    || '';


                                existingPdfPreviewUrl =
                                    data
                                        .pdf_preview_url;


                                existingPdfDownloadUrl =
                                    data
                                        .pdf_download_url;


                                if (
                                    data
                                        .pdf_preview_url
                                    &&
                                    existingPdf
                                ) {

                                    existingPdf.hidden =
                                        false;


                                    existingPdfName
                                        .textContent =
                                        data
                                            .dokumen_pdf_nama_asli
                                        ||
                                        'Dokumen PDF';
                                }


                                openDialog(
                                    formModal
                                );


                                refreshIcons();

                            } catch (error) {

                                console.error(
                                    'EDIT NILAI:',
                                    error
                                );


                                alert(
                                    'Data Nilai Aset tidak dapat dimuat.'
                                );
                            }
                        }
                    );

                }
            );


        if (
            existingPdfButton
        ) {

            existingPdfButton
                .addEventListener(
                    'click',
                    function () {

                        if (
                            !existingPdfPreviewUrl
                        ) {
                            return;
                        }


                        openPdfModal(
                            existingPdfPreviewUrl,
                            existingPdfDownloadUrl,
                            existingPdfName
                                .textContent
                        );
                    }
                );
        }


        /* =====================================================
           VIEW DETAIL
        ====================================================== */

        const detailModal =
            $('#nilaiDetailModal');

        const detailPdfButton =
            $('#detailPdfButton');


        let detailPdfPreviewUrl =
            null;

        let detailPdfDownloadUrl =
            null;


        $$('.js-view')
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        async function () {

                            try {

                                const response =
                                    await fetch(
                                        button.dataset
                                            .url,
                                        {
                                            headers: {
                                                'Accept':
                                                    'application/json',
                                            },
                                        }
                                    );


                                if (
                                    !response.ok
                                ) {

                                    throw new Error(
                                        'HTTP ' +
                                        response.status
                                    );
                                }


                                const result =
                                    await response
                                        .json();


                                const data =
                                    result.data;


                                $('#detailVoucher')
                                    .textContent =
                                    data.no_voucher
                                    || '-';


                                $('#detailTanggal')
                                    .textContent =
                                    formatDateIndonesia(
                                        data.tgl_voucher
                                    );


                                $('#detailAktiva')
                                    .textContent =
                                    [
                                        data.aktiva_kode,
                                        data.aktiva_nama,
                                    ]
                                    .filter(Boolean)
                                    .join(' | ')
                                    ||
                                    '-';


                                $('#detailTahun')
                                    .textContent =
                                    data.tahun
                                    || '-';


                                $('#detailLokasi')
                                    .textContent =
                                    data.lokasi_nama
                                    || '-';


                                $('#detailDepartemen')
                                    .textContent =
                                    data.departemen_nama
                                    || '-';


                                $('#detailDivisi')
                                    .textContent =
                                    data.divisi_nama
                                    || '-';


                                $('#detailGolongan')
                                    .textContent =
                                    data.golongan_nama
                                    || '-';


                                $('#detailJenis')
                                    .textContent =
                                    data.jenis_nama
                                    || '-';


                                $('#detailNilai')
                                    .textContent =
                                    formatRupiah(
                                        data.nilai
                                    );


                                $('#detailUraian')
                                    .textContent =
                                    data.urai
                                    || '-';


                                detailPdfPreviewUrl =
                                    data
                                        .pdf_preview_url;


                                detailPdfDownloadUrl =
                                    data
                                        .pdf_download_url;


                                if (
                                    detailPdfButton
                                ) {

                                    detailPdfButton.hidden =
                                        !detailPdfPreviewUrl;
                                }


                                openDialog(
                                    detailModal
                                );


                                refreshIcons();

                            } catch (error) {

                                console.error(
                                    'DETAIL NILAI:',
                                    error
                                );


                                alert(
                                    'Detail Nilai Aset tidak dapat dimuat.'
                                );
                            }
                        }
                    );

                }
            );


        function formatDateIndonesia(
            dateValue
        ) {
            if (!dateValue) {
                return '-';
            }


            const parts =
                String(dateValue)
                    .substring(
                        0,
                        10
                    )
                    .split('-');


            if (
                parts.length
                !== 3
            ) {
                return dateValue;
            }


            return (
                parts[2]
                +
                '/'
                +
                parts[1]
                +
                '/'
                +
                parts[0]
            );
        }


        if (
            detailPdfButton
        ) {

            detailPdfButton
                .addEventListener(
                    'click',
                    function () {

                        if (
                            !detailPdfPreviewUrl
                        ) {
                            return;
                        }


                        openPdfModal(
                            detailPdfPreviewUrl,
                            detailPdfDownloadUrl,
                            'Dokumen Nilai Aset'
                        );
                    }
                );
        }


        /* =====================================================
           DELETE
        ====================================================== */

        const deleteModal =
            $('#nilaiDeleteModal');

        const deleteForm =
            $('#nilaiDeleteForm');

        const deleteName =
            $('#nilaiDeleteName');


        $$('.js-delete')
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        function () {

                            if (
                                !deleteForm
                                ||
                                !deleteModal
                            ) {
                                return;
                            }


                            deleteForm.action =
                                button.dataset
                                    .deleteUrl;


                            if (
                                deleteName
                            ) {

                                deleteName
                                    .textContent =
                                    button.dataset
                                        .name
                                    ||
                                    'data ini';
                            }


                            openDialog(
                                deleteModal
                            );


                            refreshIcons();
                        }
                    );

                }
            );


        /* =====================================================
           PDF SERVER
        ====================================================== */

        const pdfModal =
            $('#nilaiPdfModal');

        const pdfFrame =
            $('#nilaiPdfFrame');

        const pdfTitle =
            $('#nilaiPdfTitle');

        const pdfDownload =
            $('#nilaiPdfDownload');


        function openPdfModal(
            previewUrl,
            downloadUrl,
            title
        ) {
            if (
                !previewUrl
                ||
                !pdfModal
            ) {
                return;
            }


            pdfFrame.src =
                previewUrl;


            pdfDownload.href =
                downloadUrl
                ||
                previewUrl;


            pdfTitle.textContent =
                title
                ||
                'Preview PDF';


            openDialog(
                pdfModal
            );


            refreshIcons();
        }


        $$('.js-pdf-button')
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        function () {

                            openPdfModal(
                                button.dataset
                                    .previewUrl,

                                button.dataset
                                    .downloadUrl,

                                button.dataset
                                    .pdfName
                            );
                        }
                    );

                }
            );


        if (pdfModal) {

            pdfModal.addEventListener(
                'close',
                function () {

                    if (
                        pdfFrame
                    ) {
                        pdfFrame.src =
                            'about:blank';
                    }
                }
            );
        }


        /* =====================================================
           LOCAL PDF PREVIEW
        ====================================================== */

        const pdfInput =
            $('#nilaiPdfInput');

        const localPdfPreview =
            $('#nilaiLocalPdfPreview');

        const localPdfFrame =
            $('#nilaiLocalPdfFrame');

        const localPdfName =
            $('#nilaiLocalPdfName');


        let localPdfUrl =
            null;


        function clearLocalPdfPreview()
        {
            if (
                localPdfUrl
            ) {

                URL.revokeObjectURL(
                    localPdfUrl
                );

                localPdfUrl =
                    null;
            }


            if (
                localPdfPreview
            ) {
                localPdfPreview.hidden =
                    true;
            }


            if (
                localPdfFrame
            ) {
                localPdfFrame.src =
                    'about:blank';
            }


            if (
                localPdfName
            ) {
                localPdfName
                    .textContent =
                    '';
            }
        }


        if (pdfInput) {

            pdfInput.addEventListener(
                'change',
                function () {

                    clearLocalPdfPreview();


                    const file =
                        pdfInput.files
                        &&
                        pdfInput.files[0]

                            ? pdfInput.files[0]

                            : null;


                    if (!file) {
                        return;
                    }


                    const isPdf =
                        file.type
                            ===
                            'application/pdf'

                        ||
                        file.name
                            .toLowerCase()
                            .endsWith(
                                '.pdf'
                            );


                    if (!isPdf) {

                        alert(
                            'File harus berformat PDF.'
                        );

                        pdfInput.value =
                            '';

                        return;
                    }


                    const maxSize =
                        15
                        *
                        1024
                        *
                        1024;


                    if (
                        file.size
                        >
                        maxSize
                    ) {

                        alert(
                            'Ukuran PDF maksimal 15 MB.'
                        );

                        pdfInput.value =
                            '';

                        return;
                    }


                    localPdfUrl =
                        URL.createObjectURL(
                            file
                        );


                    localPdfFrame.src =
                        localPdfUrl;


                    localPdfName
                        .textContent =
                        file.name;


                    localPdfPreview.hidden =
                        false;
                }
            );
        }


        /* =====================================================
           VALIDATION ERROR
        ====================================================== */

        const page =
            $('#nilaiPage');


        if (
            page
            &&
            page.dataset
                .validationErrors
            ===
            '1'
        ) {

            filterDivisiByDepartemen(
                true
            );


            openDialog(
                formModal
            );
        }


        /* =====================================================
           CHART DATA
        ====================================================== */

        let chartData = {
            trendLabels: [],
            trendValues: [],
            categoryLabels: [],
            categoryValues: [],
        };


        const chartJson =
            $('#nilaiChartData');


        if (chartJson) {

            try {

                chartData =
                    JSON.parse(
                        chartJson.textContent
                    );

            } catch (error) {

                console.error(
                    'Chart JSON error:',
                    error
                );
            }
        }


        /* =====================================================
           TREND CHART
        ====================================================== */

        const trendCanvas =
            $('#nilaiTrendCanvas');


        function drawTrendChart()
        {
            if (
                !trendCanvas
            ) {
                return;
            }


            const parent =
                trendCanvas
                    .parentElement;


            const width =
                Math.max(
                    parent.clientWidth,
                    320
                );


            const height =
                Math.max(
                    parent.clientHeight,
                    190
                );


            const dpr =
                window.devicePixelRatio
                || 1;


            trendCanvas.width =
                width * dpr;


            trendCanvas.height =
                height * dpr;


            trendCanvas.style.width =
                width + 'px';


            trendCanvas.style.height =
                height + 'px';


            const ctx =
                trendCanvas
                    .getContext('2d');


            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );


            ctx.clearRect(
                0,
                0,
                width,
                height
            );


            const labels =
                chartData.trendLabels
                || [];


            const values =
                (
                    chartData
                        .trendValues
                    || []
                ).map(
                    Number
                );


            if (
                !labels.length
            ) {
                return;
            }


            const padding = {
                left: 62,
                right: 22,
                top: 22,
                bottom: 34,
            };


            const graphWidth =
                width
                -
                padding.left
                -
                padding.right;


            const graphHeight =
                height
                -
                padding.top
                -
                padding.bottom;


            const maxValue =
                Math.max(
                    ...values,
                    1
                );


            const gridSteps =
                4;


            ctx.font =
                '11px Arial, sans-serif';


            ctx.lineWidth =
                1;


            for (
                let i = 0;
                i <= gridSteps;
                i++
            ) {

                const y =
                    padding.top
                    +
                    (
                        graphHeight
                        *
                        i
                        /
                        gridSteps
                    );


                ctx.beginPath();


                ctx.moveTo(
                    padding.left,
                    y
                );


                ctx.lineTo(
                    width
                    -
                    padding.right,
                    y
                );


                ctx.strokeStyle =
                    '#e1ebf4';


                ctx.stroke();


                const gridValue =
                    maxValue
                    -
                    (
                        maxValue
                        *
                        i
                        /
                        gridSteps
                    );


                ctx.fillStyle =
                    '#70839d';


                ctx.textAlign =
                    'left';


                ctx.fillText(
                    formatCompact(
                        gridValue
                    )
                    .replace(
                        'Rp ',
                        ''
                    ),

                    4,

                    y + 4
                );
            }


            const points =
                values.map(
                    (
                        value,
                        index
                    ) => {

                        const x =
                            labels.length
                            === 1

                                ? padding.left

                                :
                                padding.left
                                +
                                (
                                    graphWidth
                                    *
                                    index
                                    /
                                    (
                                        labels.length
                                        -
                                        1
                                    )
                                );


                        const y =
                            padding.top
                            +
                            graphHeight
                            -
                            (
                                value
                                /
                                maxValue
                            )
                            *
                            graphHeight;


                        return {
                            x,
                            y,
                            value,
                        };
                    }
                );


            const fillGradient =
                ctx.createLinearGradient(
                    0,
                    padding.top,
                    0,
                    height
                    -
                    padding.bottom
                );


            fillGradient.addColorStop(
                0,
                'rgba(8,106,216,.24)'
            );


            fillGradient.addColorStop(
                1,
                'rgba(8,106,216,.015)'
            );


            ctx.beginPath();


            ctx.moveTo(
                points[0].x,
                height
                -
                padding.bottom
            );


            points.forEach(
                point => {

                    ctx.lineTo(
                        point.x,
                        point.y
                    );
                }
            );


            ctx.lineTo(
                points[
                    points.length - 1
                ].x,

                height
                -
                padding.bottom
            );


            ctx.closePath();


            ctx.fillStyle =
                fillGradient;


            ctx.fill();


            ctx.beginPath();


            points.forEach(
                (
                    point,
                    index
                ) => {

                    if (
                        index === 0
                    ) {

                        ctx.moveTo(
                            point.x,
                            point.y
                        );

                    } else {

                        ctx.lineTo(
                            point.x,
                            point.y
                        );
                    }
                }
            );


            ctx.strokeStyle =
                '#086ad8';


            ctx.lineWidth =
                2.5;


            ctx.stroke();


            points.forEach(
                (
                    point,
                    index
                ) => {

                    ctx.beginPath();


                    ctx.arc(
                        point.x,
                        point.y,
                        5,
                        0,
                        Math.PI * 2
                    );


                    ctx.fillStyle =
                        '#086ad8';


                    ctx.fill();


                    ctx.fillStyle =
                        '#556e8b';


                    ctx.textAlign =
                        'center';


                    ctx.fillText(
                        labels[index],
                        point.x,
                        height - 8
                    );
                }
            );
        }


        /* =====================================================
           DONUT
        ====================================================== */

        const donutCanvas =
            $('#nilaiDonutCanvas');

        const donutLegend =
            $('#nilaiDonutLegend');


        const donutColors = [
            '#3489ef',
            '#ffb42c',
            '#36bd82',
            '#eb5c68',
            '#8d68e8',
            '#5bc3e6',
            '#7190af',
            '#16a5a5',
        ];


        function drawDonutChart()
        {
            if (
                !donutCanvas
            ) {
                return;
            }


            const parent =
                donutCanvas
                    .parentElement;


            const size =
                Math.min(
                    parent.clientWidth,
                    parent.clientHeight
                )
                ||
                165;


            const dpr =
                window.devicePixelRatio
                || 1;


            donutCanvas.width =
                size * dpr;


            donutCanvas.height =
                size * dpr;


            donutCanvas.style.width =
                size + 'px';


            donutCanvas.style.height =
                size + 'px';


            const ctx =
                donutCanvas
                    .getContext('2d');


            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );


            ctx.clearRect(
                0,
                0,
                size,
                size
            );


            const labels =
                chartData
                    .categoryLabels
                || [];


            const values =
                (
                    chartData
                        .categoryValues
                    || []
                ).map(
                    Number
                );


            const total =
                values.reduce(
                    (
                        sum,
                        value
                    ) =>
                        sum + value,
                    0
                );


            const center =
                size / 2;


            const radius =
                size * .39;


            const thickness =
                size * .18;


            if (
                total <= 0
            ) {

                ctx.beginPath();


                ctx.arc(
                    center,
                    center,
                    radius,
                    0,
                    Math.PI * 2
                );


                ctx.strokeStyle =
                    '#e7edf4';


                ctx.lineWidth =
                    thickness;


                ctx.stroke();


                return;
            }


            let startAngle =
                -Math.PI / 2;


            values.forEach(
                (
                    value,
                    index
                ) => {

                    const angle =
                        value
                        /
                        total
                        *
                        Math.PI
                        *
                        2;


                    ctx.beginPath();


                    ctx.arc(
                        center,
                        center,
                        radius,
                        startAngle,
                        startAngle
                        +
                        angle
                    );


                    ctx.strokeStyle =
                        donutColors[
                            index
                            %
                            donutColors.length
                        ];


                    ctx.lineWidth =
                        thickness;


                    ctx.stroke();


                    startAngle +=
                        angle;
                }
            );


            if (
                donutLegend
            ) {

                donutLegend.innerHTML =
                    '';


                labels.forEach(
                    (
                        label,
                        index
                    ) => {

                        const value =
                            values[index]
                            || 0;


                        const percentage =
                            total > 0

                                ? (
                                    value
                                    /
                                    total
                                    *
                                    100
                                )

                                : 0;


                        const row =
                            document
                                .createElement(
                                    'div'
                                );


                        row.className =
                            'nilai-legend-item';


                        const dot =
                            document
                                .createElement(
                                    'span'
                                );


                        dot.className =
                            'nilai-legend-dot';


                        dot.style.background =
                            donutColors[
                                index
                                %
                                donutColors.length
                            ];


                        const labelElement =
                            document
                                .createElement(
                                    'span'
                                );


                        labelElement
                            .textContent =
                            label;


                        const valueElement =
                            document
                                .createElement(
                                    'strong'
                                );


                        valueElement
                            .textContent =
                            percentage
                                .toLocaleString(
                                    'id-ID',
                                    {
                                        maximumFractionDigits: 1,
                                    }
                                )
                            +
                            '%';


                        row.append(
                            dot,
                            labelElement,
                            valueElement
                        );


                        donutLegend
                            .appendChild(
                                row
                            );
                    }
                );
            }
        }


        /* =====================================================
           CHART RESIZE
        ====================================================== */

        let resizeTimer =
            null;


        function redrawCharts()
        {
            drawTrendChart();
            drawDonutChart();
        }


        window.addEventListener(
            'resize',
            function () {

                clearTimeout(
                    resizeTimer
                );


                resizeTimer =
                    setTimeout(
                        redrawCharts,
                        120
                    );
            }
        );


        redrawCharts();

        refreshIcons();
    }
);