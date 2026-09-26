/* Master Lokasi: khusus halaman Lokasi, tidak mengubah layout global. */
let lokasiCurrentPage = 1;
let lokasiChart = null;
let lokasiPreviousOverflow = '';
const lokasiNumber = new Intl.NumberFormat('id-ID');

document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.lokasi-page')) return;
    updateLokasiDate();
    window.setInterval(updateLokasiDate, 1000);
    initLokasiChart();
    filterLokasiTable();
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('lokasiSearch').addEventListener('input', filterLokasiTable);
    document.getElementById('lokasiJenis').addEventListener('change', filterLokasiTable);
    document.getElementById('lokasiDepartemen').addEventListener('change', filterLokasiTable);
    document.getElementById('lokasiPageSize').addEventListener('change', filterLokasiTable);
    document.getElementById('lokasiTable').addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');
        if (button) openLokasiModal(button.dataset.action, button.closest('tr'));
    });
    document.getElementById('lokasiViewAll').addEventListener('click', function (event) {
        event.preventDefault();
        resetLokasiFilter();
        document.getElementById('lokasiList').scrollIntoView({ block: 'start' });
        document.getElementById('lokasiSearch').focus({ preventScroll: true });
    });
    const modal = document.getElementById('lokasiModal');
    modal.addEventListener('click', function (event) {
        const box = modal.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right
            || event.clientY < box.top || event.clientY > box.bottom;
        if (event.target === modal && outside) closeLokasiModal();
    });
    modal.addEventListener('close', function () {
        document.body.style.overflow = lokasiPreviousOverflow;
    });
    // Belum ada endpoint CRUD pada proyek. Form tidak mengirim data semu.
    document.getElementById('lokasiForm').addEventListener('submit', function (event) {
        event.preventDefault();
    });
});

/* WITA, walaupun komputer pengguna berada di zona waktu lain. */
function updateLokasiDate() {
    const date = document.getElementById('lokasiCurrentDate');
    const time = document.getElementById('lokasiCurrentTime');
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
function getLokasiRows() {
    return Array.from(document.querySelectorAll('#lokasiTable tbody tr[data-record]'));
}

function getFilteredLokasiRows() {
    const search = document.getElementById('lokasiSearch').value.trim().toLocaleLowerCase('id-ID');
    const jenis = document.getElementById('lokasiJenis').value;
    const departemen = document.getElementById('lokasiDepartemen').value;
    return getLokasiRows().filter(function (row) {
        const searchable = [row.cells[1].textContent, row.cells[2].textContent, row.cells[5].textContent].join(' ').toLocaleLowerCase('id-ID');
        return (!search || searchable.includes(search))
            && (!jenis || row.dataset.jenis === jenis)
            && (!departemen || row.dataset.departemen === departemen);
    });
}

function filterLokasiTable() {
    lokasiCurrentPage = 1;
    renderLokasiTable();
}

function resetLokasiFilter() {
    document.getElementById('lokasiSearch').value = '';
    document.getElementById('lokasiJenis').value = '';
    document.getElementById('lokasiDepartemen').value = '';
    filterLokasiTable();
}

function renderLokasiTable() {
    const allRows = getLokasiRows();
    const filtered = getFilteredLokasiRows();
    const size = Number(document.getElementById('lokasiPageSize').value) || 10;
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    lokasiCurrentPage = Math.min(Math.max(1, lokasiCurrentPage), pages);
    const start = (lokasiCurrentPage - 1) * size;
    allRows.forEach(function (row) { row.hidden = true; });
    filtered.slice(start, start + size).forEach(function (row, index) {
        row.hidden = false;
        row.cells[0].textContent = start + index + 1;
    });
    document.getElementById('lokasiEmptyRow').hidden = filtered.length > 0;
    const from = filtered.length ? start + 1 : 0;
    const to = Math.min(start + size, filtered.length);
    let info = `Menampilkan ${from}–${to} dari ${lokasiNumber.format(filtered.length)} data contoh`;
    if (filtered.length !== allRows.length) info += ` (total ${lokasiNumber.format(allRows.length)})`;
    document.getElementById('lokasiTableInfo').textContent = info;
    const pagination = document.getElementById('lokasiPagination');
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
            lokasiCurrentPage = page;
            renderLokasiTable();
            const active = pagination.querySelector('[aria-current="page"]');
            if (active) active.focus({ preventScroll: true });
        });
        pagination.appendChild(button);
    }
    addPageButton('‹', lokasiCurrentPage - 1, lokasiCurrentPage === 1, false);
    const first = Math.max(1, Math.min(lokasiCurrentPage - 2, pages - 4));
    for (let page = first; page <= Math.min(pages, first + 4); page++) {
        addPageButton(String(page), page, false, page === lokasiCurrentPage);
    }
    addPageButton('›', lokasiCurrentPage + 1, lokasiCurrentPage === pages, false);
}

/* Chart dan legenda memakai angka yang sama dari Blade. */
function initLokasiChart() {
    const canvas = document.getElementById('lokasiDistributionChart');
    if (!canvas) return;
    const groups = Array.from(document.querySelectorAll('#lokasiLegend [data-count]'));
    const labels = groups.map(function (item) { return item.dataset.label; });
    const counts = groups.map(function (item) { return Number(item.dataset.count); });
    const colors = groups.map(function (item) { return item.dataset.color; });
    const total = counts.reduce(function (sum, count) { return sum + count; }, 0);
    const wrap = canvas.parentElement;
    wrap.querySelector('.lokasi-chart-center strong').textContent = lokasiNumber.format(total);
    if (lokasiChart) { lokasiChart.destroy(); lokasiChart = null; }
    // Diagram tetap muncul jika CDN Chart.js gagal dimuat.
    if (typeof window.Chart !== 'function') {
        let angle = 0;
        const segments = counts.map(function (count, index) {
            const start = angle;
            angle += total ? count / total * 360 : 0;
            return `${colors[index]} ${start}deg ${angle}deg`;
        });
        canvas.hidden = true;
        wrap.classList.add('lokasi-chart-fallback');
        wrap.style.background = total ? `conic-gradient(${segments.join(',')})` : '#e7ecf2';
        return;
    }
    canvas.hidden = false;
    wrap.classList.remove('lokasi-chart-fallback');
    wrap.style.background = '';
    lokasiChart = new window.Chart(canvas, {
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
                    return `${context.label}: ${lokasiNumber.format(context.raw)} data`;
                } } }
            }
        }
    });
}

/* Dialog native mendukung Escape dan fokus keyboard. */
function openLokasiModal(mode = 'add', row = null) {
    const modal = document.getElementById('lokasiModal');
    if (!modal || modal.open) return;
    const titles = { add: 'Tambah Lokasi', view: 'Detail Lokasi', edit: 'Edit Lokasi', delete: 'Hapus Lokasi' };
    const descriptions = {
        add: 'Tambahkan data master lokasi baru.', view: 'Informasi data master lokasi.',
        edit: 'Perbarui informasi data master lokasi.', delete: 'Periksa lokasi yang akan dihapus.'
    };
    const readonly = mode === 'view' || mode === 'delete';
    document.getElementById('lokasiForm').reset();
    document.getElementById('lokasiModalTitle').textContent = titles[mode] || titles.add;
    document.getElementById('lokasiModalDescription').textContent = descriptions[mode] || descriptions.add;
    const name = document.getElementById('lokasiName');
    const code = document.getElementById('lokasiCode');
    name.value = row ? row.cells[2].textContent.trim() : '';
    code.value = row ? row.cells[1].textContent.trim() : '';
    name.readOnly = readonly;
    code.readOnly = readonly;
    const formjenis = document.getElementById('lokasiFormJenis');
    formjenis.value = row ? row.dataset.jenis : '';
    formjenis.disabled = readonly;
    const formdepartemen = document.getElementById('lokasiFormDepartemen');
    formdepartemen.value = row ? row.dataset.departemen : '';
    formdepartemen.disabled = readonly;
    const address = document.getElementById('lokasiAddress');
    address.value = row ? row.cells[5].textContent.trim() : '';
    address.readOnly = readonly;
    const status = document.getElementById('lokasiStatus');
    status.value = row ? row.cells[6].textContent.trim() : 'Aktif';
    status.disabled = readonly;
    const save = document.getElementById('lokasiSaveButton');
    save.hidden = mode === 'view';
    save.disabled = true;
    save.textContent = mode === 'delete' ? 'Hapus Lokasi' : 'Simpan Lokasi';
    save.classList.toggle('lokasi-delete-button', mode === 'delete');
    document.getElementById('lokasiModalNote').textContent = mode === 'view'
        ? 'Data contoh untuk pratinjau tampilan.'
        : mode === 'delete' ? 'Pratinjau konfirmasi. Penghapusan ke database belum dihubungkan.'
        : 'Pratinjau formulir. Penyimpanan ke database belum dihubungkan.';
    lokasiPreviousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    if (!readonly) name.focus();
}

function closeLokasiModal() {
    const modal = document.getElementById('lokasiModal');
    if (modal && modal.open) modal.close();
}

/* Ekspor seluruh hasil filter, termasuk halaman lain; tanpa kolom Aksi. */
function exportLokasiCSV() {
    const records = [["No", "Kode Lokasi", "Nama Lokasi", "Jenis Lokasi", "Departemen", "Alamat / Keterangan", "Status"]];
    getFilteredLokasiRows().forEach(function (row, index) {
        records.push([index + 1, row.cells[1].textContent.trim(), row.cells[2].textContent.trim(), row.cells[3].textContent.trim(), row.cells[4].textContent.trim(), row.cells[5].textContent.trim(), row.cells[6].textContent.trim()]);
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
    link.download = 'data-lokasi.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}