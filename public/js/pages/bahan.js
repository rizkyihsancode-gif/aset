/* Master Bahan: khusus halaman Bahan, tidak mengubah layout global. */
let bahanCurrentPage = 1;
let bahanChart = null;
let bahanPreviousOverflow = '';
const bahanNumber = new Intl.NumberFormat('id-ID');

document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.bahan-page')) return;
    updateBahanDate();
    window.setInterval(updateBahanDate, 1000);
    initBahanChart();
    filterBahanTable();
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('bahanSearch').addEventListener('input', filterBahanTable);
    document.getElementById('bahanKategori').addEventListener('change', filterBahanTable);
    document.getElementById('bahanDepartemen').addEventListener('change', filterBahanTable);
    document.getElementById('bahanPageSize').addEventListener('change', filterBahanTable);
    document.getElementById('bahanTable').addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');
        if (button) openBahanModal(button.dataset.action, button.closest('tr'));
    });
    document.getElementById('bahanViewAll').addEventListener('click', function (event) {
        event.preventDefault();
        resetBahanFilter();
        document.getElementById('bahanList').scrollIntoView({ block: 'start' });
        document.getElementById('bahanSearch').focus({ preventScroll: true });
    });
    const modal = document.getElementById('bahanModal');
    modal.addEventListener('click', function (event) {
        const box = modal.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right
            || event.clientY < box.top || event.clientY > box.bottom;
        if (event.target === modal && outside) closeBahanModal();
    });
    modal.addEventListener('close', function () {
        document.body.style.overflow = bahanPreviousOverflow;
    });
    // Belum ada endpoint CRUD pada proyek. Form tidak mengirim data semu.
    document.getElementById('bahanForm').addEventListener('submit', function (event) {
        event.preventDefault();
    });
});

/* WITA, walaupun komputer pengguna berada di zona waktu lain. */
function updateBahanDate() {
    const date = document.getElementById('bahanCurrentDate');
    const time = document.getElementById('bahanCurrentTime');
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
function getBahanRows() {
    return Array.from(document.querySelectorAll('#bahanTable tbody tr[data-record]'));
}

function getFilteredBahanRows() {
    const search = document.getElementById('bahanSearch').value.trim().toLocaleLowerCase('id-ID');
    const kategori = document.getElementById('bahanKategori').value;
    const departemen = document.getElementById('bahanDepartemen').value;
    return getBahanRows().filter(function (row) {
        const searchable = [row.cells[1].textContent, row.cells[2].textContent, row.cells[3].textContent].join(' ').toLocaleLowerCase('id-ID');
        return (!search || searchable.includes(search))
            && (!kategori || row.dataset.kategori === kategori)
            && (!departemen || row.dataset.departemen === departemen);
    });
}

function filterBahanTable() {
    bahanCurrentPage = 1;
    renderBahanTable();
}

function resetBahanFilter() {
    document.getElementById('bahanSearch').value = '';
    document.getElementById('bahanKategori').value = '';
    document.getElementById('bahanDepartemen').value = '';
    filterBahanTable();
}

function renderBahanTable() {
    const allRows = getBahanRows();
    const filtered = getFilteredBahanRows();
    const size = Number(document.getElementById('bahanPageSize').value) || 10;
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    bahanCurrentPage = Math.min(Math.max(1, bahanCurrentPage), pages);
    const start = (bahanCurrentPage - 1) * size;
    allRows.forEach(function (row) { row.hidden = true; });
    filtered.slice(start, start + size).forEach(function (row, index) {
        row.hidden = false;
        row.cells[0].textContent = start + index + 1;
    });
    document.getElementById('bahanEmptyRow').hidden = filtered.length > 0;
    const from = filtered.length ? start + 1 : 0;
    const to = Math.min(start + size, filtered.length);
    let info = `Menampilkan ${from}–${to} dari ${bahanNumber.format(filtered.length)} data contoh`;
    if (filtered.length !== allRows.length) info += ` (total ${bahanNumber.format(allRows.length)})`;
    document.getElementById('bahanTableInfo').textContent = info;
    const pagination = document.getElementById('bahanPagination');
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
            bahanCurrentPage = page;
            renderBahanTable();
            const active = pagination.querySelector('[aria-current="page"]');
            if (active) active.focus({ preventScroll: true });
        });
        pagination.appendChild(button);
    }
    addPageButton('‹', bahanCurrentPage - 1, bahanCurrentPage === 1, false);
    const first = Math.max(1, Math.min(bahanCurrentPage - 2, pages - 4));
    for (let page = first; page <= Math.min(pages, first + 4); page++) {
        addPageButton(String(page), page, false, page === bahanCurrentPage);
    }
    addPageButton('›', bahanCurrentPage + 1, bahanCurrentPage === pages, false);
}

/* Chart dan legenda memakai angka yang sama dari Blade. */
function initBahanChart() {
    const canvas = document.getElementById('bahanDistributionChart');
    if (!canvas) return;
    const groups = Array.from(document.querySelectorAll('#bahanLegend [data-count]'));
    const labels = groups.map(function (item) { return item.dataset.label; });
    const counts = groups.map(function (item) { return Number(item.dataset.count); });
    const colors = groups.map(function (item) { return item.dataset.color; });
    const total = counts.reduce(function (sum, count) { return sum + count; }, 0);
    const wrap = canvas.parentElement;
    wrap.querySelector('.bahan-chart-center strong').textContent = bahanNumber.format(total);
    if (bahanChart) { bahanChart.destroy(); bahanChart = null; }
    // Diagram tetap muncul jika CDN Chart.js gagal dimuat.
    if (typeof window.Chart !== 'function') {
        let angle = 0;
        const segments = counts.map(function (count, index) {
            const start = angle;
            angle += total ? count / total * 360 : 0;
            return `${colors[index]} ${start}deg ${angle}deg`;
        });
        canvas.hidden = true;
        wrap.classList.add('bahan-chart-fallback');
        wrap.style.background = total ? `conic-gradient(${segments.join(',')})` : '#e7ecf2';
        return;
    }
    canvas.hidden = false;
    wrap.classList.remove('bahan-chart-fallback');
    wrap.style.background = '';
    bahanChart = new window.Chart(canvas, {
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
                    return `${context.label}: ${bahanNumber.format(context.raw)} data`;
                } } }
            }
        }
    });
}

/* Dialog native mendukung Escape dan fokus keyboard. */
function openBahanModal(mode = 'add', row = null) {
    const modal = document.getElementById('bahanModal');
    if (!modal || modal.open) return;
    const titles = { add: 'Tambah Bahan', view: 'Detail Bahan', edit: 'Edit Bahan', delete: 'Hapus Bahan' };
    const descriptions = {
        add: 'Tambahkan data master bahan baru.', view: 'Informasi data master bahan.',
        edit: 'Perbarui informasi data master bahan.', delete: 'Periksa bahan yang akan dihapus.'
    };
    const readonly = mode === 'view' || mode === 'delete';
    document.getElementById('bahanForm').reset();
    document.getElementById('bahanModalTitle').textContent = titles[mode] || titles.add;
    document.getElementById('bahanModalDescription').textContent = descriptions[mode] || descriptions.add;
    const name = document.getElementById('bahanName');
    const code = document.getElementById('bahanCode');
    name.value = row ? row.cells[2].textContent.trim() : '';
    code.value = row ? row.cells[1].textContent.trim() : '';
    name.readOnly = readonly;
    code.readOnly = readonly;
    const formkategori = document.getElementById('bahanFormKategori');
    formkategori.value = row ? row.dataset.kategori : '';
    formkategori.disabled = readonly;
    const unit = document.getElementById('bahanUnit');
    unit.value = row ? row.cells[4].textContent.trim() : '';
    unit.disabled = readonly;
    const formdepartemen = document.getElementById('bahanFormDepartemen');
    formdepartemen.value = row ? row.dataset.departemen : '';
    formdepartemen.disabled = readonly;
    const stock = document.getElementById('bahanStock');
    stock.value = row ? row.dataset.stok : '0';
    stock.readOnly = readonly;
    const status = document.getElementById('bahanStatus');
    status.value = row ? row.cells[7].textContent.trim() : 'Aktif';
    status.disabled = readonly;
    const save = document.getElementById('bahanSaveButton');
    save.hidden = mode === 'view';
    save.disabled = true;
    save.textContent = mode === 'delete' ? 'Hapus Bahan' : 'Simpan Bahan';
    save.classList.toggle('bahan-delete-button', mode === 'delete');
    document.getElementById('bahanModalNote').textContent = mode === 'view'
        ? 'Data contoh untuk pratinjau tampilan.'
        : mode === 'delete' ? 'Pratinjau konfirmasi. Penghapusan ke database belum dihubungkan.'
        : 'Pratinjau formulir. Penyimpanan ke database belum dihubungkan.';
    bahanPreviousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    if (!readonly) name.focus();
}

function closeBahanModal() {
    const modal = document.getElementById('bahanModal');
    if (modal && modal.open) modal.close();
}

/* Ekspor seluruh hasil filter, termasuk halaman lain; tanpa kolom Aksi. */
function exportBahanCSV() {
    const records = [["No", "Kode Bahan", "Nama Bahan", "Kategori", "Satuan", "Departemen", "Stok", "Status"]];
    getFilteredBahanRows().forEach(function (row, index) {
        records.push([index + 1, row.cells[1].textContent.trim(), row.cells[2].textContent.trim(), row.cells[3].textContent.trim(), row.cells[4].textContent.trim(), row.cells[5].textContent.trim(), row.dataset.stok, row.cells[7].textContent.trim()]);
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
    link.download = 'data-bahan.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}