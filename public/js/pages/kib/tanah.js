/** K.I.B Tanah - terhubung dengan routes dan skema app.sql asli. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const root = document.getElementById('tanahPage');
  if (!root) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const BASE = root.dataset.recordBaseUrl || '/kib/tanah';
  const LOC = root.dataset.locationBaseUrl || `${BASE}/lokasi`;
  const PENDING = root.dataset.pendingUrl || '/kib/pending/tanah';
  const idLocale = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const money = value => 'Rp ' + idLocale.format(Number(value) || 0);
  const num = value => new Intl.NumberFormat('id-ID', {maximumFractionDigits:2}).format(Number(value) || 0);
  const dateText = value => {
    if (!value || value === '-') return '-';
    const a = String(value).slice(0, 10).split('-');
    return a.length === 3 ? `${a[2]}/${a[1]}/${a[0]}` : String(value);
  };
  const inputDate = value => /^\d{4}-\d\d-\d\d/.test(String(value || '')) ? String(value).slice(0,10) : '';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = () => window.lucide?.createIcons?.();
  const dialog = id => document.getElementById(id);
  const open = id => { const d = dialog(id); if (d && !d.open) d.showModal(); icons(); };
  const close = id => { const d = dialog(id); if (d?.open) d.close(); };
  let toastTimer;
  function notify(message, error = false) {
    const t = $('#tanahToast');
    if (!t) return;
    clearTimeout(toastTimer);
    $('#tanahToastMessage').textContent = message;
    t.hidden = false; t.classList.toggle('is-error', error);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4300);
  }
  async function json(url) {
    const response = await fetch(url, { headers: { Accept:'application/json' }, credentials:'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.success === false) throw new Error(data.message || 'Permintaan gagal');
    return data;
  }
  const fail = (e, message) => { console.error(message, e); notify(`${message} (${e.message || 'periksa Laravel log'})`, true); };

  /* ---- Global dialogs: close buttons, backdrop and Escape ---- */
  $$('[data-close-dialog]').forEach(b => b.addEventListener('click', () => close(b.dataset.closeDialog)));
  $$('dialog', root).forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  /* ---- Filter, paginate main location table ---- */
  const mainRows = $$('.tanah-data-row', root);
  const search = $('#tanahSearch'), limit = $('#tanahPerPage');
  let pageNum = 1;
  const matching = () => {
    const k = (search?.value || '').trim().toLocaleLowerCase('id-ID');
    return mainRows.filter(r => (r.dataset.search || '').toLocaleLowerCase('id-ID').includes(k));
  };
  function paginate() {
    const records = matching(), per = Math.max(1, Number(limit?.value || 20));
    const pages = Math.max(1, Math.ceil(records.length/per));
    pageNum = Math.min(Math.max(1, pageNum), pages);
    mainRows.forEach(r => r.hidden = true);
    const start = (pageNum-1)*per;
    records.slice(start,start+per).forEach((r,i) => {
      r.hidden = false;
      const n = $('.tanah-row-number',r);
      if (n) n.textContent = start+i+1;
    });
    const info = $('#tanahTableInfo');
    if (info) info.textContent = records.length
      ? `Menampilkan ${idLocale.format(start+1)}–${idLocale.format(Math.min(start+per,records.length))} dari ${idLocale.format(records.length)} lokasi`
      : 'Tidak ada lokasi yang sesuai';
    const nav = $('#tanahPagination');
    if (!nav) return;
    nav.replaceChildren();
    if (pages < 2) return;
    function button(text,target,disabled=false) {
      const el = document.createElement('button');
      el.type='button';el.className='tanah-page-button';el.textContent=text;
      el.disabled=disabled;el.classList.toggle('active',target===pageNum && /^\d+$/.test(text));
      el.addEventListener('click',()=>{pageNum=target;paginate();});nav.append(el);
    }
    button('‹',pageNum-1,pageNum===1);
    const from=Math.max(1,pageNum-2),to=Math.min(pages,pageNum+2);
    if(from>1)button('1',1);
    for(let p=from;p<=to;p++)button(String(p),p);
    if(to<pages)button(String(pages),pages);
    button('›',pageNum+1,pageNum===pages);
  }
  search?.addEventListener('input',()=>{pageNum=1;paginate();});
  limit?.addEventListener('change',()=>{pageNum=1;paginate();});
  $('#tanahResetButton')?.addEventListener('click',()=>{search.value='';limit.value='20';pageNum=1;paginate();});
  paginate();
  $('#tanahExportButton')?.addEventListener('click',()=>{
    const rows=matching();if(!rows.length){notify('Belum ada data untuk diekspor.',true);return;}
    const csv=[['No','Lokasi','Alamat','Penggunaan','Nilai']];
    rows.forEach((r,i)=>{const t=$$('td',r);csv.push([i+1,t[1]?.innerText?.trim(),t[2]?.innerText?.trim(),t[3]?.innerText?.trim(),t[4]?.innerText?.trim()]);});
    const content='\uFEFF'+csv.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const u=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=u;a.download='kib-tanah.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),100);
  });

  /* ---- Form source transactions from existing KibNotificationController ---- */
  let pending=[];
  const form=$('#tanahForm'), method=$('#tanahFormMethod');
  const sourceBody=$('#tanahSourceBody');
  const setField=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value??'';};
  function showSource(source) {
    setField('tanahNilaiAktivaId',source.id);
    setField('tanahLokasiId',source.id_lokasi);
    setField('tanahLokasiName',source.lokasi);
    setField('tanahAlamat',source.alamat);
    setField('tanahTahun',source.tahun);
    $('#tanahSelectedSource').hidden=false;
    $('#tanahSelectedTitle').textContent=`${source.lokasi||'-'} · ${source.no_voucher||'-'}`;
    $('#tanahSelectedMeta').textContent=`${source.departemen||'-'} / ${source.divisi||'-'} · ${money(source.nilai)}`;
    $('#tanahSourceSection').hidden=true;
  }
  function resetForm() {
    form?.reset();
    form.action=BASE;
    method.value='';method.disabled=true;setField('tanahEditingId','');
    $('#tanahFormTitle').textContent='Tambah Data Tanah';
    ['tanahNilaiAktivaId','tanahLokasiId','tanahLokasiName','tanahAlamat'].forEach(id=>setField(id,''));
    $('#tanahSelectedSource').hidden=true;
    $('#tanahSourceSection').hidden=false;
    $('#tanahFileSelected').hidden=true;
    $('#tanahPreviewSelectedPdf').hidden=true;
  }
  function filteredPending() {
    const q=($('#tanahSourceSearch')?.value||'').trim().toLowerCase();
    return pending.filter(p=>[p.no_voucher,p.lokasi,p.alamat,p.departemen,p.divisi,p.tahun,p.urai,p.nilai].join(' ').toLowerCase().includes(q));
  }
  function renderPending() {
    if (!sourceBody) return;
    sourceBody.replaceChildren();
    const data=filteredPending();
    $('#tanahSourceTotal').textContent=`${idLocale.format(data.length)} data`;
    if (!data.length) { sourceBody.innerHTML='<tr><td colspan="9" class="tanah-source-empty">Tidak ada transaksi yang sesuai.</td></tr>';return; }
    data.forEach((r,i)=>{
      const tr=document.createElement('tr'), allowed=Number(r.jenisn)===1;
      tr.innerHTML=`<td>${i+1}</td><td><strong>${escape(r.no_voucher||'-')}</strong><small>${dateText(r.tgl_voucher)}</small></td>
      <td><strong>${escape(r.lokasi||'-')}</strong><small>${escape(r.alamat||'-')}</small></td>
      <td>${escape(r.departemen||'-')}</td><td>${escape(r.divisi||'-')}</td><td>${escape(r.tahun||'-')}</td>
      <td><strong>${money(r.nilai)}</strong></td><td>${escape(r.urai||'-')}</td>
      <td>${allowed?'<button type="button" class="tanah-source-select">Pilih</button>':'<span class="tanah-source-review">Penambahan Nilai</span>'}</td>`;
      if(allowed)$('.tanah-source-select',tr)?.addEventListener('click',()=>showSource(r));
      sourceBody.append(tr);
    });
  }
  $('#tanahSourceSearch')?.addEventListener('input',renderPending);
  async function loadPending() {
    try {
      const data=await json(PENDING);
      pending=Array.isArray(data.data)?data.data:[];
      const total=Number(data.count??pending.length),newCount=Number(data.aset_baru??pending.filter(p=>Number(p.jenisn)===1).length),more=Number(data.penambahan_nilai??pending.filter(p=>Number(p.jenisn)===2).length);
      $('#tanahIncomingCount').textContent=total>99?'99+':idLocale.format(total);
      $('#tanahIncomingNew').textContent=idLocale.format(newCount);
      $('#tanahIncomingValue').textContent=idLocale.format(more);
      $('#tanahIncomingText').textContent=total?`Ada ${idLocale.format(total)} transaksi Nilai Aset kategori Tanah yang menunggu ditinjau.`:'Tidak ada transaksi Tanah yang menunggu diproses.';
      $('#tanahIncomingCard').classList.toggle('is-empty',total===0);
      // Do not disable Create when no pending; user can see empty state.
    } catch(e) {
      console.error('Pending tanah',e);
      $('#tanahIncomingText').textContent='Notifikasi belum bisa dimuat. Periksa koneksi dan log Laravel.';
      pending=[];
    }
    renderPending();
  }
  $('#btnTambah')?.addEventListener('click',()=>{resetForm();open('tanahFormModal');});
  $('#tanahAddButton')?.addEventListener('click',()=>{resetForm();open('tanahFormModal');});
  $('#tanahIncomingButton')?.addEventListener('click',()=>{resetForm();open('tanahFormModal');});
  $('#tanahChangeSourceButton')?.addEventListener('click',()=>{$('#tanahSourceSection').hidden=false;$('#tanahSourceSearch')?.focus();});
  window.addEventListener('kib:source-selected',e=>{
    if(!e.detail)return;
    resetForm();open('tanahFormModal');
    if(Number(e.detail.jenisn)===2){notify('Penambahan Nilai perlu ditinjau melalui riwayat Nilai, bukan membuat sertifikat baru.',true);return;}
    showSource(e.detail);
  });
  function selectValue(id,value){const el=$(id);if(!el)return;const v=String(value??'');if(el.tagName==='SELECT'&&v&&!Array.from(el.options).some(o=>o.value===v)){el.add(new Option(v,v));}el.value=v;}
  function fillEdit(data) {
    resetForm();
    form.action=`${BASE}/${encodeURIComponent(data.id)}`;
    method.value='PUT';method.disabled=false;setField('tanahEditingId',data.id);
    $('#tanahFormTitle').textContent='Edit Sertifikat Tanah';
    $('#tanahSourceSection').hidden=true;
    $('#tanahSelectedSource').hidden=false;
    $('#tanahSelectedTitle').textContent=`${data.lokasi||'-'} · ${data.sertifikat||'-'}`;
    $('#tanahSelectedMeta').textContent=`Tahun ${data.tahun||'-'} · ID sertifikat ${data.id}`;
    const fields={tanahNilaiAktivaId:data.nilai_aktiva_id,tanahLokasiId:data.id_lokasi,tanahLokasiName:data.lokasi,tanahAlamat:data.alamat,
      tanahBarang:data.id_barang,tanahTahun:data.tahun,tanahGuna:data.guna,tanahNoTunjuk:data.no_tunjuk,tanahTglTunjuk:inputDate(data.tgl_tunjuk),
      tanahLuasTunjuk:data.luas_tunjuk,tanahSertifikat:data.sertifikat,tanahTglSertifikat:inputDate(data.tgl_sertifikat),
      tanahLuasSertifikat:data.luas_sertifikat,tanahNoGambar:data.no_gambar,tanahTglGambar:inputDate(data.tgl_gambar),
      tanahLuasGambar:data.luas_gambar,tanahAsal:data.asal,tanahHak:data.hak,tanahPemilik:data.pemilik,tanahKeterangan:data.ket};
    for(const [id,v] of Object.entries(fields))selectValue('#'+id,(v==='-'?'':v));
  }
  form?.addEventListener('submit',e=>{
    if (method.disabled && !$('#tanahNilaiAktivaId')?.value) {e.preventDefault();notify('Pilih sumber transaksi Nilai Aset terlebih dahulu.',true);return;}
    if (!$('#tanahLokasiId')?.value) {e.preventDefault();notify('Lokasi Tanah belum tersedia.',true);return;}
    if (!form.checkValidity()) {e.preventDefault();form.reportValidity();return;}
    const submit=$('button[type=submit]',form);if(submit)submit.disabled=true;
  });

  /* ---- PDF before save ---- */
  let blobUrl=null;
  $('#tanahPdfInput')?.addEventListener('change',e=>{
    const f=e.target.files?.[0];
    if(!f){$('#tanahFileSelected').hidden=true;$('#tanahPreviewSelectedPdf').hidden=true;return;}
    if((f.type!=='application/pdf' && !f.name.toLowerCase().endsWith('.pdf'))||f.size>15*1024*1024){e.target.value='';notify('Pilih file PDF maksimal 15 MB.',true);return;}
    $('#tanahFileName').textContent=f.name;$('#tanahFileSelected').hidden=false;$('#tanahPreviewSelectedPdf').hidden=false;
  });
  $('#tanahPreviewSelectedPdf')?.addEventListener('click',()=>{
    const f=$('#tanahPdfInput')?.files?.[0];if(!f)return;
    if(blobUrl)URL.revokeObjectURL(blobUrl);
    blobUrl=URL.createObjectURL(f);
    showPdf({view_url:blobUrl,download_url:blobUrl,nama:f.name},true);
  });

  /* ---- Main actions act on a LOCATION, never MIN(t.id) ---- */
  async function openLocation(loc,name) {
    $('#tanahLocationTitle').textContent=`Daftar Sertifikat • ${name||'Lokasi'}`;
    $('#tanahLocationBody').innerHTML='<tr><td colspan="8" class="tanah-empty">Memuat sertifikat...</td></tr>';
    const photo=$('#tanahLocationPhoto');if(photo){photo.hidden=true;photo.removeAttribute('src');}
    open('tanahLocationModal');
    try {
      const data=await json(`${LOC}/${encodeURIComponent(loc)}/sertifikat`);
      const rows=Array.isArray(data.data)?data.data:[];
      const body=$('#tanahLocationBody');body.replaceChildren();
      if(!rows.length){body.innerHTML='<tr><td colspan="8" class="tanah-empty">Belum ada sertifikat pada lokasi ini.</td></tr>';return;}
      rows.forEach((r,i)=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${i+1}</td><td>${escape(r.nama_barang||'-')}</td><td>${escape(r.guna||'-')}</td>
          <td>${escape(r.tahun||'-')}</td><td>${escape(r.sertifikat||'-')}</td><td>${escape(r.luas_sertifikat||'-')} m²</td>
          <td>${r.pdfs?.length?'<button type="button" class="tanah-pdf-button" data-do="pdf">PDF ('+r.pdfs.length+')</button>':'<span class="tanah-pdf-empty">Belum ada</span>'}</td>
          <td><div class="tanah-actions"><button type="button" class="view" data-do="view" title="Detail"><i data-lucide="eye"></i></button>
          <button type="button" class="edit" data-do="edit" title="Edit"><i data-lucide="square-pen"></i></button>
          <button type="button" class="delete" data-do="delete" title="Hapus"><i data-lucide="trash-2"></i></button></div></td>`;
        tr.addEventListener('click',e=>{
          const b=e.target.closest('button[data-do]');if(!b)return;
          const action=b.dataset.do;
          if(action==='pdf')openDocuments(loc,name);
          if(action==='view')viewRecord(r.id);
          if(action==='edit')editRecord(r.id);
          if(action==='delete')askDelete(r.id,`${r.sertifikat||'-'} (${r.lokasi||name})`);
        });body.append(tr);
      });icons();
      // Retain photo location behavior from the original KIBController.
      json(`${LOC}/${encodeURIComponent(loc)}/detail`).then(detail=>{
        if(detail.lokasi?.image_url&&photo){photo.src=detail.lokasi.image_url;photo.hidden=false;photo.onerror=()=>photo.hidden=true;}
      }).catch(()=>{});
    } catch(e){fail(e,'Daftar sertifikat gagal dimuat');$('#tanahLocationBody').innerHTML='<tr><td colspan="8" class="tanah-empty">Gagal memuat sertifikat.</td></tr>';}
  }
  $('#tanahTableBody')?.addEventListener('click',e=>{
    const row=e.target.closest('.tanah-data-row');if(!row)return;
    const loc=row.dataset.locationId;
    const name=$('.tanah-location-cell strong',row)?.textContent?.trim()||'Lokasi';
    if(e.target.closest('.js-tanah-nilai')){openNilai(loc,name);return;}
    if(e.target.closest('.js-tanah-pdf-list')){openDocuments(loc,name);return;}
    if(e.target.closest('.js-tanah-view,.js-tanah-edit,.js-tanah-delete'))openLocation(loc,name);
  });

  /* ---- Clicked Nilai: use EXISTING KIBController detailNilaiTanahLokasi ---- */
  async function openNilai(loc,name) {
    $('#tanahNilaiTitle').textContent=`Riwayat Nilai • ${name}`;
    $('#tanahNilaiTotal').textContent='Memuat...';
    $('#tanahNilaiBody').innerHTML='<tr><td colspan="7" class="tanah-empty">Memuat transaksi...</td></tr>';
    open('tanahNilaiModal');
    try {
      const data=await json(`${LOC}/${encodeURIComponent(loc)}/nilai`);
      const rows=Array.isArray(data.data)?data.data:[];
      $('#tanahNilaiTotal').textContent=money(data.total);
      const body=$('#tanahNilaiBody');body.replaceChildren();
      if(!rows.length){body.innerHTML='<tr><td colspan="7" class="tanah-empty">Belum ada transaksi Nilai Aset.</td></tr>';return;}
      rows.forEach((r,i)=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${i+1}</td><td>${escape(r.no_voucher||'-')}</td><td>${dateText(r.tgl_voucher)}</td><td>${escape(r.tahun||'-')}</td>
          <td>${escape(r.nama_aktiva||r.aktiva||'-')}</td><td class="tanah-text-wrap">${escape(r.urai||'-')}</td><td class="tanah-value-cell">${money(r.nilai)}</td>`;
        body.append(tr);
      });
    } catch(e){fail(e,'Riwayat nilai gagal dimuat');$('#tanahNilaiBody').innerHTML='<tr><td colspan="7" class="tanah-empty">Gagal memuat nilai.</td></tr>';}
  }

  async function fetchRecord(id) {
    const payload=await json(`${BASE}/${encodeURIComponent(id)}`);
    return payload.data;
  }
  const detailFields={detailTanahLokasi:'lokasi',detailTanahAlamat:'alamat',detailTanahBarang:'nama_barang',detailTanahTahun:'tahun',
    detailTanahGuna:'guna',detailTanahNoTunjuk:'no_tunjuk',detailTanahTglTunjuk:'tgl_tunjuk',detailTanahLuasTunjuk:'luas_tunjuk',
    detailTanahSertifikat:'sertifikat',detailTanahTglSertifikat:'tgl_sertifikat',detailTanahLuasSertifikat:'luas_sertifikat',
    detailTanahNoGambar:'no_gambar',detailTanahTglGambar:'tgl_gambar',detailTanahLuasGambar:'luas_gambar',
    detailTanahAsal:'asal',detailTanahHak:'hak',detailTanahPemilik:'pemilik',detailTanahKeterangan:'ket'};
  async function viewRecord(id) {
    try {
      const r=await fetchRecord(id);
      for(const [key,field] of Object.entries(detailFields)){
        const el=document.getElementById(key);if(!el)continue;
        let v=r[field];if(field.startsWith('tgl_'))v=dateText(v);
        if(field.startsWith('luas_')&&v&&v!=='-')v=`${v} m²`;
        el.textContent=v??'-';
      }
      $('#detailTanahNilai').textContent=r.nilai!=null?money(r.nilai):'Lihat rincian Nilai per lokasi';
      const detailPdf=$('#tanahDetailPdfButton');
      detailPdf.hidden=!(r.pdfs && r.pdfs.length);
      detailPdf.onclick=()=>{close('tanahDetailModal');openDocuments(r.id_lokasi,r.lokasi||'Tanah');};
      close('tanahLocationModal');open('tanahDetailModal');
    }catch(e){fail(e,'Detail sertifikat gagal dimuat');}
  }
  async function editRecord(id) {
    try { const r=await fetchRecord(id);close('tanahLocationModal');fillEdit(r);open('tanahFormModal'); }
    catch(e){fail(e,'Sertifikat gagal dimuat untuk diedit');}
  }
  function askDelete(id,name) {
    if(!id)return notify('ID sertifikat belum tersedia.',true);
    $('#tanahDeleteForm').action=`${BASE}/${encodeURIComponent(id)}`;
    $('#tanahDeleteName').textContent=name||`Sertifikat #${id}`;
    close('tanahLocationModal');open('tanahDeleteModal');
  }

  /* ---- PDFs: existing table pdfs -> authorized Laravel endpoints ---- */
  async function openDocuments(loc,name) {
    $('#tanahDocumentsTitle').textContent=`Dokumen • ${name}`;
    $('#tanahDocumentsBody').innerHTML='<tr><td colspan="5" class="tanah-empty">Memuat dokumen PDF...</td></tr>';
    open('tanahDocumentsModal');
    try {
      const payload=await json(`${LOC}/${encodeURIComponent(loc)}/pdf`);
      const rows=Array.isArray(payload.data)?payload.data:[];
      const body=$('#tanahDocumentsBody');body.replaceChildren();
      if(!rows.length){body.innerHTML='<tr><td colspan="5" class="tanah-empty">Belum ada PDF untuk lokasi ini.</td></tr>';return;}
      rows.forEach((r,i)=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${i+1}</td><td>${escape(r.sertifikat||'-')}</td><td>${escape(r.tahun||'-')}</td><td>${escape(r.nama||'Dokumen PDF')}</td>
          <td><div class="tanah-actions"><button type="button" class="view" data-do="preview" title="Preview PDF"><i data-lucide="eye"></i></button>
          <a class="tanah-pdf-button" href="${escape(r.download_url)}" download title="Unduh PDF"><i data-lucide="download"></i> Download</a></div></td>`;
        $('button',tr).addEventListener('click',()=>showPdf(r));body.append(tr);
      });icons();
    }catch(e){fail(e,'Dokumen PDF gagal dimuat');$('#tanahDocumentsBody').innerHTML='<tr><td colspan="5" class="tanah-empty">Gagal mengambil dokumen.</td></tr>';}
  }
  function showPdf(pdf,temporary=false){
    if(!pdf?.view_url)return notify('Lokasi file PDF tidak tersedia.',true);
    $('#tanahPdfTitle').textContent=pdf.nama||'Dokumen Tanah';
    $('#tanahPdfFrame').src=pdf.view_url;
    const link=$('#tanahPdfDownload');link.href=pdf.download_url||pdf.view_url;
    link.download=temporary?(pdf.nama||'Dokumen.pdf'):'';
    open('tanahPdfModal');
  }
  function clearPdfFrame(){const frame=$('#tanahPdfFrame');if(frame)frame.removeAttribute('src');if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}}
  $('#tanahPdfClose')?.addEventListener('click',()=>close('tanahPdfModal'));
  dialog('tanahPdfModal')?.addEventListener('close',clearPdfFrame);

  // Laravel redirects back with validation errors; retain visible form and old inputs.
  if(root.dataset.hasErrors==='1'){
    resetForm();
    try {
      const old=JSON.parse($('#tanahOldInput')?.textContent||'{}');
      const map={tanahNilaiAktivaId:'id_nilai_aktiva',tanahLokasiId:'id_lokasi',tanahBarang:'id_barang',tanahTahun:'tahun',
        tanahGuna:'guna',tanahNoTunjuk:'no_tunjuk',tanahTglTunjuk:'tgl_tunjuk',tanahLuasTunjuk:'luas_tunjuk',
        tanahSertifikat:'sertifikat',tanahTglSertifikat:'tgl_sertifikat',tanahLuasSertifikat:'luas_sertifikat',
        tanahNoGambar:'no_gambar',tanahTglGambar:'tgl_gambar',tanahLuasGambar:'luas_gambar',tanahAsal:'asal',
        tanahHak:'hak',tanahPemilik:'pemilik',tanahKeterangan:'ket'};
      for(const [id,key] of Object.entries(map))selectValue('#'+id,old[key]??'');
      if(old.tanah_id && old._method==='PUT'){
        method.value='PUT';method.disabled=false;form.action=`${BASE}/${encodeURIComponent(old.tanah_id)}`;
        setField('tanahEditingId',old.tanah_id);$('#tanahSourceSection').hidden=true;
        $('#tanahFormTitle').textContent='Edit Sertifikat Tanah';
      }
      if(old.id_nilai_aktiva){
        $('#tanahSelectedSource').hidden=false;
        $('#tanahSelectedTitle').textContent=`Transaksi Nilai Aset #${old.id_nilai_aktiva}`;
        $('#tanahSelectedMeta').textContent='Lengkapi kembali data yang diperlukan.';
      }
    } catch(e){console.error('Pemulihan validasi Tanah',e);}
    open('tanahFormModal');notify('Periksa validasi isian yang ditandai Laravel.',true);
  }
  loadPending();icons();
});