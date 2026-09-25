/* Master Ruangan: khusus halaman Ruangan, tidak mengubah layout global. */
let ruanganCurrentPage = 1;
let ruanganChart = null;
let ruanganPreviousOverflow = '';
const ruanganNumber = new Intl.NumberFormat('id-ID');

document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.ruangan-page')) return;
    updateRuanganDate();
    window.setInterval(updateRuanganDate, 1000);
    initRuanganChart();
    filterRuanganTable();
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('ruanganSearch').addEventListener('input', filterRuanganTable);
    document.getElementById('ruanganDivisi').addEventListener('change', filterRuanganTable);
    document.getElementById('ruanganPageSize').addEventListener('change', filterRuanganTable);
    document.getElementById('ruanganTable').addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');
        if (button) openRuanganModal(button.dataset.action, button.closest('tr'));
    });
    document.getElementById('ruanganViewAll').addEventListener('click', function (event) {
        event.preventDefault();
        resetRuanganFilter();
        document.getElementById('ruanganList').scrollIntoView({ block: 'start' });
        document.getElementById('ruanganSearch').focus({ preventScroll: true });
    });
    const modal = document.getElementById('ruanganModal');
    modal.addEventListener('click', function (event) {
        const box = modal.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right
            || event.clientY < box.top || event.clientY > box.bottom;
        if (event.target === modal && outside) closeRuanganModal();
    });
    modal.addEventListener('close', function () {
        document.body.style.overflow = ruanganPreviousOverflow;
    });
    // Belum ada endpoint CRUD pada proyek. Form tidak mengirim data semu.
    document.getElementById('ruanganForm').addEventListener('submit', function (event) {
        event.preventDefault();
    });
});

/* WITA, walaupun komputer pengguna berada di zona waktu lain. */
function updateRuanganDate() {
    const date = document.getElementById('ruanganCurrentDate');
    const time = document.getElementById('ruanganCurrentTime');
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
function getRuanganRows() {
    return Array.from(document.querySelectorAll('#ruanganTable tbody tr[data-divisi]'));
}

function getFilteredRuanganRows() {
    const search = document.getElementById('ruanganSearch').value.trim().toLocaleLowerCase('id-ID');
    const divisi = document.getElementById('ruanganDivisi').value;
    return getRuanganRows().filter(function (row) {
        const name = row.cells[1].textContent.toLocaleLowerCase('id-ID');
        const code = row.cells[2].textContent.toLocaleLowerCase('id-ID');
        return (!search || name.includes(search) || code.includes(search))
            && (!divisi || row.dataset.divisi === divisi);
    });
}

function filterRuanganTable() {
    ruanganCurrentPage = 1;
    renderRuanganTable();
}

function resetRuanganFilter() {
    document.getElementById('ruanganSearch').value = '';
    document.getElementById('ruanganDivisi').value = '';
    filterRuanganTable();
}

function renderRuanganTable() {
    const allRows = getRuanganRows();
    const filtered = getFilteredRuanganRows();
    const size = Number(document.getElementById('ruanganPageSize').value) || 10;
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    ruanganCurrentPage = Math.min(Math.max(1, ruanganCurrentPage), pages);
    const start = (ruanganCurrentPage - 1) * size;
    allRows.forEach(function (row) { row.hidden = true; });
    filtered.slice(start, start + size).forEach(function (row, index) {
        row.hidden = false;
        row.cells[0].textContent = start + index + 1;
    });
    document.getElementById('ruanganEmptyRow').hidden = filtered.length > 0;
    const from = filtered.length ? start + 1 : 0;
    const to = Math.min(start + size, filtered.length);
    let info = `Menampilkan ${from}–${to} dari ${ruanganNumber.format(filtered.length)} data contoh`;
    if (filtered.length !== allRows.length) info += ` (total ${ruanganNumber.format(allRows.length)})`;
    document.getElementById('ruanganTableInfo').textContent = info;
    const pagination = document.getElementById('ruanganPagination');
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
            ruanganCurrentPage = page;
            renderRuanganTable();
            const active = pagination.querySelector('[aria-current="page"]');
            if (active) active.focus({ preventScroll: true });
        });
        pagination.appendChild(button);
    }
    addPageButton('‹', ruanganCurrentPage - 1, ruanganCurrentPage === 1, false);
    const first = Math.max(1, Math.min(ruanganCurrentPage - 2, pages - 4));
    for (let page = first; page <= Math.min(pages, first + 4); page++) {
        addPageButton(String(page), page, false, page === ruanganCurrentPage);
    }
    addPageButton('›', ruanganCurrentPage + 1, ruanganCurrentPage === pages, false);
}

/* Chart dan legenda memakai angka yang sama dari Blade. */
function initRuanganChart() {
    const canvas = document.getElementById('ruanganDistributionChart');
    if (!canvas) return;
    const groups = Array.from(document.querySelectorAll('#ruanganLegend [data-count]'));
    const labels = groups.map(function (item) { return item.dataset.label; });
    const counts = groups.map(function (item) { return Number(item.dataset.count); });
    const colors = groups.map(function (item) { return item.dataset.color; });
    const total = counts.reduce(function (sum, count) { return sum + count; }, 0);
    const wrap = canvas.parentElement;
    wrap.querySelector('.ruangan-chart-center strong').textContent = ruanganNumber.format(total);
    if (ruanganChart) { ruanganChart.destroy(); ruanganChart = null; }
    // Diagram tetap muncul jika CDN Chart.js gagal dimuat.
    if (typeof window.Chart !== 'function') {
        let angle = 0;
        const segments = counts.map(function (count, index) {
            const start = angle;
            angle += total ? count / total * 360 : 0;
            return `${colors[index]} ${start}deg ${angle}deg`;
        });
        canvas.hidden = true;
        wrap.classList.add('ruangan-chart-fallback');
        wrap.style.background = total ? `conic-gradient(${segments.join(',')})` : '#e7ecf2';
        return;
    }
    canvas.hidden = false;
    wrap.classList.remove('ruangan-chart-fallback');
    wrap.style.background = '';
    ruanganChart = new window.Chart(canvas, {
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
                    return `${context.label}: ${ruanganNumber.format(context.raw)} ruangan`;
                } } }
            }
        }
    });
}

/* Dialog native mendukung Escape dan fokus keyboard. */
function openRuanganModal(mode = 'add', row = null) {
    const modal = document.getElementById('ruanganModal');
    if (!modal || modal.open) return;
    const titles = { add: 'Tambah Ruangan', view: 'Detail Ruangan', edit: 'Edit Ruangan', delete: 'Hapus Ruangan' };
    const descriptions = {
        add: 'Tambahkan data master ruangan baru.', view: 'Informasi data master ruangan.',
        edit: 'Perbarui informasi data master ruangan.', delete: 'Periksa ruangan yang akan dihapus.'
    };
    const readonly = mode === 'view' || mode === 'delete';
    document.getElementById('ruanganForm').reset();
    document.getElementById('ruanganModalTitle').textContent = titles[mode] || titles.add;
    document.getElementById('ruanganModalDescription').textContent = descriptions[mode] || descriptions.add;
    const name = document.getElementById('ruanganName');
    const code = document.getElementById('ruanganCode');
    const group = document.getElementById('ruanganFormDivisi');
    name.value = row ? row.cells[1].textContent.trim() : '';
    code.value = row ? row.cells[2].textContent.trim() : '';
    group.value = row ? row.dataset.divisi : '';
    name.readOnly = readonly;
    code.readOnly = readonly;
    group.disabled = readonly;
    const description = document.getElementById('ruanganDescription');
    description.value = row ? row.cells[4].textContent.trim() : '';
    description.readOnly = readonly;
    const save = document.getElementById('ruanganSaveButton');
    save.hidden = mode === 'view';
    save.disabled = true;
    save.textContent = mode === 'delete' ? 'Hapus Ruangan' : 'Simpan Ruangan';
    save.classList.toggle('ruangan-delete-button', mode === 'delete');
    document.getElementById('ruanganModalNote').textContent = mode === 'view'
        ? 'Data contoh untuk pratinjau tampilan.'
        : mode === 'delete' ? 'Pratinjau konfirmasi. Penghapusan ke database belum dihubungkan.'
        : 'Pratinjau formulir. Penyimpanan ke database belum dihubungkan.';
    ruanganPreviousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    if (!readonly) name.focus();
}

function closeRuanganModal() {
    const modal = document.getElementById('ruanganModal');
    if (modal && modal.open) modal.close();
}

/* Ekspor seluruh hasil filter, termasuk halaman lain; tanpa kolom Aksi. */
function exportRuanganCSV() {
    const records = [['No', 'Nama Ruangan', 'Kode Ruangan', 'Divisi', 'Keterangan']];
    getFilteredRuanganRows().forEach(function (row, index) {
        records.push([index + 1, row.cells[1].textContent.trim(),
            row.cells[2].textContent.trim(), row.dataset.divisi, row.cells[4].textContent.trim()]);
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
    link.download = 'data-ruangan.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

