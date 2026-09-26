/* Master Kode Aktiva: khusus halaman Kode Aktiva, tidak mengubah layout global. */
let aktivaCurrentPage = 1;
let aktivaChart = null;
let aktivaPreviousOverflow = '';
const aktivaNumber = new Intl.NumberFormat('id-ID');

document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.aktiva-page')) return;
    updateAktivaDate();
    window.setInterval(updateAktivaDate, 1000);
    initAktivaChart();
    syncAktivaJenisOptions('aktivaGolongan', 'aktivaJenis');
    filterAktivaTable();
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('aktivaSearch').addEventListener('input', filterAktivaTable);
    document.getElementById('aktivaGolongan').addEventListener('change', function () {
        syncAktivaJenisOptions('aktivaGolongan', 'aktivaJenis');
        filterAktivaTable();
    });
    document.getElementById('aktivaJenis').addEventListener('change', filterAktivaTable);
    document.getElementById('aktivaFormGolongan').addEventListener('change', function () {
        syncAktivaJenisOptions('aktivaFormGolongan', 'aktivaFormJenis');
    });
    document.getElementById('aktivaPageSize').addEventListener('change', filterAktivaTable);
    document.getElementById('aktivaTable').addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');
        if (button) openAktivaModal(button.dataset.action, button.closest('tr'));
    });
    document.getElementById('aktivaViewAll').addEventListener('click', function (event) {
        event.preventDefault();
        resetAktivaFilter();
        document.getElementById('aktivaList').scrollIntoView({ block: 'start' });
        document.getElementById('aktivaSearch').focus({ preventScroll: true });
    });
    const modal = document.getElementById('aktivaModal');
    modal.addEventListener('click', function (event) {
        const box = modal.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right
            || event.clientY < box.top || event.clientY > box.bottom;
        if (event.target === modal && outside) closeAktivaModal();
    });
    modal.addEventListener('close', function () {
        document.body.style.overflow = aktivaPreviousOverflow;
    });
    // Belum ada endpoint CRUD pada proyek. Form tidak mengirim data semu.
    document.getElementById('aktivaForm').addEventListener('submit', function (event) {
        event.preventDefault();
    });
});

/* WITA, walaupun komputer pengguna berada di zona waktu lain. */
function updateAktivaDate() {
    const date = document.getElementById('aktivaCurrentDate');
    const time = document.getElementById('aktivaCurrentTime');
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
function getAktivaRows() {
    return Array.from(document.querySelectorAll('#aktivaTable tbody tr[data-record]'));
}

function getFilteredAktivaRows() {
    const search = document.getElementById('aktivaSearch').value.trim().toLocaleLowerCase('id-ID');
    const golongan = document.getElementById('aktivaGolongan').value;
    const jenis = document.getElementById('aktivaJenis').value;
    return getAktivaRows().filter(function (row) {
        const searchable = [row.cells[1].textContent, row.cells[2].textContent, row.cells[5].textContent].join(' ').toLocaleLowerCase('id-ID');
        return (!search || searchable.includes(search))
            && (!golongan || row.dataset.golongan === golongan)
            && (!jenis || row.dataset.jenis === jenis);
    });
}

function filterAktivaTable() {
    aktivaCurrentPage = 1;
    renderAktivaTable();
}

function resetAktivaFilter() {
    document.getElementById('aktivaSearch').value = '';
    document.getElementById('aktivaGolongan').value = '';
    document.getElementById('aktivaJenis').value = '';
    syncAktivaJenisOptions('aktivaGolongan', 'aktivaJenis');
    filterAktivaTable();
}

function renderAktivaTable() {
    const allRows = getAktivaRows();
    const filtered = getFilteredAktivaRows();
    const size = Number(document.getElementById('aktivaPageSize').value) || 10;
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    aktivaCurrentPage = Math.min(Math.max(1, aktivaCurrentPage), pages);
    const start = (aktivaCurrentPage - 1) * size;
    allRows.forEach(function (row) { row.hidden = true; });
    filtered.slice(start, start + size).forEach(function (row, index) {
        row.hidden = false;
        row.cells[0].textContent = start + index + 1;
    });
    document.getElementById('aktivaEmptyRow').hidden = filtered.length > 0;
    const from = filtered.length ? start + 1 : 0;
    const to = Math.min(start + size, filtered.length);
    let info = `Menampilkan ${from}–${to} dari ${aktivaNumber.format(filtered.length)} data contoh`;
    if (filtered.length !== allRows.length) info += ` (total ${aktivaNumber.format(allRows.length)})`;
    document.getElementById('aktivaTableInfo').textContent = info;
    const pagination = document.getElementById('aktivaPagination');
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
            aktivaCurrentPage = page;
            renderAktivaTable();
            const active = pagination.querySelector('[aria-current="page"]');
            if (active) active.focus({ preventScroll: true });
        });
        pagination.appendChild(button);
    }
    addPageButton('‹', aktivaCurrentPage - 1, aktivaCurrentPage === 1, false);
    const first = Math.max(1, Math.min(aktivaCurrentPage - 2, pages - 4));
    for (let page = first; page <= Math.min(pages, first + 4); page++) {
        addPageButton(String(page), page, false, page === aktivaCurrentPage);
    }
    addPageButton('›', aktivaCurrentPage + 1, aktivaCurrentPage === pages, false);
}

/* Chart dan legenda memakai angka yang sama dari Blade. */
function initAktivaChart() {
    const canvas = document.getElementById('aktivaDistributionChart');
    if (!canvas) return;
    const groups = Array.from(document.querySelectorAll('#aktivaLegend [data-count]'));
    const labels = groups.map(function (item) { return item.dataset.label; });
    const counts = groups.map(function (item) { return Number(item.dataset.count); });
    const colors = groups.map(function (item) { return item.dataset.color; });
    const total = counts.reduce(function (sum, count) { return sum + count; }, 0);
    const wrap = canvas.parentElement;
    wrap.querySelector('.aktiva-chart-center strong').textContent = aktivaNumber.format(total);
    if (aktivaChart) { aktivaChart.destroy(); aktivaChart = null; }
    // Diagram tetap muncul jika CDN Chart.js gagal dimuat.
    if (typeof window.Chart !== 'function') {
        let angle = 0;
        const segments = counts.map(function (count, index) {
            const start = angle;
            angle += total ? count / total * 360 : 0;
            return `${colors[index]} ${start}deg ${angle}deg`;
        });
        canvas.hidden = true;
        wrap.classList.add('aktiva-chart-fallback');
        wrap.style.background = total ? `conic-gradient(${segments.join(',')})` : '#e7ecf2';
        return;
    }
    canvas.hidden = false;
    wrap.classList.remove('aktiva-chart-fallback');
    wrap.style.background = '';
    aktivaChart = new window.Chart(canvas, {
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
                    return `${context.label}: ${aktivaNumber.format(context.raw)} data`;
                } } }
            }
        }
    });
}

/* Dialog native mendukung Escape dan fokus keyboard. */
function openAktivaModal(mode = 'add', row = null) {
    const modal = document.getElementById('aktivaModal');
    if (!modal || modal.open) return;
    const titles = { add: 'Tambah Kode Aktiva', view: 'Detail Kode Aktiva', edit: 'Edit Kode Aktiva', delete: 'Hapus Kode Aktiva' };
    const descriptions = {
        add: 'Tambahkan data master aktiva baru.', view: 'Informasi data master aktiva.',
        edit: 'Perbarui informasi data master aktiva.', delete: 'Periksa aktiva yang akan dihapus.'
    };
    const readonly = mode === 'view' || mode === 'delete';
    document.getElementById('aktivaForm').reset();
    document.getElementById('aktivaModalTitle').textContent = titles[mode] || titles.add;
    document.getElementById('aktivaModalDescription').textContent = descriptions[mode] || descriptions.add;
    const name = document.getElementById('aktivaName');
    const code = document.getElementById('aktivaCode');
    name.value = row ? row.cells[2].textContent.trim() : '';
    code.value = row ? row.cells[1].textContent.trim() : '';
    name.readOnly = readonly;
    code.readOnly = readonly;
    const formgolongan = document.getElementById('aktivaFormGolongan');
    formgolongan.value = row ? row.dataset.golongan : '';
    formgolongan.disabled = readonly;
    syncAktivaJenisOptions('aktivaFormGolongan', 'aktivaFormJenis');
    const formjenis = document.getElementById('aktivaFormJenis');
    formjenis.value = row ? row.dataset.jenis : '';
    formjenis.disabled = readonly;
    const description = document.getElementById('aktivaDescription');
    description.value = row ? row.cells[5].textContent.trim() : '';
    description.readOnly = readonly;
    const status = document.getElementById('aktivaStatus');
    status.value = row ? row.cells[6].textContent.trim() : 'Aktif';
    status.disabled = readonly;
    const save = document.getElementById('aktivaSaveButton');
    save.hidden = mode === 'view';
    save.disabled = true;
    save.textContent = mode === 'delete' ? 'Hapus Kode Aktiva' : 'Simpan Kode Aktiva';
    save.classList.toggle('aktiva-delete-button', mode === 'delete');
    document.getElementById('aktivaModalNote').textContent = mode === 'view'
        ? 'Data contoh untuk pratinjau tampilan.'
        : mode === 'delete' ? 'Pratinjau konfirmasi. Penghapusan ke database belum dihubungkan.'
        : 'Pratinjau formulir. Penyimpanan ke database belum dihubungkan.';
    aktivaPreviousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    if (!readonly) name.focus();
}

function closeAktivaModal() {
    const modal = document.getElementById('aktivaModal');
    if (modal && modal.open) modal.close();
}

/* Ekspor seluruh hasil filter. Apostrof menjaga kode 01/02.01 sebagai teks di spreadsheet. */
function exportAktivaCSV() {
    const records = [["No", "Kode Aktiva", "Nama Aktiva", "Golongan Aktiva", "Jenis Aktiva", "Keterangan", "Status"]];
    getFilteredAktivaRows().forEach(function (row, index) {
        records.push([index + 1, "'" + row.cells[1].textContent.trim(), row.cells[2].textContent.trim(), row.cells[3].textContent.trim(), row.cells[4].textContent.trim(), row.cells[5].textContent.trim(), row.cells[6].textContent.trim()]);
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
    link.download = 'data-kode-aktiva.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

/* Nilai jenis unik per golongan, termasuk nama jenis yang sama. */
function syncAktivaJenisOptions(golonganId, jenisId) {
    const golongan = document.getElementById(golonganId).value;
    const select = document.getElementById(jenisId);
    Array.from(select.options).forEach(function (option) {
        const allowed = !option.value || !golongan || option.dataset.golongan === golongan;
        option.hidden = !allowed;
        option.disabled = !allowed;
    });
    if (select.selectedOptions[0] && select.selectedOptions[0].disabled) select.value = '';
}