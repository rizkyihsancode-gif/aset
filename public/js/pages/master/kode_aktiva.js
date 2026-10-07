/* =========================================================
   MASTER DATA - KODE AKTIVA
========================================================= */

let aktivaPage = 1;

let aktivaMode = 'add';

let aktivaId = null;

let aktivaRow = null;

let aktivaToastTimer = null;


document.addEventListener(
    'DOMContentLoaded',
    function () {

        if (
            !document.querySelector(
                '.aktiva-page'
            )
        ) {
            return;
        }


        bindAktivaEvents();

        updateAktivaClock();

        setInterval(
            updateAktivaClock,
            1000
        );

        renderAktivaTable();


        if (window.lucide) {
            window.lucide.createIcons();
        }

    }
);


/* =========================================================
   EVENTS
========================================================= */

function bindAktivaEvents() {

    document
        .getElementById(
            'aktivaSearch'
        )
        ?.addEventListener(
            'input',
            aktivaFilterChanged
        );


    document
        .getElementById(
            'aktivaGolFilter'
        )
        ?.addEventListener(
            'change',
            aktivaFilterChanged
        );


    document
        .getElementById(
            'aktivaKibFilter'
        )
        ?.addEventListener(
            'change',
            aktivaFilterChanged
        );


    document
        .getElementById(
            'aktivaPageSize'
        )
        ?.addEventListener(
            'change',
            aktivaFilterChanged
        );


    document
        .getElementById(
            'resetAktivaButton'
        )
        ?.addEventListener(
            'click',
            resetAktivaFilter
        );


    document
        .getElementById(
            'addAktivaButton'
        )
        ?.addEventListener(
            'click',
            () =>
                openAktivaModal(
                    'add'
                )
        );


    document
        .getElementById(
            'exportAktivaButton'
        )
        ?.addEventListener(
            'click',
            exportAktivaCsv
        );


    document
        .getElementById(
            'aktivaHistoryButton'
        )
        ?.addEventListener(
            'click',
            openAktivaHistory
        );


    document
        .getElementById(
            'closeAktivaHistory'
        )
        ?.addEventListener(
            'click',
            closeAktivaHistory
        );


    document
        .getElementById(
            'closeAktivaModal'
        )
        ?.addEventListener(
            'click',
            closeAktivaModal
        );


    document
        .getElementById(
            'cancelAktivaButton'
        )
        ?.addEventListener(
            'click',
            closeAktivaModal
        );


    document
        .getElementById(
            'aktivaForm'
        )
        ?.addEventListener(
            'submit',
            submitAktiva
        );


    document
        .getElementById(
            'aktivaTable'
        )
        ?.addEventListener(
            'click',
            function (event) {

                const button =
                    event.target.closest(
                        '[data-action]'
                    );


                if (!button) {
                    return;
                }


                const row =
                    button.closest(
                        'tr[data-row]'
                    );


                if (!row) {
                    return;
                }


                openAktivaModal(
                    button.dataset.action,
                    row
                );

            }
        );


    const modal =
        document.getElementById(
            'aktivaModal'
        );


    modal?.addEventListener(
        'click',
        event => {

            if (
                event.target
                ===
                modal
            ) {
                closeAktivaModal();
            }

        }
    );


    const history =
        document.getElementById(
            'aktivaHistoryModal'
        );


    history?.addEventListener(
        'click',
        event => {

            if (
                event.target
                ===
                history
            ) {
                closeAktivaHistory();
            }

        }
    );

}


/* =========================================================
   CLOCK
========================================================= */

function updateAktivaClock() {

    const date =
        document.getElementById(
            'aktivaDate'
        );


    const time =
        document.getElementById(
            'aktivaTime'
        );


    if (!date || !time) {
        return;
    }


    const now =
        new Date();


    date.textContent =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone:
                    'Asia/Makassar',

                weekday:
                    'long',

                day:
                    'numeric',

                month:
                    'long',

                year:
                    'numeric'
            }
        ).format(now);


    time.textContent =
        new Intl.DateTimeFormat(
            'id-ID',
            {
                timeZone:
                    'Asia/Makassar',

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                second:
                    '2-digit',

                hourCycle:
                    'h23'
            }
        )
        .format(now)
        .replace(/\./g, ':')

        + ' WITA';

}


/* =========================================================
   TABLE
========================================================= */

function getAktivaRows() {

    return Array.from(
        document.querySelectorAll(
            '#aktivaTable tbody tr[data-row]'
        )
    );

}


function normalizeAktiva(value) {

    return String(
        value ?? ''
    )
    .trim()
    .toLocaleLowerCase(
        'id-ID'
    );

}


function getFilteredAktivaRows() {

    const search =
        normalizeAktiva(
            document
                .getElementById(
                    'aktivaSearch'
                )
                ?.value
        );


    const gol =
        document
            .getElementById(
                'aktivaGolFilter'
            )
            ?.value
        ?? '';


    const kib =
        document
            .getElementById(
                'aktivaKibFilter'
            )
            ?.value
        ?? '';


    return getAktivaRows()
        .filter(
            row => {

                const content =
                    normalizeAktiva(
                        [
                            row.dataset.kode,
                            row.dataset.aktiva,
                            row.dataset.gol,
                            row.dataset.kib
                        ].join(' ')
                    );


                const searchMatch =
                    !search
                    ||
                    content.includes(
                        search
                    );


                const golMatch =
                    !gol
                    ||
                    row.dataset.gol
                    ===
                    gol;


                const kibMatch =
                    !kib
                    ||
                    row.dataset.kib
                    ===
                    kib;


                return (
                    searchMatch
                    &&
                    golMatch
                    &&
                    kibMatch
                );

            }
        );

}


function aktivaFilterChanged() {

    aktivaPage = 1;

    renderAktivaTable();

}


function resetAktivaFilter() {

    document.getElementById(
        'aktivaSearch'
    ).value = '';


    document.getElementById(
        'aktivaGolFilter'
    ).value = '';


    document.getElementById(
        'aktivaKibFilter'
    ).value = '';


    document.getElementById(
        'aktivaPageSize'
    ).value = '10';


    aktivaPage = 1;


    renderAktivaTable();

}


function renderAktivaTable() {

    const rows =
        getAktivaRows();


    const filtered =
        getFilteredAktivaRows();


    const size =
        Number(
            document
                .getElementById(
                    'aktivaPageSize'
                )
                ?.value
        )
        || 10;


    const pages =
        Math.max(
            1,
            Math.ceil(
                filtered.length
                /
                size
            )
        );


    aktivaPage =
        Math.min(
            Math.max(
                aktivaPage,
                1
            ),
            pages
        );


    const start =
        (
            aktivaPage - 1
        )
        *
        size;


    rows.forEach(
        row =>
            row.hidden = true
    );


    filtered
        .slice(
            start,
            start + size
        )
        .forEach(
            (row, index) => {

                row.hidden = false;


                const number =
                    row.querySelector(
                        '.aktiva-number'
                    );


                if (number) {

                    number.textContent =
                        start
                        +
                        index
                        +
                        1;

                }

            }
        );


    const empty =
        document.getElementById(
            'aktivaEmptyRow'
        );


    if (empty) {

        empty.hidden =
            filtered.length !== 0;

    }


    const from =
        filtered.length
        ?
        start + 1
        :
        0;


    const to =
        Math.min(
            start + size,
            filtered.length
        );


    document.getElementById(
        'aktivaTableInfo'
    ).textContent =

        `Menampilkan ${from}–${to} dari ${filtered.length} data`;


    renderAktivaPagination(
        pages
    );

}


function renderAktivaPagination(
    pages
) {

    const container =
        document.getElementById(
            'aktivaPagination'
        );


    container.innerHTML = '';


    function createButton(
        label,
        page,
        disabled = false,
        active = false
    ) {

        const button =
            document.createElement(
                'button'
            );


        button.type =
            'button';


        button.textContent =
            label;


        button.disabled =
            disabled;


        if (active) {

            button.classList.add(
                'active'
            );

        }


        button.addEventListener(
            'click',
            () => {

                aktivaPage = page;

                renderAktivaTable();

            }
        );


        container.appendChild(
            button
        );

    }


    createButton(
        '‹',
        aktivaPage - 1,
        aktivaPage === 1
    );


    let first =
        Math.max(
            1,
            aktivaPage - 2
        );


    let last =
        Math.min(
            pages,
            first + 4
        );


    first =
        Math.max(
            1,
            last - 4
        );


    for (
        let i = first;
        i <= last;
        i++
    ) {

        createButton(
            String(i),
            i,
            false,
            i === aktivaPage
        );

    }


    createButton(
        '›',
        aktivaPage + 1,
        aktivaPage === pages
    );

}


/* =========================================================
   MODAL
========================================================= */

function openAktivaModal(
    mode,
    row = null
) {

    const modal =
        document.getElementById(
            'aktivaModal'
        );


    resetAktivaForm();


    aktivaMode =
        mode;


    aktivaRow =
        row;


    aktivaId =
        row?.dataset.id
        ?? null;


    if (row) {

        document.getElementById(
            'aktivaKode'
        ).value =
            row.dataset.kode || '';


        document.getElementById(
            'aktivaName'
        ).value =
            row.dataset.aktiva || '';


        document.getElementById(
            'aktivaGol'
        ).value =
            row.dataset.gol || '';


        document.getElementById(
            'aktivaKib'
        ).value =
            row.dataset.kib || '';

    }


    const titles = {

        add:
            'Tambah Kode Aktiva',

        view:
            'Detail Kode Aktiva',

        edit:
            'Edit Kode Aktiva',

        delete:
            'Hapus Kode Aktiva'

    };


    document.getElementById(
        'aktivaModalTitle'
    ).textContent =
        titles[mode];


    const readonly =
        mode === 'view'
        ||
        mode === 'delete';


    [
        'aktivaKode',
        'aktivaName',
        'aktivaGol',
        'aktivaKib'
    ]
    .forEach(
        id => {

            document.getElementById(
                id
            ).readOnly =
                readonly;

        }
    );


    const save =
        document.getElementById(
            'saveAktivaButton'
        );


    save.hidden =
        mode === 'view';


    save.classList.toggle(
        'delete-mode',
        mode === 'delete'
    );


    save.querySelector(
        'span'
    ).textContent =

        mode === 'delete'
        ?
        'Hapus Kode Aktiva'
        :
        mode === 'edit'
        ?
        'Simpan Perubahan'
        :
        'Simpan Kode Aktiva';


    if (!modal.open) {

        modal.showModal();

    }


    if (window.lucide) {

        window.lucide.createIcons();

    }

}


function closeAktivaModal() {

    const modal =
        document.getElementById(
            'aktivaModal'
        );


    if (modal?.open) {

        modal.close();

    }

}


function resetAktivaForm() {

    document
        .getElementById(
            'aktivaForm'
        )
        ?.reset();


    clearAktivaErrors();

}


/* =========================================================
   CRUD
========================================================= */

async function submitAktiva(
    event
) {

    event.preventDefault();


    if (
        aktivaMode === 'view'
    ) {

        closeAktivaModal();

        return;

    }


    clearAktivaErrors();


    try {

        if (
            aktivaMode === 'delete'
        ) {

            await deleteAktiva();

        } else {

            await saveAktiva();

        }

    } catch (error) {

        console.error(
            error
        );


        if (
            error.errors
        ) {

            showAktivaErrors(
                error.errors
            );

        }


        showAktivaToast(
            'Gagal',
            error.message
            ||
            'Terjadi kesalahan.',
            true
        );

    }

}


async function saveAktiva() {

    const form =
        document.getElementById(
            'aktivaForm'
        );


    if (
        !form.checkValidity()
    ) {

        form.reportValidity();

        return;

    }


    const data = {

        kode:
            document.getElementById(
                'aktivaKode'
            ).value.trim(),

        aktiva:
            document.getElementById(
                'aktivaName'
            ).value.trim(),

        gol:
            document.getElementById(
                'aktivaGol'
            ).value.trim(),

        kib:
            document.getElementById(
                'aktivaKib'
            ).value.trim()

    };


    const editing =
        aktivaMode === 'edit';


    const url =
        editing

        ?

        window.AKTIVA_CRUD.update.replace(
            '__ID__',
            aktivaId
        )

        :

        window.AKTIVA_CRUD.store;


    const response =
        await fetch(
            url,
            {
                method:
                    editing
                    ?
                    'PUT'
                    :
                    'POST',

                headers: {

                    'Accept':
                        'application/json',

                    'Content-Type':
                        'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest',

                    'X-CSRF-TOKEN':
                        getAktivaToken()

                },

                body:
                    JSON.stringify(
                        data
                    )
            }
        );


    const result =
        await readAktivaResponse(
            response
        );


    if (!response.ok) {

        const error =
            new Error(
                result.message
                ||
                'Data gagal disimpan.'
            );


        error.errors =
            result.errors;


        throw error;

    }


    showAktivaToast(
        'Berhasil',
        result.message
    );


    closeAktivaModal();


    setTimeout(
        () =>
            window.location.reload(),
        400
    );

}


async function deleteAktiva() {

    const url =
        window.AKTIVA_CRUD.destroy
            .replace(
                '__ID__',
                aktivaId
            );


    const response =
        await fetch(
            url,
            {
                method:
                    'DELETE',

                headers: {

                    'Accept':
                        'application/json',

                    'Content-Type':
                        'application/json',

                    'X-Requested-With':
                        'XMLHttpRequest',

                    'X-CSRF-TOKEN':
                        getAktivaToken()

                },

                body:
                    JSON.stringify({})
            }
        );


    const result =
        await readAktivaResponse(
            response
        );


    if (!response.ok) {

        throw new Error(
            result.message
            ||
            'Data gagal dihapus.'
        );

    }


    showAktivaToast(
        'Berhasil',
        result.message
    );


    closeAktivaModal();


    setTimeout(
        () =>
            window.location.reload(),
        400
    );

}


/* =========================================================
   TOKEN / RESPONSE
========================================================= */

function getAktivaToken() {

    return document
        .querySelector(
            'meta[name="csrf-token"]'
        )
        ?.content
        || '';

}


async function readAktivaResponse(
    response
) {

    const text =
        await response.text();


    try {

        return text
            ?
            JSON.parse(text)
            :
            {};

    } catch {

        throw new Error(
            `Respons server tidak valid (${response.status}).`
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function clearAktivaErrors() {

    document
        .querySelectorAll(
            '[data-error]'
        )
        .forEach(
            item =>
                item.textContent = ''
        );


    const alert =
        document.getElementById(
            'aktivaFormAlert'
        );


    alert.hidden =
        true;

}


function showAktivaErrors(
    errors
) {

    Object.entries(
        errors
    )
    .forEach(
        ([field, messages]) => {

            const element =
                document.querySelector(
                    `[data-error="${field}"]`
                );


            if (element) {

                element.textContent =
                    Array.isArray(
                        messages
                    )
                    ?
                    messages[0]
                    :
                    messages;

            }

        }
    );


    const alert =
        document.getElementById(
            'aktivaFormAlert'
        );


    alert.textContent =
        'Masih ada data yang perlu diperbaiki.';


    alert.hidden =
        false;

}


/* =========================================================
   HISTORY
========================================================= */

function openAktivaHistory() {

    const modal =
        document.getElementById(
            'aktivaHistoryModal'
        );


    if (!modal.open) {

        modal.showModal();

    }


    if (window.lucide) {

        window.lucide.createIcons();

    }

}


function closeAktivaHistory() {

    const modal =
        document.getElementById(
            'aktivaHistoryModal'
        );


    if (modal?.open) {

        modal.close();

    }

}


/* =========================================================
   EXPORT
========================================================= */

function exportAktivaCsv() {

    const rows =
        getFilteredAktivaRows();


    const data = [[
        'No',
        'Kode Aktiva',
        'Nama Aktiva',
        'Golongan',
        'Kategori / KIB'
    ]];


    rows.forEach(
        (row, index) => {

            data.push([
                index + 1,
                row.dataset.kode || '',
                row.dataset.aktiva || '',
                row.dataset.gol || '',
                row.dataset.kib || ''
            ]);

        }
    );


    const csv =
        data
        .map(
            row =>
                row
                .map(csvAktivaCell)
                .join(',')
        )
        .join('\r\n');


    const blob =
        new Blob(
            [
                '\uFEFF'
                +
                csv
            ],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            'a'
        );


    link.href =
        url;


    link.download =
        'kode-aktiva.csv';


    link.click();


    URL.revokeObjectURL(
        url
    );

}


function csvAktivaCell(
    value
) {

    let text =
        String(
            value ?? ''
        );


    if (
        /^[\s]*[=+@-]/.test(
            text
        )
    ) {

        text =
            "'"
            +
            text;

    }


    return (
        '"'
        +
        text.replace(
            /"/g,
            '""'
        )
        +
        '"'
    );

}


/* =========================================================
   TOAST
========================================================= */

function showAktivaToast(
    title,
    message,
    error = false
) {

    const toast =
        document.getElementById(
            'aktivaToast'
        );


    clearTimeout(
        aktivaToastTimer
    );


    toast.classList.toggle(
        'error',
        error
    );


    document.getElementById(
        'aktivaToastTitle'
    ).textContent =
        title;


    document.getElementById(
        'aktivaToastMessage'
    ).textContent =
        message || '';


    toast.hidden =
        false;


    aktivaToastTimer =
        setTimeout(
            () => {

                toast.hidden =
                    true;

            },
            3500
        );

}