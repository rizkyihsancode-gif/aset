/*
|--------------------------------------------------------------------------
| ARSIP ASET
|--------------------------------------------------------------------------
*/


document.addEventListener(
    'DOMContentLoaded',
    function () {

        /*
        |--------------------------------------------------------------------------
        | DATE & TIME
        |--------------------------------------------------------------------------
        */

        updateArsipDate();


        setInterval(
            updateArsipDate,
            60000
        );



        /*
        |--------------------------------------------------------------------------
        | ROW CLICK
        |--------------------------------------------------------------------------
        */

        const rows =
            document.querySelectorAll(
                '.arsip-data-row'
            );


        rows.forEach(
            function (row) {

                row.addEventListener(
                    'click',
                    function (event) {

                        /*
                        Jangan proses dua kali kalau klik tombol action.
                        */

                        if (
                            event.target.closest(
                                '.arsip-row-actions'
                            )
                        ) {

                            return;

                        }


                        updateArsipDetail(
                            row
                        );

                    }
                );

            }
        );

    }
);



/*
|--------------------------------------------------------------------------
| CURRENT DATE
|--------------------------------------------------------------------------
*/

function updateArsipDate() {

    const dateElement =
        document.getElementById(
            'arsipCurrentDate'
        );


    const timeElement =
        document.getElementById(
            'arsipCurrentTime'
        );


    if (
        !dateElement ||
        !timeElement
    ) {

        return;

    }


    const now =
        new Date();


    const dateFormatter =
        new Intl.DateTimeFormat(
            'id-ID',
            {

                weekday:
                    'long',

                day:
                    'numeric',

                month:
                    'long',

                year:
                    'numeric'

            }
        );


    const timeFormatter =
        new Intl.DateTimeFormat(
            'id-ID',
            {

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                hour12:
                    false

            }
        );


    dateElement.textContent =
        dateFormatter.format(now);


    timeElement.textContent =
        timeFormatter.format(now)
        + ' WIB';

}



/*
|--------------------------------------------------------------------------
| SELECT ARSIP FROM ACTION BUTTON
|--------------------------------------------------------------------------
*/

function selectArsipRow(button) {

    const row =
        button.closest(
            '.arsip-data-row'
        );


    if (!row) {

        return;

    }


    updateArsipDetail(
        row
    );

}



/*
|--------------------------------------------------------------------------
| UPDATE DETAIL PANEL
|--------------------------------------------------------------------------
*/

function updateArsipDetail(row) {

    /*
    |--------------------------------------------------------------------------
    | Selected row
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            '.arsip-data-row'
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    'selected'
                );

            }
        );


    row.classList.add(
        'selected'
    );



    /*
    |--------------------------------------------------------------------------
    | Make sure detail visible
    |--------------------------------------------------------------------------
    */

    const detailCard =
        document.getElementById(
            'arsipDetailCard'
        );


    const workspace =
        document.querySelector(
            '.arsip-workspace'
        );


    if (detailCard) {

        detailCard.classList.remove(
            'detail-hidden'
        );

    }


    if (workspace) {

        workspace.classList.remove(
            'detail-closed'
        );

    }



    /*
    |--------------------------------------------------------------------------
    | Dataset
    |--------------------------------------------------------------------------
    */

    const data =
        row.dataset;



    /*
    |--------------------------------------------------------------------------
    | Main information
    |--------------------------------------------------------------------------
    */

    setArsipText(
        'detailTitle',
        data.title
    );


    setArsipText(
        'detailDocumentTitle',
        data.title
    );


    setArsipText(
        'detailCode',
        data.code
    );


    setArsipText(
        'detailRegister',
        data.register
    );


    setArsipText(
        'detailVendor',
        data.vendor
    );


    setArsipText(
        'detailYear',
        data.year
    );


    setArsipText(
        'detailValue',
        data.value
    );



    /*
    |--------------------------------------------------------------------------
    | Location
    |--------------------------------------------------------------------------
    */

    setArsipText(
        'detailBuilding',
        data.building
    );


    setArsipText(
        'detailFilling',
        data.filling
    );


    setArsipText(
        'detailRack',
        data.rack
    );


    setArsipText(
        'detailRow',
        data.row
    );



    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    */

    setArsipText(
        'detailRetention',
        data.retention
    );


    setArsipText(
        'detailExpiry',
        data.expiry
    );


    setArsipText(
        'detailRemaining',
        data.remaining
    );



    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    updateArsipStatus(
        data.status,
        data.statusClass
    );



    /*
    |--------------------------------------------------------------------------
    | Refresh icons
    |--------------------------------------------------------------------------
    */

    if (window.lucide) {

        lucide.createIcons();

    }

}



/*
|--------------------------------------------------------------------------
| SET TEXT
|--------------------------------------------------------------------------
*/

function setArsipText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        value || '-';

}



/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function updateArsipStatus(
    status,
    statusClass
) {

    const detailStatus =
        document.getElementById(
            'detailStatus'
        );


    const inlineStatus =
        document.getElementById(
            'detailInlineStatus'
        );


    if (detailStatus) {

        detailStatus.classList.remove(
            'good',
            'warning'
        );


        detailStatus.classList.add(
            statusClass || 'good'
        );


        detailStatus.innerHTML =
            '<span></span>' +
            (status || '-');

    }


    if (inlineStatus) {

        inlineStatus.classList.remove(
            'good',
            'warning'
        );


        inlineStatus.classList.add(
            statusClass || 'good'
        );


        inlineStatus.textContent =
            status || '-';

    }

}



/*
|--------------------------------------------------------------------------
| CLOSE DETAIL
|--------------------------------------------------------------------------
*/

function closeArsipDetail() {

    const detailCard =
        document.getElementById(
            'arsipDetailCard'
        );


    const workspace =
        document.querySelector(
            '.arsip-workspace'
        );


    if (detailCard) {

        detailCard.classList.add(
            'detail-hidden'
        );

    }


    if (workspace) {

        workspace.classList.add(
            'detail-closed'
        );

    }

}



/*
|--------------------------------------------------------------------------
| RESET FILTER
|--------------------------------------------------------------------------
*/

function resetArsipFilter() {

    const search =
        document.getElementById(
            'arsipSearch'
        );


    const gedung =
        document.getElementById(
            'arsipGedung'
        );


    const filling =
        document.getElementById(
            'arsipFilling'
        );


    const rak =
        document.getElementById(
            'arsipRak'
        );


    const tahun =
        document.getElementById(
            'arsipTahun'
        );


    const kondisi =
        document.getElementById(
            'arsipKondisi'
        );


    if (search) {
        search.value = '';
    }


    if (gedung) {
        gedung.selectedIndex = 0;
    }


    if (filling) {
        filling.selectedIndex = 0;
    }


    if (rak) {
        rak.selectedIndex = 0;
    }


    if (tahun) {
        tahun.selectedIndex = 0;
    }


    if (kondisi) {
        kondisi.selectedIndex = 0;
    }

}