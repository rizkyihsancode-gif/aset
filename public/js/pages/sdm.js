/* Master SDM Pendukung: khusus halaman SDM Pendukung, tidak mengubah layout global. */
let sdmCurrentPage = 1;
let sdmChart = null;
let sdmPreviousOverflow = '';
const sdmNumber = new Intl.NumberFormat('id-ID');

document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.sdm-page')) return;
    updateSdmDate();
    window.setInterval(updateSdmDate, 1000);
    initSdmChart();
    filterSdmTable();
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('sdmSearch').addEventListener('input', filterSdmTable);
    document.getElementById('sdmDepartemen').addEventListener('change', function () {
        syncSdmDivisiOptions('sdmDepartemen', 'sdmDivisi');
        filterSdmTable();
    });
    document.getElementById('sdmDivisi').addEventListener('change', filterSdmTable);
    document.getElementById('sdmFormDepartemen').addEventListener('change', function () {
        syncSdmDivisiOptions('sdmFormDepartemen', 'sdmFormDivisi');
    });
    document.getElementById('sdmPageSize').addEventListener('change', filterSdmTable);
    document.getElementById('sdmTable').addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');
        if (button) openSdmModal(button.dataset.action, button.closest('tr'));
    });
    document.getElementById('sdmViewAll').addEventListener('click', function (event) {
        event.preventDefault();
        resetSdmFilter();
        document.getElementById('sdmList').scrollIntoView({ block: 'start' });
        document.getElementById('sdmSearch').focus({ preventScroll: true });
    });
    const modal = document.getElementById('sdmModal');
    modal.addEventListener('click', function (event) {
        const box = modal.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right
            || event.clientY < box.top || event.clientY > box.bottom;
        if (event.target === modal && outside) closeSdmModal();
    });
    modal.addEventListener('close', function () {
        document.body.style.overflow = sdmPreviousOverflow;
    });
    // Belum ada endpoint CRUD pada proyek. Form tidak mengirim data semu.
    document.getElementById('sdmForm').addEventListener('submit', function (event) {
        event.preventDefault();
    });
});

/* WITA, walaupun komputer pengguna berada di zona waktu lain. */
function updateSdmDate() {
    const date = document.getElementById('sdmCurrentDate');
    const time = document.getElementById('sdmCurrentTime');
    if (!date || !time) return;
    const now = new Date();
    date.textContent = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar', weekday: 'long', day: 'numeric',
        month: 'long', year: 'numeric'
    }).format(now);
    time.textContent = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit',
        second: '2-digit', hourCycle: 'h23'
    }).format(now).replace(/\./g, ':') + ' WITA';
}

/* Data berasal dari baris Blade, tidak diduplikasi di JavaScript. */
function getSdmRows() {
    return Array.from(document.querySelectorAll('#sdmTable tbody tr[data-divisi]'));
}

function getFilteredSdmRows() {
    const search = document.getElementById('sdmSearch').value.trim().toLocaleLowerCase('id-ID');
    const departemen = document.getElementById('sdmDepartemen').value;
    const divisi = document.getElementById('sdmDivisi').value;
    return getSdmRows().filter(function (row) {
        const searchable = [row.cells[1].textContent, row.cells[2].textContent,
            row.cells[3].textContent, row.dataset.email || ''].join(' ').toLocaleLowerCase('id-ID');
        return (!search || searchable.includes(search))
            && (!departemen || row.dataset.departemen === departemen)
            && (!divisi || row.dataset.divisi === divisi);
    });
}

/* Divisi yang dipilih selalu sesuai departemen, pada filter dan formulir. */
function syncSdmDivisiOptions(departemenId, divisiId) {
    const departemen = document.getElementById(departemenId).value;
    const select = document.getElementById(divisiId);
    Array.from(select.options).forEach(function (option) {
        const allowed = !option.value || !departemen || option.dataset.departemen === departemen;
        option.hidden = !allowed;
        option.disabled = !allowed;
    });
    if (select.selectedOptions[0] && select.selectedOptions[0].disabled) select.value = '';
}

function filterSdmTable() {
    sdmCurrentPage = 1;
    renderSdmTable();
}

function resetSdmFilter() {
    document.getElementById('sdmSearch').value = '';
    document.getElementById('sdmDepartemen').value = '';
    document.getElementById('sdmDivisi').value = '';
    syncSdmDivisiOptions('sdmDepartemen', 'sdmDivisi');
    filterSdmTable();
}

function renderSdmTable() {
    const allRows = getSdmRows();
    const filtered = getFilteredSdmRows();
    const size = Number(document.getElementById('sdmPageSize').value) || 10;
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    sdmCurrentPage = Math.min(Math.max(1, sdmCurrentPage), pages);
    const start = (sdmCurrentPage - 1) * size;
    allRows.forEach(function (row) { row.hidden = true; });
    filtered.slice(start, start + size).forEach(function (row, index) {
        row.hidden = false;
        row.cells[0].textContent = start + index + 1;
    });
    document.getElementById('sdmEmptyRow').hidden = filtered.length > 0;
    const from = filtered.length ? start + 1 : 0;
    const to = Math.min(start + size, filtered.length);
    let info = `Menampilkan ${from}–${to} dari ${sdmNumber.format(filtered.length)} data contoh`;
    if (filtered.length !== allRows.length) info += ` (total ${sdmNumber.format(allRows.length)})`;
    document.getElementById('sdmTableInfo').textContent = info;
    const pagination = document.getElementById('sdmPagination');
    pagination.replaceChildren();
    function addPageButton(label, page, disabled, current) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.disabled = disabled;
        button.setAttribute('aria-label', label === '‹' ? 'Halaman sebelumnya'
            : label === '›' ? 'Halaman berikutnya' : `Halaman ${page}`);
        if (current) {
            button.className = 'active';
            button.setAttribute('aria-current', 'page');
        }
        button.addEventListener('click', function () {
            sdmCurrentPage = page;
            renderSdmTable();
            const active = pagination.querySelector('[aria-current="page"]');
            if (active) active.focus({ preventScroll: true });
        });
        pagination.appendChild(button);
    }
    addPageButton('‹', sdmCurrentPage - 1, sdmCurrentPage === 1, false);
    const first = Math.max(1, Math.min(sdmCurrentPage - 2, pages - 4));
    for (let page = first; page <= Math.min(pages, first + 4); page++) {
        addPageButton(String(page), page, false, page === sdmCurrentPage);
    }
    addPageButton('›', sdmCurrentPage + 1, sdmCurrentPage === pages, false);
}

/* Chart dan legenda memakai angka yang sama dari Blade. */
function initSdmChart() {
    const canvas = document.getElementById('sdmDistributionChart');
    if (!canvas) return;
    const groups = Array.from(document.querySelectorAll('#sdmLegend [data-count]'));
    const labels = groups.map(function (item) { return item.dataset.label; });
    const counts = groups.map(function (item) { return Number(item.dataset.count); });
    const colors = groups.map(function (item) { return item.dataset.color; });
    const total = counts.reduce(function (sum, count) { return sum + count; }, 0);
    const wrap = canvas.parentElement;
    wrap.querySelector('.sdm-chart-center strong').textContent = sdmNumber.format(total);
    if (sdmChart) { sdmChart.destroy(); sdmChart = null; }
    // Diagram tetap muncul jika CDN Chart.js gagal dimuat.
    if (typeof window.Chart !== 'function') {
        let angle = 0;
        const segments = counts.map(function (count, index) {
            const start = angle;
            angle += total ? count / total * 360 : 0;
            return `${colors[index]} ${start}deg ${angle}deg`;
        });
        canvas.hidden = true;
        wrap.classList.add('sdm-chart-fallback');
        wrap.style.background = total ? `conic-gradient(${segments.join(',')})` : '#e7ecf2';
        return;
    }
    canvas.hidden = false;
    wrap.classList.remove('sdm-chart-fallback');
    wrap.style.background = '';
    sdmChart = new window.Chart(canvas, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{
            data: counts, backgroundColor: colors, borderColor: '#ffffff',
            borderWidth: 2, hoverOffset: 4
        }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function (context) {
                    return `${context.label}: ${sdmNumber.format(context.raw)} orang`;
                } } }
            }
        }
    });
}

/* Dialog native mendukung Escape dan fokus keyboard. */
function openSdmModal(mode = 'add', row = null) {
    const modal = document.getElementById('sdmModal');
    if (!modal || modal.open) return;
    const titles = { add: 'Tambah SDM Pendukung', view: 'Detail SDM Pendukung', edit: 'Edit SDM Pendukung', delete: 'Hapus SDM Pendukung' };
    const descriptions = {
        add: 'Tambahkan data master SDM pendukung baru.', view: 'Informasi data master SDM pendukung.',
        edit: 'Perbarui informasi data master SDM pendukung.', delete: 'Periksa data SDM yang akan dihapus.'
    };
    const readonly = mode === 'view' || mode === 'delete';
    document.getElementById('sdmForm').reset();
    document.getElementById('sdmModalTitle').textContent = titles[mode] || titles.add;
    document.getElementById('sdmModalDescription').textContent = descriptions[mode] || descriptions.add;
    const name = document.getElementById('sdmName');
    const nip = document.getElementById('sdmNip');
    const email = document.getElementById('sdmEmail');
    const jabatan = document.getElementById('sdmJabatan');
    const departemen = document.getElementById('sdmFormDepartemen');
    const divisi = document.getElementById('sdmFormDivisi');
    const status = document.getElementById('sdmStatus');
    name.value = row ? row.cells[1].textContent.trim() : '';
    nip.value = row ? row.cells[2].textContent.trim() : '';
    email.value = row ? row.dataset.email : '';
    jabatan.value = row ? row.cells[3].textContent.trim() : '';
    departemen.value = row ? row.dataset.departemen : '';
    syncSdmDivisiOptions('sdmFormDepartemen', 'sdmFormDivisi');
    divisi.value = row ? row.dataset.divisi : '';
    status.value = row ? row.cells[6].textContent.trim() : 'Aktif';
    [name, nip, email, jabatan].forEach(function (input) { input.readOnly = readonly; });
    [departemen, divisi, status].forEach(function (select) { select.disabled = readonly; });
    const save = document.getElementById('sdmSaveButton');
    save.hidden = mode === 'view';
    save.disabled = true;
    save.textContent = mode === 'delete' ? 'Hapus SDM Pendukung' : 'Simpan SDM Pendukung';
    save.classList.toggle('sdm-delete-button', mode === 'delete');
    document.getElementById('sdmModalNote').textContent = mode === 'view'
        ? 'Data contoh untuk pratinjau tampilan.'
        : mode === 'delete' ? 'Pratinjau konfirmasi. Penghapusan ke database belum dihubungkan.'
        : 'Pratinjau formulir. Penyimpanan ke database belum dihubungkan.';
    sdmPreviousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    if (!readonly) name.focus();
}

function closeSdmModal() {
    const modal = document.getElementById('sdmModal');
    if (modal && modal.open) modal.close();
}

/* Ekspor seluruh hasil filter, termasuk halaman lain; tanpa kolom Aksi. */
function exportSdmCSV() {
    const records = [['No', 'Nama Lengkap', 'NIP', 'Jabatan', 'Departemen', 'Divisi', 'Status', 'Email']];
    getFilteredSdmRows().forEach(function (row, index) {
        // NIP tetap teks: awalan apostrof mencegah pembulatan nomor panjang di Excel.
        records.push([index + 1, row.cells[1].textContent.trim(), "'" + row.cells[2].textContent.trim(),
            row.cells[3].textContent.trim(), row.dataset.departemen, row.dataset.divisi,
            row.cells[6].textContent.trim(), row.dataset.email || '']);
    });
    function csvCell(value) {
        let text = String(value);
        // Cegah teks dibaca sebagai rumus saat CSV dibuka di Excel.
        if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }
    const csv = records.map(function (record) { return record.map(csvCell).join(','); }).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data-sdm-pendukung.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

